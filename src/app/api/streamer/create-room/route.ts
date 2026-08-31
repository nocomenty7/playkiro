import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      hostNickname = '스트리머',
      hostSessionId,
      categories = ['전체'],
      totalQuestions = 10,
      usedQuestionIds = [],
      roomMode = 'pin',
      platforms = null,
    } = body;

    if (!hostSessionId) {
      return NextResponse.json({ error: 'Host session ID가 필요합니다.' }, { status: 400 });
    }

    // Auto-cleanup: Delete room_participants created more than 2 hours ago to keep DB lightweight, while keeping rooms permanently
    try {
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
      const { error: cleanError } = await supabase.from('room_participants').delete().lt('created_at', twoHoursAgo);
      if (cleanError) {
        console.warn('Background room_participants cleanup RLS warning:', cleanError.message);
      }
    } catch (cleanErr) {
      console.warn('Background cleanup warning:', cleanErr);
    }

    // 1. Fetch matching questions from Supabase
    let query = supabase.from('questions').select('id, category');

    if (!categories.includes('전체') && categories.length > 0) {
      query = query.in('category', categories);
    }

    const { data: questions, error: fetchError } = await query;

    let targetPool: any[] = [];

    if (fetchError || !questions || questions.length === 0) {
      const { data: allQuestions, error: allErr } = await supabase.from('questions').select('id');
      if (allErr || !allQuestions || allQuestions.length === 0) {
        return NextResponse.json({ error: '질문 데이터를 불러올 수 없습니다.' }, { status: 400 });
      }
      targetPool = allQuestions;
    } else {
      targetPool = questions;
    }

    // Deduplication: Filter out previously played questions for this streamer
    const availablePool = targetPool.filter((q) => !usedQuestionIds.includes(q.id));

    // If no unplayed questions remain in the selected category
    if (availablePool.length === 0) {
      return NextResponse.json(
        {
          success: false,
          code: 'ALL_QUESTIONS_COMPLETED',
          error: '선택하신 카테고리 내의 모든 문제를 이미 다 풀었습니다.',
        },
        { status: 400 }
      );
    }

    // If remaining unplayed questions are fewer than requested totalQuestions
    if (availablePool.length < totalQuestions) {
      return NextResponse.json(
        {
          success: false,
          code: 'NOT_ENOUGH_UNPLAYED_QUESTIONS',
          remainingCount: availablePool.length,
          totalRequested: totalQuestions,
          error: `선택하신 카테고리의 안 푼 남은 문제(${availablePool.length}개)가 설정한 문제 수(${totalQuestions}개)보다 적습니다. 다른 카테고리를 추가하거나 문제 수를 줄여주세요.`,
        },
        { status: 400 }
      );
    }

    // True Unbiased Fisher-Yates (Knuth) Shuffle Algorithm on availablePool
    const shuffled = [...availablePool];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    const selectedQuestionIds = shuffled.slice(0, Math.min(totalQuestions, shuffled.length)).map((q) => q.id);

    // 2. Generate unique 6-digit numeric PIN
    let pin = '';
    let isUnique = false;
    let attempts = 0;

    while (!isUnique && attempts < 10) {
      attempts++;
      pin = Math.floor(100000 + Math.random() * 900000).toString();
      const { data: existing } = await supabase.from('rooms').select('id').eq('pin', pin).neq('status', 'FINISHED').maybeSingle();
      if (!existing) {
        isUnique = true;
      }
    }

    if (!isUnique) {
      return NextResponse.json({ error: 'PIN 코드 생성에 실패했습니다. 다시 시도해 주세요.' }, { status: 500 });
    }

    // 3. Insert new room into `rooms` table
    const { data: room, error: insertError } = await supabase
      .from('rooms')
      .insert([
        {
          pin,
          host_id: hostSessionId,
          host_nickname: hostNickname,
          room_mode: roomMode,
          platforms: platforms,
          categories,
          total_questions: totalQuestions, // Maintain requested goal for UI (e.g. 50), even if actual db pool is smaller
          question_ids: selectedQuestionIds,
          current_question_index: 0,
          status: 'VOTING',
        },
      ])
      .select('*')
      .single();

    if (insertError || !room) {
      console.error('Failed to create room in DB:', insertError);
      return NextResponse.json(
        {
          error: insertError
            ? `DB 방 생성 실패: ${insertError.message} (Supabase에 rooms 테이블이 생성되었는지 확인해 주세요)`
            : '방 생성 실패',
        },
        { status: 500 }
      );
    }

    // 4. Register host as first participant
    await supabase.from('room_participants').insert([
      {
        room_id: room.id,
        session_id: hostSessionId,
        nickname: `${hostNickname} (👑)`,
        score: 0,
      },
    ]);

    return NextResponse.json({
      success: true,
      pin: room.pin,
      roomId: room.id,
      totalQuestions: room.total_questions,
      selectedQuestionIds: room.question_ids,
    });
  } catch (error: any) {
    console.error('Create room API exception:', error);
    return NextResponse.json({ error: error.message || '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}

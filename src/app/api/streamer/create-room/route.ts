import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      hostNickname = '스트리머',
      hostGender = 'male',
      hostAgeGroup = '20s',
      hostSessionId,
      categories = ['전체'],
      totalQuestions = 10,
    } = body;

    if (!hostSessionId) {
      return NextResponse.json({ error: 'Host session ID가 필요합니다.' }, { status: 400 });
    }

    // 1. Fetch matching questions from Supabase
    let query = supabase.from('questions').select('id, category');

    // If '전체' is not in categories, filter by selected categories
    if (!categories.includes('전체') && categories.length > 0) {
      query = query.in('category', categories);
    }

    const { data: questions, error: fetchError } = await query;

    let targetPool: any[] = [];

    if (fetchError || !questions || questions.length === 0) {
      // Fallback: get all questions if category filter yielded 0
      const { data: allQuestions, error: allErr } = await supabase.from('questions').select('id');
      if (allErr || !allQuestions || allQuestions.length === 0) {
        return NextResponse.json({ error: '질문 데이터를 불러올 수 없습니다.' }, { status: 400 });
      }
      targetPool = allQuestions;
    } else {
      targetPool = questions;
    }

    // Shuffle and slice question IDs
    const shuffled = [...targetPool].sort(() => 0.5 - Math.random());
    const selectedQuestionIds = shuffled.slice(0, Math.min(totalQuestions, shuffled.length)).map((q) => q.id);

    // 2. Generate unique 6-digit numeric PIN
    let pin = '';
    let isUnique = false;
    let attempts = 0;

    while (!isUnique && attempts < 10) {
      attempts++;
      pin = Math.floor(100000 + Math.random() * 900000).toString();
      // Use maybeSingle to prevent PGRST116 single exception when 0 rows match
      const { data: existing } = await supabase.from('rooms').select('id').eq('pin', pin).maybeSingle();
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
          host_gender: hostGender,
          host_age_group: hostAgeGroup,
          categories,
          total_questions: selectedQuestionIds.length,
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
    });
  } catch (error: any) {
    console.error('Create room API exception:', error);
    return NextResponse.json({ error: error.message || '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}

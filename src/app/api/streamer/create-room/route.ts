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
      return NextResponse.json({ error: 'Host session ID is required' }, { status: 400 });
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
      const { data: allQuestions } = await supabase.from('questions').select('id');
      if (!allQuestions || allQuestions.length === 0) {
        return NextResponse.json({ error: 'No questions available' }, { status: 400 });
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
      const { data: existing } = await supabase.from('rooms').select('id').eq('pin', pin).single();
      if (!existing) {
        isUnique = true;
      }
    }

    if (!isUnique) {
      return NextResponse.json({ error: 'Failed to generate PIN code' }, { status: 500 });
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
      return NextResponse.json({ error: 'Failed to create room' }, { status: 500 });
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
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

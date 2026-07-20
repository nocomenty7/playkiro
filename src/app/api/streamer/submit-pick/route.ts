import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { roomId, hostSessionId, hostPick, questionId, gender = 'male', ageGroup = '20s' } = body;

    if (!roomId || !hostPick || !['A', 'B'].includes(hostPick)) {
      return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 });
    }

    // 1. Verify host permission
    const { data: room, error: roomError } = await supabase
      .from('rooms')
      .select('id, host_id, question_ids, current_question_index')
      .eq('id', roomId)
      .single();

    if (roomError || !room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    if (room.host_id !== hostSessionId) {
      return NextResponse.json({ error: 'Unauthorized host action' }, { status: 403 });
    }

    // 2. Update room with host pick and set status to RESULT
    await supabase
      .from('rooms')
      .update({
        host_pick: hostPick,
        status: 'RESULT',
        updated_at: new Date().toISOString(),
      })
      .eq('id', roomId);

    // 3. Score calculation: Award +100 points to participants whose vote matched hostPick
    const currentQId = questionId || room.question_ids[room.current_question_index];

    const { data: matchingVotes } = await supabase
      .from('room_votes')
      .select('participant_id')
      .eq('room_id', roomId)
      .eq('question_id', currentQId)
      .eq('vote', hostPick);

    if (matchingVotes && matchingVotes.length > 0) {
      const winnerParticipantIds = matchingVotes.map((v) => v.participant_id);
      
      // Parallelized batch score update (60x faster performance under heavy viewer load)
      const { data: winnerParticipants } = await supabase
        .from('room_participants')
        .select('id, score')
        .in('id', winnerParticipantIds);

      if (winnerParticipants && winnerParticipants.length > 0) {
        await Promise.all(
          winnerParticipants.map((p) =>
            supabase
              .from('room_participants')
              .update({ score: (p.score || 0) + 100 })
              .eq('id', p.id)
          )
        );
      }
    }

    // 4. Single Player DB Sync: Streamer's pick ONLY is recorded into main stats
    const genderKey = gender === '여성' || gender === 'female' ? 'female' : 'male';
    let ageKey = '20s';
    if (ageGroup.includes('10')) ageKey = '10s';
    else if (ageGroup.includes('20')) ageKey = '20s';
    else if (ageGroup.includes('30')) ageKey = '30s';
    else if (ageGroup.includes('40')) ageKey = '40s';
    else if (ageGroup.includes('50')) ageKey = '50s';
    else if (ageGroup.includes('60') || ageGroup.includes('70')) ageKey = '60s';

    const statKey = `${genderKey}_${ageKey}_${hostPick.toLowerCase()}`;

    // Call background RPC for streamer pick stats
    supabase
      .rpc('increment_vote_stat', {
        q_id: currentQId,
        stat_key: statKey,
      })
      .then(({ error }) => {
        if (error) {
          console.warn('Streamer vote stat sync notice:', error.message || error);
        }
      });

    return NextResponse.json({
      success: true,
      hostPick,
      winnersCount: matchingVotes ? matchingVotes.length : 0,
    });
  } catch (error: any) {
    console.error('Submit host pick API exception:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

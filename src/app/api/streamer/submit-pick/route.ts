import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { roomId, hostSessionId, hostPick, questionId, winnerParticipantIds: clientWinners = [] } = body;

    if (!roomId || !hostPick || !['A', 'B'].includes(hostPick)) {
      return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 });
    }

    // 1. Verify host permission & Prevent double execution
    const { data: room, error: roomError } = await supabase
      .from('rooms')
      .select('id, host_id, question_ids, current_question_index, status')
      .eq('id', roomId)
      .single();

    if (roomError || !room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    if (room.host_id !== hostSessionId) {
      return NextResponse.json({ error: 'Unauthorized host action' }, { status: 403 });
    }

    if (room.status === 'RESULT') {
      return NextResponse.json({ error: 'Score already calculated for this question' }, { status: 400 });
    }

    // 2. Score calculation: Award +100 points to participants whose vote matched hostPick
    const currentQId = questionId || room.question_ids[room.current_question_index];
    let winnerParticipantIds: string[] = clientWinners || [];

    if (winnerParticipantIds.length === 0) {
      const { data: matchingVotes } = await supabase
        .from('room_votes')
        .select('participant_id')
        .eq('room_id', roomId)
        .eq('question_id', currentQId)
        .eq('vote', hostPick);

      if (matchingVotes) {
        winnerParticipantIds = matchingVotes.map((v) => v.participant_id);
      }
    }

    if (winnerParticipantIds && winnerParticipantIds.length > 0) {
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

    // 3. Update room with host pick and set status to RESULT
    await supabase
      .from('rooms')
      .update({
        host_pick: hostPick,
        status: 'RESULT',
        updated_at: new Date().toISOString(),
      })
      .eq('id', roomId);

    // 4. Multi-Player DB Sync: Streamer's pick is recorded into `multi_a` / `multi_b` stats
    const statKey = hostPick === 'A' ? 'multi_a' : 'multi_b';

    (async () => {
      try {
        await supabase.rpc('increment_vote_stat', {
          q_id: currentQId,
          stat_key: statKey,
        });

        const { data: existingRow } = await supabase
          .from('vote_stats')
          .select('stats')
          .eq('question_id', currentQId)
          .maybeSingle();

        if (existingRow) {
          const currentStats = (existingRow.stats as Record<string, number>) || {};
          const currentCount = Number(currentStats[statKey] || 0);
          const nextMultiA = statKey === 'multi_a' ? Number(currentStats['multi_a'] || 0) + 1 : Number(currentStats['multi_a'] || 0);
          const nextMultiB = statKey === 'multi_b' ? Number(currentStats['multi_b'] || 0) + 1 : Number(currentStats['multi_b'] || 0);

          const updatedStats = {
            ...currentStats,
            [statKey]: currentCount + 1,
            multi_a: nextMultiA,
            multi_b: nextMultiB,
          };

          await supabase
            .from('vote_stats')
            .update({ stats: updatedStats, updated_at: new Date().toISOString() })
            .eq('question_id', currentQId);
        }
      } catch (err) {
        console.error('Background streamer pick stat processing error:', err);
      }
    })();

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Submit pick API exception:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

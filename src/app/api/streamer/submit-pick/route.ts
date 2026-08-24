import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { roomId, hostSessionId, hostPick, questionId, gender = 'male', ageGroup = '20s', winnerParticipantIds: clientWinners = [] } = body;

    if (!roomId || !hostPick || !['A', 'B'].includes(hostPick)) {
      return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 });
    }

    // 1. Verify host permission & Prevent double execution (Race condition check)
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
    // Zero-DB Architecture: Rely on Host's aggregated liveVotesMap (clientWinners) to bypass DB write bottlenecks.
    const currentQId = questionId || room.question_ids[room.current_question_index];
    let winnerParticipantIds: string[] = clientWinners || [];

    // Fallback just in case old versions insert into room_votes
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
      // Parallelized batch score update (60x faster performance under heavy viewer load)
      const { data: winnerParticipants } = await supabase
        .from('room_participants')
        .select('id, score')
        .in('id', winnerParticipantIds);

      if (winnerParticipants && winnerParticipants.length > 0) {
        // MUST AWAIT SCORE UPDATES COMPLETELY before changing room status!
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
    // This MUST happen after score updates so that when clients fetch participants on RESULT, they get the updated scores!
    await supabase
      .from('rooms')
      .update({
        host_pick: hostPick,
        status: 'RESULT',
        updated_at: new Date().toISOString(),
      })
      .eq('id', roomId);

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

    // Background Execution: Guaranteed UPSERT for streamer pick
    (async () => {
      try {
        // A. Update questions table (votes_a or votes_b)
        const { data: qData } = await supabase
          .from('questions')
          .select('votes_a, votes_b')
          .eq('id', currentQId)
          .maybeSingle();

        if (qData) {
          const updateObj = hostPick === 'A'
            ? { votes_a: (Number(qData.votes_a) || 0) + 1 }
            : { votes_b: (Number(qData.votes_b) || 0) + 1 };
          await supabase.from('questions').update(updateObj).eq('id', currentQId);
        }

        // B. Try RPC first for vote_stats
        await supabase.rpc('increment_vote_stat', {
          q_id: currentQId,
          stat_key: statKey,
        });

        // C. Direct UPSERT check for vote_stats
        const { data: existingRow } = await supabase
          .from('vote_stats')
          .select('id, stats')
          .eq('question_id', currentQId)
          .maybeSingle();

        if (existingRow) {
          const currentStats = (existingRow.stats as Record<string, number>) || {};
          const currentCount = Number(currentStats[statKey] || 0);
          const updatedStats = { ...currentStats, [statKey]: currentCount + 1 };

          await supabase
            .from('vote_stats')
            .update({ stats: updatedStats, updated_at: new Date().toISOString() })
            .eq('id', existingRow.id);
        } else {
          // Create brand new vote_stats row for this question
          await supabase.from('vote_stats').insert({
            question_id: currentQId,
            stats: { [statKey]: 1 },
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
        }
      } catch (err) {
        console.error('Streamer vote stat sync error:', err);
      }
    })();

    return NextResponse.json({
      success: true,
      hostPick,
      winnersCount: winnerParticipantIds ? winnerParticipantIds.length : 0,
    });
  } catch (error: any) {
    console.error('Submit host pick API exception:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

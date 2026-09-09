import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { roomId, hostSessionId, hostPick, questionId, winnerParticipantIds: clientWinners = [], viewerVotesA = 0, viewerVotesB = 0 } = body;

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

    if (room.status !== 'LOCKED') {
      return NextResponse.json({ error: 'Invalid room state for submitting pick (must be LOCKED)' }, { status: 400 });
    }

    // 2. Score calculation: Award +100 points to participants whose vote matched hostPick
    const currentQId = questionId || room.question_ids[room.current_question_index];
    const winnerParticipantIds: string[] = clientWinners || [];

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

    // 4. Multi-Player DB Sync
    (async () => {
      try {
        const streamerVoteA = hostPick === 'A' ? 1 : 0;
        const streamerVoteB = hostPick === 'B' ? 1 : 0;
        
        let scaledViewerA = 0;
        let scaledViewerB = 0;
        const totalViewers = viewerVotesA + viewerVotesB;
        
        if (totalViewers > 0) {
          if (totalViewers <= 10) {
            scaledViewerA = viewerVotesA;
            scaledViewerB = viewerVotesB;
          } else {
            scaledViewerA = Math.round((viewerVotesA / totalViewers) * 10);
            scaledViewerB = 10 - scaledViewerA;
          }
        }
        
        const addA = streamerVoteA + scaledViewerA;
        const addB = streamerVoteB + scaledViewerB;

        // Use RPC to atomically upsert and bypass RLS (Security Definer)
        const { error: rpcError } = await supabase.rpc('update_multi_vote_stats', {
          q_id: currentQId,
          add_a: addA,
          add_b: addB,
        });

        if (rpcError) {
          console.error('[Supabase RPC Error] Failed to update multi vote stats:', rpcError);
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

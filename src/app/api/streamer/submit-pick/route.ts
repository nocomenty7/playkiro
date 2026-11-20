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
      .select('*')
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
    const isCustomPackRoom = Boolean(room.pack_code) || String(currentQId || '').startsWith('custom_q_');
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

      if (isCustomPackRoom && room.pack_code) {
        // Record into custom_packs.question_stats (never touches official vote_stats)
        const customList = Array.isArray(room.custom_questions) ? room.custom_questions : [];
        const matched = customList.find((q: any) => q.id === currentQId);
        const packQId = matched?.pack_question_id || currentQId;
        if (packQId) {
          const { error: packRpcErr } = await supabase.rpc('record_custom_pack_vote', {
            pack_code: room.pack_code,
            q_id: String(packQId),
            add_a: addA,
            add_b: addB,
          });
          if (packRpcErr) {
            console.warn('[Custom Pack Multi Vote] RPC warning:', packRpcErr.message);
          }
        }

        // Also increment play_count by number of players who answered this question (host + viewers)
        const playedIncrement = Math.max(1, 1 + (viewerVotesA || 0) + (viewerVotesB || 0));
        const { data: packRow } = await supabase
          .from('custom_packs')
          .select('play_count')
          .eq('code', room.pack_code)
          .maybeSingle();
        if (packRow) {
          await supabase
            .from('custom_packs')
            .update({ play_count: (packRow.play_count || 0) + playedIncrement })
            .eq('code', room.pack_code);
        }
      } else if (!isCustomPackRoom) {
        // Official questions: Use RPC to atomically upsert into global vote_stats
        const { error: rpcError } = await supabase.rpc('update_multi_vote_stats', {
          q_id: currentQId,
          add_a: addA,
          add_b: addB,
        });

        if (rpcError) {
          console.error('[Supabase RPC Error] Failed to update multi vote stats:', rpcError);
        }
      }
    } catch (err) {
      console.error('Streamer pick stat processing error:', err);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Submit pick API exception:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

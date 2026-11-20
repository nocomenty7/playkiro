import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { computeTotalVotesFromStats } from '@/lib/customPacks';

export const dynamic = 'force-dynamic';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const body = await request.json();
    const questionId = typeof body?.questionId === 'string' ? body.questionId.trim() : '';
    const option = body?.option;

    if (!code || !questionId || (option !== 'A' && option !== 'B')) {
      return NextResponse.json({ error: '잘못된 투표 요청입니다.' }, { status: 400 });
    }

    const addA = option === 'A' ? 1 : 0;
    const addB = option === 'B' ? 1 : 0;

    let latestStats: Record<string, { a: number; b: number }> | null = null;
    let latestPlayCount: number | null = null;

    // 1. Increment play_count by +1 for every played question
    const { error: playRpcError } = await supabase.rpc('increment_pack_play_count', {
      pack_code: code,
    });

    if (playRpcError) {
      const { data: row } = await supabase
        .from('custom_packs')
        .select('play_count')
        .eq('code', code)
        .maybeSingle();

      if (row) {
        const nextCount = (row.play_count || 0) + 1;
        const { error: updErr } = await supabase
          .from('custom_packs')
          .update({ play_count: nextCount })
          .eq('code', code);
        if (!updErr) {
          latestPlayCount = nextCount;
        } else {
          console.error('[Custom Pack PlayCount Fallback Error]:', updErr.message);
        }
      }
    }

    // 2. Always accumulate A/B vote stats in custom_packs.question_stats
    const { data: rpcStats, error: rpcError } = await supabase.rpc('record_custom_pack_vote', {
      pack_code: code,
      q_id: questionId,
      add_a: addA,
      add_b: addB,
    });

    if (!rpcError && rpcStats && typeof rpcStats === 'object' && Object.keys(rpcStats).length > 0) {
      latestStats = rpcStats;
    } else {
      const { data: currentPack } = await supabase
        .from('custom_packs')
        .select('question_stats')
        .eq('code', code)
        .maybeSingle();

      if (currentPack && typeof currentPack === 'object' && 'question_stats' in currentPack) {
        const prevStats = (currentPack.question_stats as Record<string, { a?: number; b?: number }>) || {};
        const prevQ = prevStats[questionId] || { a: 0, b: 0 };
        const nextStats = {
          ...prevStats,
          [questionId]: {
            a: (prevQ.a || 0) + addA,
            b: (prevQ.b || 0) + addB,
          },
        };

        const { error: statsUpdErr } = await supabase
          .from('custom_packs')
          .update({ question_stats: nextStats })
          .eq('code', code);

        if (!statsUpdErr) {
          latestStats = nextStats;
        } else {
          console.error('[Custom Pack Stats Fallback Error]:', statsUpdErr.message);
        }
      } else if (rpcError) {
        console.error('[Custom Pack Stats RPC Error]:', rpcError.message);
      }
    }

    // 3. Fetch fresh play_count / stats if RPC succeeded without returning play_count
    if (latestPlayCount === null) {
      const { data: fresh } = await supabase
        .from('custom_packs')
        .select('play_count, question_stats')
        .eq('code', code)
        .maybeSingle();
      if (fresh) {
        latestPlayCount = typeof fresh.play_count === 'number' ? fresh.play_count : null;
        if (
          !latestStats &&
          fresh.question_stats &&
          typeof fresh.question_stats === 'object' &&
          Object.keys(fresh.question_stats).length > 0
        ) {
          latestStats = fresh.question_stats;
        }
      }
    }

    const effectivePlayCount = Math.max(
      latestPlayCount || 0,
      computeTotalVotesFromStats(latestStats)
    );

    return NextResponse.json({
      success: true,
      stats: latestStats,
      playCount: effectivePlayCount,
    });
  } catch (err) {
    console.error('POST /api/packs/[code]/vote exception:', err);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}

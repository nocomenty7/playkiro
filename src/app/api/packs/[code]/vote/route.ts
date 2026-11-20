import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

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
    const countVote = body?.countVote !== false;

    if (!code || !questionId || (option !== 'A' && option !== 'B')) {
      return NextResponse.json({ error: '잘못된 투표 요청입니다.' }, { status: 400 });
    }

    const addA = option === 'A' ? 1 : 0;
    const addB = option === 'B' ? 1 : 0;

    let latestStats: Record<string, { a: number; b: number }> | null = null;
    let latestPlayCount: number | null = null;

    // 1. Always increment play_count by +1 for every played question
    const { error: playRpcError } = await supabase.rpc('increment_pack_play_count', {
      pack_code: code,
    });

    if (playRpcError) {
      // Fallback: direct read-modify-write
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

    // 2. Record A/B vote stats only on first vote per browser (prevents skewing %)
    if (countVote) {
      const { data: rpcStats, error: rpcError } = await supabase.rpc('record_custom_pack_vote', {
        pack_code: code,
        q_id: questionId,
        add_a: addA,
        add_b: addB,
      });

      if (!rpcError && rpcStats) {
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
        }
      }
    }

    // Read fresh play_count if we used RPC
    if (latestPlayCount === null) {
      const { data: fresh } = await supabase
        .from('custom_packs')
        .select('play_count, question_stats')
        .eq('code', code)
        .maybeSingle();
      if (fresh) {
        latestPlayCount = fresh.play_count ?? null;
        if (!latestStats && fresh.question_stats) {
          latestStats = fresh.question_stats;
        }
      }
    }

    return NextResponse.json({
      success: true,
      stats: latestStats,
      playCount: latestPlayCount,
    });
  } catch (err) {
    console.error('POST /api/packs/[code]/vote exception:', err);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}

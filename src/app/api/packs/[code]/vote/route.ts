import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

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

    // 1. Atomic RPC update (preferred)
    const { data: rpcStats, error: rpcError } = await supabase.rpc('record_custom_pack_vote', {
      pack_code: code,
      q_id: questionId,
      add_a: addA,
      add_b: addB,
    });

    if (!rpcError) {
      return NextResponse.json({
        success: true,
        stats: rpcStats || {},
      });
    }

    // 2. Fallback read-modify-write if RPC is not installed yet
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

      await supabase
        .from('custom_packs')
        .update({ question_stats: nextStats })
        .eq('code', code);

      return NextResponse.json({
        success: true,
        stats: nextStats,
      });
    }

    console.warn('[Custom Pack Vote] RPC unavailable and question_stats column missing:', rpcError?.message);
    return NextResponse.json({ success: true, stats: null });
  } catch (err) {
    console.error('POST /api/packs/[code]/vote exception:', err);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    if (!code) {
      return NextResponse.json({ error: '팩 코드가 필요합니다.' }, { status: 400 });
    }

    const { error: rpcError } = await supabase.rpc('increment_pack_play_count', {
      pack_code: code,
    });

    if (rpcError) {
      // Fallback if RPC wasn't created yet
      const { data: current } = await supabase
        .from('custom_packs')
        .select('play_count')
        .eq('code', code)
        .maybeSingle();
      if (current) {
        await supabase
          .from('custom_packs')
          .update({ play_count: (current.play_count || 0) + 1 })
          .eq('code', code);
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('POST /api/packs/[code]/play exception:', err);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}

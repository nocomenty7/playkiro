import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { validatePackPayload, verifyPackPassword } from '@/lib/packServer';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    if (!code) {
      return NextResponse.json({ error: '팩 코드가 필요합니다.' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('custom_packs')
      .select('*')
      .eq('code', code)
      .maybeSingle();

    if (error || !data) {
      return NextResponse.json({ error: '존재하지 않거나 삭제된 밸런스질문 팩입니다.' }, { status: 404 });
    }

    const { password_hash: _hidden, ...safePack } = data as any;
    return NextResponse.json({
      success: true,
      pack: { ...safePack, question_stats: safePack.question_stats || {} },
    });
  } catch (err) {
    console.error('GET /api/packs/[code] exception:', err);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const body = await request.json();
    const password = typeof body?.password === 'string' ? body.password.trim() : '';

    if (!password) {
      return NextResponse.json({ error: '비밀번호를 입력해 주세요.' }, { status: 400 });
    }

    const { data: existing, error: fetchErr } = await supabase
      .from('custom_packs')
      .select('id, code, password_hash')
      .eq('code', code)
      .maybeSingle();

    if (fetchErr || !existing) {
      return NextResponse.json({ error: '존재하지 않는 밸런스질문 팩입니다.' }, { status: 404 });
    }

    if (!verifyPackPassword(existing.code, password, existing.password_hash)) {
      return NextResponse.json({ error: '비밀번호가 일치하지 않습니다.' }, { status: 403 });
    }

    // If verifyOnly flag is true, just confirm password matches (used before opening edit mode)
    if (body?.verifyOnly === true) {
      return NextResponse.json({ success: true, verified: true });
    }

    const validation = validatePackPayload(body, { requirePassword: false });
    if (!validation.ok) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const { data: payload } = validation;

    const { data: updated, error: updateErr } = await supabase
      .from('custom_packs')
      .update({
        title: payload.title,
        description: payload.description,
        author_nickname: payload.author_nickname,
        category: payload.category,
        is_public: payload.is_public,
        questions: payload.questions,
        question_count: payload.questions.length,
        updated_at: new Date().toISOString(),
      })
      .eq('code', code)
      .select(
        'id, code, title, description, author_nickname, category, is_public, questions, question_count, play_count, created_at, updated_at'
      )
      .single();

    if (updateErr || !updated) {
      console.error('PATCH /api/packs/[code] update error:', updateErr);
      return NextResponse.json({ error: '팩 수정에 실패했습니다.' }, { status: 500 });
    }

    return NextResponse.json({ success: true, pack: updated });
  } catch (err) {
    console.error('PATCH /api/packs/[code] exception:', err);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const body = await request.json();
    const password = typeof body?.password === 'string' ? body.password.trim() : '';

    if (!password) {
      return NextResponse.json({ error: '비밀번호를 입력해 주세요.' }, { status: 400 });
    }

    const { data: existing, error: fetchErr } = await supabase
      .from('custom_packs')
      .select('id, code, password_hash')
      .eq('code', code)
      .maybeSingle();

    if (fetchErr || !existing) {
      return NextResponse.json({ error: '존재하지 않는 밸런스질문 팩입니다.' }, { status: 404 });
    }

    if (!verifyPackPassword(existing.code, password, existing.password_hash)) {
      return NextResponse.json({ error: '비밀번호가 일치하지 않습니다.' }, { status: 403 });
    }

    const { error: deleteErr } = await supabase.from('custom_packs').delete().eq('code', code);

    if (deleteErr) {
      console.error('DELETE /api/packs/[code] error:', deleteErr);
      return NextResponse.json({ error: '팩 삭제에 실패했습니다.' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('DELETE /api/packs/[code] exception:', err);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}

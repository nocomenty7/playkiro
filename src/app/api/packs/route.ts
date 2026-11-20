import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { generatePackCode, hashPackPassword, validatePackPayload } from '@/lib/packServer';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const sort = searchParams.get('sort') === 'popular' ? 'popular' : 'latest';
    const category = searchParams.get('category') || '전체';
    const search = (searchParams.get('q') || '').trim();
    const limit = Math.min(Math.max(Number(searchParams.get('limit') || 24), 1), 60);
    const offset = Math.max(Number(searchParams.get('offset') || 0), 0);

    let query = supabase
      .from('custom_packs')
      .select(
        'id, code, title, description, author_nickname, category, is_public, questions, question_count, play_count, created_at',
        { count: 'exact' }
      )
      .eq('is_public', true);

    if (category && category !== '전체') {
      query = query.eq('category', category);
    }

    if (search) {
      const safeSearch = search.replace(/[%_,()]/g, '');
      if (safeSearch) {
        query = query.or(`title.ilike.%${safeSearch}%,description.ilike.%${safeSearch}%,author_nickname.ilike.%${safeSearch}%`);
      }
    }

    if (sort === 'popular') {
      query = query.order('play_count', { ascending: false }).order('created_at', { ascending: false });
    } else {
      query = query.order('created_at', { ascending: false });
    }

    const { data, error, count } = await query.range(offset, offset + limit - 1);

    if (error) {
      console.error('Failed to fetch custom packs:', error);
      return NextResponse.json(
        { error: '팩 목록을 불러오지 못했습니다. (Supabase custom_packs 테이블이 생성되었는지 확인해 주세요.)' },
        { status: 500 }
      );
    }

    const packs = (data || []).map((row: any) => ({
      id: row.id,
      code: row.code,
      title: row.title,
      description: row.description,
      author_nickname: row.author_nickname,
      category: row.category,
      is_public: row.is_public,
      question_count: row.question_count,
      play_count: row.play_count,
      preview_question: Array.isArray(row.questions) && row.questions.length > 0 ? row.questions[0] : null,
      created_at: row.created_at,
    }));

    return NextResponse.json({
      success: true,
      packs,
      total: count ?? packs.length,
    });
  } catch (err: any) {
    console.error('GET /api/packs exception:', err);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validation = validatePackPayload(body, { requirePassword: true });

    if (!validation.ok) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const { data: payload, password } = validation;

    // Generate unique 6-character code
    let code = '';
    let isUnique = false;
    for (let attempt = 0; attempt < 10; attempt++) {
      const candidate = generatePackCode(6);
      const { data: existing } = await supabase
        .from('custom_packs')
        .select('id')
        .eq('code', candidate)
        .maybeSingle();

      if (!existing) {
        code = candidate;
        isUnique = true;
        break;
      }
    }

    if (!isUnique || !code) {
      return NextResponse.json({ error: '팩 코드 생성에 실패했습니다. 잠시 후 다시 시도해 주세요.' }, { status: 500 });
    }

    const passwordHash = hashPackPassword(code, password!);

    const { data: inserted, error: insertError } = await supabase
      .from('custom_packs')
      .insert([
        {
          code,
          title: payload.title,
          description: payload.description,
          author_nickname: payload.author_nickname,
          category: payload.category,
          password_hash: passwordHash,
          is_public: payload.is_public,
          questions: payload.questions,
          question_count: payload.questions.length,
          play_count: 0,
        },
      ])
      .select(
        'id, code, title, description, author_nickname, category, is_public, questions, question_count, play_count, created_at'
      )
      .single();

    if (insertError || !inserted) {
      console.error('Failed to insert custom pack:', insertError);
      return NextResponse.json(
        { error: insertError?.message || '밸런스질문 팩 저장에 실패했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      code: inserted.code,
      pack: inserted,
    });
  } catch (err: any) {
    console.error('POST /api/packs exception:', err);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}

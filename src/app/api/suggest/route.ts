import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// 간단한 메모리 기반 IP Rate Limiting (서버 재시작 시 초기화됨)
// Vercel Serverless Function 환경에서도 인스턴스가 살아있는 동안에는 동작하므로 기본적인 스팸 봇 방어에 유용함.
const rateLimitMap = new Map<string, { count: number; lastReset: number }>();
const RATE_LIMIT_MAX = 20; // 1시간당 20개의 문제까지만 제안 가능
const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1시간

export async function POST(req: Request) {
  try {
    // 클라이언트 IP 주소 추출
    const ip = req.headers.get('x-forwarded-for') ?? req.headers.get('remote-addr') ?? 'unknown';
    
    // Rate Limit 체크
    const now = Date.now();
    const limitRecord = rateLimitMap.get(ip);
    
    if (limitRecord) {
      if (now - limitRecord.lastReset > RATE_LIMIT_WINDOW) {
        rateLimitMap.set(ip, { count: 1, lastReset: now });
      } else {
        if (limitRecord.count >= RATE_LIMIT_MAX) {
          return NextResponse.json({ error: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.' }, { status: 429 });
        }
        rateLimitMap.set(ip, { count: limitRecord.count + 1, lastReset: limitRecord.lastReset });
      }
    } else {
      rateLimitMap.set(ip, { count: 1, lastReset: now });
    }

    const data = await req.json();
    const suggestions = data.suggestions; // Array of suggestions

    if (!Array.isArray(suggestions) || suggestions.length === 0) {
      return NextResponse.json({ error: '제안할 데이터가 없습니다.' }, { status: 400 });
    }

    // Insert to Supabase
    const { error } = await supabase
      .from('suggested_questions')
      .insert(
        suggestions.map((s: any) => ({
          category: s.category,
          question_text: s.question_text,
          option_a: s.option_a,
          option_b: s.option_b,
          suggested_by: s.suggested_by,
        }))
      );

    if (error) {
      console.error('Supabase Insert Error:', error);
      return NextResponse.json({ error: '데이터베이스 저장 중 오류가 발생했습니다.' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Suggest API Error:', err);
    return NextResponse.json({ error: '서버 내부 오류가 발생했습니다.' }, { status: 500 });
  }
}

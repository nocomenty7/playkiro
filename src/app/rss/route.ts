import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

function escapeXml(unsafe: string): string {
  if (!unsafe) return '';
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
      default: return c;
    }
  });
}

// 10 representative static questions as a fallback
const staticQuestions = [
  { question_no: 1, category: '극한 밸런스게임', title: '평생 두통 VS 평생 치통', option_a: '평생 두통', option_b: '평생 치통', date: '2026-07-10T00:00:00Z' },
  { question_no: 2, category: '돈', title: '로또 10억 일시불 VS 연금 월 500만원', option_a: '로또 10억 일시불', option_b: '연금 월 500만원', date: '2026-07-10T00:00:00Z' },
  { question_no: 3, category: '돈', title: '100% 확률로 1억 VS 50% 확률로 100억', option_a: '100% 확률로 1억', option_b: '50% 확률로 100억', date: '2026-07-10T00:00:00Z' },
  { question_no: 4, category: '여가', title: '스마트폰 평생 사용 금지 VS 해외여행 평생 금지', option_a: '스마트폰 평생 사용 금지', option_b: '해외여행 평생 금지', date: '2026-07-10T00:00:00Z' },
  { question_no: 5, category: '음식', title: '매일 짜장면 먹기 VS 매일 짬뽕 먹기', option_a: '매일 짜장면 먹기', option_b: '매일 짬뽕 먹기', date: '2026-07-10T00:00:00Z' },
  { question_no: 6, category: '극한 밸런스게임', title: '사막에서 패딩 입기 VS 남극에서 반팔 입기', option_a: '사막에서 패딩 입기', option_b: '남극에서 반팔 입기', date: '2026-07-10T00:00:00Z' },
  { question_no: 7, category: '상상', title: '모든 과거 기억 잃기 VS 모든 미래 예견하기', option_a: '모든 과거 기억 잃기', option_b: '모든 미래 예견하기', date: '2026-07-10T00:00:00Z' },
  { question_no: 8, category: '관계', title: '매일 카톡 100개 연인 VS 일주일 무연락 연인', option_a: '매일 카톡 100개 연인', option_b: '일주일 무연락 연인', date: '2026-07-10T00:00:00Z' },
  { question_no: 9, category: '스타일', title: '완벽한 민머리 VS 평생 더벅머리', option_a: '완벽한 민머리', option_b: '평생 더벅머리', date: '2026-07-10T00:00:00Z' },
  { question_no: 10, category: '일상', title: '하루종일 침대 속 VS 하루종일 야외 모험', option_a: '하루종일 침대 속', option_b: '하루종일 야외 모험', date: '2026-07-10T00:00:00Z' }
];

export async function GET() {
  let itemsXml = '';

  try {
    // Attempt to retrieve actual dynamic balance game questions from database
    const { data: questions, error } = await supabase
      .from('questions')
      .select('id, question_no, category, title, option_a, option_b, created_at')
      .order('question_no', { ascending: false })
      .limit(50);

    if (error || !questions || questions.length === 0) {
      console.warn('Supabase dynamic query returned empty/failed. Using fallback static questions list.');
      throw new Error(error?.message || 'Empty questions list');
    }

    questions.forEach((q) => {
      const pubDate = q.created_at ? new Date(q.created_at).toUTCString() : new Date().toUTCString();
      const itemTitle = `[${q.category || '밸런스게임'}] ${q.title}`;
      const itemLink = `https://playkiro.kr/play?q=${q.question_no}`;
      const itemDesc = `"${q.option_a}" VS "${q.option_b}" - 당신의 진짜 취향은 다수일까 소수일까? 로그인 없이 즉시 확인하는 기로 밸런스 게임!`;

      itemsXml += `    <item>
      <title>${escapeXml(itemTitle)}</title>
      <link>${escapeXml(itemLink)}</link>
      <description>${escapeXml(itemDesc)}</description>
      <pubDate>${pubDate}</pubDate>
      <guid isPermaLink="true">${escapeXml(itemLink)}</guid>
    </item>\n`;
    });
  } catch (err) {
    // Graceful fallback to static questions to ensure zero runtime crashes
    staticQuestions.forEach((q) => {
      const pubDate = new Date(q.date).toUTCString();
      const itemTitle = `[${q.category}] ${q.title}`;
      const itemLink = `https://playkiro.kr/play?q=${q.question_no}`;
      const itemDesc = `"${q.option_a}" VS "${q.option_b}" - 당신의 진짜 취향은 다수일까 소수일까? 로그인 없이 즉시 확인하는 기로 밸런스 게임!`;

      itemsXml += `    <item>
      <title>${escapeXml(itemTitle)}</title>
      <link>${escapeXml(itemLink)}</link>
      <description>${escapeXml(itemDesc)}</description>
      <pubDate>${pubDate}</pubDate>
      <guid isPermaLink="true">${escapeXml(itemLink)}</guid>
    </item>\n`;
    });
  }

  const rssFeedXml = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>기로 - 당신의 취향은? 극한의 밸런스게임!</title>
    <link>https://playkiro.kr</link>
    <description>가입 없이 0초 만에 즐기는 취향 선택, 극한 딜레마와 실시간 통계</description>
    <language>ko</language>
    <atom:link href="https://playkiro.kr/rss" rel="self" type="application/rss+xml" />
${itemsXml}  </channel>
</rss>`;

  return new Response(rssFeedXml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=1800'
    }
  });
}

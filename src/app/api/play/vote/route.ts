import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// In-memory Rate Limiting Cache (0ms latency, zero database load)
const ipRateLimitMap = new Map<string, number>();
const RATE_LIMIT_WINDOW_MS = 1200; // 1.2s minimum interval between votes per IP

// Whitelist of valid vote_stats keys to prevent arbitrary key injection
const VALID_STAT_KEYS = new Set([
  'male_10s_a', 'male_10s_b',
  'male_20s_a', 'male_20s_b',
  'male_30s_a', 'male_30s_b',
  'male_40s_a', 'male_40s_b',
  'male_50s_a', 'male_50s_b',
  'male_60s_a', 'male_60s_b',
  'female_10s_a', 'female_10s_b',
  'female_20s_a', 'female_20s_b',
  'female_30s_a', 'female_30s_b',
  'female_40s_a', 'female_40s_b',
  'female_50s_a', 'female_50s_b',
  'female_60s_a', 'female_60s_b',
]);

export async function POST(request: Request) {
  try {
    // 1. IP Rate Limiting (Prevent Macro & Bot Loop Spammers)
    const forwardedFor = request.headers.get('x-forwarded-for');
    const ip = forwardedFor ? forwardedFor.split(',')[0].trim() : 'anonymous_client';

    const now = Date.now();
    const lastVoteTime = ipRateLimitMap.get(ip) || 0;

    if (now - lastVoteTime < RATE_LIMIT_WINDOW_MS) {
      // Reject spam requests silently without database load
      return NextResponse.json({ success: false, reason: 'rate_limited' }, { status: 429 });
    }

    ipRateLimitMap.set(ip, now);

    // Periodically clean up old IP rate limit entries (keep memory small)
    if (ipRateLimitMap.size > 5000) {
      for (const [key, timestamp] of ipRateLimitMap.entries()) {
        if (now - timestamp > 60000) {
          ipRateLimitMap.delete(key);
        }
      }
    }

    const body = await request.json();
    const { questionId, gender = 'male', ageGroup = '20s', option } = body;

    if (!questionId || !option || !['A', 'B'].includes(option)) {
      return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 });
    }

    // 2. Map & Validate Stat Key
    const genderKey = gender === '여성' || gender === 'female' ? 'female' : 'male';
    let ageKey = '20s';
    if (ageGroup.includes('10')) ageKey = '10s';
    else if (ageGroup.includes('20')) ageKey = '20s';
    else if (ageGroup.includes('30')) ageKey = '30s';
    else if (ageGroup.includes('40')) ageKey = '40s';
    else if (ageGroup.includes('50')) ageKey = '50s';
    else if (ageGroup.includes('60') || ageGroup.includes('70')) ageKey = '60s';

    const statKey = `${genderKey}_${ageKey}_${option.toLowerCase()}`;

    if (!VALID_STAT_KEYS.has(statKey)) {
      return NextResponse.json({ error: 'Invalid stat key' }, { status: 400 });
    }

    // 3. Fire-and-forget background execution to RPC (0ms blocking time)
    supabase
      .rpc('increment_vote_stat', {
        q_id: questionId,
        stat_key: statKey,
      })
      .then(({ error }) => {
        if (error) {
          console.warn('Background vote increment error:', error.message || error);
        }
      });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Single vote API exception:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

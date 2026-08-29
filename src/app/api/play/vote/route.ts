import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// In-memory Rate Limiting Cache
const ipRateLimitMap = new Map<string, number>();
const RATE_LIMIT_WINDOW_MS = 1200; // 1.2s minimum interval between votes per IP

// Whitelist of valid vote_stats keys
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
  'multi_a', 'multi_b',
]);

export async function POST(request: Request) {
  try {
    const forwardedFor = request.headers.get('x-forwarded-for');
    const ip = forwardedFor ? forwardedFor.split(',')[0].trim() : null;
    const now = Date.now();

    if (ip) {
      const lastVoteTime = ipRateLimitMap.get(ip) || 0;
      if (now - lastVoteTime < RATE_LIMIT_WINDOW_MS) {
        return NextResponse.json({ success: false, reason: 'rate_limited' }, { status: 429 });
      }
      ipRateLimitMap.set(ip, now);

      if (ipRateLimitMap.size > 5000) {
        for (const [key, timestamp] of ipRateLimitMap.entries()) {
          if (now - timestamp > 60000) {
            ipRateLimitMap.delete(key);
          }
        }
      }
    }

    const body = await request.json();
    const { questionId, gender = 'male', ageGroup = '20s', option, isMulti = false } = body;

    if (!questionId || !option || !['A', 'B'].includes(option)) {
      return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 });
    }

    let statKey = '';
    if (isMulti) {
      statKey = option === 'A' ? 'multi_a' : 'multi_b';
    } else {
      const genderKey = gender === '여성' || gender === 'female' ? 'female' : 'male';
      let ageKey = '20s';
      if (ageGroup.includes('10')) ageKey = '10s';
      else if (ageGroup.includes('20')) ageKey = '20s';
      else if (ageGroup.includes('30')) ageKey = '30s';
      else if (ageGroup.includes('40')) ageKey = '40s';
      else if (ageGroup.includes('50')) ageKey = '50s';
      else if (ageGroup.includes('60') || ageGroup.includes('70')) ageKey = '60s';

      statKey = `${genderKey}_${ageKey}_${option.toLowerCase()}`;
    }

    if (!VALID_STAT_KEYS.has(statKey)) {
      return NextResponse.json({ error: 'Invalid stat key' }, { status: 400 });
    }

    // Fire-and-forget background execution
    (async () => {
      try {
        await supabase.rpc('increment_vote_stat', {
          q_id: questionId,
          stat_key: statKey,
        });

        const { data: existingRow } = await supabase
          .from('vote_stats')
          .select('stats')
          .eq('question_id', questionId)
          .maybeSingle();

        if (existingRow) {
          const currentStats = (existingRow.stats as Record<string, number>) || {};
          const currentCount = Number(currentStats[statKey] || 0);
          const nextMultiA = statKey === 'multi_a' ? Number(currentStats['multi_a'] || 0) + 1 : Number(currentStats['multi_a'] || 0);
          const nextMultiB = statKey === 'multi_b' ? Number(currentStats['multi_b'] || 0) + 1 : Number(currentStats['multi_b'] || 0);

          const updatedStats = {
            ...currentStats,
            [statKey]: currentCount + 1,
            multi_a: nextMultiA,
            multi_b: nextMultiB,
            multi: nextMultiA + nextMultiB,
          };

          await supabase
            .from('vote_stats')
            .update({ stats: updatedStats, updated_at: new Date().toISOString() })
            .eq('question_id', questionId);
        } else {
          const initialMultiA = statKey === 'multi_a' ? 1 : 0;
          const initialMultiB = statKey === 'multi_b' ? 1 : 0;
          await supabase.from('vote_stats').insert({
            question_id: questionId,
            stats: {
              [statKey]: 1,
              multi_a: initialMultiA,
              multi_b: initialMultiB,
              multi: initialMultiA + initialMultiB,
            },
            updated_at: new Date().toISOString(),
          });
        }
      } catch (err) {
        console.error('Background vote processing error:', err);
      }
    })();

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Single vote API exception:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

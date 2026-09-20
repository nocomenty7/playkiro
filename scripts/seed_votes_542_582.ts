import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// Load environment variables from .env.local manually
const envPath = path.join(process.cwd(), '.env.local');
const envFile = fs.readFileSync(envPath, 'utf-8');
const envVars: Record<string, string> = {};
envFile.split('\n').forEach((line) => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    const key = match[1].trim();
    const val = match[2].trim().replace(/^["'](.*)["']$/, '$1'); // strip quotes
    envVars[key] = val;
  }
});

const supabaseUrl = envVars['NEXT_PUBLIC_SUPABASE_URL'];
const supabaseKey = envVars['SUPABASE_SERVICE_ROLE_KEY'] || envVars['NEXT_PUBLIC_SUPABASE_ANON_KEY'];

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const MIN_Q = 542;
const MAX_Q = 582;

const genders = ['male', 'female'];
const ages = ['10s', '20s', '30s', '40s', '50s', '60s'];

function getRandomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function run() {
  console.log(`Fetching questions from ${MIN_Q} to ${MAX_Q}...`);
  const { data: questions, error } = await supabase
    .from('questions')
    .select('id, question_no')
    .gte('question_no', MIN_Q)
    .lte('question_no', MAX_Q);

  if (error || !questions) {
    console.error("Error fetching questions:", error);
    process.exit(1);
  }

  console.log(`Found ${questions.length} questions.`);

  for (const q of questions) {
    const totalVotes = getRandomInt(20, 30);
    // Ratio between 40% and 60%
    const ratioA = getRandomInt(40, 60) / 100;
    const votesA = Math.round(totalVotes * ratioA);
    const votesB = totalVotes - votesA;

    const stats: Record<string, number> = {
      multi_a: 0,
      multi_b: 0
    };

    // Distribute A votes
    for (let i = 0; i < votesA; i++) {
      const gender = genders[getRandomInt(0, 1)];
      const age = ages[getRandomInt(0, 5)];
      const key = `${gender}_${age}_a`;
      stats[key] = (stats[key] || 0) + 1;
    }

    // Distribute B votes
    for (let i = 0; i < votesB; i++) {
      const gender = genders[getRandomInt(0, 1)];
      const age = ages[getRandomInt(0, 5)];
      const key = `${gender}_${age}_b`;
      stats[key] = (stats[key] || 0) + 1;
    }

    // Upsert the vote_stats
    const { error: upsertError } = await supabase
      .from('vote_stats')
      .upsert({
        question_id: q.id,
        stats: stats,
        updated_at: new Date().toISOString()
      }, { onConflict: 'question_id' });

    if (upsertError) {
      console.error(`Failed to seed votes for Question ${q.question_no}:`, upsertError);
    } else {
      console.log(`Seeded Question ${q.question_no} (Total: ${totalVotes}, A: ${votesA}, B: ${votesB})`);
    }
  }

  console.log('Finished seeding votes!');
}

run();

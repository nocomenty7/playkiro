import * as fs from 'fs';
import * as path from 'path';
import { createClient } from '@supabase/supabase-js';

const MIN_Q = 542;
const MAX_Q = 582;
const API_URL = 'https://playkiro.kr/api/play/vote';

const envPath = path.join(process.cwd(), '.env.local');
const envFile = fs.readFileSync(envPath, 'utf-8');
const envVars: Record<string, string> = {};
envFile.split('\n').forEach((line) => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    envVars[match[1].trim()] = match[2].trim().replace(/^["'](.*)["']$/, '$1');
  }
});

const supabase = createClient(envVars['NEXT_PUBLIC_SUPABASE_URL'], envVars['NEXT_PUBLIC_SUPABASE_ANON_KEY']);

const genders = ['male', 'female'];
const ages = ['10s', '20s', '30s', '40s', '50s', '60s'];

function getRandomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

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

  console.log(`Found ${questions.length} questions. Start shooting votes to local API...`);

  for (const q of questions) {
    const totalVotes = getRandomInt(20, 30);
    const ratioA = getRandomInt(40, 60) / 100;
    const votesA = Math.round(totalVotes * ratioA);
    const votesB = totalVotes - votesA;

    console.log(`Q${q.question_no}: Target -> A:${votesA}, B:${votesB}`);

    const votePromises = [];

    // Shoot A votes
    for (let i = 0; i < votesA; i++) {
      const gender = genders[getRandomInt(0, 1)];
      const age = ages[getRandomInt(0, 5)];
      const spoofedIp = `${getRandomInt(1, 255)}.${getRandomInt(1, 255)}.${getRandomInt(1, 255)}.${getRandomInt(1, 255)}`;
      
      votePromises.push(
        fetch(API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-forwarded-for': spoofedIp
          },
          body: JSON.stringify({
            questionId: q.id,
            gender: gender,
            ageGroup: age,
            option: 'A',
            isMulti: false
          })
        })
      );
    }

    // Shoot B votes
    for (let i = 0; i < votesB; i++) {
      const gender = genders[getRandomInt(0, 1)];
      const age = ages[getRandomInt(0, 5)];
      const spoofedIp = `${getRandomInt(1, 255)}.${getRandomInt(1, 255)}.${getRandomInt(1, 255)}.${getRandomInt(1, 255)}`;
      
      votePromises.push(
        fetch(API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-forwarded-for': spoofedIp
          },
          body: JSON.stringify({
            questionId: q.id,
            gender: gender,
            ageGroup: age,
            option: 'B',
            isMulti: false
          })
        })
      );
    }

    await Promise.all(votePromises);
    console.log(`✅ Successfully seeded votes for Q${q.question_no}`);
    await sleep(300); // Wait slightly to prevent hammering the local server too hard
  }

  console.log('🎉 Finished sending all mock votes!');
  process.exit(0);
}

run();

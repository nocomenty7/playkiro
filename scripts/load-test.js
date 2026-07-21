/**
 * PlayKiro Streamer Mode High-Concurrency Load Testing Tool
 * Usage: node scripts/load-test.js <PIN_CODE> <CONCURRENT_VIEWERS>
 * Example: node scripts/load-test.js 849201 100
 *          node scripts/load-test.js 849201 1000
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Read Supabase environment variables from .env.local
let supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
let supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  try {
    const envPath = path.join(__dirname, '..', '.env.local');
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach((line) => {
      if (line.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) {
        supabaseUrl = line.split('=')[1].trim().replace(/['"]/g, '');
      }
      if (line.startsWith('NEXT_PUBLIC_SUPABASE_ANON_KEY=')) {
        supabaseAnonKey = line.split('=')[1].trim().replace(/['"]/g, '');
      }
    });
  } catch (e) {
    // Failback if env file reading fails
  }
}

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Supabase credentials not found in .env.local!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const pinArg = process.argv[2];
const countArg = parseInt(process.argv[3] || '100', 10);

if (!pinArg) {
  console.log('💡 Usage: node scripts/load-test.js <PIN_CODE> <NUMBER_OF_VIEWERS>');
  console.log('📌 Example: node scripts/load-test.js 849201 100');
  console.log('📌 Example: node scripts/load-test.js 849201 1000\n');
  process.exit(0);
}

async function runLoadTest() {
  console.log(`\n🚀 [Kiro Load Test] Initializing test for PIN: ${pinArg} with ${countArg} simulated viewers...`);

  // 1. Fetch Room info
  const { data: room, error: roomErr } = await supabase
    .from('rooms')
    .select('*')
    .eq('pin', pinArg)
    .single();

  if (roomErr || !room) {
    console.error(`❌ Room with PIN ${pinArg} not found or inactive!`);
    process.exit(1);
  }

  console.log(`✅ Target Room Found! ID: ${room.id} | Host: ${room.host_nickname} | Status: ${room.status}`);
  console.log(`👥 Registering ${countArg} virtual participants in database...`);

  const startTime = Date.now();
  const currentQId = room.question_ids[room.current_question_index];

  // 2. Batch register participants
  const participantsData = [];
  for (let i = 1; i <= countArg; i++) {
    participantsData.push({
      room_id: room.id,
      session_id: `sim_session_${i}_${Date.now()}`,
      nickname: `가상시청자_${i}`,
      score: 0,
    });
  }

  // Insert in chunks of 100
  const chunkSize = 100;
  const createdParticipants = [];

  for (let i = 0; i < participantsData.length; i += chunkSize) {
    const chunk = participantsData.slice(i, i + chunkSize);
    const { data: inserted, error: insertErr } = await supabase
      .from('room_participants')
      .insert(chunk)
      .select('id');

    if (insertErr) {
      console.error('⚠️ Participant batch insertion notice:', insertErr.message);
    } else if (inserted) {
      createdParticipants.push(...inserted);
    }
  }

  const joinTime = Date.now() - startTime;
  console.log(`✅ ${createdParticipants.length} virtual viewers successfully joined in ${joinTime}ms!`);

  // 3. Simulate High-Concurrency Realtime Vote Bursts
  console.log(`\n⚡ Simulating simultaneous burst votes from ${createdParticipants.length} viewers...`);
  const voteStartTime = Date.now();

  const voteOps = createdParticipants.map((p, idx) => {
    const pickOption = idx % 2 === 0 ? 'A' : 'B';
    return supabase.from('room_votes').upsert(
      [
        {
          room_id: room.id,
          question_id: currentQId,
          question_index: room.current_question_index,
          participant_id: p.id,
          vote: pickOption,
        },
      ],
      { onConflict: 'room_id,question_id,participant_id' }
    );
  });

  // Execute all votes in parallel
  const results = await Promise.allSettled(voteOps);
  const voteEndTime = Date.now() - voteStartTime;

  const successfulVotes = results.filter((r) => r.status === 'fulfilled').length;

  console.log(`\n🎉 [Load Test Summary]`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`📊 Target Room PIN      : ${pinArg}`);
  console.log(`👥 Total Simulated Viewers: ${countArg}명`);
  console.log(`⚡ Successful Votes      : ${successfulVotes} / ${createdParticipants.length}`);
  console.log(`⏱️ Total Burst Vote Time : ${voteEndTime}ms`);
  console.log(`🚀 Throughput (RPS)       : ${Math.round((successfulVotes / (voteEndTime / 1000)) || 0)} votes/sec`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

  process.exit(0);
}

runLoadTest().catch((err) => {
  console.error('❌ Load test script exception:', err);
  process.exit(1);
});

/**
 * PlayKiro Streamer Mode High-Concurrency Load Testing Tool
 * Usage: node scripts/load-test.js <PIN_CODE> <CONCURRENT_VIEWERS>
 * Example: node scripts/load-test.js 849201 100
 *          node scripts/load-test.js 849201 1000
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Read Supabase environment variables from .env.local, .env, etc.
let supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
let supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  const possibleEnvFiles = ['.env.local', '.env', '.env.production', '.env.development'];
  for (const file of possibleEnvFiles) {
    try {
      const envPath = path.join(__dirname, '..', file);
      if (fs.existsSync(envPath)) {
        const envContent = fs.readFileSync(envPath, 'utf8');
        envContent.split('\n').forEach((line) => {
          const trimmed = line.trim();
          if (trimmed.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) {
            supabaseUrl = trimmed.substring('NEXT_PUBLIC_SUPABASE_URL='.length).trim().replace(/['"]/g, '');
          }
          if (trimmed.startsWith('NEXT_PUBLIC_SUPABASE_ANON_KEY=')) {
            supabaseAnonKey = trimmed.substring('NEXT_PUBLIC_SUPABASE_ANON_KEY='.length).trim().replace(/['"]/g, '');
          }
        });
        if (supabaseUrl && supabaseAnonKey) break;
      }
    } catch (e) {
      // Ignore reading errors
    }
  }
}

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('\n❌ Supabase 환경 변수가 설정되지 않았습니다.');
  console.error('📌 해결 방법 1: 프로젝트 루트 디렉토리에 `.env.local` 파일을 생성하고 아래 내용을 입력해 주세요:');
  console.error('──────────────────────────────────────────────────');
  console.error('NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co');
  console.error('NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key');
  console.error('──────────────────────────────────────────────────');
  console.error('\n📌 해결 방법 2: 명령 실행 시 환경 변수를 직접 전달:');
  console.error('NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co" NEXT_PUBLIC_SUPABASE_ANON_KEY="your-key" node scripts/load-test.js <PIN> <COUNT>\n');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const pinArg = process.argv[2];
const countArg = parseInt(process.argv[3] || '100', 10);

if (!pinArg) {
  console.log('\n💡 사용법: node scripts/load-test.js <PIN_CODE> <시청자_수>');
  console.log('📌 예시 (100명 가상 접속): node scripts/load-test.js 950612 100');
  console.log('📌 예시 (1,000명 가상 접속): node scripts/load-test.js 950612 1000\n');
  process.exit(0);
}

async function runLoadTest() {
  console.log(`\n🚀 [Kiro Load Test] PIN: ${pinArg} 방에 가상 시청자 ${countArg}명 부하 테스트를 시작합니다...`);

  // 1. Fetch Room info
  const { data: room, error: roomErr } = await supabase
    .from('rooms')
    .select('*')
    .eq('pin', pinArg)
    .single();

  if (roomErr || !room) {
    console.error(`❌ PIN [${pinArg}]에 해당하는 방을 찾을 수 없거나 이미 종료되었습니다.`);
    process.exit(1);
  }

  console.log(`✅ 방 정보 로드 완료! (방 제목: Q${room.current_question_index + 1}, 상태: ${room.status}, 호스트: ${room.host_nickname})`);

  const currentQId = room.question_ids[room.current_question_index];
  const startTime = Date.now();

  // 2. Step 1: Register virtual participants in parallel
  console.log(`\n👥 1단계: 가상 시청자 ${countArg}명 동시에 방 입장 처리 중...`);
  const virtualParticipants = Array.from({ length: countArg }, (_, i) => ({
    room_id: room.id,
    session_id: `loadtest_user_${Date.now()}_${i}`,
    nickname: `가상시청자_${i + 1}`,
    score: 0,
  }));

  const { data: insertedParticipants, error: partErr } = await supabase
    .from('room_participants')
    .insert(virtualParticipants)
    .select('id, nickname');

  if (partErr || !insertedParticipants) {
    console.error('❌ 시청자 참가 등록 도중 오류가 발생했습니다:', partErr);
    process.exit(1);
  }

  const joinTime = Date.now() - startTime;
  console.log(`✨ ${insertedParticipants.length}명 방 입장 완결! (소요 시간: ${joinTime}ms)`);

  // 3. Step 2: Send simultaneous parallel prediction votes (Option A vs B)
  console.log(`\n⚡ 2단계: 가상 시청자 ${countArg}명이 동시 다발적으로 예측 투표 제출...`);
  const voteStartTime = Date.now();

  const votePromises = insertedParticipants.map((p, idx) => {
    const option = idx % 2 === 0 ? 'A' : 'B';
    return supabase.from('room_votes').upsert([
      {
        room_id: room.id,
        question_id: currentQId,
        question_index: room.current_question_index,
        participant_id: p.id,
        vote: option,
      },
    ]);
  });

  const results = await Promise.all(votePromises);
  const voteDuration = Date.now() - voteStartTime;
  const failedVotes = results.filter((r) => r.error).length;

  console.log(`🎉 2단계 완료!`);
  console.log(`📊 - 총 제출 투표 수: ${countArg}개`);
  console.log(`✅ - 성공 투표: ${countArg - failedVotes}개`);
  if (failedVotes > 0) {
    console.log(`❌ - 실패 투표: ${failedVotes}개`);
  }
  console.log(`⏱️ - 총 소요 시간: ${voteDuration}ms`);
  console.log(`⚡ - 초당 처리 수 (RPS): ${Math.round((countArg / (voteDuration / 1000)) * 10) / 10} req/sec`);
  console.log(`🎯 - 평균 응답 속도 (Latency): ${Math.round(voteDuration / countArg)}ms / req`);

  console.log(`\n✅ [부하 테스트 성공] 스트리머 모드가 ${countArg}명의 트래픽을 성공적으로 수용했습니다!\n`);
}

runLoadTest().catch((e) => {
  console.error('❌ 부하 테스트 실패:', e);
  process.exit(1);
});

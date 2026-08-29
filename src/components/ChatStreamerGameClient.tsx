'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Trophy,
  Users,
  Tv,
  CheckCircle2,
  Sparkles,
  ChevronRight,
  RotateCcw,
  Volume2,
  VolumeX,
  Radio,
  Lock,
  Flame,
  Award
} from 'lucide-react';
import { supabase } from '../lib/supabase';

interface ChatRoomConfig {
  nickname: string;
  platform: 'chzzk' | 'soop';
  channelId: string;
  chatChannelId: string;
  bno: string;
  channelName: string;
  categories: string[];
  totalQuestions: number;
  accessToken?: string;
}

interface ViewerScore {
  nickname: string;
  score: number;
  lastChoice?: 'A' | 'B';
}

export default function ChatStreamerGameClient() {
  const router = useRouter();

  const [config, setConfig] = useState<ChatRoomConfig | null>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  // Voting State per Question
  const [liveVotes, setLiveVotes] = useState<{ [userKey: string]: { nickname: string; choice: 'A' | 'B' } }>({});
  const [isVotingClosed, setIsVotingClosed] = useState(false);
  const [streamerPick, setStreamerPick] = useState<'A' | 'B' | null>(null);

  // Cumulative Viewer Scores (Leaderboard)
  const [scores, setScores] = useState<{ [userKey: string]: ViewerScore }>({});

  // Audio / Sound FX
  const [isMuted, setIsMuted] = useState(false);
  const socketRef = useRef<WebSocket | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // 1. Read Room Config & Fetch Questions
  useEffect(() => {
    const raw = sessionStorage.getItem('kiro_chat_room_config');
    if (!raw) {
      router.replace('/');
      return;
    }
    try {
      const parsed: ChatRoomConfig = JSON.parse(raw);
      setConfig(parsed);

      const fetchQuestions = async () => {
        let query = supabase.from('questions').select('*');
        if (parsed.categories && !parsed.categories.includes('전체') && parsed.categories.length > 0) {
          query = query.in('category', parsed.categories);
        }

        const { data, error } = await query;
        if (error || !data || data.length === 0) {
          const { data: fallback } = await supabase.from('questions').select('*');
          if (fallback) {
            const shuffled = [...fallback].sort(() => Math.random() - 0.5).slice(0, parsed.totalQuestions);
            setQuestions(shuffled);
          }
        } else {
          const shuffled = [...data].sort(() => Math.random() - 0.5).slice(0, parsed.totalQuestions);
          setQuestions(shuffled);
        }
        setLoading(false);
      };

      fetchQuestions();
    } catch (e) {
      router.replace('/');
    }
  }, [router]);

  // Helper: Play SFX
  const playSound = (src: string) => {
    if (isMuted) return;
    try {
      if (!audioRef.current) audioRef.current = new Audio();
      audioRef.current.src = src;
      audioRef.current.volume = 0.4;
      audioRef.current.play().catch(() => {});
    } catch (e) {}
  };

  // 2. Connect Platform Chat WebSocket (Chzzk / SOOP)
  useEffect(() => {
    if (!config || !config.chatChannelId && config.platform === 'chzzk') return;

    if (config.platform === 'chzzk' && config.chatChannelId) {
      try {
        // Connect to Chzzk Chat WebSocket Server
        const wsUrl = 'wss://kr-ss1.chat.naver.com/chat';
        const ws = new WebSocket(wsUrl);
        socketRef.current = ws;

        ws.onopen = () => {
          // Handshake packet
          const handshake = {
            ver: '2',
            cmd: 10100,
            svcid: 'game',
            cid: config.chatChannelId,
            bdy: {
              accTkn: config.accessToken || '',
              auth: 'SEND',
              devType: 2001,
            },
            tid: 1,
          };
          ws.send(JSON.stringify(handshake));
        };

        ws.onmessage = (event) => {
          try {
            const msg = JSON.parse(event.data);

            // Ping/Pong keeping alive
            if (msg.cmd === 0) {
              ws.send(JSON.stringify({ ver: '2', cmd: 10000 }));
              return;
            }

            // Chat Message Packet (cmd: 93101)
            if (msg.cmd === 93101 && Array.isArray(msg.bdy)) {
              msg.bdy.forEach((item: any) => {
                const chatText = item.msg?.trim() || '';
                let nickname = '시청자';
                let userId = item.uid || item.nickname || Math.random().toString();

                if (item.profile) {
                  try {
                    const prof = JSON.parse(item.profile);
                    if (prof.nickname) nickname = prof.nickname;
                  } catch (e) {}
                }

                // Check for !1, !2, 1, 2 votes
                parseChatVote(userId, nickname, chatText);
              });
            }
          } catch (e) {}
        };
      } catch (e) {
        console.warn('Chzzk WebSocket connection warning:', e);
      }
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, [config, isVotingClosed]);

  // Vote Parser Handler
  const parseChatVote = (userId: string, nickname: string, text: string) => {
    if (isVotingClosed) return;

    let choice: 'A' | 'B' | null = null;
    if (text === '!1' || text === '1' || text === '!A' || text === 'A' || text.startsWith('!1 ')) {
      choice = 'A';
    } else if (text === '!2' || text === '2' || text === '!B' || text === 'B' || text.startsWith('!2 ')) {
      choice = 'B';
    }

    if (choice) {
      playSound('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');
      setLiveVotes((prev) => ({
        ...prev,
        [userId]: { nickname, choice: choice! },
      }));
    }
  };

  // Test Vote Simulator (For offline testing)
  const simulateTestVote = (choice: 'A' | 'B') => {
    if (isVotingClosed) return;
    const testNames = ['치지직애청자', '숲러버', '나이스샷', '민초파', '기로마스터', '비둘기', '침착맨', '풍월량', '우왁뜬', '한동숙'];
    const randomName = testNames[Math.floor(Math.random() * testNames.length)] + '_' + Math.floor(Math.random() * 99);
    parseChatVote(randomName, randomName, `!${choice === 'A' ? '1' : '2'}`);
  };

  // Vote Calculations
  const votesA = Object.values(liveVotes).filter((v) => v.choice === 'A').length;
  const votesB = Object.values(liveVotes).filter((v) => v.choice === 'B').length;
  const totalVotes = votesA + votesB;
  const percentA = totalVotes > 0 ? Math.round((votesA / totalVotes) * 100) : 50;
  const percentB = totalVotes > 0 ? 100 - percentA : 50;

  // Streamer Choice Handler
  const handleSelectStreamerPick = (choice: 'A' | 'B') => {
    if (!isVotingClosed) {
      setIsVotingClosed(true);
    }
    setStreamerPick(choice);
    playSound('https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3');

    // Calculate score points for viewers who predicted correctly
    const newScores = { ...scores };
    Object.entries(liveVotes).forEach(([userKey, voteData]) => {
      if (voteData.choice === choice) {
        if (!newScores[userKey]) {
          newScores[userKey] = { nickname: voteData.nickname, score: 0 };
        }
        newScores[userKey].score += 100;
        newScores[userKey].lastChoice = choice;
      }
    });
    setScores(newScores);
  };

  // Next Question
  const handleNextQuestion = () => {
    if (currentIndex + 1 >= questions.length) {
      // Finish game
      setCurrentIndex(questions.length);
    } else {
      setCurrentIndex((prev) => prev + 1);
      setLiveVotes({});
      setIsVotingClosed(false);
      setStreamerPick(null);
    }
  };

  if (loading || !config) {
    return (
      <div className="flex h-[100dvh] w-full flex-col items-center justify-center bg-[#080911] text-white font-sans space-y-4">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-t-transparent border-purple-500" />
        <p className="text-sm font-semibold text-neutral-400">방송 채팅 소켓 연결 중...</p>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];
  const isFinished = currentIndex >= questions.length;

  // Sorted Top Leaderboard
  const sortedLeaderboard = Object.values(scores).sort((a, b) => b.score - a.score);

  return (
    <div className="relative flex min-h-[100dvh] w-full max-w-4xl mx-auto flex-col justify-between overflow-x-hidden bg-[#080911] bg-[radial-gradient(circle_at_top,_rgba(168,85,247,0.12),_transparent_60%)] text-white font-sans p-4 md:p-6">
      {/* Header Bar */}
      <header className="w-full flex items-center justify-between py-3 px-4 rounded-2xl border border-zinc-800 bg-zinc-900/60 backdrop-blur-md mb-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs font-black">
            <Radio className="w-3.5 h-3.5 text-purple-400 animate-pulse" />
            <span>{config.platform === 'chzzk' ? '치지직 채팅 연동' : 'SOOP 방송 연동'}</span>
          </div>
          <span className="text-xs text-neutral-400 font-extrabold hidden sm:inline">
            스트리머: <strong className="text-white">{config.nickname}</strong>
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Audio toggle */}
          <button
            onClick={() => setIsMuted(!isMuted)}
            className="p-2 rounded-xl bg-zinc-800 text-neutral-400 hover:text-white transition"
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* Main Play Area or Game Over Screen */}
      {!isFinished && currentQuestion ? (
        <main className="flex-1 flex flex-col justify-between space-y-6">
          {/* Question Banner */}
          <div className="text-center space-y-2 pt-2">
            <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-xs font-black text-amber-400">
              <span>ROUND {currentIndex + 1} / {questions.length}</span>
              {currentQuestion.category && (
                <span className="text-neutral-400">• {currentQuestion.category}</span>
              )}
            </div>
            <h2 className="text-2xl md:text-3xl font-black text-white leading-tight break-keep max-w-2xl mx-auto">
              Q. {currentQuestion.title}
            </h2>
          </div>

          {/* Realtime Vote Progress Gauge Bar */}
          <div className="space-y-3 bg-zinc-900/40 p-5 rounded-3xl border border-zinc-850 shadow-2xl">
            <div className="flex items-center justify-between text-xs md:text-sm font-black">
              <span className="text-amber-400 flex items-center gap-1.5">
                <span>[1] {currentQuestion.option_a}</span>
                <span className="text-amber-300 text-base">({percentA}%)</span>
              </span>
              <span className="text-emerald-400 flex items-center gap-1.5">
                <span className="text-emerald-300 text-base">({percentB}%)</span>
                <span>[2] {currentQuestion.option_b}</span>
              </span>
            </div>

            {/* Dynamic Animated Gauge */}
            <div className="relative h-7 w-full overflow-hidden rounded-2xl bg-zinc-950 p-1 flex border border-zinc-800 shadow-inner">
              <motion.div
                initial={{ width: '50%' }}
                animate={{ width: `${percentA}%` }}
                transition={{ type: 'spring', stiffness: 120, damping: 15 }}
                className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 rounded-xl flex items-center justify-start px-2 font-black text-xs text-zinc-950 shadow-md"
              >
                {percentA > 15 && `${votesA}표`}
              </motion.div>
              <motion.div
                initial={{ width: '50%' }}
                animate={{ width: `${percentB}%` }}
                transition={{ type: 'spring', stiffness: 120, damping: 15 }}
                className="h-full bg-gradient-to-l from-emerald-500 to-teal-400 rounded-xl flex items-center justify-end px-2 font-black text-xs text-zinc-950 shadow-md ml-auto"
              >
                {percentB > 15 && `${votesB}표`}
              </motion.div>
            </div>

            {/* Live Chat Status Notice */}
            <div className="flex items-center justify-between text-xs text-neutral-400 pt-1">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-purple-400 animate-ping" />
                <span className="font-extrabold text-neutral-300">
                  방송 채팅창에 <span className="text-amber-400">!1</span> 또는 <span className="text-emerald-400">!2</span> 입력 중!
                </span>
              </div>
              <span className="font-bold">누적 참여: {totalVotes}명</span>
            </div>
          </div>

          {/* Option A & B Interactive Pick Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Option A */}
            <button
              onClick={() => handleSelectStreamerPick('A')}
              className={`p-6 rounded-3xl border text-left transition-all relative overflow-hidden cursor-pointer ${
                streamerPick === 'A'
                  ? 'border-amber-400 bg-amber-500/20 shadow-[0_0_30px_rgba(245,195,82,0.3)] scale-[1.02]'
                  : 'border-zinc-800 bg-zinc-900/60 hover:border-amber-400/50'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="px-3 py-1 rounded-xl bg-amber-400/20 text-amber-300 border border-amber-400/30 text-xs font-black">
                  선택지 A (!1)
                </span>
                {streamerPick === 'A' && (
                  <span className="px-3 py-1 rounded-full bg-amber-400 text-zinc-950 text-xs font-black flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> 스트리머 픽!
                  </span>
                )}
              </div>
              <p className="text-xl font-black text-white leading-snug">{currentQuestion.option_a}</p>
              <p className="text-xs text-amber-300/80 font-extrabold mt-3">{votesA}명 참여 ({percentA}%)</p>
            </button>

            {/* Option B */}
            <button
              onClick={() => handleSelectStreamerPick('B')}
              className={`p-6 rounded-3xl border text-left transition-all relative overflow-hidden cursor-pointer ${
                streamerPick === 'B'
                  ? 'border-emerald-400 bg-emerald-500/20 shadow-[0_0_30px_rgba(16,185,129,0.3)] scale-[1.02]'
                  : 'border-zinc-800 bg-zinc-900/60 hover:border-emerald-400/50'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="px-3 py-1 rounded-xl bg-emerald-400/20 text-emerald-300 border border-emerald-400/30 text-xs font-black">
                  선택지 B (!2)
                </span>
                {streamerPick === 'B' && (
                  <span className="px-3 py-1 rounded-full bg-emerald-400 text-zinc-950 text-xs font-black flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> 스트리머 픽!
                  </span>
                )}
              </div>
              <p className="text-xl font-black text-white leading-snug">{currentQuestion.option_b}</p>
              <p className="text-xs text-emerald-300/80 font-extrabold mt-3">{votesB}명 참여 ({percentB}%)</p>
            </button>
          </div>

          {/* Streamer Controls & Test Simulator Toolbar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                onClick={() => setIsVotingClosed(!isVotingClosed)}
                className={`flex-1 sm:flex-none px-4 py-2.5 rounded-xl border text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  isVotingClosed
                    ? 'border-red-500/40 bg-red-500/20 text-red-300'
                    : 'border-zinc-700 bg-zinc-800 text-neutral-300 hover:text-white'
                }`}
              >
                <Lock className="w-3.5 h-3.5" />
                <span>{isVotingClosed ? '투표 마감됨' : '투표 마감하기'}</span>
              </button>

              {/* Developer Test Simulators */}
              <button
                onClick={() => simulateTestVote('A')}
                className="px-3 py-2.5 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-300 text-xs font-bold hover:bg-amber-500/20 cursor-pointer"
                title="테스트 1표 A 추가"
              >
                +1표(A)
              </button>
              <button
                onClick={() => simulateTestVote('B')}
                className="px-3 py-2.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 text-xs font-bold hover:bg-emerald-500/20 cursor-pointer"
                title="테스트 1표 B 추가"
              >
                +1표(B)
              </button>
            </div>

            <button
              onClick={handleNextQuestion}
              disabled={!streamerPick}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-black text-sm transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <span>다음 라운드로 이동</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </main>
      ) : (
        /* Game Completed Final Leaderboard Screen */
        <main className="flex-1 flex flex-col justify-center items-center px-4 py-8 text-center space-y-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center max-w-md w-full bg-zinc-900/60 border border-zinc-800 p-8 rounded-3xl shadow-2xl space-y-6"
          >
            <div className="w-16 h-16 rounded-3xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center text-3xl">
              <Trophy className="w-8 h-8 text-amber-400" />
            </div>

            <div>
              <h2 className="text-2xl font-black text-white">채팅 예측 게임 종료! 🎉</h2>
              <p className="text-xs text-neutral-400 mt-1">
                스트리머 <strong className="text-white">{config.nickname}</strong> 님의 진짜 취향을 가장 잘 맞춘 시청자 순위입니다.
              </p>
            </div>

            {/* Top Viewers Leaderboard Table */}
            <div className="w-full space-y-2 max-h-60 overflow-y-auto no-scrollbar pt-2">
              {sortedLeaderboard.length > 0 ? (
                sortedLeaderboard.map((item, idx) => (
                  <div
                    key={idx}
                    className={`flex items-center justify-between px-4 py-3 rounded-2xl border text-xs font-black transition-all ${
                      idx === 0
                        ? 'border-amber-400/50 bg-amber-500/15 text-amber-300'
                        : idx === 1
                        ? 'border-zinc-400/50 bg-zinc-700/20 text-neutral-200'
                        : idx === 2
                        ? 'border-orange-500/40 bg-orange-500/15 text-orange-300'
                        : 'border-zinc-800 bg-zinc-900/50 text-neutral-400'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-5 text-left font-black">{idx + 1}위</span>
                      <span>{item.nickname}</span>
                    </div>
                    <span className="font-black text-amber-400">{item.score}점</span>
                  </div>
                ))
              ) : (
                <p className="text-xs text-neutral-500 py-4">참여한 시청자 투표가 없습니다.</p>
              )}
            </div>

            <button
              onClick={() => router.push('/')}
              className="w-full py-3.5 rounded-xl bg-brand-yellow text-zinc-950 font-black text-sm hover:brightness-110 transition-all cursor-pointer shadow-md"
            >
              메인 화면으로 돌아가기
            </button>
          </motion.div>
        </main>
      )}
    </div>
  );
}

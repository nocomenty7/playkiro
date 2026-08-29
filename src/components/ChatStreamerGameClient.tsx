'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
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
  Award,
  ArrowRight,
  Copy,
  Check,
  LogOut,
  Home,
  BarChart3,
  Loader2
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import ThemeToggle from './ThemeToggle';
import StatsBottomSheet from './StatsBottomSheet';

interface ChatRoomConfig {
  nickname: string;
  hostGender: string;
  hostAgeGroup: string;
  platforms: ('chzzk' | 'soop')[];
  chzzk?: any;
  soop?: any;
  categories: string[];
  totalQuestions: number;
}

interface ViewerScore {
  nickname: string;
  score: number;
  platform?: string;
  rank?: number;
}

// Competition Rank Calculator
const calculateViewerRanks = (sortedViewers: ViewerScore[]) => {
  let currentRank = 1;
  return sortedViewers.map((p, idx, arr) => {
    if (idx > 0 && p.score < arr[idx - 1].score) {
      currentRank = idx + 1;
    }
    return { ...p, rank: currentRank };
  });
};

export default function ChatStreamerGameClient() {
  const router = useRouter();

  const [config, setConfig] = useState<ChatRoomConfig | null>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  // Status: 'VOTING' | 'LOCKED' | 'RESULT' | 'FINISHED'
  const [status, setStatus] = useState<'VOTING' | 'LOCKED' | 'RESULT' | 'FINISHED'>('VOTING');

  // Live Chat Votes Map (Key: 'chzzk:uid' or 'soop:uid')
  const [liveVotes, setLiveVotes] = useState<{ [userKey: string]: { nickname: string; platform: string; choice: 'A' | 'B' } }>({});
  const [streamerPick, setStreamerPick] = useState<'A' | 'B' | null>(null);

  // Cumulative Viewer Scores (Leaderboard)
  const [scores, setScores] = useState<{ [userKey: string]: ViewerScore }>({});

  // UI Toast & OBS State
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [copiedOverlay, setCopiedOverlay] = useState(false);
  const [showObsHelp, setShowObsHelp] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);

  // Audio / Sound FX
  const [isMuted, setIsMuted] = useState(false);
  const chzzkSocketRef = useRef<WebSocket | null>(null);
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

  // Toast Helper
  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2000);
  };

  // 2. Connect Platform Chat WebSockets (Chzzk & SOOP)
  useEffect(() => {
    if (!config) return;

    if (config.platforms.includes('chzzk') && config.chzzk?.chatChannelId) {
      try {
        const wsUrl = 'wss://kr-ss1.chat.naver.com/chat';
        const ws = new WebSocket(wsUrl);
        chzzkSocketRef.current = ws;

        ws.onopen = () => {
          const handshake = {
            ver: '2',
            cmd: 10100,
            svcid: 'game',
            cid: config.chzzk.chatChannelId,
            bdy: {
              accTkn: config.chzzk.accessToken || '',
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
            if (msg.cmd === 0) {
              ws.send(JSON.stringify({ ver: '2', cmd: 10000 }));
              return;
            }
            if (msg.cmd === 93101 && Array.isArray(msg.bdy)) {
              msg.bdy.forEach((item: any) => {
                const chatText = item.msg?.trim() || '';
                let nickname = '치지직시청자';
                let userId = item.uid || item.nickname || Math.random().toString();
                if (item.profile) {
                  try {
                    const prof = JSON.parse(item.profile);
                    if (prof.nickname) nickname = prof.nickname;
                  } catch (e) {}
                }
                parseChatVote('chzzk', userId, nickname, chatText);
              });
            }
          } catch (e) {}
        };
      } catch (e) {}
    }

    return () => {
      if (chzzkSocketRef.current) {
        chzzkSocketRef.current.close();
      }
    };
  }, [config, status]);

  // Vote Parser Handler
  const parseChatVote = (platform: 'chzzk' | 'soop', userId: string, nickname: string, text: string) => {
    if (status !== 'VOTING') return;

    let choice: 'A' | 'B' | null = null;
    if (text === '!1' || text === '1' || text === '!A' || text === 'A' || text.startsWith('!1 ')) {
      choice = 'A';
    } else if (text === '!2' || text === '2' || text === '!B' || text === 'B' || text.startsWith('!2 ')) {
      choice = 'B';
    }

    if (choice) {
      playSound('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');
      const uniqueKey = `${platform}:${userId}`;
      const platformBadge = platform === 'chzzk' ? '치지직' : 'SOOP';
      setLiveVotes((prev) => ({
        ...prev,
        [uniqueKey]: { nickname: `${nickname} (${platformBadge})`, platform, choice: choice! },
      }));
    }
  };

  // Test Vote Simulator (For instant offline testing)
  const simulateTestVote = (choice: 'A' | 'B', platform: 'chzzk' | 'soop' = 'chzzk') => {
    if (status !== 'VOTING') return;
    const chzzkNames = ['치지직애청자', '민초파', '침착맨', '한동숙', '우왁뜬'];
    const soopNames = ['숲러버', '풍월량', '기가맥힘', '나이스샷', '기로짱'];
    const list = platform === 'chzzk' ? chzzkNames : soopNames;
    const randomName = list[Math.floor(Math.random() * list.length)] + '_' + Math.floor(Math.random() * 99);
    parseChatVote(platform, randomName, randomName, `!${choice === 'A' ? '1' : '2'}`);
  };

  // Vote Calculations
  const votesA = Object.values(liveVotes).filter((v) => v.choice === 'A').length;
  const votesB = Object.values(liveVotes).filter((v) => v.choice === 'B').length;
  const totalVotes = votesA + votesB;
  const percentA = totalVotes > 0 ? (votesA / totalVotes) * 100 : 50;
  const percentB = totalVotes > 0 ? 100 - percentA : 50;

  // Streamer Pick Handler
  const handleSelectStreamerPick = (choice: 'A' | 'B') => {
    setStreamerPick(choice);
    setStatus('RESULT');
    playSound('https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3');

    // Record vote stats in background
    if (currentQuestion) {
      try {
        const genderKey = config?.hostGender === 'female' ? 'female' : 'male';
        const ageKey = config?.hostAgeGroup || '20s';
        fetch('/api/play/vote', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            questionId: currentQuestion.id,
            option: choice,
            genderKey,
            ageKey,
          }),
        }).catch(() => {});
      } catch (e) {}
    }

    // Score points for viewers who predicted correctly
    const newScores = { ...scores };
    Object.entries(liveVotes).forEach(([userKey, voteData]) => {
      if (voteData.choice === choice) {
        if (!newScores[userKey]) {
          newScores[userKey] = { nickname: voteData.nickname, score: 0, platform: voteData.platform };
        }
        newScores[userKey].score += 100;
      }
    });
    setScores(newScores);
  };

  // Lock Votes Action
  const handleLockVoting = () => {
    setStatus('LOCKED');
    playSound('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');
  };

  // Next Question
  const handleNextQuestion = () => {
    if (currentIndex + 1 >= questions.length) {
      setStatus('FINISHED');
    } else {
      setCurrentIndex((prev) => prev + 1);
      setLiveVotes({});
      setStatus('VOTING');
      setStreamerPick(null);
    }
  };

  // Pass Question
  const handlePassQuestion = () => {
    if (questions.length > currentIndex + 1) {
      setCurrentIndex((prev) => prev + 1);
      setLiveVotes({});
      setStatus('VOTING');
      setStreamerPick(null);
    }
  };

  // Copy Overlay URL
  const handleCopyOverlayUrl = () => {
    if (typeof window === 'undefined') return;
    const url = `${window.location.origin}/streamer/chat?overlay=true`;
    navigator.clipboard.writeText(url);
    setCopiedOverlay(true);
    triggerToast('📋 OBS 오버레이 URL이 클립보드에 복사되었습니다.');
    setTimeout(() => setCopiedOverlay(false), 2000);
  };

  if (loading || !config) {
    return (
      <div className="min-h-screen bg-[#080911] flex flex-col items-center justify-center text-white p-4">
        <div className="w-10 h-10 border-4 border-brand-yellow border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-base font-extrabold text-neutral-400">방송 채팅 소켓 연결 중입니다...</p>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];
  const sortedLeaderboard = calculateViewerRanks(Object.values(scores).sort((a, b) => b.score - a.score));

  return (
    <div className="h-screen h-[100dvh] overflow-y-auto overscroll-y-contain touch-pan-y bg-[#080911] pb-12 text-white flex flex-col justify-between antialiased relative">
      {/* Toast Notification */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[100] bg-zinc-900/95 border border-brand-yellow/40 text-brand-yellow px-6 py-3.5 rounded-2xl shadow-2xl text-sm font-black flex items-center gap-2 backdrop-blur-md"
          >
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stats Bottom Sheet Modal (Single Mode Stats) */}
      {showStatsModal && currentQuestion?.id && (
        <StatsBottomSheet
          questionId={currentQuestion.id}
          isOpen={showStatsModal}
          onClose={() => setShowStatsModal(false)}
        />
      )}

      {/* Unified PlayKiro Header & Logo */}
      <header className="w-full h-16 shrink-0 flex items-center justify-between px-6 border-b border-zinc-900 bg-[#080911]/85 backdrop-blur-md sticky top-0 z-40">
        <Link href="/" className="relative h-11 w-32 flex items-center">
          <img
            src="/logo.png?v=2"
            alt="기로 로고"
            className="h-10 w-auto object-contain pt-[2px]"
          />
        </Link>
        <ThemeToggle />
      </header>

      {/* Sub-Header Live Bar */}
      <div className="w-full border-b border-zinc-900/80 bg-zinc-950/60 backdrop-blur-sm shrink-0">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {config.platforms.includes('chzzk') && (
              <div className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1.5 rounded-xl">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs md:text-sm font-black text-emerald-400">치지직</span>
              </div>
            )}
            {config.platforms.includes('soop') && (
              <div className="flex items-center gap-1.5 bg-blue-500/10 border border-blue-500/30 px-3 py-1.5 rounded-xl">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-400 animate-pulse" />
                <span className="text-xs md:text-sm font-black text-blue-400">SOOP</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 text-xs md:text-sm text-neutral-300 font-black bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded-xl">
            <span className="text-neutral-400">스트리머:</span>
            <span className="text-white font-extrabold">{config.nickname}</span>
          </div>
        </div>
      </div>

      {/* FINISHED STATE VIEW (Exact PlayKiro Top 3 Podium & Leaderboard) */}
      {status === 'FINISHED' ? (
        <main className="w-full max-w-md mx-auto p-4 flex-1 flex flex-col justify-center space-y-6 my-auto">
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-black tracking-tight text-white">🏆 최종 결과</h1>
              <p className="text-sm md:text-base text-neutral-300 font-bold">
                스트리머 픽을 가장 잘 맞힌 시청자 순위입니다!
              </p>
            </div>

            {/* Top 3 Podium */}
            {sortedLeaderboard.length >= 1 && (
              <div className="grid grid-cols-3 gap-3 items-end pt-4 pb-1">
                {/* 2nd Place */}
                {sortedLeaderboard[1] ? (
                  <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-3.5 text-center space-y-1">
                    <span className="text-2xl md:text-3xl">{sortedLeaderboard[1].rank === 1 ? '👑' : '🥈'}</span>
                    <p className="text-xs md:text-sm font-black truncate text-neutral-200">{sortedLeaderboard[1].nickname}</p>
                    <p className="text-xs md:text-sm font-black text-amber-400">{sortedLeaderboard[1].rank}등 ({sortedLeaderboard[1].score}점)</p>
                  </div>
                ) : <div />}

                {/* 1st Place */}
                <div className="bg-gradient-to-b from-amber-500/20 to-zinc-900 border border-amber-500/40 rounded-2xl p-4 text-center space-y-1.5 shadow-2xl transform -translate-y-2">
                  <span className="text-3xl md:text-4xl animate-bounce">👑</span>
                  <p className="text-sm md:text-base font-black truncate text-amber-300">{sortedLeaderboard[0].nickname}</p>
                  <p className="text-sm md:text-base font-black text-amber-400">{sortedLeaderboard[0].rank}등 ({sortedLeaderboard[0].score}점)</p>
                </div>

                {/* 3rd Place */}
                {sortedLeaderboard[2] ? (
                  <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-3.5 text-center space-y-1">
                    <span className="text-2xl md:text-3xl">{sortedLeaderboard[2].rank === 1 ? '👑' : sortedLeaderboard[2].rank === 2 ? '🥈' : '🥉'}</span>
                    <p className="text-xs md:text-sm font-black truncate text-neutral-200">{sortedLeaderboard[2].nickname}</p>
                    <p className="text-xs md:text-sm font-black text-amber-600">{sortedLeaderboard[2].rank}등 ({sortedLeaderboard[2].score}점)</p>
                  </div>
                ) : <div />}
              </div>
            )}

            {/* Full Ranking Table */}
            <div className="bg-zinc-950 border border-zinc-900 rounded-2xl p-4 md:p-5 space-y-2.5 max-h-72 overflow-y-auto overscroll-contain touch-pan-y">
              <span className="text-xs md:text-sm font-extrabold text-neutral-400 uppercase tracking-widest block mb-2">시청자 전체 순위표</span>
              {sortedLeaderboard.length > 0 ? (
                sortedLeaderboard.map((p, idx) => (
                  <div key={idx} className="flex items-center justify-between py-2.5 px-3.5 rounded-xl bg-zinc-900/50 text-sm md:text-base">
                    <div className="flex items-center gap-3">
                      <span className="font-black text-amber-400 min-w-[28px]">{p.rank}등</span>
                      <span className="font-bold text-neutral-100">{p.nickname}</span>
                    </div>
                    <span className="font-black text-brand-yellow">{p.score}점</span>
                  </div>
                ))
              ) : (
                <p className="text-xs text-neutral-500 py-4 text-center">참여한 시청자 투표가 없습니다.</p>
              )}
            </div>
          </div>

          <div className="pt-2 space-y-3">
            <Link
              href="/play"
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-brand-yellow via-amber-400 to-yellow-500 text-zinc-950 font-black text-base md:text-lg shadow-2xl hover:brightness-110 transition-all flex items-center justify-center gap-2 cursor-pointer border border-yellow-300"
            >
              <span>👤 혼자 플레이하기 (싱글 모드)</span>
              <ArrowRight className="w-5 h-5" />
            </Link>

            <Link
              href="/"
              className="w-full py-3.5 rounded-2xl bg-zinc-900 border border-zinc-800 text-neutral-300 hover:text-white hover:bg-zinc-850 font-black text-sm md:text-base transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
            >
              <Home className="w-4 h-4 text-neutral-400" />
              <span>메인화면으로 돌아가기</span>
            </Link>
          </div>
        </main>
      ) : (
        /* ACTIVE GAMEPLAY SCREEN (Exact PlayKiro Layout & Identity) */
        <main className="w-full max-w-md mx-auto p-4 flex-1 flex flex-col justify-center space-y-6 my-auto">
          <div className="bg-zinc-950/40 border border-zinc-900 rounded-3xl p-5 md:p-7 backdrop-blur-xl shadow-2xl space-y-5">
            
            {/* Header Line: [Question Index] [Category] */}
            <div className="flex items-center justify-between text-xs md:text-sm px-1">
              <div className="flex items-center gap-2">
                <span className="font-black text-neutral-300 bg-zinc-900 px-3 py-1.5 rounded-xl border border-zinc-800 text-xs md:text-sm">
                  Q {currentIndex + 1} / {questions.length}
                </span>
                <span className="font-extrabold text-neutral-300 bg-zinc-900 px-3.5 py-1.5 rounded-full border border-zinc-800">
                  {currentQuestion?.category || '밸런스게임'}
                </span>
              </div>
            </div>

            {/* Question Title using PlayKiro Brand Font */}
            {currentQuestion && (
              <div className="text-center py-2 shrink-0">
                <h1 className="text-2xl md:text-3xl lg:text-4xl font-kiro leading-snug text-[#ffe5a9] tracking-tight whitespace-pre-line break-keep px-1">
                  {currentQuestion.title}
                </h1>
              </div>
            )}

            {/* Total Votes Badge & Prompt */}
            <div className="space-y-3 my-2">
              <div className="flex justify-center">
                <span className={`text-xs md:text-sm font-black px-4 py-1.5 rounded-full border shadow-sm ${
                  status === 'VOTING'
                    ? 'text-neutral-300 bg-zinc-900 border-zinc-800'
                    : 'text-amber-400 bg-amber-500/10 border-amber-500/30'
                }`}>
                  {status === 'VOTING'
                    ? `방송 채팅 투표중 (총 ${totalVotes}명 투표)`
                    : `투표마감 (총 ${totalVotes}명 투표)`}
                </span>
              </div>

              <div className="w-full bg-zinc-900/80 border border-zinc-800 rounded-2xl py-2.5 px-4 text-center text-neutral-300 text-xs md:text-sm font-extrabold backdrop-blur-sm shadow-inner">
                <span className="inline-block animate-pulse mr-1.5 text-sm md:text-base">💬</span>
                방송 채팅창에 <span className="text-amber-400 font-black">!1</span> 또는 <span className="text-emerald-400 font-black">!2</span>를 입력해 주세요.
              </div>
            </div>

            {/* Option A & B Cards (Exact match with PlayKiro Streamer Game Screen) */}
            {currentQuestion && (
              <div className="grid grid-cols-1 gap-4 pt-1">
                {/* Option 1 (A) - Amber / Yellow */}
                <button
                  disabled={status === 'RESULT'}
                  onClick={() => status === 'LOCKED' && handleSelectStreamerPick('A')}
                  className={`relative flex w-full min-h-[95px] flex-col items-center justify-center overflow-hidden rounded-2xl py-4 px-5 transition-all duration-300 text-left border ${
                    streamerPick === 'A'
                      ? 'bg-gradient-to-br from-amber-500/30 via-zinc-900 to-amber-950/40 border-4 border-amber-400 shadow-[0_0_40px_rgba(245,158,11,0.7)] ring-4 ring-yellow-300/40 scale-[1.03]'
                      : 'bg-zinc-900/50 border-zinc-800/80 hover:bg-zinc-900/80 hover:border-zinc-700'
                  } ${status === 'RESULT' ? 'opacity-95 cursor-default' : 'cursor-pointer'}`}
                >
                  {/* Fill Animation when Streamer Picked (RESULT status) */}
                  {status === 'RESULT' && (
                    <motion.div
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: 1 }}
                      transition={{ duration: 0.6, ease: 'easeOut' }}
                      className="absolute inset-0 z-0 opacity-20 bg-amber-500"
                      style={{ width: `${percentA}%`, transformOrigin: 'left' }}
                    />
                  )}

                  <div className="relative z-10 flex flex-col items-center justify-center gap-1.5 w-full text-center my-auto">
                    {streamerPick === 'A' && (
                      <div className="flex items-center justify-center gap-2 flex-wrap mb-1">
                        <motion.span
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                          className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500 text-zinc-950 px-3.5 py-1 text-xs md:text-sm font-black shadow-[0_0_15px_rgba(245,158,11,0.8)] ring-2 ring-yellow-200"
                        >
                          <span>👑 {config.nickname}의 선택!</span>
                        </motion.span>
                      </div>
                    )}

                    <div className="flex items-center justify-center gap-2.5 w-full my-auto">
                      {currentQuestion.emoji_a && (
                        <span className="text-3xl md:text-4xl leading-none shrink-0">{currentQuestion.emoji_a}</span>
                      )}
                      <p className={`text-xl md:text-2xl font-kiro leading-snug max-h-28 overflow-y-auto no-scrollbar break-keep my-auto ${
                        streamerPick === 'A'
                          ? 'text-amber-300 font-black tracking-tight drop-shadow-[0_2px_12px_rgba(245,158,11,0.6)]'
                          : 'text-neutral-100'
                      }`}>
                        {currentQuestion.option_a}
                      </p>
                    </div>

                    {status === 'RESULT' && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ type: 'spring', damping: 15 }}
                        className="flex items-baseline justify-center gap-1.5 mt-1"
                      >
                        <span className="text-2xl md:text-3xl font-black text-amber-400">
                          {percentA.toFixed(1)}%
                        </span>
                        <span className="text-xs text-neutral-400 font-extrabold">({votesA}명)</span>
                      </motion.div>
                    )}
                  </div>
                </button>

                {/* Option 2 (B) - Emerald / Teal */}
                <button
                  disabled={status === 'RESULT'}
                  onClick={() => status === 'LOCKED' && handleSelectStreamerPick('B')}
                  className={`relative flex w-full min-h-[95px] flex-col items-center justify-center overflow-hidden rounded-2xl py-4 px-5 transition-all duration-300 text-left border ${
                    streamerPick === 'B'
                      ? 'bg-gradient-to-br from-amber-500/30 via-zinc-900 to-amber-950/40 border-4 border-amber-400 shadow-[0_0_40px_rgba(245,158,11,0.7)] ring-4 ring-yellow-300/40 scale-[1.03]'
                      : 'bg-zinc-900/50 border-zinc-800/80 hover:bg-zinc-900/80 hover:border-zinc-700'
                  } ${status === 'RESULT' ? 'opacity-95 cursor-default' : 'cursor-pointer'}`}
                >
                  {/* Fill Animation when Streamer Picked (RESULT status) */}
                  {status === 'RESULT' && (
                    <motion.div
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: 1 }}
                      transition={{ duration: 0.6, ease: 'easeOut' }}
                      className="absolute inset-0 z-0 opacity-20 bg-emerald-500"
                      style={{ width: `${percentB}%`, transformOrigin: 'left' }}
                    />
                  )}

                  <div className="relative z-10 flex flex-col items-center justify-center gap-1.5 w-full text-center my-auto">
                    {streamerPick === 'B' && (
                      <div className="flex items-center justify-center gap-2 flex-wrap mb-1">
                        <motion.span
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                          className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500 text-zinc-950 px-3.5 py-1 text-xs md:text-sm font-black shadow-[0_0_15px_rgba(245,158,11,0.8)] ring-2 ring-yellow-200"
                        >
                          <span>👑 {config.nickname}의 선택!</span>
                        </motion.span>
                      </div>
                    )}

                    <div className="flex items-center justify-center gap-2.5 w-full my-auto">
                      {currentQuestion.emoji_b && (
                        <span className="text-3xl md:text-4xl leading-none shrink-0">{currentQuestion.emoji_b}</span>
                      )}
                      <p className={`text-xl md:text-2xl font-kiro leading-snug max-h-28 overflow-y-auto no-scrollbar break-keep my-auto ${
                        streamerPick === 'B'
                          ? 'text-amber-300 font-black tracking-tight drop-shadow-[0_2px_12px_rgba(245,158,11,0.6)]'
                          : 'text-neutral-100'
                      }`}>
                        {currentQuestion.option_b}
                      </p>
                    </div>

                    {status === 'RESULT' && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ type: 'spring', damping: 15 }}
                        className="flex items-baseline justify-center gap-1.5 mt-1"
                      >
                        <span className="text-2xl md:text-3xl font-black text-emerald-400">
                          {percentB.toFixed(1)}%
                        </span>
                        <span className="text-xs text-neutral-400 font-extrabold">({votesB}명)</span>
                      </motion.div>
                    )}
                  </div>
                </button>
              </div>
            )}

            {/* Detailed Stats Button Revealed AFTER Streamer Pick (RESULT status) */}
            {status === 'RESULT' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="pt-2"
              >
                <button
                  onClick={() => setShowStatsModal(true)}
                  className="w-full flex items-center justify-center gap-2 rounded-2xl border border-zinc-800 bg-zinc-900/80 hover:bg-zinc-850 px-5 py-3 text-sm font-black text-neutral-200 hover:text-white transition-all shadow-md cursor-pointer"
                >
                  <BarChart3 className="h-4 w-4 text-amber-400" />
                  <span>본 질문지의 싱글 모드 상세통계</span>
                </button>
              </motion.div>
            )}
          </div>
        </main>
      )}

      {/* Streamer Host Control Panel (Exact match with PlayKiro Golden Box) */}
      {status !== 'FINISHED' && (
        <div className="w-full max-w-md mx-auto p-4 shrink-0">
          <div className="w-full bg-gradient-to-b from-amber-500/15 via-zinc-950 to-zinc-950 border-2 border-amber-400/60 shadow-[0_0_35px_rgba(245,158,11,0.25)] rounded-3xl p-5 space-y-4">
            <div className="flex items-center justify-between text-sm md:text-base font-black text-neutral-300 border-b border-amber-500/20 pb-3">
              <span className="flex items-center gap-1.5 font-black text-amber-300 text-xs md:text-sm tracking-wide bg-amber-500/10 px-3 py-1 rounded-xl border border-amber-500/30">
                👑 스트리머 조작 패널
              </span>
              
              <div className="flex items-center gap-3">
                {['VOTING', 'LOCKED'].includes(status) && (
                  <button
                    onClick={handlePassQuestion}
                    className="flex items-center gap-1 text-xs md:text-sm text-amber-400 hover:text-amber-300 font-extrabold cursor-pointer"
                    title="문제 패스 및 다음 문제"
                  >
                    <span>문제 패스</span>
                  </button>
                )}

                <button
                  onClick={() => setStatus('FINISHED')}
                  className="flex items-center gap-1 text-xs md:text-sm text-rose-400 hover:text-rose-300 font-bold cursor-pointer"
                  title="방 종료하기"
                >
                  <LogOut className="w-4 h-4" />
                  <span>방 종료</span>
                </button>
              </div>
            </div>

            {/* Phase 1: Lock Voting */}
            {status === 'VOTING' && (
              <button
                onClick={handleLockVoting}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-zinc-950 font-black text-base md:text-lg shadow-2xl hover:brightness-110 transition-all flex items-center justify-center gap-2 cursor-pointer border border-yellow-300"
              >
                <Lock className="w-5 h-5" />
                <span>시청자 투표 마감하기</span>
              </button>
            )}

            {/* Phase 2: Pick Option A or B */}
            {status === 'LOCKED' && (
              <div className="space-y-2 text-center">
                <p className="text-xs text-amber-300 font-bold">
                  👆 위의 선택지 A 또는 선택지 B 카드 중 스트리머의 진짜 취향을 직접 클릭해 주세요!
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleSelectStreamerPick('A')}
                    className="py-3 rounded-xl bg-amber-500/20 border border-amber-400 text-amber-300 font-black text-sm hover:bg-amber-500/30 transition cursor-pointer"
                  >
                    선택지 A 픽하기
                  </button>
                  <button
                    onClick={() => handleSelectStreamerPick('B')}
                    className="py-3 rounded-xl bg-emerald-500/20 border border-emerald-400 text-emerald-300 font-black text-sm hover:bg-emerald-500/30 transition cursor-pointer"
                  >
                    선택지 B 픽하기
                  </button>
                </div>
              </div>
            )}

            {/* Phase 3: Next Question */}
            {status === 'RESULT' && (
              <button
                onClick={handleNextQuestion}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-brand-yellow via-amber-400 to-yellow-500 text-zinc-950 font-black text-base md:text-lg shadow-2xl hover:brightness-110 transition-all flex items-center justify-center gap-2 cursor-pointer border border-yellow-300"
              >
                <span>다음 라운드로 이동</span>
                <ChevronRight className="w-5 h-5" />
              </button>
            )}

            {/* Test Simulator Toolbar (For Offline / Demo testing) */}
            <div className="border-t border-zinc-900 pt-3 flex items-center justify-between text-xs">
              <span className="text-neutral-400 font-bold">오프라인 테스트용:</span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => simulateTestVote('A', 'chzzk')}
                  className="px-2.5 py-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-300 font-bold hover:bg-amber-500/20 cursor-pointer"
                >
                  +1표(치지직A)
                </button>
                <button
                  onClick={() => simulateTestVote('B', 'soop')}
                  className="px-2.5 py-1.5 rounded-lg border border-blue-500/30 bg-blue-500/10 text-blue-300 font-bold hover:bg-blue-500/20 cursor-pointer"
                >
                  +1표(SOOP B)
                </button>
              </div>
            </div>

            {/* OBS Widget */}
            <div className="bg-purple-950/25 border border-purple-500/30 rounded-2xl p-3 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-purple-300">🎥 OBS / 프릭샷 오버레이 URL</span>
                <button
                  onClick={handleCopyOverlayUrl}
                  className="py-1 px-2.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-black text-[11px] transition cursor-pointer flex items-center gap-1"
                >
                  <span>복사</span>
                  {copiedOverlay ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

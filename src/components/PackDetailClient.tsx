'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Play,
  Copy,
  Check,
  Users,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  Share2,
  Lock,
  Trash2,
  Pencil,
  RotateCcw,
  Sparkles,
  Loader2,
  AlertCircle,
  X,
  Shuffle,
  Globe,
  Link2,
} from 'lucide-react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import ShareSheet from '@/components/ShareSheet';
import PlayModeSelectModal from '@/components/PlayModeSelectModal';
import {
  CustomPack,
  CustomPackQuestionStat,
  getPackCategoryBadgeClass,
  formatPackDate,
} from '@/lib/customPacks';

const formatVoteCount = (count: number) => {
  if (count >= 10000) return `${(count / 10000).toFixed(1)}만`;
  if (count >= 1000) return `${(count / 1000).toFixed(1)}천`;
  return count.toLocaleString();
};

interface PackDetailClientProps {
  pack: CustomPack;
}

export default function PackDetailClient({ pack }: PackDetailClientProps) {
  const router = useRouter();
  const [showDrawer, setShowDrawer] = useState(false);

  // Copy link feedback
  const [copied, setCopied] = useState(false);

  // Preview accordion (collapsed by default to avoid spoilers)
  const [showPreview, setShowPreview] = useState(false);

  // Single mode state
  const [singleActive, setSingleActive] = useState(false);
  const [singleIndex, setSingleIndex] = useState(0);
  const [singleChoices, setSingleChoices] = useState<('A' | 'B')[]>([]);
  const [singleFinished, setSingleFinished] = useState(false);
  const [justPicked, setJustPicked] = useState<'A' | 'B' | null>(null);
  const [showShareSheet, setShowShareSheet] = useState(false);
  const [questionStats, setQuestionStats] = useState<Record<string, CustomPackQuestionStat>>(
    () => pack.question_stats || {}
  );

  // Multi Mode Select modal (reuses PlayModeSelectModal)
  const [showPlayModeModal, setShowPlayModeModal] = useState(false);

  // PIN Room modal state
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinHostNickname, setPinHostNickname] = useState('');
  const [pinShuffle, setPinShuffle] = useState(false);
  const [creatingPin, setCreatingPin] = useState(false);
  const [pinError, setPinError] = useState('');

  // Chat Streamer modal state
  const [showChatModal, setShowChatModal] = useState(false);
  const [chatNickname, setChatNickname] = useState('');
  const [selectedPlatforms, setSelectedPlatforms] = useState<('chzzk' | 'soop')[]>([]);
  const [chzzkChannelId, setChzzkChannelId] = useState('');
  const [soopBjId, setSoopBjId] = useState('');
  const [chatShuffle, setChatShuffle] = useState(false);
  const [creatingChat, setCreatingChat] = useState(false);
  const [chatError, setChatError] = useState('');

  // Password modal for Edit / Delete
  const [manageModal, setManageModal] = useState<{ open: boolean; mode: 'edit' | 'delete' }>({
    open: false,
    mode: 'edit',
  });
  const [managePw, setManagePw] = useState('');
  const [manageLoading, setManageLoading] = useState(false);
  const [manageError, setManageError] = useState('');

  const [playCount, setPlayCount] = useState(pack.play_count);

  // Always hydrate fresh question_stats & play_count from server (bypasses Next.js client router cache)
  useEffect(() => {
    let active = true;
    fetch(`/api/packs/${encodeURIComponent(pack.code)}`, { cache: 'no-store' })
      .then((res) => res.json())
      .then((data) => {
        if (!active || !data?.success || !data.pack) return;
        if (typeof data.pack.play_count === 'number') {
          setPlayCount(data.pack.play_count);
        }
        if (data.pack.question_stats && typeof data.pack.question_stats === 'object') {
          setQuestionStats(data.pack.question_stats);
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [pack.code]);

  const getSessionId = () => {
    if (typeof window === 'undefined') return 'session_anon';
    let sid = localStorage.getItem('kiro_streamer_session_id');
    if (!sid) {
      sid = 'session_' + Math.random().toString(36).substring(2, 9);
      localStorage.setItem('kiro_streamer_session_id', sid);
    }
    return sid;
  };

  const handleCopyUrl = () => {
    if (typeof window === 'undefined') return;
    navigator.clipboard.writeText(`${window.location.origin}/packs/${pack.code}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Start Single Mode (play_count increments per played question in handleSinglePick)
  const handleStartSingle = () => {
    setSingleIndex(0);
    setSingleChoices([]);
    setSingleFinished(false);
    setJustPicked(null);
    setSingleActive(true);
  };

  const handleSinglePick = (choice: 'A' | 'B') => {
    const q = pack.questions[singleIndex];
    if (!q || justPicked) return;

    setJustPicked(choice);

    // Optimistic +1 for both play count and A/B vote stats (0ms dopamine animation)
    setPlayCount((prev) => prev + 1);
    setQuestionStats((prev) => {
      const cur = prev[q.id] || { a: 0, b: 0 };
      return {
        ...prev,
        [q.id]: {
          a: (cur.a || 0) + (choice === 'A' ? 1 : 0),
          b: (cur.b || 0) + (choice === 'B' ? 1 : 0),
        },
      };
    });

    // Persist vote & play count to DB and sync authoritative totals
    fetch(`/api/packs/${encodeURIComponent(pack.code)}/vote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        questionId: q.id,
        option: choice,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data?.success) {
          if (data.stats && typeof data.stats === 'object' && Object.keys(data.stats).length > 0) {
            setQuestionStats(data.stats);
          }
          if (typeof data.playCount === 'number') {
            setPlayCount(data.playCount);
          }
        }
      })
      .catch(() => {});
  };

  const handleSingleNext = () => {
    if (!justPicked) return;
    const nextChoices = [...singleChoices];
    nextChoices[singleIndex] = justPicked;
    setSingleChoices(nextChoices);

    if (singleIndex + 1 >= pack.questions.length) {
      setJustPicked(null);
      setSingleFinished(true);
    } else {
      const nextIdx = singleIndex + 1;
      setSingleIndex(nextIdx);
      setJustPicked(nextChoices[nextIdx] || null);
    }
  };

  const handleSinglePrev = () => {
    if (singleIndex <= 0) return;
    const prevIdx = singleIndex - 1;
    setSingleIndex(prevIdx);
    setJustPicked(singleChoices[prevIdx] || null);
  };

  // Create PIN Room with this Pack
  const handleCreatePinRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    setPinError('');
    const nick = pinHostNickname.trim();
    if (!nick) {
      setPinError('호스트 닉네임을 입력해 주세요.');
      return;
    }

    setCreatingPin(true);
    try {
      const res = await fetch('/api/streamer/create-room', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hostNickname: nick,
          hostSessionId: getSessionId(),
          roomMode: 'pin',
          packCode: pack.code,
          shuffleOrder: pinShuffle,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success || !data.pin) {
        throw new Error(data.error || '방 생성에 실패했습니다.');
      }

      setShowPinModal(false);
      router.push(`/streamer/${data.pin}`);
    } catch (err: any) {
      setPinError(err.message || '방 생성 도중 오류가 발생했습니다.');
      setCreatingPin(false);
    }
  };

  const togglePlatform = (p: 'chzzk' | 'soop') => {
    setSelectedPlatforms((prev) =>
      prev.includes(p) ? prev.filter((item) => item !== p) : [...prev, p]
    );
  };

  // Create Chat-Linked Room with this Pack
  const handleCreateChatRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    setChatError('');

    const nick = chatNickname.trim();
    if (!nick) {
      setChatError('스트리머 닉네임을 입력해 주세요.');
      return;
    }
    if (selectedPlatforms.length === 0) {
      setChatError('방송 플랫폼 연동을 최소 1개 이상 선택해 주세요.');
      return;
    }
    if (selectedPlatforms.includes('chzzk') && !chzzkChannelId.trim()) {
      setChatError('치지직 채널 URL을 입력해 주세요.');
      return;
    }
    if (selectedPlatforms.includes('soop') && !soopBjId.trim()) {
      setChatError('SOOP 생방송 URL을 입력해 주세요.');
      return;
    }
    if (selectedPlatforms.includes('soop') && soopBjId.includes('/station/')) {
      setChatError('생방송 주소 URL(예: https://play.sooplive.com/...)을 입력해 주세요.');
      return;
    }

    setCreatingChat(true);
    try {
      let chzzkData: any = null;
      let soopData: any = null;

      if (selectedPlatforms.includes('chzzk')) {
        const res = await fetch('/api/chat/connect', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ platform: 'chzzk', channelId: chzzkChannelId.trim() }),
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(`[치지직] ${data.error || '채널 정보를 확인할 수 없습니다.'}`);
        }
        chzzkData = data;
      }

      if (selectedPlatforms.includes('soop')) {
        const res = await fetch('/api/chat/connect', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ platform: 'soop', channelId: soopBjId.trim() }),
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(`[SOOP] ${data.error || 'BJ 정보를 확인할 수 없습니다.'}`);
        }
        soopData = data;
      }

      const createRes = await fetch('/api/streamer/create-room', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hostNickname: nick,
          hostSessionId: getSessionId(),
          roomMode: 'chat',
          platforms: selectedPlatforms.join(','),
          packCode: pack.code,
          shuffleOrder: chatShuffle,
        }),
      });

      const roomResult = await createRes.json();
      if (!createRes.ok || !roomResult.success || !roomResult.pin) {
        throw new Error(roomResult.error || '방 생성에 실패했습니다.');
      }

      const config = {
        pin: roomResult.pin,
        roomId: roomResult.roomId,
        nickname: nick,
        platforms: selectedPlatforms,
        chzzk: chzzkData,
        soop: soopData,
        chzzkChannelId: chzzkData?.channelId || chzzkChannelId.trim(),
        soopBjId: soopData?.channelId || soopBjId.trim(),
        categories: [pack.title],
        totalQuestions: roomResult.totalQuestions || pack.questions.length,
      };
      sessionStorage.setItem('kiro_chat_room_config', JSON.stringify(config));

      const queryParams = new URLSearchParams();
      queryParams.set('pin', roomResult.pin);
      queryParams.set('platforms', selectedPlatforms.join(','));
      if (chzzkChannelId.trim()) queryParams.set('chzzkId', chzzkData?.channelId || chzzkChannelId.trim());
      if (soopBjId.trim()) queryParams.set('soopId', soopData?.channelId || soopBjId.trim());
      queryParams.set('nickname', nick);

      setShowChatModal(false);
      router.push(`/streamer/chat?${queryParams.toString()}`);
    } catch (err: any) {
      setChatError(err.message || '채팅 연동 중 오류가 발생했습니다.');
      setCreatingChat(false);
    }
  };

  // Manage (Edit / Delete) Password Check
  const handleManageSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setManageError('');
    if (!/^\d{4}$/.test(managePw.trim())) {
      setManageError('숫자 4자리 비밀번호를 입력해 주세요.');
      return;
    }

    setManageLoading(true);
    try {
      if (manageModal.mode === 'edit') {
        const res = await fetch(`/api/packs/${encodeURIComponent(pack.code)}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password: managePw.trim(), verifyOnly: true }),
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || '비밀번호가 일치하지 않습니다.');
        }
        try {
          sessionStorage.setItem(`kiro_pack_edit_pw_${pack.code}`, managePw.trim());
        } catch {}
        router.push(`/packs/create?edit=${encodeURIComponent(pack.code)}`);
      } else {
        const res = await fetch(`/api/packs/${encodeURIComponent(pack.code)}`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password: managePw.trim() }),
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || '삭제에 실패했습니다.');
        }
        alert('밸런스질문 팩이 삭제되었습니다.');
        router.push('/#user-packs');
      }
    } catch (err: any) {
      setManageError(err.message || '오류가 발생했습니다.');
      setManageLoading(false);
    }
  };

  const currentQ = pack.questions[singleIndex];
  const hasPickedCurrent = justPicked !== null;
  const isLastQuestion = singleIndex + 1 >= pack.questions.length;

  // Official Single Mode UI (identical layout, dynamic bar & live stats to VoteClient) while solving pack questions
  if (singleActive && !singleFinished && currentQ) {
    const shareUrl =
      typeof window !== 'undefined'
        ? `${window.location.origin}/packs/${pack.code}`
        : `https://playkiro.kr/packs/${pack.code}`;

    const qStat = questionStats[currentQ.id] || { a: 0, b: 0 };
    const votesA = qStat.a || 0;
    const votesB = qStat.b || 0;
    const totalVotes = votesA + votesB;
    const percentA = totalVotes > 0 ? Number(((votesA / totalVotes) * 100).toFixed(1)) : 50.0;
    const percentB = totalVotes > 0 ? Number((100 - percentA).toFixed(1)) : 50.0;
    const displayGrowA =
      totalVotes > 0 ? Math.max(30, Math.min(70, Math.round((votesA / totalVotes) * 100))) : 50;
    const displayGrowB = 100 - displayGrowA;

    return (
      <div className="relative flex h-[100dvh] w-full max-w-md md:max-w-2xl lg:max-w-3xl mx-auto flex-col justify-between overflow-hidden bg-[#080911] bg-[radial-gradient(circle_at_top,_rgba(99,102,241,0.07),_transparent_60%)] text-white font-sans select-none">
        <Navigation
          selectedCategories={['전체']}
          onToggleCategory={() => {}}
          showDrawer={showDrawer}
          setShowDrawer={setShowDrawer}
        />

        {/* Main Dynamic Content Area (Mirrors VoteClient) */}
        <main className="flex-1 flex flex-col min-h-0 px-4 py-3 justify-between">
          {/* Game Capture Area */}
          <div
            id="game-capture-area"
            className="flex flex-col bg-[#0b0c16]/50 pt-2.5 pb-4 px-4 rounded-3xl border border-zinc-900/80 gap-2 flex-1 min-h-0"
          >
            {/* Header Row: Category, Progress & Author (Left) + Back & Share (Right) */}
            <div className="flex items-center justify-between gap-2 shrink-0">
              <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                <span
                  className={`inline-block rounded-full px-3 py-1 text-xs font-black tracking-wide border ${getPackCategoryBadgeClass(
                    pack.category
                  )}`}
                >
                  {pack.category}
                </span>
                <span className="inline-flex items-center rounded-full bg-amber-500/10 border border-amber-500/30 px-2.5 py-1 text-xs font-black text-amber-400 tracking-wide">
                  {singleIndex + 1} / {pack.questions.length}
                </span>
                {totalVotes < 10 && (
                  <span className="inline-flex items-center rounded-full bg-yellow-500/10 border border-yellow-500/30 px-2 py-0.5 text-[9px] font-black text-yellow-500 tracking-wider uppercase animate-pulse">
                    NEW
                  </span>
                )}
                <span className="hidden sm:inline-flex items-center rounded-full bg-zinc-900/80 border border-zinc-800 px-2.5 py-1 text-xs font-extrabold text-neutral-400 truncate max-w-[160px]">
                  제작: {pack.author_nickname}
                </span>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => setSingleActive(false)}
                  className="rounded-xl border border-zinc-800 bg-zinc-900/30 px-2.5 py-2 hover:bg-zinc-900 hover:text-white transition text-zinc-400 text-xs font-extrabold flex items-center gap-1 cursor-pointer"
                  title="팩 상세로 돌아가기"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">나가기</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowShareSheet(true)}
                  className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-2 hover:bg-zinc-900 hover:text-white transition text-zinc-400 shadow-sm cursor-pointer"
                  title="공유하기"
                >
                  <Share2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Question Title Header */}
            <div className="text-center py-0 shrink-0">
              <h1 className="text-2xl md:text-3xl font-kiro leading-[1.1] text-[#ffe5a9] tracking-tight whitespace-pre-line break-keep px-1">
                {currentQ.title}
              </h1>
            </div>

            {/* Voting Stack Container (Exact VoteClient Vertical A/B Stack with Live Stats) */}
            <div className="flex-grow flex flex-col gap-3 mt-3.5 min-h-0 relative">
              {/* Card Option A (Top) */}
              <motion.button
                key={`${currentQ.id}-A`}
                type="button"
                layout
                transition={{ type: 'spring', damping: 11, stiffness: 90 }}
                style={{ flexGrow: hasPickedCurrent ? displayGrowA : 50 }}
                whileTap={{ scale: hasPickedCurrent ? 1 : 0.98 }}
                disabled={hasPickedCurrent}
                onClick={() => handleSinglePick('A')}
                className={`relative flex w-full flex-col items-center justify-center overflow-hidden rounded-2xl py-3.5 px-4 transition-all duration-300 text-left border ${
                  hasPickedCurrent
                    ? justPicked === 'A'
                      ? 'bg-zinc-900/90 border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.15)]'
                      : 'bg-zinc-950/40 border-zinc-900/80 opacity-60'
                    : 'bg-zinc-900/50 border-zinc-800/80 hover:bg-zinc-900/80 hover:border-zinc-700 cursor-pointer'
                }`}
              >
                {hasPickedCurrent && justPicked === 'A' && (
                  <div className="absolute bottom-3 right-3 z-20 flex items-center gap-1 rounded-full bg-amber-500 px-2 py-0.5 text-[9px] font-black text-zinc-950 shadow-md">
                    <span>✓</span>
                    <span>선택함</span>
                  </div>
                )}

                {hasPickedCurrent && (
                  <motion.div
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                    className={`absolute inset-0 z-0 opacity-10 ${
                      justPicked === 'A' ? 'bg-amber-500' : 'bg-neutral-400'
                    }`}
                    style={{ width: `${percentA}%`, transformOrigin: 'left' }}
                  />
                )}

                <div className="relative z-10 flex flex-col items-center text-center w-full max-w-sm pointer-events-none gap-1.5">
                  <p className="text-xl md:text-2xl font-kiro leading-[1.15] text-neutral-100 max-h-24 overflow-y-auto no-scrollbar break-keep">
                    {currentQ.option_a}
                  </p>

                  <AnimatePresence>
                    {hasPickedCurrent && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ type: 'spring', damping: 15 }}
                        className="flex items-baseline justify-center gap-1.5 mt-1"
                      >
                        <span className="text-3xl md:text-4xl font-black text-amber-400">
                          {percentA.toFixed(1)}%
                        </span>
                        <span className="text-xs text-neutral-500 font-extrabold">
                          ({formatVoteCount(votesA)}명)
                        </span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.button>

              {/* Card Option B (Bottom) */}
              <motion.button
                key={`${currentQ.id}-B`}
                type="button"
                layout
                transition={{ type: 'spring', damping: 11, stiffness: 90 }}
                style={{ flexGrow: hasPickedCurrent ? displayGrowB : 50 }}
                whileTap={{ scale: hasPickedCurrent ? 1 : 0.98 }}
                disabled={hasPickedCurrent}
                onClick={() => handleSinglePick('B')}
                className={`relative flex w-full flex-col items-center justify-center overflow-hidden rounded-2xl py-3.5 px-4 transition-all duration-300 text-left border ${
                  hasPickedCurrent
                    ? justPicked === 'B'
                      ? 'bg-zinc-900/90 border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.15)]'
                      : 'bg-zinc-950/40 border-zinc-900/80 opacity-60'
                    : 'bg-zinc-900/50 border-zinc-800/80 hover:bg-zinc-900/80 hover:border-zinc-700 cursor-pointer'
                }`}
              >
                {hasPickedCurrent && justPicked === 'B' && (
                  <div className="absolute bottom-3 right-3 z-20 flex items-center gap-1 rounded-full bg-emerald-500 px-2 py-0.5 text-[9px] font-black text-zinc-950 shadow-md">
                    <span>✓</span>
                    <span>선택함</span>
                  </div>
                )}

                {hasPickedCurrent && (
                  <motion.div
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                    className={`absolute inset-0 z-0 opacity-10 ${
                      justPicked === 'B' ? 'bg-emerald-500' : 'bg-neutral-400'
                    }`}
                    style={{ width: `${percentB}%`, transformOrigin: 'left' }}
                  />
                )}

                <div className="relative z-10 flex flex-col items-center text-center w-full max-w-sm pointer-events-none gap-1.5">
                  <p className="text-xl md:text-2xl font-kiro leading-[1.15] text-neutral-100 max-h-24 overflow-y-auto no-scrollbar break-keep">
                    {currentQ.option_b}
                  </p>

                  <AnimatePresence>
                    {hasPickedCurrent && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ type: 'spring', damping: 15 }}
                        className="flex items-baseline justify-center gap-1.5 mt-1"
                      >
                        <span className="text-3xl md:text-4xl font-black text-emerald-400">
                          {percentB.toFixed(1)}%
                        </span>
                        <span className="text-xs text-neutral-500 font-extrabold">
                          ({formatVoteCount(votesB)}명)
                        </span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.button>
            </div>
          </div>

          {/* Action Controls & Navigation (Post-Pick — Mirrors VoteClient) */}
          {hasPickedCurrent && (
            <div className="h-12 shrink-0 flex items-center justify-between gap-3 mt-1.5">
              {singleIndex > 0 && (
                <motion.button
                  type="button"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  onClick={handleSinglePrev}
                  className="flex items-center justify-center gap-1 rounded-xl border border-zinc-800 bg-zinc-900/50 hover:bg-zinc-900 px-4 h-10 text-sm font-bold text-neutral-200 transition-all shadow-md cursor-pointer"
                >
                  <ArrowLeft className="h-4 w-4 text-neutral-400" /> 이전
                </motion.button>
              )}

              <motion.button
                type="button"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={handleSingleNext}
                className="flex items-center justify-center gap-1.5 rounded-xl bg-white hover:bg-neutral-200 text-zinc-950 font-extrabold px-6 h-10 text-sm transition-all flex-1 shadow-lg cursor-pointer"
              >
                {isLastQuestion ? (
                  <>
                    결과 보기 <ChevronRight className="h-4 w-4" />
                  </>
                ) : (
                  <>
                    다음 질문 <ChevronRight className="h-4 w-4" />
                  </>
                )}
              </motion.button>
            </div>
          )}
        </main>

        {/* Compact Footer matching VoteClient */}
        <footer className="w-full pt-2 pb-2 shrink-0 text-center flex flex-col items-center gap-1 mt-0">
          <div className="flex items-center justify-center gap-3 text-[10px] text-neutral-500 font-extrabold">
            <Link href="/privacy" target="_blank" rel="noopener noreferrer" className="hover:text-neutral-350 transition-all">
              개인정보처리방침
            </Link>
            <span className="text-zinc-800">|</span>
            <Link href="/terms" target="_blank" rel="noopener noreferrer" className="hover:text-neutral-350 transition-all">
              이용약관
            </Link>
            <span className="text-zinc-800">|</span>
            <a href="mailto:auroranest.official@gmail.com" className="hover:text-neutral-350 transition-all">
              문의하기
            </a>
            <span className="text-zinc-800">|</span>
            <a
              href="https://fairy.hada.io/@playkiro"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-neutral-350 transition-all"
            >
              후원하기
            </a>
          </div>
          <p className="text-[9px] text-neutral-650">Copyright © 2026 AuroraNest. All rights reserved.</p>
        </footer>

        <AnimatePresence>
          {showShareSheet && (
            <ShareSheet
              onClose={() => setShowShareSheet(false)}
              shareUrl={shareUrl}
              questionTitle={`${pack.title} — ${currentQ.title}`}
            />
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className="flex h-[100dvh] w-full flex-col overflow-y-auto overflow-x-hidden bg-[#080911] bg-[radial-gradient(circle_at_top,_rgba(99,102,241,0.08),_transparent_55%)] text-white font-sans">
      <div className="shrink-0">
        <Navigation
          selectedCategories={['전체']}
          onToggleCategory={() => {}}
          showDrawer={showDrawer}
          setShowDrawer={setShowDrawer}
        />
      </div>

      <main className="flex-1 w-full max-w-3xl mx-auto px-4 sm:px-6 py-7 md:py-10 space-y-6">
        {/* Top Breadcrumb */}
        <div className="flex items-center justify-between gap-2">
          {singleActive ? (
            <button
              type="button"
              onClick={() => setSingleActive(false)}
              className="inline-flex items-center gap-1.5 text-xs font-extrabold text-neutral-400 hover:text-amber-400 transition-colors cursor-pointer"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>팩 상세로 돌아가기</span>
            </button>
          ) : (
            <Link
              href="/#user-packs"
              className="inline-flex items-center gap-1.5 text-xs font-extrabold text-neutral-400 hover:text-amber-400 transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>밸런스게임 목록</span>
            </Link>
          )}

          {!singleActive && (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleCopyUrl}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-amber-500/40 text-xs font-extrabold text-neutral-200 hover:text-amber-400 transition cursor-pointer"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                <span>{copied ? '링크 복사됨' : '링크 복사'}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setManagePw('');
                  setManageError('');
                  setManageModal({ open: true, mode: 'edit' });
                }}
                title="수정"
                className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-neutral-400 hover:text-white transition cursor-pointer"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => {
                  setManagePw('');
                  setManageError('');
                  setManageModal({ open: true, mode: 'delete' });
                }}
                title="삭제"
                className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-rose-500/40 text-neutral-400 hover:text-rose-400 transition cursor-pointer"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* MODE A: Single Player Completion Summary */}
        {singleActive && singleFinished ? (
            <motion.section
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-3xl border border-zinc-800 bg-zinc-900/50 p-6 md:p-8 space-y-6 shadow-xl"
            >
              <div className="text-center space-y-2">
                <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 px-3.5 py-1 text-xs font-black text-amber-400">
                  <Sparkles className="h-3.5 w-3.5" /> 완주 완료!
                </div>
                <h2 className="text-xl md:text-2xl font-black text-neutral-100 break-keep">
                  {pack.title}
                </h2>
                <p className="text-xs text-neutral-400 font-bold">
                  총 {pack.questions.length}개의 기로를 모두 선택했어요. 친구나 연인에게도 링크를 보내 비교해보세요!
                </p>
              </div>

              {/* Summary List */}
              <div className="space-y-2.5 max-h-[48vh] overflow-y-auto pr-1 no-scrollbar">
                {pack.questions.map((q, idx) => {
                  const picked = singleChoices[idx];
                  const st = questionStats[q.id] || { a: 0, b: 0 };
                  const sum = (st.a || 0) + (st.b || 0);
                  const pctA = sum > 0 ? Math.round(((st.a || 0) / sum) * 100) : 50;
                  const pctB = sum > 0 ? 100 - pctA : 50;
                  return (
                    <div
                      key={q.id}
                      className="rounded-2xl border border-zinc-800/80 bg-zinc-950/60 p-3.5 space-y-1.5"
                    >
                      <div className="flex items-center justify-between gap-2 text-[11px] font-extrabold text-neutral-500">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-amber-400 shrink-0">Q{idx + 1}</span>
                          <span className="truncate">{q.title}</span>
                        </div>
                        {sum > 0 && (
                          <span className="text-[10px] text-neutral-500 shrink-0">
                            {formatVoteCount(sum)}명 참여
                          </span>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs font-black">
                        <div
                          className={`rounded-xl px-3 py-2 border transition flex items-center justify-between gap-1.5 ${
                            picked === 'A'
                              ? 'border-amber-400 bg-amber-500/15 text-amber-300'
                              : 'border-zinc-800/80 bg-zinc-900/40 text-neutral-500 opacity-65'
                          }`}
                        >
                          <span className="truncate">
                            {picked === 'A' ? '✓ ' : ''}
                            {q.option_a}
                          </span>
                          {sum > 0 && <span className="text-[10px] shrink-0 font-black">{pctA}%</span>}
                        </div>
                        <div
                          className={`rounded-xl px-3 py-2 border transition flex items-center justify-between gap-1.5 ${
                            picked === 'B'
                              ? 'border-emerald-400 bg-emerald-500/15 text-emerald-300'
                              : 'border-zinc-800/80 bg-zinc-900/40 text-neutral-500 opacity-65'
                          }`}
                        >
                          <span className="truncate">
                            {picked === 'B' ? '✓ ' : ''}
                            {q.option_b}
                          </span>
                          {sum > 0 && <span className="text-[10px] shrink-0 font-black">{pctB}%</span>}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={handleCopyUrl}
                  className="py-3.5 rounded-2xl bg-brand-yellow hover:bg-[#e0b240] text-zinc-950 font-black text-sm flex items-center justify-center gap-1.5 cursor-pointer transition"
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  <span>{copied ? '공유 링크 복사 완료!' : '친구에게 이 팩 공유하기'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleStartSingle}
                  className="py-3.5 rounded-2xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-neutral-100 font-black text-sm flex items-center justify-center gap-1.5 cursor-pointer transition"
                >
                  <RotateCcw className="h-4 w-4" />
                  <span>처음부터 다시 풀기</span>
                </button>
              </div>
            </motion.section>
        ) : (
          /* MODE B: Pack Detail Overview */
          <>
            {/* Pack Hero Card */}
            <section className="rounded-3xl border border-zinc-800/90 bg-zinc-900/45 p-6 md:p-8 space-y-5 shadow-xl">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`text-[11px] font-black px-2.5 py-0.5 rounded-md border ${getPackCategoryBadgeClass(
                      pack.category
                    )}`}
                  >
                    {pack.category}
                  </span>
                  <span className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-md bg-zinc-800/80 text-neutral-300 border border-zinc-700/70">
                    총 {pack.question_count}문제
                  </span>
                  <span className="inline-flex items-center gap-1 text-[11px] font-extrabold px-2.5 py-0.5 rounded-md bg-zinc-800/80 text-neutral-400 border border-zinc-700/70">
                    {pack.is_public ? (
                      <>
                        <Globe className="h-3 w-3 text-emerald-400" /> 전체 공개
                      </>
                    ) : (
                      <>
                        <Link2 className="h-3 w-3 text-amber-400" /> 링크 공유 전용
                      </>
                    )}
                  </span>
                </div>

                <span className="inline-flex items-center gap-1 text-xs font-extrabold text-neutral-400">
                  <Play className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
                  <span>{playCount.toLocaleString()}회 플레이</span>
                </span>
              </div>

              <div className="space-y-2">
                <h1 className="text-2xl md:text-3xl font-black text-neutral-100 leading-snug break-keep">
                  {pack.title}
                </h1>
                {pack.description && (
                  <p className="text-xs md:text-sm text-neutral-400 leading-relaxed break-keep">
                    {pack.description}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2 text-xs text-neutral-500 font-bold pt-1">
                <span>제작자: <strong className="text-neutral-300">{pack.author_nickname}</strong></span>
                <span>·</span>
                <span>{formatPackDate(pack.created_at)}</span>
              </div>

              {/* 2 Clean Play Mode Launchers (Single + Multi reusing PlayModeSelectModal) */}
              <div className="pt-3 border-t border-zinc-800/70 space-y-3">
                <button
                  type="button"
                  onClick={handleStartSingle}
                  className="w-full py-4 rounded-2xl bg-brand-yellow hover:bg-[#e0b240] text-zinc-950 font-black text-sm md:text-base shadow-[0_0_28px_rgba(245,195,82,0.28)] transition-all hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>👤 이 팩으로 혼자 플레이하기 (싱글모드)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowPlayModeModal(true)}
                  className="w-full py-4 rounded-2xl bg-zinc-900 border border-zinc-700 hover:bg-zinc-800 text-white font-black text-sm md:text-base transition-all hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>📺 이 팩으로 함께 플레이하기 (멀티모드)</span>
                </button>
              </div>
            </section>

            {/* Collapsible Question Preview (Spoiler Protected) */}
            <section className="rounded-3xl border border-zinc-800/80 bg-zinc-900/30 overflow-hidden">
              <button
                type="button"
                onClick={() => setShowPreview((prev) => !prev)}
                className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-zinc-900/60 transition cursor-pointer"
              >
                <div className="space-y-1">
                  <div className="text-base md:text-lg font-black text-neutral-200">
                    수록된 질문 미리보기 ({pack.questions.length}문제)
                  </div>
                  <p className="text-sm md:text-base text-neutral-500 font-bold break-keep">
                    스포일러 방지를 위해 접혀 있습니다. 사전 확인이 필요할 때 열어보세요.
                  </p>
                </div>
                {showPreview ? (
                  <ChevronUp className="h-5 w-5 text-neutral-400 shrink-0" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-neutral-400 shrink-0" />
                )}
              </button>

              <AnimatePresence initial={false}>
                {showPreview && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="border-t border-zinc-800/70 px-5 py-4 space-y-2.5"
                  >
                    {pack.questions.map((q, idx) => (
                      <div
                        key={q.id}
                        className="rounded-xl bg-zinc-950/60 border border-zinc-800/70 px-4 py-3 space-y-1.5"
                      >
                        <div className="text-[11px] font-bold text-neutral-400">
                          <span className="text-amber-400 font-black mr-1.5">Q{idx + 1}.</span>
                          {q.title}
                        </div>
                        <div className="flex flex-wrap items-center gap-2 text-xs font-extrabold">
                          <span className="text-amber-400">{q.option_a}</span>
                          <span className="text-[10px] text-neutral-500 font-black">VS</span>
                          <span className="text-emerald-400">{q.option_b}</span>
                        </div>
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </section>
          </>
        )}
      </main>

      <div className="shrink-0 mt-auto">
        <Footer />
      </div>

      {/* Modal 0: Reuse Existing Multi-Mode Selection Popup */}
      <PlayModeSelectModal
        isOpen={showPlayModeModal}
        onClose={() => setShowPlayModeModal(false)}
        onSelectChatIntegration={() => {
          setShowPlayModeModal(false);
          setChatError('');
          setShowChatModal(true);
        }}
        onSelectDirectJoin={() => {
          setShowPlayModeModal(false);
          setPinError('');
          setShowPinModal(true);
        }}
      />

      {/* Modal 1: Create PIN Room with this Pack */}
      <AnimatePresence>
        {showPinModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowPinModal(false)}
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 12 }}
              className="relative z-10 w-full max-w-md rounded-3xl border border-zinc-800 bg-[#0d0e1d] p-6 shadow-2xl space-y-4"
            >
              <button
                type="button"
                onClick={() => setShowPinModal(false)}
                className="absolute top-5 right-5 p-2 rounded-full bg-zinc-900 text-neutral-400 hover:text-white cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="space-y-1 pr-8">
                <span className="text-[11px] font-black text-amber-400">나만의 밸런스질문 팩 · 방 만들기</span>
                <h3 className="text-lg font-black text-white leading-snug break-keep">{pack.title}</h3>
                <p className="text-xs text-neutral-400">
                  이 팩의 {pack.questions.length}문제로 친구·연인·게스트가 PIN 코드로 입장하는 방을 개설합니다.
                </p>
              </div>

              {pinError && (
                <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-400 font-bold flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{pinError}</span>
                </div>
              )}

              <form onSubmit={handleCreatePinRoom} className="space-y-4">
                <div>
                  <label className="block text-xs font-extrabold text-neutral-300 mb-1.5">
                    호스트 닉네임
                  </label>
                  <input
                    type="text"
                    maxLength={20}
                    value={pinHostNickname}
                    onChange={(e) => setPinHostNickname(e.target.value)}
                    placeholder="본인 닉네임을 입력하세요."
                    className="w-full rounded-xl bg-zinc-900 border border-zinc-800 px-4 py-3 text-sm font-bold text-white placeholder-neutral-500 focus:outline-none focus:border-amber-400"
                  />
                </div>

                <label className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900/60 px-3.5 py-2.5 cursor-pointer">
                  <span className="flex items-center gap-2 text-xs font-bold text-neutral-300">
                    <Shuffle className="h-3.5 w-3.5 text-amber-400" />
                    질문 순서를 무작위로 섞기
                  </span>
                  <input
                    type="checkbox"
                    checked={pinShuffle}
                    onChange={(e) => setPinShuffle(e.target.checked)}
                    className="h-4 w-4 accent-amber-400"
                  />
                </label>

                <button
                  type="submit"
                  disabled={creatingPin}
                  className="w-full py-3.5 rounded-xl bg-brand-yellow hover:bg-[#e0b240] text-zinc-950 font-black text-sm flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {creatingPin ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>방 생성 중...</span>
                    </>
                  ) : (
                    <span>방 만들기 & PIN 발급</span>
                  )}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal 2: Create Chat-Linked Room with this Pack */}
      <AnimatePresence>
        {showChatModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowChatModal(false)}
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 12 }}
              className="relative z-10 w-full max-w-md max-h-[90vh] overflow-y-auto rounded-3xl border border-zinc-800 bg-[#0d0e1d] p-6 shadow-2xl space-y-4 no-scrollbar"
            >
              <button
                type="button"
                onClick={() => setShowChatModal(false)}
                className="absolute top-5 right-5 p-2 rounded-full bg-zinc-900 text-neutral-400 hover:text-white cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="space-y-1 pr-8">
                <span className="text-[11px] font-black text-purple-400">나만의 밸런스질문 팩 · 채팅 연동 방송</span>
                <h3 className="text-lg font-black text-white leading-snug break-keep">{pack.title}</h3>
                <p className="text-xs text-neutral-400">
                  이 팩의 {pack.questions.length}문제로 치지직/SOOP 채팅 투표(!1, !2)를 바로 진행합니다.
                </p>
              </div>

              {chatError && (
                <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-400 font-bold flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{chatError}</span>
                </div>
              )}

              <form onSubmit={handleCreateChatRoom} className="space-y-4">
                <div>
                  <label className="block text-xs font-extrabold text-neutral-300 mb-1.5">
                    스트리머 닉네임
                  </label>
                  <input
                    type="text"
                    value={chatNickname}
                    onChange={(e) => setChatNickname(e.target.value)}
                    placeholder="방송 화면에 표시할 닉네임"
                    className="w-full rounded-xl bg-zinc-900 border border-zinc-800 px-4 py-2.5 text-xs md:text-sm font-bold text-white placeholder-neutral-500 focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-neutral-300 mb-2">
                    방송 플랫폼 연동 (복수 선택 가능)
                  </label>
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <button
                      type="button"
                      onClick={() => togglePlatform('chzzk')}
                      className={`py-2.5 px-3 rounded-xl text-xs font-black border transition cursor-pointer flex items-center justify-between ${
                        selectedPlatforms.includes('chzzk')
                          ? 'border-emerald-500 bg-emerald-500/15 text-emerald-300'
                          : 'border-zinc-800 bg-zinc-900 text-neutral-400'
                      }`}
                    >
                      <span>치지직</span>
                      {selectedPlatforms.includes('chzzk') && <Check className="h-4 w-4 text-emerald-400" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => togglePlatform('soop')}
                      className={`py-2.5 px-3 rounded-xl text-xs font-black border transition cursor-pointer flex items-center justify-between ${
                        selectedPlatforms.includes('soop')
                          ? 'border-blue-500 bg-blue-500/15 text-blue-300'
                          : 'border-zinc-800 bg-zinc-900 text-neutral-400'
                      }`}
                    >
                      <span>숲(SOOP)</span>
                      {selectedPlatforms.includes('soop') && <Check className="h-4 w-4 text-blue-400" />}
                    </button>
                  </div>

                  <div className="space-y-2.5">
                    {selectedPlatforms.includes('chzzk') && (
                      <input
                        type="text"
                        value={chzzkChannelId}
                        onChange={(e) => setChzzkChannelId(e.target.value)}
                        placeholder="치지직 채널 URL (예: https://chzzk.naver.com/...)"
                        className="w-full rounded-xl bg-zinc-900 border border-emerald-500/30 px-3.5 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500"
                      />
                    )}
                    {selectedPlatforms.includes('soop') && (
                      <input
                        type="text"
                        value={soopBjId}
                        onChange={(e) => setSoopBjId(e.target.value)}
                        placeholder="SOOP 생방송 URL (예: https://play.sooplive.com/...)"
                        className="w-full rounded-xl bg-zinc-900 border border-blue-500/30 px-3.5 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-blue-500"
                      />
                    )}
                  </div>
                </div>

                <label className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900/60 px-3.5 py-2.5 cursor-pointer">
                  <span className="flex items-center gap-2 text-xs font-bold text-neutral-300">
                    <Shuffle className="h-3.5 w-3.5 text-purple-400" />
                    질문 순서를 무작위로 섞기
                  </span>
                  <input
                    type="checkbox"
                    checked={chatShuffle}
                    onChange={(e) => setChatShuffle(e.target.checked)}
                    className="h-4 w-4 accent-purple-500"
                  />
                </label>

                <button
                  type="submit"
                  disabled={creatingChat}
                  className="w-full py-3.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-black text-sm flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {creatingChat ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>방송 연동 중...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      <span>채팅 연동 게임 시작</span>
                    </>
                  )}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal 3: Password Verification for Edit / Delete */}
      <AnimatePresence>
        {manageModal.open && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setManageModal({ open: false, mode: 'edit' })}
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 12 }}
              className="relative z-10 w-full max-w-sm rounded-3xl border border-zinc-800 bg-[#0d0e1d] p-6 shadow-2xl space-y-4"
            >
              <button
                type="button"
                onClick={() => setManageModal({ open: false, mode: 'edit' })}
                className="absolute top-5 right-5 p-2 rounded-full bg-zinc-900 text-neutral-400 hover:text-white cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400">
                  <Lock className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">
                    {manageModal.mode === 'edit' ? '밸런스질문 팩 수정하기' : '밸런스질문 팩 삭제하기'}
                  </h3>
                  <p className="text-xs text-neutral-400">
                    생성 시 설정한 숫자 4자리 비밀번호를 입력해 주세요.
                  </p>
                </div>
              </div>

              {manageError && (
                <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-400 font-bold">
                  {manageError}
                </div>
              )}

              <form onSubmit={handleManageSubmit} className="space-y-3">
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={4}
                  value={managePw}
                  onChange={(e) => setManagePw(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="비밀번호 4자리"
                  className="w-full rounded-xl bg-zinc-900 border border-zinc-800 px-4 py-3 text-center text-lg font-black tracking-[0.4em] text-white placeholder-neutral-500 focus:outline-none focus:border-amber-400"
                />

                <button
                  type="submit"
                  disabled={manageLoading}
                  className={`w-full py-3 rounded-xl font-black text-sm transition cursor-pointer disabled:opacity-50 ${
                    manageModal.mode === 'delete'
                      ? 'bg-rose-600 hover:bg-rose-500 text-white'
                      : 'bg-brand-yellow hover:bg-[#e0b240] text-zinc-950'
                  }`}
                >
                  {manageLoading
                    ? '확인 중...'
                    : manageModal.mode === 'edit'
                      ? '비밀번호 확인 후 수정'
                      : '팩 영구 삭제하기'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

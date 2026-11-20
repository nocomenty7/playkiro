'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Play } from 'lucide-react';
import Navigation from '../components/Navigation';
import StreamerModal from '../components/StreamerModal';
import NoticePopup from '../components/NoticePopup';
import PlayModeSelectModal from '../components/PlayModeSelectModal';
import SingleCategoryModal from '../components/SingleCategoryModal';
import ChatStreamerModal from '../components/ChatStreamerModal';
import TotalVotesCounter from '../components/TotalVotesCounter';
import UserPacksSection from '../components/UserPacksSection';
import Footer from '../components/Footer';

function LandingClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const q = searchParams.get('q');

  const [showDrawer, setShowDrawer] = useState(false);
  const [showBasicOptions, setShowBasicOptions] = useState(false);
  const [showStreamerModal, setShowStreamerModal] = useState(false);
  const [showPlayModeModal, setShowPlayModeModal] = useState(false);
  const [showSingleCategoryModal, setShowSingleCategoryModal] = useState(false);
  const [showChatStreamerModal, setShowChatStreamerModal] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);

  const [selectedCategories, setSelectedCategories] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('kiro_filter_categories');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          return ['전체'];
        }
      }
    }
    return ['전체'];
  });

  // Backwards compatibility: Redirect shared urls to /play
  useEffect(() => {
    if (q) {
      router.replace(`/play?q=${q}`);
    }
  }, [q, router]);

  const updateSelectedCategories = (cats: string[]) => {
    setSelectedCategories(cats);
    localStorage.setItem('kiro_filter_categories', JSON.stringify(cats));
  };

  const onToggleCategoryWrapper = (catName: string) => {
    let next: string[] = [];
    if (catName === '전체') {
      next = ['전체'];
    } else {
      const activeWithoutAll = selectedCategories.filter((c) => c !== '전체');
      if (activeWithoutAll.includes(catName)) {
        next = activeWithoutAll.filter((c) => c !== catName);
        if (next.length === 0) next = ['전체'];
      } else {
        next = [...activeWithoutAll, catName];
      }
    }
    updateSelectedCategories(next);
  };

  // Sample dilemmas for the infinite marquee animation
  const sampleDilemmasRow1 = [
    { a: '평생 두통', b: '평생 치통', cat: '극한 밸런스게임' },
    { a: '10년 전으로 복귀', b: '10억 받기', cat: '돈' },
    { a: '재입대하기', b: '모든 기기 환불하기', cat: '극한 밸런스게임' },
    { a: '투명인간 되기', b: '시간추월 가능하기', cat: '상상' },
    { a: '평생 사과만 먹기', b: '평생 바나나만 먹기', cat: '음식' },
  ];

  const sampleDilemmasRow2 = [
    { a: '연인과 매일 연락', b: '주 1회 연락', cat: '관계' },
    { a: '여름만 10년', b: '겨울만 10년', cat: '일상' },
    { a: '삭발로 살기', b: '장발로 살기', cat: '스타일' },
    { a: '평생 독서', b: '평생 운동', cat: '여가' },
    { a: '민초 고수', b: '반민초 파', cat: '음식' },
  ];

  return (
    <div className="relative h-[100dvh] overflow-y-auto w-full mx-auto flex flex-col justify-between overflow-x-hidden bg-[#080911] bg-[radial-gradient(circle_at_top,_rgba(99,102,241,0.1),_transparent_60%)] text-white font-sans">
      <Navigation
        selectedCategories={selectedCategories}
        onToggleCategory={onToggleCategoryWrapper}
        showDrawer={showDrawer}
        setShowDrawer={setShowDrawer}
      />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col px-4 sm:px-6 py-8 md:py-10 space-y-10 md:space-y-12 max-w-xl md:max-w-4xl lg:max-w-6xl mx-auto w-full">
        {/* Hero Section (Official PlayKiro Basic Questions) */}
        <section className="text-center space-y-5 pt-1 md:pt-4">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-4 py-1 text-xs font-black text-emerald-455 tracking-wider uppercase"
          >
            <Sparkles className="h-3.5 w-3.5" /> 평소 생각지 못했던 대화소재가 한가득
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            className="text-3xl md:text-4xl lg:text-5xl font-kiro leading-snug tracking-tight text-neutral-100 px-2 break-keep"
          >
            내 <span className="text-brand-yellow">취향</span>은 어느 쪽?
            <br />
            끝없는 밸런스게임, <span className="text-brand-yellow font-['MaruBuriBold']">&apos;기로&apos;</span>
          </motion.h1>

          {/* Key Value Props */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12 }}
            className="flex flex-col sm:flex-row flex-wrap items-center justify-center gap-2 sm:gap-5 text-xs sm:text-sm font-extrabold text-neutral-300"
          >
            <span className="flex items-center gap-1">⚡️ 가입없이 0초 실행</span>
            <span className="flex items-center gap-1">🔒 100% 익명 통계</span>
            <span className="flex items-center gap-1">🔥 1,000+ 양자택일 선택지</span>
            <span className="flex items-center gap-1">🔁 중복문제 없이 플레이</span>
          </motion.div>

          {/* Dynamic Infinite Marquee */}
          <div className="w-full overflow-hidden space-y-3.5 py-2.5 relative">
            <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-[#080911] to-transparent z-10 pointer-events-none" />
            <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-[#080911] to-transparent z-10 pointer-events-none" />

            {/* Row 1 - Slide Left */}
            <div
              className="flex gap-4 animate-marquee whitespace-nowrap"
              style={{ animationPlayState: showDrawer ? 'paused' : 'running' }}
            >
              {[...sampleDilemmasRow1, ...sampleDilemmasRow1].map((dil, idx) => (
                <div
                  key={idx}
                  className="inline-flex items-center gap-2 rounded-2xl border border-zinc-900 bg-zinc-950/60 px-4 py-2.5 text-xs md:text-sm font-extrabold text-neutral-200 shadow-md"
                >
                  <span className="text-zinc-500 font-normal">{dil.cat}</span>
                  <span className="text-amber-400">{dil.a}</span>
                  <span className="text-zinc-650 px-1">VS</span>
                  <span className="text-emerald-400">{dil.b}</span>
                </div>
              ))}
            </div>

            {/* Row 2 - Slide Right */}
            <div
              className="flex gap-4 animate-marquee-reverse whitespace-nowrap"
              style={{ animationPlayState: showDrawer ? 'paused' : 'running' }}
            >
              {[...sampleDilemmasRow2, ...sampleDilemmasRow2].map((dil, idx) => (
                <div
                  key={idx}
                  className="inline-flex items-center gap-2 rounded-2xl border border-zinc-900 bg-zinc-950/60 px-4 py-2.5 text-xs md:text-sm font-extrabold text-neutral-200 shadow-md"
                >
                  <span className="text-zinc-500 font-normal">{dil.cat}</span>
                  <span className="text-amber-400">{dil.a}</span>
                  <span className="text-zinc-650 px-1">VS</span>
                  <span className="text-emerald-400">{dil.b}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Primary CTA -> Expands inline into Single / Multi (no double popup) */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.16 }}
            className="pt-1 max-w-sm md:max-w-md mx-auto space-y-3 relative"
          >
            <TotalVotesCounter />
            <AnimatePresence mode="wait" initial={false}>
              {!showBasicOptions ? (
                <motion.button
                  key="basic-trigger"
                  type="button"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.18 }}
                  onClick={() => setShowBasicOptions(true)}
                  className="w-full flex items-center justify-center gap-2.5 rounded-2xl bg-brand-yellow hover:bg-[#e0b240] text-zinc-950 font-black text-base md:text-lg px-6 h-14 shadow-[0_0_32px_rgba(245,195,82,0.32)] transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                >
                  <Play className="w-5 h-5 fill-zinc-950" />
                  <span>기본 문제로 바로 플레이하기</span>
                </motion.button>
              ) : (
                <motion.div
                  key="basic-choices"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-3"
                >
                  <button
                    type="button"
                    onClick={() => setShowSingleCategoryModal(true)}
                    className="w-full flex items-center justify-center gap-2 rounded-2xl bg-brand-yellow hover:bg-[#e0b240] text-zinc-950 font-black text-base px-6 h-14 shadow-[0_0_30px_rgba(245,195,82,0.3)] transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                  >
                    <span>👤 혼자 플레이하기 (싱글모드)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowPlayModeModal(true)}
                    className="w-full flex items-center justify-center gap-2 rounded-2xl bg-zinc-900 border border-zinc-700 hover:bg-zinc-800 text-white font-black text-base px-6 h-14 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                  >
                    <span>📺 함께 플레이하기 (멀티모드)</span>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </section>

        {/* Clear Section Divider */}
        <div className="relative flex items-center justify-center py-1">
          <div className="w-full border-t-2 border-zinc-800/80" />
          <span className="shrink-0 mx-4 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-[11px] font-black text-neutral-400 tracking-wider">
            COMMUNITY PACKS
          </span>
          <div className="w-full border-t-2 border-zinc-800/80" />
        </div>

        {/* User-Created Balance Game Packs Feed (16 per batch + Load More) */}
        <UserPacksSection />
      </main>

      {/* Global Trust Footer */}
      <Footer />

      {/* Fullscreen Loading Overlay for instant feedback */}
      <AnimatePresence>
        {isNavigating && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-[#080911] flex flex-col items-center justify-center space-y-4"
          >
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-t-transparent border-neutral-700" />
            <p className="text-base font-semibold text-neutral-450">질문을 불러오고 있습니다...</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Play Mode Selection Modal (Chat Integration vs Room PIN) */}
      <PlayModeSelectModal
        isOpen={showPlayModeModal}
        onClose={() => setShowPlayModeModal(false)}
        onSelectDirectJoin={() => {
          setShowPlayModeModal(false);
          setShowStreamerModal(true);
        }}
        onSelectChatIntegration={() => {
          setShowPlayModeModal(false);
          setShowChatStreamerModal(true);
        }}
      />

      {/* Chat Streamer Setup Modal */}
      <ChatStreamerModal
        isOpen={showChatStreamerModal}
        onClose={() => setShowChatStreamerModal(false)}
      />

      {/* Single Mode Category Selection Modal */}
      <SingleCategoryModal
        isOpen={showSingleCategoryModal}
        onClose={() => setShowSingleCategoryModal(false)}
        onStartGame={(selectedCats) => {
          setSelectedCategories(selectedCats);
          setShowSingleCategoryModal(false);
          setIsNavigating(true);
          router.push('/play');
        }}
      />

      {/* Streamer Mode Creation/Join Modal */}
      <StreamerModal
        isOpen={showStreamerModal}
        onClose={() => setShowStreamerModal(false)}
      />

      {/* Main page notice popup */}
      <NoticePopup />
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#080911]" />}>
      <LandingClient />
    </Suspense>
  );
}

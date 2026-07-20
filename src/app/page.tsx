'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Trophy, Users, ShieldAlert, BrainCircuit, BarChart3, Loader2 } from 'lucide-react';
import Navigation from '../components/Navigation';
import StreamerModal from '../components/StreamerModal';

function LandingClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const q = searchParams.get('q');

  const [showDrawer, setShowDrawer] = useState(false);
  const [showStreamerModal, setShowStreamerModal] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('kiro_filter_categories');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {}
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

  const handleStartGame = () => {
    setIsNavigating(true);
    router.push('/play');
  };

  // Sample dilemmas for the premium infinite marquee animation
  const sampleDilemmasRow1 = [
    { a: "평생 두통", b: "평생 치통", cat: "극한 밸런스게임" },
    { a: "로또 10억 일시불", b: "연금 월 500만원", cat: "돈" },
    { a: "100% 확률로 1억", b: "50% 확률로 100억", cat: "돈" },
    { a: "스마트폰 평생 사용 금지", b: "해외여행 평생 금지", cat: "여가" },
    { a: "매일 짜장면 먹기", b: "매일 짬뽕 먹기", cat: "음식" }
  ];

  const sampleDilemmasRow2 = [
    { a: "사막에서 패딩 입기", b: "남극에서 반팔 입기", cat: "극한 밸런스게임" },
    { a: "모든 과거 기억 잃기", b: "모든 미래 예견하기", cat: "상상" },
    { a: "매일 카톡 100개 연인", b: "일주일 무연락 연인", cat: "관계" },
    { a: "완벽한 민머리", b: "평생 더벅머리", cat: "스타일" },
    { a: "하루종일 침대 속", b: "하루종일 야외 모험", cat: "일상" }
  ];

  return (
    <div className="relative h-[100dvh] overflow-y-auto w-full max-w-2xl mx-auto flex flex-col justify-between overflow-x-hidden bg-[#080911] bg-[radial-gradient(circle_at_top,_rgba(99,102,241,0.1),_transparent_60%)] text-white font-sans">
      
      <Navigation
        selectedCategories={selectedCategories}
        onToggleCategory={onToggleCategoryWrapper}
        showDrawer={showDrawer}
        setShowDrawer={setShowDrawer}
      />

      {/* Main Spacious Content Area */}
      <main className="flex-1 flex flex-col px-6 py-12 space-y-16">
        
        {/* Hero Section */}
        <section className="text-center space-y-6 pt-4">
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-4 py-1 text-xs font-black text-emerald-455 tracking-wider uppercase"
          >
            <Sparkles className="h-3.5 w-3.5" /> 별도의 회원가입 · 로그인 없이 즉시 플레이
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-3xl md:text-4xl lg:text-5xl font-kiro leading-snug tracking-tight text-neutral-100 px-2 break-keep"
          >
            내 <span className="text-brand-yellow">취향</span>은 어느 쪽?
            <br />
            끝없는 밸런스게임, <span className="text-brand-yellow font-['MaruBuriBold']">'기로'</span>
          </motion.h1>

          {/* Modern SaaS Value Propositions (Stacked Vertically) */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="flex flex-col items-center justify-center gap-2 text-sm font-extrabold text-neutral-300"
          >
            <span className="flex items-center gap-1">⚡️ 가입없이 0초 실행</span>
            <span className="flex items-center gap-1">🔒 100% 익명 통계</span>
            <span className="flex items-center gap-1">🔥 200+ 양자택일 선택지</span>
          </motion.div>

          {/* Dynamic Infinite Marquee Section (Moved Up to create Marquee -> CTA order) */}
          <div className="w-full overflow-hidden space-y-4 py-4 relative">
            <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-[#080911] to-transparent z-10 pointer-events-none" />
            <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-[#080911] to-transparent z-10 pointer-events-none" />

            {/* Row 1 - Slide Left */}
            <div 
              className="flex gap-4 animate-marquee whitespace-nowrap"
              style={{ animationPlayState: showDrawer ? 'paused' : 'running' }}
            >
              {[...sampleDilemmasRow1, ...sampleDilemmasRow1].map((dil, idx) => (
                <div key={idx} className="inline-flex items-center gap-2 rounded-2xl border border-zinc-900 bg-zinc-950/60 px-4 py-3 text-xs md:text-sm font-extrabold text-neutral-200 shadow-md">
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
                <div key={idx} className="inline-flex items-center gap-2 rounded-2xl border border-zinc-900 bg-zinc-950/60 px-4 py-3 text-xs md:text-sm font-extrabold text-neutral-200 shadow-md">
                  <span className="text-zinc-500 font-normal">{dil.cat}</span>
                  <span className="text-amber-400">{dil.a}</span>
                  <span className="text-zinc-650 px-1">VS</span>
                  <span className="text-emerald-400">{dil.b}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Primary CTA - Mode Split */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="pt-2 max-w-sm mx-auto space-y-3"
          >
            <button
              onClick={handleStartGame}
              className="w-full flex items-center justify-center gap-2 rounded-2xl bg-brand-yellow hover:bg-[#e0b240] text-zinc-950 font-black text-base px-6 h-14 shadow-[0_0_30px_rgba(245,195,82,0.3)] transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            >
              <span>👤 혼자서 취향 테스트하기 (싱글 모드)</span>
            </button>

            <button
              onClick={() => setShowStreamerModal(true)}
              className="w-full flex items-center justify-center gap-2 rounded-2xl bg-zinc-900 border border-zinc-700 hover:bg-zinc-800 text-white font-black text-sm px-6 h-12 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            >
              <span>📺 함께 플레이하기 (스트리머 모드)</span>
            </button>
          </motion.div>

          <motion.p 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="text-xs md:text-sm text-neutral-400 max-w-lg mx-auto leading-relaxed pt-2"
          >
            200개가 넘는 기상천외한 질문들로 당신의 무의식을 들여다보세요.{"\n"}
            성별, 연령대별 실시간 통계 분석을 통해 타인과의 가치관 싱크율을 체크합니다.
          </motion.p>

        </section>

        {/* Vercel Style Spacious Feature Cards */}
        <section className="grid grid-cols-1 gap-6 max-w-xl mx-auto">
          
          <div className="group rounded-3xl border border-zinc-900 bg-zinc-900/10 p-8 space-y-4 hover:border-zinc-800 transition-all duration-300">
            <div className="h-12 w-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <BrainCircuit className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-extrabold text-neutral-100">8가지 고유 카테고리 필터링</h3>
            <p className="text-sm text-neutral-450 leading-relaxed mb-2">
              음식, 일상, 스타일, 여가, 관계, 돈, 상상, 그리고 초매운맛 극한 밸런스게임까지. 서랍 메뉴에서 원하는 카테고리만 쏙 골라 즐길 수 있습니다.
            </p>
            {/* Embedded Category Preview Showcase */}
            <div className="pt-2 rounded-2xl overflow-hidden border border-zinc-850 bg-zinc-950/60 shadow-inner">
              <img
                src="/category-preview.png"
                alt="Notion Category Filter Preview"
                className="w-full h-auto object-cover opacity-95"
              />
            </div>
          </div>

          <div className="group rounded-3xl border border-zinc-900 bg-zinc-900/10 p-8 space-y-4 hover:border-zinc-800 transition-all duration-300">
            <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <BarChart3 className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-extrabold text-neutral-100">성별 및 연령대 통계 시각화</h3>
            <p className="text-sm text-neutral-450 leading-relaxed mb-2">
              내가 투표한 즉시 다른 플레이어들의 선호도가 실시간으로 통계 차트에 집계됩니다. 나와 동일한 성별, 연령대가 나열된 고도화된 타겟 분석을 만나보세요.
            </p>
            {/* Embedded Stats Graphic Showcase */}
            <div className="pt-2 flex flex-col gap-3 rounded-2xl overflow-hidden shadow-inner">
              <div className="border border-zinc-850 bg-zinc-950/60 rounded-2xl overflow-hidden">
                <img
                  src="/stats-preview.png"
                  alt="Realtime Stats Preview 1"
                  className="w-full h-auto object-cover opacity-95"
                />
              </div>
              <div className="border border-zinc-850 bg-zinc-950/60 rounded-2xl overflow-hidden">
                <img
                  src="/stats-preview2.png"
                  alt="Realtime Stats Preview 2"
                  className="w-full h-auto object-cover opacity-95"
                />
              </div>
            </div>
          </div>

          <div className="group rounded-3xl border border-zinc-900 bg-zinc-900/10 p-8 space-y-4 hover:border-zinc-800 transition-all duration-300">
            <div className="h-12 w-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Users className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-extrabold text-neutral-100">로그인 없는 제로-레이턴시 이용</h3>
            <p className="text-sm text-neutral-450 leading-relaxed">
              불필요한 가입 절차 없이, 익명으로 누르면 즉시 연산 데이터베이스에 기록됩니다. 로컬 스토리지에 자동 저장되므로 중복 투표 없이 쾌적한 밸런싱이 가능합니다.
            </p>
          </div>
          
        </section>

        {/* Informative Blog Content Block */}
        <section className="border-t border-zinc-900/60 pt-16 max-w-xl mx-auto space-y-8 text-neutral-350 leading-relaxed text-sm md:text-base">
          <p className="indent-4 leading-loose">
            현대인들은 매일 수많은 선택의 기로에 놓입니다. 오늘 점심은 무엇을 먹을지, 주말에는 어떤 여가를 즐길지, 혹은 인간관계에서 어떤 태도를 취해야 할지 끊임없이 고민합니다. <strong className="text-neutral-100 font-extrabold">'기로'</strong>는 이러한 일상적인 고민부터, 상상조차 하기 싫은 극한의 딜레마까지 200개가 넘는 다양한 밸런스 게임을 통해 여러분의 숨겨진 심리와 취향을 탐구하는 종합 엔터테인먼트 플랫폼입니다.
          </p>

          <div className="rounded-2xl border border-zinc-900 bg-zinc-900/20 p-6 space-y-3">
            <h4 className="text-base font-extrabold text-neutral-200 flex items-center gap-2">
              <Trophy className="h-4.5 w-4.5 text-amber-500" /> 왜 사람들은 밸런스 게임에 열광할까요?
            </h4>
            <p className="text-xs md:text-sm text-neutral-400 leading-relaxed">
              심리학적으로 인간은 극단적인 상황에 놓였을 때 비로소 자신의 본성과 우선순위를 가장 명확하게 드러낸다고 합니다. 일시불로 보상을 받을지 혹은 연금 형태로 장기적 가치를 추구할지와 같은 미세한 질문들조차 사람의 기본 철학과 자아를 투영합니다. 나와 같은 선택을 한 사람이 얼마나 되는지 확인하며 깊은 공감대를 형성해 보세요.
            </p>
          </div>

          <div className="rounded-2xl border border-zinc-900 bg-red-500/5 p-6 space-y-3">
            <h4 className="text-base font-extrabold text-red-400 flex items-center gap-2">
              <ShieldAlert className="h-4.5 w-4.5" /> 개인정보 걱정 없는 깔끔한 익명 환경
            </h4>
            <p className="text-xs md:text-sm text-neutral-400 leading-relaxed">
              이 모든 테스트는 익명으로 안전하게 진행됩니다. 사용자가 입력한 나이대와 성별 이외의 식별 데이터는 일절 수집하거나 연동하지 않습니다. 안심하고 솔직한 마음으로 당신의 한계를 시험할 밸런스 게임을 시작하세요!
            </p>
          </div>

        </section>

      </main>

      {/* Global Trust Footer */}
      <footer className="w-full py-6 shrink-0 border-t border-zinc-900/40 text-center flex flex-col items-center gap-2.5 mt-8">
        <div className="flex items-center justify-center gap-3 text-xs text-neutral-500 font-extrabold">
          <Link href="/privacy" className="hover:text-neutral-300 transition-all">개인정보처리방침</Link>
          <span className="text-zinc-800">|</span>
          <Link href="/terms" className="hover:text-neutral-300 transition-all">이용약관</Link>
          <span className="text-zinc-800">|</span>
          <a href="mailto:nocomenty7@gmail.com" className="hover:text-neutral-300 transition-all">문의하기</a>
        </div>
        <p className="text-[10px] text-neutral-600">© 2026 기로. All rights reserved.</p>
      </footer>

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

      {/* Streamer Mode Creation/Join Modal */}
      <StreamerModal
        isOpen={showStreamerModal}
        onClose={() => setShowStreamerModal(false)}
      />

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

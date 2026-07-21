'use client';

import React from 'react';
import Link from 'next/link';
import { ChevronLeft, Compass, Users, Sparkles, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';
import ThemeToggle from '@/components/ThemeToggle';

export default function AboutPage() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15
      }
    }
  } as const;
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: 'spring', damping: 25, stiffness: 200 }
    }
  } as const;

  return (
    <div className="relative h-[100dvh] overflow-y-auto w-full max-w-md mx-auto flex flex-col justify-between overflow-x-hidden bg-[#080911] bg-[radial-gradient(circle_at_top,_rgba(99,102,241,0.08),_transparent_60%)] text-white font-sans">
      
      {/* Header Bar */}
      <header className="w-full h-14 shrink-0 flex items-center justify-between px-4 border-b border-zinc-900 bg-[#080911]/85 backdrop-blur-md sticky top-0 z-40">
        <Link
          href="/"
          className="flex items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900/30 w-9 h-9 text-neutral-400 hover:text-white transition shadow-sm"
          title="돌아가기"
        >
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-sm font-black tracking-wider text-neutral-300">기로 소개</h1>
        <ThemeToggle />
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col px-6 py-10 justify-center items-center text-center">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="w-full flex flex-col items-center"
        >
          {/* Large Logo Panel */}
          <motion.div
            variants={itemVariants}
            className="relative h-24 w-60 overflow-hidden mb-6 rounded-3xl bg-neutral-900/40 border border-neutral-800/80 p-4 shadow-[0_0_30px_rgba(99,102,241,0.1)] flex items-center justify-center backdrop-blur-md"
          >
            <img
              src="/logo.png?v=2"
              alt="기로 로고"
              className="max-h-full max-w-full object-contain p-2"
            />
          </motion.div>

          {/* Tagline */}
          <motion.div variants={itemVariants} className="space-y-2 mb-10">
            <span className="inline-block rounded-full bg-indigo-500/10 px-3.5 py-1 text-xs font-bold text-indigo-400 border border-indigo-500/20">
              💡 당신의 선택은?
            </span>
            <p className="text-sm text-zinc-400 leading-relaxed max-w-xs mx-auto">
              사소한 고민부터 기상천외한 취향 분석까지,{"\n"}
              세상의 모든 선택지를 비교하고 대결해 보세요!
            </p>
          </motion.div>

          {/* Sensational Features List */}
          <motion.div variants={itemVariants} className="w-full space-y-4 mb-10">
            
            {/* Feature 1 */}
            <div className="flex items-start gap-4 rounded-2xl bg-zinc-900/30 border border-zinc-900/60 p-4 text-left backdrop-blur-sm">
              <div className="h-10 w-10 shrink-0 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center justify-center text-amber-400">
                <Compass className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-neutral-200">나의 숨겨진 진짜 취향 확인</h3>
                <p className="text-xs text-zinc-400 mt-1 leading-normal">
                  매일 업데이트되는 기상천외한 밸런스 게임을 통해 나의 가치관과 확고한 선호를 한눈에 알 수 있습니다.
                </p>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="flex items-start gap-4 rounded-2xl bg-zinc-900/30 border border-zinc-900/60 p-4 text-left backdrop-blur-sm">
              <div className="h-10 w-10 shrink-0 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-center text-emerald-400">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-neutral-200">가족, 친구, 연인과 함께</h3>
                <p className="text-xs text-zinc-400 mt-1 leading-normal">
                  "넌 이걸 고른다고?" 이야기 나누며 서로의 가치관 차이를 가볍게 즐기고, 관계를 더욱 돈독히 다져보세요.
                </p>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="flex items-start gap-4 rounded-2xl bg-zinc-900/30 border border-zinc-900/60 p-4 text-left backdrop-blur-sm">
              <div className="h-10 w-10 shrink-0 bg-indigo-500/10 border border-indigo-500/20 rounded-xl flex items-center justify-center text-indigo-400">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-neutral-200">남녀노소 누구나 즉시 이용</h3>
                <p className="text-xs text-zinc-400 mt-1 leading-normal">
                  복잡한 절차 없이 간결한 UI 레이아웃과 이모티콘을 통해 어린이부터 어르신까지 직관적으로 터치하여 즐깁니다.
                </p>
              </div>
            </div>

            {/* Feature 4 */}
            <div className="flex items-start gap-4 rounded-2xl bg-zinc-900/30 border border-zinc-900/60 p-4 text-left backdrop-blur-sm">
              <div className="h-10 w-10 shrink-0 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-center justify-center text-rose-400">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-neutral-200">로그인/회원가입 없이 0초 시작</h3>
                <p className="text-xs text-zinc-400 mt-1 leading-normal">
                  개인정보 수집 및 까다로운 회원가입 일절 없이 성별과 연령만 툭 골라 바로 밸런스 게임 플레이가 가능합니다.
                </p>
              </div>
            </div>

          </motion.div>

          {/* Action Button */}
          <motion.div variants={itemVariants} className="w-full">
            <Link
              href="/"
              className="flex items-center justify-center gap-1.5 rounded-xl bg-white hover:bg-neutral-200 text-zinc-950 font-black px-6 h-12 text-sm shadow-lg w-full transition-all"
            >
              🚀 지금 밸런스 게임 시작하기
            </Link>
          </motion.div>

        </motion.div>
      </main>

      {/* Copyright Footer */}
      <footer className="text-[10px] text-center text-zinc-650 py-4 shrink-0 border-t border-zinc-900/20">
        © 2026 기로. All rights reserved.
      </footer>
      
    </div>
  );
}

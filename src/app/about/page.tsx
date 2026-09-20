'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Compass, Users, Sparkles, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';

export default function AboutPage() {
  const [showDrawer, setShowDrawer] = useState(false);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15 }
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
    <div className="flex h-[100dvh] w-full flex-col overflow-y-auto overflow-x-hidden bg-[#080911] text-white selection:bg-amber-500/30 selection:text-amber-200">
      
      {/* Reused Navigation Header */}
      <div className="shrink-0">
        <Navigation
          selectedCategories={['전체']}
          onToggleCategory={() => {}}
          showDrawer={showDrawer}
          setShowDrawer={setShowDrawer}
        />
      </div>

      <main className="flex-1 w-full max-w-3xl mx-auto px-6 py-10 flex flex-col items-center text-center">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="w-full flex flex-col items-center"
        >
          {/* Large Logo Panel */}
          <motion.div
            variants={itemVariants}
            className="relative h-24 w-60 overflow-hidden mb-6 rounded-3xl bg-zinc-900/40 border border-zinc-800/80 p-4 shadow-[0_0_30px_rgba(245,195,82,0.1)] flex items-center justify-center backdrop-blur-md"
          >
            <img
              src="/icons/logo.png?v=2"
              alt="기로 로고"
              className="max-h-full max-w-full object-contain p-2"
            />
          </motion.div>

          {/* Tagline */}
          <motion.div variants={itemVariants} className="space-y-2 mb-10">
            <span className="inline-block rounded-full bg-amber-500/10 px-3.5 py-1 text-xs font-bold text-amber-500 border border-amber-500/20">
              💡 선택의 기로, 당신의 선택은?
            </span>
            <p className="text-sm text-neutral-400 leading-relaxed max-w-sm mx-auto break-keep">
              사소한 고민부터 기상천외한 취향 분석까지,{"\n"}
              세상의 모든 선택지를 비교하고 대결해 보세요!
            </p>
          </motion.div>

          {/* Sensational Features List - Grid on Desktop */}
          <motion.div variants={itemVariants} className="w-full grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
            
            {/* Feature 1 */}
            <div className="flex items-start gap-4 rounded-2xl bg-zinc-900/50 border border-zinc-800/80 p-5 text-left transition-all hover:bg-zinc-800/50 hover:border-zinc-700">
              <div className="h-10 w-10 shrink-0 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center justify-center text-amber-500">
                <Compass className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-black text-neutral-200">나의 숨겨진 진짜 취향 확인</h3>
                <p className="text-[13px] text-neutral-400 mt-1.5 leading-relaxed break-keep">
                  매일 업데이트되는 기상천외한 밸런스 게임을 통해 나의 가치관과 확고한 선호를 한눈에 알 수 있습니다.
                </p>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="flex items-start gap-4 rounded-2xl bg-zinc-900/50 border border-zinc-800/80 p-5 text-left transition-all hover:bg-zinc-800/50 hover:border-zinc-700">
              <div className="h-10 w-10 shrink-0 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-center text-emerald-500">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-black text-neutral-200">가족, 친구, 연인과 함께</h3>
                <p className="text-[13px] text-neutral-400 mt-1.5 leading-relaxed break-keep">
                  "넌 이걸 고른다고?" 이야기 나누며 서로의 가치관 차이를 가볍게 즐기고, 관계를 더욱 돈독히 다져보세요.
                </p>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="flex items-start gap-4 rounded-2xl bg-zinc-900/50 border border-zinc-800/80 p-5 text-left transition-all hover:bg-zinc-800/50 hover:border-zinc-700">
              <div className="h-10 w-10 shrink-0 bg-indigo-500/10 border border-indigo-500/20 rounded-xl flex items-center justify-center text-indigo-400">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-black text-neutral-200">남녀노소 누구나 즉시 이용</h3>
                <p className="text-[13px] text-neutral-400 mt-1.5 leading-relaxed break-keep">
                  복잡한 절차 없이 간결한 UI 레이아웃과 이모티콘을 통해 어린이부터 어르신까지 직관적으로 터치하여 즐깁니다.
                </p>
              </div>
            </div>

            {/* Feature 4 */}
            <div className="flex items-start gap-4 rounded-2xl bg-zinc-900/50 border border-zinc-800/80 p-5 text-left transition-all hover:bg-zinc-800/50 hover:border-zinc-700">
              <div className="h-10 w-10 shrink-0 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-center justify-center text-rose-500">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-black text-neutral-200">로그인/회원가입 없이 0초 시작</h3>
                <p className="text-[13px] text-neutral-400 mt-1.5 leading-relaxed break-keep">
                  개인정보 수집 및 까다로운 회원가입 일절 없이 성별과 연령만 툭 골라 바로 밸런스 게임 플레이가 가능합니다.
                </p>
              </div>
            </div>

          </motion.div>

          {/* Action Button */}
          <motion.div variants={itemVariants} className="w-full max-w-sm">
            <Link
              href="/"
              className="flex items-center justify-center gap-2 rounded-2xl bg-[#FFD700] hover:bg-yellow-400 text-zinc-950 font-black px-6 h-14 text-sm md:text-base shadow-lg transition-all hover:shadow-amber-500/20 hover:-translate-y-0.5 active:translate-y-0 w-full"
            >
              🚀 지금 밸런스 게임 시작하기
            </Link>
          </motion.div>

        </motion.div>
      </main>

      {/* Reused Footer */}
      <div className="shrink-0 mt-auto">
        <Footer />
      </div>
      
    </div>
  );
}

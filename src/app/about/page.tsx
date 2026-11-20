'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Compass,
  Users,
  Sparkles,
  CheckCircle2,
  RotateCcw,
  BrainCircuit,
  BarChart3,
  Tv,
  Trophy,
  BookOpen,
  HelpCircle,
} from 'lucide-react';
import { motion } from 'framer-motion';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';

export default function AboutPage() {
  const [showDrawer, setShowDrawer] = useState(false);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  } as const;

  const itemVariants = {
    hidden: { y: 16, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: 'spring', damping: 25, stiffness: 200 },
    },
  } as const;

  return (
    <div className="flex h-[100dvh] w-full flex-col overflow-y-auto overflow-x-hidden bg-[#080911] bg-[radial-gradient(circle_at_top,_rgba(99,102,241,0.08),_transparent_55%)] text-white selection:bg-amber-500/30 selection:text-amber-200">
      {/* Reused Navigation Header */}
      <div className="shrink-0">
        <Navigation
          selectedCategories={['전체']}
          onToggleCategory={() => {}}
          showDrawer={showDrawer}
          setShowDrawer={setShowDrawer}
        />
      </div>

      <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 py-10 md:py-14 space-y-14">
        {/* Top Hero Intro */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="w-full flex flex-col items-center text-center"
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
          <motion.div variants={itemVariants} className="space-y-2.5 mb-10">
            <span className="inline-block rounded-full bg-amber-500/10 px-3.5 py-1 text-xs font-bold text-amber-500 border border-amber-500/20">
              💡 선택의 기로, 당신의 선택은?
            </span>
            <h1 className="text-2xl md:text-3xl font-black text-neutral-100 tracking-tight">
              기로(PlayKiro) 소개 및 이용 가이드
            </h1>
            <p className="text-sm text-neutral-400 leading-relaxed max-w-md mx-auto break-keep">
              사소한 고민부터 기상천외한 취향 분석까지,
              <br />
              세상의 모든 선택지를 비교하고 대결해 보세요!
            </p>
          </motion.div>

          {/* Quick Value Cards (4-grid) */}
          <motion.div
            variants={itemVariants}
            className="w-full max-w-3xl grid grid-cols-1 md:grid-cols-2 gap-4 mb-10"
          >
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

            <div className="flex items-start gap-4 rounded-2xl bg-zinc-900/50 border border-zinc-800/80 p-5 text-left transition-all hover:bg-zinc-800/50 hover:border-zinc-700">
              <div className="h-10 w-10 shrink-0 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-center text-emerald-500">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-black text-neutral-200">가족, 친구, 연인과 함께</h3>
                <p className="text-[13px] text-neutral-400 mt-1.5 leading-relaxed break-keep">
                  &ldquo;넌 이걸 고른다고?&rdquo; 이야기 나누며 서로의 가치관 차이를 가볍게 즐기고, 관계를 더욱 돈독히 다져보세요.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 rounded-2xl bg-zinc-900/50 border border-zinc-800/80 p-5 text-left transition-all hover:bg-zinc-800/50 hover:border-zinc-700">
              <div className="h-10 w-10 shrink-0 bg-indigo-500/10 border border-indigo-500/20 rounded-xl flex items-center justify-center text-indigo-400">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-black text-neutral-200">남녀노소 누구나 즉시 이용</h3>
                <p className="text-[13px] text-neutral-400 mt-1.5 leading-relaxed break-keep">
                  복잡한 절차 없이 간결한 UI 레이아웃과 직관적인 화면을 통해 누구나 터치 한 번으로 바로 즐깁니다.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 rounded-2xl bg-zinc-900/50 border border-zinc-800/80 p-5 text-left transition-all hover:bg-zinc-800/50 hover:border-zinc-700">
              <div className="h-10 w-10 shrink-0 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-center justify-center text-rose-500">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-black text-neutral-200">로그인/회원가입 없이 0초 시작</h3>
                <p className="text-[13px] text-neutral-400 mt-1.5 leading-relaxed break-keep">
                  개인정보 수집 및 까다로운 회원가입 일절 없이 바로 밸런스 게임 플레이와 커스텀 팩 제작이 가능합니다.
                </p>
              </div>
            </div>
          </motion.div>

          {/* Primary CTA */}
          <motion.div variants={itemVariants} className="w-full max-w-sm">
            <Link
              href="/"
              className="flex items-center justify-center gap-2 rounded-2xl bg-[#FFD700] hover:bg-yellow-400 text-zinc-950 font-black px-6 h-14 text-sm md:text-base shadow-lg transition-all hover:shadow-amber-500/20 hover:-translate-y-0.5 active:translate-y-0 w-full"
            >
              🚀 지금 밸런스 게임 시작하기
            </Link>
          </motion.div>
        </motion.div>

        {/* Detailed Feature Cards (Migrated from Home) */}
        <section className="border-t border-zinc-900/80 pt-12 space-y-6">
          <div className="text-center space-y-1.5">
            <h2 className="text-xl md:text-2xl font-black text-neutral-100">기로 핵심 기능 안내</h2>
            <p className="text-xs md:text-sm text-neutral-400">
              싱글모드부터 스트리머 실시간 채팅 연동, 통계 분석까지 기로만의 특장점을 확인해 보세요.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
            <div className="group rounded-3xl border border-zinc-900 bg-zinc-900/10 p-8 space-y-4 hover:border-zinc-800 transition-all duration-300">
              <div className="h-12 w-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                <RotateCcw className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-extrabold text-neutral-100 selection:bg-transparent">
                중복 문제 없는 100% 릴레이 출제
              </h3>
              <p className="text-sm text-neutral-450 leading-relaxed">
                브라우저의 데이터나 캐시를 삭제하지 않는 한, 언제 접속하셔도 중복 없이 항상 고유의 문제를 끝없이 이어서 풀 수 있습니다.
              </p>
            </div>

            <div className="group rounded-3xl border border-zinc-900 bg-zinc-900/10 p-8 space-y-4 hover:border-zinc-800 transition-all duration-300">
              <div className="h-12 w-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                <BrainCircuit className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-extrabold text-neutral-100">8가지 고유 카테고리 필터링</h3>
              <p className="text-sm text-neutral-450 leading-relaxed mb-2">
                전체 혹은 음식, 일상, 스타일, 여가, 관계, 돈, 상상, 그리고 초매운맛 극한 밸런스게임까지. 원하는 카테고리만 쏙 골라 즐길 수 있습니다.
              </p>
              <div className="pt-2 rounded-2xl overflow-hidden border border-zinc-850 bg-zinc-950/60 shadow-inner">
                <img
                  src="/images/previews/category-preview.png"
                  alt="카테고리 필터 미리보기"
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
              <div className="pt-2 flex flex-col gap-3 rounded-2xl overflow-hidden shadow-inner">
                <div className="border border-zinc-850 bg-zinc-950/60 rounded-2xl overflow-hidden">
                  <img
                    src="/images/previews/stats-preview.png"
                    alt="실시간 통계 미리보기 1"
                    className="w-full h-auto object-cover opacity-95"
                  />
                </div>
                <div className="border border-zinc-850 bg-zinc-950/60 rounded-2xl overflow-hidden">
                  <img
                    src="/images/previews/stats-preview2.png"
                    alt="실시간 통계 미리보기 2"
                    className="w-full h-auto object-cover opacity-95"
                  />
                </div>
              </div>
            </div>

            <div className="group rounded-3xl border border-zinc-900 bg-zinc-900/10 p-8 space-y-4 hover:border-zinc-800 transition-all duration-300">
              <div className="h-12 w-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                <Tv className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-extrabold text-neutral-100">함께 플레이하기</h3>
              <p className="text-sm text-neutral-450 leading-relaxed">
                치지직/SOOP 방송 채팅 연동 및 PIN 코드 접속 등 다양한 시참 방식을 제공합니다. 시청자가 스트리머의 취향과 선택을 예측하거나, 친구·연인과 실시간으로 투표하며 소통의 즐거움을 극대화해보세요. (OBS 오버레이 제공)
              </p>
              <div className="pt-2 flex flex-col gap-3 rounded-2xl overflow-hidden shadow-inner">
                <div className="border border-zinc-850 bg-zinc-950/60 rounded-2xl overflow-hidden">
                  <img
                    src="/images/previews/multi1.png"
                    alt="멀티모드 미리보기 1"
                    className="w-full h-auto object-cover opacity-95"
                  />
                </div>
                <div className="border border-zinc-850 bg-zinc-950/60 rounded-2xl overflow-hidden">
                  <img
                    src="/images/previews/multi2.png"
                    alt="멀티모드 미리보기 2"
                    className="w-full h-auto object-cover opacity-95"
                  />
                </div>
              </div>
            </div>

            <div className="group rounded-3xl border border-zinc-900 bg-zinc-900/10 p-8 space-y-4 hover:border-zinc-800 transition-all duration-300 md:col-span-2">
              <div className="h-12 w-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                <Users className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-extrabold text-neutral-100">로그인 없는 제로-레이턴시 이용</h3>
              <p className="text-sm text-neutral-450 leading-relaxed">
                불필요한 가입 절차 없이, 익명으로 누르면 즉시 연산 데이터베이스에 기록됩니다. 로컬 스토리지에 자동 저장되므로 중복 투표 없이 쾌적한 밸런싱이 가능합니다.
              </p>
            </div>
          </div>
        </section>

        {/* Detailed Guide & FAQ (Migrated from Home) */}
        <section className="border-t border-zinc-900/60 pt-12 max-w-2xl mx-auto space-y-8 text-neutral-350 leading-relaxed text-sm md:text-base">
          <p className="indent-4 leading-loose">
            현대인들은 매일 수많은 선택의 기로에 놓입니다. 오늘 점심은 무엇을 먹을지, 주말에는 어떤 여가를 즐길지, 혹은 인간관계에서 어떤 태도를 취해야 할지 끊임없이 고민합니다.{' '}
            <strong className="text-neutral-100 font-extrabold">&apos;기로&apos;</strong>는 이러한 일상적인 고민부터, 상상조차 하기 싫은 극한의 딜레마까지 1,000개가 넘는 다양한 밸런스 게임을 통해 여러분의 숨겨진 심리와 취향을 탐구하는 종합 엔터테인먼트 플랫폼입니다.
          </p>

          <div className="rounded-2xl border border-zinc-900 bg-zinc-900/20 p-6 space-y-3">
            <h4 className="text-base font-extrabold text-neutral-200 flex items-center gap-2">
              <Trophy className="h-4.5 w-4.5 text-amber-500" /> 왜 사람들은 밸런스 게임에 열광할까요?
            </h4>
            <p className="text-xs md:text-sm text-neutral-400 leading-relaxed">
              심리학적으로 인간은 극단적인 상황에 놓였을 때 비로소 자신의 본성과 우선순위를 가장 명확하게 드러낸다고 합니다. 일시불로 보상을 받을지 혹은 연금 형태로 장기적 가치를 추구할지와 같은 미세한 질문들조차 사람의 기본 철학과 자아를 투영합니다. 나와 같은 선택을 한 사람이 얼마나 되는지 확인하며 깊은 공감대를 형성해 보세요.
            </p>
          </div>

          {/* Playkiro Detailed Guide */}
          <div className="rounded-2xl border border-zinc-900 bg-blue-500/5 p-6 space-y-4">
            <h4 className="text-lg font-extrabold text-blue-400 flex items-center gap-2 border-b border-zinc-900/50 pb-3">
              <BookOpen className="h-5 w-5" /> 기로(Playkiro) 상세 이용 가이드
            </h4>
            <div className="space-y-4 text-xs md:text-sm text-neutral-400 leading-loose">
              <div>
                <strong className="text-neutral-200 text-sm">1. 싱글 모드 (솔로 플레이)</strong>
                <p>
                  가장 대중적이고 기본적인 밸런스 게임 모드입니다. 주제 카테고리를 선택하면 무작위로 극한의 딜레마 질문들이 쏟아집니다. 주어진 두 가지 선택지 중 당신의 직감에 가장 가까운 답변을 클릭해 보세요. 선택 즉시 다른 사람들이 어떤 답변을 주로 선택했는지 확인할 수 있으며, 연령대별 및 성별 투표 통계가 시각적 그래프로 즉각 제공됩니다.
                </p>
              </div>
              <div>
                <strong className="text-neutral-200 text-sm">2. 방 만들기 모드 (PIN 입장코드)</strong>
                <p>
                  호스트가 &apos;방 만들기&apos; 버튼을 눌러 고유의 6자리 PIN 코드를 생성하는 방식입니다. 친구·연인·가족이나 시청자들은 별도의 앱 설치나 로그인 없이 스마트폰 브라우저에서 PIN 코드를 입력하기만 하면 즉시 입장할 수 있으며, 호스트의 진행에 맞춰 실시간으로 투표 결과를 함께 확인할 수 있습니다.
                </p>
              </div>
              <div>
                <strong className="text-neutral-200 text-sm">3. 채팅 연동 모드 (치지직/SOOP 시참)</strong>
                <p>
                  방송을 진행하는 스트리머를 위한 최적의 라이브 연동 솔루션입니다. 본인의 치지직 채널 URL 또는 SOOP 생방송 주소를 입력하면 실시간 채팅창을 연동해 `!1` / `!2` 채팅을 자동 집계하며, 방송 송출용 투명 OBS 오버레이 URL도 함께 제공합니다.
                </p>
              </div>
              <div>
                <strong className="text-neutral-200 text-sm">4. 유저가 만든 밸런스질문 팩 (커스텀 팩)</strong>
                <p>
                  회원가입 없이 누구나 5~30개의 질문을 묶어 나만의 밸런스게임 팩을 만들고 링크로 공유할 수 있습니다. 만들어진 팩은 혼자 풀면서 실시간 비율을 확인하거나, 클릭 한 번으로 스트리머 채팅 연동 및 PIN 방 만들기로 바로 진행할 수 있습니다.
                </p>
              </div>
            </div>
          </div>

          {/* FAQ */}
          <div className="rounded-2xl border border-zinc-900 bg-zinc-900/30 p-6 space-y-4">
            <h4 className="text-lg font-extrabold text-neutral-200 flex items-center gap-2 border-b border-zinc-900/50 pb-3">
              <HelpCircle className="h-5 w-5 text-emerald-400" /> 자주 묻는 질문 (FAQ)
            </h4>
            <div className="space-y-4 text-xs md:text-sm text-neutral-400 leading-relaxed">
              <div className="space-y-1">
                <strong className="text-neutral-300 block">Q. 밸런스 게임 질문들은 어떻게 선정되나요?</strong>
                <p>
                  기로의 공식 데이터베이스에 등록된 1,000개 이상의 질문들은 대중성, 토론의 여지, 그리고 유머러스함을 기준으로 선정되며 꾸준히 업데이트됩니다. 유저가 직접 제작한 커스텀 밸런스질문 팩은 공식 질문 풀과 별도로 분리 관리됩니다.
                </p>
              </div>
              <div className="space-y-1">
                <strong className="text-neutral-300 block">Q. 내 투표 결과는 어떻게 저장되며, 개인정보를 수집하나요?</strong>
                <p>
                  기로는 회원가입이 완전히 생략된 익명 플랫폼입니다. 싱글 모드 투표 시 사용자의 브라우저 내 &apos;로컬 스토리지(Local Storage)&apos;를 활용하여 중복 투표를 방지하며, 전화번호·이메일·실명 등 개인 식별 정보는 일절 수집하지 않습니다.
                </p>
              </div>
              <div className="space-y-1">
                <strong className="text-neutral-300 block">Q. 스트리머 모드에서 치지직과 SOOP 채팅을 동시에 연동할 수 있나요?</strong>
                <p>
                  네, 가능합니다! 치지직(Chzzk)과 SOOP 양쪽의 플랫폼 정보를 동시에 입력해 게임을 시작할 수 있으며, 두 플랫폼의 실시간 투표 데이터를 하나의 통계 게이지바로 합산해 보여줍니다.
                </p>
              </div>
              <div className="space-y-1">
                <strong className="text-neutral-300 block">Q. 결과 통계에서 성별과 연령대 데이터는 왜 중요한가요?</strong>
                <p>
                  단순히 A와 B의 비율을 아는 것을 넘어, 남녀 간의 가치관 차이나 연령대별 관점 차이를 시각화된 차트로 비교해 보면 훨씬 흥미로운 대화 주제가 탄생합니다.
                </p>
              </div>
              <div className="space-y-1">
                <strong className="text-neutral-300 block">Q. 모바일 기기로도 쾌적하게 플레이가 가능한가요?</strong>
                <p>
                  물론입니다. 기로는 모바일 우선(Mobile-First) 반응형 웹으로 제작되어 스마트폰, 태블릿, PC 어디서나 동일한 부드러운 애니메이션과 직관적인 터치 인터페이스를 제공합니다.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Reused Footer */}
      <div className="shrink-0 mt-auto">
        <Footer />
      </div>
    </div>
  );
}

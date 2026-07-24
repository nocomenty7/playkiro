'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart3, ChevronRight, Share2, Trophy } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import OnboardingModal from './OnboardingModal';
import StatsBottomSheet from './StatsBottomSheet';
import ShareSheet from './ShareSheet';
import Navigation from './Navigation';

interface Question {
  id: string;
  question_no: number;
  title: string;
  option_a: string;
  emoji_a: string | null;
  option_b: string;
  emoji_b: string | null;
  category: string | null;
}

interface VoteClientProps {
  question: Question | null;
  initialVotesA: number;
  initialVotesB: number;
  allQuestions: { id: string; question_no: number; category: string | null }[];
  serverError?: string | null;
}

export default function VoteClient({
  question,
  initialVotesA,
  initialVotesB,
  allQuestions,
  serverError
}: VoteClientProps) {
  const [userInfo, setUserInfo] = useState<{ gender: string; age_group: string } | null>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('kiro_user_info');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {}
      }
    }
    return null;
  });
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);
  const [selectedOption, setSelectedOption] = useState<'A' | 'B' | null>(null);
  const [votesA, setVotesA] = useState(initialVotesA);
  const [votesB, setVotesB] = useState(initialVotesB);
  const [showStats, setShowStats] = useState(false);
  const [showShareSheet, setShowShareSheet] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const [noMoreQuestions, setNoMoreQuestions] = useState(false);
  const [showDrawer, setShowDrawer] = useState(false);
  const [lastMenuClickTime, setLastMenuClickTime] = useState<number>(0);
  const router = useRouter();
  const [nextPrefetchedId, setNextPrefetchedId] = useState<string | null>(null);

  // ACCIDENTAL CLICK PROTECTION: vote cooldown on question change
  const [voteCooldown, setVoteCooldown] = useState(true);

  // CATEGORY FILTER STATE (Multi-select)
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



  const getCategoryBadgeClass = (cat: string | null) => {
    if (!cat) return 'bg-zinc-900 text-zinc-400 border-zinc-850';
    const cleanCat = cat.trim();
    if (cleanCat === '음식') return 'bg-red-500/10 text-red-500 border-red-500/20';
    if (cleanCat === '일상') return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
    if (cleanCat === '스타일') return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
    if (cleanCat === '여가') return 'bg-green-500/10 text-green-500 border-green-500/20';
    if (cleanCat === '관계') return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
    if (cleanCat === '돈') return 'bg-[rgba(139,90,43,0.1)] text-[#D2B48C] border-[rgba(139,90,43,0.2)]';
    if (cleanCat === '상상') return 'bg-pink-500/10 text-pink-500 border-pink-500/20';
    if (cleanCat === '극한 밸런스게임') return 'bg-neutral-500/10 text-neutral-400 border-neutral-500/20';
    return 'bg-zinc-900 text-zinc-400 border-zinc-850';
  };

  const handleToggleCategory = (catName: string) => {
    if (catName === '전체') {
      setSelectedCategories(['전체']);
    } else {
      setSelectedCategories((prev) => {
        const next = prev.filter((c) => c !== '전체');
        if (next.includes(catName)) {
          const filtered = next.filter((c) => c !== catName);
          return filtered.length === 0 ? ['전체'] : filtered;
        } else {
          return [...next, catName];
        }
      });
    }
  };

  const formatVoteCount = (count: number): string => {
    if (count >= 1000000) {
      return (count / 1000000).toFixed(1) + 'M';
    }
    if (count >= 1000) {
      return (count / 1000).toFixed(1) + 'K';
    }
    return count.toLocaleString();
  };

  const handleMenuResetClick = () => {
    const now = Date.now();
    if (now - lastMenuClickTime < 300) { // Double tap within 300ms
      localStorage.removeItem('kiro_voted_questions');
      localStorage.removeItem('kiro_user_info');
      alert('개발자 모드: 투표 기록 및 프로필이 초기화되었습니다!');
      window.location.href = '/';
    } else {
      setLastMenuClickTime(now);
    }
  };

  const handleResetHistory = () => {
    localStorage.removeItem('kiro_voted_questions');
    localStorage.removeItem('kiro_user_info');
    window.location.reload();
  };

  // Cooldown timer trigger on question change
  useEffect(() => {
    setVoteCooldown(true);
    const timer = setTimeout(() => setVoteCooldown(false), 450);
    return () => clearTimeout(timer);
  }, [question]);


  // Save category filters on state change
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

  // 1. Initial configuration check (Demographics & Voted History)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('reset') === 'true') {
        localStorage.removeItem('kiro_voted_questions');
        localStorage.removeItem('kiro_user_info');
        window.location.href = '/';
        return;
      }
    }

    const storedUser = localStorage.getItem('kiro_user_info');
    if (storedUser) {
      setUserInfo(JSON.parse(storedUser));
    } else {
      setShowOnboarding(true);
    }

    const votedList = JSON.parse(localStorage.getItem('kiro_voted_questions') || '[]');
    
    // Category filter check helper
    const matchesCategory = (q: any) => {
      if (selectedCategories.includes('전체')) return true;
      return selectedCategories.includes(q.category || '');
    };

    if (question) {
      if (votedList.includes(question.id)) {
        setHasVoted(true);
      }
    } else if (allQuestions.length > 0) {
      const unvoted = allQuestions.filter((q) => !votedList.includes(q.id) && matchesCategory(q));
      
      if (unvoted.length > 0) {
        const randomQuestion = unvoted[Math.floor(Math.random() * unvoted.length)];
        router.replace(`/play?q=${randomQuestion.question_no}`);
      } else {
        // All questions completed! Show custom witty screen
        setNoMoreQuestions(true);
      }
    }
  }, [question, allQuestions, selectedCategories]);

  const handleOnboardingComplete = (data: { gender: string; age_group: string }) => {
    localStorage.setItem('kiro_user_info', JSON.stringify(data));
    setUserInfo(data);
    setShowOnboarding(false);
  };

  // 1.5. Prefetch next question in background once voted, filtering by categories
  useEffect(() => {
    if (!hasVoted || !question || allQuestions.length === 0) return;

    const votedList = JSON.parse(localStorage.getItem('kiro_voted_questions') || '[]');
    
    const matchesCategory = (q: any) => {
      if (selectedCategories.includes('전체')) return true;
      return selectedCategories.includes(q.category || '');
    };

    const unvoted = allQuestions.filter(
      (q) => !votedList.includes(q.id) && q.id !== question.id && matchesCategory(q)
    );

    if (unvoted.length > 0) {
      const randomNext = unvoted[Math.floor(Math.random() * unvoted.length)];
      setNextPrefetchedId(randomNext.question_no.toString());
      router.prefetch(`/play?q=${randomNext.question_no}`);
    } else {
      setNextPrefetchedId(null);
    }
  }, [hasVoted, question, allQuestions, router, selectedCategories]);

  // 2. Zero-Latency Optimistic Voting
  const handleVote = async (option: 'A' | 'B') => {
    if (hasVoted || !question || voteCooldown) return;

    setSelectedOption(option);
    setHasVoted(true);

    if (option === 'A') {
      setVotesA((prev) => prev + 1);
    } else {
      setVotesB((prev) => prev + 1);
    }

    const votedList = JSON.parse(localStorage.getItem('kiro_voted_questions') || '[]');
    if (!votedList.includes(question.id)) {
      votedList.push(question.id);
      localStorage.setItem('kiro_voted_questions', JSON.stringify(votedList));
    }

    const gender = userInfo?.gender || '미선택';
    const ageGroup = userInfo?.age_group || '미선택';

    // Map gender and age group to dynamic JSONB keys
    const genderKey = gender === '여성' ? 'female' : 'male';
    let ageKey = '20s'; // default
    if (ageGroup === '10대') ageKey = '10s';
    else if (ageGroup === '20대') ageKey = '20s';
    else if (ageGroup === '30대') ageKey = '30s';
    else if (ageGroup === '40대') ageKey = '40s';
    else if (ageGroup === '50대') ageKey = '50s';
    else if (ageGroup === '60대' || ageGroup === '60대 이상' || ageGroup === '70대 이상') ageKey = '60s';

    const optionKey = option.toLowerCase();
    const statKey = `${genderKey}_${ageKey}_${optionKey}`;

    supabase
      .rpc('increment_vote_stat', {
        q_id: question.id,
        stat_key: statKey
      })
      .then(({ error }) => {
        if (error) {
          console.error('Background vote increment failed:', error);
        }
      });
  };

  // 3. Next.js router.replace client-side navigation with Prefetching for instant transitions
  const handleNextQuestion = () => {
    if (redirecting) return;
    setRedirecting(true);

    if (nextPrefetchedId) {
      router.replace(`/play?q=${nextPrefetchedId}`);
    } else {
      const votedList = JSON.parse(localStorage.getItem('kiro_voted_questions') || '[]');
      
      const matchesCategory = (q: any) => {
        if (selectedCategories.includes('전체')) return true;
        return selectedCategories.includes(q.category || '');
      };

      const unvoted = allQuestions.filter(
        (q) => !votedList.includes(q.id) && (!question || q.id !== question.id) && matchesCategory(q)
      );

      if (unvoted.length > 0) {
        const nextQuestion = unvoted[Math.floor(Math.random() * unvoted.length)];
        router.replace(`/play?q=${nextQuestion.question_no}`);
      } else {
        // Redirect to root, triggering the no-more-questions screen
        router.replace('/play');
      }
    }
  };

  // Calculate percentages (1 decimal place)
  const total = votesA + votesB;
  const percentA = total > 0 ? Number(((votesA / total) * 100).toFixed(1)) : 50.0;
  const percentB = total > 0 ? Number((100 - percentA).toFixed(1)) : 50.0;

  // Capped at 30% / 70% to ensure enough vertical spacing for texts, preventing clipping
  const displayGrowA = total > 0 ? Math.max(30, Math.min(70, Math.round((votesA / total) * 100))) : 50;
  const displayGrowB = 100 - displayGrowA;

  if (serverError) {
    return (
      <div className="flex h-[100dvh] w-full flex-col items-center justify-center bg-[#080911] text-white font-sans p-6 text-center">
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-6 max-w-sm">
          <span className="text-3xl mb-3 block">⚠️</span>
          <h2 className="text-base font-bold text-red-400 mb-2">데이터 로드 실패</h2>
          <p className="text-xs text-neutral-400 whitespace-pre-wrap break-all mb-4">
            {serverError}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="rounded-lg bg-white px-4 py-1.5 text-xs font-bold text-zinc-950 transition hover:bg-neutral-250"
          >
            새로고침
          </button>
        </div>
      </div>
    );
  }

  // Witty completion screen when all questions have been voted on
  if (noMoreQuestions) {
    return (
      <div className="relative flex h-[100dvh] w-full max-w-md mx-auto flex-col justify-between overflow-hidden bg-[#080911] bg-[radial-gradient(circle_at_top,_rgba(99,102,241,0.07),_transparent_60%)] text-white font-sans">
        
        <Navigation
          selectedCategories={selectedCategories}
          onToggleCategory={onToggleCategoryWrapper}
          showDrawer={showDrawer}
          setShowDrawer={setShowDrawer}
        />

        {/* Content area */}
        <div className="flex-1 flex flex-col justify-center items-center px-6 text-center py-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', damping: 20 }}
            className="flex flex-col items-center max-w-sm animate-fade-in"
          >
            <div className="h-16 w-16 bg-neutral-900 border border-neutral-800 rounded-3xl flex items-center justify-center mb-6 shadow-xl">
              <Trophy className="h-8 w-8 text-yellow-500" />
            </div>
            <h2 className="text-2xl font-black mb-4">대단해요! 정복 완료 🎉</h2>
            <p className="text-sm text-zinc-400 leading-relaxed whitespace-pre-line mb-8">
              선택한 카테고리의 모든 질문에 답변하셨습니다!{"\n"}
              여러분의 참여로 통계가 더욱 완벽해졌어요.{"\n\n"}
              새 질문 제안이나 서랍 메뉴에서 카테고리를 변경해보세요! 🙋‍♂️
            </p>
            <div className="flex flex-col gap-3 w-full">
              <motion.a
                whileTap={{ scale: 0.98 }}
                href="mailto:auroranest.official@gmail.com?subject=[기로] 새로운 선택지 제안합니다!"
                className="flex items-center justify-center gap-2 rounded-xl bg-white hover:bg-neutral-200 text-zinc-950 font-black px-6 h-12 text-sm shadow-lg w-full"
              >
                💡 새로운 선택지 제안하기
              </motion.a>
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={handleResetHistory}
                className="flex items-center justify-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900/50 hover:bg-zinc-900 text-neutral-350 font-extrabold px-6 h-12 text-sm shadow-md w-full"
              >
                🔄 처음부터 다시 하기
              </motion.button>
            </div>
          </motion.div>
        </div>

        {/* Global Trust Footer */}
        <footer className="w-full pt-6 pb-4 shrink-0 border-t border-zinc-900/40 text-center flex flex-col items-center gap-2 mt-8">
          <div className="flex items-center justify-center gap-3 text-[10px] text-neutral-500 font-extrabold">
            <Link href="/privacy" target="_blank" rel="noopener noreferrer" className="hover:text-neutral-350 transition-all">개인정보처리방침</Link>
            <span className="text-zinc-800">|</span>
            <Link href="/terms" target="_blank" rel="noopener noreferrer" className="hover:text-neutral-350 transition-all">이용약관</Link>
            <span className="text-zinc-800">|</span>
            <a href="mailto:auroranest.official@gmail.com" className="hover:text-neutral-350 transition-all">문의하기</a>
          </div>
          <p className="text-[9px] text-neutral-600">© 2026 기로. All rights reserved.</p>
        </footer>
      </div>
    );
  }

  // Full Screen Prominent Loading screen (without logo)
  if (!question) {
    return (
      <div className="flex h-[100dvh] w-full flex-col items-center justify-center bg-[#080911] text-white font-sans p-6 text-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-t-transparent border-neutral-700" />
          <p className="text-base font-semibold text-neutral-400">질문을 불러오고 있습니다...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex h-[100dvh] w-full max-w-md mx-auto flex-col justify-between overflow-hidden bg-[#080911] bg-[radial-gradient(circle_at_top,_rgba(99,102,241,0.07),_transparent_60%)] text-white font-sans select-none animate-fade-in">
      
      <Navigation
        selectedCategories={selectedCategories}
        onToggleCategory={onToggleCategoryWrapper}
        showDrawer={showDrawer}
        setShowDrawer={setShowDrawer}
      />

      {/* 3. Main Dynamic Content Area (Expanded to occupy maximal vertical height) */}
      <main className="flex-1 flex flex-col min-h-0 px-4 py-3 justify-between">
        
        {/* Game Capture Area (Captured for Image Export) */}
        <div id="game-capture-area" className="flex flex-col bg-[#0b0c16]/50 pt-2.5 pb-4 px-4 rounded-3xl border border-zinc-900/80 gap-2 flex-1 min-h-0">
          
          {/* Header Row: Category Badge (Left) and Share Button (Right) */}
          <div className="flex items-center justify-between shrink-0">
            {question.category ? (
              <div className="flex items-center gap-2">
                <span className={`inline-block rounded-full px-3 py-1 text-xs font-black tracking-wide uppercase border ${getCategoryBadgeClass(question.category)}`}>
                  {question.category}
                </span>
                {(votesA + votesB) < 10 && (
                  <span className="inline-flex items-center rounded-full bg-yellow-500/10 border border-yellow-500/30 px-2 py-0.5 text-[9px] font-black text-yellow-500 tracking-wider uppercase animate-pulse">
                    NEW
                  </span>
                )}
              </div>
            ) : (
              (votesA + votesB) < 10 ? (
                <span className="inline-flex items-center rounded-full bg-yellow-500/10 border border-yellow-500/30 px-2 py-0.5 text-[9px] font-black text-yellow-500 tracking-wider uppercase animate-pulse">
                  NEW
                </span>
              ) : (
                <div /> // Spacer
              )
            )}

            <button
              onClick={() => setShowShareSheet(true)}
              className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-2 hover:bg-zinc-900 hover:text-white transition text-zinc-400 shadow-sm"
              title="공유하기"
            >
              <Share2 className="h-4 w-4" />
            </button>
          </div>

          {/* Question Title Header - Large & Bold inside capture block */}
          <div className="text-center py-0 shrink-0">
            <h1 className="text-2xl md:text-3xl font-kiro leading-[1.1] text-[#ffe5a9] tracking-tight whitespace-pre-line break-keep px-1">
              {question.title}
            </h1>
          </div>

          {/* Voting Stack Container */}
          <div className="flex-grow flex flex-col gap-3 mt-3.5 min-h-0 relative">
            
            {/* Card Option A (Top) */}
            <motion.button
              layout
              transition={{ type: 'spring', damping: 11, stiffness: 90 }}
              style={{ flexGrow: hasVoted ? displayGrowA : 50 }}
              whileTap={{ scale: hasVoted ? 1 : 0.98 }}
              onClick={() => handleVote('A')}
              disabled={hasVoted || voteCooldown}
              className={`relative flex w-full flex-col items-center justify-center overflow-hidden rounded-2xl py-3.5 px-4 transition-all duration-300 text-left border ${
                hasVoted
                  ? selectedOption === 'A'
                    ? 'bg-zinc-900/90 border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.15)]'
                    : 'bg-zinc-950/40 border-zinc-900/80 opacity-60'
                  : 'bg-zinc-900/50 border-zinc-800/80 hover:bg-zinc-900/80 hover:border-zinc-700'
              }`}
            >
              {/* Checkmark indicator for selected card - REPOSITIONED TO BOTTOM RIGHT */}
              {hasVoted && selectedOption === 'A' && (
                <div className="absolute bottom-3 right-3 z-20 flex items-center gap-1 rounded-full bg-amber-500 px-2 py-0.5 text-[9px] font-black text-zinc-950 shadow-md">
                  <span>✓</span>
                  <span>선택함</span>
                </div>
              )}

              {/* Absolute Percentage Fill Animation */}
              {hasVoted && (
                <motion.div
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: 0.6, ease: 'easeOut' }}
                  className={`absolute inset-0 z-0 opacity-10 ${
                    selectedOption === 'A' ? 'bg-amber-500' : 'bg-neutral-400'
                  }`}
                  style={{ width: `${percentA}%`, transformOrigin: 'left' }}
                />
              )}

              <div className="relative z-10 flex flex-col items-center text-center w-full max-w-xs pointer-events-none gap-1.5">
                <div className="flex items-center justify-center gap-2.5 w-full">
                  {question.emoji_a && (
                    <span className="text-3xl leading-none shrink-0">{question.emoji_a}</span>
                  )}
                  <p className="text-xl md:text-2xl font-kiro leading-[1.15] text-neutral-100 max-h-24 overflow-y-auto no-scrollbar break-keep">
                    {question.option_a}
                  </p>
                </div>

                {/* Dynamic Vote Results (1 Decimal Place) - MULTI-LINE SAVING LAYOUT */}
                <AnimatePresence>
                  {hasVoted && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ type: 'spring', damping: 15 }}
                      className="flex items-baseline justify-center gap-1.5 mt-1"
                    >
                      <span className="text-3xl md:text-4xl font-black text-amber-400">{percentA.toFixed(1)}%</span>
                      <span className="text-xs text-neutral-500 font-extrabold">({formatVoteCount(votesA)}명)</span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.button>

            {/* Card Option B (Bottom) */}
            <motion.button
              layout
              transition={{ type: 'spring', damping: 11, stiffness: 90 }}
              style={{ flexGrow: hasVoted ? displayGrowB : 50 }}
              whileTap={{ scale: hasVoted ? 1 : 0.98 }}
              onClick={() => handleVote('B')}
              disabled={hasVoted || voteCooldown}
              className={`relative flex w-full flex-col items-center justify-center overflow-hidden rounded-2xl py-3.5 px-4 transition-all duration-300 text-left border ${
                hasVoted
                  ? selectedOption === 'B'
                    ? 'bg-zinc-900/90 border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.15)]'
                    : 'bg-zinc-950/40 border-zinc-900/80 opacity-60'
                  : 'bg-zinc-900/50 border-zinc-800/80 hover:bg-zinc-900/80 hover:border-zinc-700'
              }`}
            >
              {/* Checkmark indicator for selected card - REPOSITIONED TO BOTTOM RIGHT */}
              {hasVoted && selectedOption === 'B' && (
                <div className="absolute bottom-3 right-3 z-20 flex items-center gap-1 rounded-full bg-emerald-500 px-2 py-0.5 text-[9px] font-black text-zinc-950 shadow-md">
                  <span>✓</span>
                  <span>선택함</span>
                </div>
              )}

              {/* Absolute Percentage Fill Animation */}
              {hasVoted && (
                <motion.div
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: 0.6, ease: 'easeOut' }}
                  className={`absolute inset-0 z-0 opacity-10 ${
                    selectedOption === 'B' ? 'bg-emerald-500' : 'bg-neutral-400'
                  }`}
                  style={{ width: `${percentB}%`, transformOrigin: 'left' }}
                />
              )}

              <div className="relative z-10 flex flex-col items-center text-center w-full max-w-xs pointer-events-none gap-1.5">
                <div className="flex items-center justify-center gap-2.5 w-full">
                  {question.emoji_b && (
                    <span className="text-3xl leading-none shrink-0">{question.emoji_b}</span>
                  )}
                  <p className="text-xl md:text-2xl font-kiro leading-[1.15] text-neutral-100 max-h-24 overflow-y-auto no-scrollbar break-keep">
                    {question.option_b}
                  </p>
                </div>

                {/* Dynamic Vote Results (1 Decimal Place) - MULTI-LINE SAVING LAYOUT */}
                <AnimatePresence>
                  {hasVoted && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ type: 'spring', damping: 15 }}
                      className="flex items-baseline justify-center gap-1.5 mt-1"
                    >
                      <span className="text-3xl md:text-4xl font-black text-emerald-400">{percentB.toFixed(1)}%</span>
                      <span className="text-xs text-neutral-500 font-extrabold">({formatVoteCount(votesB)}명)</span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.button>

          </div>
        </div>

        {/* Action Controls & Navigation (Post-Vote only) */}
        {hasVoted && (
          <div className="h-12 shrink-0 flex items-center justify-between gap-3 mt-1.5">
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={() => setShowStats(true)}
              className="flex items-center justify-center gap-1.5 rounded-xl border border-zinc-800 bg-zinc-900/50 hover:bg-zinc-900 px-5 h-10 text-sm font-bold text-neutral-200 transition-all flex-1 shadow-md"
            >
              <BarChart3 className="h-4 w-4 text-neutral-400" /> 통계 보기
            </motion.button>
            
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={handleNextQuestion}
              disabled={redirecting}
              className="flex items-center justify-center gap-1.5 rounded-xl bg-white hover:bg-neutral-200 text-zinc-950 font-extrabold px-6 h-10 text-sm transition-all flex-[1.4] shadow-lg disabled:opacity-50"
            >
              {redirecting ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-950 border-t-transparent" />
              ) : (
                <>다음 질문 <ChevronRight className="h-4.5 w-4.5" /></>
              )}
            </motion.button>
          </div>
        )}

      </main>

      {/* Global Trust Footer */}
      <footer className="w-full pt-6 pb-2 shrink-0 border-t border-zinc-900/40 text-center flex flex-col items-center gap-1 mt-8">
        <div className="flex items-center justify-center gap-3 text-[10px] text-neutral-500 font-extrabold">
          <Link href="/privacy" target="_blank" rel="noopener noreferrer" className="hover:text-neutral-350 transition-all">개인정보처리방침</Link>
          <span className="text-zinc-800">|</span>
          <Link href="/terms" target="_blank" rel="noopener noreferrer" className="hover:text-neutral-350 transition-all">이용약관</Link>
          <span className="text-zinc-800">|</span>
          <a href="mailto:auroranest.official@gmail.com" className="hover:text-neutral-350 transition-all">문의하기</a>
        </div>
        <p className="text-[9px] text-neutral-650">© 2026 기로. All rights reserved.</p>
      </footer>



      <AnimatePresence>
        {showOnboarding && (
          <OnboardingModal onComplete={handleOnboardingComplete} />
        )}
        {showStats && question && (
          <StatsBottomSheet
            questionId={question.id}
            onClose={() => setShowStats(false)}
          />
        )}
        {showShareSheet && question && (
          <ShareSheet
            onClose={() => setShowShareSheet(false)}
            shareUrl={`${window.location.origin}/play?q=${question.question_no}`}
            questionTitle={question.title}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

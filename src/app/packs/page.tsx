'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Sparkles,
  Plus,
  Search,
  Flame,
  Clock,
  Play,
  Layers,
  ChevronRight,
  Loader2,
} from 'lucide-react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import {
  CustomPackSummary,
  PACK_CATEGORIES,
  getPackCategoryBadgeClass,
  formatPackDate,
} from '@/lib/customPacks';

export default function PacksDirectoryPage() {
  const [showDrawer, setShowDrawer] = useState(false);
  const [packs, setPacks] = useState<CustomPackSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  const [selectedCategory, setSelectedCategory] = useState<string>('전체');
  const [sortBy, setSortBy] = useState<'popular' | 'latest'>('popular');
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchPacks = useCallback(async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const params = new URLSearchParams();
      params.set('sort', sortBy);
      if (selectedCategory !== '전체') params.set('category', selectedCategory);
      if (searchQuery) params.set('q', searchQuery);
      params.set('limit', '36');

      const res = await fetch(`/api/packs?${params.toString()}`);
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || '팩 목록을 불러오지 못했습니다.');
      }
      setPacks(data.packs || []);
      setTotal(data.total || 0);
    } catch (err: any) {
      setErrorMsg(err.message || '팩 목록을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }, [sortBy, selectedCategory, searchQuery]);

  useEffect(() => {
    fetchPacks();
  }, [fetchPacks]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchQuery(searchInput.trim());
  };

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

      <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 py-8 md:py-12 space-y-8">
        {/* Hero Header */}
        <section className="flex flex-col md:flex-row md:items-end justify-between gap-5 border-b border-zinc-900 pb-6">
          <div className="space-y-2.5">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 px-3.5 py-1 text-xs font-black text-amber-400">
              <Sparkles className="h-3.5 w-3.5" /> 로그인 없이 5분 만에 제작 · 공유
            </div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-neutral-100">
              나만의 <span className="text-brand-yellow">밸런스질문 팩</span> 둘러보기
            </h1>
            <p className="text-xs md:text-sm text-neutral-400 leading-relaxed break-keep max-w-xl">
              유저들이 직접 만든 테마별 밸런스게임 팩을 혼자 풀거나, 스트리머 채팅 연동·방 만들기로 함께 즐겨보세요.
            </p>
          </div>

          <Link
            href="/packs/create"
            className="shrink-0 inline-flex items-center justify-center gap-2 rounded-2xl bg-brand-yellow hover:bg-[#e0b240] text-zinc-950 font-black text-sm px-5 h-12 shadow-[0_0_25px_rgba(245,195,82,0.25)] transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus className="h-4 w-4 stroke-[3]" />
            <span>새 밸런스질문 팩 만들기</span>
          </Link>
        </section>

        {/* Controls: Category Filter + Sort + Search */}
        <section className="space-y-4">
          {/* Category Pills */}
          <div className="flex flex-wrap items-center gap-2">
            {['전체', ...PACK_CATEGORIES].map((cat) => {
              const isActive = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-extrabold border transition-all cursor-pointer ${
                    isActive
                      ? 'bg-brand-yellow border-brand-yellow text-zinc-950 shadow-sm'
                      : 'bg-zinc-900/60 border-zinc-800 text-neutral-400 hover:border-zinc-700 hover:text-neutral-200'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>

          {/* Sort & Search Row */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="inline-flex items-center gap-1.5 bg-zinc-900/70 border border-zinc-800/80 rounded-xl p-1 self-start">
              <button
                type="button"
                onClick={() => setSortBy('popular')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                  sortBy === 'popular'
                    ? 'bg-zinc-800 text-amber-400 shadow-sm'
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                <Flame className="h-3.5 w-3.5" />
                <span>인기순</span>
              </button>
              <button
                type="button"
                onClick={() => setSortBy('latest')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                  sortBy === 'latest'
                    ? 'bg-zinc-800 text-amber-400 shadow-sm'
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                <Clock className="h-3.5 w-3.5" />
                <span>최신순</span>
              </button>
            </div>

            <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 flex-1 sm:max-w-xs">
              <div className="relative flex-1">
                <Search className="h-4 w-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="팩 제목, 제작자 검색..."
                  className="w-full rounded-xl bg-zinc-900/70 border border-zinc-800 pl-9 pr-3 py-2 text-xs font-bold text-white placeholder-neutral-500 focus:outline-none focus:border-amber-400/70"
                />
              </div>
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchInput('');
                    setSearchQuery('');
                  }}
                  className="px-2.5 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-bold text-neutral-400 hover:text-white cursor-pointer"
                >
                  초기화
                </button>
              )}
            </form>
          </div>
        </section>

        {/* Status Bar */}
        {!loading && !errorMsg && (
          <div className="flex items-center justify-between text-xs text-neutral-500 font-bold">
            <span>
              공개된 밸런스질문 팩 <strong className="text-neutral-200">{total}</strong>개
            </span>
            <span>카드 클릭 시 바로 플레이 또는 방송 연동 가능</span>
          </div>
        )}

        {/* Pack Cards Grid */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-neutral-400">
            <Loader2 className="h-7 w-7 animate-spin text-amber-400" />
            <span className="text-xs font-bold">밸런스질문 팩을 불러오는 중...</span>
          </div>
        ) : errorMsg ? (
          <div className="rounded-3xl border border-zinc-800 bg-zinc-900/40 p-10 text-center space-y-3">
            <p className="text-sm font-bold text-rose-400">{errorMsg}</p>
            <button
              type="button"
              onClick={fetchPacks}
              className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-extrabold text-white cursor-pointer"
            >
              다시 시도
            </button>
          </div>
        ) : packs.length === 0 ? (
          <div className="rounded-3xl border border-zinc-800/80 bg-zinc-900/30 p-12 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
              <Layers className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <h2 className="text-base font-black text-neutral-100">
                {searchQuery || selectedCategory !== '전체'
                  ? '조건에 맞는 밸런스질문 팩이 없어요'
                  : '아직 공개된 밸런스질문 팩이 없어요'}
              </h2>
              <p className="text-xs text-neutral-400">
                첫 번째로 나만의 기발한 밸런스게임 팩을 만들어보세요! (5~30문제)
              </p>
            </div>
            <Link
              href="/packs/create"
              className="inline-flex items-center gap-1.5 rounded-xl bg-brand-yellow hover:bg-[#e0b240] text-zinc-950 font-black text-xs px-5 py-3 transition-all"
            >
              <Plus className="h-4 w-4 stroke-[3]" />
              <span>첫 밸런스질문 팩 만들기</span>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {packs.map((pack, idx) => (
              <motion.div
                key={pack.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(idx * 0.03, 0.25) }}
              >
                <Link
                  href={`/packs/${pack.code}`}
                  className="group flex flex-col justify-between h-full rounded-2xl border border-zinc-800/80 bg-zinc-900/40 hover:bg-zinc-900/75 hover:border-amber-500/40 p-5 transition-all duration-200 shadow-sm hover:shadow-lg"
                >
                  <div className="space-y-3">
                    {/* Top meta row */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span
                          className={`text-[10px] font-black px-2 py-0.5 rounded-md border ${getPackCategoryBadgeClass(
                            pack.category
                          )}`}
                        >
                          {pack.category}
                        </span>
                        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-zinc-800/80 text-neutral-300 border border-zinc-700/60">
                          {pack.question_count}문제
                        </span>
                      </div>
                      <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-neutral-400 shrink-0">
                        <Play className="h-3 w-3 text-amber-400 fill-amber-400" />
                        {pack.play_count.toLocaleString()}
                      </span>
                    </div>

                    {/* Title & Description */}
                    <div className="space-y-1">
                      <h2 className="text-base font-black text-neutral-100 group-hover:text-brand-yellow transition-colors line-clamp-1">
                        {pack.title}
                      </h2>
                      {pack.description && (
                        <p className="text-xs text-neutral-400 line-clamp-2 leading-relaxed break-keep">
                          {pack.description}
                        </p>
                      )}
                    </div>

                    {/* Question #1 Preview Pill */}
                    {pack.preview_question && (
                      <div className="rounded-xl bg-zinc-950/60 border border-zinc-800/80 px-3 py-2 flex items-center gap-2 text-xs font-extrabold overflow-hidden">
                        <span className="text-amber-400 truncate max-w-[44%]">
                          {pack.preview_question.option_a}
                        </span>
                        <span className="text-[10px] text-neutral-500 font-black shrink-0">VS</span>
                        <span className="text-emerald-400 truncate max-w-[44%]">
                          {pack.preview_question.option_b}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Footer row */}
                  <div className="mt-4 pt-3 border-t border-zinc-800/60 flex items-center justify-between text-[11px] text-neutral-500 font-bold">
                    <div className="flex items-center gap-2 truncate">
                      <span className="truncate">by {pack.author_nickname}</span>
                      <span>·</span>
                      <span className="shrink-0">{formatPackDate(pack.created_at)}</span>
                    </div>
                    <span className="inline-flex items-center gap-0.5 text-amber-400 font-black shrink-0 group-hover:translate-x-0.5 transition-transform">
                      플레이 <ChevronRight className="h-3.5 w-3.5" />
                    </span>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </main>

      <div className="shrink-0 mt-auto">
        <Footer />
      </div>
    </div>
  );
}

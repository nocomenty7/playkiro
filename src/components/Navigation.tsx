'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';

interface NavigationProps {
  selectedCategories: string[];
  onToggleCategory: (catName: string) => void;
  showDrawer: boolean;
  setShowDrawer: (show: boolean) => void;
}

export default function Navigation({
  selectedCategories,
  onToggleCategory,
  showDrawer,
  setShowDrawer
}: NavigationProps) {
  const [lastMenuClickTime, setLastMenuClickTime] = useState<number>(0);
  const [questionCounts, setQuestionCounts] = useState<{ [key: string]: number }>({});

  const categoriesConfig = [
    { name: '전체', activeClass: 'border-white bg-white text-zinc-950', inactiveClass: 'border-zinc-800 bg-zinc-900/50 text-neutral-400 hover:border-zinc-700' },
    { name: '음식', activeClass: 'border-red-500 bg-red-500 text-white', inactiveClass: 'border-red-500/30 bg-red-500/5 text-red-400 hover:border-red-500/50' },
    { name: '일상', activeClass: 'border-orange-500 bg-orange-500 text-white', inactiveClass: 'border-orange-500/30 bg-orange-500/5 text-orange-400 hover:border-orange-500/50' },
    { name: '스타일', activeClass: 'border-purple-500 bg-purple-500 text-white', inactiveClass: 'border-purple-500/30 bg-purple-500/5 text-purple-400 hover:border-purple-500/50' },
    { name: '여가', activeClass: 'border-green-500 bg-green-500 text-white', inactiveClass: 'border-green-500/30 bg-green-500/5 text-green-400 hover:border-green-500/50' },
    { name: '관계', activeClass: 'border-blue-500 bg-blue-500 text-white', inactiveClass: 'border-blue-500/30 bg-blue-500/5 text-blue-400 hover:border-blue-500/50' },
    { name: '돈', activeClass: 'border-[#8b5a2b] bg-[#8b5a2b] text-white', inactiveClass: 'border-[rgba(139,90,43,0.3)] bg-[rgba(139,90,43,0.05)] text-[#d2b48c] hover:border-[rgba(139,90,43,0.5)]' },
    { name: '상상', activeClass: 'border-pink-500 bg-pink-500 text-white', inactiveClass: 'border-pink-500/30 bg-pink-500/5 text-pink-400 hover:border-pink-500/50' },
    { name: '극한 밸런스게임', activeClass: 'border-neutral-500 bg-neutral-500 text-white', inactiveClass: 'border-neutral-500/30 bg-neutral-500/5 text-neutral-400 hover:border-neutral-500/50' }
  ];

  // Fetch category question counts dynamically on mount
  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const { data } = await supabase
          .from('questions')
          .select('category');
        if (data) {
          const counts: { [key: string]: number } = {};
          let total = 0;
          data.forEach((q: any) => {
            const cat = q.category?.trim();
            if (cat) {
              counts[cat] = (counts[cat] || 0) + 1;
              total++;
            }
          });
          counts['전체'] = total;
          setQuestionCounts(counts);
        }
      } catch (e) {
        console.error('Failed to fetch category counts inside navigation:', e);
      }
    };
    fetchCounts();
  }, []);

  const handleMenuResetClick = () => {
    const now = Date.now();
    if (now - lastMenuClickTime < 300) { // Double tap within 300ms
      localStorage.removeItem('kiro_voted_questions');
      localStorage.removeItem('kiro_user_info');
      alert('개발자 모드: 투표 기록 및 프로필이 초기화되었습니다!');
      window.location.reload();
    } else {
      setLastMenuClickTime(now);
    }
  };

  return (
    <>
      {/* 1. Unified Global Header Bar */}
      <header className="w-full h-16 shrink-0 flex items-center justify-between px-6 border-b border-zinc-900 bg-[#080911]/85 backdrop-blur-md sticky top-0 z-40">
        <Link href="/" className="relative h-11 w-32 flex items-center">
          <img
            src="/logo.png?v=2"
            alt="기로 로고"
            className="h-10 w-auto object-contain pt-[2px]"
          />
        </Link>
        <button
          onClick={() => setShowDrawer(true)}
          className="p-2.5 rounded-xl text-neutral-400 hover:text-white hover:bg-zinc-900 transition-all cursor-pointer"
          title="메뉴"
        >
          <Menu className="h-6 w-6" />
        </button>
      </header>

      {/* 2. Unified Sidebar Drawer Menu */}
      <AnimatePresence>
        {showDrawer && (
          <div className="fixed inset-0 z-50 flex justify-end">
            {/* Dark Dimmed Backdrop overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDrawer(false)}
              className="absolute inset-0 bg-black/75"
            />

            {/* Drawer panel wrapper */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="relative z-10 w-4/5 max-w-xs h-full bg-[#0c0d1b] border-l border-zinc-900 p-6 flex flex-col justify-between text-white shadow-2xl"
            >
              <div className="space-y-6 overflow-y-auto max-h-[85vh] pr-1">
                {/* Header Inside Drawer */}
                <div className="flex items-center justify-between border-b border-zinc-900 pb-4">
                  <span onClick={handleMenuResetClick} className="font-black tracking-widest text-lg text-neutral-200 cursor-pointer select-none">MENU</span>
                  <button
                    onClick={() => setShowDrawer(false)}
                    className="p-1.5 rounded-full bg-zinc-900 text-neutral-400 hover:text-white hover:bg-zinc-800 transition"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Navigation Links list */}
                <nav className="flex flex-col gap-2">
                  <Link
                    href="/about"
                    onClick={() => setShowDrawer(false)}
                    className="flex items-center gap-3 rounded-2xl bg-zinc-900/50 hover:bg-zinc-900 border border-zinc-900 p-3 text-xs font-extrabold text-neutral-250 transition-all hover:border-zinc-800"
                  >
                    <span>기로 소개</span>
                  </Link>
                </nav>

                {/* Notion Category Filter Section */}
                <div className="border-t border-zinc-900/80 pt-4">
                  <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest block mb-3">카테고리 필터</span>
                  
                  {/* Option 1: 전체 (Top on its own row) */}
                  <div className="mb-3">
                    {categoriesConfig.filter(c => c.name === '전체').map((cat) => {
                      const isActive = selectedCategories.includes(cat.name);
                      const count = questionCounts[cat.name];
                      return (
                        <button
                          key={cat.name}
                          onClick={() => onToggleCategory(cat.name)}
                          className={`w-full px-3 py-2 rounded-full text-xs font-black border transition-all cursor-pointer text-center ${
                            isActive ? cat.activeClass : cat.inactiveClass
                          }`}
                        >
                          {cat.name} {count !== undefined ? `(${count})` : ''}
                        </button>
                      );
                    })}
                  </div>

                  {/* Option 2: Remaining categories (Grid/Wrap below) */}
                  <div className="flex flex-wrap gap-2">
                    {categoriesConfig.filter(c => c.name !== '전체').map((cat) => {
                      const isActive = selectedCategories.includes(cat.name);
                      const count = questionCounts[cat.name];
                      return (
                        <button
                          key={cat.name}
                          onClick={() => onToggleCategory(cat.name)}
                          className={`px-3 py-1.5 rounded-full text-xs font-black border transition-all cursor-pointer ${
                            isActive ? cat.activeClass : cat.inactiveClass
                          }`}
                        >
                          {cat.name} {count !== undefined ? `(${count})` : ''}
                        </button>
                      );
                    })}
                  </div>
                  <span className="text-[10px] text-neutral-500 font-semibold block mt-3">
                    💡 다음 질문부터 필터가 적용됩니다.
                  </span>
                </div>

                {/* Additional Trust Links Inside Drawer */}
                <div className="border-t border-zinc-900/80 pt-4 flex flex-col gap-2">
                  <Link
                    href="/terms"
                    onClick={() => setShowDrawer(false)}
                    className="flex items-center gap-3 rounded-2xl bg-zinc-900/50 hover:bg-zinc-900 border border-zinc-900 p-3 text-xs font-extrabold text-neutral-250 transition-all hover:border-zinc-800"
                  >
                    <span>이용약관</span>
                  </Link>
                  <Link
                    href="/privacy"
                    onClick={() => setShowDrawer(false)}
                    className="flex items-center gap-3 rounded-2xl bg-zinc-900/50 hover:bg-zinc-900 border border-zinc-900 p-3 text-xs font-extrabold text-neutral-250 transition-all hover:border-zinc-800"
                  >
                    <span>개인정보처리방침</span>
                  </Link>
                  <a
                    href="mailto:nocomenty7@gmail.com"
                    onClick={() => setShowDrawer(false)}
                    className="flex items-center gap-3 rounded-2xl bg-zinc-900/50 hover:bg-zinc-900 border border-zinc-900 p-3 text-xs font-extrabold text-neutral-250 transition-all hover:border-zinc-800"
                  >
                    <span>문의하기</span>
                  </a>
                </div>
              </div>

              {/* Footer inside Drawer */}
              <div className="text-[10px] text-neutral-600 leading-normal text-center border-t border-zinc-900/40 pt-4">
                <p>© 2026 기로. All rights reserved.</p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

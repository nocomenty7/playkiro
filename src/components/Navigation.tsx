'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';
import ThemeToggle from './ThemeToggle';

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
      {/* 1. Top Header */}
      <header className="w-full h-16 shrink-0 border-b border-zinc-900 bg-[#080911]/85 backdrop-blur-md sticky top-0 z-40 px-4 sm:px-6">
        <div className="w-full max-w-xl md:max-w-4xl lg:max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/" className="relative h-11 w-32 flex items-center">
            <img
              src="/icons/logo.png?v=2"
              alt="기로 로고"
              className="h-10 w-auto object-contain pt-[2px]"
            />
          </Link>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <button
              onClick={() => setShowDrawer(true)}
              className="p-2.5 rounded-xl text-neutral-400 hover:text-white hover:bg-zinc-900 transition-all cursor-pointer"
              title="메뉴"
            >
              <Menu className="h-6 w-6" />
            </button>
          </div>
        </div>
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
                    <span>기로란?</span>
                  </Link>
                  <Link
                    href="/suggest"
                    onClick={() => setShowDrawer(false)}
                    className="flex items-center gap-3 rounded-2xl bg-zinc-900/50 hover:bg-zinc-900 border border-zinc-900 p-3 text-xs font-extrabold text-neutral-250 transition-all hover:border-zinc-800"
                  >
                    <span>문제 제안하기</span>
                  </Link>
                  <Link
                    href="/notice"
                    onClick={() => setShowDrawer(false)}
                    className="flex items-center gap-3 rounded-2xl bg-zinc-900/50 hover:bg-zinc-900 border border-zinc-900 p-3 text-xs font-extrabold text-neutral-250 transition-all hover:border-zinc-800"
                  >
                    <span>공지사항</span>
                  </Link>
                </nav>


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
                    href="mailto:auroranest.official@gmail.com"
                    onClick={() => setShowDrawer(false)}
                    className="flex items-center gap-3 rounded-2xl bg-zinc-900/50 hover:bg-zinc-900 border border-zinc-900 p-3 text-xs font-extrabold text-neutral-250 transition-all hover:border-zinc-800"
                  >
                    <span>문의하기</span>
                  </a>
                  <a
                    href="https://fairy.hada.io/@playkiro"
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setShowDrawer(false)}
                    className="flex items-center gap-3 rounded-2xl bg-zinc-900/50 hover:bg-zinc-900 border border-zinc-900 p-3 text-xs font-extrabold text-neutral-250 transition-all hover:border-zinc-800"
                  >
                    <span>후원하기</span>
                  </a>
                </div>
              </div>

              {/* Footer inside Drawer */}
              <div className="text-[10px] text-neutral-600 leading-normal text-center border-t border-zinc-900/40 pt-4">
                <p>Copyright © 2026 AuroraNest. All rights reserved.</p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

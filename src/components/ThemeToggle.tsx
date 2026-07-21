'use client';

import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from './ThemeProvider';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className={`relative inline-flex items-center justify-center w-9 h-9 md:w-10 md:h-10 rounded-full border transition-all duration-300 cursor-pointer shadow-md shrink-0 ${
        theme === 'dark'
          ? 'bg-zinc-900 border-zinc-700/80 text-amber-400 hover:bg-zinc-800 hover:border-amber-400/50 shadow-[0_0_12px_rgba(245,158,11,0.2)]'
          : 'bg-white border-slate-300 text-amber-500 hover:bg-slate-50 hover:border-amber-500 shadow-md'
      }`}
      title={theme === 'dark' ? '라이트 모드로 변경' : '다크 모드로 변경'}
      aria-label="Toggle theme"
    >
      {theme === 'dark' ? (
        <Moon className="w-4 h-4 md:w-5 md:h-5 transition-transform duration-300 rotate-0 scale-100" />
      ) : (
        <Sun className="w-4 h-4 md:w-5 md:h-5 transition-transform duration-300 rotate-0 scale-100" />
      )}
    </button>
  );
}

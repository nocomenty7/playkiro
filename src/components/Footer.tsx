import React from 'react';
import Link from 'next/link';
import AdsenseBanner from './AdsenseBanner';

export default function Footer() {
  return (
    <footer className="w-full pt-6 pb-1 shrink-0 border-t border-zinc-200 dark:border-zinc-900/40 text-center flex flex-col items-center gap-2.5 mt-0 bg-transparent">
      <div className="flex items-center justify-center gap-3 text-xs text-neutral-500 font-extrabold">
        <Link href="/privacy" target="_blank" rel="noopener noreferrer" className="hover:text-zinc-900 dark:hover:text-neutral-300 transition-all">개인정보처리방침</Link>
        <span className="text-zinc-300 dark:text-zinc-800">|</span>
        <Link href="/terms" target="_blank" rel="noopener noreferrer" className="hover:text-zinc-900 dark:hover:text-neutral-300 transition-all">이용약관</Link>
        <span className="text-zinc-300 dark:text-zinc-800">|</span>
        <a href="mailto:auroranest.official@gmail.com" className="hover:text-zinc-900 dark:hover:text-neutral-300 transition-all">문의하기</a>
        <span className="text-zinc-300 dark:text-zinc-800">|</span>
        <a href="https://fairy.hada.io/@playkiro" target="_blank" rel="noopener noreferrer" className="hover:text-zinc-900 dark:hover:text-neutral-300 transition-all">후원하기</a>
      </div>
      <p className="text-[10px] text-neutral-400 dark:text-neutral-600">Copyright © 2026 AuroraNest. All rights reserved.</p>
      
      {/* Google AdSense Banner (Main Page - Very Bottom) */}
      <div className="w-full max-w-xl mx-auto px-4 mt-2 mb-0">
        <AdsenseBanner />
      </div>
    </footer>
  );
}

'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Coffee, X } from 'lucide-react';

export const DONATION_URL = 'https://fairy.hada.io/@playkiro';

// localStorage keys
const COUNT_KEY = 'kiro_donation_vote_count';
const SNOOZE_KEY = 'kiro_donation_snooze_until';

// Policy
const TRIGGER_VOTES = 5;
const DAY_MS = 24 * 60 * 60 * 1000;
const SNOOZE_DISMISS_MS = 3 * DAY_MS; // 닫기 / 무시 → 3일
const SNOOZE_DONATE_MS = 7 * DAY_MS; // 후원 버튼 클릭 → 7일

const setSnooze = (ms: number) => {
  try {
    localStorage.setItem(SNOOZE_KEY, String(Date.now() + ms));
    localStorage.setItem(COUNT_KEY, '0');
  } catch {}
};

/**
 * Records one single-mode vote and returns true when the donation prompt should be shown.
 * Votes are counted only while not snoozed, so the prompt appears after 5 fresh votes.
 */
export const registerVoteForDonation = (): boolean => {
  try {
    const snoozeUntil = Number(localStorage.getItem(SNOOZE_KEY) || '0');
    if (Date.now() < snoozeUntil) return false;

    const count = Number(localStorage.getItem(COUNT_KEY) || '0') + 1;
    localStorage.setItem(COUNT_KEY, String(count));
    return count >= TRIGGER_VOTES;
  } catch {
    return false;
  }
};

/** Called the moment the prompt is displayed: default to the 3-day snooze so ignoring it also counts as "closed". */
export const markDonationPromptShown = () => setSnooze(SNOOZE_DISMISS_MS);

interface DonationPromptProps {
  votedCount: number;
  onClose: () => void;
}

export default function DonationPrompt({ votedCount, onClose }: DonationPromptProps) {
  const handleDismiss = () => {
    setSnooze(SNOOZE_DISMISS_MS);
    onClose();
  };

  const handleDonate = () => {
    setSnooze(SNOOZE_DONATE_MS);
    onClose();
  };

  return (
    <motion.div
      id="donation-prompt"
      role="dialog"
      aria-labelledby="donation-prompt-title"
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 40 }}
      transition={{ type: 'spring', damping: 22, stiffness: 220 }}
      className="absolute inset-x-3 bottom-3 z-40 overflow-hidden rounded-3xl border border-amber-500/25 bg-[#11121c]/95 backdrop-blur-xl shadow-[0_-8px_40px_rgba(0,0,0,0.55),0_0_30px_rgba(245,158,11,0.08)]"
    >
      {/* Ambient glow */}
      <div className="pointer-events-none absolute -top-16 -right-10 h-40 w-40 rounded-full bg-amber-500/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 -left-10 h-40 w-40 rounded-full bg-emerald-500/5 blur-3xl" />

      <button
        id="donation-prompt-close"
        onClick={handleDismiss}
        aria-label="닫기"
        className="absolute top-3 right-3 z-10 rounded-full p-1.5 text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800/70 transition"
      >
        <X className="h-4 w-4" />
      </button>

      <div className="relative px-5 pt-5 pb-4">
        <div className="flex items-center gap-2 mb-2.5">
          <motion.span
            animate={{ rotate: [0, -12, 12, -6, 0] }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/15 border border-amber-500/30"
          >
            <Coffee className="h-4 w-4 text-amber-400" />
          </motion.span>
          <span className="text-[11px] font-black tracking-wide text-amber-400/90">
            1인 개발자의 작은 부탁
          </span>
        </div>

        <h2 id="donation-prompt-title" className="text-lg md:text-xl font-black leading-snug text-[#ffe5a9] pr-6 break-keep">
          {votedCount > 0 ? `벌써 ${votedCount}번의 기로를 지나오셨네요! 🎉` : '기로, 재밌게 즐기고 계신가요? 🎉'}
        </h2>

        <p className="mt-2 text-[13px] leading-relaxed text-neutral-400 break-keep">
          기로는 쾌적한 플레이를 위해 <span className="text-neutral-200 font-bold">광고 없이</span> 운영되고 있어요.
          보내주시는 따뜻한 후원은 서버 유지와 매일 새로운 선택지를 만드는{' '}
          <span className="text-neutral-200 font-bold">가장 큰 연료</span>가 됩니다.
          기로가 꺼지지 않고 계속 달릴 수 있도록 힘을 보태주세요 😊
        </p>

        <p className="mt-3 text-center text-[11px] font-extrabold text-zinc-500">
          오늘의 마지막 밸런스 게임 👇
        </p>

        <div className="mt-2 flex gap-2.5">
          <button
            id="donation-prompt-later"
            onClick={handleDismiss}
            className="flex-1 h-11 rounded-xl border border-zinc-800 bg-zinc-900/60 hover:bg-zinc-900 text-sm font-extrabold text-neutral-300 transition-all"
          >
            다음에 할게요
          </button>
          <motion.a
            id="donation-prompt-donate"
            href={DONATION_URL}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleDonate}
            whileTap={{ scale: 0.97 }}
            className="flex-[1.4] h-11 flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-sm font-black text-zinc-950 shadow-[0_4px_20px_rgba(245,158,11,0.3)] transition-all"
          >
            ☕ 커피 한 잔 후원하기
          </motion.a>
        </div>
      </div>
    </motion.div>
  );
}

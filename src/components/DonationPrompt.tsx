'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Coffee, X } from 'lucide-react';

export const DONATION_URL = 'https://fairy.hada.io/@playkiro';

// localStorage keys (shared across single / multi modes)
const COUNT_KEY = 'kiro_donation_vote_count';
const SNOOZE_KEY = 'kiro_donation_snooze_until';

// Policy
const TRIGGER_VOTES = 5;
const DAY_MS = 24 * 60 * 60 * 1000;
const SNOOZE_DONATE_MS = 7 * DAY_MS; // 후원 버튼 클릭 → 7일

/** Timestamp of the next local midnight (00:00) — "오늘 그만 보기". */
const getNextMidnight = () => {
  const d = new Date();
  d.setHours(24, 0, 0, 0);
  return d.getTime();
};

const setSnoozeUntil = (until: number) => {
  try {
    localStorage.setItem(SNOOZE_KEY, String(until));
    localStorage.setItem(COUNT_KEY, '0');
  } catch {}
};

const snoozeForToday = () => setSnoozeUntil(getNextMidnight());
const snoozeAfterDonate = () => setSnoozeUntil(Date.now() + SNOOZE_DONATE_MS);

export const isDonationSnoozed = (): boolean => {
  try {
    return Date.now() < Number(localStorage.getItem(SNOOZE_KEY) || '0');
  } catch {
    return true;
  }
};

/**
 * Single mode: records one vote and returns true when the donation prompt should be shown.
 * Votes are counted only while not snoozed, so the prompt appears after 5 fresh votes.
 */
export const registerVoteForDonation = (): boolean => {
  try {
    if (isDonationSnoozed()) return false;
    const count = Number(localStorage.getItem(COUNT_KEY) || '0') + 1;
    localStorage.setItem(COUNT_KEY, String(count));
    return count >= TRIGGER_VOTES;
  } catch {
    return false;
  }
};

/** Called the moment the prompt is displayed: ignoring it counts the same as "오늘 그만 보기". */
export const markDonationPromptShown = () => snoozeForToday();

interface DonationPromptProps {
  onClose: () => void;
  /** inline: absolute inside a relative container (single mode) / floating: fixed bottom-center (multi mode) */
  variant?: 'inline' | 'floating';
}

export default function DonationPrompt({ onClose, variant = 'inline' }: DonationPromptProps) {
  const handleDismiss = () => {
    snoozeForToday();
    onClose();
  };

  const handleDonate = () => {
    snoozeAfterDonate();
    onClose();
  };

  const positionClass =
    variant === 'floating'
      ? 'fixed bottom-4 left-1/2 w-[calc(100%-1.5rem)] max-w-xl -translate-x-1/2 z-[60]'
      : 'absolute inset-x-3 bottom-3 z-40';

  return (
    <div className={positionClass}>
      <motion.div
        id="donation-prompt"
        role="dialog"
        aria-labelledby="donation-prompt-title"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 40 }}
        transition={{ type: 'spring', damping: 22, stiffness: 220 }}
        className="relative overflow-hidden rounded-3xl border border-amber-500/25 bg-[#11121c]/95 backdrop-blur-xl shadow-[0_-8px_40px_rgba(0,0,0,0.55),0_0_30px_rgba(245,158,11,0.08)]"
      >
        {/* Ambient glow */}
        <div className="pointer-events-none absolute -top-16 -right-10 h-40 w-40 rounded-full bg-amber-500/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-10 h-40 w-40 rounded-full bg-emerald-500/5 blur-3xl" />

        <button
          id="donation-prompt-close"
          onClick={handleDismiss}
          aria-label="닫기 (오늘 그만 보기)"
          className="absolute top-3 right-3 md:top-4 md:right-4 z-10 rounded-full p-1.5 text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800/70 transition"
        >
          <X className="h-4 w-4 md:h-5 md:w-5" />
        </button>

        <div className="relative px-5 pt-5 pb-4 md:px-7 md:pt-6 md:pb-5">
          <div className="flex items-center gap-2 md:gap-2.5 mb-2.5 md:mb-3">
            <motion.span
              animate={{ rotate: [0, -12, 12, -6, 0] }}
              transition={{ delay: 0.5, duration: 0.8 }}
              className="flex h-8 w-8 md:h-10 md:w-10 items-center justify-center rounded-xl bg-amber-500/15 border border-amber-500/30"
            >
              <Coffee className="h-4 w-4 md:h-5 md:w-5 text-amber-400" />
            </motion.span>
            <span className="text-xs md:text-base font-black tracking-wide text-amber-400/90">
              1인 개발자의 작은 부탁
            </span>
          </div>

          <h2
            id="donation-prompt-title"
            className="text-lg md:text-2xl font-black leading-snug text-[#ffe5a9] pr-6 break-keep"
          >
            벌써 여러번의 선택의 기로를 지나오셨네요! 🎉
          </h2>

          <p className="mt-2 md:mt-3 text-[13px] md:text-base leading-relaxed text-neutral-400 break-keep">
            기로는 쾌적한 플레이를 위해 <span className="text-neutral-200 font-bold">광고 없이</span> 운영되고 있어요.
            보내주시는 따뜻한 후원은 서버 유지와 매일 새로운 선택지를 만드는{' '}
            <span className="text-neutral-200 font-bold">가장 큰 연료</span>가 됩니다.
            기로가 꺼지지 않고 계속 달릴 수 있도록 힘을 보태주세요 😊
          </p>

          <div className="mt-4 md:mt-5 flex items-stretch gap-2 md:gap-3">
            <button
              id="donation-prompt-later"
              onClick={handleDismiss}
              className="flex-1 h-14 md:h-16 flex flex-col items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900/60 hover:bg-zinc-900 transition-all"
            >
              <span className="text-sm md:text-base font-extrabold text-neutral-300 leading-tight">다음에 할게요</span>
              <span className="mt-0.5 text-[10px] md:text-xs font-bold text-zinc-500 leading-tight">오늘 그만 보기</span>
            </button>

            <span className="self-center text-[11px] md:text-sm font-black italic text-zinc-600 shrink-0">VS</span>

            <motion.a
              id="donation-prompt-donate"
              href={DONATION_URL}
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleDonate}
              whileTap={{ scale: 0.97 }}
              className="flex-[1.4] h-14 md:h-16 flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-sm md:text-lg font-black text-zinc-950 shadow-[0_4px_20px_rgba(245,158,11,0.3)] transition-all"
            >
              ☕ 커피 한 잔 후원하기
            </motion.a>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

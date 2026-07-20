'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface TugOfWarBarProps {
  votesA: number;
  votesB: number;
  hasVotedOrHost: boolean;
  optionAText: string;
  optionBText: string;
}

export default function TugOfWarBar({
  votesA,
  votesB,
  hasVotedOrHost,
  optionAText,
  optionBText,
}: TugOfWarBarProps) {
  const totalVotes = votesA + votesB;
  let percentA = 50;
  let percentB = 50;

  if (totalVotes > 0) {
    percentA = Math.round((votesA / totalVotes) * 100);
    percentB = 100 - percentA;
  }

  if (!hasVotedOrHost) {
    return (
      <div className="w-full bg-zinc-900/80 border border-zinc-800 rounded-2xl p-4 text-center text-neutral-400 text-xs font-semibold backdrop-blur-sm shadow-inner">
        <span className="inline-block animate-pulse mr-1.5">🔒</span>
        선택지에 투표를 완료하면 <span className="text-brand-yellow font-extrabold">실시간 득표율 게이지</span>가 동기화되어 보여집니다!
      </div>
    );
  }

  return (
    <div className="w-full bg-zinc-950/90 border border-zinc-800/80 rounded-2xl p-4 space-y-2 shadow-xl">
      {/* Header Info */}
      <div className="flex items-center justify-between text-xs font-black px-1">
        <span className="text-blue-400 truncate max-w-[42%]">
          A. {optionAText} ({percentA}%)
        </span>
        <span className="text-neutral-500 font-extrabold text-[11px] bg-zinc-900 px-2.5 py-0.5 rounded-full border border-zinc-800">
          총 {totalVotes}명 투표
        </span>
        <span className="text-rose-400 truncate max-w-[42%] text-right">
          B. {optionBText} ({percentB}%)
        </span>
      </div>

      {/* Dynamic Animated Tug-of-War Bar */}
      <div className="relative h-6 w-full bg-zinc-900 rounded-full overflow-hidden flex items-center p-0.5 border border-zinc-800 shadow-inner">
        {/* Option A Portion */}
        {percentA > 0 && (
          <motion.div
            className={`h-full bg-gradient-to-r from-blue-600 to-indigo-500 flex items-center justify-start pl-2 text-[10px] font-black text-white ${
              percentB === 0 ? 'rounded-full' : 'rounded-l-full'
            }`}
            initial={{ width: '50%' }}
            animate={{ width: `${percentA}%` }}
            transition={{ type: 'spring', stiffness: 120, damping: 18 }}
          >
            {percentA >= 10 && <span>{percentA}%</span>}
          </motion.div>
        )}

        {/* Option B Portion */}
        {percentB > 0 && (
          <motion.div
            className={`h-full bg-gradient-to-r from-rose-500 to-pink-600 flex items-center justify-end pr-2 text-[10px] font-black text-white ${
              percentA === 0 ? 'rounded-full' : 'rounded-r-full'
            }`}
            initial={{ width: '50%' }}
            animate={{ width: `${percentB}%` }}
            transition={{ type: 'spring', stiffness: 120, damping: 18 }}
          >
            {percentB >= 10 && <span>{percentB}%</span>}
          </motion.div>
        )}

        {/* Center Divider Indicator (Only visible if both A and B have >0%) */}
        {percentA > 0 && percentB > 0 && (
          <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-white/40 -translate-x-1/2 z-10 pointer-events-none" />
        )}
      </div>
    </div>
  );
}

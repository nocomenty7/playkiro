'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Tv, ChevronRight } from 'lucide-react';

interface BasicPlayModeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectSingle: () => void;
  onSelectMulti: () => void;
}

export default function BasicPlayModeModal({
  isOpen,
  onClose,
  onSelectSingle,
  onSelectMulti,
}: BasicPlayModeModalProps) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/20 dark:bg-black/80 backdrop-blur-sm"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ type: 'spring', damping: 25, stiffness: 260 }}
          className="relative z-10 w-full max-w-md overflow-hidden rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#0d0e1b] p-6 shadow-2xl backdrop-blur-xl"
        >
          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-full bg-zinc-100 dark:bg-zinc-900 text-zinc-500 dark:text-neutral-400 hover:bg-zinc-200 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Modal Header */}
          <div className="mb-6 pr-8">
            <h2 className="text-xl font-black text-zinc-900 dark:text-white tracking-tight">
              플레이 방식 선택
            </h2>
            <p className="text-xs text-zinc-500 dark:text-neutral-400 mt-1">
              1,000+ 기로 기본 문제를 어떻게 즐길지 선택해 주세요.
            </p>
          </div>

          {/* Options */}
          <div className="space-y-3.5">
            {/* Option 1: Single Mode */}
            <button
              type="button"
              onClick={onSelectSingle}
              className="w-full text-left group relative rounded-2xl border border-amber-200 dark:border-amber-500/40 bg-gradient-to-r from-amber-50 via-white to-white dark:from-amber-500/10 dark:via-zinc-900/80 dark:to-zinc-900 p-4 transition-all hover:border-amber-300 dark:hover:border-amber-400 hover:scale-[1.01] active:scale-[0.99] cursor-pointer shadow-sm dark:shadow-lg"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="p-2.5 rounded-xl bg-amber-100 dark:bg-amber-500/20 border border-amber-200 dark:border-amber-500/40 text-amber-600 dark:text-amber-400 shrink-0">
                    <User className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <span className="font-black text-sm text-zinc-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-300 transition-colors">
                        👤 혼자 플레이하기 (싱글모드)
                      </span>
                    </div>
                    <p className="text-xs text-zinc-500 dark:text-neutral-400 mt-1 leading-relaxed break-keep">
                      원하는 카테고리를 골라 혼자 풀면서 성별·연령대별 실시간 통계를 확인합니다.
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-amber-400 group-hover:translate-x-1 transition-transform shrink-0 self-center" />
              </div>
            </button>

            {/* Option 2: Multi Mode */}
            <button
              type="button"
              onClick={onSelectMulti}
              className="w-full text-left group relative rounded-2xl border border-purple-200 dark:border-purple-500/40 bg-gradient-to-r from-purple-50 via-white to-white dark:from-purple-500/10 dark:via-zinc-900/80 dark:to-zinc-900 p-4 transition-all hover:border-purple-300 dark:hover:border-purple-400 hover:scale-[1.01] active:scale-[0.99] cursor-pointer shadow-sm dark:shadow-lg"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="p-2.5 rounded-xl bg-purple-100 dark:bg-purple-500/20 border border-purple-200 dark:border-purple-500/40 text-purple-600 dark:text-purple-400 shrink-0">
                    <Tv className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <span className="font-black text-sm text-zinc-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-300 transition-colors">
                        📺 함께 플레이하기 (멀티모드)
                      </span>
                    </div>
                    <p className="text-xs text-zinc-500 dark:text-neutral-400 mt-1 leading-relaxed break-keep">
                      치지직·SOOP 방송 채팅 연동 또는 PIN 코드 방 만들기로 다 같이 투표합니다.
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-purple-400 group-hover:translate-x-1 transition-transform shrink-0 self-center" />
              </div>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

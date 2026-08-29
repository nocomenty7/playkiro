'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MessageSquare, Users, Sparkles, ChevronRight } from 'lucide-react';

interface PlayModeSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectDirectJoin: () => void;
  onSelectChatIntegration: () => void;
}

export default function PlayModeSelectModal({
  isOpen,
  onClose,
  onSelectDirectJoin,
  onSelectChatIntegration,
}: PlayModeSelectModalProps) {
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
          className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ type: 'spring', damping: 25, stiffness: 260 }}
          className="relative z-10 w-full max-w-md overflow-hidden rounded-3xl border border-zinc-800 bg-[#0d0e1b] p-6 text-white shadow-2xl backdrop-blur-xl"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-full bg-zinc-900 text-neutral-400 hover:text-white hover:bg-zinc-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Modal Header */}
          <div className="mb-6">
            <h2 className="text-xl font-black text-white tracking-tight">
              함께 플레이하기 방식 선택
            </h2>
            <p className="text-xs text-neutral-400 mt-1">
              진행하고자 하는 함께 플레이 방식을 선택해 주세요.
            </p>
          </div>

          {/* Mode Options List */}
          <div className="space-y-3.5">
            {/* Mode 1: Chat Integration */}
            <button
              type="button"
              onClick={onSelectChatIntegration}
              className="w-full text-left group relative rounded-2xl border border-purple-500/40 bg-gradient-to-r from-purple-500/10 via-zinc-900/80 to-zinc-900 p-4 transition-all hover:border-purple-400 hover:scale-[1.01] active:scale-[0.99] cursor-pointer shadow-lg"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-purple-500/20 border border-purple-500/40 text-purple-300">
                    <MessageSquare className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-black text-sm text-white group-hover:text-purple-300 transition-colors">
                        1. 채팅 연동 방식 (치지직, 숲 지원)
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-purple-500/20 text-purple-300 border border-purple-500/30">
                        강력추천
                      </span>
                    </div>
                    <p className="text-xs text-neutral-400 mt-1 leading-relaxed break-keep">
                      치지직, SOOP 방송 채팅창에서 !1, !2를 입력받아 실시간으로 투표를 집계하는 방식입니다.
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-purple-400 group-hover:translate-x-1 transition-transform shrink-0 self-center" />
              </div>
            </button>

            {/* Mode 2: Create Room & Direct Viewer Join */}
            <button
              type="button"
              onClick={() => {
                onSelectDirectJoin();
              }}
              className="w-full text-left group relative rounded-2xl border border-amber-500/40 bg-gradient-to-r from-amber-500/10 via-zinc-900/80 to-zinc-900 p-4 transition-all hover:border-amber-400 hover:scale-[1.01] active:scale-[0.99] cursor-pointer shadow-lg"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-black text-sm text-white group-hover:text-amber-300 transition-colors">
                        2. 방을 만들고 시청자가 직접 입장
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-400/20 text-amber-300 border border-amber-400/30">
                        기존 방식
                      </span>
                    </div>
                    <p className="text-xs text-neutral-400 mt-1 leading-relaxed break-keep">
                      방을 생성한 뒤 PIN 코드를 공유하여 시청자들이 직접 접속해 예측 게임을 플레이합니다.
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-amber-400 group-hover:translate-x-1 transition-transform shrink-0 self-center" />
              </div>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

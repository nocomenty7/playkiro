'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Copy, Check, MessageSquare, ExternalLink } from 'lucide-react';

interface ShareSheetProps {
  onClose: () => void;
  shareUrl: string;
  questionTitle: string;
}

export default function ShareSheet({ onClose, shareUrl, questionTitle }: ShareSheetProps) {
  const [copied, setCopied] = useState(false);
  const [showInstaGuide, setShowInstaGuide] = useState(false);

  // Initialize Kakao SDK if present
  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).Kakao) {
      const Kakao = (window as any).Kakao;
      if (!Kakao.isInitialized()) {
        Kakao.init('83fc930297eef5057e117b3fcb4c4337');
      }
    }
  }, []);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleKakaoShare = () => {
    if (typeof window !== 'undefined') {
      const Kakao = (window as any).Kakao;
      if (Kakao && Kakao.isInitialized()) {
        const currentUrl = window.location.href;
        Kakao.Share.sendDefault({
          objectType: 'feed',
          content: {
            title: '기로 - 세상의 모든 극한 밸런스게임',
            description: questionTitle,
            imageUrl: 'https://playkiro.kr/og-image.png',
            link: {
              mobileWebUrl: currentUrl,
              webUrl: currentUrl,
            },
          },
          buttons: [
            {
              title: '게임하러 가기',
              link: {
                mobileWebUrl: currentUrl,
                webUrl: currentUrl,
              },
            },
          ],
        });
      } else {
        alert('카카오톡 SDK를 로드할 수 없습니다. 잠시 후 다시 시도해 주세요.');
      }
    }
  };

  const handleInstagramShare = () => {
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
    setShowInstaGuide(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/75">
      {/* Backdrop */}
      <div className="absolute inset-0" onClick={onClose} />

      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 220 }}
        className="relative z-10 w-full max-w-md rounded-t-3xl bg-[#0c0d1b] border-t border-zinc-900 p-6 text-white shadow-2xl flex flex-col overflow-hidden max-h-[75dvh]"
      >
        <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-neutral-700 cursor-pointer shrink-0" onClick={onClose} />

        <div className="mb-5 flex items-center justify-between shrink-0">
          <h3 className="text-xl font-black tracking-tight">공유하기</h3>
          <button
            onClick={onClose}
            className="rounded-full bg-zinc-900 p-2 text-neutral-400 hover:bg-zinc-800 hover:text-white transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Buttons List */}
        <div className="space-y-3 pb-6 flex-1 overflow-y-auto min-h-0 pr-1">
          {/* Kakao Talk button */}
          <button
            onClick={handleKakaoShare}
            className="flex w-full items-center gap-3 rounded-2xl bg-[#FEE500] hover:bg-[#FEE500]/90 text-[#191919] font-extrabold p-4 transition-all shadow-md text-sm cursor-pointer"
          >
            <MessageSquare className="h-5 w-5 fill-[#191919] stroke-none" />
            <span>카카오톡으로 공유하기</span>
          </button>

          {/* Instagram button */}
          <button
            onClick={handleInstagramShare}
            className="flex w-full items-center gap-3 rounded-2xl bg-gradient-to-r from-[#833AB4] via-[#FD1D1D] to-[#F56040] hover:opacity-90 text-white font-extrabold p-4 transition-all shadow-md text-sm cursor-pointer"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-5 w-5"
            >
              <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
              <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
              <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
            </svg>
            <span>인스타그램 스토리에 공유</span>
          </button>

          {/* Copy URL button */}
          <button
            onClick={handleCopyLink}
            className="flex w-full items-center justify-between rounded-2xl bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-neutral-200 font-extrabold p-4 transition-all shadow-md text-sm cursor-pointer"
          >
            <div className="flex items-center gap-3">
              {copied ? <Check className="h-5 w-5 text-emerald-500" /> : <Copy className="h-5 w-5" />}
              <span>{copied ? '복사되었습니다!' : '링크 주소 복사하기'}</span>
            </div>
            <ExternalLink className="h-4 w-4 text-neutral-500" />
          </button>

          {/* Instagram Story Sharing Guidance Dialog */}
          <AnimatePresence>
            {showInstaGuide && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="rounded-2xl bg-[#14162e] border border-zinc-900 p-4 mt-3 text-xs leading-relaxed text-neutral-400 space-y-2"
              >
                <div className="flex items-center gap-1.5 text-neutral-200 font-bold mb-1">
                  <span className="text-sm">💡</span>
                  <span>인스타그램 스토리 공유 팁</span>
                </div>
                <p>
                  1. 게임 링크가 클립보드에 **자동으로 복사**되었습니다.
                </p>
                <p>
                  2. 인스타그램 스토리에 원하시는 꾸미기 이미지나 사진을 올리고 **'링크' 스티커** 기능을 사용해 복사된 링크를 붙여넣어 함께 공유해 보세요!
                </p>
                <button
                  onClick={() => setShowInstaGuide(false)}
                  className="text-white font-bold hover:underline underline-offset-4 mt-2 block"
                >
                  닫기
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}

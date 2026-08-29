'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { X } from 'lucide-react';

export default function NoticePopup() {
  const ENABLE_NOTICE_POPUP = false; // 공지사항 팝업 활성화 여부 (재활용 시 true로 변경)
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!ENABLE_NOTICE_POPUP) return;

    // 로컬 스토리지에서 'hideNoticeUntil_260824' 값을 확인하여 팝업 표시 여부 결정
    const hideUntil = localStorage.getItem('hideNoticeUntil_260824');
    if (hideUntil) {
      const hideUntilDate = new Date(hideUntil);
      if (new Date() < hideUntilDate) {
        return; // 아직 자정이 지나지 않았으므로 팝업 띄우지 않음
      }
    }
    // 조건에 걸리지 않으면 팝업 오픈
    setIsOpen(true);
  }, []);

  const handleClose = () => {
    setIsOpen(false);
  };

  const handleDoNotShowToday = () => {
    const tomorrow = new Date();
    tomorrow.setHours(24, 0, 0, 0); // 오늘 자정으로 설정
    localStorage.setItem('hideNoticeUntil_260824', tomorrow.toISOString());
    setIsOpen(false); // 체크 즉시 창 닫기
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative bg-zinc-900 rounded-2xl overflow-hidden shadow-2xl max-w-xl w-full animate-in zoom-in-95 duration-200">
        
        {/* X 닫기 버튼 */}
        <button
          onClick={handleClose}
          className="absolute top-3 right-3 z-10 p-2 bg-black/40 hover:bg-black/70 rounded-full text-white/80 hover:text-white backdrop-blur-md transition-all"
          aria-label="닫기"
        >
          <X className="w-5 h-5" />
        </button>
        
        {/* 공지사항 이미지 (비율은 원본에 맞게 object-contain 지원) */}
        <div className="relative w-full aspect-[4/5] bg-zinc-950 flex items-center justify-center">
          <Image
            src="/260824.png"
            alt="공지사항"
            fill
            className="object-contain"
            priority
          />
        </div>
        
        {/* 하단 컨트롤 바 */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-zinc-900 border-t border-zinc-800">
          <label className="flex items-center space-x-2.5 cursor-pointer group">
            <input 
              type="checkbox"
              onChange={handleDoNotShowToday}
              className="w-4 h-4 rounded border-zinc-600 bg-zinc-800 text-brand-yellow focus:ring-brand-yellow focus:ring-offset-zinc-900 cursor-pointer"
            />
            <span className="text-sm font-medium text-zinc-400 group-hover:text-zinc-200 transition-colors">
              오늘 하루 열지 않음
            </span>
          </label>
          <button 
            onClick={handleClose}
            className="text-sm font-bold text-zinc-400 hover:text-white transition-colors"
          >
            닫기
          </button>
        </div>

      </div>
    </div>
  );
}

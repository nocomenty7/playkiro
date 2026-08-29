'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MessageSquare, Loader2, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface ChatStreamerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ChatStreamerModal({ isOpen, onClose }: ChatStreamerModalProps) {
  const router = useRouter();

  const [streamerNickname, setStreamerNickname] = useState('');
  const [platform, setPlatform] = useState<'chzzk' | 'soop'>('chzzk');
  const [channelId, setChannelId] = useState('');
  const [totalQuestions, setTotalQuestions] = useState(10);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(['전체']);
  const [questionCounts, setQuestionCounts] = useState<{ [key: string]: number }>({});

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const categoriesConfig = [
    { name: '전체', activeClass: 'border-white bg-white text-zinc-950', inactiveClass: 'border-zinc-800 bg-zinc-900/50 text-neutral-400 hover:border-zinc-700' },
    { name: '음식', activeClass: 'border-red-500 bg-red-500 text-white', inactiveClass: 'border-red-500/30 bg-red-500/5 text-red-400 hover:border-red-500/50' },
    { name: '일상', activeClass: 'border-orange-500 bg-orange-500 text-white', inactiveClass: 'border-orange-500/30 bg-orange-500/5 text-orange-400 hover:border-orange-500/50' },
    { name: '스타일', activeClass: 'border-purple-500 bg-purple-500 text-white', inactiveClass: 'border-purple-500/30 bg-purple-500/5 text-purple-400 hover:border-purple-500/50' },
    { name: '여가', activeClass: 'border-green-500 bg-green-500 text-white', inactiveClass: 'border-green-500/30 bg-green-500/5 text-green-400 hover:border-green-500/50' },
    { name: '관계', activeClass: 'border-blue-500 bg-blue-500 text-white', inactiveClass: 'border-blue-500/30 bg-blue-500/5 text-blue-400 hover:border-blue-500/50' },
    { name: '돈', activeClass: 'border-[#8b5a2b] bg-[#8b5a2b] text-white', inactiveClass: 'border-[rgba(139,90,43,0.3)] bg-[rgba(139,90,43,0.05)] text-[#d2b48c] hover:border-[rgba(139,90,43,0.5)]' },
    { name: '상상', activeClass: 'border-pink-500 bg-pink-500 text-white', inactiveClass: 'border-pink-500/30 bg-pink-500/5 text-pink-400 hover:border-pink-500/50' },
    { name: '극한 밸런스게임', activeClass: 'border-neutral-500 bg-neutral-500 text-white', inactiveClass: 'border-neutral-500/30 bg-neutral-500/5 text-neutral-400 hover:border-neutral-500/50' }
  ];

  // Fetch question counts dynamically
  useEffect(() => {
    if (!isOpen) return;
    const fetchCounts = async () => {
      try {
        const { data } = await supabase.from('questions').select('category');
        if (data) {
          const counts: { [key: string]: number } = {};
          let total = 0;
          data.forEach((q: any) => {
            const cat = q.category?.trim();
            if (cat) {
              counts[cat] = (counts[cat] || 0) + 1;
              total++;
            }
          });
          counts['전체'] = total;
          setQuestionCounts(counts);
        }
      } catch (e) {
        console.error('Failed to fetch category counts inside ChatStreamerModal:', e);
      }
    };
    fetchCounts();
  }, [isOpen]);

  const toggleCategory = (catName: string) => {
    if (catName === '전체') {
      setSelectedCategories(['전체']);
    } else {
      const activeWithoutAll = selectedCategories.filter((c) => c !== '전체');
      if (activeWithoutAll.includes(catName)) {
        const next = activeWithoutAll.filter((c) => c !== catName);
        setSelectedCategories(next.length === 0 ? ['전체'] : next);
      } else {
        setSelectedCategories([...activeWithoutAll, catName]);
      }
    }
  };

  const handleStartChatStream = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const nickname = streamerNickname.trim() || '스트리머';
    const idInput = channelId.trim();

    if (!idInput) {
      setErrorMsg(platform === 'chzzk' ? '치지직 채널 ID를 입력해 주세요.' : 'SOOP BJ 아이디를 입력해 주세요.');
      return;
    }

    setLoading(true);

    try {
      // Connect check
      const res = await fetch('/api/chat/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform,
          channelId: idInput,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || '채널 정보를 확인할 수 없습니다.');
      }

      // Store chat room config in sessionStorage
      const config = {
        nickname,
        platform,
        channelId: data.channelId,
        chatChannelId: data.chatChannelId || '',
        bno: data.bno || '',
        channelName: data.channelName || nickname,
        categories: selectedCategories,
        totalQuestions,
        accessToken: data.accessToken || '',
      };

      sessionStorage.setItem('kiro_chat_room_config', JSON.stringify(config));

      onClose();
      router.push('/streamer/chat');
    } catch (err: any) {
      setErrorMsg(err.message || '채팅 연동 처리 중 오류가 발생했습니다.');
      setLoading(false);
    }
  };

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

        {/* Modal Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ type: 'spring', damping: 25, stiffness: 260 }}
          className="relative z-10 w-full max-w-md max-h-[90vh] overflow-y-auto rounded-3xl border border-zinc-800 bg-[#0d0e1b] p-6 text-white shadow-2xl backdrop-blur-xl no-scrollbar"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-full bg-zinc-900 text-neutral-400 hover:text-white hover:bg-zinc-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Modal Header */}
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-purple-500/20 to-indigo-500/20 border border-purple-500/30 text-purple-400">
              <MessageSquare className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white tracking-tight">방송 채팅 연동 모드</h2>
              <p className="text-xs text-neutral-400">시청자가 방송 채팅창에 !1, !2를 입력하여 실시간 표를 집계합니다.</p>
            </div>
          </div>

          {errorMsg && (
            <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-400 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleStartChatStream} className="space-y-4">
            {/* Platform Selection */}
            <div>
              <label className="block text-xs font-extrabold text-neutral-300 mb-1.5">방송 플랫폼 선택</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPlatform('chzzk')}
                  className={`py-3 rounded-xl text-xs font-black border transition-all cursor-pointer flex items-center justify-center gap-2 ${
                    platform === 'chzzk'
                      ? 'border-emerald-500 bg-emerald-500/15 text-emerald-300 shadow-md'
                      : 'border-zinc-800 bg-zinc-900 text-neutral-400'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span>치지직 (CHZZK)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPlatform('soop')}
                  className={`py-3 rounded-xl text-xs font-black border transition-all cursor-pointer flex items-center justify-center gap-2 ${
                    platform === 'soop'
                      ? 'border-blue-500 bg-blue-500/15 text-blue-300 shadow-md'
                      : 'border-zinc-800 bg-zinc-900 text-neutral-400'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-blue-400" />
                  <span>숲 (SOOP / 아프리카TV)</span>
                </button>
              </div>
            </div>

            {/* Streamer Nickname */}
            <div>
              <label className="block text-xs font-extrabold text-neutral-300 mb-1.5">스트리머 닉네임</label>
              <input
                type="text"
                placeholder="스트리머 닉네임을 입력하세요"
                value={streamerNickname}
                onChange={(e) => setStreamerNickname(e.target.value)}
                className="w-full rounded-xl border border-zinc-800 bg-zinc-900/80 px-4 py-3 text-xs text-white placeholder-zinc-500 focus:border-purple-500 focus:outline-none"
              />
            </div>

            {/* Channel ID or BJ ID */}
            <div>
              <label className="block text-xs font-extrabold text-neutral-300 mb-1.5">
                {platform === 'chzzk' ? '치지직 채널 ID (또는 채널 URL)' : 'SOOP BJ 아이디 (또는 방송 URL)'}
              </label>
              <input
                type="text"
                placeholder={
                  platform === 'chzzk'
                    ? '예: c4c0bc06b00000000000000000 (채널 URL 복사 붙여넣기 가능)'
                    : '예: bjhandletest (방송 URL 복사 붙여넣기 가능)'
                }
                value={channelId}
                onChange={(e) => setChannelId(e.target.value)}
                className="w-full rounded-xl border border-zinc-800 bg-zinc-900/80 px-4 py-3 text-xs text-white placeholder-zinc-500 focus:border-purple-500 focus:outline-none"
              />
              <p className="text-[10px] text-zinc-500 mt-1">
                * 방송 주소를 그대로 붙여넣으셔도 자동으로 인식합니다. (별도 API 키 필요 없음)
              </p>
            </div>

            {/* Total Questions */}
            <div>
              <label className="block text-xs font-extrabold text-neutral-300 mb-1.5">총 라운드 문제 수</label>
              <div className="grid grid-cols-3 gap-2">
                {[10, 20, 30].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setTotalQuestions(num)}
                    className={`py-2 rounded-xl text-xs font-black border transition-all cursor-pointer ${
                      totalQuestions === num
                        ? 'border-purple-500 bg-purple-500/20 text-purple-300'
                        : 'border-zinc-800 bg-zinc-900 text-neutral-400'
                    }`}
                  >
                    {num}문제
                  </button>
                ))}
              </div>
            </div>

            {/* Category Filter */}
            <div className="border-t border-zinc-900/80 pt-3">
              <label className="flex items-center justify-between text-xs font-extrabold text-neutral-300 mb-2">
                <span>카테고리 필터</span>
                <span className="text-amber-400/90 text-xs font-bold">(복수 선택 가능)</span>
              </label>

              <div className="mb-2.5">
                {categoriesConfig.filter(c => c.name === '전체').map((cat) => {
                  const isActive = selectedCategories.includes(cat.name);
                  const count = questionCounts[cat.name];
                  return (
                    <button
                      key={cat.name}
                      type="button"
                      onClick={() => toggleCategory(cat.name)}
                      className={`w-full px-3 py-2 rounded-full text-xs font-black border transition-all cursor-pointer text-center ${
                        isActive ? cat.activeClass : cat.inactiveClass
                      }`}
                    >
                      {cat.name} {count !== undefined ? `(${count})` : ''}
                    </button>
                  );
                })}
              </div>

              <div className="flex flex-wrap gap-2">
                {categoriesConfig.filter(c => c.name !== '전체').map((cat) => {
                  const isActive = selectedCategories.includes(cat.name);
                  const count = questionCounts[cat.name];
                  return (
                    <button
                      key={cat.name}
                      type="button"
                      onClick={() => toggleCategory(cat.name)}
                      className={`px-3 py-2 rounded-full text-xs font-black border transition-all cursor-pointer ${
                        isActive ? cat.activeClass : cat.inactiveClass
                      }`}
                    >
                      {cat.name} {count !== undefined ? `(${count})` : ''}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-black text-sm transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-4"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>방송 연동 확인 중...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-purple-200" />
                  <span>방송 채팅 연동 게임 시작하기</span>
                </>
              )}
            </button>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

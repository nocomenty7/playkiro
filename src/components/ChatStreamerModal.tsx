'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Tv, MessageSquare, Loader2, Sparkles, AlertCircle, Check } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface ChatStreamerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ChatStreamerModal({ isOpen, onClose }: ChatStreamerModalProps) {
  const router = useRouter();

  const [streamerNickname, setStreamerNickname] = useState('');
  const [hostGender, setHostGender] = useState('male');
  const [hostAgeGroup, setHostAgeGroup] = useState('20s');

  // Multi-platform selection (Chzzk and SOOP can be selected simultaneously)
  const [selectedPlatforms, setSelectedPlatforms] = useState<('chzzk' | 'soop')[]>(['chzzk']);
  const [chzzkChannelId, setChzzkChannelId] = useState('');
  const [soopBjId, setSoopBjId] = useState('');

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

  const togglePlatform = (p: 'chzzk' | 'soop') => {
    if (selectedPlatforms.includes(p)) {
      if (selectedPlatforms.length === 1) return; // Must keep at least 1
      setSelectedPlatforms(selectedPlatforms.filter((item) => item !== p));
    } else {
      setSelectedPlatforms([...selectedPlatforms, p]);
    }
  };

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

    if (selectedPlatforms.includes('chzzk') && !chzzkChannelId.trim()) {
      setErrorMsg('치지직 채널 ID 또는 방송 URL을 입력해 주세요.');
      return;
    }

    if (selectedPlatforms.includes('soop') && !soopBjId.trim()) {
      setErrorMsg('SOOP BJ 아이디 또는 방송 URL을 입력해 주세요.');
      return;
    }

    setLoading(true);

    try {
      let chzzkData: any = null;
      let soopData: any = null;

      // Connect check for Chzzk if selected
      if (selectedPlatforms.includes('chzzk')) {
        const res = await fetch('/api/chat/connect', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            platform: 'chzzk',
            channelId: chzzkChannelId.trim(),
          }),
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(`[치지직] ${data.error || '채널 정보를 확인할 수 없습니다.'}`);
        }
        chzzkData = data;
      }

      // Connect check for SOOP if selected
      if (selectedPlatforms.includes('soop')) {
        const res = await fetch('/api/chat/connect', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            platform: 'soop',
            channelId: soopBjId.trim(),
          }),
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(`[SOOP] ${data.error || 'BJ 정보를 확인할 수 없습니다.'}`);
        }
        soopData = data;
      }

      // Store multi-platform chat room config in sessionStorage
      const config = {
        nickname,
        hostGender,
        hostAgeGroup,
        platforms: selectedPlatforms,
        chzzk: chzzkData,
        soop: soopData,
        categories: selectedCategories,
        totalQuestions,
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

        {/* Modal Container (Exact styling matching StreamerModal) */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ type: 'spring', damping: 25, stiffness: 260 }}
          className="relative z-10 w-full max-w-md max-h-[90vh] overflow-y-auto rounded-3xl border border-zinc-800 bg-[#0d0e1d] p-6 text-white shadow-2xl backdrop-blur-xl no-scrollbar"
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
              <h2 className="text-xl font-black text-white tracking-tight">함께 플레이하기 (방송 채팅 연동)</h2>
              <p className="text-xs text-neutral-400">실시간으로 시청자들의 방송 채팅(!1, !2)을 집계하세요!</p>
            </div>
          </div>

          {errorMsg && (
            <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-400 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleStartChatStream} className="space-y-4">
            {/* Streamer Nickname */}
            <div>
              <label className="block text-xs font-extrabold text-neutral-300 mb-1.5">스트리머 닉네임</label>
              <input
                type="text"
                placeholder="본인 닉네임을 입력하세요 (방송 화면 표시용)"
                value={streamerNickname}
                onChange={(e) => setStreamerNickname(e.target.value)}
                className="w-full rounded-xl border border-zinc-800 bg-zinc-900/80 px-4 py-3 text-xs text-white placeholder-zinc-500 focus:border-purple-500 focus:outline-none"
              />
            </div>

            {/* Gender and Age Group (Exact match with screenshot) */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-extrabold text-neutral-300 mb-1.5">성별</label>
                <select
                  value={hostGender}
                  onChange={(e) => setHostGender(e.target.value)}
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-900/80 px-3 py-3 text-xs text-white focus:border-purple-500 focus:outline-none cursor-pointer"
                >
                  <option value="male">남성</option>
                  <option value="female">여성</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-extrabold text-neutral-300 mb-1.5">연령대</label>
                <select
                  value={hostAgeGroup}
                  onChange={(e) => setHostAgeGroup(e.target.value)}
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-900/80 px-3 py-3 text-xs text-white focus:border-purple-500 focus:outline-none cursor-pointer"
                >
                  <option value="10s">10대</option>
                  <option value="20s">20대</option>
                  <option value="30s">30대</option>
                  <option value="40s">40대</option>
                  <option value="50s">50대</option>
                  <option value="60s">60대 이상</option>
                </select>
              </div>
            </div>
            {/* Enlarged statistic notice text */}
            <p className="text-xs text-neutral-300 font-bold leading-relaxed mt-1.5">
              * 해당 정보는 단순 통계 저장용도로 사용됩니다.
            </p>

            {/* Multi-Platform Selection (Checkboxes / Multi-select) */}
            <div className="border-t border-zinc-900/80 pt-3">
              <label className="flex items-center justify-between text-xs font-extrabold text-neutral-300 mb-2">
                <span>방송 플랫폼 연동</span>
                <span className="text-amber-400/90 text-xs font-bold">(복수 선택 가능)</span>
              </label>

              <div className="grid grid-cols-2 gap-2 mb-3">
                <button
                  type="button"
                  onClick={() => togglePlatform('chzzk')}
                  className={`py-3 px-3 rounded-xl text-xs font-black border transition-all cursor-pointer flex items-center justify-between ${
                    selectedPlatforms.includes('chzzk')
                      ? 'border-emerald-500 bg-emerald-500/15 text-emerald-300 shadow-md'
                      : 'border-zinc-800 bg-zinc-900 text-neutral-400'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span>치지직 (CHZZK)</span>
                  </div>
                  {selectedPlatforms.includes('chzzk') && <Check className="w-4 h-4 text-emerald-400" />}
                </button>

                <button
                  type="button"
                  onClick={() => togglePlatform('soop')}
                  className={`py-3 px-3 rounded-xl text-xs font-black border transition-all cursor-pointer flex items-center justify-between ${
                    selectedPlatforms.includes('soop')
                      ? 'border-blue-500 bg-blue-500/15 text-blue-300 shadow-md'
                      : 'border-zinc-800 bg-zinc-900 text-neutral-400'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-400" />
                    <span>숲 (SOOP)</span>
                  </div>
                  {selectedPlatforms.includes('soop') && <Check className="w-4 h-4 text-blue-400" />}
                </button>
              </div>

              {/* Dynamic Inputs per selected platform */}
              <div className="space-y-3">
                {selectedPlatforms.includes('chzzk') && (
                  <div>
                    <label className="block text-xs font-bold text-emerald-300 mb-1">
                      치지직 채널 ID (또는 채널 URL)
                    </label>
                    <input
                      type="text"
                      placeholder="예: c4c0bc06b00000000000000000 (치지직 채널 주소 복사 붙여넣기 가능)"
                      value={chzzkChannelId}
                      onChange={(e) => setChzzkChannelId(e.target.value)}
                      className="w-full rounded-xl border border-emerald-500/30 bg-zinc-900/90 px-4 py-2.5 text-xs text-white placeholder-zinc-500 focus:border-emerald-400 focus:outline-none"
                    />
                  </div>
                )}

                {selectedPlatforms.includes('soop') && (
                  <div>
                    <label className="block text-xs font-bold text-blue-300 mb-1">
                      SOOP BJ 아이디 (또는 방송 URL)
                    </label>
                    <input
                      type="text"
                      placeholder="예: bjhandletest (방송 주소 복사 붙여넣기 가능)"
                      value={soopBjId}
                      onChange={(e) => setSoopBjId(e.target.value)}
                      className="w-full rounded-xl border border-blue-500/30 bg-zinc-900/90 px-4 py-2.5 text-xs text-white placeholder-zinc-500 focus:border-blue-400 focus:outline-none"
                    />
                  </div>
                )}
              </div>

              {/* Enlarged Notice Text */}
              <p className="text-xs text-neutral-300 font-bold leading-relaxed pt-2">
                * 방송 주소를 그대로 붙여넣으셔도 자동으로 인식합니다. (별도 API 키 필요 없음)
              </p>
            </div>

            {/* Total Questions (Exact match with screenshot: '총 문제 수') */}
            <div className="border-t border-zinc-900/80 pt-3">
              <label className="block text-xs font-extrabold text-neutral-300 mb-1.5">총 문제 수</label>
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

            {/* Category Filter (Exact match with screenshot) */}
            <div className="border-t border-zinc-900/80 pt-3">
              <label className="flex items-center justify-between text-xs font-extrabold text-neutral-300 mb-2">
                <span>카테고리 필터</span>
                <span className="text-amber-400/90 text-xs font-bold">(복수 선택 가능)</span>
              </label>

              {/* '전체' Full-width button */}
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

              {/* Specific Categories */}
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

            {/* Submit Button (Purple Concept: '게임 시작') */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-black text-sm transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-4"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>방송 연동 및 질문 준비 중...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-purple-200" />
                  <span>게임 시작</span>
                </>
              )}
            </button>

            {/* Instant Offline Test Mode Button */}
            <button
              type="button"
              onClick={() => {
                const nickname = streamerNickname.trim() || '테스트스트리머';
                const config = {
                  nickname,
                  hostGender,
                  hostAgeGroup,
                  platforms: selectedPlatforms,
                  chzzk: { isDemo: true },
                  categories: selectedCategories,
                  totalQuestions,
                };
                sessionStorage.setItem('kiro_chat_room_config', JSON.stringify(config));
                onClose();
                router.push('/streamer/chat');
              }}
              className="w-full py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-neutral-400 hover:text-white font-extrabold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
            >
              <span>🧪 방송 없이 테스트 화면 바로가기</span>
            </button>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

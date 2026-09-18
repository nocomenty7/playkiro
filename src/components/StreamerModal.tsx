'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Tv, Users, ArrowRight, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface StreamerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Helper: Korean 12 chars, English 24 chars weight check
export const validateNicknameLength = (nickname: string): boolean => {
  let weight = 0;
  for (let i = 0; i < nickname.length; i++) {
    weight += nickname.charCodeAt(i) > 128 ? 1 : 0.5;
  }
  return weight <= 12; // Korean 12 chars, English 24 chars limit
};

export default function StreamerModal({ isOpen, onClose }: StreamerModalProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'create' | 'join'>('join');

  const [hostNickname, setHostNickname] = useState('');
  const [totalQuestions, setTotalQuestions] = useState(10);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(['전체']);
  const [creating, setCreating] = useState(false);
  const [questionCounts, setQuestionCounts] = useState<{ [key: string]: number }>({});

  // Join Form State
  const [joinPin, setJoinPin] = useState('');
  const [joinNickname, setJoinNickname] = useState('');
  const [joining, setJoining] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // All Questions Completed Alert Popup State
  const [completedAlert, setCompletedAlert] = useState<{ isOpen: boolean; title: string; message: string }>({
    isOpen: false,
    title: '',
    message: '',
  });

  const categoriesConfig = [
    { name: '전체', activeClass: 'border-zinc-900 bg-zinc-900 text-white dark:border-white dark:bg-white dark:text-[#080911]', inactiveClass: 'border-zinc-200 bg-zinc-50 text-zinc-500 hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-neutral-400 dark:hover:border-zinc-700' },
    { name: '음식', activeClass: 'border-red-500 bg-red-500 text-white', inactiveClass: 'border-red-200 bg-red-50 text-red-500 hover:border-red-300 dark:border-red-500/30 dark:bg-red-500/5 dark:text-red-400 dark:hover:border-red-500/50' },
    { name: '일상', activeClass: 'border-orange-500 bg-orange-500 text-white', inactiveClass: 'border-orange-200 bg-orange-50 text-orange-500 hover:border-orange-300 dark:border-orange-500/30 dark:bg-orange-500/5 dark:text-orange-400 dark:hover:border-orange-500/50' },
    { name: '스타일', activeClass: 'border-purple-500 bg-purple-500 text-white', inactiveClass: 'border-purple-200 bg-purple-50 text-purple-500 hover:border-purple-300 dark:border-purple-500/30 dark:bg-purple-500/5 dark:text-purple-400 dark:hover:border-purple-500/50' },
    { name: '여가', activeClass: 'border-green-500 bg-green-500 text-white', inactiveClass: 'border-green-200 bg-green-50 text-green-500 hover:border-green-300 dark:border-green-500/30 dark:bg-green-500/5 dark:text-green-400 dark:hover:border-green-500/50' },
    { name: '관계', activeClass: 'border-blue-500 bg-blue-500 text-white', inactiveClass: 'border-blue-200 bg-blue-50 text-blue-500 hover:border-blue-300 dark:border-blue-500/30 dark:bg-blue-500/5 dark:text-blue-400 dark:hover:border-blue-500/50' },
    { name: '돈', activeClass: 'border-[#8b5a2b] bg-[#8b5a2b] text-white', inactiveClass: 'border-[#8b5a2b]/30 bg-[#8b5a2b]/5 text-[#8b5a2b] hover:border-[#8b5a2b]/50 dark:border-[rgba(139,90,43,0.3)] dark:bg-[rgba(139,90,43,0.05)] dark:text-[#d2b48c] dark:hover:border-[rgba(139,90,43,0.5)]' },
    { name: '상상', activeClass: 'border-pink-500 bg-pink-500 text-white', inactiveClass: 'border-pink-200 bg-pink-50 text-pink-500 hover:border-pink-300 dark:border-pink-500/30 dark:bg-pink-500/5 dark:text-pink-400 dark:hover:border-pink-500/50' },
    { name: '극한 밸런스게임', activeClass: 'border-zinc-500 bg-zinc-500 text-white dark:border-neutral-500 dark:bg-neutral-500', inactiveClass: 'border-zinc-200 bg-zinc-50 text-zinc-600 hover:border-zinc-300 dark:border-neutral-500/30 dark:bg-neutral-500/5 dark:text-neutral-400 dark:hover:border-neutral-500/50' }
  ];

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
        console.error('Failed to fetch category counts inside StreamerModal:', e);
      }
    };
    fetchCounts();
  }, [isOpen]);

  const toggleCategory = (catName: string) => {
    if (catName === '전체') {
      setSelectedCategories(['전체']);
    } else {
      let updated = selectedCategories.filter((c) => c !== '전체');
      if (updated.includes(catName)) {
        updated = updated.filter((c) => c !== catName);
      } else {
        updated.push(catName);
      }
      if (updated.length === 0) updated = ['전체'];
      setSelectedCategories(updated);
    }
  };

  const getSessionId = () => {
    if (typeof window === 'undefined') return '';
    let sid = localStorage.getItem('kiro_streamer_session_id');
    if (!sid) {
      sid = 'session_' + Math.random().toString(36).substring(2, 9);
      localStorage.setItem('kiro_streamer_session_id', sid);
    }
    return sid;
  };

  const getAvailableQuestionCount = () => {
    if (selectedCategories.includes('전체')) {
      return questionCounts['전체'] || 0;
    }
    let total = 0;
    selectedCategories.forEach((cat) => {
      total += questionCounts[cat] || 0;
    });
    return total;
  };

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const trimmedNickname = hostNickname.trim();

    if (!trimmedNickname) {
      setErrorMsg('스트리머 닉네임을 입력해 주세요.');
      return;
    }

    if (!validateNicknameLength(trimmedNickname)) {
      setErrorMsg('닉네임은 한글 12자, 영문 24자 이내로 입력해 주세요.');
      return;
    }

    const availableCount = getAvailableQuestionCount();
    if (availableCount > 0 && availableCount < totalQuestions) {
      setErrorMsg(`선택한 카테고리의 총 문항 수(${availableCount}개)가 설정한 문제 수(${totalQuestions}개)보다 적습니다. 카테고리를 추가하거나 문제 수를 줄여주세요.`);
      return;
    }

    setCreating(true);

    try {
      const sessionId = getSessionId();
      let usedQuestionIds: string[] = [];
      try {
        const storedUsed = localStorage.getItem('kiro_streamer_used_questions');
        if (storedUsed) {
          usedQuestionIds = JSON.parse(storedUsed);
        }
      } catch (e) {
        usedQuestionIds = [];
      }

      const res = await fetch('/api/streamer/create-room', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hostNickname: trimmedNickname,
          hostSessionId: sessionId,
          categories: selectedCategories,
          totalQuestions,
          usedQuestionIds,
          roomMode: 'pin',
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        if (data.code === 'ALL_QUESTIONS_COMPLETED' || data.code === 'NOT_ENOUGH_UNPLAYED_QUESTIONS') {
          setCompletedAlert({
            isOpen: true,
            title: data.code === 'ALL_QUESTIONS_COMPLETED' 
              ? '선택하신 카테고리의 모든 문제를 다 풀었습니다!' 
              : '안 푼 남은 문제 수가 부족합니다!',
            message: data.error || '다른 카테고리를 선택해 주세요.',
          });
          setCreating(false);
          return;
        }
        throw new Error(data.error || '방 생성에 실패했습니다.');
      }

      // Record selected questions into streamer used questions history
      try {
        const newIds: string[] = data.selectedQuestionIds || [];
        const nextUsed = Array.from(new Set([...usedQuestionIds, ...newIds]));
        localStorage.setItem('kiro_streamer_used_questions', JSON.stringify(nextUsed));
      } catch (e) {
        // ignore storage errors
      }

      onClose();
      router.push(`/streamer/${data.pin}`);
    } catch (err: any) {
      setErrorMsg(err.message || '방 생성 도중 오류가 발생했습니다.');
      setCreating(false);
    }
  };

  const handleJoinRoom = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const pin = joinPin.trim();
    const nickname = joinNickname.trim();

    if (!pin || pin.length !== 6) {
      setErrorMsg('6자리 숫자 PIN 코드를 정확히 입력해 주세요.');
      return;
    }

    if (!nickname) {
      setErrorMsg('참여하실 닉네임을 입력해 주세요.');
      return;
    }

    if (!validateNicknameLength(nickname)) {
      setErrorMsg('닉네임은 한글 12자, 영문 24자 이내로 입력해 주세요.');
      return;
    }

    setJoining(true);
    sessionStorage.setItem(`kiro_viewer_nickname_${pin}`, nickname);
    onClose();
    router.push(`/streamer/${pin}`);
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
          className="absolute inset-0 bg-black/20 dark:bg-black/80 backdrop-blur-sm"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative z-10 w-full max-w-lg bg-white dark:bg-[#0d0e1d] border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-2xl text-zinc-900 dark:text-white overflow-hidden"
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-full bg-zinc-100 dark:bg-zinc-900 text-zinc-500 dark:text-neutral-400 hover:text-zinc-900 hover:bg-zinc-200 dark:hover:text-white dark:hover:bg-zinc-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Modal Header */}
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-brand-yellow/20 to-orange-500/20 border border-brand-yellow/30 text-brand-yellow">
              <Tv className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-zinc-900 dark:text-white tracking-tight">함께 플레이하기 (방을 만들고 시청자가 입장)</h2>
              <p className="text-xs text-zinc-500 dark:text-neutral-400">실시간으로 스트리머의 취향을 예측해보세요!</p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="grid grid-cols-2 gap-2 bg-zinc-100 dark:bg-zinc-950 p-1.5 rounded-2xl border border-zinc-200 dark:border-zinc-850 mb-6">
            <button
              onClick={() => {
                setActiveTab('join');
                setErrorMsg('');
              }}
              className={`py-2.5 px-4 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === 'join'
                  ? 'bg-amber-400 text-zinc-950 shadow-md font-black'
                  : 'text-zinc-500 dark:text-neutral-400 hover:text-zinc-800 dark:hover:text-neutral-200'
              }`}
            >
              <Users className="w-4 h-4 text-zinc-950" />
              <span>입장하기 (시청자)</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('create');
                setErrorMsg('');
              }}
              className={`py-2.5 px-4 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === 'create'
                  ? 'bg-[#FFD700] text-zinc-950 shadow-md font-black'
                  : 'text-zinc-500 dark:text-neutral-400 hover:text-zinc-800 dark:hover:text-neutral-200'
              }`}
            >
              <Tv className="w-4 h-4" />
              <span>방 만들기 (스트리머)</span>
            </button>
          </div>

          {errorMsg && (
            <div className="mb-4 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-bold text-center animate-pulse leading-relaxed">
              ⚠️ {errorMsg}
            </div>
          )}

          {/* Tab 1: Join Room (Viewer) */}
          {activeTab === 'join' && (
            <form onSubmit={handleJoinRoom} className="space-y-4">
              <div>
                <label className="block text-xs font-extrabold text-zinc-700 dark:text-neutral-300 mb-1.5">6자리 PIN 코드</label>
                <input
                  type="text"
                  maxLength={6}
                  placeholder="예: 849201"
                  value={joinPin}
                  onChange={(e) => setJoinPin(e.target.value.replace(/[^0-9]/g, ''))}
                  className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-lg font-black text-center tracking-widest text-amber-500 dark:text-amber-400 placeholder-zinc-400 dark:placeholder-zinc-700 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold text-zinc-700 dark:text-neutral-300 mb-1.5">시청자 닉네임</label>
                <input
                  type="text"
                  placeholder="본인 닉네임을 입력하세요."
                  value={joinNickname}
                  onChange={(e) => setJoinNickname(e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-sm font-bold text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none focus:border-amber-400"
                />
              </div>

              <button
                type="submit"
                disabled={joining}
                className="w-full py-3.5 rounded-xl bg-brand-yellow text-zinc-950 hover:bg-yellow-400 font-black text-sm transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {joining ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>입장 중...</span>
                  </>
                ) : (
                  <>
                    <span>입장하기</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Tab 2: Create Room (Streamer Host) */}
          {activeTab === 'create' && (
            <form onSubmit={handleCreateRoom} className="space-y-4 max-h-[60vh] overflow-y-auto pr-1 no-scrollbar">
              <div>
                <label className="block text-xs font-extrabold text-zinc-700 dark:text-neutral-300 mb-1.5">스트리머 닉네임</label>
                <input
                  type="text"
                  placeholder="본인 닉네임을 입력하세요."
                  value={hostNickname}
                  onChange={(e) => setHostNickname(e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-2.5 text-sm font-bold text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none focus:border-amber-400"
                />
              </div>



              <div>
                <label className="block text-xs font-extrabold text-zinc-700 dark:text-neutral-300 mb-1.5">총 문제 수</label>
                <div className="grid grid-cols-3 gap-2">
                  {[10, 20, 30].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setTotalQuestions(num)}
                      className={`py-2 rounded-xl text-xs font-black border transition-all cursor-pointer ${
                        totalQuestions === num
                          ? 'border-amber-400 bg-amber-50 dark:bg-amber-400/10 text-amber-500 dark:text-amber-400'
                          : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-500 dark:text-neutral-400 hover:border-zinc-300 dark:hover:border-zinc-700'
                      }`}
                    >
                      {num}문제
                    </button>
                  ))}
                </div>
              </div>

              {/* Category Filter Chips */}
              <div className="border-t border-zinc-200 dark:border-zinc-900/80 pt-3 mt-4">
                <label className="flex items-center justify-between text-xs font-extrabold text-zinc-700 dark:text-neutral-300 mb-3">
                  <span>카테고리 선택</span>
                  <span className="text-amber-500 dark:text-amber-400/90 text-[10px]">(복수 선택 가능)</span>
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
                        className={`px-3 py-1.5 rounded-full text-xs font-black border transition-all cursor-pointer ${
                          isActive ? cat.activeClass : cat.inactiveClass
                        }`}
                      >
                        {cat.name} {count !== undefined ? `(${count})` : ''}
                      </button>
                    );
                  })}
                </div>
              </div>

              <button
                type="submit"
                disabled={creating}
                className="w-full py-3.5 rounded-xl bg-[#FFD700] hover:bg-yellow-400 text-zinc-950 font-black text-sm transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-4"
              >
                {creating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-zinc-950" />
                    <span>방 생성 및 PIN 발급 중...</span>
                  </>
                ) : (
                  <span>방 만들기 & PIN 발급</span>
                )}
              </button>
            </form>
          )}
        </motion.div>

        {/* All Questions Completed Alert Modal */}
        <AnimatePresence>
          {completedAlert.isOpen && (
            <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/20 dark:bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 10 }}
                className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 max-w-sm w-full shadow-2xl text-center space-y-4 relative"
              >
                <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 text-amber-500 dark:text-amber-400 flex items-center justify-center mx-auto text-2xl">
                  🎉
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-black text-zinc-900 dark:text-white leading-snug break-keep">
                    {completedAlert.title}
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-neutral-400 font-bold leading-relaxed break-keep">
                    {completedAlert.message}
                  </p>
                </div>

                <div className="pt-2 flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setCompletedAlert({ isOpen: false, title: '', message: '' });
                    }}
                    className="w-full py-3 rounded-xl bg-[#FFD700] text-zinc-950 font-black text-sm hover:brightness-110 transition-all cursor-pointer shadow-md"
                  >
                    확인 (카테고리 변경하기)
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      try {
                        localStorage.removeItem('kiro_streamer_used_questions');
                      } catch (e) {}
                      setCompletedAlert({ isOpen: false, title: '', message: '' });
                      setErrorMsg('스트리머 풀었던 문제 이력이 초기화되었습니다. 방을 다시 생성해 주세요.');
                    }}
                    className="w-full py-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-neutral-400 hover:text-zinc-900 dark:hover:text-white font-bold text-xs hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all cursor-pointer"
                  >
                    풀었던 문제 기록 초기화하고 다시 풀기
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </AnimatePresence>
  );
}

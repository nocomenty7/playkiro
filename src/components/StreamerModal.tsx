'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Tv, Users, ArrowRight } from 'lucide-react';
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

  // Item 1: Initial Streamer Nickname state set to empty string
  const [hostNickname, setHostNickname] = useState('');
  const [hostGender, setHostGender] = useState('male');
  const [hostAgeGroup, setHostAgeGroup] = useState('20s');
  const [totalQuestions, setTotalQuestions] = useState(10);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(['전체']);
  const [creating, setCreating] = useState(false);
  const [questionCounts, setQuestionCounts] = useState<{ [key: string]: number }>({});

  // Join Form State
  const [joinPin, setJoinPin] = useState('');
  const [joinNickname, setJoinNickname] = useState('');
  const [joining, setJoining] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Identical Category Config and Color Themes from Navigation.tsx
  const categoriesConfig = [
    { name: '전체', activeClass: 'border-white bg-white text-[#080911]', inactiveClass: 'border-zinc-800 bg-zinc-900/50 text-neutral-400 hover:border-zinc-700' },
    { name: '음식', activeClass: 'border-red-500 bg-red-500 text-white', inactiveClass: 'border-red-500/30 bg-red-500/5 text-red-400 hover:border-red-500/50' },
    { name: '일상', activeClass: 'border-orange-500 bg-orange-500 text-white', inactiveClass: 'border-orange-500/30 bg-orange-500/5 text-orange-400 hover:border-orange-500/50' },
    { name: '스타일', activeClass: 'border-purple-500 bg-purple-500 text-white', inactiveClass: 'border-purple-500/30 bg-purple-500/5 text-purple-400 hover:border-purple-500/50' },
    { name: '여가', activeClass: 'border-green-500 bg-green-500 text-white', inactiveClass: 'border-green-500/30 bg-green-500/5 text-green-400 hover:border-green-500/50' },
    { name: '관계', activeClass: 'border-blue-500 bg-blue-500 text-white', inactiveClass: 'border-blue-500/30 bg-blue-500/5 text-blue-400 hover:border-blue-500/50' },
    { name: '돈', activeClass: 'border-[#8b5a2b] bg-[#8b5a2b] text-white', inactiveClass: 'border-[rgba(139,90,43,0.3)] bg-[rgba(139,90,43,0.05)] text-[#d2b48c] hover:border-[rgba(139,90,43,0.5)]' },
    { name: '상상', activeClass: 'border-pink-500 bg-pink-500 text-white', inactiveClass: 'border-pink-500/30 bg-pink-500/5 text-pink-400 hover:border-pink-500/50' },
    { name: '극한 밸런스게임', activeClass: 'border-neutral-500 bg-neutral-500 text-white', inactiveClass: 'border-neutral-500/30 bg-neutral-500/5 text-neutral-400 hover:border-neutral-500/50' }
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

  // Item 1: Form Validation for empty streamer nickname
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
      const res = await fetch('/api/streamer/create-room', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hostNickname: trimmedNickname,
          hostGender,
          hostAgeGroup,
          hostSessionId: sessionId,
          categories: selectedCategories,
          totalQuestions,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || '방 생성에 실패했습니다.');
      }

      onClose();
      router.push(`/streamer/${data.pin}`);
    } catch (err: any) {
      setErrorMsg(err.message || '방 생성 도중 오류가 발생했습니다.');
    } finally {
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
          className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative z-10 w-full max-w-lg bg-[#0d0e1d] border border-zinc-800 rounded-3xl p-6 shadow-2xl text-white overflow-hidden"
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-full bg-zinc-900 text-neutral-400 hover:text-white hover:bg-zinc-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Modal Header */}
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-brand-yellow/20 to-orange-500/20 border border-brand-yellow/30 text-brand-yellow">
              <Tv className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white tracking-tight">함께 플레이하기 (스트리머 모드)</h2>
              <p className="text-xs text-neutral-400">실시간으로 취향을 확인하는 다중 접속 모드</p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="grid grid-cols-2 gap-2 bg-zinc-950 p-1.5 rounded-2xl border border-zinc-850 mb-6">
            <button
              onClick={() => {
                setActiveTab('join');
                setErrorMsg('');
              }}
              className={`py-2.5 px-4 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === 'join'
                  ? 'bg-zinc-800 text-white shadow-md'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <Users className="w-4 h-4 text-amber-400" />
              <span>입장하기 (시청자)</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('create');
                setErrorMsg('');
              }}
              className={`py-2.5 px-4 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === 'create'
                  ? 'bg-brand-yellow text-zinc-950 shadow-md font-black'
                  : 'text-neutral-400 hover:text-neutral-200'
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
                <label className="block text-xs font-extrabold text-neutral-300 mb-1.5">6자리 PIN 코드</label>
                <input
                  type="text"
                  maxLength={6}
                  placeholder="예: 849201"
                  value={joinPin}
                  onChange={(e) => setJoinPin(e.target.value.replace(/[^0-9]/g, ''))}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-lg font-black text-center tracking-widest text-brand-yellow placeholder-zinc-700 focus:outline-none focus:border-brand-yellow"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold text-neutral-300 mb-1.5">시청자 닉네임</label>
                <input
                  type="text"
                  placeholder="본인 닉네임을 입력하세요."
                  value={joinNickname}
                  onChange={(e) => setJoinNickname(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm font-bold text-white placeholder-zinc-600 focus:outline-none focus:border-brand-yellow"
                />
              </div>

              <button
                type="submit"
                disabled={joining}
                className="w-full py-3.5 rounded-xl bg-brand-yellow text-zinc-950 hover:bg-yellow-400 font-black text-sm transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <span>입장하기</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* Tab 2: Create Room (Streamer Host) */}
          {activeTab === 'create' && (
            <form onSubmit={handleCreateRoom} className="space-y-4 max-h-[60vh] overflow-y-auto pr-1 no-scrollbar">
              <div>
                <label className="block text-xs font-extrabold text-neutral-300 mb-1.5">스트리머 닉네임</label>
                {/* Item 1: Placeholder updated to '본인 닉네임을 입력하세요.' */}
                <input
                  type="text"
                  placeholder="본인 닉네임을 입력하세요."
                  value={hostNickname}
                  onChange={(e) => setHostNickname(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm font-bold text-white placeholder-zinc-600 focus:outline-none focus:border-brand-yellow"
                />
              </div>

              {/* Gender & Age */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-extrabold text-neutral-300 mb-1.5">성별</label>
                  <select
                    value={hostGender}
                    onChange={(e) => setHostGender(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none"
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
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none"
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

              <div>
                <label className="block text-xs font-extrabold text-neutral-300 mb-1.5">총 문제 수</label>
                <div className="grid grid-cols-3 gap-2">
                  {[10, 20, 30].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setTotalQuestions(num)}
                      className={`py-2 rounded-xl text-xs font-black border transition-all cursor-pointer ${
                        totalQuestions === num
                          ? 'border-brand-yellow bg-brand-yellow/10 text-brand-yellow'
                          : 'border-zinc-800 bg-zinc-900 text-neutral-400'
                      }`}
                    >
                      {num}문제
                    </button>
                  ))}
                </div>
              </div>

              {/* Category Filter Chips */}
              <div className="border-t border-zinc-900/80 pt-3">
                <label className="block text-xs font-extrabold text-neutral-300 mb-2">카테고리 필터</label>

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
                className="w-full py-3.5 rounded-xl bg-brand-yellow text-zinc-950 font-black text-sm transition-all shadow-lg hover:brightness-110 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-4"
              >
                <span>{creating ? '방 생성 중...' : '방 만들기 & PIN 발급'}</span>
              </button>
            </form>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

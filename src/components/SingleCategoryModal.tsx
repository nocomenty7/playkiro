'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Gamepad2, Sparkles, Filter } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface SingleCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartGame: (selectedCategories: string[]) => void;
}

export default function SingleCategoryModal({
  isOpen,
  onClose,
  onStartGame,
}: SingleCategoryModalProps) {
  const [selectedCategories, setSelectedCategories] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('kiro_filter_categories');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          return ['전체'];
        }
      }
    }
    return ['전체'];
  });

  const [questionCounts, setQuestionCounts] = useState<{ [key: string]: number }>({});

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

  // Fetch category question counts from Supabase
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
        console.error('Failed to fetch category counts inside SingleCategoryModal:', e);
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

  const handleStartSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('kiro_filter_categories', JSON.stringify(selectedCategories));
    onStartGame(selectedCategories);
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
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-amber-400/20 to-orange-500/20 border border-amber-400/30 text-amber-400">
              <Gamepad2 className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white tracking-tight">싱글모드 카테고리 선택</h2>
              <p className="text-xs text-neutral-400">플레이하고 싶은 주제를 고르거나 [전체]로 시작하세요!</p>
            </div>
          </div>

          <form onSubmit={handleStartSubmit} className="space-y-4">
            {/* Category Filter Chips */}
            <div className="border-t border-zinc-900/80 pt-4">
              <label className="flex items-center justify-between text-xs font-extrabold text-neutral-300 mb-3">
                <span className="flex items-center gap-1.5">
                  <Filter className="w-3.5 h-3.5 text-amber-400" />
                  카테고리 필터
                </span>
                <span className="text-amber-400/90 text-xs font-bold">(복수 선택 가능)</span>
              </label>

              {/* '전체' Category */}
              <div className="mb-2.5">
                {categoriesConfig.filter(c => c.name === '전체').map((cat) => {
                  const isActive = selectedCategories.includes(cat.name);
                  const count = questionCounts[cat.name];
                  return (
                    <button
                      key={cat.name}
                      type="button"
                      onClick={() => toggleCategory(cat.name)}
                      className={`w-full px-3 py-2.5 rounded-full text-xs font-black border transition-all cursor-pointer text-center ${
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

            {/* Start Button */}
            <button
              type="submit"
              className="w-full py-3.5 rounded-xl bg-brand-yellow text-zinc-950 font-black text-sm transition-all shadow-lg hover:brightness-110 flex items-center justify-center gap-2 cursor-pointer mt-6"
            >
              <Sparkles className="w-4 h-4 fill-zinc-950" />
              <span>시작하기</span>
            </button>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

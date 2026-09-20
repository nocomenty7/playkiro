'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Send, Lightbulb, AlertTriangle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';

interface SuggestionForm {
  id: string;
  category: string;
  question_text: string;
  option_a: string;
  option_b: string;
}

const CATEGORIES = [
  '음식', '일상', '스타일', '여가', '관계', '돈', '상상', '극한 밸런스게임'
];

export default function SuggestPage() {
  const [showDrawer, setShowDrawer] = useState(false);
  const [nickname, setNickname] = useState('');
  const [forms, setForms] = useState<SuggestionForm[]>([{
    id: Date.now().toString(),
    category: '일상',
    question_text: '',
    option_a: '',
    option_b: ''
  }]);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleAddForm = () => {
    setForms(prev => [...prev, {
      id: Date.now().toString(),
      category: '일상',
      question_text: '',
      option_a: '',
      option_b: ''
    }]);
  };

  const handleRemoveForm = (id: string) => {
    if (forms.length === 1) return;
    setForms(prev => prev.filter(f => f.id !== id));
  };

  const handleChange = (id: string, field: keyof SuggestionForm, value: string) => {
    setForms(prev => prev.map(f => f.id === id ? { ...f, [field]: value } : f));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!nickname.trim()) {
      setErrorMsg('닉네임을 입력해 주세요.');
      return;
    }

    const invalidForm = forms.find(f => !f.question_text.trim() || !f.option_a.trim() || !f.option_b.trim());
    if (invalidForm) {
      setErrorMsg('모든 문제의 내용과 선택지를 입력해 주세요.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          suggestions: forms.map(f => ({
            ...f,
            suggested_by: nickname.trim(),
          }))
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '제출에 실패했습니다.');

      setSuccess(true);
    } catch (err: any) {
      setErrorMsg(err.message || '오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="flex h-[100dvh] w-full flex-col overflow-y-auto bg-zinc-50 dark:bg-[#080911] text-zinc-900 dark:text-white items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 md:p-8 text-center shadow-2xl"
        >
          <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-500 mx-auto flex items-center justify-center mb-4 md:mb-6">
            <Lightbulb className="w-6 h-6 md:w-8 md:h-8" />
          </div>
          <h1 className="text-xl md:text-2xl font-black mb-2">제안해 주셔서 감사합니다!</h1>
          <p className="text-zinc-500 dark:text-neutral-400 text-xs md:text-sm mb-6 md:mb-8 leading-relaxed break-keep">
            제안해주신 소중한 문제는 관리자가 꼼꼼히 확인한 후 서비스에 반영될 수 있습니다. 
            관리자의 확인을 거쳐 최종 채택된 문제에는 작성해주신 닉네임이 함께 표기됩니다!
          </p>
          <Link href="/" className="inline-flex items-center justify-center w-full py-3.5 rounded-2xl bg-zinc-900 text-white dark:bg-white dark:text-black font-black text-sm hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors">
            홈으로 돌아가기
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex h-[100dvh] w-full flex-col overflow-y-auto overflow-x-hidden bg-zinc-50 dark:bg-[#080911] text-zinc-900 dark:text-white selection:bg-amber-500/30 selection:text-amber-200">
      
      {/* Reused Navigation Header (shrink-0 prevents it from squishing) */}
      <div className="shrink-0">
        <Navigation
          selectedCategories={['전체']}
          onToggleCategory={() => {}}
          showDrawer={showDrawer}
          setShowDrawer={setShowDrawer}
        />
      </div>

      <main className="max-w-md md:max-w-xl mx-auto w-full p-4 py-6 md:py-8 flex-1">
        <div className="mb-6 md:mb-8 text-center px-2">
          <h2 className="text-xl md:text-2xl font-black tracking-tight mb-2 text-zinc-900 dark:text-white break-keep">
            나만의 기발한 <span className="text-amber-500">밸런스 게임 문제</span> 제안하기
          </h2>
          <p className="text-xs md:text-sm text-zinc-500 dark:text-neutral-400 leading-relaxed break-keep">
            관리자의 확인을 거쳐 최종 채택된 문제는 모든 플레이어가 함께 즐기게 되며, 문제 카드에 회원님의 닉네임이 표시됩니다.
          </p>
          <div className="mt-3 flex items-start gap-1.5 text-rose-500 text-[11px] md:text-xs font-bold bg-rose-50 dark:bg-rose-500/10 p-2.5 rounded-lg border border-rose-200 dark:border-rose-500/20 text-left">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              부적절하거나 불쾌감을 줄 수 있는 닉네임 및 문제 제안 시, 임의로 마스킹 처리되거나 서비스 반영이 거절될 수 있습니다.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Nickname Section */}
          <div className="bg-white dark:bg-zinc-900/50 rounded-2xl border border-zinc-200 dark:border-zinc-800/80 p-5 shadow-sm">
            <label className="block text-xs md:text-sm font-extrabold text-zinc-700 dark:text-neutral-300 mb-2">
              제안자 닉네임
            </label>
            <input
              type="text"
              placeholder="예: 기로장인"
              value={nickname}
              onChange={e => setNickname(e.target.value)}
              className="w-full bg-zinc-50 dark:bg-black/50 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm font-bold text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:border-amber-400 transition-colors"
            />
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 text-red-600 dark:text-red-400 text-xs md:text-sm font-bold text-center animate-pulse">
              ⚠️ {errorMsg}
            </div>
          )}

          {/* Forms List */}
          <div className="space-y-5">
            <AnimatePresence>
              {forms.map((form, index) => (
                <motion.div
                  key={form.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-white dark:bg-zinc-900/50 rounded-2xl border border-zinc-200 dark:border-zinc-800/80 overflow-hidden shadow-sm relative group"
                >
                  {forms.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveForm(form.id)}
                      className="absolute top-3 right-3 p-1.5 text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors z-10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                  
                  <div className="p-5 space-y-4">
                    <h3 className="font-black text-xs md:text-sm text-zinc-400 dark:text-zinc-500 mb-1">문제 #{index + 1}</h3>
                    
                    <div>
                      <label className="block text-[11px] md:text-xs font-extrabold text-zinc-500 dark:text-neutral-400 mb-1.5">카테고리</label>
                      <select
                        value={form.category}
                        onChange={e => handleChange(form.id, 'category', e.target.value)}
                        className="w-full bg-zinc-50 dark:bg-black/50 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs md:text-sm font-bold text-zinc-900 dark:text-white focus:outline-none focus:border-amber-400 appearance-none cursor-pointer"
                      >
                        {CATEGORIES.map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="block text-[11px] md:text-xs font-extrabold text-zinc-500 dark:text-neutral-400">문제 내용</label>
                        <span className={`text-[10px] font-bold ${form.question_text.length >= 40 ? 'text-red-500' : 'text-zinc-400'}`}>
                          {form.question_text.length} / 40자
                        </span>
                      </div>
                      <textarea
                        rows={2}
                        placeholder="예: 평생 하나의 음식만 먹고 살아야 한다면?"
                        value={form.question_text}
                        maxLength={40}
                        onChange={e => handleChange(form.id, 'question_text', e.target.value)}
                        className="w-full bg-zinc-50 dark:bg-black/50 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs md:text-sm font-bold text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:border-amber-400 resize-none"
                      />
                    </div>

                    <div className="grid grid-cols-1 gap-3">
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="block text-[11px] md:text-xs font-extrabold text-zinc-500 dark:text-neutral-400">선택지 A</label>
                          <span className={`text-[10px] font-bold ${form.option_a.length >= 30 ? 'text-red-500' : 'text-zinc-400'}`}>
                            {form.option_a.length} / 30자
                          </span>
                        </div>
                        <input
                          type="text"
                          placeholder="예: 매일 치킨 먹기"
                          value={form.option_a}
                          maxLength={30}
                          onChange={e => handleChange(form.id, 'option_a', e.target.value)}
                          className="w-full bg-zinc-50 dark:bg-black/50 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs md:text-sm font-bold text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:border-amber-400"
                        />
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="block text-[11px] md:text-xs font-extrabold text-zinc-500 dark:text-neutral-400">선택지 B</label>
                          <span className={`text-[10px] font-bold ${form.option_b.length >= 30 ? 'text-red-500' : 'text-zinc-400'}`}>
                            {form.option_b.length} / 30자
                          </span>
                        </div>
                        <input
                          type="text"
                          placeholder="예: 매일 피자 먹기"
                          value={form.option_b}
                          maxLength={30}
                          onChange={e => handleChange(form.id, 'option_b', e.target.value)}
                          className="w-full bg-zinc-50 dark:bg-black/50 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs md:text-sm font-bold text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:border-amber-400"
                        />
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          <button
            type="button"
            onClick={handleAddForm}
            className="w-full py-3.5 rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 font-bold text-xs md:text-sm hover:border-amber-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-500/5 transition-all flex items-center justify-center gap-1.5 cursor-pointer z-10 relative"
          >
            <Plus className="w-4 h-4" />
            추가하기
          </button>

          <div className="pt-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 rounded-2xl bg-[#FFD700] hover:bg-yellow-400 text-zinc-950 font-black text-sm md:text-base transition-all shadow-lg hover:shadow-amber-500/20 hover:-translate-y-0.5 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:hover:translate-y-0 relative z-10"
            >
              {isSubmitting ? (
                '제출하는 중...'
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  제안하기
                </>
              )}
            </button>
          </div>
          
          <div className="text-center pt-2 pb-6">
            <p className="text-xs md:text-sm text-zinc-500 dark:text-zinc-400 font-bold break-keep px-2 leading-relaxed">
              💡 제안해주신 소중한 문제는 기로(PlayKiro)에 귀속되며, 서비스 내에서 자유롭게 사용 및 가공될 수 있습니다.
            </p>
          </div>
        </form>
      </main>

      {/* Reused Footer (shrink-0 prevents it from squishing) */}
      <div className="shrink-0 mt-auto">
        <Footer />
      </div>
    </div>
  );
}

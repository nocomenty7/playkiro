'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Send, Lightbulb, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';
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
  const [showRules, setShowRules] = useState(false);
  const [showValidationErrors, setShowValidationErrors] = useState(false);

  const handleAddForm = () => {
    if (forms.length >= 10) {
      alert('한 번에 최대 10문제까지만 제안할 수 있습니다.');
      return;
    }
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

    if (!nickname.trim()) {
      setShowValidationErrors(true);
      alert('닉네임을 입력해 주세요.');
      setTimeout(() => document.getElementById('nickname')?.focus(), 10);
      return;
    }

    const invalidForm = forms.find(f => !f.question_text.trim() || !f.option_a.trim() || !f.option_b.trim());
    if (invalidForm) {
      setShowValidationErrors(true);
      alert('모든 문제의 내용과 선택지를 입력해 주세요.');
      setTimeout(() => {
        if (!invalidForm.question_text.trim()) document.getElementById(`question-${invalidForm.id}`)?.focus();
        else if (!invalidForm.option_a.trim()) document.getElementById(`optionA-${invalidForm.id}`)?.focus();
        else if (!invalidForm.option_b.trim()) document.getElementById(`optionB-${invalidForm.id}`)?.focus();
      }, 10);
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
      alert(err.message || '오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="flex h-[100dvh] w-full flex-col overflow-y-auto bg-[#080911] text-white items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full bg-zinc-900 border border-zinc-800 rounded-3xl p-6 md:p-8 text-center shadow-2xl"
        >
          <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-emerald-500/20 text-emerald-500 mx-auto flex items-center justify-center mb-4 md:mb-6">
            <Lightbulb className="w-6 h-6 md:w-8 md:h-8" />
          </div>
          <h1 className="text-xl md:text-2xl font-black mb-2 text-white">제안해 주셔서 감사합니다!</h1>
          <p className="text-neutral-400 text-xs md:text-sm mb-6 md:mb-8 leading-relaxed break-keep">
            제안해주신 소중한 문제는 관리자가 꼼꼼히 확인한 후 서비스에 반영될 수 있습니다. 
            관리자의 확인을 거쳐 최종 채택된 문제에는 작성해주신 닉네임이 함께 표기됩니다!
          </p>
          <Link href="/" className="inline-flex items-center justify-center w-full py-3.5 rounded-2xl bg-white text-black font-black text-sm hover:bg-zinc-200 transition-colors">
            홈으로 돌아가기
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex h-[100dvh] w-full flex-col overflow-y-auto overflow-x-hidden bg-[#080911] text-white selection:bg-amber-500/30 selection:text-amber-200">
      
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
          <h2 className="text-2xl md:text-3xl font-black tracking-tight mb-2 text-white break-keep">
            나만의 기발한 <span className="text-amber-500">밸런스게임 문제</span> 제안하기
          </h2>
          <p className="text-xs md:text-sm text-neutral-400 leading-relaxed break-keep">
            관리자의 확인을 거쳐 최종 채택된 문제는 모든 플레이어가 함께 즐기게 되며, 문제 카드에 회원님의 닉네임이 표시됩니다.
          </p>
          
          {/* Rules Accordion */}
          <div className="mt-4 text-left bg-zinc-900/50 rounded-xl border border-zinc-800/80 overflow-hidden shadow-sm transition-all duration-300">
            <button
              type="button"
              onClick={() => setShowRules(!showRules)}
              className="w-full flex items-center justify-between p-3.5 text-xs md:text-sm font-bold text-neutral-300 hover:bg-zinc-800/50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <span>문제 제안 시 주의사항</span>
              </div>
              {showRules ? <ChevronUp className="w-4 h-4 text-zinc-400" /> : <ChevronDown className="w-4 h-4 text-zinc-400" />}
            </button>
            <AnimatePresence>
              {showRules && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="border-t border-zinc-800/50 bg-black/20"
                >
                  <div className="p-4 space-y-4 text-[11px] md:text-xs text-neutral-400 leading-relaxed">
                    <div>
                      <h4 className="font-extrabold text-neutral-200 mb-1 flex items-center gap-1.5"><span className="w-1 h-1 rounded-full bg-zinc-400"></span> 닉네임</h4>
                      <ul className="pl-4 space-y-1 list-disc list-outside ml-2">
                        <li>부적절하거나 불쾌감을 줄 수 있는 닉네임은 임의로 마스킹 처리되거나 표기되지 않을 수 있습니다.</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-extrabold text-neutral-200 mb-1 flex items-center gap-1.5"><span className="w-1 h-1 rounded-full bg-zinc-400"></span> 문제</h4>
                      <ul className="pl-4 space-y-1 list-disc list-outside ml-2">
                        <li>기존에 존재하는 문제와 중복되는 문제는 반영되지 않을 수 있습니다.</li>
                        <li>부적절하거나 불쾌감을 줄 수 있는 문제는 반영되지 않을 수 있습니다.</li>
                        <li>선택지의 밸런스가 크게 맞지 않는 문제는 관리자의 임의 수정을 거쳐 게재될 수 있습니다.</li>
                      </ul>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Nickname Section */}
          <div className="bg-zinc-900/50 rounded-2xl border border-zinc-800/80 p-5 shadow-sm">
            <label className="block text-xs md:text-sm font-extrabold text-neutral-300 mb-2">
              제안자 닉네임
            </label>
            <input
              id="nickname"
              type="text"
              placeholder="예: 기로장인"
              value={nickname}
              onChange={e => { setNickname(e.target.value); setShowValidationErrors(false); }}
              className={`w-full bg-black/50 border rounded-xl px-3.5 py-2.5 text-sm font-bold text-white placeholder-zinc-600 focus:outline-none transition-all ${
                showValidationErrors && !nickname.trim() 
                  ? 'border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500/50' 
                  : 'border-zinc-800 focus:border-amber-400 focus:ring-1 focus:ring-amber-400/50'
              }`}
            />
          </div>

          {/* Forms List */}
          <div className="space-y-5">
            <AnimatePresence>
              {forms.map((form, index) => (
                <motion.div
                  key={form.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-zinc-900/50 rounded-2xl border border-zinc-800/80 overflow-hidden shadow-sm relative group"
                >
                  {forms.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveForm(form.id)}
                      className="absolute top-3 right-3 p-1.5 text-zinc-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors z-10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                  
                  <div className="p-5 space-y-4">
                    <h3 className="font-black text-xs md:text-sm text-neutral-400 mb-1">문제 #{index + 1}</h3>
                    
                    <div>
                      <label className="block text-[11px] md:text-xs font-extrabold text-neutral-400 mb-1.5">카테고리</label>
                      <div className="relative">
                        <select
                          value={form.category}
                          onChange={e => handleChange(form.id, 'category', e.target.value)}
                          className="w-full bg-black/50 border border-zinc-800 rounded-xl pl-3.5 pr-10 py-2.5 text-xs md:text-sm font-bold text-white focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/50 appearance-none cursor-pointer transition-all"
                        >
                          {CATEGORIES.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                        </select>
                        <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-zinc-400">
                          <ChevronDown className="w-4 h-4" />
                        </div>
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="block text-[11px] md:text-xs font-extrabold text-neutral-400">문제 내용</label>
                        <span className={`text-[10px] font-bold ${form.question_text.length >= 40 ? 'text-red-500' : 'text-zinc-400'}`}>
                          {form.question_text.length} / 40자
                        </span>
                      </div>
                      <textarea
                        id={`question-${form.id}`}
                        rows={2}
                        placeholder="예: 평생 하나의 음식만 먹고 살아야 한다면?"
                        value={form.question_text}
                        maxLength={40}
                        onChange={e => { handleChange(form.id, 'question_text', e.target.value); setShowValidationErrors(false); }}
                        className={`w-full bg-black/50 border rounded-xl px-3.5 py-2.5 text-xs md:text-sm font-bold text-white placeholder-zinc-600 focus:outline-none resize-none transition-all ${
                          showValidationErrors && !form.question_text.trim()
                            ? 'border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500/50'
                            : 'border-zinc-800 focus:border-amber-400 focus:ring-1 focus:ring-amber-400/50'
                        }`}
                      />
                    </div>

                    <div className="grid grid-cols-1 gap-3">
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="block text-[11px] md:text-xs font-extrabold text-neutral-400">선택지 A</label>
                          <span className={`text-[10px] font-bold ${form.option_a.length >= 30 ? 'text-red-500' : 'text-zinc-400'}`}>
                            {form.option_a.length} / 30자
                          </span>
                        </div>
                        <input
                          id={`optionA-${form.id}`}
                          type="text"
                          placeholder="예: 매일 치킨 먹기"
                          value={form.option_a}
                          maxLength={30}
                          onChange={e => { handleChange(form.id, 'option_a', e.target.value); setShowValidationErrors(false); }}
                          className={`w-full bg-black/50 border rounded-xl px-3.5 py-2.5 text-xs md:text-sm font-bold text-white placeholder-zinc-600 focus:outline-none transition-all ${
                            showValidationErrors && !form.option_a.trim()
                              ? 'border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500/50'
                              : 'border-zinc-800 focus:border-amber-400 focus:ring-1 focus:ring-amber-400/50'
                          }`}
                        />
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="block text-[11px] md:text-xs font-extrabold text-neutral-400">선택지 B</label>
                          <span className={`text-[10px] font-bold ${form.option_b.length >= 30 ? 'text-red-500' : 'text-zinc-400'}`}>
                            {form.option_b.length} / 30자
                          </span>
                        </div>
                        <input
                          id={`optionB-${form.id}`}
                          type="text"
                          placeholder="예: 매일 피자 먹기"
                          value={form.option_b}
                          maxLength={30}
                          onChange={e => { handleChange(form.id, 'option_b', e.target.value); setShowValidationErrors(false); }}
                          className={`w-full bg-black/50 border rounded-xl px-3.5 py-2.5 text-xs md:text-sm font-bold text-white placeholder-zinc-600 focus:outline-none transition-all ${
                            showValidationErrors && !form.option_b.trim()
                              ? 'border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500/50'
                              : 'border-zinc-800 focus:border-amber-400 focus:ring-1 focus:ring-amber-400/50'
                          }`}
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
            className="w-full py-3.5 rounded-2xl border border-dashed border-zinc-800 text-neutral-400 font-bold text-xs md:text-sm hover:border-amber-400 hover:text-amber-500 hover:bg-amber-500/5 transition-all flex items-center justify-center gap-1.5 cursor-pointer z-10 relative bg-transparent"
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
            <p className="text-xs md:text-sm text-neutral-400 font-bold break-keep px-2 leading-relaxed">
              💡 당신의 제안으로 기로가 더욱 풍성해집니다. 진심으로 감사드립니다. 제안해주신 소중한 문제는 전적으로 기로에 귀속되며, 서비스 내에서 자유롭게 사용 및 가공될 수 있습니다.
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

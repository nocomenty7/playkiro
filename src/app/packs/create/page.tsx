'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Plus,
  Trash2,
  Sparkles,
  Globe,
  Link2,
  Lock,
  ArrowLeft,
  ArrowUp,
  ArrowDown,
  Copy,
  Check,
  Loader2,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import {
  MIN_PACK_QUESTIONS,
  MAX_PACK_QUESTIONS,
  PACK_CATEGORIES,
} from '@/lib/customPacks';

interface QuestionDraft {
  localId: string;
  title: string;
  option_a: string;
  option_b: string;
}

const createEmptyQuestion = (seed: number): QuestionDraft => ({
  localId: `q_${Date.now()}_${seed}_${Math.random().toString(36).slice(2, 6)}`,
  title: '',
  option_a: '',
  option_b: '',
});

function PackCreateContent() {
  const searchParams = useSearchParams();
  const editCode = searchParams.get('edit');

  const [showDrawer, setShowDrawer] = useState(false);

  // Pack meta
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<string>('자유');
  const [authorNickname, setAuthorNickname] = useState('');
  const [password, setPassword] = useState('');
  const [isPublic, setIsPublic] = useState(true);

  // Questions (5 ~ 30)
  const [questions, setQuestions] = useState<QuestionDraft[]>(() =>
    Array.from({ length: MIN_PACK_QUESTIONS }, (_, i) => createEmptyQuestion(i))
  );

  const [loadingEdit, setLoadingEdit] = useState(Boolean(editCode));
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [createdCode, setCreatedCode] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Load existing pack when in edit mode
  useEffect(() => {
    if (!editCode) return;

    const loadPack = async () => {
      setLoadingEdit(true);
      try {
        const storedPw = sessionStorage.getItem(`kiro_pack_edit_pw_${editCode}`);
        if (storedPw) setPassword(storedPw);

        const res = await fetch(`/api/packs/${encodeURIComponent(editCode)}`);
        const data = await res.json();
        if (!res.ok || !data.success || !data.pack) {
          throw new Error(data.error || '수정할 밸런스질문 팩을 불러올 수 없습니다.');
        }

        const p = data.pack;
        setTitle(p.title || '');
        setDescription(p.description || '');
        setCategory(p.category || '자유');
        setAuthorNickname(p.author_nickname || '');
        setIsPublic(Boolean(p.is_public));
        if (Array.isArray(p.questions) && p.questions.length > 0) {
          setQuestions(
            p.questions.map((q: any, idx: number) => ({
              localId: `edit_${idx}_${Date.now()}`,
              title: q.title === '둘 중 하나를 선택한다면?' ? '' : q.title || '',
              option_a: q.option_a || '',
              option_b: q.option_b || '',
            }))
          );
        }
      } catch (err: any) {
        setErrorMsg(err.message || '팩 정보를 불러오는 중 오류가 발생했습니다.');
      } finally {
        setLoadingEdit(false);
      }
    };

    loadPack();
  }, [editCode]);

  const handleAddQuestion = () => {
    if (questions.length >= MAX_PACK_QUESTIONS) {
      alert(`질문은 최대 ${MAX_PACK_QUESTIONS}개까지만 추가할 수 있습니다.`);
      return;
    }
    setQuestions((prev) => [...prev, createEmptyQuestion(prev.length)]);
  };

  const handleRemoveQuestion = (localId: string) => {
    if (questions.length <= MIN_PACK_QUESTIONS) {
      alert(`밸런스질문 팩은 최소 ${MIN_PACK_QUESTIONS}개 이상의 질문이 필요합니다.`);
      return;
    }
    setQuestions((prev) => prev.filter((q) => q.localId !== localId));
  };

  const handleMoveQuestion = (index: number, direction: -1 | 1) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= questions.length) return;
    setQuestions((prev) => {
      const next = [...prev];
      [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
      return next;
    });
  };

  const handleQuestionChange = (
    localId: string,
    field: 'title' | 'option_a' | 'option_b',
    value: string
  ) => {
    setQuestions((prev) =>
      prev.map((q) => (q.localId === localId ? { ...q, [field]: value } : q))
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const trimmedTitle = title.trim();
    const trimmedAuthor = authorNickname.trim();
    const trimmedPw = password.trim();

    if (trimmedTitle.length < 2) {
      setErrorMsg('팩 제목을 2자 이상 입력해 주세요.');
      return;
    }
    if (!trimmedAuthor) {
      setErrorMsg('제작자 닉네임을 입력해 주세요.');
      return;
    }
    if (!/^\d{4}$/.test(trimmedPw)) {
      setErrorMsg('수정/삭제용 비밀번호는 숫자 4자리로 입력해 주세요.');
      return;
    }
    if (questions.length < MIN_PACK_QUESTIONS || questions.length > MAX_PACK_QUESTIONS) {
      setErrorMsg(`질문은 ${MIN_PACK_QUESTIONS}개~${MAX_PACK_QUESTIONS}개 사이로 작성해 주세요.`);
      return;
    }

    for (let i = 0; i < questions.length; i++) {
      if (!questions[i].option_a.trim() || !questions[i].option_b.trim()) {
        setErrorMsg(`${i + 1}번 질문의 선택지 A와 B를 모두 입력해 주세요.`);
        document.getElementById(`pack-q-${i}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
      }
    }

    setSubmitting(true);
    try {
      const payload = {
        title: trimmedTitle,
        description: description.trim(),
        category,
        author_nickname: trimmedAuthor,
        password: trimmedPw,
        is_public: isPublic,
        questions: questions.map((q) => ({
          title: q.title.trim(),
          option_a: q.option_a.trim(),
          option_b: q.option_b.trim(),
        })),
      };

      const url = editCode ? `/api/packs/${encodeURIComponent(editCode)}` : '/api/packs';
      const method = editCode ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || '밸런스질문 팩 저장에 실패했습니다.');
      }

      if (editCode) {
        try {
          sessionStorage.removeItem(`kiro_pack_edit_pw_${editCode}`);
        } catch {}
        setCreatedCode(editCode);
      } else {
        setCreatedCode(data.code);
      }
    } catch (err: any) {
      setErrorMsg(err.message || '오류가 발생했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  const shareUrl =
    typeof window !== 'undefined' && createdCode
      ? `${window.location.origin}/packs/${createdCode}`
      : createdCode
        ? `https://playkiro.com/packs/${createdCode}`
        : '';

  const handleCopyShareUrl = () => {
    if (!shareUrl) return;
    navigator.clipboard.writeText(shareUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  if (createdCode) {
    return (
      <div className="flex h-[100dvh] w-full flex-col overflow-y-auto bg-[#080911] text-white font-sans">
        <div className="shrink-0">
          <Navigation
            selectedCategories={['전체']}
            onToggleCategory={() => {}}
            showDrawer={showDrawer}
            setShowDrawer={setShowDrawer}
          />
        </div>
        <main className="flex-1 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="max-w-md w-full rounded-3xl border border-zinc-800 bg-zinc-900/60 p-6 md:p-8 text-center space-y-5 shadow-2xl"
          >
            <div className="w-14 h-14 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-brand-yellow flex items-center justify-center mx-auto">
              <Sparkles className="w-7 h-7" />
            </div>

            <div className="space-y-1.5">
              <h1 className="text-xl md:text-2xl font-black text-neutral-100">
                {editCode ? '밸런스질문 팩이 수정되었어요!' : '나만의 밸런스질문 팩 완성!'}
              </h1>
              <p className="text-xs md:text-sm text-neutral-400 break-keep leading-relaxed">
                아래 링크를 친구·연인·스트리머 팬카페에 공유하면 누구나 바로 플레이하거나 채팅 연동 방송을 시작할 수 있어요.
              </p>
            </div>

            {/* Share URL copy box */}
            <div className="rounded-2xl bg-zinc-950/80 border border-zinc-800 p-3 flex items-center gap-2">
              <span className="flex-1 text-left text-xs font-bold text-amber-400 truncate px-1">
                {shareUrl}
              </span>
              <button
                type="button"
                onClick={handleCopyShareUrl}
                className="shrink-0 inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-brand-yellow hover:bg-[#e0b240] text-zinc-950 font-black text-xs cursor-pointer transition"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedLink ? '복사됨!' : '링크 복사'}</span>
              </button>
            </div>

            <div className="flex flex-col gap-2.5 pt-1">
              <Link
                href={`/packs/${createdCode}`}
                className="w-full py-3.5 rounded-xl bg-brand-yellow hover:bg-[#e0b240] text-zinc-950 font-black text-sm flex items-center justify-center gap-1.5 transition"
              >
                <span>만든 밸런스질문 팩 열기</span>
                <ExternalLink className="w-4 h-4" />
              </Link>
              <Link
                href="/packs"
                className="w-full py-3 rounded-xl bg-zinc-800/80 hover:bg-zinc-800 border border-zinc-700/60 text-neutral-200 font-bold text-xs transition"
              >
                공개 밸런스질문 팩 목록으로 이동
              </Link>
            </div>
          </motion.div>
        </main>
        <div className="shrink-0">
          <Footer />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[100dvh] w-full flex-col overflow-y-auto overflow-x-hidden bg-[#080911] bg-[radial-gradient(circle_at_top,_rgba(99,102,241,0.08),_transparent_55%)] text-white font-sans">
      <div className="shrink-0">
        <Navigation
          selectedCategories={['전체']}
          onToggleCategory={() => {}}
          showDrawer={showDrawer}
          setShowDrawer={setShowDrawer}
        />
      </div>

      <main className="flex-1 w-full max-w-3xl mx-auto px-4 sm:px-6 py-8 md:py-10 space-y-6">
        {/* Back link & Title */}
        <div className="space-y-3">
          <Link
            href={editCode ? `/packs/${editCode}` : '/packs'}
            className="inline-flex items-center gap-1.5 text-xs font-extrabold text-neutral-400 hover:text-amber-400 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>{editCode ? '팩 페이지로 돌아가기' : '공개 팩 목록으로 돌아가기'}</span>
          </Link>

          <div className="space-y-1.5">
            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-neutral-100">
              {editCode ? '밸런스질문 팩 수정하기' : '나만의 밸런스질문 팩 만들기'}
            </h1>
            <p className="text-xs md:text-sm text-neutral-400 leading-relaxed break-keep">
              회원가입 없이 5~30개의 밸런스게임 질문을 묶어 나만의 팩을 만들어보세요. 여기서 만든 질문은 공식 문제 풀에 섞이지 않고, 이 팩 전용으로만 플레이됩니다.
            </p>
          </div>
        </div>

        {loadingEdit ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3 text-neutral-400">
            <Loader2 className="h-7 w-7 animate-spin text-amber-400" />
            <span className="text-xs font-bold">팩 정보를 불러오는 중...</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {errorMsg && (
              <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-3.5 text-xs font-bold text-rose-400 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Section 1: Basic Info */}
            <section className="rounded-3xl border border-zinc-800/80 bg-zinc-900/40 p-5 md:p-6 space-y-5">
              <div className="flex items-center justify-between border-b border-zinc-800/60 pb-3">
                <h2 className="text-sm md:text-base font-black text-neutral-100">1. 팩 기본 정보</h2>
                <span className="text-[11px] font-bold text-neutral-500">로그인 불필요</span>
              </div>

              <div className="space-y-4">
                {/* Title */}
                <div>
                  <label className="block text-xs font-extrabold text-neutral-300 mb-1.5">
                    팩 제목 <span className="text-amber-400">*</span>
                  </label>
                  <input
                    type="text"
                    maxLength={60}
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="예: OO님 전용 극한 밸런스게임 15선 / 우리 커플 취향 검증"
                    className="w-full rounded-xl bg-zinc-950/70 border border-zinc-800 px-4 py-3 text-sm font-bold text-white placeholder-neutral-500 focus:outline-none focus:border-amber-400"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs font-extrabold text-neutral-300 mb-1.5">
                    한 줄 소개 <span className="text-neutral-500 font-bold">(선택)</span>
                  </label>
                  <input
                    type="text"
                    maxLength={150}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="어떤 테마의 밸런스게임인지 짧게 소개해 주세요."
                    className="w-full rounded-xl bg-zinc-950/70 border border-zinc-800 px-4 py-2.5 text-xs md:text-sm font-medium text-white placeholder-neutral-500 focus:outline-none focus:border-amber-400"
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="block text-xs font-extrabold text-neutral-300 mb-2">
                    테마 카테고리
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {PACK_CATEGORIES.map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setCategory(cat)}
                        className={`px-3.5 py-1.5 rounded-full text-xs font-extrabold border transition-all cursor-pointer ${
                          category === cat
                            ? 'bg-brand-yellow border-brand-yellow text-zinc-950 shadow-sm'
                            : 'bg-zinc-950/60 border-zinc-800 text-neutral-400 hover:border-zinc-700'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Author + 4-digit Password */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-extrabold text-neutral-300 mb-1.5">
                      제작자 닉네임 <span className="text-amber-400">*</span>
                    </label>
                    <input
                      type="text"
                      maxLength={20}
                      value={authorNickname}
                      onChange={(e) => setAuthorNickname(e.target.value)}
                      placeholder="예: 기로마스터"
                      className="w-full rounded-xl bg-zinc-950/70 border border-zinc-800 px-4 py-2.5 text-sm font-bold text-white placeholder-neutral-500 focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  <div>
                    <label className="flex items-center gap-1 text-xs font-extrabold text-neutral-300 mb-1.5">
                      <Lock className="h-3.5 w-3.5 text-amber-400" />
                      <span>
                        {editCode ? '기존 비밀번호 확인' : '수정/삭제용 비밀번호 (숫자 4자리)'}{' '}
                        <span className="text-amber-400">*</span>
                      </span>
                    </label>
                    <input
                      type="password"
                      inputMode="numeric"
                      maxLength={4}
                      value={password}
                      onChange={(e) => setPassword(e.target.value.replace(/[^0-9]/g, ''))}
                      placeholder="숫자 4자리 (예: 1234)"
                      className="w-full rounded-xl bg-zinc-950/70 border border-zinc-800 px-4 py-2.5 text-sm font-black tracking-widest text-white placeholder-neutral-500 focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>

                {/* Visibility */}
                <div>
                  <label className="block text-xs font-extrabold text-neutral-300 mb-2">
                    공개 범위 설정
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={() => setIsPublic(true)}
                      className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex items-start gap-2.5 ${
                        isPublic
                          ? 'border-amber-400/70 bg-amber-500/10'
                          : 'border-zinc-800 bg-zinc-950/50 hover:border-zinc-700'
                      }`}
                    >
                      <Globe className={`h-4 w-4 mt-0.5 shrink-0 ${isPublic ? 'text-amber-400' : 'text-neutral-500'}`} />
                      <div>
                        <div className={`text-xs font-black ${isPublic ? 'text-amber-400' : 'text-neutral-300'}`}>
                          전체 공개 (추천)
                        </div>
                        <p className="text-[11px] text-neutral-400 mt-0.5 leading-snug">
                          공개 밸런스질문 팩 목록에 등록되어 누구나 검색하고 플레이할 수 있어요.
                        </p>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsPublic(false)}
                      className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex items-start gap-2.5 ${
                        !isPublic
                          ? 'border-amber-400/70 bg-amber-500/10'
                          : 'border-zinc-800 bg-zinc-950/50 hover:border-zinc-700'
                      }`}
                    >
                      <Link2 className={`h-4 w-4 mt-0.5 shrink-0 ${!isPublic ? 'text-amber-400' : 'text-neutral-500'}`} />
                      <div>
                        <div className={`text-xs font-black ${!isPublic ? 'text-amber-400' : 'text-neutral-300'}`}>
                          링크 공유 전용
                        </div>
                        <p className="text-[11px] text-neutral-400 mt-0.5 leading-snug">
                          목록에는 노출되지 않고, 공유 링크를 아는 지인·스트리머만 접속해요.
                        </p>
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            </section>

            {/* Section 2: Questions List */}
            <section className="space-y-4">
              <div className="flex items-center justify-between px-1">
                <div>
                  <h2 className="text-sm md:text-base font-black text-neutral-100">
                    2. 밸런스게임 질문 작성
                  </h2>
                  <p className="text-[11px] text-neutral-400 mt-0.5">
                    최소 {MIN_PACK_QUESTIONS}개 ~ 최대 {MAX_PACK_QUESTIONS}개까지 작성할 수 있어요.
                  </p>
                </div>
                <span className="px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-black">
                  {questions.length} / {MAX_PACK_QUESTIONS}문제
                </span>
              </div>

              <div className="space-y-3.5">
                {questions.map((q, idx) => (
                  <div
                    key={q.localId}
                    id={`pack-q-${idx}`}
                    className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-4 md:p-5 space-y-3"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-1.5 text-xs font-black text-amber-400">
                        <span className="px-2 py-0.5 rounded-md bg-amber-500/15 border border-amber-500/30">
                          Q{idx + 1}
                        </span>
                      </span>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={() => handleMoveQuestion(idx, -1)}
                          title="위로 이동"
                          className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-zinc-800 disabled:opacity-30 cursor-pointer"
                        >
                          <ArrowUp className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          disabled={idx === questions.length - 1}
                          onClick={() => handleMoveQuestion(idx, 1)}
                          title="아래로 이동"
                          className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-zinc-800 disabled:opacity-30 cursor-pointer"
                        >
                          <ArrowDown className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          disabled={questions.length <= MIN_PACK_QUESTIONS}
                          onClick={() => handleRemoveQuestion(q.localId)}
                          title="질문 삭제"
                          className="p-1.5 rounded-lg text-neutral-400 hover:text-rose-400 hover:bg-rose-500/10 disabled:opacity-30 cursor-pointer"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Optional Title */}
                    <input
                      type="text"
                      maxLength={120}
                      value={q.title}
                      onChange={(e) => handleQuestionChange(q.localId, 'title', e.target.value)}
                      placeholder="질문/상황 설명 (선택 · 비워두면 '둘 중 하나를 선택한다면?' 표시)"
                      className="w-full rounded-xl bg-zinc-950/60 border border-zinc-800 px-3.5 py-2.5 text-xs md:text-sm font-bold text-white placeholder-neutral-500 focus:outline-none focus:border-zinc-600"
                    />

                    {/* Option A vs Option B */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div className="space-y-1">
                        <label className="block text-[11px] font-black text-amber-400">
                          선택지 A (1번) *
                        </label>
                        <input
                          type="text"
                          maxLength={80}
                          value={q.option_a}
                          onChange={(e) => handleQuestionChange(q.localId, 'option_a', e.target.value)}
                          placeholder="예: 평생 치킨 금지"
                          className="w-full rounded-xl bg-zinc-950/70 border border-amber-500/30 px-3.5 py-2.5 text-xs md:text-sm font-bold text-white placeholder-neutral-500 focus:outline-none focus:border-amber-400"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="block text-[11px] font-black text-emerald-400">
                          선택지 B (2번) *
                        </label>
                        <input
                          type="text"
                          maxLength={80}
                          value={q.option_b}
                          onChange={(e) => handleQuestionChange(q.localId, 'option_b', e.target.value)}
                          placeholder="예: 평생 라면 금지"
                          className="w-full rounded-xl bg-zinc-950/70 border border-emerald-500/30 px-3.5 py-2.5 text-xs md:text-sm font-bold text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-400"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add Question Button */}
              {questions.length < MAX_PACK_QUESTIONS && (
                <button
                  type="button"
                  onClick={handleAddQuestion}
                  className="w-full py-3.5 rounded-2xl border border-dashed border-zinc-700 hover:border-amber-400/60 bg-zinc-900/30 hover:bg-amber-500/5 text-neutral-300 hover:text-amber-400 font-extrabold text-xs md:text-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <Plus className="h-4 w-4" />
                  <span>질문 추가하기 ({questions.length} / {MAX_PACK_QUESTIONS})</span>
                </button>
              )}
            </section>

            {/* Submit Button */}
            <div className="pt-2 pb-6">
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-4 rounded-2xl bg-brand-yellow hover:bg-[#e0b240] text-zinc-950 font-black text-base shadow-[0_0_30px_rgba(245,195,82,0.25)] transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>저장 중...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-5 w-5" />
                    <span>{editCode ? '밸런스질문 팩 수정 완료하기' : '나만의 밸런스질문 팩 만들기 완료'}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </main>

      <div className="shrink-0 mt-auto">
        <Footer />
      </div>
    </div>
  );
}

export default function PackCreatePage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-[100dvh] w-full items-center justify-center bg-[#080911] text-white">
          <Loader2 className="h-7 w-7 animate-spin text-amber-400" />
        </div>
      }
    >
      <PackCreateContent />
    </Suspense>
  );
}

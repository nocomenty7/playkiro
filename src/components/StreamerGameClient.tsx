'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Lock, Play, ArrowRight, Copy, Check, Sparkles, LogOut, Home, BarChart3, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import StatsBottomSheet from './StatsBottomSheet';

interface StreamerGameClientProps {
  pin: string;
  viewerNickname?: string;
}

// Standard Competition Ranking Calculation (1등, 1등 -> 3등)
const calculateViewerRanks = (sortedViewers: any[]) => {
  let currentRank = 1;
  return sortedViewers.map((p, idx, arr) => {
    if (idx > 0 && p.score < arr[idx - 1].score) {
      currentRank = idx + 1;
    }
    return { ...p, rank: currentRank };
  });
};

export default function StreamerGameClient({ pin, viewerNickname }: StreamerGameClientProps) {
  const router = useRouter();

  // State
  const [room, setRoom] = useState<any>(null);
  const [currentQuestion, setCurrentQuestion] = useState<any>(null);
  const [participants, setParticipants] = useState<any[]>([]);
  const [myParticipantId, setMyParticipantId] = useState<string | null>(null);
  const [mySessionId, setMySessionId] = useState<string>('');
  const [myVote, setMyVote] = useState<'A' | 'B' | null>(null);
  const [votesA, setVotesA] = useState<number>(0);
  const [votesB, setVotesB] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [copied, setCopied] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [submittingPick, setSubmittingPick] = useState(false);
  const [submittingPass, setSubmittingPass] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null); // 'locking' | 'next' | 'finish' | 'pickA' | 'pickB'

  // Stats Bottom Sheet Modal State
  const [showStatsModal, setShowStatsModal] = useState(false);

  // Host Onboarding Guide Modal State
  const [showHostGuide, setShowHostGuide] = useState(false);

  // Performance Optimization - Channel & Throttle Refs
  const channelRef = useRef<any>(null);
  const fetchThrottleRef = useRef<NodeJS.Timeout | null>(null);

  // Get or initialize Session ID
  useEffect(() => {
    let sid = localStorage.getItem('kiro_streamer_session_id');
    if (!sid) {
      sid = 'session_' + Math.random().toString(36).substring(2, 9);
      localStorage.setItem('kiro_streamer_session_id', sid);
    }
    setMySessionId(sid);
  }, []);

  // 1. Initial Room & Participant Sync
  useEffect(() => {
    if (!mySessionId || !pin) return;

    const initRoom = async () => {
      try {
        setLoading(true);
        // Fetch Room
        const { data: roomData, error: roomErr } = await supabase
          .from('rooms')
          .select('*')
          .eq('pin', pin)
          .single();

        if (roomErr || !roomData) {
          setErrorMsg('존재하지 않거나 이미 종료된 방입니다.');
          setLoading(false);
          return;
        }

        setRoom(roomData);

        const isHost = roomData.host_id === mySessionId;
        
        // Read nickname from sessionStorage first (clean URL without ?nickname=), with fallback to prop
        const storedNickname = typeof window !== 'undefined' ? sessionStorage.getItem(`kiro_viewer_nickname_${pin}`) : null;
        const nicknameToUse = storedNickname || viewerNickname || (isHost ? `${roomData.host_nickname} (👑)` : '시청자_' + Math.floor(Math.random() * 1000));

        // Show Host Onboarding Guide when host first enters room
        if (isHost && roomData.status === 'VOTING' && roomData.current_question_index === 0) {
          const guideDismissed = sessionStorage.getItem(`kiro_guide_dismissed_${roomData.id}`);
          if (!guideDismissed) {
            setShowHostGuide(true);
          }
        }

        // Register / Find participant
        const { data: existingP } = await supabase
          .from('room_participants')
          .select('*')
          .eq('room_id', roomData.id)
          .eq('session_id', mySessionId)
          .maybeSingle();

        if (existingP) {
          setMyParticipantId(existingP.id);
        } else {
          const { data: newP } = await supabase
            .from('room_participants')
            .insert([
              {
                room_id: roomData.id,
                session_id: mySessionId,
                nickname: nicknameToUse,
                score: 0,
              },
            ])
            .select('*')
            .single();

          if (newP) setMyParticipantId(newP.id);
        }

        // Load Question Data for current_question_index
        await fetchQuestionForIndex(roomData.question_ids[roomData.current_question_index]);
        await fetchRoomVotes(roomData.id, roomData.question_ids[roomData.current_question_index]);
        await fetchParticipants(roomData.id);

        setLoading(false);
      } catch (err: any) {
        console.error('Room init error:', err);
        setErrorMsg('방 정보를 불러오는 도중 오류가 발생했습니다.');
        setLoading(false);
      }
    };

    initRoom();
  }, [pin, mySessionId, viewerNickname]);

  // Host Tab Close / Unload Event Handler to finish room safely
  useEffect(() => {
    if (!room?.id || room?.host_id !== mySessionId) return;

    const handleBeforeUnload = () => {
      supabase.from('rooms').update({ status: 'FINISHED' }).eq('id', room.id).then();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [room?.id, room?.host_id, mySessionId]);

  // Fetch Question details
  const fetchQuestionForIndex = async (qId: string) => {
    if (!qId) return;
    const { data } = await supabase.from('questions').select('*').eq('id', qId).single();
    if (data) setCurrentQuestion(data);
  };

  // Fetch Participants
  const fetchParticipants = async (roomId: string) => {
    const { data } = await supabase
      .from('room_participants')
      .select('id, session_id, nickname, score')
      .eq('room_id', roomId)
      .order('score', { ascending: false });

    if (data) setParticipants(data);
  };

  // Fetch Room Votes count for current question
  const fetchRoomVotes = async (roomId: string, qId: string) => {
    if (!roomId || !qId) return;
    const { data } = await supabase
      .from('room_votes')
      .select('participant_id, vote')
      .eq('room_id', roomId)
      .eq('question_id', qId);

    if (data) {
      let countA = 0;
      let countB = 0;
      data.forEach((v) => {
        if (v.vote === 'A') countA++;
        else if (v.vote === 'B') countB++;
      });
      setVotesA(countA);
      setVotesB(countB);

      // Check my vote
      if (myParticipantId) {
        const myVoteEntry = data.find((v) => v.participant_id === myParticipantId);
        if (myVoteEntry) setMyVote(myVoteEntry.vote as 'A' | 'B');
        else setMyVote(null);
      }
    }
  };

  // Throttled Vote Fetching for Zero CPU Latency under heavy traffic
  const throttledFetchRoomVotes = (roomId: string, qId: string) => {
    if (fetchThrottleRef.current) return;
    fetchThrottleRef.current = setTimeout(() => {
      fetchRoomVotes(roomId, qId);
      fetchThrottleRef.current = null;
    }, 150);
  };

  // Supabase Realtime Channel Subscription Ref (Leak-Free & Optimized)
  useEffect(() => {
    if (!room?.id) return;

    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    const roomChannel = supabase
      .channel(`room_${room.id}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'rooms', filter: `id=eq.${room.id}` },
        async (payload) => {
          const updatedRoom = payload.new;
          setRoom((prev: any) => {
            const prevQId = prev?.question_ids?.[prev?.current_question_index];
            const newQId = updatedRoom?.question_ids?.[updatedRoom?.current_question_index];
            const isQuestionIndexChanged = prev && updatedRoom.current_question_index !== prev.current_question_index;
            const isQuestionIdChanged = prev && newQId !== prevQId;
            const isStatusResetToVoting = prev && prev.status !== 'VOTING' && updatedRoom.status === 'VOTING';

            if (isQuestionIndexChanged || isQuestionIdChanged || isStatusResetToVoting) {
              setMyVote(null);
              setVotesA(0);
              setVotesB(0);
              setShowStatsModal(false);
              fetchQuestionForIndex(newQId);
              fetchRoomVotes(updatedRoom.id, newQId);
            }
            return updatedRoom;
          });

          if (['RESULT', 'FINISHED'].includes(updatedRoom.status)) {
            await fetchParticipants(updatedRoom.id);
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'room_votes', filter: `room_id=eq.${room.id}` },
        () => {
          if (room) {
            const currentQId = room.question_ids[room.current_question_index];
            throttledFetchRoomVotes(room.id, currentQId);
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'room_participants', filter: `room_id=eq.${room.id}` },
        async () => {
          if (room) await fetchParticipants(room.id);
        }
      )
      .subscribe();

    channelRef.current = roomChannel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
      if (fetchThrottleRef.current) {
        clearTimeout(fetchThrottleRef.current);
      }
    };
  }, [room?.id]);

  // Actions
  const isHost = room?.host_id === mySessionId;

  // Exclude Streamer (Host) from Ranking Tables
  const viewerParticipants = participants.filter((p) => p.session_id !== room?.host_id);
  const rankedViewers = calculateViewerRanks(viewerParticipants);
  const viewerCount = viewerParticipants.length;

  const totalVotesCount = votesA + votesB;

  let percentA = 0;
  let percentB = 0;
  if (totalVotesCount > 0) {
    percentA = Math.round((votesA / totalVotesCount) * 100);
    percentB = 100 - percentA;
  }

  // Check Prediction Victory (Viewer's prediction matches Streamer Pick)
  const isPredictionMatched = !isHost && room?.status === 'RESULT' && myVote && room?.host_pick && myVote === room?.host_pick;
  const isPredictionFailed = !isHost && room?.status === 'RESULT' && myVote && room?.host_pick && myVote !== room?.host_pick;

  const handleVoteSubmit = async (voteOption: 'A' | 'B') => {
    if (!room || room.status !== 'VOTING' || !myParticipantId) return;

    setMyVote(voteOption);
    const currentQId = room.question_ids[room.current_question_index];

    await supabase.from('room_votes').upsert(
      [
        {
          room_id: room.id,
          question_id: currentQId,
          question_index: room.current_question_index,
          participant_id: myParticipantId,
          vote: voteOption,
        },
      ],
      { onConflict: 'room_id,question_id,participant_id' }
    );
  };

  // Optimistic UI Update + Loading Spinner for Host Lock Votes
  const handleHostLockVotes = async () => {
    if (!isHost || !room || totalVotesCount === 0 || actionLoading) return;

    setActionLoading('locking');
    // Instant Optimistic UI Update (0ms)
    setRoom((prev: any) => ({ ...prev, status: 'LOCKED' }));

    try {
      await supabase.from('rooms').update({ status: 'LOCKED' }).eq('id', room.id);
    } catch (e) {
      console.error('Lock votes error:', e);
    } finally {
      setActionLoading(null);
    }
  };

  // Optimistic UI Update + Loading Spinner for Host Pick Submit
  const handleHostPickSubmit = async (hostPick: 'A' | 'B') => {
    if (!isHost || !room || submittingPick || actionLoading) return;

    const actionTag = hostPick === 'A' ? 'pickA' : 'pickB';
    setActionLoading(actionTag);
    setSubmittingPick(true);

    // Instant Optimistic UI Update (0ms)
    setRoom((prev: any) => ({ ...prev, host_pick: hostPick, status: 'RESULT' }));

    try {
      const currentQId = room.question_ids[room.current_question_index];
      await fetch('/api/streamer/submit-pick', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId: room.id,
          hostSessionId: mySessionId,
          hostPick,
          questionId: currentQId,
          gender: room.host_gender,
          ageGroup: room.host_age_group,
        }),
      });
    } catch (e) {
      console.error('Submit pick error:', e);
    } finally {
      setSubmittingPick(false);
      setActionLoading(null);
    }
  };

  // Optimistic UI Update + Loading Spinner for Next Question
  const handleNextQuestion = async () => {
    if (!isHost || !room || actionLoading) return;

    setActionLoading('next');
    const nextIndex = room.current_question_index + 1;

    try {
      if (nextIndex >= room.total_questions) {
        setRoom((prev: any) => ({ ...prev, status: 'FINISHED' }));
        await supabase.from('rooms').update({ status: 'FINISHED' }).eq('id', room.id);
      } else {
        const nextQId = room.question_ids[nextIndex];
        // Instant Optimistic UI Update & Question Fetch (0ms)
        setMyVote(null);
        setVotesA(0);
        setVotesB(0);
        setShowStatsModal(false);
        setRoom((prev: any) => ({
          ...prev,
          current_question_index: nextIndex,
          status: 'VOTING',
          host_pick: null,
        }));
        fetchQuestionForIndex(nextQId);

        await supabase
          .from('rooms')
          .update({
            current_question_index: nextIndex,
            status: 'VOTING',
            host_pick: null,
          })
          .eq('id', room.id);
      }
    } catch (e) {
      console.error('Next question error:', e);
    } finally {
      setActionLoading(null);
    }
  };

  const handleHostPassQuestion = async () => {
    if (!isHost || !room || submittingPass || actionLoading) return;

    if (!confirm('이 문제를 패스하고 새로운 문제로 교체하시겠습니까?\n(현재 문항 번호는 유지됩니다.)')) {
      return;
    }

    setActionLoading('pass');
    setSubmittingPass(true);

    try {
      const currentQId = room.question_ids[room.current_question_index];

      // 1. Fetch matching category questions
      let query = supabase.from('questions').select('id, category');
      if (!room.categories.includes('전체') && room.categories.length > 0) {
        query = query.in('category', room.categories);
      }

      const { data: candidates } = await query;
      let pool = candidates || [];
      if (pool.length === 0) {
        const { data: allQ } = await supabase.from('questions').select('id, category');
        pool = allQ || [];
      }

      // Filter out existing question IDs
      const unusedCandidates = pool.filter((q: any) => !room.question_ids.includes(q.id));
      const replacementPool = unusedCandidates.length > 0 ? unusedCandidates : pool;
      const newQuestion = replacementPool[Math.floor(Math.random() * replacementPool.length)];

      if (!newQuestion) {
        alert('대체할 수 있는 다른 질문이 없습니다.');
        setSubmittingPass(false);
        setActionLoading(null);
        return;
      }

      // Replace current question_id in array
      const updatedQuestionIds = [...room.question_ids];
      updatedQuestionIds[room.current_question_index] = newQuestion.id;

      // Reset votes for current question index
      await supabase
        .from('room_votes')
        .delete()
        .eq('room_id', room.id)
        .eq('question_id', currentQId);

      // Instant Optimistic UI Update (0ms)
      setMyVote(null);
      setVotesA(0);
      setVotesB(0);
      setShowStatsModal(false);
      setRoom((prev: any) => ({
        ...prev,
        question_ids: updatedQuestionIds,
        status: 'VOTING',
        host_pick: null,
      }));
      fetchQuestionForIndex(newQuestion.id);

      // Update room in DB
      await supabase
        .from('rooms')
        .update({
          question_ids: updatedQuestionIds,
          status: 'VOTING',
          host_pick: null,
        })
        .eq('id', room.id);

    } catch (e) {
      console.error('Pass question error:', e);
      alert('문제 패스 도중 오류가 발생했습니다.');
    } finally {
      setSubmittingPass(false);
      setActionLoading(null);
    }
  };

  const handleHostFinishRoom = async () => {
    if (!isHost || !room || actionLoading) return;
    if (confirm('정말로 함께 플레이하기 방을 종료하시겠습니까?')) {
      setActionLoading('finish');
      setRoom((prev: any) => ({ ...prev, status: 'FINISHED' }));
      await supabase.from('rooms').update({ status: 'FINISHED' }).eq('id', room.id);
      setActionLoading(null);
    }
  };

  const handleCopyPin = () => {
    navigator.clipboard.writeText(pin);
    setCopied(true);
    setShowToast(true);
    setTimeout(() => {
      setCopied(false);
      setShowToast(false);
    }, 2000);
  };

  const dismissHostGuide = () => {
    if (room?.id) {
      sessionStorage.setItem(`kiro_guide_dismissed_${room.id}`, 'true');
    }
    setShowHostGuide(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#080911] flex flex-col items-center justify-center text-white p-4">
        <div className="w-10 h-10 border-4 border-brand-yellow border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-base font-extrabold text-neutral-400">스트리머 룸에 접속하는 중입니다...</p>
      </div>
    );
  }

  if (errorMsg || !room) {
    return (
      <div className="min-h-screen bg-[#080911] flex flex-col items-center justify-center text-white p-4 text-center">
        <div className="p-4 rounded-3xl bg-rose-500/10 border border-rose-500/30 text-rose-400 mb-4 max-w-sm">
          <p className="text-base font-black">{errorMsg || '방을 찾을 수 없습니다.'}</p>
        </div>
        <Link href="/" className="px-6 py-3 rounded-2xl bg-zinc-900 border border-zinc-800 text-sm font-black text-white hover:bg-zinc-800 transition">
          메인 화면으로 돌아가기
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen overflow-y-auto bg-[#080911] text-white flex flex-col justify-between antialiased pb-6 relative">
      {/* Toast Notification */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[100] bg-zinc-900/95 border border-brand-yellow/40 text-brand-yellow px-6 py-3.5 rounded-2xl shadow-2xl text-sm font-black flex items-center gap-2 backdrop-blur-md"
          >
            <span>📋 PIN 코드가 클립보드에 복사되었습니다.</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stats Bottom Sheet Modal (Single Mode Gender/Age Stats) */}
      {showStatsModal && currentQuestion?.id && (
        <StatsBottomSheet
          questionId={currentQuestion.id}
          onClose={() => setShowStatsModal(false)}
        />
      )}

      {/* Host Onboarding Guide Modal */}
      <AnimatePresence>
        {showHostGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={dismissHostGuide}
              className="absolute inset-0 bg-black/85 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 15 }}
              className="relative z-10 w-full max-w-md bg-[#0d0e1d] border border-amber-500/40 rounded-3xl p-6 shadow-2xl text-white space-y-5"
            >
              <div className="text-center space-y-1">
                <div className="inline-flex p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 mb-1">
                  <Sparkles className="w-6 h-6" />
                </div>
                <h2 className="text-xl font-black text-white">🎉 방 생성이 완료되었습니다!</h2>
                <p className="text-xs text-neutral-400">시청자들에게 6자리 PIN 코드를 공유해 주세요</p>
              </div>

              <div className="bg-zinc-950 border border-brand-yellow/30 rounded-2xl p-4 text-center space-y-2">
                <span className="text-xs font-extrabold text-neutral-400 block">초대 PIN 코드</span>
                <span className="text-3xl font-black tracking-widest text-brand-yellow block">{pin}</span>
                <button
                  onClick={handleCopyPin}
                  className="inline-flex items-center gap-1.5 py-2 px-4 rounded-xl bg-brand-yellow/10 border border-brand-yellow/40 text-brand-yellow text-xs font-black hover:bg-brand-yellow/20 transition cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>PIN 코드 복사하기</span>
                </button>
              </div>

              <div className="space-y-2.5 bg-zinc-900/60 p-4 rounded-2xl border border-zinc-800 text-xs">
                <span className="font-extrabold text-neutral-300 block mb-1 text-sm">💡 간단 진행 가이드</span>
                <div className="flex items-start gap-2 text-neutral-300">
                  <span className="font-black text-amber-400 shrink-0">1.</span>
                  <p>시청자들에게 **PIN 코드**를 알려주고 입장을 기다립니다.</p>
                </div>
                <div className="flex items-start gap-2 text-neutral-300">
                  <span className="font-black text-amber-400 shrink-0">2.</span>
                  <p>투표가 끝나면 하단의 **[시청자 투표 마감하기]** 버튼을 누릅니다.</p>
                </div>
                <div className="flex items-start gap-2 text-neutral-300">
                  <span className="font-black text-amber-400 shrink-0">3.</span>
                  <p>스트리머 본인의 **진짜 취향 선택지**를 누르면 정답 시청자들에게 점수가 정산됩니다!</p>
                </div>
              </div>

              <button
                onClick={dismissHostGuide}
                className="w-full py-4 rounded-2xl bg-brand-yellow text-zinc-950 font-black text-base transition-all shadow-lg hover:brightness-110 flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>시작하기</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Unified Header & Logo */}
      <header className="w-full h-16 shrink-0 flex items-center justify-between px-6 border-b border-zinc-900 bg-[#080911]/85 backdrop-blur-md sticky top-0 z-40">
        <Link href="/" className="relative h-11 w-32 flex items-center">
          <img
            src="/logo.png?v=2"
            alt="기로 로고"
            className="h-10 w-auto object-contain pt-[2px]"
          />
        </Link>
        <div />
      </header>

      {/* Sub-Header Live Bar */}
      <div className="w-full border-b border-zinc-900/80 bg-zinc-950/60 backdrop-blur-sm shrink-0">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* LIVE Badge */}
            <div className="flex items-center gap-1.5 bg-rose-500/10 border border-rose-500/30 px-3 py-1.5 rounded-xl">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
              <span className="text-xs md:text-sm font-black text-rose-500 tracking-wider">LIVE</span>
            </div>

            {/* PIN Code Button */}
            <button
              onClick={handleCopyPin}
              className="flex items-center gap-2 text-xs md:text-sm font-black text-brand-yellow bg-brand-yellow/10 border border-brand-yellow/30 px-3 py-1.5 rounded-xl hover:bg-brand-yellow/20 transition cursor-pointer"
              title="PIN 번호 복사"
            >
              <span>PIN: {pin}</span>
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>

          {/* Viewer Count */}
          <div className="flex items-center gap-2 text-xs md:text-sm text-neutral-300 font-black bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded-xl">
            <Users className="w-4.5 h-4.5 text-amber-400" />
            <span>{viewerCount}</span>
          </div>
        </div>
      </div>

      {/* FINISHED STATE VIEW */}
      {room.status === 'FINISHED' ? (
        <div className="w-full max-w-md mx-auto p-4 flex-1 flex flex-col justify-between space-y-8 pt-8">
          <div className="space-y-8">
            <div className="text-center space-y-3">
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-black tracking-tight text-white">🏆 최종 결과</h1>
              <p className="text-base md:text-lg text-neutral-300 font-bold">
                스트리머 픽을 가장 잘 맞힌 시청자 순위입니다!
              </p>
            </div>

            {/* Top 3 Podium */}
            {rankedViewers.length >= 1 && (
              <div className="grid grid-cols-3 gap-3 items-end pt-6 pb-2">
                {/* 2nd Place */}
                {rankedViewers[1] ? (
                  <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 text-center space-y-1.5">
                    <span className="text-3xl">{rankedViewers[1].rank === 1 ? '👑' : '🥈'}</span>
                    <p className="text-sm md:text-base font-black truncate text-neutral-200">{rankedViewers[1].nickname}</p>
                    <p className="text-sm font-black text-amber-400">{rankedViewers[1].rank}등 ({rankedViewers[1].score}점)</p>
                  </div>
                ) : <div />}

                {/* 1st Place */}
                <div className="bg-gradient-to-b from-amber-500/20 to-zinc-900 border border-amber-500/40 rounded-2xl p-5 text-center space-y-2 shadow-2xl transform -translate-y-3">
                  <span className="text-4xl animate-bounce">👑</span>
                  <p className="text-base md:text-lg font-black truncate text-amber-300">{rankedViewers[0].nickname}</p>
                  <p className="text-base font-black text-amber-400">{rankedViewers[0].rank}등 ({rankedViewers[0].score}점)</p>
                </div>

                {/* 3rd Place */}
                {rankedViewers[2] ? (
                  <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 text-center space-y-1.5">
                    <span className="text-3xl">{rankedViewers[2].rank === 1 ? '👑' : rankedViewers[2].rank === 2 ? '🥈' : '🥉'}</span>
                    <p className="text-sm md:text-base font-black truncate text-neutral-200">{rankedViewers[2].nickname}</p>
                    <p className="text-sm font-black text-amber-600">{rankedViewers[2].rank}등 ({rankedViewers[2].score}점)</p>
                  </div>
                ) : <div />}
              </div>
            )}

            {/* Full Ranking Table */}
            <div className="bg-zinc-950 border border-zinc-900 rounded-2xl p-5 space-y-3 max-h-60 overflow-y-auto">
              <span className="text-xs md:text-sm font-extrabold text-neutral-400 uppercase tracking-widest block mb-3">시청자 전체 순위표</span>
              {rankedViewers.map((p) => (
                <div key={p.id} className="flex items-center justify-between py-2.5 px-4 rounded-xl bg-zinc-900/50 text-sm md:text-base">
                  <div className="flex items-center gap-3">
                    <span className="font-black text-amber-400 min-w-[28px]">{p.rank}등</span>
                    <span className="font-bold text-neutral-100">{p.nickname}</span>
                  </div>
                  <span className="font-black text-brand-yellow">{p.score}점</span>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons: Single Mode & Main Navigation */}
          <div className="pb-8 space-y-3">
            <Link
              href="/play"
              className="w-full py-4.5 rounded-2xl bg-gradient-to-r from-brand-yellow via-amber-400 to-yellow-500 text-zinc-950 font-black text-base md:text-lg shadow-2xl hover:brightness-110 transition-all flex items-center justify-center gap-2 cursor-pointer border border-yellow-300"
            >
              <span>👤 혼자 플레이하기 (싱글 모드)</span>
              <ArrowRight className="w-5 h-5" />
            </Link>

            <Link
              href="/"
              className="w-full py-3.5 rounded-2xl bg-zinc-900 border border-zinc-800 text-neutral-300 hover:text-white hover:bg-zinc-850 font-black text-sm md:text-base transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
            >
              <Home className="w-4 h-4 text-neutral-400" />
              <span>메인화면으로 돌아가기</span>
            </Link>
          </div>
        </div>
      ) : (
        /* ACTIVE GAMEPLAY SCREEN */
        <main className="w-full max-w-md mx-auto p-4 flex-1 flex flex-col justify-center space-y-6 my-auto">
          <div className="bg-zinc-950/40 border border-zinc-900 rounded-3xl p-5 md:p-7 backdrop-blur-xl shadow-2xl space-y-5">
            
            <div className="flex items-center justify-between text-xs md:text-sm px-1">
              <span className="font-extrabold text-neutral-300 bg-zinc-900 px-3.5 py-1.5 rounded-full border border-zinc-800">
                {currentQuestion?.category || '밸런스게임'}
              </span>
              <span className="font-black text-neutral-300 bg-zinc-900 px-3 py-1.5 rounded-xl border border-zinc-800 text-xs md:text-sm">
                Q {room.current_question_index + 1} / {room.total_questions}
              </span>
            </div>

            {currentQuestion && (
              <div className="text-center py-2 shrink-0">
                <h1 className="text-2xl md:text-3xl lg:text-4xl font-kiro leading-snug text-[#ffe5a9] tracking-tight whitespace-pre-line break-keep px-1">
                  {currentQuestion.title}
                </h1>
              </div>
            )}

            {/* Simple Total Votes Badge & Unvoted Prompt during VOTING & LOCKED */}
            {['VOTING', 'LOCKED'].includes(room.status) && (
              <div className="space-y-3 my-2">
                <div className="flex justify-center">
                  <span className="text-xs md:text-sm text-neutral-300 font-black bg-zinc-900 px-4 py-1.5 rounded-full border border-zinc-800 shadow-sm">
                    총 {totalVotesCount}명 투표
                  </span>
                </div>

                {!isHost && (
                  <div className="w-full bg-zinc-900/80 border border-zinc-800 rounded-2xl py-2.5 px-4 text-center text-neutral-300 text-xs md:text-sm font-extrabold backdrop-blur-sm shadow-inner">
                    <span className="inline-block animate-pulse mr-1.5 text-sm md:text-base">🎯</span>
                    <span className="text-brand-yellow font-black">{room.host_nickname}</span>님의 선택을 예상하여 픽해주세요.
                  </div>
                )}
              </div>
            )}

            {/* Dramatic Viewer Prediction Victory Banner (RESULT Status) */}
            <AnimatePresence>
              {isPredictionMatched && (
                <motion.div
                  initial={{ scale: 0.6, y: -15, opacity: 0 }}
                  animate={{ scale: 1, y: 0, opacity: 1 }}
                  exit={{ scale: 0.6, opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 450, damping: 15 }}
                  className="w-full bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 text-zinc-950 rounded-2xl py-3.5 px-4 text-center font-black text-base md:text-lg shadow-[0_0_30px_rgba(245,158,11,0.8)] border-2 border-yellow-200 flex items-center justify-center gap-2 transform my-1"
                >
                  <span className="text-2xl animate-bounce">🎯</span>
                  <span className="tracking-tight">예측 성공! 스트리머 픽 적중 (+100점) 🎉</span>
                </motion.div>
              )}

              {isPredictionFailed && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="w-full bg-zinc-900/90 border border-zinc-800 text-neutral-400 rounded-2xl py-2.5 px-4 text-center text-xs md:text-sm font-extrabold my-1"
                >
                  <span>😅 아쉽게 비껴갔네요! 다음 문제에서 정답을 노려보세요!</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Option A & B Cards with Dramatic Streamer Pick & Match Highlights */}
            {currentQuestion && (
              <div className="grid grid-cols-1 gap-4 pt-1">
                {/* Option 1 (A) - Yellow / Amber */}
                <button
                  disabled={room.status !== 'VOTING' || isHost}
                  onClick={() => handleVoteSubmit('A')}
                  className={`relative flex w-full min-h-[95px] flex-col items-center justify-center overflow-hidden rounded-2xl py-4 px-5 transition-all duration-300 text-left border ${
                    room.host_pick === 'A'
                      ? myVote === 'A'
                        ? 'bg-gradient-to-br from-amber-500/30 via-zinc-900 to-emerald-950/40 border-4 border-amber-400 shadow-[0_0_40px_rgba(245,158,11,0.7)] ring-4 ring-yellow-300/40 scale-[1.03]'
                        : 'bg-gradient-to-br from-amber-500/25 via-zinc-900 to-amber-950/40 border-4 border-amber-400 shadow-[0_0_35px_rgba(245,158,11,0.6)] ring-4 ring-amber-400/20 scale-[1.02]'
                      : myVote === 'A'
                      ? 'bg-zinc-900/90 border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.25)]'
                      : 'bg-zinc-900/50 border-zinc-800/80 hover:bg-zinc-900/80 hover:border-zinc-700'
                  } ${room.status !== 'VOTING' ? 'opacity-95' : 'cursor-pointer'}`}
                >
                  {/* Card Fill Animation Revealed AFTER Streamer Pick (RESULT status) */}
                  {room.status === 'RESULT' && (
                    <motion.div
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: 1 }}
                      transition={{ duration: 0.6, ease: 'easeOut' }}
                      className={`absolute inset-0 z-0 opacity-20 ${room.host_pick === 'A' ? 'bg-amber-400' : 'bg-amber-500'}`}
                      style={{ width: `${percentA}%`, transformOrigin: 'left' }}
                    />
                  )}

                  <div className="relative z-10 flex flex-col items-center justify-center gap-1.5 w-full text-center my-auto">
                    {(myVote === 'A' || room.host_pick === 'A') && (
                      <div className="flex items-center justify-center gap-2 flex-wrap mb-1">
                        {myVote === 'A' && (
                          <span className={`rounded-full px-2.5 py-0.5 text-xs font-black shadow-md ${
                            room.host_pick === 'A'
                              ? 'bg-emerald-500 text-zinc-950 border border-emerald-300 ring-2 ring-emerald-400/50'
                              : 'bg-black text-white border border-zinc-700'
                          }`}>
                            {room.host_pick === 'A' ? '🎯 내 예상 적중 (+100점)' : '✓ 내 예상'}
                          </span>
                        )}
                        {/* Dramatic Streamer Pick Badge */}
                        {room.host_pick === 'A' && (
                          <motion.span
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                            className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500 text-zinc-950 px-3.5 py-1 text-xs md:text-sm font-black shadow-[0_0_15px_rgba(245,158,11,0.8)] ring-2 ring-yellow-200"
                          >
                            <span>👑 {room.host_nickname}의 선택!</span>
                          </motion.span>
                        )}
                      </div>
                    )}

                    <div className="flex items-center justify-center gap-2.5 w-full my-auto">
                      {currentQuestion.emoji_a && (
                        <span className="text-3xl md:text-4xl leading-none shrink-0">{currentQuestion.emoji_a}</span>
                      )}
                      <p className={`text-xl md:text-2xl font-kiro leading-snug max-h-28 overflow-y-auto no-scrollbar break-keep my-auto ${
                        room.host_pick === 'A'
                          ? 'text-amber-300 font-black tracking-tight drop-shadow-[0_2px_12px_rgba(245,158,11,0.6)]'
                          : 'text-neutral-100'
                      }`}>
                        {currentQuestion.option_a}
                      </p>
                    </div>

                    {room.status === 'RESULT' && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ type: 'spring', damping: 15 }}
                        className="flex items-baseline justify-center gap-1.5 mt-1"
                      >
                        <span className={`text-2xl md:text-3xl font-black ${room.host_pick === 'A' ? 'text-amber-300 drop-shadow-[0_0_8px_rgba(245,158,11,0.7)]' : 'text-amber-400'}`}>
                          {percentA.toFixed(1)}%
                        </span>
                        <span className="text-xs text-neutral-400 font-extrabold">({votesA}명)</span>
                      </motion.div>
                    )}
                  </div>
                </button>

                {/* Option 2 (B) - Mint / Emerald / Highlighted */}
                <button
                  disabled={room.status !== 'VOTING' || isHost}
                  onClick={() => handleVoteSubmit('B')}
                  className={`relative flex w-full min-h-[95px] flex-col items-center justify-center overflow-hidden rounded-2xl py-4 px-5 transition-all duration-300 text-left border ${
                    room.host_pick === 'B'
                      ? myVote === 'B'
                        ? 'bg-gradient-to-br from-amber-500/30 via-zinc-900 to-emerald-950/40 border-4 border-amber-400 shadow-[0_0_40px_rgba(245,158,11,0.7)] ring-4 ring-yellow-300/40 scale-[1.03]'
                        : 'bg-gradient-to-br from-amber-500/25 via-zinc-900 to-amber-950/40 border-4 border-amber-400 shadow-[0_0_35px_rgba(245,158,11,0.6)] ring-4 ring-amber-400/20 scale-[1.02]'
                      : myVote === 'B'
                      ? 'bg-zinc-900/90 border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.25)]'
                      : 'bg-zinc-900/50 border-zinc-800/80 hover:bg-zinc-900/80 hover:border-zinc-700'
                  } ${room.status !== 'VOTING' ? 'opacity-95' : 'cursor-pointer'}`}
                >
                  {/* Card Fill Animation Revealed AFTER Streamer Pick (RESULT status) */}
                  {room.status === 'RESULT' && (
                    <motion.div
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: 1 }}
                      transition={{ duration: 0.6, ease: 'easeOut' }}
                      className={`absolute inset-0 z-0 opacity-20 ${room.host_pick === 'B' ? 'bg-amber-400' : 'bg-emerald-500'}`}
                      style={{ width: `${percentB}%`, transformOrigin: 'left' }}
                    />
                  )}

                  <div className="relative z-10 flex flex-col items-center justify-center gap-1.5 w-full text-center my-auto">
                    {(myVote === 'B' || room.host_pick === 'B') && (
                      <div className="flex items-center justify-center gap-2 flex-wrap mb-1">
                        {myVote === 'B' && (
                          <span className={`rounded-full px-2.5 py-0.5 text-xs font-black shadow-md ${
                            room.host_pick === 'B'
                              ? 'bg-emerald-500 text-zinc-950 border border-emerald-300 ring-2 ring-emerald-400/50'
                              : 'bg-black text-white border border-zinc-700'
                          }`}>
                            {room.host_pick === 'B' ? '🎯 내 예상 적중 (+100점)' : '✓ 내 예상'}
                          </span>
                        )}
                        {/* Dramatic Streamer Pick Badge */}
                        {room.host_pick === 'B' && (
                          <motion.span
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                            className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500 text-zinc-950 px-3.5 py-1 text-xs md:text-sm font-black shadow-[0_0_15px_rgba(245,158,11,0.8)] ring-2 ring-yellow-200"
                          >
                            <span>👑 {room.host_nickname}의 선택!</span>
                          </motion.span>
                        )}
                      </div>
                    )}

                    <div className="flex items-center justify-center gap-2.5 w-full my-auto">
                      {currentQuestion.emoji_b && (
                        <span className="text-3xl md:text-4xl leading-none shrink-0">{currentQuestion.emoji_b}</span>
                      )}
                      <p className={`text-xl md:text-2xl font-kiro leading-snug max-h-28 overflow-y-auto no-scrollbar break-keep my-auto ${
                        room.host_pick === 'B'
                          ? 'text-amber-300 font-black tracking-tight drop-shadow-[0_2px_12px_rgba(245,158,11,0.6)]'
                          : 'text-neutral-100'
                      }`}>
                        {currentQuestion.option_b}
                      </p>
                    </div>

                    {room.status === 'RESULT' && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ type: 'spring', damping: 15 }}
                        className="flex items-baseline justify-center gap-1.5 mt-1"
                      >
                        <span className={`text-2xl md:text-3xl font-black ${room.host_pick === 'B' ? 'text-amber-300 drop-shadow-[0_0_8px_rgba(245,158,11,0.7)]' : 'text-emerald-400'}`}>
                          {percentB.toFixed(1)}%
                        </span>
                        <span className="text-xs text-neutral-400 font-extrabold">({votesB}명)</span>
                      </motion.div>
                    )}
                  </div>
                </button>
              </div>
            )}

            {/* Detailed Stats Button Revealed AFTER Streamer Pick (RESULT status) */}
            {room.status === 'RESULT' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="pt-2"
              >
                <button
                  onClick={() => setShowStatsModal(true)}
                  className="w-full flex items-center justify-center gap-2 rounded-2xl border border-zinc-800 bg-zinc-900/80 hover:bg-zinc-850 px-5 py-3 text-sm font-black text-neutral-200 hover:text-white transition-all shadow-md cursor-pointer"
                >
                  <BarChart3 className="h-4 w-4 text-amber-400" />
                  <span>서비스 전체 누적 통계 (싱글 데이터)</span>
                </button>
              </motion.div>
            )}
          </div>
        </main>
      )}

      {/* Streamer Host Control Panel with Optimistic Feedback & Loading Spinners */}
      {isHost && room.status !== 'FINISHED' && (
        <div className="w-full max-w-md mx-auto p-4 shrink-0">
          <div className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl p-4 md:p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between text-sm md:text-base font-black text-neutral-300 border-b border-zinc-900 pb-2.5">
              <span>👑 스트리머 컨트롤 영역</span>
              
              {/* Question Pass & Room Finish Actions */}
              <div className="flex items-center gap-3">
                {['VOTING', 'LOCKED'].includes(room.status) && (
                  <button
                    disabled={submittingPass || !!actionLoading}
                    onClick={handleHostPassQuestion}
                    className="flex items-center gap-1 text-xs md:text-sm text-amber-400 hover:text-amber-300 font-extrabold cursor-pointer disabled:opacity-50"
                    title="문제 패스 및 새로고침"
                  >
                    {actionLoading === 'pass' && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>문제 패스</span>
                  </button>
                )}

                <button
                  disabled={!!actionLoading}
                  onClick={handleHostFinishRoom}
                  className="flex items-center gap-1 text-xs md:text-sm text-rose-400 hover:text-rose-300 font-bold cursor-pointer disabled:opacity-50"
                  title="방 종료하기"
                >
                  <LogOut className="w-4 h-4" />
                  <span>방 종료</span>
                </button>
              </div>
            </div>

            {/* Lock Votes Button with Instant Spinner */}
            {room.status === 'VOTING' && (
              <button
                disabled={totalVotesCount === 0 || !!actionLoading}
                onClick={handleHostLockVotes}
                className={`w-full py-3.5 rounded-xl text-sm md:text-base font-black transition-all shadow-lg flex items-center justify-center gap-2 border ${
                  totalVotesCount === 0
                    ? 'bg-zinc-900 border-zinc-800 text-neutral-500 cursor-not-allowed opacity-60'
                    : 'bg-amber-500 hover:bg-amber-400 text-zinc-950 border-amber-400 cursor-pointer'
                }`}
              >
                {actionLoading === 'locking' ? (
                  <>
                    <Loader2 className="w-4.5 h-4.5 animate-spin" />
                    <span>투표 마감 처리 중...</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-4.5 h-4.5" />
                    <span>{totalVotesCount === 0 ? '시청자 투표 참여 대기 중... (0명)' : '시청자 투표 마감하기'}</span>
                  </>
                )}
              </button>
            )}

            {/* Host Pick Buttons with Instant Spinner & Immediate Visual Response */}
            {room.status === 'LOCKED' && (
              <div className="space-y-2.5">
                <span className="text-xs md:text-sm text-neutral-300 font-extrabold block text-center">
                  [스트리머 본인의 취향 픽을 선택해 주세요]
                </span>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    disabled={submittingPick || !!actionLoading}
                    onClick={() => handleHostPickSubmit('A')}
                    className="py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black text-xs md:text-sm transition-all shadow-md cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
                  >
                    {actionLoading === 'pickA' ? (
                      <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                    ) : null}
                    <span className="truncate">{currentQuestion?.option_a}</span>
                  </button>

                  <button
                    disabled={submittingPick || !!actionLoading}
                    onClick={() => handleHostPickSubmit('B')}
                    className="py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black text-xs md:text-sm transition-all shadow-md cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
                  >
                    {actionLoading === 'pickB' ? (
                      <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                    ) : null}
                    <span className="truncate">{currentQuestion?.option_b}</span>
                  </button>
                </div>
              </div>
            )}

            {/* Next Question / Finish Button with Instant Spinner */}
            {room.status === 'RESULT' && (
              <button
                disabled={!!actionLoading}
                onClick={handleNextQuestion}
                className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm md:text-base transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {actionLoading === 'next' ? (
                  <>
                    <Loader2 className="w-4.5 h-4.5 animate-spin" />
                    <span>다음 문제 로딩 중...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4.5 h-4.5" />
                    <span>{room.current_question_index + 1 >= room.total_questions ? '🏆 최종 결과 발표' : '다음 문제 진행하기'}</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      )}

      {/* AdSense Bottom Slot */}
      <div className="adsense-slot adsense-bottom flex justify-center bg-zinc-900/20 border-t border-zinc-900/50 shrink-0 mt-6" style={{ minHeight: '100px', width: '100%' }}>
        <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-3522634980237009" crossOrigin="anonymous"></script>
        <ins className="adsbygoogle"
             style={{ display: 'block' }}
             data-ad-client="ca-pub-3522634980237009"
             data-ad-slot="7310226958"
             data-ad-format="auto"
             data-full-width-responsive="true"></ins>
      </div>
    </div>
  );
}

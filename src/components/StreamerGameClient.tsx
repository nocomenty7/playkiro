'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Trophy, Lock, Play, ArrowRight, Copy, Check, Sparkles, LogOut } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import TugOfWarBar from './TugOfWarBar';

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
        const nicknameToUse = viewerNickname || (isHost ? `${roomData.host_nickname} (👑)` : '시청자_' + Math.floor(Math.random() * 1000));

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
      .select('*')
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
      const countA = data.filter((v) => v.vote === 'A').length;
      const countB = data.filter((v) => v.vote === 'B').length;
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

  // Supabase Realtime Subscriptions
  useEffect(() => {
    if (!room?.id) return;

    const roomChannel = supabase
      .channel(`room_${room.id}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'rooms', filter: `id=eq.${room.id}` },
        async (payload) => {
          const updatedRoom = payload.new;
          const prevIndex = room.current_question_index;
          setRoom(updatedRoom);

          if (updatedRoom.current_question_index !== prevIndex) {
            setMyVote(null);
            setVotesA(0);
            setVotesB(0);
            const newQId = updatedRoom.question_ids[updatedRoom.current_question_index];
            await fetchQuestionForIndex(newQId);
            await fetchRoomVotes(updatedRoom.id, newQId);
          }

          if (['RESULT', 'FINISHED'].includes(updatedRoom.status)) {
            await fetchParticipants(updatedRoom.id);
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'room_votes', filter: `room_id=eq.${room.id}` },
        async () => {
          const currentQId = room.question_ids[room.current_question_index];
          await fetchRoomVotes(room.id, currentQId);
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'room_participants', filter: `room_id=eq.${room.id}` },
        async () => {
          await fetchParticipants(room.id);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(roomChannel);
    };
  }, [room?.id, room?.current_question_index, myParticipantId]);

  // Actions
  const isHost = room?.host_id === mySessionId;

  // Item 1: Exclude Streamer (Host) from Ranking Tables
  const viewerParticipants = participants.filter((p) => p.session_id !== room?.host_id);
  const rankedViewers = calculateViewerRanks(viewerParticipants);
  const viewerCount = viewerParticipants.length;

  const handleVoteSubmit = async (voteOption: 'A' | 'B') => {
    if (!room || room.status !== 'VOTING' || myVote || !myParticipantId) return;

    setMyVote(voteOption);
    const currentQId = room.question_ids[room.current_question_index];

    await supabase.from('room_votes').insert([
      {
        room_id: room.id,
        question_id: currentQId,
        question_index: room.current_question_index,
        participant_id: myParticipantId,
        vote: voteOption,
      },
    ]);
  };

  const handleHostLockVotes = async () => {
    if (!isHost || !room) return;
    await supabase.from('rooms').update({ status: 'LOCKED' }).eq('id', room.id);
  };

  const handleHostPickSubmit = async (hostPick: 'A' | 'B') => {
    if (!isHost || !room || submittingPick) return;
    setSubmittingPick(true);

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
    }
  };

  const handleNextQuestion = async () => {
    if (!isHost || !room) return;
    const nextIndex = room.current_question_index + 1;

    if (nextIndex >= room.total_questions) {
      await supabase.from('rooms').update({ status: 'FINISHED' }).eq('id', room.id);
    } else {
      await supabase
        .from('rooms')
        .update({
          current_question_index: nextIndex,
          status: 'VOTING',
          host_pick: null,
        })
        .eq('id', room.id);
    }
  };

  const handleHostFinishRoom = async () => {
    if (!isHost || !room) return;
    if (confirm('정말로 함께 플레이하기 방을 종료하시겠습니까?')) {
      await supabase.from('rooms').update({ status: 'FINISHED' }).eq('id', room.id);
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
    <div className="min-h-screen bg-[#080911] text-white flex flex-col justify-between antialiased">
      {/* Toast Notification */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-zinc-900/95 border border-brand-yellow/40 text-brand-yellow px-6 py-3.5 rounded-2xl shadow-2xl text-sm font-black flex items-center gap-2 backdrop-blur-md"
          >
            <span>📋 PIN 번호가 클립보드에 복사되었습니다.</span>
          </motion.div>
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
      <div className="w-full border-b border-zinc-900/80 bg-zinc-950/60 backdrop-blur-sm">
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

          {/* Viewer Count (Only number, Excludes Streamer) */}
          <div className="flex items-center gap-2 text-xs md:text-sm text-neutral-300 font-black bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded-xl">
            <Users className="w-4.5 h-4.5 text-blue-400" />
            <span>{viewerCount}</span>
          </div>
        </div>

        {/* Host Sub-Header Banner */}
        <div className="w-full bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-950 border-t border-zinc-900/60 py-2.5 text-center">
          <span className="text-sm md:text-base font-black text-[#ffe5a9] tracking-tight">
            ({room.host_nickname})의 선택은?
          </span>
        </div>
      </div>

      {/* FINISHED STATE VIEW */}
      {room.status === 'FINISHED' ? (
        <div className="w-full max-w-md mx-auto p-4 flex-1 flex flex-col justify-between space-y-8 pt-8">
          <div className="space-y-8">
            {/* Title (Enlarged 2 levels & Excludes Streamer) */}
            <div className="text-center space-y-3">
              <div className="inline-flex p-4 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 mb-2">
                <Trophy className="w-11 h-11" />
              </div>
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-black tracking-tight text-white">🏆 최종 결과</h1>
              <p className="text-base md:text-lg text-neutral-300 font-bold">
                스트리머 픽을 가장 잘 맞힌 시청자 순위입니다!
              </p>
            </div>

            {/* Top 3 Podium (With Tie Rank Handling & Excludes Host) */}
            {rankedViewers.length >= 1 && (
              <div className="grid grid-cols-3 gap-3 items-end pt-6 pb-2">
                {/* 2nd Place / Tie 1st */}
                {rankedViewers[1] ? (
                  <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 text-center space-y-1.5">
                    <span className="text-3xl">{rankedViewers[1].rank === 1 ? '👑' : '🥈'}</span>
                    <p className="text-sm md:text-base font-black truncate text-neutral-200">{rankedViewers[1].nickname}</p>
                    <p className="text-sm font-black text-blue-400">{rankedViewers[1].rank}등 ({rankedViewers[1].score}점)</p>
                  </div>
                ) : <div />}

                {/* 1st Place */}
                <div className="bg-gradient-to-b from-amber-500/20 to-zinc-900 border border-amber-500/40 rounded-2xl p-5 text-center space-y-2 shadow-2xl transform -translate-y-3">
                  <span className="text-4xl animate-bounce">👑</span>
                  <p className="text-base md:text-lg font-black truncate text-amber-300">{rankedViewers[0].nickname}</p>
                  <p className="text-base font-black text-amber-400">{rankedViewers[0].rank}등 ({rankedViewers[0].score}점)</p>
                </div>

                {/* 3rd Place / Tie */}
                {rankedViewers[2] ? (
                  <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 text-center space-y-1.5">
                    <span className="text-3xl">{rankedViewers[2].rank === 1 ? '👑' : rankedViewers[2].rank === 2 ? '🥈' : '🥉'}</span>
                    <p className="text-sm md:text-base font-black truncate text-neutral-200">{rankedViewers[2].nickname}</p>
                    <p className="text-sm font-black text-amber-600">{rankedViewers[2].rank}등 ({rankedViewers[2].score}점)</p>
                  </div>
                ) : <div />}
              </div>
            )}

            {/* Full Ranking Table (Excludes Streamer & Handles Tie Ranks) */}
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

          {/* CTA Button Copy: 혼자 플레이하기 (싱글 모드) */}
          <div className="pb-8">
            <Link
              href="/play"
              className="w-full py-4.5 rounded-2xl bg-gradient-to-r from-brand-yellow via-amber-400 to-yellow-500 text-zinc-950 font-black text-base md:text-lg shadow-2xl hover:brightness-110 transition-all flex items-center justify-center gap-2 cursor-pointer border border-yellow-300"
            >
              <Sparkles className="w-5 h-5" />
              <span>👤 혼자 플레이하기 (싱글 모드)</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      ) : (
        /* ACTIVE GAMEPLAY SCREEN */
        <main className="w-full max-w-md mx-auto p-4 flex-1 flex flex-col justify-center space-y-6 my-auto">
          <div className="bg-zinc-950/40 border border-zinc-900 rounded-3xl p-5 md:p-7 backdrop-blur-xl shadow-2xl space-y-6">
            
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
                <h1 className="text-3xl md:text-4xl lg:text-5xl font-kiro leading-snug text-[#ffe5a9] tracking-tight whitespace-pre-line break-keep px-1">
                  {currentQuestion.title}
                </h1>
              </div>
            )}

            <TugOfWarBar
              votesA={votesA}
              votesB={votesB}
              hasVotedOrHost={isHost || !!myVote || room.status !== 'VOTING'}
              optionAText={currentQuestion?.option_a || '선택 A'}
              optionBText={currentQuestion?.option_b || '선택 B'}
            />

            {currentQuestion && (
              <div className="grid grid-cols-1 gap-4 pt-1">
                {/* Option A */}
                <button
                  disabled={room.status !== 'VOTING' || !!myVote || isHost}
                  onClick={() => handleVoteSubmit('A')}
                  className={`relative flex w-full flex-col items-center justify-center overflow-hidden rounded-2xl py-4 px-5 transition-all duration-300 text-left border ${
                    myVote === 'A'
                      ? 'bg-zinc-900/90 border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.2)]'
                      : room.host_pick === 'A'
                      ? 'bg-zinc-900/90 border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
                      : 'bg-zinc-900/50 border-zinc-800/80 hover:bg-zinc-900/80 hover:border-zinc-700'
                  } ${room.status !== 'VOTING' || !!myVote ? 'opacity-90' : 'cursor-pointer'}`}
                >
                  {myVote === 'A' && (
                    <div className="absolute top-2.5 right-3.5 z-20 flex items-center gap-1 rounded-full bg-blue-500 px-2.5 py-0.5 text-xs font-black text-white shadow-md">
                      <span>✓</span>
                      <span>내 투표</span>
                    </div>
                  )}
                  {room.host_pick === 'A' && (
                    <div className="absolute bottom-2.5 right-3.5 z-20 flex items-center gap-1 rounded-full bg-amber-500 px-2.5 py-0.5 text-xs font-black text-zinc-950 shadow-md">
                      <span>👑</span>
                      <span>스트리머 픽</span>
                    </div>
                  )}

                  <div className="relative z-10 flex items-center justify-center gap-3 w-full text-center py-1.5">
                    {currentQuestion.emoji_a && (
                      <span className="text-3xl md:text-4xl leading-none shrink-0">{currentQuestion.emoji_a}</span>
                    )}
                    <p className="text-2xl md:text-3xl font-kiro leading-snug text-neutral-100 max-h-28 overflow-y-auto no-scrollbar break-keep">
                      {currentQuestion.option_a}
                    </p>
                  </div>
                </button>

                {/* Option B */}
                <button
                  disabled={room.status !== 'VOTING' || !!myVote || isHost}
                  onClick={() => handleVoteSubmit('B')}
                  className={`relative flex w-full flex-col items-center justify-center overflow-hidden rounded-2xl py-4 px-5 transition-all duration-300 text-left border ${
                    myVote === 'B'
                      ? 'bg-zinc-900/90 border-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.2)]'
                      : room.host_pick === 'B'
                      ? 'bg-zinc-900/90 border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
                      : 'bg-zinc-900/50 border-zinc-800/80 hover:bg-zinc-900/80 hover:border-zinc-700'
                  } ${room.status !== 'VOTING' || !!myVote ? 'opacity-90' : 'cursor-pointer'}`}
                >
                  {myVote === 'B' && (
                    <div className="absolute top-2.5 right-3.5 z-20 flex items-center gap-1 rounded-full bg-rose-500 px-2.5 py-0.5 text-xs font-black text-white shadow-md">
                      <span>✓</span>
                      <span>내 투표</span>
                    </div>
                  )}
                  {room.host_pick === 'B' && (
                    <div className="absolute bottom-2.5 right-3.5 z-20 flex items-center gap-1 rounded-full bg-amber-500 px-2.5 py-0.5 text-xs font-black text-zinc-950 shadow-md">
                      <span>👑</span>
                      <span>스트리머 픽</span>
                    </div>
                  )}

                  <div className="relative z-10 flex items-center justify-center gap-3 w-full text-center py-1.5">
                    {currentQuestion.emoji_b && (
                      <span className="text-3xl md:text-4xl leading-none shrink-0">{currentQuestion.emoji_b}</span>
                    )}
                    <p className="text-2xl md:text-3xl font-kiro leading-snug text-neutral-100 max-h-28 overflow-y-auto no-scrollbar break-keep">
                      {currentQuestion.option_b}
                    </p>
                  </div>
                </button>
              </div>
            )}
          </div>
        </main>
      )}

      {/* Streamer Host Control Panel */}
      {isHost && room.status !== 'FINISHED' && (
        <div className="w-full max-w-md mx-auto p-4 shrink-0">
          <div className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl p-4 md:p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between text-sm md:text-base font-black text-neutral-300 border-b border-zinc-900 pb-2.5">
              <span>👑 스트리머 컨트롤 영역</span>
              <button
                onClick={handleHostFinishRoom}
                className="flex items-center gap-1 text-xs md:text-sm text-rose-400 hover:text-rose-300 font-bold cursor-pointer"
                title="방 종료하기"
              >
                <LogOut className="w-4 h-4" />
                <span>방 종료</span>
              </button>
            </div>

            {room.status === 'VOTING' && (
              <button
                onClick={handleHostLockVotes}
                className="w-full py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black text-sm md:text-base transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer"
              >
                <Lock className="w-4.5 h-4.5" />
                <span>시청자 투표 마감하기</span>
              </button>
            )}

            {room.status === 'LOCKED' && (
              <div className="space-y-2.5">
                <span className="text-xs md:text-sm text-neutral-300 font-extrabold block text-center">
                  [스트리머 본인의 취향 픽을 선택해 주세요]
                </span>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    disabled={submittingPick}
                    onClick={() => handleHostPickSubmit('A')}
                    className="py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs md:text-sm transition-all shadow-md cursor-pointer disabled:opacity-50"
                  >
                    👑 A 픽하기 ({currentQuestion?.option_a})
                  </button>
                  <button
                    disabled={submittingPick}
                    onClick={() => handleHostPickSubmit('B')}
                    className="py-3.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs md:text-sm transition-all shadow-md cursor-pointer disabled:opacity-50"
                  >
                    👑 B 픽하기 ({currentQuestion?.option_b})
                  </button>
                </div>
              </div>
            )}

            {room.status === 'RESULT' && (
              <button
                onClick={handleNextQuestion}
                className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm md:text-base transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer"
              >
                <Play className="w-4.5 h-4.5" />
                <span>{room.current_question_index + 1 >= room.total_questions ? '🏁 랭킹전 최종 결과 발표' : '➡️ 다음 문제 진행하기'}</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Global Trust Footer */}
      <footer className="w-full py-3 shrink-0 border-t border-zinc-900/40 text-center flex flex-col items-center gap-1 bg-[#080911]">
        <div className="flex items-center justify-center gap-3 text-[10px] md:text-xs text-neutral-500 font-extrabold">
          <Link href="/privacy" className="hover:text-neutral-350 transition-all">개인정보처리방침</Link>
          <span className="text-zinc-800">|</span>
          <Link href="/terms" className="hover:text-neutral-350 transition-all">이용약관</Link>
          <span className="text-zinc-800">|</span>
          <a href="mailto:nocomenty7@gmail.com" className="hover:text-neutral-350 transition-all">문의하기</a>
        </div>
        <p className="text-[9px] md:text-[10px] text-neutral-600 mt-1">© 2026 기로. All rights reserved.</p>
      </footer>

      {/* AdSense Bottom Slot */}
      <div className="adsense-slot adsense-bottom flex justify-center bg-zinc-900/20 border-t border-zinc-900/50 shrink-0" style={{ minHeight: '100px', width: '100%' }}>
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

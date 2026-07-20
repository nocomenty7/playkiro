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

        // Join participant if viewerNickname provided or not existing
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

  // Item 9: Host Tab Close / Unload Event Handler to finish room safely
  useEffect(() => {
    if (!room?.id || room?.host_id !== mySessionId) return;

    const handleBeforeUnload = () => {
      // Send beacon or async DB call to mark room as finished if host closes tab
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

  // 2. Supabase Realtime Subscriptions
  useEffect(() => {
    if (!room?.id) return;

    // Subscribe to `rooms` updates (Status changes, Index changes, Host Pick)
    const roomChannel = supabase
      .channel(`room_${room.id}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'rooms', filter: `id=eq.${room.id}` },
        async (payload) => {
          const updatedRoom = payload.new;
          const prevIndex = room.current_question_index;
          setRoom(updatedRoom);

          // If question index changed, reset votes and load new question
          if (updatedRoom.current_question_index !== prevIndex) {
            setMyVote(null);
            setVotesA(0);
            setVotesB(0);
            const newQId = updatedRoom.question_ids[updatedRoom.current_question_index];
            await fetchQuestionForIndex(newQId);
            await fetchRoomVotes(updatedRoom.id, newQId);
          }

          // Refresh participants score if status changed to RESULT or FINISHED
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
  // Item 3: Viewer Count only (excluding host)
  const viewerCount = Math.max(0, participants.length - (isHost ? 1 : 1));

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
      // Game Finished!
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

  // Item 9: Host Finish/Close Room manually
  const handleHostFinishRoom = async () => {
    if (!isHost || !room) return;
    if (confirm('정말로 함께 플레이하기 방을 종료하시겠습니까?')) {
      await supabase.from('rooms').update({ status: 'FINISHED' }).eq('id', room.id);
    }
  };

  // Item 2: Copy PIN with Clipboard Icon & Center Toast
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
        <p className="text-sm font-extrabold text-neutral-400">스트리머 룸에 접속하는 중입니다...</p>
      </div>
    );
  }

  if (errorMsg || !room) {
    return (
      <div className="min-h-screen bg-[#080911] flex flex-col items-center justify-center text-white p-4 text-center">
        <div className="p-4 rounded-3xl bg-rose-500/10 border border-rose-500/30 text-rose-400 mb-4 max-w-sm">
          <p className="text-sm font-black">{errorMsg || '방을 찾을 수 없습니다.'}</p>
        </div>
        <Link href="/" className="px-6 py-3 rounded-2xl bg-zinc-900 border border-zinc-800 text-xs font-black text-white hover:bg-zinc-800 transition">
          메인 화면으로 돌아가기
        </Link>
      </div>
    );
  }

  // FINISHED STATE: Final Leaderboard & Traffic Lock-in CTA
  if (room.status === 'FINISHED') {
    return (
      <div className="min-h-screen bg-[#080911] text-white flex flex-col items-center justify-between p-4 max-w-md mx-auto relative">
        <div className="w-full space-y-6 pt-6">
          {/* Winner Banner */}
          <div className="text-center space-y-2">
            <div className="inline-flex p-3 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 mb-2">
              <Trophy className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-black tracking-tight text-white">🏆 최종 함께 플레이 결과</h1>
            <p className="text-xs text-neutral-400">스트리머 픽을 가장 잘 맞힌 최종 우승자들입니다!</p>
          </div>

          {/* Top 3 Podium */}
          {participants.length >= 1 && (
            <div className="grid grid-cols-3 gap-2 items-end pt-4 pb-2">
              {/* 2nd Place */}
              {participants[1] ? (
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-3 text-center space-y-1">
                  <span className="text-2xl">🥈</span>
                  <p className="text-xs font-black truncate text-neutral-200">{participants[1].nickname}</p>
                  <p className="text-[11px] font-black text-blue-400">{participants[1].score}점</p>
                </div>
              ) : <div />}

              {/* 1st Place */}
              <div className="bg-gradient-to-b from-amber-500/20 to-zinc-900 border border-amber-500/40 rounded-2xl p-4 text-center space-y-1.5 shadow-xl transform -translate-y-2">
                <span className="text-3xl animate-bounce">👑</span>
                <p className="text-sm font-black truncate text-amber-300">{participants[0].nickname}</p>
                <p className="text-xs font-black text-amber-400">{participants[0].score}점</p>
              </div>

              {/* 3rd Place */}
              {participants[2] ? (
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-3 text-center space-y-1">
                  <span className="text-2xl">🥉</span>
                  <p className="text-xs font-black truncate text-neutral-200">{participants[2].nickname}</p>
                  <p className="text-[11px] font-black text-amber-600">{participants[2].score}점</p>
                </div>
              ) : <div />}
            </div>
          )}

          {/* Full Ranking Table */}
          <div className="bg-zinc-950 border border-zinc-900 rounded-2xl p-4 space-y-2 max-h-48 overflow-y-auto">
            <span className="text-[10px] font-extrabold text-neutral-500 uppercase tracking-widest block mb-2">전체 참가자 순위표</span>
            {participants.map((p, idx) => (
              <div key={p.id} className="flex items-center justify-between py-1.5 px-3 rounded-xl bg-zinc-900/50 text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-black text-neutral-400 w-5">{idx + 1}.</span>
                  <span className="font-bold text-neutral-200">{p.nickname}</span>
                </div>
                <span className="font-black text-brand-yellow">{p.score}점</span>
              </div>
            ))}
          </div>
        </div>

        {/* 🚨 TRAFFIC LOCK-IN CTA: Direct Route to Single Mode */}
        <div className="w-full pb-8 pt-6">
          <Link
            href="/play"
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-brand-yellow via-amber-400 to-yellow-500 text-zinc-950 font-black text-base shadow-2xl hover:brightness-110 transition-all flex items-center justify-center gap-2 cursor-pointer border border-yellow-300"
          >
            <Sparkles className="w-5 h-5" />
            <span>👤 나 혼자 취향 테스트하러 가기 (싱글 모드)</span>
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </div>
    );
  }

  // ACTIVE GAMEPLAY SCREEN
  return (
    <div className="min-h-screen bg-[#080911] text-white flex flex-col items-center justify-between p-4 max-w-md mx-auto relative">
      {/* Item 2: Center Toast Notification */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-zinc-900/95 border border-brand-yellow/40 text-brand-yellow px-5 py-3 rounded-2xl shadow-2xl text-xs font-extrabold flex items-center gap-2 backdrop-blur-md"
          >
            <span>📋 PIN 번호가 클립보드에 복사되었습니다.</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Header Bar with Item 4 (LIVE Indicator), Item 2 (Copy PIN), Item 3 (Viewers Count) */}
      <header className="w-full flex items-center justify-between py-3 px-2 border-b border-zinc-900">
        {/* Item 4: Red Pulsing LIVE Indicator */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-rose-500/10 border border-rose-500/30 px-2.5 py-1 rounded-lg">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            <span className="text-[11px] font-black text-rose-500 tracking-wider">LIVE</span>
          </div>

          {/* Item 2: PIN with Clipboard Copy Icon */}
          <button
            onClick={handleCopyPin}
            className="flex items-center gap-1.5 text-xs font-black text-brand-yellow bg-brand-yellow/10 border border-brand-yellow/30 px-2.5 py-1 rounded-lg hover:bg-brand-yellow/20 transition cursor-pointer"
            title="PIN 번호 복사"
          >
            <span>PIN: {pin}</span>
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Item 3: Viewers Count Only */}
        <div className="flex items-center gap-1.5 text-xs text-neutral-400 font-bold">
          <Users className="w-4 h-4 text-blue-400" />
          <span>시청자 {viewerCount}명</span>
        </div>
      </header>

      {/* Item 1: Main Question Card Area - Re-using Single Mode UI/UX from VoteClient.tsx */}
      <main className="w-full flex-1 flex flex-col justify-center space-y-4 py-4">
        {/* Single Mode Style Card Container */}
        <div className="bg-zinc-950/40 border border-zinc-900 rounded-3xl p-4 md:p-6 backdrop-blur-xl shadow-2xl space-y-4">
          
          {/* Question Category & Progress Badge */}
          <div className="flex items-center justify-between text-xs px-1">
            <span className="font-extrabold text-neutral-400 bg-zinc-900 px-3 py-1 rounded-full border border-zinc-800">
              {currentQuestion?.category || '밸런스게임'}
            </span>
            <span className="font-black text-neutral-400 bg-zinc-900 px-2.5 py-1 rounded-lg border border-zinc-800 text-[11px]">
              Q {room.current_question_index + 1} / {room.total_questions}
            </span>
          </div>

          {/* Single Mode Style Question Title (#ffe5a9 font-kiro) */}
          {currentQuestion && (
            <div className="text-center py-1 shrink-0">
              <h1 className="text-2xl md:text-3xl font-kiro leading-[1.1] text-[#ffe5a9] tracking-tight whitespace-pre-line break-keep px-1">
                {currentQuestion.title}
              </h1>
            </div>
          )}

          {/* Tug of War Realtime Gauge */}
          <TugOfWarBar
            votesA={votesA}
            votesB={votesB}
            hasVotedOrHost={isHost || !!myVote || room.status !== 'VOTING'}
            optionAText={currentQuestion?.option_a || '선택 A'}
            optionBText={currentQuestion?.option_b || '선택 B'}
          />

          {/* Single Mode Style Option A & B Buttons */}
          {currentQuestion && (
            <div className="grid grid-cols-1 gap-3 pt-1">
              {/* Option A */}
              <button
                disabled={room.status !== 'VOTING' || !!myVote || isHost}
                onClick={() => handleVoteSubmit('A')}
                className={`relative flex w-full flex-col items-center justify-center overflow-hidden rounded-2xl py-3.5 px-4 transition-all duration-300 text-left border ${
                  myVote === 'A'
                    ? 'bg-zinc-900/90 border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.2)]'
                    : room.host_pick === 'A'
                    ? 'bg-zinc-900/90 border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
                    : 'bg-zinc-900/50 border-zinc-800/80 hover:bg-zinc-900/80 hover:border-zinc-700'
                } ${room.status !== 'VOTING' || !!myVote ? 'opacity-90' : 'cursor-pointer'}`}
              >
                {myVote === 'A' && (
                  <div className="absolute top-2 right-3 z-20 flex items-center gap-1 rounded-full bg-blue-500 px-2 py-0.5 text-[9px] font-black text-white shadow-md">
                    <span>✓</span>
                    <span>내 투표</span>
                  </div>
                )}
                {room.host_pick === 'A' && (
                  <div className="absolute bottom-2 right-3 z-20 flex items-center gap-1 rounded-full bg-amber-500 px-2 py-0.5 text-[9px] font-black text-zinc-950 shadow-md">
                    <span>👑</span>
                    <span>방장 픽</span>
                  </div>
                )}

                <div className="relative z-10 flex items-center justify-center gap-2.5 w-full text-center py-1">
                  {currentQuestion.emoji_a && (
                    <span className="text-3xl leading-none shrink-0">{currentQuestion.emoji_a}</span>
                  )}
                  <p className="text-xl md:text-2xl font-kiro leading-[1.15] text-neutral-100 max-h-24 overflow-y-auto no-scrollbar break-keep">
                    {currentQuestion.option_a}
                  </p>
                </div>
              </button>

              {/* Option B */}
              <button
                disabled={room.status !== 'VOTING' || !!myVote || isHost}
                onClick={() => handleVoteSubmit('B')}
                className={`relative flex w-full flex-col items-center justify-center overflow-hidden rounded-2xl py-3.5 px-4 transition-all duration-300 text-left border ${
                  myVote === 'B'
                    ? 'bg-zinc-900/90 border-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.2)]'
                    : room.host_pick === 'B'
                    ? 'bg-zinc-900/90 border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
                    : 'bg-zinc-900/50 border-zinc-800/80 hover:bg-zinc-900/80 hover:border-zinc-700'
                } ${room.status !== 'VOTING' || !!myVote ? 'opacity-90' : 'cursor-pointer'}`}
              >
                {myVote === 'B' && (
                  <div className="absolute top-2 right-3 z-20 flex items-center gap-1 rounded-full bg-rose-500 px-2 py-0.5 text-[9px] font-black text-white shadow-md">
                    <span>✓</span>
                    <span>내 투표</span>
                  </div>
                )}
                {room.host_pick === 'B' && (
                  <div className="absolute bottom-2 right-3 z-20 flex items-center gap-1 rounded-full bg-amber-500 px-2 py-0.5 text-[9px] font-black text-zinc-950 shadow-md">
                    <span>👑</span>
                    <span>방장 픽</span>
                  </div>
                )}

                <div className="relative z-10 flex items-center justify-center gap-2.5 w-full text-center py-1">
                  {currentQuestion.emoji_b && (
                    <span className="text-3xl leading-none shrink-0">{currentQuestion.emoji_b}</span>
                  )}
                  <p className="text-xl md:text-2xl font-kiro leading-[1.15] text-neutral-100 max-h-24 overflow-y-auto no-scrollbar break-keep">
                    {currentQuestion.option_b}
                  </p>
                </div>
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Streamer Host Control Panel (Visible only to Host) */}
      {isHost && (
        <footer className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl p-4 space-y-3 shadow-2xl">
          <div className="flex items-center justify-between text-xs font-extrabold text-neutral-400 border-b border-zinc-900 pb-2">
            <span>👑 스트리머 수동 진행 컨트롤</span>
            <button
              onClick={handleHostFinishRoom}
              className="flex items-center gap-1 text-xs text-rose-400 hover:text-rose-300 font-bold cursor-pointer"
              title="방 종료하기"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>방 종료</span>
            </button>
          </div>

          {room.status === 'VOTING' && (
            <button
              onClick={handleHostLockVotes}
              className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black text-sm transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer"
            >
              <Lock className="w-4 h-4" />
              <span>[1. 시청자 투표 마감하기]</span>
            </button>
          )}

          {room.status === 'LOCKED' && (
            <div className="space-y-2">
              <span className="text-xs text-neutral-400 font-extrabold block text-center">
                [2. 스트리머 본인의 취향 픽을 선택해 주세요]
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  disabled={submittingPick}
                  onClick={() => handleHostPickSubmit('A')}
                  className="py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs transition-all shadow-md cursor-pointer disabled:opacity-50"
                >
                  👑 A 픽하기 ({currentQuestion?.option_a})
                </button>
                <button
                  disabled={submittingPick}
                  onClick={() => handleHostPickSubmit('B')}
                  className="py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs transition-all shadow-md cursor-pointer disabled:opacity-50"
                >
                  👑 B 픽하기 ({currentQuestion?.option_b})
                </button>
              </div>
            </div>
          )}

          {room.status === 'RESULT' && (
            <button
              onClick={handleNextQuestion}
              className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer"
            >
              <Play className="w-4 h-4" />
              <span>{room.current_question_index + 1 >= room.total_questions ? '🏁 랭킹전 최종 결과 발표' : '➡️ 다음 문제 진행하기'}</span>
            </button>
          )}
        </footer>
      )}
    </div>
  );
}

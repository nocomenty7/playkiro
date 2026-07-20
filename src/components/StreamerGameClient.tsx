'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Tv, Users, Trophy, Lock, Play, ArrowRight, Share2, Check, Sparkles } from 'lucide-react';
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
          .single();

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

  const handleCopyPin = () => {
    navigator.clipboard.writeText(pin);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
            <h1 className="text-2xl font-black tracking-tight text-white">🏆 최종 랭킹전 결과</h1>
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
      {/* Top Header Bar */}
      <header className="w-full flex items-center justify-between py-3 px-2 border-b border-zinc-900">
        <div className="flex items-center gap-2">
          <span className="text-xs font-black text-neutral-400 bg-zinc-900 px-2.5 py-1 rounded-lg border border-zinc-800">
            Q {room.current_question_index + 1} / {room.total_questions}
          </span>
          <button
            onClick={handleCopyPin}
            className="flex items-center gap-1.5 text-xs font-black text-brand-yellow bg-brand-yellow/10 border border-brand-yellow/30 px-2.5 py-1 rounded-lg hover:bg-brand-yellow/20 transition"
          >
            <span>PIN: {pin}</span>
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
          </button>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-neutral-400 font-bold">
          <Users className="w-4 h-4 text-blue-400" />
          <span>{participants.length}명</span>
        </div>
      </header>

      {/* Main Question Card Area */}
      <main className="w-full flex-1 flex flex-col justify-center space-y-4 py-4">
        {/* Question Title */}
        {currentQuestion && (
          <div className="text-center space-y-2">
            <span className="text-[10px] font-extrabold text-neutral-500 uppercase tracking-widest bg-zinc-900 px-3 py-1 rounded-full border border-zinc-800">
              {currentQuestion.category || '밸런스게임'}
            </span>
            <h1 className="text-xl md:text-2xl font-black text-[#ffe5a9] leading-snug tracking-tight px-2 break-keep">
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

        {/* Option Selection Buttons A vs B */}
        {currentQuestion && (
          <div className="grid grid-cols-1 gap-3 pt-2">
            {/* Option A */}
            <button
              disabled={room.status !== 'VOTING' || !!myVote || isHost}
              onClick={() => handleVoteSubmit('A')}
              className={`w-full p-4 rounded-2xl border text-left transition-all relative overflow-hidden ${
                myVote === 'A'
                  ? 'border-blue-500 bg-blue-500/20 ring-2 ring-blue-500'
                  : room.host_pick === 'A'
                  ? 'border-amber-400 bg-amber-400/20 ring-2 ring-amber-400'
                  : 'border-zinc-800 bg-zinc-900/80 hover:border-zinc-700'
              } ${room.status !== 'VOTING' || !!myVote ? 'opacity-90' : 'cursor-pointer'}`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-blue-400">Option A</span>
                {myVote === 'A' && <span className="text-xs font-black text-blue-400">내 선택 ✔</span>}
                {room.host_pick === 'A' && <span className="text-xs font-black text-amber-400">👑 방장 픽</span>}
              </div>
              <p className="text-base font-black text-white mt-1 break-keep">{currentQuestion.option_a}</p>
            </button>

            {/* Option B */}
            <button
              disabled={room.status !== 'VOTING' || !!myVote || isHost}
              onClick={() => handleVoteSubmit('B')}
              className={`w-full p-4 rounded-2xl border text-left transition-all relative overflow-hidden ${
                myVote === 'B'
                  ? 'border-rose-500 bg-rose-500/20 ring-2 ring-rose-500'
                  : room.host_pick === 'B'
                  ? 'border-amber-400 bg-amber-400/20 ring-2 ring-amber-400'
                  : 'border-zinc-800 bg-zinc-900/80 hover:border-zinc-700'
              } ${room.status !== 'VOTING' || !!myVote ? 'opacity-90' : 'cursor-pointer'}`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-rose-400">Option B</span>
                {myVote === 'B' && <span className="text-xs font-black text-rose-400">내 선택 ✔</span>}
                {room.host_pick === 'B' && <span className="text-xs font-black text-amber-400">👑 방장 픽</span>}
              </div>
              <p className="text-base font-black text-white mt-1 break-keep">{currentQuestion.option_b}</p>
            </button>
          </div>
        )}
      </main>

      {/* Streamer Host Control Panel (Visible only to Host) */}
      {isHost && (
        <footer className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl p-4 space-y-3 shadow-2xl">
          <div className="flex items-center justify-between text-xs font-extrabold text-neutral-400 border-b border-zinc-900 pb-2">
            <span>👑 스트리머 수동 컨트롤</span>
            <span className="text-brand-yellow font-black">상태: {room.status}</span>
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

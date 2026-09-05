'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { X, Users, PieChart, BarChart, Info } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface StatsBottomSheetProps {
  questionId: string;
  onClose: () => void;
  isOpen?: boolean;
  currentTotalVotes?: number;
}

interface VoteStats {
  gender: {
    maleA: number;
    maleB: number;
    maleAPercent: number;
    maleBPercent: number;
    femaleA: number;
    femaleB: number;
    femaleAPercent: number;
    femaleBPercent: number;
  };
  ageGroups: {
    name: string;
    countA: number;
    countB: number;
    percentA: number;
    percentB: number;
    total: number;
  }[];
  multiA: number;
  multiB: number;
  multiTotal: number;
  multiAPercent: number;
  multiBPercent: number;
  totalVotes: number;
}

const formatVoteCount = (count: number) => count.toLocaleString();

export default function StatsBottomSheet({ questionId, onClose, isOpen, currentTotalVotes }: StatsBottomSheetProps) {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<VoteStats | null>(null);
  const [questionData, setQuestionData] = useState<any>(null);

  useEffect(() => {
    if (!isOpen || !questionId) return;

    async function fetchStats() {
      setLoading(true);
      try {
        // 1. Fetch Question Data for UI context
        const { data: qData } = await supabase.from('questions').select('*').eq('id', questionId).single();
        if (qData) {
          setQuestionData(qData);
        }

        const fallbackTotal = qData ? (Number(qData.votes_a || 0) + Number(qData.votes_b || 0)) : 0;
        const baselineTotal = Math.max(fallbackTotal, currentTotalVotes || 0);

        // 2. Fetch Vote Stats
        const { data: statsData, error } = await supabase
          .from('vote_stats')
          .select('stats')
          .eq('question_id', questionId)
          .maybeSingle();

        if (error) throw error;

        const defaultAgeGroups = ['10대', '20대', '30대', '40대', '50대', '60대 이상'].map((name) => ({
          name,
          countA: 0,
          countB: 0,
          percentA: 50.0,
          percentB: 50.0,
          total: 0
        }));

        if (!statsData || !statsData.stats) {
          setStats({
            gender: {
              maleA: 0, maleB: 0, maleAPercent: 50.0, maleBPercent: 50.0,
              femaleA: 0, femaleB: 0, femaleAPercent: 50.0, femaleBPercent: 50.0
            },
            ageGroups: defaultAgeGroups,
            multiA: 0,
            multiB: 0,
            multiTotal: 0,
            multiAPercent: 50.0,
            multiBPercent: 50.0,
            totalVotes: baselineTotal > 0 ? baselineTotal : 1
          });
          setLoading(false);
          return;
        }

        let totalVotes = 0;
        let maleA = 0;
        let maleB = 0;
        let femaleA = 0;
        let femaleB = 0;
        let multiA = 0;
        let multiB = 0;

        const ageMap: Record<string, { A: number; B: number }> = {
          '10대': { A: 0, B: 0 },
          '20대': { A: 0, B: 0 },
          '30대': { A: 0, B: 0 },
          '40대': { A: 0, B: 0 },
          '50대': { A: 0, B: 0 },
          '60대 이상': { A: 0, B: 0 }
        };

        if (statsData && statsData.stats) {
          const statsObj = statsData.stats as Record<string, number>;
          
          Object.keys(statsObj).forEach((key) => {
            const count = Number(statsObj[key]) || 0;
            if (key === 'multi_a' || key === 'multiA') {
              multiA += count;
              totalVotes += count;
              return;
            }
            if (key === 'multi_b' || key === 'multiB') {
              multiB += count;
              totalVotes += count;
              return;
            }

            if (key !== 'multi') {
              totalVotes += count;
            }

            const parts = key.split('_');
            if (parts.length === 3) {
              const genderVal = parts[0];
              const ageVal = parts[1];
              const optionVal = parts[2];
              const isOptionA = optionVal === 'a';

              if (genderVal === 'male') {
                if (isOptionA) maleA += count; else maleB += count;
              } else if (genderVal === 'female') {
                if (isOptionA) femaleA += count; else femaleB += count;
              }

              let korAge = '';
              if (ageVal === '10s') korAge = '10대';
              else if (ageVal === '20s') korAge = '20대';
              else if (ageVal === '30s') korAge = '30대';
              else if (ageVal === '40s') korAge = '40대';
              else if (ageVal === '50s') korAge = '50대';
              else if (ageVal === '60s' || ageVal === '70s') korAge = '60대 이상';

              if (korAge && ageMap[korAge]) {
                if (isOptionA) {
                  ageMap[korAge].A += count;
                } else {
                  ageMap[korAge].B += count;
                }
              }
            }
          });
        }

        const maleTotal = maleA + maleB;
        const maleAPercent = maleTotal > 0 ? Number(((maleA / maleTotal) * 100).toFixed(1)) : 50.0;
        const maleBPercent = maleTotal > 0 ? Number((100 - maleAPercent).toFixed(1)) : 50.0;

        const femaleTotal = femaleA + femaleB;
        const femaleAPercent = femaleTotal > 0 ? Number(((femaleA / femaleTotal) * 100).toFixed(1)) : 50.0;
        const femaleBPercent = femaleTotal > 0 ? Number((100 - femaleAPercent).toFixed(1)) : 50.0;

        const ageGroups = Object.keys(ageMap).map((key) => {
          const a = ageMap[key].A;
          const b = ageMap[key].B;
          const totalAge = a + b;
          const percentA = totalAge > 0 ? Number(((a / totalAge) * 100).toFixed(1)) : 50.0;
          const percentB = totalAge > 0 ? Number((100 - percentA).toFixed(1)) : 50.0;

          return {
            name: key,
            countA: a,
            countB: b,
            percentA,
            percentB,
            total: totalAge
          };
        });

        const multiTotal = multiA + multiB;
        const multiAPercent = multiTotal > 0 ? Number(((multiA / multiTotal) * 100).toFixed(1)) : 50.0;
        const multiBPercent = multiTotal > 0 ? Number((100 - multiAPercent).toFixed(1)) : 50.0;

        const finalTotalVotes = Math.max(totalVotes, fallbackTotal, currentTotalVotes || 0, 1);

        setStats({
          gender: {
            maleA, maleB, maleAPercent, maleBPercent,
            femaleA, femaleB, femaleAPercent, femaleBPercent
          },
          ageGroups,
          multiA,
          multiB,
          multiTotal,
          multiAPercent,
          multiBPercent,
          totalVotes: finalTotalVotes
        });
      } catch (err) {
        console.error('Error fetching statistics:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, [questionId, isOpen, currentTotalVotes]);

  return (
    <div className="fixed inset-0 z-[120] flex items-end justify-center bg-black/70 backdrop-blur-sm">
      <div className="absolute inset-0" onClick={onClose} />

      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 220 }}
        className="relative z-10 w-full max-w-md rounded-t-3xl bg-[#0d0e1d] border-t border-zinc-800 p-6 text-white shadow-2xl backdrop-blur-xl flex flex-col max-h-[85vh] h-[85vh] overflow-hidden"
      >
        <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-zinc-700 cursor-pointer shrink-0" onClick={onClose} />

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 flex-1">
            <span className="h-9 w-9 animate-spin rounded-full border-4 border-t-transparent border-amber-400" />
            <p className="text-sm text-neutral-400 font-extrabold">통계 데이터를 불러오는 중...</p>
          </div>
        ) : stats ? (
          <div className="flex-1 overflow-y-auto overscroll-contain touch-pan-y space-y-6 pr-1 pb-6 min-h-0 text-white">
            <div className="text-center pt-2 pb-5 space-y-1 relative">
              <div className="absolute left-0 top-1 z-10">
                <button onClick={onClose} className="p-2 bg-zinc-900 rounded-full text-neutral-400 hover:text-white transition-colors cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <h2 className="text-xl md:text-2xl font-black text-white drop-shadow-sm">본 질문지 누적 상세통계</h2>
              <p className="text-lg md:text-xl text-brand-yellow font-black mt-4 mb-1">
                해당 질문 누적 참여자 수 : {formatVoteCount(stats?.totalVotes || 0)}명
              </p>
              
              {questionData && (
                <div className="mt-4 bg-zinc-900/60 border border-zinc-800 rounded-2xl p-4 text-center mx-2">
                  <div className="flex flex-col gap-1.5 text-xs md:text-sm font-black">
                    <div className="text-amber-400 bg-amber-500/10 py-1.5 rounded-lg border border-amber-500/20">
                      {questionData.emoji_a} {questionData.option_a}
                    </div>
                    <div className="text-emerald-400 bg-emerald-500/10 py-1.5 rounded-lg border border-emerald-500/20">
                      {questionData.emoji_b} {questionData.option_b}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Section 1: Gender (Single Mode Users) */}
            <div className="space-y-4">
              <h4 className="text-base font-extrabold text-neutral-200 flex items-center gap-2">
                <PieChart className="h-5 w-5 text-amber-400" /> 성별 선택 비율 (싱글모드 유저)
              </h4>
              
              <div className="space-y-4 bg-zinc-900/60 border border-zinc-800 p-4 rounded-2xl">
                {/* 1. Male Breakdown */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs font-bold px-1">
                    <span className="text-neutral-200 font-extrabold text-sm">🙋‍♂️ 남성 유저 통계</span>
                    {stats.gender.maleA + stats.gender.maleB > 0 ? (
                      <div className="space-x-1.5 font-black">
                        <span className="text-amber-400">{stats.gender.maleAPercent}%</span>
                        <span className="text-zinc-600">|</span>
                        <span className="text-emerald-400">{stats.gender.maleBPercent}%</span>
                      </div>
                    ) : (
                      <span className="text-neutral-500 text-xs font-medium">참여한 남성 없음</span>
                    )}
                  </div>

                  <div className="relative flex h-3.5 w-full overflow-hidden rounded-full bg-zinc-800 shadow-inner">
                    {stats.gender.maleA + stats.gender.maleB > 0 ? (
                      <>
                        <div style={{ width: `${stats.gender.maleAPercent}%` }} className="h-full bg-amber-500/80" />
                        <div style={{ width: `${stats.gender.maleBPercent}%` }} className="h-full bg-emerald-500/80" />
                      </>
                    ) : (
                      <div className="h-full w-full bg-zinc-850" />
                    )}
                  </div>
                </div>

                {/* 2. Female Breakdown */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs font-bold px-1">
                    <span className="text-neutral-200 font-extrabold text-sm">🙋‍♀️ 여성 유저 통계</span>
                    {stats.gender.femaleA + stats.gender.femaleB > 0 ? (
                      <div className="space-x-1.5 font-black">
                        <span className="text-amber-400">{stats.gender.femaleAPercent}%</span>
                        <span className="text-zinc-600">|</span>
                        <span className="text-emerald-400">{stats.gender.femaleBPercent}%</span>
                      </div>
                    ) : (
                      <span className="text-neutral-500 text-xs font-medium">참여한 여성 없음</span>
                    )}
                  </div>

                  <div className="relative flex h-3.5 w-full overflow-hidden rounded-full bg-zinc-800 shadow-inner">
                    {stats.gender.femaleA + stats.gender.femaleB > 0 ? (
                      <>
                        <div style={{ width: `${stats.gender.femaleAPercent}%` }} className="h-full bg-amber-500/80" />
                        <div style={{ width: `${stats.gender.femaleBPercent}%` }} className="h-full bg-emerald-500/80" />
                      </>
                    ) : (
                      <div className="h-full w-full bg-zinc-850" />
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Section 2: Age Groups (Single Mode Users) */}
            <div className="space-y-4">
              <h4 className="text-base font-extrabold text-neutral-200 flex items-center gap-2">
                <BarChart className="h-5 w-5 text-amber-400" /> 연령별 선택 비율 (싱글모드 유저)
              </h4>
              <div className="space-y-3 bg-zinc-900/60 border border-zinc-800 p-4 rounded-2xl">
                {stats.ageGroups.map((group) => (
                  <div key={group.name} className="flex flex-col gap-1.5 text-sm">
                    <div className="flex justify-between items-center px-0.5">
                      <span className="text-neutral-300 font-extrabold text-xs">{group.name}</span>
                      {group.total > 0 ? (
                        <div className="text-[11px] font-black space-x-1.5">
                          <span className="text-amber-400">{group.percentA}%</span>
                          <span className="text-zinc-700">/</span>
                          <span className="text-emerald-400">{group.percentB}%</span>
                        </div>
                      ) : (
                        <span className="text-neutral-600 text-[10px] font-medium">투표 없음</span>
                      )}
                    </div>

                    <div className="relative flex h-2.5 w-full overflow-hidden rounded-full bg-zinc-800 shadow-inner">
                      {group.total > 0 ? (
                        <>
                          <div style={{ width: `${group.percentA}%` }} className="h-full bg-amber-500/75" />
                          <div style={{ width: `${group.percentB}%` }} className="h-full bg-emerald-500/75" />
                        </>
                      ) : (
                        <div className="h-full w-full bg-zinc-850" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Section 3: Multi-Mode User Choice Breakdown */}
            <div className="space-y-4 pt-1">
              <h4 className="text-base font-extrabold text-neutral-200 flex items-center gap-2">
                <Users className="h-5 w-5 text-purple-400" /> 멀티모드 유저 선택 비율
              </h4>
              <div className="space-y-3 bg-zinc-900/60 border border-zinc-800 p-4 rounded-2xl">
                <div className="flex flex-col gap-1.5 text-sm">
                  <div className="flex justify-between items-center px-0.5">
                    <span className="text-neutral-200 font-extrabold text-xs">
                      🎮 멀티모드 유저 ({formatVoteCount(stats.multiTotal)}표)
                    </span>
                    {stats.multiTotal > 0 ? (
                      <div className="text-[11px] font-black space-x-1.5">
                        <span className="text-amber-400">{stats.multiAPercent}%</span>
                        <span className="text-zinc-700">/</span>
                        <span className="text-emerald-400">{stats.multiBPercent}%</span>
                      </div>
                    ) : (
                      <span className="text-neutral-600 text-[10px] font-medium">멀티모드 참여 없음</span>
                    )}
                  </div>

                  <div className="relative flex h-3.5 w-full overflow-hidden rounded-full bg-zinc-800 shadow-inner">
                    {stats.multiTotal > 0 ? (
                      <>
                        <div style={{ width: `${stats.multiAPercent}%` }} className="h-full bg-amber-500/80" />
                        <div style={{ width: `${stats.multiBPercent}%` }} className="h-full bg-emerald-500/80" />
                      </>
                    ) : (
                      <div className="h-full w-full bg-zinc-850" />
                    )}
                  </div>
                </div>
              </div>
            </div>

          </div>
        ) : (
          <div className="text-center py-10 text-neutral-500 font-bold flex-1">통계 데이터를 불러올 수 없습니다.</div>
        )}
      </motion.div>
    </div>
  );
}

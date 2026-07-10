'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { X, Users, PieChart, BarChart } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface StatsBottomSheetProps {
  questionId: string;
  onClose: () => void;
}

interface VoteStats {
  gender: {
    male: number;
    female: number;
    malePercent: number;
    femalePercent: number;
  };
  ageGroups: {
    name: string;
    count: number;
    percent: number;
  }[];
  totalVotes: number;
}

export default function StatsBottomSheet({ questionId, onClose }: StatsBottomSheetProps) {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<VoteStats | null>(null);

  useEffect(() => {
    try {
      // @ts-ignore
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (e) {
      console.error("AdSense trigger failed inside stats bottom sheet: ", e);
    }

    async function fetchStats() {
      try {
        const { data, error } = await supabase
          .from('votes')
          .select('gender, age_group')
          .eq('question_id', questionId);

        if (error) throw error;

        if (!data || data.length === 0) {
          setStats({
            gender: { male: 0, female: 0, malePercent: 50.0, femalePercent: 50.0 },
            ageGroups: [],
            totalVotes: 0
          });
          setLoading(false);
          return;
        }

        const totalVotes = data.length;
        let male = 0;
        let female = 0;
        const ageMap: Record<string, number> = {
          '10대': 0, '20대': 0, '30대': 0, '40대': 0, '50대': 0, '60대': 0, '70대 이상': 0
        };

        data.forEach((row) => {
          if (row.gender === '남성') male++;
          else if (row.gender === '여성') female++;

          if (ageMap[row.age_group] !== undefined) {
            ageMap[row.age_group]++;
          }
        });

        // Compute percentages to 1 decimal place
        const malePercent = totalVotes > 0 ? Number(((male / totalVotes) * 100).toFixed(1)) : 50.0;
        const femalePercent = Number((100 - malePercent).toFixed(1));

        const ageGroups = Object.keys(ageMap).map((key) => ({
          name: key,
          count: ageMap[key],
          percent: totalVotes > 0 ? Number(((ageMap[key] / totalVotes) * 100).toFixed(1)) : 0.0
        }));

        setStats({
          gender: { male, female, malePercent, femalePercent },
          ageGroups,
          totalVotes
        });
      } catch (err) {
        console.error('Error fetching statistics:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, [questionId]);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm">
      {/* Backdrop Click to Close */}
      <div className="absolute inset-0" onClick={onClose} />

      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 220 }}
        className="relative z-10 w-full max-w-md rounded-t-3xl bg-neutral-900/98 border-t border-neutral-800 p-6 text-white shadow-2xl backdrop-blur-xl flex flex-col max-h-[85dvh] overflow-y-auto"
      >
        {/* Header indicator */}
        <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-neutral-700 cursor-pointer" onClick={onClose} />

        <div className="mb-6 flex items-center justify-between">
          <h3 className="text-2xl font-black tracking-tight flex items-center gap-2">
            <Users className="h-6 w-6 text-neutral-400" />
            상세 통계 내용
          </h3>
          <button
            onClick={onClose}
            className="rounded-full bg-neutral-800 p-2 text-neutral-400 hover:bg-neutral-700 hover:text-white transition"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <span className="h-9 w-9 animate-spin rounded-full border-4 border-t-transparent border-neutral-600" />
            <p className="text-sm text-neutral-500 font-semibold">통계 데이터를 불러오는 중...</p>
          </div>
        ) : stats ? (
          <div className="space-y-7">
            {/* Stats Overview */}
            <div className="text-center bg-neutral-850 border border-neutral-800 rounded-2xl py-4 px-6">
              <span className="text-xs text-neutral-400 block mb-0.5 font-bold uppercase tracking-wider">전체 참여자 수</span>
              <span className="text-3xl font-black text-white">{stats.totalVotes.toLocaleString()}</span>
              <span className="text-sm text-neutral-400 font-semibold"> 명 투표 완료</span>
            </div>

            {/* Gender Breakdown */}
            <div className="space-y-3">
              <h4 className="text-base font-extrabold text-neutral-200 flex items-center gap-2">
                <PieChart className="h-5 w-5 text-neutral-400" /> 성별 비율
              </h4>
              
              {/* Header metrics showing both male & female even at 0.0% */}
              <div className="flex justify-between items-center text-sm font-black px-1">
                <span className="text-sky-400">🙋‍♂️ 남성 {stats.gender.malePercent.toFixed(1)}%</span>
                <span className="text-rose-400">🙋‍♀️ 여성 {stats.gender.femalePercent.toFixed(1)}%</span>
              </div>

              {/* Seamless Combined Segmented Progress Bar */}
              <div className="relative flex h-3.5 w-full overflow-hidden rounded-full bg-zinc-800 shadow-inner">
                {stats.gender.malePercent > 0 && (
                  <div
                    style={{ width: `${stats.gender.malePercent}%` }}
                    className="h-full bg-sky-500/80 transition-all duration-500"
                  />
                )}
                {stats.gender.femalePercent > 0 && (
                  <div
                    style={{ width: `${stats.gender.femalePercent}%` }}
                    className="h-full bg-rose-500/80 transition-all duration-500"
                  />
                )}
              </div>
            </div>

            {/* Age Group Breakdown */}
            <div className="space-y-4">
              <h4 className="text-base font-extrabold text-neutral-200 flex items-center gap-2">
                <BarChart className="h-5 w-5 text-neutral-400" /> 연령별 비율
              </h4>
              <div className="space-y-3 bg-neutral-850/40 border border-neutral-850 p-4 rounded-2xl">
                {stats.ageGroups.map((group) => (
                  <div key={group.name} className="flex items-center gap-3 text-sm">
                    <span className="w-16 text-neutral-300 font-extrabold">{group.name}</span>
                    <div className="flex-1 h-2.5 bg-neutral-800 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${group.percent}%` }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                        className="h-full bg-neutral-200 rounded-full"
                      />
                    </div>
                    <span className="w-12 text-right font-black text-neutral-100">{group.percent.toFixed(1)}%</span>
                  </div>
                ))}
              </div>
            </div>

            {/* AdSense Middle Slot */}
            <div className="pt-4 border-t border-neutral-800 flex justify-center">
              <div className="adsense-slot adsense-middle" style={{ minHeight: '250px', width: '100%', margin: '10px 0' }}>
                <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-3522634980237009" crossOrigin="anonymous"></script>
                <ins className="adsbygoogle"
                     style={{ display: 'block' }}
                     data-ad-client="ca-pub-3522634980237009"
                     data-ad-slot="8623308627"
                     data-ad-format="auto"
                     data-full-width-responsive="true"></ins>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-10 text-neutral-500 font-bold">통계 데이터를 불러올 수 없습니다.</div>
        )}
      </motion.div>
    </div>
  );
}

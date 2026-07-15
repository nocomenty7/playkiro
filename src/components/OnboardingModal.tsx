'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';

interface OnboardingModalProps {
  onComplete: (data: { gender: string; age_group: string }) => void;
}

const GENDERS = ['남성', '여성'];
const AGE_GROUPS = ['10대', '20대', '30대', '40대', '50대', '60대 이상'];

export default function OnboardingModal({ onComplete }: OnboardingModalProps) {
  const [selectedGender, setSelectedGender] = useState<string>('');
  const [selectedAge, setSelectedAge] = useState<string>('');

  const handleSubmit = () => {
    if (selectedGender && selectedAge) {
      onComplete({ gender: selectedGender, age_group: selectedAge });
    }
  };

  const isFormValid = selectedGender !== '' && selectedAge !== '';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="w-full max-w-sm overflow-hidden rounded-3xl bg-neutral-900/95 border border-neutral-850 p-6 text-center text-white shadow-2xl backdrop-blur-xl"
      >
        {/* Brand Header */}
        <div className="mb-5 flex flex-col items-center">
          <div className="relative h-11 w-32 mb-2 flex items-center justify-center mx-auto">
            <img
              src="/logo.png?v=2"
              alt="기로 로고"
              className="max-h-full object-contain"
            />
          </div>
          <p className="text-xs text-neutral-400">간단한 프로필 선택 후, 당신의 선택을 보여주세요!</p>
        </div>

        {/* Unified Step 1 Flow */}
        <div className="flex flex-col gap-5 text-left">
          
          {/* Gender Select Section */}
          <div>
            <h3 className="text-sm font-bold text-neutral-300 mb-2">성별</h3>
            <div className="grid grid-cols-2 gap-2.5">
              {GENDERS.map((gender) => {
                const isSelected = selectedGender === gender;
                return (
                  <motion.button
                    key={gender}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSelectedGender(gender)}
                    type="button"
                    className={`flex h-11 items-center justify-center gap-1.5 rounded-xl border text-sm font-bold transition-all ${
                      isSelected
                        ? 'bg-white border-white text-zinc-950 shadow-md'
                        : 'bg-neutral-800/40 border-neutral-750 text-neutral-300 hover:bg-neutral-800'
                    }`}
                  >
                    <span>{gender === '남성' ? '🙋‍♂️' : '🙋‍♀️'}</span>
                    {gender}
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* Age Group Select Section */}
          <div>
            <h3 className="text-sm font-bold text-neutral-300 mb-2">연령대</h3>
            <div className="grid grid-cols-3 gap-2">
              {AGE_GROUPS.map((age) => {
                const isSelected = selectedAge === age;
                return (
                  <motion.button
                    key={age}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSelectedAge(age)}
                    type="button"
                    className={`flex h-10 items-center justify-center rounded-xl border text-xs font-semibold transition-all ${
                      isSelected
                        ? 'bg-white border-white text-zinc-950 shadow-md'
                        : 'bg-neutral-800/40 border-neutral-750 text-neutral-300 hover:bg-neutral-800'
                    }`}
                  >
                    {age}
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* Submit Action */}
          <div className="mt-2 flex flex-col gap-3">
            <motion.button
              whileTap={isFormValid ? { scale: 0.98 } : {}}
              onClick={handleSubmit}
              disabled={!isFormValid}
              type="button"
              className={`w-full py-3.5 rounded-xl text-sm font-extrabold transition-all duration-300 shadow-lg ${
                isFormValid
                  ? 'bg-white hover:bg-neutral-200 text-zinc-950 font-black'
                  : 'bg-zinc-800 border border-zinc-750 text-zinc-500 cursor-not-allowed'
              }`}
            >
              시작하기
            </motion.button>

            <span className="text-[10px] text-zinc-500 text-center tracking-tight leading-relaxed">
              해당 입력정보는 상세 통계 제공을 위해서만 사용됩니다.
            </span>
          </div>

        </div>
      </motion.div>
    </div>
  );
}

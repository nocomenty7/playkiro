'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ChevronDown, Bell, Rocket, TrendingUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ThemeToggle from '@/components/ThemeToggle';

interface NoticeItem {
  id: number;
  title: string;
  date: string;
  icon: React.ReactNode;
  tag: string;
  tagColor: string;
  content: React.ReactNode;
}

export default function NoticePage() {
  const router = useRouter();
  const [openId, setOpenId] = useState<number | null>(3); // Open the latest one by default

  const handleBack = (e: React.MouseEvent) => {
    e.preventDefault();
    if (typeof window !== 'undefined') {
      if (window.history.length > 1) {
        router.back();
      } else {
        router.push('/');
      }
    }
  };

  const notices: NoticeItem[] = [
    {
      id: 3,
      title: "대규모 업데이트: 스트리머 시참 모드 (치지직 & SOOP 채팅 연동) 출시!",
      date: "2026. 08. 30",
      icon: <Rocket className="h-5 w-5 text-purple-400" />,
      tag: "업데이트",
      tagColor: "bg-purple-500/10 text-purple-400 border border-purple-500/20",
      content: (
        <div className="space-y-4">
          <p>안녕하세요, 기로(Playkiro) 팀입니다. 이번 8월 대규모 업데이트를 통해 많은 스트리머 분들이 기다리시던 <strong className="text-white">'채팅 연동 시참 모드'</strong>가 정식 출시되었습니다!</p>
          <p>이제 방송을 진행하시는 스트리머 분들은 별도로 시청자들에게 웹사이트 주소를 알려줄 필요 없이, 본인의 치지직(Chzzk) 채널 ID나 SOOP(구 아프리카TV) 방송 주소만 기로 서버에 연동하면 곧바로 시청자들과 밸런스 게임을 즐기실 수 있습니다.</p>
          <ul className="list-disc list-inside pl-2 space-y-2 text-neutral-300">
            <li><strong>초간편 투표 시스템:</strong> 시청자들은 채팅창에 `!1` 혹은 `!2` 라고 타이핑하는 것만으로 즉각적으로 투표에 참여하게 됩니다. </li>
            <li><strong>투명 OBS 오버레이:</strong> 스트리머를 위해 배경이 투명한 오버레이 화면 모드를 제공합니다. OBS 브라우저 소스로 추가하기만 하면 실시간 득점 게이지가 방송 화면에 매우 깔끔하고 역동적으로 송출됩니다.</li>
            <li><strong>방 만들기 기능 개선:</strong> 채팅 연동 외에도 PIN 코드를 공유하여 모바일로 직관적인 터치 플레이를 즐길 수 있는 방 만들기 모드 역시 서버 최적화를 통해 수천 명이 동시에 접속해도 딜레이 없이 실시간 동기화가 이루어지도록 구조를 개편했습니다.</li>
          </ul>
          <p>시청자들과 함께 극악의 밸런스 게임을 즐기며 소통의 즐거움을 극대화해 보세요. 여러분의 피드백을 반영하여 앞으로 더욱 재미있고 자극적인 질문들을 추가해 나가겠습니다!</p>
        </div>
      )
    },
    {
      id: 2,
      title: "최근 1020 세대에서 가장 논란이 된 밸런스 게임 질문 Top 3",
      date: "2026. 08. 20",
      icon: <TrendingUp className="h-5 w-5 text-emerald-400" />,
      tag: "트렌드",
      tagColor: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
      content: (
        <div className="space-y-4">
          <p>기로(Playkiro)의 익명 투표 통계 데이터를 분석해 본 결과, 최근 한 달간 10대와 20대 유저들 사이에서 가장 치열한 찬반양론이 펼쳐진 밸런스 게임 질문 3가지를 공개합니다.</p>
          
          <div className="bg-zinc-900/50 p-4 rounded-xl border border-zinc-800 space-y-2">
            <strong className="text-emerald-300 block">1위: 평생 양치 안 하기 VS 평생 샤워 안 하기</strong>
            <p className="text-sm">압도적인 화제성을 기록한 이 질문은 성별에 따라 결과가 극명하게 갈렸습니다. 여성 유저의 경우 약 72%가 '평생 양치 안 하기'를 택한 반면, 남성 유저의 경우 60% 이상이 '평생 샤워 안 하기'를 택했습니다. 구취를 숨기느냐, 체취를 숨기느냐의 치열한 논쟁은 커뮤니티에서도 큰 화제가 되었습니다.</p>
          </div>

          <div className="bg-zinc-900/50 p-4 rounded-xl border border-zinc-800 space-y-2">
            <strong className="text-emerald-300 block">2위: 100억 받고 평생 스마트폰 없이 살기 VS 그냥 살기</strong>
            <p className="text-sm">스마트폰 중독이 심한 10대 유저층에서는 의외로 '그냥 살기(스마트폰 포기 불가)'의 비율이 무려 45%에 달했습니다. 반면 30대 이상에서는 80% 이상이 '100억 받기'를 선택하여 연령대별 가치관의 극명한 차이를 보여준 흥미로운 데이터였습니다.</p>
          </div>

          <div className="bg-zinc-900/50 p-4 rounded-xl border border-zinc-800 space-y-2">
            <strong className="text-emerald-300 block">3위: 내가 사랑하는 사람 VS 나를 사랑하는 사람</strong>
            <p className="text-sm">인류 최대의 난제 중 하나인 이 질문은, 시간대별로 픽률이 변하는 독특한 양상을 보였습니다. 밤 10시 이후 감수성이 풍부해지는 새벽 시간대에는 '내가 사랑하는 사람'의 픽률이 15% 이상 증가하는 현상이 포착되었습니다.</p>
          </div>
          
          <p>앞으로도 기로는 유저 여러분의 재미있는 선택 데이터를 바탕으로 흥미로운 통계 트렌드를 지속적으로 발굴하여 공유해 드리겠습니다.</p>
        </div>
      )
    },
    {
      id: 1,
      title: "새로운 밸런스 게임의 기준, 기로(Playkiro) 정식 오픈 안내",
      date: "2026. 07. 12",
      icon: <Bell className="h-5 w-5 text-amber-400" />,
      tag: "공지",
      tagColor: "bg-amber-500/10 text-amber-400 border border-amber-500/20",
      content: (
        <div className="space-y-4">
          <p>현대인들의 숨겨진 심리와 극단적인 취향을 탐구하는 완벽한 밸런스 게임 플랫폼, <strong>'기로(Playkiro)'</strong>가 드디어 정식 오픈했습니다.</p>
          <p>지금까지의 밸런스 게임은 단순히 A와 B 중 하나를 고르고 끝나는 1회성 유흥에 불과했습니다. 하지만 저희 기로 팀은 투표 결과를 사회학적 관점에서 흥미롭게 분석할 수 있도록, 나이대별 및 성별 투표 통계 게이지 바를 도입하여 '다른 사람들은 나와 얼마나 다른 생각을 가지고 있는지' 직관적으로 비교할 수 있는 시각적 경험을 제공합니다.</p>
          <p>기존 서비스들과 차별화되는 기로만의 강점은 완벽한 <strong>익명성 보장</strong>과 <strong>가입 없는 편리함</strong>입니다. 귀찮은 이메일 연동이나 소셜 로그인 과정을 모두 삭제했으며, 투표 내역은 사용자 브라우저의 로컬 스토리지에만 저장되므로 중복 투표를 방지하면서도 개인 식별 정보는 일절 수집하지 않는 철저한 보안 정책을 고수합니다.</p>
          <p>총 500여 개가 넘는 일상, 연애, 음식, 상상, 그리고 극한의 딜레마 카테고리를 넘나들며 여러분의 한계를 시험해 보세요. 기로는 언제나 여러분의 선택을 기다립니다!</p>
        </div>
      )
    }
  ];

  return (
    <div className="min-h-[100dvh] overflow-y-auto bg-[#080911] text-neutral-100 font-sans p-6 md:p-12 max-w-3xl mx-auto flex flex-col justify-between">
      <div className="space-y-8 pb-12">
        <header className="flex items-center justify-between py-4 border-b border-zinc-900/60 sticky top-0 bg-[#080911]/90 backdrop-blur-sm z-10">
          <div className="flex items-center gap-3">
            <button
              onClick={handleBack}
              className="flex items-center justify-center p-2 rounded-xl bg-zinc-900/50 border border-zinc-800 text-neutral-400 hover:text-white transition cursor-pointer"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <h1 className="text-2xl font-extrabold tracking-tight">공지사항</h1>
          </div>
          <ThemeToggle />
        </header>

        <main className="space-y-4">
          {notices.map((notice) => {
            const isOpen = openId === notice.id;
            return (
              <div 
                key={notice.id}
                className={`rounded-2xl border transition-all duration-300 overflow-hidden ${
                  isOpen ? 'border-zinc-700 bg-zinc-900/40' : 'border-zinc-900/60 bg-zinc-900/10 hover:border-zinc-800 hover:bg-zinc-900/30'
                }`}
              >
                {/* Accordion Header */}
                <button
                  onClick={() => setOpenId(isOpen ? null : notice.id)}
                  className="w-full px-6 py-5 flex items-start gap-4 text-left cursor-pointer"
                >
                  <div className="mt-1 shrink-0 bg-zinc-950 p-2 rounded-lg border border-zinc-800 shadow-inner">
                    {notice.icon}
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${notice.tagColor}`}>
                        {notice.tag}
                      </span>
                      <span className="text-xs text-neutral-500 font-medium tracking-wide">
                        {notice.date}
                      </span>
                    </div>
                    <h2 className={`text-base md:text-lg font-bold leading-snug transition-colors ${isOpen ? 'text-white' : 'text-neutral-300'}`}>
                      {notice.title}
                    </h2>
                  </div>
                  <div className="shrink-0 mt-2 text-neutral-500">
                    <motion.div
                      animate={{ rotate: isOpen ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <ChevronDown className="h-5 w-5" />
                    </motion.div>
                  </div>
                </button>

                {/* Accordion Body */}
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                    >
                      <div className="px-6 pb-6 pt-2 text-sm md:text-base text-neutral-400 leading-relaxed font-normal border-t border-zinc-900/50 mx-4 mt-2">
                        {notice.content}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </main>
      </div>

      <footer className="pt-8 pb-4 border-t border-zinc-900/60 text-center text-xs text-neutral-500">
        <p>Copyright © 2026 AuroraNest. All rights reserved.</p>
      </footer>
    </div>
  );
}

'use client';

import React, { useState } from 'react';
import { ChevronDown, Bell, Rocket, Lightbulb } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';

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
  const [showDrawer, setShowDrawer] = useState(false);
  const [openId, setOpenId] = useState<number | null>(4); // Open the latest one by default

  const notices: NoticeItem[] = [
    {
      id: 4,
      title: "신규 기능: '나만의 기발한 밸런스게임 문제 제안하기' 오픈!",
      date: "2026. 09. 20",
      icon: <Lightbulb className="h-5 w-5 text-amber-400" />,
      tag: "업데이트",
      tagColor: "bg-amber-500/10 text-amber-400 border border-amber-500/20",
      content: (
        <div className="space-y-4">
          <p>안녕하세요, 기로(Playkiro) 팀입니다. 플레이어 여러분들의 빛나는 아이디어를 기로에 직접 추가할 수 있는 <strong className="text-white">'문제 제안하기'</strong> 기능이 새롭게 추가되었습니다!</p>
          <p>평소 친구들과 나누던 재미있는 밸런스 게임이나 혼자만 상상해 보았던 기상천외한 질문들이 있다면, 메인 화면 하단 혹은 좌측 상단의 메뉴를 통해 언제든지 제안해 주세요.</p>
          <ul className="list-disc list-inside pl-2 space-y-2 text-neutral-300">
            <li><strong>손쉬운 제안:</strong> 간단한 입력만으로 한 번에 최대 10문제까지 자유롭게 제안하실 수 있습니다.</li>
            <li><strong>기여자 닉네임 표기:</strong> 관리자의 검토를 거쳐 최종 채택된 문제들은 기로 게임 내에 정식으로 등록되며, 문제 카드 최상단에 <strong>'문제제안: 닉네임'</strong>이 명예롭게 새겨집니다.</li>
          </ul>
          <p>여러분의 창의적인 딜레마 문제들로 기로가 더욱 풍성하고 재미있어지기를 기대합니다. 항상 진심으로 감사드립니다!</p>
        </div>
      )
    },
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
          <p>총 800여 개가 넘는 일상, 연애, 음식, 상상, 그리고 극한의 딜레마 카테고리를 넘나들며 여러분의 한계를 시험해 보세요. 기로는 언제나 여러분의 선택을 기다립니다!</p>
        </div>
      )
    }
  ];

  return (
    <div className="flex h-[100dvh] w-full flex-col overflow-y-auto overflow-x-hidden bg-[#080911] text-white selection:bg-amber-500/30 selection:text-amber-200">
      
      <div className="shrink-0">
        <Navigation
          selectedCategories={['전체']}
          onToggleCategory={() => {}}
          showDrawer={showDrawer}
          setShowDrawer={setShowDrawer}
        />
      </div>

      <main className="flex-1 w-full max-w-3xl mx-auto px-6 py-10 flex flex-col">
        <div className="mb-10 text-center">
          <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white mb-2">공지사항</h1>
          <p className="text-sm text-neutral-400">기로(Playkiro)의 새로운 소식과 업데이트 내역을 전해드립니다.</p>
        </div>

        <div className="space-y-4">
          {notices.map((notice) => {
            const isOpen = openId === notice.id;
            return (
              <div 
                key={notice.id}
                className={`rounded-2xl border transition-all duration-300 overflow-hidden ${
                  isOpen ? 'border-zinc-700 bg-zinc-900/40' : 'border-zinc-800/80 bg-zinc-900/40 hover:border-zinc-700 hover:bg-zinc-800/50 shadow-sm'
                }`}
              >
                {/* Accordion Header */}
                <button
                  onClick={() => setOpenId(isOpen ? null : notice.id)}
                  className="w-full px-6 py-5 flex items-start gap-4 text-left cursor-pointer transition-colors"
                >
                  <div className="mt-1 shrink-0 bg-black/40 p-2 rounded-xl border border-zinc-800/80 shadow-sm">
                    {notice.icon}
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md ${notice.tagColor}`}>
                        {notice.tag}
                      </span>
                      <span className="text-xs text-neutral-500 font-bold tracking-wide">
                        {notice.date}
                      </span>
                    </div>
                    <h2 className={`text-sm md:text-base font-extrabold leading-snug transition-colors ${isOpen ? 'text-white' : 'text-neutral-300'}`}>
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
                      <div className="px-6 pb-6 pt-2 text-[13px] md:text-sm text-neutral-400 leading-relaxed font-normal border-t border-zinc-800/50 mx-4 mt-2 break-keep">
                        {notice.content}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </main>

      <div className="shrink-0 mt-auto">
        <Footer />
      </div>
      
    </div>
  );
}

import React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-neutral-100 font-sans p-6 md:p-12 max-w-2xl mx-auto flex flex-col justify-between">
      <div className="space-y-6">
        <header className="flex items-center gap-3 py-4 border-b border-zinc-900">
          <Link
            href="/"
            className="flex items-center justify-center p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-neutral-400 hover:text-white transition"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-xl font-extrabold tracking-tight">이용약관</h1>
        </header>

        <main className="space-y-6 text-sm text-neutral-400 leading-relaxed font-normal">
          <section className="space-y-2">
            <h2 className="text-base font-bold text-neutral-200">1. 약관의 목적</h2>
            <p>
              본 약관은 BALS('모두의 밸런스게임') 서비스가 제공하는 밸런스 게임 투표 및 통계 서비스(이하 '서비스')의 이용 조건 및 절차에 관한 기본적인 사항을 규정함을 목적으로 합니다.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-neutral-200">2. 서비스의 이용</h2>
            <ul className="list-decimal list-inside pl-2 space-y-1">
              <li>사용자는 성별 및 연령대 선택 후 자유롭게 밸런스 게임 투표에 참여할 수 있습니다.</li>
              <li>모든 서비스는 무료로 제공되며, 사용자는 언제든지 이용을 중단할 수 있습니다.</li>
              <li>투표 참여 시 전송된 통계 데이터는 서버에 무기명으로 저장되며, 서비스 고도화 및 콘텐츠 보완에 사용됩니다.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-neutral-200">3. 책임의 제한</h2>
            <ul className="list-decimal list-inside pl-2 space-y-1">
              <li>BALS 서비스는 사용자가 게재한 콘텐츠 또는 투표 내용의 타당성이나 신뢰성에 대해 책임을 지지 않습니다.</li>
              <li>서버 점검, 통신 장애 등 불가항력적인 사유로 인해 서비스가 일시 중단될 수 있으며, 이로 인한 직접적/간접적 손해에 대해 책임을 지지 않습니다.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-neutral-200">4. 이용약관의 개정</h2>
            <p>
              본 약관은 운영상 필요한 경우 개정될 수 있으며, 개정 시 서비스 화면 하단 링크를 통해 상시 열람할 수 있도록 게시됩니다.
            </p>
          </section>
        </main>
      </div>

      <footer className="text-center text-xs text-zinc-600 pt-10 mt-10 border-t border-zinc-900/60">
        &copy; {new Date().getFullYear()} BALS. All rights reserved.
      </footer>
    </div>
  );
}

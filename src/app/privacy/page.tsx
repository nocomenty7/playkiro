import React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import ThemeToggle from '@/components/ThemeToggle';

export default function PrivacyPage() {
  return (
    <div className="h-[100dvh] overflow-y-auto bg-zinc-950 text-neutral-100 font-sans p-6 md:p-12 max-w-2xl mx-auto flex flex-col justify-between">
      <div className="space-y-6">
        <header className="flex items-center justify-between py-4 border-b border-zinc-900">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="flex items-center justify-center p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-neutral-400 hover:text-white transition"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <h1 className="text-xl font-extrabold tracking-tight">개인정보처리방침</h1>
          </div>
          <ThemeToggle />
        </header>

        <main className="space-y-6 text-sm text-neutral-400 leading-relaxed font-normal">
          <section className="space-y-2">
            <h2 className="text-base font-bold text-neutral-200">1. 개인정보의 수집 항목 및 목적</h2>
            <p>
              기로 서비스는 별도의 회원가입 과정 없이 서비스를 제공합니다. 다만, 투표의 성별/연령대별 상세 통계를 집계하고 제공하기 위해 사용자의 브라우저 내 로컬 스토리지(localStorage)를 통해 아래의 정보를 저장 및 사용합니다.
            </p>
            <ul className="list-disc list-inside pl-2 space-y-1">
              <li>수집 항목: 성별, 연령대</li>
              <li>수집 목적: 밸런스 게임 투표 결과의 세부 통계 제공</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-neutral-200">2. 개인정보의 보유 및 이용기간</h2>
            <p>
              서비스 이용 시 입력한 성별 및 연령대 정보는 사용자의 개인 단말기 브라우저(localStorage)에만 안전하게 저장되며, 투표 시에 전송되는 데이터는 통계 처리 목적으로 수집 후 즉시 비식별화 처리되어 서버에 영구 보관됩니다. 어떠한 개인 식별 정보(이름, 이메일, IP 주소 등)도 저장하거나 매칭하지 않습니다.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-neutral-200">3. 개인정보 안전성 확보 조치</h2>
            <p>
              기로 서비스는 개인정보보호법에 따라 사용자의 익명 정보를 안전하게 보호하고 있으며, 무단 접근 및 훼손을 방지하기 위해 보안 대책을 적용하고 있습니다.
            </p>
          </section>
        </main>
      </div>

      <footer className="pt-8 border-t border-zinc-900 text-center text-xs text-neutral-500">
        <p>© 2026 기로. All rights reserved.</p>
      </footer>
    </div>
  );
}

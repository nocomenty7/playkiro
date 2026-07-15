import React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function PrivacyPage() {
  return (
    <div className="h-[100dvh] overflow-y-auto bg-zinc-950 text-neutral-100 font-sans p-6 md:p-12 max-w-2xl mx-auto flex flex-col justify-between">
      <div className="space-y-6">
        <header className="flex items-center gap-3 py-4 border-b border-zinc-900">
          <Link
            href="/"
            className="flex items-center justify-center p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-neutral-400 hover:text-white transition"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-xl font-extrabold tracking-tight">개인정보처리방침</h1>
        </header>

        <main className="space-y-6 text-sm text-neutral-400 leading-relaxed font-normal">
          <section className="space-y-2">
            <h2 className="text-base font-bold text-neutral-200">1. 개인정보의 수집 항목 및 목적</h2>
            <p>
              기로('모두의 밸런스게임') 서비스는 별도의 회원가입 과정 없이 서비스를 제공합니다. 다만, 투표의 성별/연령대별 상세 통계를 집계하고 제공하기 위해 사용자의 브라우저 내 로컬 스토리지(localStorage)를 통해 아래의 정보를 저장 및 사용합니다.
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
            <h2 className="text-base font-bold text-neutral-200">3. 제3자 제공 및 광고</h2>
            <p>
              기로 서비스는 수익 모델 제공을 위해 구글 애드센스(Google AdSense)를 통한 광고를 노출합니다. 구글은 사용자의 관심사에 맞는 광고를 게재하기 위해 쿠키(Cookie)를 사용하여 사용자의 웹사이트 방문 정보를 수집할 수 있습니다.
            </p>
            <p>
              사용자는 브라우저 설정을 통해 쿠키 수집을 거부할 수 있으며, 이와 관련한 자세한 정보는 구글의 개인정보보호 정책 페이지를 통해 확인하실 수 있습니다.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-neutral-200">4. 개인정보 보호책임자</h2>
            <p>
              서비스 이용 중 문의사항이 있으시면 아래 연락처로 문의해 주시기 바랍니다.
            </p>
            <ul className="list-inside pl-2 space-y-1">
              <li>이메일: support@playkiro.kr</li>
            </ul>
          </section>
        </main>
      </div>

      {/* Global Trust Footer */}
      <footer className="w-full py-6 shrink-0 border-t border-zinc-900/40 text-center flex flex-col items-center gap-2.5 mt-10">
        <div className="flex items-center gap-3 text-xs text-neutral-500 font-extrabold">
          <Link href="/privacy" className="hover:text-neutral-300 transition-all">개인정보처리방침</Link>
          <span className="text-zinc-800">|</span>
          <Link href="/terms" className="hover:text-neutral-300 transition-all">이용약관</Link>
          <span className="text-zinc-800">|</span>
          <a href="mailto:nocomenty7@gmail.com" className="hover:text-neutral-300 transition-all">문의하기</a>
        </div>
        <p className="text-[10px] text-neutral-600">© 2026 기로. All rights reserved.</p>
      </footer>
    </div>
  );
}

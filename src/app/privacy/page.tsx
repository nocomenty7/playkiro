'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import ThemeToggle from '@/components/ThemeToggle';

export default function PrivacyPage() {
  const router = useRouter();

  const handleBack = (e: React.MouseEvent) => {
    e.preventDefault();
    if (typeof window !== 'undefined') {
      // 이전 히스토리가 존재하는 경우 뒤로 가기 실행
      if (window.history.length > 1) {
        router.back();
      } else {
        // 새 탭으로 열려 히스토리가 없는 경우 창 닫기 시도, 실패 시 메인 페이지 이동
        try {
          window.close();
          setTimeout(() => {
            router.push('/');
          }, 100);
        } catch (err) {
          router.push('/');
        }
      }
    }
  };

  return (
    <div className="h-[100dvh] overflow-y-auto bg-zinc-950 text-neutral-100 font-sans p-6 md:p-12 max-w-2xl mx-auto flex flex-col justify-between">
      <div className="space-y-6">
        <header className="flex items-center justify-between py-4 border-b border-zinc-900">
          <div className="flex items-center gap-3">
            <button
              onClick={handleBack}
              className="flex items-center justify-center p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-neutral-400 hover:text-white transition cursor-pointer"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <h1 className="text-xl font-extrabold tracking-tight">개인정보처리방침</h1>
          </div>
          <ThemeToggle />
        </header>

        <main className="space-y-6 text-sm text-neutral-400 leading-relaxed font-normal">
          <section className="space-y-2">
            <h2 className="text-base font-bold text-neutral-200">제1조 (개인정보의 수집 항목 및 목적)</h2>
            <p>기로(Playkiro) 서비스는 별도의 회원가입이나 로그인 절차 없이 모든 서비스를 익명으로 제공하고 있습니다. 그러나 통계의 정확성과 밸런스 게임의 재미를 극대화하기 위하여 다음과 같은 최소한의 비식별화된 데이터를 수집 및 활용합니다.</p>
            <ul className="list-disc list-inside pl-2 space-y-1">
              <li>수집 항목: 사용자가 자발적으로 선택한 성별(남성/여성), 연령대(10대~50대 이상)</li>
              <li>수집 목적: 각 밸런스 게임 질문에 대한 성별 및 연령대별 세부 통계 산출 및 시각화 그래프 제공</li>
              <li>자동 수집 항목: 투표 기록(중복 투표 방지를 위해 브라우저 로컬 스토리지에만 저장됨)</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-neutral-200">제2조 (개인정보의 보유 및 이용기간)</h2>
            <p>서비스 이용 시 입력한 성별 및 연령대 정보는 투표 시에 전송되는 즉시 통계 처리를 위해 수집되며, 수집된 데이터는 어떠한 특정 개인을 알아볼 수 없도록 철저히 비식별화(익명화) 처리되어 서버의 통계 데이터베이스에 영구 보관됩니다. 기로 서비스는 어떠한 경우에도 이름, 전화번호, 이메일 주소, 기기 고유 식별자(MAC 주소 등), 정확한 위치 정보, 혹은 IP 주소와 같은 민감한 개인 식별 정보를 저장하거나 매칭하지 않습니다.</p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-neutral-200">제3조 (개인정보의 제3자 제공 및 위탁)</h2>
            <p>기로 서비스는 원칙적으로 사용자의 개인정보를 외부에 제공하지 않습니다. 다만, 아래의 경우에는 예외로 합니다.</p>
            <ul className="list-disc list-inside pl-2 space-y-1">
              <li>사용자가 사전에 동의한 경우</li>
              <li>법령의 규정에 의거하거나, 수사 목적으로 법령에 정해진 절차와 방법에 따라 수사기관의 요구가 있는 경우</li>
              <li>통계 작성, 학술 연구 또는 시장 조사를 위하여 필요한 경우로서 특정 개인을 알아볼 수 없는 형태로 가공하여 제공하는 경우</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-neutral-200">제4조 (사용자의 권리와 그 행사방법)</h2>
            <p>사용자는 언제든지 자신의 브라우저 설정 혹은 기기 설정을 통해 로컬 스토리지(Local Storage) 및 쿠키(Cookie) 데이터를 삭제함으로써 본 서비스의 투표 기록을 초기화할 수 있습니다. 단, 이미 서버로 전송되어 비식별화 통계 처리가 완료된 데이터는 특정 개인의 데이터만을 분리하여 삭제하거나 수정하는 것이 기술적으로 불가능하므로 열람 및 정정 요구 대상에서 제외됩니다.</p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-neutral-200">제5조 (개인정보의 파기 절차 및 방법)</h2>
            <p>기로 서비스는 원칙적으로 개인정보 수집 및 이용 목적이 달성된 후에는 해당 정보를 지체 없이 파기합니다. 파기 절차 및 방법은 다음과 같습니다. 사용자가 입력한 비식별 정보는 통계 산출을 위해 DB에 저장된 후에는 개별 데이터로서의 식별 가치를 상실하므로 별도의 파기 절차 없이 통계 데이터의 일부로만 존재하게 됩니다. 브라우저에 저장된 로컬 스토리지 데이터는 브라우저 캐시 삭제 시 즉시 영구 파기됩니다.</p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-neutral-200">제6조 (개인정보 안전성 확보 조치)</h2>
            <p>기로 서비스는 사용자들의 익명 정보를 안전하게 보호하고, 해킹이나 컴퓨터 바이러스 등에 의한 무단 접근 및 훼손을 방지하기 위해 최선의 노력을 다하고 있습니다. 데이터 전송 시 SSL(Secure Sockets Layer) 프로토콜을 통한 암호화 통신을 적용하고 있으며, 데이터베이스에 대한 접근 권한을 최소화하여 인가받지 않은 자의 접근을 엄격히 통제하고 있습니다.</p>
          </section>
        </main>
      </div>

      <footer className="pt-8 border-t border-zinc-900 text-center text-xs text-neutral-500">
        <p>Copyright © 2026 AuroraNest. All rights reserved.</p>
      </footer>
    </div>
  );
}

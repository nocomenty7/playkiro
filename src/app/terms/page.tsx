'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import ThemeToggle from '@/components/ThemeToggle';

export default function TermsPage() {
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
            <h1 className="text-xl font-extrabold tracking-tight">이용약관</h1>
          </div>
          <ThemeToggle />
        </header>

        <main className="space-y-6 text-sm text-neutral-400 leading-relaxed font-normal">
          <section className="space-y-2">
            <h2 className="text-base font-bold text-neutral-200">제1조 (목적)</h2>
            <p>본 약관은 AuroraNest(이하 '회사'라 합니다)가 제공하는 기로(Playkiro) 밸런스 게임 및 관련 제반 서비스(이하 '서비스'라 합니다)의 이용과 관련하여 회사와 사용자 간의 권리, 의무, 책임사항 및 기타 필요한 사항을 규정함을 목적으로 합니다. 사용자는 본 서비스를 이용함으로써 본 약관에 동의하는 것으로 간주됩니다.</p>
          </section>
          
          <section className="space-y-2">
            <h2 className="text-base font-bold text-neutral-200">제2조 (용어의 정의)</h2>
            <p>본 약관에서 사용하는 용어의 정의는 다음과 같습니다.</p>
            <ul className="list-decimal list-inside pl-2 space-y-1">
              <li>"서비스"라 함은 구현되는 단말기(PC, TV, 휴대형단말기 등의 각종 유무선 장치를 포함)와 상관없이 "사용자"가 이용할 수 있는 기로 및 관련 제반 서비스를 의미합니다.</li>
              <li>"사용자"라 함은 회사의 "서비스"에 접속하여 본 약관에 따라 회사가 제공하는 "서비스"를 이용하는 자를 말합니다.</li>
              <li>"게시물"이라 함은 "사용자"가 "서비스"를 이용함에 있어 "서비스상"에 게시한 부호ㆍ문자ㆍ음성ㆍ음향ㆍ화상ㆍ동영상 등의 정보 형태의 글, 사진, 동영상 및 각종 파일과 링크 등을 의미합니다.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-neutral-200">제3조 (약관의 게시와 개정)</h2>
            <p>회사는 본 약관의 내용을 사용자가 쉽게 알 수 있도록 서비스 초기 화면에 게시합니다. 회사는 "약관의 규제에 관한 법률", "정보통신망 이용촉진 및 정보보호 등에 관한 법률" 등 관련 법령을 위배하지 않는 범위에서 본 약관을 개정할 수 있습니다. 회사가 약관을 개정할 경우에는 적용일자 및 개정사유를 명시하여 현행 약관과 함께 제1항의 방식에 따라 그 개정약관의 적용일자 7일 전부터 적용일자 전일까지 공지합니다. 단, 사용자에게 불리하게 약관내용을 변경하는 경우에는 최소한 30일 이상의 사전 유예기간을 두고 공지합니다.</p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-neutral-200">제4조 (서비스의 제공 및 변경)</h2>
            <p>회사는 사용자에게 밸런스 게임 투표 및 통계 확인 서비스, 스트리머 시참 모드 제공 서비스, 기타 회사가 추가 개발하거나 다른 회사와의 제휴계약 등을 통해 사용자에게 제공하는 일체의 서비스를 제공합니다. 회사는 서비스의 내용, 이용방법, 이용시간에 대하여 변경이 있는 경우 변경사유, 변경될 서비스의 내용 및 제공일자 등을 서비스 초기화면에 게시합니다.</p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-neutral-200">제5조 (서비스의 중단)</h2>
            <p>회사는 컴퓨터 등 정보통신설비의 보수점검, 교체 및 고장, 통신두절 또는 운영상 상당한 이유가 있는 경우 서비스의 제공을 일시적으로 중단할 수 있습니다. 이 경우 회사는 사전에 통지하나, 부득이한 사유가 있는 경우 사후에 통지할 수 있습니다. 회사는 서비스의 제공이 일시적으로 중단됨으로 인하여 사용자 또는 제3자가 입은 손해에 대하여 배상하지 않습니다.</p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-neutral-200">제6조 (사용자의 의무)</h2>
            <p>사용자는 다음 행위를 하여서는 안 됩니다.</p>
            <ul className="list-decimal list-inside pl-2 space-y-1">
              <li>신청 또는 변경 시 허위내용의 등록 또는 타인의 정보도용</li>
              <li>회사가 정한 정보 이외의 정보(컴퓨터 프로그램 등) 등의 송신 또는 게시</li>
              <li>회사와 기타 제3자의 저작권 등 지적재산권에 대한 침해</li>
              <li>외설 또는 폭력적인 메시지, 화상, 음성, 기타 공서양속에 반하는 정보를 서비스에 공개 또는 게시하는 행위</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-neutral-200">제7조 (면책 및 책임제한)</h2>
            <p>회사는 천재지변 또는 이에 준하는 불가항력으로 인하여 서비스를 제공할 수 없는 경우에는 서비스 제공에 관한 책임이 면제됩니다. 회사는 사용자의 귀책사유로 인한 서비스 이용의 장애에 대하여는 책임을 지지 않습니다. 회사는 사용자가 서비스와 관련하여 게재한 정보, 자료, 사실의 신뢰도, 정확성 등의 내용에 관하여는 책임을 지지 않습니다.</p>
          </section>
        </main>
      </div>

      <footer className="pt-8 border-t border-zinc-900 text-center text-xs text-neutral-500">
        <p>Copyright © 2026 AuroraNest. All rights reserved.</p>
      </footer>
    </div>
  );
}

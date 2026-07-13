import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";

export const metadata: Metadata = {
  title: "UPick (유픽) - 세상의 모든 극한 밸런스게임과 취향 분석 테스트",
  description: "로그인이나 회원가입 없이 0초 만에 즐기는 초간단 밸런스게임! 연애, 음식, 일상, 스타일, 상상력 등 8가지 카테고리의 200개가 넘는 극한 딜레마를 선택하고 성별·연령대별 실시간 통계 분석 결과로 당신의 진짜 취향을 테스트해 보세요.",
  icons: {
    icon: "/favicon.ico",
  },
  openGraph: {
    title: "UPick (유픽) - 세상의 모든 극한 밸런스게임과 취향 분석 테스트",
    description: "회원가입 없이 0초 만에 시작하는 익명 밸런스게임! 200개 이상의 딜레마를 풀고 실시간 취향 분석 통계를 확인해보세요.",
    url: "https://upick.kr",
    siteName: "UPick",
    images: [
      {
        url: "https://upick.kr/og-image.png",
        width: 1200,
        height: 630,
        alt: "UPick 밸런스 게임 대표 이미지",
      },
    ],
    locale: "ko_KR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "UPick (유픽) - 세상의 모든 극한 밸런스게임과 취향 분석 테스트",
    description: "회원가입 없이 0초 만에 시작하는 익명 밸런스게임! 200개 이상의 딜레마를 풀고 실시간 취향 분석 통계를 확인해보세요.",
    images: ["https://upick.kr/og-image.png"],
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="h-full antialiased dark">
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link
          rel="stylesheet"
          as="style"
          crossOrigin="anonymous"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.css"
        />
        {/* Google AdSense Verification Script */}
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-3522634980237009"
          crossOrigin="anonymous"
        />
      </head>
      <body className="min-h-full bg-[#080911] text-white antialiased">
        {/* Google Analytics (GA4) Script */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-1EQTDJBSD4"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-1EQTDJBSD4');
          `}
        </Script>
        {children}
      </body>
    </html>
  );
}

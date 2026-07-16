import type { Metadata } from "next";
import Script from "next/script";
import GoogleAnalyticsTracker from "@/components/GoogleAnalyticsTracker";
import "./globals.css";

export const metadata: Metadata = {
  title: "기로 - 세상의 모든 극한 밸런스게임과 취향 분석 테스트",
  description: "실시간 밸런스게임 '기로'! 로그인 없이 극한 딜레마에 투표하고 성별/연령대별 취향 통계 분석 결과를 0초 만에 확인해 보세요.",
  icons: {
    icon: "/favicon.ico",
  },
  openGraph: {
    title: "기로 - 세상의 모든 극한 밸런스게임과 취향 분석 테스트",
    description: "실시간 밸런스게임 '기로'! 로그인 없이 극한 딜레마에 투표하고 성별/연령대별 취향 통계 분석 결과를 0초 만에 확인해 보세요.",
    url: "https://playkiro.kr",
    siteName: "기로",
    images: [
      {
        url: "https://playkiro.kr/og-image.png",
        width: 1200,
        height: 630,
        alt: "기로 밸런스 게임 대표 이미지",
      },
    ],
    locale: "ko_KR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "기로 - 세상의 모든 극한 밸런스게임과 취향 분석 테스트",
    description: "실시간 밸런스게임 '기로'! 로그인 없이 극한 딜레마에 투표하고 성별/연령대별 취향 통계 분석 결과를 0초 만에 확인해 보세요.",
    images: ["https://playkiro.kr/og-image.png"],
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
        <meta name="naver-site-verification" content="a516970077ee8075eaafa123a7d19ac9b2d94672" />
        
        {/* Favicon configuration optimized for Google Search Crawler (multiples of 48px) */}
        <link rel="shortcut icon" href="/favicon.ico" />
        <link rel="icon" href="/favicon-48x48.png" sizes="48x48" type="image/png" />
        <link rel="icon" href="/favicon-192x192.png" sizes="192x192" type="image/png" />
        <link rel="apple-touch-icon" href="/favicon-180x180.png" />
        <meta name="theme-color" content="#ffffff" />

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
        {/* Kakao JavaScript SDK */}
        <script
          src="https://t1.kakaocdn.net/kakao_js_sdk/2.8.1/kakao.min.js"
          integrity="sha384-OL+ylM/iuPLtW5U3XcvLSGhE8JzReKDank5InqlHGWPhb4140/yrBw0bg0y7+C9J"
          crossOrigin="anonymous"
          async
        />
      </head>
      <body className="min-h-full bg-[#080911] text-white antialiased">
        {/* Google Analytics (GA4) Script */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-PKN41V9Q68"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-PKN41V9Q68', { send_page_view: false });
          `}
        </Script>
        <GoogleAnalyticsTracker gaId="G-PKN41V9Q68" />
        {children}
      </body>
    </html>
  );
}

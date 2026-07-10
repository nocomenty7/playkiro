import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BALS - 모두의 밸런스게임",
  description: "무지연으로 즐기는 애플 감성 미니멀 밸런스 게임, BALS!",
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
        <link
          rel="stylesheet"
          as="style"
          crossOrigin="anonymous"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.css"
        />
      </head>
      <body className="min-h-full bg-zinc-950 text-white antialiased">
        {children}
      </body>
    </html>
  );
}

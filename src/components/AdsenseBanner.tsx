'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

export default function AdsenseBanner() {
  const pathname = usePathname();
  const isLoadedRef = useRef<boolean>(false);

  useEffect(() => {
    // Next.js SPA 라우팅 시 광고가 새롭게 마운트될 때마다 push()를 호출하여 렌더링을 갱신합니다.
    try {
      if (typeof window !== 'undefined' && !isLoadedRef.current) {
        const adsbygoogle = (window as any).adsbygoogle || [];
        adsbygoogle.push({});
        isLoadedRef.current = true;
      }
    } catch (error) {
      console.warn('AdSense Error:', error);
    }
    
    return () => {
      // 컴포넌트 언마운트 시 초기화 (SPA 라우팅 대비)
      isLoadedRef.current = false;
    };
  }, [pathname]);

  return (
    <div className="w-full flex justify-center py-2 bg-transparent">
      {/* 
        최대 높이를 90px로 고정하고 overflow-hidden을 걸어
        애드센스가 모바일에서 제멋대로 280px짜리 거대 배너를 띄우지 못하도록 완벽 차단합니다.
      */}
      <div className="h-[90px] w-full max-w-[1200px] flex items-center justify-center overflow-hidden">
        <ins
          className="adsbygoogle"
          style={{ display: 'inline-block', width: '100%', height: '90px' }}
          data-ad-client="ca-pub-3522634980237009"
          data-ad-slot="8250690336"
        />
      </div>
    </div>
  );
}

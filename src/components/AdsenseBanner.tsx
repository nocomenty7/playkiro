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
    <div className="w-full flex justify-center py-4 bg-transparent overflow-hidden">
      {/* 
        최소 높이를 설정하지 않으면 구글 애드센스가 공간을 잡기 전까지
        레이아웃이 덜컥거리는(Layout Shift) 현상이 발생합니다. (기본 높이 90px 보장)
      */}
      <div className="min-h-[90px] w-full max-w-[1200px]">
        <ins
          className="adsbygoogle"
          style={{ display: 'block', textAlign: 'center', width: '100%' }}
          data-ad-client="ca-pub-3522634980237009"
          data-ad-slot="8250690336"
          data-ad-format="horizontal"
          data-full-width-responsive="true"
        />
      </div>
    </div>
  );
}

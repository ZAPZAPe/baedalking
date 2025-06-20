"use client";

import { useEffect, useRef, useState } from 'react';

interface KakaoAdGlobalProps {
  page: 'home' | 'ranking' | 'records' | 'upload' | 'store' | 'settings' | 'login' | 'attendance' | 'signup';
  index?: number;
}

const adConfig = {
  home: ['DAN-hoOuYkLu161z0omL', 'DAN-xsiNefKQFaudq5Uw', 'DAN-zx1BnJ7EWOQQoLWs'],
  ranking: ['DAN-f1yXlqwkDAofm50d'],
  records: ['DAN-oFrCjKBzmzkfB5Ap'],
  upload: ['DAN-kG6WELVLxrxJnhok'],
  store: ['DAN-2xqwYC5I70HpwRF1'],
  settings: ['DAN-AwGbVWdiKhAWrCVX', 'DAN-35Y5SGyWPnxCg3bl'],
  login: ['DAN-sMpnrnTCEfjs8dMd'],
  attendance: ['DAN-H23jVB9324Ae01jE'],
  signup: ['DAN-sMpnrnTCEfjs8dMd']
};

// 전역 스크립트 로드 상태 관리
let scriptLoaded = false;

// 전역 스크립트 로드 함수
const loadKakaoAdScript = () => {
  if (scriptLoaded || typeof window === 'undefined') return;
  
  const existingScript = document.querySelector('script[src*="kas/static/ba.min.js"]');
  if (existingScript) {
    scriptLoaded = true;
    return;
  }

  const script = document.createElement('script');
  script.async = true;
  script.type = 'text/javascript';
  script.src = '//t1.daumcdn.net/kas/static/ba.min.js';
  script.onload = () => {
    scriptLoaded = true;
  };
  document.head.appendChild(script);
};

export default function KakaoAdGlobal({ page, index = 0 }: KakaoAdGlobalProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isClient, setIsClient] = useState(false);
  const adUnit = adConfig[page]?.[index] || adConfig[page]?.[0];

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient || !containerRef.current || !adUnit) return;

    // 광고 스크립트 로드
    loadKakaoAdScript();
  }, [isClient, adUnit]);

  if (!isClient || !adUnit) {
    return <div className="w-full h-[100px]" />;
  }

  return (
    <div className="w-full flex justify-center">
      <div 
        ref={containerRef}
        className="w-[320px] h-[100px] bg-white/5 backdrop-blur-sm rounded-lg overflow-hidden"
      >
        <ins
          className="kakao_ad_area"
          style={{ display: 'none' }}
          data-ad-unit={adUnit}
          data-ad-width="320"
          data-ad-height="100"
        />
      </div>
    </div>
  );
} 
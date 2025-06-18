"use client";

import { useEffect, useRef } from 'react';

interface KakaoAdGlobalProps {
  page: 'home' | 'ranking' | 'records' | 'upload' | 'store' | 'settings' | 'login' | 'attendance' | 'signup';
  index?: number;
}

const adConfig = {
  home: ['DAN-hoOuYkLu161z0omL', 'DAN-xsiNefKQFaudq5Uw', 'DAN-LXiLUwIQALgY5wZI'],
  ranking: ['DAN-f1yXlqwkDAofm50d'],
  records: ['DAN-oFrCjKBzmzkfB5Ap'],
  upload: ['DAN-kG6WELVLxrxJnhok'],
  store: ['DAN-2xqwYC5I70HpwRF1'],
  settings: ['DAN-AwGbVWdiKhAWrCVX', 'DAN-35Y5SGyWPnxCg3bl'],
  login: ['DAN-sMpnrnTCEfjs8dMd'],
  attendance: ['DAN-H23jVB9324Ae01jE'],
  signup: ['DAN-sMpnrnTCEfjs8dMd']
};

// 전역 스크립트 로드 함수
const loadKakaoAdScript = () => {
  if (typeof window !== 'undefined' && !document.querySelector('script[src*="kas/static/ba.min.js"]')) {
    const script = document.createElement('script');
    script.async = true;
    script.type = 'text/javascript';
    script.src = '//t1.daumcdn.net/kas/static/ba.min.js';
    document.head.appendChild(script);
  }
};

export default function KakaoAdGlobal({ page, index = 0 }: KakaoAdGlobalProps) {
  const adRef = useRef<HTMLDivElement>(null);
  const adUnit = adConfig[page][index] || adConfig[page][0];

  useEffect(() => {
    if (typeof window !== 'undefined' && adRef.current && adUnit) {
      // 기존 광고 제거
      adRef.current.innerHTML = '';
      
      // 광고 컨테이너 생성
      const ins = document.createElement('ins');
      ins.className = 'kakao_ad_area';
      ins.style.display = 'none';
      ins.setAttribute('data-ad-unit', adUnit);
      ins.setAttribute('data-ad-width', '320');
      ins.setAttribute('data-ad-height', '100');
      
      adRef.current.appendChild(ins);
      
      // 스크립트 로드
      loadKakaoAdScript();
    }
  }, [adUnit]);

  return (
    <div className="w-full flex justify-center py-2">
      <div 
        ref={adRef}
        className="w-[320px] h-[100px] bg-white/5 backdrop-blur-sm rounded-lg flex items-center justify-center text-gray-400 text-sm overflow-hidden"
      >
        광고 로딩 중...
      </div>
    </div>
  );
} 
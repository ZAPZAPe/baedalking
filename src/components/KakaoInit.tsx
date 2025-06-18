'use client';

import { useEffect } from 'react';

export default function KakaoInit() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const script = document.createElement('script');
    script.src = 'https://t1.daumcdn.net/kakao_js_sdk/2.5.0/kakao.min.js';
    script.async = true;
    
    const initKakao = () => {
      if (window.Kakao && !window.Kakao.isInitialized()) {
        window.Kakao.init(process.env.NEXT_PUBLIC_KAKAO_JS_KEY);
        console.log('Kakao SDK initialized');
      }
    };
    
    script.onload = initKakao;
    document.body.appendChild(script);

    // 이미 로드된 경우
    if (window.Kakao) {
      initKakao();
    }

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  return null;
} 
'use client';

import { useEffect } from 'react';

// 전역 변수로 초기화 상태 관리
let kakaoInitialized = false;

export default function KakaoInit() {
  useEffect(() => {
    if (typeof window === 'undefined' || kakaoInitialized) return;
    
    const initKakao = () => {
      if (window.Kakao && !window.Kakao.isInitialized()) {
        try {
          window.Kakao.init(process.env.NEXT_PUBLIC_KAKAO_JS_KEY);
          kakaoInitialized = true;
          console.log('Kakao SDK initialized');
        } catch (error) {
          console.error('Kakao SDK 초기화 실패:', error);
        }
      }
    };
    
    // 이미 Kakao 객체가 있으면 바로 초기화
    if (window.Kakao) {
      initKakao();
      return;
    }
    
    // 스크립트가 이미 있는지 확인
    const existingScript = document.querySelector('script[src*="kakao_js_sdk"]');
    if (existingScript) {
      existingScript.addEventListener('load', initKakao);
      return;
    }
    
    // 새 스크립트 추가
    const script = document.createElement('script');
    script.src = 'https://t1.daumcdn.net/kakao_js_sdk/2.5.0/kakao.min.js';
    script.async = true;
    script.onload = initKakao;
    script.onerror = () => console.error('Kakao SDK 로드 실패');
    document.body.appendChild(script);
  }, []);

  return null;
} 
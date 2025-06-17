'use client';

import { useEffect } from 'react';
import Script from 'next/script';

declare global {
  interface Window {
    Kakao: any;
  }
}

const KAKAO_APP_KEY = process.env.NEXT_PUBLIC_KAKAO_APP_KEY || '2a6e20ac0ba97afb3b35ecefb5e1f8ed';

const KakaoSDK = () => {
  useEffect(() => {
    const initializeKakao = () => {
      if (typeof window === 'undefined') return;

      if (window.Kakao && !window.Kakao.isInitialized()) {
        try {
          window.Kakao.init(KAKAO_APP_KEY);
          console.log('카카오 SDK 초기화 완료');
        } catch (error) {
          console.error('카카오 SDK 초기화 중 오류:', error);
        }
      }
    };

    // SDK 로드 후 초기화
    if (window.Kakao) {
      initializeKakao();
    }
  }, []);

  return (
    <Script
      src="https://t1.kakaocdn.net/kakao_js_sdk/2.6.0/kakao.min.js"
      strategy="beforeInteractive"
      onLoad={() => {
        if (window.Kakao && !window.Kakao.isInitialized()) {
          try {
            window.Kakao.init(KAKAO_APP_KEY);
            console.log('카카오 SDK 초기화 완료');
          } catch (error) {
            console.error('카카오 SDK 초기화 중 오류:', error);
          }
        }
      }}
    />
  );
};

export default KakaoSDK; 
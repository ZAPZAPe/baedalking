'use client';

import Script from 'next/script';
import { useEffect } from 'react';

declare global {
  interface Window {
    Kakao: any;
  }
}

export default function KakaoSDK() {
  useEffect(() => {
    const initKakao = () => {
      if (typeof window === 'undefined' || !window.Kakao) return;

      const kakaoKey = process.env.NEXT_PUBLIC_KAKAO_JS_KEY;
      console.log('카카오 키 상태:', {
        exists: !!kakaoKey,
        length: kakaoKey?.length,
        key: kakaoKey?.substring(0, 4) + '...' // 보안을 위해 일부만 표시
      });

      if (!kakaoKey) {
        console.error('카카오 JavaScript 키가 설정되지 않았습니다.');
        return;
      }

      try {
        if (!window.Kakao.isInitialized()) {
          window.Kakao.init(kakaoKey);
          console.log('카카오 SDK가 초기화되었습니다.');
        } else {
          console.log('카카오 SDK가 이미 초기화되어 있습니다.');
        }
      } catch (error) {
        console.error('카카오 SDK 초기화 중 오류 발생:', error);
      }
    };

    // SDK 로드 후 초기화 - 약간의 지연을 주어 안정성 확보
    const timer = setTimeout(() => {
      if (window.Kakao) {
        initKakao();
      }
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  if (!process.env.NEXT_PUBLIC_KAKAO_JS_KEY) {
    console.error('카카오 JavaScript 키가 설정되지 않았습니다.');
    return null;
  }

  return (
    <>
      <Script
        src="https://t1.kakaocdn.net/kakao_js_sdk/2.6.0/kakao.min.js"
        integrity="sha384-6MFdIr0zOira1CHQkedUqJVql0YtcZA1P0nbPrQYJXVJZUkTk/oX4U9GhUIs3/z8"
        crossOrigin="anonymous"
        strategy="beforeInteractive"
        onLoad={() => {
          console.log('카카오 SDK 스크립트가 로드되었습니다.');
        }}
        onError={(e) => {
          console.error('카카오 SDK 스크립트 로드 중 오류 발생:', e);
        }}
      />
    </>
  );
} 
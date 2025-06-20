'use client';

import { useEffect } from 'react';
import Script from 'next/script';

declare global {
  interface Window {
    Kakao: any;
  }
}

export default function KakaoSDK() {
  const kakaoAppKey = process.env.NEXT_PUBLIC_KAKAO_JS_KEY;

  useEffect(() => {
    const initKakao = () => {
      if (typeof window !== 'undefined' && window.Kakao && !window.Kakao.isInitialized() && kakaoAppKey) {
        try {
          window.Kakao.init(kakaoAppKey);
          console.log('✅ 카카오 SDK 초기화 완료');
        } catch (error) {
          console.error('❌ 카카오 SDK 초기화 오류:', error);
        }
      }
    };

    // 스크립트가 이미 로드되어 있으면 즉시 초기화
    if (window.Kakao && kakaoAppKey) {
      initKakao();
    }
  }, [kakaoAppKey]);

  // 카카오 앱 키가 없으면 스크립트를 로드하지 않음
  if (!kakaoAppKey) {
    console.warn('⚠️ NEXT_PUBLIC_KAKAO_JS_KEY가 설정되지 않았습니다.');
    return null;
  }

  return (
    <Script
      src="https://t1.kakaocdn.net/kakao_js_sdk/2.6.0/kakao.min.js"
      strategy="afterInteractive"
      onLoad={() => {
        console.log('📥 카카오 SDK 스크립트 로드 완료');
        if (typeof window !== 'undefined' && window.Kakao && !window.Kakao.isInitialized() && kakaoAppKey) {
          try {
            window.Kakao.init(kakaoAppKey);
            console.log('✅ 카카오 SDK 초기화 완료 (onLoad)');
          } catch (error) {
            console.error('❌ 카카오 SDK 초기화 오류 (onLoad):', error);
          }
        }
      }}
      onError={(error) => {
        console.error('❌ 카카오 SDK 스크립트 로드 실패:', error);
      }}
    />
  );
} 
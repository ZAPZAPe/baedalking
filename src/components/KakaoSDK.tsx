'use client';

import { useEffect } from 'react';

declare global {
  interface Window {
    Kakao: any;
  }
}

const KAKAO_APP_KEY = '2a6e20ac0ba97afb3b35ecefb5e1f8ed';

const KakaoSDK = () => {
  useEffect(() => {
    const initializeKakao = () => {
      if (typeof window === 'undefined') return;

      if (window.Kakao) {
        if (!window.Kakao.isInitialized()) {
          try {
            window.Kakao.init(KAKAO_APP_KEY);
          } catch (error) {
            console.error('카카오 SDK 초기화 중 오류:', error);
          }
        }
      } else {
        setTimeout(initializeKakao, 100);
      }
    };

    initializeKakao();
  }, []);

  return null;
};

export default KakaoSDK; 
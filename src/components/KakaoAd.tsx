'use client';

import { useEffect, useState } from 'react';
import { getAdUnitsForPage, resetPageAdUnits } from '@/utils/adUtils';

interface KakaoAdProps {
  page: 'home' | 'ranking' | 'upload' | 'shop';
  index: number; // 페이지 내에서의 광고 위치 (0부터 시작)
}

export default function KakaoAd({ page, index }: KakaoAdProps) {
  const [adUnit, setAdUnit] = useState<string>('');

  useEffect(() => {
    // 페이지에 필요한 광고 단위들을 가져옴
    const adUnits = getAdUnitsForPage(page);
    // 현재 인덱스에 해당하는 광고 단위 설정
    if (adUnits[index]) {
      setAdUnit(adUnits[index]);
    }

    // 컴포넌트가 언마운트될 때 해당 페이지의 광고 단위 초기화
    return () => {
      resetPageAdUnits(page);
    };
  }, [page, index]);

  useEffect(() => {
    // 카카오 광고 스크립트 로드
    const script = document.createElement('script');
    script.src = '//t1.daumcdn.net/kas/static/ba.min.js';
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  if (!adUnit) return null;

  return (
    <div className="w-full h-[100px] bg-white/5 backdrop-blur-sm rounded-lg overflow-hidden">
      <ins
        className="kakao_ad_area"
        style={{ display: 'none' }}
        data-ad-unit={adUnit}
        data-ad-width="320"
        data-ad-height="100"
        id={`kakao-ad-${page}-${index}`}
      />
    </div>
  );
} 
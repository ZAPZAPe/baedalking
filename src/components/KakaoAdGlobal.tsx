"use client";

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

interface KakaoAdGlobalProps {
  page: 'home' | 'ranking' | 'records' | 'upload' | 'store' | 'settings' | 'login' | 'attendance';
  index?: number;
}

const adConfig = {
  home: ['DAN-hoOuYkLu161z0omL', 'DAN-xsiNefKQFaudq5Uw', 'DAN-hoOuYkLu161z0omL'],
  ranking: ['DAN-f1yXlqwkDAofm50d'],
  records: ['DAN-oFrCjKBzmzkfB5Ap'],
  upload: ['DAN-kG6WELVLxrxJnhok'],
  store: ['DAN-2xqwYC5I70HpwRF1'],
  settings: ['DAN-AwGbVWdiKhAWrCVX', 'DAN-35Y5SGyWPnxCg3bl'],
  login: ['DAN-sMpnrnTCEfjs8dMd'],
  attendance: ['DAN-H23jVB9324Ae01jE']
};



export default function KakaoAdGlobal({ page, index = 0 }: KakaoAdGlobalProps) {
  const [isClient, setIsClient] = useState(false);
  const [iframeKey, setIframeKey] = useState(0);
  const pathname = usePathname();
  const adUnit = adConfig[page]?.[index] || adConfig[page]?.[0];

  useEffect(() => {
    setIsClient(true);
  }, []);

  // 페이지 변경 시 iframe 재생성
  useEffect(() => {
    if (isClient) {
      setIframeKey(prev => prev + 1);
    }
  }, [pathname, page, index, isClient]);

  if (!isClient || !adUnit) {
    return <div className="w-full h-[100px]" />;
  }

  // iframe 내용을 문자열로 생성
  const iframeContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { margin: 0; padding: 0; background: transparent; }
        .ad-container { width: 320px; height: 100px; display: flex; align-items: center; justify-content: center; }
      </style>
    </head>
    <body>
      <div class="ad-container">
        <ins class="kakao_ad_area" style="display:none;" 
             data-ad-unit="${adUnit}" 
             data-ad-width="320" 
             data-ad-height="100">
        </ins>
      </div>
      <script async src="//t1.daumcdn.net/kas/static/ba.min.js"></script>
    </body>
    </html>
  `;

  return (
    <div className="w-full flex justify-center">
      <div className="w-[320px] h-[100px] bg-white/5 backdrop-blur-sm rounded-lg overflow-hidden">
        <iframe
          key={iframeKey}
          srcDoc={iframeContent}
          width="320"
          height="100"
          frameBorder="0"
          scrolling="no"
          style={{ 
            border: 'none',
            background: 'transparent'
          }}
          title="카카오 광고"
        />
      </div>
    </div>
  );
} 
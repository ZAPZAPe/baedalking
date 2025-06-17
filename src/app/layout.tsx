import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import dynamic from 'next/dynamic';
import Script from 'next/script';
import KakaoSDK from '@/components/KakaoSDK';
import LayoutWrapper from '@/components/LayoutWrapper';
import MainContent from '@/components/MainContent';

// Navigation을 동적으로 로드하여 초기 로딩 성능 개선
const Navigation = dynamic(() => import("@/components/Navigation"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-14 bg-gradient-to-r from-blue-900 to-purple-900 border-b border-white/10" />
  )
});

const inter = Inter({ 
  subsets: ["latin"],
  display: 'swap',
  preload: true,
});

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#1e3a8a',
};

export const metadata: Metadata = {
  title: '배달킹 - 배달대행 라이더 수입 관리',
  description: '배달킹과 함께 더 스마트한 배달 라이프를 시작하세요.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: '배달킹',
  },
  other: {
    'mobile-web-app-capable': 'yes',
  },
  formatDetection: {
    telephone: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <meta name="theme-color" content="#1e3a8a" />
        <script
          async
          src="https://t1.kakaocdn.net/kakao_js_sdk/2.7.2/kakao.min.js"
          crossOrigin="anonymous"
        ></script>
      </head>
      <body className={inter.className}>
        {/* 카카오 SDK */}
        <KakaoSDK />
        <AuthProvider>
          <NotificationProvider>
            <Navigation />
            <MainContent>
              <LayoutWrapper>
                {children}
              </LayoutWrapper>
            </MainContent>
          </NotificationProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

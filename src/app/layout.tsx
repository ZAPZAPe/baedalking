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
  userScalable: 'no',
  viewportFit: 'cover',
  themeColor: '#1e3a8a',
};

export const metadata: Metadata = {
  title: "배달킹 - 실시간 배달 랭킹",
  description: "배달 라이더들의 실시간 랭킹을 확인하세요",
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: '배달킹',
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
          defer
          src="https://t1.kakaocdn.net/kakao_js_sdk/2.6.0/kakao.min.js"
          integrity="sha384-6MFdIr0zOira1DhCDX6+0W8e2gYbFU/L85v3UV1Q5pE9fHXcJ0YoUnzwVRJ2Wgc"
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

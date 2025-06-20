import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ClientProviders } from "@/components/ClientProviders";

const inter = Inter({ 
  subsets: ["latin"],
  display: 'swap',
  preload: true,
  fallback: ['system-ui', 'arial']
});

export const metadata: Metadata = {
  metadataBase: new URL("https://www.baedalrank.com"),
  title: {
    default: "배달킹",
    template: "%s | 배달킹"
  },
  description: "전국 배달 라이더들의 실시간 랭킹 및 경쟁 서비스",
  keywords: ["배달", "랭킹", "라이더", "배달기사", "실적", "경쟁"],
  openGraph: {
    title: "배달킹 - 실시간 배달 랭킹",
    description: "전국 배달 라이더들의 실시간 랭킹 및 경쟁 서비스",
    url: "https://www.baedalrank.com",
    siteName: "배달킹",
    images: [
      {
        url: "/baedalking-logo.png",
        width: 800,
        height: 600,
        alt: "배달킹 로고",
      },
    ],
    locale: "ko_KR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "배달킹 - 실시간 배달 랭킹 서비스",
    description: "전국 배달 라이더들의 실시간 랭킹을 확인하고, 포인트를 적립하세요!",
    images: ["/baedalking-logo.png"],
  },
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
  },
  themeColor: "#9333EA",
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body className={inter.className}>
        <ClientProviders>
          {children}
        </ClientProviders>
      </body>
    </html>
  );
}

"use client";

import { useState, Suspense, lazy } from "react";
import { usePathname } from "next/navigation";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/contexts/AuthContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import Navigation from "@/components/Navigation";
import KakaoSDK from "@/components/KakaoSDK";
import Loading from "@/components/Loading";

export function ClientProviders({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdminPage = pathname?.startsWith('/admin');
  
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000, // 1분
        gcTime: 5 * 60 * 1000, // 5분
        retry: 1,
        refetchOnWindowFocus: false,
      },
    },
  }));

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <NotificationProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <KakaoSDK />
            {/* 관리자 페이지가 아닐 때만 Navigation 렌더링 */}
            {!isAdminPage && <Navigation />}
            
            {/* 관리자 페이지와 일반 페이지 다른 레이아웃 적용 */}
            {isAdminPage ? (
              // 관리자 페이지: 전체 화면, 여백 없음, 스크롤 가능
              <main className="min-h-screen">
                <Suspense fallback={<Loading />}>
                  {children}
                </Suspense>
              </main>
            ) : (
              // 일반 페이지: 기존 스타일 유지
              <main className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900">
                <div className="pt-14 pb-20">
                  <Suspense fallback={<Loading />}>
                    {children}
                  </Suspense>
                </div>
              </main>
            )}
            
            <Toaster />
            <Sonner />
          </ThemeProvider>
        </NotificationProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
} 
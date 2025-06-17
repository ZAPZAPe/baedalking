'use client';

import { usePathname } from 'next/navigation';

export default function MainContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdminRoute = pathname?.startsWith('/admin');

  // 관리자 페이지면 패딩과 배경 없이 전체화면
  if (isAdminRoute) {
    return <>{children}</>;
  }

  // 일반 페이지는 기존 스타일 적용
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900">
      {/* 메인 컨텐츠 */}
      <main className="flex-1 pt-14 pb-14 w-full">
        {children}
      </main>
    </div>
  );
} 
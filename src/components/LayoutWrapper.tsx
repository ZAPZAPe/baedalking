'use client';

import { usePathname } from 'next/navigation';

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdminRoute = pathname?.startsWith('/admin');

  // 관리자 페이지면 컨테이너 없이 전체화면
  if (isAdminRoute) {
    return <>{children}</>;
  }

  // 일반 페이지는 기존 컨테이너 스타일 적용
  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-900 to-blue-900">
      <div className="max-w-3xl mx-auto px-4 py-6">
        {children}
      </div>
    </main>
  );
} 
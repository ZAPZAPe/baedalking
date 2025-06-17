'use client';

import { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import BottomNavigation from '@/components/BottomNavigation';

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const pathname = usePathname();
  
  // 네비게이션을 숨길 페이지들
  const hideNavigation = ['/login', '/profile-setup'].includes(pathname) || pathname.startsWith('/share/');

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* 메인 콘텐츠 */}
      <main className={`${hideNavigation ? 'pb-0' : 'pb-24'} min-h-screen`}>
        <div className="max-w-3xl mx-auto relative">
          {children}
        </div>
      </main>
      
      {/* 하단 네비게이션 */}
      {!hideNavigation && <BottomNavigation />}
    </div>
  );
};

export default Layout; 
'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { HomeIcon, UploadIcon, TrophyIcon, UserIcon, SettingsIcon } from '@/components/icons';

export default function Navigation() {
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t">
      <div className="container mx-auto px-4">
        <div className="flex justify-around items-center h-16">
          <Link
            href="/"
            className={`flex flex-col items-center ${
              isActive('/') ? 'text-blue-500' : 'text-gray-500'
            }`}
          >
            <HomeIcon className="w-6 h-6" />
            <span className="text-xs mt-1">홈</span>
          </Link>
          <Link
            href="/upload"
            className={`flex flex-col items-center ${
              isActive('/upload') ? 'text-blue-500' : 'text-gray-500'
            }`}
          >
            <UploadIcon className="w-6 h-6" />
            <span className="text-xs mt-1">업로드</span>
          </Link>
          <Link
            href="/ranking"
            className={`flex flex-col items-center ${
              isActive('/ranking') ? 'text-blue-500' : 'text-gray-500'
            }`}
          >
            <TrophyIcon className="w-6 h-6" />
            <span className="text-xs mt-1">랭킹</span>
          </Link>
          <Link
            href="/my-page"
            className={`flex flex-col items-center ${
              isActive('/my-page') ? 'text-blue-500' : 'text-gray-500'
            }`}
          >
            <UserIcon className="w-6 h-6" />
            <span className="text-xs mt-1">마이</span>
          </Link>
          <Link
            href="/settings"
            className={`flex flex-col items-center ${
              isActive('/settings') ? 'text-blue-500' : 'text-gray-500'
            }`}
          >
            <SettingsIcon className="w-6 h-6" />
            <span className="text-xs mt-1">설정</span>
          </Link>
        </div>
      </div>
    </nav>
  );
} 
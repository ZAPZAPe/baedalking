'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { FaHome, FaTrophy, FaHistory, FaUpload, FaStore, FaCog, FaBell, FaSignInAlt } from 'react-icons/fa';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/contexts/NotificationContext';

const titleMap: Record<string, string> = {
  '/ranking': '랭킹',
  '/records': '기록',
  '/upload': '업로드',
  '/store': '상점',
  '/settings': '설정',
  '/': '배달킹',
  '/notifications': '알림',
  '/profile-setup': '프로필 설정',
  '/login': '로그인',
  '/share': '공유하기'
};

interface NavigationProps {
  title?: string;
}

export default function Navigation({ title }: NavigationProps) {
  const pathname = usePathname();
  const defaultTitle = titleMap[pathname] || '';
  const { user } = useAuth();
  const { unreadCount } = useNotifications();

  // 관리자 경로면 네비게이션 렌더링하지 않음
  if (pathname?.startsWith('/admin')) {
    return null;
  }

  return (
    <>
      {/* 상단 네비게이션 바 */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-blue-900 to-purple-900 border-b border-white/10">
        <div className="max-w-md mx-auto px-4 h-14 flex items-center justify-between relative">
          {/* 좌측: 홈 메뉴 */}
          <Link 
            href="/" 
            className="text-white hover:text-yellow-400 transition-colors"
          >
            <FaHome size={24} />
          </Link>
          {/* 가운데: 현재 화면 제목 */}
          <div className="absolute left-1/2 -translate-x-1/2 text-white font-bold text-lg select-none">
            {title || defaultTitle}
          </div>
          {/* 우측: 알림 메뉴 또는 로그인 버튼 */}
          {user ? (
            <Link 
              href="/notifications" 
              className="text-white hover:text-yellow-400 transition-colors relative"
            >
              <FaBell size={24} />
              {/* 알림 뱃지 - 읽지 않은 알림이 있을 때만 표시 */}
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Link>
          ) : (
            <Link 
              href="/login" 
              className="text-white hover:text-yellow-400 transition-colors"
            >
              <FaSignInAlt size={24} />
            </Link>
          )}
        </div>
      </nav>

      {/* 하단 네비게이션 바 - 로그인한 사용자만 표시 */}
      {user && (
        <nav className="fixed bottom-0 left-0 right-0 z-50 bg-gradient-to-r from-blue-900 to-purple-900 border-t border-white/10">
          <div className="max-w-md mx-auto px-4 h-16 flex items-center justify-around">
          {/* 랭킹 */}
          <Link 
            href="/ranking" 
            className={`flex flex-col items-center justify-center w-16 h-16 ${
              pathname === '/ranking' 
                ? 'text-yellow-400' 
                : 'text-white hover:text-yellow-400'
            } transition-colors`}
          >
            <FaTrophy size={24} />
            <span className="text-xs mt-1">랭킹</span>
          </Link>

          {/* 기록 */}
          <Link 
            href="/records" 
            className={`flex flex-col items-center justify-center w-16 h-16 ${
              pathname === '/records' 
                ? 'text-yellow-400' 
                : 'text-white hover:text-yellow-400'
            } transition-colors`}
          >
            <FaHistory size={24} />
            <span className="text-xs mt-1">기록</span>
          </Link>

          {/* 업로드 */}
          <Link 
            href="/upload" 
            className={`flex flex-col items-center justify-center w-16 h-16 ${
              pathname === '/upload' 
                ? 'text-yellow-400' 
                : 'text-white hover:text-yellow-400'
            } transition-colors`}
          >
            <FaUpload size={24} />
            <span className="text-xs mt-1">업로드</span>
          </Link>

          {/* 상점 */}
          <Link 
            href="/store" 
            className={`flex flex-col items-center justify-center w-16 h-16 ${
              pathname === '/store' 
                ? 'text-yellow-400' 
                : 'text-white hover:text-yellow-400'
            } transition-colors`}
          >
            <FaStore size={24} />
            <span className="text-xs mt-1">상점</span>
          </Link>

          {/* 설정 */}
          <Link 
            href="/settings" 
            className={`flex flex-col items-center justify-center w-16 h-16 ${
              pathname === '/settings' 
                ? 'text-yellow-400' 
                : 'text-white hover:text-yellow-400'
            } transition-colors`}
          >
            <FaCog size={24} />
            <span className="text-xs mt-1">설정</span>
          </Link>
                  </div>
        </nav>
      )}
      </>
    );
  } 
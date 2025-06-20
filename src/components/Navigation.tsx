'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useEffect, useState, memo, useMemo } from 'react';
import { FaHome, FaTrophy, FaHistory, FaUpload, FaStore, FaCog, FaBell, FaSignInAlt, FaCheck, FaTrash, FaExclamationCircle, FaCheckCircle, FaInfoCircle, FaExclamationTriangle, FaClock } from 'react-icons/fa';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/contexts/NotificationContext';
import { useRouter } from 'next/navigation';

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

// NavLink 컴포넌트를 메모이제이션
const NavLink = memo(({ href, pathname, icon: Icon, label }: {
  href: string;
  pathname: string;
  icon: any;
  label: string;
}) => (
  <Link 
    href={href} 
    className={`flex flex-col items-center justify-center w-16 h-16 ${
      pathname === href 
        ? 'text-yellow-400' 
        : 'text-white hover:text-yellow-400'
    } transition-colors`}
  >
    <Icon size={24} />
    <span className="text-xs mt-1">{label}</span>
  </Link>
));

NavLink.displayName = 'NavLink';

export default function Navigation({ title }: NavigationProps) {
  const pathname = usePathname();
  const defaultTitle = useMemo(() => titleMap[pathname] || '', [pathname]);
  const { user } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead, removeNotification, clearAll } = useNotifications();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const router = useRouter();

  // 관리자 경로면 네비게이션 렌더링하지 않음
  if (pathname?.startsWith('/admin')) {
    return null;
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <FaCheckCircle className="text-green-400" size={20} />;
      case 'warning':
        return <FaExclamationTriangle className="text-yellow-400" size={20} />;
      case 'error':
        return <FaExclamationCircle className="text-red-400" size={20} />;
      default:
        return <FaInfoCircle className="text-blue-400" size={20} />;
    }
  };

  const getNotificationBg = (type: string) => {
    switch (type) {
      case 'success':
        return 'from-green-500/20 to-emerald-500/20 border-green-400/30';
      case 'warning':
        return 'from-yellow-500/20 to-orange-500/20 border-yellow-400/30';
      case 'error':
        return 'from-red-500/20 to-pink-500/20 border-red-400/30';
      default:
        return 'from-blue-500/20 to-cyan-500/20 border-blue-400/30';
    }
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return '방금 전';
    if (minutes < 60) return `${minutes}분 전`;
    if (hours < 24) return `${hours}시간 전`;
    if (days < 7) return `${days}일 전`;
    return date.toLocaleDateString();
  };

  const handleNotificationClick = (notification: any) => {
    if (!notification.read) {
      markAsRead(notification.id);
    }
    if (notification.link) {
      setShowNotifications(false);
      router.push(notification.link);
    }
  };

  return (
    <>
      {/* 상단 네비게이션 바 */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-purple-900 to-pink-900 border-b border-purple-500/30">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between relative">
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
            <button 
              onClick={() => setShowNotifications(true)}
              className="text-white hover:text-yellow-400 transition-colors relative"
            >
              <FaBell size={24} />
              {/* 알림 뱃지 - 읽지 않은 알림이 있을 때만 표시 */}
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
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
        <nav className="fixed bottom-0 left-0 right-0 z-50 bg-gradient-to-r from-purple-900 to-pink-900 border-t border-purple-500/30">
          <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-around">
            <NavLink href="/ranking" pathname={pathname} icon={FaTrophy} label="랭킹" />
            <NavLink href="/records" pathname={pathname} icon={FaHistory} label="기록" />
            <NavLink href="/upload" pathname={pathname} icon={FaUpload} label="업로드" />
            <NavLink href="/store" pathname={pathname} icon={FaStore} label="상점" />
            <NavLink href="/settings" pathname={pathname} icon={FaCog} label="설정" />
          </div>
        </nav>
      )}

      {/* 알림 모달 */}
      {showNotifications && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-gradient-to-br from-purple-900/95 to-pink-900/95 backdrop-blur-lg rounded-3xl p-6 shadow-2xl border border-purple-500/30 max-w-md w-full max-h-[80vh] overflow-hidden flex flex-col">
            {/* 모달 헤더 */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <FaBell className="text-yellow-400" size={20} />
                <h2 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-orange-400 to-pink-400">알림</h2>
                <span className="text-purple-200 text-sm">
                  ({notifications.filter(n => !n.read).length}개의 읽지 않은 알림)
                </span>
              </div>
              <button
                onClick={() => setShowNotifications(false)}
                className="w-8 h-8 bg-gradient-to-r from-white/10 to-white/5 rounded-full flex items-center justify-center text-white hover:from-white/15 hover:to-white/10 transition-all"
              >
                ×
              </button>
            </div>

            {/* 액션 버튼 */}
            {notifications.length > 0 && (
              <div className="flex gap-2 mb-4">
                <button
                  onClick={markAllAsRead}
                  className="flex-1 bg-gradient-to-r from-purple-400 to-pink-500 hover:from-purple-500 hover:to-pink-600 rounded-lg py-2 px-3 text-white text-sm font-bold hover:scale-105 transition-all flex items-center justify-center gap-2"
                >
                  <FaCheck size={12} />
                  모두 읽음
                </button>
                <button
                  onClick={() => setShowClearConfirm(true)}
                  className="flex-1 bg-gradient-to-r from-red-500/50 to-pink-500/50 hover:from-red-600/50 hover:to-pink-600/50 rounded-lg py-2 px-3 text-white text-sm font-bold hover:scale-105 transition-all flex items-center justify-center gap-2"
                >
                  <FaTrash size={12} />
                  모두 삭제
                </button>
              </div>
            )}

            {/* 알림 목록 */}
            <div className="flex-1 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="text-center py-8">
                  <FaBell size={48} className="mx-auto text-white/40 mb-4" />
                  <p className="text-white/60">알림이 없습니다</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      onClick={() => handleNotificationClick(notification)}
                      className={`bg-gradient-to-r from-white/10 to-white/5 rounded-xl p-3 border border-white/20 ${
                        notification.read ? 'opacity-60' : ''
                      } hover:from-white/15 hover:to-white/10 transition-all cursor-pointer`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center flex-shrink-0">
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1">
                          <h3 className="text-white font-bold text-sm">{notification.title}</h3>
                          <p className="text-white/80 text-xs mt-1">{notification.message}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <FaClock size={10} className="text-white/60" />
                            <span className="text-white/60 text-xs">{formatDate(notification.createdAt)}</span>
                          </div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeNotification(notification.id);
                          }}
                          className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-all"
                        >
                          <FaTrash size={12} className="text-white/60" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 전체 삭제 확인 모달 */}
      {showClearConfirm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
          <div className="bg-gradient-to-br from-purple-900/95 to-pink-900/95 backdrop-blur-lg rounded-3xl p-6 shadow-2xl border border-purple-500/30 max-w-sm w-full">
            <h3 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-orange-400 to-pink-400 mb-4">알림 전체 삭제</h3>
            <p className="text-white/80 mb-6">
              모든 알림을 삭제하시겠습니까?<br />
              이 작업은 되돌릴 수 없습니다.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="flex-1 bg-gradient-to-r from-white/10 to-white/5 text-white py-2 rounded-xl font-bold text-sm hover:from-white/15 hover:to-white/10 transition-all border border-white/20"
              >
                취소
              </button>
              <button
                onClick={() => {
                  clearAll();
                  setShowClearConfirm(false);
                }}
                className="flex-1 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white py-2 rounded-xl font-bold text-sm hover:scale-105 transition-all"
              >
                삭제
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
} 
'use client';

import { useState } from 'react';
import { FaBell, FaCheck, FaTrash, FaExclamationCircle, FaCheckCircle, FaInfoCircle, FaExclamationTriangle, FaClock } from 'react-icons/fa';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/contexts/NotificationContext';
import { useRouter } from 'next/navigation';

export default function NotificationsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { notifications, markAsRead, markAllAsRead, removeNotification, clearAll } = useNotifications();
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 flex items-center justify-center">
        <p className="text-white">로그인이 필요합니다.</p>
      </div>
    );
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
      router.push(notification.link);
    }
  };

  return (
    <div className="relative z-10">
      <div className="max-w-3xl mx-auto px-4">
        {/* 상단 광고 */}
        <section className="mt-2 mb-4">
          <div className="bg-white/5 rounded-lg h-[100px] flex items-center justify-center border border-white/10">
            <p className="text-sm text-blue-200">광고영역</p>
          </div>
        </section>

        {/* 알림 헤더 */}
        <section className="mb-4">
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-4 shadow-xl border border-white/20">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-2xl font-bold text-white">알림</h2>
                <p className="text-blue-200 text-sm">
                  {notifications.length > 0 
                    ? `${notifications.filter(n => !n.read).length}개의 읽지 않은 알림`
                    : '새로운 알림이 없습니다'}
                </p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-2xl flex items-center justify-center shadow-lg">
                <FaBell className="text-white" size={20} />
              </div>
            </div>

            {notifications.length > 0 && (
              <div className="flex gap-2">
                <button
                  onClick={markAllAsRead}
                  className="flex-1 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-lg py-2 px-3 text-white text-sm font-bold hover:scale-105 transition-all flex items-center justify-center gap-2"
                >
                  <FaCheck size={12} />
                  모두 읽음
                </button>
                <button
                  onClick={() => setShowClearConfirm(true)}
                  className="flex-1 bg-gradient-to-r from-red-500/20 to-pink-500/20 rounded-lg py-2 px-3 text-white text-sm font-bold hover:scale-105 transition-all flex items-center justify-center gap-2"
                >
                  <FaTrash size={12} />
                  모두 삭제
                </button>
              </div>
            )}
          </div>
        </section>

        {/* 알림 목록 */}
        <section className="mb-4">
          {notifications.length === 0 ? (
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-xl border border-white/20 text-center">
              <FaBell size={48} className="mx-auto text-white/40 mb-4" />
              <p className="text-white/60">알림이 없습니다</p>
            </div>
          ) : (
            <div className="space-y-2">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`bg-gradient-to-r ${getNotificationBg(notification.type)} rounded-xl p-3 border ${
                    notification.read ? 'opacity-60' : ''
                  } hover:scale-105 transition-all cursor-pointer`}
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
        </section>

        {/* 하단 광고 */}
        <section className="mb-2">
          <div className="bg-white/5 rounded-lg h-[100px] flex items-center justify-center border border-white/10">
            <p className="text-sm text-blue-200">광고영역</p>
          </div>
        </section>

        {/* 전체 삭제 확인 모달 */}
        {showClearConfirm && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 shadow-xl border border-white/20 max-w-sm w-full">
              <h3 className="text-xl font-bold text-white mb-4">알림 전체 삭제</h3>
              <p className="text-white/80 mb-6">
                모든 알림을 삭제하시겠습니까?<br />
                이 작업은 되돌릴 수 없습니다.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowClearConfirm(false)}
                  className="flex-1 bg-white/20 text-white py-2 rounded-xl font-bold text-sm hover:bg-white/30 transition-all"
                >
                  취소
                </button>
                <button
                  onClick={() => {
                    clearAll();
                    setShowClearConfirm(false);
                  }}
                  className="flex-1 bg-red-500 text-white py-2 rounded-xl font-bold text-sm hover:bg-red-600 transition-all"
                >
                  삭제
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 
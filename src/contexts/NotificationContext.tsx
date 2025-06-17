'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from './AuthContext';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  createdAt: Date;
  link?: string;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (notification: Omit<Notification, 'id' | 'read' | 'createdAt'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  removeNotification: (id: string) => void;
  clearAll: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  // 로컬 스토리지에서 알림 불러오기
  useEffect(() => {
    if (user && !isInitialized) {
      try {
        const savedNotifications = localStorage.getItem(`notifications_${user.id}`);
        if (savedNotifications) {
          const parsed = JSON.parse(savedNotifications);
          setNotifications(parsed.map((n: any) => ({
            ...n,
            createdAt: new Date(n.createdAt)
          })));
        }
      } catch (error) {
        console.error('알림 로드 실패:', error);
      }
      setIsInitialized(true);
    } else if (!user) {
      setNotifications([]);
      setIsInitialized(false);
    }
  }, [user, isInitialized]);

  // 알림 저장 (디바운스 적용)
  useEffect(() => {
    if (user && notifications.length > 0 && isInitialized) {
      const timeoutId = setTimeout(() => {
        try {
          localStorage.setItem(`notifications_${user.id}`, JSON.stringify(notifications));
        } catch (error) {
          console.error('알림 저장 실패:', error);
        }
      }, 500);
      
      return () => clearTimeout(timeoutId);
    }
  }, [notifications, user, isInitialized]);

  const addNotification = useCallback((notification: Omit<Notification, 'id' | 'read' | 'createdAt'>) => {
    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString(),
      read: false,
      createdAt: new Date()
    };
    setNotifications(prev => [newNotification, ...prev]);
  }, []);

  const markAsRead = useCallback((id: string) => {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev =>
      prev.map(n => ({ ...n, read: true }))
    );
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
    if (user) {
      try {
        localStorage.removeItem(`notifications_${user.id}`);
      } catch (error) {
        console.error('알림 삭제 실패:', error);
      }
    }
  }, [user]);

  const unreadCount = useMemo(() => 
    notifications.filter(n => !n.read).length,
    [notifications]
  );

  const value = useMemo(() => ({
    notifications,
    unreadCount,
    addNotification,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAll
  }), [notifications, unreadCount, addNotification, markAsRead, markAllAsRead, removeNotification, clearAll]);

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}; 
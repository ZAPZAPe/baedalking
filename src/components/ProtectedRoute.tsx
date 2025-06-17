'use client';

import { ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Loading from './Loading';

interface ProtectedRouteProps {
  children: ReactNode;
  requireProfile?: boolean; // 프로필 설정이 필요한지 여부
}

const ProtectedRoute = ({ children, requireProfile = true }: ProtectedRouteProps) => {
  const { user, userProfile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.push('/login');
      return;
    }

    if (requireProfile && !userProfile) {
      router.push('/profile-setup');
      return;
    }
  }, [user, userProfile, loading, requireProfile, router]);

  if (loading) {
    return <Loading />;
  }

  if (!user) {
    return null; // 리다이렉트 처리 중
  }

  if (requireProfile && !userProfile) {
    return null; // 프로필 설정 페이지로 리다이렉트 중
  }

  return <>{children}</>;
};

export default ProtectedRoute; 
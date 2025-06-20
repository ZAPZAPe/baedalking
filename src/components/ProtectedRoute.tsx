'use client';

import { ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Loading from './Loading';

interface ProtectedRouteProps {
  children: ReactNode;
  requireProfile?: boolean; // 프로필 설정이 필요한지 여부
  allowedPaths?: string[]; // 프로필 미설정 상태에서도 접근 가능한 경로
}

const ProtectedRoute = ({ children, requireProfile = true, allowedPaths = [] }: ProtectedRouteProps) => {
  const { user, userProfile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    // 로그인하지 않은 경우
    if (!user) {
      router.push('/login');
      return;
    }

    // 프로필 설정이 필요한 경우
    if (requireProfile && userProfile) {
      // 필수 필드가 모두 설정되었는지 확인
      const isProfileComplete = userProfile.nickname && 
                               userProfile.region && 
                               userProfile.vehicle && 
                               userProfile.phone;
      
      if (!isProfileComplete) {
        // 현재 경로가 허용된 경로인지 확인
        const currentPath = window.location.pathname;
        const isAllowedPath = allowedPaths.some(path => currentPath.startsWith(path));
        
        if (!isAllowedPath) {
          router.push('/profile-setup');
          return;
        }
      }
    }
  }, [user, userProfile, loading, requireProfile, router, allowedPaths]);

  if (loading) {
    return <Loading />;
  }

  if (!user) {
    return null; // 리다이렉트 처리 중
  }

  if (requireProfile && userProfile) {
    const isProfileComplete = userProfile.nickname && 
                             userProfile.region && 
                             userProfile.vehicle && 
                             userProfile.phone;
    
    if (!isProfileComplete) {
      const currentPath = window.location.pathname;
      const isAllowedPath = allowedPaths.some(path => currentPath.startsWith(path));
      
      if (!isAllowedPath) {
        return null; // 프로필 설정 페이지로 리다이렉트 중
      }
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute; 
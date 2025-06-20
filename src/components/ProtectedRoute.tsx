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

    // 프로필 설정이 필요한 경우 (userProfile이 없거나 필수 필드가 없는 경우)
    if (requireProfile) {
      if (!userProfile) {
        // userProfile이 아직 로드되지 않은 경우 기다림
        return;
      }
      
      // 필수 필드가 모두 설정되었는지 엄격하게 확인
      const isProfileComplete = Boolean(
        userProfile.nickname && 
        userProfile.nickname.trim() && 
        userProfile.region && 
        userProfile.region.trim() && 
        userProfile.vehicle && 
        userProfile.vehicle.trim() && 
        userProfile.phone && 
        userProfile.phone.trim()
      );
      
      if (!isProfileComplete) {
        // 현재 경로가 허용된 경로인지 확인
        const currentPath = window.location.pathname;
        const isAllowedPath = allowedPaths.some(path => currentPath.startsWith(path)) || 
                             currentPath === '/profile-setup' ||
                             currentPath === '/settings'; // 설정 페이지는 항상 허용
        
        if (!isAllowedPath) {
          console.log('프로필 설정이 완료되지 않아 프로필 설정 페이지로 이동합니다.');
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

  if (requireProfile) {
    if (!userProfile) {
      return <Loading />; // userProfile 로딩 중
    }
    
    const isProfileComplete = Boolean(
      userProfile.nickname && 
      userProfile.nickname.trim() && 
      userProfile.region && 
      userProfile.region.trim() && 
      userProfile.vehicle && 
      userProfile.vehicle.trim() && 
      userProfile.phone && 
      userProfile.phone.trim()
    );
    
    if (!isProfileComplete) {
      const currentPath = window.location.pathname;
      const isAllowedPath = allowedPaths.some(path => currentPath.startsWith(path)) || 
                           currentPath === '/profile-setup' ||
                           currentPath === '/settings'; // 설정 페이지는 항상 허용
      
      if (!isAllowedPath) {
        return null; // 프로필 설정 페이지로 리다이렉트 중
      }
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute; 
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Loading from '@/components/Loading';

export default function AdminLoginPage() {
  const router = useRouter();
  const { user, userProfile, loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      if (user && userProfile?.role === 'admin') {
        // 관리자 권한이 있으면 바로 관리자 페이지로
        router.push('/admin');
      } else {
        // 권한이 없으면 홈으로
        router.push('/');
      }
    }
  }, [user, userProfile, loading, router]);

  return <Loading />;
} 
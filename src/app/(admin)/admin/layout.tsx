'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Loading from '@/components/Loading';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, userProfile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // 관리자 권한 체크
    if (!loading && (!user || userProfile?.role !== 'admin')) {
      router.push('/');
    }
  }, [user, userProfile, loading, router]);

  if (loading) {
    return <Loading />;
  }

  // 관리자 권한이 없으면 아무것도 렌더링하지 않음
  if (!user || userProfile?.role !== 'admin') {
    return null;
  }

  return <>{children}</>;
} 
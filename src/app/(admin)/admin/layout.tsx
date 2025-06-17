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
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center">
        <Loading text="권한 확인 중..." />
      </div>
    );
  }

  // 관리자 권한이 없으면 아무것도 렌더링하지 않음
  if (!user || userProfile?.role !== 'admin') {
    return null;
  }

  return <>{children}</>;
} 
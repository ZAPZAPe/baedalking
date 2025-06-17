'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';
import UserProfileSetup from '../../components/UserProfileSetup';

export default function ProfileSetupPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          router.push('/login');
          return;
        }

        // 사용자 프로필 확인
        const { data: profile } = await supabase
          .from('users')
          .select('nickname, region, bike_type')
          .eq('id', session.user.id)
          .single();

        // 이미 프로필이 설정된 경우 메인 페이지로 이동
        if (profile?.nickname && profile?.region && profile?.bike_type) {
          router.push('/');
          return;
        }

        setUserId(session.user.id);
      } catch (error) {
        console.error('사용자 확인 중 오류:', error);
        router.push('/login');
      } finally {
        setIsLoading(false);
      }
    };

    checkUser();
  }, [router]);

  const handleComplete = () => {
    router.push('/');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  if (!userId) {
    return null;
  }

  return <UserProfileSetup userId={userId} onComplete={handleComplete} />;
} 
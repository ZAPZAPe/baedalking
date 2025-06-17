'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';

function CallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const code = searchParams.get('code');
        const state = searchParams.get('state');

        if (!code || !state) {
          console.error('카카오 로그인 콜백 파라미터가 없습니다.');
          router.push('/login');
          return;
        }

        // Supabase 세션 확인
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('세션 에러:', sessionError);
          router.push('/login');
          return;
        }

        if (session) {
          // 로그인 성공 시 프로필 설정 페이지로 이동
          router.push('/profile-setup');
        } else {
          // 세션이 없는 경우 로그인 페이지로 이동
          router.push('/login');
        }
      } catch (error) {
        console.error('카카오 로그인 콜백 처리 중 에러:', error);
        router.push('/login');
      }
    };

    handleCallback();
  }, [router, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-blue-900 to-purple-900">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white mx-auto"></div>
        <p className="mt-4 text-white">카카오 로그인 처리 중...</p>
      </div>
    </div>
  );
}

export default function KakaoCallback() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-blue-900 to-purple-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white mx-auto"></div>
          <p className="mt-4 text-white">로딩 중...</p>
        </div>
      </div>
    }>
      <CallbackContent />
    </Suspense>
  );
} 
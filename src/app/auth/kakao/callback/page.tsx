'use client';

import { useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

function CallbackContent() {
  const router = useRouter();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // URL에서 해시 프래그먼트 확인 (Supabase는 해시를 사용할 수 있음)
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const searchParams = new URLSearchParams(window.location.search);
        
        const accessToken = hashParams.get('access_token') || searchParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token') || searchParams.get('refresh_token');
        const error = hashParams.get('error') || searchParams.get('error');

        console.log('콜백 파라미터:', {
          hash: window.location.hash,
          search: window.location.search,
          accessToken: !!accessToken,
          refreshToken: !!refreshToken,
          error
        });

        if (error) {
          console.error('OAuth 에러:', error);
          router.push('/login?error=oauth_error');
          return;
        }

        // Supabase 세션 확인
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        console.log('현재 세션:', { session: !!session, error: sessionError });

        if (session) {
          // 로그인 성공 시 프로필 설정 페이지로 이동
          console.log('로그인 성공, 프로필 설정으로 이동');
          router.push('/profile-setup');
        } else {
          // 세션이 없는 경우 잠시 기다린 후 다시 확인
          console.log('세션 없음, 2초 후 재확인');
          setTimeout(async () => {
            const { data: { session: retrySession } } = await supabase.auth.getSession();
            if (retrySession) {
              router.push('/profile-setup');
            } else {
              console.log('재확인 후에도 세션 없음, 로그인 페이지로 이동');
              router.push('/login?error=session_not_found');
            }
          }, 2000);
        }
      } catch (error) {
        console.error('카카오 로그인 콜백 처리 중 에러:', error);
        router.push('/login?error=callback_error');
      }
    };

    handleCallback();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-blue-900 to-purple-900">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white mx-auto"></div>
        <p className="mt-4 text-white">카카오 로그인 처리 중...</p>
        <p className="mt-2 text-white/60 text-sm">잠시만 기다려주세요</p>
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
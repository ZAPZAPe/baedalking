'use client';

import { useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

function CallbackContent() {
  const router = useRouter();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // URL에서 파라미터 확인
        const searchParams = new URLSearchParams(window.location.search);
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        
        const code = searchParams.get('code');
        const state = searchParams.get('state');
        const accessToken = hashParams.get('access_token') || searchParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token') || searchParams.get('refresh_token');
        const error = hashParams.get('error') || searchParams.get('error');

        console.log('콜백 파라미터:', {
          hash: window.location.hash,
          search: window.location.search,
          code: !!code,
          state: !!state,
          accessToken: !!accessToken,
          refreshToken: !!refreshToken,
          error
        });

        if (error) {
          console.error('OAuth 에러:', error);
          router.push('/login?error=oauth_error');
          return;
        }

        // 카카오 인증 코드가 있는 경우 처리
        if (code && state) {
          console.log('카카오 인증 코드 처리 중...');
          
          // Supabase의 OAuth 코드 교환 엔드포인트 호출
          const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          
          if (exchangeError) {
            console.error('코드 교환 에러:', exchangeError);
            // 대안: 직접 카카오 API 호출
            await handleKakaoCodeExchange(code);
          } else if (data.session) {
            console.log('Supabase 세션 생성 성공');
            router.push('/profile-setup');
            return;
          }
        }

        // 기존 세션 확인
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        console.log('현재 세션:', { session: !!session, error: sessionError });

        if (session) {
          console.log('로그인 성공, 프로필 설정으로 이동');
          router.push('/profile-setup');
        } else {
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

    // 카카오 코드를 직접 처리하는 함수
    const handleKakaoCodeExchange = async (code: string) => {
      try {
        console.log('카카오 API 직접 호출 시작');
        
        // 카카오 토큰 요청
        const tokenResponse = await fetch('https://kauth.kakao.com/oauth/token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            grant_type: 'authorization_code',
            client_id: process.env.NEXT_PUBLIC_KAKAO_JS_KEY || '',
            redirect_uri: `${window.location.origin}/auth/kakao/callback`,
            code: code,
          }),
        });

        if (!tokenResponse.ok) {
          throw new Error('카카오 토큰 요청 실패');
        }

        const tokenData = await tokenResponse.json();
        console.log('카카오 토큰 획득 성공');

        // 카카오 사용자 정보 요청
        const userResponse = await fetch('https://kapi.kakao.com/v2/user/me', {
          headers: {
            Authorization: `Bearer ${tokenData.access_token}`,
          },
        });

        if (!userResponse.ok) {
          throw new Error('카카오 사용자 정보 요청 실패');
        }

        const userData = await userResponse.json();
        console.log('카카오 사용자 정보 획득 성공');

        // Supabase에 사용자 생성 또는 로그인
        const email = userData.kakao_account?.email || `kakao_${userData.id}@baedalking.com`;
        const password = `kakao_${userData.id}_secret`;

        // 기존 사용자 확인
        const { data: existingUser } = await supabase
          .from('users')
          .select('*')
          .eq('kakao_id', userData.id.toString())
          .single();

        if (existingUser) {
          // 기존 사용자 로그인
          const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
            email: existingUser.email,
            password: password,
          });

          if (signInError) {
            console.error('기존 사용자 로그인 에러:', signInError);
            throw signInError;
          }

          console.log('기존 사용자 로그인 성공');
          router.push('/profile-setup');
        } else {
          // 신규 사용자 생성
          const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
            email: email,
            password: password,
          });

          if (signUpError) {
            console.error('신규 사용자 생성 에러:', signUpError);
            throw signUpError;
          }

          if (signUpData.user) {
            // users 테이블에 프로필 생성
            const { error: profileError } = await supabase
              .from('users')
              .insert({
                id: signUpData.user.id,
                email: email,
                nickname: userData.properties?.nickname || userData.kakao_account?.profile?.nickname || '카카오유저',
                kakao_id: userData.id.toString(),
                profile_image: userData.properties?.profile_image || userData.kakao_account?.profile?.profile_image_url,
                points: 500,
                created_at: new Date().toISOString(),
              });

            if (profileError) {
              console.error('프로필 생성 에러:', profileError);
            }

            console.log('신규 사용자 생성 및 로그인 성공');
            router.push('/profile-setup');
          }
        }
      } catch (error) {
        console.error('카카오 코드 교환 에러:', error);
        router.push('/login?error=kakao_exchange_error');
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
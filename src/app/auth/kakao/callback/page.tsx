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
          
          // PKCE 에러를 피하기 위해 바로 카카오 API 호출
          await handleKakaoCodeExchange(code);
          return;
        }

        // 기존 세션 확인
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        console.log('현재 세션:', { session: !!session, error: sessionError });

        if (session) {
          console.log('로그인 성공, 프로필 설정으로 이동');
          // AuthContext가 세션을 인식할 때까지 추가 대기
          await new Promise(resolve => setTimeout(resolve, 500));
          router.push('/profile-setup');
        } else {
          console.log('세션 없음, 2초 후 재확인');
          setTimeout(async () => {
            const { data: { session: retrySession } } = await supabase.auth.getSession();
            if (retrySession) {
              // AuthContext가 세션을 인식할 때까지 추가 대기
              await new Promise(resolve => setTimeout(resolve, 500));
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
        console.log('카카오 사용자 정보 획득 성공:', {
          id: userData.id,
          nickname: userData.properties?.nickname || userData.kakao_account?.profile?.nickname,
          email: userData.kakao_account?.email
        });

        // Supabase에 사용자 생성 또는 로그인
                    const email = userData.kakao_account?.email || `kakao_${userData.id}@baedalrank.com`;
        const password = `kakao_${userData.id}_secret`;

        // 먼저 로그인 시도
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: email,
          password: password,
        });

        if (signInError) {
          console.log('기존 사용자 없음, 새 사용자 생성 시도');
          
          // 신규 사용자 생성 (이메일 인증 건너뛰기)
          const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
            email: email,
            password: password,
            options: {
              emailRedirectTo: `${window.location.origin}/profile-setup`,
              data: {
                kakao_id: userData.id.toString(),
                nickname: userData.properties?.nickname || userData.kakao_account?.profile?.nickname || '카카오유저',
                profile_image: userData.properties?.profile_image || userData.kakao_account?.profile?.profile_image_url,
              }
            }
          });

          if (signUpError) {
            console.error('신규 사용자 생성 에러:', signUpError);
            
            // 이메일 인증 에러인 경우 무시하고 바로 로그인 시도
            if (signUpError.message.includes('Error sending confirmation email')) {
              console.log('이메일 인증 에러 무시, 바로 로그인 시도');
              
              // 잠시 대기 후 다시 로그인 시도
              setTimeout(async () => {
                const { data: retrySignInData, error: retrySignInError } = await supabase.auth.signInWithPassword({
                  email: email,
                  password: password,
                });

                if (!retrySignInError && retrySignInData.session) {
                  console.log('로그인 성공 (재시도)');
                  
                  // 세션이 완전히 설정될 때까지 대기
                  await new Promise(resolve => setTimeout(resolve, 1000));
                  
                  // users 테이블에 프로필 생성 (신규 사용자만)
                  const { data: existingProfile } = await supabase
                    .from('users')
                    .select('id')
                    .eq('id', retrySignInData.user.id)
                    .single();
                  
                  if (!existingProfile) {
                    const referralCode = `BK${Date.now().toString(36).toUpperCase()}`;
                    const { error: profileError } = await supabase
                      .from('users')
                      .insert({
                        id: retrySignInData.user.id,
                        username: `kakao_${userData.id}`,
                        email: email,
                        nickname: userData.properties?.nickname || userData.kakao_account?.profile?.nickname || '카카오유저',
                        kakao_id: userData.id.toString(),
                        profile_image: userData.properties?.profile_image || userData.kakao_account?.profile?.profile_image_url,
                        points: 300,
                        referral_code: referralCode,
                        created_at: new Date().toISOString(),
                      });

                    if (profileError) {
                      console.error('프로필 생성 에러:', profileError);
                    }
                  }

                  // AuthContext가 세션을 인식할 때까지 추가 대기
                  await new Promise(resolve => setTimeout(resolve, 500));
                  router.push('/profile-setup');
                } else {
                  console.error('재시도 로그인 실패:', retrySignInError);
                  router.push('/login?error=retry_signin_failed');
                }
              }, 1000);
              return;
            }
            
            throw signUpError;
          }

          if (signUpData.user) {
            console.log('신규 사용자 생성 성공');
            
            // 바로 로그인 시도
            const { data: newSignInData, error: newSignInError } = await supabase.auth.signInWithPassword({
              email: email,
              password: password,
            });

            if (!newSignInError && newSignInData.session) {
              console.log('신규 사용자 로그인 성공');
              
              // 세션이 완전히 설정될 때까지 대기
              await new Promise(resolve => setTimeout(resolve, 1000));
              
              // users 테이블에 프로필 생성 (신규 사용자만)
              const { data: existingProfile } = await supabase
                .from('users')
                .select('id')
                .eq('id', newSignInData.user.id)
                .single();
              
              if (!existingProfile) {
                const referralCode = `BK${Date.now().toString(36).toUpperCase()}`;
                const { error: profileError } = await supabase
                  .from('users')
                  .insert({
                    id: newSignInData.user.id,
                    username: `kakao_${userData.id}`,
                    email: email,
                    nickname: userData.properties?.nickname || userData.kakao_account?.profile?.nickname || '카카오유저',
                    kakao_id: userData.id.toString(),
                    profile_image: userData.properties?.profile_image || userData.kakao_account?.profile?.profile_image_url,
                    points: 300,
                    referral_code: referralCode,
                    created_at: new Date().toISOString(),
                  });

                if (profileError) {
                  console.error('프로필 생성 에러:', profileError);
                }
              }

              // AuthContext가 세션을 인식할 때까지 추가 대기
              await new Promise(resolve => setTimeout(resolve, 500));
              router.push('/profile-setup');
            }
          }
        } else if (signInData.session) {
          console.log('기존 사용자 로그인 성공');
          
          // 세션이 완전히 설정될 때까지 대기
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // 기존 사용자 정보 확인
          const { data: existingUser } = await supabase
            .from('users')
            .select('id, referral_code, nickname')
            .eq('id', signInData.user.id)
            .single();
          
          if (existingUser) {
            // 기존 사용자 - 닉네임은 업데이트하지 않음
            const updateData: any = {
              kakao_id: userData.id.toString(),
              profile_image: userData.properties?.profile_image || userData.kakao_account?.profile?.profile_image_url,
              updated_at: new Date().toISOString(),
            };
            
            // 추천 코드가 없으면 추가
            if (!existingUser.referral_code) {
              updateData.referral_code = `BK${Date.now().toString(36).toUpperCase()}`;
            }
            
            const { error: updateError } = await supabase
              .from('users')
              .update(updateData)
              .eq('id', signInData.user.id);

            if (updateError) {
              console.error('프로필 업데이트 에러:', updateError);
            }
          } else {
            // 신규 사용자 프로필 생성 (처음 가입하는 경우)
            const referralCode = `BK${Date.now().toString(36).toUpperCase()}`;
            const { error: createError } = await supabase
              .from('users')
              .insert({
                id: signInData.user.id,
                username: `kakao_${userData.id}`,
                email: email,
                nickname: userData.properties?.nickname || userData.kakao_account?.profile?.nickname || '카카오유저',
                kakao_id: userData.id.toString(),
                profile_image: userData.properties?.profile_image || userData.kakao_account?.profile?.profile_image_url,
                points: 300,
                referral_code: referralCode,
                created_at: new Date().toISOString(),
              });

            if (createError) {
              console.error('프로필 생성 에러:', createError);
            }
          }

          // AuthContext가 세션을 인식할 때까지 추가 대기
          await new Promise(resolve => setTimeout(resolve, 500));
          router.push('/profile-setup');
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
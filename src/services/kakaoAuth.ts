import { supabase } from '@/lib/supabase';

declare global {
  interface Window {
    Kakao: any;
  }
}

// 카카오 SDK 초기화
export const initKakao = () => {
  if (typeof window === 'undefined') {
    console.log('서버 사이드에서 실행 중입니다.');
    return;
  }
  
  if (!window.Kakao) {
    console.error('카카오 SDK가 로드되지 않았습니다.');
    return;
  }

  const kakaoKey = process.env.NEXT_PUBLIC_KAKAO_JS_KEY;
  console.log('카카오 키 상태:', {
    exists: !!kakaoKey,
    length: kakaoKey?.length,
    key: kakaoKey?.substring(0, 4) + '...' // 보안을 위해 일부만 표시
  });

  if (!kakaoKey) {
    console.error('카카오 JavaScript 키가 설정되지 않았습니다.');
    return;
  }

  if (!window.Kakao.isInitialized()) {
    try {
      window.Kakao.init(kakaoKey);
      console.log('카카오 SDK가 초기화되었습니다.');
    } catch (error) {
      console.error('카카오 SDK 초기화 중 오류 발생:', error);
    }
  } else {
    console.log('카카오 SDK가 이미 초기화되어 있습니다.');
  }
};

// 카카오 로그인
export const loginWithKakao = async () => {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('브라우저 환경에서만 실행 가능합니다.'));
      return;
    }
    
    if (!window.Kakao) {
      reject(new Error('카카오 SDK가 로드되지 않았습니다.'));
      return;
    }

    window.Kakao.Auth.login({
      success: async function(authObj: any) {
        try {
          // 카카오 사용자 정보 가져오기
          window.Kakao.API.request({
            url: '/v2/user/me',
            success: async function(response: any) {
              const kakaoUser = {
                id: response.id.toString(),
                email: response.kakao_account?.email || `kakao_${response.id}@baedalking.com`,
                nickname: response.properties?.nickname || response.kakao_account?.profile?.nickname || '카카오유저',
                profileImage: response.properties?.profile_image || response.kakao_account?.profile?.profile_image_url,
              };

              // Supabase에서 사용자 확인 또는 생성
              const { data: existingUser } = await supabase
                .from('users')
                .select('*')
                .eq('kakao_id', kakaoUser.id)
                .single();

              if (existingUser) {
                // 기존 사용자 로그인
                const { data, error } = await supabase.auth.signInWithPassword({
                  email: existingUser.email,
                  password: `kakao_${kakaoUser.id}_secret`, // 카카오 로그인용 고정 비밀번호
                });

                if (error) throw error;
                resolve({ user: data.user, isNewUser: false });
              } else {
                // 신규 사용자 생성
                const { data: authData, error: authError } = await supabase.auth.signUp({
                  email: kakaoUser.email,
                  password: `kakao_${kakaoUser.id}_secret`,
                });

                if (authError) throw authError;

                // users 테이블에 프로필 생성
                if (authData.user) {
                  const referralCode = `BK${Date.now().toString(36).toUpperCase()}`;
                  const { error: profileError } = await supabase
                    .from('users')
                    .insert({
                      id: authData.user.id,
                      email: kakaoUser.email,
                      nickname: kakaoUser.nickname,
                      kakao_id: kakaoUser.id,
                      profile_image: kakaoUser.profileImage,
                      points: 500, // 가입 보너스
                      referral_code: referralCode,
                      created_at: new Date().toISOString(),
                    });

                  if (profileError) throw profileError;
                }

                resolve({ user: authData.user, isNewUser: true });
              }
            },
            fail: function(error: any) {
              reject(error);
            }
          });
        } catch (error) {
          reject(error);
        }
      },
      fail: function(err: any) {
        reject(err);
      },
      // 리다이렉트 URI 추가
      redirectUri: process.env.NEXT_PUBLIC_APP_URL 
        ? `${process.env.NEXT_PUBLIC_APP_URL}/auth/kakao/callback`
        : 'https://www.baedalking.com/auth/kakao/callback'
    });
  });
};

// 카카오 로그아웃
export const logoutKakao = () => {
  if (typeof window !== 'undefined' && window.Kakao && window.Kakao.Auth.getAccessToken()) {
    window.Kakao.Auth.logout();
  }
}; 
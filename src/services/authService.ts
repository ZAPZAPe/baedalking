import { supabase } from '../lib/supabase';

// 회원가입
export const signUp = async (email: string, password: string, nickname: string) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${window.location.origin}/auth/callback`,
      data: {
        nickname,
      }
    }
  });
  
  if (error) throw error;
  
  // 프로필 생성
  if (data.user) {
    const { error: profileError } = await supabase
      .from('users')
      .insert({
        id: data.user.id,
        username: email,
        email,
        nickname,
        points: 500, // 가입 보너스
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
      
    if (profileError) {
      console.error('프로필 생성 실패:', profileError);
    }
  }
  
  return data;
};

// 로그인
export const signIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  
  if (error) throw error;
  return data;
};

// 로그아웃
export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};

// 현재 사용자 가져오기
export const getCurrentUser = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.user || null;
};

// 프로필 업데이트
export const updateUserProfile = async (userId: string, updates: any) => {
  const { data, error } = await supabase
    .from('users')
    .update(updates)
    .eq('id', userId)
    .select();
    
  if (error) throw error;
  return data[0];
};

// 닉네임 중복 체크
export const checkNicknameAvailability = async (nickname: string): Promise<boolean> => {
  const { data, error } = await supabase
    .from('users')
    .select('id')
    .eq('nickname', nickname)
    .single();

  if (error && error.code !== 'PGRST116') {
    throw error;
  }

  return !data;
};

// 이메일 인증 확인
export const confirmSignUp = async (email: string, code: string): Promise<void> => {
  const { error } = await supabase.auth.verifyOtp({
    email,
    token: code,
    type: 'signup'
  });

  if (error) throw error;
};

// 인증 코드 재전송
export const resendConfirmationCode = async (email: string): Promise<void> => {
  const { error } = await supabase.auth.resend({
    type: 'signup',
    email,
  });

  if (error) throw error;
}; 
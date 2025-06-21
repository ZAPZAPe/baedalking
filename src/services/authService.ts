import { supabase } from '@/lib/supabase';

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
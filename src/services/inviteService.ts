import { supabase } from '@/lib/supabase';

// 초대 코드 생성 (users 테이블의 referral_code 사용)
export const generateInviteCode = async (userId: string) => {
  try {
    // 기존 사용자의 referral_code 확인
    const { data: user } = await supabase
      .from('users')
      .select('referral_code')
      .eq('id', userId)
      .single();

    if (user?.referral_code) {
      return user.referral_code;
    }

    // 새로운 초대 코드 생성 (5자리: 3글자 + 2숫자)
    let code: string;
    let attempts = 0;
    
    do {
      const letters = Math.random().toString(36).substring(2, 5).toUpperCase();
      const numbers = Math.floor(Math.random() * 100).toString().padStart(2, '0');
      code = letters + numbers;
      attempts++;

      // 중복 확인
      const { data: existing } = await supabase
        .from('users')
        .select('id')
        .eq('referral_code', code)
        .single();

      if (!existing) break;
    } while (attempts < 10);

    if (attempts >= 10) {
      throw new Error('고유한 초대 코드 생성 실패');
    }
    
    // users 테이블에 referral_code 업데이트
    const { error } = await supabase
      .from('users')
      .update({ referral_code: code })
      .eq('id', userId);

    if (error) throw error;

    return code;
  } catch (error) {
    console.error('초대 코드 생성 실패:', error);
    throw error;
  }
};

// 초대 코드 검증 및 포인트 지급 (users 테이블의 referral_code 사용)
export const validateInviteCode = async (code: string, newUserId: string) => {
  try {
    const response = await fetch('/api/invite/validate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        code,
        newUserId
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || '초대 코드 검증 API 호출 실패');
    }

    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || '초대 코드 검증 실패');
    }

    return {
      inviterPoints: result.inviterPoints,
      invitedPoints: result.invitedPoints
    };
  } catch (error) {
    console.error('초대 코드 검증 실패:', error);
    throw error;
  }
};

// 초대 통계 조회
export const getInviteStats = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('invites')
      .select('created_at')
      .eq('inviter_id', userId);

    if (error) throw error;

    return {
      totalInvites: data.length,
      recentInvites: data.filter(invite => {
        const inviteDate = new Date(invite.created_at);
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        return inviteDate >= thirtyDaysAgo;
      }).length
    };
  } catch (error) {
    console.error('초대 통계 조회 실패:', error);
    throw error;
  }
};

 
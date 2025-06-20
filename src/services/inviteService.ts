import { supabase } from '@/lib/supabase';
import { addPoints } from './pointService';

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
    // 초대 코드로 초대자 찾기 (users 테이블에서)
    const { data: inviter, error: codeError } = await supabase
      .from('users')
      .select('id')
      .eq('referral_code', code)
      .single();

    if (codeError || !inviter) {
      throw new Error('유효하지 않은 초대 코드입니다.');
    }

    // 자기 자신의 코드는 사용할 수 없음
    if (inviter.id === newUserId) {
      throw new Error('자신의 초대 코드는 사용할 수 없습니다.');
    }

    // 이미 사용된 코드인지 확인
    const { data: existingInvite, error: inviteError } = await supabase
      .from('invites')
      .select('id')
      .eq('invite_code', code)
      .eq('invited_user_id', newUserId)
      .single();

    if (existingInvite) {
      throw new Error('이미 사용된 초대 코드입니다.');
    }

    // 초대 기록 저장
    const { error: recordError } = await supabase
      .from('invites')
      .insert({
        inviter_id: inviter.id,
        invited_user_id: newUserId,
        invite_code: code,
        created_at: new Date().toISOString(),
      });

    if (recordError) throw recordError;

    // 초대자에게 포인트 지급 (500P)
    const inviterSuccess = await addPoints(
      inviter.id, 
      500, 
      'friend_invite', 
      '친구 초대 보상'
    );

    if (!inviterSuccess) throw new Error('초대자 포인트 지급 실패');

    // 초대받은 사용자에게 포인트 지급 (300P)
    const invitedSuccess = await addPoints(
      newUserId,
      300,
      'invite_used',
      '초대 코드 사용 보상'
    );

    if (!invitedSuccess) throw new Error('초대받은 사용자 포인트 지급 실패');

    return {
      inviterPoints: 500,
      invitedPoints: 300
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

 
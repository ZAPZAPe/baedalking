import { supabase } from '@/lib/supabase';
import { addPoints } from './pointService';

// 초대 코드 생성
export const generateInviteCode = async (userId: string) => {
  try {
    // 기존 초대 코드 확인
    const { data: existingCode } = await supabase
      .from('invite_codes')
      .select('code')
      .eq('user_id', userId)
      .single();

    if (existingCode) {
      return existingCode.code;
    }

    // 새로운 초대 코드 생성 (6자리 랜덤 문자열)
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    
    // 초대 코드 저장
    const { error } = await supabase
      .from('invite_codes')
      .insert({
        user_id: userId,
        code,
        created_at: new Date().toISOString(),
      });

    if (error) throw error;

    return code;
  } catch (error) {
    console.error('초대 코드 생성 실패:', error);
    throw error;
  }
};

// 초대 코드 검증 및 포인트 지급
export const validateInviteCode = async (code: string, newUserId: string) => {
  try {
    // 초대 코드 확인
    const { data: inviteCode, error: codeError } = await supabase
      .from('invite_codes')
      .select('user_id')
      .eq('code', code)
      .single();

    if (codeError || !inviteCode) {
      throw new Error('유효하지 않은 초대 코드입니다.');
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
        inviter_id: inviteCode.user_id,
        invited_user_id: newUserId,
        invite_code: code,
        created_at: new Date().toISOString(),
      });

    if (recordError) throw recordError;

    // 초대자에게 포인트 지급 (500P)
    const inviterSuccess = await addPoints(
      inviteCode.user_id, 
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
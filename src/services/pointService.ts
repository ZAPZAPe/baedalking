import { supabase } from '../lib/supabase';
import { createNotification } from './notificationService';

export interface PointTransaction {
  id?: string;
  userId: string;
  type: 'earn' | 'spend';
  amount: number;
  reason: string;
  description: string;
  createdAt: Date;
}

export interface PointReward {
  upload: number;
  daily_login: number;
  first_upload: number;
  ranking_top3: number;
  ranking_top10: number;
  verification: number;
  attendance: number;
}

// 포인트 보상 설정
export const POINT_REWARDS: PointReward = {
  upload: 100,           // 업로드 시
  daily_login: 10,       // 일일 로그인
  first_upload: 500,     // 첫 업로드
  ranking_top3: 1000,    // TOP 3 진입
  ranking_top10: 500,    // TOP 10 진입
  verification: 200,     // 인증 완료
  attendance: 50         // 출석체크
};

// 포인트 추가
export const addPoints = async (
  userId: string, 
  amount: number, 
  reason: string, 
  description: string
): Promise<boolean> => {
  try {
    // 1. point_history 테이블에 기록 추가
    const { error: historyError } = await supabase
      .from('point_history')
      .insert({
        user_id: userId,
        points: amount,
        reason: description
      });

    if (historyError) throw historyError;

    // 2. users 테이블의 포인트 업데이트
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('points')
      .eq('id', userId)
      .single();

    if (userError) throw userError;

    const newPoints = (userData.points || 0) + amount;

    const { error: updateError } = await supabase
      .from('users')
      .update({ points: newPoints })
      .eq('id', userId);

    if (updateError) throw updateError;

    // 3. 포인트 지급 알림 생성
    await createNotification({
      user_id: userId,
      type: 'point',
      title: '포인트 지급',
      message: `${description} +${amount}P가 지급되었습니다.`
    });

    return true;
  } catch (error) {
    console.error('포인트 추가 오류:', error);
    return false;
  }
};

// 포인트 차감
export const deductPoints = async (
  userId: string, 
  amount: number, 
  reason: string, 
  description: string
): Promise<boolean> => {
  try {
    return await addPoints(userId, -amount, reason, description);
  } catch (error) {
    console.error('포인트 차감 오류:', error);
    return false;
  }
};

// 사용자 포인트 조회
export const getUserPoints = async (userId: string): Promise<number> => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('points')
      .eq('id', userId)
      .single();

    if (error) throw error;
    return data.points || 0;
  } catch (error) {
    console.error('포인트 조회 오류:', error);
    return 0;
  }
};

// 포인트 거래 내역 조회
export const getPointTransactions = async (userId: string, limitCount: number = 20): Promise<PointTransaction[]> => {
  try {
    const { data, error } = await supabase
      .from('point_history')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limitCount);

    if (error) throw error;

    return data.map((transaction: any) => ({
      id: transaction.id,
      userId: transaction.user_id,
      type: transaction.points > 0 ? 'earn' : 'spend',
      amount: Math.abs(transaction.points),
      reason: transaction.reason,
      description: transaction.reason,
      createdAt: new Date(transaction.created_at)
    }));
  } catch (error) {
    console.error('포인트 거래 내역 조회 오류:', error);
    return [];
  }
};

// 업로드 시 포인트 지급
export const rewardUploadPoints = async (userId: string, isFirstUpload: boolean = false): Promise<boolean> => {
  try {
    let totalPoints = POINT_REWARDS.upload;
    let description = '배달 실적 업로드';

    if (isFirstUpload) {
      totalPoints += POINT_REWARDS.first_upload;
      description += ' (첫 업로드 보너스)';
    }

    return await addPoints(userId, totalPoints, 'upload', description);
  } catch (error) {
    console.error('업로드 포인트 지급 오류:', error);
    return false;
  }
};

// 일일 로그인 포인트 지급
export const rewardDailyLoginPoints = async (userId: string): Promise<boolean> => {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    // 오늘 이미 로그인 포인트를 받았는지 확인
    const { data, error } = await supabase
      .from('point_history')
      .select('*')
      .eq('user_id', userId)
      .eq('reason', '일일 로그인 보너스')
      .gte('created_at', today)
      .limit(1);

    if (error) throw error;

    if (data.length === 0) {
      return await addPoints(userId, POINT_REWARDS.daily_login, 'daily_login', '일일 로그인 보너스');
    }

    return false;
  } catch (error) {
    console.error('일일 로그인 포인트 지급 오류:', error);
    return false;
  }
};

// 랭킹 포인트 지급
export const rewardRankingPoints = async (userId: string, rank: number): Promise<boolean> => {
  try {
    let amount = 0;
    let description = '';

    if (rank <= 3) {
      amount = POINT_REWARDS.ranking_top3;
      description = `TOP 3 진입 보너스 (${rank}위)`;
    } else if (rank <= 10) {
      amount = POINT_REWARDS.ranking_top10;
      description = `TOP 10 진입 보너스 (${rank}위)`;
    }

    if (amount > 0) {
      return await addPoints(userId, amount, 'ranking', description);
    }

    return false;
  } catch (error) {
    console.error('랭킹 포인트 지급 오류:', error);
    return false;
  }
};

// 인증 포인트 지급
export const rewardVerificationPoints = async (userId: string): Promise<boolean> => {
  try {
    return await addPoints(userId, POINT_REWARDS.verification, 'verification', '배달 기록 인증 완료');
  } catch (error) {
    console.error('인증 포인트 지급 오류:', error);
    return false;
  }
};

// 첫 업로드 확인
export const isFirstUpload = async (userId: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('delivery_records')
      .select('*')
      .eq('user_id', userId)
      .limit(1);

    if (error) throw error;
    return data.length === 0;
  } catch (error) {
    console.error('첫 업로드 확인 오류:', error);
    return false;
  }
};

// 출석체크 포인트 지급
export const rewardAttendancePoints = async (userId: string): Promise<boolean> => {
  try {
    return await addPoints(userId, POINT_REWARDS.attendance, 'attendance', '출석체크 완료');
  } catch (error) {
    console.error('출석체크 포인트 지급 오류:', error);
    return false;
  }
};

// 첫 업로드 보너스 (별칭)
export const rewardFirstUploadBonus = async (userId: string): Promise<boolean> => {
  try {
    return await addPoints(userId, POINT_REWARDS.first_upload, 'first_upload', '첫 업로드 보너스');
  } catch (error) {
    console.error('첫 업로드 보너스 지급 오류:', error);
    return false;
  }
}; 
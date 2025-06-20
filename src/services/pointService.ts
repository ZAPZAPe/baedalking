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
  attendance: number;
}

// 포인트 보상 설정
export const POINT_REWARDS: PointReward = {
  upload: 50,            // 업로드 시
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
    const response = await fetch('/api/points/add', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        amount,
        reason,
        description
      }),
    });

    if (!response.ok) {
      throw new Error('포인트 추가 API 호출 실패');
    }

    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || '포인트 추가 실패');
    }

    // 포인트 지급 알림 생성
    try {
      await createNotification({
        user_id: userId,
        type: 'point',
        title: '포인트 지급',
        message: `${description} ${amount > 0 ? '+' : ''}${amount}P가 지급되었습니다.`
      });
    } catch (notificationError) {
      console.error('알림 생성 실패:', notificationError);
      // 알림 실패는 전체 프로세스를 중단시키지 않음
    }

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

    console.log('supabase data:', data, 'error:', error); // 진단용 로그

    if (error) throw error;
    if (!data) return [];

    return data.map((transaction: any) => ({
      id: transaction.id,
      userId: transaction.user_id,
      type: transaction.points > 0 ? 'earn' : 'spend',
      amount: Math.abs(transaction.points),
      reason: transaction.reason,
      description: transaction.reason.startsWith('출근도장') ? '출근도장' : transaction.reason,
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
    const totalPoints = POINT_REWARDS.upload;
    const description = '배달 실적 업로드';

    return await addPoints(userId, totalPoints, 'upload', description);
  } catch (error) {
    console.error('업로드 포인트 지급 오류:', error);
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

 
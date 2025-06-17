import { supabase } from '../lib/supabase';
import { DeliveryRecord } from '@/types/index';
import { rewardUploadPoints, isFirstUpload } from './pointService';

// 배달 기록 생성
export async function createDeliveryRecord(record: Omit<DeliveryRecord, 'id' | 'createdAt' | 'updatedAt'>) {
  const { data, error } = await supabase
    .from('delivery_records')
    .insert({
      user_id: record.userId,
      date: record.date,
      amount: record.amount,
      delivery_count: record.deliveryCount,
      platform: record.platform,
      verified: record.verified,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .select();

  if (error) {
    throw error;
  }

  return data[0];
}

// 사용자의 배달 기록 조회
export async function getDeliveryRecords(userId: string) {
  const { data, error } = await supabase
    .from('delivery_records')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: false });

  if (error) {
    throw error;
  }

  return data;
}

// 배달 기록 업데이트
export async function updateDeliveryRecord(id: string, updates: Partial<DeliveryRecord>) {
  const { data, error } = await supabase
    .from('delivery_records')
    .update({
      user_id: updates.userId,
      date: updates.date,
      amount: updates.amount,
      delivery_count: updates.deliveryCount,
      platform: updates.platform,
      verified: updates.verified,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select();

  if (error) {
    throw error;
  }

  return data[0];
}

// 배달 기록 삭제
export async function deleteDeliveryRecord(id: string) {
  const { error } = await supabase
    .from('delivery_records')
    .delete()
    .eq('id', id);

  if (error) {
    throw error;
  }
}

// 배달 기록 검증 (관리자용)
export const verifyDeliveryRecord = async (
  recordId: string,
  isVerified: boolean
): Promise<DeliveryRecord> => {
  try {
    const response = await supabase
      .from('delivery_records')
      .update({ verified: isVerified })
      .eq('id', recordId)
      .select();

    if (response.error) {
      throw response.error;
    }

    return response.data[0];
  } catch (error) {
    console.error('배달 기록 검증 오류:', error);
    throw error;
  }
};

// 배달 기록 가져오기
export const getUserDeliveryRecords = async (
  userId: string,
  limit: number = 20
): Promise<DeliveryRecord[]> => {
  try {
    const { data, error } = await supabase
      .from('delivery_records')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .limit(limit);

    if (error) {
      throw error;
    }

    return data.map(record => ({
      id: record.id,
      userId: record.user_id,
      date: record.date,
      amount: record.amount,
      deliveryCount: record.delivery_count,
      platform: record.platform,
      verified: record.verified,
      createdAt: record.created_at,
      updatedAt: record.updated_at
    }));
  } catch (error) {
    console.error('배달 기록 가져오기 오류:', error);
    return [];
  }
};

// 날짜 범위로 배달 기록 가져오기
export const getDeliveryRecordsByDateRange = async (
  userId: string,
  startDate: string,
  endDate: string
): Promise<DeliveryRecord[]> => {
  try {
    const { data, error } = await supabase
      .from('delivery_records')
      .select('*')
      .eq('user_id', userId)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: false });

    if (error) {
      throw error;
    }

    return data.map(record => ({
      id: record.id,
      userId: record.user_id,
      date: record.date,
      amount: record.amount,
      deliveryCount: record.delivery_count,
      platform: record.platform,
      verified: record.verified,
      createdAt: record.created_at,
      updatedAt: record.updated_at
    }));
  } catch (error) {
    console.error('날짜 범위 배달 기록 가져오기 오류:', error);
    return [];
  }
};

// 일별 배달 요약 가져오기
export const getDailyDeliverySummaries = async (
  userId: string,
  startDate: Date,
  endDate: Date
): Promise<Array<{ date: string; deliveries: number; amount: number }>> => {
  try {
    const records = await getDeliveryRecordsByDateRange(
      userId,
      startDate.toISOString().split('T')[0],
      endDate.toISOString().split('T')[0]
    );
    
    // 날짜별로 집계
    const summaryMap = new Map<string, { deliveries: number; amount: number }>();
    
    records.forEach((record: DeliveryRecord) => {
      const existing = summaryMap.get(record.date) || { deliveries: 0, amount: 0 };
      summaryMap.set(record.date, {
        deliveries: existing.deliveries + record.deliveryCount,
        amount: existing.amount + record.amount
      });
    });
    
    return Array.from(summaryMap.entries()).map(([date, data]) => ({
      date,
      deliveries: data.deliveries,
      amount: data.amount
    }));
  } catch (error) {
    console.error('일별 배달 요약 가져오기 오류:', error);
    return [];
  }
};

// 배달 통계 가져오기
export const getDeliveryStats = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('delivery_records')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false });

    if (error) {
      throw error;
    }

    const stats = {
      totalDeliveries: data.length,
      totalAmount: data.reduce((total, record) => total + record.amount, 0),
      currentRank: null,
      recentDeliveries: data.slice(0, 5).map((record: any) => ({
        ...record,
        platform: record.platform.replace('BAEMIN_CONNECT', '배민커넥트').replace('COUPANG_EATS', '쿠팡이츠'),
        createdAt: new Date(record.date)
      })),
      achievements: []
    };

    return stats;
  } catch (error) {
    console.error('배달 통계 가져오기 오류:', error);
    return {
      totalDeliveries: 0,
      totalAmount: 0,
      currentRank: null,
      recentDeliveries: [],
      achievements: []
    };
  }
};

// 전체 배달 기록 가져오기 (관리자용)
export const getAllDeliveryRecords = async (
  limit: number = 50
): Promise<DeliveryRecord[]> => {
  try {
    const { data, error } = await supabase
      .from('delivery_records')
      .select('*')
      .order('date', { ascending: false })
      .limit(limit);

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error('배달 기록 전체 조회 오류:', error);
    return [];
  }
}; 
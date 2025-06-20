import { supabase } from '../lib/supabase';
import { DeliveryRecord, UserProfile } from '@/types';
import { FraudRecord } from '@/types/fraud';

interface ExtendedDeliveryRecord extends DeliveryRecord {
  userNickname?: string;
  userRegion?: string;
  imageUrl?: string;
}

interface DashboardStats {
  todayUploads: number;
  totalUsers: number;
  totalDeliveries: number;
  fraudDetections: number;
  uploadTrend: {
    date: string;
    count: number;
  }[];
}

interface Statistics {
  totalUsers: number;
  userGrowth: number;
  totalRecords: number;
  recordGrowth: number;
  totalAmount: number;
  amountGrowth: number;
  fraudCount: number;
  trendData: { date: string; count: number }[];
  platformStats: { platform: string; count: number; amount: number }[];
  regionStats: { region: string; count: number; amount: number }[];
}

interface Settings {
  siteName: string;
  adminEmail: string;
  autoVerifyOcr: boolean;
  ocrConfidenceThreshold: number;
  autoFraudDetection: boolean;
  fraudDetectionThreshold: number;
  emailNotifications: boolean;
  fraudNotifications: boolean;
}

// 대시보드 통계 가져오기
export const getDashboardStats = async (): Promise<DashboardStats> => {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    // 오늘 업로드 수
    const { data: todayRecords } = await supabase
      .from('delivery_records')
      .select('*')
      .gte('created_at', today + 'T00:00:00')
      .lte('created_at', today + 'T23:59:59');
    
    // 전체 사용자 수
    const { data: users } = await supabase
      .from('users')
      .select('*');
    
    // 전체 배달 기록 수
    const { data: allRecords } = await supabase
      .from('delivery_records')
      .select('*');
    
    // 최근 7일 업로드 트렌드
    const uploadTrend = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const count = allRecords?.filter(r => 
        r.created_at.startsWith(dateStr)
      ).length || 0;
      
      uploadTrend.push({
        date: date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' }),
        count
      });
    }
    
    return {
      todayUploads: todayRecords?.length || 0,
      totalUsers: users?.length || 0,
      totalDeliveries: allRecords?.length || 0,
      fraudDetections: 0, // fraud_records 테이블이 없으므로 0
      uploadTrend
    };
  } catch (error) {
    console.error('대시보드 통계 가져오기 오류:', error);
    // 오류 시 기본값 반환
    return {
      todayUploads: 0,
      totalUsers: 0,
      totalDeliveries: 0,
      fraudDetections: 0,
      uploadTrend: []
    };
  }
};

// 사용자 목록 가져오기
export const getUsers = async (): Promise<UserProfile[]> => {
  try {
    const { data: users, error } = await supabase
      .from('users')
      .select('*');

    if (error) throw error;
    
    return users.map(user => ({
      id: user.id,
      email: user.email,
      nickname: user.nickname,
      region: user.region,
      vehicle: user.vehicle,
      phone: user.phone,
      createdAt: user.created_at,
      points: user.points || 0,
      totalDeliveries: user.total_deliveries || 0,
      totalEarnings: user.total_earnings || 0,
      profileImage: user.profile_image,
      notificationSettings: user.notification_settings || {
        push: true,
        email: false,
        sms: false
      },
      role: user.role || 'user'
    }));
  } catch (error) {
    console.error('사용자 목록 가져오기 오류:', error);
    throw error;
  }
};

// 사용자 권한 업데이트
export const updateUserRole = async (userId: string, newRole: 'user' | 'admin'): Promise<void> => {
  try {
    const { error } = await supabase
      .from('users')
      .update({ role: newRole, updated_at: new Date().toISOString() })
      .eq('id', userId);

    if (error) throw error;
  } catch (error) {
    console.error('사용자 권한 업데이트 오류:', error);
    throw error;
  }
};

// 새 사용자 생성
export const createUser = async (userData: {
  email: string;
  password: string;
  nickname: string;
  region?: string;
  vehicle?: string;
  phone?: string;
  role?: 'user' | 'admin';
}): Promise<void> => {
  try {
    // 1. Supabase Auth에 사용자 생성
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: userData.email,
      password: userData.password,
      email_confirm: true
    });

    if (authError) throw authError;

    // 2. users 테이블에 프로필 생성
    const { error: profileError } = await supabase
      .from('users')
      .insert({
        id: authData.user.id,
        email: userData.email,
        username: userData.email, // username은 email로 기본 설정
        nickname: userData.nickname,
        region: userData.region || '',
        vehicle: userData.vehicle || 'bicycle',
        phone: userData.phone || '',
        points: 500, // 가입 보너스
        total_deliveries: 0,
        total_earnings: 0,
        role: userData.role || 'user',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

    if (profileError) {
      // 프로필 생성 실패 시 Auth 사용자도 삭제
      await supabase.auth.admin.deleteUser(authData.user.id);
      throw profileError;
    }
  } catch (error: any) {
    console.error('사용자 생성 오류:', error);
    if (error.message?.includes('duplicate')) {
      throw new Error('이미 존재하는 이메일입니다.');
    }
    throw error;
  }
};

// 사용자 삭제
export const deleteUser = async (userId: string): Promise<void> => {
  try {
    // 1. users 테이블에서 삭제 (CASCADE로 관련 데이터도 삭제됨)
    const { error: dbError } = await supabase
      .from('users')
      .delete()
      .eq('id', userId);

    if (dbError) throw dbError;

    // 2. Supabase Auth에서도 삭제
    const { error: authError } = await supabase.auth.admin.deleteUser(userId);
    
    if (authError) {
      console.warn('Auth 사용자 삭제 실패:', authError);
      // Auth 삭제 실패해도 계속 진행 (이미 DB에서는 삭제됨)
    }
  } catch (error) {
    console.error('사용자 삭제 오류:', error);
    throw error;
  }
};

// 모든 배달 기록 가져오기
export const getAllDeliveryRecords = async (): Promise<ExtendedDeliveryRecord[]> => {
  try {
    const { data: records, error } = await supabase
      .from('delivery_records')
      .select(`
        *,
        users (
          nickname,
          region
        )
      `);

    if (error) throw error;

    return records.map((record: any) => ({
      id: record.id,
      userId: record.user_id,
      date: record.date,
      amount: record.amount,
      deliveryCount: record.delivery_count,
      platform: record.platform,
      verified: record.verified,
      createdAt: record.created_at,
      updatedAt: record.updated_at,
      userNickname: record.users?.nickname,
      userRegion: record.users?.region,
      imageUrl: record.image_url
    }));
  } catch (error) {
    console.error('배달 기록 가져오기 오류:', error);
    throw error;
  }
};

// 배달 기록 검증
export const verifyDeliveryRecord = async (
  userId: string,
  recordId: string
): Promise<void> => {
  try {
    const { error } = await supabase
      .from('delivery_records')
      .update({
        verified: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', recordId);

    if (error) throw error;
  } catch (error) {
    console.error('배달 기록 검증 오류:', error);
    throw error;
  }
};

// 배달 기록 삭제
export const deleteDeliveryRecord = async (userId: string, recordId: string): Promise<void> => {
  try {
    await supabase
      .from('delivery_records')
      .delete()
      .eq('id', recordId);
  } catch (error) {
    console.error('배달 기록 삭제 오류:', error);
    throw error;
  }
};

// 통계 데이터 가져오기
export const getStatistics = async (timeRange: 'week' | 'month' | 'year'): Promise<Statistics> => {
  try {
    // 먼저 실제 데이터로 통계 계산
    const { data: users } = await supabase.from('users').select('*');
    const { data: records } = await supabase.from('delivery_records').select('*');
    
    const now = new Date();
    const timeAgo = new Date();
    
    if (timeRange === 'week') {
      timeAgo.setDate(now.getDate() - 7);
    } else if (timeRange === 'month') {
      timeAgo.setMonth(now.getMonth() - 1);
    } else {
      timeAgo.setFullYear(now.getFullYear() - 1);
    }
    
    const recentUsers = users?.filter(u => new Date(u.created_at) >= timeAgo) || [];
    const recentRecords = records?.filter(r => new Date(r.created_at) >= timeAgo) || [];
    
    const totalAmount = records?.reduce((sum, r) => sum + (r.amount || 0), 0) || 0;
    const recentAmount = recentRecords.reduce((sum, r) => sum + (r.amount || 0), 0);
    
    // 플랫폼별 통계
    const platformMap = new Map();
    records?.forEach(r => {
      if (!r.platform) return;
      const current = platformMap.get(r.platform) || { platform: r.platform, count: 0, amount: 0 };
      current.count += 1;
      current.amount += r.amount || 0;
      platformMap.set(r.platform, current);
    });
    
    // 지역별 통계
    const regionMap = new Map();
    users?.forEach(u => {
      if (!u.region || u.region === '') return;
      const userRecords = records?.filter(r => r.user_id === u.id) || [];
      const current = regionMap.get(u.region) || { region: u.region, count: 0, amount: 0 };
      current.count += userRecords.length;
      current.amount += userRecords.reduce((sum, r) => sum + (r.amount || 0), 0);
      regionMap.set(u.region, current);
    });
    
    // 트렌드 데이터 (최근 7일)
    const trendData = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const count = records?.filter(r => r.date === dateStr).length || 0;
      trendData.push({
        date: date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' }),
        count
      });
    }
    
    return {
      totalUsers: users?.length || 0,
      userGrowth: users?.length ? Math.round((recentUsers.length / users.length) * 100) : 0,
      totalRecords: records?.length || 0,
      recordGrowth: records?.length ? Math.round((recentRecords.length / records.length) * 100) : 0,
      totalAmount,
      amountGrowth: totalAmount ? Math.round((recentAmount / totalAmount) * 100) : 0,
      fraudCount: 0, // fraud_records 테이블이 없으므로 0
      trendData,
      platformStats: Array.from(platformMap.values()).sort((a, b) => b.count - a.count),
      regionStats: Array.from(regionMap.values()).sort((a, b) => b.amount - a.amount)
    };
  } catch (error) {
    console.error('통계 데이터 가져오기 오류:', error);
    // 기본값 반환
    return {
      totalUsers: 0,
      userGrowth: 0,
      totalRecords: 0,
      recordGrowth: 0,
      totalAmount: 0,
      amountGrowth: 0,
      fraudCount: 0,
      trendData: [],
      platformStats: [],
      regionStats: []
    };
  }
};

// 설정 가져오기
export const getSettings = async (): Promise<Settings> => {
  try {
    const { data: settings, error } = await supabase
      .from('settings')
      .select('*')
      .single();

    if (error) throw error;
    return settings;
  } catch (error) {
    console.error('설정 가져오기 오류:', error);
    throw error;
  }
};

// 설정 업데이트
export const updateSettings = async (settings: Settings): Promise<void> => {
  try {
    const { error } = await supabase
      .from('settings')
      .update(settings)
      .eq('id', 1);

    if (error) throw error;
  } catch (error) {
    console.error('설정 업데이트 오류:', error);
    throw error;
  }
};

// 부정 사용 기록 가져오기
export const getFraudRecords = async (): Promise<FraudRecord[]> => {
  try {
    const { data: fraudRecords, error } = await supabase
      .from('fraud_records')
      .select('*');

    if (error) throw error;

    return fraudRecords.map((record: any) => ({
      ...record,
      amount: parseFloat(record.amount),
      confidence: parseFloat(record.confidence),
      createdAt: new Date(record.created_at),
      updatedAt: record.updated_at ? new Date(record.updated_at) : undefined
    }));
  } catch (error) {
    console.error('부정 사용 기록 가져오기 오류:', error);
    throw error;
  }
};

// 부정 사용 상태 업데이트
export const updateFraudStatus = async (
  recordId: string,
  status: 'pending' | 'confirmed' | 'rejected'
): Promise<void> => {
  try {
    const { error } = await supabase
      .from('fraud_records')
      .update({
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', recordId);

    if (error) throw error;
  } catch (error) {
    console.error('부정 사용 상태 업데이트 오류:', error);
    throw error;
  }
};

// 배달 기록 가져오기 (getDeliveryRecords 별칭)
export const getDeliveryRecords = getAllDeliveryRecords;

// 배달 기록 상태 업데이트
export const updateDeliveryStatus = async (
  recordId: string,
  status: 'pending' | 'verified' | 'rejected'
): Promise<void> => {
  try {
    const verified = status === 'verified';
    const { error } = await supabase
      .from('delivery_records')
      .update({
        verified,
        updated_at: new Date().toISOString()
      })
      .eq('id', recordId);

    if (error) throw error;
  } catch (error) {
    console.error('배달 기록 상태 업데이트 오류:', error);
    throw error;
  }
};

// 사용자 정보 업데이트
export const updateUserData = async (
  userId: string,
  data: {
    todayDeliveries?: number;
    todayEarnings?: number;
    verified?: boolean;
    points?: number;
  }
): Promise<void> => {
  try {
    const updates: any = {
      updated_at: new Date().toISOString()
    };

    if (data.points !== undefined) {
      updates.points = data.points;
    }

    const { error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId);

    if (error) throw error;

    // 오늘의 배달 기록이 있다면 업데이트
    if (data.todayDeliveries !== undefined || data.todayEarnings !== undefined || data.verified !== undefined) {
      const today = new Date().toISOString().split('T')[0];
      
      // 오늘의 배달 기록 찾기
      const { data: existingRecords, error: fetchError } = await supabase
        .from('delivery_records')
        .select('*')
        .eq('user_id', userId)
        .eq('date', today);

      if (fetchError) throw fetchError;

      if (existingRecords && existingRecords.length > 0) {
        // 기존 기록 업데이트
        const recordUpdates: any = {
          updated_at: new Date().toISOString()
        };

        if (data.todayDeliveries !== undefined) {
          recordUpdates.delivery_count = data.todayDeliveries;
        }
        if (data.todayEarnings !== undefined) {
          recordUpdates.amount = data.todayEarnings;
        }
        if (data.verified !== undefined) {
          recordUpdates.verified = data.verified;
        }

        const { error: updateError } = await supabase
          .from('delivery_records')
          .update(recordUpdates)
          .eq('id', existingRecords[0].id);

        if (updateError) throw updateError;
      } else if (data.todayDeliveries !== undefined || data.todayEarnings !== undefined) {
        // 새 기록 생성
        const { error: insertError } = await supabase
          .from('delivery_records')
          .insert({
            user_id: userId,
            date: today,
            delivery_count: data.todayDeliveries || 0,
            amount: data.todayEarnings || 0,
            platform: 'baemin', // 기본값
            verified: data.verified || false,
            created_at: new Date().toISOString()
          });

        if (insertError) throw insertError;
      }
    }
  } catch (error) {
    console.error('사용자 데이터 업데이트 오류:', error);
    throw error;
  }
};

// 사용자 프로필 정보 업데이트
export const updateUserProfile = async (
  userId: string,
  data: {
    nickname?: string;
    region?: string;
    vehicle?: string;
    phone?: string;
  }
): Promise<void> => {
  try {
    const updates: any = {
      updated_at: new Date().toISOString()
    };

    if (data.nickname !== undefined) {
      updates.nickname = data.nickname;
    }
    if (data.region !== undefined) {
      updates.region = data.region;
    }
    if (data.vehicle !== undefined) {
      updates.vehicle = data.vehicle;
    }
    if (data.phone !== undefined) {
      updates.phone = data.phone;
    }

    const { error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId);

    if (error) throw error;
  } catch (error) {
    console.error('사용자 프로필 업데이트 오류:', error);
    throw error;
  }
};

// 오늘의 배달 데이터 가져오기
export const getTodayDeliveryData = async (): Promise<Map<string, { deliveryCount: number; earnings: number; verified: boolean }>> => {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    const { data: records, error } = await supabase
      .from('delivery_records')
      .select('*')
      .eq('date', today);

    if (error) throw error;

    const dataMap = new Map<string, { deliveryCount: number; earnings: number; verified: boolean }>();
    
    records?.forEach(record => {
      dataMap.set(record.user_id, {
        deliveryCount: record.delivery_count || 0,
        earnings: record.amount || 0,
        verified: record.verified || false
      });
    });

    return dataMap;
  } catch (error) {
    console.error('오늘의 배달 데이터 가져오기 오류:', error);
    throw error;
  }
}; 
import { supabase } from '../lib/supabase';

// 임시 타입 정의
interface UserProfile {
  id: string;
  email: string;
  nickname: string;
  profileImage?: string;
  region?: string;
  vehicle?: 'motorcycle' | 'bicycle' | 'car';
  points: number;
  totalDeliveries: number;
  totalEarnings: number;
  createdAt: Date;
  role: 'user' | 'admin';
  phone: string;
  notificationSettings: {
    push: boolean;
    email: boolean;
    sms: boolean;
  };
}

interface DeliveryRecord {
  id: string;
  userId: string;
  date: string;
  amount: number;
  deliveryCount: number;
  platform: string;
  verified: boolean;
  createdAt: Date;
}

// 사용자 정보 가져오기
export const getUser = async (userId: string): Promise<UserProfile | null> => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error || !data) return null;

    return {
      id: data.id,
      email: data.email,
      nickname: data.nickname || '',
      profileImage: data.profile_image || '',
      region: data.region || '',
      vehicle: data.vehicle || 'motorcycle',
      phone: data.phone || '',
      createdAt: new Date(data.created_at),
      points: data.points || 0,
      totalDeliveries: data.total_deliveries || 0,
      totalEarnings: data.total_earnings || 0,
      role: 'user',
      notificationSettings: data.notification_settings || {
        push: true,
        email: false,
        sms: false
      }
    };
  } catch (error) {
    console.error('사용자 정보 가져오기 오류:', error);
    return null;
  }
};

// 사용자 생성
export const createUser = async (userData: {
  id: string;
  email: string;
  nickname: string;
  region: string;
  vehicle: 'motorcycle' | 'bicycle' | 'car';
  phone: string;
}): Promise<UserProfile | null> => {
  try {
    const { data, error } = await supabase
      .from('users')
      .insert({
        id: userData.id,
        username: userData.email,
        email: userData.email,
        nickname: userData.nickname,
        region: userData.region,
        vehicle: userData.vehicle,
        phone: userData.phone,
        points: 0,
        total_deliveries: 0,
        total_earnings: 0
      })
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      email: data.email,
      nickname: data.nickname,
      region: data.region,
      vehicle: data.vehicle,
      phone: data.phone,
      createdAt: new Date(data.created_at),
      points: data.points,
      totalDeliveries: data.total_deliveries,
      totalEarnings: data.total_earnings,
      profileImage: data.profile_image,
      notificationSettings: data.notification_settings || {
        push: true,
        email: false,
        sms: false
      },
      role: 'user'
    };
  } catch (error) {
    console.error('사용자 생성 오류:', error);
    throw error;
  }
};

// 사용자 정보 업데이트
export const updateUser = async (
  userId: string,
  updates: Partial<{
    nickname: string;
    profileImage: string;
    region: string;
    vehicle: 'motorcycle' | 'bicycle' | 'car';
    points: number;
    phone: string;
    notificationSettings: {
      push: boolean;
      email: boolean;
      sms: boolean;
    };
  }>
): Promise<UserProfile | null> => {
  try {
    const { data, error } = await supabase
      .from('users')
      .update({
        nickname: updates.nickname,
        profile_image: updates.profileImage,
        region: updates.region,
        vehicle: updates.vehicle,
        phone: updates.phone,
        notification_settings: updates.notificationSettings,
        points: updates.points
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      email: data.email,
      nickname: data.nickname,
      profileImage: data.profile_image,
      region: data.region,
      vehicle: data.vehicle,
      phone: data.phone,
      createdAt: new Date(data.created_at),
      points: data.points,
      totalDeliveries: data.total_deliveries,
      totalEarnings: data.total_earnings,
      notificationSettings: data.notification_settings,
      role: 'user'
    };
  } catch (error) {
    console.error('사용자 업데이트 오류:', error);
    throw error;
  }
};

// 프로필 업데이트 (별칭)
export const updateUserProfile = updateUser;

// 닉네임으로 사용자 검색
export const searchUsersByNickname = async (nickname: string): Promise<UserProfile[]> => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .ilike('nickname', `%${nickname}%`)
      .limit(10);

    if (error) throw error;

    return data.map(user => ({
      id: user.id,
      email: user.email,
      nickname: user.nickname,
      profileImage: user.profile_image,
      region: user.region,
      vehicle: user.vehicle,
      phone: user.phone,
      createdAt: new Date(user.created_at),
      points: user.points,
      totalDeliveries: user.total_deliveries,
      totalEarnings: user.total_earnings,
      notificationSettings: user.notification_settings,
      role: 'user'
    }));
  } catch (error) {
    console.error('사용자 검색 오류:', error);
    return [];
  }
};

// 사용자 목록 가져오기
export const listUsers = async (
  limit: number = 50,
  nextToken?: string
): Promise<{ users: UserProfile[]; nextToken?: string }> => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    const users = data.map(user => ({
      id: user.id,
      email: user.email,
      nickname: user.nickname,
      profileImage: user.profile_image,
      region: user.region,
      vehicle: user.vehicle,
      phone: user.phone,
      createdAt: new Date(user.created_at),
      points: user.points,
      totalDeliveries: user.total_deliveries,
      totalEarnings: user.total_earnings,
      notificationSettings: user.notification_settings,
      role: 'user' as const
    }));

    return { users };
  } catch (error) {
    console.error('사용자 목록 가져오기 오류:', error);
    return { users: [] };
  }
};

// 사용자 통계 가져오기
export const getUserStats = async (userId: string) => {
  try {
    const user = await getUser(userId);
    return {
      totalDeliveries: user?.totalDeliveries || 0,
      totalEarnings: user?.totalEarnings || 0,
      points: user?.points || 0
    };
  } catch (error) {
    console.error('사용자 통계 가져오기 오류:', error);
    return { totalDeliveries: 0, totalEarnings: 0, points: 0 };
  }
};

// 사용자 삭제
export const deleteUser = async (userId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', userId);

    return !error;
  } catch (error) {
    console.error('사용자 삭제 오류:', error);
    return false;
  }
};

// 배달 기록 추가 (간단 버전)
export const addDeliveryRecord = async (
  userId: string, 
  recordData: Omit<DeliveryRecord, 'id' | 'userId' | 'createdAt'>
): Promise<string> => {
  try {
    const { data, error } = await supabase
      .from('delivery_records')
      .insert({
        user_id: userId,
        date: recordData.date,
        amount: recordData.amount,
        delivery_count: recordData.deliveryCount,
        platform: recordData.platform,
        verified: recordData.verified
      })
      .select()
      .single();

    if (error) throw error;
    return data.id;
  } catch (error) {
    console.error('배달 기록 추가 오류:', error);
    throw error;
  }
};

// 사용자 배달 기록 가져오기
export const getUserDeliveryRecords = async (
  userId: string, 
  limitCount: number = 50
): Promise<DeliveryRecord[]> => {
  try {
    const { data, error } = await supabase
      .from('delivery_records')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .limit(limitCount);

    if (error) throw error;

    return data.map(record => ({
      id: record.id,
      userId: record.user_id,
      date: record.date,
      amount: record.amount,
      deliveryCount: record.delivery_count,
      platform: record.platform,
      verified: record.verified,
      createdAt: new Date(record.created_at)
    }));
  } catch (error) {
    console.error('사용자 배달 기록 가져오기 오류:', error);
    return [];
  }
};

// 날짜별 배달 기록 가져오기
export const getRecordByDate = async (
  userId: string, 
  platform: string, 
  date: string
): Promise<DeliveryRecord | null> => {
  try {
    const { data, error } = await supabase
      .from('delivery_records')
      .select('*')
      .eq('user_id', userId)
      .eq('platform', platform)
      .eq('date', date)
      .single();

    if (error || !data) return null;

    return {
      id: data.id,
      userId: data.user_id,
      date: data.date,
      amount: data.amount,
      deliveryCount: data.delivery_count,
      platform: data.platform,
      verified: data.verified,
      createdAt: new Date(data.created_at)
    };
  } catch (error) {
    console.error('날짜별 배달 기록 가져오기 오류:', error);
    return null;
  }
};

// 배달 기록 업데이트
export const updateDeliveryRecord = async (
  userId: string,
  recordId: string,
  recordData: Partial<DeliveryRecord>
): Promise<void> => {
  try {
    const { error } = await supabase
      .from('delivery_records')
      .update({
        date: recordData.date,
        amount: recordData.amount,
        delivery_count: recordData.deliveryCount,
        platform: recordData.platform,
        verified: recordData.verified
      })
      .eq('id', recordId)
      .eq('user_id', userId);

    if (error) throw error;
  } catch (error) {
    console.error('배달 기록 업데이트 오류:', error);
    throw error;
  }
};

// 배달 기록 삭제
export const deleteDeliveryRecord = async (userId: string, recordId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('delivery_records')
      .delete()
      .eq('id', recordId)
      .eq('user_id', userId);

    if (error) throw error;
  } catch (error) {
    console.error('배달 기록 삭제 오류:', error);
    throw error;
  }
};

// 추천 코드로 사용자 찾기 (임시로 빈 함수)
export const getUserByReferralCode = async (referralCode: string): Promise<UserProfile | null> => {
  console.log('추천 코드 기능은 아직 구현되지 않았습니다:', referralCode);
  return null;
}; 
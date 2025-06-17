import { supabase } from '../lib/supabase';

export interface RankingData {
  userId: string;
  nickname: string;
  region: string;
  totalAmount: number;
  totalOrders: number;
  rank?: number;
  platform?: string;
  bikeType?: string;
}

interface DeliveryRecordWithUser {
  user_id: string;
  amount: number;
  delivery_count: number;
  platform: string;
  users: {
    nickname: string;
    region: string;
  };
}

// 오늘 랭킹 조회
export const getTodayRanking = async (region?: string): Promise<RankingData[]> => {
  try {
    // 인증 상태 확인
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    console.log('🔐 현재 세션 상태:', {
      hasSession: !!sessionData.session,
      user: sessionData.session?.user?.email || 'No user',
      userId: sessionData.session?.user?.id || 'No ID',
      accessToken: sessionData.session?.access_token ? '토큰 있음' : '토큰 없음',
      tokenLength: sessionData.session?.access_token?.length || 0,
      sessionError: sessionError?.message || 'No error',
      fullSessionData: sessionData
    });

    const today = new Date().toISOString().split('T')[0];
    console.log('📅 조회 날짜:', today);
    
    let query = supabase
      .from('delivery_records')
      .select(`
        user_id,
        users!inner(nickname, region),
        amount,
        delivery_count,
        platform
      `)
      .eq('date', today)
      .eq('verified', true);
    
    if (region && region !== 'all') {
      query = query.eq('users.region', region);
      console.log('🌍 지역 필터:', region);
    }

    console.log('🔍 API 요청 시작...');
    const { data, error } = await query;
    
    console.log('📊 API 응답:', {
      dataLength: data?.length || 0,
      error: error?.message || 'No error',
      errorDetails: error,
      errorCode: error?.code
    });

    if (error) {
      // 401 인증 오류인 경우 빈 배열 반환 (로그인 필요 상태)
      if (error.message?.includes('401') || error.code === '401') {
        console.log('⚠️ 인증이 필요합니다. 로그인 후 다시 시도하세요.');
        return [];
      }
      throw error;
    }

    const userStats = new Map<string, RankingData>();
    (data as unknown as DeliveryRecordWithUser[])?.forEach(record => {
      const userId = record.user_id;
      const existing = userStats.get(userId) || {
        userId,
        nickname: record.users.nickname,
        region: record.users.region,
        totalAmount: 0,
        totalOrders: 0,
        platform: record.platform
      };
      existing.totalAmount += record.amount;
      existing.totalOrders += record.delivery_count;
      userStats.set(userId, existing);
    });
    const rankings = Array.from(userStats.values())
      .sort((a, b) => {
        // 금액이 다른 경우 금액순
        if (b.totalAmount !== a.totalAmount) {
          return b.totalAmount - a.totalAmount;
        }
        // 금액이 같은 경우 건수순
        if (b.totalOrders !== a.totalOrders) {
          return b.totalOrders - a.totalOrders;
        }
        // 금액과 건수가 모두 같은 경우 공동 순위 (이름순)
        return a.nickname.localeCompare(b.nickname);
      })
      .reduce((acc: RankingData[], curr, idx, arr) => {
        if (idx === 0) {
          // 첫 번째 항목
          curr.rank = 1;
        } else {
          const prev = arr[idx - 1];
          // 금액과 건수가 모두 같은 경우에만 공동 순위
          if (prev.totalAmount === curr.totalAmount && prev.totalOrders === curr.totalOrders) {
            curr.rank = prev.rank;
          } else {
            curr.rank = idx + 1;
          }
        }
        return [...acc, curr];
      }, []);
    return rankings;
  } catch (error) {
    console.error('오늘 랭킹 조회 오류:', error);
    return [];
  }
};

// 주간 랭킹 조회
export const getWeeklyRanking = async (region?: string): Promise<RankingData[]> => {
  try {
    const today = new Date();
    const weekAgo = new Date(today);
    weekAgo.setDate(today.getDate() - 7);
    let query = supabase
      .from('delivery_records')
      .select(`
        user_id,
        users!inner(nickname, region),
        amount,
        delivery_count,
        platform
      `)
      .gte('date', weekAgo.toISOString().split('T')[0])
      .lte('date', today.toISOString().split('T')[0])
      .eq('verified', true);
    if (region && region !== 'all') {
      query = query.eq('users.region', region);
    }
    const { data, error } = await query;
    if (error) throw error;
    const userStats = new Map<string, RankingData>();
    (data as unknown as DeliveryRecordWithUser[])?.forEach(record => {
      const userId = record.user_id;
      const existing = userStats.get(userId) || {
        userId,
        nickname: record.users.nickname,
        region: record.users.region,
        totalAmount: 0,
        totalOrders: 0,
        platform: record.platform
      };
      existing.totalAmount += record.amount;
      existing.totalOrders += record.delivery_count;
      userStats.set(userId, existing);
    });
    const rankings = Array.from(userStats.values())
      .sort((a, b) => {
        // 금액이 다른 경우 금액순
        if (b.totalAmount !== a.totalAmount) {
          return b.totalAmount - a.totalAmount;
        }
        // 금액이 같은 경우 건수순
        if (b.totalOrders !== a.totalOrders) {
          return b.totalOrders - a.totalOrders;
        }
        // 금액과 건수가 모두 같은 경우 공동 순위 (이름순)
        return a.nickname.localeCompare(b.nickname);
      })
      .reduce((acc: RankingData[], curr, idx, arr) => {
        if (idx === 0) {
          // 첫 번째 항목
          curr.rank = 1;
        } else {
          const prev = arr[idx - 1];
          // 금액과 건수가 모두 같은 경우에만 공동 순위
          if (prev.totalAmount === curr.totalAmount && prev.totalOrders === curr.totalOrders) {
            curr.rank = prev.rank;
          } else {
            curr.rank = idx + 1;
          }
        }
        return [...acc, curr];
      }, []);
    return rankings;
  } catch (error) {
    console.error('주간 랭킹 조회 오류:', error);
    return [];
  }
};

// 월간 랭킹 조회
export const getMonthlyRanking = async (region?: string): Promise<RankingData[]> => {
  try {
    const today = new Date();
    const monthAgo = new Date(today);
    monthAgo.setMonth(today.getMonth() - 1);
    let query = supabase
      .from('delivery_records')
      .select(`
        user_id,
        users!inner(nickname, region),
        amount,
        delivery_count,
        platform
      `)
      .gte('date', monthAgo.toISOString().split('T')[0])
      .lte('date', today.toISOString().split('T')[0])
      .eq('verified', true);
    if (region && region !== 'all') {
      query = query.eq('users.region', region);
    }
    const { data, error } = await query;
    if (error) throw error;
    const userStats = new Map<string, RankingData>();
    (data as unknown as DeliveryRecordWithUser[])?.forEach(record => {
      const userId = record.user_id;
      const existing = userStats.get(userId) || {
        userId,
        nickname: record.users.nickname,
        region: record.users.region,
        totalAmount: 0,
        totalOrders: 0,
        platform: record.platform
      };
      existing.totalAmount += record.amount;
      existing.totalOrders += record.delivery_count;
      userStats.set(userId, existing);
    });
    const rankings = Array.from(userStats.values())
      .sort((a, b) => {
        // 금액이 다른 경우 금액순
        if (b.totalAmount !== a.totalAmount) {
          return b.totalAmount - a.totalAmount;
        }
        // 금액이 같은 경우 건수순
        if (b.totalOrders !== a.totalOrders) {
          return b.totalOrders - a.totalOrders;
        }
        // 금액과 건수가 모두 같은 경우 공동 순위 (이름순)
        return a.nickname.localeCompare(b.nickname);
      })
      .reduce((acc: RankingData[], curr, idx, arr) => {
        if (idx === 0) {
          // 첫 번째 항목
          curr.rank = 1;
        } else {
          const prev = arr[idx - 1];
          // 금액과 건수가 모두 같은 경우에만 공동 순위
          if (prev.totalAmount === curr.totalAmount && prev.totalOrders === curr.totalOrders) {
            curr.rank = prev.rank;
          } else {
            curr.rank = idx + 1;
          }
        }
        return [...acc, curr];
      }, []);
    return rankings;
  } catch (error) {
    console.error('월간 랭킹 조회 오류:', error);
    return [];
  }
};

// 사용자의 현재 랭킹 정보 조회
export const getUserRankingInfo = async (userId: string): Promise<{
  todayRank: number | null;
  weeklyRank: number | null;
  monthlyRank: number | null;
}> => {
  try {
    const [todayRankings, weeklyRankings, monthlyRankings] = await Promise.all([
      getTodayRanking(),
      getWeeklyRanking(),
      getMonthlyRanking()
    ]);

    const todayRank = todayRankings.find(r => r.userId === userId)?.rank || null;
    const weeklyRank = weeklyRankings.find(r => r.userId === userId)?.rank || null;
    const monthlyRank = monthlyRankings.find(r => r.userId === userId)?.rank || null;

    return {
      todayRank,
      weeklyRank,
      monthlyRank
    };
  } catch (error) {
    console.error('사용자 랭킹 정보 조회 오류:', error);
    return {
      todayRank: null,
      weeklyRank: null,
      monthlyRank: null
    };
  }
}; 
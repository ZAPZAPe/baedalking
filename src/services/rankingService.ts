import { supabase } from '../lib/supabase';

export interface RankingData {
  userId: string;
  nickname: string;
  region: string;
  totalAmount: number;
  totalOrders: number;
  rank?: number;
  platform?: string;
  vehicle?: string;
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

// 오늘 랭킹 조회 - 최적화 버전
export const getTodayRanking = async (region?: string): Promise<RankingData[]> => {
  try {
    console.log('🔍 오늘 랭킹 조회 시작');
    console.log('🌍 지역 필터:', region || 'all');
    
    // 환경 변수 직접 확인
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    console.log('🔧 환경 변수 상태:');
    console.log('- URL:', supabaseUrl ? '설정됨' : '누락됨');
    console.log('- Key:', supabaseKey ? `설정됨 (길이: ${supabaseKey.length})` : '누락됨');
    
    // today_rankings_realtime 뷰에서 이미 계산된 랭킹 가져오기
    let query = supabase
      .from('today_rankings_realtime')
      .select('*')
      .order('rank', { ascending: true })
      .limit(100); // 상위 100명만 가져오기
    
    if (region && region !== 'all') {
      query = query.eq('region', region);
    }

    console.log('📤 Supabase 쿼리 실행 중...');
    const { data, error } = await query;

    if (error) {
      console.error('❌ 랭킹 조회 오류:', error);
      console.error('오류 상세:', JSON.stringify(error, null, 2));
      return [];
    }

    console.log('✅ 랭킹 데이터 조회 성공:', data?.length || 0, '개');

    if (!data || data.length === 0) {
      console.log('📊 랭킹 데이터가 없습니다.');
      return [];
    }

    // 뷰에서 가져온 데이터를 RankingData 형식으로 변환
    const result = data
      .filter(row => (row.total_amount || 0) > 0 && (row.total_orders || 0) > 0) // 실제 배달 기록이 있는 사용자만
      .map(row => ({
        userId: row.user_id,
        nickname: row.nickname,
        region: row.region,
        totalAmount: row.total_amount,
        totalOrders: row.total_orders,
        rank: row.rank,
        platform: row.platform
      }));
    
    console.log('🎯 변환된 랭킹 데이터:', result.length, '개');
    
    return result;
  } catch (error) {
    console.error('💥 오늘 랭킹 조회 오류:', error);
    console.error('오류 스택:', (error as Error)?.stack);
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
      .filter(user => user.totalAmount > 0 && user.totalOrders > 0) // 실제 배달 기록이 있는 사용자만
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
      .filter(user => user.totalAmount > 0 && user.totalOrders > 0) // 실제 배달 기록이 있는 사용자만
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

// 플랫폼별 TOP 3 라이더 조회
export const getPlatformTopRankers = async (): Promise<{
  baemin: RankingData[];
  coupang: RankingData[];
}> => {
  try {
    // today_rankings_realtime 뷰에는 platform 컬럼이 없으므로 기본 랭킹 데이터 사용
    const { data, error } = await supabase
      .from('today_rankings_realtime')
      .select('*')
      .order('rank', { ascending: true })
      .limit(50); // 충분한 데이터 가져오기

    if (error) {
      console.error('플랫폼별 랭킹 조회 오류:', error);
      return { baemin: [], coupang: [] };
    }

    if (!data || data.length === 0) {
      return { baemin: [], coupang: [] };
    }

    // 기본 랭킹 데이터를 플랫폼별로 분할 (임시로 홀수/짝수 인덱스로 분할)
    const baeminRankers = data
      .filter((_, index) => index % 2 === 0) // 홀수 인덱스 (0, 2, 4...)
      .slice(0, 3)
      .map(row => ({
        userId: row.user_id,
        nickname: row.nickname,
        region: row.region,
        totalAmount: row.total_amount,
        totalOrders: row.total_orders,
        rank: row.rank,
        platform: '배민커넥트' // 임시로 배민커넥트로 설정
      }));

    const coupangRankers = data
      .filter((_, index) => index % 2 === 1) // 짝수 인덱스 (1, 3, 5...)
      .slice(0, 3)
      .map(row => ({
        userId: row.user_id,
        nickname: row.nickname,
        region: row.region,
        totalAmount: row.total_amount,
        totalOrders: row.total_orders,
        rank: row.rank,
        platform: '쿠팡이츠' // 임시로 쿠팡이츠로 설정
      }));

    return {
      baemin: baeminRankers,
      coupang: coupangRankers
    };
  } catch (error) {
    console.error('플랫폼별 TOP 3 조회 오류:', error);
    return { baemin: [], coupang: [] };
  }
};

const getCurrentSession = async () => {
  const { data: session } = await supabase.auth.getSession();
  return {
    hasSession: !!session?.session,
    user: session?.session?.user?.email || 'No user',
    userId: session?.session?.user?.id || 'No ID',
    accessToken: session?.session?.access_token ? '토큰 있음' : '토큰 없음',
    tokenLength: session?.session?.access_token?.length || 0,
  };
};

const fetchRankings = async (date: string) => {
  try {
    const response = await fetch(`/api/rankings?date=${date}`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('랭킹 데이터 조회 중 오류:', error);
    return { dataLength: 0, error: 'Error', errorDetails: error };
  }
}; 
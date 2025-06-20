import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// 디버깅을 위한 로그 추가
console.log('🔧 Supabase 설정 확인:');
console.log('URL:', supabaseUrl ? '✅ 설정됨' : '❌ 누락됨');
console.log('ANON_KEY:', supabaseAnonKey ? `✅ 설정됨 (길이: ${supabaseAnonKey.length})` : '❌ 누락됨');

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️ Supabase 환경 변수가 설정되지 않았습니다. NEXT_PUBLIC_SUPABASE_URL과 NEXT_PUBLIC_SUPABASE_ANON_KEY를 확인하세요.')
}

// 타임아웃이 있는 fetch 함수
const fetchWithTimeout = (timeout = 10000) => {
  return async (input: RequestInfo | URL, options?: RequestInit) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    try {
      const response = await fetch(input, {
        ...options,
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          ...options?.headers
        }
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error: any) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error('Request timeout');
      }
      throw error;
    }
  };
};

// 빈 문자열이라도 createClient는 호출하여 빌드가 실패하지 않도록 함
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    storageKey: 'baedalking-auth',
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce', // PKCE 플로우 사용
    debug: process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_SUPABASE_DEBUG === 'true'
  },
  global: {
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'apikey': supabaseAnonKey || 'placeholder-key'
    },
    fetch: fetchWithTimeout(10000) // 10초 타임아웃 설정
  },
  db: {
    schema: 'public'
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
})

// 세션 정리 유틸리티 함수
export const clearOldSession = () => {
  if (typeof window !== 'undefined') {
    // 오래된 세션 데이터 정리
    const storageKeys = ['supabase.auth.token', 'sb-auth-token', 'baedalking-auth'];
    storageKeys.forEach(key => {
      try {
        const item = localStorage.getItem(key);
        if (item) {
          const data = JSON.parse(item);
          // 만료된 토큰이면 삭제
          if (data.expires_at && new Date(data.expires_at * 1000) < new Date()) {
            localStorage.removeItem(key);
            console.log('오래된 세션 삭제:', key);
          }
        }
      } catch (e) {
        // 파싱 에러 시 삭제
        localStorage.removeItem(key);
        console.log('손상된 세션 삭제:', key);
      }
    });
  }
};

// 데이터베이스 타입 정의
export interface User {
  id: string
  username: string
  email: string
  nickname?: string
  region?: string
  vehicle?: string
  phone?: string
  points: number
  total_deliveries: number
  total_earnings: number
  profile_image?: string
  referral_code?: string
  created_at: string
  updated_at: string
}

export interface DeliveryRecord {
  id: string
  user_id: string
  date: string
  amount: number
  delivery_count: number
  platform: string
  verified: boolean
  created_at: string
  updated_at: string
}

export interface FriendRequest {
  id: string
  from_user_id: string
  to_user_id: string
  status: string
  created_at: string
  updated_at: string
}

export interface Ranking {
  id: string
  user_id: string
  nickname: string
  region: string
  total_earnings: number
  total_deliveries: number
  rank_type: string
  date: string
  rank: number
  created_at: string
  updated_at: string
}

export interface PointHistory {
  id: string
  user_id: string
  points: number
  reason: string
  created_at: string
  updated_at: string
} 
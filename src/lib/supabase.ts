import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️ Supabase 환경 변수가 설정되지 않았습니다. NEXT_PUBLIC_SUPABASE_URL과 NEXT_PUBLIC_SUPABASE_ANON_KEY를 확인하세요.')
}

// 빈 문자열이라도 createClient는 호출하여 빌드가 실패하지 않도록 함
export const supabase = createClient(supabaseUrl || 'https://placeholder.supabase.co', supabaseAnonKey || 'placeholder-key', {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    // 세션 스토리지를 sessionStorage로 변경하여 브라우저 종료 시 자동으로 클리어
    storage: typeof window !== 'undefined' ? window.sessionStorage : undefined,
    // 디버그 모드 활성화 (개발 환경에서만)
    debug: process.env.NODE_ENV === 'development',
    // 토큰 갱신 타임아웃 설정 (5초)
    storageKey: 'baedalking-auth',
  },
  global: {
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'apikey': supabaseAnonKey || 'placeholder-key'
    },
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
import { createClient } from '@supabase/supabase-js'
import fetch from 'node-fetch'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase URL과 Anon Key가 설정되지 않았습니다.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  },
  global: {
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'apikey': supabaseAnonKey
    },
  }
})

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
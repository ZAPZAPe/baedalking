import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// 데이터베이스 테이블 타입 정의
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          nickname: string
          region: string
          avatar_config: any
          garage_config: any
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          nickname: string
          region: string
          avatar_config?: any
          garage_config?: any
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          nickname?: string
          region?: string
          avatar_config?: any
          garage_config?: any
          created_at?: string
          updated_at?: string
        }
      }
      earnings: {
        Row: {
          id: string
          user_id: string
          amount: number
          date: string
          screenshot_url: string
          verified: boolean
          points_awarded: number
          screenshot_text: string
          verified_score: number
          source: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          amount: number
          date: string
          screenshot_url: string
          verified?: boolean
          points_awarded?: number
          screenshot_text?: string
          verified_score?: number
          source?: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          amount?: number
          date?: string
          screenshot_url?: string
          verified?: boolean
          points_awarded?: number
          screenshot_text?: string
          verified_score?: number
          source?: string
          created_at?: string
        }
      }
      points: {
        Row: {
          id: string
          user_id: string
          amount: number
          type: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          amount: number
          type: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          amount?: number
          type?: string
          created_at?: string
        }
      }
      items: {
        Row: {
          id: string
          name: string
          type: string
          asset_url: string
          price: number
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          type: string
          asset_url: string
          price: number
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          type?: string
          asset_url?: string
          price?: number
          created_at?: string
        }
      }
      user_items: {
        Row: {
          id: string
          user_id: string
          item_id: string
          equipped: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          item_id: string
          equipped?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          item_id?: string
          equipped?: boolean
          created_at?: string
        }
      }
      friends: {
        Row: {
          id: string
          user_id: string
          friend_id: string
          status: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          friend_id: string
          status?: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          friend_id?: string
          status?: string
          created_at?: string
        }
      }
      visits: {
        Row: {
          id: string
          user_id: string
          visited_user_id: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          visited_user_id: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          visited_user_id?: string
          created_at?: string
        }
      }
    }
  }
}

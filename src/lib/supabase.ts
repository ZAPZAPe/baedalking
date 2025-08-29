import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// 환경 변수 확인
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다!')
  console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl)
  console.error('NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseAnonKey ? '설정됨' : '설정되지 않음')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// 연결 테스트 함수
export async function testSupabaseConnection() {
  try {
    const { data, error } = await supabase.from('users').select('count').limit(1)
    if (error) {
      console.error('❌ Supabase 연결 실패:', error.message)
      return false
    }
    console.log('✅ Supabase 연결 성공!')
    return true
  } catch (err) {
    console.error('❌ Supabase 연결 오류:', err)
    return false
  }
}

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

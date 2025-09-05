import { createClient } from '@supabase/supabase-js'

// 환경 변수에서 설정 가져오기 (로컬 개발 시 기본값 사용)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'

// 환경 변수 확인


export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  global: {
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
  },
})

// 서버 사이드 Supabase 클라이언트 생성 함수
export function createServerSupabaseClient() {
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    },
  })
}

// 연결 테스트 함수
export async function testSupabaseConnection() {
  try {
    const { data, error } = await supabase.from('users').select('count', { count: 'exact', head: true })
    if (error) {
      console.error('❌ Supabase 연결 실패:', error.message)
      return false
    }

    return true
  } catch (err) {
    console.error('❌ Supabase 연결 오류:', err)
    return false
  }
}

// 🎯 새로운 데이터베이스 타입 정의 (완전 재구성)
export interface Database {
  public: {
    Tables: {
      // 사용자 테이블
      users: {
        Row: {
          id: string
          kakao_id: string
          email: string
          nickname: string
          region: string
          avatar_config: any
          garage_config: any
          platforms: any
          goals: any
          status_message: string
          is_income_private: boolean
          total_visitors: number
          daily_visitors: number
          created_at: string
          updated_at: string
          last_login: string | null
        }
        Insert: {
          id?: string
          kakao_id: string
          email: string
          nickname: string
          region?: string
          avatar_config?: any
          garage_config?: any
          platforms?: any
          goals?: any
          status_message?: string
          is_income_private?: boolean
          total_visitors?: number
          daily_visitors?: number
          created_at?: string
          updated_at?: string
          last_login?: string | null
        }
        Update: {
          id?: string
          kakao_id?: string
          email?: string
          nickname?: string
          region?: string
          avatar_config?: any
          garage_config?: any
          platforms?: any
          goals?: any
          status_message?: string
          is_income_private?: boolean
          total_visitors?: number
          daily_visitors?: number
          created_at?: string
          updated_at?: string
          last_login?: string | null
        }
      }
      
      // 수입 기록 테이블
      earnings: {
        Row: {
          id: string
          user_id: string
          platform: string
          delivery_count: number
          delivery_amount: number
          mission_amount: number
          total_amount: number
          date: string
          screenshot_url: string
          screenshot_text: string
          verified: boolean
          verified_score: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          platform: string
          delivery_count: number
          delivery_amount: number
          mission_amount: number
          date: string
          screenshot_url?: string
          screenshot_text?: string
          verified?: boolean
          verified_score?: number
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          platform?: string
          delivery_count?: number
          delivery_amount?: number
          mission_amount?: number
          date?: string
          screenshot_url?: string
          screenshot_text?: string
          verified?: boolean
          verified_score?: number
          created_at?: string
        }
      }
      
      // 박스 거래 테이블
      box_transactions: {
        Row: {
          id: string
          user_id: string
          amount: number
          type: 'earn' | 'spend'
          reason: string
          related_earning_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          amount: number
          type: 'earn' | 'spend'
          reason?: string
          related_earning_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          amount?: number
          type?: 'earn' | 'spend'
          reason?: string
          related_earning_id?: string | null
          created_at?: string
        }
      }
      
      // 꾸미기 아이템 테이블
      decoration_items: {
        Row: {
          id: string
          name: string
          description: string
          image_url: string
          category: string
          price: number
          anchor: any
          grid_data: any
          is_admin_only: boolean
          is_active: boolean
          created_at: string
          updated_at: string
          created_by: string | null
        }
        Insert: {
          id?: string
          name: string
          description?: string
          image_url: string
          category?: string
          price?: number
          anchor?: any
          grid_data?: any
          is_admin_only?: boolean
          is_active?: boolean
          created_at?: string
          updated_at?: string
          created_by?: string | null
        }
        Update: {
          id?: string
          name?: string
          description?: string
          image_url?: string
          category?: string
          price?: number
          anchor?: any
          grid_data?: any
          is_admin_only?: boolean
          is_active?: boolean
          created_at?: string
          updated_at?: string
          created_by?: string | null
        }
      }
      
      // 사용자 인벤토리 테이블
      user_inventory: {
        Row: {
          id: string
          user_id: string
          item_id: string
          quantity: number
          purchased_at: string
        }
        Insert: {
          id?: string
          user_id: string
          item_id: string
          quantity?: number
          purchased_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          item_id?: string
          quantity?: number
          purchased_at?: string
        }
      }
      
      // 차고 배치 테이블
      garage_placements: {
        Row: {
          id: string
          user_id: string
          item_id: string
          position_x: number
          position_y: number
          position_z: number
          placed_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          item_id: string
          position_x?: number
          position_y?: number
          position_z?: number
          placed_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          item_id?: string
          position_x?: number
          position_y?: number
          position_z?: number
          placed_at?: string
          updated_at?: string
        }
      }
      
      // 바닥 타일 설정 테이블
      floor_tile_settings: {
        Row: {
          id: string
          user_id: string
          tile_type: string
          pattern: string
          light_color: number
          dark_color: number
          opacity: number
          scale: number
          custom_image_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          tile_type?: string
          pattern?: string
          light_color?: number
          dark_color?: number
          opacity?: number
          scale?: number
          custom_image_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          tile_type?: string
          pattern?: string
          light_color?: number
          dark_color?: number
          opacity?: number
          scale?: number
          custom_image_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      
      // 친구 관계 테이블
      friendships: {
        Row: {
          id: string
          user_id: string
          friend_id: string
          status: 'pending' | 'accepted' | 'rejected'
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          friend_id: string
          status?: 'pending' | 'accepted' | 'rejected'
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          friend_id?: string
          status?: 'pending' | 'accepted' | 'rejected'
          created_at?: string
        }
      }
      
      // 방명록 테이블
      guestbook_entries: {
        Row: {
          id: string
          user_id: string
          visitor_id: string
          message: string
          is_private: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          visitor_id: string
          message: string
          is_private?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          visitor_id?: string
          message?: string
          is_private?: boolean
          created_at?: string
        }
      }
      
      // 방문 기록 테이블
      visits: {
        Row: {
          id: string
          visitor_id: string
          visited_user_id: string
          created_at: string
        }
        Insert: {
          id?: string
          visitor_id: string
          visited_user_id: string
          created_at?: string
        }
        Update: {
          id?: string
          visitor_id?: string
          visited_user_id?: string
          created_at?: string
        }
      }
      
      // 캐릭터 데이터 테이블
      character_data: {
        Row: {
          id: string
          user_id: string
          parts: any
          position: any
          is_visible: boolean
          image_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          parts?: any
          position?: any
          is_visible?: boolean
          image_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          parts?: any
          position?: any
          is_visible?: boolean
          image_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
    
    // 뷰 타입 정의
    Views: {
      user_inventory_detailed: {
        Row: {
          id: string
          user_id: string
          item_id: string
          quantity: number
          purchased_at: string
          item_name: string
          item_description: string
          item_image_url: string
          item_category: string
          item_price: number
          item_anchor: any
          item_grid_data: any
        }
      }
      garage_placements_detailed: {
        Row: {
          id: string
          user_id: string
          item_id: string
          position_x: number
          position_y: number
          position_z: number
          placed_at: string
          updated_at: string
          item_name: string
          item_description: string
          item_image_url: string
          item_category: string
          item_anchor: any
          item_grid_data: any
        }
      }
      user_earnings_summary: {
        Row: {
          user_id: string
          total_earnings_count: number
          total_earnings_amount: number
          total_delivery_count: number
          avg_earnings_amount: number
          last_earning_date: string
          first_earning_date: string
        }
      }
    }
    
    // 함수 타입 정의
    Functions: {
      save_earning_with_boxes: {
        Args: {
          p_user_id: string
          p_platform: string
          p_delivery_count: number
          p_delivery_amount: number
          p_mission_amount: number
          p_date: string
        }
        Returns: any
      }
      purchase_item: {
        Args: {
          p_user_id: string
          p_item_id: string
          p_quantity?: number
        }
        Returns: any
      }
      place_item: {
        Args: {
          p_user_id: string
          p_item_id: string
          p_position_x: number
          p_position_y: number
          p_position_z: number
        }
        Returns: any
      }
      remove_item: {
        Args: {
          p_user_id: string
          p_placement_id: string
        }
        Returns: any
      }
      get_user_boxes: {
        Args: {
          p_user_id: string
        }
        Returns: number
      }
    }
  }
}

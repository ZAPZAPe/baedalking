import { supabase } from './supabase'
import type { Database } from './supabase'

type User = Database['public']['Tables']['users']['Row']
type UserInsert = Database['public']['Tables']['users']['Insert']
type UserUpdate = Database['public']['Tables']['users']['Update']

type Earnings = Database['public']['Tables']['earnings']['Row']
type EarningsInsert = Database['public']['Tables']['earnings']['Insert']
type EarningsUpdate = Database['public']['Tables']['earnings']['Update']

type BoxTransactions = Database['public']['Tables']['box_transactions']['Row']
type BoxTransactionsInsert = Database['public']['Tables']['box_transactions']['Insert']

type DecorationItems = Database['public']['Tables']['decoration_items']['Row']
type UserInventory = Database['public']['Tables']['user_inventory']['Row']
type UserInventoryInsert = Database['public']['Tables']['user_inventory']['Insert']

type Friendships = Database['public']['Tables']['friendships']['Row']
type FriendshipsInsert = Database['public']['Tables']['friendships']['Insert']
type FriendshipsUpdate = Database['public']['Tables']['friendships']['Update']

type Visits = Database['public']['Tables']['visits']['Row']
type VisitsInsert = Database['public']['Tables']['visits']['Insert']

// ===== 사용자 관련 함수 =====

export async function createUser(userData: UserInsert): Promise<User | null> {
  try {
    const { data, error } = await supabase
      .from('users')
      .insert(userData)
      .select()
      .single()

    if (error) {
      console.error('사용자 생성 오류:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('사용자 생성 예외:', error)
    return null
  }
}

export async function getUserById(userId: string): Promise<User | null> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) {
      console.error('사용자 조회 오류:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('사용자 조회 예외:', error)
    return null
  }
}

export async function getUserByEmail(email: string): Promise<User | null> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single()

    if (error) {
      console.error('이메일로 사용자 조회 오류:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('이메일로 사용자 조회 예외:', error)
    return null
  }
}

export async function updateUser(userId: string, updates: UserUpdate): Promise<User | null> {
  try {
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select()
      .single()

    if (error) {
      console.error('사용자 업데이트 오류:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('사용자 업데이트 예외:', error)
    return null
  }
}

// ===== 수입 관련 함수 =====

export async function createEarnings(earningsData: EarningsInsert): Promise<Earnings | null> {
  try {
    const { data, error } = await supabase
      .from('earnings')
      .insert(earningsData)
      .select()
      .single()

    if (error) {
      console.error('수입 기록 생성 오류:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('수입 기록 생성 예외:', error)
    return null
  }
}

export async function getUserEarnings(userId: string, startDate?: string, endDate?: string): Promise<Earnings[]> {
  try {
    let query = supabase
      .from('earnings')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false })

    if (startDate) {
      query = query.gte('date', startDate)
    }
    if (endDate) {
      query = query.lte('date', endDate)
    }

    const { data, error } = await query

    if (error) {
      console.error('사용자 수입 조회 오류:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('사용자 수입 조회 예외:', error)
    return []
  }
}

export async function updateEarnings(earningsId: string, updates: EarningsUpdate): Promise<Earnings | null> {
  try {
    const { data, error } = await supabase
      .from('earnings')
      .update(updates)
      .eq('id', earningsId)
      .select()
      .single()

    if (error) {
      console.error('수입 기록 업데이트 오류:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('수입 기록 업데이트 예외:', error)
    return null
  }
}

// ===== 박스 관련 함수 =====

export async function addBoxes(userId: string, amount: number, type: 'earn' | 'spend'): Promise<BoxTransactions | null> {
  try {
    const boxesData: BoxTransactionsInsert = {
      user_id: userId,
      amount: amount,
      type: type
    }

    const { data, error } = await supabase
      .from('boxes')
      .insert(boxesData)
      .select()
      .single()

    if (error) {
      console.error('박스 추가 오류:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('박스 추가 예외:', error)
    return null
  }
}

export async function getUserBoxes(userId: string): Promise<number> {
  try {
    const { data, error } = await supabase
      .from('boxes')
      .select('amount, type')
      .eq('user_id', userId)

    if (error) {
      console.error('사용자 박스 조회 오류:', error)
      return 0
    }

    if (!data) return 0

    const totalBoxes = data.reduce((total, box) => {
      return box.type === 'earn' ? total + box.amount : total - box.amount
    }, 0)

    return Math.max(0, totalBoxes)
  } catch (error) {
    console.error('사용자 박스 조회 예외:', error)
    return 0
  }
}

// ===== 아이템 관련 함수 =====

export async function getAvailableItems(): Promise<DecorationItems[]> {
  try {
    const { data, error } = await supabase
      .from('decoration_items')
      .select('*')
      .order('price', { ascending: true })

    if (error) {
      console.error('사용 가능한 아이템 조회 오류:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('사용 가능한 아이템 조회 예외:', error)
    return []
  }
}

export async function getUserItems(userId: string): Promise<UserInventory[]> {
  try {
    const { data, error } = await supabase
      .from('user_inventory')
      .select(`
        *,
        items (*)
      `)
      .eq('user_id', userId)

    if (error) {
      console.error('사용자 아이템 조회 오류:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('사용자 아이템 조회 예외:', error)
    return []
  }
}

export async function purchaseItem(userId: string, itemId: string): Promise<UserInventory | null> {
  try {
    // 아이템 가격 확인
    const { data: item, error: itemError } = await supabase
      .from('decoration_items')
      .select('price')
      .eq('id', itemId)
      .single()

    if (itemError || !item) {
      console.error('아이템 조회 오류:', itemError)
      return null
    }

    // 사용자 박스 확인
    const userBoxes = await getUserBoxes(userId)
    if (userBoxes < item.price) {
      console.error('박스 부족')
      return null
    }

    // 트랜잭션 시작
    const { data: userItem, error: purchaseError } = await supabase
      .from('user_inventory')
      .insert({
        user_id: userId,
        item_id: itemId,
        equipped: false
      })
      .select()
      .single()

    if (purchaseError) {
      console.error('아이템 구매 오류:', purchaseError)
      return null
    }

    // 박스 차감
    await addBoxes(userId, item.price, 'spend')

    return userItem
  } catch (error) {
    console.error('아이템 구매 예외:', error)
    return null
  }
}

// ===== 친구 관련 함수 =====

export async function sendFriendRequest(userId: string, friendId: string): Promise<Friendships | null> {
  try {
    const { data, error } = await supabase
      .from('friendships')
      .insert({
        user_id: userId,
        friend_id: friendId,
        status: 'pending'
      })
      .select()
      .single()

    if (error) {
      console.error('친구 요청 전송 오류:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('친구 요청 전송 예외:', error)
    return null
  }
}

export async function getFriendRequests(userId: string): Promise<Friendships[]> {
  try {
    const { data, error } = await supabase
      .from('friendships')
      .select(`
        *,
        users!friends_user_id_fkey (*)
      `)
      .eq('friend_id', userId)
      .eq('status', 'pending')

    if (error) {
      console.error('친구 요청 조회 오류:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('친구 요청 조회 예외:', error)
    return []
  }
}

export async function acceptFriendRequest(requestId: string): Promise<Friendships | null> {
  try {
    const { data, error } = await supabase
      .from('friendships')
      .update({ status: 'accepted' })
      .eq('id', requestId)
      .select()
      .single()

    if (error) {
      console.error('친구 요청 수락 오류:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('친구 요청 수락 예외:', error)
    return null
  }
}

export async function rejectFriendRequest(requestId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('friendships')
      .delete()
      .eq('id', requestId)

    if (error) {
      console.error('친구 요청 거절 오류:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('친구 요청 거절 예외:', error)
    return false
  }
}

export async function getUserFriends(userId: string): Promise<Friendships[]> {
  try {
    const { data, error } = await supabase
      .from('friendships')
      .select(`
        *,
        users!friends_friend_id_fkey (*)
      `)
      .eq('user_id', userId)
      .eq('status', 'accepted')

    if (error) {
      console.error('사용자 친구 조회 오류:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('사용자 친구 조회 예외:', error)
    return []
  }
}

// ===== 방문 관련 함수 =====

export async function recordVisit(visitorId: string, visitedUserId: string): Promise<Visits | null> {
  try {
    const { data, error } = await supabase
      .from('visits')
      .insert({
        user_id: visitorId,
        visited_user_id: visitedUserId
      })
      .select()
      .single()

    if (error) {
      console.error('방문 기록 생성 오류:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('방문 기록 생성 예외:', error)
    return null
  }
}

export async function getUserVisits(userId: string): Promise<Visits[]> {
  try {
    const { data, error } = await supabase
      .from('visits')
      .select(`
        *,
        users!visits_user_id_fkey (*)
      `)
      .eq('visited_user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('사용자 방문 기록 조회 오류:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('사용자 방문 기록 조회 예외:', error)
    return []
  }
}

/**
 * 바닥 타일 설정 관련 함수들
 */

/**
 * 사용자의 바닥 타일 설정을 데이터베이스에서 로드
 */
export async function loadFloorTileSettings(userId: string): Promise<any> {
  try {
    const { data, error } = await supabase
      .from('floor_tile_settings')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        // 설정이 없는 경우 기본값 반환
        return {
          type: 'default',
          pattern: 'checkerboard',
          lightColor: 0xD2B48C,
          darkColor: 0xA0522D,
          opacity: 0.8,
          scale: 1.0
        }
      }
      throw error
    }

    // 데이터베이스 형식을 프론트엔드 형식으로 변환
    return {
      type: data.tile_type,
      pattern: data.pattern,
      lightColor: data.light_color,
      darkColor: data.dark_color,
      opacity: data.opacity,
      scale: data.scale,
      imageUrl: data.custom_image_url
    }
  } catch (error) {
    console.error('바닥 타일 설정 로드 실패:', error)
    // 에러 시 기본값 반환
    return {
      type: 'default',
      pattern: 'checkerboard',
      lightColor: 0xD2B48C,
      darkColor: 0xA0522D,
      opacity: 0.8,
      scale: 1.0
    }
  }
}

/**
 * 사용자의 바닥 타일 설정을 데이터베이스에 저장
 */
export async function saveFloorTileSettings(userId: string, config: any): Promise<boolean> {
  try {
    // 프론트엔드 형식을 데이터베이스 형식으로 변환
    const dbConfig = {
      user_id: userId,
      tile_type: config.type,
      pattern: config.pattern,
      light_color: config.lightColor,
      dark_color: config.darkColor,
      opacity: config.opacity,
      scale: config.scale,
      custom_image_url: config.imageUrl || null
    }

    const { error } = await supabase
      .from('floor_tile_settings')
      .upsert(dbConfig, { onConflict: 'user_id' })

    if (error) {
      throw error
    }

    console.log('💾 바닥 타일 설정 저장 완료:', config)
    return true
  } catch (error) {
    console.error('바닥 타일 설정 저장 실패:', error)
    return false
  }
}

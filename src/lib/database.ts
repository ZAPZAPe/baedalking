import { supabase } from './supabase'
import type { Database } from './supabase'

type User = Database['public']['Tables']['users']['Row']
type UserInsert = Database['public']['Tables']['users']['Insert']
type UserUpdate = Database['public']['Tables']['users']['Update']

type Earnings = Database['public']['Tables']['earnings']['Row']
type EarningsInsert = Database['public']['Tables']['earnings']['Insert']
type EarningsUpdate = Database['public']['Tables']['earnings']['Update']

type Points = Database['public']['Tables']['points']['Row']
type PointsInsert = Database['public']['Tables']['points']['Insert']

type Items = Database['public']['Tables']['items']['Row']
type UserItems = Database['public']['Tables']['user_items']['Row']
type UserItemsInsert = Database['public']['Tables']['user_items']['Insert']

type Friends = Database['public']['Tables']['friends']['Row']
type FriendsInsert = Database['public']['Tables']['friends']['Insert']
type FriendsUpdate = Database['public']['Tables']['friends']['Update']

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

// ===== 포인트 관련 함수 =====

export async function addPoints(userId: string, amount: number, type: 'earn' | 'spend'): Promise<Points | null> {
  try {
    const pointsData: PointsInsert = {
      user_id: userId,
      amount: amount,
      type: type
    }

    const { data, error } = await supabase
      .from('points')
      .insert(pointsData)
      .select()
      .single()

    if (error) {
      console.error('포인트 추가 오류:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('포인트 추가 예외:', error)
    return null
  }
}

export async function getUserPoints(userId: string): Promise<number> {
  try {
    const { data, error } = await supabase
      .from('points')
      .select('amount, type')
      .eq('user_id', userId)

    if (error) {
      console.error('사용자 포인트 조회 오류:', error)
      return 0
    }

    if (!data) return 0

    const totalPoints = data.reduce((total, point) => {
      return point.type === 'earn' ? total + point.amount : total - point.amount
    }, 0)

    return Math.max(0, totalPoints)
  } catch (error) {
    console.error('사용자 포인트 조회 예외:', error)
    return 0
  }
}

// ===== 아이템 관련 함수 =====

export async function getAvailableItems(): Promise<Items[]> {
  try {
    const { data, error } = await supabase
      .from('items')
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

export async function getUserItems(userId: string): Promise<UserItems[]> {
  try {
    const { data, error } = await supabase
      .from('user_items')
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

export async function purchaseItem(userId: string, itemId: string): Promise<UserItems | null> {
  try {
    // 아이템 가격 확인
    const { data: item, error: itemError } = await supabase
      .from('items')
      .select('price')
      .eq('id', itemId)
      .single()

    if (itemError || !item) {
      console.error('아이템 조회 오류:', itemError)
      return null
    }

    // 사용자 포인트 확인
    const userPoints = await getUserPoints(userId)
    if (userPoints < item.price) {
      console.error('포인트 부족')
      return null
    }

    // 트랜잭션 시작
    const { data: userItem, error: purchaseError } = await supabase
      .from('user_items')
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

    // 포인트 차감
    await addPoints(userId, item.price, 'spend')

    return userItem
  } catch (error) {
    console.error('아이템 구매 예외:', error)
    return null
  }
}

// ===== 친구 관련 함수 =====

export async function sendFriendRequest(userId: string, friendId: string): Promise<Friends | null> {
  try {
    const { data, error } = await supabase
      .from('friends')
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

export async function getFriendRequests(userId: string): Promise<Friends[]> {
  try {
    const { data, error } = await supabase
      .from('friends')
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

export async function acceptFriendRequest(requestId: string): Promise<Friends | null> {
  try {
    const { data, error } = await supabase
      .from('friends')
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
      .from('friends')
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

export async function getUserFriends(userId: string): Promise<Friends[]> {
  try {
    const { data, error } = await supabase
      .from('friends')
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

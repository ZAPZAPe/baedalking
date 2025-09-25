import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// prerender 방지를 위한 설정
export const dynamic = 'force-dynamic'

// 사용자 검색
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')
    const currentUserId = searchParams.get('currentUserId')
    const limit = parseInt(searchParams.get('limit') || '20')

    if (!query || query.trim().length < 2) {
      return NextResponse.json(
        { error: '검색어는 최소 2글자 이상이어야 합니다.' },
        { status: 400 }
      )
    }

    if (!currentUserId) {
      return NextResponse.json(
        { error: '현재 사용자 ID가 필요합니다.' },
        { status: 400 }
      )
    }

    // 사용자 검색 (닉네임 또는 지역으로 검색)
    const { data: users, error } = await supabase
      .from('users')
      .select('id, nickname, region, created_at')
      .or(`nickname.ilike.%${query}%,region.ilike.%${query}%`)
      .neq('id', currentUserId) // 본인 제외
      .limit(limit)
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json(
        { error: '사용자 검색에 실패했습니다.' },
        { status: 500 }
      )
    }

    // 각 사용자와의 친구 상태 확인
    const userIds = users?.map(user => user.id) || []
    let friendships: any[] = []

    if (userIds.length > 0) {
      const { data: friendshipData, error: friendshipError } = await supabase
        .from('friends')
        .select('user_id, friend_id, status')
        .or(
          `and(user_id.eq.${currentUserId},friend_id.in.(${userIds.join(',')})),` +
          `and(user_id.in.(${userIds.join(',')}),friend_id.eq.${currentUserId})`
        )

      if (!friendshipError) {
        friendships = friendshipData || []
      }
    }

    // 사용자 정보에 친구 상태 추가
    const usersWithFriendStatus = users?.map(user => {
      // 현재 사용자가 요청한 친구 관계 찾기
      const sentRequest = friendships.find(f => 
        f.user_id === currentUserId && f.friend_id === user.id
      )
      
      // 상대방이 요청한 친구 관계 찾기
      const receivedRequest = friendships.find(f => 
        f.user_id === user.id && f.friend_id === currentUserId
      )

      let friendStatus = 'none' // none, pending_sent, pending_received, accepted
      
      if (sentRequest) {
        friendStatus = sentRequest.status === 'accepted' ? 'accepted' : 'pending_sent'
      } else if (receivedRequest) {
        friendStatus = receivedRequest.status === 'accepted' ? 'accepted' : 'pending_received'
      }

      return {
        id: user.id,
        nickname: user.nickname,
        region: user.region,
        friendStatus,
        memberSince: user.created_at
      }
    }) || []

    return NextResponse.json({ 
      users: usersWithFriendStatus,
      total: usersWithFriendStatus.length
    })

  } catch (error) {
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

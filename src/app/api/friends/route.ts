import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// prerender 방지를 위한 설정
export const dynamic = 'force-dynamic'

// 친구 목록 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const status = searchParams.get('status') || 'accepted'

    if (!userId) {
      return NextResponse.json(
        { error: '사용자 ID가 필요합니다.' },
        { status: 400 }
      )
    }

    // 친구 목록 조회 (양방향)
    const { data: friends, error } = await supabase
      .from('friendships')
      .select(`
        id,
        status,
        created_at,
        user:user_id (
          id,
          nickname,
          region,
          avatar_config
        ),
        friend:friend_id (
          id,
          nickname,
          region,
          avatar_config
        )
      `)
      .or(`user_id.eq.${userId},friend_id.eq.${userId}`)
      .eq('status', status)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('친구 목록 조회 오류:', error)
      return NextResponse.json(
        { error: '친구 목록을 불러오는데 실패했습니다.' },
        { status: 500 }
      )
    }

    // 친구 정보 정리 (본인이 아닌 상대방 정보만 반환)
    const friendsList = friends?.map(friendship => {
      const userInfo = Array.isArray(friendship.user) ? friendship.user[0] : friendship.user
      const friendInfo = Array.isArray(friendship.friend) ? friendship.friend[0] : friendship.friend
      const isRequester = userInfo?.id === userId
      const targetInfo = isRequester ? friendInfo : userInfo
      
      return {
        id: friendship.id,
        friendId: targetInfo?.id || '',
        nickname: targetInfo?.nickname || '',
        region: targetInfo?.region || '',
        avatar_config: targetInfo?.avatar_config || {},
        status: friendship.status,
        created_at: friendship.created_at,
        isRequester,
        // pending 상태일 때 추가 정보
        requesterId: userInfo?.id,
        requesterNickname: userInfo?.nickname,
        receiverId: friendInfo?.id,
        receiverNickname: friendInfo?.nickname
      }
    }) || []

    console.log(`친구 목록 조회 완료 - userId: ${userId}, status: ${status}, 결과: ${friendsList.length}개`)

    return NextResponse.json({ friends: friendsList })

  } catch (error) {
    console.error('친구 목록 API 오류:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

// 친구 요청 보내기
export async function POST(request: NextRequest) {
  try {
    const { userId, friendId } = await request.json()

    if (!userId || !friendId) {
      return NextResponse.json(
        { error: '필수 정보가 누락되었습니다.' },
        { status: 400 }
      )
    }

    // 자신에게 친구 요청하는 것 방지
    if (userId === friendId) {
      return NextResponse.json(
        { error: '자신에게는 친구 요청을 보낼 수 없습니다.' },
        { status: 400 }
      )
    }

    // 친구 대상 사용자 존재 확인
    const { data: targetUser, error: userError } = await supabase
      .from('users')
      .select('id, nickname')
      .eq('id', friendId)
      .single()

    if (userError || !targetUser) {
      return NextResponse.json(
        { error: '친구 요청을 보낼 사용자를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 이미 친구 관계가 있는지 확인
    const { data: existingFriendship, error: checkError } = await supabase
      .from('friendships')
      .select('id, status')
      .or(`and(user_id.eq.${userId},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${userId})`)
      .single()

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('친구 관계 확인 오류:', checkError)
      return NextResponse.json(
        { error: '친구 관계 확인에 실패했습니다.' },
        { status: 500 }
      )
    }

    if (existingFriendship) {
      const statusMessage = {
        'pending': '이미 친구 요청을 보냈습니다.',
        'accepted': '이미 친구입니다.',
        'rejected': '친구 요청이 거절된 상태입니다.'
      }
      
      return NextResponse.json(
        { error: statusMessage[existingFriendship.status as keyof typeof statusMessage] || '이미 친구 관계가 존재합니다.' },
        { status: 400 }
      )
    }

    // 새로운 친구 요청 생성
    const { data: newFriendship, error: insertError } = await supabase
      .from('friendships')
      .insert([
        {
          user_id: userId,
          friend_id: friendId,
          status: 'pending'
        }
      ])
      .select(`
        id,
        status,
        created_at,
        friend:friend_id (
          id,
          nickname,
          region,
          avatar_config
        )
      `)
      .single()

    if (insertError) {
      console.error('친구 요청 생성 오류:', insertError)
      return NextResponse.json(
        { error: '친구 요청 보내기에 실패했습니다.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: `${targetUser.nickname}님에게 친구 요청을 보냈습니다!`,
      friendship: newFriendship
    })

  } catch (error) {
    console.error('친구 요청 API 오류:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// prerender 방지를 위한 설정
export const dynamic = 'force-dynamic'

// 친구 요청 수락/거절
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ friendshipId: string }> }
) {
  try {
    const { friendshipId } = await params
    const { action, userId } = await request.json() // action: 'accept' | 'reject'

    if (!friendshipId || !action || !userId) {
      return NextResponse.json(
        { error: '필수 정보가 누락되었습니다.' },
        { status: 400 }
      )
    }

    if (!['accept', 'reject'].includes(action)) {
      return NextResponse.json(
        { error: '유효하지 않은 액션입니다.' },
        { status: 400 }
      )
    }

    // 기존 친구 요청 조회 및 권한 확인
    const { data: friendship, error: fetchError } = await supabase
      .from('friends')
      .select(`
        id,
        user_id,
        friend_id,
        status,
        user:user_id (
          id,
          nickname
        ),
        friend:friend_id (
          id,
          nickname
        )
      `)
      .eq('id', friendshipId)
      .single()

    if (fetchError || !friendship) {
      return NextResponse.json(
        { error: '친구 요청을 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 친구 요청을 받은 사람만 수락/거절 가능
    if (friendship.friend_id !== userId) {
      return NextResponse.json(
        { error: '이 친구 요청을 처리할 권한이 없습니다.' },
        { status: 403 }
      )
    }

    // 이미 처리된 요청인지 확인
    if (friendship.status !== 'pending') {
      const statusMessage = {
        'accepted': '이미 수락된 친구 요청입니다.',
        'rejected': '이미 거절된 친구 요청입니다.'
      }
      
      return NextResponse.json(
        { error: statusMessage[friendship.status as keyof typeof statusMessage] },
        { status: 400 }
      )
    }

    // 친구 요청 상태 업데이트
    const newStatus = action === 'accept' ? 'accepted' : 'rejected'
    const { data: updatedFriendship, error: updateError } = await supabase
      .from('friends')
      .update({ status: newStatus })
      .eq('id', friendshipId)
      .select(`
        id,
        status,
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
      .single()

    if (updateError) {
      console.error('친구 요청 처리 오류:', updateError)
      return NextResponse.json(
        { error: '친구 요청 처리에 실패했습니다.' },
        { status: 500 }
      )
    }

    const userInfo = Array.isArray(friendship.user) ? friendship.user[0] : friendship.user
    const actionMessage = action === 'accept' 
      ? `${userInfo?.nickname || '사용자'}님과 친구가 되었습니다!`
      : `${userInfo?.nickname || '사용자'}님의 친구 요청을 거절했습니다.`

    return NextResponse.json({
      message: actionMessage,
      friendship: updatedFriendship
    })

  } catch (error) {
    console.error('친구 요청 처리 API 오류:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

// 친구 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ friendshipId: string }> }
) {
  try {
    const { friendshipId } = await params
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!friendshipId || !userId) {
      return NextResponse.json(
        { error: '필수 정보가 누락되었습니다.' },
        { status: 400 }
      )
    }

    // 기존 친구 관계 조회 및 권한 확인
    const { data: friendship, error: fetchError } = await supabase
      .from('friends')
      .select(`
        id,
        user_id,
        friend_id,
        status,
        user:user_id (
          nickname
        ),
        friend:friend_id (
          nickname
        )
      `)
      .eq('id', friendshipId)
      .single()

    if (fetchError || !friendship) {
      return NextResponse.json(
        { error: '친구 관계를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 친구 관계의 당사자만 삭제 가능
    if (friendship.user_id !== userId && friendship.friend_id !== userId) {
      return NextResponse.json(
        { error: '이 친구 관계를 삭제할 권한이 없습니다.' },
        { status: 403 }
      )
    }

    // 친구 관계 삭제
    const { error: deleteError } = await supabase
      .from('friends')
      .delete()
      .eq('id', friendshipId)

    if (deleteError) {
      console.error('친구 삭제 오류:', deleteError)
      return NextResponse.json(
        { error: '친구 삭제에 실패했습니다.' },
        { status: 500 }
      )
    }

    const userInfo = Array.isArray(friendship.user) ? friendship.user[0] : friendship.user
    const friendInfo = Array.isArray(friendship.friend) ? friendship.friend[0] : friendship.friend
    const friendName = friendship.user_id === userId 
      ? friendInfo?.nickname || '친구'
      : userInfo?.nickname || '친구'

    return NextResponse.json({
      message: `${friendName}님과의 친구 관계가 해제되었습니다.`
    })

  } catch (error) {
    console.error('친구 삭제 API 오류:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

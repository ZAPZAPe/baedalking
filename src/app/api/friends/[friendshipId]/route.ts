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
    const { action } = await request.json()

    if (!friendshipId || !action) {
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

    if (action === 'accept') {
      // 친구 요청 수락
      const { data, error } = await supabase
        .from('friends')
        .update({ status: 'accepted' })
        .eq('id', friendshipId)
        .select()
        .single()

      if (error) {
        console.error('친구 요청 수락 오류:', error)
        return NextResponse.json(
          { error: '친구 요청 수락에 실패했습니다.' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        message: '친구 요청을 수락했습니다!',
        friendship: data
      })
    } else {
      // 친구 요청 거절 (삭제)
      const { error } = await supabase
        .from('friends')
        .delete()
        .eq('id', friendshipId)

      if (error) {
        console.error('친구 요청 거절 오류:', error)
        return NextResponse.json(
          { error: '친구 요청 거절에 실패했습니다.' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        message: '친구 요청을 거절했습니다.'
      })
    }

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

    if (!friendshipId) {
      return NextResponse.json(
        { error: '친구 관계 ID가 필요합니다.' },
        { status: 400 }
      )
    }

    const { error } = await supabase
      .from('friends')
      .delete()
      .eq('id', friendshipId)

    if (error) {
      console.error('친구 삭제 오류:', error)
      return NextResponse.json(
        { error: '친구 삭제에 실패했습니다.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: '친구를 삭제했습니다.'
    })

  } catch (error) {
    console.error('친구 삭제 API 오류:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
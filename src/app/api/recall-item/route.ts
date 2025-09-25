import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

interface RecallItemRequest {
  userId: string
  itemId: string
}

export async function POST(request: NextRequest) {
  try {
    const body: RecallItemRequest = await request.json()
    const { userId, itemId } = body

    if (!userId || !itemId) {
      return NextResponse.json(
        { error: '사용자 ID와 아이템 ID가 필요합니다.' },
        { status: 400 }
      )
    }

    // 해당 사용자의 해당 아이템 배치 레코드 삭제 (여러 개면 전부 삭제 or 최신 1개 등 정책 선택)
    const { data, error } = await supabase
      .from('garage_placements')
      .delete()
      .eq('user_id', userId)
      .eq('item_id', itemId)
      .select()

    if (error) {
      console.error('아이템 회수 실패:', { error, userId, itemId })
      return NextResponse.json(
        { error: '아이템 회수에 실패했습니다.', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: '아이템 회수 완료',
      deletedCount: Array.isArray(data) ? data.length : 0
    })
  } catch (error) {
    console.error('recall-item API 서버 오류:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

interface PlaceItemRequest {
  userId: string
  itemId: string
  positionX: number
  positionY: number
  positionZ: number
}

export async function POST(request: NextRequest) {
  try {
    const body: PlaceItemRequest = await request.json()
    const { userId, itemId, positionX, positionY, positionZ } = body

    if (!userId || !itemId) {
      return NextResponse.json(
        { error: '사용자 ID와 아이템 ID가 필요합니다.' },
        { status: 400 }
      )
    }

    // 사용자가 해당 아이템을 소유하고 있는지 확인
    const { data: userItem, error: userItemError } = await supabase
      .from('user_items')
      .select('quantity')
      .eq('user_id', userId)
      .eq('item_id', itemId)
      .single()

    if (userItemError || !userItem) {
      return NextResponse.json(
        { error: '해당 아이템을 소유하고 있지 않습니다.' },
        { status: 400 }
      )
    }

    if (userItem.quantity <= 0) {
      return NextResponse.json(
        { error: '배치할 아이템이 없습니다.' },
        { status: 400 }
      )
    }

    // 아이템 정보 조회
    const { data: itemData, error: itemError } = await supabase
      .from('shop_items')
      .select('name, category')
      .eq('id', itemId)
      .single()

    if (itemError || !itemData) {
      return NextResponse.json(
        { error: '아이템 정보를 찾을 수 없습니다.' },
        { status: 400 }
      )
    }

    // 아이템 배치 (garage_placements 테이블에 추가)
    const { data: placement, error: placementError } = await supabase
      .from('garage_placements')
      .insert({
        user_id: userId,
        item_id: itemId,
        position_x: positionX,
        position_y: positionY,
        position_z: positionZ
      })
      .select()
      .single()

    if (placementError) {
      console.error('아이템 배치 실패:', {
        placementError,
        userId,
        itemId,
        position: { positionX, positionY, positionZ },
        details: placementError.details,
        hint: placementError.hint,
        code: placementError.code
      })
      return NextResponse.json(
        { error: '아이템 배치에 실패했습니다.', details: placementError.message },
        { status: 500 }
      )
    }

    // 간단한 1개 배치 시스템: 수량 차감하지 않음 (배치 상태만 관리)
    // 배치된 아이템은 garage_placements에서 관리하고
    // user_items는 그대로 유지하여 인벤토리에서 상태만 표시
    let updateError = null

    // 1개 배치 시스템에서는 수량 차감 오류가 발생하지 않음

    return NextResponse.json({
      success: true,
      message: `${itemData.name} 배치 완료!`,
      placement: placement
    })

  } catch (error) {
    console.error('place-item API 서버 오류:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

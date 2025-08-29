import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// prerender 방지를 위한 설정
export const dynamic = 'force-dynamic'

// 아이템 장착/해제
export async function PUT(request: NextRequest) {
  try {
    const { userItemId, equipped } = await request.json()

    if (!userItemId || equipped === undefined) {
      return NextResponse.json(
        { error: '필수 정보가 누락되었습니다.' },
        { status: 400 }
      )
    }

    // 현재 아이템 정보 확인
    const { data: userItem, error: fetchError } = await supabase
      .from('user_items')
      .select(`
        id,
        user_id,
        item_id,
        equipped,
        item:item_id (
          type
        )
      `)
      .eq('id', userItemId)
      .single()

    if (fetchError || !userItem) {
      return NextResponse.json(
        { error: '아이템을 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 장착하는 경우, 같은 타입의 다른 아이템들 해제
    if (equipped) {
      const itemData = Array.isArray(userItem.item) ? userItem.item[0] : userItem.item
      const itemType = itemData?.type
      
      if (itemType) {
        // 같은 타입의 아이템 ID들 조회
        const { data: sameTypeItems, error: itemsError } = await supabase
          .from('items')
          .select('id')
          .eq('type', itemType)

        if (!itemsError && sameTypeItems) {
          const itemIds = sameTypeItems.map(item => item.id)
          
          const { error: unequipError } = await supabase
            .from('user_items')
            .update({ equipped: false })
            .eq('user_id', userItem.user_id)
            .in('item_id', itemIds)

          if (unequipError) {
            console.error('기존 아이템 해제 오류:', unequipError)
          }
        }
      }
    }

    // 아이템 장착/해제 상태 업데이트
    const { data: updatedItem, error: updateError } = await supabase
      .from('user_items')
      .update({ equipped })
      .eq('id', userItemId)
      .select()
      .single()

    if (updateError) {
      console.error('아이템 장착/해제 오류:', updateError)
      return NextResponse.json(
        { error: '아이템 장착/해제에 실패했습니다.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: equipped ? '아이템을 장착했습니다.' : '아이템을 해제했습니다.',
      userItem: updatedItem
    })

  } catch (error) {
    console.error('아이템 장착/해제 API 오류:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

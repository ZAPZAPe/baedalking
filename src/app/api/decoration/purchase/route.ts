import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// prerender 방지를 위한 설정
export const dynamic = 'force-dynamic'

// 꾸미기 아이템 구매 (새로운 테이블 구조 사용)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, itemId, quantity = 1 } = body

    if (!userId || !itemId) {
      return NextResponse.json(
        { error: '사용자 ID와 아이템 ID가 필요합니다.' },
        { status: 400 }
      )
    }

    // Supabase 함수를 사용하여 아이템 구매
    const { data: result, error } = await supabase.rpc('purchase_item', {
      p_user_id: userId,
      p_item_id: itemId,
      p_quantity: quantity
    })

    if (error) {
      console.error('아이템 구매 오류:', error)
      return NextResponse.json(
        { error: '아이템 구매에 실패했습니다.' },
        { status: 500 }
      )
    }

    if (result?.success) {
      return NextResponse.json({
        success: true,
        message: '아이템 구매가 완료되었습니다!',
        itemPrice: result.item_price,
        quantity: result.quantity,
        totalCost: result.total_cost,
        remainingBoxes: result.remaining_boxes
      })
    } else {
      return NextResponse.json(
        { error: result?.error || '아이템 구매에 실패했습니다.' },
        { status: 400 }
      )
    }

  } catch (error) {
    console.error('아이템 구매 API 오류:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
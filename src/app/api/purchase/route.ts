import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// prerender 방지를 위한 설정
export const dynamic = 'force-dynamic'

// 아이템 구매
export async function POST(request: NextRequest) {
  try {
    const { userId, itemId, price } = await request.json()

    if (!userId || !itemId || !price) {
      return NextResponse.json(
        { error: '필수 정보가 누락되었습니다.' },
        { status: 400 }
      )
    }

    // 사용자 박스 확인
    const { data: earnBoxes } = await supabase
      .from('boxes')
      .select('amount')
      .eq('user_id', userId)
      .eq('type', 'earn')

    const { data: spendBoxes } = await supabase
      .from('boxes')
      .select('amount')
      .eq('user_id', userId)
      .eq('type', 'spend')

    const totalEarn = earnBoxes?.reduce((sum, box) => sum + box.amount, 0) || 0
    const totalSpend = spendBoxes?.reduce((sum, box) => sum + Math.abs(box.amount), 0) || 0
    const currentBoxes = totalEarn - totalSpend

    if (currentBoxes < price) {
      return NextResponse.json(
        { error: '박스가 부족합니다.' },
        { status: 400 }
      )
    }

    // 이미 보유한 아이템인지 확인
    const { data: existingItem, error: checkError } = await supabase
      .from('user_items')
      .select('id')
      .eq('user_id', userId)
      .eq('item_id', itemId)
      .single()

    if (existingItem) {
      return NextResponse.json(
        { error: '이미 보유한 아이템입니다.' },
        { status: 400 }
      )
    }

    // 트랜잭션 시작: 아이템 추가 + 박스 차감
    const { data: newUserItem, error: itemError } = await supabase
      .from('user_items')
      .insert([
        {
          user_id: userId,
          item_id: itemId,
          equipped: false
        }
      ])
      .select()
      .single()

    if (itemError) {
      console.error('아이템 추가 오류:', itemError)
      return NextResponse.json(
        { error: '아이템 구매에 실패했습니다.' },
        { status: 500 }
      )
    }

    // 박스 차감
    const { error: boxError } = await supabase
      .from('boxes')
      .insert([
        {
          user_id: userId,
          amount: -price,
          type: 'spend'
        }
      ])

    if (boxError) {
      console.error('박스 차감 오류:', boxError)
      // 아이템 추가를 롤백
      await supabase
        .from('user_items')
        .delete()
        .eq('id', newUserItem.id)
      
      return NextResponse.json(
        { error: '박스 차감에 실패했습니다.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: '아이템을 성공적으로 구매했습니다!',
      userItem: newUserItem,
      remainingBoxes: currentBoxes - price
    })

  } catch (error) {
    console.error('아이템 구매 API 오류:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

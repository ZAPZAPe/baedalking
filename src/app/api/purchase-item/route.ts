// 아이템 구매 API

import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

interface PurchaseRequest {
  userId: string
  itemId: string
  price: number
  voxelData?: any[]
  dimensions?: { width: number, height: number, depth: number }
  imagePath?: string
}

export async function POST(request: NextRequest) {
  try {
    const body: PurchaseRequest = await request.json()
    const { userId, itemId, price, voxelData, dimensions, imagePath } = body
    
    if (!userId || !itemId) {
      return NextResponse.json(
        { error: '필수 파라미터가 누락되었습니다' },
        { status: 400 }
      )
    }

    // 먼저 아이템 정보 조회
    const { data: item, error: itemError } = await supabase
      .from('shop_items')
      .select('*')
      .eq('id', itemId)
      .single()

    if (itemError || !item) {
      return NextResponse.json(
        { error: '아이템을 찾을 수 없습니다' },
        { status: 404 }
      )
    }
    
    // 이미 보유한 아이템인지 확인
    const { data: existingItem, error: checkError } = await supabase
      .from('user_items')
      .select('*')
      .eq('user_id', userId)
      .eq('item_id', itemId)
      .single()
    
    if (existingItem) {
      return NextResponse.json(
        { error: '이미 보유한 아이템입니다' },
        { status: 400 }
      )
    }
    
    // 잔액(박스) 확인 및 차감 처리
    if (item.price > 0) {
      // 총 박스 계산
      const { data: transactions, error: txError } = await supabase
        .from('box_transactions')
        .select('amount, type')
        .eq('user_id', userId)

      if (txError) {
        return NextResponse.json(
          { error: '박스 조회에 실패했습니다' },
          { status: 500 }
        )
      }

      const totalBoxes = (transactions || []).reduce((sum: number, t: any) => sum + (t.type === 'earn' ? t.amount : -t.amount), 0)
      if (totalBoxes < item.price) {
        return NextResponse.json(
          { error: '박스가 부족합니다' },
          { status: 400 }
        )
      }

      // 차감 트랜잭션 기록
      const { error: spendError } = await supabase
        .from('box_transactions')
        .insert({
          user_id: userId,
          amount: item.price,
          type: 'spend',
          reason: `아이템 구매: ${item.name}`
        })

      if (spendError) {
        return NextResponse.json(
          { error: '박스 차감에 실패했습니다' },
          { status: 500 }
        )
      }
    }

    // 아이템을 사용자 인벤토리에 추가
    const { error: insertError } = await supabase
      .from('user_items')
      .insert({
        user_id: userId,
        item_id: itemId,
        quantity: 1
      })
    
    if (insertError) {
      return NextResponse.json(
        { error: '아이템 구매에 실패했습니다' },
        { status: 500 }
      )
    }
    
    // 최신 박스 잔액 재계산
    const { data: tx2 } = await supabase
      .from('box_transactions')
      .select('amount, type')
      .eq('user_id', userId)

    const newBalance = (tx2 || []).reduce((sum: number, t: any) => sum + (t.type === 'earn' ? t.amount : -t.amount), 0)

    return NextResponse.json({
      success: true,
      message: `${item.name} 구매 완료`,
      newBalance,
      item: {
        id: item.id,
        name: item.name,
        category: item.category,
        voxelData: item.voxel_data,
        dimensions: item.dimensions,
        imagePath: item.image_path
      }
    })
    
  } catch (error) {
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}

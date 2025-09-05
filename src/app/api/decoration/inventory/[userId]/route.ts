import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// prerender 방지를 위한 설정
export const dynamic = 'force-dynamic'

// 사용자 인벤토리 조회 (새로운 테이블 구조 사용)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params

    if (!userId) {
      return NextResponse.json(
        { error: '사용자 ID가 필요합니다.' },
        { status: 400 }
      )
    }

    // 사용자 인벤토리 상세 정보 조회
    const { data: inventory, error } = await supabase
      .from('user_inventory_detailed')
      .select('*')
      .eq('user_id', userId)

    if (error) {
      console.error('사용자 인벤토리 조회 오류:', error)
      return NextResponse.json(
        { error: '인벤토리 데이터를 불러오는데 실패했습니다.' },
        { status: 500 }
      )
    }

    const formattedInventory = inventory?.map(item => ({
      id: item.id,
      itemId: item.item_id,
      quantity: item.quantity,
      purchasedAt: item.purchased_at,
      item: {
        id: item.item_id,
        name: item.item_name,
        description: item.item_description,
        imageUrl: item.item_image_url,
        category: item.item_category,
        price: item.item_price,
        anchor: item.item_anchor,
        gridData: item.item_grid_data
      }
    })) || []

    return NextResponse.json({ 
      inventory: formattedInventory,
      count: formattedInventory.length
    })

  } catch (error) {
    console.error('사용자 인벤토리 조회 API 오류:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
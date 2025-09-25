import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

// 사용자가 소유한 아이템 목록 조회 (캐릭터 또는 감정표현)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const category = searchParams.get('category') // '캐릭터' 또는 '감정표현'

    if (!userId) {
      return NextResponse.json({ error: '사용자 ID가 필요합니다.' }, { status: 400 })
    }

    if (!category) {
      return NextResponse.json({ error: '카테고리가 필요합니다.' }, { status: 400 })
    }

    // 사용자가 소유한 해당 카테고리 아이템들 조회
    let query = supabase
      .from('user_items')
      .select(`
        quantity,
        purchased_at,
        shop_items (
          id,
          name,
          description,
          category,
          sub_category,
          image_url,
          price,
          pixel_data,
          is_active
        )
      `)
      .eq('user_id', userId)
      // 소유 여부는 아이템 활성화 여부와 무관하게 판단 (비활성화된 아이템도 소유 목록에 포함)

    // 카테고리별 필터링
    if (category === '캐릭터' || category === '감정표현') {
      query = query.eq('shop_items.category', '캐릭터').eq('shop_items.sub_category', category)
    } else if (category === '인테리어') {
      query = query.eq('shop_items.category', '인테리어')
    }

    const { data: items, error } = await query

    if (error) {
      return NextResponse.json({ error: '아이템 조회에 실패했습니다.' }, { status: 500 })
    }

    // 결과 포맷팅
    const formattedItems = (items || []).map(item => ({
      ...item.shop_items,
      quantity: item.quantity,
      purchased_at: item.purchased_at
    }))

    return NextResponse.json({
      items: formattedItems,
      count: formattedItems.length,
      message: `${category} ${formattedItems.length}개를 소유중입니다.`
    })

  } catch (error) {
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}

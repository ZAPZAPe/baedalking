import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

// 디버그: 사용자 아이템 상태 확인
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: '사용자 ID가 필요합니다.' }, { status: 400 })
    }


    // 1. user_items 테이블에서 직접 조회
    const { data: userItems, error: userItemsError } = await supabase
      .from('user_items')
      .select('*')
      .eq('user_id', userId)

    if (userItemsError) {
      return NextResponse.json({ error: 'user_items 조회 실패' }, { status: 500 })
    }


    // 2. shop_items와 조인해서 조회
    const { data: joinedItems, error: joinedError } = await supabase
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
          is_active
        )
      `)
      .eq('user_id', userId)

    if (joinedError) {
      return NextResponse.json({ error: '조인 조회 실패' }, { status: 500 })
    }


    // 3. 캐릭터만 필터링
    const characterItems = joinedItems?.filter((item: any) => 
      item.shop_items?.category === '캐릭터' && 
      item.shop_items?.sub_category === '캐릭터'
    ) || []


    return NextResponse.json({
      userId,
      userItemsDirect: userItems,
      userItemsJoined: joinedItems,
      characterItems: characterItems,
      characterItemIds: characterItems.map((item: any) => item.shop_items?.id)
    })

  } catch (error) {
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// 사용자 상점 인벤토리 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const mainCategory = searchParams.get('mainCategory')
    const subCategory = searchParams.get('subCategory')

    if (!userId) {
      return NextResponse.json({ success: false, error: '사용자 ID가 필요합니다.' }, { status: 400 })
    }

    let query = supabase
      .from('user_inventory')
      .select(`
        *,
        shop_items (
          id,
          name,
          description,
          main_category,
          sub_category,
          image_url,
          price,
          anchor,
          grid_data,
          pixel_data
        )
      `)
      .eq('user_id', userId)
      .eq('shop_items.is_active', true)

    // 카테고리 필터링
    if (mainCategory) {
      query = query.eq('shop_items.main_category', mainCategory)
    }
    if (subCategory) {
      query = query.eq('shop_items.sub_category', subCategory)
    }

    const { data: inventory, error } = await query

    if (error) {
      console.error('인벤토리 조회 실패:', error)
      return NextResponse.json({ success: false, error: '인벤토리 조회에 실패했습니다.' }, { status: 500 })
    }

    // 데이터 구조 변환
    const formattedInventory = inventory?.map(item => ({
      id: item.id,
      userId: item.user_id,
      itemId: item.item_id,
      quantity: item.quantity,
      purchasedAt: item.purchased_at,
      item: item.shop_items
    })) || []

    return NextResponse.json({
      success: true,
      inventory: formattedInventory,
      total: formattedInventory.length
    })

  } catch (error) {
    console.error('인벤토리 조회 오류:', error)
    return NextResponse.json({ success: false, error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}

// 캐릭터 아이템 장착/해제
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { itemId, userId, action } = body // action: 'equip' 또는 'unequip'

    if (!itemId || !userId || !action) {
      return NextResponse.json({ success: false, error: '필수 파라미터가 누락되었습니다.' }, { status: 400 })
    }

    // 아이템 정보 조회
    const { data: item, error: itemError } = await supabase
      .from('shop_items')
      .select('*')
      .eq('id', itemId)
      .eq('is_active', true)
      .single()

    if (itemError || !item) {
      return NextResponse.json({ success: false, error: '아이템을 찾을 수 없습니다.' }, { status: 404 })
    }

    // 캐릭터 아이템만 장착 가능
    if (item.main_category !== 'character') {
      return NextResponse.json({ success: false, error: '캐릭터 아이템만 장착할 수 있습니다.' }, { status: 400 })
    }

    // 사용자가 해당 아이템을 소유하고 있는지 확인
    const { data: inventory } = await supabase
      .from('user_inventory')
      .select('quantity')
      .eq('user_id', userId)
      .eq('item_id', itemId)
      .single()

    if (!inventory || inventory.quantity <= 0) {
      return NextResponse.json({ success: false, error: '해당 아이템을 소유하고 있지 않습니다.' }, { status: 400 })
    }

    if (action === 'equip') {
      // 기존 장착된 아이템 해제 (같은 카테고리)
      // shop_items와 조인해서 같은 sub_category의 아이템들을 찾아 해제
      const { data: sameCategoryItems } = await supabase
        .from('character_equipment')
        .select(`
          id,
          shop_items!inner(sub_category)
        `)
        .eq('user_id', userId)
        .eq('is_equipped', true)
        .eq('shop_items.sub_category', item.sub_category)

      if (sameCategoryItems && sameCategoryItems.length > 0) {
        const itemIdsToUnequip = sameCategoryItems.map(equipment => equipment.id)
        await supabase
          .from('character_equipment')
          .update({ is_equipped: false })
          .in('id', itemIdsToUnequip)
      }

      // 새 아이템 장착
      const { error: equipError } = await supabase
        .from('character_equipment')
        .upsert({
          user_id: userId,
          item_id: itemId,
          is_equipped: true,
          equipped_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,item_id',
          ignoreDuplicates: false
        })

      if (equipError) {
        console.error('아이템 장착 실패:', equipError)
        return NextResponse.json({ success: false, error: '아이템 장착에 실패했습니다.' }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        message: `${item.name}을(를) 장착했습니다!`,
        item: item
      })

    } else if (action === 'unequip') {
      // 아이템 해제
      const { error: unequipError } = await supabase
        .from('character_equipment')
        .update({ is_equipped: false })
        .eq('user_id', userId)
        .eq('item_id', itemId)

      if (unequipError) {
        console.error('아이템 해제 실패:', unequipError)
        return NextResponse.json({ success: false, error: '아이템 해제에 실패했습니다.' }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        message: `${item.name}을(를) 해제했습니다!`,
        item: item
      })

    } else {
      return NextResponse.json({ success: false, error: '잘못된 액션입니다.' }, { status: 400 })
    }

  } catch (error) {
    console.error('아이템 장착/해제 오류:', error)
    return NextResponse.json({ success: false, error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}

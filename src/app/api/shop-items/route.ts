import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// 통합 상점 아이템 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const mainCategory = searchParams.get('mainCategory')
    const subCategory = searchParams.get('subCategory')
    const userId = searchParams.get('userId')

    let query = supabase
      .from('shop_items')
      .select('*')
      .eq('is_active', true)
      .order('main_category', { ascending: true })
      .order('sub_category', { ascending: true })
      .order('name', { ascending: true })

    // 카테고리 필터링
    if (mainCategory) {
      query = query.eq('main_category', mainCategory)
    }
    if (subCategory) {
      query = query.eq('sub_category', subCategory)
    }

    const { data: items, error } = await query

    if (error) {
      console.error('상점 아이템 조회 실패:', error)
      return NextResponse.json({ success: false, error: '아이템 조회에 실패했습니다.' }, { status: 500 })
    }

    // 사용자 인벤토리 정보 추가 (사용자 ID가 있는 경우)
    let itemsWithInventory = items || []
    if (userId) {
      const { data: inventory } = await supabase
        .from('user_inventory')
        .select('item_id, quantity')
        .eq('user_id', userId)

      const inventoryMap = new Map()
      inventory?.forEach(item => {
        inventoryMap.set(item.item_id, item.quantity)
      })

      itemsWithInventory = items?.map(item => ({
        ...item,
        userQuantity: inventoryMap.get(item.id) || 0
      })) || []
    }

    return NextResponse.json({
      success: true,
      items: itemsWithInventory,
      total: itemsWithInventory.length
    })

  } catch (error) {
    console.error('상점 아이템 조회 오류:', error)
    return NextResponse.json({ success: false, error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}

// 통합 상점 아이템 구매
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { itemId, userId, quantity = 1 } = body

    if (!itemId || !userId) {
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

    // 사용자 존재 여부 확인 (생성하지 않음)
    console.log('🔍 사용자 확인 시작:', userId)
    const { data: existingUser, error: userCheckError } = await supabase
      .from('users')
      .select('id')
      .eq('id', userId)
      .single()

    console.log('👤 사용자 확인 결과:', { existingUser, userCheckError })

    if (userCheckError && userCheckError.code === 'PGRST116') {
      // 사용자가 존재하지 않으면 에러 반환
      console.error('❌ 사용자가 존재하지 않음:', userId)
      return NextResponse.json({ success: false, error: '사용자를 찾을 수 없습니다. 먼저 로그인해주세요.' }, { status: 404 })
    } else if (userCheckError) {
      console.error('❌ 사용자 확인 실패:', userCheckError)
      return NextResponse.json({ success: false, error: '사용자 확인 중 오류가 발생했습니다.' }, { status: 500 })
    } else {
      console.log('✅ 사용자 존재 확인:', userId)
    }

    // 사용자 박스 잔액 조회
    const { data: transactions } = await supabase
      .from('box_transactions')
      .select('amount, type')
      .eq('user_id', userId)

    const userBoxes = transactions?.reduce((total, transaction) => {
      return total + (transaction.type === 'earn' ? transaction.amount : -transaction.amount)
    }, 0) || 0

    const totalCost = item.price * quantity

    if (userBoxes < totalCost) {
      return NextResponse.json({
        success: false,
        error: '박스가 부족합니다.',
        required: totalCost,
        available: userBoxes
      }, { status: 400 })
    }

    // 박스 차감
    const { error: transactionError } = await supabase
      .from('box_transactions')
      .insert({
        user_id: userId,
        amount: totalCost,
        type: 'spend',
        reason: `아이템 구매: ${item.name}`
      })

    if (transactionError) {
      console.error('박스 차감 실패:', transactionError)
      return NextResponse.json({ success: false, error: '구매 처리 중 오류가 발생했습니다.' }, { status: 500 })
    }

    // 사용자 재확인은 제거 (이미 위에서 확인했으므로)

    // 기존 인벤토리 확인
    console.log('🎒 인벤토리 확인 시작:', { userId, itemId })
    const { data: existingInventory } = await supabase
      .from('user_inventory')
      .select('quantity')
      .eq('user_id', userId)
      .eq('item_id', itemId)
      .single()

    const currentQuantity = existingInventory?.quantity || 0
    const newQuantity = currentQuantity + quantity
    console.log('📦 인벤토리 수량 계산:', { currentQuantity, quantity, newQuantity })

    // 인벤토리에 아이템 추가/업데이트
    console.log('➕ 인벤토리 추가 시도:', { userId, itemId, newQuantity })
    const { error: inventoryError } = await supabase
      .from('user_inventory')
      .upsert({
        user_id: userId,
        item_id: itemId,
        quantity: newQuantity,
        purchased_at: new Date().toISOString()
      })

    if (inventoryError) {
      console.error('❌ 인벤토리 추가 실패:', inventoryError)
      console.error('❌ 인벤토리 에러 상세:', JSON.stringify(inventoryError, null, 2))
      return NextResponse.json({ 
        success: false, 
        error: '인벤토리 업데이트 중 오류가 발생했습니다.',
        details: inventoryError.message || '알 수 없는 오류'
      }, { status: 500 })
    }
    console.log('✅ 인벤토리 추가 성공:', { userId, itemId, newQuantity })

    return NextResponse.json({
      success: true,
      message: `${item.name} 구매가 완료되었습니다!`,
      item: item,
      quantity: newQuantity,
      totalCost: totalCost,
      remainingBoxes: userBoxes - totalCost
    })

  } catch (error) {
    console.error('아이템 구매 오류:', error)
    return NextResponse.json({ success: false, error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}

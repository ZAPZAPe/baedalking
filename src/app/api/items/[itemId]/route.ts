import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// 특정 아이템 조회
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  const { itemId } = await params
  try {
    const { data: item, error } = await supabase
      .from('shop_items')
      .select('*')
      .eq('id', itemId)
      .single()
    
    if (error) {
      return NextResponse.json({ error: '아이템을 찾을 수 없습니다.' }, { status: 404 })
    }
    
    return NextResponse.json({ item })
  } catch (error) {
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}

// 아이템 업데이트
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  const { itemId } = await params
  try {
    const body = await request.json()
    const {
      name,
      description,
      category,
      sub_category,
      image_url,
      pixel_data,
      price
    } = body
    
    // 카테고리와 서브카테고리 유효성 검증 (업데이트 시에도 필요)
    if (category && sub_category) {
      const validCategories = ['캐릭터', '인테리어']
      const validSubCategories = {
        '캐릭터': ['캐릭터', '감정표현'],
        '인테리어': ['가구', '장식품', '운송수단']
      }
      
      if (!validCategories.includes(category)) {
        return NextResponse.json({ error: '유효하지 않은 카테고리입니다.' }, { status: 400 })
      }
      
      if (!validSubCategories[category as keyof typeof validSubCategories]?.includes(sub_category)) {
        return NextResponse.json({ error: '유효하지 않은 서브카테고리입니다.' }, { status: 400 })
      }
    }

    const { data: item, error } = await supabase
      .from('shop_items')
      .update({
        name,
        description: description || '',
        category,
        sub_category,
        image_url: image_url || '',
        price,
        pixel_data: pixel_data,
        updated_at: new Date().toISOString()
      })
      .eq('id', itemId)
      .select()
      .single()
    
    if (error) {
      return NextResponse.json({ error: '아이템을 업데이트할 수 없습니다.' }, { status: 500 })
    }
    
    return NextResponse.json({ item })
  } catch (error) {
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}

// 아이템 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  const { itemId } = await params
  try {
    const { error } = await supabase
      .from('shop_items')
      .delete()
      .eq('id', itemId)
    
    if (error) {
      return NextResponse.json({ error: '아이템을 삭제할 수 없습니다.' }, { status: 500 })
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}

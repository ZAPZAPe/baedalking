import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// 아이템 목록 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    
    let query = supabase
      .from('shop_items')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (category && category !== 'all') {
      query = query.eq('category', category)
    }
    
    const { data: items, error } = await query
    
    if (error) {
      return NextResponse.json({ error: '아이템을 불러올 수 없습니다.' }, { status: 500 })
    }
    
    return NextResponse.json({ items })
  } catch (error) {
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}

// 새 아이템 등록
export async function POST(request: NextRequest) {
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
    
    // 필수 필드 검증
    if (!name || !category || !sub_category || !price || !pixel_data) {
      return NextResponse.json({ error: '필수 필드가 누락되었습니다.' }, { status: 400 })
    }
    
    // 카테고리와 서브카테고리 유효성 검증
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
    
    const { data: item, error } = await supabase
      .from('shop_items')
      .insert([{
        name,
        description: description || '',
        category,
        sub_category,
        image_url: image_url || '',
        price,
        pixel_data: pixel_data,
        is_active: true
      }])
      .select()
      .single()
    
    if (error) {
      return NextResponse.json({ 
        error: '아이템을 등록할 수 없습니다.', 
        details: error.message 
      }, { status: 500 })
    }
    
    return NextResponse.json({ item })
  } catch (error) {
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}

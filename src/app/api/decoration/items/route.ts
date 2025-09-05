import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// prerender 방지를 위한 설정
export const dynamic = 'force-dynamic'

// 상점 아이템 목록 조회 (새로운 테이블 구조 사용)
export async function GET(request: NextRequest) {
  try {
    console.log('🏪 Supabase에서 상점 아이템 조회 중...')
    
    const { data: items, error } = await supabase
      .from('decoration_items')
      .select('*')
      .eq('is_active', true)
      .order('category', { ascending: true })
      .order('name', { ascending: true })

    if (error) {
      console.error('❌ 상점 아이템 조회 오류:', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }

    const formattedItems = items?.map(item => ({
      id: item.id,
      name: item.name,
      description: item.description,
      imageUrl: item.image_url,
      category: item.category,
      price: item.price,
      anchor: item.anchor,
      gridData: item.grid_data,
      isAdminOnly: item.is_admin_only
    })) || []

    console.log(`📦 Supabase에서 상점 아이템 로드됨: ${formattedItems.length}개`)
    return NextResponse.json({ items: formattedItems })

  } catch (error) {
    console.error('❌ 상점 아이템 API 오류:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// 새 아이템 추가 (관리자 전용)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      name,
      description,
      imageUrl,
      category,
      price,
      anchor,
      gridData,
      isAdminOnly
    } = body

    // 필수 필드 검증
    if (!name || !imageUrl) {
      return NextResponse.json({ 
        error: 'name과 imageUrl은 필수 필드입니다' 
      }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('decoration_items')
      .insert({
        name,
        description,
        image_url: imageUrl,
        category: category || '기타',
        price: price || 0,
        anchor: anchor || { x: 0, y: 0 },
        grid_data: gridData,
        is_admin_only: isAdminOnly || false,
        is_active: true,
        created_by: null
      })
      .select()
      .single()

    if (error) {
      console.error('아이템 추가 오류:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      item: {
        id: data.id,
        name: data.name,
        imageUrl: data.image_url,
        anchor: data.anchor,
        price: data.price,
        description: data.description,
        category: data.category,
        isAdminOnly: data.is_admin_only,
        createdAt: data.created_at,
        gridData: data.grid_data
      }
    })
  } catch (error) {
    console.error('아이템 추가 API 오류:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
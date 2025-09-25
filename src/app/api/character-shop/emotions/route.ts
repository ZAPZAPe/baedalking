import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

// 감정표현 상점 - 감정표현 조회
export async function GET(request: NextRequest) {
  try {
    // shop_items 테이블에서 감정표현 카테고리 아이템들 조회
    const { data: emotions, error } = await supabase
      .from('shop_items')
      .select('*')
      .eq('category', '캐릭터')
      .eq('sub_category', '감정표현')
      .eq('is_active', true)
      .order('created_at', { ascending: true })

    if (error) {
      return NextResponse.json({ error: '감정표현을 불러오는데 실패했습니다.' }, { status: 500 })
    }

    return NextResponse.json({ 
      emotions: emotions || [],
      message: `${emotions?.length || 0}개의 감정표현을 찾았습니다.`
    })

  } catch (error) {
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}

// 감정표현 상점에 새 감정표현 추가 (관리자용)
export async function POST(request: NextRequest) {
  try {
    const { name, description, image_url, price, sub_category } = await request.json()

    if (!name || !image_url) {
      return NextResponse.json({ error: '필수 정보가 누락되었습니다.' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('shop_items')
      .insert({
        name,
        description: description || '',
        category: '캐릭터',
        sub_category: '감정표현',
        image_url,
        price: price || 0,
        is_active: true
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: '감정표현 추가에 실패했습니다.' }, { status: 500 })
    }

    return NextResponse.json({ 
      emotion: data,
      message: '감정표현이 성공적으로 추가되었습니다!'
    })

  } catch (error) {
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}
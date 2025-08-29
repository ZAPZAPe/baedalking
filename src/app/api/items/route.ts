import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// prerender 방지를 위한 설정
export const dynamic = 'force-dynamic'

// 상점 아이템 조회
export async function GET() {
  try {
    const { data: items, error } = await supabase
      .from('items')
      .select('*')
      .order('price', { ascending: true })

    if (error) {
      console.error('아이템 조회 오류:', error)
      return NextResponse.json(
        { error: '아이템을 불러오는데 실패했습니다.' },
        { status: 500 }
      )
    }

    return NextResponse.json({ items })

  } catch (error) {
    console.error('상점 아이템 API 오류:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

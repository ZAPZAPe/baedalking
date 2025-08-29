import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// prerender 방지를 위한 설정
export const dynamic = 'force-dynamic'

// 사용자 보유 아이템 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: '사용자 ID가 필요합니다.' },
        { status: 400 }
      )
    }

    const { data: userItems, error } = await supabase
      .from('user_items')
      .select(`
        id,
        item_id,
        equipped,
        created_at,
        item:item_id (
          id,
          name,
          type,
          asset_url,
          price
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('사용자 아이템 조회 오류:', error)
      return NextResponse.json(
        { error: '보유 아이템을 불러오는데 실패했습니다.' },
        { status: 500 }
      )
    }

    return NextResponse.json({ userItems })

  } catch (error) {
    console.error('사용자 아이템 API 오류:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

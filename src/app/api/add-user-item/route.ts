import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

// 사용자 아이템 직접 추가 (디버그용)
export async function POST(request: NextRequest) {
  try {
    const { userId, itemId } = await request.json()

    if (!userId || !itemId) {
      return NextResponse.json({ error: 'userId와 itemId가 필요합니다.' }, { status: 400 })
    }


    // user_items에 직접 추가
    const { data, error } = await supabase
      .from('user_items')
      .insert({
        user_id: userId,
        item_id: itemId,
        quantity: 1
      })
      .select()

    if (error) {
      return NextResponse.json({ 
        error: 'user_items 추가 실패', 
        details: error.message,
        code: error.code
      }, { status: 500 })
    }


    return NextResponse.json({ 
      success: true,
      data: data,
      message: '사용자 아이템 추가 완료!'
    })

  } catch (error) {
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}


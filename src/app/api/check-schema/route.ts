import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

// 데이터베이스 스키마 확인
export async function GET(request: NextRequest) {
  try {

    // 1. user_items 테이블 구조 확인
    const { data: userItemsSchema, error: userItemsError } = await supabase
      .from('user_items')
      .select('*')
      .limit(0)


    // 2. shop_items 테이블 구조 확인
    const { data: shopItemsSchema, error: shopItemsError } = await supabase
      .from('shop_items')
      .select('*')
      .limit(0)


    // 3. users 테이블 구조 확인
    const { data: usersSchema, error: usersError } = await supabase
      .from('users')
      .select('*')
      .limit(0)


    return NextResponse.json({
      userItems: { schema: userItemsSchema, error: userItemsError },
      shopItems: { schema: shopItemsSchema, error: shopItemsError },
      users: { schema: usersSchema, error: usersError }
    })

  } catch (error) {
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}


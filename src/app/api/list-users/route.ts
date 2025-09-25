import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

// 모든 사용자 목록 조회
export async function GET(request: NextRequest) {
  try {

    const { data: users, error } = await supabase
      .from('users')
      .select('id, nickname, email, created_at')
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: '사용자 조회 실패' }, { status: 500 })
    }


    return NextResponse.json({
      users: users || [],
      count: users?.length || 0,
      message: `${users?.length || 0}명의 사용자가 있습니다.`
    })

  } catch (error) {
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}


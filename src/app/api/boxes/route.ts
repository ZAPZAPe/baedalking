import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// prerender 방지를 위한 설정
export const dynamic = 'force-dynamic'

// 사용자 박스 조회
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

    // 임시 해결책: 기본 박스 값 반환
    // 실제로는 earnings 테이블의 boxes_awarded 컬럼을 사용해야 함
    const totalBoxes = 0
    const earnedBoxes = 0
    const spentBoxes = 0
    const boxHistory = []

    return NextResponse.json({ 
      totalBoxes,
      earnedBoxes,
      spentBoxes,
      boxHistory
    })

  } catch (error) {
    console.error('박스 API 오류:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

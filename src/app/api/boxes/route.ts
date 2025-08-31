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

    // 박스 합계 계산
    const { data: earnBoxes, error: earnError } = await supabase
      .from('boxes')
      .select('amount')
      .eq('user_id', userId)
      .eq('type', 'earn')

    const { data: spendBoxes, error: spendError } = await supabase
      .from('boxes')
      .select('amount')
      .eq('user_id', userId)
      .eq('type', 'spend')

    if (earnError) {
      console.error('박스 획득 조회 오류:', earnError)
      return NextResponse.json(
        { error: '박스 획득 내역을 불러오는데 실패했습니다.', details: earnError },
        { status: 500 }
      )
    }

    if (spendError) {
      console.error('박스 사용 조회 오류:', spendError)
      return NextResponse.json(
        { error: '박스 사용 내역을 불러오는데 실패했습니다.', details: spendError },
        { status: 500 }
      )
    }

    const totalEarn = earnBoxes?.reduce((sum, box) => sum + box.amount, 0) || 0
    const totalSpend = spendBoxes?.reduce((sum, box) => sum + Math.abs(box.amount), 0) || 0
    const totalBoxes = totalEarn - totalSpend

    // 박스 내역도 함께 반환
    const { data: boxHistory, error: historyError } = await supabase
      .from('boxes')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50)

    return NextResponse.json({ 
      totalBoxes: Math.max(0, totalBoxes),
      earnedBoxes: totalEarn,
      spentBoxes: totalSpend,
      boxHistory: boxHistory || []
    })

  } catch (error) {
    console.error('박스 API 오류:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

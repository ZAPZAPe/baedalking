import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// prerender 방지를 위한 설정
export const dynamic = 'force-dynamic'

// 사용자 포인트 조회
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

    // 포인트 합계 계산
    const { data: earnPoints, error: earnError } = await supabase
      .from('points')
      .select('amount')
      .eq('user_id', userId)
      .eq('type', 'earn')

    const { data: spendPoints, error: spendError } = await supabase
      .from('points')
      .select('amount')
      .eq('user_id', userId)
      .eq('type', 'spend')

    if (earnError || spendError) {
      console.error('포인트 조회 오류:', earnError || spendError)
      return NextResponse.json(
        { error: '포인트를 불러오는데 실패했습니다.' },
        { status: 500 }
      )
    }

    const totalEarn = earnPoints?.reduce((sum, point) => sum + point.amount, 0) || 0
    const totalSpend = spendPoints?.reduce((sum, point) => sum + Math.abs(point.amount), 0) || 0
    const totalPoints = totalEarn - totalSpend

    // 포인트 내역도 함께 반환
    const { data: pointHistory, error: historyError } = await supabase
      .from('points')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50)

    return NextResponse.json({ 
      totalPoints: Math.max(0, totalPoints),
      earnedPoints: totalEarn,
      spentPoints: totalSpend,
      pointHistory: pointHistory || []
    })

  } catch (error) {
    console.error('포인트 API 오류:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

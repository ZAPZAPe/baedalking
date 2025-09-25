import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'

// prerender 방지를 위한 설정
export const dynamic = 'force-dynamic'

// 사용자 박스 조회 (새로운 테이블 구조 사용)
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

    const supabase = createClient()

    // 직접 SQL 쿼리로 박스 잔액 계산
    const { data: transactions, error } = await supabase
      .from('box_transactions')
      .select('amount, type')
      .eq('user_id', userId)

    if (error) {
      return NextResponse.json(
        { error: '박스 조회에 실패했습니다.' },
        { status: 500 }
      )
    }

    // 박스 잔액 계산 (earn은 +, spend는 -)
    const totalBoxes = transactions?.reduce((sum, transaction) => {
      return sum + (transaction.type === 'earn' ? transaction.amount : -transaction.amount)
    }, 0) || 0

    // 박스 거래 내역도 함께 조회 (상세 정보 포함)
    const { data: detailedTransactions } = await supabase
      .from('box_transactions')
      .select('amount, type, reason, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20)

    const earnBoxes = detailedTransactions?.filter(t => t.type === 'earn').reduce((sum, t) => sum + t.amount, 0) || 0
    const spendBoxes = detailedTransactions?.filter(t => t.type === 'spend').reduce((sum, t) => sum + t.amount, 0) || 0

    return NextResponse.json({ 
      totalBoxes: Math.max(0, totalBoxes),
      earnedBoxes: earnBoxes,
      spentBoxes: spendBoxes,
      transactions: detailedTransactions || []
    })

  } catch (error) {
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

// 박스 추가 (테스트용)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, amount, type = 'earn', reason = '테스트 박스 추가' } = body

    if (!userId || !amount) {
      return NextResponse.json(
        { error: '사용자 ID와 박스 수량이 필요합니다.' },
        { status: 400 }
      )
    }

    const supabase = createClient()

    // 박스 거래 기록 추가
    const { data, error } = await supabase
      .from('box_transactions')
      .insert({
        user_id: userId,
        amount: amount,
        type: type,
        reason: reason
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json(
        { error: '박스 추가에 실패했습니다.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: '박스가 추가되었습니다.',
      transaction: data
    })

  } catch (error) {
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
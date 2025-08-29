import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// prerender 방지를 위한 설정
export const dynamic = 'force-dynamic'

// 랭킹 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || 'monthly' // daily, weekly, monthly
    const limit = parseInt(searchParams.get('limit') || '10')

    // 기간별 날짜 계산
    const now = new Date()
    let startDate: string

    switch (period) {
      case 'daily':
        startDate = now.toISOString().split('T')[0]
        break
      case 'weekly':
        const weekStart = new Date(now)
        weekStart.setDate(now.getDate() - now.getDay())
        startDate = weekStart.toISOString().split('T')[0]
        break
      case 'monthly':
      default:
        startDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
        break
    }

    // 사용자별 수익 합계 계산
    const { data: earnings, error } = await supabase
      .from('earnings')
      .select(`
        user_id,
        amount,
        users!inner (
          id,
          nickname,
          region,
          avatar_config
        )
      `)
      .gte('date', startDate)
      .order('amount', { ascending: false })

    if (error) {
      console.error('랭킹 조회 오류:', error)
      return NextResponse.json(
        { error: '랭킹을 불러오는데 실패했습니다.' },
        { status: 500 }
      )
    }

    // 사용자별 총 수익 계산
    const userIncomes = new Map()
    const userInfo = new Map()

    earnings?.forEach(earning => {
      const userId = earning.user_id
      const userProfile = Array.isArray(earning.users) ? earning.users[0] : earning.users
      
      if (!userIncomes.has(userId)) {
        userIncomes.set(userId, 0)
        userInfo.set(userId, userProfile)
      }
      
      userIncomes.set(userId, userIncomes.get(userId) + earning.amount)
    })

    // 랭킹 생성
    const rankings = Array.from(userIncomes.entries())
      .map(([userId, totalIncome]) => ({
        user_id: userId,
        total_income: totalIncome,
        user: userInfo.get(userId)
      }))
      .sort((a, b) => b.total_income - a.total_income)
      .slice(0, limit)
      .map((item, index) => ({
        rank: index + 1,
        user_id: item.user_id,
        nickname: item.user?.nickname || '알 수 없음',
        region: item.user?.region || '',
        avatar_config: item.user?.avatar_config || {},
        total_income: item.total_income,
        grade: getGradeByIncome(item.total_income)
      }))

    // 총 참여자 수
    const totalUsers = userIncomes.size

    return NextResponse.json({
      rankings,
      period,
      totalUsers,
      generatedAt: new Date().toISOString()
    })

  } catch (error) {
    console.error('랭킹 API 오류:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

// 수익 기준 등급 계산
function getGradeByIncome(income: number): string {
  if (income >= 5000000) return 'LEGEND'
  if (income >= 3000000) return 'DIAMOND'
  if (income >= 2000000) return 'PLATINUM'
  if (income >= 1500000) return 'GOLD'
  if (income >= 1000000) return 'SILVER'
  return 'BRONZE'
}

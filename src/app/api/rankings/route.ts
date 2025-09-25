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

    // 기간별 날짜 계산 (한국 시간 기준)
    const koreaTime = new Date().getTime() + (9 * 60 * 60 * 1000) // UTC + 9시간
    const now = new Date(koreaTime)
    let startDate: string

    switch (period) {
      case 'daily':
        startDate = now.toISOString().split('T')[0]
        break
      case 'weekly':
        const weekStart = new Date(now)
        weekStart.setDate(now.getDate() - now.getDay()) // 일요일부터 시작
        startDate = weekStart.toISOString().split('T')[0]
        break
      case 'monthly':
      default:
        startDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
        break
    }


    // 사용자별 수익 합계 계산 (수익 비공개 사용자 제외)
    const { data: earnings, error } = await supabase
      .from('earnings')
      .select(`
        user_id,
        total_amount,
        platform,
        users!inner (
          id,
          nickname,
          region,
          is_income_private
        )
      `)
      .gte('date', startDate)
      .order('total_amount', { ascending: false })

    if (error) {
      return NextResponse.json(
        { error: '랭킹을 불러오는데 실패했습니다.' },
        { status: 500 }
      )
    }

    // 사용자별 총 수익 및 건수 계산 (수익 비공개 사용자 제외)
    const userIncomes = new Map()
    const userCounts = new Map()
    const userInfo = new Map()
    const userPlatforms = new Map()
    let excludedPrivateUsers = 0

    earnings?.forEach(earning => {
      const userId = earning.user_id
      const userProfile = Array.isArray(earning.users) ? earning.users[0] : earning.users
      
      // 수익 비공개 사용자는 랭킹에서 제외
      if (userProfile?.is_income_private) {
        excludedPrivateUsers++
        return
      }
      
      if (!userIncomes.has(userId)) {
        userIncomes.set(userId, 0)
        userCounts.set(userId, 0)
        userInfo.set(userId, userProfile)
        userPlatforms.set(userId, new Set())
      }
      
      userIncomes.set(userId, userIncomes.get(userId) + earning.total_amount)
      userCounts.set(userId, userCounts.get(userId) + 1)
      if (earning.platform) {
        userPlatforms.get(userId).add(earning.platform)
      }
    })


    // 랭킹 생성
    const rankings = Array.from(userIncomes.entries())
      .map(([userId, totalIncome]) => ({
        id: userId,
        user_id: userId,
        income: totalIncome,
        count: userCounts.get(userId) || 0,
        platforms: Array.from(userPlatforms.get(userId) || []),
        user: userInfo.get(userId)
      }))
      .sort((a, b) => b.income - a.income)
      .slice(0, limit)
      .map((item, index) => ({
        id: item.id,
        rank: index + 1,
        user_id: item.user_id,
        nickname: item.user?.nickname || '알 수 없음',
        region: item.user?.region || '',
        income: item.income,
        count: item.count,
        platforms: item.platforms,
        platform: item.platforms[0] || 'baemin', // 첫 번째 플랫폼을 기본값으로
        grade: getGradeByIncome(item.income)
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

import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// prerender 방지를 위한 설정
export const dynamic = 'force-dynamic'

// 사용자 프로필 조회
export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId } = params

    if (!userId) {
      return NextResponse.json(
        { error: '사용자 ID가 필요합니다.' },
        { status: 400 }
      )
    }

    // 사용자 기본 정보 조회
    const { data: userProfile, error: userError } = await supabase
      .from('users')
      .select('id, email, nickname, region, avatar_config, garage_config, created_at')
      .eq('id', userId)
      .single()

    if (userError || !userProfile) {
      return NextResponse.json(
        { error: '사용자를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 이번달 수익 계산
    const currentMonth = new Date().toISOString().slice(0, 7) // YYYY-MM 형식
    const { data: earnings, error: earningsError } = await supabase
      .from('earnings')
      .select('amount')
      .eq('user_id', userId)
      .gte('date', `${currentMonth}-01`)
      .lt('date', `${currentMonth}-31`)

    if (earningsError) {
      console.error('수익 조회 오류:', earningsError)
    }

    const totalIncome = earnings?.reduce((sum, earning) => sum + earning.amount, 0) || 0

    // 배달 건수 계산 (earnings 테이블의 레코드 수)
    const { count: deliveryCount, error: countError } = await supabase
      .from('earnings')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('date', `${currentMonth}-01`)
      .lt('date', `${currentMonth}-31`)

    if (countError) {
      console.error('건수 조회 오류:', countError)
    }

    // 등급 계산 (수익 기준)
    let grade = 'BRONZE'
    if (totalIncome >= 5000000) grade = 'LEGEND'
    else if (totalIncome >= 3000000) grade = 'DIAMOND'
    else if (totalIncome >= 2000000) grade = 'PLATINUM'
    else if (totalIncome >= 1500000) grade = 'GOLD'
    else if (totalIncome >= 1000000) grade = 'SILVER'

    // 플랫폼 정보 (earnings 테이블의 source 컬럼 활용)
    const { data: platformData, error: platformError } = await supabase
      .from('earnings')
      .select('source')
      .eq('user_id', userId)
      .gte('date', `${currentMonth}-01`)

    const platforms = platformData 
      ? [...new Set(platformData.map(item => item.source).filter(Boolean))]
      : []

    // 전체 사용자 중 순위 계산
    const { data: allUsers, error: rankError } = await supabase
      .from('earnings')
      .select('user_id, amount')
      .gte('date', `${currentMonth}-01`)
      .lt('date', `${currentMonth}-31`)

    let rank = 1
    if (!rankError && allUsers) {
      const userIncomes = new Map()
      allUsers.forEach(earning => {
        const currentTotal = userIncomes.get(earning.user_id) || 0
        userIncomes.set(earning.user_id, currentTotal + earning.amount)
      })
      
      const sortedIncomes = Array.from(userIncomes.values()).sort((a, b) => b - a)
      rank = sortedIncomes.findIndex(income => income <= totalIncome) + 1
      if (rank === 0) rank = sortedIncomes.length + 1
    }

    const profileData = {
      id: userProfile.id,
      nickname: userProfile.nickname,
      region: userProfile.region,
      income: totalIncome,
      count: deliveryCount || 0,
      platforms,
      rank,
      grade,
      avatar_config: userProfile.avatar_config,
      garage_config: userProfile.garage_config,
      memberSince: userProfile.created_at
    }

    return NextResponse.json({ user: profileData })

  } catch (error) {
    console.error('사용자 프로필 API 오류:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

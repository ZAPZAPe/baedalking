import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// prerender 방지를 위한 설정
export const dynamic = 'force-dynamic'

// 사용자 프로필 조회
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params

    if (!userId) {
      return NextResponse.json(
        { error: '사용자 ID가 필요합니다.' },
        { status: 400 }
      )
    }

    // URL 디코딩 처리
    const decodedUserId = decodeURIComponent(userId)
    console.log('🔍 사용자 조회 요청:', decodedUserId)

    let userProfile = null
    let userError = null

    // UUID 형식인지 확인 (36자리, 하이픈 포함)
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(decodedUserId)
    
    if (isUUID) {
      // UUID로 검색
      console.log('🆔 UUID로 사용자 검색:', decodedUserId)
      const result = await supabase
        .from('users')
        .select('id, email, nickname, region, avatar_config, garage_config, is_income_private, platforms, created_at')
        .eq('id', decodedUserId)
        .single()
      
      userProfile = result.data
      userError = result.error
    } else {
      // 닉네임으로 검색
      console.log('👤 닉네임으로 사용자 검색:', decodedUserId)
      const result = await supabase
        .from('users')
        .select('id, email, nickname, region, avatar_config, garage_config, is_income_private, platforms, created_at')
        .eq('nickname', decodedUserId)
        .single()
      
      userProfile = result.data
      userError = result.error
    }

    if (userError || !userProfile) {
      console.error('❌ 사용자 조회 실패:', userError)
      return NextResponse.json(
        { error: '사용자를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    console.log('✅ 사용자 조회 성공:', userProfile.nickname)

    // 이번달 수익 계산 (사용자 실제 ID 사용)
    const currentMonth = new Date().toISOString().slice(0, 7) // YYYY-MM 형식
    const { data: earnings, error: earningsError } = await supabase
      .from('earnings')
      .select('total_amount')
      .eq('user_id', userProfile.id)
      .gte('date', `${currentMonth}-01`)
      .lt('date', `${currentMonth}-31`)

    if (earningsError) {
      console.error('수익 조회 오류:', earningsError)
    }

    const totalIncome = earnings?.reduce((sum, earning) => sum + earning.total_amount, 0) || 0

    // 배달 건수 계산 (earnings 테이블의 레코드 수)
    const { count: deliveryCount, error: countError } = await supabase
      .from('earnings')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userProfile.id)
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

    // 플랫폼 정보 (earnings 테이블의 platform 컬럼 활용)
    const { data: platformData, error: platformError } = await supabase
      .from('earnings')
      .select('platform')
      .eq('user_id', userProfile.id)
      .gte('date', `${currentMonth}-01`)

    const platforms = platformData 
      ? [...new Set(platformData.map(item => item.platform).filter(Boolean))]
      : []

    // 전체 사용자 중 순위 계산
    const { data: allUsers, error: rankError } = await supabase
      .from('earnings')
      .select('user_id, total_amount')
      .gte('date', `${currentMonth}-01`)
      .lt('date', `${currentMonth}-31`)

    let rank = 1
    if (!rankError && allUsers) {
      const userIncomes = new Map()
      allUsers.forEach(earning => {
        const currentTotal = userIncomes.get(earning.user_id) || 0
        userIncomes.set(earning.user_id, currentTotal + earning.total_amount)
      })
      
      const sortedIncomes = Array.from(userIncomes.values()).sort((a, b) => b - a)
      rank = sortedIncomes.findIndex(income => income <= totalIncome) + 1
      if (rank === 0) rank = sortedIncomes.length + 1
    }

    // 사용자 플랫폼 정보 (users 테이블의 platforms 필드 우선 사용)
    const userPlatforms = userProfile.platforms && Array.isArray(userProfile.platforms) 
      ? userProfile.platforms.map((p: any) => p.name || p.id || p).filter(Boolean)
      : platforms

    const profileData = {
      id: userProfile.id,
      nickname: userProfile.nickname,
      region: userProfile.region,
      income: totalIncome,
      count: deliveryCount || 0,
      platforms: userPlatforms,
      rank,
      grade,
      isIncomePrivate: userProfile.is_income_private || false,
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

// 사용자 프로필 업데이트
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params
    const body = await request.json()

    if (!userId) {
      return NextResponse.json(
        { error: '사용자 ID가 필요합니다.' },
        { status: 400 }
      )
    }

    // URL 디코딩 처리 및 실제 사용자 ID 추출
    const decodedUserId = decodeURIComponent(userId)
    console.log('🔍 사용자 업데이트 요청:', decodedUserId)

    // UUID 형식인지 확인
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(decodedUserId)
    
    let actualUserId = decodedUserId
    
    if (!isUUID) {
      // 닉네임으로 사용자 ID 찾기
      const { data: user, error } = await supabase
        .from('users')
        .select('id')
        .eq('nickname', decodedUserId)
        .single()
      
      if (error || !user) {
        return NextResponse.json(
          { error: '사용자를 찾을 수 없습니다.' },
          { status: 404 }
        )
      }
      
      actualUserId = user.id
    }

    // 업데이트할 필드 확인 및 필터링
    const allowedFields = ['nickname', 'region', 'status_message', 'avatar_config', 'garage_config', 'is_income_private']
    const updateData: any = {}

    allowedFields.forEach(field => {
      if (body[field] !== undefined) {
        updateData[field] = body[field]
      }
    })

    // 업데이트할 데이터가 없는 경우
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: '업데이트할 데이터가 없습니다.' },
        { status: 400 }
      )
    }

    // 🔍 닉네임 유효성 검사 및 중복 체크
    if (updateData.nickname) {
      const nickname = updateData.nickname.trim()
      
      // 1. 최소 길이 검사 (2글자 이상)
      if (nickname.length < 2) {
        return NextResponse.json(
          { error: '닉네임은 최소 2글자 이상이어야 합니다.' },
          { status: 400 }
        )
      }
      
      // 2. 최대 길이 검사 (10글자 이하)
      if (nickname.length > 10) {
        return NextResponse.json(
          { error: '닉네임은 최대 10글자까지 가능합니다.' },
          { status: 400 }
        )
      }
      
      // 3. 특수문자 검사 (한글, 영문, 숫자만 허용)
      const nicknameRegex = /^[가-힣a-zA-Z0-9]+$/
      if (!nicknameRegex.test(nickname)) {
        return NextResponse.json(
          { error: '닉네임은 한글, 영문, 숫자만 사용 가능합니다.' },
          { status: 400 }
        )
      }
      
      // 4. 금지어 검사
      const bannedWords = ['관리자', 'admin', 'test', '배달킹', '운영자', 'null', 'undefined']
      if (bannedWords.some(word => nickname.toLowerCase().includes(word.toLowerCase()))) {
        return NextResponse.json(
          { error: '사용할 수 없는 닉네임입니다.' },
          { status: 400 }
        )
      }
      
      // 5. 중복 체크
      const { data: existingUser, error: checkError } = await supabase
        .from('users')
        .select('id')
        .eq('nickname', nickname)
        .neq('id', userId)
        .single()

      if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = No rows found (정상)
        console.error('닉네임 중복 체크 오류:', checkError)
        return NextResponse.json(
          { error: '닉네임 중복 체크 중 오류가 발생했습니다.' },
          { status: 500 }
        )
      }

      if (existingUser) {
        return NextResponse.json(
          { error: '이미 사용 중인 닉네임입니다.' },
          { status: 409 }
        )
      }
      
      // 유효성 검사 통과 시 정제된 닉네임 사용
      updateData.nickname = nickname
    }

    // updated_at 필드 추가
    updateData.updated_at = new Date().toISOString()

    // 데이터베이스 업데이트
    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update(updateData)
              .eq('id', userId)
      .select('id, email, nickname, region, status_message, avatar_config, garage_config, updated_at')
      .single()

    if (updateError || !updatedUser) {
      console.error('사용자 정보 업데이트 오류:', updateError)
      return NextResponse.json(
        { error: '사용자 정보 업데이트에 실패했습니다.' },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      message: '사용자 정보가 성공적으로 업데이트되었습니다.',
      user: updatedUser 
    })

  } catch (error) {
    console.error('사용자 정보 업데이트 API 오류:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

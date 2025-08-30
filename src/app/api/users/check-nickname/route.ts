import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// prerender 방지를 위한 설정
export const dynamic = 'force-dynamic'

// 닉네임 중복 체크
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const nickname = searchParams.get('nickname')?.trim()
    const userId = searchParams.get('userId') // 현재 사용자 ID (편집 시 자신 제외)

    if (!nickname) {
      return NextResponse.json(
        { error: '닉네임이 필요합니다.' },
        { status: 400 }
      )
    }

    // 🔍 닉네임 유효성 검사
    
    // 1. 최소 길이 검사 (2글자 이상)
    if (nickname.length < 2) {
      return NextResponse.json({
        available: false,
        error: '닉네임은 최소 2글자 이상이어야 합니다.'
      })
    }
    
    // 2. 최대 길이 검사 (10글자 이하)
    if (nickname.length > 10) {
      return NextResponse.json({
        available: false,
        error: '닉네임은 최대 10글자까지 가능합니다.'
      })
    }
    
    // 3. 특수문자 검사 (한글, 영문, 숫자만 허용)
    const nicknameRegex = /^[가-힣a-zA-Z0-9]+$/
    if (!nicknameRegex.test(nickname)) {
      return NextResponse.json({
        available: false,
        error: '닉네임은 한글, 영문, 숫자만 사용 가능합니다.'
      })
    }
    
    // 4. 금지어 검사 (배달킹 제외)
    const bannedWords = ['관리자', 'admin', 'test', '운영자', 'null', 'undefined', 'system']
    if (bannedWords.some(word => nickname.toLowerCase().includes(word.toLowerCase()))) {
      return NextResponse.json({
        available: false,
        error: '사용할 수 없는 닉네임입니다.'
      })
    }
    
    // 5. 중복 체크
    let query = supabase
      .from('users')
      .select('id')
      .eq('nickname', nickname)
    
    // 현재 사용자 제외 (편집 시)
    if (userId) {
      query = query.neq('id', userId)
    }
    
    const { data: existingUsers, error: checkError } = await query

    if (checkError) {
      console.error('닉네임 중복 체크 오류:', checkError)
      return NextResponse.json(
        { error: '닉네임 중복 체크 중 오류가 발생했습니다.' },
        { status: 500 }
      )
    }

    if (existingUsers && existingUsers.length > 0) {
      return NextResponse.json({
        available: false,
        error: '이미 사용 중인 닉네임입니다.'
      })
    }

    // 모든 검사 통과
    return NextResponse.json({
      available: true,
      message: '사용 가능한 닉네임입니다.'
    })

  } catch (error) {
    console.error('닉네임 체크 API 오류:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

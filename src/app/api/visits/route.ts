import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// prerender 방지를 위한 설정
export const dynamic = 'force-dynamic'

// 방문자 수 조회
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

    // UUID 형식인지 확인
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId)
    
    if (!isUUID) {
      return NextResponse.json(
        { error: '잘못된 사용자 ID 형식입니다.' },
        { status: 400 }
      )
    }

    console.log('🔍 방문자 수 조회 요청:', userId, 'from URL:', request.url)

    // 총 방문자 수 조회
    const { count: totalVisits, error: totalError } = await supabase
      .from('visits')
      .select('*', { count: 'exact', head: true })
      .eq('visited_user_id', userId)

    if (totalError) {
      console.error('총 방문자 수 조회 오류:', totalError)
      return NextResponse.json(
        { error: '방문자 수를 불러오는데 실패했습니다.' },
        { status: 500 }
      )
    }

    // 오늘 방문자 수 조회
    const today = new Date().toISOString().split('T')[0]
    const { count: todayVisits, error: todayError } = await supabase
      .from('visits')
      .select('*', { count: 'exact', head: true })
      .eq('visited_user_id', userId)
      .gte('created_at', `${today}T00:00:00`)
      .lt('created_at', `${today}T23:59:59`)

    if (todayError) {
      console.error('오늘 방문자 수 조회 오류:', todayError)
      return NextResponse.json(
        { error: '오늘 방문자 수를 불러오는데 실패했습니다.' },
        { status: 500 }
      )
    }

    console.log('✅ 방문자 수 조회 완료:', { totalVisits: totalVisits || 0, todayVisits: todayVisits || 0 })
    
    return NextResponse.json({
      totalVisits: totalVisits || 0,
      todayVisits: todayVisits || 0
    })

  } catch (error) {
    console.error('방문자 수 API 오류:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

// 방문 기록
export async function POST(request: NextRequest) {
  try {
    const { visitedUserId, visitorId } = await request.json()
    console.log('📝 방문 기록 요청:', { visitedUserId, visitorId })

    if (!visitedUserId || !visitorId) {
      return NextResponse.json(
        { error: '필수 정보가 누락되었습니다.' },
        { status: 400 }
      )
    }

    // 자신의 페이지 방문은 기록하지 않음
    if (visitedUserId === visitorId) {
      console.log('ℹ️ 자신의 페이지 방문 - 기록하지 않음:', { visitedUserId, visitorId })
      return NextResponse.json({
        message: '자신의 페이지 방문은 기록되지 않습니다.'
      })
    }

    // 오늘 이미 방문한 기록이 있는지 확인
    const today = new Date().toISOString().split('T')[0]
    const { data: existingVisit, error: checkError } = await supabase
      .from('visits')
      .select('id')
      .eq('visited_user_id', visitedUserId)
      .eq('user_id', visitorId)
      .gte('created_at', `${today}T00:00:00`)
      .lt('created_at', `${today}T23:59:59`)
      .single()

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('방문 기록 확인 오류:', checkError)
      return NextResponse.json(
        { error: '방문 기록 확인에 실패했습니다.' },
        { status: 500 }
      )
    }

    // 이미 오늘 방문한 기록이 있으면 중복 기록하지 않음
    if (existingVisit) {
      console.log('🔄 오늘 이미 방문 기록 있음:', { visitedUserId, visitorId, existingVisitId: existingVisit.id })
      return NextResponse.json({
        message: '오늘 이미 방문 기록이 있습니다.'
      })
    }

    // 새로운 방문 기록 생성
    const { error: insertError } = await supabase
      .from('visits')
      .insert([
        {
          user_id: visitorId,
          visited_user_id: visitedUserId
        }
      ])

    if (insertError) {
      console.error('방문 기록 생성 오류:', insertError)
      return NextResponse.json(
        { error: '방문 기록 생성에 실패했습니다.' },
        { status: 500 }
      )
    }

    console.log('✅ 새로운 방문 기록 생성 완료:', { visitedUserId, visitorId })
    
    return NextResponse.json({
      message: '방문이 기록되었습니다.'
    })

  } catch (error) {
    console.error('방문 기록 API 오류:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

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


    // 총 방문자 수 조회
    const { count: totalVisits, error: totalError } = await supabase
      .from('visits')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)

    if (totalError) {
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
      .eq('user_id', userId)
      .gte('visit_date', today)

    if (todayError) {
      return NextResponse.json(
        { error: '오늘 방문자 수를 불러오는데 실패했습니다.' },
        { status: 500 }
      )
    }

    
    return NextResponse.json({
      totalVisits: totalVisits || 0,
      todayVisits: todayVisits || 0
    })

  } catch (error) {
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

    if (!visitedUserId || !visitorId) {
      return NextResponse.json(
        { error: '필수 정보가 누락되었습니다.' },
        { status: 400 }
      )
    }

    // 자신의 페이지 방문은 기록하지 않음
    if (visitedUserId === visitorId) {
      return NextResponse.json({
        message: '자신의 페이지 방문은 기록되지 않습니다.'
      })
    }

    // 오늘 이미 방문한 기록이 있는지 확인
    const today = new Date().toISOString().split('T')[0]
    const { data: existingVisit, error: checkError } = await supabase
      .from('visits')
      .select('id')
      .eq('user_id', visitedUserId)
      .eq('visitor_id', visitorId)
      .eq('visit_date', today)
      .single()

    if (checkError && checkError.code !== 'PGRST116') {
      return NextResponse.json(
        { error: '방문 기록 확인에 실패했습니다.' },
        { status: 500 }
      )
    }

    // 이미 오늘 방문한 기록이 있으면 중복 기록하지 않음
    if (existingVisit) {
      return NextResponse.json({
        message: '오늘 이미 방문 기록이 있습니다.'
      })
    }

    // 새로운 방문 기록 생성
    const { error: insertError } = await supabase
      .from('visits')
      .insert([
        {
          user_id: visitedUserId,
          visitor_id: visitorId
        }
      ])

    if (insertError) {
      return NextResponse.json(
        { error: '방문 기록 생성에 실패했습니다.' },
        { status: 500 }
      )
    }

    
    return NextResponse.json({
      message: '방문이 기록되었습니다.'
    })

  } catch (error) {
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

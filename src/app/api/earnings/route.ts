import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// prerender 방지를 위한 설정
export const dynamic = 'force-dynamic'

// 수익 기록 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    if (!userId) {
      return NextResponse.json(
        { error: '사용자 ID가 필요합니다.' },
        { status: 400 }
      )
    }

    let query = supabase
      .from('earnings')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false })

    // 날짜 범위 필터링
    if (startDate) {
      query = query.gte('date', startDate)
    }
    if (endDate) {
      query = query.lte('date', endDate)
    }

    const { data: earnings, error } = await query

    if (error) {
      console.error('수익 조회 오류:', error)
      return NextResponse.json(
        { error: '수익 데이터를 불러오는데 실패했습니다.' },
        { status: 500 }
      )
    }

    return NextResponse.json({ earnings })

  } catch (error) {
    console.error('수익 조회 API 오류:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

// 수익 기록 등록
export async function POST(request: NextRequest) {
  try {
    const { 
      userId, 
      platform,
      delivery_count,
      delivery_amount,
      mission_amount,
      date,
      screenshotUrl,
      screenshotText
    } = await request.json()

    if (!userId || !platform || !date) {
      return NextResponse.json(
        { error: '필수 정보가 누락되었습니다.' },
        { status: 400 }
      )
    }

    // 수익 금액 검증
    const totalAmount = (delivery_amount || 0) + (mission_amount || 0)
    if (totalAmount < 0 || totalAmount > 10000000) {
      return NextResponse.json(
        { error: '수익 금액이 유효하지 않습니다.' },
        { status: 400 }
      )
    }

    // 같은 날짜에 같은 플랫폼으로 이미 등록된 수익이 있는지 확인
    const { data: existingEarning, error: checkError } = await supabase
      .from('earnings')
      .select('id')
      .eq('user_id', userId)
      .eq('date', date)
      .eq('platform', platform)
      .single()

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('중복 확인 오류:', checkError)
      return NextResponse.json(
        { error: '중복 확인에 실패했습니다.' },
        { status: 500 }
      )
    }

    // 중복된 수익 기록이 있으면 업데이트
    if (existingEarning) {
      const { data: updatedEarning, error: updateError } = await supabase
        .from('earnings')
        .update({
          delivery_count: delivery_count || 0,
          delivery_amount: delivery_amount || 0,
          mission_amount: mission_amount || 0,
          screenshot_url: screenshotUrl || '',
          screenshot_text: screenshotText || '',
          updated_at: new Date().toISOString()
        })
        .eq('id', existingEarning.id)
        .select()
        .single()

      if (updateError) {
        console.error('수익 업데이트 오류:', updateError)
        return NextResponse.json(
          { error: '수익 업데이트에 실패했습니다.' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        message: '수익 기록이 업데이트되었습니다!',
        earning: updatedEarning
      })
    }

    // 새로운 수익 기록 생성
    const { data: newEarning, error: insertError } = await supabase
      .from('earnings')
      .insert([
        {
          user_id: userId,
          platform: platform,
          delivery_count: delivery_count || 0,
          delivery_amount: delivery_amount || 0,
          mission_amount: mission_amount || 0,
          date,
          screenshot_url: screenshotUrl || '',
          screenshot_text: screenshotText || '',
          points_awarded: Math.floor(totalAmount / 1000) // 1000원당 1포인트
        }
      ])
      .select()
      .single()

    if (insertError) {
      console.error('수익 등록 오류:', insertError)
      return NextResponse.json(
        { error: '수익 등록에 실패했습니다.' },
        { status: 500 }
      )
    }

    // 포인트 지급
    if (newEarning.points_awarded > 0) {
      const { error: pointsError } = await supabase
        .from('points')
        .insert([
          {
            user_id: userId,
            amount: newEarning.points_awarded,
            type: 'earn'
          }
        ])

      if (pointsError) {
        console.error('포인트 지급 오류:', pointsError)
        // 포인트 지급 실패해도 수익 등록은 성공으로 처리
      }
    }

    return NextResponse.json({
      message: '수익이 등록되었습니다!',
      earning: newEarning,
      pointsAwarded: newEarning.points_awarded
    })

  } catch (error) {
    console.error('수익 등록 API 오류:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
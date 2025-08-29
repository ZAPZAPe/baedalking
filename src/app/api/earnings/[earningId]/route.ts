import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// prerender 방지를 위한 설정
export const dynamic = 'force-dynamic'

// 수익 기록 수정
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ earningId: string }> }
) {
  try {
    const { earningId } = await params
    const { 
      amount, 
      screenshotUrl, 
      screenshotText, 
      source 
    } = await request.json()

    if (!earningId) {
      return NextResponse.json(
        { error: '수익 ID가 필요합니다.' },
        { status: 400 }
      )
    }

    // 수익 금액 검증
    if (amount !== undefined && (amount < 0 || amount > 10000000)) {
      return NextResponse.json(
        { error: '수익 금액이 유효하지 않습니다.' },
        { status: 400 }
      )
    }

    // 기존 수익 기록 조회
    const { data: existingEarning, error: fetchError } = await supabase
      .from('earnings')
      .select('*')
      .eq('id', earningId)
      .single()

    if (fetchError || !existingEarning) {
      return NextResponse.json(
        { error: '수익 기록을 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 업데이트할 데이터 준비
    const updateData: any = {
      updated_at: new Date().toISOString()
    }

    if (amount !== undefined) {
      updateData.amount = amount
      updateData.points_awarded = Math.floor(amount / 1000) // 포인트 재계산
    }
    if (screenshotUrl !== undefined) updateData.screenshot_url = screenshotUrl
    if (screenshotText !== undefined) updateData.screenshot_text = screenshotText
    if (source !== undefined) updateData.source = source

    // 수익 기록 업데이트
    const { data: updatedEarning, error: updateError } = await supabase
      .from('earnings')
      .update(updateData)
      .eq('id', earningId)
      .select()
      .single()

    if (updateError) {
      console.error('수익 수정 오류:', updateError)
      return NextResponse.json(
        { error: '수익 수정에 실패했습니다.' },
        { status: 500 }
      )
    }

    // 포인트 차이가 있으면 포인트 조정
    if (amount !== undefined) {
      const pointsDiff = updateData.points_awarded - existingEarning.points_awarded
      
      if (pointsDiff !== 0) {
        const { error: pointsError } = await supabase
          .from('points')
          .insert([
            {
              user_id: existingEarning.user_id,
              amount: pointsDiff,
              type: pointsDiff > 0 ? 'earn' : 'spend'
            }
          ])

        if (pointsError) {
          console.error('포인트 조정 오류:', pointsError)
          // 포인트 조정 실패해도 수익 수정은 성공으로 처리
        }
      }
    }

    return NextResponse.json({
      message: '수익 기록이 수정되었습니다!',
      earning: updatedEarning
    })

  } catch (error) {
    console.error('수익 수정 API 오류:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

// 수익 기록 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ earningId: string }> }
) {
  try {
    const { earningId } = await params
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId') // 권한 확인용

    if (!earningId || !userId) {
      return NextResponse.json(
        { error: '필수 정보가 누락되었습니다.' },
        { status: 400 }
      )
    }

    // 기존 수익 기록 조회 (권한 확인)
    const { data: existingEarning, error: fetchError } = await supabase
      .from('earnings')
      .select('*')
      .eq('id', earningId)
      .eq('user_id', userId) // 본인 기록만 삭제 가능
      .single()

    if (fetchError || !existingEarning) {
      return NextResponse.json(
        { error: '수익 기록을 찾을 수 없거나 삭제 권한이 없습니다.' },
        { status: 404 }
      )
    }

    // 수익 기록 삭제
    const { error: deleteError } = await supabase
      .from('earnings')
      .delete()
      .eq('id', earningId)

    if (deleteError) {
      console.error('수익 삭제 오류:', deleteError)
      return NextResponse.json(
        { error: '수익 삭제에 실패했습니다.' },
        { status: 500 }
      )
    }

    // 지급된 포인트 회수 (음수 포인트 추가)
    if (existingEarning.points_awarded > 0) {
      const { error: pointsError } = await supabase
        .from('points')
        .insert([
          {
            user_id: userId,
            amount: -existingEarning.points_awarded,
            type: 'spend'
          }
        ])

      if (pointsError) {
        console.error('포인트 회수 오류:', pointsError)
        // 포인트 회수 실패해도 삭제는 성공으로 처리
      }
    }

    return NextResponse.json({
      message: '수익 기록이 삭제되었습니다.'
    })

  } catch (error) {
    console.error('수익 삭제 API 오류:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

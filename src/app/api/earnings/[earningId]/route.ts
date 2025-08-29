import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// prerender 방지를 위한 설정
export const dynamic = 'force-dynamic'

// 수입 기록 수정
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ earningId: string }> }
) {
  try {
    const { earningId } = await params
    const body = await request.json()

    if (!earningId) {
      return NextResponse.json(
        { error: '수입 기록 ID가 필요합니다.' },
        { status: 400 }
      )
    }

    // 업데이트할 필드 확인 및 필터링
    const allowedFields = ['amount', 'mission_amount', 'delivery_count', 'platform', 'date', 'screenshot_url', 'screenshot_text']
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

    // 기존 수입 기록 확인 (사용자 권한 체크용)
    const { data: existingRecord, error: checkError } = await supabase
      .from('earnings')
      .select('user_id')
      .eq('id', earningId)
      .single()

    if (checkError || !existingRecord) {
      return NextResponse.json(
        { error: '수입 기록을 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // updated_at 필드 추가
    updateData.updated_at = new Date().toISOString()

    // 데이터베이스 업데이트
    const { data: updatedRecord, error: updateError } = await supabase
      .from('earnings')
      .update(updateData)
      .eq('id', earningId)
      .select('*')
      .single()

    if (updateError || !updatedRecord) {
      console.error('수입 기록 업데이트 오류:', updateError)
      return NextResponse.json(
        { error: '수입 기록 업데이트에 실패했습니다.' },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      message: '수입 기록이 성공적으로 업데이트되었습니다.',
      earning: updatedRecord 
    })

  } catch (error) {
    console.error('수입 기록 업데이트 API 오류:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

// 수입 기록 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ earningId: string }> }
) {
  try {
    const { earningId } = await params

    if (!earningId) {
      return NextResponse.json(
        { error: '수입 기록 ID가 필요합니다.' },
        { status: 400 }
      )
    }

    // 기존 수입 기록 확인 (사용자 권한 체크용)
    const { data: existingRecord, error: checkError } = await supabase
      .from('earnings')
      .select('user_id, amount, mission_amount, delivery_count')
      .eq('id', earningId)
      .single()

    if (checkError || !existingRecord) {
      return NextResponse.json(
        { error: '수입 기록을 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 수입 기록 삭제
    const { error: deleteError } = await supabase
      .from('earnings')
      .delete()
      .eq('id', earningId)

    if (deleteError) {
      console.error('수입 기록 삭제 오류:', deleteError)
      return NextResponse.json(
        { error: '수입 기록 삭제에 실패했습니다.' },
        { status: 500 }
      )
    }

    // 관련 포인트 기록도 삭제 (선택사항)
    // 포인트는 수입과 연결되어 있으므로 삭제 시 고려 필요
    const totalAmount = (existingRecord.amount || 0) + (existingRecord.mission_amount || 0)
    const pointsToDeduct = (existingRecord.delivery_count * 5) + Math.floor(totalAmount * 0.01)

    // 포인트 차감 기록 추가
    await supabase
      .from('points')
      .insert({
        user_id: existingRecord.user_id,
        amount: -pointsToDeduct,
        type: 'deduct',
        description: '수입 기록 삭제로 인한 포인트 차감'
      })

    return NextResponse.json({ 
      message: '수입 기록이 성공적으로 삭제되었습니다.',
      deletedRecord: existingRecord 
    })

  } catch (error) {
    console.error('수입 기록 삭제 API 오류:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
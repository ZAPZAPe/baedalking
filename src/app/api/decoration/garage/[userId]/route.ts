import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// prerender 방지를 위한 설정
export const dynamic = 'force-dynamic'

// 사용자 차고 배치 조회 (새로운 테이블 구조 사용)
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

    // 차고 배치 상세 정보 조회
    const { data: placements, error } = await supabase
      .from('garage_placements_detailed')
      .select('*')
      .eq('user_id', userId)

    if (error) {
      console.error('차고 배치 조회 오류:', error)
      return NextResponse.json(
        { error: '차고 데이터를 불러오는데 실패했습니다.' },
        { status: 500 }
      )
    }

    const formattedPlacements = placements?.map(placement => ({
      id: placement.id,
      itemId: placement.item_id,
      gridPosition: {
        x: placement.position_x,
        y: placement.position_y,
        z: placement.position_z
      },
      placedAt: placement.placed_at,
      updatedAt: placement.updated_at,
      item: {
        id: placement.item_id,
        name: placement.item_name,
        description: placement.item_description,
        imageUrl: placement.item_image_url,
        category: placement.item_category,
        anchor: placement.item_anchor,
        gridData: placement.item_grid_data
      }
    })) || []

    return NextResponse.json({ 
      placements: formattedPlacements,
      count: formattedPlacements.length
    })

  } catch (error) {
    console.error('차고 배치 조회 API 오류:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

// 아이템 배치 (새로운 테이블 구조 사용)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params
    const body = await request.json()
    const { itemId, position } = body

    if (!userId || !itemId || !position) {
      return NextResponse.json(
        { error: '사용자 ID, 아이템 ID, 위치 정보가 필요합니다.' },
        { status: 400 }
      )
    }

    // Supabase 함수를 사용하여 아이템 배치
    const { data: result, error } = await supabase.rpc('place_item', {
      p_user_id: userId,
      p_item_id: itemId,
      p_position_x: position.x,
      p_position_y: position.y,
      p_position_z: position.z
    })

    if (error) {
      console.error('아이템 배치 오류:', error)
      return NextResponse.json(
        { error: '아이템 배치에 실패했습니다.' },
        { status: 500 }
      )
    }

    if (result?.success) {
      return NextResponse.json({
        success: true,
        message: '아이템이 배치되었습니다!'
      })
    } else {
      return NextResponse.json(
        { error: result?.error || '아이템 배치에 실패했습니다.' },
        { status: 400 }
      )
    }

  } catch (error) {
    console.error('아이템 배치 API 오류:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

// 아이템 제거 (새로운 테이블 구조 사용)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params
    const { searchParams } = new URL(request.url)
    const placementId = searchParams.get('placementId')

    if (!userId || !placementId) {
      return NextResponse.json(
        { error: '사용자 ID와 배치 ID가 필요합니다.' },
        { status: 400 }
      )
    }

    // Supabase 함수를 사용하여 아이템 제거
    const { data: result, error } = await supabase.rpc('remove_item', {
      p_user_id: userId,
      p_placement_id: placementId
    })

    if (error) {
      console.error('아이템 제거 오류:', error)
      return NextResponse.json(
        { error: '아이템 제거에 실패했습니다.' },
        { status: 500 }
      )
    }

    if (result?.success) {
      return NextResponse.json({
        success: true,
        message: '아이템이 제거되었습니다!'
      })
    } else {
      return NextResponse.json(
        { error: result?.error || '아이템 제거에 실패했습니다.' },
        { status: 400 }
      )
    }

  } catch (error) {
    console.error('아이템 제거 API 오류:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
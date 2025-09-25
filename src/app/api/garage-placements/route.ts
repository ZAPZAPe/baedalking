import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

// GET: 사용자의 배치된 아이템들 조회
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

    // 배치된 아이템들과 아이템 정보를 함께 조회
    const { data: placements, error } = await supabase
      .from('garage_placements')
      .select(`
        id,
        position_x,
        position_y,
        position_z,
        placed_at,
        item_id,
        shop_items!inner (
          id,
          name,
          description,
          category,
          sub_category,
          image_url,
          pixel_data
        )
      `)
      .eq('user_id', userId)
      .order('placed_at', { ascending: true })

    if (error) {
      console.error('배치된 아이템 조회 실패:', {
        error,
        userId,
        details: error.details,
        hint: error.hint,
        code: error.code
      })
      return NextResponse.json(
        { error: '배치된 아이템 조회에 실패했습니다.', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      placements: placements || []
    })

  } catch (error) {
    console.error('서버 오류:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

// DELETE: 배치된 아이템 제거
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const itemId = searchParams.get('itemId')

    if (!userId || !itemId) {
      return NextResponse.json(
        { error: '사용자 ID와 아이템 ID가 필요합니다.' },
        { status: 400 }
      )
    }

    // 배치된 아이템 제거
    const { data: deletedPlacement, error: deleteError } = await supabase
      .from('garage_placements')
      .delete()
      .eq('user_id', userId)
      .eq('item_id', itemId)
      .select()
      .single()

    if (deleteError || !deletedPlacement) {
      return NextResponse.json(
        { error: '배치된 아이템을 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 1개 배치 시스템: 회수 시 user_items에 복구 (간단하게)
    const { error: insertError } = await supabase
      .from('user_items')
      .insert({
        user_id: userId,
        item_id: itemId,
        quantity: 1
      })
    
    if (insertError) {
      console.log('user_items 복구 중 오류 (이미 존재할 수 있음):', insertError.message)
    }

    return NextResponse.json({
      success: true,
      message: '아이템이 인벤토리로 회수되었습니다.'
    })

  } catch (error) {
    console.error('서버 오류:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

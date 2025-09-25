import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

// DELETE: 사용자의 모든 배치된 아이템 제거
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: '사용자 ID가 필요합니다.' },
        { status: 400 }
      )
    }

    console.log('🗑️ 모든 배치된 아이템 삭제 시작:', userId)

    // 먼저 삭제할 배치들 조회 (로깅용)
    const { data: placementsToDelete, error: selectError } = await supabase
      .from('garage_placements')
      .select('id, item_id')
      .eq('user_id', userId)

    if (selectError) {
      console.error('배치된 아이템 조회 실패:', selectError)
      return NextResponse.json(
        { error: '배치된 아이템 조회에 실패했습니다.' },
        { status: 500 }
      )
    }

    const placementCount = placementsToDelete?.length || 0
    console.log('🗑️ 삭제할 배치된 아이템 개수:', placementCount)

    if (placementCount === 0) {
      return NextResponse.json({
        success: true,
        message: '삭제할 배치된 아이템이 없습니다.',
        deletedCount: 0
      })
    }

    // 모든 배치된 아이템 제거
    const { data: deletedPlacements, error: deleteError } = await supabase
      .from('garage_placements')
      .delete()
      .eq('user_id', userId)
      .select()

    if (deleteError) {
      console.error('배치된 아이템 삭제 실패:', deleteError)
      return NextResponse.json(
        { error: '배치된 아이템 삭제에 실패했습니다.' },
        { status: 500 }
      )
    }

    const actualDeletedCount = deletedPlacements?.length || 0
    console.log('✅ 실제 삭제된 배치 아이템 개수:', actualDeletedCount)

    // 1개 배치 시스템: 모든 아이템을 user_items로 복구
    if (placementsToDelete && placementsToDelete.length > 0) {
      console.log('📦 user_items로 아이템 복구 시작')
      
      // 각 아이템을 user_items에 복구 (중복 무시)
      const itemsToRestore = placementsToDelete.map(placement => ({
        user_id: userId,
        item_id: placement.item_id,
        quantity: 1
      }))

      // upsert를 사용하여 중복된 아이템은 무시하고 새로운 아이템만 추가
      const { data: restoredItems, error: restoreError } = await supabase
        .from('user_items')
        .upsert(itemsToRestore, { 
          onConflict: 'user_id,item_id',
          ignoreDuplicates: true 
        })
        .select()

      if (restoreError) {
        console.log('⚠️ user_items 복구 중 일부 오류 (일부는 이미 존재할 수 있음):', restoreError.message)
      } else {
        console.log('✅ user_items 복구 완료:', restoredItems?.length || 0, '개 아이템')
      }
    }

    return NextResponse.json({
      success: true,
      message: `모든 배치된 아이템이 인벤토리로 회수되었습니다.`,
      deletedCount: actualDeletedCount
    })

  } catch (error) {
    console.error('❌ 서버 오류:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

// POST는 DELETE와 동일한 동작 (UI에서 편리하게 호출하기 위해)
export async function POST(request: NextRequest) {
  return DELETE(request)
}

import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

// 사용자에게 배민커넥터 직접 지급
export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: '사용자 ID가 필요합니다.' }, { status: 400 })
    }


    // 1. 배민커넥터 ID 찾기
    const { data: baeminCharacter, error: characterError } = await supabase
      .from('shop_items')
      .select('*')
      .eq('name', '배민커넥터')
      .eq('category', '캐릭터')
      .eq('sub_category', '캐릭터')
      .single()

    if (characterError || !baeminCharacter) {
      return NextResponse.json({ error: '배민커넥터를 찾을 수 없습니다.' }, { status: 500 })
    }


    // 2. 기존 user_items 삭제 (있다면)
    const { error: deleteError } = await supabase
      .from('user_items')
      .delete()
      .eq('user_id', userId)
      .eq('item_id', baeminCharacter.id)

    if (deleteError) {
    }

    // 3. user_items에 배민커넥터 추가
    const { error: insertError } = await supabase
      .from('user_items')
      .insert({
        user_id: userId,
        item_id: baeminCharacter.id,
        quantity: 1,
        purchased_at: new Date().toISOString()
      })

    if (insertError) {
      return NextResponse.json({ error: 'user_items 추가 실패' }, { status: 500 })
    }


    // 4. users 테이블에서 equipped_character_id 업데이트
    const { error: updateError } = await supabase
      .from('users')
      .update({ 
        equipped_character_id: baeminCharacter.id,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)

    if (updateError) {
      return NextResponse.json({ error: '사용자 캐릭터 장착 실패' }, { status: 500 })
    }


    return NextResponse.json({ 
      success: true,
      characterId: baeminCharacter.id,
      message: '배민커넥터 지급 및 장착 완료!'
    })

  } catch (error) {
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}


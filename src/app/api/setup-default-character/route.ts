import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

// 기본 배민커넥터 캐릭터 설정 (Supabase 클라우드용)
export async function POST(request: NextRequest) {
  try {
    
    // 1. 먼저 배민커넥터가 이미 존재하는지 확인
    const { data: existingCharacter, error: checkError } = await supabase
      .from('shop_items')
      .select('*')
      .eq('name', '배민커넥터')
      .eq('category', '캐릭터')
      .eq('sub_category', '캐릭터')
      .maybeSingle()

    if (checkError) {
      return NextResponse.json({ error: '배민커넥터 확인 실패' }, { status: 500 })
    }

    let baeminCharacterId: string

    if (existingCharacter) {
      baeminCharacterId = existingCharacter.id
    } else {
      
      // 2. 배민커넥터 생성
      const { data: newCharacter, error: createError } = await supabase
        .from('shop_items')
        .insert({
          name: '배민커넥터',
          description: '모든 사용자에게 기본으로 제공되는 캐릭터입니다',
          category: '캐릭터',
          sub_category: '캐릭터',
          image_url: '/Garage/Character/배민/S_1.png',
          price: 0,
          pixel_data: '{"sprite_path": "/Garage/Character/배민/", "preview_image": "/Garage/Character/배민/S_1.png"}',
          is_active: true
        })
        .select()
        .single()

      if (createError) {
        return NextResponse.json({ error: '배민커넥터 생성 실패' }, { status: 500 })
      }

      baeminCharacterId = newCharacter.id
    }

    // 3. 모든 사용자에게 배민커넥터 지급 및 장착
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, equipped_character_id')
      .is('equipped_character_id', null) // 아직 캐릭터가 없는 사용자들만

    if (usersError) {
      return NextResponse.json({ error: '사용자 조회 실패' }, { status: 500 })
    }


    if (users && users.length > 0) {
      // 배민커넥터를 user_items에 추가
      const userItems = users.map(user => ({
        user_id: user.id,
        item_id: baeminCharacterId,
        quantity: 1
      }))

      const { error: insertError } = await supabase
        .from('user_items')
        .upsert(userItems, { onConflict: 'user_id,item_id' })

      if (insertError) {
        return NextResponse.json({ error: 'user_items 추가 실패' }, { status: 500 })
      }

      // 사용자들에게 배민커넥터 장착
      const userIds = users.map(user => user.id)
      const { error: updateError } = await supabase
        .from('users')
        .update({ equipped_character_id: baeminCharacterId })
        .in('id', userIds)

      if (updateError) {
        return NextResponse.json({ error: '사용자 캐릭터 장착 실패' }, { status: 500 })
      }

    }

    return NextResponse.json({ 
      success: true,
      characterId: baeminCharacterId,
      message: `배민커넥터 설정 완료! ${users?.length || 0}명의 사용자에게 지급됨`
    })

  } catch (error) {
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}
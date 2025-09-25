import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

// 사용자의 현재 장착된 캐릭터 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: '사용자 ID가 필요합니다.' }, { status: 400 })
    }

    // users 테이블에서 현재 장착된 캐릭터와 감정표현 조회
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('equipped_character_id, equipped_emotion_id')
      .eq('id', userId)
      .single()

    if (userError) {
      return NextResponse.json({ error: '사용자 정보를 찾을 수 없습니다.' }, { status: 404 })
    }

    let character = null
    let emotion = null

    // 장착된 캐릭터 정보 조회
    if (user.equipped_character_id) {
      const { data: characterData, error: characterError } = await supabase
        .from('shop_items')
        .select('*')
        .eq('id', user.equipped_character_id)
        .single()

      if (!characterError && characterData) {
        character = characterData
      }
    }

    // 장착된 감정표현 정보 조회 (없으면 null)
    if (user.equipped_emotion_id) {
      const { data: emotionData, error: emotionError } = await supabase
        .from('shop_items')
        .select('*')
        .eq('id', user.equipped_emotion_id)
        .single()

      if (!emotionError && emotionData) {
        emotion = emotionData
      }
    }

    return NextResponse.json({ 
      character,
      emotion,
      message: character ? `현재 캐릭터: ${character.name}` : '장착된 캐릭터가 없습니다.'
    })

  } catch (error) {
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}

// 사용자의 캐릭터/감정표현 장착 변경
export async function POST(request: NextRequest) {
  try {
    const { userId, characterId, emotionId } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: '사용자 ID가 필요합니다.' }, { status: 400 })
    }

    const updateData: any = {}
    let messages: string[] = []

    // 캐릭터 변경이 요청된 경우
    if (characterId) {
      // 해당 캐릭터를 사용자가 소유하고 있는지 확인
      const { data: userItem, error: checkError } = await supabase
        .from('user_items')
        .select('*')
        .eq('user_id', userId)
        .eq('item_id', characterId)
        .single()

      if (checkError || !userItem) {
        return NextResponse.json({ error: '소유하지 않은 캐릭터입니다.' }, { status: 400 })
      }

      updateData.equipped_character_id = characterId
      messages.push('캐릭터가 변경되었습니다')
    }

    // 감정표현 변경이 요청된 경우
    if (emotionId !== undefined) {
      if (emotionId === null) {
        // 감정표현 제거 (없음으로 설정)
        updateData.equipped_emotion_id = null
        messages.push('감정표현이 제거되었습니다')
      } else {
        // 해당 감정표현을 사용자가 소유하고 있는지 확인
        const { data: userItem, error: checkError } = await supabase
          .from('user_items')
          .select('*')
          .eq('user_id', userId)
          .eq('item_id', emotionId)
          .single()

        if (checkError || !userItem) {
          return NextResponse.json({ error: '소유하지 않은 감정표현입니다.' }, { status: 400 })
        }

        updateData.equipped_emotion_id = emotionId
        messages.push('감정표현이 변경되었습니다')
      }
    }

    // 업데이트 실행
    if (Object.keys(updateData).length > 0) {
      updateData.updated_at = new Date().toISOString()

      const { error } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', userId)

      if (error) {
        return NextResponse.json({ error: '장착 변경에 실패했습니다.' }, { status: 500 })
      }
    }

    return NextResponse.json({ 
      message: messages.join(', '),
      characterId,
      emotionId
    })

  } catch (error) {
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { CharacterData } from '@/types'

// 캐릭터 데이터 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: '사용자 ID가 필요합니다.' }, { status: 400 })
    }

    // 먼저 캐릭터 데이터 조회
    const { data: characterData, error: characterError } = await supabase
      .from('character_data')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (characterError && characterError.code !== 'PGRST116') {
      throw characterError
    }

    // 캐릭터 데이터가 없으면 기본값 반환
    if (!characterData) {
      const { data: userExists } = await supabase
        .from('users')
        .select('id')
        .eq('id', userId)
        .single()
      
      if (!userExists) {
        return NextResponse.json({ error: '사용자가 존재하지 않습니다. 로그인을 다시 시도해주세요.' }, { status: 404 })
      }
      
      const defaultCharacterData: CharacterData = {
        userId,
        parts: {
          hair: 'none.png',
          top: 'none.png',
          bottom: 'none.png',
          emotion: 'happy.png'
        },
        position: { x: 0, y: 0 },
        isVisible: true,
        imageUrl: undefined,
        equippedItems: []
      }
      return NextResponse.json(defaultCharacterData)
    }

    // 사용자의 캐릭터 아이템 인벤토리 조회
    const { data: inventoryData } = await supabase
      .from('user_inventory')
      .select(`
        id,
        quantity,
        purchased_at,
        item:shop_items(
          id,
          name,
          description,
          main_category,
          sub_category,
          image_url,
          price
        )
      `)
      .eq('user_id', userId)
      .eq('item.main_category', 'character')

    const data = {
      ...characterData,
      user_inventory: inventoryData || []
    }

    const responseData: CharacterData = {
      userId: data.user_id,
      parts: data.parts,
      position: data.position,
      isVisible: data.is_visible,
      imageUrl: data.image_url,
      equippedItems: data.user_inventory || []
    }
    
    return NextResponse.json(responseData)
  } catch (error) {
    console.error('캐릭터 데이터 조회 실패:', error)
    return NextResponse.json({ error: '캐릭터 데이터 조회에 실패했습니다.' }, { status: 500 })
  }
}

// 캐릭터 데이터 저장/업데이트
export async function POST(request: NextRequest) {
  try {
    const characterData: CharacterData = await request.json()
    console.log('📝 캐릭터 API - 받은 데이터:', characterData)
    console.log('📝 캐릭터 API - 데이터 타입 확인:', {
      userId: typeof characterData.userId,
      parts: typeof characterData.parts,
      position: typeof characterData.position,
      isVisible: typeof characterData.isVisible
    })

    if (!characterData.userId) {
      console.log('❌ 사용자 ID 누락')
      return NextResponse.json({ error: '사용자 ID가 필요합니다.' }, { status: 400 })
    }

    // 사용자 존재 여부 확인
    const { data: userExists, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('id', characterData.userId)
      .single()
    
    if (userError || !userExists) {
      console.log('❌ 사용자 존재하지 않음:', characterData.userId)
      return NextResponse.json({ error: '사용자가 존재하지 않습니다. 로그인을 다시 시도해주세요.' }, { status: 404 })
    }

    console.log('💾 Supabase에 저장 시도:', {
      user_id: characterData.userId,
      parts: characterData.parts,
      position: characterData.position,
      is_visible: characterData.isVisible ?? true,
      image_url: characterData.imageUrl
    })

    const { data, error } = await supabase
      .from('character_data')
      .upsert({
        user_id: characterData.userId,
        parts: characterData.parts,
        position: characterData.position,
        is_visible: characterData.isVisible ?? true,
        image_url: characterData.imageUrl,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      })
      .select()
      .single()

    if (error) {
      console.error('❌ Supabase 에러:', error)
      throw error
    }

    console.log('✅ Supabase 저장 성공:', data)

    const savedCharacterData: CharacterData = {
      userId: data.user_id,
      parts: data.parts,
      position: data.position,
      isVisible: data.is_visible,
      imageUrl: data.image_url
    }

    console.log('📤 응답 데이터:', savedCharacterData)
    return NextResponse.json(savedCharacterData)
  } catch (error) {
    console.error('💥 캐릭터 데이터 저장 실패:', error)
    return NextResponse.json({ error: '캐릭터 데이터 저장에 실패했습니다.' }, { status: 500 })
  }
}


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

    const { data, error } = await supabase
      .from('character_data')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        // 데이터가 없는 경우 기본값 반환
        const defaultCharacterData: CharacterData = {
          userId,
          parts: {
            hair: 'hair01.png',
            top: 'jacket01.png',
            bottom: 'pants01.png',
            emotion: 'happy.png'
          },
          position: { x: 0, y: 0 }
        }
        return NextResponse.json(defaultCharacterData)
      }
      throw error
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('캐릭터 데이터 조회 실패:', error)
    return NextResponse.json({ error: '캐릭터 데이터 조회에 실패했습니다.' }, { status: 500 })
  }
}

// 캐릭터 데이터 저장/업데이트
export async function POST(request: NextRequest) {
  try {
    const characterData: CharacterData = await request.json()

    if (!characterData.userId) {
      return NextResponse.json({ error: '사용자 ID가 필요합니다.' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('character_data')
      .upsert({
        user_id: characterData.userId,
        parts: characterData.parts,
        position: characterData.position,
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      throw error
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('캐릭터 데이터 저장 실패:', error)
    return NextResponse.json({ error: '캐릭터 데이터 저장에 실패했습니다.' }, { status: 500 })
  }
}


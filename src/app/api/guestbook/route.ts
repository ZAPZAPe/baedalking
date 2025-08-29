import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// prerender 방지를 위한 설정
export const dynamic = 'force-dynamic'

// 방명록 메시지 조회
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

    const { data: messages, error } = await supabase
      .from('guestbook')
      .select(`
        id,
        message,
        is_private,
        created_at,
        visitor:visitor_id (
          id,
          nickname,
          avatar_config
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) {
      console.error('방명록 조회 오류:', error)
      return NextResponse.json(
        { error: '방명록을 불러오는데 실패했습니다.' },
        { status: 500 }
      )
    }

    return NextResponse.json({ messages })

  } catch (error) {
    console.error('방명록 API 오류:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

// 방명록 메시지 작성
export async function POST(request: NextRequest) {
  try {
    const { userId, visitorId, message, isPrivate = false } = await request.json()

    if (!userId || !visitorId || !message) {
      return NextResponse.json(
        { error: '필수 정보가 누락되었습니다.' },
        { status: 400 }
      )
    }

    // 메시지 길이 제한
    if (message.length > 500) {
      return NextResponse.json(
        { error: '메시지는 500자 이내로 작성해주세요.' },
        { status: 400 }
      )
    }

    const { data: newMessage, error } = await supabase
      .from('guestbook')
      .insert([
        {
          user_id: userId,
          visitor_id: visitorId,
          message: message.trim(),
          is_private: isPrivate
        }
      ])
      .select(`
        id,
        message,
        is_private,
        created_at,
        visitor:visitor_id (
          id,
          nickname,
          avatar_config
        )
      `)
      .single()

    if (error) {
      console.error('방명록 작성 오류:', error)
      return NextResponse.json(
        { error: '방명록 작성에 실패했습니다.' },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      message: '방명록이 작성되었습니다!',
      data: newMessage 
    })

  } catch (error) {
    console.error('방명록 작성 API 오류:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

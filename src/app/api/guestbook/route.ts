import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// prerender 방지를 위한 설정
export const dynamic = 'force-dynamic'

// 방명록 메시지 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '5')
    const offset = (page - 1) * limit

    if (!userId) {
      return NextResponse.json(
        { error: '사용자 ID가 필요합니다.' },
        { status: 400 }
      )
    }

    // URL 디코딩 처리 및 실제 사용자 ID 추출
    const decodedUserId = decodeURIComponent(userId)

    // UUID 형식인지 확인
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(decodedUserId)
    
    let actualUserId = decodedUserId
    
    if (!isUUID) {
      // 닉네임으로 사용자 ID 찾기
      const { data: user, error } = await supabase
        .from('users')
        .select('id')
        .eq('nickname', decodedUserId)
        .single()
      
      if (error || !user) {
        return NextResponse.json(
          { error: '사용자를 찾을 수 없습니다.' },
          { status: 404 }
        )
      }
      
      actualUserId = user.id
    }

    // 전체 메시지 수 조회
    const { count: totalCount, error: countError } = await supabase
      .from('guestbook_entries')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', actualUserId)

    if (countError) {
      return NextResponse.json(
        { error: '방명록을 불러오는데 실패했습니다.' },
        { status: 500 }
      )
    }

    // 페이지네이션된 메시지 조회
    const { data: messages, error } = await supabase
      .from('guestbook_entries')
      .select(`
        id,
        message,
        is_private,
        created_at,
        visitor:visitor_id (
          id,
          nickname
        )
      `)
      .eq('user_id', actualUserId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      return NextResponse.json(
        { error: '방명록을 불러오는데 실패했습니다.' },
        { status: 500 }
      )
    }

    
    return NextResponse.json({ 
      messages, 
      total: totalCount,
      page,
      limit,
      totalPages: Math.ceil((totalCount || 0) / limit)
    })

  } catch (error) {
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
    if (message.length > 200) {
      return NextResponse.json(
        { error: '메시지는 200자 이내로 작성해주세요.' },
        { status: 400 }
      )
    }

    const { data: newMessage, error } = await supabase
      .from('guestbook_entries')
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
          nickname
        )
      `)
      .single()

    if (error) {
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
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

// 방명록 메시지 수정
export async function PUT(request: NextRequest) {
  try {
    
    const requestBody = await request.json()
    
    const { messageId, message, isPrivate = false, userId } = requestBody


    if (!messageId || !userId || !message) {
      return NextResponse.json(
        { error: '필수 정보가 누락되었습니다.' },
        { status: 400 }
      )
    }

    // 메시지 길이 제한
    if (message.length > 200) {
      return NextResponse.json(
        { error: '메시지는 200자 이내로 작성해주세요.' },
        { status: 400 }
      )
    }

    // 먼저 메시지 정보 조회 (권한 확인용)
    const { data: existingMessage, error: fetchError } = await supabase
      .from('guestbook_entries')
      .select('visitor_id')
      .eq('id', messageId)
      .single()


    if (fetchError || !existingMessage) {
      return NextResponse.json(
        { error: '메시지를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 권한 확인: 메시지 작성자만 수정 가능
    if (existingMessage.visitor_id !== userId) {
      return NextResponse.json(
        { error: '수정 권한이 없습니다. 작성자만 수정할 수 있습니다.' },
        { status: 403 }
      )
    }

    // 업데이트 전에 다시 한 번 메시지 존재 확인
    const { data: preUpdateCheck, error: preUpdateError } = await supabase
      .from('guestbook_entries')
      .select('id, message, visitor_id')
      .eq('id', messageId)
      

    const { data: updatedMessage, error: updateError } = await supabase
      .from('guestbook_entries')
      .update({
        message: message.trim(),
        is_private: isPrivate
      })
      .eq('id', messageId)
      .select()
      

    if (updateError) {
      return NextResponse.json(
        { error: '방명록 수정에 실패했습니다.' },
        { status: 500 }
      )
    }

    if (!updatedMessage || updatedMessage.length === 0) {
      return NextResponse.json(
        { error: '수정할 메시지를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    
    return NextResponse.json({ 
      message: '방명록이 수정되었습니다!',
      data: updatedMessage[0] 
    })

  } catch (error) {
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// 방명록 메시지 삭제
export async function DELETE(request: NextRequest) {
  try {
    
    const requestBody = await request.json()
    
    const { messageId, userId } = requestBody


    if (!messageId || !userId) {
      return NextResponse.json(
        { error: '필수 정보가 누락되었습니다.' },
        { status: 400 }
      )
    }

    // 먼저 메시지 정보 조회 (권한 확인용)
    const { data: message, error: fetchError } = await supabase
      .from('guestbook_entries')
      .select('user_id, visitor_id')
      .eq('id', messageId)
      .single()

    if (fetchError || !message) {
      return NextResponse.json(
        { error: '메시지를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 권한 확인: 방명록 주인이거나 메시지 작성자만 삭제 가능
    if (message.user_id !== userId && message.visitor_id !== userId) {
      return NextResponse.json(
        { error: '삭제 권한이 없습니다.' },
        { status: 403 }
      )
    }

    const { error: deleteError } = await supabase
      .from('guestbook_entries')
      .delete()
      .eq('id', messageId)

    if (deleteError) {
      return NextResponse.json(
        { error: '방명록 삭제에 실패했습니다.' },
        { status: 500 }
      )
    }

    
    return NextResponse.json({ 
      message: '방명록이 삭제되었습니다.' 
    })

  } catch (error) {
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

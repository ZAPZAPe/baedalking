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
    console.log('🔍 방명록 조회 요청:', decodedUserId, 'from URL:', request.url)

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
      .from('guestbook')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', actualUserId)

    if (countError) {
      console.error('방명록 개수 조회 오류:', countError)
      return NextResponse.json(
        { error: '방명록을 불러오는데 실패했습니다.' },
        { status: 500 }
      )
    }

    // 페이지네이션된 메시지 조회
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
      .eq('user_id', actualUserId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('방명록 조회 오류:', error)
      return NextResponse.json(
        { error: '방명록을 불러오는데 실패했습니다.' },
        { status: 500 }
      )
    }

    console.log('✅ 방명록 조회 완료:', messages?.length || 0, '개 (총', totalCount, '개)')
    
    return NextResponse.json({ 
      messages, 
      total: totalCount,
      page,
      limit,
      totalPages: Math.ceil((totalCount || 0) / limit)
    })

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
    console.log('📝 방명록 작성 요청:', { userId, visitorId, messageLength: message?.length, isPrivate })

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

    console.log('✅ 방명록 작성 완료:', newMessage?.id)
    
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

// 방명록 메시지 수정
export async function PUT(request: NextRequest) {
  console.log('🔧 방명록 수정 API 호출됨')
  try {
    console.log('📝 방명록 수정 API 시작')
    
    const requestBody = await request.json()
    console.log('📝 요청 본문 파싱 완료:', requestBody)
    
    const { messageId, message, isPrivate = false, userId } = requestBody

    console.log('📝 방명록 수정 요청:', { messageId, userId, messageLength: message?.length, isPrivate })

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
    console.log('🔍 메시지 조회 시작:', messageId)
    const { data: existingMessage, error: fetchError } = await supabase
      .from('guestbook')
      .select('visitor_id')
      .eq('id', messageId)
      .single()

    console.log('🔍 기존 메시지 조회 결과:', { existingMessage, fetchError })

    if (fetchError || !existingMessage) {
      console.error('메시지 조회 오류:', fetchError)
      return NextResponse.json(
        { error: '메시지를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 권한 확인: 메시지 작성자만 수정 가능
    console.log('🔒 권한 확인:', { existingVisitorId: existingMessage.visitor_id, requestUserId: userId })
    if (existingMessage.visitor_id !== userId) {
      return NextResponse.json(
        { error: '수정 권한이 없습니다. 작성자만 수정할 수 있습니다.' },
        { status: 403 }
      )
    }

    // 업데이트 전에 다시 한 번 메시지 존재 확인
    const { data: preUpdateCheck, error: preUpdateError } = await supabase
      .from('guestbook')
      .select('id, message, visitor_id')
      .eq('id', messageId)
      
    console.log('📝 업데이트 전 메시지 존재 확인:', { preUpdateCheck, preUpdateError })

    const { data: updatedMessage, error: updateError } = await supabase
      .from('guestbook')
      .update({
        message: message.trim(),
        is_private: isPrivate
      })
      .eq('id', messageId)
      .select()
      
    console.log('📝 업데이트 결과:', { updatedMessage, updateError })

    if (updateError) {
      console.error('방명록 수정 오류:', updateError)
      return NextResponse.json(
        { error: '방명록 수정에 실패했습니다.' },
        { status: 500 }
      )
    }

    if (!updatedMessage || updatedMessage.length === 0) {
      console.error('메시지 업데이트 실패: 대상 메시지를 찾을 수 없음')
      return NextResponse.json(
        { error: '수정할 메시지를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    console.log('✅ 방명록 수정 완료:', messageId)
    
    return NextResponse.json({ 
      message: '방명록이 수정되었습니다!',
      data: updatedMessage[0] 
    })

  } catch (error) {
    console.error('❌ 방명록 수정 API 오류:', error)
    console.error('❌ 에러 스택:', error instanceof Error ? error.stack : 'Unknown error')
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// 방명록 메시지 삭제
export async function DELETE(request: NextRequest) {
  try {
    console.log('🗑️ 방명록 삭제 API 시작')
    
    const requestBody = await request.json()
    console.log('🗑️ 요청 본문 파싱 완료:', requestBody)
    
    const { messageId, userId } = requestBody

    console.log('🗑️ 방명록 삭제 요청:', { messageId, userId })

    if (!messageId || !userId) {
      return NextResponse.json(
        { error: '필수 정보가 누락되었습니다.' },
        { status: 400 }
      )
    }

    // 먼저 메시지 정보 조회 (권한 확인용)
    const { data: message, error: fetchError } = await supabase
      .from('guestbook')
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
      .from('guestbook')
      .delete()
      .eq('id', messageId)

    if (deleteError) {
      console.error('방명록 삭제 오류:', deleteError)
      return NextResponse.json(
        { error: '방명록 삭제에 실패했습니다.' },
        { status: 500 }
      )
    }

    console.log('✅ 방명록 삭제 완료:', messageId)
    
    return NextResponse.json({ 
      message: '방명록이 삭제되었습니다.' 
    })

  } catch (error) {
    console.error('방명록 삭제 API 오류:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

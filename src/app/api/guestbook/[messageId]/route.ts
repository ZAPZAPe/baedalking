import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// prerender 방지를 위한 설정
export const dynamic = 'force-dynamic'

// 방명록 메시지 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: { messageId: string } }
) {
  try {
    const { messageId } = params
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId') // 삭제 요청자 ID

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

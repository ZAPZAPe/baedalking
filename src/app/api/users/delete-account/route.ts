import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    // 요청 본문에서 사용자 ID 가져오기
    const { userId } = await request.json()
    
    if (!userId) {
      return NextResponse.json({ 
        success: false, 
        error: '사용자 ID가 필요합니다.' 
      }, { status: 400 })
    }

    // 사용자 존재 여부 확인
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('id', userId)
      .single()

    if (userError || !user) {
      return NextResponse.json({ 
        success: false, 
        error: '사용자를 찾을 수 없습니다.' 
      }, { status: 404 })
    }

    console.log(`🗑️ 계정 삭제 시작: ${userId}`)

    // 1. 관련된 모든 데이터 삭제 (강제 삭제)
    console.log('🔄 관련 데이터 강제 삭제 중...')
    
    // 방명록 삭제 (작성자 또는 방문자)
    const { error: guestbookError } = await supabase
      .from('guestbook')
      .delete()
      .or(`user_id.eq.${userId},visitor_id.eq.${userId}`)
    
    if (guestbookError) {
      console.error('방명록 삭제 오류:', guestbookError)
      // 오류가 있어도 계속 진행
    } else {
      console.log('✅ 방명록 삭제 완료')
    }

    // 방문 기록 삭제 (방문자 또는 방문받은 사람)
    const { error: visitsError } = await supabase
      .from('visits')
      .delete()
      .or(`user_id.eq.${userId},visited_user_id.eq.${userId}`)
    
    if (visitsError) {
      console.error('방문 기록 삭제 오류:', visitsError)
    } else {
      console.log('✅ 방문 기록 삭제 완료')
    }

    // 친구 관계 삭제 (요청자 또는 받은 사람)
    const { error: friendsError } = await supabase
      .from('friends')
      .delete()
      .or(`user_id.eq.${userId},friend_id.eq.${userId}`)
    
    if (friendsError) {
      console.error('친구 관계 삭제 오류:', friendsError)
    } else {
      console.log('✅ 친구 관계 삭제 완료')
    }

    // 사용자 아이템 삭제
    const { error: userItemsError } = await supabase
      .from('user_items')
      .delete()
      .eq('user_id', userId)
    
    if (userItemsError) {
      console.error('사용자 아이템 삭제 오류:', userItemsError)
    } else {
      console.log('✅ 사용자 아이템 삭제 완료')
    }

    // 포인트 기록 삭제
    const { error: pointsError } = await supabase
      .from('points')
      .delete()
      .eq('user_id', userId)
    
    if (pointsError) {
      console.error('포인트 기록 삭제 오류:', pointsError)
    } else {
      console.log('✅ 포인트 기록 삭제 완료')
    }

    // 수입 기록 삭제
    const { error: earningsError } = await supabase
      .from('earnings')
      .delete()
      .eq('user_id', userId)
    
    if (earningsError) {
      console.error('수입 기록 삭제 오류:', earningsError)
    } else {
      console.log('✅ 수입 기록 삭제 완료')
    }

    // 2. 마지막으로 사용자 삭제
    console.log('🔄 사용자 삭제 시도...')
    
    const { error: deleteUserError } = await supabase
      .from('users')
      .delete()
      .eq('id', userId)
    
    if (deleteUserError) {
      console.error('사용자 삭제 오류:', deleteUserError)
      return NextResponse.json({ 
        success: false, 
        error: `사용자 삭제 중 오류가 발생했습니다: ${deleteUserError.message}` 
      }, { status: 500 })
    }

    console.log('✅ 모든 데이터 삭제 완료')
    console.log(`✅ 계정 삭제 완료: ${userId}`)

    return NextResponse.json({ 
      success: true, 
      message: '계정이 성공적으로 삭제되었습니다.' 
    })

  } catch (error) {
    console.error('❌ 계정 삭제 예외:', error)
    return NextResponse.json({ 
      success: false, 
      error: '서버 오류가 발생했습니다.' 
    }, { status: 500 })
  }
}

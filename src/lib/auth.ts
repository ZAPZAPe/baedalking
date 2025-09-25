import { NextRequest } from 'next/server'
import { supabase } from './supabase'

/**
 * API 라우트에서 사용자 인증을 검증하는 헬퍼 함수
 */
export async function verifyUser(request: NextRequest): Promise<{ userId: string | null, error: string | null }> {
  try {
    // 헤더에서 user-id 가져오기 (클라이언트에서 전송)
    const userId = request.headers.get('x-user-id')
    
    if (!userId) {
      return { userId: null, error: '인증 정보가 없습니다.' }
    }
    
    // 사용자 존재 여부 확인
    const { data: user, error } = await supabase
      .from('users')
      .select('id')
      .eq('id', userId)
      .single()
    
    if (error || !user) {
      return { userId: null, error: '유효하지 않은 사용자입니다.' }
    }
    
    return { userId: user.id, error: null }
  } catch (error) {
    return { userId: null, error: '인증 검증 중 오류가 발생했습니다.' }
  }
}

/**
 * 요청 본문에서 userId를 추출하고 검증하는 헬퍼 함수
 */
export async function verifyUserFromBody(userId: string | null | undefined): Promise<{ isValid: boolean, error: string | null }> {
  if (!userId) {
    return { isValid: false, error: '사용자 ID가 필요합니다.' }
  }
  
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('id')
      .eq('id', userId)
      .single()
    
    if (error || !user) {
      return { isValid: false, error: '유효하지 않은 사용자입니다.' }
    }
    
    return { isValid: true, error: null }
  } catch (error) {
    return { isValid: false, error: '사용자 검증 중 오류가 발생했습니다.' }
  }
}

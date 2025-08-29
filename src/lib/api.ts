/**
 * API 호출을 위한 헬퍼 함수들
 */

interface ApiOptions extends RequestInit {
  userId?: string
}

/**
 * API 요청을 보내는 헬퍼 함수
 * 자동으로 사용자 ID를 헤더에 포함
 */
export async function apiRequest(url: string, options: ApiOptions = {}) {
  const { userId, headers = {}, ...restOptions } = options
  
  // 로컬 스토리지에서 사용자 정보 가져오기
  let currentUserId = userId
  if (!currentUserId && typeof window !== 'undefined') {
    const kakaoUser = localStorage.getItem('kakaoUser')
    if (kakaoUser) {
      try {
        const userData = JSON.parse(kakaoUser)
        currentUserId = userData.id
      } catch (error) {
        console.error('사용자 정보 파싱 오류:', error)
      }
    }
  }
  
  const finalHeaders = {
    'Content-Type': 'application/json',
    ...(currentUserId && { 'x-user-id': currentUserId }),
    ...headers
  }
  
  try {
    const response = await fetch(url, {
      ...restOptions,
      headers: finalHeaders
    })
    
    const data = await response.json()
    
    if (!response.ok) {
      throw new Error(data.error || '요청 실패')
    }
    
    return { data, error: null }
  } catch (error) {
    console.error('API 요청 오류:', error)
    return { data: null, error: error instanceof Error ? error.message : '알 수 없는 오류' }
  }
}

/**
 * GET 요청 헬퍼
 */
export function apiGet(url: string, options?: ApiOptions) {
  return apiRequest(url, { ...options, method: 'GET' })
}

/**
 * POST 요청 헬퍼
 */
export function apiPost(url: string, body: any, options?: ApiOptions) {
  return apiRequest(url, {
    ...options,
    method: 'POST',
    body: JSON.stringify(body)
  })
}

/**
 * PUT 요청 헬퍼
 */
export function apiPut(url: string, body: any, options?: ApiOptions) {
  return apiRequest(url, {
    ...options,
    method: 'PUT',
    body: JSON.stringify(body)
  })
}

/**
 * DELETE 요청 헬퍼
 */
export function apiDelete(url: string, options?: ApiOptions) {
  return apiRequest(url, { ...options, method: 'DELETE' })
}

'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'

// prerender 방지를 위한 설정
export const dynamic = 'force-dynamic'

function AuthCallbackContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { handleKakaoLogin } = useAuth()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    handleAuthCallback()
  }, [])

  const handleAuthCallback = async () => {
    try {
      // Supabase 세션 확인으로 변경
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
  
        setStatus('success')
        setMessage('이미 로그인되어 있습니다. 메인 페이지로 이동합니다.')
        router.push('/')
        return
      }

      const code = searchParams.get('code')
      const authError = searchParams.get('error')

      if (authError) {
        setStatus('error')
        setMessage('로그인 중 오류가 발생했습니다.')
        setTimeout(() => router.push('/login'), 3000)
        return
      }

      if (!code) {
        setStatus('error')
        setMessage('인증 코드를 받지 못했습니다.')
        setTimeout(() => router.push('/login'), 3000)
        return
      }

      // 카카오 액세스 토큰 획득

      
      const tokenResponse = await fetch('/api/auth/kakao/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code }),
      })

      if (!tokenResponse.ok) {
        const errorText = await tokenResponse.text()
        throw new Error(`토큰 획득 실패: ${tokenResponse.status}`)
      }

      const { access_token } = await tokenResponse.json()

      // 카카오 사용자 정보 획득
      const userResponse = await fetch('https://kapi.kakao.com/v2/user/me', {
        headers: {
          'Authorization': `Bearer ${access_token}`,
        },
      })

      if (!userResponse.ok) {
        throw new Error('사용자 정보 획득 실패')
      }

      const kakaoUser = await userResponse.json()

      // 카카오 사용자 ID로 기존 사용자 확인

      
      const { data: existingUser, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('kakao_id', kakaoUser.id.toString())
        .maybeSingle() // single() 대신 maybeSingle() 사용으로 404 에러 방지

      // 실제 데이터베이스 오류만 처리 (사용자 없음은 정상)
      if (fetchError) {
        throw new Error(`사용자 조회 실패: ${fetchError.message}`)
      }

      if (existingUser) {
        // 기존 사용자가 있는 경우 - 로그인 성공

        // handleKakaoLogin을 통해 Supabase Auth 세션 생성
        await handleKakaoLogin(existingUser)
        
        setStatus('success')
        setMessage('로그인 성공! 메인 페이지로 이동합니다.')
        
        // 단순하게 window.location 사용
        setTimeout(() => {
          window.location.href = '/'
        }, 1500) // 1.5초 후 이동
        
        return
      }

      // 새 사용자 생성 - 스키마에 맞는 데이터 구조 사용
      const profileImageUrl = kakaoUser.properties?.profile_image || kakaoUser.kakao_account?.profile?.profile_image_url
      const userData = {
        email: `${kakaoUser.id}@kakao.com`,
        nickname: kakaoUser.properties?.nickname || kakaoUser.kakao_account?.profile?.nickname || '배달킹',
        kakao_id: kakaoUser.id.toString(),
        region: '서울특별시', // 기본값을 더 구체적으로 설정
        garage_intro: '열심히 달리는 배달킹입니다! 🛵💨',
        status_message: null,
        is_income_private: false,
        goals: { daily: 50000, weekly: 350000, monthly: 1500000 },
        total_visitors: 0
      }

      
      
      const { data: newUser, error: insertError } = await supabase
        .from('users')
        .insert(userData)
        .select()
        .single()

      if (insertError) {
        throw new Error(`사용자 생성 실패: ${insertError.message}`)
      }

      
      // handleKakaoLogin을 통해 Supabase Auth 세션 생성
      await handleKakaoLogin(newUser)
      
      setStatus('success')
      setMessage('회원가입 성공! 계정 설정 페이지로 이동합니다.')
      
      // 계정 설정 페이지로 이동
      
      setTimeout(() => {
        window.location.href = '/auth/setup'
      }, 1500) // 1.5초 후 이동

    } catch (error) {
      setStatus('error')
      setMessage('로그인 처리 중 오류가 발생했습니다.')
      setTimeout(() => router.push('/login'), 3000)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f0f23] via-[#1a1a2e] to-[#16213e] flex items-center justify-center p-4">
      <div className="w-full max-w-md text-center">
        <div className="bg-gradient-to-br from-[#1a1a2e]/90 to-[#16213e]/90 backdrop-blur-lg rounded-2xl p-8 border border-[#00ff88]/20 shadow-2xl">
          {status === 'loading' && (
            <>
              <div className="w-16 h-16 border-4 border-[#00ff88] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <h2 className="text-2xl font-bold text-[#00ff88] mb-2">로그인 처리 중</h2>
              <p className="text-gray-300">잠시만 기다려주세요...</p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="w-16 h-16 bg-[#00ff88] rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-[#1a1a2e]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-[#00ff88] mb-2">로그인 성공!</h2>
              <p className="text-gray-300">{message}</p>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="w-16 h-16 bg-[#ff6b6b] rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-[#ff6b6b] mb-2">로그인 실패</h2>
              <p className="text-gray-300">{message}</p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-[#0f0f23] via-[#1a1a2e] to-[#16213e] flex items-center justify-center p-4">
        <div className="w-full max-w-md text-center">
          <div className="bg-gradient-to-br from-[#1a1a2e]/90 to-[#16213e]/90 backdrop-blur-lg rounded-2xl p-8 border border-[#00ff88]/20 shadow-2xl">
            <div className="w-16 h-16 border-4 border-[#00ff88] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <h2 className="text-2xl font-bold text-[#00ff88] mb-2">로딩 중...</h2>
            <p className="text-gray-300">잠시만 기다려주세요...</p>
          </div>
        </div>
      </div>
    }>
      <AuthCallbackContent />
    </Suspense>
  )
}

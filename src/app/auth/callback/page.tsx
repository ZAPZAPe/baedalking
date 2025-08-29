'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'

// prerender 방지를 위한 설정
export const dynamic = 'force-dynamic'

function AuthCallbackContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    handleAuthCallback()
  }, [])

  const handleAuthCallback = async () => {
    try {
      // 이미 로그인된 사용자가 있는지 확인
      const existingKakaoUser = localStorage.getItem('kakaoUser')
      if (existingKakaoUser) {
        console.log('이미 로그인된 사용자가 있습니다. 메인 페이지로 이동합니다.')
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
        throw new Error('토큰 획득 실패')
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
      let existingUser = null;
      try {
        const { data: userData, error: fetchError } = await supabase
          .from('users')
          .select('*')
          .eq('kakao_id', kakaoUser.id.toString())
          .single()

        if (userData) {
          existingUser = userData;
        }
      } catch (error) {
        // 조회 실패 시 기존 사용자가 없는 것으로 간주
        console.log('기존 사용자 조회 실패, 새 사용자로 진행:', error);
      }

      if (existingUser) {
        // 기존 사용자가 있는 경우 - 로그인 성공
        console.log('기존 사용자 로그인:', existingUser)
        // 로컬 스토리지에 사용자 정보 저장
        localStorage.setItem('kakaoUser', JSON.stringify(existingUser))
        console.log('로컬 스토리지에 기존 사용자 정보 저장됨:', localStorage.getItem('kakaoUser'))
        
        setStatus('success')
        setMessage('로그인 성공! 메인 페이지로 이동합니다.')
        
        // 즉시 이동 시도
        console.log('기존 사용자 - 메인 페이지로 이동 시도...')
        try {
          router.push('/')
        } catch (error) {
          console.error('기존 사용자 router.push 오류:', error)
          // window.location으로 강제 이동
          window.location.href = '/'
        }
        
        // 백업으로 setTimeout 사용
        setTimeout(() => {
          console.log('기존 사용자 - setTimeout으로 메인 페이지 이동 시도...')
          try {
            router.push('/')
          } catch (error) {
            console.error('기존 사용자 setTimeout router.push 오류:', error)
            window.location.href = '/'
          }
        }, 1000)
        
        return
      }

      // 새 사용자 생성
      const { data: newUser, error: insertError } = await supabase
        .from('users')
        .insert({
          email: `${kakaoUser.id}@kakao.com`,
          nickname: kakaoUser.properties?.nickname || '카카오사용자',
          kakao_id: kakaoUser.id.toString(),
          avatar_url: kakaoUser.properties?.profile_image,
          region: '서울', // 기본 지역 설정
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (insertError) {
        console.error('사용자 정보 저장 오류:', insertError)
        throw new Error('사용자 생성 실패')
      }

      console.log('새 사용자 생성:', newUser)
      // 로컬 스토리지에 사용자 정보 저장
      localStorage.setItem('kakaoUser', JSON.stringify(newUser))
      console.log('로컬 스토리지에 사용자 정보 저장됨:', localStorage.getItem('kakaoUser'))
      
      setStatus('success')
      setMessage('회원가입 및 로그인 성공! 메인 페이지로 이동합니다.')
      
      // 즉시 이동 시도
      console.log('메인 페이지로 이동 시도...')
      console.log('현재 URL:', window.location.href)
      console.log('router 객체:', router)
      
      try {
        router.push('/')
        console.log('router.push 성공')
      } catch (error) {
        console.error('router.push 오류:', error)
        // window.location으로 강제 이동
        console.log('window.location.href로 강제 이동 시도...')
        window.location.href = '/'
      }
      
      // 백업으로 setTimeout 사용
      setTimeout(() => {
        console.log('setTimeout으로 메인 페이지 이동 시도...')
        try {
          router.push('/')
        } catch (error) {
          console.error('setTimeout router.push 오류:', error)
          window.location.href = '/'
        }
      }, 1000)

    } catch (error) {
      console.error('인증 콜백 처리 오류:', error)
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

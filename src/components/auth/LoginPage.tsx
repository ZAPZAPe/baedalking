'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'

export default function LoginPage() {
  const { user, signInWithKakao, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    // 이미 로그인된 사용자는 메인 페이지로 리다이렉트
    if (user && !loading) {
      router.push('/')
    }
  }, [user, loading, router])

  const handleKakaoLogin = async () => {
    try {
      await signInWithKakao()
    } catch (error) {
      console.error('카카오 로그인 오류:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0f0f23] via-[#1a1a2e] to-[#16213e] flex items-center justify-center">
        <div className="text-white text-xl">로그인 중...</div>
      </div>
    )
  }

  if (user) {
    return null // 이미 로그인된 경우 리다이렉트 중
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f0f23] via-[#1a1a2e] to-[#16213e] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* 로고 및 제목 */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-[#00ff88] mb-4" 
              style={{textShadow: '0 0 20px rgba(0, 255, 136, 0.5)'}}>
            배달킹
          </h1>
          <p className="text-gray-300 text-lg">배달 기사들을 위한 수입 관리 앱</p>
        </div>

        {/* 로그인 카드 */}
        <div className="bg-gradient-to-br from-[#1a1a2e]/90 to-[#16213e]/90 backdrop-blur-lg rounded-2xl p-8 border border-[#00ff88]/20 shadow-2xl">
          {/* 카카오 로그인 버튼 */}
          <button
            onClick={handleKakaoLogin}
            className="w-full bg-[#FEE500] hover:bg-[#FDD800] text-[#3C1E1E] font-bold py-4 px-6 rounded-xl transition-all duration-200 hover:scale-105 hover:shadow-lg flex items-center justify-center gap-3"
            style={{
              boxShadow: '0 4px 15px rgba(254, 229, 0, 0.3)'
            }}
          >
            {/* 카카오 아이콘 */}
            <div className="w-6 h-6 bg-[#3C1E1E] rounded-full flex items-center justify-center">
              <span className="text-[#FEE500] text-sm font-bold">K</span>
            </div>
            <span className="text-lg">카카오로 시작하기</span>
          </button>

          {/* 설명 텍스트 */}
          <div className="mt-6 text-center">
            <p className="text-gray-400 text-sm">
              카카오 계정으로 간편하게 로그인하고<br />
              배달킹의 모든 기능을 이용하세요
            </p>
          </div>
        </div>

        {/* 푸터 */}
        <div className="text-center mt-8">
          <p className="text-gray-500 text-sm">
            로그인 시 배달킹의{' '}
            <a href="/terms" className="text-[#00ff88] hover:underline">이용약관</a>과{' '}
            <a href="/privacy" className="text-[#00ff88] hover:underline">개인정보처리방침</a>에 동의합니다
          </p>
        </div>
      </div>
    </div>
  )
}

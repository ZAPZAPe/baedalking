'use client'

import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { MainApp } from '@/components/core'
import LoadingScreen from '@/components/ui/LoadingScreen'

// prerender 방지를 위한 설정
export const dynamic = 'force-dynamic'

export default function Home() {
  const { user, loading } = useAuth()
  const router = useRouter()
  
  // 인증 체크
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  // 사용자 프로필 설정 체크 (한 번만 실행)
  useEffect(() => {
    if (!loading && user) {
      // 프로필 완성도 체크 - 더 관대한 기준 적용
      const isProfileComplete = user.nickname && user.region
      
      // localStorage에서 프로필 설정 완료 여부 확인
      const profileSetupCompleted = localStorage.getItem('profileSetupCompleted')
      
      if (!isProfileComplete && !profileSetupCompleted) {
        console.log('프로필 미완성, 설정 페이지로 이동:', { nickname: user.nickname, region: user.region })
        router.push('/auth/setup')
      }
    }
  }, [user, loading, router])

  // 로딩 중이거나 사용자가 없으면 로딩 화면 표시
  if (loading || !user) {
    return <LoadingScreen />
  }

  return <MainApp user={user} />
} 

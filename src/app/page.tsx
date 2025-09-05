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

  // 사용자 프로필 설정 체크
  useEffect(() => {
    if (!loading && user) {
      // 닉네임이 없거나 지역이 기본값인 경우 설정 페이지로 이동
      const isProfileComplete = user.nickname && user.nickname !== '배달킹' && user.region && user.region !== '서울특별시'
      
      if (!isProfileComplete) {
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

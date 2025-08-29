'use client'

import { useState, useEffect, createContext, useContext } from 'react'
import { supabase } from '@/lib/supabase'

interface User {
  id: string
  email: string
  nickname: string
  region?: string
  avatar_url?: string
  kakao_id?: string
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  loading: boolean  // Vercel 호환성을 위해 추가
  signOut: () => Promise<void>
  // Vercel 호환성을 위해 추가
  signUp: (email: string, password: string, nickname: string) => Promise<any>
  signIn: (email: string, password: string) => Promise<any>
  resetPassword: (email: string) => Promise<any>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // 초기 로그인 상태 확인
    checkUser()
  }, [])

  const checkUser = async () => {
    try {
      // 로컬 스토리지에서 카카오 사용자 정보 확인
      const kakaoUser = localStorage.getItem('kakaoUser')
      console.log('useAuth - 로컬 스토리지에서 읽은 사용자 정보:', kakaoUser)
      
      if (kakaoUser) {
        const userData = JSON.parse(kakaoUser)
        console.log('useAuth - 파싱된 사용자 데이터:', userData)
        setUser(userData)
      } else {
        console.log('useAuth - 로컬 스토리지에 사용자 정보 없음')
      }
    } catch (error) {
      console.error('사용자 세션 확인 오류:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleUserSignIn = async (authUser: any) => {
    try {
      // 사용자 정보를 로컬 스토리지에 저장
      localStorage.setItem('kakaoUser', JSON.stringify(authUser))
      setUser(authUser)
    } catch (error) {
      console.error('사용자 로그인 처리 오류:', error)
    }
  }



  const signOut = async () => {
    try {
      // 로컬 스토리지에서 카카오 사용자 정보 제거
      localStorage.removeItem('kakaoUser')
      
      // 추가로 다른 관련 데이터도 정리
      localStorage.removeItem('userIncomePrivate')
      
      // 사용자 상태 초기화
      setUser(null)
      
      console.log('로그아웃 완료 - 사용자 상태 초기화됨')
    } catch (error) {
      console.error('로그아웃 오류:', error)
    }
  }

  const value = {
    user,
    isLoading,
    loading: isLoading,  // Vercel 호환성을 위해 추가
    signOut,
    // Vercel 호환성을 위해 추가
    signUp: async (email: string, password: string, nickname: string) => {
      console.log('signUp called but not implemented')
      return { data: { user: null, session: null }, error: null }
    },
    signIn: async (email: string, password: string) => {
      // 카카오 로그인 처리
      if (email === 'kakao') {
        try {
          // 카카오 로그인 URL로 리다이렉트
          const clientId = process.env.NEXT_PUBLIC_KAKAO_CLIENT_ID || '2a6e20ac0ba97afb3b35ecefb5e1f8ed'
          const redirectUri = process.env.NEXT_PUBLIC_KAKAO_REDIRECT_URI || 'http://localhost:3000/auth/callback'
          
          const kakaoAuthUrl = `https://kauth.kakao.com/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code`
          
          console.log('카카오 로그인 URL:', kakaoAuthUrl)
          window.location.href = kakaoAuthUrl
          return { data: { user: null, session: null }, error: null }
        } catch (error) {
          console.error('카카오 로그인 오류:', error)
          return { data: null, error }
        }
      }
      console.log('signIn called but not implemented')
      return { data: { user: null, session: null }, error: null }
    },
    resetPassword: async (email: string) => {
      console.log('resetPassword called but not implemented')
      return { data: null, error: null }
    }
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

'use client'

import { useState, useEffect, createContext, useContext } from 'react'
import { supabase } from '@/lib/supabase'

interface User {
  id: string
  kakao_id: string
  email: string
  nickname: string
  region: string
  avatar_config: any
  garage_config: any
  status_message?: string
  is_income_private: boolean
  platforms: any[]
  goals: {
    daily: number
    weekly: number
    monthly: number
  }
  total_visitors: number
  daily_visitors: number
  created_at: string
  updated_at: string
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  loading: boolean
  signOut: () => Promise<void>
  signIn: (email: string, password: string) => Promise<any>
  signUp: (email: string, password: string, nickname: string) => Promise<any>
  resetPassword: (email: string) => Promise<any>
  handleKakaoLogin: (kakaoUser: any) => Promise<boolean>
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
    checkUser()
  }, [])

  const checkUser = async () => {
    try {
      // 🔥 핵심 변경: 로컬스토리지에서 kakao_id 확인 후 Supabase에서 사용자 조회
      const kakaoUser = localStorage.getItem('kakaoUser')
      console.log('🔍 useAuth - 로컬 스토리지 확인:', kakaoUser)
      
      if (kakaoUser) {
        const kakaoData = JSON.parse(kakaoUser)
        console.log('📱 useAuth - 카카오 데이터:', kakaoData)
        
        // Supabase에서 해당 kakao_id를 가진 사용자 조회
        const { data: dbUser, error } = await supabase
          .from('users')
          .select('*')
          .eq('kakao_id', kakaoData.kakao_id || kakaoData.id)
          .single()
        
        if (error && error.code !== 'PGRST116') {
          console.error('❌ 사용자 조회 오류:', error)
        } else if (dbUser) {
          console.log('✅ Supabase에서 사용자 찾음:', dbUser)
          setUser(dbUser)
        } else {
          console.log('⚠️ Supabase에 사용자 없음, 새로 생성 필요')
          // 카카오 데이터는 있지만 DB에 없는 경우
          await handleKakaoLogin(kakaoData)
        }
      } else {
        console.log('❌ 로컬 스토리지에 카카오 사용자 정보 없음')
      }
    } catch (error) {
      console.error('❌ 사용자 세션 확인 오류:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // 🔥 핵심 변경: 카카오 로그인 처리 - Supabase 중심
  const handleKakaoLogin = async (kakaoUser: any): Promise<boolean> => {
    try {
      console.log('🔄 카카오 로그인 처리 시작:', kakaoUser)
      
      const userData = {
        kakao_id: kakaoUser.kakao_id || kakaoUser.id || String(kakaoUser.id),
        email: kakaoUser.email || `${kakaoUser.kakao_id || kakaoUser.id}@kakao.com`,
        nickname: kakaoUser.nickname || '배달킹',
        region: kakaoUser.region || '서울',
        avatar_config: kakaoUser.avatar_config || {},
        garage_config: kakaoUser.garage_config || {},
        status_message: kakaoUser.status_message || null,
        is_income_private: kakaoUser.is_income_private || false,
        platforms: kakaoUser.platforms || [
          { id: 'baemin', name: '배민', icon: '/baemin-logo.svg', color: '#00C851', isActive: true, type: 'default' },
          { id: 'coupang', name: '쿠팡', icon: '/coupang-logo.svg', color: '#E4002B', isActive: true, type: 'default' }
        ],
        goals: kakaoUser.goals || { daily: 50000, weekly: 350000, monthly: 1500000 }
      }

      console.log('📊 생성할 사용자 데이터:', userData)

      // Supabase에서 해당 사용자가 이미 있는지 확인
      const { data: existingUser, error: checkError } = await supabase
        .from('users')
        .select('*')
        .eq('kakao_id', userData.kakao_id)
        .single()

      if (checkError && checkError.code !== 'PGRST116') {
        console.error('❌ 사용자 확인 오류:', checkError)
        return false
      }

      let finalUser: User

      if (existingUser) {
        console.log('✅ 기존 사용자 발견, 업데이트:', existingUser)
        
        // 기존 사용자 정보 업데이트
        const { data: updatedUser, error: updateError } = await supabase
          .from('users')
          .update({
            email: userData.email,
            nickname: userData.nickname,
            region: userData.region,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingUser.id)
          .select()
          .single()

        if (updateError) {
          console.error('❌ 사용자 업데이트 오류:', updateError)
          return false
        }

        finalUser = updatedUser
      } else {
        console.log('🆕 새 사용자 생성')
        
        // 새 사용자 생성
        const { data: newUser, error: createError } = await supabase
          .from('users')
          .insert([userData])
          .select()
          .single()

        if (createError) {
          console.error('❌ 사용자 생성 오류:', createError)
          return false
        }

        finalUser = newUser
      }

      console.log('✅ 최종 사용자 정보:', finalUser)

      // 상태 업데이트
      setUser(finalUser)
      
      // 로컬 스토리지에 카카오 정보 저장 (세션 유지용)
      localStorage.setItem('kakaoUser', JSON.stringify({
        ...kakaoUser,
        id: finalUser.id,
        kakao_id: finalUser.kakao_id
      }))

      console.log('🎉 카카오 로그인 처리 완료!')
      return true
      
    } catch (error) {
      console.error('❌ 카카오 로그인 처리 실패:', error)
      return false
    }
  }

  const signOut = async () => {
    try {
      // 로컬 스토리지 정리
      localStorage.removeItem('kakaoUser')
      localStorage.removeItem('cached_income_records')
      localStorage.removeItem('userIncomePrivate')
      localStorage.removeItem('userPlatforms')
      localStorage.removeItem('userIncomeRecords')
      
      // 상태 초기화
      setUser(null)
      
      console.log('✅ 로그아웃 완료 - 모든 데이터 정리됨')
    } catch (error) {
      console.error('❌ 로그아웃 오류:', error)
    }
  }

  // Vercel 호환성을 위한 더미 함수들
  const signIn = async (email: string, password: string) => {
    if (email === 'kakao') {
      try {
        const clientId = process.env.NEXT_PUBLIC_KAKAO_CLIENT_ID
        const redirectUri = process.env.NEXT_PUBLIC_KAKAO_REDIRECT_URI || 'http://localhost:3001/auth/callback'
        
        const kakaoAuthUrl = `https://kauth.kakao.com/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code`
        
        console.log('🔗 카카오 로그인 URL:', kakaoAuthUrl)
        window.location.href = kakaoAuthUrl
        return { data: { user: null, session: null }, error: null }
      } catch (error) {
        console.error('❌ 카카오 로그인 오류:', error)
        return { data: null, error }
      }
    }
    console.log('ℹ️ signIn called but not implemented for:', email)
    return { data: { user: null, session: null }, error: null }
  }

  const signUp = async (email: string, password: string, nickname: string) => {
    console.log('ℹ️ signUp called but not implemented')
    return { data: { user: null, session: null }, error: null }
  }

  const resetPassword = async (email: string) => {
    console.log('ℹ️ resetPassword called but not implemented')
    return { data: null, error: null }
  }

  const value = {
    user,
    isLoading,
    loading: isLoading,
    signOut,
    signIn,
    signUp,
    resetPassword,
    handleKakaoLogin
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

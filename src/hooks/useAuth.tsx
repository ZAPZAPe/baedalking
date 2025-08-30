'use client'

import { useState, useEffect, createContext, useContext } from 'react'
import { supabase } from '@/lib/supabase'
import type { Session, User as SupabaseUser } from '@supabase/supabase-js'

interface User {
  id: string
  kakao_id: string
  email: string
  nickname: string
  region: string
  avatar_config: any // JSONB 타입으로 프로필 이미지 URL 등 저장
  garage_config: any // JSONB 타입으로 차고 설정 저장
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
  session: Session | null
  isLoading: boolean
  loading: boolean
  setUser: (user: User | null) => void
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
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // 제대로 된 사용자 세션 확인
    const initializeAuth = async () => {
      console.log('🔄 Auth 초기화 시작')
      
      try {
        // 1. 먼저 기존 Supabase 세션 확인
        const { data: { session } } = await supabase.auth.getSession()
        
        if (session?.user) {
          console.log('✅ 기존 Supabase 세션 발견:', session.user.id)
          await loadUserFromSupabase(session.user)
          setSession(session)
        } else {
          console.log('❌ 기존 Supabase 세션 없음')
          
          // 2. 로컬에 저장된 카카오 세션 확인 (fallback)
          if (typeof window !== 'undefined') {
            const kakaoUser = localStorage.getItem('kakaoUser')
            if (kakaoUser) {
              try {
                const userData = JSON.parse(kakaoUser)
                console.log('📱 로컬 카카오 세션 발견:', userData.kakao_id)
                
                // 카카오 데이터로 사용자 복원
                const { data: existingUser } = await supabase
                  .from('users')
                  .select('*')
                  .eq('kakao_id', userData.kakao_id)
                  .single()
                
                if (existingUser) {
                  console.log('✅ 카카오 세션으로 사용자 복원:', existingUser.nickname)
                  setUser(existingUser)
                  
                  // Mock 세션 생성
                  setSession({
                    access_token: 'restored_token',
                    refresh_token: 'restored_refresh',
                    expires_in: 3600,
                    expires_at: Date.now() + 3600000,
                    token_type: 'bearer',
                    user: {
                      id: existingUser.id,
                      email: existingUser.email,
                      user_metadata: { kakao_id: existingUser.kakao_id },
                      app_metadata: {},
                      aud: 'authenticated',
                      created_at: existingUser.created_at,
                      role: 'authenticated',
                      updated_at: existingUser.updated_at
                    }
                  })
                }
              } catch (error) {
                console.error('❌ 로컬 세션 복원 실패:', error)
                // 손상된 로컬 데이터 제거
                localStorage.removeItem('kakaoUser')
              }
            }
          }
        }
      } catch (error) {
        console.error('❌ Auth 초기화 오류:', error)
      } finally {
        setIsLoading(false)
      }
    }

    initializeAuth()
  }, [])

  const loadUserFromSupabase = async (supabaseUser: SupabaseUser) => {
    try {
      const { data: dbUser, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', supabaseUser.id)
        .single()
      
      if (error && error.code !== 'PGRST116') {
        console.error('❌ 사용자 데이터 로드 오류:', error)
        return
      }

      if (dbUser) {
        console.log('✅ 사용자 데이터 로드 완료:', dbUser.nickname)
        setUser(dbUser)
      } else {
        console.log('⚠️ 사용자 데이터 없음 - 프로필 설정 필요')
        // 인증은 됐지만 프로필이 없는 경우
        setUser(null)
      }
    } catch (error) {
      console.error('❌ 사용자 데이터 로드 실패:', error)
    }
  }

  // 🔥 카카오 로그인 처리 - 직접 사용자 데이터 관리 (Auth 없이)
  const handleKakaoLogin = async (kakaoUser: any): Promise<boolean> => {
    try {
      console.log('🔄 카카오 로그인 처리 시작:', kakaoUser)
      
      // 1. 사용자 데이터 준비
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
        goals: kakaoUser.goals || { daily: 50000, weekly: 350000, monthly: 1500000 },
        total_visitors: 0,
        daily_visitors: 0
      }

      console.log('📊 생성할 사용자 데이터:', userData)

      // 2. 기존 사용자 확인
      const { data: existingUser, error: checkError } = await supabase
        .from('users')
        .select('*')
        .eq('kakao_id', userData.kakao_id)
        .single()

      let finalUser: User

      if (checkError && checkError.code !== 'PGRST116') {
        console.error('❌ 사용자 조회 오류:', checkError)
        return false
      }

      if (existingUser) {
        console.log('✅ 기존 사용자 발견:', existingUser)
        finalUser = existingUser
      } else {
        console.log('🆕 새 사용자 생성')
        
        // 3. 새 사용자 생성
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
      setUser(finalUser)

      // 4. 로컬 스토리지에 카카오 세션 저장 (세션 복원용)
      if (typeof window !== 'undefined') {
        localStorage.setItem('kakaoUser', JSON.stringify({
          ...kakaoUser,
          id: finalUser.id,
          kakao_id: finalUser.kakao_id,
          nickname: finalUser.nickname,
          email: finalUser.email
        }))
      }

      // 5. 세션 상태 설정
      setSession({
        access_token: 'kakao_token',
        refresh_token: 'kakao_refresh',
        expires_in: 3600,
        expires_at: Date.now() + 3600000,
        token_type: 'bearer',
        user: {
          id: finalUser.id,
          email: finalUser.email,
          user_metadata: { kakao_id: finalUser.kakao_id },
          app_metadata: {},
          aud: 'authenticated',
          created_at: finalUser.created_at,
          role: 'authenticated',
          updated_at: finalUser.updated_at
        }
      })

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
      if (typeof window !== 'undefined') {
        localStorage.removeItem('kakaoUser')
      }
      
      // 상태 초기화
      setUser(null)
      setSession(null)
      
      console.log('✅ 로그아웃 완료 - 모든 세션 데이터 정리됨')
    } catch (error) {
      console.error('❌ 로그아웃 오류:', error)
    }
  }

  // 카카오 로그인 시작 함수
  const signIn = async (email: string, password: string) => {
    if (email === 'kakao') {
      try {
        const clientId = process.env.NEXT_PUBLIC_KAKAO_CLIENT_ID
        const redirectUri = process.env.NEXT_PUBLIC_KAKAO_REDIRECT_URI
        
        if (!clientId || !redirectUri) {
          console.error('❌ 카카오 환경변수 누락:', { clientId: !!clientId, redirectUri: !!redirectUri })
          return { data: null, error: new Error('카카오 로그인 설정이 누락되었습니다.') }
        }
        
        const kakaoAuthUrl = `https://kauth.kakao.com/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code`
        
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
    session,
    isLoading,
    loading: isLoading,
    setUser,
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

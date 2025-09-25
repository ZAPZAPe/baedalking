'use client'

import { useState, useEffect, createContext, useContext } from 'react'
import { supabase } from '@/lib/supabase'
import type { Session, User as SupabaseUser } from '@supabase/supabase-js'
import { User } from '@/types'

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
      try {
        // 1. 먼저 기존 Supabase 세션 확인
        const { data: { session } } = await supabase.auth.getSession()
        
        if (session?.user) {
          await loadUserFromSupabase(session.user)
          setSession(session)
        } else {
          // 2. Supabase에서 사용자 세션 확인 (더 엄격한 검증)
          
          // 카카오 ID로 사용자 확인 (더 정확한 방법)
          if (typeof window !== 'undefined') {
            const kakaoUser = localStorage.getItem('kakaoUser')
            if (kakaoUser) {
              try {
                const userData = JSON.parse(kakaoUser)
                const kakaoId = userData.kakao_id || userData.id
                
                if (kakaoId) {
                  const { data: existingUser, error: userError } = await supabase
                    .from('users')
                    .select('*')
                    .eq('kakao_id', String(kakaoId))
                    .single()
                  
                  if (existingUser && !userError) {
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
                  } else {
                    setUser(null)
                  }
                } else {
                  setUser(null)
                }
              } catch (error) {
                setUser(null)
              }
            } else {
              setUser(null)
            }
          } else {
            setUser(null)
          }
        }
      } catch (error) {
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
        return
      }

      if (dbUser) {
        setUser(dbUser)
      } else {
        // 인증은 됐지만 프로필이 없는 경우
        setUser(null)
      }
    } catch (error) {
    }
  }

  // 🔥 카카오 로그인 처리 - 직접 사용자 데이터 관리 (Auth 없이)
  const handleKakaoLogin = async (kakaoUser: any): Promise<boolean> => {
    try {
      
      // 1. 사용자 데이터 준비
      const userData = {
        kakao_id: kakaoUser.kakao_id || kakaoUser.id || String(kakaoUser.id),
        email: kakaoUser.email || `${kakaoUser.kakao_id || kakaoUser.id}@kakao.com`,
        nickname: kakaoUser.nickname || '배달킹',
        region: kakaoUser.region || '서울',
        garage_intro: '열심히 달리는 배달킹입니다! 🛵💨',
        status_message: kakaoUser.status_message || null,
        is_income_private: kakaoUser.is_income_private || false,
        goals: kakaoUser.goals || { daily: 50000, weekly: 350000, monthly: 1500000 },
        total_visitors: 0
      }


      // 2. 기존 사용자 확인
      const { data: existingUser, error: checkError } = await supabase
        .from('users')
        .select('*')
        .eq('kakao_id', String(userData.kakao_id))
        .maybeSingle() // single() 대신 maybeSingle() 사용으로 404 에러 방지

      let finalUser: User

      if (checkError) {
        return false
      }

      if (existingUser) {
        finalUser = existingUser
      } else {
        
        // 3. 새 사용자 생성
        const { data: newUser, error: createError } = await supabase
          .from('users')
          .insert([userData])
          .select()
          .single()

        if (createError) {
          return false
        }

        finalUser = newUser
      }

      setUser(finalUser)

      // localStorage에 사용자 정보 저장 (페이지 새로고침 시 복원용)
      if (typeof window !== 'undefined') {
        localStorage.setItem('kakaoUser', JSON.stringify(finalUser))
      }

      // 4. Supabase에 업데이트 시간만 업데이트 (last_login 컬럼이 없으므로 제거)
      try {
        const { error: updateError } = await supabase
          .from('users')
          .update({ 
            updated_at: new Date().toISOString()
          })
          .eq('id', finalUser.id)
        
        if (updateError) {
        } else {
        }
      } catch (updateError) {
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
          created_at: finalUser.created_at || new Date().toISOString(),
          role: 'authenticated',
          updated_at: finalUser.updated_at || new Date().toISOString()
        }
      })

      return true
      
    } catch (error) {
      return false
    }
  }

  const signOut = async () => {
    try {
      // Supabase에서 로그아웃 처리 (updated_at만 업데이트)
      if (user) {
        try {
          const { error: updateError } = await supabase
            .from('users')
            .update({ 
              updated_at: new Date().toISOString()
            })
            .eq('id', user.id)
          
          if (updateError) {
          } else {
          }
        } catch (updateError) {
        }
      }
      
      // 상태 초기화
      setUser(null)
      setSession(null)
      
      // localStorage 정리
      if (typeof window !== 'undefined') {
        localStorage.removeItem('kakaoUser')
        localStorage.removeItem('profileSetupCompleted')
      }
      
    } catch (error) {
    }
  }

  // 카카오 로그인 시작 함수
  const signIn = async (email: string, password: string) => {
    if (email === 'kakao') {
      try {
        const clientId = process.env.NEXT_PUBLIC_KAKAO_CLIENT_ID
        const redirectUri = process.env.NEXT_PUBLIC_KAKAO_REDIRECT_URI
        
        if (!clientId || !redirectUri) {
          return { data: null, error: new Error('카카오 로그인 설정이 누락되었습니다.') }
        }
        
        const kakaoAuthUrl = `https://kauth.kakao.com/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code`
        
        window.location.href = kakaoAuthUrl
        return { data: { user: null, session: null }, error: null }
      } catch (error) {
        return { data: null, error }
      }
    }
    return { data: { user: null, session: null }, error: null }
  }

  const signUp = async (email: string, password: string, nickname: string) => {
    return { data: { user: null, session: null }, error: null }
  }

  const resetPassword = async (email: string) => {
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

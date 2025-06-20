'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { supabase, clearOldSession } from '../lib/supabase';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { logoutKakao } from '@/services/kakaoAuth';

export interface User {
  id: string;
  email: string;
  nickname?: string;
  region?: string;
  vehicle?: string;
  phone?: string;
  points?: number;
  totalDeliveries?: number;
  totalEarnings?: number;
  profileImage?: string;
  referral_code?: string;
  referred_by?: string; // 추천인 ID
  notificationSettings?: {
    [key: string]: boolean;
  };
  role?: 'user' | 'admin';
}

interface AuthContextType {
  user: SupabaseUser | null;
  userProfile: User | null;
  loading: boolean;
  signUp: (nickname: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<User>) => Promise<void>;
  refreshUserProfile: () => Promise<void>;
  isProfileComplete: (profile: User | null) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// 프로필 캐시
const profileCache = new Map<string, { data: User; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5분

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isCheckingSession, setIsCheckingSession] = useState(false);

  const loadUserProfile = useCallback(async (authUser: SupabaseUser) => {
    try {
      // 캐시 확인
      const cached = profileCache.get(authUser.id);
      if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        setUserProfile(cached.data);
        return;
      }

      // 프로필 조회
      const { data: profile, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('프로필 로드 실패:', error);
        // 네트워크 에러나 리소스 부족 에러는 조용히 처리
        if (error.message?.includes('Failed to fetch') || 
            error.message?.includes('ERR_INSUFFICIENT_RESOURCES') ||
            error.code === 'ERR_INSUFFICIENT_RESOURCES') {
          console.warn('네트워크 또는 리소스 에러로 인한 프로필 로드 실패');
          setUserProfile(null);
          return;
        }
        throw error;
      }

      // 프로필이 존재하지 않는 경우 새로 생성
      if (!profile) {
        console.log('프로필이 존재하지 않음. 새로 생성 중...');
        
        // 고유한 username 생성 (이메일 + 타임스탬프)
        const uniqueUsername = `${authUser.email?.split('@')[0] || 'user'}_${Date.now()}`;
        
        // 카카오에서 받은 사용자 정보 추출
        console.log('🔍 카카오 사용자 메타데이터 전체:', authUser.user_metadata);
        console.log('🔍 앱 메타데이터:', authUser.app_metadata);
        
        // 다양한 필드에서 닉네임 추출 시도
        const kakaoNickname = authUser.user_metadata?.name || 
                             authUser.user_metadata?.full_name || 
                             authUser.user_metadata?.nickname ||
                             authUser.user_metadata?.properties?.nickname ||
                             authUser.user_metadata?.kakao_account?.profile?.nickname ||
                             '';
        
        console.log('🎯 추출된 카카오 닉네임:', kakaoNickname);
        console.log('📧 이메일:', authUser.email);
        
        // 추천코드 생성 (5자리: 3글자 + 2숫자)
        const generateReferralCode = () => {
          const letters = Math.random().toString(36).substring(2, 5).toUpperCase();
          const numbers = Math.floor(Math.random() * 100).toString().padStart(2, '0');
          return letters + numbers;
        };
        
        const referralCode = generateReferralCode();
        
        try {
          // 먼저 일반 클라이언트로 시도 (RLS 정책 허용 시)
          const { data: newProfile, error: createError } = await supabase
            .from('users')
            .upsert({
              id: authUser.id,
              email: authUser.email,
              username: uniqueUsername,
              nickname: kakaoNickname, // 카카오 닉네임 자동 설정
              referral_code: referralCode, // 추천코드 자동 생성
              points: 0,
              total_deliveries: 0,
              total_earnings: 0
            }, {
              onConflict: 'id',
              ignoreDuplicates: false
            })
            .select()
            .single();

          if (createError) {
            console.log('일반 클라이언트로 프로필 생성 실패, Admin 클라이언트 시도...');
            
            // Admin 클라이언트로 시도
            const { supabaseAdmin } = await import('@/lib/supabase-admin');
            
            if (!supabaseAdmin) {
              console.warn('Admin 클라이언트 없음. 기본 프로필로 진행...');
              // Admin 클라이언트가 없어도 기본 프로필 생성
              const basicUserData: User = {
                id: authUser.id,
                email: authUser.email || '',
                nickname: kakaoNickname, // 카카오 닉네임 설정
                region: '',
                vehicle: '',
                phone: '',
                points: 0,
                totalDeliveries: 0,
                totalEarnings: 0,
                profileImage: '',
                referral_code: referralCode, // 추천코드 설정
                notificationSettings: {},
                role: 'user',
              };
              setUserProfile(basicUserData);
              profileCache.set(authUser.id, { data: basicUserData, timestamp: Date.now() });
              return;
            }
            
            // Admin 클라이언트로 재시도
            const { data: adminProfile, error: adminError } = await supabaseAdmin
              .from('users')
              .upsert({
                id: authUser.id,
                email: authUser.email,
                username: uniqueUsername,
                nickname: kakaoNickname, // 카카오 닉네임 자동 설정
                referral_code: referralCode, // 추천코드 자동 생성
                points: 0,
                total_deliveries: 0,
                total_earnings: 0
              }, {
                onConflict: 'id',
                ignoreDuplicates: false
              })
              .select()
              .single();

            if (adminError) {
              console.error('Admin 클라이언트로도 프로필 생성 실패:', adminError);
              // 그래도 기본 프로필로 진행
              const basicUserData: User = {
                id: authUser.id,
                email: authUser.email || '',
                nickname: kakaoNickname, // 카카오 닉네임 설정
                region: '',
                vehicle: '',
                phone: '',
                points: 0,
                totalDeliveries: 0,
                totalEarnings: 0,
                profileImage: '',
                referral_code: referralCode, // 추천코드 설정
                notificationSettings: {},
                role: 'user',
              };
              setUserProfile(basicUserData);
              profileCache.set(authUser.id, { data: basicUserData, timestamp: Date.now() });
              return;
            }

            // Admin으로 성공한 경우
            const userData: User = {
              id: authUser.id,
              email: authUser.email || '',
              nickname: adminProfile?.nickname || kakaoNickname, // 카카오 닉네임 우선
              region: adminProfile?.region || '',
              vehicle: adminProfile?.vehicle || '',
              phone: adminProfile?.phone || '',
              points: adminProfile?.points || 0,
              totalDeliveries: adminProfile?.total_deliveries || 0,
              totalEarnings: adminProfile?.total_earnings || 0,
              profileImage: adminProfile?.profile_image || '',
              referral_code: adminProfile?.referral_code || referralCode, // 추천코드 설정
              notificationSettings: adminProfile?.notification_settings || {},
              role: adminProfile?.role || 'user',
            };

            setUserProfile(userData);
            profileCache.set(authUser.id, { data: userData, timestamp: Date.now() });
            console.log('✅ 카카오 사용자 프로필 생성 완료:', { nickname: kakaoNickname, referralCode });
            return;
          }

          // 일반 클라이언트로 성공한 경우
          const userData: User = {
            id: authUser.id,
            email: authUser.email || '',
            nickname: newProfile?.nickname || '',
            region: newProfile?.region || '',
            vehicle: newProfile?.vehicle || '',
            phone: newProfile?.phone || '',
            points: newProfile?.points || 0,
            totalDeliveries: newProfile?.total_deliveries || 0,
            totalEarnings: newProfile?.total_earnings || 0,
            profileImage: newProfile?.profile_image || '',
            referral_code: newProfile?.referral_code || '',
            notificationSettings: newProfile?.notification_settings || {},
            role: newProfile?.role || 'user',
          };

          setUserProfile(userData);
          profileCache.set(authUser.id, { data: userData, timestamp: Date.now() });
          return;
        } catch (err) {
          console.error('프로필 생성 중 예외 발생:', err);
          // 모든 시도가 실패해도 기본 프로필로 진행
          const basicUserData: User = {
            id: authUser.id,
            email: authUser.email || '',
            nickname: '',
            region: '',
            vehicle: '',
            phone: '',
            points: 0,
            totalDeliveries: 0,
            totalEarnings: 0,
            profileImage: '',
            referral_code: '',
            notificationSettings: {},
            role: 'user',
          };
          setUserProfile(basicUserData);
          profileCache.set(authUser.id, { data: basicUserData, timestamp: Date.now() });
          return;
        }
      }

      // 프로필이 존재하는 경우
      let referralCode = profile?.referral_code;
      
      // referral_code가 없으면 생성
      if (!referralCode) {
        // 새로운 5자리 코드 생성 (3글자 + 2숫자)
        let attempts = 0;
        do {
          const letters = Math.random().toString(36).substring(2, 5).toUpperCase();
          const numbers = Math.floor(Math.random() * 100).toString().padStart(2, '0');
          referralCode = letters + numbers;
          attempts++;

          // 중복 확인
          const { data: existing } = await supabase
            .from('users')
            .select('id')
            .eq('referral_code', referralCode)
            .single();

          if (!existing) break;
        } while (attempts < 10);

        if (attempts < 10) {
          // referral_code 업데이트
          const { error: updateError } = await supabase
            .from('users')
            .update({ referral_code: referralCode })
            .eq('id', authUser.id);

          if (updateError) {
            console.error('referral_code 업데이트 실패:', updateError);
            referralCode = ''; // 실패 시 빈 문자열
          }
        } else {
          console.error('고유한 referral_code 생성 실패');
          referralCode = '';
        }
      }

      const userData: User = {
        id: authUser.id,
        email: authUser.email || '',
        nickname: profile?.nickname || '',
        region: profile?.region || '',
        vehicle: profile?.vehicle || '',
        phone: profile?.phone || '',
        points: profile?.points || 0,
        totalDeliveries: profile?.total_deliveries || 0,
        totalEarnings: profile?.total_earnings || 0,
        profileImage: profile?.profile_image || '',
        referral_code: referralCode || '',
        notificationSettings: profile?.notification_settings || {},
        role: profile?.role || 'user',
      };

      setUserProfile(userData);
      // 캐시에 저장
      profileCache.set(authUser.id, { data: userData, timestamp: Date.now() });
    } catch (error) {
      console.error('프로필 로드 실패:', error);
      setUserProfile(null);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    let sessionCheckTimeout: NodeJS.Timeout;
    let retryCount = 0;
    const MAX_RETRIES = 2;

    const checkAuthState = async () => {
      // 이미 세션 체크 중이면 중복 실행 방지
      if (isCheckingSession) return;
      
      setIsCheckingSession(true);
      
      const attemptSessionCheck = async (): Promise<any> => {
        try {
          // 오래된 세션 정리
          clearOldSession();
          
          // 세션 체크에 타임아웃 설정 (3초로 단축)
          const sessionPromise = supabase.auth.getSession();
          const timeoutPromise = new Promise((_, reject) => {
            sessionCheckTimeout = setTimeout(() => reject(new Error('Session check timeout')), 3000);
          });
          
          const result = await Promise.race([
            sessionPromise,
            timeoutPromise
          ]) as any;
          
          clearTimeout(sessionCheckTimeout);
          
          if (result?.data?.session) {
            return result.data.session;
          } else if (result?.session) {
            return result.session;
          }
          
          return null;
        } catch (error: any) {
          clearTimeout(sessionCheckTimeout);
          
          // 네트워크 에러나 리소스 부족 에러는 재시도하지 않음
          if (error.message?.includes('Failed to fetch') || 
              error.message?.includes('ERR_INSUFFICIENT_RESOURCES') ||
              error.code === 'ERR_INSUFFICIENT_RESOURCES') {
            console.warn('네트워크 또는 리소스 에러, 재시도 중단:', error.message);
            return null;
          }
          
          // 타임아웃 발생 시에만 재시도
          if (error.message === 'Session check timeout' && retryCount < MAX_RETRIES) {
            retryCount++;
            console.log(`세션 체크 재시도 ${retryCount}/${MAX_RETRIES}`);
            await new Promise(resolve => setTimeout(resolve, 1000)); // 1초로 증가
            return attemptSessionCheck();
          }
          
          throw error;
        }
      };
      
      try {
        const session = await attemptSessionCheck();
        
        if (mounted && session?.user) {
          setUser(session.user);
          await loadUserProfile(session.user);
        } else if (mounted) {
          // 캐시된 프로필 확인
          if (user?.id) {
            const cached = profileCache.get(user.id);
            if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
              setUserProfile(cached.data);
            }
          } else {
            setUser(null);
            setUserProfile(null);
          }
        }
      } catch (error: any) {
        console.error('세션 체크 에러:', error);
        if (mounted) {
          // 카카오 로그인 직후인지 확인
          let isKakaoCallback = false;
          if (typeof window !== 'undefined') {
            const urlParams = new URLSearchParams(window.location.search);
            isKakaoCallback = window.location.pathname.includes('/auth/kakao/callback') || urlParams.has('code');
          }
          
          if (!isKakaoCallback) {
            console.log('세션 체크 실패 - 로컬 스토리지 정리');
            // 모든 관련 스토리지 키 정리
            ['supabase.auth.token', 'sb-auth-token', 'baedalking-auth'].forEach(key => {
              localStorage.removeItem(key);
              sessionStorage.removeItem(key);
            });
          }
          
          setUser(null);
          setUserProfile(null);
        }
      } finally {
        if (mounted) {
          setLoading(false);
          setIsCheckingSession(false);
        }
      }
    };

    checkAuthState();

    // Supabase auth 상태 변화 감지
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;
      
      console.log('Auth 상태 변경:', event);
      
      if (session?.user) {
        setUser(session.user);
        await loadUserProfile(session.user);
      } else {
        setUser(null);
        setUserProfile(null);
      }
      setLoading(false);
    });

    return () => {
      mounted = false;
      clearTimeout(sessionCheckTimeout);
      subscription.unsubscribe();
    };
  }, []); // 빈 의존성 배열로 변경하여 무한 루프 방지

  const signUp = useCallback(async (nickname: string) => {
    try {
      setLoading(true);
      
      // 카카오 로그인으로 회원가입
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.baedalrank.com';
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'kakao',
        options: {
          redirectTo: `${appUrl}/auth/kakao/callback`,
          queryParams: {
            scope: 'profile_nickname account_email',
            redirect_uri: `${appUrl}/auth/kakao/callback`
          }
        }
      });
      
      if (error) throw error;
    } catch (error) {
      console.error('회원가입 실패:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      setLoading(true);
      
      // 카카오 로그아웃 (카카오로 로그인한 경우)
      logoutKakao();
      
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      setUser(null);
      setUserProfile(null);
      // 캐시 클리어
      profileCache.clear();
    } catch (error) {
      console.error('로그아웃 실패:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateProfile = useCallback(async (updates: Partial<User>) => {
    try {
      if (!user) throw new Error('사용자가 로그인되어 있지 않습니다.');
      
      // Supabase users 테이블 업데이트
      const { error } = await supabase
        .from('users')
        .update({
          nickname: updates.nickname,
          region: updates.region,
          vehicle: updates.vehicle,
          phone: updates.phone,
          profile_image: updates.profileImage,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);
      
      if (error) throw error;
      
      // 로컬 상태 업데이트
      setUserProfile(prev => {
        if (!prev) return null;
        const updated = { ...prev, ...updates };
        // 캐시 업데이트
        profileCache.set(user.id, { data: updated, timestamp: Date.now() });
        return updated;
      });
    } catch (error) {
      console.error('프로필 업데이트 실패:', error);
      throw error;
    }
  }, [user]);

  const refreshUserProfile = useCallback(async () => {
    if (user) {
      // 캐시 무효화
      profileCache.delete(user.id);
      await loadUserProfile(user);
    }
  }, [user, loadUserProfile]);

  // 프로필 완료 여부 체크 함수
  const isProfileComplete = useCallback((profile: User | null) => {
    if (!profile) return false;
    return !!(
      profile.nickname && 
      profile.nickname.trim() &&
      profile.region && 
      profile.region.trim() &&
      profile.vehicle && 
      profile.vehicle.trim() &&
      profile.phone && 
      profile.phone.trim()
    );
  }, []);

  const value = useMemo(() => ({
    user,
    userProfile,
    loading,
    signUp,
    signOut,
    updateProfile,
    refreshUserProfile,
    isProfileComplete,
  }), [user, userProfile, loading, signUp, signOut, updateProfile, refreshUserProfile, isProfileComplete]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 
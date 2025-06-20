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

export interface AuthContextType {
  user: SupabaseUser | null;
  userProfile: User | null;
  loading: boolean;
  signUp: (nickname: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<User>) => Promise<void>;
  refreshProfile: () => Promise<void>;
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

  const loadUserProfile = useCallback(async (userId: string): Promise<User | null> => {
    try {
      console.log('프로필 로드 시작:', userId);
      
      // NextJS API 루트를 통한 안전한 조회
      const response = await fetch(`/api/users/${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        }
      });

      if (!response.ok) {
        if (response.status === 404) {
          console.log('프로필이 존재하지 않음');
          return null;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('프로필 로드 성공:', data);
      return data;
    } catch (error: any) {
      console.error('프로필 로드 실패:', error);
      
      // 네트워크 에러나 리소스 부족 에러는 조용히 처리
      if (error.message?.includes('Failed to fetch') || 
          error.message?.includes('NetworkError') ||
          error.message?.includes('ERR_INSUFFICIENT_RESOURCES')) {
        console.log('네트워크 에러로 인한 프로필 로드 실패 - 조용히 처리');
        return null;
      }
      
      return null;
    }
  }, []);

  // 프로필 생성 함수 - 다단계 fallback
  const createUserProfile = useCallback(async (userData: any) => {
    try {
      console.log('프로필 생성 시작:', userData);
      
      // 1단계: NextJS API 루트 사용
      const response = await fetch('/api/users/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(userData)
      });

      if (response.ok) {
        const data = await response.json();
        console.log('API 루트로 프로필 생성 성공:', data);
        return data;
      }

      // 2단계: API 루트 실패 시 바로 기본 프로필로 진행
      console.log('API 루트 실패, 기본 프로필로 진행');
    } catch (error) {
      console.error('프로필 생성 실패:', error);
      
      // 3단계: 기본 프로필 생성
      console.log('기본 프로필 생성 시도');
      const defaultProfile = {
        id: userData.id,
        username: userData.username || '',
        email: userData.email || '',  
        nickname: userData.nickname || '',
        region: userData.region || '',
        vehicle: userData.vehicle || '',
        phone: userData.phone || '',
        points: 0,
        total_deliveries: 0,
        total_earnings: 0,
        profile_image: userData.profile_image || null,
        referral_code: userData.referral_code || '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      console.log('기본 프로필 반환:', defaultProfile);
      return defaultProfile;
    }
  }, []);

  // 사용자 인증 상태 확인 및 프로필 처리
  const handleAuthUser = useCallback(async (authUser: SupabaseUser) => {
    try {
      // 프로필 로드 시도
      const profile = await loadUserProfile(authUser.id);
      
      if (!profile) {
        console.log('프로필이 존재하지 않음. 새로 생성 중...');
        
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
        const uniqueUsername = `${authUser.email?.split('@')[0] || 'user'}_${Date.now()}`;
        
        const newUserData = {
          id: authUser.id,
          email: authUser.email,
          username: uniqueUsername,
          nickname: kakaoNickname, 
          referral_code: referralCode,
          points: 0,
          total_deliveries: 0,
          total_earnings: 0
        };
        
        const createdProfile = await createUserProfile(newUserData);
        
        // User 타입으로 변환
        const createdData = createdProfile as any; // 타입 단언으로 스네이크 케이스 필드 접근 허용
        const userData: User = {
          id: authUser.id,
          email: authUser.email || '',
          nickname: createdData?.nickname || kakaoNickname,
          region: createdData?.region || '',
          vehicle: createdData?.vehicle || '',
          phone: createdData?.phone || '',
          points: createdData?.points || 0,
          totalDeliveries: createdData?.total_deliveries || 0,
          totalEarnings: createdData?.total_earnings || 0,
          profileImage: createdData?.profile_image || '',
          referral_code: createdData?.referral_code || referralCode,
          notificationSettings: createdData?.notification_settings || {},
          role: createdData?.role || 'user',
        };
        
        setUserProfile(userData);
        profileCache.set(authUser.id, { data: userData, timestamp: Date.now() });
        console.log('✅ 신규 사용자 프로필 생성 완료:', { nickname: kakaoNickname, referralCode });
        return;
      }

      // 기존 프로필 존재하는 경우
      const profileData = profile as any; // 타입 단언으로 스네이크 케이스 필드 접근 허용
      const userData: User = {
        id: authUser.id,
        email: authUser.email || '',
        nickname: profileData?.nickname || '',
        region: profileData?.region || '',
        vehicle: profileData?.vehicle || '',
        phone: profileData?.phone || '',
        points: profileData?.points || 0,
        totalDeliveries: profileData?.total_deliveries || 0,
        totalEarnings: profileData?.total_earnings || 0,
        profileImage: profileData?.profile_image || '',
        referral_code: profileData?.referral_code || '',
        notificationSettings: profileData?.notification_settings || {},
        role: profileData?.role || 'user',
      };

      setUserProfile(userData);
      profileCache.set(authUser.id, { data: userData, timestamp: Date.now() });
      console.log('✅ 기존 사용자 프로필 로드 완료');
      
    } catch (error) {
      console.error('사용자 인증 처리 실패:', error);
      setUserProfile(null);
    }
  }, [loadUserProfile, createUserProfile]);

  useEffect(() => {
    let mounted = true;
    let safetyTimeout: NodeJS.Timeout;
    
    const initializeAuth = async () => {
      // 안전장치: 최대 5초 후에는 강제로 로딩 해제
      safetyTimeout = setTimeout(() => {
        if (mounted) {
          console.warn('⚠️ 인증 초기화 타임아웃 - 강제로 로딩 해제');
          setLoading(false);
          setIsCheckingSession(false);
        }
      }, 5000);
      try {
        setIsCheckingSession(true);
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('세션 조회 실패:', error);
          if (mounted) {
            setUser(null);
            setUserProfile(null);
          }
          return;
        }

        if (mounted && session?.user) {
          setUser(session.user);
          await handleAuthUser(session.user);
        } else if (mounted) {
          // 캐시된 프로필 확인
          const cachedAuth = localStorage.getItem('baedalking-auth');
          if (cachedAuth) {
            try {
              const { user: cachedUser, profile: cachedProfile } = JSON.parse(cachedAuth);
              if (cachedUser && cachedProfile) {
                setUser(cachedUser);
                setUserProfile(cachedProfile);
              }
            } catch (e) {
              localStorage.removeItem('baedalking-auth');
            }
          }
          
          setUser(null);
          setUserProfile(null);
        }
      } catch (error) {
        console.error('인증 초기화 실패:', error);
        if (mounted) {
          setUser(null);
          setUserProfile(null);
        }
      } finally {
        if (mounted) {
          clearTimeout(safetyTimeout); // 정상 완료 시 타임아웃 해제
          setIsCheckingSession(false);
          setLoading(false); // 로딩 상태 해제
        }
      }
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;
      
      console.log('Auth 상태 변경:', event);
      
      if (event === 'SIGNED_IN' && session?.user) {
        setUser(session.user);
        await handleAuthUser(session.user);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setUserProfile(null);
        localStorage.removeItem('baedalking-auth');
        profileCache.clear();
      } else if (event === 'TOKEN_REFRESHED' && session?.user) {
        setUser(session.user);
        await handleAuthUser(session.user);
      }
    });

    return () => {
      mounted = false;
      clearTimeout(safetyTimeout);
      subscription.unsubscribe();
    };
  }, [handleAuthUser]);

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

  const refreshProfile = useCallback(async () => {
    if (user) {
      // 캐시 무효화
      profileCache.delete(user.id);
      await handleAuthUser(user);
    }
  }, [user, handleAuthUser]);

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
    refreshProfile,
    isProfileComplete,
  }), [user, userProfile, loading, signUp, signOut, updateProfile, refreshProfile, isProfileComplete]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 
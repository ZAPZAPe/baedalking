'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { supabase } from '../lib/supabase';
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

  const loadUserProfile = useCallback(async (authUser: SupabaseUser) => {
    try {
      setUser(authUser);
      
      // 캐시 확인
      const cached = profileCache.get(authUser.id);
      if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        setUserProfile(cached.data);
        return;
      }
      
      // Supabase users 테이블에서 프로필 정보 가져오기
      const { data: profile, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .maybeSingle();

      if (error) {
        console.error('프로필 로드 에러:', error);
        throw error;
      }

      // 프로필이 존재하지 않는 경우 새로 생성
      if (!profile) {
        console.log('프로필이 존재하지 않음. 새로 생성 중...');
        
        // 고유한 username 생성 (이메일 + 타임스탬프)
        const uniqueUsername = `${authUser.email?.split('@')[0] || 'user'}_${Date.now()}`;
        
        // upsert를 사용하여 중복 키 오류 방지
        const { data: newProfile, error: createError } = await supabase
          .from('users')
          .upsert({
            id: authUser.id,
            email: authUser.email,
            username: uniqueUsername,
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
          console.error('프로필 생성 에러:', createError);
          throw createError;
        }

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
        // 캐시에 저장
        profileCache.set(authUser.id, { data: userData, timestamp: Date.now() });
        return;
      }

      // 프로필이 존재하는 경우
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
        referral_code: profile?.referral_code || '',
        notificationSettings: profile?.notification_settings || {},
        role: profile?.role || 'user',
      };

      setUserProfile(userData);
      // 캐시에 저장
      profileCache.set(authUser.id, { data: userData, timestamp: Date.now() });
    } catch (error) {
      console.error('프로필 로드 실패:', error);
      // 프로필 로드 실패해도 기본 사용자 정보는 설정
      const basicUser = {
        id: authUser.id,
        email: authUser.email || '',
      };
      setUserProfile(basicUser);
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    const checkAuthState = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (mounted && session?.user) {
          await loadUserProfile(session.user);
        } else if (mounted) {
          setUser(null);
          setUserProfile(null);
        }
      } catch (error: any) {
        if (mounted) {
          setUser(null);
          setUserProfile(null);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    checkAuthState();

    // Supabase auth 상태 변화 감지
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;
      
      if (session?.user) {
        await loadUserProfile(session.user);
      } else {
        setUser(null);
        setUserProfile(null);
      }
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [loadUserProfile]);

  const signUp = useCallback(async (nickname: string) => {
    try {
      setLoading(true);
      
      // 카카오 로그인으로 회원가입
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.baedalking.com';
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

  const value = useMemo(() => ({
    user,
    userProfile,
    loading,
    signUp,
    signOut,
    updateProfile,
    refreshUserProfile,
  }), [user, userProfile, loading, signUp, signOut, updateProfile, refreshUserProfile]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 
'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
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
  user: User | null;
  userProfile: User | null; // userProfile 추가
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, nickname: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuthState();

    // Supabase auth 상태 변화 감지
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        await loadUserProfile(session.user);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkAuthState = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        await loadUserProfile(session.user);
      } else {
        setUser(null);
      }
    } catch (error: any) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const loadUserProfile = async (authUser: SupabaseUser) => {
    try {
      // Supabase users 테이블에서 프로필 정보 가져오기
      const { data: profile, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .maybeSingle(); // single() 대신 maybeSingle() 사용

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
            onConflict: 'id', // id 충돌 시 업데이트
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

        return setUser(userData);
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

      setUser(userData);
    } catch (error) {
      console.error('프로필 로드 실패:', error);
      // 프로필 로드 실패해도 기본 사용자 정보는 설정
      setUser({
        id: authUser.id,
        email: authUser.email || '',
      });
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) throw error;
      
      if (data.session) {
        await loadUserProfile(data.session.user);
      }
    } catch (error) {
      console.error('로그인 실패:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, nickname: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });
      
      if (error) throw error;
      
      // 회원가입 성공 시 users 테이블에 프로필 생성
      if (data.user) {
        const { error: profileError } = await supabase
          .from('users')
          .insert({
            id: data.user.id,
            username: email, // 이메일을 username으로 사용
            email,
            nickname,
            points: 500, // 가입 보너스
          });
          
        if (profileError) {
          console.error('프로필 생성 실패:', profileError);
          throw profileError;
        }
      }
    } catch (error) {
      console.error('회원가입 실패:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      
      // 카카오 로그아웃 (카카오로 로그인한 경우)
      logoutKakao();
      
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      setUser(null);
    } catch (error) {
      console.error('로그아웃 실패:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updates: Partial<User>) => {
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
      setUser(prev => prev ? { ...prev, ...updates } : null);
    } catch (error) {
      console.error('프로필 업데이트 실패:', error);
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    userProfile: user, // userProfile도 user와 동일하게 설정
    loading,
    signIn,
    signUp,
    signOut,
    updateProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FaEnvelope, FaLock, FaEye, FaEyeSlash, FaCrown, FaComment } from 'react-icons/fa';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '../../lib/supabase';

const Login = () => {
  const router = useRouter();
  const { signIn, user, loading: authLoading } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // 카카오 SDK 초기화
  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        // 사용자 프로필 확인
        const { data: profile } = await supabase
          .from('users')
          .select('nickname, region, bike_type')
          .eq('id', session.user.id)
          .single();

        if (profile?.nickname && profile?.region && profile?.bike_type) {
          router.push('/');
        } else {
          router.push('/profile-setup');
        }
      }
    };

    checkUser();
  }, [router]);

  // 이미 로그인된 경우 홈으로 리다이렉션
  useEffect(() => {
    if (!authLoading && user) {
      router.push('/');
    }
  }, [user, authLoading, router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email || !formData.password) {
      setError('이메일과 비밀번호를 입력해주세요.');
      return;
    }
    
    setLoading(true);
    setError('');

    try {
      await signIn(formData.email, formData.password);
      // signIn 성공 시 AuthContext에서 user가 설정되고, 
      // useEffect에서 자동으로 리다이렉션됨
    } catch (error: any) {
      console.error('로그인 오류:', error);
      
      let errorMessage = '로그인에 실패했습니다.';
      
      if (error.message?.includes('Invalid login credentials')) {
        errorMessage = '이메일 또는 비밀번호가 올바르지 않습니다.';
      } else if (error.message?.includes('Email not confirmed')) {
        errorMessage = '이메일 인증이 필요합니다. 이메일을 확인해주세요.';
      } else if (error.message?.includes('Too many requests')) {
        errorMessage = '너무 많은 시도가 있었습니다. 잠시 후 다시 시도해주세요.';
      }
      
      setError(errorMessage);
      setLoading(false);
    }
  };

  const handleKakaoLogin = async () => {
    setLoading(true);
    setError('');

    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'kakao',
        options: {
          redirectTo: `${window.location.origin}/profile-setup`,
          queryParams: {
            scope: 'profile_nickname account_email',
            redirect_uri: 'https://gxaqqznkcuzqbacgqvzg.supabase.co/auth/v1/callback'
          }
        }
      });

      if (error) throw error;
    } catch (err) {
      console.error('카카오 로그인 오류:', err);
      setError('카카오 로그인에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  // 로딩 중이거나 이미 로그인된 경우
  if (authLoading || user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white">로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative z-10">
      <div className="max-w-3xl mx-auto px-4">
        {/* 상단 여백 */}
        <section className="mt-8 mb-4"></section>

        {/* 로고 및 제목 */}
        <section className="mb-4">
          <div className="text-center">
            <div className="animate-bounce mb-4">
              <FaCrown size={60} className="mx-auto text-yellow-400 drop-shadow-lg" />
            </div>
            <h1 className="text-3xl font-black text-white mb-2">
              배달킹
            </h1>
            <p className="text-blue-200">실시간 배달 랭킹 서비스</p>
          </div>
        </section>

        {/* 로그인 폼 */}
        <section className="mb-4">
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 shadow-xl border border-white/20">
            <h2 className="text-2xl font-bold text-white mb-4 text-center">로그인</h2>
            
            {/* 카카오 로그인 버튼 */}
            <button
              onClick={handleKakaoLogin}
              disabled={loading}
              className="w-full bg-[#FEE500] text-[#000000D9] py-3 px-4 rounded-xl font-bold hover:bg-[#FDD835] hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-[#FEE500]/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 mb-4"
            >
              <FaComment size={18} />
              카카오로 시작하기
            </button>

            {/* 구분선 */}
            <div className="relative mb-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/20"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-transparent text-white/60">또는</span>
              </div>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* 이메일 입력 */}
              <div>
                <label className="block text-sm font-medium text-white/80 mb-1">이메일</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaEnvelope className="h-4 w-4 text-white/40" />
                  </div>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="block w-full pl-10 pr-3 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:bg-white/15 transition-all"
                    placeholder="이메일을 입력하세요"
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              {/* 비밀번호 입력 */}
              <div>
                <label className="block text-sm font-medium text-white/80 mb-1">비밀번호</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaLock className="h-4 w-4 text-white/40" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className="block w-full pl-10 pr-12 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:bg-white/15 transition-all"
                    placeholder="비밀번호를 입력하세요"
                    required
                    disabled={loading}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={loading}
                  >
                    {showPassword ? (
                      <FaEyeSlash className="h-4 w-4 text-white/40 hover:text-white/60" />
                    ) : (
                      <FaEye className="h-4 w-4 text-white/40 hover:text-white/60" />
                    )}
                  </button>
                </div>
              </div>

              {/* 에러 메시지 */}
              {error && (
                <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-3">
                  <p className="text-red-200 text-sm">{error}</p>
                </div>
              )}

              {/* 로그인 버튼 */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 text-white py-3 px-4 rounded-xl font-bold hover:shadow-lg hover:shadow-amber-500/25 hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-amber-400/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                    <span>로그인 중...</span>
                  </div>
                ) : (
                  '이메일로 로그인'
                )}
              </button>
            </form>

            {/* 회원가입 링크 */}
            <div className="mt-6 text-center">
              <p className="text-blue-200">
                계정이 없으신가요?{' '}
                <Link href="/profile-setup" className="text-yellow-300 hover:text-yellow-400 font-bold">
                  회원가입
                </Link>
              </p>
            </div>
          </div>
        </section>

        {/* 하단 여백 */}
        <section className="mb-8"></section>
      </div>
    </div>
  );
};

export default Login; 
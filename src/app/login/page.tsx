'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FaComment, FaCrown, FaEnvelope, FaLock, FaSignInAlt } from 'react-icons/fa';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import KakaoAd from '@/components/KakaoAd';
import Link from 'next/link';
import { toast } from 'react-hot-toast';

const Login = () => {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // 카카오 SDK 초기화
  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        // 사용자 프로필 확인
        const { data: profile } = await supabase
          .from('users')
          .select('nickname, region, vehicle')
          .eq('id', session.user.id)
          .single();

        if (profile?.nickname && profile?.region && profile?.vehicle) {
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

  const handleKakaoLogin = async () => {
    setLoading(true);
    setError('');

    try {
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
    } catch (err) {
      console.error('카카오 로그인 오류:', err);
      setError('카카오 로그인에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.session) {
        toast.success('로그인 성공!');
        router.push('/');
      }
    } catch (err: any) {
      console.error('이메일 로그인 오류:', err);
      if (err.message.includes('Invalid login credentials')) {
        setError('이메일 또는 비밀번호가 올바르지 않습니다.');
      } else {
        setError('로그인에 실패했습니다. 다시 시도해주세요.');
      }
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
            <h2 className="text-2xl font-bold text-white mb-6 text-center">로그인</h2>
            
            {/* 이메일/비밀번호 로그인 폼 */}
            <form onSubmit={handleEmailLogin} className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  이메일
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaEnvelope className="text-white/60" />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-white/20 border border-white/30 rounded-xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all"
                    placeholder="이메일 주소"
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  비밀번호
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaLock className="text-white/60" />
                  </div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-white/20 border border-white/30 rounded-xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all"
                    placeholder="비밀번호"
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 text-white py-3 px-4 rounded-xl font-bold hover:from-yellow-500 hover:to-orange-600 hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-offset-2 focus:ring-offset-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
              >
                <FaSignInAlt size={18} />
                {loading ? '로그인 중...' : '로그인'}
              </button>
            </form>

            {/* 구분선 */}
            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/20"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-transparent text-white/60">또는</span>
              </div>
            </div>
            
            {/* 카카오 로그인 버튼 */}
            <button
              onClick={handleKakaoLogin}
              disabled={loading}
              className="w-full bg-[#FEE500] text-[#000000D9] py-3 px-4 rounded-xl font-bold hover:bg-[#FDD835] hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-[#FEE500]/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
            >
              <FaComment size={18} />
              카카오로 시작하기
            </button>

            {/* 회원가입 링크 */}
            <div className="mt-6 text-center">
              <p className="text-white/60 text-sm">
                아직 계정이 없으신가요?{' '}
                <Link 
                  href="/signup" 
                  className="text-yellow-400 hover:text-yellow-300 font-bold transition-colors"
                >
                  회원가입
                </Link>
              </p>
            </div>

            {/* 에러 메시지 */}
            {error && (
              <div className="mt-4 bg-red-500/20 border border-red-500/50 rounded-xl p-3">
                <p className="text-red-200 text-sm">{error}</p>
              </div>
            )}
          </div>
        </section>

        {/* 하단 광고 */}
        <section className="mb-8">
          <KakaoAd page="login" index={0} />
        </section>
      </div>
    </div>
  );
};

export default Login; 
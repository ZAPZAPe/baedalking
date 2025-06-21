'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { FaComment, FaCrown } from 'react-icons/fa';
import { useAuth } from '@/contexts/AuthContext';
import { supabase, clearOldSession } from '../../lib/supabase';
import KakaoAdGlobal from '@/components/KakaoAdGlobal';

const Login = () => {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const checkingSession = useRef(false);
  const [inviteCode, setInviteCode] = useState<string | null>(null);

  // URL에서 초대 코드 확인 및 저장
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const invite = searchParams.get('invite');
    
    if (invite) {
      setInviteCode(invite);
      // 세션 스토리지에 저장 (카카오 로그인 후에도 사용할 수 있도록)
      sessionStorage.setItem('inviteCode', invite);
      console.log('초대 코드 저장:', invite);
    }
  }, []);

  // 카카오 SDK 초기화
  useEffect(() => {
    const checkUser = async () => {
      // 이미 체크 중이거나 AuthContext에서 로딩 중이면 스킵
      if (checkingSession.current || authLoading) return;
      
      checkingSession.current = true;
      
      try {
        // 오래된 세션 정리
        clearOldSession();
        
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
      } catch (error) {
        console.error('세션 체크 에러:', error);
        // 에러 발생 시 세션 정리
        clearOldSession();
      } finally {
        checkingSession.current = false;
      }
    };

    // AuthContext 로딩이 완료된 후에만 실행
    if (!authLoading) {
      checkUser();
    }
  }, [router, authLoading]);

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
        <section className="mb-8">
          <div className="text-center">
            <div className="animate-bounce mb-6">
              <FaCrown size={80} className="mx-auto text-yellow-400 drop-shadow-lg" />
            </div>
            <h1 className="text-4xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-orange-400 to-pink-400 mb-4">
              배달킹
            </h1>
            <p className="text-xl text-purple-200 mb-2">실시간 배달 랭킹 서비스</p>
            <p className="text-purple-300 text-sm">카카오톡으로 간편하게 시작하세요!</p>
          </div>
        </section>

        {/* 카카오 로그인 섹션 */}
        <section className="mb-8">
          <div className="bg-gradient-to-br from-purple-900/30 to-pink-900/30 backdrop-blur-lg rounded-3xl p-8 shadow-2xl border border-purple-500/30 relative overflow-hidden">
            {/* 배경 애니메이션 효과 */}
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 via-pink-600/10 to-purple-600/10 animate-pulse"></div>
            
            <div className="relative z-10">
              {/* 초대 코드 안내 */}
              {inviteCode && (
                <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-400/30 rounded-xl p-4 mb-6">
                  <div className="text-center">
                    <p className="text-green-200 font-bold mb-1">🎁 친구 초대 혜택!</p>
                    <p className="text-green-300 text-sm">
                      가입하면 <span className="font-bold text-green-200">300P</span>를 즉시 받을 수 있어요!
                    </p>
                  </div>
                </div>
              )}
              
              {/* 카카오 로그인 버튼 */}
              <div className="text-center">
                <button
                  onClick={handleKakaoLogin}
                  disabled={loading}
                  className="w-full bg-[#FEE500] text-[#000000D9] py-4 px-6 rounded-2xl font-bold text-lg hover:bg-[#FDD835] hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-[#FEE500]/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-3 shadow-lg"
                >
                  <FaComment size={24} />
                  {loading ? '로그인 중...' : '카카오로 시작하기'}
                </button>
                
                <p className="text-purple-200/60 text-sm mt-4">
                  카카오톡 계정으로 간편하게 로그인하세요
                </p>
              </div>

              {/* 에러 메시지 */}
              {error && (
                <div className="mt-6 bg-gradient-to-r from-red-500/20 to-pink-500/20 border border-red-400/30 rounded-xl p-4">
                  <p className="text-red-200 text-center">{error}</p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* 서비스 소개 */}
        <section className="mb-8">
          <div className="bg-gradient-to-br from-blue-900/30 to-purple-900/30 backdrop-blur-lg rounded-3xl p-6 shadow-2xl border border-blue-500/30">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400 mb-4">
                배달킹이 처음이신가요?
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                <div className="bg-white/5 rounded-xl p-4">
                  <div className="text-3xl mb-2">🏆</div>
                  <h4 className="text-white font-bold mb-1">실시간 랭킹</h4>
                  <p className="text-purple-200 text-sm">다른 라이더들과 실시간으로 경쟁해보세요</p>
                </div>
                <div className="bg-white/5 rounded-xl p-4">
                  <div className="text-3xl mb-2">📱</div>
                  <h4 className="text-white font-bold mb-1">간편한 기록</h4>
                  <p className="text-purple-200 text-sm">배달 완료 화면을 찍기만 하면 자동 등록</p>
                </div>
                <div className="bg-white/5 rounded-xl p-4">
                  <div className="text-3xl mb-2">🎁</div>
                  <h4 className="text-white font-bold mb-1">포인트 혜택</h4>
                  <p className="text-purple-200 text-sm">랭킹 참여로 다양한 리워드를 받아보세요</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 하단 광고 */}
        <section className="mb-8">
          <KakaoAdGlobal page="login" index={0} />
        </section>
      </div>
    </div>
  );
};

export default Login; 
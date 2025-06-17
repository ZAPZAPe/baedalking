'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { FaEnvelope, FaCheck } from 'react-icons/fa';
import { confirmSignUp, resendConfirmationCode } from '@/services/authService';

function VerifyEmailForm() {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email');

  if (!email) {
    router.push('/profile-setup');
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await confirmSignUp(email, code);
      setSuccess(true);
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    } catch (error: any) {
      console.error('이메일 인증 오류:', error);
      setError('인증 코드가 올바르지 않습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    setLoading(true);
    setError('');

    try {
      await resendConfirmationCode(email);
      setError('인증 코드가 재전송되었습니다.');
    } catch (error: any) {
      console.error('인증 코드 재전송 오류:', error);
      setError('인증 코드 재전송에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 relative overflow-hidden">
      {/* 배경 효과 */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-20 -right-20 w-48 h-48 bg-yellow-400/20 rounded-full blur-2xl animate-pulse"></div>
        <div className="absolute top-1/3 -left-16 w-40 h-40 bg-purple-400/20 rounded-full blur-2xl animate-pulse delay-1000"></div>
        <div className="absolute bottom-10 right-10 w-32 h-32 bg-blue-400/20 rounded-full blur-2xl animate-pulse delay-2000"></div>
      </div>

      <div className="relative z-10 min-h-screen flex items-center justify-center px-4">
        <div className="max-w-md w-full">
          {/* 로고 섹션 */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-black text-white mb-2">배달킹</h1>
            <p className="text-blue-200 font-semibold">이메일 인증</p>
          </div>

          {/* 인증 폼 */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-xl border border-white/20">
            {success ? (
              <div className="text-center">
                <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FaCheck className="text-green-400 text-2xl" />
                </div>
                <h2 className="text-xl font-bold text-white mb-2">인증 완료!</h2>
                <p className="text-blue-200">로그인 페이지로 이동합니다...</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-white font-semibold mb-2">이메일</label>
                  <div className="relative">
                    <FaEnvelope className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="email"
                      value={email}
                      disabled
                      className="w-full pl-10 pr-4 py-3 bg-white/20 border border-white/30 rounded-xl text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-white font-semibold mb-2">인증 코드</label>
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-xl text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                    placeholder="이메일로 전송된 인증 코드를 입력하세요"
                    required
                  />
                </div>

                {error && (
                  <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-3">
                    <p className="text-red-200 text-sm text-center">{error}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 text-black font-bold py-3 rounded-xl shadow-lg hover:shadow-yellow-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? '인증 중...' : '인증하기'}
                </button>

                <button
                  type="button"
                  onClick={handleResendCode}
                  disabled={loading}
                  className="w-full text-blue-200 hover:text-blue-100 font-semibold py-2"
                >
                  인증 코드 재전송
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center">
        <div className="text-white text-xl">로딩 중...</div>
      </div>
    }>
      <VerifyEmailForm />
    </Suspense>
  );
} 
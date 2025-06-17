'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FaShieldAlt, FaLock, FaHome } from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import crypto from 'crypto-js';

export default function AdminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // 하드코딩된 관리자 비밀번호 (실제로는 환경변수나 DB에 저장해야 함)
  const ADMIN_PASSWORD_HASH = crypto.SHA256('admin1234').toString();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // 비밀번호 해시 비교
      const inputPasswordHash = crypto.SHA256(password).toString();
      
      if (inputPasswordHash === ADMIN_PASSWORD_HASH) {
        // 세션 스토리지에 관리자 인증 상태 저장
        sessionStorage.setItem('adminAuthenticated', 'true');
        sessionStorage.setItem('adminAuthTime', new Date().toISOString());
        
        toast.success('관리자 인증 성공!');
        router.push('/admin');
      } else {
        toast.error('비밀번호가 올바르지 않습니다.');
        setPassword('');
      }
    } catch (error) {
      console.error('인증 오류:', error);
      toast.error('인증 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* 로고 및 타이틀 */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="w-24 h-24 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-2xl">
              <FaShieldAlt className="text-white" size={48} />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">배달왕 관리자</h1>
          <p className="text-blue-200">관리자 비밀번호를 입력하세요</p>
        </div>

        {/* 로그인 폼 */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                관리자 비밀번호
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaLock className="text-white/60" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all"
                  placeholder="비밀번호 입력"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || !password}
              className="w-full py-3 px-4 bg-gradient-to-r from-yellow-400 to-orange-500 text-white font-bold rounded-lg hover:from-yellow-500 hover:to-orange-600 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-offset-2 focus:ring-offset-transparent transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {isLoading ? '인증 중...' : '관리자 로그인'}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-white/20">
            <button
              onClick={() => router.push('/')}
              className="w-full flex items-center justify-center px-4 py-2 text-white hover:text-yellow-400 transition-colors"
            >
              <FaHome className="mr-2" />
              메인으로 돌아가기
            </button>
          </div>

          {/* 안내 메시지 */}
          <div className="mt-6 p-4 bg-blue-500/20 rounded-lg border border-blue-400/30">
            <p className="text-sm text-blue-200 text-center">
              기본 비밀번호: admin1234
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const { error } = await supabase.auth.getSession();
        if (error) throw error;

        // 인증 성공 후 메인 페이지로 리다이렉트
        router.push('/');
      } catch (error) {
        console.error('인증 처리 중 오류 발생:', error);
        router.push('/login?error=auth_callback_failed');
      }
    };

    handleAuthCallback();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-lg">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            이메일 인증 처리 중...
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            잠시만 기다려주세요. 자동으로 메인 페이지로 이동합니다.
          </p>
        </div>
      </div>
    </div>
  );
} 
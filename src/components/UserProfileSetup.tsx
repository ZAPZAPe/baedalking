'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../lib/supabase';

interface UserProfileSetupProps {
  userId: string;
  onComplete: () => void;
}

const UserProfileSetup = ({ userId, onComplete }: UserProfileSetupProps) => {
  const router = useRouter();
  const [nickname, setNickname] = useState('');
  const [region, setRegion] = useState('');
  const [bikeType, setBikeType] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const regions = [
    '강남구', '강동구', '강북구', '강서구', '관악구', '광진구', '구로구', '금천구',
    '노원구', '도봉구', '동대문구', '동작구', '마포구', '서대문구', '서초구', '성동구',
    '성북구', '송파구', '양천구', '영등포구', '용산구', '은평구', '종로구', '중구', '중랑구'
  ];

  const bikeTypes = [
    '오토바이', '자전거', '전동킥보드', '기타'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      // 닉네임 중복 체크
      const { data: existingUser } = await supabase
        .from('users')
        .select('nickname')
        .eq('nickname', nickname)
        .single();

      if (existingUser) {
        setError('이미 사용 중인 닉네임입니다.');
        setIsSubmitting(false);
        return;
      }

      // 사용자 프로필 업데이트
      const { error: updateError } = await supabase
        .from('users')
        .upsert({
          id: userId,
          nickname,
          region,
          bike_type: bikeType,
          updated_at: new Date().toISOString()
        });

      if (updateError) throw updateError;

      onComplete();
      router.refresh();
    } catch (err) {
      setError('프로필 저장 중 오류가 발생했습니다.');
      console.error('프로필 저장 오류:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          프로필 설정
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          서비스 이용을 위해 추가 정보를 입력해주세요
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="nickname" className="block text-sm font-medium text-gray-700">
                닉네임
              </label>
              <div className="mt-1">
                <input
                  id="nickname"
                  name="nickname"
                  type="text"
                  required
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="닉네임을 입력하세요"
                />
              </div>
            </div>

            <div>
              <label htmlFor="region" className="block text-sm font-medium text-gray-700">
                활동 지역
              </label>
              <div className="mt-1">
                <select
                  id="region"
                  name="region"
                  required
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">지역을 선택하세요</option>
                  {regions.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="bikeType" className="block text-sm font-medium text-gray-700">
                운송수단
              </label>
              <div className="mt-1">
                <select
                  id="bikeType"
                  name="bikeType"
                  required
                  value={bikeType}
                  onChange={(e) => setBikeType(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">운송수단을 선택하세요</option>
                  {bikeTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {error && (
              <div className="text-red-600 text-sm text-center">
                {error}
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {isSubmitting ? '저장 중...' : '프로필 저장'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default UserProfileSetup; 
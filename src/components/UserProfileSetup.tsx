'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../lib/supabase';
import { formatPhoneNumber, validatePhoneNumber, unformatPhoneNumber } from '@/utils/phoneUtils';

interface UserProfileSetupProps {
  userId: string;
  onComplete: () => void;
}

const UserProfileSetup = ({ userId, onComplete }: UserProfileSetupProps) => {
  const router = useRouter();
  const [nickname, setNickname] = useState('');
  const [region, setRegion] = useState('');
  const [vehicle, setVehicle] = useState('');
  const [phone, setPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const phoneInputRef = useRef<HTMLInputElement>(null);

  const regions = [
    '서울', '부산', '대구', '인천', '광주', '대전',
    '울산', '세종', '경기', '강원', '충북', '충남',
    '전북', '전남', '경북', '경남', '제주'
  ];

  const vehicleTypes = [
    '오토바이', '자전거', '전동킥보드', '기타'
  ];

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target;
    const prevValue = phone;
    const newValue = formatPhoneNumber(input.value);
    
    setPhone(newValue);
    
    // 커서 위치 조정을 위해 다음 렌더링 사이클에서 실행
    setTimeout(() => {
      if (phoneInputRef.current) {
        const cursorPos = input.selectionStart || 0;
        const prevLength = prevValue.length;
        const newLength = newValue.length;
        
        // 하이픈이 자동으로 추가된 경우 커서 위치 조정
        if (newLength > prevLength && newValue[cursorPos - 1] === '-') {
          phoneInputRef.current.setSelectionRange(cursorPos, cursorPos);
        }
      }
    }, 0);
  };

  const validateNickname = (nickname: string) => {
    // 길이 검사
    if (nickname.length < 2) {
      return { isValid: false, message: '닉네임은 2자 이상이어야 합니다.' };
    }
    
    if (nickname.length > 12) {
      return { isValid: false, message: '닉네임은 12자 이하여야 합니다.' };
    }

    // 특수문자 검사 (한글, 영문, 숫자, 일부 특수문자만 허용)
    const allowedPattern = /^[가-힣a-zA-Z0-9._-]+$/;
    if (!allowedPattern.test(nickname)) {
      return { isValid: false, message: '닉네임은 한글, 영문, 숫자, ., _, - 만 사용 가능합니다.' };
    }

    // 연속된 특수문자 검사
    if (/[._-]{2,}/.test(nickname)) {
      return { isValid: false, message: '특수문자는 연속으로 사용할 수 없습니다.' };
    }

    // 시작과 끝이 특수문자인지 검사
    if (/^[._-]|[._-]$/.test(nickname)) {
      return { isValid: false, message: '닉네임은 특수문자로 시작하거나 끝날 수 없습니다.' };
    }

    // 부적절한 단어 검사
    const bannedWords = ['admin', 'administrator', 'root', 'system', '관리자', '운영자', 'null', 'undefined'];
    const lowerNickname = nickname.toLowerCase();
    for (const word of bannedWords) {
      if (lowerNickname.includes(word)) {
        return { isValid: false, message: '사용할 수 없는 닉네임입니다.' };
      }
    }

    return { isValid: true, message: '' };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      // 닉네임 유효성 검사
      const nicknameValidation = validateNickname(nickname);
      if (!nicknameValidation.isValid) {
        setError(nicknameValidation.message);
        setIsSubmitting(false);
        return;
      }

      // 전화번호 유효성 검사 (입력된 경우에만)
      if (phone && !validatePhoneNumber(phone)) {
        setError('올바른 전화번호 형식을 입력해주세요. (예: 010-1234-5678)');
        setIsSubmitting(false);
        return;
      }

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
          vehicle: vehicle,
          phone: phone ? unformatPhoneNumber(phone) : '',
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
              <label htmlFor="vehicle" className="block text-sm font-medium text-gray-700">
                운송수단
              </label>
              <div className="mt-1">
                <select
                  id="vehicle"
                  name="vehicle"
                  required
                  value={vehicle}
                  onChange={(e) => setVehicle(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">운송수단을 선택하세요</option>
                  {vehicleTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                전화번호 (선택사항)
              </label>
              <div className="mt-1">
                <input
                  ref={phoneInputRef}
                  id="phone"
                  name="phone"
                  type="tel"
                  value={phone}
                  onChange={handlePhoneChange}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="010-0000-0000"
                  maxLength={13}
                />
                {phone && !validatePhoneNumber(phone) && (
                  <p className="mt-1 text-sm text-red-600">올바른 전화번호 형식을 입력해주세요.</p>
                )}
                {phone && validatePhoneNumber(phone) && (
                  <p className="mt-1 text-sm text-green-600">올바른 전화번호 형식입니다.</p>
                )}
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
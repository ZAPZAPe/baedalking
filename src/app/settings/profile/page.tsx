'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { FaUser, FaMapMarkerAlt, FaMotorcycle, FaBicycle, FaCar, FaTimes, FaPhone } from 'react-icons/fa';
import { formatPhoneNumber, validatePhoneNumber, unformatPhoneNumber } from '@/utils/phoneUtils';

// 한국 주요 지역 목록
const regions = [
  '서울', '부산', '대구', '인천', '광주', '대전',
  '울산', '세종', '경기', '강원', '충북', '충남',
  '전북', '전남', '경북', '경남', '제주'
];

export default function ProfileEditPage() {
  const { user, userProfile, updateProfile } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [nicknameError, setNicknameError] = useState('');
  const [isCheckingNickname, setIsCheckingNickname] = useState(false);
  const [nicknameStatus, setNicknameStatus] = useState<'checking' | 'available' | 'unavailable' | null>(null);
  const [profile, setProfile] = useState({
    nickname: userProfile?.nickname || '',
    region: userProfile?.region || '',
    vehicle: userProfile?.vehicle || 'motorcycle',
    phone: userProfile?.phone ? formatPhoneNumber(userProfile.phone) : '',
  });
  const phoneInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) {
      router.push('/login');
    }
  }, [user, router]);

  // 프로필이 업데이트될 때 상태 동기화
  useEffect(() => {
    if (userProfile) {
      setProfile({
        nickname: userProfile.nickname || '',
        region: userProfile.region || '',
        vehicle: userProfile.vehicle || 'motorcycle',
        phone: userProfile.phone ? formatPhoneNumber(userProfile.phone) : '',
      });
    }
  }, [userProfile]);

  const checkNicknameAvailability = async (nickname: string) => {
    try {
      setIsCheckingNickname(true);
      setNicknameStatus('checking');
      const response = await fetch(`/api/check-nickname?nickname=${encodeURIComponent(nickname)}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || '닉네임 확인 중 오류가 발생했습니다.');
      }
      
      return data.available;
    } catch (error) {
      console.error('닉네임 확인 오류:', error);
      return false;
    } finally {
      setIsCheckingNickname(false);
    }
  };

  const handleNicknameChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const newNickname = e.target.value.trim();
    setProfile(prev => ({ ...prev, nickname: newNickname }));
    
    if (newNickname.length < 2) {
      setNicknameError('닉네임은 2자 이상이어야 합니다.');
      setNicknameStatus(null);
      return;
    }

    if (newNickname === userProfile?.nickname) {
      setNicknameError('');
      setNicknameStatus(null);
      return;
    }

    // 디바운스 처리
    const timeoutId = setTimeout(async () => {
    const isAvailable = await checkNicknameAvailability(newNickname);
    if (!isAvailable) {
      setNicknameError('이미 사용 중인 닉네임입니다.');
        setNicknameStatus('unavailable');
    } else {
      setNicknameError('');
        setNicknameStatus('available');
    }
    }, 500);

    return () => clearTimeout(timeoutId);
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target;
    const prevValue = profile.phone;
    const newValue = formatPhoneNumber(input.value);
    
    setProfile(prev => ({ ...prev, phone: newValue }));
    
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    if (nicknameError) {
      setError('닉네임을 확인해주세요.');
      setLoading(false);
      return;
    }

    if (isCheckingNickname) {
      setError('닉네임 확인 중입니다. 잠시만 기다려주세요.');
      setLoading(false);
      return;
    }

    try {
      if (!user) throw new Error('로그인이 필요합니다.');
      
      // 전화번호 유효성 검사 (입력된 경우에만)
      if (profile.phone && !validatePhoneNumber(profile.phone)) {
        setError('올바른 전화번호 형식을 입력해주세요. (예: 010-1234-5678)');
        setLoading(false);
        return;
      }

      await updateProfile({
        nickname: profile.nickname,
        region: profile.region,
        vehicle: profile.vehicle,
        phone: profile.phone ? unformatPhoneNumber(profile.phone) : '',
      });

      setSuccess(true);
      setTimeout(() => {
        router.push('/settings');
      }, 1500);
    } catch (error) {
      console.error('프로필 업데이트 오류:', error);
      setError('프로필 업데이트에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 shadow-xl border border-white/20 max-w-md w-full max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <FaUser className="text-blue-400" />
            <h1 className="text-xl font-bold text-white">프로필 수정</h1>
          </div>
          <button
            onClick={() => router.back()}
            className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-all"
          >
            <FaTimes size={16} />
          </button>
        </div>

        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 mb-6">
            {error}
          </div>
        )}

        {success && (
          <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg text-green-400 mb-6">
            프로필이 성공적으로 수정되었습니다.
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 닉네임 */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              닉네임
            </label>
            <div className="relative">
              <input
                type="text"
                value={profile.nickname}
                onChange={handleNicknameChange}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="닉네임을 입력하세요"
                required
                disabled={isCheckingNickname}
              />
              {isCheckingNickname && (
                <p className="mt-1 text-sm text-blue-400">닉네임 확인 중...</p>
              )}
              {nicknameStatus === 'available' && !isCheckingNickname && (
                <p className="mt-1 text-sm text-green-400">사용 가능한 닉네임입니다.</p>
              )}
              {nicknameStatus === 'unavailable' && !isCheckingNickname && (
                <p className="mt-1 text-sm text-red-400">이미 사용 중인 닉네임입니다.</p>
              )}
              {nicknameError && !isCheckingNickname && nicknameStatus !== 'unavailable' && (
                <p className="mt-1 text-sm text-red-400">{nicknameError}</p>
              )}
            </div>
          </div>

          {/* 지역 */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              지역
            </label>
            <select
              value={profile.region}
              onChange={(e) => setProfile({ ...profile, region: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="">지역을 선택하세요</option>
              {regions.map((region) => (
                <option key={region} value={region}>
                  {region}
                </option>
              ))}
            </select>
          </div>

          {/* 전화번호 */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              전화번호 (선택사항)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaPhone className="h-4 w-4 text-gray-400" />
              </div>
              <input
                ref={phoneInputRef}
                type="tel"
                value={profile.phone}
                onChange={handlePhoneChange}
                className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="010-0000-0000"
                maxLength={13}
              />
              {profile.phone && !validatePhoneNumber(profile.phone) && (
                <p className="mt-1 text-sm text-red-400">올바른 전화번호 형식을 입력해주세요.</p>
              )}
              {profile.phone && validatePhoneNumber(profile.phone) && (
                <p className="mt-1 text-sm text-green-400">올바른 전화번호 형식입니다.</p>
              )}
            </div>
          </div>

          {/* 이동수단 */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              이동수단
            </label>
            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setProfile({ ...profile, vehicle: 'motorcycle' })}
                className={`p-4 rounded-lg border ${
                  profile.vehicle === 'motorcycle'
                    ? 'bg-blue-500/20 border-blue-500 text-blue-400'
                    : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
                } transition-all`}
              >
                <FaMotorcycle className="mx-auto mb-2" />
                <span className="text-sm">오토바이</span>
              </button>
              <button
                type="button"
                onClick={() => setProfile({ ...profile, vehicle: 'bicycle' })}
                className={`p-4 rounded-lg border ${
                  profile.vehicle === 'bicycle'
                    ? 'bg-blue-500/20 border-blue-500 text-blue-400'
                    : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
                } transition-all`}
              >
                <FaBicycle className="mx-auto mb-2" />
                <span className="text-sm">자전거</span>
              </button>
              <button
                type="button"
                onClick={() => setProfile({ ...profile, vehicle: 'car' })}
                className={`p-4 rounded-lg border ${
                  profile.vehicle === 'car'
                    ? 'bg-blue-500/20 border-blue-500 text-blue-400'
                    : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
                } transition-all`}
              >
                <FaCar className="mx-auto mb-2" />
                <span className="text-sm">자동차</span>
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white py-3 rounded-lg font-bold hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? '저장 중...' : '저장하기'}
          </button>
        </form>
      </div>
    </div>
  );
} 
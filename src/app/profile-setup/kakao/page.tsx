'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { FaPhone, FaMapMarkerAlt, FaMotorcycle, FaCrown, FaRocket, FaGift } from 'react-icons/fa';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { toast } from 'react-hot-toast';
import { formatPhoneNumber, validatePhoneNumber, unformatPhoneNumber } from '@/utils/phoneUtils';

// 한국 주요 지역 목록
const REGIONS = [
  '서울', '부산', '대구', '인천', '광주', '대전',
  '울산', '세종', '경기', '강원', '충북', '충남',
  '전북', '전남', '경북', '경남', '제주'
];

// 배달 수단 목록
const VEHICLES = [
  { value: 'motorcycle', label: '오토바이' },
  { value: 'bicycle', label: '자전거' },
  { value: 'car', label: '자동차' },
  { value: 'walk', label: '도보' }
];

const KakaoProfileSetup = () => {
  const router = useRouter();
  const { user, refreshProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [checkingReferral, setCheckingReferral] = useState(false);
  const [referralValid, setReferralValid] = useState<boolean | null>(null);
  
  const [formData, setFormData] = useState({
    phone: '',
    region: '',
    vehicle: '',
    referralCode: ''
  });
  const phoneInputRef = useRef<HTMLInputElement>(null);

  // 로그인하지 않은 경우 로그인 페이지로 리다이렉트
  useEffect(() => {
    if (!user) {
      router.push('/login');
    }
  }, [user, router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
    
    // 추천인 코드가 변경되면 유효성 상태 초기화
    if (name === 'referralCode') {
      setReferralValid(null);
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target;
    const prevValue = formData.phone;
    const newValue = formatPhoneNumber(input.value);
    
    setFormData(prev => ({ ...prev, phone: newValue }));
    setError('');
    
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

  // 추천인 코드 확인
  const checkReferralCode = async () => {
    if (!formData.referralCode) {
      setReferralValid(null);
      return;
    }

    setCheckingReferral(true);
    try {
      // API 루트를 통한 추천인 코드 확인
      const response = await fetch(`/api/invite/validate?code=${formData.referralCode}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.ok) {
        const data = await response.json();
        setReferralValid(true);
        setError('');
        toast.success(`${data.nickname}님의 추천 코드가 확인되었습니다!`);
      } else {
        setReferralValid(false);
        setError('유효하지 않은 추천인 코드입니다.');
      }
    } catch (error) {
      setReferralValid(false);
      setError('추천인 코드 확인 중 오류가 발생했습니다.');
    } finally {
      setCheckingReferral(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.phone || !formData.region || !formData.vehicle) {
      setError('모든 정보를 입력해주세요.');
      return;
    }

    // 전화번호 유효성 검사
    if (!validatePhoneNumber(formData.phone)) {
      setError('올바른 전화번호 형식을 입력해주세요. (예: 010-1234-5678)');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // 추천인이 있는 경우 추천인 코드 처리
      if (formData.referralCode && referralValid) {
        try {
          const response = await fetch('/api/invite/validate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              code: formData.referralCode,
              userId: user?.id
            })
          });

          if (response.ok) {
            toast.success('추천인에게 500포인트가 지급되었습니다!');
          }
        } catch (error) {
          console.error('추천인 코드 처리 실패:', error);
        }
      }

      // 사용자 프로필 업데이트
      const updateData = {
        phone: unformatPhoneNumber(formData.phone),
        region: formData.region,
        vehicle: formData.vehicle,
        referred_by: formData.referralCode || null,
      };

      const response = await fetch(`/api/users/${user?.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      });

      if (!response.ok) {
        throw new Error('프로필 업데이트 실패');
      }

      // AuthContext의 userProfile 업데이트
      await refreshProfile();
      
      // 홈으로 이동
      router.push('/');
    } catch (error: any) {
      console.error('프로필 업데이트 오류:', error);
      setError('프로필 업데이트에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return null;
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
              환영합니다!
            </h1>
            <p className="text-blue-200">마지막 단계입니다</p>
          </div>
        </section>

        {/* 가입 혜택 안내 */}
        <section className="mb-4">
          <div className="bg-gradient-to-r from-yellow-400/20 to-orange-500/20 rounded-xl p-4 border border-yellow-400/30">
            <div className="flex items-center justify-center gap-2 mb-2">
              <FaRocket size={20} className="text-yellow-400" />
              <h3 className="text-lg font-bold text-white">가입 보너스</h3>
            </div>
            <p className="text-yellow-300 font-bold text-xl text-center">300P 지급 완료!</p>
                          <p className="text-yellow-200 text-sm text-center mt-2">
                추천인 코드 입력 시 추천인에게 500P 추가 지급!
              </p>
          </div>
        </section>

        {/* 추가 정보 입력 폼 */}
        <section className="mb-4">
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 shadow-xl border border-white/20">
            <h2 className="text-2xl font-bold text-white mb-4 text-center">추가 정보 입력</h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* 전화번호 */}
              <div>
                <label className="block text-sm font-medium text-white/80 mb-1">전화번호</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaPhone className="h-4 w-4 text-white/40" />
                  </div>
                  <input
                    ref={phoneInputRef}
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handlePhoneChange}
                    className="block w-full pl-10 pr-3 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:bg-white/15 transition-all"
                    placeholder="010-0000-0000"
                    maxLength={13}
                    required
                  />
                </div>
                {formData.phone && !validatePhoneNumber(formData.phone) && (
                  <p className="mt-1 text-xs text-red-400">올바른 전화번호 형식을 입력해주세요.</p>
                )}
                {formData.phone && validatePhoneNumber(formData.phone) && (
                  <p className="mt-1 text-xs text-green-400">올바른 전화번호 형식입니다.</p>
                )}
              </div>

              {/* 지역 */}
              <div>
                <label className="block text-sm font-medium text-white/80 mb-1">활동 지역</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaMapMarkerAlt className="h-4 w-4 text-white/40" />
                  </div>
                  <select
                    name="region"
                    value={formData.region}
                    onChange={handleInputChange}
                    className="block w-full pl-10 pr-3 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:bg-white/15 transition-all appearance-none"
                    required
                  >
                    <option value="" className="bg-slate-900">지역을 선택하세요</option>
                    {REGIONS.map((region) => (
                      <option key={region} value={region} className="bg-slate-900">
                        {region}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 배달 수단 */}
              <div>
                <label className="block text-sm font-medium text-white/80 mb-1">배달 수단</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaMotorcycle className="h-4 w-4 text-white/40" />
                  </div>
                  <select
                    name="vehicle"
                    value={formData.vehicle}
                    onChange={handleInputChange}
                    className="block w-full pl-10 pr-3 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:bg-white/15 transition-all appearance-none"
                    required
                  >
                    <option value="" className="bg-slate-900">배달 수단을 선택하세요</option>
                    {VEHICLES.map((vehicle) => (
                      <option key={vehicle.value} value={vehicle.value} className="bg-slate-900">
                        {vehicle.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 추천인 코드 */}
              <div>
                <label className="block text-sm font-medium text-white/80 mb-1">
                  추천인 코드 <span className="text-white/40">(선택사항)</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaGift className={`h-4 w-4 ${referralValid === true ? 'text-green-400' : referralValid === false ? 'text-red-400' : 'text-white/40'}`} />
                  </div>
                  <input
                    type="text"
                    name="referralCode"
                    value={formData.referralCode}
                    onChange={handleInputChange}
                    onBlur={checkReferralCode}
                    className={`block w-full pl-10 pr-20 py-3 bg-white/10 border rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:bg-white/15 transition-all ${
                      referralValid === true ? 'border-green-400/50' : 
                      referralValid === false ? 'border-red-400/50' : 'border-white/20'
                    }`}
                    placeholder="추천인 코드를 입력하세요"
                  />
                  {checkingReferral && (
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                      <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                    </div>
                  )}
                  {referralValid === true && (
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                      <span className="text-green-400 text-sm">✓</span>
                    </div>
                  )}
                </div>
                {referralValid === true && (
                  <p className="text-green-400 text-xs mt-1">추천인에게 500P가 지급됩니다!</p>
                )}
              </div>

              {/* 에러 메시지 */}
              {error && (
                <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-3">
                  <p className="text-red-200 text-sm">{error}</p>
                </div>
              )}

              {/* 완료 버튼 */}
              <button
                type="submit"
                disabled={loading || checkingReferral}
                className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 text-white py-3 px-4 rounded-xl font-bold hover:shadow-lg hover:shadow-amber-500/25 hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-amber-400/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                    <span>저장 중...</span>
                  </div>
                ) : (
                  '시작하기'
                )}
              </button>
            </form>
          </div>
        </section>

        {/* 하단 여백 */}
        <section className="mb-8"></section>
      </div>
    </div>
  );
};

export default KakaoProfileSetup; 
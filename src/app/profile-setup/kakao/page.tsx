'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FaPhone, FaMapMarkerAlt, FaMotorcycle, FaCrown, FaRocket } from 'react-icons/fa';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

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
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    phone: '',
    region: '',
    vehicle: ''
  });

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
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.phone || !formData.region || !formData.vehicle) {
      setError('모든 정보를 입력해주세요.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // 사용자 프로필 업데이트
      const { error: updateError } = await supabase
        .from('users')
        .update({
          phone: formData.phone,
          region: formData.region,
          vehicle: formData.vehicle,
          updated_at: new Date().toISOString()
        })
        .eq('id', user?.id);

      if (updateError) throw updateError;

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
      <div className="max-w-md mx-auto px-4">
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
            <p className="text-yellow-300 font-bold text-xl text-center">500P 지급 완료!</p>
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
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="block w-full pl-10 pr-3 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:bg-white/15 transition-all"
                    placeholder="전화번호를 입력하세요"
                    required
                  />
                </div>
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

              {/* 에러 메시지 */}
              {error && (
                <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-3">
                  <p className="text-red-200 text-sm">{error}</p>
                </div>
              )}

              {/* 완료 버튼 */}
              <button
                type="submit"
                disabled={loading}
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
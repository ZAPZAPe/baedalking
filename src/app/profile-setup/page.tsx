'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FaUser, FaEnvelope, FaLock, FaMapMarkerAlt, FaMotorcycle, FaEye, FaEyeSlash, FaPhone, FaCrown, FaRocket, FaComment, FaGift } from 'react-icons/fa';
import { signUp, checkNicknameAvailability } from '@/services/authService';
import { initKakao, loginWithKakao } from '@/services/kakaoAuth';
import { validateInviteCode } from '@/services/inviteService';
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

const ProfileSetup = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [nicknameError, setNicknameError] = useState('');
  const [isCheckingNickname, setIsCheckingNickname] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    nickname: '',
    phone: '',
    region: '',
    vehicle: '',
    inviteCode: ''
  });

  // 카카오 SDK 초기화
  useEffect(() => {
    initKakao();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleNicknameChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const nickname = e.target.value;
    setFormData(prev => ({ ...prev, nickname }));
    setNicknameError('');

    if (nickname.length >= 2) {
      setIsCheckingNickname(true);
      try {
        const isAvailable = await checkNicknameAvailability(nickname);
        if (!isAvailable) {
          setNicknameError('이미 사용 중인 닉네임입니다.');
        }
      } catch (error) {
        console.error('닉네임 중복 체크 중 오류 발생:', error);
      } finally {
        setIsCheckingNickname(false);
      }
    }
  };

  const validateForm = () => {
    if (!formData.phone) {
      setError('전화번호를 입력해주세요.');
      return false;
    }
    if (nicknameError) {
      setError('사용 가능한 닉네임을 입력해주세요.');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.');
      return false;
    }
    if (formData.password.length < 6) {
      setError('비밀번호는 6자 이상이어야 합니다.');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      // 회원가입
      await signUp(
        formData.email,
        formData.password,
        formData.nickname
      );
      
      // 초대 코드가 있는 경우 검증 및 포인트 지급
      if (formData.inviteCode) {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            await validateInviteCode(formData.inviteCode, session.user.id);
          }
        } catch (inviteError) {
          console.error('초대 코드 처리 실패:', inviteError);
          // 초대 코드 오류는 회원가입을 막지 않음
        }
      }
      
      // 회원가입 성공 시 이메일 인증 페이지로 이동
      router.push(`/verify-email?email=${encodeURIComponent(formData.email)}`);
    } catch (error: any) {
      console.error('회원가입 오류:', error);
      
      let errorMessage = '회원가입에 실패했습니다.';
      if (error.code === 'UsernameExistsException') {
        errorMessage = '이미 존재하는 이메일입니다.';
      } else if (error.code === 'InvalidPasswordException') {
        errorMessage = '비밀번호가 정책에 맞지 않습니다.';
      } else if (error.code === 'InvalidParameterException') {
        errorMessage = '입력 정보를 확인해주세요.';
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleKakaoLogin = async () => {
    setLoading(true);
    setError('');

    try {
      const result = await loginWithKakao() as any;
      
      if (result.isNewUser) {
        // 신규 사용자는 추가 정보 입력 페이지로
        router.push('/profile-setup/kakao');
      } else {
        // 기존 사용자는 홈으로
        router.push('/');
      }
    } catch (error: any) {
      console.error('카카오 로그인 오류:', error);
      setError('카카오 로그인에 실패했습니다. 다시 시도해주세요.');
      setLoading(false);
    }
  };

  return (
    <div className="relative z-10">
      <div className="max-w-md mx-auto px-4">
        {/* 상단 여백 */}
        <section className="mt-4 mb-4"></section>

        {/* 로고 및 제목 */}
        <section className="mb-4">
          <div className="text-center">
            <div className="animate-bounce mb-4">
              <FaCrown size={60} className="mx-auto text-yellow-400 drop-shadow-lg" />
            </div>
            <h1 className="text-3xl font-black text-white mb-2">
              배달킹
            </h1>
            <p className="text-blue-200">회원가입하고 랭킹에 도전하세요!</p>
          </div>
        </section>

        {/* 가입 혜택 안내 */}
        <section className="mb-4">
          <div className="bg-gradient-to-r from-yellow-400/20 to-orange-500/20 rounded-xl p-4 border border-yellow-400/30">
            <div className="flex items-center justify-center gap-2 mb-2">
              <FaCrown size={20} className="text-yellow-400" />
              <h3 className="text-lg font-bold text-white">지금 가입하면</h3>
            </div>
            <p className="text-yellow-300 font-bold text-xl text-center">500P 즉시 지급!</p>
          </div>
        </section>

        {/* 회원가입 폼 */}
        <section className="mb-4">
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 shadow-xl border border-white/20">
            <h2 className="text-2xl font-bold text-white mb-4 text-center">회원가입</h2>
            
            {/* 카카오 로그인 버튼 */}
            <button
              onClick={handleKakaoLogin}
              disabled={loading}
              className="w-full bg-[#FEE500] text-[#000000D9] py-3 px-4 rounded-xl font-bold hover:bg-[#FDD835] hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-[#FEE500]/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 mb-4"
            >
              <FaComment size={18} />
              카카오로 3초만에 시작하기
            </button>

            {/* 구분선 */}
            <div className="relative mb-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/20"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-transparent text-white/60">또는 이메일로 가입</span>
              </div>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-3">
              {/* 이메일 */}
              <div>
                <label className="block text-sm font-medium text-white/80 mb-1">이메일</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaEnvelope className="h-4 w-4 text-white/40" />
                  </div>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="block w-full pl-10 pr-3 py-2 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:bg-white/15 transition-all text-sm"
                    placeholder="이메일을 입력하세요"
                    required
                  />
                </div>
              </div>

              {/* 비밀번호 */}
              <div>
                <label className="block text-sm font-medium text-white/80 mb-1">비밀번호</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaLock className="h-4 w-4 text-white/40" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className="block w-full pl-10 pr-12 py-2 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:bg-white/15 transition-all text-sm"
                    placeholder="비밀번호를 입력하세요 (6자 이상)"
                    required
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <FaEyeSlash className="h-4 w-4 text-white/40 hover:text-white/60" />
                    ) : (
                      <FaEye className="h-4 w-4 text-white/40 hover:text-white/60" />
                    )}
                  </button>
                </div>
              </div>

              {/* 비밀번호 확인 */}
              <div>
                <label className="block text-sm font-medium text-white/80 mb-1">비밀번호 확인</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaLock className="h-4 w-4 text-white/40" />
                  </div>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className="block w-full pl-10 pr-12 py-2 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:bg-white/15 transition-all text-sm"
                    placeholder="비밀번호를 다시 입력하세요"
                    required
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <FaEyeSlash className="h-4 w-4 text-white/40 hover:text-white/60" />
                    ) : (
                      <FaEye className="h-4 w-4 text-white/40 hover:text-white/60" />
                    )}
                  </button>
                </div>
              </div>

              {/* 닉네임 */}
              <div>
                <label className="block text-sm font-medium text-white/80 mb-1">닉네임</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaUser className="h-4 w-4 text-white/40" />
                  </div>
                  <input
                    type="text"
                    name="nickname"
                    value={formData.nickname}
                    onChange={handleNicknameChange}
                    className="block w-full pl-10 pr-3 py-2 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:bg-white/15 transition-all text-sm"
                    placeholder="닉네임을 입력하세요"
                    required
                  />
                  {isCheckingNickname && (
                    <div className="absolute right-3 top-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    </div>
                  )}
                </div>
                {nicknameError && (
                  <p className="mt-1 text-xs text-red-300">{nicknameError}</p>
                )}
              </div>

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
                    className="block w-full pl-10 pr-3 py-2 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:bg-white/15 transition-all text-sm"
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
                    className="block w-full pl-10 pr-3 py-2 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:bg-white/15 transition-all text-sm appearance-none"
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
                    className="block w-full pl-10 pr-3 py-2 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:bg-white/15 transition-all text-sm appearance-none"
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

              {/* 초대 코드 입력 */}
              <div>
                <label className="block text-sm font-medium text-white/80 mb-1">초대 코드 (선택)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaGift className="h-4 w-4 text-white/40" />
                  </div>
                  <input
                    type="text"
                    name="inviteCode"
                    value={formData.inviteCode}
                    onChange={handleInputChange}
                    className="block w-full pl-10 pr-3 py-2 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:bg-white/15 transition-all text-sm"
                    placeholder="친구에게 받은 초대 코드를 입력하세요"
                  />
                </div>
                <p className="mt-1 text-xs text-blue-200">
                  초대 코드를 입력하면 50P를 즉시 지급해드립니다!
                </p>
              </div>

              {/* 에러 메시지 */}
              {error && (
                <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-3">
                  <p className="text-red-200 text-sm">{error}</p>
                </div>
              )}

              {/* 회원가입 버튼 */}
              <button
                type="submit"
                disabled={loading || isCheckingNickname || !!nicknameError}
                className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 text-white py-3 px-4 rounded-xl font-bold hover:shadow-lg hover:shadow-amber-500/25 hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-amber-400/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {loading ? '회원가입 중...' : '회원가입'}
              </button>
            </form>

            {/* 로그인 링크 */}
            <div className="mt-4 text-center">
              <p className="text-blue-200 text-sm">
                이미 계정이 있으신가요?{' '}
                <Link href="/login" className="text-yellow-300 hover:text-yellow-400 font-bold">
                  로그인
                </Link>
              </p>
            </div>
          </div>
        </section>

        {/* 하단 여백 */}
        <section className="mb-8"></section>
      </div>
    </div>
  );
};

export default ProfileSetup; 
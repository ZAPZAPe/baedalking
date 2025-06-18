'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FaCrown, FaEnvelope, FaLock, FaUser, FaMapMarkerAlt, FaMotorcycle, FaUserPlus, FaChevronLeft, FaGift } from 'react-icons/fa';
import { supabase } from '../../lib/supabase';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import KakaoAd from '@/components/KakaoAd';

const SignUp = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    nickname: '',
    region: '',
    vehicle: 'motorcycle',
    referralCode: ''
  });
  const [referralValid, setReferralValid] = useState<boolean | null>(null);
  const [checkingReferral, setCheckingReferral] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    
    // 추천인 코드가 변경되면 유효성 상태 초기화
    if (e.target.name === 'referralCode') {
      setReferralValid(null);
    }
  };

  // 추천인 코드 확인
  const checkReferralCode = async () => {
    if (!formData.referralCode) {
      setReferralValid(null);
      return;
    }

    setCheckingReferral(true);
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, nickname')
        .eq('referral_code', formData.referralCode)
        .single();

      if (error || !data) {
        setReferralValid(false);
        setError('유효하지 않은 추천인 코드입니다.');
      } else {
        setReferralValid(true);
        setError('');
        toast.success(`${data.nickname}님의 추천 코드가 확인되었습니다!`);
      }
    } catch (error) {
      setReferralValid(false);
      setError('추천인 코드 확인 중 오류가 발생했습니다.');
    } finally {
      setCheckingReferral(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // 비밀번호 확인
    if (formData.password !== formData.confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.');
      setLoading(false);
      return;
    }

    // 비밀번호 길이 체크
    if (formData.password.length < 6) {
      setError('비밀번호는 최소 6자 이상이어야 합니다.');
      setLoading(false);
      return;
    }

    try {
      // 1. 닉네임 중복 검사
      const { data: existingUsers } = await supabase
        .from('users')
        .select('nickname')
        .eq('nickname', formData.nickname);

      if (existingUsers && existingUsers.length > 0) {
        setError('이미 사용 중인 닉네임입니다.');
        setLoading(false);
        return;
      }

      // 2. Supabase Auth에 사용자 생성
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        }
      });

      if (authError) throw authError;

      if (authData.user) {
        // 3. users 테이블에 프로필 생성
        const referralCode = `BK${Date.now().toString(36).toUpperCase()}`;
        const initialPoints = formData.referralCode && referralValid ? 500 : 300; // 추천코드 있으면 500P, 없으면 300P
        
        const { error: profileError } = await supabase
          .from('users')
          .insert({
            id: authData.user.id,
            email: formData.email,
            username: formData.email,
            nickname: formData.nickname,
            region: formData.region,
            vehicle: formData.vehicle,
            points: initialPoints,
            referral_code: referralCode,
            referred_by: formData.referralCode || null,
            created_at: new Date().toISOString(),
          });

        if (profileError) {
          console.error('프로필 생성 오류:', profileError);
          // Auth 사용자 삭제
          await supabase.auth.admin.deleteUser(authData.user.id);
          throw profileError;
        }

        // 추천인이 있는 경우 추천인에게 300P 지급
        if (formData.referralCode && referralValid) {
          const { data: referrer } = await supabase
            .from('users')
            .select('id, points')
            .eq('referral_code', formData.referralCode)
            .single();

          if (referrer) {
            await supabase
              .from('users')
              .update({ points: (referrer.points || 0) + 500 })
              .eq('id', referrer.id);

            await supabase
              .from('point_history')
              .insert({
                user_id: referrer.id,
                points: 500,
                type: 'referral',
                reason: '친구 추천 보상',
                created_at: new Date().toISOString()
              });
          }
        }

        toast.success('회원가입이 완료되었습니다! 이메일을 확인해주세요.');
        
        // 바로 로그인 시도
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        });

        if (!signInError) {
          router.push('/');
        } else {
          router.push('/login');
        }
      }
    } catch (err: any) {
      console.error('회원가입 오류:', err);
      if (err.message?.includes('already registered')) {
        setError('이미 가입된 이메일입니다.');
      } else {
        setError('회원가입에 실패했습니다. 다시 시도해주세요.');
      }
    } finally {
      setLoading(false);
    }
  };

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
              배달킹
            </h1>
            <p className="text-blue-200">실시간 배달 랭킹 서비스</p>
          </div>
        </section>

        {/* 회원가입 폼 */}
        <section className="mb-4">
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 shadow-xl border border-white/20">
            <div className="flex items-center justify-between mb-6">
              <Link href="/login" className="text-white hover:text-yellow-400 transition-colors">
                <FaChevronLeft size={24} />
              </Link>
              <h2 className="text-2xl font-bold text-white">회원가입</h2>
              <div className="w-6"></div>
            </div>
            
            <form onSubmit={handleSignUp} className="space-y-4">
              {/* 이메일 */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  이메일
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaEnvelope className="text-white/60" />
                  </div>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-3 bg-white/20 border border-white/30 rounded-xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all"
                    placeholder="이메일 주소"
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              {/* 비밀번호 */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  비밀번호
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaLock className="text-white/60" />
                  </div>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-3 bg-white/20 border border-white/30 rounded-xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all"
                    placeholder="비밀번호 (최소 6자)"
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              {/* 비밀번호 확인 */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  비밀번호 확인
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaLock className="text-white/60" />
                  </div>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-3 bg-white/20 border border-white/30 rounded-xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all"
                    placeholder="비밀번호 확인"
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              {/* 닉네임 */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  닉네임
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaUser className="text-white/60" />
                  </div>
                  <input
                    type="text"
                    name="nickname"
                    value={formData.nickname}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-3 bg-white/20 border border-white/30 rounded-xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all"
                    placeholder="닉네임"
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              {/* 지역 */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  지역
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaMapMarkerAlt className="text-white/60" />
                  </div>
                  <select
                    name="region"
                    value={formData.region}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-3 bg-white/20 border border-white/30 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all appearance-none"
                    required
                    disabled={loading}
                  >
                    <option value="" className="bg-gray-800">지역 선택</option>
                    <option value="서울" className="bg-gray-800">서울</option>
                    <option value="경기" className="bg-gray-800">경기</option>
                    <option value="인천" className="bg-gray-800">인천</option>
                    <option value="부산" className="bg-gray-800">부산</option>
                    <option value="대구" className="bg-gray-800">대구</option>
                    <option value="광주" className="bg-gray-800">광주</option>
                    <option value="대전" className="bg-gray-800">대전</option>
                    <option value="울산" className="bg-gray-800">울산</option>
                    <option value="세종" className="bg-gray-800">세종</option>
                    <option value="강원" className="bg-gray-800">강원</option>
                    <option value="충북" className="bg-gray-800">충북</option>
                    <option value="충남" className="bg-gray-800">충남</option>
                    <option value="전북" className="bg-gray-800">전북</option>
                    <option value="전남" className="bg-gray-800">전남</option>
                    <option value="경북" className="bg-gray-800">경북</option>
                    <option value="경남" className="bg-gray-800">경남</option>
                    <option value="제주" className="bg-gray-800">제주</option>
                  </select>
                </div>
              </div>

              {/* 운송수단 */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  운송수단
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaMotorcycle className="text-white/60" />
                  </div>
                  <select
                    name="vehicle"
                    value={formData.vehicle}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-3 bg-white/20 border border-white/30 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all appearance-none"
                    required
                    disabled={loading}
                  >
                    <option value="motorcycle" className="bg-gray-800">오토바이</option>
                    <option value="bicycle" className="bg-gray-800">자전거</option>
                    <option value="car" className="bg-gray-800">자동차</option>
                    <option value="walk" className="bg-gray-800">도보</option>
                  </select>
                </div>
              </div>

              {/* 추천인 코드 */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  추천인 코드 <span className="text-white/60">(선택사항)</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaGift className={`${referralValid === true ? 'text-green-400' : referralValid === false ? 'text-red-400' : 'text-white/60'}`} />
                  </div>
                  <input
                    type="text"
                    name="referralCode"
                    value={formData.referralCode}
                    onChange={handleChange}
                    onBlur={checkReferralCode}
                    className={`w-full pl-10 pr-4 py-3 bg-white/20 border rounded-xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all ${
                      referralValid === true ? 'border-green-400/50' : 
                      referralValid === false ? 'border-red-400/50' : 'border-white/30'
                    }`}
                    placeholder="추천인 코드를 입력하세요"
                    disabled={loading}
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
                  <p className="text-green-400 text-xs mt-1">추천인에게 500P, 회원님께 500P가 지급됩니다!</p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading || checkingReferral}
                className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 text-white py-3 px-4 rounded-xl font-bold hover:from-yellow-500 hover:to-orange-600 hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-offset-2 focus:ring-offset-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
              >
                <FaUserPlus size={18} />
                {loading ? '가입 중...' : '회원가입'}
              </button>
            </form>

            {/* 로그인 링크 */}
            <div className="mt-6 text-center">
              <p className="text-white/60 text-sm">
                이미 계정이 있으신가요?{' '}
                <Link 
                  href="/login" 
                  className="text-yellow-400 hover:text-yellow-300 font-bold transition-colors"
                >
                  로그인
                </Link>
              </p>
            </div>

            {/* 에러 메시지 */}
            {error && (
              <div className="mt-4 bg-red-500/20 border border-red-500/50 rounded-xl p-3">
                <p className="text-red-200 text-sm">{error}</p>
              </div>
            )}
          </div>
        </section>

        {/* 하단 광고 */}
        <section className="mb-8">
          <KakaoAd page="signup" index={0} />
        </section>
      </div>
    </div>
  );
};

export default SignUp; 
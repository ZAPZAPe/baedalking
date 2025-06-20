'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';
import { FaUser, FaMapMarkerAlt, FaMotorcycle, FaPhone, FaCamera, FaUserFriends } from 'react-icons/fa';
import Image from 'next/image';
import { validateInviteCode } from '@/services/inviteService';
import { toast } from 'sonner';

// 시/도 목록
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

export default function ProfileSetupPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [error, setError] = useState('');
  const [nicknameError, setNicknameError] = useState('');
  const [isCheckingNickname, setIsCheckingNickname] = useState(false);
  
  const [formData, setFormData] = useState({
    nickname: '',
    region: '',
    vehicle: '',
    phone: '',
    profile_image: '',
    invite_code: ''
  });

  const [userInfo, setUserInfo] = useState<any>(null);

  useEffect(() => {
    const checkUserAndLoadData = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          router.push('/login');
          return;
        }

        // 사용자 정보 가져오기
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (userError && userError.code !== 'PGRST116') {
          console.error('사용자 정보 조회 오류:', userError);
        }

        // 이미 프로필이 완성된 경우 메인 페이지로 이동
        if (userData?.nickname && userData?.region && userData?.vehicle && userData?.phone) {
          router.push('/');
          return;
        }

        // 카카오에서 받은 정보로 초기값 설정
        if (userData) {
          setFormData({
            nickname: userData.nickname || '',
            region: userData.region || '',
            vehicle: userData.vehicle || '',
            phone: userData.phone || '',
            profile_image: userData.profile_image || '',
            invite_code: ''
          });
          setUserInfo(userData);
        }

        setLoading(false);
      } catch (error) {
        console.error('초기 데이터 로드 오류:', error);
        setLoading(false);
      }
    };

    checkUserAndLoadData();
  }, [router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
    
    // 닉네임 변경 시 에러 초기화
    if (name === 'nickname') {
      setNicknameError('');
    }
  };

  // 닉네임 중복 검사
  const checkNicknameDuplicate = async (nickname: string) => {
    if (!nickname || nickname.length < 2) {
      setNicknameError('닉네임은 2글자 이상이어야 합니다.');
      return false;
    }

    if (nickname.length > 10) {
      setNicknameError('닉네임은 10글자 이하여야 합니다.');
      return false;
    }

    // 특수문자 검사
    const specialCharRegex = /[!@#$%^&*(),.?":{}|<>]/;
    if (specialCharRegex.test(nickname)) {
      setNicknameError('닉네임에는 특수문자를 사용할 수 없습니다.');
      return false;
    }

    setIsCheckingNickname(true);
    setNicknameError('');

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return false;

      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('nickname', nickname)
        .neq('id', session.user.id)
        .single();

      if (existingUser) {
        setNicknameError('이미 사용 중인 닉네임입니다.');
        return false;
      }

      return true;
    } catch (error) {
      console.error('닉네임 중복 확인 오류:', error);
      return true; // 오류 시 통과
    } finally {
      setIsCheckingNickname(false);
    }
  };

  // 닉네임 변경 핸들러 (디바운스 적용)
  const handleNicknameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    setFormData(prev => ({ ...prev, nickname: value }));
    setNicknameError('');
    
    // 디바운스: 500ms 후에 중복 검사 실행
    if (value.trim()) {
      const timeoutId = setTimeout(() => {
        checkNicknameDuplicate(value.trim());
      }, 500);
      
      return () => clearTimeout(timeoutId);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 파일 크기 체크 (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('이미지 크기는 5MB 이하여야 합니다.');
      return;
    }

    // 파일 타입 체크
    if (!file.type.startsWith('image/')) {
      setError('이미지 파일만 업로드 가능합니다.');
      return;
    }

    setUploadingImage(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('image', file);

      // 기존 API 엔드포인트 사용
      const response = await fetch('/api/upload/profile', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('이미지 업로드 실패');
      }

      const data = await response.json();
      
      if (data.imageUrl) {
        setFormData(prev => ({ ...prev, profile_image: data.imageUrl }));
      }
    } catch (err: any) {
      console.error('이미지 업로드 오류:', err);
      setError('이미지 업로드 중 오류가 발생했습니다.');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nickname || !formData.region || !formData.vehicle || !formData.phone) {
      setError('모든 필수 항목을 입력해주세요.');
      return;
    }

    // 닉네임 에러가 있으면 제출 불가
    if (nicknameError) {
      setError('닉네임을 확인해주세요.');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.push('/login');
        return;
      }

      // 최종 닉네임 중복 체크
      const isNicknameValid = await checkNicknameDuplicate(formData.nickname);
      if (!isNicknameValid) {
        setSaving(false);
        return;
      }

      // 프로필 업데이트
      const { error: updateError } = await supabase
        .from('users')
        .update({
          nickname: formData.nickname,
          region: formData.region,
          vehicle: formData.vehicle,
          phone: formData.phone,
          profile_image: formData.profile_image,
          updated_at: new Date().toISOString()
        })
        .eq('id', session.user.id);

      if (updateError) throw updateError;

      // 초대 코드가 입력된 경우 처리
      if (formData.invite_code) {
        try {
          const result = await validateInviteCode(formData.invite_code, session.user.id);
          
          // 성공 메시지 표시
          toast.success(`초대 코드 사용 성공! ${result.invitedPoints}P를 받았습니다!`, {
            duration: 5000,
          });
        } catch (error: any) {
          // 초대 코드 오류는 무시하고 진행 (선택사항이므로)
          console.error('초대 코드 처리 오류:', error);
          toast.error(error.message || '초대 코드 처리 중 오류가 발생했습니다.');
        }
      }

      router.push('/');
    } catch (err: any) {
      console.error('프로필 저장 오류:', err);
      setError(err.message || '프로필 저장 중 오류가 발생했습니다.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-purple-600 via-pink-600 to-purple-800">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white mx-auto"></div>
          <p className="mt-4 text-white">로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-r from-purple-600 via-pink-600 to-purple-800 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto">
        {/* 헤더와 폼을 하나의 컨테이너에 */}
        <div className="bg-gradient-to-br from-purple-900/30 to-pink-900/30 backdrop-blur-lg rounded-3xl p-4 sm:p-6 shadow-2xl border border-purple-500/30 relative overflow-hidden">
          {/* 배경 애니메이션 효과 */}
          <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 via-pink-600/10 to-purple-600/10 animate-pulse"></div>
          
          <div className="relative z-10">
            {/* 헤더 - 실시간 Top 3 스타일 */}
            <div className="text-center mb-6">
              <div className="flex items-center justify-center gap-2 mb-1">
                <FaUser className="text-purple-400 animate-bounce w-4 h-4 sm:w-7 sm:h-7" />
                <h1 className="text-lg sm:text-2xl md:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-orange-400 to-pink-400">
                  프로필 설정
                </h1>
                <FaUser className="text-purple-400 animate-bounce w-4 h-4 sm:w-7 sm:h-7" />
              </div>
              <p className="text-purple-200 text-xs">배달킹 서비스 이용을 위한 추가 정보를 입력해주세요!</p>
            </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* 프로필 사진 */}
            <div className="flex justify-center mb-6">
              <div className="relative">
                <div className="w-24 h-24 rounded-full overflow-hidden bg-white/20 border-2 border-white/30">
                  {formData.profile_image ? (
                    <Image
                      src={formData.profile_image}
                      alt="프로필 사진"
                      width={96}
                      height={96}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <FaUser className="w-12 h-12 text-white/40 animate-pulse" />
                    </div>
                  )}
                </div>
                <label className="absolute bottom-0 right-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full p-2 cursor-pointer hover:from-purple-600 hover:to-pink-600 transition-all duration-300 hover:scale-110">
                  <FaCamera className="w-4 h-4 text-white" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    disabled={uploadingImage}
                  />
                </label>
              </div>
            </div>
            {uploadingImage && (
              <p className="text-center text-sm text-white/60">이미지 업로드 중...</p>
            )}

            {/* 닉네임 */}
            <div>
              <label className="block text-sm font-medium text-white/80 mb-1">닉네임 *</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaUser className="h-4 w-4 text-white/40 animate-pulse" />
                </div>
                <input
                  type="text"
                  name="nickname"
                  value={formData.nickname}
                  onChange={handleNicknameChange}
                  className={`block w-full pl-10 pr-3 py-3 bg-white/10 border rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:bg-white/15 transition-all ${
                    nicknameError 
                      ? 'border-red-400/50 focus:ring-red-400/50' 
                      : 'border-white/20 focus:ring-purple-400/50'
                  }`}
                  placeholder="닉네임을 입력하세요"
                  required
                />
              </div>
              {nicknameError && (
                <p className="mt-1 text-xs text-red-400">{nicknameError}</p>
              )}
              {isCheckingNickname && (
                <p className="mt-1 text-xs text-blue-400">닉네임 확인 중...</p>
              )}
              {userInfo?.nickname && !nicknameError && !isCheckingNickname && (
                <p className="mt-1 text-xs text-white/60">카카오톡 닉네임: {userInfo.nickname}</p>
              )}
            </div>

            {/* 전화번호 */}
            <div>
              <label className="block text-sm font-medium text-white/80 mb-1">전화번호 *</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaPhone className="h-4 w-4 text-white/40 animate-pulse" />
                </div>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="block w-full pl-10 pr-3 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-400/50 focus:bg-white/15 transition-all"
                  placeholder="전화번호를 입력하세요"
                  required
                />
              </div>
            </div>

            {/* 지역 */}
            <div>
              <label className="block text-sm font-medium text-white/80 mb-1">활동 지역 *</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaMapMarkerAlt className="h-4 w-4 text-white/40 animate-pulse" />
                </div>
                <select
                  name="region"
                  value={formData.region}
                  onChange={handleInputChange}
                  className="block w-full pl-10 pr-3 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-400/50 focus:bg-white/15 transition-all appearance-none"
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
              <label className="block text-sm font-medium text-white/80 mb-1">배달 수단 *</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaMotorcycle className="h-4 w-4 text-white/40 animate-pulse" />
                </div>
                <select
                  name="vehicle"
                  value={formData.vehicle}
                  onChange={handleInputChange}
                  className="block w-full pl-10 pr-3 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-400/50 focus:bg-white/15 transition-all appearance-none"
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

            {/* 친구 초대 코드 */}
            <div>
              <label className="block text-sm font-medium text-white/80 mb-1">친구 초대 코드 (선택)</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaUserFriends className="h-4 w-4 text-white/40 animate-pulse" />
                </div>
                <input
                  type="text"
                  name="invite_code"
                  value={formData.invite_code}
                  onChange={handleInputChange}
                  className="block w-full pl-10 pr-3 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-400/50 focus:bg-white/15 transition-all uppercase"
                  placeholder="초대 코드를 입력하세요"
                  maxLength={15}
                />
              </div>
              <p className="mt-1 text-xs text-white/60">초대 코드 입력 시 300P를 받을 수 있습니다!</p>
            </div>

            {/* 에러 메시지 */}
            {error && (
              <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-xl">
                <p className="text-sm text-red-200">{error}</p>
              </div>
            )}

            {/* 제출 버튼 */}
            <button
              type="submit"
              disabled={saving || uploadingImage || isCheckingNickname || !!nicknameError}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 px-4 rounded-xl font-bold hover:shadow-lg hover:shadow-purple-500/25 hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-purple-400/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {saving ? (
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
        </div>

        {/* 안내 메시지 */}
        <div className="mt-6 text-center">
          <p className="text-white/60 text-sm">
            * 표시된 항목은 필수 입력 사항입니다
          </p>
          <p className="text-white/60 text-sm mt-1">
            프로필 정보는 나중에 설정에서 변경할 수 있습니다
          </p>
        </div>
      </div>
    </div>
  );
} 
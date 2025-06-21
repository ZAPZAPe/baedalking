'use client';

import { useState, useEffect, useRef } from 'react';
import { FaUser, FaMapMarkerAlt, FaMotorcycle, FaBicycle, FaCar, FaWalking, FaEdit, FaSignOutAlt, FaChevronLeft, FaCheck, FaTimes, FaCrown, FaBell, FaLock, FaQuestionCircle, FaCog, FaShieldAlt, FaCamera, FaCoins, FaList, FaGift, FaShare, FaComment, FaFileAlt, FaUsers, FaTimes as FaClose, FaCopy } from 'react-icons/fa';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { toast } from 'react-hot-toast';
import dynamicImport from 'next/dynamic';
import Loading from '@/components/Loading';
import NoSSR from '@/components/NoSSR';
import KakaoAdGlobal from '@/components/KakaoAdGlobal';

// 페이지를 동적으로 만들기
export const dynamic = 'force-dynamic';

// 동적 import
const KakaoInit = dynamicImport(() => import('@/components/KakaoInit'), {
  ssr: false
});

declare global {
  interface Window {
    Kakao: any;
  }
}

export default function SettingsPage() {
  const { user, userProfile, loading: authLoading, signOut, updateProfile, refreshProfile } = useAuth();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [nickname, setNickname] = useState('');
  const [region, setRegion] = useState('');
  const [vehicle, setVehicle] = useState('');
  const [profileImage, setProfileImage] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [isCheckingNickname, setIsCheckingNickname] = useState(false);
  const [nicknameError, setNicknameError] = useState('');
  const [nicknameAvailable, setNicknameAvailable] = useState<boolean | null>(null);
  const nicknameCheckTimeout = useRef<NodeJS.Timeout>();
  const [modalType, setModalType] = useState<'notice' | 'faq' | 'terms' | 'privacy' | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (userProfile) {
      setNickname(userProfile.nickname || '');
      setRegion(userProfile.region || '');
      setVehicle(userProfile.vehicle || 'motorcycle');
      setProfileImage(userProfile.profileImage || '');
    }
  }, [userProfile]);

  const handleLogout = async () => {
    try {
      await signOut();
      router.push('/');
    } catch (error) {
      console.error('로그아웃 실패:', error);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // 파일 크기 체크 (5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('이미지 크기는 5MB 이하여야 합니다.');
      return;
    }

    // 파일 타입 체크
    if (!file.type.startsWith('image/')) {
      alert('이미지 파일만 업로드 가능합니다.');
      return;
    }

    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('image', file);

      // API 엔드포인트 사용
      const response = await fetch('/api/upload/profile', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('이미지 업로드 실패');
      }

      const data = await response.json();
      
      if (data.imageUrl) {
        setProfileImage(data.imageUrl);
        
        // 바로 프로필 업데이트
        await updateProfile({ profileImage: data.imageUrl });
      }
      
    } catch (error) {
      console.error('이미지 업로드 실패:', error);
      alert('이미지 업로드에 실패했습니다.');
    } finally {
      setUploadingImage(false);
    }
  };

  // 닉네임 중복 검사
  const checkNicknameDuplicate = async (newNickname: string) => {
    if (!newNickname || newNickname === userProfile?.nickname) {
      setNicknameError('');
      setNicknameAvailable(null);
      return true;
    }

    setIsCheckingNickname(true);
    setNicknameError('');
    setNicknameAvailable(null);

    try {
      const response = await fetch('/api/check-nickname', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          nickname: newNickname,
          currentUserId: user?.id 
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '닉네임 확인 중 오류가 발생했습니다.');
      }

      if (!data.available) {
        setNicknameError('이미 사용 중인 닉네임입니다.');
        setNicknameAvailable(false);
        return false;
      }

      setNicknameAvailable(true);
      return true;
    } catch (error) {
      console.error('닉네임 중복 검사 오류:', error);
      setNicknameError('닉네임 중복 검사 중 오류가 발생했습니다.');
      setNicknameAvailable(false);
      return false;
    } finally {
      setIsCheckingNickname(false);
    }
  };

  // 닉네임 변경 핸들러
  const handleNicknameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newNickname = e.target.value;
    setNickname(newNickname);
    setNicknameError('');
    setNicknameAvailable(null);

    // 이전 타임아웃 취소
    if (nicknameCheckTimeout.current) {
      clearTimeout(nicknameCheckTimeout.current);
    }

    // 500ms 후에 중복 검사 실행
    nicknameCheckTimeout.current = setTimeout(() => {
      if (newNickname && newNickname !== userProfile?.nickname) {
        checkNicknameDuplicate(newNickname);
      }
    }, 500);
  };

  const handleSave = async () => {
    if (!user) return;

    setLoading(true);
    setNicknameError('');

    try {
      // 닉네임 중복 검사
      const isNicknameAvailable = await checkNicknameDuplicate(nickname);
      if (!isNicknameAvailable) {
        setLoading(false);
        return;
      }

      const { error } = await supabase
        .from('users')
        .update({
          nickname,
          region,
          vehicle,
          profile_image: profileImage,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) throw error;

      // AuthContext의 userProfile 업데이트
      await refreshProfile();
      
      toast.success('프로필이 성공적으로 업데이트되었습니다.');
      setIsEditMode(false);
    } catch (error) {
      console.error('프로필 업데이트 오류:', error);
      toast.error('프로필 업데이트에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    // 원래 값으로 되돌리기
    if (userProfile) {
      setNickname(userProfile.nickname || '');
      setRegion(userProfile.region || '');
      setVehicle(userProfile.vehicle || 'motorcycle');
      setProfileImage(userProfile.profileImage || '');
    }
    setIsEditMode(false);
  };

  const getVehicleIcon = (vehicleType: string) => {
    switch (vehicleType) {
      case 'motorcycle':
        return <FaMotorcycle className="text-white" size={14} />;
      case 'bicycle':
        return <FaBicycle className="text-white" size={14} />;
      case 'car':
        return <FaCar className="text-white" size={14} />;
      case 'walk':
        return <FaWalking className="text-white" size={14} />;
      default:
        return <FaMotorcycle className="text-white" size={14} />;
    }
  };

  const getVehicleText = (vehicleType: string) => {
    switch (vehicleType) {
      case 'motorcycle':
        return '오토바이';
      case 'bicycle':
        return '자전거';
      case 'car':
        return '자동차';
      case 'walk':
        return '도보';
      default:
        return '오토바이';
    }
  };

  // 모달 내용 컴포넌트
  const ModalContent = () => {
    switch (modalType) {
      case 'notice':
        return (
          <div className="space-y-4">
            <div className="space-y-6">
              <div className="border-b border-white/10 pb-4">
                <p className="text-sm text-gray-400">2024.12.20</p>
                <h4 className="font-bold mb-2">배달킹 정식 서비스 오픈! 🎉</h4>
                <p className="text-sm text-gray-300">배달 라이더들을 위한 실적 관리 및 랭킹 서비스 배달킹이 정식 오픈되었습니다. 매일 실적을 업로드하고 다른 라이더들과 선의의 경쟁을 펼쳐보세요!</p>
              </div>
              <div className="border-b border-white/10 pb-4">
                <p className="text-sm text-gray-400">2024.12.15</p>
                <h4 className="font-bold mb-2">랭킹 보상 시스템 안내 💰</h4>
                <p className="text-sm text-gray-300">매일 오전 5시 59분에 전날 랭킹 기준으로 포인트가 자동 지급됩니다. 1등 500P, 2등 400P, 3등 300P, 4-10등 100P가 지급되니 열심히 활동해주세요!</p>
              </div>
              <div className="border-b border-white/10 pb-4">
                <p className="text-sm text-gray-400">2024.12.10</p>
                <h4 className="font-bold mb-2">친구 초대 이벤트 🎁</h4>
                <p className="text-sm text-gray-300">친구를 초대하면 가입자와 추천인 모두 500P씩 지급됩니다. 내 추천 코드를 공유하고 함께 배달킹을 즐겨보세요!</p>
              </div>
            </div>
          </div>
        );
      case 'faq':
        return (
          <div className="space-y-4">
            <div className="space-y-6">
              <div className="border-b border-white/10 pb-4">
                <h4 className="font-bold mb-2">Q. 포인트는 어떻게 적립되나요?</h4>
                <p className="text-sm text-gray-300">신규 가입 시 300P, 출석체크 시 50P, 실적 업로드 시 50P가 적립되며, 매일 랭킹에 따라 추가 포인트가 지급됩니다.</p>
              </div>
              <div className="border-b border-white/10 pb-4">
                <h4 className="font-bold mb-2">Q. 포인트는 어떻게 사용하나요?</h4>
                <p className="text-sm text-gray-300">현재는 포인트 적립 기능만 제공되며, 향후 다양한 리워드 기능이 추가될 예정입니다.</p>
              </div>
              <div className="border-b border-white/10 pb-4">
                <h4 className="font-bold mb-2">Q. 랭킹은 어떻게 산정되나요?</h4>
                <p className="text-sm text-gray-300">업로드된 실적의 일일 매출액을 기준으로 랭킹이 결정됩니다. 매일 오전 6시에 전날 랭킹이 확정됩니다.</p>
              </div>
              <div className="border-b border-white/10 pb-4">
                <h4 className="font-bold mb-2">Q. 개인정보는 안전한가요?</h4>
                <p className="text-sm text-gray-300">모든 개인정보는 암호화되어 안전하게 보관되며, 서비스 운영 목적 외에는 사용되지 않습니다.</p>
              </div>
            </div>
          </div>
        );
      case 'terms':
        return (
          <div className="space-y-4">
            <div className="space-y-4 text-sm text-gray-300">
              <div className="text-center mb-4">
                <h3 className="text-lg font-bold text-white">배달킹 서비스 이용약관</h3>
                <p className="text-xs text-gray-400 mt-1">시행일: 2024년 12월 20일</p>
              </div>
              
              <div>
                <h4 className="font-bold text-white mb-2">제1조 (목적)</h4>
                <p>이 약관은 배달킹(이하 "회사")이 제공하는 배달 실적 관리 및 랭킹 서비스의 이용과 관련하여 회사와 회원 간의 권리, 의무 및 책임사항을 규정함을 목적으로 합니다.</p>
              </div>
              
              <div>
                <h4 className="font-bold text-white mb-2">제2조 (정의)</h4>
                <p>① "서비스"란 회사가 제공하는 배달킹 모바일 애플리케이션 및 관련 서비스를 말합니다.</p>
                <p>② "회원"이란 이 약관에 동의하고 회사와 서비스 이용계약을 체결한 개인을 말합니다.</p>
                <p>③ "실적"이란 회원이 업로드한 배달 관련 수익 정보를 말합니다.</p>
              </div>
              
              <div>
                <h4 className="font-bold text-white mb-2">제3조 (서비스의 내용)</h4>
                <p>① 배달 실적 업로드 및 관리</p>
                <p>② 일일/월간 랭킹 제공</p>
                <p>③ 포인트 적립 및 관리</p>
                <p>④ 친구 초대 시스템</p>
                <p>⑤ 기타 회사가 정하는 서비스</p>
              </div>
              
              <div>
                <h4 className="font-bold text-white mb-2">제4조 (회원의 의무)</h4>
                <p>① 회원은 정확하고 진실한 정보를 제공해야 합니다.</p>
                <p>② 허위 실적 업로드, 부정한 방법으로 포인트 획득 등의 행위를 해서는 안 됩니다.</p>
                <p>③ 다른 회원의 개인정보를 무단으로 수집, 이용해서는 안 됩니다.</p>
              </div>
              
              <div>
                <h4 className="font-bold text-white mb-2">제5조 (서비스 이용제한)</h4>
                <p>회사는 회원이 다음 행위를 하는 경우 서비스 이용을 제한할 수 있습니다.</p>
                <p>① 허위 정보 제공 또는 조작된 실적 업로드</p>
                <p>② 타인의 명의를 도용하거나 허위사실을 유포하는 경우</p>
                <p>③ 서비스의 안정적 운영을 방해하는 경우</p>
              </div>
              
              <div>
                <h4 className="font-bold text-white mb-2">제6조 (면책조항)</h4>
                <p>① 회사는 천재지변, 전쟁, 시스템 장애 등 불가항력으로 인한 서비스 중단에 대해 책임지지 않습니다.</p>
                <p>② 회원이 서비스를 이용하여 얻은 정보로 인한 손해에 대해서는 책임지지 않습니다.</p>
              </div>
              
              <div className="text-center pt-4">
                <p className="text-xs text-gray-400">문의: support@baedalrank.com</p>
              </div>
            </div>
          </div>
        );
      case 'privacy':
        return (
          <div className="space-y-4">
            <div className="space-y-4 text-sm text-gray-300">
              <div className="text-center mb-4">
                <h3 className="text-lg font-bold text-white">개인정보 처리방침</h3>
                <p className="text-xs text-gray-400 mt-1">시행일: 2024년 12월 20일</p>
              </div>
              
              <div>
                <h4 className="font-bold text-white mb-2">1. 개인정보 수집 항목</h4>
                <p className="mb-2"><strong>필수항목:</strong></p>
                <p>- 카카오톡 로그인: 카카오 계정 ID, 닉네임, 프로필 이미지</p>
                <p>- 서비스 이용: 지역, 운송수단, 전화번호</p>
                <p className="mb-2 mt-3"><strong>자동 수집 정보:</strong></p>
                <p>- 서비스 이용 기록, 접속 로그, 쿠키, 접속 IP 주소</p>
                <p>- 기기 정보 (OS 버전, 기기 모델명)</p>
              </div>
              
              <div>
                <h4 className="font-bold text-white mb-2">2. 개인정보 수집 및 이용 목적</h4>
                <p>- 회원 가입 및 본인 확인</p>
                <p>- 서비스 제공 및 맞춤형 서비스 제공</p>
                <p>- 포인트 적립 및 랭킹 산정</p>
                <p>- 고객 상담 및 불만 처리</p>
                <p>- 서비스 개선 및 통계 분석</p>
                <p>- 부정 이용 방지 및 서비스 안정성 확보</p>
              </div>
              
              <div>
                <h4 className="font-bold text-white mb-2">3. 개인정보 제3자 제공</h4>
                <p>회사는 원칙적으로 회원의 개인정보를 제3자에게 제공하지 않습니다. 다만, 다음의 경우 예외로 합니다:</p>
                <p>- 법령에 의해 요구되는 경우</p>
                <p>- 서비스 제공을 위해 필요한 경우 (암호화하여 최소한으로 제공)</p>
              </div>
              
              <div>
                <h4 className="font-bold text-white mb-2">4. 개인정보 보유 및 이용 기간</h4>
                <p>- 회원 탈퇴 시: 즉시 삭제 (법령에서 보관을 요구하는 경우 제외)</p>
                <p>- 서비스 이용 기록: 3개월</p>
                <p>- 부정 이용 기록: 1년</p>
              </div>
              
              <div>
                <h4 className="font-bold text-white mb-2">5. 개인정보 안전성 확보 조치</h4>
                <p>- 개인정보 암호화 저장</p>
                <p>- 해킹 등에 대비한 기술적 대책</p>
                <p>- 개인정보 처리 시스템 접근 권한 관리</p>
                <p>- 개인정보 처리 현황 점검</p>
              </div>
              
              <div>
                <h4 className="font-bold text-white mb-2">6. 개인정보 처리에 관한 문의</h4>
                <p>개인정보 처리에 관한 문의사항이 있으시면 아래로 연락해 주시기 바랍니다.</p>
                <p className="mt-2">이메일: support@baedalrank.com</p>
                <p>카카오톡: 배달킹 고객센터</p>
              </div>
              
              <div className="text-center pt-4 border-t border-white/10">
                <p className="text-xs text-gray-400">본 방침은 2024년 12월 20일부터 시행됩니다.</p>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  // 추천 코드 복사 함수
  const copyReferralCode = async () => {
    if (!userProfile?.referral_code) return;

    try {
      await navigator.clipboard.writeText(userProfile.referral_code);
      toast.success('추천 코드가 복사되었습니다.');
      setCopied(true);
      
      // 2초 후 복사 상태 초기화
      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (error) {
      console.error('추천 코드 복사 실패:', error);
      toast.error('추천 코드 복사에 실패했습니다.');
    }
  };

  // useEffect로 라우터 리다이렉션 처리
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }

    // 프로필 설정이 완료되지 않은 경우 프로필 설정 페이지로 리다이렉트
    if (!authLoading && user && userProfile) {
      const isProfileComplete = Boolean(
        userProfile.nickname && 
        userProfile.nickname.trim() && 
        userProfile.region && 
        userProfile.region.trim() && 
        userProfile.vehicle && 
        userProfile.vehicle.trim() && 
        userProfile.phone && 
        userProfile.phone.trim()
      );

      if (!isProfileComplete) {
        console.log('프로필 설정이 완료되지 않아 프로필 설정 페이지로 이동합니다.');
        router.push('/profile-setup');
        return;
      }
    }
  }, [authLoading, user, userProfile, router]);

  if (!user || authLoading || !userProfile) {
    return <Loading />;
  }

  return (
    <NoSSR>
      <div className="relative z-10">
        <KakaoInit />
        <div className="max-w-3xl mx-auto px-4">
        {/* 내 정보 섹션 */}
        <section className="mb-4 mt-2">
          <div className="bg-gradient-to-br from-purple-900/30 to-pink-900/30 backdrop-blur-lg rounded-3xl p-4 sm:p-6 shadow-2xl border border-purple-500/30 relative overflow-hidden">
            {/* 배경 애니메이션 효과 */}
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 via-pink-600/10 to-purple-600/10 animate-pulse"></div>
            
            <div className="relative z-10">
              {/* 헤더 - 실시간 Top 3 스타일 */}
              <div className="text-center mb-4 sm:mb-6">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <FaUser className="text-purple-400 animate-bounce w-4 h-4 sm:w-7 sm:h-7" />
                  <h2 className="text-lg sm:text-2xl md:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-orange-400 to-pink-400">
                    내 정보
                  </h2>
                  <FaUser className="text-purple-400 animate-bounce w-4 h-4 sm:w-7 sm:h-7" />
                </div>
                <p className="text-purple-200 text-xs">프로필 정보를 관리하세요</p>
              </div>

              {/* 프로필 이미지 */}
              <div className="flex justify-center mb-4">
                <div className="relative">
                  <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center overflow-hidden">
                    {profileImage ? (
                      <Image 
                        src={profileImage} 
                        alt="프로필" 
                        width={80}
                        height={80}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <FaUser size={36} className="text-white/60" />
                    )}
                  </div>
                  {isEditMode && (
                    <>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadingImage}
                        className="absolute -bottom-1 -right-1 w-7 h-7 bg-gradient-to-r from-blue-400 to-blue-500 rounded-full flex items-center justify-center shadow-lg"
                      >
                        <FaCamera size={12} className="text-white" />
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* 닉네임 */}
              <div className="text-center mb-4">
                {isEditMode ? (
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={nickname}
                      onChange={handleNicknameChange}
                      className="bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-white text-center text-lg font-bold w-full"
                      placeholder="닉네임"
                    />
                    
                    {/* 닉네임 검사 결과 표시 */}
                    <div className="min-h-[24px]">
                      {isCheckingNickname && (
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-4 h-4 border-2 border-blue-400/30 border-t-blue-400 rounded-full animate-spin"></div>
                          <p className="text-blue-400 text-sm font-medium">🔄 닉네임 확인 중...</p>
                        </div>
                      )}
                      
                      {!isCheckingNickname && nicknameAvailable === true && !nicknameError && (
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-5 h-5 bg-green-400 rounded-full flex items-center justify-center">
                            <span className="text-white text-xs font-bold">✓</span>
                          </div>
                          <p className="text-green-400 text-sm font-bold">✅ 사용 가능한 멋진 닉네임입니다!</p>
                        </div>
                      )}
                      
                      {!isCheckingNickname && nicknameAvailable === false && nicknameError && (
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-5 h-5 bg-red-400 rounded-full flex items-center justify-center">
                            <span className="text-white text-xs font-bold">✕</span>
                          </div>
                          <p className="text-red-400 text-sm font-bold">❌ {nicknameError}</p>
                        </div>
                      )}
                      
                      {!isCheckingNickname && nicknameAvailable === null && !nicknameError && nickname && nickname !== userProfile?.nickname && (
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-5 h-5 bg-gray-400 rounded-full flex items-center justify-center">
                            <span className="text-white text-xs font-bold">?</span>
                          </div>
                          <p className="text-gray-400 text-sm">닉네임을 입력해주세요</p>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <FaCrown className="text-yellow-400" size={18} />
                    <h2 className="text-xl font-bold text-yellow-400">{nickname}</h2>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                {/* 지역 */}
                <div className="bg-gradient-to-r from-white/10 to-white/5 rounded-xl p-3 border border-white/20 hover:from-white/15 hover:to-white/10 transition-all">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-blue-400/20 rounded-full flex items-center justify-center">
                        <FaMapMarkerAlt className="text-blue-400" size={14} />
                      </div>
                      <span className="text-white font-bold text-sm">지역</span>
                    </div>
                    {isEditMode ? (
                      <select
                        value={region}
                        onChange={(e) => setRegion(e.target.value)}
                        className="bg-white/10 border border-white/20 rounded-lg px-2 py-1 text-white text-sm"
                      >
                        <option value="">선택하세요</option>
                        <option value="서울">서울</option>
                        <option value="경기">경기</option>
                        <option value="인천">인천</option>
                        <option value="부산">부산</option>
                        <option value="대구">대구</option>
                        <option value="광주">광주</option>
                        <option value="대전">대전</option>
                        <option value="울산">울산</option>
                        <option value="세종">세종</option>
                        <option value="강원">강원</option>
                        <option value="충북">충북</option>
                        <option value="충남">충남</option>
                        <option value="전북">전북</option>
                        <option value="전남">전남</option>
                        <option value="경북">경북</option>
                        <option value="경남">경남</option>
                        <option value="제주">제주</option>
                      </select>
                    ) : (
                      <span className="text-purple-200 text-sm">{region}</span>
                    )}
                  </div>
                </div>

                {/* 운송수단 */}
                <div className="bg-gradient-to-r from-white/10 to-white/5 rounded-xl p-3 border border-white/20 hover:from-white/15 hover:to-white/10 transition-all">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-green-400/20 rounded-full flex items-center justify-center">
                        {getVehicleIcon(vehicle)}
                      </div>
                      <span className="text-white font-bold text-sm">운송수단</span>
                    </div>
                    {isEditMode ? (
                      <select
                        value={vehicle}
                        onChange={(e) => setVehicle(e.target.value)}
                        className="bg-white/10 border border-white/20 rounded-lg px-2 py-1 text-white text-sm"
                      >
                        <option value="motorcycle">오토바이</option>
                        <option value="bicycle">자전거</option>
                        <option value="car">자동차</option>
                        <option value="walk">도보</option>
                      </select>
                    ) : (
                      <span className="text-purple-200 text-sm">{getVehicleText(vehicle)}</span>
                    )}
                  </div>
                </div>
              </div>

              {/* 버튼 영역 */}
              {isEditMode ? (
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={handleCancel}
                    className="flex-1 bg-gradient-to-r from-white/10 to-white/5 text-white border border-white/20 hover:from-white/15 hover:to-white/10 py-2 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2"
                    disabled={loading || uploadingImage}
                  >
                    <FaTimes size={14} />
                    취소
                  </button>
                  <button
                    onClick={handleSave}
                    className="flex-1 bg-gradient-to-r from-purple-400 to-pink-500 hover:from-purple-500 hover:to-pink-600 text-white py-2 rounded-xl font-bold text-sm hover:scale-105 transition-all flex items-center justify-center gap-2"
                    disabled={loading || uploadingImage}
                  >
                    {loading ? '저장 중...' : (
                      <>
                        <FaCheck size={14} />
                        저장
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setIsEditMode(true)}
                  className="w-full mt-4 bg-gradient-to-r from-purple-400 to-pink-500 hover:from-purple-500 hover:to-pink-600 text-white py-2 rounded-xl font-bold text-sm hover:scale-105 transition-all flex items-center justify-center gap-2"
                >
                  <FaEdit size={14} />
                  프로필 수정
                </button>
              )}
            </div>
          </div>
        </section>

        {/* 광고 - 내 정보 하단으로 이동 */}
        <section className="mb-4">
          <KakaoAdGlobal page="settings" index={0} />
        </section>

        {/* 포인트 섹션 */}
        <section className="mb-4">
          <div className="bg-gradient-to-br from-purple-900/30 to-pink-900/30 backdrop-blur-lg rounded-3xl p-4 sm:p-6 shadow-2xl border border-purple-500/30 relative overflow-hidden">
            {/* 배경 애니메이션 효과 */}
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 via-pink-600/10 to-purple-600/10 animate-pulse"></div>
            
            <div className="relative z-10">
              {/* 헤더 - 실시간 Top 3 스타일 */}
              <div className="text-center mb-4 sm:mb-6">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <FaCoins className="text-purple-400 animate-bounce w-4 h-4 sm:w-7 sm:h-7" />
                  <h2 className="text-lg sm:text-2xl md:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-orange-400 to-pink-400">
                    포인트
                  </h2>
                  <FaCoins className="text-purple-400 animate-bounce w-4 h-4 sm:w-7 sm:h-7" />
                </div>
                <p className="text-purple-200 text-xs">포인트를 관리하세요</p>
              </div>

              <div className="space-y-2">
                {/* 현재 포인트 */}
                <div className="bg-gradient-to-r from-white/10 to-white/5 rounded-xl p-3 border border-white/20">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-yellow-400/20 rounded-full flex items-center justify-center">
                        <FaCoins className="text-yellow-400" size={14} />
                      </div>
                      <span className="text-white font-bold text-sm">현재 포인트</span>
                    </div>
                    <span className="text-yellow-300 font-bold text-sm">{(userProfile?.points || 0).toLocaleString()}P</span>
                  </div>
                </div>

                {/* 출근도장 */}
                <Link href="/settings/points" className="block">
                  <div className="bg-gradient-to-r from-white/10 to-white/5 rounded-xl p-3 border border-white/20 hover:from-white/15 hover:to-white/10 transition-all">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-blue-400/20 rounded-full flex items-center justify-center">
                          <FaList className="text-blue-400" size={14} />
                        </div>
                        <span className="text-white font-bold text-sm">출근도장</span>
                      </div>
                      <span className="text-purple-200 text-sm">›</span>
                    </div>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* 광고 - 포인트 하단으로 이동 */}
        <section className="mb-4">
          <KakaoAdGlobal page="settings" index={1} />
        </section>

        {/* 친구 초대 섹션 */}
        <section className="mb-4">
          <div className="bg-gradient-to-br from-purple-900/30 to-pink-900/30 backdrop-blur-lg rounded-3xl p-4 sm:p-6 shadow-2xl border border-purple-500/30 relative overflow-hidden">
            {/* 배경 애니메이션 효과 */}
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 via-pink-600/10 to-purple-600/10 animate-pulse"></div>
            
            <div className="relative z-10">
              {/* 헤더 - 실시간 Top 3 스타일 */}
              <div className="text-center mb-4 sm:mb-6">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <FaUsers className="text-purple-400 animate-bounce w-4 h-4 sm:w-7 sm:h-7" />
                  <h2 className="text-lg sm:text-2xl md:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-orange-400 to-pink-400">
                    친구 초대
                  </h2>
                  <FaUsers className="text-purple-400 animate-bounce w-4 h-4 sm:w-7 sm:h-7" />
                </div>
                <p className="text-purple-200 text-xs">친구를 초대하고 보상을 받으세요</p>
              </div>

              <div className="space-y-2">
                {/* 추천 코드 */}
                <button
                  onClick={copyReferralCode}
                  className="w-full bg-gradient-to-r from-white/10 to-white/5 rounded-xl p-3 border border-white/20 hover:from-white/15 hover:to-white/10 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-purple-400/20 rounded-full flex items-center justify-center">
                        <FaGift className="text-purple-400" size={14} />
                      </div>
                      <span className="text-white font-bold text-sm">내 추천 코드</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-purple-200 text-sm font-mono">
                        {userProfile?.referral_code || '-'}
                      </span>
                      {copied ? (
                        <FaCheck className="text-green-400 animate-bounce" size={12} />
                      ) : (
                        <FaCopy className="text-purple-400" size={12} />
                      )}
                    </div>
                  </div>
                </button>

                {/* 친구 초대 */}
                <button
                  onClick={async () => {
                    if (!userProfile?.referral_code) return;
                    
                    try {
                      // 카카오 SDK 초기화
                      if (typeof window !== 'undefined' && window.Kakao) {
                        if (!window.Kakao.isInitialized()) {
                          window.Kakao.init(process.env.NEXT_PUBLIC_KAKAO_JS_KEY);
                        }
                        
                        // 카카오톡 공유
                        window.Kakao.Share.sendDefault({
                          objectType: 'feed',
                          content: {
                            title: '배달킹 함께 도전하세요! 👑',
                            description: '가입하면 300P 즉시 지급! 함께 랭킹 경쟁해요!',
                            imageUrl: 'https://www.baedalrank.com/baedalking-logo.png',
                            link: {
                              mobileWebUrl: `https://www.baedalrank.com?invite=${userProfile.referral_code}`,
                              webUrl: `https://www.baedalrank.com?invite=${userProfile.referral_code}`,
                            },
                          },
                          buttons: [
                            {
                              title: '지금 가입하고 300P 받기',
                              link: {
                                mobileWebUrl: `https://www.baedalrank.com?invite=${userProfile.referral_code}`,
                                webUrl: `https://www.baedalrank.com?invite=${userProfile.referral_code}`,
                              },
                            },
                          ],
                        });
                      } else {
                        // 카카오 SDK가 없으면 클립보드에 복사
                        await navigator.clipboard.writeText(`https://www.baedalrank.com?invite=${userProfile.referral_code}`);
                        toast.success('초대 링크가 복사되었습니다.');
                      }
                    } catch (error) {
                      console.error('공유 실패:', error);
                      // 실패 시 클립보드에 복사
                      await navigator.clipboard.writeText(`https://www.baedalrank.com?invite=${userProfile.referral_code}`);
                      toast.success('초대 링크가 복사되었습니다.');
                    }
                  }}
                  className="w-full bg-gradient-to-r from-white/10 to-white/5 rounded-xl p-3 border border-white/20 hover:from-white/15 hover:to-white/10 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-purple-400/20 rounded-full flex items-center justify-center">
                        <FaShare className="text-purple-400" size={14} />
                      </div>
                      <span className="text-white font-bold text-sm">초대 링크 공유하기</span>
                    </div>
                    <span className="text-purple-200 text-sm">›</span>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* 앱 정보 및 고객지원 섹션 */}
        <section className="mb-4">
          <div className="bg-gradient-to-br from-purple-900/30 to-pink-900/30 backdrop-blur-lg rounded-3xl p-4 sm:p-6 shadow-2xl border border-purple-500/30 relative overflow-hidden">
            {/* 배경 애니메이션 효과 */}
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 via-pink-600/10 to-purple-600/10 animate-pulse"></div>
            
            <div className="relative z-10">
              {/* 헤더 - 실시간 Top 3 스타일 */}
              <div className="text-center mb-4 sm:mb-6">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <FaQuestionCircle className="text-purple-400 animate-bounce w-4 h-4 sm:w-7 sm:h-7" />
                  <h2 className="text-lg sm:text-2xl md:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-orange-400 to-pink-400">
                    앱 정보 및 고객지원
                  </h2>
                  <FaQuestionCircle className="text-purple-400 animate-bounce w-4 h-4 sm:w-7 sm:h-7" />
                </div>
                <p className="text-purple-200 text-xs">앱 정보와 도움말을 확인하세요</p>
              </div>

              <div className="space-y-2">
                {/* 공지사항 */}
                <button
                  onClick={() => setModalType('notice')}
                  className="w-full"
                >
                  <div className="bg-gradient-to-r from-white/10 to-white/5 rounded-xl p-3 border border-white/20 hover:from-white/15 hover:to-white/10 transition-all">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-blue-400/20 rounded-full flex items-center justify-center">
                          <FaBell className="text-blue-400" size={14} />
                        </div>
                        <span className="text-white font-bold text-sm">공지사항</span>
                      </div>
                      <span className="text-purple-200 text-sm">›</span>
                    </div>
                  </div>
                </button>

                {/* FAQ */}
                <button
                  onClick={() => setModalType('faq')}
                  className="w-full"
                >
                  <div className="bg-gradient-to-r from-white/10 to-white/5 rounded-xl p-3 border border-white/20 hover:from-white/15 hover:to-white/10 transition-all">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-purple-400/20 rounded-full flex items-center justify-center">
                          <FaQuestionCircle className="text-purple-400" size={14} />
                        </div>
                        <span className="text-white font-bold text-sm">자주 묻는 질문</span>
                      </div>
                      <span className="text-purple-200 text-sm">›</span>
                    </div>
                  </div>
                </button>

                {/* 1:1 문의 */}
                <Link
                  href="http://pf.kakao.com/_xhxoxmrn/chat"
                  target="_blank"
                  className="block"
                >
                  <div className="bg-gradient-to-r from-white/10 to-white/5 rounded-xl p-3 border border-white/20 hover:from-white/15 hover:to-white/10 transition-all">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-green-400/20 rounded-full flex items-center justify-center">
                          <FaComment className="text-green-400" size={14} />
                        </div>
                        <span className="text-white font-bold text-sm">1:1 카카오톡 문의</span>
                      </div>
                      <span className="text-purple-200 text-sm">›</span>
                    </div>
                  </div>
                </Link>

                {/* 이용약관 */}
                <button
                  onClick={() => setModalType('terms')}
                  className="w-full"
                >
                  <div className="bg-gradient-to-r from-white/10 to-white/5 rounded-xl p-3 border border-white/20 hover:from-white/15 hover:to-white/10 transition-all">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-yellow-400/20 rounded-full flex items-center justify-center">
                          <FaFileAlt className="text-yellow-400" size={14} />
                        </div>
                        <span className="text-white font-bold text-sm">이용약관</span>
                      </div>
                      <span className="text-purple-200 text-sm">›</span>
                    </div>
                  </div>
                </button>

                {/* 개인정보처리방침 */}
                <button
                  onClick={() => setModalType('privacy')}
                  className="w-full"
                >
                  <div className="bg-gradient-to-r from-white/10 to-white/5 rounded-xl p-3 border border-white/20 hover:from-white/15 hover:to-white/10 transition-all">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-red-400/20 rounded-full flex items-center justify-center">
                          <FaShieldAlt className="text-red-400" size={14} />
                        </div>
                        <span className="text-white font-bold text-sm">개인정보처리방침</span>
                      </div>
                      <span className="text-purple-200 text-sm">›</span>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* 로그아웃 버튼 */}
        <section className="mb-4">
          <button
            onClick={handleLogout}
            className="w-full bg-gradient-to-r from-purple-400 to-pink-500 hover:from-purple-500 hover:to-pink-600 rounded-xl p-3 hover:scale-105 transition-all"
          >
            <div className="flex items-center justify-center gap-2">
              <FaSignOutAlt className="text-white" size={14} />
              <span className="text-white font-bold text-sm">로그아웃</span>
            </div>
          </button>
        </section>
      </div>

      {/* 모달 */}
      {modalType && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-purple-900/95 to-pink-900/95 backdrop-blur-lg rounded-3xl p-6 w-full max-w-lg mx-4 max-h-[80vh] overflow-y-auto shadow-2xl border border-purple-500/30">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-orange-400 to-pink-400">
                {modalType === 'notice' && '공지사항'}
                {modalType === 'faq' && '자주 묻는 질문'}
                {modalType === 'terms' && '이용약관'}
                {modalType === 'privacy' && '개인정보 처리방침'}
              </h2>
              <button
                onClick={() => setModalType(null)}
                className="w-8 h-8 bg-gradient-to-r from-white/10 to-white/5 rounded-full flex items-center justify-center hover:from-white/15 hover:to-white/10 transition-all"
              >
                <FaClose size={16} className="text-white" />
              </button>
            </div>
            <div className="text-white">
              <ModalContent />
            </div>
          </div>
        </div>
      )}
    </div>
    </NoSSR>
  );
} 
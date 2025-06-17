'use client';

import { useState, useEffect, useRef } from 'react';
import { FaUser, FaMapMarkerAlt, FaMotorcycle, FaBicycle, FaCar, FaWalking, FaEdit, FaSignOutAlt, FaChevronLeft, FaCheck, FaTimes, FaCrown, FaBell, FaLock, FaQuestionCircle, FaCog, FaShieldAlt, FaCamera, FaCoins, FaList, FaGift, FaShare, FaComment, FaFileAlt, FaUsers, FaTimes as FaClose, FaCopy } from 'react-icons/fa';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import KakaoAd from '@/components/KakaoAd';
import Loading from '@/components/Loading';

export default function SettingsPage() {
  const { user, userProfile, signOut, updateProfile } = useAuth();
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
  const nicknameCheckTimeout = useRef<NodeJS.Timeout>();
  const [modalType, setModalType] = useState<'notice' | 'faq' | 'terms' | 'privacy' | null>(null);

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

    setUploadingImage(true);
    try {
      // 파일 이름 생성 (userId_timestamp)
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}_${Date.now()}.${fileExt}`;
      const filePath = `profile-images/${fileName}`;

      // Supabase Storage에 업로드
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // 공개 URL 가져오기
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      setProfileImage(publicUrl);
      
      // 바로 프로필 업데이트
      await updateProfile({ profileImage: publicUrl });
      
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
      return true;
    }

    setIsCheckingNickname(true);
    setNicknameError('');

    try {
      const { data, error } = await supabase
        .from('users')
        .select('nickname')
        .eq('nickname', newNickname)
        .neq('id', user?.id)
        .single();

      if (error) throw error;

      if (data) {
        setNicknameError('이미 사용 중인 닉네임입니다.');
        return false;
      }

      return true;
    } catch (error) {
      console.error('닉네임 중복 검사 오류:', error);
      setNicknameError('닉네임 중복 검사 중 오류가 발생했습니다.');
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
            <h3 className="text-xl font-bold mb-4">공지사항</h3>
            <div className="space-y-6">
              <div className="border-b border-white/10 pb-4">
                <p className="text-sm text-gray-400">2024.03.20</p>
                <h4 className="font-bold mb-2">배달킹 서비스 오픈 안내</h4>
                <p className="text-sm text-gray-300">배달킹 서비스가 정식 오픈되었습니다. 많은 이용 부탁드립니다.</p>
              </div>
              <div className="border-b border-white/10 pb-4">
                <p className="text-sm text-gray-400">2024.03.15</p>
                <h4 className="font-bold mb-2">시스템 점검 안내</h4>
                <p className="text-sm text-gray-300">3월 16일 02:00 ~ 04:00 동안 시스템 점검이 진행됩니다.</p>
              </div>
            </div>
          </div>
        );
      case 'faq':
        return (
          <div className="space-y-4">
            <h3 className="text-xl font-bold mb-4">자주 묻는 질문</h3>
            <div className="space-y-6">
              <div className="border-b border-white/10 pb-4">
                <h4 className="font-bold mb-2">Q. 포인트는 어떻게 적립되나요?</h4>
                <p className="text-sm text-gray-300">배달 완료 시 자동으로 포인트가 적립됩니다.</p>
              </div>
              <div className="border-b border-white/10 pb-4">
                <h4 className="font-bold mb-2">Q. 포인트는 어떻게 사용하나요?</h4>
                <p className="text-sm text-gray-300">적립된 포인트는 리워드 상품 교환에 사용할 수 있습니다.</p>
              </div>
            </div>
          </div>
        );
      case 'terms':
        return (
          <div className="space-y-4">
            <h3 className="text-xl font-bold mb-4">이용약관</h3>
            <div className="space-y-4 text-sm text-gray-300">
              <p>제1조 (목적)</p>
              <p>이 약관은 배달킹(이하 "회사")이 제공하는 서비스의 이용과 관련하여 회사와 회원 간의 권리, 의무 및 책임사항을 규정함을 목적으로 합니다.</p>
              <p>제2조 (정의)</p>
              <p>이 약관에서 사용하는 용어의 정의는 다음과 같습니다.</p>
              <p>1. "서비스"란 회사가 제공하는 배달킹 애플리케이션 및 관련 서비스를 말합니다.</p>
              <p>2. "회원"이란 회사와 서비스 이용계약을 체결한 자를 말합니다.</p>
            </div>
          </div>
        );
      case 'privacy':
        return (
          <div className="space-y-4">
            <h3 className="text-xl font-bold mb-4">개인정보 처리방침</h3>
            <div className="space-y-4 text-sm text-gray-300">
              <p>1. 수집하는 개인정보 항목</p>
              <p>- 필수항목: 이메일, 닉네임, 프로필 이미지</p>
              <p>- 선택항목: 지역, 선호 배달 수단</p>
              <p>2. 개인정보의 수집 및 이용목적</p>
              <p>- 서비스 제공 및 회원 관리</p>
              <p>- 포인트 적립 및 사용 내역 관리</p>
              <p>3. 개인정보의 보유 및 이용기간</p>
              <p>- 회원 탈퇴 시까지</p>
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
    } catch (error) {
      console.error('추천 코드 복사 실패:', error);
      toast.error('추천 코드 복사에 실패했습니다.');
    }
  };

  if (!user) {
    router.push('/login');
    return null;
  }

  if (loading || !userProfile) {
    return <Loading />;
  }

  return (
    <div className="relative z-10">
      <div className="max-w-3xl mx-auto px-4">
        {/* 상단 광고 */}
        <section className="mt-2 mb-4">
          <KakaoAd page="home" index={2} />
        </section>

        {/* 내 정보 섹션 */}
        <section className="mb-4">
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-4 shadow-xl border border-white/20">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-2xl font-bold text-white">내 정보</h2>
                <p className="text-blue-200 text-sm">프로필 정보를 관리하세요</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg">
                <FaUser className="text-white" size={20} />
              </div>
            </div>

            {/* 프로필 이미지 */}
            <div className="flex justify-center mb-4">
              <div className="relative">
                <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center overflow-hidden">
                  {profileImage ? (
                    <img 
                      src={profileImage} 
                      alt="프로필" 
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
                <div className="space-y-2">
                  <input
                    type="text"
                    value={nickname}
                    onChange={handleNicknameChange}
                    className="bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-white text-center text-lg font-bold w-full"
                    placeholder="닉네임"
                  />
                  {nicknameError && (
                    <p className="text-red-400 text-sm">{nicknameError}</p>
                  )}
                  {isCheckingNickname && (
                    <p className="text-blue-400 text-sm">닉네임 확인 중...</p>
                  )}
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
              <div className="bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-xl p-3 border border-blue-400/30">
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
                    <span className="text-blue-200 text-sm">{region}</span>
                  )}
                </div>
              </div>

              {/* 운송수단 */}
              <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-xl p-3 border border-green-400/30">
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
                    <span className="text-green-200 text-sm">{getVehicleText(vehicle)}</span>
                  )}
                </div>
              </div>
            </div>

            {/* 버튼 영역 */}
            {isEditMode ? (
              <div className="flex gap-2 mt-4">
                <button
                  onClick={handleCancel}
                  className="flex-1 bg-white/20 backdrop-blur-lg text-white border border-white/30 hover:bg-white/30 py-2 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2"
                  disabled={loading || uploadingImage}
                >
                  <FaTimes size={14} />
                  취소
                </button>
                <button
                  onClick={handleSave}
                  className="flex-1 bg-gradient-to-r from-yellow-400 to-orange-500 text-white py-2 rounded-xl font-bold text-sm hover:scale-105 transition-all flex items-center justify-center gap-2"
                  disabled={loading || uploadingImage}
                >
                  <FaCheck size={14} />
                  {loading ? '저장 중...' : '저장'}
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsEditMode(true)}
                className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-2 rounded-xl font-bold text-sm hover:scale-105 transition-all mt-4 flex items-center justify-center gap-2"
              >
                <FaEdit size={14} />
                프로필 수정
              </button>
            )}
          </div>
        </section>

        {/* 포인트 섹션 */}
        <section className="mb-4">
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-4 shadow-xl border border-white/20">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-2xl font-bold text-white">포인트</h2>
                <p className="text-blue-200 text-sm">포인트를 관리하세요</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg">
                <FaCoins className="text-white" size={20} />
              </div>
            </div>

            <div className="space-y-2">
              {/* 현재 포인트 */}
              <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-xl p-3 border border-yellow-400/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-yellow-400/20 rounded-full flex items-center justify-center">
                      <FaCoins className="text-yellow-400" size={14} />
                    </div>
                    <span className="text-white font-bold text-sm">현재 포인트</span>
                  </div>
                  <span className="text-yellow-200 text-sm">1,000P</span>
                </div>
              </div>

              {/* 포인트 내역 */}
              <Link href="/settings/points" className="block">
                <div className="bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-xl p-3 border border-blue-400/30">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-blue-400/20 rounded-full flex items-center justify-center">
                        <FaList className="text-blue-400" size={14} />
                      </div>
                      <span className="text-white font-bold text-sm">포인트 내역</span>
                    </div>
                    <span className="text-blue-200 text-sm">›</span>
                  </div>
                </div>
              </Link>
            </div>
          </div>
        </section>

        {/* 친구 초대 섹션 */}
        <section className="mb-4">
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-4 shadow-xl border border-white/20">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-2xl font-bold text-white">친구 초대</h2>
                <p className="text-blue-200 text-sm">친구를 초대하고 보상을 받으세요</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg">
                <FaUsers className="text-white" size={20} />
              </div>
            </div>

            <div className="space-y-2">
              {/* 추천 코드 */}
              <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-xl p-3 border border-purple-400/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-purple-400/20 rounded-full flex items-center justify-center">
                      <FaGift className="text-purple-400" size={14} />
                    </div>
                    <span className="text-white font-bold text-sm">내 추천 코드</span>
                  </div>
                  <button
                    onClick={copyReferralCode}
                    className="text-purple-200 text-sm hover:text-purple-100 transition-colors"
                  >
                    {userProfile?.referral_code || '-'}
                  </button>
                </div>
              </div>

              {/* 친구 초대 */}
              <button
                onClick={() => {
                  if (userProfile?.referral_code) {
                    navigator.clipboard.writeText(`https://baedalking.com/invite/${userProfile.referral_code}`);
                    toast.success('초대 링크가 복사되었습니다.');
                  }
                }}
                className="w-full bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-xl p-3 border border-purple-400/30"
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
        </section>

        {/* 앱 정보 및 고객지원 섹션 */}
        <section className="mb-4">
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-4 shadow-xl border border-white/20">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-2xl font-bold text-white">앱 정보 및 고객지원</h2>
                <p className="text-blue-200 text-sm">앱 정보와 도움말을 확인하세요</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-emerald-500 rounded-2xl flex items-center justify-center shadow-lg">
                <FaQuestionCircle className="text-white" size={20} />
              </div>
            </div>

            <div className="space-y-2">
              {/* 공지사항 */}
              <button
                onClick={() => setModalType('notice')}
                className="w-full"
              >
                <div className="bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-xl p-3 border border-blue-400/30">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-blue-400/20 rounded-full flex items-center justify-center">
                        <FaBell className="text-blue-400" size={14} />
                      </div>
                      <span className="text-white font-bold text-sm">공지사항</span>
                    </div>
                    <span className="text-blue-200 text-sm">›</span>
                  </div>
                </div>
              </button>

              {/* FAQ */}
              <button
                onClick={() => setModalType('faq')}
                className="w-full"
              >
                <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-xl p-3 border border-purple-400/30">
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
                <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-xl p-3 border border-green-400/30">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-green-400/20 rounded-full flex items-center justify-center">
                        <FaComment className="text-green-400" size={14} />
                      </div>
                      <span className="text-white font-bold text-sm">1:1 카카오톡 문의</span>
                    </div>
                    <span className="text-green-200 text-sm">›</span>
                  </div>
                </div>
              </Link>

              {/* 이용약관 */}
              <button
                onClick={() => setModalType('terms')}
                className="w-full"
              >
                <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-xl p-3 border border-yellow-400/30">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-yellow-400/20 rounded-full flex items-center justify-center">
                        <FaFileAlt className="text-yellow-400" size={14} />
                      </div>
                      <span className="text-white font-bold text-sm">이용약관</span>
                    </div>
                    <span className="text-yellow-200 text-sm">›</span>
                  </div>
                </div>
              </button>

              {/* 개인정보처리방침 */}
              <button
                onClick={() => setModalType('privacy')}
                className="w-full"
              >
                <div className="bg-gradient-to-r from-red-500/20 to-pink-500/20 rounded-xl p-3 border border-red-400/30">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-red-400/20 rounded-full flex items-center justify-center">
                        <FaShieldAlt className="text-red-400" size={14} />
                      </div>
                      <span className="text-white font-bold text-sm">개인정보처리방침</span>
                    </div>
                    <span className="text-red-200 text-sm">›</span>
                  </div>
                </div>
              </button>
            </div>
          </div>
        </section>

        {/* 로그아웃 버튼 */}
        <section className="mb-4">
          <button
            onClick={handleLogout}
            className="w-full bg-gradient-to-r from-red-500/20 to-pink-500/20 rounded-xl p-3 border border-red-400/30 hover:scale-105 transition-all"
          >
            <div className="flex items-center justify-center gap-2">
              <FaSignOutAlt className="text-red-400" size={14} />
              <span className="text-white font-bold text-sm">로그아웃</span>
            </div>
          </button>
        </section>

        {/* 하단 광고 */}
        <section className="mb-2">
          <KakaoAd page="home" index={2} />
        </section>
      </div>

      {/* 모달 */}
      {modalType && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-blue-900/95 via-purple-900/95 to-indigo-900/95 backdrop-blur-lg rounded-2xl p-6 w-full max-w-lg mx-4 max-h-[80vh] overflow-y-auto shadow-2xl border border-white/20">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-white">
                {modalType === 'notice' && '공지사항'}
                {modalType === 'faq' && '자주 묻는 질문'}
                {modalType === 'terms' && '이용약관'}
                {modalType === 'privacy' && '개인정보 처리방침'}
              </h2>
              <button
                onClick={() => setModalType(null)}
                className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors"
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
  );
} 
"use client";

import { useState, useEffect } from 'react';
import { FaUpload, FaCamera, FaCheckCircle, FaExclamationTriangle, FaImage, FaArrowRight, FaCoins, FaTimes, FaClipboardList } from 'react-icons/fa';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/contexts/NotificationContext';
import { useRouter } from 'next/navigation';
import { uploadDeliveryRecord, validateImageFile, compressImage, getKoreanToday, isTodayDate } from '@/services/uploadService';
import { analyzeDeliveryImage } from '@/services/imageAnalysisService';
import Loading from '@/components/Loading';
import KakaoAd from '@/components/KakaoAd';

export default function UploadPage() {
  const { user, userProfile, loading } = useAuth();
  const { addNotification } = useNotifications();
  const router = useRouter();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [amount, setAmount] = useState<number>(0);
  const [deliveryCount, setDeliveryCount] = useState<number>(0);
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [error, setError] = useState<string>('');
  const [detectedPlatform, setDetectedPlatform] = useState<'배민커넥트' | '쿠팡이츠'>('배민커넥트');
  const [showExampleModal, setShowExampleModal] = useState(false);
  const [selectedExampleApp, setSelectedExampleApp] = useState<'배민커넥트' | '쿠팡이츠' | null>(null);
  const [earnedPoints, setEarnedPoints] = useState<number>(0);
  const [isDuplicateUpload, setIsDuplicateUpload] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [detectedDate, setDetectedDate] = useState<string>('');

  // 플랫폼 값 변환 함수
  const getPlatformValue = (platform: 'baemin' | 'coupang'): '배민커넥트' | '쿠팡이츠' => {
    const platformMap = {
      'baemin': '배민커넥트',
      'coupang': '쿠팡이츠'
    } as const;
    return platformMap[platform];
  };

  // 인증 상태 확인 및 리다이렉트를 useEffect로 처리
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return <Loading />;
  }

  if (!user) {
    return null;
  }

  if (!userProfile) {
    return null;
  }

  const handleFileSelect = async (file: File) => {
    try {
      setError('');
      setSelectedFile(file);
      setAmount(0);
      setDeliveryCount(0);
      setUploadSuccess(false);
      setAnalysisComplete(false);
      setAnalysisResult(null);

      // 파일 유효성 검사
      const validation = validateImageFile(file);
      if (!validation.valid) {
        setError(validation.error || '유효하지 않은 파일입니다.');
        setSelectedFile(null);
        return;
      }

      // 이미지 분석 시작
      setAnalyzing(true);
      try {
        // AI 이미지 분석
        const result = await analyzeDeliveryImage(file, detectedPlatform === '배민커넥트' ? 'baemin' : 'coupang');
        
        // 분석 결과 유효성 검사
        if (result.confidence < 0.7) {
          const platformGuide = detectedPlatform === '배민커넥트' 
            ? '배민커넥트 앱 > 마이페이지 > 오늘 배달 내역' 
            : '쿠팡이츠 앱 > 내 수입 > 오늘 날짜 선택';
          setError(`올바른 화면이 아닙니다. ${platformGuide} 화면을 캡처해주세요.`);
          setAnalyzing(false);
          return;
        }

        if (result.amount <= 0 || result.deliveryCount <= 0) {
          const platformGuide = detectedPlatform === '배민커넥트' 
            ? '배민커넥트의 "오늘 배달 내역" 화면' 
            : '쿠팡이츠의 "내 수입" 화면';
          setError(`배달 정보를 찾을 수 없습니다. ${platformGuide}을 정확히 캡처했는지 확인해주세요.`);
          setAnalyzing(false);
          return;
        }

        // 평균 배달료 검증
        const avgAmount = result.amount / result.deliveryCount;
        if (avgAmount < 2000 || avgAmount > 15000) {
          setError('배달당 평균 금액이 비정상적입니다. 이미지를 다시 확인해주세요.');
          setAnalyzing(false);
          return;
        }

        // 플랫폼 자동 감지
        if (result.platform === 'baemin') {
          setDetectedPlatform('배민커넥트');
        } else if (result.platform === 'coupang') {
          setDetectedPlatform('쿠팡이츠');
        }

        // 분석 결과 저장
        setAnalysisResult(result);
        setAmount(result.amount);
        setDeliveryCount(result.deliveryCount);
        setDetectedDate(result.date || getKoreanToday());
        setAnalysisComplete(true);
      } catch (error) {
        console.error('이미지 분석 오류:', error);
        setError('이미지 분석 중 오류가 발생했습니다. 다시 시도해주세요.');
      } finally {
        setAnalyzing(false);
      }
    } catch (error) {
      setError('이미지 처리 중 오류가 발생했습니다.');
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !user || !userProfile || !analysisResult) {
      setError('필수 정보가 누락되었습니다.');
      return;
    }

    setUploading(true);
    setError('');

    try {
      // 이미지에서 추출한 날짜가 오늘인지 확인
      if (analysisResult.date && !isTodayDate(analysisResult.date)) {
        setError(`이 이미지는 ${analysisResult.date} 실적입니다. 오늘(${getKoreanToday()}) 실적만 업로드 가능합니다. 지난 날짜의 실적은 수기 입력 메뉴를 이용해주세요.`);
        setUploading(false);
        return;
      }
      
      const result = await uploadDeliveryRecord(selectedFile, {
        userId: user.id,
        userNickname: userProfile.nickname || '',
        userRegion: userProfile.region || '',
        platform: detectedPlatform,
        amount: analysisResult.amount,
        deliveryCount: analysisResult.deliveryCount,
        date: analysisResult.date || getKoreanToday()
      });

      if (result.success) {
        setAmount(analysisResult.amount);
        setDeliveryCount(analysisResult.deliveryCount);
        setDetectedPlatform(detectedPlatform);
        setUploadSuccess(true);
        setEarnedPoints(result.points || 0);
        setIsDuplicateUpload(result.points === 0);
        
        // 중복 업로드인 경우 안내
        if (result.points === 0) {
          setError('이미 오늘 업로드한 기록이 있어 데이터만 업데이트했습니다. 포인트는 하루에 한 번만 지급됩니다.');
          
          // 중복 업로드 알림
          addNotification({
            title: '실적 업데이트 완료',
            message: `오늘 ${detectedPlatform} 실적이 업데이트되었습니다. (${analysisResult.deliveryCount}건, ${analysisResult.amount.toLocaleString()}원)`,
            type: 'info'
          });
        } else {
          // 첫 업로드 성공 알림
          addNotification({
            title: '실적 업로드 성공!',
            message: `${result.points}P를 획득했습니다! 오늘도 수고하셨어요 💪`,
            type: 'success',
            link: '/records'
          });
        }
      } else {
        setError(result.error || '업로드에 실패했습니다.');
      }
    } catch (error) {
      console.error('업로드 오류:', error);
      setError('업로드 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setUploading(false);
    }
  };

  const resetUpload = () => {
    setSelectedFile(null);
    setAmount(0);
    setDeliveryCount(0);
    setUploadSuccess(false);
    setError('');
    setEarnedPoints(0);
    setIsDuplicateUpload(false);
    setAnalysisComplete(false);
    setAnalysisResult(null);
    setDetectedDate('');
  };

  const openExampleModal = (app: '배민커넥트' | '쿠팡이츠') => {
    setSelectedExampleApp(app);
    setShowExampleModal(true);
  };

  const closeExampleModal = () => {
    setShowExampleModal(false);
    setSelectedExampleApp(null);
  };

  return (
    <div className="relative z-10">
      <div className="max-w-3xl mx-auto px-4">
        {/* 에러 메시지 */}
        {error && (
          <div className="mb-4 bg-red-500/20 border border-red-500/50 rounded-xl p-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-red-500/20 rounded-full flex items-center justify-center">
                <FaExclamationTriangle size={16} className="text-red-400" />
              </div>
              <p className="text-red-200 text-sm">{error}</p>
            </div>
          </div>
        )}

        {!uploadSuccess ? (
          <>
            {/* 업로드 안내 */}
            <section className="mb-4 mt-2">
              <div className="bg-gradient-to-br from-purple-900/30 to-pink-900/30 backdrop-blur-lg rounded-3xl p-4 sm:p-6 shadow-2xl border border-purple-500/30 relative overflow-hidden">
                {/* 배경 애니메이션 효과 */}
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 via-pink-600/10 to-purple-600/10 animate-pulse"></div>
                
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-xl sm:text-2xl font-bold text-white">실적 업로드</h2>
                      <p className="text-purple-200 text-xs sm:text-sm">
                        사진만 올리면 AI가 자동으로 분석해요! 🤖
                      </p>
                    </div>
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg animate-bounce">
                      <FaUpload className="text-white w-4 h-4 sm:w-5 sm:h-5" />
                    </div>
                  </div>

                  {/* 오늘 날짜 안내 */}
                  <div className="mb-4 bg-purple-500/20 border border-purple-500/50 rounded-xl p-3">
                    <div className="flex items-center gap-2">
                      <div className="text-purple-200">
                        <p className="font-medium text-sm">오늘 날짜: {getKoreanToday()}</p>
                        <p className="text-xs mt-1">매일 오전 6시에 날짜가 갱신됩니다</p>
                      </div>
                    </div>
                  </div>

                  {/* 파일 선택 영역 */}
                  <div className="space-y-3">
                    <div
                      className="border-2 border-dashed border-purple-400/30 rounded-xl p-4 text-center cursor-pointer hover:border-purple-400/50 transition-colors bg-white/5 hover:bg-white/10"
                      onClick={() => document.getElementById('fileInput')?.click()}
                    >
                      <input
                        type="file"
                        id="fileInput"
                        className="hidden"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileSelect(file);
                        }}
                      />
                      {selectedFile ? (
                        <div className="space-y-2">
                          <div className="w-12 h-12 mx-auto bg-gradient-to-br from-purple-400 to-pink-500 rounded-lg flex items-center justify-center">
                            <FaImage className="text-white" size={20} />
                          </div>
                          <p className="text-white font-medium text-sm">{selectedFile.name}</p>
                          <p className="text-purple-200 text-xs">
                            {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                          {analyzing && (
                            <div className="mt-2">
                              <div className="flex items-center justify-center gap-2">
                                <div className="w-4 h-4 border-2 border-purple-300/20 border-t-purple-300 rounded-full animate-spin"></div>
                                <p className="text-amber-200 text-xs">AI가 분석하고 있어요...</p>
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <div className="w-12 h-12 mx-auto bg-gradient-to-br from-purple-400 to-pink-500 rounded-lg flex items-center justify-center">
                            <FaCamera className="text-white" size={20} />
                          </div>
                          <p className="text-white font-medium text-sm">사진 선택하기</p>
                          <p className="text-purple-200 text-xs">
                            JPG, PNG, HEIC 형식 지원
                          </p>
                        </div>
                      )}
                    </div>

                    {/* 분석 결과 표시 */}
                    {analysisComplete && analysisResult && (
                      <div className="bg-white/10 rounded-xl p-3 space-y-2">
                        <h4 className="text-white font-medium text-sm mb-2">분석 결과</h4>
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <p className="text-purple-200 text-xs">플랫폼</p>
                            <p className="text-white font-medium text-sm">{detectedPlatform}</p>
                          </div>
                          <div className="flex items-center justify-between">
                            <p className="text-purple-200 text-xs">날짜</p>
                            <p className="text-white font-medium text-sm">{detectedDate}</p>
                          </div>
                          <div className="flex items-center justify-between">
                            <p className="text-purple-200 text-xs">배달 건수</p>
                            <p className="text-white font-medium text-sm">{deliveryCount}건</p>
                          </div>
                          <div className="flex items-center justify-between">
                            <p className="text-purple-200 text-xs">총 금액</p>
                            <p className="text-white font-medium text-sm">{amount.toLocaleString()}원</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* 업로드 버튼 */}
                    <button
                      className={`w-full py-3 rounded-xl text-white font-bold text-sm transition-all ${
                        analysisComplete && !analyzing
                          ? 'bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600 hover:shadow-lg hover:shadow-xl hover:scale-[1.02]'
                          : 'bg-white/20 cursor-not-allowed'
                      }`}
                      onClick={handleUpload}
                      disabled={!analysisComplete || analyzing || uploading}
                    >
                      {uploading ? (
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                          <span>등록 중...</span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-2">
                          <FaUpload className="w-3 h-3 sm:w-4 sm:h-4" />
                          <span>등록하기</span>
                        </div>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </section>

            {/* 예시 이미지 */}
            <section className="mb-4">
              <div className="bg-gradient-to-br from-purple-900/30 to-pink-900/30 backdrop-blur-lg rounded-3xl p-4 sm:p-6 shadow-2xl border border-purple-500/30 relative overflow-hidden">
                {/* 배경 애니메이션 효과 */}
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 via-pink-600/10 to-purple-600/10 animate-pulse"></div>
                
                <div className="relative z-10">
                  <h3 className="text-base font-bold text-white mb-3">예시 이미지</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      className="aspect-[4/3] bg-white/10 rounded-xl overflow-hidden hover:bg-white/20 transition-all hover:scale-[1.02] flex flex-col items-center justify-center group"
                      onClick={() => openExampleModal('배민커넥트')}
                    >
                      <div className="flex flex-col items-center justify-center h-full w-full">
                        <img src="/baemin-logo.svg" alt="배민커넥트 로고" className="w-10 h-10 mb-2 group-hover:scale-110 transition-transform" />
                        <p className="text-white font-medium text-sm text-center">배민커넥트</p>
                      </div>
                    </button>
                    <button
                      className="aspect-[4/3] bg-white/10 rounded-xl overflow-hidden hover:bg-white/20 transition-all hover:scale-[1.02] flex flex-col items-center justify-center group"
                      onClick={() => openExampleModal('쿠팡이츠')}
                    >
                      <div className="flex flex-col items-center justify-center h-full w-full">
                        <img src="/coupang-logo.svg" alt="쿠팡이츠 로고" className="w-10 h-10 mb-2 group-hover:scale-110 transition-transform" />
                        <p className="text-white font-medium text-sm text-center">쿠팡이츠</p>
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            </section>
          </>
        ) : (
          <>
            {/* 업로드 성공 */}
            <section className="mb-4">
              <div className="bg-gradient-to-br from-purple-900/30 to-pink-900/30 backdrop-blur-lg rounded-3xl p-4 sm:p-6 shadow-2xl border border-purple-500/30 relative overflow-hidden">
                {/* 배경 애니메이션 효과 */}
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 via-pink-600/10 to-purple-600/10 animate-pulse"></div>
                
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-xl sm:text-2xl font-bold text-white">업로드 완료!</h2>
                      <p className="text-purple-200 text-xs sm:text-sm">
                        AI가 자동으로 분석했어요 ✨
                      </p>
                    </div>
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-2xl flex items-center justify-center shadow-lg">
                      <FaCheckCircle className="text-white w-4 h-4 sm:w-5 sm:h-5" />
                    </div>
                  </div>

                  {/* 분석 결과 */}
                  <div className="space-y-3">
                    <div className="bg-white/10 rounded-xl p-3">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-purple-200 text-sm">플랫폼</p>
                        <p className="text-white font-medium text-sm">{detectedPlatform}</p>
                      </div>
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-purple-200 text-sm">배달 건수</p>
                        <p className="text-white font-medium text-sm">{deliveryCount}건</p>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-purple-200 text-sm">총 금액</p>
                        <p className="text-white font-medium text-sm">
                          {amount.toLocaleString()}원
                        </p>
                      </div>
                    </div>

                    {/* 포인트 획득 */}
                    {!isDuplicateUpload ? (
                      <div className="bg-gradient-to-r from-amber-400/20 to-orange-500/20 rounded-xl p-3 border border-amber-500/20">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center">
                            <FaCoins className="text-white" size={16} />
                          </div>
                          <div>
                            <p className="text-white font-medium text-sm">포인트 획득!</p>
                            <p className="text-amber-200 text-xs">
                              실적 업로드 보너스 +{earnedPoints}P
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-blue-500/20 border border-blue-500/50 rounded-xl p-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center">
                            <FaCheckCircle className="text-blue-400" size={16} />
                          </div>
                          <div>
                            <p className="text-white font-medium text-sm">데이터 업데이트 완료</p>
                            <p className="text-blue-200 text-xs">
                              이미 오늘 포인트를 받으셨습니다
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* 버튼 */}
                    <div className="flex gap-2">
                      <button
                        className="flex-1 py-3 px-4 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all text-sm font-bold"
                        onClick={resetUpload}
                      >
                        다시 업로드
                      </button>
                      <button
                        className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-purple-400 to-pink-500 hover:from-purple-500 hover:to-pink-600 text-white hover:shadow-lg hover:shadow-xl transition-all hover:scale-[1.02] text-sm font-bold"
                        onClick={() => router.push('/')}
                      >
                        홈으로
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </>
        )}

        {/* 하단 광고 */}
        <section className="mb-2">
          <KakaoAd page="upload" index={1} />
        </section>
      </div>

      {/* 예시 모달 */}
      {showExampleModal && selectedExampleApp && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gradient-to-br from-purple-900/90 to-pink-900/90 backdrop-blur-lg rounded-3xl p-6 shadow-2xl border border-purple-500/30 max-w-md w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white">
                {selectedExampleApp} 예시
              </h3>
              <button
                className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors"
                onClick={closeExampleModal}
              >
                <FaTimes className="text-white" size={16} />
              </button>
            </div>
            <div className="aspect-[9/16] bg-black rounded-lg mb-4 overflow-hidden">
              {selectedExampleApp === '배민커넥트' ? (
                <div className="h-full w-full bg-black">
                  <div className="bg-black px-4 py-3 flex items-center">
                    <span className="text-white text-base">오늘 배달 내역</span>
                  </div>
                  <div className="bg-black px-4 py-6">
                    <div className="bg-gray-800 rounded-2xl p-6 w-full max-w-xs mx-auto">
                      <div>
                        <div className="flex justify-between items-center mb-6">
                          <p className="text-gray-300 text-sm">운행일</p>
                          <p className="text-white text-lg">6월 14일</p>
                        </div>
                        <div className="flex justify-between items-center mb-6">
                          <p className="text-gray-300 text-sm">배달건</p>
                          <p className="text-white text-lg">0건</p>
                        </div>
                        <div className="flex justify-between items-center">
                          <p className="text-gray-300 text-sm">배달료 합계</p>
                          <p className="text-cyan-400 text-lg font-medium">0원</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-full w-full bg-gray-100">
                  <div className="bg-white px-4 py-3 flex items-center border-b w-full">
                    <span className="text-gray-800 text-base font-medium">05/29 목</span>
                  </div>
                  <div className="bg-gray-100 p-4">
                    <div className="bg-white rounded-lg p-4 mb-3 text-center w-full max-w-xs mx-auto">
                      <p className="text-gray-500 text-sm mb-2">총 배달 수수료</p>
                      <p className="text-gray-900 text-3xl font-bold mb-1">53,920원</p>
                      <p className="text-gray-600 text-sm">배달 17건</p>
                    </div>
                    <div className="space-y-2 w-full max-w-xs mx-auto">
                      <div className="bg-white rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="bg-gray-200 text-gray-700 text-xs px-2 py-1 rounded">거리</span>
                          <p className="text-gray-900 font-medium">상호명 가림처리</p>
                        </div>
                        <div className="flex justify-between items-center">
                          <p className="text-gray-500 text-xs">배달 완료 17:04 | 배달 거리 1.0km</p>
                        </div>
                        <div className="flex justify-between items-center mt-2">
                          <p className="text-gray-600 text-sm">합계</p>
                          <p className="text-gray-900 font-bold">2,990원</p>
                        </div>
                      </div>
                      <div className="bg-white rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="bg-gray-200 text-gray-700 text-xs px-2 py-1 rounded">거리</span>
                          <p className="text-gray-900 font-medium">상호명 가림처리</p>
                        </div>
                        <div className="flex justify-between items-center">
                          <p className="text-gray-500 text-xs">배달 완료 17:09 | 배달 거리 0.2km</p>
                        </div>
                        <div className="flex justify-between items-center mt-2">
                          <p className="text-gray-600 text-sm">합계</p>
                          <p className="text-gray-900 font-bold">2,700원</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="text-white/60 text-sm text-center mt-2">
              {selectedExampleApp === '배민커넥트' ? (
                <>
                  <p>마이페이지 - 오늘 배달 내역</p>
                  <p>화면을 참고해서 업로드 해주세요.</p>
                </>
              ) : (
                <>
                  <p>내 수입 - 오늘 날짜 [ ex) 06/06 금 ]</p>
                  <p>화면을 참고해서 업로드 해주세요.</p>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 
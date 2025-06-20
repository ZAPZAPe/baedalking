"use client";

import { useState, useEffect } from 'react';
import { FaUpload, FaCamera, FaCheckCircle, FaExclamationTriangle, FaImage, FaArrowRight, FaCoins, FaTimes, FaClipboardList } from 'react-icons/fa';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/contexts/NotificationContext';
import { useRouter } from 'next/navigation';
import { uploadDeliveryRecord, validateImageFile, compressImage, getKoreanToday, isTodayDate } from '@/services/uploadService';
import { analyzeDeliveryImage } from '@/services/imageAnalysisService';
import Loading from '@/components/Loading';
import KakaoAdGlobal from '@/components/KakaoAdGlobal';

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
        
        // 화면 유효성 검사
        if (!result.isValidScreen) {
          setError(result.errorMessage || '올바른 화면이 아닙니다.');
          setAnalyzing(false);
          setSelectedFile(null);
          return;
        }

        // 오늘 날짜가 아닌 경우
        if (result.date && result.date !== getKoreanToday()) {
          // 에러는 설정하지만 분석 결과는 계속 진행
          setError(`이 화면은 ${result.date} 실적입니다. 오늘(${getKoreanToday()}) 실적만 업로드 가능합니다.`);
          // setAnalyzing(false);
          // setSelectedFile(null);
          // return;
        }

        // 신뢰도가 낮은 경우
        if (result.confidence < 0.7) {
          const platformGuide = detectedPlatform === '배민커넥트' 
            ? '배민커넥트 앱 > 마이페이지 > 오늘 배달 내역' 
            : '쿠팡이츠 앱 > 내 수입 > 오늘 날짜 선택';
          setError(`이미지 인식률이 낮습니다. ${platformGuide} 화면을 선명하게 캡처해주세요.`);
          setAnalyzing(false);
          setSelectedFile(null);
          return;
        }

        // 배달 실적이 없는 경우
        if (result.amount === 0 && result.deliveryCount === 0) {
          // 0건 0원은 업로드 차단
          setError('배달 실적이 없습니다. 실적이 있는 날만 업로드 가능합니다.');
          // 분석 결과는 보여주기 위해 계속 진행
        }

        // 데이터 이상치 확인
        if (result.amount > 0 && result.deliveryCount > 0) {
          const avgAmount = result.amount / result.deliveryCount;
          if (avgAmount < 2000) {
            setError('배달당 평균 금액이 너무 낮습니다. 올바른 화면인지 확인해주세요.');
            // 분석 결과는 보여주기 위해 계속 진행
          }
          if (avgAmount > 15000) {
            setError('배달당 평균 금액이 너무 높습니다. 올바른 화면인지 확인해주세요.');
            // 분석 결과는 보여주기 위해 계속 진행
          }
        }

        // 플랫폼 자동 감지 제거 - 사용자가 선택한 플랫폼 유지
        // if (result.platform === 'baemin') {
        //   setDetectedPlatform('배민커넥트');
        // } else if (result.platform === 'coupang') {
        //   setDetectedPlatform('쿠팡이츠');
        // }

        // 분석 결과 저장
        setAnalysisResult(result);
        setAmount(result.amount);
        setDeliveryCount(result.deliveryCount);
        setDetectedDate(result.date || getKoreanToday());
        setAnalysisComplete(true);
      } catch (error) {
        console.error('이미지 분석 오류:', error);
        setError('이미지 분석 중 오류가 발생했습니다. 다시 시도해주세요.');
        setSelectedFile(null);
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
        {!uploadSuccess ? (
          <>
            {/* 업로드 안내 */}
            <section className="mb-4 mt-2">
              <div className="bg-gradient-to-br from-purple-900/30 to-pink-900/30 backdrop-blur-lg rounded-3xl p-4 sm:p-6 shadow-2xl border border-purple-500/30 relative overflow-hidden">
                {/* 배경 애니메이션 효과 */}
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 via-pink-600/10 to-purple-600/10 animate-pulse"></div>
                
                <div className="relative z-10">
                  {/* 헤더 - 실시간 Top 3 스타일 */}
                  <div className="text-center mb-4 sm:mb-6">
                    <div className="flex items-center justify-center gap-2 mb-1">
                      <FaUpload className="text-purple-400 animate-bounce w-4 h-4 sm:w-7 sm:h-7" />
                      <h2 className="text-lg sm:text-2xl md:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-orange-400 to-pink-400">
                        실적 업로드
                      </h2>
                      <FaUpload className="text-purple-400 animate-bounce w-4 h-4 sm:w-7 sm:h-7" />
                    </div>
                    <p className="text-purple-200 text-xs">사진만 올리면 AI가 자동으로 분석해요! 🤖</p>
                  </div>

                  {/* 오늘 날짜 안내 */}
                  <div className="mb-4 bg-gradient-to-r from-white/10 to-white/5 border border-white/20 rounded-xl p-3">
                    <div className="text-center">
                      <div className="text-purple-200">
                        <p className="font-medium text-sm">오늘 날짜: {getKoreanToday()}</p>
                        <p className="text-xs mt-1">매일 오전 6시에 날짜가 갱신됩니다</p>
                      </div>
                    </div>
                  </div>

                  {/* 플랫폼 선택 */}
                  <div className="mb-4">
                    <p className="text-white text-sm font-medium mb-2 text-center">플랫폼 선택</p>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => setDetectedPlatform('배민커넥트')}
                        className={`py-2 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center ${
                          detectedPlatform === '배민커넥트'
                            ? 'bg-gradient-to-r from-purple-400 to-pink-500 text-white shadow-lg'
                            : 'bg-white/10 text-purple-200 hover:bg-white/20'
                        } ${analysisComplete ? 'opacity-50 cursor-not-allowed' : ''}`}
                        disabled={analysisComplete}
                      >
                        배민커넥트
                      </button>
                      <button
                        onClick={() => setDetectedPlatform('쿠팡이츠')}
                        className={`py-2 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center ${
                          detectedPlatform === '쿠팡이츠'
                            ? 'bg-gradient-to-r from-purple-400 to-pink-500 text-white shadow-lg'
                            : 'bg-white/10 text-purple-200 hover:bg-white/20'
                        } ${analysisComplete ? 'opacity-50 cursor-not-allowed' : ''}`}
                        disabled={analysisComplete}
                      >
                        쿠팡이츠
                      </button>
                    </div>
                  </div>

                  {/* 파일 선택 영역 */}
                  <div className="space-y-3">
                    <div
                      className="border-2 border-dashed border-white/30 rounded-xl p-4 text-center cursor-pointer hover:border-white/50 transition-colors bg-gradient-to-r from-white/10 to-white/5 hover:from-white/15 hover:to-white/10"
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
                      <div className="bg-gradient-to-r from-white/10 to-white/5 rounded-xl p-3 space-y-2 border border-white/20">
                        <h4 className="text-white font-medium text-sm mb-2 text-center">분석 결과</h4>
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <p className="text-purple-200 text-xs">플랫폼</p>
                            <p className="text-white font-medium text-sm">{detectedPlatform}</p>
                          </div>
                          <div className="flex items-center justify-between">
                            <p className="text-purple-200 text-xs">날짜</p>
                            <div className="flex items-center gap-2">
                              <p className={`font-medium text-sm ${detectedDate !== getKoreanToday() ? 'text-red-400' : 'text-white'}`}>
                                {detectedDate}
                              </p>
                              {detectedDate !== getKoreanToday() && (
                                <span className="text-red-400 text-xs">(오늘 아님)</span>
                              )}
                            </div>
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

                    {/* 에러 메시지 */}
                    {error && (
                      <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-3">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 bg-red-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                            <FaExclamationTriangle size={12} className="text-red-400" />
                          </div>
                          <p className="text-red-200 text-xs">{error}</p>
                        </div>
                      </div>
                    )}

                    {/* 업로드 버튼 */}
                    <button
                      className={`w-full py-3 rounded-xl text-white font-bold text-sm transition-all ${
                        analysisComplete && !analyzing && !error
                          ? 'bg-gradient-to-r from-purple-400 to-pink-500 hover:from-purple-500 hover:to-pink-600 hover:shadow-lg hover:shadow-xl hover:scale-[1.02]'
                          : error
                          ? 'bg-gradient-to-r from-purple-400 to-pink-500 hover:from-purple-500 hover:to-pink-600 hover:shadow-lg hover:shadow-xl hover:scale-[1.02]'
                          : 'bg-white/20 cursor-not-allowed'
                      }`}
                      onClick={error ? resetUpload : handleUpload}
                      disabled={!analysisComplete || analyzing || uploading}
                    >
                      {uploading ? (
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                          <span>등록 중...</span>
                        </div>
                      ) : error ? (
                        <div className="flex items-center justify-center gap-2">
                          <FaUpload className="w-3 h-3 sm:w-4 sm:h-4" />
                          <span>다시 업로드하기</span>
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
                  {/* 헤더 - 실시간 Top 3 스타일 */}
                  <div className="text-center mb-3 sm:mb-4">
                    <div className="flex items-center justify-center gap-2 mb-1">
                      <FaClipboardList className="text-purple-400 animate-bounce w-4 h-4 sm:w-6 sm:h-6" />
                      <h3 className="text-base sm:text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-orange-400 to-pink-400">
                        예시 이미지
                      </h3>
                      <FaClipboardList className="text-purple-400 animate-bounce w-4 h-4 sm:w-6 sm:h-6" />
                    </div>
                    <p className="text-purple-200 text-xs">올바른 화면을 캡처해주세요! 📱</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <button
                      className="aspect-[4/3] bg-gradient-to-r from-white/10 to-white/5 rounded-xl overflow-hidden hover:from-white/15 hover:to-white/10 transition-all hover:scale-[1.02] flex flex-col items-center justify-center group border border-white/20"
                      onClick={() => openExampleModal('배민커넥트')}
                    >
                      <div className="flex flex-col items-center justify-center h-full w-full">
                        <img src="/baemin-logo.svg" alt="배민커넥트 로고" className="w-10 h-10 mb-2 group-hover:scale-110 transition-transform" />
                        <p className="text-white font-medium text-sm text-center">배민커넥트</p>
                      </div>
                    </button>
                    <button
                      className="aspect-[4/3] bg-gradient-to-r from-white/10 to-white/5 rounded-xl overflow-hidden hover:from-white/15 hover:to-white/10 transition-all hover:scale-[1.02] flex flex-col items-center justify-center group border border-white/20"
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
                  {/* 헤더 - 실시간 Top 3 스타일 */}
                  <div className="text-center mb-4 sm:mb-6">
                    <div className="flex items-center justify-center gap-2 mb-1">
                      <FaCheckCircle className="text-purple-400 animate-bounce w-4 h-4 sm:w-7 sm:h-7" />
                      <h2 className="text-lg sm:text-2xl md:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-orange-400 to-pink-400">
                        업로드 완료!
                      </h2>
                      <FaCheckCircle className="text-purple-400 animate-bounce w-4 h-4 sm:w-7 sm:h-7" />
                    </div>
                    <p className="text-purple-200 text-xs">AI가 자동으로 분석했어요 ✨</p>
                  </div>

                  {/* 분석 결과 */}
                  <div className="space-y-3">
                    <div className="bg-gradient-to-r from-white/10 to-white/5 rounded-xl p-3 border border-white/20">
                      <h4 className="text-white font-medium text-sm mb-2 text-center">분석 결과</h4>
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
                      <div className="bg-gradient-to-r from-white/10 to-white/5 rounded-xl p-3 border border-white/20">
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
                      <div className="bg-gradient-to-r from-white/10 to-white/5 border border-white/20 rounded-xl p-3">
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
                        className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-white/10 to-white/5 hover:from-white/15 hover:to-white/10 text-white transition-all text-xs sm:text-sm font-bold border border-white/20"
                        onClick={resetUpload}
                      >
                        다시 업로드
                      </button>
                      <button
                        className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-purple-400 to-pink-500 hover:from-purple-500 hover:to-pink-600 text-white hover:shadow-lg hover:shadow-xl transition-all hover:scale-[1.02] text-xs sm:text-sm font-bold"
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
          <KakaoAdGlobal page="upload" index={0} />
        </section>
      </div>

      {/* 예시 모달 */}
      {showExampleModal && selectedExampleApp && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-gradient-to-br from-purple-900/30 to-pink-900/30 backdrop-blur-lg rounded-3xl p-3 sm:p-6 w-full max-w-lg mx-4 max-h-[80vh] overflow-y-auto shadow-2xl border border-purple-500/30 relative overflow-hidden">
            {/* 배경 애니메이션 효과 */}
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 via-pink-600/10 to-purple-600/10 animate-pulse"></div>
            
            <div className="relative z-10">
              {/* 헤더 - 실시간 Top 3 스타일 */}
              <div className="text-center mb-3 sm:mb-6">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <FaClipboardList className="text-purple-400 animate-bounce w-4 h-4 sm:w-6 sm:h-6" />
                  <h2 className="text-lg sm:text-2xl md:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-orange-400 to-pink-400">
                    {selectedExampleApp} 예시
                  </h2>
                  <FaClipboardList className="text-purple-400 animate-bounce w-4 h-4 sm:w-6 sm:h-6" />
                </div>
                <p className="text-purple-200 text-xs">올바른 화면을 캡처해주세요! 📱</p>
              </div>

              {/* 닫기 버튼 */}
              <button
                onClick={closeExampleModal}
                className="absolute top-2 right-2 w-8 h-8 bg-white/20 rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-all"
              >
                <FaTimes size={16} />
              </button>

              {/* 중요 안내사항 */}
              <div className="mb-3 sm:mb-4 bg-gradient-to-r from-amber-400/20 to-orange-500/20 border border-amber-400/30 rounded-xl p-3">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-amber-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                    <FaExclamationTriangle size={12} className="text-amber-400" />
                  </div>
                  <div className="text-amber-200 text-xs">
                    <p className="font-medium">중요! 반드시 오늘 날짜 화면만 업로드하세요</p>
                    <p className="text-[10px] mt-1">다른 화면이나 지난 날짜는 인식되지 않습니다</p>
                  </div>
                </div>
              </div>

              {/* 예시 이미지 */}
              <div className="mb-3 sm:mb-4">
                {selectedExampleApp === '배민커넥트' ? (
                  <div className="bg-gradient-to-r from-white/10 to-white/5 rounded-xl p-3 space-y-2 border border-white/20">
                    <div className="aspect-[9/16] bg-white/5 rounded-lg overflow-hidden">
                      <img 
                        src="/baemin-example.svg" 
                        alt="배민커넥트 예시" 
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div className="text-center">
                      <div className="inline-flex items-center gap-1 bg-cyan-500/20 text-cyan-300 px-2 py-1 rounded-full text-[10px]">
                        <span>오늘의 배달 수익</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-gradient-to-r from-white/10 to-white/5 rounded-xl p-3 space-y-2 border border-white/20">
                    <div className="aspect-[9/16] bg-white/5 rounded-lg overflow-hidden">
                      <img 
                        src="/coupang-example.svg" 
                        alt="쿠팡이츠 예시" 
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div className="text-center">
                      <div className="inline-flex items-center gap-1 bg-green-500/20 text-green-300 px-2 py-1 rounded-full text-[10px]">
                        <span>오늘의 총 배달 수수료</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-2 sm:space-y-3">
                <div className="bg-gradient-to-r from-white/10 to-white/5 rounded-xl p-3 border border-white/20">
                  <h4 className="text-white font-medium text-xs mb-2 text-center">
                    {selectedExampleApp === '배민커넥트' ? '배민커넥트 캡처 방법' : '쿠팡이츠 캡처 방법'}
                  </h4>
                  <div className="text-purple-200 text-[11px] space-y-1">
                    {selectedExampleApp === '배민커넥트' ? (
                      <>
                        <p>1. 배민커넥트 앱 실행</p>
                        <p>2. 마이페이지 → 오늘 배달 내역 클릭</p>
                        <p>3. 전체 화면이 보이도록 스크린샷</p>
                      </>
                    ) : (
                      <>
                        <p>1. 쿠팡이츠 앱 실행</p>
                        <p>2. 내 수입 → 오늘 날짜 선택</p>
                        <p>3. 총 배달 수수료가 보이도록 스크린샷</p>
                      </>
                    )}
                  </div>
                </div>
                <div className="text-red-300 text-[10px] text-center bg-red-500/10 border border-red-500/20 rounded-xl p-2">
                  ⚠️ 다른 화면은 인식되지 않습니다
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 
"use client";

import { useState, useEffect } from 'react';
import { FaUpload, FaCamera, FaCheckCircle, FaExclamationTriangle, FaImage, FaArrowRight, FaCoins, FaTimes, FaClipboardList } from 'react-icons/fa';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/contexts/NotificationContext';
import { useRouter } from 'next/navigation';
import { uploadDeliveryRecord, validateImageFile, compressImage, getKoreanToday, isTodayDate } from '@/services/uploadService';
import { analyzeDeliveryImage } from '@/services/imageAnalysisService';
import Image from 'next/image';
import Loading from '@/components/Loading';
import KakaoAdGlobal from '@/components/KakaoAdGlobal';
import ProtectedRoute from '@/components/ProtectedRoute';

export default function UploadPage() {
  const { user, userProfile } = useAuth();
  const { addNotification } = useNotifications();
  const router = useRouter();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadComplete, setUploadComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showExampleModal, setShowExampleModal] = useState(false);
  const [selectedExampleApp, setSelectedExampleApp] = useState<'baemin' | 'coupang' | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [detectedDate, setDetectedDate] = useState<string>('');
  const [earnedPoints, setEarnedPoints] = useState<number>(0);
  const [isDuplicateUpload, setIsDuplicateUpload] = useState(false);

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
    if (!user) {
      router.push('/login');
    }
  }, [user, router]);

  if (!user) {
    return null;
  }

  if (!userProfile) {
    return null;
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setError('');
      setSelectedFile(file);
      setPreview(URL.createObjectURL(file));
      setIsAnalyzing(true);
      setAnalysisResult(null);

      try {
        const result = await analyzeDeliveryImage(file, selectedExampleApp === 'baemin' ? 'baemin' : 'coupang');
        
        if (!result.isValidScreen) {
          setError(result.errorMessage || '올바른 화면이 아닙니다.');
          setIsAnalyzing(false);
          setSelectedFile(null);
          setPreview(null);
          return;
        }

        if (result.date && result.date !== getKoreanToday()) {
          setError(`이 화면은 ${result.date} 실적입니다. 오늘(${getKoreanToday()}) 실적만 업로드 가능합니다.`);
        }

        if (result.confidence < 0.7) {
          const platformGuide = selectedExampleApp === 'baemin' 
            ? '배민커넥트 앱 > 마이페이지 > 오늘 배달 내역' 
            : '쿠팡이츠 앱 > 내 수입 > 오늘 날짜 선택';
          setError(`이미지 인식률이 낮습니다. ${platformGuide} 화면을 선명하게 캡처해주세요.`);
          setIsAnalyzing(false);
          setSelectedFile(null);
          setPreview(null);
          return;
        }

        if (result.amount === 0 && result.deliveryCount === 0) {
          setError('배달 실적이 없습니다. 실적이 있는 날만 업로드 가능합니다.');
        }

        if (result.amount > 0 && result.deliveryCount > 0) {
          const avgAmount = result.amount / result.deliveryCount;
          if (avgAmount < 2000) {
            setError('배달당 평균 금액이 너무 낮습니다. 올바른 화면인지 확인해주세요.');
          }
          if (avgAmount > 15000) {
            setError('배달당 평균 금액이 너무 높습니다. 올바른 화면인지 확인해주세요.');
          }
        }

        setAnalysisResult(result);
        setDetectedDate(result.date || getKoreanToday());
        setIsAnalyzing(false);
      } catch (error) {
        console.error('이미지 분석 오류:', error);
        setError('이미지 분석 중 오류가 발생했습니다. 다시 시도해주세요.');
        setIsAnalyzing(false);
        setSelectedFile(null);
        setPreview(null);
      }
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !user || !userProfile || !analysisResult) {
      setError('필수 정보가 누락되었습니다.');
      return;
    }

    setIsUploading(true);
    setError('');

    try {
      if (analysisResult.date && !isTodayDate(analysisResult.date)) {
        setError(`이 이미지는 ${analysisResult.date} 실적입니다. 오늘(${getKoreanToday()}) 실적만 업로드 가능합니다. 지난 날짜의 실적은 수기 입력 메뉴를 이용해주세요.`);
        setIsUploading(false);
        return;
      }
      
      const result = await uploadDeliveryRecord(selectedFile, {
        userId: user.id,
        userNickname: userProfile.nickname || '',
        userRegion: userProfile.region || '',
        platform: selectedExampleApp === 'baemin' ? '배민커넥트' : '쿠팡이츠',
        amount: analysisResult.amount,
        deliveryCount: analysisResult.deliveryCount,
        date: analysisResult.date || getKoreanToday()
      });

      if (result.success) {
        setIsUploading(false);
        setUploadComplete(true);
        setAnalysisResult(null);
        setSelectedFile(null);
        setPreview(null);
        setDetectedDate('');
        setEarnedPoints(result.points || 0);
        setIsDuplicateUpload(result.points === 0);
        
        if (result.points === 0) {
          setError('이미 오늘 업로드한 기록이 있어 데이터만 업데이트했습니다. 포인트는 하루에 한 번만 지급됩니다.');
          
          addNotification({
            title: '실적 업데이트 완료',
            message: `오늘 ${selectedExampleApp === 'baemin' ? '배민커넥트' : '쿠팡이츠'} 실적이 업데이트되었습니다. (${analysisResult.deliveryCount}건, ${analysisResult.amount.toLocaleString()}원)`,
            type: 'info'
          });
        } else {
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
      setIsUploading(false);
    }
  };

  const resetUpload = () => {
    setSelectedFile(null);
    setPreview(null);
    setIsAnalyzing(false);
    setAnalysisResult(null);
    setDetectedDate('');
    setUploadComplete(false);
    setEarnedPoints(0);
    setIsDuplicateUpload(false);
    setError(null);
  };

  const openExampleModal = (app: 'baemin' | 'coupang') => {
    setSelectedExampleApp(app);
    setShowExampleModal(true);
  };

  const closeExampleModal = () => {
    setShowExampleModal(false);
    setSelectedExampleApp(null);
  };

  return (
    <ProtectedRoute>
      <div className="relative z-10">
        <div className="max-w-3xl mx-auto px-4">
          {/* 상단 여백 */}
          <div className="pt-4"></div>
          
          {/* 헤더 */}
          <section className="mb-4">
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <FaCamera className="text-purple-400 animate-bounce w-7 h-7" />
                <h1 className="text-3xl font-black bg-gradient-to-r from-white to-pink-200 bg-clip-text text-transparent">
                  실적 업로드
                </h1>
                <FaCamera className="text-purple-400 animate-bounce w-7 h-7" />
              </div>
              <p className="text-purple-200 text-sm">오늘의 배달 실적을 기록하세요</p>
            </div>
          </section>

          {/* 상단 광고 */}
          <section className="mb-4">
            <KakaoAdGlobal page="upload" index={0} />
          </section>

          {/* 업로드 영역 */}
          <section className="mb-4">
            <div className="bg-gradient-to-br from-purple-900/30 to-pink-900/30 backdrop-blur-lg rounded-2xl p-6 shadow-xl border border-purple-500/30">
              {!uploadComplete ? (
                <>
                  {/* 파일 선택 영역 */}
                  <div className="mb-6">
                    <label
                      htmlFor="file-upload"
                      className={`
                        relative block w-full h-64 border-2 border-dashed rounded-xl cursor-pointer
                        transition-all duration-300 overflow-hidden group
                        ${preview 
                          ? 'border-purple-400 bg-purple-500/10' 
                          : 'border-purple-500/50 hover:border-purple-400 hover:bg-purple-500/10'
                        }
                      `}
                    >
                      <input
                        id="file-upload"
                        type="file"
                        accept="image/*"
                        onChange={handleFileSelect}
                        className="hidden"
                        disabled={isUploading || isAnalyzing}
                      />
                      
                      {preview ? (
                        <div className="relative w-full h-full">
                          <Image
                            src={preview}
                            alt="Preview"
                            fill
                            className="object-contain"
                          />
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <p className="text-white font-bold">다른 이미지 선택</p>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center h-full p-6">
                          <FaImage className="text-purple-400 w-16 h-16 mb-4 animate-pulse" />
                          <p className="text-white font-bold mb-2">실적 스크린샷을 업로드하세요</p>
                          <p className="text-purple-200 text-sm text-center">
                            클릭하거나 파일을 드래그하세요
                          </p>
                        </div>
                      )}
                    </label>
                  </div>

                  {/* 예시 보기 버튼 */}
                  <div className="text-center mb-6">
                    <button
                      onClick={() => setShowExampleModal(true)}
                      className="text-purple-300 hover:text-purple-200 text-sm underline"
                    >
                      업로드 가능한 화면 예시 보기
                    </button>
                  </div>

                  {/* 에러 메시지 */}
                  {error && (
                    <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-xl">
                      <p className="text-red-200 text-sm">{error}</p>
                    </div>
                  )}

                  {/* 분석 중 상태 */}
                  {isAnalyzing && (
                    <div className="mb-4 p-4 bg-purple-500/20 border border-purple-500/50 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-purple-400"></div>
                        <p className="text-purple-200">이미지 분석 중...</p>
                      </div>
                    </div>
                  )}

                  {/* 분석 결과 */}
                  {analysisResult && (
                    <div className="mb-4 p-4 bg-green-500/20 border border-green-500/50 rounded-xl">
                      <h3 className="text-green-400 font-bold mb-2 flex items-center gap-2">
                        <FaCheckCircle />
                        분석 완료
                      </h3>
                      <div className="space-y-2 text-green-200 text-sm">
                        <p>• 플랫폼: {selectedExampleApp === 'baemin' ? '배민커넥트' : '쿠팡이츠'}</p>
                        <p>• 날짜: {detectedDate}</p>
                        <p>• 완료 건수: {analysisResult.deliveryCount}건</p>
                        <p>• 총 수익: {analysisResult.totalEarnings.toLocaleString()}원</p>
                      </div>
                    </div>
                  )}

                  {/* 업로드 버튼 */}
                  <button
                    onClick={handleUpload}
                    disabled={!selectedFile || isUploading || isAnalyzing || !analysisResult}
                    className={`
                      w-full py-3 px-4 rounded-xl font-bold transition-all
                      flex items-center justify-center gap-2
                      ${selectedFile && !isUploading && !isAnalyzing && analysisResult
                        ? 'bg-gradient-to-r from-purple-500 to-pink-500 hover:shadow-lg hover:shadow-purple-500/25 hover:scale-[1.02] text-white' 
                        : 'bg-gray-600 cursor-not-allowed text-gray-300'
                      }
                    `}
                  >
                    {isUploading ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                        <span>업로드 중... {uploadProgress}%</span>
                      </>
                    ) : (
                      <>
                        <FaUpload />
                        <span>실적 등록하기</span>
                      </>
                    )}
                  </button>
                </>
              ) : (
                /* 업로드 완료 화면 */
                <div className="text-center py-8">
                  <div className="mb-6">
                    <div className="w-20 h-20 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
                      <FaCheckCircle className="text-white w-10 h-10" />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">업로드 완료!</h2>
                    <p className="text-purple-200">실적이 성공적으로 등록되었습니다</p>
                  </div>

                  <div className="bg-white/10 rounded-xl p-4 mb-6">
                    <div className="flex items-center justify-center gap-2 text-yellow-400 mb-2">
                      <FaCoins className="w-5 h-5" />
                      <span className="font-bold text-lg">+{earnedPoints}P</span>
                    </div>
                    <p className="text-purple-200 text-sm">실적 업로드 보상이 지급되었습니다</p>
                  </div>

                  <div className="space-y-3">
                    <button
                      onClick={() => router.push('/ranking')}
                      className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 px-4 rounded-xl font-bold hover:shadow-lg hover:shadow-purple-500/25 hover:scale-[1.02] transition-all"
                    >
                      랭킹 확인하기
                    </button>
                    <button
                      onClick={resetUpload}
                      className="w-full bg-white/10 text-white py-3 px-4 rounded-xl font-bold hover:bg-white/20 transition-all"
                    >
                      다시 업로드하기
                    </button>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* 하단 광고 */}
          <section className="mb-4">
            <KakaoAdGlobal page="upload" index={1} />
          </section>

          {/* 안내 사항 */}
          <section className="mb-20">
            <div className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 backdrop-blur-lg rounded-2xl p-4 border border-amber-500/20">
              <div className="flex items-start gap-3">
                <FaExclamationTriangle className="text-amber-400 w-5 h-5 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-amber-400 font-bold mb-1">업로드 시 주의사항</h3>
                  <ul className="text-amber-200 text-sm space-y-1">
                    <li>• 실적 화면 전체가 보이도록 촬영해주세요</li>
                    <li>• 날짜와 금액이 명확히 보여야 합니다</li>
                    <li>• 하루에 한 번만 업로드 가능합니다</li>
                    <li>• 허위 업로드 시 제재를 받을 수 있습니다</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* 예시 모달 */}
          {showExampleModal && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowExampleModal(false)}>
              <div className="bg-gradient-to-br from-purple-900 to-pink-900 rounded-2xl p-6 max-w-lg w-full shadow-2xl border border-purple-500/30" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-white font-bold text-xl">업로드 가능한 화면</h2>
                  <button
                    onClick={() => setShowExampleModal(false)}
                    className="text-white/60 hover:text-white"
                  >
                    <FaTimes />
                  </button>
                </div>

                <div className="space-y-4">
                  <button
                    onClick={() => setSelectedExampleApp('baemin')}
                    className={`w-full p-4 rounded-xl border transition-all ${
                      selectedExampleApp === 'baemin' 
                        ? 'bg-purple-500/20 border-purple-400' 
                        : 'bg-white/5 border-white/20 hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Image src="/images/baemin-logo.svg" alt="배민" width={40} height={40} />
                      <div className="text-left">
                        <h3 className="text-white font-bold">배민커넥트</h3>
                        <p className="text-purple-200 text-sm">일일 정산 화면</p>
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => setSelectedExampleApp('coupang')}
                    className={`w-full p-4 rounded-xl border transition-all ${
                      selectedExampleApp === 'coupang' 
                        ? 'bg-purple-500/20 border-purple-400' 
                        : 'bg-white/5 border-white/20 hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Image src="/images/coupang-logo.svg" alt="쿠팡" width={40} height={40} />
                      <div className="text-left">
                        <h3 className="text-white font-bold">쿠팡이츠</h3>
                        <p className="text-purple-200 text-sm">일일 수익 화면</p>
                      </div>
                    </div>
                  </button>
                </div>

                {selectedExampleApp && (
                  <div className="mt-4 p-4 bg-white/10 rounded-xl">
                    <Image
                      src={`/${selectedExampleApp}-example.svg`}
                      alt={`${selectedExampleApp} 예시`}
                      width={300}
                      height={400}
                      className="w-full h-auto rounded-lg"
                    />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
} 
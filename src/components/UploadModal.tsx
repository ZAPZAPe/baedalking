import React, { useState, useRef } from 'react';
import { X, Upload, Camera, Image as ImageIcon, CheckCircle, AlertCircle } from 'lucide-react';
import Image from 'next/image';
import { useAuth } from '../contexts/AuthContext';
import { analyzeDeliveryImage } from '../services/imageAnalysisService';
import { uploadDeliveryRecord } from '../services/uploadService';
import { rewardUploadPoints } from '../services/pointService';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function UploadModal({ isOpen, onClose, onSuccess }: UploadModalProps) {
  const { user, userProfile } = useAuth();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'analyzing' | 'success' | 'error'>('idle');
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      setUploadStatus('idle');
      setAnalysisResult(null);
      setErrorMessage('');
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !user) return;

    setIsUploading(true);
    setUploadStatus('analyzing');
    setErrorMessage('');

    try {
      // 이미지 분석
      console.log('이미지 분석 시작...');
      const result = await analyzeDeliveryImage(selectedFile);
      console.log('분석 결과:', result);
      
      setAnalysisResult(result);

      if (result.amount === 0 || result.deliveryCount === 0) {
        setUploadStatus('error');
        setErrorMessage('이미지에서 배달 정보를 찾을 수 없습니다. 다른 이미지를 시도해주세요.');
        setIsUploading(false);
        return;
      }

      // 분석 결과 유효성 검사
      if (result.confidence < 0.7) {
        setUploadStatus('error');
        setErrorMessage('이미지 분석 신뢰도가 낮습니다. 더 선명한 이미지를 업로드해주세요.');
        setIsUploading(false);
        return;
      }

      // 평균 배달료 검증
      const avgAmount = result.amount / result.deliveryCount;
      if (avgAmount < 2000 || avgAmount > 15000) {
        setUploadStatus('error');
        setErrorMessage('배달당 평균 금액이 비정상적입니다. 이미지를 다시 확인해주세요.');
        setIsUploading(false);
        return;
      }

      // 업로드 처리
      const uploadResult = await uploadDeliveryRecord(selectedFile, {
        userId: user.id,
        userNickname: userProfile?.nickname || '익명',
        userRegion: userProfile?.region || '미지정',
        platform: result.platform === 'baemin' ? '배민커넥트' : '쿠팡이츠',
        amount: result.amount,
        deliveryCount: result.deliveryCount,
        date: result.date || new Date().toISOString().split('T')[0]
      });

      if (uploadResult.success) {
        setUploadStatus('success');
        setTimeout(() => {
          onSuccess();
          handleClose();
        }, 2000);
      } else {
        setUploadStatus('error');
        setErrorMessage(uploadResult.error || '업로드에 실패했습니다.');
      }
    } catch (error) {
      console.error('업로드 오류:', error);
      setUploadStatus('error');
      setErrorMessage('업로드 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setUploadStatus('idle');
    setAnalysisResult(null);
    setErrorMessage('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">배달 실적 업로드</h2>
          <button onClick={handleClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-4">
          {!selectedFile ? (
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              <div className="text-center">
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">배달 실적 스크린샷을 업로드하세요</p>
                <div className="flex gap-2 justify-center">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                  >
                    <ImageIcon className="w-5 h-5" />
                    갤러리에서 선택
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="relative">
                <Image
                  src={previewUrl!}
                  alt="Preview"
                  width={400}
                  height={300}
                  className="w-full rounded-lg"
                />
                {uploadStatus === 'analyzing' && (
                  <div className="absolute inset-0 bg-black bg-opacity-50 rounded-lg flex items-center justify-center">
                    <div className="text-white text-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-2"></div>
                      <p className="font-medium">이미지 분석 중...</p>
                      <p className="text-sm mt-1">플랫폼과 날짜를 인식하고 있습니다</p>
                    </div>
                  </div>
                )}
              </div>

              {uploadStatus === 'success' && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-green-700">
                    <CheckCircle className="w-5 h-5" />
                    <p className="font-medium">
                      {errorMessage || '업로드가 완료되었습니다!'}
                    </p>
                  </div>
                  {analysisResult && (
                    <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 mb-6">
                      <h3 className="text-lg font-bold text-white mb-4">📊 분석 결과</h3>
                      
                      <div className="space-y-4">
                        {/* 플랫폼 정보 */}
                        <div className="bg-white/5 rounded-lg p-4">
                          <div className="flex items-center gap-3 mb-2">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                              analysisResult.platform === 'baemin' ? 'bg-blue-500' :
                              analysisResult.platform === 'coupang' ? 'bg-orange-500' :
                              'bg-gray-500'
                            }`}>
                              <span className="text-white font-bold text-sm">
                                {analysisResult.platform === 'baemin' ? '배' :
                                 analysisResult.platform === 'coupang' ? '쿠' :
                                 '기'}
                              </span>
                            </div>
                            <div>
                              <div className="text-white font-bold">
                                {analysisResult.platform === 'baemin' ? '배민커넥트' :
                                 analysisResult.platform === 'coupang' ? '쿠팡이츠' :
                                 '기타 플랫폼'}
                              </div>
                              <div className="text-gray-400 text-sm">
                                신뢰도: {Math.round(analysisResult.confidence * 100)}%
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* 날짜 정보 */}
                        <div className="bg-white/5 rounded-lg p-4">
                          <div className="text-white font-bold mb-2">📅 날짜</div>
                          {analysisResult.isWeeklyReport ? (
                            <div className="text-gray-300">
                              <div className="flex items-center gap-2">
                                <span>{analysisResult.dateRange?.start}</span>
                                <span>~</span>
                                <span>{analysisResult.dateRange?.end}</span>
                                <span className="bg-purple-500/20 text-purple-300 text-xs px-2 py-1 rounded">
                                  주급
                                </span>
                              </div>
                            </div>
                          ) : (
                            <div className="text-gray-300">
                              {analysisResult.date}
                              {analysisResult.date === new Date().toISOString().split('T')[0] && (
                                <span className="ml-2 bg-green-500/20 text-green-300 text-xs px-2 py-1 rounded">
                                  오늘
                                </span>
                              )}
                            </div>
                          )}
                        </div>

                        {/* 금액 정보 */}
                        <div className="bg-white/5 rounded-lg p-4">
                          <div className="text-white font-bold mb-2">💰 금액</div>
                          <div className="text-2xl font-bold text-green-400">
                            {analysisResult.amount.toLocaleString()}원
                          </div>
                        </div>

                        {/* 건수 정보 */}
                        <div className="bg-white/5 rounded-lg p-4">
                          <div className="text-white font-bold mb-2">📦 배달 건수</div>
                          <div className="text-2xl font-bold text-blue-400">
                            {analysisResult.deliveryCount}건
                          </div>
                          <div className="text-gray-400 text-sm mt-1">
                            평균 {Math.round(analysisResult.amount / analysisResult.deliveryCount).toLocaleString()}원/건
                          </div>
                        </div>

                        {/* 주의사항 */}
                        {analysisResult.date !== new Date().toISOString().split('T')[0] && (
                          <div className="bg-yellow-500/20 border border-yellow-400/50 rounded-lg p-3">
                            <div className="text-yellow-200 text-sm">
                              <div className="font-bold mb-1">⚠️ 포인트 지급 안내</div>
                              <p>오늘 날짜가 아닌 기록이므로 포인트가 지급되지 않습니다.</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {uploadStatus === 'error' && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-red-700">
                    <AlertCircle className="w-5 h-5" />
                    <p className="font-medium">{errorMessage}</p>
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setSelectedFile(null);
                    setPreviewUrl(null);
                    setUploadStatus('idle');
                    setAnalysisResult(null);
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  disabled={isUploading}
                >
                  다시 선택
                </button>
                <button
                  onClick={handleUpload}
                  disabled={isUploading || uploadStatus === 'success'}
                  className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300"
                >
                  {isUploading ? '업로드 중...' : '업로드'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 
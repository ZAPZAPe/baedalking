'use client';

import { useState } from 'react';

interface OcrResult {
  count: number;
  amount: number;
}

interface OcrResultProps {
  onResultConfirm: (result: OcrResult) => void;
}

export default function OcrResult({ onResultConfirm }: OcrResultProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<OcrResult | null>(null);

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    // TODO: 실제 OCR API 호출
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setResult({
      count: 15,
      amount: 125000,
    });
    setIsAnalyzing(false);
  };

  const handleConfirm = () => {
    if (result) {
      onResultConfirm(result);
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-medium">OCR 결과</h2>
      {!result ? (
        <div className="text-center py-8">
          {isAnalyzing ? (
            <div className="space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
              <div className="text-gray-600">이미지 분석 중...</div>
            </div>
          ) : (
            <button
              onClick={handleAnalyze}
              className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors"
            >
              분석 시작하기
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-sm text-gray-500 mb-1">배달 건수</div>
              <div className="text-2xl font-bold">{result.count}건</div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-sm text-gray-500 mb-1">배달 금액</div>
              <div className="text-2xl font-bold">
                {result.amount.toLocaleString()}원
              </div>
            </div>
          </div>
          <div className="flex space-x-4">
            <button
              onClick={handleAnalyze}
              className="flex-1 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
            >
              다시 분석
            </button>
            <button
              onClick={handleConfirm}
              className="flex-1 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
            >
              결과 확인
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 
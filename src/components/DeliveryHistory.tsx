'use client';

import React from 'react';
import { ChevronLeft } from 'lucide-react';

interface DeliveryHistoryProps {
  date?: string;
  deliveryCount?: number;
  totalAmount?: number;
}

export default function DeliveryHistory({ 
  date = '6월 14일',
  deliveryCount = 0,
  totalAmount = 0 
}: DeliveryHistoryProps) {
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* 헤더 */}
      <div className="flex items-center justify-between p-4 bg-gray-800">
        <div className="flex items-center gap-3">
          <ChevronLeft className="w-6 h-6" />
          <h1 className="text-lg font-medium">오늘 배달 내역</h1>
        </div>
        <div className="text-xs text-gray-400">
          1:45 📶 5G 53%
        </div>
      </div>

      {/* 메인 콘텐츠 */}
      <div className="p-4">
        <div className="bg-gray-800 rounded-2xl p-6 space-y-4">
          {/* 운행일 */}
          <div className="flex justify-between items-center">
            <span className="text-gray-300 text-base">운행일</span>
            <span className="text-white text-base">{date}</span>
          </div>
          
          {/* 배달건 */}
          <div className="flex justify-between items-center">
            <span className="text-gray-300 text-base">배달건</span>
            <span className="text-white text-base">{deliveryCount}건</span>
          </div>
          
          {/* 배달료 합계 */}
          <div className="flex justify-between items-center">
            <span className="text-gray-300 text-base">배달료 합계</span>
            <span className="text-cyan-400 text-lg font-semibold">
              {totalAmount.toLocaleString()}원
            </span>
          </div>
        </div>
      </div>

      {/* 하단 인디케이터 */}
      <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2">
        <div className="w-32 h-1 bg-gray-600 rounded-full"></div>
      </div>
    </div>
  );
} 
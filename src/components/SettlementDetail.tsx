'use client';

import React, { useState } from 'react';
import { ChevronLeft, ChevronDown, ChevronUp, ChevronRight } from 'lucide-react';

interface DailyDelivery {
  date: string;
  amount: number;
  count: number;
}

interface SettlementDetailProps {
  period?: string;
  finalAmount?: number;
  paymentDate?: string;
  totalDeliveries?: number;
  totalDeliveryFee?: number;
  dailyDeliveries?: DailyDelivery[];
}

export default function SettlementDetail({
  period = '2025.2.19 - 2025.2.25',
  finalAmount = 97189,
  paymentDate = '2월 28일',
  totalDeliveries = 21,
  totalDeliveryFee = 86340,
  dailyDeliveries = [
    { date: '2025.2.19', amount: 54800, count: 13 },
    { date: '2025.2.21', amount: 31540, count: 8 }
  ]
}: SettlementDetailProps) {
  const [isAmountExpanded, setIsAmountExpanded] = useState(false);

  return (
    <div className="min-h-screen bg-gray-100">
      {/* 헤더 */}
      <div className="flex items-center justify-between p-4 bg-gray-800 text-white">
        <div className="flex items-center gap-3">
          <ChevronLeft className="w-6 h-6" />
          <h1 className="text-lg font-medium">정산내역상세</h1>
        </div>
        <div className="text-xs text-gray-400">
          1:45 📶 5G 53%
        </div>
      </div>

      {/* 기간 선택 */}
      <div className="flex items-center justify-between p-4 bg-white border-b">
        <ChevronLeft className="w-5 h-5 text-gray-400" />
        <span className="text-gray-700 font-medium">{period}</span>
        <ChevronRight className="w-5 h-5 text-gray-400" />
      </div>

      {/* 최종 지급 금액 */}
      <div className="bg-white px-4 py-6 border-b">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-gray-600">최종지급금액</span>
          <button 
            onClick={() => setIsAmountExpanded(!isAmountExpanded)}
            className="text-cyan-500"
          >
            {isAmountExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
        <div className="text-3xl font-bold text-cyan-500 mb-4">
          {finalAmount.toLocaleString()}원
        </div>

        {/* 상세 정보 */}
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-gray-600">지급일</span>
            <span className="text-gray-800">{paymentDate}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">총 배달건</span>
            <span className="text-gray-800">{totalDeliveries}건</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">배달료 합계</span>
            <span className="text-gray-800">{totalDeliveryFee.toLocaleString()}원</span>
          </div>
        </div>
      </div>

      {/* 지그재그 구분선 */}
      <div className="h-4 bg-gray-100 relative">
        <div className="absolute inset-0 bg-black opacity-10" 
             style={{
               backgroundImage: `url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0l10 10 10-10v20H0z' fill='%23000' fill-opacity='0.1'/%3E%3C/svg%3E")`,
               backgroundRepeat: 'repeat-x',
               backgroundSize: '20px 20px'
             }}>
        </div>
      </div>

      {/* 일별 배달 내역 */}
      <div className="bg-white">
        <div className="px-4 py-3 bg-gray-800 text-white">
          <h2 className="font-medium">일별 배달 내역</h2>
        </div>
        
        <div className="divide-y divide-gray-200">
          {dailyDeliveries.map((delivery, index) => (
            <div key={index} className="px-4 py-4">
              <div className="flex justify-between items-center">
                <div>
                  <div className="text-gray-600 text-sm mb-1">{delivery.date}</div>
                  <div className="text-xl font-bold text-gray-800">
                    {delivery.amount.toLocaleString()}원
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-600">{delivery.count}건</span>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 하단 알림 */}
      <div className="fixed bottom-0 left-0 right-0 bg-gray-600 text-white p-4 flex items-center justify-between">
        <div className="flex-1">
          <div className="font-medium mb-1">스크린 캡처가 감지되었습니다.</div>
          <div className="text-sm text-gray-300">
            개인정보가 포함된 캡처를 공유할 경우 불이익을 받을 수 있습니다.
          </div>
        </div>
        <button className="text-white text-xl">×</button>
      </div>

      {/* 하단 인디케이터 */}
      <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2">
        <div className="w-32 h-1 bg-gray-400 rounded-full"></div>
      </div>
    </div>
  );
} 
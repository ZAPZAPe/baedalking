'use client';

import React from 'react';
import { ChevronLeft, ChevronDown, ChevronRight } from 'lucide-react';

interface DailyIncome {
  date: string;
  day: string;
  deliveryCount: number;
  amount: number;
}

interface CoupangEatsIncomeProps {
  period?: string;
  totalAmount?: number;
  totalDeliveries?: number;
  lastUpdate?: string;
  dailyIncomes?: DailyIncome[];
}

export default function CoupangEatsIncome({
  period = '5/28 ~ 6/3',
  totalAmount = 680126,
  totalDeliveries = 170,
  lastUpdate = '21:34',
  dailyIncomes = [
    { date: '05/29', day: '목', deliveryCount: 17, amount: 53920 },
    { date: '05/30', day: '금', deliveryCount: 41, amount: 148739 },
    { date: '05/31', day: '토', deliveryCount: 47, amount: 179244 },
    { date: '06/01', day: '일', deliveryCount: 34, amount: 150373 },
    { date: '06/02', day: '월', deliveryCount: 9, amount: 40770 },
    { date: '06/03', day: '화', deliveryCount: 22, amount: 97080 }
  ]
}: CoupangEatsIncomeProps) {
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* 헤더 */}
      <div className="flex items-center justify-between p-4 bg-gray-900">
        <div className="flex items-center gap-3">
          <ChevronLeft className="w-6 h-6" />
          <h1 className="text-lg font-medium">내 수입</h1>
        </div>
        <div className="text-xs text-gray-400">
          1:45 📶 5G 54%
        </div>
      </div>

      {/* 기간 선택 */}
      <div className="flex items-center justify-center py-6">
        <div className="flex items-center gap-4">
          <ChevronLeft className="w-5 h-5 text-gray-400" />
          <span className="text-white text-lg font-medium">{period}</span>
          <ChevronRight className="w-5 h-5 text-gray-400" />
        </div>
      </div>

      {/* 메인 수입 카드 */}
      <div className="mx-4 bg-white rounded-2xl p-6 text-center">
        <div className="text-gray-500 text-sm mb-1">
          {lastUpdate} 업데이트
        </div>
        <div className="text-4xl font-bold text-black mb-3">
          {totalAmount.toLocaleString()}원
        </div>
        <div className="text-gray-600 text-base">
          배달 <span className="font-semibold">{totalDeliveries}</span>건
        </div>
        
        {/* 자세히 보기 버튼 */}
        <button className="flex items-center justify-center gap-2 mt-4 w-full py-2 text-gray-600">
          <span>자세히 보기</span>
          <ChevronDown className="w-4 h-4" />
        </button>
      </div>

      {/* 알림 박스 */}
      <div className="mx-4 mt-4 bg-yellow-100 rounded-lg p-4">
        <div className="flex items-start gap-2">
          <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0"></div>
          <p className="text-gray-800 text-sm leading-relaxed">
            이츠플러스 협력사에서 제공하는 수입이며, 항목별 금액은 참고사항입니다. 
            실제 지급액은 합계 금액이며, 수수료는 협력사에 문의해 주시기 바랍니다.
          </p>
        </div>
      </div>

      {/* 일별 배달 수수료 */}
      <div className="mt-6 px-4">
        <h2 className="text-lg font-medium mb-4">일별 배달 수수료</h2>
        
        <div className="space-y-1">
          {dailyIncomes.map((income, index) => (
            <div key={index} className="bg-gray-800 rounded-lg p-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <span className="text-white font-medium">
                    {income.date} {income.day}
                  </span>
                  <span className="text-gray-400 text-sm">
                    배달 {income.deliveryCount}건
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-white font-semibold">
                    {income.amount.toLocaleString()}원
                  </span>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 하단 인디케이터 */}
      <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2">
        <div className="w-32 h-1 bg-gray-600 rounded-full"></div>
      </div>
    </div>
  );
} 
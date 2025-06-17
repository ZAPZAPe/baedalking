'use client';

import React from 'react';
import { ChevronLeft, ChevronDown } from 'lucide-react';

interface DeliveryItem {
  restaurantName: string;
  completionTime: string;
  distance: string;
  amount: number;
}

interface CoupangEatsDetailProps {
  date?: string;
  totalAmount?: number;
  deliveryCount?: number;
  deliveries?: DeliveryItem[];
}

export default function CoupangEatsDetail({
  date = '05/29 목',
  totalAmount = 53920,
  deliveryCount = 17,
  deliveries = [
    {
      restaurantName: '스시기원',
      completionTime: '17:04',
      distance: '1.0km',
      amount: 2990
    },
    {
      restaurantName: '동대문엽기떡볶이 부천상동점',
      completionTime: '17:09',
      distance: '0.2km',
      amount: 2700
    }
  ]
}: CoupangEatsDetailProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="flex items-center gap-3 p-4 bg-white border-b">
        <ChevronLeft className="w-6 h-6 text-gray-700" />
        <h1 className="text-lg font-medium text-gray-900">{date}</h1>
      </div>

      {/* 총 배달 수수료 */}
      <div className="bg-white px-4 py-6 text-center border-b">
        <div className="text-gray-500 text-sm mb-2">총 배달 수수료</div>
        <div className="text-4xl font-bold text-gray-900 mb-2">
          {totalAmount.toLocaleString()}원
        </div>
        <div className="text-gray-600 text-base">
          배달 <span className="font-semibold">{deliveryCount}</span>건
        </div>
      </div>

      {/* 알림 박스 */}
      <div className="mx-4 mt-4 bg-gray-100 rounded-lg p-4">
        <div className="flex items-start gap-2">
          <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
          <p className="text-gray-700 text-sm">
            할증, 패널티 외의 상세 수입은 표시되지 않습니다.
          </p>
        </div>
      </div>

      {/* 거리 섹션 */}
      <div className="mt-8 px-4">
        <div className="flex items-center justify-center mb-6">
          <div className="flex items-center gap-2">
            <span className="text-gray-900 font-medium">거리</span>
            <ChevronDown className="w-4 h-4 text-gray-500" />
          </div>
        </div>

        {/* 배달 목록 */}
        <div className="space-y-6">
          {deliveries.map((delivery, index) => (
            <div key={index} className="bg-white rounded-lg border border-gray-200">
              {/* 식당명 */}
              <div className="px-4 py-3 border-b border-gray-100">
                <h3 className="font-medium text-gray-900">{delivery.restaurantName}</h3>
                <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                  <span>배달 완료 {delivery.completionTime}</span>
                  <span>배달 거리 {delivery.distance}</span>
                </div>
              </div>
              
              {/* 합계 */}
              <div className="px-4 py-3 flex justify-between items-center">
                <span className="text-gray-900 font-medium">합계</span>
                <div className="flex items-center gap-2">
                  <span className="text-gray-900 font-semibold">
                    {delivery.amount.toLocaleString()}원
                  </span>
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                </div>
              </div>
              
              {/* 하단 메모 */}
              <div className="px-4 py-2 bg-gray-50 rounded-b-lg">
                <p className="text-xs text-gray-500 text-center">
                  다른 주문과 함께 배달한 건
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 하단 여백 */}
      <div className="h-20"></div>

      {/* 하단 인디케이터 */}
      <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2">
        <div className="w-32 h-1 bg-black rounded-full"></div>
      </div>
    </div>
  );
} 
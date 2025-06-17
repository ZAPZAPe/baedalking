'use client';

import React, { useState } from 'react';
import DeliveryHistory from '@/components/DeliveryHistory';
import SettlementDetail from '@/components/SettlementDetail';
import CoupangEatsIncome from '@/components/CoupangEatsIncome';
import CoupangEatsDetail from '@/components/CoupangEatsDetail';

type ViewType = 'delivery' | 'settlement' | 'coupang-income' | 'coupang-detail';

export default function DemoPage() {
  const [currentView, setCurrentView] = useState<ViewType>('delivery');

  return (
    <div className="min-h-screen">
      {/* 탭 전환 버튼 */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-white shadow-lg">
        <div className="grid grid-cols-2 md:grid-cols-4">
          <button
            onClick={() => setCurrentView('delivery')}
            className={`py-3 px-2 text-center font-medium text-xs transition-colors ${
              currentView === 'delivery' 
                ? 'bg-cyan-500 text-white' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            배민 배달내역
          </button>
          <button
            onClick={() => setCurrentView('settlement')}
            className={`py-3 px-2 text-center font-medium text-xs transition-colors ${
              currentView === 'settlement' 
                ? 'bg-cyan-500 text-white' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            배민 정산상세
          </button>
          <button
            onClick={() => setCurrentView('coupang-income')}
            className={`py-3 px-2 text-center font-medium text-xs transition-colors ${
              currentView === 'coupang-income' 
                ? 'bg-purple-500 text-white' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            쿠팡 내수입
          </button>
          <button
            onClick={() => setCurrentView('coupang-detail')}
            className={`py-3 px-2 text-center font-medium text-xs transition-colors ${
              currentView === 'coupang-detail' 
                ? 'bg-purple-500 text-white' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            쿠팡 상세
          </button>
        </div>
      </div>

      {/* 컨텐츠 */}
      <div className="pt-16">
        {currentView === 'delivery' && (
          <DeliveryHistory 
            date="6월 14일"
            deliveryCount={0}
            totalAmount={0}
          />
        )}
        
        {currentView === 'settlement' && (
          <SettlementDetail 
            period="2025.2.19 - 2025.2.25"
            finalAmount={97189}
            paymentDate="2월 28일"
            totalDeliveries={21}
            totalDeliveryFee={86340}
            dailyDeliveries={[
              { date: '2025.2.19', amount: 54800, count: 13 },
              { date: '2025.2.21', amount: 31540, count: 8 }
            ]}
          />
        )}

        {currentView === 'coupang-income' && (
          <CoupangEatsIncome 
            period="5/28 ~ 6/3"
            totalAmount={680126}
            totalDeliveries={170}
            lastUpdate="21:34"
            dailyIncomes={[
              { date: '05/29', day: '목', deliveryCount: 17, amount: 53920 },
              { date: '05/30', day: '금', deliveryCount: 41, amount: 148739 },
              { date: '05/31', day: '토', deliveryCount: 47, amount: 179244 },
              { date: '06/01', day: '일', deliveryCount: 34, amount: 150373 },
              { date: '06/02', day: '월', deliveryCount: 9, amount: 40770 },
              { date: '06/03', day: '화', deliveryCount: 22, amount: 97080 }
            ]}
          />
        )}

        {currentView === 'coupang-detail' && (
          <CoupangEatsDetail 
            date="05/29 목"
            totalAmount={53920}
            deliveryCount={17}
            deliveries={[
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
            ]}
          />
        )}
      </div>
    </div>
  );
} 
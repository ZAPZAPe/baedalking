'use client'

import PixelButton from '@/components/ui/PixelButton'
import { useServerTime } from '@/hooks/useServerTime'
import KakaoAd from '@/components/ui/KakaoAd'
import MiniGarageCanvas from '@/components/minigame'
import { ModalType } from '@/hooks/useAppState'
import InventoryUI from './InventoryUI'
import { useState, useEffect } from 'react'

interface HomeTabProps {
  currentBackground: string
  currentVehicle: string
  garageIntro: string
  todayVisitors: number
  currentWeather: { temp: number; condition: string }
  getWeatherIcon: (condition: string) => string
  incomeRecords: any[]
  totalIncome: number
  isClient: boolean
  userId: string
  setShowBackgroundItemPanel: (show: boolean) => void
  setShowVehicleItemPanel: (show: boolean) => void
  setShowCharacterItemPanel: (show: boolean) => void
  setShowIncomeInputPanel: (show: boolean) => void
  showInventoryUI: boolean
  setShowInventoryUI: (show: boolean) => void
  setActiveTab: (tab: string) => void
  // 상점 모달 관련
  openModal?: (modalType: ModalType) => void
}

export default function HomeTab({
  currentBackground,
  currentVehicle,
  garageIntro,
  todayVisitors,
  currentWeather,
  getWeatherIcon,
  incomeRecords,
  totalIncome,
  isClient,
  userId,
  setShowBackgroundItemPanel,
  setShowVehicleItemPanel,
  setShowCharacterItemPanel,
  setShowIncomeInputPanel,
  showInventoryUI,
  setShowInventoryUI,
  setActiveTab,
  openModal
}: HomeTabProps) {
  // 서버 시간 사용
  const { serverTime } = useServerTime()
  
  // 레퍼런스 기반 완전 재작성 - resizeTo: window로 자동 조정되므로 고정 크기 사용
  
  // 서버 시간 기준으로 오늘 날짜 계산
  const today = serverTime ? new Date(serverTime.koreaDate) : new Date()
  const todayStr = serverTime ? serverTime.koreaDate : 
                   today.getFullYear() + '-' + 
                   String(today.getMonth() + 1).padStart(2, '0') + '-' + 
                   String(today.getDate()).padStart(2, '0')
  
  return (
    <div className="space-y-3 sm:space-y-4">
      {/* 캔버스 + 차고 소개를 하나의 컨테이너로 결합 */}
      <div className="relative rounded-xl border border-[#00ff88]/30 shadow-inner bg-gradient-to-br from-[#1a1a2e]/50 to-[#16213e]/50 p-3 sm:p-4 lg:p-5">
        <div className="w-full" style={{
          aspectRatio: '4 / 3',
          overflow: 'hidden',
          position: 'relative'
        }}>
          <MiniGarageCanvas 
            width={800}
            height={600}
            mode="minigarage"
            userId={userId}
            onTileClick={(x, y, z) => {
            }}
            onObjectClick={(object) => {
            }}
          />
        </div>

        {/* 차고 소개 (같은 카드 내부) */}
        <div className="bg-black/30 backdrop-blur-sm rounded-lg p-3 border border-[#00ff88]/20 mt-3">
          <div className="text-center">
            <p className="text-white text-sm font-medium leading-relaxed">{garageIntro}</p>
          </div>
        </div>
      </div>

      {/* 내 차고 방문 버튼 */}
      <button 
        onClick={() => window.location.href = `/garage/${userId || 'temp'}`}
        className="w-full bg-gradient-to-r from-[#9c88ff]/20 to-[#ffd93d]/20 border-2 border-[#9c88ff]/50 hover:border-[#9c88ff] p-3 rounded text-center hover:from-[#9c88ff]/30 hover:to-[#ffd93d]/30 transition-all duration-300 shadow-lg" 
        style={{borderRadius: '8px'}}
      >
        <div className="flex flex-col items-center justify-center">
          <div className="text-[#9c88ff] text-sm font-bold font-mono">🏠 내 미니차고 방문하기</div>
          <div className="text-gray-300 text-xs font-mono">미니차고 꾸미기, 방명록 확인</div>
        </div>
      </button>

      {/* 카카오 광고 - 새로운 KakaoAd 컴포넌트 사용 */}
      {isClient && (
        <KakaoAd 
          adUnit="DAN-hoOuYkLu161z0omL"
          width={320}
          height={100}
          className="mb-2 sm:mb-3 lg:mb-4"
        />
      )}

      {/* 픽셀아트 스타일 수익 현황 */}
      <div 
        className="bg-gradient-to-br from-[#2d3748] to-[#1a202c] rounded-xl p-4 border border-[#00ff88]/30 shadow-inner mb-2 sm:mb-3 lg:mb-4 flex-shrink-0"
        style={{
          fontFamily: 'monospace',
          imageRendering: 'pixelated'
        }}
      >
        {/* 픽셀 헤더 - 인증 상태에 따른 테두리 */}
        <div 
          className={`bg-gradient-to-r from-[#1a202c] to-[#2d3748] p-3 mb-4 border-2 relative transition-all duration-300 ${
true 
              ? 'border-[#00ff88]' 
              : 'border-gray-600/50'
          }`} 
          style={{
            borderRadius: '4px',
            boxShadow: '0 0 10px #00ff8840, inset 0 0 10px #00ff8820'
          }}
        >
          <div className="flex items-center justify-between py-1 px-2">
            <div className="flex items-center gap-3">
              <div>
                <h3 className="text-white font-bold text-base font-mono" style={{
                  textShadow: '2px 0 0 #000, -2px 0 0 #000, 0 2px 0 #000, 0 -2px 0 #000, 1px 1px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000',
                  imageRendering: 'pixelated'
                }}>
                  오늘의 수익
                </h3>
                <p className="text-gray-400 text-xs font-mono">Today's Earnings</p>
              </div>
            </div>
            <div 
              className={`bg-[#1a202c] border-2 px-2 py-1 font-mono text-xs transition-all duration-300 ${
    true 
                  ? 'border-[#00ff88]/60 text-[#00ff88]' 
                  : 'border-gray-600/50 text-gray-300'
              }`} 
              style={{borderRadius: '2px'}}
            >
              {new Date(todayStr).toLocaleDateString('ko-KR')}
            </div>
          </div>

          {/* 총 금액 표시 */}
          <div className="text-center mt-3 mb-2 px-2">
            <div className="text-3xl font-bold font-mono text-[#00ff88]">
              ₩{(incomeRecords.filter(record => record.date === todayStr)
                  .reduce((sum, record) => sum + (record.delivery_amount || 0), 0) + 
                 incomeRecords.filter(record => record.date === todayStr)
                  .reduce((sum, record) => sum + (record.mission_amount || 0), 0)).toLocaleString()}
            </div>
          </div>

          {/* 픽셀 장식 요소들 - 인증 상태에 따른 색상 */}
          <div 
            className={`absolute top-1 left-1 w-2 h-2 transition-all duration-300 ${
  true ? 'bg-[#00ff88]' : 'bg-gray-600/50'
            }`} 
            style={{borderRadius: '1px'}}
          ></div>
          <div 
            className={`absolute top-1 right-1 w-2 h-2 transition-all duration-300 ${
  true ? 'bg-[#00ff88]' : 'bg-gray-600/50'
            }`} 
            style={{borderRadius: '1px'}}></div>
          <div 
            className={`absolute bottom-1 left-1 w-2 h-2 transition-all duration-300 ${
  true ? 'bg-[#00ff88]' : 'bg-gray-600/50'
            }`} 
            style={{borderRadius: '1px'}}></div>
          <div 
            className={`absolute bottom-1 right-1 w-2 h-2 transition-all duration-300 ${
  true ? 'bg-[#00ff88]' : 'bg-gray-600/50'
            }`} 
            style={{borderRadius: '1px'}}></div>
        </div>

        {/* 픽셀 통계 카드들 */}
        <div className="grid grid-cols-3 gap-2">
          {/* 건수 */}
          <div className="bg-[#1a202c] border-2 border-gray-600/50 p-3 text-center relative" style={{borderRadius: '4px'}}>
            <p className="text-gray-300 text-xs font-mono mb-2">건수</p>
            <p className="text-white font-bold text-sm font-mono">
              {incomeRecords.filter(record => record.date === todayStr)
                .reduce((sum, record) => sum + record.delivery_count, 0)}건
            </p>
            {/* 픽셀 도트들 */}
            <div className="absolute top-1 left-1 w-1 h-1 bg-gray-600/50" style={{borderRadius: '1px'}}></div>
            <div className="absolute top-1 right-1 w-1 h-1 bg-gray-600/50" style={{borderRadius: '1px'}}></div>
            <div className="absolute bottom-1 left-1 w-1 h-1 bg-gray-600/50" style={{borderRadius: '1px'}}></div>
            <div className="absolute bottom-1 right-1 w-1 h-1 bg-gray-600/50" style={{borderRadius: '1px'}}></div>
          </div>

          {/* 배달금액 */}
          <div className="bg-[#1a202c] border-2 border-gray-600/50 p-3 text-center relative" style={{borderRadius: '4px'}}>
            <p className="text-gray-300 text-xs font-mono mb-2">배달금액</p>
            <p className="text-white font-bold text-sm font-mono">
              ₩{incomeRecords.filter(record => record.date === todayStr)
                .reduce((sum, record) => sum + (record.delivery_amount || 0), 0).toLocaleString()}
            </p>
            {/* 픽셀 도트들 */}
            <div className="absolute top-1 left-1 w-1 h-1 bg-gray-600/50" style={{borderRadius: '1px'}}></div>
            <div className="absolute top-1 right-1 w-1 h-1 bg-gray-600/50" style={{borderRadius: '1px'}}></div>
            <div className="absolute bottom-1 left-1 w-1 h-1 bg-gray-600/50" style={{borderRadius: '1px'}}></div>
            <div className="absolute bottom-1 right-1 w-1 h-1 bg-gray-600/50" style={{borderRadius: '1px'}}></div>
          </div>

          {/* 미션비 */}
          <div className="bg-[#1a202c] border-2 border-gray-600/50 p-3 text-center relative" style={{borderRadius: '4px'}}>
            <p className="text-gray-300 text-xs font-mono mb-2">미션비</p>
            <p className="text-white font-bold text-sm font-mono">
              ₩{incomeRecords.filter(record => record.date === todayStr)
                .reduce((sum, record) => sum + (record.mission_amount || 0), 0).toLocaleString()}
            </p>
            {/* 픽셀 도트들 */}
            <div className="absolute top-1 left-1 w-1 h-1 bg-gray-600/50" style={{borderRadius: '1px'}}></div>
            <div className="absolute top-1 right-1 w-1 h-1 bg-gray-600/50" style={{borderRadius: '1px'}}></div>
            <div className="absolute bottom-1 left-1 w-1 h-1 bg-gray-600/50" style={{borderRadius: '1px'}}></div>
            <div className="absolute bottom-1 right-1 w-1 h-1 bg-gray-600/50" style={{borderRadius: '1px'}}></div>
          </div>
        </div>
      </div>

      {/* 수입 입력 버튼 */}
      <button 
        onClick={() => setShowIncomeInputPanel(true)}
        className="w-full bg-gradient-to-r from-[#00ff88]/20 to-[#00d4ff]/20 border-2 border-[#00ff88]/50 hover:border-[#00ff88] p-2 rounded text-center hover:from-[#00ff88]/30 hover:to-[#00d4ff]/30 transition-all duration-300 shadow-lg" 
        style={{borderRadius: '8px'}}
      >
        <div className="flex flex-col items-center justify-center">
          <div className="text-[#00ff88] text-sm font-bold font-mono">수입 기록하기</div>
          <div className="text-gray-300 text-xs font-mono">오늘의 배달 수익을 입력하세요</div>
        </div>
      </button>
      
      {/* 하단 여백 - 상단과 동일하게 */}
      <div className="mb-2 sm:mb-3 lg:mb-4"></div>

      {/* HTML/CSS 기반 반응형 인벤토리 UI */}
      <InventoryUI 
        isVisible={showInventoryUI}
        onClose={() => setShowInventoryUI(false)}
        userId={userId}
      />

    </div>
  )
}
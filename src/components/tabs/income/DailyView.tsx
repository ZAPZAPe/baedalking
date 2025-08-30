'use client'

import { useState, useEffect } from 'react'
import { Platform } from '@/hooks/useAppState'
import { useServerTime } from '@/hooks/useServerTime'
import { VIEW_COLORS, PLATFORM_COLORS } from '@/data/colors'
// @ts-ignore
import domtoimage from 'dom-to-image-more'

interface DailyViewProps {
  todayRecords: any[]
  allRecords: any[]
  incomeRecords: any[]
  dailyGoal: number

  platforms: Platform[]
  setShowGoalSettings: (show: boolean) => void
  setShowIncomeInputPanel: (show: boolean) => void
  setShowPlatformSettings: (show: boolean) => void
  selectedDate?: string
  onDateChange?: (date: string) => void
  onEditRecord?: (record: any) => void
  onDeleteRecord?: (recordId: string) => void
}

export default function DailyView({
  todayRecords,
  allRecords,
  incomeRecords,
  dailyGoal,

  platforms,
  setShowGoalSettings,
  setShowIncomeInputPanel,
  setShowPlatformSettings,
  selectedDate,
  onDateChange,
  onEditRecord,
  onDeleteRecord
}: DailyViewProps) {
  // 서버 시간 사용
  const { serverTime } = useServerTime()
  
  // 서버 시간 기준으로 오늘 날짜 계산
  const today = serverTime ? new Date(serverTime.koreaDate) : new Date()
  const todayStr = serverTime ? serverTime.koreaDate : 
                   today.getFullYear() + '-' + 
                   String(today.getMonth() + 1).padStart(2, '0') + '-' + 
                   String(today.getDate()).padStart(2, '0')
  const currentDate = selectedDate || todayStr
  
  // 선택된 날짜의 데이터 계산
  const selectedRecords = allRecords.filter(record => record.date === currentDate)
  const todayTotal = selectedRecords.reduce((sum, record) => sum + (record.amount || 0) + (record.missionAmount || 0), 0)
  const todayCount = selectedRecords.reduce((sum, record) => sum + record.count, 0)
  
  // 전날 데이터 (서버 시간 기준)
  const yesterday = new Date(currentDate)
  yesterday.setDate(yesterday.getDate() - 1)
  const yesterdayStr = yesterday.getFullYear() + '-' + 
                      String(yesterday.getMonth() + 1).padStart(2, '0') + '-' + 
                      String(yesterday.getDate()).padStart(2, '0')
  const yesterdayRecords = allRecords.filter(record => record.date === yesterdayStr)
  const yesterdayTotal = yesterdayRecords.reduce((sum, record) => sum + (record.amount || 0) + (record.missionAmount || 0), 0)
  
  // 증감률
  const changeRate = yesterdayTotal > 0 ? ((todayTotal - yesterdayTotal) / yesterdayTotal * 100) : 0
  
  // 목표 달성률 계산
  const goalAchievement = dailyGoal > 0 ? (todayTotal / dailyGoal) * 100 : 0

  // 모바일 바이럴용 사진 출력 기능 (dom-to-image-more 사용)
  const captureDailyView = async () => {
    try {
      const element = document.getElementById('daily-view-container')
      if (!element) return

      // 버튼들 숨기기
      const buttons = document.querySelectorAll('button')
      buttons.forEach(btn => (btn as HTMLElement).style.display = 'none')

      // DOM 안정화를 위한 대기
      await new Promise(resolve => setTimeout(resolve, 200))

      // dom-to-image-more로 고품질 이미지 생성
      const dataUrl = await domtoimage.toPng(element, {
        quality: 1.0,
        bgcolor: '#1a202c',
        width: element.offsetWidth,
        height: element.offsetHeight,
        style: {
          'transform': 'scale(1)',
          'transform-origin': 'top left'
        }
      })

      // 버튼들 다시 표시
      buttons.forEach(btn => (btn as HTMLElement).style.display = '')

      // 모바일에서 이미지 다운로드
      const link = document.createElement('a')
      link.download = `일간수익_${currentDate.replace(/-/g, '')}.png`
      link.href = dataUrl
      
      // 모바일 브라우저 호환성을 위한 클릭 처리
      if (/iPhone|iPad|iPod|Android/i.test(navigator.userAgent)) {
        // 모바일에서는 새 창으로 이미지 표시
        const newWindow = window.open()
        if (newWindow) {
          newWindow.document.write(`
            <html>
              <head><title>일간 수익 - ${currentDate}</title></head>
              <body style="margin:0;padding:20px;background:#000;display:flex;justify-content:center;align-items:center;">
                <img src="${dataUrl}" style="max-width:100%;height:auto;" />
                <div style="position:fixed;top:10px;right:10px;background:rgba(0,0,0,0.7);color:white;padding:10px;border-radius:5px;font-family:monospace;">
                  길게 눌러서 이미지 저장하세요
                </div>
              </body>
            </html>
          `)
        }
      } else {
        // 데스크톱에서는 바로 다운로드
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      }

    } catch (error) {
      console.error('사진 출력 실패:', error)
      
      // 에러 시 버튼 복구
      const buttons = document.querySelectorAll('button')
      buttons.forEach(btn => (btn as HTMLElement).style.display = '')
      
      alert('사진 출력에 실패했습니다. 다시 시도해주세요.')
    }
  }

  return (
    <div id="daily-view-container" className="space-y-3 sm:space-y-4">
      {/* 일간 수익 - 주간과 완전히 동일한 구조 */}
      <div 
        className="bg-gradient-to-br from-[#2d3748] to-[#1a202c] rounded-xl p-4 border border-[#00ff88]/30 shadow-inner"
        style={{
          fontFamily: 'monospace',
          imageRendering: 'pixelated'
        }}
      >
        {/* 픽셀 헤더 - 일간 목표 달성률에 따른 테두리 */}
        <div 
          className="bg-gradient-to-r from-[#1a202c] to-[#2d3748] pt-4 pb-3 px-3 mb-4 border-2 relative border-[#00ff88]"
          style={{
            borderRadius: '4px',
            boxShadow: '0 0 10px #00ff8840, inset 0 0 10px #00ff8820'
          }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div>
                <h3 className="text-white font-bold text-base font-mono" style={{
                  textShadow: '2px 0 0 #000, -2px 0 0 #000, 0 2px 0 #000, 0 -2px 0 #000',
                  imageRendering: 'pixelated'
                }}>
                  일간 수익
                </h3>
                <p className="text-[#00ff88] text-xs font-mono mt-1">
                  {new Date(currentDate).toLocaleDateString('ko-KR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>

              </div>
            </div>
            <div className="flex items-center gap-3">
              {/* 날짜 이동 버튼들 */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    if (onDateChange) {
                      const prevDate = new Date(currentDate)
                      prevDate.setDate(prevDate.getDate() - 1)
                      const prevDateStr = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}-${String(prevDate.getDate()).padStart(2, '0')}`
                      onDateChange(prevDateStr)
                    }
                  }}
                  className="px-2 py-1 text-xs font-mono border-2 border-[#00ff88]/60 text-[#00ff88] hover:border-[#00ff88] transition-all duration-200"
                  style={{borderRadius: '2px'}}
                >
                  ◀
                </button>

                <button
                  onClick={() => {
                    if (onDateChange) {
                      const nextDate = new Date(currentDate)
                      nextDate.setDate(nextDate.getDate() + 1)
                      const nextDateStr = `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, '0')}-${String(nextDate.getDate()).padStart(2, '0')}`
                      onDateChange(nextDateStr)
                    }
                  }}
                  className="px-2 py-1 text-xs font-mono border-2 border-[#00ff88]/60 text-[#00ff88] hover:border-[#00ff88] transition-all duration-200"
                  style={{borderRadius: '2px'}}
                >
                  ▶
                </button>
              </div>
              
              {/* 오늘 버튼 */}
              <button
                onClick={() => {
                  const today = serverTime ? new Date(serverTime.koreaDate) : new Date()
                  const todayStr = serverTime ? serverTime.koreaDate : 
                                   `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
                  if (onDateChange) onDateChange(todayStr)
                }}
                className={`px-3 py-1 text-xs font-mono border-2 transition-all duration-200 ${
                  currentDate === (serverTime ? serverTime.koreaDate : 
                                 (() => {
                                   const today = new Date()
                                   return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
                                 })())
                    ? 'bg-[#00ff88] text-black border-[#00ff88]'
                    : 'bg-transparent text-[#00ff88] border-[#00ff88]/60 hover:border-[#00ff88]'
                }`}
                style={{borderRadius: '2px'}}
              >
                오늘
              </button>
            </div>
          </div>

          {/* 총 금액 표시 */}
          <div className="text-center mt-4">
            <div className="text-3xl font-bold font-mono text-[#00ff88]">
              ₩{(todayTotal || 0).toLocaleString()}
            </div>
            
            {/* 건당 평균금액 */}
            {todayCount > 0 && (
              <div className="mt-2 text-sm text-gray-300 font-mono">
                건당 평균: ₩{Math.round((todayTotal || 0) / (todayCount || 1)).toLocaleString()}
              </div>
            )}
            
            {/* 어제 대비 증감률 */}
            {yesterdayTotal > 0 && (
              <div className={`mt-1 text-xs font-mono flex items-center justify-center gap-1 ${
                changeRate > 0 ? 'text-[#00ff88]' : changeRate < 0 ? 'text-[#ff6b6b]' : 'text-gray-400'
              }`}>
                {changeRate > 0 ? '↑' : changeRate < 0 ? '↓' : '='}
                어제 대비 {Math.abs(changeRate).toFixed(1)}%
              </div>
            )}
            
            {/* 목표 달성률 */}
            <div className="mt-4 mb-2">
              <div className="flex items-center justify-between text-xs text-gray-300 font-mono mb-4">
                <span>일일 목표</span>
                <button
                  onClick={() => setShowGoalSettings(true)}
                  className="bg-[#00ff88]/20 border border-[#00ff88]/50 text-[#00ff88] px-3 py-1 text-xs font-mono hover:border-[#00ff88] transition-all duration-200"
                  style={{borderRadius: '2px'}}
                >
                  설정
                </button>
              </div>
              <div className="w-full bg-[#1a202c] rounded-full h-6 border border-[#00ff88]/30 relative">
                <div 
                  className="h-full rounded-full transition-all duration-500 bg-[#00ff88]"
                  style={{ width: `${Math.min(goalAchievement, 100)}%` }}
                ></div>
                
                {/* 그래프 안에 정보 표시 */}
                <div className="absolute inset-0 flex items-center justify-between px-4 text-xs font-mono">
                  <div className="text-white font-bold">
                    {goalAchievement.toFixed(1)}%
                  </div>
                  <div className="text-gray-300">
                    ₩{(todayTotal || 0).toLocaleString()} / ₩{(dailyGoal || 0).toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 픽셀 장식 요소들 - 네온그린 고정 */}
          <div className="absolute top-1 left-1 w-2 h-2 bg-[#00ff88] transition-all duration-300" style={{borderRadius: '1px'}}></div>
          <div className="absolute top-1 right-1 w-2 h-2 bg-[#00ff88] transition-all duration-300" style={{borderRadius: '1px'}}></div>
          <div className="absolute bottom-1 left-1 w-2 h-2 bg-[#00ff88] transition-all duration-300" style={{borderRadius: '1px'}}></div>
          <div className="absolute bottom-1 right-1 w-2 h-2 bg-[#00ff88] transition-all duration-300" style={{borderRadius: '1px'}}></div>
        </div>

        {/* 픽셀 통계 카드들 */}
        <div className="grid grid-cols-3 gap-2">
          {/* 건수 */}
          <div className="bg-[#1a202c] border-2 border-[#00d4ff]/30 p-3 text-center relative" style={{borderRadius: '4px'}}>
            <p className="text-gray-300 text-xs font-mono mb-1">건수</p>
            <p className="text-white font-bold text-sm font-mono">
              {todayCount}건
            </p>
            <div className="absolute top-1 left-1 w-1 h-1 bg-[#00d4ff]/50" style={{borderRadius: '1px'}}></div>
            <div className="absolute top-1 right-1 w-1 h-1 bg-[#00d4ff]/50" style={{borderRadius: '1px'}}></div>
            <div className="absolute bottom-1 left-1 w-1 h-1 bg-[#00d4ff]/50" style={{borderRadius: '1px'}}></div>
            <div className="absolute bottom-1 right-1 w-1 h-1 bg-[#00d4ff]/50" style={{borderRadius: '1px'}}></div>
          </div>

          {/* 배달금액 */}
          <div className="bg-[#1a202c] border-2 border-[#00ff88]/30 p-3 text-center relative" style={{borderRadius: '4px'}}>
            <p className="text-gray-300 text-xs font-mono mb-1">배달금액</p>
            <p className="text-white font-bold text-sm font-mono">
              ₩{(selectedRecords.reduce((sum, record) => sum + (record.amount || 0), 0) || 0).toLocaleString()}
            </p>
            <div className="absolute top-1 left-1 w-1 h-1 bg-[#00ff88]/50" style={{borderRadius: '1px'}}></div>
            <div className="absolute top-1 right-1 w-1 h-1 bg-[#00ff88]/50" style={{borderRadius: '1px'}}></div>
            <div className="absolute bottom-1 left-1 w-1 h-1 bg-[#00ff88]/50" style={{borderRadius: '1px'}}></div>
            <div className="absolute bottom-1 right-1 w-1 h-1 bg-[#00ff88]/50" style={{borderRadius: '1px'}}></div>
          </div>

          {/* 미션비 */}
          <div className="bg-[#1a202c] border-2 border-[#9c88ff]/30 p-3 text-center relative" style={{borderRadius: '4px'}}>
            <p className="text-gray-300 text-xs font-mono mb-1">미션비</p>
            <p className="text-white font-bold text-sm font-mono">
              ₩{(selectedRecords.reduce((sum, record) => sum + (record.missionAmount || 0), 0) || 0).toLocaleString()}
            </p>
            <div className="absolute top-1 left-1 w-1 h-1 bg-[#9c88ff]/50" style={{borderRadius: '1px'}}></div>
            <div className="absolute top-1 right-1 w-1 h-1 bg-[#9c88ff]/50" style={{borderRadius: '1px'}}></div>
            <div className="absolute bottom-1 left-1 w-1 h-1 bg-[#9c88ff]/50" style={{borderRadius: '1px'}}></div>
            <div className="absolute bottom-1 right-1 w-1 h-1 bg-[#9c88ff]/50" style={{borderRadius: '1px'}}></div>
          </div>
        </div>
      </div>

      {/* 플랫폼별 수익 현황 - 홈탭과 동일한 스타일 */}
      <div 
        className="bg-gradient-to-br from-[#2d3748] to-[#1a202c] rounded-xl p-4 border border-[#00ff88]/30 mb-2 sm:mb-3 lg:mb-4 flex-shrink-0"
        style={{
          fontFamily: 'monospace',
          imageRendering: 'pixelated'
        }}
      >
        {/* 픽셀 헤더 - 홈메뉴 랭킹보기와 동일한 스타일 */}
        <div 
          className="w-full bg-gradient-to-r from-[#1a202c] to-[#2d3748] border-2 border-[#ffd93d]/50 hover:border-[#ffd93d] text-white font-mono py-3 px-4 transition-all duration-200 relative mb-4"
          style={{
            borderRadius: '4px',
            fontFamily: 'monospace',
            imageRendering: 'pixelated'
          }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div>
                <h3 className="text-white font-bold text-base font-mono" style={{
                  imageRendering: 'pixelated'
                }}>
                  플랫폼별 수익 현황
                </h3>
                <p className="text-gray-400 text-xs font-mono tracking-wider">PLATFORM INCOME</p>
              </div>
            </div>
            <button
              onClick={() => setShowPlatformSettings(true)}
              className="bg-[#ffd93d]/20 border border-[#ffd93d]/50 text-[#ffd93d] px-2 py-1 text-xs font-mono hover:border-[#ffd93d] transition-all duration-200"
              style={{borderRadius: '2px'}}
            >
              설정
            </button>
          </div>
          
          {/* 픽셀 도트들 - 홈메뉴와 동일한 스타일 */}
          <div className="absolute top-1 left-1 w-1 h-1 bg-[#ffd93d]/60" style={{borderRadius: '1px'}}></div>
          <div className="absolute top-1 right-1 w-1 h-1 bg-[#ffd93d]/60" style={{borderRadius: '1px'}}></div>
          <div className="absolute bottom-1 left-1 w-1 h-1 bg-[#ffd93d]/60" style={{borderRadius: '1px'}}></div>
          <div className="absolute bottom-1 right-1 w-1 h-1 bg-[#ffd93d]/60" style={{borderRadius: '1px'}}></div>
        </div>

        {/* 플랫폼별 상세 정보 - 카드 형식으로 통일 */}
        {(() => {
          // 활성화된 플랫폼만 필터링
          const activePlatforms = platforms.filter(p => p.isActive).map(p => p.id)
          const platformRecords = selectedRecords.filter(r => activePlatforms.includes(r.platform))
          if (platformRecords.length > 0) {
            return (
              <div className="space-y-3">
                {platformRecords.map((record, index) => {
                  const platformConfig = {
                    'baemin': { name: '배민', icon: '/baemin-logo.svg', color: '#00d4ff' },
                    'coupang': { name: '쿠팡', icon: '/coupang-logo.svg', color: '#ffd93d' }
                  }
                  const config = platformConfig[record.platform as keyof typeof platformConfig] || 
                                { name: record.platform, icon: '⚪', color: '#9c88ff' }
                   
                  return (
                    <div 
                      key={index} 
                      className="bg-gradient-to-br from-[#2d3748] to-[#1a202c] rounded-xl border-2 relative"
                      style={{
                        borderColor: `${config.color}50`,
                        fontFamily: 'monospace',
                        imageRendering: 'pixelated'
                      }}
                    >
                      <div className="p-4">
                        {/* 플랫폼 헤더 */}
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center border-2 overflow-hidden"
                                 style={{
                                   backgroundColor: `${config.color}20`,
                                   borderColor: `${config.color}60`
                                 }}>
                              <img 
                                src={config.icon} 
                                alt={config.name}
                                className="w-6 h-6 object-contain"
                                style={{ imageRendering: 'pixelated' }}
                              />
                            </div>
                            <div>
                              <div className="text-white font-bold text-sm font-mono">{config.name}</div>
                              <div className="text-xs text-gray-400 font-mono tracking-wider">DELIVERY RECORD</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="px-3 py-1 rounded-lg border font-bold text-sm font-mono"
                                 style={{
                                   backgroundColor: `${config.color}20`,
                                   borderColor: `${config.color}60`,
                                   color: config.color
                                 }}>
                              ₩{((record.amount || 0) + (record.missionAmount || 0)).toLocaleString()}
                            </div>
                            <button
                              onClick={() => {
                                if (confirm('이 수입 기록을 삭제하시겠습니까?')) {
                                  if (onDeleteRecord) {
                                    onDeleteRecord(record.id)
                                  }
                                }
                              }}
                              className="px-2 py-1 rounded-lg border border-[#ff6b6b]/50 hover:border-[#ff6b6b] text-[#ff6b6b] hover:text-white text-xs font-bold font-mono transition-all duration-200 hover:scale-105"
                              style={{borderRadius: '4px'}}
                            >
                              🗑️
                            </button>
                          </div>
                        </div>

                        {/* 상세 정보 그리드 */}
                        <div className="grid grid-cols-3 gap-3 mb-3">
                          {/* 건수 */}
                          <div className="bg-[#1a202c]/50 p-3 rounded-lg text-center border"
                               style={{borderColor: `${config.color}30`}}>
                            <div className="text-white text-xs font-mono font-bold mb-1">건수</div>
                            <div className="text-sm font-bold font-mono"
                                 style={{color: config.color}}>
                              {record.count}건
                            </div>
                          </div>

                          {/* 배달 금액 */}
                          <div className="bg-[#1a202c]/50 p-3 rounded-lg text-center border"
                               style={{borderColor: `${config.color}30`}}>
                            <div className="text-white text-xs font-mono font-bold mb-1">배달금액</div>
                            <div className="text-sm font-bold font-mono text-white">
                              ₩{(record.amount || 0).toLocaleString()}
                            </div>
                          </div>

                          {/* 미션비 */}
                          <div className="bg-[#1a202c]/50 p-3 rounded-lg text-center border"
                               style={{borderColor: `${config.color}30`}}>
                            <div className="text-white text-xs font-mono font-bold mb-1">미션비</div>
                            <div className="text-sm font-bold font-mono"
                                 style={{color: config.color}}>
                              ₩{(record.missionAmount || 0).toLocaleString()}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )
          }
          return null
        })()}
      </div>

      {/* 최근 7일 트렌드 - 홈탭과 동일한 스타일 */}
      <div
        className="bg-gradient-to-br from-[#2d3748] to-[#1a202c] rounded-xl p-4 border border-[#9c88ff]/30 mb-2 sm:mb-3 lg:mb-4 flex-shrink-0"
        style={{
          fontFamily: 'monospace',
          imageRendering: 'pixelated'
        }}
      >
        {/* 픽셀 헤더 - 홈메뉴 랭킹보기와 동일한 스타일 */}
        <div
          className="w-full bg-gradient-to-r from-[#1a202c] to-[#2d3748] border-2 border-[#9c88ff]/50 hover:border-[#9c88ff] text-white font-mono py-3 px-4 transition-all duration-200 relative mb-4"
          style={{
            borderRadius: '4px',
            fontFamily: 'monospace',
            imageRendering: 'pixelated'
          }}
        >
          <div className="flex items-center justify-center">
            <h3 className="text-white font-bold text-base font-mono" style={{
              imageRendering: 'pixelated'
            }}>
              7일 트렌드
            </h3>
          </div>

          {/* 픽셀 도트들 - 홈메뉴와 동일한 스타일 */}
          <div className="absolute top-1 left-1 w-1 h-1 bg-[#9c88ff]/60" style={{borderRadius: '1px'}}></div>
          <div className="absolute top-1 right-1 w-1 h-1 bg-[#9c88ff]/60" style={{borderRadius: '1px'}}></div>
          <div className="absolute bottom-1 left-1 w-1 h-1 bg-[#9c88ff]/60" style={{borderRadius: '1px'}}></div>
          <div className="absolute bottom-1 right-1 w-1 h-1 bg-[#9c88ff]/60" style={{borderRadius: '1px'}}></div>
        </div>

        {/* 7일 트렌드 차트 */}
        <div className="grid grid-cols-7 gap-1">
          {[...Array(7)].map((_, i) => {
            const date = new Date(currentDate)
            date.setDate(date.getDate() - (6 - i))
            const dateStr = date.toISOString().split('T')[0]
            const dayRecords = allRecords.filter(r => r.date === dateStr)
            const dayTotal = dayRecords.reduce((sum, r) => sum + (r.amount || 0) + (r.missionAmount || 0), 0)
            const maxHeight = 60
            const height = dayTotal > 0 ? Math.max((dayTotal / 100000) * maxHeight, 10) : 0
            
            // 금액을 만원 단위로 변환 (소수점 1자리)
            const amountInMan = dayTotal > 0 ? (dayTotal / 10000).toFixed(1) : '-'
            
            return (
              <div key={i} className="flex flex-col items-center">
                <div className="w-full bg-[#1a202c] rounded-t relative" style={{ height: `${maxHeight}px` }}>
                  <div 
                    className="w-full bg-gradient-to-t from-[#00ff88] to-[#00d4ff] rounded-t transition-all duration-300"
                    style={{ height: `${height}px`, marginTop: `${maxHeight - height}px` }}
                  ></div>
                   
                  {/* 금액 표시 (그래프 안에) */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-white text-xs font-mono font-bold">
                      {amountInMan}
                    </div>
                  </div>
                </div>
                <div className="text-xs text-gray-400 font-mono mt-1">
                  {date.getDate()}
                </div>
              </div>
            )
          })}
        </div>
         
        {/* 선택된 날짜 금액 비교 멘트 */}
        <div className="text-center mt-3">
          {(() => {
            const selectedTotal = selectedRecords.reduce((sum, r) => sum + (r.amount || 0) + (r.missionAmount || 0), 0)
            const yesterdayTotal = yesterdayRecords.reduce((sum, r) => sum + (r.amount || 0) + (r.missionAmount || 0), 0)
            const weekAverage = incomeRecords
              .filter(r => {
                const recordDate = new Date(r.date)
                const weekAgo = new Date(currentDate)
                weekAgo.setDate(weekAgo.getDate() - 7)
                const currentDateObj = new Date(currentDate)
                return recordDate >= weekAgo && recordDate < currentDateObj
              })
              .reduce((sum, r) => sum + (r.amount || 0) + (r.missionAmount || 0), 0) / 6
            
            let message = ''
            let color = 'text-gray-400'
            
            // 선택된 날짜의 수입이 없으면 간단한 메시지 표시
            if (selectedTotal === 0) {
              message = currentDate === todayStr ? '오늘의 수입을 기록해보세요! 📝' : '해당 날짜의 수입이 없습니다'
              color = 'text-[#9c88ff]'
            } else if (yesterdayTotal > 0) {
              // 선택된 날짜 수입이 있고 전날과 비교 가능한 경우
              const change = selectedTotal - yesterdayTotal
              if (change > 0) {
                message = `어제보다 ${(change / 10000).toFixed(1)}만원 더 벌었습니다! 🚀`
                color = 'text-[#00ff88]'
              } else if (change < 0) {
                message = `어제보다 ${Math.abs(change / 10000).toFixed(1)}만원 적게 벌었습니다`
                color = 'text-[#ff6b6b]'
              } else {
                message = '어제와 동일한 수입입니다'
                color = 'text-[#00d4ff]'
              }
            } else if (weekAverage > 0) {
              // 주평균과 비교
              const diff = selectedTotal - weekAverage
              if (diff > 0) {
                message = `주평균보다 ${(diff / 10000).toFixed(1)}만원 더 벌었습니다! 💪`
                color = 'text-[#00ff88]'
              } else if (diff < 0) {
                message = `주평균보다 ${Math.abs(diff / 10000).toFixed(1)}만원 적게 벌었습니다`
                color = 'text-[#ff6b6b]'
              } else {
                message = '주평균과 비슷한 수입입니다'
                color = 'text-[#00d4ff]'
              }
            } else {
              // 기본 메시지
              message = currentDate === todayStr ? '오늘의 수입을 기록해보세요! 📝' : '해당 날짜의 수입을 확인해보세요'
              color = 'text-[#9c88ff]'
            }
            
            return (
              <div className={`text-sm font-mono ${color}`}>
                {message}
              </div>
            )
          })()}
        </div>
      </div>

      {/* 저장 버튼 */}
      <button
        onClick={captureDailyView}
        className="w-full bg-gradient-to-r from-[#1a202c] to-[#2d3748] border-2 border-[#00ff88]/50 hover:border-[#00ff88] text-white font-mono py-3 px-4 transition-all duration-200 relative"
        style={{
          borderRadius: '4px',
          fontFamily: 'monospace',
          imageRendering: 'pixelated'
        }}
      >
        <div className="flex items-center justify-center">
                      <div className="text-center">
              <p className="text-base font-bold">📸 일간 수익 캡처 저장</p>
            </div>
        </div>
        <div className="absolute top-1 left-1 w-1 h-1 bg-[#00ff88]/60" style={{borderRadius: '1px'}}></div>
        <div className="absolute top-1 right-1 w-1 h-1 bg-[#00ff88]/60" style={{borderRadius: '1px'}}></div>
        <div className="absolute bottom-1 left-1 w-1 h-1 bg-[#00ff88]/60" style={{borderRadius: '1px'}}></div>
        <div className="absolute bottom-1 right-1 w-1 h-1 bg-[#00ff88]/60" style={{borderRadius: '1px'}}></div>
      </button>

      {/* 수입 입력 버튼 - 홈탭과 동일한 스타일 */}
      <button
        onClick={() => setShowIncomeInputPanel(true)}
        className="w-full bg-gradient-to-r from-[#1a202c] to-[#2d3748] border-2 border-[#00d4ff]/50 hover:border-[#00d4ff] text-white font-mono py-3 px-4 transition-all duration-200 relative"
        style={{
          borderRadius: '4px',
          fontFamily: 'monospace',
          imageRendering: 'pixelated'
        }}
      >
        <div className="flex items-center justify-center">
          <div className="text-center">
            <p className="text-base font-bold">수입 기록하기</p>
            <p className="text-xs text-gray-300">오늘의 배달 수익을 입력하세요</p>
          </div>
        </div>
        <div className="absolute top-1 left-1 w-1 h-1 bg-[#00d4ff]/60" style={{borderRadius: '1px'}}></div>
        <div className="absolute top-1 right-1 w-1 h-1 bg-[#00d4ff]/60" style={{borderRadius: '1px'}}></div>
        <div className="absolute bottom-1 left-1 w-1 h-1 bg-[#00d4ff]/60" style={{borderRadius: '1px'}}></div>
        <div className="absolute bottom-1 right-1 w-1 h-1 bg-[#00d4ff]/60" style={{borderRadius: '1px'}}></div>
      </button>
    </div>
  )
}


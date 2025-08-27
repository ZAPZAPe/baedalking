'use client'

import { useState } from 'react'
import PlatformSettingsPanel from '@/components/modals/PlatformSettingsPanel'
import GoalSettingsPanel from '@/components/modals/GoalSettingsPanel'
import { Platform } from '@/hooks/useAppState'
import DailyView from './income/DailyView'
import WeeklyView from './income/WeeklyView'
import MonthlyView from './income/MonthlyView'

interface IncomeTabProps {
  incomeRecords: any[]
  totalIncome: number
  getTotalIncomeByPlatform: (platform: string) => number
  setShowIncomeInputPanel: (show: boolean) => void
  setShowIncomePanel: (show: boolean) => void
  isVerified: boolean
  onAddIncome?: (record: any) => void
  platforms: Platform[]
  togglePlatform: (platformId: string) => void
  addCustomPlatform: (name: string) => void
  removeCustomPlatform: (platformId: string) => void
  dailyGoal: number
  weeklyGoal: number
  monthlyGoal: number
  updateGoals: (daily: number, weekly: number, monthly: number) => void
}

export default function IncomeTab({
  incomeRecords,
  totalIncome,
  getTotalIncomeByPlatform,
  setShowIncomeInputPanel,
  setShowIncomePanel,
  isVerified,
  onAddIncome,
  platforms,
  togglePlatform,
  addCustomPlatform,
  removeCustomPlatform,
  dailyGoal,
  weeklyGoal,
  monthlyGoal,
  updateGoals
}: IncomeTabProps) {
  const [activeView, setActiveView] = useState<'daily' | 'weekly' | 'monthly'>('daily')
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [selectedWeek, setSelectedWeek] = useState<string | null>(null)
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [showPlatformSettings, setShowPlatformSettings] = useState(false)
  const [showGoalSettings, setShowGoalSettings] = useState(false)

  // 오늘 날짜 (로컬 시간 기준)
  const today = new Date()
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
  
  // 실제 수입 기록만 사용 (테스트 데이터 제거)
  const allRecords = incomeRecords
  
  // 선택된 날짜 또는 오늘 날짜
  const currentDate = selectedDate || todayStr
  
  // 선택된 날짜의 기록들
  const todayRecords = allRecords.filter(record => record.date === currentDate)
  

  
  // 오늘의 총 수입 계산 (amount 필드 사용 - 배달금액+미션비 합계)
  const todayTotal = todayRecords.reduce((sum, record) => sum + (record.amount || 0) + (record.missionAmount || 0), 0)
  const todayCount = todayRecords.reduce((sum, record) => sum + record.count, 0)
  const todayDelivery = todayRecords.reduce((sum, record) => sum + (record.amount || 0), 0)
  const todayMission = todayRecords.reduce((sum, record) => sum + (record.missionAmount || 0), 0)
  
  // 어제 데이터
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`
  const yesterdayRecords = allRecords.filter(record => record.date === yesterdayStr)
  const yesterdayTotal = yesterdayRecords.reduce((sum, record) => sum + (record.amount || 0) + (record.missionAmount || 0), 0)
  
  // 증감률
  const changeRate = yesterdayTotal > 0 ? ((todayTotal - yesterdayTotal) / yesterdayTotal * 100) : 0
  
  // 목표 달성률 계산
  const goalAchievement = (todayTotal / dailyGoal) * 100

  // 일간 뷰 렌더링
  const renderDailyView = () => (
    <DailyView
      todayRecords={todayRecords}
      allRecords={allRecords}
      incomeRecords={incomeRecords}
      dailyGoal={dailyGoal}
      isVerified={isVerified}
      platforms={platforms}
      setShowGoalSettings={setShowGoalSettings}
      setShowIncomeInputPanel={setShowIncomeInputPanel}
      setShowPlatformSettings={setShowPlatformSettings}
      selectedDate={selectedDate || undefined}
      onDateChange={setSelectedDate}
    />
  )

  // 주간 뷰 렌더링
  const renderWeeklyView = () => (
    <WeeklyView
      allRecords={allRecords}
      weeklyGoal={weeklyGoal}
      dailyGoal={dailyGoal}
      platforms={platforms}
      setShowGoalSettings={setShowGoalSettings}
      setShowPlatformSettings={setShowPlatformSettings}
      setSelectedDate={setSelectedDate}
      setShowDetailModal={setShowDetailModal}
      selectedWeek={selectedWeek || undefined}
      onWeekChange={setSelectedWeek}
    />
  )

  // 월간 뷰 렌더링
  const renderMonthlyView = () => (
    <MonthlyView
      allRecords={allRecords}
      monthlyGoal={monthlyGoal}
      dailyGoal={dailyGoal}
      setShowDetailModal={setShowDetailModal}
      setShowGoalSettings={setShowGoalSettings}
      setSelectedDate={setSelectedDate}
      selectedMonth={selectedMonth || undefined}
      onMonthChange={setSelectedMonth}
    />
  )

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* 뷰 선택 탭 - 홈화면 스타일 */}
      <div className="bg-gradient-to-br from-[#1a4a2e]/90 to-[#1a1a2e]/90 backdrop-blur-lg rounded-2xl p-2 sm:p-3 border border-[#00ff88]/20 shadow-2xl">
        <div className="flex gap-2">
          {[
            { id: 'daily', label: '일간' },
            { id: 'weekly', label: '주간' },
            { id: 'monthly', label: '월간' }
          ].map((view) => (
            <button
              key={view.id}
              onClick={() => setActiveView(view.id as any)}
              className={`flex-1 py-2.5 px-3 font-mono transition-all duration-200 border-2 relative ${
                activeView === view.id
                  ? 'bg-gradient-to-r from-[#2d3748] to-[#1a202c] shadow-lg'
                  : 'bg-[#1a202c]/60 hover:bg-[#1a202c]/80'
              } ${
                activeView === view.id
                  ? view.id === 'daily' ? 'border-[#00ff88]/60' :
                    view.id === 'weekly' ? 'border-[#ff6b6b]/60' :
                    'border-[#ffd93d]/60'
                  : 'border-gray-600/30'
              }`}
              style={{borderRadius: '4px'}}
            >
              <div className="text-center">
                <div className={`text-sm font-bold ${
                  activeView === view.id
                    ? view.id === 'daily' ? 'text-[#00ff88]' :
                      view.id === 'weekly' ? 'text-[#ff6b6b]' :
                      'text-[#ffd93d]'
                    : 'text-gray-300'
                }`}>
                  {view.label}
                </div>
              </div>
              
              {/* 픽셀 도트들 */}
              <div className={`absolute top-1 left-1 w-1 h-1 ${
                activeView === view.id
                  ? view.id === 'daily' ? 'bg-[#00ff88]/80' :
                    view.id === 'weekly' ? 'bg-[#ff6b6b]/80' :
                    'bg-[#ffd93d]/80'
                  : 'bg-gray-600/60'
              }`} style={{borderRadius: '1px'}}></div>
              <div className={`absolute top-1 right-1 w-1 h-1 ${
                activeView === view.id
                  ? view.id === 'daily' ? 'bg-[#00ff88]/80' :
                    view.id === 'weekly' ? 'bg-[#ff6b6b]/80' :
                    'bg-[#ffd93d]/80'
                  : 'bg-gray-600/60'
              }`} style={{borderRadius: '1px'}}></div>
              <div className={`absolute bottom-1 left-1 w-1 h-1 ${
                activeView === view.id
                  ? view.id === 'daily' ? 'bg-[#00ff88]/80' :
                    view.id === 'weekly' ? 'bg-[#ffd93d]/80' :
                    'bg-[#ffd93d]/80'
                  : 'bg-gray-600/60'
              }`} style={{borderRadius: '1px'}}></div>
              <div className={`absolute bottom-1 right-1 w-1 h-1 ${
                activeView === view.id
                  ? view.id === 'daily' ? 'bg-[#00ff88]/80' :
                    view.id === 'weekly' ? 'bg-[#ff6b6b]/80' :
                    'bg-[#ffd93d]/80'
                  : 'bg-gray-600/60'
              }`} style={{borderRadius: '1px'}}></div>
            </button>
          ))}
        </div>
      </div>

      {/* 뷰별 내용 렌더링 */}
      {activeView === 'daily' && renderDailyView()}
      {activeView === 'weekly' && renderWeeklyView()}
      {activeView === 'monthly' && renderMonthlyView()}

      {/* 플랫폼 설정 모달 */}
      <PlatformSettingsPanel
        isOpen={showPlatformSettings}
        onClose={() => setShowPlatformSettings(false)}
        platforms={platforms}
        onTogglePlatform={togglePlatform}
        onAddCustomPlatform={addCustomPlatform}
        onRemoveCustomPlatform={removeCustomPlatform}
      />

      {/* 상세 정보 모달 */}
      {showDetailModal && selectedDate && (
        <div 
          className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto"
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
          }}
          onTouchStart={(e) => e.stopPropagation()}
          onTouchEnd={(e) => e.stopPropagation()}
        >
          <div 
            className="w-full max-w-sm sm:max-w-md bg-gradient-to-b from-[#0a0a23] via-[#16213e] to-[#1a1a2e] border-2 sm:border-4 border-[#00ff88]/50 shadow-2xl relative max-h-[calc(100vh-32px)] overflow-y-auto"
            style={{
              borderRadius: '6px',
              fontFamily: 'monospace',
              imageRendering: 'pixelated',
              boxShadow: '0 0 20px rgba(0, 255, 136, 0.2), inset 0 0 15px rgba(0, 255, 136, 0.05)'
            }}
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
            }}
            onTouchStart={(e) => e.stopPropagation()}
            onTouchEnd={(e) => e.stopPropagation()}
          >
            
            {/* 네온 글로우 테두리 */}
            <div className="absolute -inset-1 bg-gradient-to-r from-[#00ff88]/20 via-[#00d4ff]/20 to-[#00ff88]/20 blur-sm -z-10" 
                 style={{borderRadius: '12px'}}></div>
            
            {/* 헤더 - 게임 스타일 반응형 */}
            <div className="bg-gradient-to-r from-[#0a0a23] to-[#16213e] p-3 sm:p-4 border-b-2 border-[#00ff88]/30 relative">
              {/* 상단 장식 라인 */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#00ff88]/60 to-transparent"></div>
              
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2 sm:gap-3">
                  {/* 픽셀 아이콘 */}
                  <div className="w-5 h-5 sm:w-6 sm:h-6 bg-gradient-to-br from-[#00d4ff] to-[#9c88ff] border border-[#00ff88]" 
                       style={{borderRadius: '3px'}}>
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="w-2 h-2 sm:w-3 sm:h-3 bg-white" style={{borderRadius: '1px'}}></div>
                    </div>
                  </div>
                  <h3 className="text-[#00ff88] font-bold text-sm sm:text-lg font-mono tracking-wide" 
                      style={{textShadow: '0 0 8px rgba(0, 255, 136, 0.5)'}}>
                    INCOME DETAIL
                  </h3>
                </div>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-br from-[#ff6b6b]/20 to-[#ff4757]/20 border border-[#ff6b6b]/50 hover:border-[#ff6b6b] text-[#ff6b6b] hover:text-[#ff4757] font-bold transition-all duration-200 hover:scale-110 text-sm sm:text-base"
                  style={{borderRadius: '4px'}}
                >
                  ✕
                </button>
              </div>
              
              {/* 하단 장식 라인 */}
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#00ff88]/40 to-transparent"></div>
            </div>

            <div className="p-3 sm:p-4 space-y-3 sm:space-y-4 relative">
              {/* 배경 패턴 */}
              <div className="absolute inset-0 opacity-5">
                <div className="w-full h-full" 
                     style={{
                       backgroundImage: `radial-gradient(circle, #00ff88 1px, transparent 1px)`,
                       backgroundSize: '12px 12px'
                     }}></div>
              </div>

              {/* 선택된 날짜의 수익 정보 - 오늘의 수익과 동일한 스타일 */}
              {(() => {
                const dayRecords = allRecords.filter(record => record.date === selectedDate)
                const dayTotal = dayRecords.reduce((sum, record) => sum + (record.amount || 0) + (record.missionAmount || 0), 0)
                const dayCount = dayRecords.reduce((sum, record) => sum + record.count, 0)
                const dayDelivery = dayRecords.reduce((sum, record) => sum + (record.amount || 0), 0)
                const dayMission = dayRecords.reduce((sum, record) => sum + (record.missionAmount || 0), 0)
                
                return (
                  <div className="space-y-4">
                    {/* 날짜 표시 */}
                    <div className="bg-gradient-to-r from-[#00d4ff]/20 to-[#9c88ff]/20 border border-[#00d4ff]/50 p-2 sm:p-3 relative"
                         style={{borderRadius: '4px'}}>
                      <h4 className="text-[#00d4ff] text-center font-bold text-xs sm:text-sm font-mono tracking-wide mb-2 sm:mb-3" 
                          style={{textShadow: '0 0 6px rgba(0, 212, 255, 0.5)'}}>
                        {new Date(selectedDate).toLocaleDateString('ko-KR', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </h4>
                      {/* 모서리 픽셀 도트 */}
                      <div className="absolute top-1 left-1 w-1 h-1 bg-[#00d4ff]" style={{borderRadius: '1px'}}></div>
                      <div className="absolute top-1 right-1 w-1 h-1 bg-[#00d4ff]" style={{borderRadius: '1px'}}></div>
                      <div className="absolute bottom-1 left-1 w-1 h-1 bg-[#00d4ff]" style={{borderRadius: '1px'}}></div>
                      <div className="absolute bottom-1 right-1 w-1 h-1 bg-[#00d4ff]" style={{borderRadius: '1px'}}></div>
                    </div>

                    {/* 총 수익 표시 */}
                    <div className="bg-gradient-to-r from-[#00ff88]/20 to-[#00d4ff]/20 border border-[#00ff88]/50 p-3 sm:p-4 text-center relative"
                         style={{borderRadius: '4px'}}>
                      <div className="text-2xl sm:text-3xl font-bold font-mono text-[#00ff88]" 
                           style={{textShadow: '0 0 8px rgba(0, 255, 136, 0.5)'}}>
                        ₩{dayTotal.toLocaleString()}
                      </div>
                      {dayCount > 0 && (
                        <div className="mt-2 text-xs sm:text-sm text-gray-300 font-mono">
                          건당 평균: ₩{Math.round(dayTotal / dayCount).toLocaleString()}
                        </div>
                      )}
                      {/* 모서리 픽셀 도트 */}
                      <div className="absolute top-1 left-1 w-1 h-1 bg-[#00ff88]" style={{borderRadius: '1px'}}></div>
                      <div className="absolute top-1 right-1 w-1 h-1 bg-[#00ff88]" style={{borderRadius: '1px'}}></div>
                      <div className="absolute bottom-1 left-1 w-1 h-1 bg-[#00ff88]" style={{borderRadius: '1px'}}></div>
                      <div className="absolute bottom-1 right-1 w-1 h-1 bg-[#00ff88]" style={{borderRadius: '1px'}}></div>
                    </div>

                    {/* 통계 카드들 */}
                    <div className="grid grid-cols-3 gap-2 sm:gap-3">
                      {/* 건수 */}
                      <div className="bg-gradient-to-r from-[#00d4ff]/20 to-[#9c88ff]/20 border border-[#00d4ff]/50 p-2 sm:p-3 text-center relative"
                           style={{borderRadius: '4px'}}>
                        <p className="text-[#00d4ff] text-xs sm:text-sm font-bold font-mono mb-1" 
                           style={{textShadow: '0 0 6px rgba(0, 212, 255, 0.5)'}}>건수</p>
                        <p className="text-white font-bold text-sm sm:text-lg font-mono">
                          {dayCount}건
                        </p>
                        <div className="absolute top-1 left-1 w-1 h-1 bg-[#00d4ff]" style={{borderRadius: '1px'}}></div>
                        <div className="absolute top-1 right-1 w-1 h-1 bg-[#00d4ff]" style={{borderRadius: '1px'}}></div>
                        <div className="absolute bottom-1 left-1 w-1 h-1 bg-[#00d4ff]" style={{borderRadius: '1px'}}></div>
                        <div className="absolute bottom-1 right-1 w-1 h-1 bg-[#00d4ff]" style={{borderRadius: '1px'}}></div>
                      </div>

                      {/* 배달금액 */}
                      <div className="bg-gradient-to-r from-[#00ff88]/20 to-[#00d4ff]/20 border border-[#00ff88]/50 p-2 sm:p-3 text-center relative"
                           style={{borderRadius: '4px'}}>
                        <p className="text-[#00ff88] text-xs sm:text-sm font-bold font-mono mb-1" 
                           style={{textShadow: '0 0 6px rgba(0, 255, 136, 0.5)'}}>배달금액</p>
                        <p className="text-white font-bold text-sm sm:text-lg font-mono">
                          ₩{dayDelivery.toLocaleString()}
                        </p>
                        <div className="absolute top-1 left-1 w-1 h-1 bg-[#00ff88]" style={{borderRadius: '1px'}}></div>
                        <div className="absolute top-1 right-1 w-1 h-1 bg-[#00ff88]" style={{borderRadius: '1px'}}></div>
                        <div className="absolute bottom-1 left-1 w-1 h-1 bg-[#00ff88]" style={{borderRadius: '1px'}}></div>
                        <div className="absolute bottom-1 right-1 w-1 h-1 bg-[#00ff88]" style={{borderRadius: '1px'}}></div>
                      </div>

                      {/* 미션비 */}
                      <div className="bg-gradient-to-r from-[#9c88ff]/20 to-[#00d4ff]/20 border border-[#9c88ff]/50 p-2 sm:p-3 text-center relative"
                           style={{borderRadius: '4px'}}>
                        <p className="text-[#9c88ff] text-xs sm:text-sm font-bold font-mono mb-1" 
                           style={{textShadow: '0 0 6px rgba(156, 136, 255, 0.5)'}}>미션비</p>
                        <p className="text-white font-bold text-sm sm:text-lg font-mono">
                          ₩{dayMission.toLocaleString()}
                        </p>
                        <div className="absolute top-1 left-1 w-1 h-1 bg-[#9c88ff]" style={{borderRadius: '1px'}}></div>
                        <div className="absolute top-1 right-1 w-1 h-1 bg-[#9c88ff]" style={{borderRadius: '1px'}}></div>
                        <div className="absolute bottom-1 left-1 w-1 h-1 bg-[#9c88ff]" style={{borderRadius: '1px'}}></div>
                        <div className="absolute bottom-1 right-1 w-1 h-1 bg-[#9c88ff]" style={{borderRadius: '1px'}}></div>
                      </div>
                    </div>

                    {/* 플랫폼별 상세 정보 - 카드 형식으로 통일 */}
                    {dayRecords.length > 0 && (
                      <div className="space-y-3">
                        <h4 className="text-white font-bold text-sm sm:text-base font-mono tracking-wide text-center">PLATFORM DETAILS</h4>
                        {dayRecords.map((record, index) => {
                          const platformConfig = {
                            'baemin': { name: '배민', icon: '/baemin-logo.svg', color: '#00d4ff' },
                            'coupang': { name: '쿠팡', icon: '/coupang-logo.svg', color: '#ff6b6b' }
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
                                      <div className="text-xs text-gray-400 font-mono">Delivery Record</div>
                                    </div>
                                  </div>
                                  <div className="px-3 py-1 rounded-lg border font-bold text-sm font-mono"
                                       style={{
                                         backgroundColor: `${config.color}20`,
                                         borderColor: `${config.color}60`,
                                         color: config.color
                                       }}>
                                    ₩{(record.amount + record.missionAmount).toLocaleString()}
                                  </div>
                                </div>

                                {/* 상세 정보 그리드 */}
                                <div className="grid grid-cols-3 gap-3">
                                  {/* 건수 */}
                                  <div className="bg-[#1a202c]/50 p-3 rounded-lg text-center border"
                                       style={{borderColor: `${config.color}30`}}>
                                    <div className="text-xs text-gray-400 font-mono mb-1">건수</div>
                                    <div className="text-sm font-bold font-mono"
                                         style={{color: config.color}}>
                                      {record.count}건
                                    </div>
                                  </div>

                                  {/* 배달 금액 */}
                                  <div className="bg-[#1a202c]/50 p-3 rounded-lg text-center border"
                                       style={{borderColor: `${config.color}30`}}>
                                    <div className="text-xs text-gray-400 font-mono mb-1">배달금액</div>
                                    <div className="text-sm font-bold font-mono text-white">
                                      ₩{record.amount.toLocaleString()}
                                    </div>
                                  </div>

                                  {/* 미션비 */}
                                  <div className="bg-[#1a202c]/50 p-3 rounded-lg text-center border"
                                       style={{borderColor: `${config.color}30`}}>
                                    <div className="text-xs text-gray-400 font-mono mb-1">미션비</div>
                                    <div className="text-sm font-bold font-mono"
                                         style={{color: config.color}}>
                                      ₩{record.missionAmount.toLocaleString()}
                                    </div>
                                  </div>
                                </div>


                              </div>

                              {/* 픽셀 장식 요소들 */}
                              <div className="absolute top-1 left-1 w-1 h-1 rounded-sm"
                                   style={{backgroundColor: config.color}}></div>
                              <div className="absolute top-1 right-1 w-1 h-1 rounded-sm"
                                   style={{backgroundColor: config.color}}></div>
                              <div className="absolute bottom-1 left-1 w-1 h-1 rounded-sm"
                                   style={{backgroundColor: config.color}}></div>
                              <div className="absolute bottom-1 right-1 w-1 h-1 rounded-sm"
                                   style={{backgroundColor: config.color}}></div>
                            </div>
                          )
                        })}
                      </div>
                    )}

                    {/* 버튼들 - CHARACTER EDIT 스타일로 통일 */}
                    <div className="flex gap-2 sm:gap-3 pt-4">
                      <button
                        onClick={() => {
                          setShowDetailModal(false)
                          // 수정 모드로 전환 (향후 구현)
                          console.log('수정 모드로 전환:', selectedDate)
                        }}
                        className="flex-1 bg-gradient-to-r from-[#00ff88]/20 to-[#00d4ff]/20 border-2 border-[#00ff88]/50 hover:border-[#00ff88] text-[#00ff88] hover:text-white font-bold py-3 sm:py-4 transition-all duration-300 hover:scale-105 hover:shadow-lg relative font-mono tracking-wide"
                        style={{
                          borderRadius: '6px',
                          textShadow: '0 0 6px rgba(0, 255, 136, 0.5)',
                          boxShadow: '0 0 15px rgba(0, 255, 136, 0.2)'
                        }}
                      >
                        <div className="flex items-center justify-center gap-1.5 sm:gap-2">
                          <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-[#00ff88] border border-white" style={{borderRadius: '1px'}}></div>
                          <span className="text-sm sm:text-base">EDIT</span>
                          <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-[#00ff88] border border-white" style={{borderRadius: '1px'}}></div>
                        </div>
                        
                        {/* 버튼 모서리 픽셀 도트 */}
                        <div className="absolute top-1 left-1 w-1 h-1 bg-[#00ff88]" style={{borderRadius: '1px'}}></div>
                        <div className="absolute top-1 right-1 w-1 h-1 bg-[#00ff88]" style={{borderRadius: '1px'}}></div>
                        <div className="absolute bottom-1 left-1 w-1 h-1 bg-[#00ff88]" style={{borderRadius: '1px'}}></div>
                        <div className="absolute bottom-1 right-1 w-1 h-1 bg-[#00ff88]" style={{borderRadius: '1px'}}></div>
                      </button>
                      
                      <button
                        onClick={() => setShowDetailModal(false)}
                        className="flex-1 bg-gradient-to-r from-[#ff6b6b]/20 to-[#ff4757]/20 border-2 border-[#ff6b6b]/50 hover:border-[#ff6b6b] text-[#ff6b6b] hover:text-white font-bold py-3 sm:py-4 transition-all duration-300 hover:scale-105 hover:shadow-lg relative font-mono tracking-wide"
                        style={{
                          borderRadius: '6px',
                          textShadow: '0 0 6px rgba(255, 107, 107, 0.5)',
                          boxShadow: '0 0 15px rgba(255, 107, 107, 0.2)'
                        }}
                      >
                        <div className="flex items-center justify-center gap-1.5 sm:gap-2">
                          <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-[#ff6b6b] border border-white" style={{borderRadius: '1px'}}></div>
                          <span className="text-sm sm:text-base">CLOSE</span>
                          <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-[#ff6b6b] border border-white" style={{borderRadius: '1px'}}></div>
                        </div>
                        
                        {/* 버튼 모서리 픽셀 도트 */}
                        <div className="absolute top-1 left-1 w-1 h-1 bg-[#ff6b6b]" style={{borderRadius: '1px'}}></div>
                        <div className="absolute top-1 right-1 w-1 h-1 bg-[#ff6b6b]" style={{borderRadius: '1px'}}></div>
                        <div className="absolute bottom-1 left-1 w-1 h-1 bg-[#ff6b6b]" style={{borderRadius: '1px'}}></div>
                        <div className="absolute bottom-1 right-1 w-1 h-1 bg-[#ff6b6b]" style={{borderRadius: '1px'}}></div>
                      </button>
                    </div>
                  </div>
                )
              })()}
            </div>
          </div>
        </div>
      )}

      {/* 목표 설정 모달 */}
      <GoalSettingsPanel
        isOpen={showGoalSettings}
        onClose={() => setShowGoalSettings(false)}
        dailyGoal={dailyGoal}
        weeklyGoal={weeklyGoal}
        monthlyGoal={monthlyGoal}
        onUpdateGoals={updateGoals}
      />
      
      {/* 하단 여백 - 홈탭과 동일하게 */}
      <div className="mb-2 sm:mb-3 lg:mb-4"></div>
    </div>
  )
}

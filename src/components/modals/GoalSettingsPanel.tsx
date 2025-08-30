import React, { useState, useEffect } from 'react'

interface GoalSettingsPanelProps {
  isOpen: boolean
  onClose: () => void
  dailyGoal: number
  weeklyGoal: number
  monthlyGoal: number
  onUpdateGoals: (daily: number, weekly: number, monthly: number) => Promise<boolean>
}

export default function GoalSettingsPanel({
  isOpen,
  onClose,
  dailyGoal,
  weeklyGoal,
  monthlyGoal,
  onUpdateGoals
}: GoalSettingsPanelProps) {
  const [tempDailyGoal, setTempDailyGoal] = useState(dailyGoal)
  const [tempWeeklyGoal, setTempWeeklyGoal] = useState(weeklyGoal)
  const [tempMonthlyGoal, setTempMonthlyGoal] = useState(monthlyGoal)

  useEffect(() => {
    if (isOpen) {
      setTempDailyGoal(dailyGoal)
      setTempWeeklyGoal(weeklyGoal)
      setTempMonthlyGoal(monthlyGoal)
    }
  }, [isOpen, dailyGoal, weeklyGoal, monthlyGoal])

  const handleSave = async () => {
    try {
      const success = await onUpdateGoals(tempDailyGoal, tempWeeklyGoal, tempMonthlyGoal)
      if (success) {
        onClose()
      } else {
        alert('목표 설정 저장에 실패했습니다. 다시 시도해주세요.')
      }
    } catch (error) {
      console.error('목표 설정 저장 오류:', error)
      alert('목표 설정 저장 중 오류가 발생했습니다.')
    }
  }

  const handleReset = () => {
    setTempDailyGoal(0)
    setTempWeeklyGoal(0)
    setTempMonthlyGoal(0)
  }

  if (!isOpen) return null

  return (
    <>
      {/* 전체 화면을 덮는 블랙 배경 */}
      <div 
        className="fixed inset-0 z-[999999] bg-black"
        onClick={onClose}
      />
      
      {/* 모달 컨테이너 */}
      <div className="fixed inset-0 z-[999999] flex items-center justify-center p-2 sm:p-4 overflow-y-auto pointer-events-none">
        <div 
          className="w-full max-w-sm sm:max-w-md bg-gradient-to-b from-[#0a0a23] via-[#16213e] to-[#1a1a2e] border-2 sm:border-4 border-[#00ff88]/50 shadow-2xl relative max-h-[calc(100vh-32px)] overflow-y-auto pointer-events-auto"
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
                <div className="w-5 h-5 sm:w-6 sm:h-6 bg-gradient-to-br from-[#00ff88] to-[#00d4ff] border border-[#00ff88]" 
                     style={{borderRadius: '3px'}}>
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="w-2 h-2 sm:w-3 sm:h-3 bg-white" style={{borderRadius: '1px'}}></div>
                  </div>
                </div>
                <h3 className="text-[#00ff88] font-bold text-sm sm:text-lg font-mono tracking-wider" 
                    style={{textShadow: '0 0 8px rgba(0, 255, 136, 0.5)'}}>
                  GOAL SETTINGS
                </h3>
              </div>
              <button
                onClick={onClose}
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
            
            {/* 일일 목표 설정 - 게임 스타일 반응형 */}
            <div className="space-y-2 sm:space-y-3 relative">
              <div className="bg-gradient-to-r from-[#00ff88]/20 to-[#00d4ff]/20 border border-[#00ff88]/50 p-2 sm:p-3 relative"
                   style={{borderRadius: '4px'}}>
                <h4 className="text-[#00ff88] text-center font-bold text-xs sm:text-sm font-mono tracking-wider mb-2 sm:mb-3" 
                    style={{textShadow: '0 0 6px rgba(0, 255, 136, 0.5)'}}>
                  DAILY GOAL
                </h4>
                <div className="flex items-center gap-2">
                  <span className="text-white text-xs sm:text-sm font-mono">₩</span>
                  <input
                    type="number"
                    value={tempDailyGoal}
                    onChange={(e) => setTempDailyGoal(parseInt(e.target.value) || 0)}
                    className="flex-1 bg-[#0a0a23]/80 border-2 border-[#00ff88]/30 px-2 sm:px-3 py-1.5 sm:py-2 text-white placeholder:text-gray-400 focus:border-[#00ff88] transition-all duration-200 text-xs sm:text-sm font-mono"
                    style={{borderRadius: '4px'}}
                    min="0"
                    step="1000"
                  />
                </div>
                {/* 모서리 픽셀 도트 */}
                <div className="absolute top-1 left-1 w-1 h-1 bg-[#00ff88]" style={{borderRadius: '1px'}}></div>
                <div className="absolute top-1 right-1 w-1 h-1 bg-[#00ff88]" style={{borderRadius: '1px'}}></div>
                <div className="absolute bottom-1 left-1 w-1 h-1 bg-[#00ff88]" style={{borderRadius: '1px'}}></div>
                <div className="absolute bottom-1 right-1 w-1 h-1 bg-[#00ff88]" style={{borderRadius: '1px'}}></div>
              </div>
            </div>

            {/* 주간 목표 설정 */}
            <div className="space-y-2 sm:space-y-3 relative">
              <div className="bg-gradient-to-r from-[#00d4ff]/20 to-[#9c88ff]/20 border border-[#00d4ff]/50 p-2 sm:p-3 relative"
                   style={{borderRadius: '4px'}}>
                <h4 className="text-[#00d4ff] text-center font-bold text-xs sm:text-sm font-mono tracking-wider mb-2 sm:mb-3" 
                    style={{textShadow: '0 0 6px rgba(0, 212, 255, 0.5)'}}>
                  WEEKLY GOAL
                </h4>
                <div className="flex items-center gap-2">
                  <span className="text-white text-xs sm:text-sm font-mono">₩</span>
                  <input
                    type="number"
                    value={tempWeeklyGoal}
                    onChange={(e) => setTempWeeklyGoal(parseInt(e.target.value) || 0)}
                    className="flex-1 bg-[#0a0a23]/80 border-2 border-[#00d4ff]/30 px-2 sm:px-3 py-1.5 sm:py-2 text-white placeholder:text-gray-400 focus:border-[#00d4ff] transition-all duration-200 text-xs sm:text-sm font-mono"
                    style={{borderRadius: '4px'}}
                    min="0"
                    step="1000"
                  />
                </div>
                {/* 모서리 픽셀 도트 */}
                <div className="absolute top-1 left-1 w-1 h-1 bg-[#00d4ff]" style={{borderRadius: '1px'}}></div>
                <div className="absolute top-1 right-1 w-1 h-1 bg-[#00d4ff]" style={{borderRadius: '1px'}}></div>
                <div className="absolute bottom-1 left-1 w-1 h-1 bg-[#00d4ff]" style={{borderRadius: '1px'}}></div>
                <div className="absolute bottom-1 right-1 w-1 h-1 bg-[#00d4ff]" style={{borderRadius: '1px'}}></div>
              </div>
            </div>

            {/* 월간 목표 설정 */}
            <div className="space-y-2 sm:space-y-3 relative">
              <div className="bg-gradient-to-r from-[#9c88ff]/20 to-[#ff6b6b]/20 border border-[#9c88ff]/50 p-2 sm:p-3 relative"
                   style={{borderRadius: '4px'}}>
                <h4 className="text-[#9c88ff] text-center font-bold text-xs sm:text-sm font-mono tracking-wider mb-2 sm:mb-3" 
                    style={{textShadow: '0 0 6px rgba(156, 136, 255, 0.5)'}}>
                  MONTHLY GOAL
                </h4>
                <div className="flex items-center gap-2">
                  <span className="text-white text-xs sm:text-sm font-mono">₩</span>
                  <input
                    type="number"
                    value={tempMonthlyGoal}
                    onChange={(e) => setTempMonthlyGoal(parseInt(e.target.value) || 0)}
                    className="flex-1 bg-[#0a0a23]/80 border-2 border-[#9c88ff]/30 px-2 sm:px-3 py-1.5 sm:py-2 text-white placeholder:text-gray-400 focus:border-[#9c88ff] transition-all duration-200 text-xs sm:text-sm font-mono"
                    style={{borderRadius: '4px'}}
                    min="0"
                    step="1000"
                  />
                </div>
                {/* 모서리 픽셀 도트 */}
                <div className="absolute top-1 left-1 w-1 h-1 bg-[#9c88ff]" style={{borderRadius: '1px'}}></div>
                <div className="absolute top-1 right-1 w-1 h-1 bg-[#9c88ff]" style={{borderRadius: '1px'}}></div>
                <div className="absolute bottom-1 left-1 w-1 h-1 bg-[#9c88ff]" style={{borderRadius: '1px'}}></div>
                <div className="absolute bottom-1 right-1 w-1 h-1 bg-[#9c88ff]" style={{borderRadius: '1px'}}></div>
              </div>
            </div>

            {/* 액션 버튼들 */}
            <div className="flex gap-2 sm:gap-3 pt-4">
              <button
                onClick={handleReset}
                className="flex-1 bg-gradient-to-r from-[#ff6b6b]/20 to-[#ff4757]/20 border-2 border-[#ff6b6b]/50 hover:border-[#ff6b6b] text-[#ff6b6b] hover:text-white font-bold py-3 sm:py-4 transition-all duration-300 hover:scale-105 hover:shadow-lg relative font-mono tracking-wide"
                style={{
                  borderRadius: '6px',
                  textShadow: '0 0 6px rgba(255, 107, 107, 0.5)',
                  boxShadow: '0 0 15px rgba(255, 107, 107, 0.2)'
                }}
              >
                <div className="flex items-center justify-center gap-1.5 sm:gap-2">
                  <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-[#ff6b6b] border border-white" style={{borderRadius: '1px'}}></div>
                  <span className="text-sm sm:text-base">RESET</span>
                  <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-[#ff6b6b] border border-white" style={{borderRadius: '1px'}}></div>
                </div>
                
                {/* 버튼 모서리 픽셀 도트 */}
                <div className="absolute top-1 left-1 w-1 h-1 bg-[#ff6b6b]" style={{borderRadius: '1px'}}></div>
                <div className="absolute top-1 right-1 w-1 h-1 bg-[#ff6b6b]" style={{borderRadius: '1px'}}></div>
                <div className="absolute bottom-1 left-1 w-1 h-1 bg-[#ff6b6b]" style={{borderRadius: '1px'}}></div>
                <div className="absolute bottom-1 right-1 w-1 h-1 bg-[#ff6b6b]" style={{borderRadius: '1px'}}></div>
              </button>
              
              <button
                onClick={handleSave}
                className="flex-1 bg-gradient-to-r from-[#00ff88]/20 to-[#00d4ff]/20 border-2 border-[#00ff88]/50 hover:border-[#00ff88] text-[#00ff88] hover:text-white font-bold py-3 sm:py-4 transition-all duration-300 hover:scale-105 hover:shadow-lg relative font-mono tracking-wide"
                style={{
                  borderRadius: '6px',
                  textShadow: '0 0 6px rgba(0, 255, 136, 0.5)',
                  boxShadow: '0 0 15px rgba(0, 255, 136, 0.2)'
                }}
              >
                <div className="flex items-center justify-center gap-1.5 sm:gap-2">
                  <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-[#00ff88] border border-white" style={{borderRadius: '1px'}}></div>
                  <span className="text-sm sm:text-base">SAVE</span>
                  <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-[#00ff88] border border-white" style={{borderRadius: '1px'}}></div>
                </div>
                
                {/* 버튼 모서리 픽셀 도트 */}
                <div className="absolute top-1 left-1 w-1 h-1 bg-[#00ff88]" style={{borderRadius: '1px'}}></div>
                <div className="absolute top-1 right-1 w-1 h-1 bg-[#00ff88]" style={{borderRadius: '1px'}}></div>
                <div className="absolute bottom-1 left-1 w-1 h-1 bg-[#00ff88]" style={{borderRadius: '1px'}}></div>
                <div className="absolute bottom-1 right-1 w-1 h-1 bg-[#00ff88]" style={{borderRadius: '1px'}}></div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

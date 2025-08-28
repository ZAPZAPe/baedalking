import React from 'react'
import { Platform } from '@/hooks/useAppState'

interface IncomeDetailModalProps {
  isOpen: boolean
  onClose: () => void
  selectedDate: string | null
  allRecords: any[]
  platforms: Platform[]
  onEdit?: (date: string, records: any[]) => void
}

export default function IncomeDetailModal({
  isOpen,
  onClose,
  selectedDate,
  allRecords,
  platforms,
  onEdit
}: IncomeDetailModalProps) {
  if (!isOpen || !selectedDate) return null

  const dayRecords = allRecords.filter(record => record.date === selectedDate)
  const dayTotal = dayRecords.reduce((sum, record) => sum + (record.amount || 0) + (record.missionAmount || 0), 0)
  const dayCount = dayRecords.reduce((sum, record) => sum + record.count, 0)
  const dayDelivery = dayRecords.reduce((sum, record) => sum + (record.amount || 0), 0)
  const dayMission = dayRecords.reduce((sum, record) => sum + (record.missionAmount || 0), 0)

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

            {/* 선택된 날짜의 수익 정보 - 오늘의 수익과 동일한 스타일 */}
            <div className="space-y-4">
              {/* 날짜 표시 */}
              <div className="bg-gradient-to-r from-[#00d4ff]/20 to-[#9c88ff]/20 border border-[#00d4ff]/50 p-2 sm:p-3 relative flex items-center justify-center"
                   style={{borderRadius: '4px'}}>
                <h4 className="text-[#00d4ff] text-center font-bold text-xs sm:text-sm font-mono tracking-wide" 
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

              {/* 총 수익 - 윗줄 전체 너비 */}
              <div className="bg-gradient-to-r from-[#00ff88]/20 to-[#00d4ff]/20 border border-[#00ff88]/50 p-3 relative"
                   style={{borderRadius: '4px'}}>
                <h5 className="text-[#00ff88] text-center font-bold text-xs font-mono mb-2" 
                    style={{textShadow: '0 0 6px rgba(0, 255, 136, 0.5)'}}>
                  TOTAL INCOME
                </h5>
                <div className="text-center">
                  <div className="text-white font-bold text-2xl font-mono mb-1">
                    ₩{dayTotal.toLocaleString()}
                  </div>
                </div>
                {/* 모서리 픽셀 도트 */}
                <div className="absolute top-1 left-1 w-1 h-1 bg-[#00ff88]" style={{borderRadius: '1px'}}></div>
                <div className="absolute top-1 right-1 w-1 h-1 bg-[#00ff88]" style={{borderRadius: '1px'}}></div>
                <div className="absolute bottom-1 left-1 w-1 h-1 bg-[#00ff88]" style={{borderRadius: '1px'}}></div>
                <div className="absolute bottom-1 right-1 w-1 h-1 bg-[#00ff88]" style={{borderRadius: '1px'}}></div>
              </div>

              {/* 상세 정보 - 3개 사각형 */}
              <div className="grid grid-cols-3 gap-3">
                {/* 건수 */}
                <div className="bg-gradient-to-r from-[#00d4ff]/20 to-[#9c88ff]/20 border border-[#00d4ff]/50 p-3 relative"
                     style={{borderRadius: '4px'}}>
                  <h5 className="text-[#00d4ff] text-center font-bold text-xs font-mono mb-2" 
                      style={{textShadow: '0 0 6px rgba(0, 212, 255, 0.5)'}}>
                    건수
                  </h5>
                  <div className="text-center">
                    <div className="text-white font-bold text-lg font-mono">
                      {dayCount}건
                    </div>
                  </div>
                  {/* 모서리 픽셀 도트 */}
                  <div className="absolute top-1 left-1 w-1 h-1 bg-[#00d4ff]" style={{borderRadius: '1px'}}></div>
                  <div className="absolute top-1 right-1 w-1 h-1 bg-[#00d4ff]" style={{borderRadius: '1px'}}></div>
                  <div className="absolute bottom-1 left-1 w-1 h-1 bg-[#00d4ff]" style={{borderRadius: '1px'}}></div>
                  <div className="absolute bottom-1 right-1 w-1 h-1 bg-[#00d4ff]" style={{borderRadius: '1px'}}></div>
                </div>

                {/* 배달 수익 */}
                <div className="bg-gradient-to-r from-[#9c88ff]/20 to-[#ff6b6b]/20 border border-[#9c88ff]/50 p-3 relative"
                     style={{borderRadius: '4px'}}>
                  <h5 className="text-[#9c88ff] text-center font-bold text-xs font-mono mb-2" 
                      style={{textShadow: '0 0 6px rgba(156, 136, 255, 0.5)'}}>
                    배달금액
                  </h5>
                  <div className="text-center">
                    <div className="text-white font-bold text-lg font-mono">
                      ₩{dayDelivery.toLocaleString()}
                    </div>
                  </div>
                  {/* 모서리 픽셀 도트 */}
                  <div className="absolute top-1 left-1 w-1 h-1 bg-[#9c88ff]" style={{borderRadius: '1px'}}></div>
                  <div className="absolute top-1 right-1 w-1 h-1 bg-[#9c88ff]" style={{borderRadius: '1px'}}></div>
                  <div className="absolute bottom-1 left-1 w-1 h-1 bg-[#9c88ff]" style={{borderRadius: '1px'}}></div>
                  <div className="absolute bottom-1 right-1 w-1 h-1 bg-[#9c88ff]" style={{borderRadius: '1px'}}></div>
                </div>

                {/* 미션 수익 */}
                <div className="bg-gradient-to-r from-[#ff6b6b]/20 to-[#ffd93d]/20 border border-[#ff6b6b]/50 p-3 relative"
                     style={{borderRadius: '4px'}}>
                  <h5 className="text-[#ff6b6b] text-center font-bold text-xs font-mono mb-2" 
                      style={{textShadow: '0 0 6px rgba(255, 107, 107, 0.5)'}}>
                    미션비
                  </h5>
                  <div className="text-center">
                    <div className="text-white font-bold text-lg font-mono">
                      ₩{dayMission.toLocaleString()}
                    </div>
                  </div>
                  {/* 모서리 픽셀 도트 */}
                  <div className="absolute top-1 left-1 w-1 h-1 bg-[#ff6b6b]" style={{borderRadius: '1px'}}></div>
                  <div className="absolute top-1 right-1 w-1 h-1 bg-[#ff6b6b]" style={{borderRadius: '1px'}}></div>
                  <div className="absolute bottom-1 left-1 w-1 h-1 bg-[#ff6b6b]" style={{borderRadius: '1px'}}></div>
                  <div className="absolute bottom-1 right-1 w-1 h-1 bg-[#ff6b6b]" style={{borderRadius: '1px'}}></div>
                </div>
              </div>



              {/* 상세 기록 */}
              <div className="space-y-2">
                <h5 className="text-white text-center font-bold text-sm font-mono mb-3" 
                    style={{textShadow: '0 0 6px rgba(255, 255, 255, 0.5)'}}>
                  DETAILED RECORDS
                </h5>
                {dayRecords.map((record, index) => {
                  const config = platforms.find(p => p.id === record.platform) || platforms[0]
                  return (
                    <div key={index} className="bg-[#1a202c]/60 border-2 border-[#00ff88]/30 p-3 relative"
                         style={{borderRadius: '4px'}}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {config.id === 'baemin' ? (
                            <div className="w-6 h-6 bg-[#00C850] rounded-full flex items-center justify-center text-white text-xs font-bold">
                              배
                            </div>
                          ) : config.id === 'coupang' ? (
                            <div className="w-6 h-6 bg-[#FF6B00] rounded-full flex items-center justify-center text-white text-xs font-bold">
                              쿠
                            </div>
                          ) : (
                            <div className="w-3 h-3 rounded-full"
                                 style={{backgroundColor: config.color}}></div>
                          )}
                          <div>
                            <div className="text-white font-bold text-sm font-mono">{config.name}</div>
                            <div className="text-xs text-gray-400 font-mono tracking-wider">DELIVERY RECORD</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-white font-bold text-sm font-mono">₩{((record.amount || 0) + (record.missionAmount || 0)).toLocaleString()}</div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-2">
                        <div className="bg-[#1a202c]/50 p-2 rounded-lg text-center border"
                             style={{borderColor: `${config.color}30`}}>
                          <div className="text-white text-xs font-mono font-bold mb-1">건수</div>
                          <div className="text-sm font-bold font-mono text-white">
                            {record.count}건
                          </div>
                        </div>
                        <div className="bg-[#1a202c]/50 p-2 rounded-lg text-center border"
                             style={{borderColor: `${config.color}30`}}>
                          <div className="text-white text-xs font-mono font-bold mb-1">금액</div>
                          <div className="text-sm font-bold font-mono text-white">
                            ₩{record.amount.toLocaleString()}
                          </div>
                        </div>
                        <div className="bg-[#1a202c]/50 p-2 rounded-lg text-center border"
                             style={{borderColor: `${config.color}30`}}>
                          <div className="text-white text-xs font-mono font-bold mb-1">미션비</div>
                          <div className="text-sm font-bold font-mono text-white">
                            ₩{record.missionAmount.toLocaleString()}
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

              {/* 버튼들 - CHARACTER EDIT 스타일로 통일 */}
              <div className="flex gap-2 sm:gap-3 pt-4">
                <button
                  onClick={() => {
                    if (onEdit && selectedDate) {
                      onEdit(selectedDate, dayRecords)
                    }
                    onClose()
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
                  onClick={onClose}
                  className="flex-1 bg-gradient-to-r from-[#ff6b6b]/20 to-[#ff4757]/20 border-2 border-[#ff6b6b]/50 hover:border-[#ff6b6b] text-[#ff6b6b] hover:text-white font-bold py-3 sm:py-4 transition-all duration-300 hover:scale-105 hover:shadow-lg relative font-mono tracking-wide"
                  style={{
                    borderRadius: '6px',
                    textShadow: '0 0 6px rgba(255, 107, 107, 0.5)',
                    boxShadow: '0 0 15px rgba(255, 107, 107, 0.2)'
                  }}
                >
                  <div className="flex items-center justify-center gap-1.5 sm:gap-2">
                    <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-[#ff6b6b] border border-white" style={{borderRadius: '1px'}}></div>
                    <span className="text-sm sm:text-base font-mono tracking-wider">CLOSE</span>
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
          </div>
        </div>
      </div>
    </>
  )
}

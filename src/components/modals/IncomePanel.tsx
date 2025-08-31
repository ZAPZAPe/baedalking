'use client'

import { Platform } from '@/hooks/useAppState'
import { IncomeRecord } from '@/types'

interface IncomePanelProps {
  showIncomePanel: boolean
  setShowIncomePanel: (show: boolean) => void
  incomeRecords: IncomeRecord[]
  totalIncome: number
  getTotalIncomeByPlatform: (platform: string) => number
  platforms: Platform[]
}

export default function IncomePanel({
  showIncomePanel,
  setShowIncomePanel,
  incomeRecords,
  totalIncome,
  getTotalIncomeByPlatform,
  platforms
}: IncomePanelProps) {
  if (!showIncomePanel) return null

  return (
    <div 
              className="fixed inset-0 z-[999999] bg-black flex items-center justify-center p-2 sm:p-4 overflow-y-auto" 
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        setShowIncomePanel(false)
      }}
      onTouchStart={(e) => e.stopPropagation()}
      onTouchEnd={(e) => e.stopPropagation()}
    >
      <div 
        className="w-full max-w-sm sm:max-w-md bg-gradient-to-b from-[#0a0a23] via-[#16213e] to-[#1a1a2e] border-2 sm:border-4 border-[#00d4ff]/50 shadow-2xl relative max-h-[calc(100vh-32px)] overflow-y-auto"
        style={{
          borderRadius: '6px',
          fontFamily: 'monospace',
          imageRendering: 'pixelated',
          boxShadow: '0 0 30px rgba(0, 212, 255, 0.3), inset 0 0 20px rgba(0, 212, 255, 0.1)'
        }}
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
        }}
        onTouchStart={(e) => e.stopPropagation()}
        onTouchEnd={(e) => e.stopPropagation()}
      >
        
        {/* 네온 글로우 테두리 */}
        <div className="absolute -inset-1 bg-gradient-to-r from-[#00d4ff]/20 via-[#ffd93d]/20 to-[#00d4ff]/20 blur-sm -z-10" 
             style={{borderRadius: '12px'}}></div>
        
        {/* 헤더 - 게임 스타일 */}
        <div className="bg-gradient-to-r from-[#0a0a23] to-[#16213e] p-3 sm:p-4 border-b-2 border-[#00d4ff]/30 relative">
          {/* 상단 장식 라인 */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#00d4ff]/60 to-transparent"></div>
          
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2 sm:gap-3">
              {/* 픽셀 아이콘 */}
              <div className="w-5 h-5 sm:w-6 sm:h-6 bg-gradient-to-br from-[#ffd93d] to-[#ff6b6b] border border-[#00d4ff]" 
                   style={{borderRadius: '3px'}}>
                <div className="w-full h-full flex items-center justify-center">
                  <div className="w-2 h-2 sm:w-3 sm:h-3 bg-white" style={{borderRadius: '1px'}}></div>
                </div>
              </div>
              <h3 className="text-[#00d4ff] font-bold text-sm sm:text-lg font-mono tracking-wider" 
                  style={{textShadow: '0 0 8px rgba(0, 212, 255, 0.5)'}}>
                INCOME MANAGER
              </h3>
            </div>
            <button
              onClick={() => setShowIncomePanel(false)}
              className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-br from-[#ff6b6b]/20 to-[#ff4757]/20 border border-[#ff6b6b]/50 hover:border-[#ff6b6b] text-[#ff6b6b] hover:text-[#ff4757] font-bold transition-all duration-200 hover:scale-110 text-sm sm:text-base"
              style={{borderRadius: '4px'}}
            >
              ✕
            </button>
          </div>
          
          {/* 하단 장식 라인 */}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#00d4ff]/40 to-transparent"></div>
        </div>
        
        <div className="p-3 sm:p-4 space-y-3 sm:space-y-4 relative">
          {/* 배경 패턴 */}
          <div className="absolute inset-0 opacity-5">
            <div className="w-full h-full" 
                 style={{
                   backgroundImage: `radial-gradient(circle, #00d4ff 1px, transparent 1px)`,
                   backgroundSize: '12px 12px'
                 }}></div>
          </div>
          
          {/* 통계 요약 - 게임 스타일 */}
          <div className="space-y-2 sm:space-y-3 relative">
            <div className="bg-gradient-to-r from-[#ffd93d]/20 to-[#ff6b6b]/20 border border-[#ffd93d]/50 p-2 sm:p-3 relative"
                 style={{borderRadius: '4px'}}>
              <h4 className="text-[#ffd93d] text-center font-bold text-xs sm:text-sm font-mono tracking-wide mb-2 sm:mb-3" 
                  style={{textShadow: '0 0 6px rgba(255, 217, 61, 0.5)'}}>
                STATISTICS
              </h4>
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-[#0a0a23]/80 border border-[#ffd93d]/30 p-2 text-center relative" style={{borderRadius: '4px'}}>
                  <p className="text-white text-xs font-mono font-bold mb-1">총 수입</p>
                  <p className="text-[#ffd93d] text-sm sm:text-base font-bold font-mono">₩{totalIncome.toLocaleString()}</p>
                </div>
                <div className="bg-[#0a0a23]/80 border border-[#00d4ff]/30 p-2 text-center relative" style={{borderRadius: '4px'}}>
                  <p className="text-white text-xs font-mono font-bold mb-1">총 건수</p>
                  <p className="text-[#00d4ff] text-sm sm:text-base font-bold font-mono">{incomeRecords.reduce((sum, record) => sum + record.delivery_count, 0)}건</p>
                </div>
                <div className="bg-[#0a0a23]/80 border border-[#9c88ff]/30 p-2 text-center relative" style={{borderRadius: '4px'}}>
                  <p className="text-white text-xs font-mono font-bold mb-1">평균</p>
                  <p className="text-[#9c88ff] text-sm sm:text-base font-bold font-mono">₩{incomeRecords.length > 0 ? Math.round(totalIncome / incomeRecords.reduce((sum, record) => sum + record.delivery_count, 0)) : 0}</p>
                </div>
              </div>
              {/* 모서리 픽셀 도트 */}
              <div className="absolute top-1 left-1 w-1 h-1 bg-[#ffd93d]" style={{borderRadius: '1px'}}></div>
              <div className="absolute top-1 right-1 w-1 h-1 bg-[#ffd93d]" style={{borderRadius: '1px'}}></div>
              <div className="absolute bottom-1 left-1 w-1 h-1 bg-[#ffd93d]" style={{borderRadius: '1px'}}></div>
              <div className="absolute bottom-1 right-1 w-1 h-1 bg-[#ffd93d]" style={{borderRadius: '1px'}}></div>
            </div>
          </div>

          {/* 플랫폼별 상세 현황 - 카드 형식으로 통일 */}
          <div className="space-y-2 relative">
            <h4 className="text-[#00d4ff] text-center font-bold text-xs sm:text-sm font-mono tracking-wide mb-2" 
                style={{textShadow: '0 0 6px rgba(0, 212, 255, 0.5)'}}>
              PLATFORM STATUS
            </h4>
            
            <div className="space-y-2">
              {platforms.filter(p => p.isActive).map((platform) => {
                const platformIncome = getTotalIncomeByPlatform(platform.id)
                const platformRecords = incomeRecords.filter(record => record.platform === platform.id)
                const platformCount = platformRecords.reduce((sum, record) => sum + record.delivery_count, 0)
                const platformAmount = platformRecords.reduce((sum, record) => sum + (record.total_amount || 0), 0)
                const platformMissionAmount = platformRecords.reduce((sum, record) => sum + (record.mission_amount || 0), 0)
                
                // 플랫폼별 설정을 위한 헬퍼 함수
                const getPlatformConfig = (platform: any) => {
                  if (platform.id === 'baemin') {
                    return { 
                      icon: '/baemin-logo.svg', 
                      borderColor: '#00C851', 
                      bgColor: '#00C851',
                      showLogo: true 
                    }
                  } else if (platform.id === 'coupang') {
                    return { 
                      icon: '/coupang-logo.svg', 
                      borderColor: '#E4002B', 
                      bgColor: '#E4002B',
                      showLogo: true 
                    }
                  } else {
                    // 커스텀 플랫폼은 색상 네모로 표시
                    return { 
                      icon: '', 
                      borderColor: platform.color, 
                      bgColor: platform.bgColor,
                      showLogo: false 
                    }
                  }
                }
                
                const config = getPlatformConfig(platform)
                
                return (
                  <div 
                    key={platform.id} 
                    className="bg-gradient-to-br from-[#2d3748] to-[#1a202c] rounded-xl border-2 relative"
                    style={{
                      borderColor: `${config.borderColor}50`,
                      fontFamily: 'monospace',
                      imageRendering: 'pixelated'
                    }}
                  >
                    <div className="p-2">
                      {/* 플랫폼 헤더 */}
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center border-2 overflow-hidden`}
                               style={{
                                 backgroundColor: `${config.bgColor}20`,
                                 borderColor: `${config.borderColor}60`
                               }}>
                            {config.showLogo ? (
                              <img 
                                src={config.icon} 
                                alt={platform.name}
                                className="w-6 h-6 object-contain"
                                style={{ imageRendering: 'pixelated' }}
                              />
                            ) : (
                              <div 
                                className="w-5 h-5"
                                style={{
                                  backgroundColor: config.bgColor,
                                  borderRadius: '2px'
                                }}
                              />
                            )}
                          </div>
                          <div>
                            <div className="text-white font-bold text-sm font-mono">{platform.name}</div>
                          </div>
                        </div>
                        <div className={`px-3 py-1 rounded-lg border font-bold text-sm font-mono`}
                             style={{
                               backgroundColor: `${config.bgColor}20`,
                               borderColor: `${config.borderColor}60`,
                               color: config.borderColor
                             }}>
                          {platformCount}건
                        </div>
                      </div>

                      {/* 상세 정보 그리드 */}
                      {platformCount > 0 ? (
                        <div className="grid grid-cols-3 gap-1">
                          {/* 배달 금액 */}
                          <div className="bg-[#1a202c]/50 p-1 rounded-lg text-center border"
                               style={{borderColor: `${config.borderColor}30`}}>
                            <div className="text-white text-xs font-mono font-bold mb-0.5">배달금액</div>
                            <div className="text-sm font-bold font-mono text-white">
                              ₩{platformAmount.toLocaleString()}
                            </div>
                          </div>

                          {/* 미션비 */}
                          <div className="bg-[#1a202c]/50 p-1 rounded-lg text-center border"
                               style={{borderColor: `${config.borderColor}30`}}>
                            <div className="text-white text-xs font-mono font-bold mb-0.5">미션비</div>
                            <div className="text-sm font-bold font-mono"
                                 style={{color: config.borderColor}}>
                              ₩{platformMissionAmount.toLocaleString()}
                            </div>
                          </div>

                          {/* 건당 평균 */}
                          <div className="bg-[#1a202c]/50 p-1 rounded-lg text-center border"
                               style={{borderColor: `${config.borderColor}30`}}>
                            <div className="text-white text-xs font-mono font-bold mb-0.5">건당평균</div>
                            <div className="text-sm font-bold font-mono text-[#ffd93d]">
                              ₩{Math.round(platformIncome / platformCount).toLocaleString()}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-4">
                          <div className="text-sm text-gray-500 font-mono">
                            수입 기록 없음
                          </div>
                        </div>
                      )}

                      {/* 총 수입 하단 */}
                      <div className="mt-2 pt-2 border-t flex items-center justify-between"
                           style={{borderColor: `${config.borderColor}30`}}>
                        <div className="text-white text-sm font-mono font-bold">총 수입</div>
                        <div className="text-lg font-bold font-mono text-[#ffd93d]">
                          ₩{platformIncome.toLocaleString()}
                        </div>
                      </div>
                    </div>

                    {/* 픽셀 장식 요소들 */}
                    <div className="absolute top-1 left-1 w-1 h-1 rounded-sm"
                         style={{backgroundColor: config.borderColor}}></div>
                    <div className="absolute top-1 right-1 w-1 h-1 rounded-sm"
                         style={{backgroundColor: config.borderColor}}></div>
                    <div className="absolute bottom-1 left-1 w-1 h-1 rounded-sm"
                         style={{backgroundColor: config.borderColor}}></div>
                    <div className="absolute bottom-1 right-1 w-1 h-1 rounded-sm"
                         style={{backgroundColor: config.borderColor}}></div>
                  </div>
                )
              })}
            </div>
          </div>
          
          {/* 수입 기록 내역 - 게임 스타일 */}
          <div className="space-y-2 sm:space-y-3 relative">
            <div className="bg-gradient-to-r from-[#9c88ff]/20 to-[#ffd93d]/20 border border-[#9c88ff]/50 p-2 sm:p-3 relative"
                 style={{borderRadius: '4px'}}>
              <h4 className="text-[#9c88ff] text-center font-bold text-xs sm:text-sm font-mono tracking-wide mb-2 sm:mb-3" 
                  style={{textShadow: '0 0 6px rgba(156, 136, 255, 0.5)'}}>
                INCOME HISTORY
              </h4>
              <div className="max-h-32 sm:max-h-40 overflow-y-auto space-y-1 sm:space-y-2">
                {incomeRecords.length > 0 ? (
                  incomeRecords.map((record) => (
                    <div key={record.id} className="bg-[#0a0a23]/80 border border-[#9c88ff]/30 p-2 space-y-1" style={{borderRadius: '4px'}}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <img 
                            src={record.platform === 'baemin' ? '/baemin-logo.svg' : 
                                 record.platform === 'coupang' ? '/coupang-logo.svg' : '/globe.svg'} 
                            alt={record.platform}
                            className="w-3 h-3 object-contain"
                            style={{ imageRendering: 'pixelated' }}
                          />
                          <span className="text-white text-xs font-mono">{record.delivery_count}건</span>
                        </div>
                        <span className="text-[#ffd93d] font-bold text-xs font-mono">₩{record.total_amount.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                                                  <span className="text-gray-400 font-mono">배달: ₩{record.delivery_amount?.toLocaleString() || '0'}</span>
                        <span className="text-gray-400 font-mono">미션: ₩{record.mission_amount?.toLocaleString() || '0'}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-400 text-center text-xs font-mono">아직 수입 기록이 없습니다</p>
                )}
              </div>
              {/* 모서리 픽셀 도트 */}
              <div className="absolute top-1 left-1 w-1 h-1 bg-[#9c88ff]" style={{borderRadius: '1px'}}></div>
              <div className="absolute top-1 right-1 w-1 h-1 bg-[#9c88ff]" style={{borderRadius: '1px'}}></div>
              <div className="absolute bottom-1 left-1 w-1 h-1 bg-[#9c88ff]" style={{borderRadius: '1px'}}></div>
              <div className="absolute bottom-1 right-1 w-1 h-1 bg-[#9c88ff]" style={{borderRadius: '1px'}}></div>
            </div>
          </div>
          
          {/* 닫기 버튼 - 게임 스타일 */}
          <button
            onClick={() => setShowIncomePanel(false)}
            className="w-full bg-gradient-to-r from-[#ff6b6b]/20 to-[#ff4757]/20 border-2 border-[#ff6b6b]/50 hover:border-[#ff6b6b] text-[#ff6b6b] hover:text-white font-bold py-3 sm:py-4 transition-all duration-300 hover:scale-105 hover:shadow-lg relative font-mono tracking-wide"
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
  )
}

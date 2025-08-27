'use client'

import { Platform } from '@/hooks/useAppState'

interface IncomeInputPanelProps {
  showIncomeInputPanel: boolean
  setShowIncomeInputPanel: (show: boolean) => void
  incomeCount: string
  setIncomeCount: (count: string) => void
  incomeAmount: string
  setIncomeAmount: (amount: string) => void
  missionAmount: string
  setMissionAmount: (amount: string) => void
  selectedPlatform: string
  setSelectedPlatform: (platform: string) => void
  incomeImage: File | null
  setIncomeImage: (image: File | null) => void
  incomeDate: string
  setIncomeDate: (date: string) => void
  onSubmit: () => void
  platforms: Platform[]
}

export default function IncomeInputPanel({
  showIncomeInputPanel,
  setShowIncomeInputPanel,
  incomeCount,
  setIncomeCount,
  incomeAmount,
  setIncomeAmount,
  missionAmount,
  setMissionAmount,
  selectedPlatform,
  setSelectedPlatform,
  incomeImage,
  setIncomeImage,
  incomeDate,
  setIncomeDate,
  onSubmit,
  platforms
}: IncomeInputPanelProps) {
  if (!showIncomeInputPanel) return null

  const handleSubmit = () => {
    onSubmit()
    setShowIncomeInputPanel(false)
  }

  return (
    <div 
      className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto" 
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        setShowIncomeInputPanel(false)
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
        <div className="absolute -inset-1 bg-gradient-to-r from-[#00d4ff]/20 via-[#00ff88]/20 to-[#00d4ff]/20 blur-sm -z-10" 
             style={{borderRadius: '12px'}}></div>
        
        {/* 헤더 - 게임 스타일 */}
        <div className="bg-gradient-to-r from-[#0a0a23] to-[#16213e] p-3 sm:p-4 border-b-2 border-[#00d4ff]/30 relative">
          {/* 상단 장식 라인 */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#00d4ff]/60 to-transparent"></div>
          
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2 sm:gap-3">
              {/* 픽셀 아이콘 */}
              <div className="w-5 h-5 sm:w-6 sm:h-6 bg-gradient-to-br from-[#00ff88] to-[#00d4ff] border border-[#00ff88]" 
                   style={{borderRadius: '3px'}}>
                <div className="w-full h-full flex items-center justify-center">
                  <div className="w-2 h-2 sm:w-3 sm:h-3 bg-white" style={{borderRadius: '1px'}}></div>
                </div>
              </div>
              <h3 className="text-[#00ff88] font-bold text-sm sm:text-lg font-mono tracking-wide" 
                  style={{textShadow: '0 0 8px rgba(0, 255, 136, 0.5)'}}>
                INCOME INPUT
              </h3>
            </div>
            <button
              onClick={() => setShowIncomeInputPanel(false)}
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
          
          {/* 플랫폼 선택 - 게임 스타일 */}
          <div className="space-y-2 sm:space-y-3 relative">
            <div className="bg-gradient-to-r from-[#00ff88]/20 to-[#00d4ff]/20 border border-[#00ff88]/50 p-2 sm:p-3 relative"
                 style={{borderRadius: '4px'}}>
              <h4 className="text-[#00ff88] text-center font-bold text-xs sm:text-sm font-mono tracking-wide mb-2 sm:mb-3" 
                  style={{textShadow: '0 0 6px rgba(0, 255, 136, 0.5)'}}>
                PLATFORM SELECT
              </h4>
              <div className="grid grid-cols-3 gap-2">
                {platforms.filter(p => p.isActive).map((platform) => (
                  <button
                    key={platform.id}
                    onClick={() => setSelectedPlatform(platform.id)}
                    className={`p-2 border-2 transition-all duration-200 relative ${
                      selectedPlatform === platform.id
                        ? 'bg-[#00ff88]/20 border-[#00ff88] scale-105 shadow-lg'
                        : 'bg-[#0a0a23]/40 border-[#00ff88]/30 hover:border-[#00ff88]/60 hover:scale-102'
                    }`}
                    style={{borderRadius: '4px'}}
                  >
                    <div className="text-center">
                      <div className="text-sm mb-1">{platform.icon}</div>
                      <div className="text-white text-xs font-mono font-bold">{platform.name}</div>
                    </div>
                    {/* 선택된 버튼 픽셀 도트 */}
                    {selectedPlatform === platform.id && (
                      <>
                        <div className="absolute top-0.5 left-0.5 w-1 h-1 bg-[#00ff88]" style={{borderRadius: '1px'}}></div>
                        <div className="absolute top-0.5 right-0.5 w-1 h-1 bg-[#00ff88]" style={{borderRadius: '1px'}}></div>
                        <div className="absolute bottom-0.5 left-0.5 w-1 h-1 bg-[#00ff88]" style={{borderRadius: '1px'}}></div>
                        <div className="absolute bottom-0.5 right-0.5 w-1 h-1 bg-[#00ff88]" style={{borderRadius: '1px'}}></div>
                      </>
                    )}
                  </button>
                ))}
              </div>
              {/* 모서리 픽셀 도트 */}
              <div className="absolute top-1 left-1 w-1 h-1 bg-[#00ff88]" style={{borderRadius: '1px'}}></div>
              <div className="absolute top-1 right-1 w-1 h-1 bg-[#00ff88]" style={{borderRadius: '1px'}}></div>
              <div className="absolute bottom-1 left-1 w-1 h-1 bg-[#00ff88]" style={{borderRadius: '1px'}}></div>
              <div className="absolute bottom-1 right-1 w-1 h-1 bg-[#00ff88]" style={{borderRadius: '1px'}}></div>
            </div>
          </div>

          {/* 날짜 선택 - 게임 스타일 */}
          <div className="space-y-2 sm:space-y-3 relative">
            <div className="bg-gradient-to-r from-[#ff6b6b]/20 to-[#ff8e8e]/20 border border-[#ff6b6b]/50 p-2 sm:p-3 relative"
                 style={{borderRadius: '4px'}}>
              <h4 className="text-[#ff6b6b] text-center font-bold text-xs sm:text-sm font-mono tracking-wide mb-2 sm:mb-3" 
                  style={{textShadow: '0 0 6px rgba(255, 107, 107, 0.5)'}}>
                DATE SELECT
              </h4>
              <div className="flex items-center justify-center">
                <input
                  type="date"
                  value={incomeDate}
                  onChange={(e) => setIncomeDate(e.target.value)}
                  className="bg-[#0a0a23]/80 border-2 border-[#ff6b6b]/30 px-3 py-2 text-white font-mono focus:border-[#ff6b6b] transition-all duration-200 text-sm"
                  style={{borderRadius: '4px'}}
                />
              </div>
              {/* 모서리 픽셀 도트 */}
              <div className="absolute top-1 left-1 w-1 h-1 bg-[#ff6b6b]" style={{borderRadius: '1px'}}></div>
              <div className="absolute top-1 right-1 w-1 h-1 bg-[#ff6b6b]" style={{borderRadius: '1px'}}></div>
              <div className="absolute bottom-1 left-1 w-1 h-1 bg-[#ff6b6b]" style={{borderRadius: '1px'}}></div>
              <div className="absolute bottom-1 right-1 w-1 h-1 bg-[#ff6b6b]" style={{borderRadius: '1px'}}></div>
            </div>
          </div>

          {/* 수입 정보 입력 - 게임 스타일 */}
          <div className="space-y-2 sm:space-y-3 relative">
            <div className="bg-gradient-to-r from-[#ffd93d]/20 to-[#ff6b6b]/20 border border-[#ffd93d]/50 p-2 sm:p-3 relative"
                 style={{borderRadius: '4px'}}>
              <h4 className="text-[#ffd93d] text-center font-bold text-xs sm:text-sm font-mono tracking-wide mb-2 sm:mb-3" 
                  style={{textShadow: '0 0 6px rgba(255, 217, 61, 0.5)'}}>
                INCOME DATA
              </h4>
              
              {/* 1행: 건수, 배달금액, 미션비 */}
              <div className="grid grid-cols-3 gap-2 mb-2">
                <div>
                  <label className="text-[#ffd93d] text-xs font-mono mb-1 block">건수</label>
                  <input
                    type="number"
                    value={incomeCount}
                    onChange={(e) => setIncomeCount(e.target.value)}
                    placeholder="0"
                    className="w-full bg-[#0a0a23]/80 border-2 border-[#ffd93d]/30 px-2 py-1.5 text-white placeholder:text-gray-400 focus:border-[#ffd93d] transition-all duration-200 text-xs font-mono"
                    style={{borderRadius: '4px'}}
                  />
                </div>
                <div>
                  <label className="text-[#ffd93d] text-xs font-mono mb-1 block">배달금액</label>
                  <input
                    type="number"
                    value={incomeAmount}
                    onChange={(e) => setIncomeAmount(e.target.value)}
                    placeholder="0"
                    className="w-full bg-[#0a0a23]/80 border-2 border-[#ffd93d]/30 px-2 py-1.5 text-white placeholder:text-gray-400 focus:border-[#ffd93d] transition-all duration-200 text-xs font-mono"
                    style={{borderRadius: '4px'}}
                  />
                </div>
                <div>
                  <label className="text-[#ffd93d] text-xs font-mono mb-1 block">미션비</label>
                  <input
                    type="number"
                    value={missionAmount}
                    onChange={(e) => setMissionAmount(e.target.value)}
                    placeholder="0"
                    className="w-full bg-[#0a0a23]/80 border-2 border-[#ffd93d]/30 px-2 py-1.5 text-white placeholder:text-gray-400 focus:border-[#ffd93d] transition-all duration-200 text-xs font-mono"
                    style={{borderRadius: '4px'}}
                  />
                </div>
              </div>
              
              {/* 총 금액 표시 */}
              <div className="bg-[#ffd93d]/10 border border-[#ffd93d]/30 p-2 text-center"
                   style={{borderRadius: '4px'}}>
                <div className="text-[#ffd93d] text-xs font-mono mb-1">총 금액</div>
                <div className="text-white text-lg font-mono font-bold" 
                     style={{textShadow: '0 0 6px rgba(255, 217, 61, 0.8)'}}>
                  ₩{((parseInt(incomeAmount) || 0) + (parseInt(missionAmount) || 0)).toLocaleString()}
                </div>
              </div>
              
              {/* 모서리 픽셀 도트 */}
              <div className="absolute top-1 left-1 w-1 h-1 bg-[#ffd93d]" style={{borderRadius: '1px'}}></div>
              <div className="absolute top-1 right-1 w-1 h-1 bg-[#ffd93d]" style={{borderRadius: '1px'}}></div>
              <div className="absolute bottom-1 left-1 w-1 h-1 bg-[#ffd93d]" style={{borderRadius: '1px'}}></div>
              <div className="absolute bottom-1 right-1 w-1 h-1 bg-[#ffd93d]" style={{borderRadius: '1px'}}></div>
            </div>
          </div>

          {/* 사진 업로드 인증 - 게임 스타일 */}
          <div className="space-y-2 sm:space-y-3 relative">
            <div className="bg-gradient-to-r from-[#9c88ff]/20 to-[#6c5ce7]/20 border border-[#9c88ff]/50 p-2 sm:p-3 relative"
                 style={{borderRadius: '4px'}}>
              <h4 className="text-[#9c88ff] text-center font-bold text-xs sm:text-sm font-mono tracking-wide mb-2 sm:mb-3" 
                  style={{textShadow: '0 0 6px rgba(156, 136, 255, 0.5)'}}>
                VERIFICATION
              </h4>
              
              {/* 사진 업로드 영역 */}
              <div className="relative">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setIncomeImage(e.target.files?.[0] || null)}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  id="income-image-upload"
                />
                <label
                  htmlFor="income-image-upload"
                  className="block w-full bg-[#0a0a23]/80 border-2 border-dashed border-[#9c88ff]/40 hover:border-[#9c88ff]/80 p-4 text-center cursor-pointer transition-all duration-200 relative"
                  style={{borderRadius: '4px'}}
                >
                  {incomeImage ? (
                    <div className="text-[#9c88ff]">
                      <div className="text-2xl mb-1">📸</div>
                      <div className="text-xs font-mono font-bold">
                        {incomeImage.name}
                      </div>
                      <div className="text-xs font-mono text-gray-400 mt-1">
                        클릭해서 다른 사진 선택
                      </div>
                    </div>
                  ) : (
                    <div className="text-[#9c88ff]">
                      <div className="text-2xl mb-1">📱</div>
                      <div className="text-xs font-mono font-bold mb-1">
                        수입 인증 사진
                      </div>
                      <div className="text-xs font-mono text-gray-400">
                        클릭해서 사진 업로드
                      </div>
                    </div>
                  )}
                  
                  {/* 업로드 상태 표시 픽셀 도트 */}
                  {incomeImage && (
                    <>
                      <div className="absolute top-1 left-1 w-1.5 h-1.5 bg-[#00ff88]" style={{borderRadius: '1px'}}></div>
                      <div className="absolute top-1 right-1 w-1.5 h-1.5 bg-[#00ff88]" style={{borderRadius: '1px'}}></div>
                      <div className="absolute bottom-1 left-1 w-1.5 h-1.5 bg-[#00ff88]" style={{borderRadius: '1px'}}></div>
                      <div className="absolute bottom-1 right-1 w-1.5 h-1.5 bg-[#00ff88]" style={{borderRadius: '1px'}}></div>
                    </>
                  )}
                </label>
              </div>
              
              {/* 모서리 픽셀 도트 */}
              <div className="absolute top-1 left-1 w-1 h-1 bg-[#9c88ff]" style={{borderRadius: '1px'}}></div>
              <div className="absolute top-1 right-1 w-1 h-1 bg-[#9c88ff]" style={{borderRadius: '1px'}}></div>
              <div className="absolute bottom-1 left-1 w-1 h-1 bg-[#9c88ff]" style={{borderRadius: '1px'}}></div>
              <div className="absolute bottom-1 right-1 w-1 h-1 bg-[#9c88ff]" style={{borderRadius: '1px'}}></div>
            </div>
          </div>

          {/* 저장 버튼 - 게임 스타일 */}
          <button
            onClick={handleSubmit}
            className="w-full bg-gradient-to-r from-[#00ff88]/20 to-[#00d4ff]/20 border-2 border-[#00ff88]/50 hover:border-[#00ff88] text-[#00ff88] hover:text-white font-bold py-3 sm:py-4 transition-all duration-300 hover:scale-105 hover:shadow-lg relative font-mono tracking-wide"
            style={{
              borderRadius: '6px',
              textShadow: '0 0 6px rgba(0, 255, 136, 0.5)',
              boxShadow: '0 0 15px rgba(0, 255, 136, 0.2)'
            }}
          >
            <div className="flex items-center justify-center gap-1.5 sm:gap-2">
              <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-[#00ff88] border border-white" style={{borderRadius: '1px'}}></div>
              <span className="text-sm sm:text-base">SAVE INCOME</span>
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
  )
}

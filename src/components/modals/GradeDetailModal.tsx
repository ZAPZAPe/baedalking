import React from 'react'

interface GradeDetailModalProps {
  isOpen: boolean
  onClose: () => void
  grade: {
    name: string
    minIncome: number
    maxIncome: number
    color: string
    description: string
  }
  userIncome: number
  userRank: number
  totalUsers: number
}

export default function GradeDetailModal({
  isOpen,
  onClose,
  grade,
  userIncome,
  userRank,
  totalUsers
}: GradeDetailModalProps) {
  if (!isOpen) return null

  const gradeProgress = grade.maxIncome > 0 
    ? Math.min(((userIncome - grade.minIncome) / (grade.maxIncome - grade.minIncome)) * 100, 100)
    : 0

  const nextGradeIncome = grade.maxIncome > 0 ? grade.maxIncome - userIncome : 0

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
          className="w-full max-w-md bg-gradient-to-b from-[#0a0a23] via-[#16213e] to-[#1a1a2e] border-2 sm:border-4 border-[#ffd93d]/50 shadow-2xl relative max-h-[calc(100vh-32px)] overflow-y-auto pointer-events-auto"
          style={{
            borderRadius: '6px',
            fontFamily: 'monospace',
            imageRendering: 'pixelated',
            boxShadow: `0 0 20px ${grade.color}20, inset 0 0 15px ${grade.color}05`
          }}
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
          }}
          onTouchStart={(e) => e.stopPropagation()}
          onTouchEnd={(e) => e.stopPropagation()}
        >
          
          {/* 네온 글로우 테두리 */}
          <div className="absolute -inset-1 bg-gradient-to-r from-[#ffd93d]/20 via-[#ff6b6b]/20 to-[#ffd93d]/20 blur-sm -z-10" 
               style={{borderRadius: '12px'}}></div>
          
          {/* 헤더 */}
          <div className="bg-gradient-to-r from-[#0a0a23] to-[#16213e] p-3 sm:p-4 border-b-2 border-[#ffd93d]/30 relative">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2 sm:gap-3">
                {/* 픽셀 아이콘 */}
                <div className="w-5 h-5 sm:w-6 sm:h-6 bg-gradient-to-br from-[#ffd93d] to-[#ff6b6b] border border-[#ffd93d]" 
                     style={{borderRadius: '3px'}}>
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="w-2 h-2 sm:w-3 sm:h-3 bg-white" style={{borderRadius: '1px'}}></div>
                  </div>
                </div>
                <h3 className="text-[#ffd93d] font-bold text-sm sm:text-lg font-mono tracking-wide" 
                    style={{textShadow: `0 0 8px ${grade.color}50`}}>
                  GRADE DETAIL
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
          </div>

          <div className="p-3 sm:p-4 space-y-4">




            {/* 내 현재 상태 */}
            <div className="bg-gradient-to-r from-[#9c88ff]/20 to-[#ff6b6b]/20 border border-[#9c88ff]/50 p-3 relative"
                 style={{borderRadius: '4px'}}>
              <h5 className="text-[#9c88ff] text-center font-bold text-sm font-mono tracking-wide mb-3" 
                  style={{textShadow: '0 0 6px rgba(156, 136, 255, 0.5)'}}>
                MY STATUS
              </h5>
              <div className="space-y-3">
                {/* 현재 등급 */}
                <div className="text-center">
                  <div className="text-white text-xs font-mono mb-1">현재 등급</div>
                  <div className="text-[#9c88ff] font-bold text-lg font-mono">
                    {grade.name}
                  </div>
                </div>
                
                {/* 현재 수익 */}
                <div className="text-center">
                  <div className="text-white text-xs font-mono mb-1">현재 수익</div>
                  <div className="text-[#9c88ff] font-bold text-lg font-mono">
                    ₩{userIncome.toLocaleString()}
                  </div>
                </div>
                
                {/* 등급 진행률 */}
                {grade.maxIncome > 0 && (
                  <div className="space-y-2">
                    <div className="text-white text-xs font-mono text-center">등급 진행률</div>
                    <div className="bg-[#1a202c] h-3 rounded-full overflow-hidden border border-[#9c88ff]/30">
                      <div 
                        className="h-full bg-gradient-to-r from-[#9c88ff] to-[#ff6b6b] transition-all duration-500"
                        style={{width: `${gradeProgress}%`}}
                      ></div>
                    </div>
                    <div className="text-[#9c88ff] text-xs font-mono text-center">
                      {gradeProgress.toFixed(1)}%
                    </div>
                  </div>
                )}
              </div>
              
              {/* 모서리 픽셀 도트 */}
              <div className="absolute top-1 left-1 w-1 h-1 bg-[#9c88ff]" style={{borderRadius: '1px'}}></div>
              <div className="absolute top-1 right-1 w-1 h-1 bg-[#9c88ff]" style={{borderRadius: '1px'}}></div>
              <div className="absolute bottom-1 left-1 w-1 h-1 bg-[#9c88ff]" style={{borderRadius: '1px'}}></div>
              <div className="absolute bottom-1 right-1 w-1 h-1 bg-[#9c88ff]" style={{borderRadius: '1px'}}></div>
            </div>

            {/* 등급 분포도 */}
            <div className="bg-gradient-to-br from-[#1a202c] to-[#2d3748] border-2 border-[#ffd93d]/50 p-4 relative"
                 style={{borderRadius: '8px'}}>
              
              {/* 헤더 */}
              <div className="flex items-center justify-center mb-4">
                <h5 className="text-[#ffd93d] font-bold text-sm font-mono tracking-wide" 
                    style={{textShadow: '0 0 8px rgba(255, 217, 61, 0.5)'}}>
                  GRADE DISTRIBUTION
                </h5>
              </div>
              
              {/* 등급별 카드 그리드 */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { name: 'LEGEND', color: '#ff6b35', percentage: 2, minIncome: 300000, maxIncome: Infinity, icon: '👑' },
                  { name: 'DIAMOND', color: '#00d4ff', percentage: 5, minIncome: 200000, maxIncome: 299999, icon: '💎' },
                  { name: 'PLATINUM', color: '#9c88ff', percentage: 8, minIncome: 150000, maxIncome: 199999, icon: '🥇' },
                  { name: 'GOLD', color: '#ffd93d', percentage: 15, minIncome: 100000, maxIncome: 149999, icon: '🥈' },
                  { name: 'SILVER', color: '#c0c0c0', percentage: 25, minIncome: 50000, maxIncome: 99999, icon: '🥉' },
                  { name: 'BRONZE', color: '#cd7f32', percentage: 45, minIncome: 0, maxIncome: 49999, icon: '🏅' }
                ].map((gradeInfo) => {
                  const isCurrentGrade = grade.name === gradeInfo.name
                  const userCount = Math.floor((gradeInfo.percentage / 100) * totalUsers)
                  
                  return (
                    <div 
                      key={gradeInfo.name} 
                      className={`relative p-3 rounded-lg border-2 transition-all duration-300 ${
                        isCurrentGrade 
                          ? 'border-[#ffd93d] bg-[#ffd93d]/10 shadow-lg shadow-[#ffd93d]/20' 
                          : 'border-[#2d3748] bg-[#1a202c]/60 hover:border-[#ffd93d]/30'
                      }`}
                      style={{borderRadius: '6px'}}
                    >
                      {/* 등급 헤더 */}
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{gradeInfo.icon}</span>
                          <span className={`text-xs font-mono font-bold ${
                            isCurrentGrade ? 'text-[#ffd93d]' : 'text-white'
                          }`}>
                            {gradeInfo.name}
                          </span>
                        </div>
                        <div className={`text-xs font-mono font-bold ${
                          isCurrentGrade ? 'text-[#ffd93d]' : 'text-gray-400'
                        }`}>
                          {gradeInfo.percentage}%
                        </div>
                      </div>
                      
                      {/* 수익 범위 */}
                      <div className="text-center mb-3">
                        <div className={`text-xs font-mono ${
                          isCurrentGrade ? 'text-[#ffd93d]' : 'text-gray-400'
                        }`}>
                          {gradeInfo.minIncome === 0 ? '₩0' : `₩${(gradeInfo.minIncome / 10000).toFixed(0)}만`} ~ 
                          {gradeInfo.maxIncome === Infinity ? '' : ` ₩${(gradeInfo.maxIncome / 10000).toFixed(0)}만`}
                        </div>
                      </div>
                      
                      {/* 진행률 바 */}
                      <div className="bg-[#2d3748] h-2 rounded-full overflow-hidden border border-[#ffd93d]/20 relative">
                        <div 
                          className="h-full transition-all duration-500 ease-out rounded-full"
                          style={{ 
                            width: `${gradeInfo.percentage}%`,
                            background: `linear-gradient(90deg, ${gradeInfo.color}, ${gradeInfo.color}dd)`
                          }}
                        ></div>
                      </div>
                      
                      {/* 인원 수 */}
                      <div className="text-center mt-2">
                        <span className={`text-xs font-mono ${
                          isCurrentGrade ? 'text-[#ffd93d] font-bold' : 'text-gray-400'
                        }`}>
                          {userCount}명
                        </span>
                      </div>
                      

                    </div>
                  )
                })}
              </div>
              
              {/* 모서리 픽셀 도트 */}
              <div className="absolute top-2 left-2 w-1 h-1 bg-[#ffd93d]" style={{borderRadius: '1px'}}></div>
              <div className="absolute top-2 right-2 w-1 h-1 bg-[#ffd93d]" style={{borderRadius: '1px'}}></div>
              <div className="absolute bottom-2 left-2 w-1 h-1 bg-[#ffd93d]" style={{borderRadius: '1px'}}></div>
              <div className="absolute bottom-2 right-2 w-1 h-1 bg-[#ffd93d]" style={{borderRadius: '1px'}}></div>
            </div>



            {/* 닫기 버튼 */}
            <button
              onClick={onClose}
              className="w-full bg-gradient-to-r from-[#ffd93d]/20 to-[#ff6b6b]/20 border-2 border-[#ffd93d]/50 hover:border-[#ffd93d] text-[#ffd93d] hover:text-white font-bold py-3 transition-all duration-300 hover:scale-105 hover:shadow-lg relative font-mono tracking-wide"
              style={{
                borderRadius: '6px',
                textShadow: '0 0 6px rgba(255, 217, 61, 0.5)',
                boxShadow: '0 0 15px rgba(255, 217, 61, 0.2)'
              }}
            >
              <div className="flex items-center justify-center gap-2">
                <div className="w-2.5 h-2.5 bg-[#ffd93d] border border-white" style={{borderRadius: '1px'}}></div>
                <span className="text-sm">CLOSE</span>
                <div className="w-2.5 h-2.5 bg-[#ffd93d] border border-white" style={{borderRadius: '1px'}}></div>
              </div>
              
              {/* 버튼 모서리 픽셀 도트 */}
              <div className="absolute top-1 left-1 w-1 h-1 bg-[#ffd93d]" style={{borderRadius: '1px'}}></div>
              <div className="absolute top-1 right-1 w-1 h-1 bg-[#ffd93d]" style={{borderRadius: '1px'}}></div>
              <div className="absolute bottom-1 left-1 w-1 h-1 bg-[#ffd93d]" style={{borderRadius: '1px'}}></div>
              <div className="absolute bottom-1 right-1 w-1 h-1 bg-[#ffd93d]" style={{borderRadius: '1px'}}></div>
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

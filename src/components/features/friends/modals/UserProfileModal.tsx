import React from 'react'
import { useRouter } from 'next/navigation'
import { Platform } from '@/types'

interface UserProfile {
  id: string
  nickname: string
  region: string
  income: number
  count: number
  platforms: string[] // 수입 등록된 플랫폼들
  rank?: number // 랭킹 정보 (선택적)
  grade?: string // 등급 정보 (선택적)
  isIncomePrivate: boolean // 수익 비공개 설정 (필수)
  minihomeId?: string // 미니홈피 ID (선택적)
}

interface UserProfileModalProps {
  isOpen: boolean
  onClose: () => void
  user: UserProfile | null
  platforms: Platform[]
  title?: string // 모달 제목 (기본값: "USER PROFILE")
}

export default function UserProfileModal({
  isOpen,
  onClose,
  user,
  platforms,
  title = "USER PROFILE"
}: UserProfileModalProps) {
  const router = useRouter()
  
  if (!isOpen || !user) return null

  // 플랫폼별 설정을 위한 헬퍼 함수
  const getPlatformConfig = (platformId: string) => {
    if (platformId === 'baemin') {
      return { 
        name: '배민',
        color: '#00C851',
        bgColor: '#00C851'
      }
    } else if (platformId === 'coupang') {
      return { 
        name: '쿠팡',
        color: '#E4002B',
        bgColor: '#E4002B'
      }
    } else {
      // 커스텀 플랫폼은 platforms 배열에서 찾기
      const customPlatform = platforms.find(p => p.id === platformId)
      if (customPlatform) {
        return { 
          name: customPlatform.name,
          color: customPlatform.color,
          bgColor: customPlatform.color
        }
      } else {
        // 플랫폼을 찾을 수 없는 경우 기본값
        return { 
          name: platformId,
          color: '#9c88ff',
          bgColor: '#9c88ff'
        }
      }
    }
  }

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
          className="w-full max-w-sm sm:max-w-md bg-gradient-to-b from-[#0a0a23] via-[#16213e] to-[#1a1a2e] border-2 sm:border-4 border-[#ffd93d]/50 shadow-2xl relative max-h-[calc(100vh-32px)] overflow-y-auto pointer-events-auto"
          style={{
            borderRadius: '6px',
            fontFamily: 'monospace',
            imageRendering: 'pixelated',
            boxShadow: '0 0 20px rgba(255, 217, 61, 0.2), inset 0 0 15px rgba(255, 217, 61, 0.05)'
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
          
          {/* 헤더 - CHARACTER EDIT와 동일한 스타일 */}
          <div className="bg-gradient-to-r from-[#0a0a23] to-[#16213e] p-3 sm:p-4 border-b-2 border-[#ffd93d]/30 relative">
            {/* 상단 장식 라인 */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#ffd93d]/60 to-transparent"></div>
            
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
                      style={{textShadow: '0 0 8px rgba(255, 217, 61, 0.5)'}}>
                    {title}
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
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#ffd93d]/40 to-transparent"></div>
          </div>

          <div className="p-3 sm:p-4 space-y-3 sm:space-y-4 relative">
            {/* 배경 패턴 */}
            <div className="absolute inset-0 opacity-5">
              <div className="w-full h-full" 
                   style={{
                     backgroundImage: `radial-gradient(circle, #ffd93d 1px, transparent 1px)`,
                     backgroundSize: '12px 12px'
                   }}></div>
            </div>
            
            {/* 랭커 정보 - CHARACTER EDIT 스타일 */}
            <div className="space-y-2 sm:space-y-3 relative">
              <div className="bg-gradient-to-r from-[#ffd93d]/20 to-[#ff6b6b]/20 border border-[#ffd93d]/50 p-2 sm:p-3 relative"
                   style={{borderRadius: '4px'}}>
                <h4 className="text-[#ffd93d] text-center font-bold text-xs sm:text-sm font-mono tracking-wide mb-2 sm:mb-3 mt-2 sm:mt-3" 
                    style={{textShadow: '0 0 6px rgba(255, 217, 61, 0.5)'}}>
                  USER INFO
                </h4>
                <div className="text-center mb-4">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-3 relative">
                    <div className="w-full h-full flex items-center justify-center rounded-lg border-2 border-[#ffd93d]/50 bg-gradient-to-br from-[#ffd93d]/20 to-[#ff6b6b]/20">
                      <div className="relative w-12 h-12 sm:w-16 sm:h-16">
                        {/* 기본 캐릭터 베이스 (가장 아래 레이어) */}
                        <img 
                          src="/Garage/Character/배민/S_1.png"
                          alt="기본 캐릭터" 
                          className="absolute w-full h-full object-contain"
                          style={{ imageRendering: 'pixelated' }}
                        />
                        
                        {/* 감정표현은 상점에서 구매한 경우에만 표시 */}
                      </div>
                    </div>
                  </div>
                                      <h4 className="text-white font-bold text-base sm:text-lg font-mono mb-2">
                      {user.nickname || '사용자'}
                    </h4>
                    <div className="text-white text-sm font-mono text-center">
                      {user.region || '지역 없음'}
                    </div>
                </div>
                
                {/* 모서리 픽셀 도트 */}
                <div className="absolute top-1 left-1 w-1 h-1 bg-[#ffd93d]" style={{borderRadius: '1px'}}></div>
                <div className="absolute top-1 right-1 w-1 h-1 bg-[#ffd93d]" style={{borderRadius: '1px'}}></div>
                <div className="absolute bottom-1 left-1 w-1 h-1 bg-[#ffd93d]" style={{borderRadius: '1px'}}></div>
                <div className="absolute bottom-1 right-1 w-1 h-1 bg-[#ffd93d]" style={{borderRadius: '1px'}}></div>
              </div>
            </div>
            
            {/* 수입 상세 정보 - INCOME DETAIL 스타일 */}
            <div className="space-y-2 sm:space-y-3 relative">
              <div className="bg-gradient-to-r from-[#00d4ff]/20 to-[#9c88ff]/20 border border-[#00d4ff]/50 p-2 sm:p-3 relative"
                   style={{borderRadius: '4px'}}>
                <h4 className="text-[#00d4ff] text-center font-bold text-xs sm:text-sm font-mono tracking-wide mb-2 sm:mb-3" 
                    style={{textShadow: '0 0 6px rgba(0, 212, 255, 0.5)'}}>
                  INCOME DETAIL
                </h4>
                
                {/* 상세 정보 그리드 - INCOME DETAIL과 동일한 스타일 */}
                <div className="grid grid-cols-2 gap-2 sm:gap-3">
                  {/* 수입 */}
                  <div className={`p-2 sm:p-3 rounded-lg text-center border transition-all duration-200 ${
                    user.isIncomePrivate 
                      ? 'bg-gray-600/20 border-gray-500/30' 
                      : 'bg-[#1a202c]/50 border-[#00d4ff]/30'
                  }`} style={{borderRadius: '4px'}}>
                    <div className={`text-xs font-mono font-bold mb-1 ${
                      user.isIncomePrivate ? 'text-gray-500' : 'text-white'
                    }`}>수입</div>
                    <div className={`text-sm font-bold font-mono ${
                      user.isIncomePrivate ? 'text-gray-500' : 'text-white'
                    }`}>
                      {user.isIncomePrivate ? (
                        <span className="text-gray-500">비공개</span>
                      ) : (
                        `₩${user.income.toLocaleString()}`
                      )}
                    </div>
                  </div>
                  
                  {/* 건수 */}
                  <div className={`p-2 sm:p-3 rounded-lg text-center border transition-all duration-200 ${
                    user.isIncomePrivate 
                      ? 'bg-gray-600/20 border-gray-500/30' 
                      : 'bg-[#1a202c]/50 border-[#9c88ff]/30'
                  }`} style={{borderRadius: '4px'}}>
                    <div className={`text-xs font-mono font-bold mb-1 ${
                      user.isIncomePrivate ? 'text-gray-500' : 'text-white'
                    }`}>건수</div>
                    <div className={`text-sm font-bold font-mono ${
                      user.isIncomePrivate ? 'text-gray-500' : 'text-white'
                    }`}>
                      {user.isIncomePrivate ? (
                        <span className="text-gray-500">비공개</span>
                      ) : (
                        `${user.count}건`
                      )}
                    </div>
                  </div>
                </div>
                
                {/* 모서리 픽셀 도트 */}
                <div className="absolute top-1 left-1 w-1 h-1 bg-[#00d4ff]" style={{borderRadius: '1px'}}></div>
                <div className="absolute top-1 right-1 w-1 h-1 bg-[#00d4ff]" style={{borderRadius: '1px'}}></div>
                <div className="absolute bottom-1 left-1 w-1 h-1 bg-[#00d4ff]" style={{borderRadius: '1px'}}></div>
                <div className="absolute bottom-1 right-1 w-1 h-1 bg-[#00d4ff]" style={{borderRadius: '1px'}}></div>
              </div>
            </div>
            
            {/* 플랫폼 정보 */}
            <div className="space-y-2 sm:space-y-3 relative">
              <div className="bg-gradient-to-r from-[#9c88ff]/20 to-[#ff6b6b]/20 border border-[#9c88ff]/50 p-2 sm:p-3 relative"
                   style={{borderRadius: '4px'}}>
                <h4 className="text-[#9c88ff] text-center font-bold text-xs sm:text-sm font-mono tracking-wide mb-2 sm:mb-3" 
                    style={{textShadow: '0 0 6px rgba(156, 136, 255, 0.5)'}}>
                  PLATFORM
                </h4>
                <div className="text-center">
                  <div className="flex flex-wrap justify-center gap-2">
                    {user.platforms && user.platforms.length > 0 ? (
                      user.platforms.map((platform: string, index: number) => {
                        const platformConfig = getPlatformConfig(platform)
                        return (
                          <div 
                            key={index}
                            className="px-3 py-1 rounded-lg text-xs font-mono font-bold border"
                            style={{
                              backgroundColor: `${platformConfig.bgColor}20`,
                              color: platformConfig.color,
                              borderColor: `${platformConfig.bgColor}50`,
                              borderRadius: '4px'
                            }}
                          >
                            {platformConfig.name}
                          </div>
                        )
                      })
                    ) : (
                      <div className="text-gray-400 text-xs font-mono">
                        등록된 플랫폼 없음
                      </div>
                    )}
                  </div>
                </div>
                
                {/* 모서리 픽셀 도트 */}
                <div className="absolute top-1 left-1 w-1 h-1 bg-[#9c88ff]" style={{borderRadius: '1px'}}></div>
                <div className="absolute top-1 right-1 w-1 h-1 bg-[#9c88ff]" style={{borderRadius: '1px'}}></div>
                <div className="absolute bottom-1 left-1 w-1 h-1 bg-[#9c88ff]" style={{borderRadius: '1px'}}></div>
                <div className="absolute bottom-1 right-1 w-1 h-1 bg-[#9c88ff]" style={{borderRadius: '1px'}}></div>
              </div>
            </div>
            
            {/* VISIT 버튼 - CHARACTER EDIT 스타일로 통일 */}
            <div className="pt-2">
              <button
                onClick={() => {
                  // 미니홈피 방문 로직
                  try {
                    router.push(`/garage/${user.id}`)
                    onClose() // 모달 닫기
                  } catch (error) {
                    // 폴백: window.location.href 사용
                    window.location.href = `/garage/${user.id}`
                    onClose() // 모달 닫기
                  }
                }}
                className="w-full bg-gradient-to-r from-[#ffd93d]/20 to-[#ff6b6b]/20 border-2 border-[#ffd93d]/50 hover:border-[#ffd93d] text-[#ffd93d] hover:text-white font-bold py-3 sm:py-4 transition-all duration-300 hover:scale-105 hover:shadow-lg relative font-mono tracking-wide"
                style={{
                  borderRadius: '6px',
                  textShadow: '0 0 6px rgba(255, 217, 61, 0.5)',
                  boxShadow: '0 0 15px rgba(255, 217, 61, 0.2)'
                }}
              >
                <div className="flex items-center justify-center gap-1.5 sm:gap-2">
                  <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-[#ffd93d] border border-white" style={{borderRadius: '1px'}}></div>
                  <span className="text-sm sm:text-base">VISIT</span>
                  <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-[#ffd93d] border border-white" style={{borderRadius: '1px'}}></div>
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
      </div>
    </>
  )
}

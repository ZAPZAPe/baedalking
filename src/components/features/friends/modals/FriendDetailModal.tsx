import React, { useState } from 'react'
import { useRouter } from 'next/navigation'

interface FriendDetailModalProps {
  isOpen: boolean
  onClose: () => void
  friend: {
    id: string
    name: string
    region: string
    income: number
    rank: number
    grade: string
    platform: string
    count: number
    minihomeId?: string
  }
}

export default function FriendDetailModal({
  isOpen,
  onClose,
  friend
}: FriendDetailModalProps) {
  const router = useRouter()
  const [isPrivate, setIsPrivate] = useState(false)

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
          className="w-full max-w-md bg-gradient-to-b from-[#0a0a23] via-[#16213e] to-[#1a1a2e] border-2 sm:border-4 border-[#00d4ff]/50 shadow-2xl relative max-h-[calc(100vh-32px)] overflow-y-auto pointer-events-auto"
          style={{
            borderRadius: '6px',
            fontFamily: 'monospace',
            imageRendering: 'pixelated',
            boxShadow: '0 0 20px rgba(0, 212, 255, 0.2), inset 0 0 15px rgba(0, 212, 255, 0.05)'
          }}
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
          }}
          onTouchStart={(e) => e.stopPropagation()}
          onTouchEnd={(e) => e.stopPropagation()}
        >
          
          {/* 네온 글로우 테두리 */}
          <div className="absolute -inset-1 bg-gradient-to-r from-[#00d4ff]/20 via-[#9c88ff]/20 to-[#00d4ff]/20 blur-sm -z-10" 
               style={{borderRadius: '12px'}}></div>
          
          {/* 헤더 - 게임 스타일 반응형 */}
          <div className="bg-gradient-to-r from-[#0a0a23] to-[#16213e] p-3 sm:p-4 border-b-2 border-[#00d4ff]/30 relative">
            {/* 상단 장식 라인 */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#00d4ff]/60 to-transparent"></div>
            
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2 sm:gap-3">
                {/* 픽셀 아이콘 */}
                <div className="w-5 h-5 sm:w-6 sm:h-6 bg-gradient-to-br from-[#00d4ff] to-[#9c88ff] border border-[#00d4ff]" 
                     style={{borderRadius: '3px'}}>
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="w-2 h-2 sm:w-3 sm:h-3 bg-white" style={{borderRadius: '1px'}}></div>
                  </div>
                </div>
                <h3 className="text-[#00d4ff] font-bold text-sm sm:text-lg font-mono tracking-wide" 
                    style={{textShadow: '0 0 8px rgba(0, 212, 255, 0.5)'}}>
                  FRIEND PROFILE
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
            {/* 친구 기본 정보 */}
            <div className="bg-gradient-to-r from-[#00d4ff]/20 to-[#9c88ff]/20 border border-[#00d4ff]/50 p-4 relative"
                 style={{borderRadius: '4px'}}>
              <div className="text-center mb-4">
                {/* 캐릭터 아바타 */}
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-[#00d4ff] to-[#9c88ff] rounded-full flex items-center justify-center mx-auto mb-3 border-2 border-[#00d4ff] relative">
                  <span className="text-white text-2xl sm:text-3xl font-bold font-mono">
                    {friend.name.charAt(0)}
                  </span>
                  {/* 캐릭터 장식 요소들 */}
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-[#ffd93d] rounded-full border border-white"></div>
                  <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-[#ff6b6b] rounded-full border border-white"></div>
                </div>
                
                {/* 닉네임 */}
                <h4 className="text-[#00d4ff] font-bold text-lg sm:text-xl font-mono mb-2" 
                    style={{textShadow: '0 0 8px rgba(0, 212, 255, 0.5)'}}>
                  {friend.name}
                </h4>
                
                {/* 지역 */}
                <div className="text-white text-sm font-mono flex items-center justify-center gap-2">
                  <div className="w-2 h-2 bg-[#00d4ff] rounded-full"></div>
                  {friend.region}
                </div>
              </div>
              
              {/* 모서리 픽셀 도트 */}
              <div className="absolute top-1 left-1 w-1 h-1 bg-[#00d4ff]" style={{borderRadius: '1px'}}></div>
              <div className="absolute top-1 right-1 w-1 h-1 bg-[#00d4ff]" style={{borderRadius: '1px'}}></div>
              <div className="absolute bottom-1 left-1 w-1 h-1 bg-[#00d4ff]" style={{borderRadius: '1px'}}></div>
              <div className="absolute bottom-1 right-1 w-1 h-1 bg-[#00d4ff]" style={{borderRadius: '1px'}}></div>
            </div>

            {/* 친구 배달 정보 */}
            <div className="bg-gradient-to-r from-[#9c88ff]/20 to-[#ff6b6b]/20 border border-[#9c88ff]/50 p-4 relative"
                 style={{borderRadius: '4px'}}>
              <div className="flex items-center justify-between mb-4">
                <h5 className="text-[#9c88ff] font-bold text-sm font-mono tracking-wide" 
                    style={{textShadow: '0 0 6px rgba(156, 136, 255, 0.5)'}}>
                  DELIVERY STATS
                </h5>
                
                {/* 비공개 토글 버튼 */}
                <button
                  onClick={() => setIsPrivate(!isPrivate)}
                  className={`px-3 py-1 text-xs font-mono font-bold transition-all duration-200 rounded ${
                    isPrivate 
                      ? 'bg-[#ff6b6b]/20 text-[#ff6b6b] border border-[#ff6b6b]/50' 
                      : 'bg-[#9c88ff]/20 text-[#9c88ff] border border-[#9c88ff]/50'
                  }`}
                  style={{borderRadius: '4px'}}
                >
                  {isPrivate ? '비공개' : '공개'}
                </button>
              </div>
              
              {isPrivate ? (
                /* 비공개 상태 */
                <div className="text-center py-8">
                  <div className="w-12 h-12 bg-[#9c88ff]/20 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-[#9c88ff] text-2xl">🔒</span>
                  </div>
                  <div className="text-[#9c88ff] text-sm font-mono">
                    이 친구는 배달 정보를 비공개로 설정했습니다
                  </div>
                </div>
              ) : (
                /* 공개 상태 */
                <div className="grid grid-cols-2 gap-4">
                  {/* 등급 */}
                  <div className="text-center">
                    <div className="text-white text-xs font-mono mb-1">등급</div>
                    <div className="text-[#9c88ff] font-bold text-lg font-mono">
                      {friend.grade}
                    </div>
                  </div>
                  
                  {/* 순위 */}
                  <div className="text-center">
                    <div className="text-white text-xs font-mono mb-1">순위</div>
                    <div className="text-[#9c88ff] font-bold text-lg font-mono">
                      {friend.rank}위
                    </div>
                  </div>
                </div>
              )}
              
              {/* 모서리 픽셀 도트 */}
              <div className="absolute top-1 left-1 w-1 h-1 bg-[#9c88ff]" style={{borderRadius: '1px'}}></div>
              <div className="absolute top-1 right-1 w-1 h-1 bg-[#9c88ff]" style={{borderRadius: '1px'}}></div>
              <div className="absolute bottom-1 left-1 w-1 h-1 bg-[#9c88ff]" style={{borderRadius: '1px'}}></div>
              <div className="absolute bottom-1 right-1 w-1 h-1 bg-[#9c88ff]" style={{borderRadius: '1px'}}></div>
            </div>

            {/* 버튼들 - CHARACTER EDIT 스타일로 통일 */}
            <div className="flex gap-2 sm:gap-3 pt-4">
              <button
                onClick={() => {
                  // 미니홈피 방문 로직
                  try {
                    router.push(`/garage/${friend.minihomeId || friend.id}`)
                    onClose() // 모달 닫기
                  } catch (error) {
                    // 폴백: window.location.href 사용
                    window.location.href = `/garage/${friend.minihomeId || friend.id}`
                    onClose() // 모달 닫기
                  }
                }}
                className="flex-1 bg-gradient-to-r from-[#00d4ff]/20 to-[#9c88ff]/20 border-2 border-[#00d4ff]/50 hover:border-[#00d4ff] text-[#00d4ff] hover:text-white font-bold py-3 sm:py-4 transition-all duration-300 hover:scale-105 hover:shadow-lg relative font-mono tracking-wide"
                style={{
                  borderRadius: '6px',
                  textShadow: '0 0 6px rgba(0, 212, 255, 0.5)',
                  boxShadow: '0 0 15px rgba(0, 212, 255, 0.2)'
                }}
              >
                <div className="flex items-center justify-center gap-1.5 sm:gap-2">
                  <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-[#00d4ff] border border-white" style={{borderRadius: '1px'}}></div>
                  <span className="text-sm sm:text-base">VISIT</span>
                  <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-[#00d4ff] border border-white" style={{borderRadius: '1px'}}></div>
                </div>
                
                {/* 버튼 모서리 픽셀 도트 */}
                <div className="absolute top-1 left-1 w-1 h-1 bg-[#00d4ff]" style={{borderRadius: '1px'}}></div>
                <div className="absolute top-1 right-1 w-1 h-1 bg-[#00d4ff]" style={{borderRadius: '1px'}}></div>
                <div className="absolute bottom-1 left-1 w-1 h-1 bg-[#00d4ff]" style={{borderRadius: '1px'}}></div>
                <div className="absolute bottom-1 right-1 w-1 h-1 bg-[#00d4ff]" style={{borderRadius: '1px'}}></div>
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
    </>
  )
}

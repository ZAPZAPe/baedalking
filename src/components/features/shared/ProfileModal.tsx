'use client'

import React from 'react'
import { Platform } from '@/types'

interface ProfileUser {
  id: string
  nickname: string
  region: string
  income?: number
  count?: number
  platforms?: string[]
}

interface ProfileModalProps {
  isOpen: boolean
  onClose: () => void
  user: ProfileUser | null
  platforms?: Platform[]
  title?: string
  showVisitButton?: boolean
  visitUserId?: string
  isIncomePrivate?: boolean
  currentUserId?: string
}

export default function ProfileModal({
  isOpen,
  onClose,
  user,
  platforms = [],
  title = 'USER PROFILE',
  showVisitButton = false,
  visitUserId,
  isIncomePrivate = false,
  currentUserId
}: ProfileModalProps) {
  if (!isOpen || !user) return null

  // 플랫폼 설정 매핑 (수익현황과 동일 규칙)
  const getPlatformConfig = (platformId: string) => {
    const key = (platformId || '').toString().trim().toLowerCase()
    if (key === 'baemin' || key === '배민') {
      return { name: '배민', color: '#0CEFD3' }
    }
    if (key === 'coupang' || key === '쿠팡') {
      return { name: '쿠팡', color: '#e84821' }
    }
    // 커스텀: platforms에서 id/name으로 매칭, 없으면 기본
    const matched = platforms.find(p => (
      (p.id || '').toString().trim().toLowerCase() === key ||
      (p.name || '').toString().trim().toLowerCase() === key
    ))
    if (matched) {
      return { name: matched.name, color: matched.color }
    }
    return { name: platformId, color: '#9c88ff' }
  }

  const handleVisit = () => {
    try {
      const targetId = visitUserId || user.id
      window.location.href = `/garage/${targetId}`
      onClose()
    } catch (_) {
      onClose()
    }
  }

  // 친구 요청 상태
  const [isFriend, setIsFriend] = React.useState<boolean>(false)
  const [isRequesting, setIsRequesting] = React.useState<boolean>(false)
  const isSelf = currentUserId && user && currentUserId === user.id

  React.useEffect(() => {
    const checkFriend = async () => {
      try {
        if (!currentUserId || !user?.id || currentUserId === user.id) return
        const res = await fetch(`/api/friends?userId=${currentUserId}&status=accepted`)
        const data = await res.json()
        if (res.ok && Array.isArray(data.friends)) {
          const exists = data.friends.some((f: any) => f.friendId === user.id)
          setIsFriend(exists)
        }
      } catch (_) {
      }
    }
    checkFriend()
  }, [currentUserId, user?.id])

  const sendFriendRequest = async () => {
    if (!currentUserId || !user?.id || isSelf || isFriend) return
    setIsRequesting(true)
    try {
      const res = await fetch('/api/friends', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUserId, friendId: user.id })
      })
      const data = await res.json()
      if (res.ok) {
        setIsFriend(true)
        alert(data.message || '친구 요청을 보냈습니다.')
      } else {
        alert(data.error || '친구 요청에 실패했습니다.')
      }
    } catch (e) {
      alert('친구 요청 중 오류가 발생했습니다.')
    } finally {
      setIsRequesting(false)
    }
  }

  return (
    <>
      {/* 배경 */}
      <div className="fixed inset-0 z-[999999] bg-black" onClick={onClose} />

      {/* 모달 컨테이너 */}
      <div className="fixed inset-0 z-[999999] flex items-center justify-center p-2 sm:p-4 overflow-y-auto pointer-events-none">
        <div
          className="w-full max-w-sm sm:max-w-md bg-gradient-to-b from-[#0a0a23] via-[#16213e] to-[#1a1a2e] border-2 sm:border-4 border-[#ffd93d]/50 shadow-2xl relative max-h-[calc(100vh-32px)] overflow-y-auto pointer-events-auto"
          style={{ borderRadius: '6px', fontFamily: 'monospace', imageRendering: 'pixelated', boxShadow: '0 0 20px rgba(255, 217, 61, 0.2), inset 0 0 15px rgba(255, 217, 61, 0.05)' }}
          onClick={(e) => { e.preventDefault(); e.stopPropagation() }}
          onTouchStart={(e) => e.stopPropagation()}
          onTouchEnd={(e) => e.stopPropagation()}
        >
          {/* 네온 글로우 */}
          <div className="absolute -inset-1 bg-gradient-to-r from-[#ffd93d]/20 via-[#ff6b6b]/20 to-[#ffd93d]/20 blur-sm -z-10" style={{ borderRadius: '12px' }} />

          {/* 헤더 */}
          <div className="bg-gradient-to-r from-[#0a0a23] to-[#16213e] p-3 sm:p-4 border-b-2 border-[#ffd93d]/30 relative">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#ffd93d]/60 to-transparent" />
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-5 h-5 sm:w-6 sm:h-6 bg-gradient-to-br from-[#ffd93d] to-[#ff6b6b] border border-[#ffd93d]" style={{ borderRadius: '3px' }}>
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="w-2 h-2 sm:w-3 sm:h-3 bg-white" style={{ borderRadius: '1px' }} />
                  </div>
                </div>
                <h3 className="text-[#ffd93d] font-bold text-sm sm:text-lg font-mono tracking-wide" style={{ textShadow: '0 0 8px rgba(255, 217, 61, 0.5)' }}>{title}</h3>
              </div>
              <button onClick={onClose} className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-br from-[#ff6b6b]/20 to-[#ff4757]/20 border border-[#ff6b6b]/50 hover:border-[#ff6b6b] text-[#ff6b6b] hover:text-[#ff4757] font-bold transition-all duration-200 hover:scale-110 text-sm sm:text-base" style={{ borderRadius: '4px' }}>✕</button>
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#ffd93d]/40 to-transparent" />
          </div>

          {/* 바디 */}
          <div className="p-3 sm:p-4 space-y-3 sm:space-y-4 relative">
            <div className="absolute inset-0 opacity-5">
              <div className="w-full h-full" style={{ backgroundImage: `radial-gradient(circle, #ffd93d 1px, transparent 1px)`, backgroundSize: '12px 12px' }} />
            </div>

            {/* 유저 기본 정보 */}
            <div className="space-y-2 sm:space-y-3 relative">
              <div className="bg-gradient-to-r from-[#ffd93d]/20 to-[#ff6b6b]/20 border border-[#ffd93d]/50 p-2 sm:p-3 relative" style={{ borderRadius: '4px' }}>
                <h4 className="text-[#ffd93d] text-center font-bold text-xs sm:text-sm font-mono tracking-wide mb-2 sm:mb-3 mt-2 sm:mt-3" style={{ textShadow: '0 0 6px rgba(255, 217, 61, 0.5)' }}>USER INFO</h4>
                <div className="text-center mb-2 sm:mb-3">
                  <h4 className="text-white font-bold text-base sm:text-lg font-mono mb-1">{user.nickname || '사용자'}</h4>
                  <div className="text-white text-sm font-mono text-center">{user.region || '지역 없음'}</div>
                </div>
                <div className="absolute top-1 left-1 w-1 h-1 bg-[#ffd93d]" style={{ borderRadius: '1px' }} />
                <div className="absolute top-1 right-1 w-1 h-1 bg-[#ffd93d]" style={{ borderRadius: '1px' }} />
                <div className="absolute bottom-1 left-1 w-1 h-1 bg-[#ffd93d]" style={{ borderRadius: '1px' }} />
                <div className="absolute bottom-1 right-1 w-1 h-1 bg-[#ffd93d]" style={{ borderRadius: '1px' }} />
              </div>
            </div>

            {/* 수입 요약 (옵션) */}
            {(typeof user.income !== 'undefined' || typeof user.count !== 'undefined') && (
              <div className="space-y-2 sm:space-y-3 relative">
                <div className="bg-gradient-to-r from-[#00d4ff]/20 to-[#9c88ff]/20 border border-[#00d4ff]/50 p-2 sm:p-3 relative" style={{ borderRadius: '4px' }}>
                  <h4 className="text-[#00d4ff] text-center font-bold text-xs sm:text-sm font-mono tracking-wide mb-2 sm:mb-3" style={{ textShadow: '0 0 6px rgba(0, 212, 255, 0.5)' }}>INCOME DETAIL</h4>
                  <div className="grid grid-cols-2 gap-2 sm:gap-3">
                    <div className="bg-[#1a202c]/50 p-2 sm:p-3 rounded-lg text-center border" style={{ borderColor: '#00d4ff30', borderRadius: '4px' }}>
                      <div className="text-white text-xs font-mono font-bold mb-1">수입</div>
                      <div className="text-sm font-bold font-mono text-white">
                        {isIncomePrivate ? '비공개' : `₩${(user.income || 0).toLocaleString()}`}
                      </div>
                    </div>
                    <div className="bg-[#1a202c]/50 p-2 sm:p-3 rounded-lg text-center border" style={{ borderColor: '#9c88ff30', borderRadius: '4px' }}>
                      <div className="text-white text-xs font-mono font-bold mb-1">건수</div>
                      <div className="text-sm font-bold font-mono text-white">
                        {isIncomePrivate ? '비공개' : `${user.count || 0}건`}
                      </div>
                    </div>
                  </div>
                  <div className="absolute top-1 left-1 w-1 h-1 bg-[#00d4ff]" style={{ borderRadius: '1px' }} />
                  <div className="absolute top-1 right-1 w-1 h-1 bg-[#00d4ff]" style={{ borderRadius: '1px' }} />
                  <div className="absolute bottom-1 left-1 w-1 h-1 bg-[#00d4ff]" style={{ borderRadius: '1px' }} />
                  <div className="absolute bottom-1 right-1 w-1 h-1 bg-[#00d4ff]" style={{ borderRadius: '1px' }} />
                </div>
              </div>
            )}

            {/* 플랫폼 배지 */}
            <div className="space-y-2 sm:space-y-3 relative">
              <div className="bg-gradient-to-r from-[#9c88ff]/20 to-[#ff6b6b]/20 border border-[#9c88ff]/50 p-2 sm:p-3 relative" style={{ borderRadius: '4px' }}>
                <h4 className="text-[#9c88ff] text-center font-bold text-xs sm:text-sm font-mono tracking-wide mb-2 sm:mb-3" style={{ textShadow: '0 0 6px rgba(156, 136, 255, 0.5)' }}>PLATFORM</h4>
                <div className="text-center">
                  <div className="flex flex-wrap justify-center gap-2">
                    {user.platforms && user.platforms.length > 0 ? (
                      user.platforms.map((platformId: string, index: number) => {
                        const cfg = getPlatformConfig(platformId)
                        return (
                          <div key={index} className="px-3 py-1 rounded-lg text-xs font-mono font-bold border" style={{ backgroundColor: `${cfg.color}20`, color: cfg.color, borderColor: `${cfg.color}50`, borderRadius: '4px' }}>
                            {cfg.name}
                          </div>
                        )
                      })
                    ) : (
                      <div className="text-gray-400 text-xs font-mono">등록된 플랫폼 없음</div>
                    )}
                  </div>
                </div>
                <div className="absolute top-1 left-1 w-1 h-1 bg-[#9c88ff]" style={{ borderRadius: '1px' }} />
                <div className="absolute top-1 right-1 w-1 h-1 bg-[#9c88ff]" style={{ borderRadius: '1px' }} />
                <div className="absolute bottom-1 left-1 w-1 h-1 bg-[#9c88ff]" style={{ borderRadius: '1px' }} />
                <div className="absolute bottom-1 right-1 w-1 h-1 bg-[#9c88ff]" style={{ borderRadius: '1px' }} />
              </div>
            </div>

            {/* 방문 버튼 옵션 */}
            {(showVisitButton || currentUserId) && (
              <div className="pt-2 grid grid-cols-2 gap-2">
                {showVisitButton && (
                  <button
                    onClick={handleVisit}
                    className="w-full bg-gradient-to-r from-[#ffd93d]/20 to-[#ff6b6b]/20 border-2 border-[#ffd93d]/50 hover:border-[#ffd93d] text-[#ffd93d] hover:text-white font-bold py-3 sm:py-4 transition-all duration-300 hover:scale-105 hover:shadow-lg relative font-mono tracking-wide"
                    style={{ borderRadius: '6px', textShadow: '0 0 6px rgba(255, 217, 61, 0.5)', boxShadow: '0 0 15px rgba(255, 217, 61, 0.2)' }}
                  >
                    <div className="flex items-center justify-center gap-1.5 sm:gap-2">
                      <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-[#ffd93d] border border-white" style={{ borderRadius: '1px' }} />
                      <span className="text-sm sm:text-base">VISIT</span>
                      <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-[#ffd93d] border border-white" style={{ borderRadius: '1px' }} />
                    </div>
                    <div className="absolute top-1 left-1 w-1 h-1 bg-[#ffd93d]" style={{ borderRadius: '1px' }} />
                    <div className="absolute top-1 right-1 w-1 h-1 bg-[#ffd93d]" style={{ borderRadius: '1px' }} />
                    <div className="absolute bottom-1 left-1 w-1 h-1 bg-[#ffd93d]" style={{ borderRadius: '1px' }} />
                    <div className="absolute bottom-1 right-1 w-1 h-1 bg-[#ffd93d]" style={{ borderRadius: '1px' }} />
                  </button>
                )}
                {currentUserId && (
                  <button
                    onClick={sendFriendRequest}
                    disabled={!!isSelf || isFriend || isRequesting}
                    className={`w-full border-2 font-bold py-3 sm:py-4 transition-all duration-300 relative font-mono tracking-wide ${
                      isSelf || isFriend
                        ? 'bg-gray-500/20 border-gray-500/50 text-gray-400 cursor-not-allowed'
                        : 'bg-gradient-to-r from-[#00ff88]/20 to-[#00d4ff]/20 border-[#00ff88]/50 hover:border-[#00ff88] text-[#00ff88] hover:text-white hover:scale-105 hover:shadow-lg'
                    }`}
                    style={{ borderRadius: '6px', textShadow: isSelf || isFriend ? 'none' : '0 0 6px rgba(0, 255, 136, 0.5)', boxShadow: isSelf || isFriend ? 'none' : '0 0 15px rgba(0, 255, 136, 0.2)' }}
                  >
                    <div className="flex items-center justify-center gap-1.5 sm:gap-2">
                      <div className={`w-2.5 h-2.5 sm:w-3 sm:h-3 ${isSelf || isFriend ? 'bg-gray-500 border border-gray-400' : 'bg-[#00ff88] border border-white'}`} style={{ borderRadius: '1px' }} />
                      <span className="text-sm sm:text-base">{isSelf ? '내 프로필' : isFriend ? '이미 친구' : isRequesting ? '요청 중...' : '친구 요청'}</span>
                      <div className={`w-2.5 h-2.5 sm:w-3 sm:h-3 ${isSelf || isFriend ? 'bg-gray-500 border border-gray-400' : 'bg-[#00ff88] border border-white'}`} style={{ borderRadius: '1px' }} />
                    </div>
                    {!isSelf && !isFriend && (
                      <>
                        <div className="absolute top-1 left-1 w-1 h-1 bg-[#00ff88]" style={{ borderRadius: '1px' }} />
                        <div className="absolute top-1 right-1 w-1 h-1 bg-[#00ff88]" style={{ borderRadius: '1px' }} />
                        <div className="absolute bottom-1 left-1 w-1 h-1 bg-[#00ff88]" style={{ borderRadius: '1px' }} />
                        <div className="absolute bottom-1 right-1 w-1 h-1 bg-[#00ff88]" style={{ borderRadius: '1px' }} />
                      </>
                    )}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}



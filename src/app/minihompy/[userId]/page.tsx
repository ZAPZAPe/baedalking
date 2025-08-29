'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import GuestbookModal from '@/components/modals/GuestbookModal'
import { UserProfile } from '@/types'

// prerender 방지를 위한 설정
export const dynamic = 'force-dynamic'

export default function MinihompyPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const userId = params.userId as string

  const [targetUser, setTargetUser] = useState<UserProfile | null>(null)
  const [visitCount, setVisitCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [showGuestbook, setShowGuestbook] = useState(false)

  // 사용자 정보 불러오기
  const fetchUserProfile = async () => {
    if (!userId) return

    setIsLoading(true)
    try {
      // 실제로는 Supabase에서 사용자 정보를 가져와야 합니다
      // 현재는 더미 데이터 사용
      const dummyUser: UserProfile = {
        id: userId,
        nickname: '배달왕',
        region: '서울시 강남구',
        income: 2500000,
        count: 150,
        platforms: ['baemin', 'coupang'],
        rank: 1,
        grade: 'LEGEND'
      }
      
      setTargetUser(dummyUser)
      
      // 방문자 수 기록 (자신의 페이지가 아닌 경우에만)
      if (user && user.id !== userId) {
        await recordVisit()
      }
      
      await fetchVisitCount()
    } catch (error) {
      console.error('사용자 정보 로딩 오류:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // 방문 기록
  const recordVisit = async () => {
    try {
      await fetch('/api/visits', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          visitedUserId: userId,
          visitorId: user?.id
        })
      })
    } catch (error) {
      console.error('방문 기록 오류:', error)
    }
  }

  // 방문자 수 조회
  const fetchVisitCount = async () => {
    try {
      const response = await fetch(`/api/visits?userId=${userId}`)
      const data = await response.json()
      if (response.ok) {
        setVisitCount(data.totalVisits || 0)
      }
    } catch (error) {
      console.error('방문자 수 조회 오류:', error)
    }
  }

  useEffect(() => {
    if (userId) {
      fetchUserProfile()
    }
  }, [userId, user])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0f0f23] via-[#1a1a2e] to-[#16213e] flex items-center justify-center">
        <div className="text-white text-xl font-mono">미니홈피 로딩 중...</div>
      </div>
    )
  }

  if (!targetUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0f0f23] via-[#1a1a2e] to-[#16213e] flex items-center justify-center">
        <div className="text-center">
          <div className="text-white text-xl font-mono mb-4">사용자를 찾을 수 없습니다</div>
          <button
            onClick={() => router.push('/')}
            className="bg-[#ffd93d] text-black px-4 py-2 rounded font-mono"
          >
            홈으로 돌아가기
          </button>
        </div>
      </div>
    )
  }

  const isOwnPage = user?.id === userId

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f0f23] via-[#1a1a2e] to-[#16213e] p-4">
      {/* 전체 도트 패턴 오버레이 */}
      <div 
        className="absolute inset-0 z-[1] opacity-[0.03]"
        style={{
          backgroundImage: `radial-gradient(circle, #ffffff 1px, transparent 1px)`,
          backgroundSize: '20px 20px'
        }}
      />

      <div className="max-w-4xl mx-auto relative z-10">
        {/* 헤더 */}
        <div className="bg-gradient-to-r from-[#0a0a23] to-[#16213e] border-2 border-[#ffd93d]/50 rounded-lg p-4 mb-6"
             style={{fontFamily: 'monospace', imageRendering: 'pixelated'}}>
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-[#ffd93d] text-2xl font-bold font-mono mb-2"
                  style={{textShadow: '0 0 10px rgba(255, 217, 61, 0.5)'}}>
                {targetUser.nickname}님의 미니홈피
              </h1>
              <div className="flex items-center gap-4 text-sm font-mono">
                <span className="text-white">방문자: {visitCount.toLocaleString()}명</span>
                <span className="text-[#9c88ff]">{targetUser.region}</span>
                <span className="text-[#00ff88]">{targetUser.grade}</span>
              </div>
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={() => router.push('/')}
                className="bg-gradient-to-r from-[#9c88ff]/20 to-[#ff6b6b]/20 border border-[#9c88ff]/50 text-[#9c88ff] px-4 py-2 rounded font-mono text-sm hover:scale-105 transition-all"
              >
                홈으로
              </button>
              {!isOwnPage && (
                <button
                  onClick={() => setShowGuestbook(true)}
                  className="bg-gradient-to-r from-[#ffd93d]/20 to-[#ff6b6b]/20 border border-[#ffd93d]/50 text-[#ffd93d] px-4 py-2 rounded font-mono text-sm hover:scale-105 transition-all"
                >
                  방명록 쓰기
                </button>
              )}
            </div>
          </div>
        </div>

        {/* 메인 컨텐츠 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 프로필 정보 */}
          <div className="lg:col-span-1">
            <div className="bg-gradient-to-br from-[#2d3748] to-[#1a202c] border-2 border-[#9c88ff]/30 rounded-lg p-4 mb-6"
                 style={{fontFamily: 'monospace', imageRendering: 'pixelated'}}>
              <h3 className="text-[#9c88ff] font-bold text-lg font-mono mb-4 text-center">
                PROFILE
              </h3>
              
              {/* 캐릭터 아바타 */}
              <div className="text-center mb-4">
                <div className="w-24 h-24 mx-auto mb-3 bg-gradient-to-br from-[#9c88ff]/20 to-[#ff6b6b]/20 border-2 border-[#9c88ff]/50 rounded-lg flex items-center justify-center">
                  <img 
                    src="/assets/character/character-happy.png"
                    alt="캐릭터"
                    className="w-20 h-20 object-contain"
                    style={{ imageRendering: 'pixelated' }}
                  />
                </div>
                <div className="text-white font-bold text-xl font-mono">{targetUser.nickname}</div>
                <div className="text-gray-300 text-sm font-mono">{targetUser.region}</div>
              </div>

              {/* 수익 정보 */}
              <div className="space-y-3">
                <div className="bg-[#1a202c]/60 border border-[#00d4ff]/30 rounded p-3">
                  <div className="text-[#00d4ff] text-xs font-mono font-bold mb-1">이번달 수익</div>
                  <div className="text-white text-lg font-bold font-mono">
                    ₩{targetUser.income.toLocaleString()}
                  </div>
                </div>
                
                <div className="bg-[#1a202c]/60 border border-[#9c88ff]/30 rounded p-3">
                  <div className="text-[#9c88ff] text-xs font-mono font-bold mb-1">배달 건수</div>
                  <div className="text-white text-lg font-bold font-mono">
                    {targetUser.count}건
                  </div>
                </div>

                <div className="bg-[#1a202c]/60 border border-[#ffd93d]/30 rounded p-3">
                  <div className="text-[#ffd93d] text-xs font-mono font-bold mb-1">현재 등급</div>
                  <div className="text-white text-lg font-bold font-mono">
                    {targetUser.grade}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 방명록 미리보기 */}
          <div className="lg:col-span-2">
            <div className="bg-gradient-to-br from-[#2d3748] to-[#1a202c] border-2 border-[#ffd93d]/30 rounded-lg p-4"
                 style={{fontFamily: 'monospace', imageRendering: 'pixelated'}}>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-[#ffd93d] font-bold text-lg font-mono">
                  GUESTBOOK
                </h3>
                <button
                  onClick={() => setShowGuestbook(true)}
                  className="text-[#ffd93d] text-sm font-mono hover:underline"
                >
                  전체보기
                </button>
              </div>

              {/* 방명록 미리보기 내용 */}
              <div className="space-y-3">
                <div className="bg-[#1a202c]/60 border border-[#ffd93d]/30 rounded p-3">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-[#ffd93d] font-bold text-sm font-mono">친구A</span>
                    <span className="text-gray-400 text-xs font-mono">2024.08.29</span>
                  </div>
                  <p className="text-white text-sm font-mono">
                    오늘도 수고하셨습니다! 항상 안전 운전하세요~
                  </p>
                </div>

                <div className="bg-[#1a202c]/60 border border-[#ffd93d]/30 rounded p-3">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-[#ffd93d] font-bold text-sm font-mono">배달동료</span>
                    <span className="text-gray-400 text-xs font-mono">2024.08.28</span>
                  </div>
                  <p className="text-white text-sm font-mono">
                    이번달 수익 대박이네요! 노하우 좀 알려주세요 ㅎㅎ
                  </p>
                </div>

                {!isOwnPage && (
                  <div className="text-center pt-3">
                    <button
                      onClick={() => setShowGuestbook(true)}
                      className="bg-gradient-to-r from-[#ffd93d]/20 to-[#ff6b6b]/20 border border-[#ffd93d]/50 text-[#ffd93d] px-6 py-2 rounded font-mono text-sm hover:scale-105 transition-all"
                    >
                      방명록 남기기
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 방명록 모달 */}
      <GuestbookModal
        isOpen={showGuestbook}
        onClose={() => setShowGuestbook(false)}
        targetUser={targetUser}
        currentUserId={user?.id || ''}
      />
    </div>
  )
}

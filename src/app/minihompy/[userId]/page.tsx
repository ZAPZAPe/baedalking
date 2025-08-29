'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import GuestbookModal from '@/components/modals/GuestbookModal'
import GuestbookPreview from '@/components/minihompy/GuestbookPreview'
import { UserProfile } from '@/types'

// prerender 방지를 위한 설정
export const dynamic = 'force-dynamic'

export default function MinihompyPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const userId = params.userId as string

  const [targetUser, setTargetUser] = useState<UserProfile | null>(null)
  const [visitCount, setVisitCount] = useState({ total: 0, today: 0 })
  const [isLoading, setIsLoading] = useState(true)
  const [showGuestbook, setShowGuestbook] = useState(false)
  const [currentWeather, setCurrentWeather] = useState({ temp: 22, condition: 'sunny' })

  // 사용자 정보 불러오기
  const fetchUserProfile = async () => {
    if (!userId) return

    setIsLoading(true)
    try {
      const response = await fetch(`/api/users/${userId}`)
      const data = await response.json()

      if (response.ok && data.user) {
        setTargetUser(data.user)
        
        // 해당 사용자의 지역 날씨 정보 불러오기
        if (data.user.region) {
          await fetchWeather(data.user.region)
        }
      } else {
        console.error('사용자 프로필 로딩 실패:', data.error)
        setTargetUser(null)
        return
      }
      
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
        setVisitCount({
          total: data.totalVisits || 0,
          today: data.todayVisits || 0
        })
      }
    } catch (error) {
      console.error('방문자 수 조회 오류:', error)
    }
  }

  // 날씨 정보 불러오기
  const fetchWeather = async (region: string) => {
    try {
      const response = await fetch(`/api/weather?region=${encodeURIComponent(region)}`)
      const data = await response.json()
      if (response.ok && data.weather) {
        setCurrentWeather({
          temp: data.weather.temp,
          condition: data.weather.condition
        })
      }
    } catch (error) {
      console.error('날씨 정보 조회 오류:', error)
    }
  }

  // 날씨 아이콘 가져오기
  const getWeatherIcon = (condition: string) => {
    const icons: Record<string, string> = {
      sunny: '☀️',
      cloudy: '☁️',
      rainy: '🌧️',
      snowy: '❄️',
      clear: '🌙'
    }
    return icons[condition] || '☀️'
  }

  useEffect(() => {
    if (userId) {
      // 가상 사용자인지 확인 (ID가 'top-ranker-'로 시작하는 경우)
      if (userId.startsWith('top-ranker-')) {
        console.error('사용자 프로필 로딩 실패: 가상 사용자입니다.')
        setTargetUser(null)
        setIsLoading(false)
        return
      }
      
      fetchUserProfile()
    }
  }, [userId, user])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-[#0a0a0a] via-[#1a1a2e] to-[#16213e]">
        <div className="text-white text-xl font-bold">미니홈피 로딩 중...</div>
      </div>
    )
  }

  if (!targetUser) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-[#0a0a0a] via-[#1a1a2e] to-[#16213e] text-white text-center p-4">
        <h1 className="text-2xl font-bold mb-4">사용자를 찾을 수 없습니다</h1>
        <p className="text-gray-300 mb-6">요청하신 미니홈피가 존재하지 않습니다.</p>
        <button 
          onClick={() => router.push('/')}
          className="bg-[#00ff88] hover:bg-[#00cc6a] text-black px-6 py-3 rounded-lg transition-colors font-bold"
        >
          홈으로 돌아가기
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a0a] via-[#1a1a2e] to-[#16213e] text-white">
      {/* 헤더 */}
      <header className="bg-black/30 backdrop-blur-lg border-b border-[#00ff88]/20 p-4">
        <div className="flex items-center justify-between max-w-md mx-auto">
          <button 
            onClick={() => router.push('/')}
            className="text-gray-300 hover:text-white transition-colors flex items-center gap-2"
          >
            ← 뒤로
          </button>
          <h1 className="text-lg font-bold text-[#00ff88]">{targetUser.nickname}의 미니홈피</h1>
          <div className="w-12"> {/* 스페이서 */}</div>
        </div>
      </header>

      {/* 메인 컨텐츠 */}
      <main className="max-w-md mx-auto p-4 space-y-4">
        
        {/* 꾸미기 공간 카드 - 메인페이지와 동일 */}
        <div className="bg-gradient-to-br from-[#1a4a2e]/90 to-[#1a1a2e]/90 backdrop-blur-lg rounded-2xl p-3 border border-[#00ff88]/20 shadow-2xl">
          
          {/* 꾸미기 공간 - 모바일 최적화 */}
          <div className="relative bg-gradient-to-b from-[#2d3748] to-[#1a202c] rounded-xl p-4 mb-3 min-h-[320px] border border-[#00ff88]/30 shadow-inner">
            
            {/* 배경 이미지 */}
            <div className="absolute inset-0 w-full h-full z-10">
              <img 
                src={`/assets/background/${targetUser.avatar_config?.background || 'background'}.png`}
                alt="배경"
                className="absolute inset-0 w-full h-full object-cover rounded-lg opacity-85"
                style={{ imageRendering: 'pixelated' }}
              />
            </div>
            
            {/* 스쿠터 */}
            <div className="absolute bottom-[0%] left-[5%] w-[200px] h-[150px] z-20">
              <img 
                src="/assets/vehicle/scooter.png" 
                alt="스쿠터" 
                className="w-full h-full object-contain drop-shadow-lg"
                style={{ imageRendering: 'pixelated' }}
              />
            </div>
            
            {/* 캐릭터 */}
            <div className="absolute bottom-[5%] right-[8%] w-[140px] h-[140px] z-30">
              <img 
                src={`/assets/character/character-${targetUser.avatar_config?.emotion || 'base'}.png`}
                alt="캐릭터"
                className="w-full h-full object-contain drop-shadow-lg"
                style={{ imageRendering: 'pixelated' }}
              />

              {/* 말풍선 */}
              <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-white border-2 border-gray-800 min-w-[45px] max-w-[90px] z-40" 
                   style={{
                     borderRadius: '0px',
                     imageRendering: 'pixelated',
                     boxShadow: '4px 4px 0px rgba(0,0,0,0.3)'
                   }}>
                <div className="absolute bottom-[-5px] left-1/2 -translate-x-1/2 w-2.5 h-2.5 bg-white border-r-2 border-b-2 border-gray-800 rotate-45"></div>
                <p className="text-[9px] text-gray-800 font-bold text-center leading-tight break-words overflow-hidden px-2 py-1" 
                   style={{
                     display: '-webkit-box',
                     WebkitLineClamp: 2,
                     WebkitBoxOrient: 'vertical',
                     wordBreak: 'keep-all',
                     fontFamily: 'monospace'
                   }}>
                  {targetUser.avatar_config?.speechText || '안녕하세요!'}
                </p>
              </div>
            </div>
            
            {/* 나무 푯말 - 우측 상단 */}
            <div className="absolute top-3 right-3 z-50">
              <div className="relative">
                {/* 로프 */}
                <div className="absolute -top-3 left-1.5 w-0.5 h-3 bg-gradient-to-b from-[#8B4513] to-[#A0522D] rounded-full opacity-80"></div>
                <div className="absolute -top-3 right-1.5 w-0.5 h-3 bg-gradient-to-b from-[#8B4513] to-[#A0522D] rounded-full opacity-80"></div>
                
                {/* 나무 푯말 */}
                <div className="bg-gradient-to-b from-[#DEB887]/85 via-[#D2B48C]/85 to-[#CD853F]/85 backdrop-blur-sm rounded-lg p-2 border-2 border-[#8B4513]/70 shadow-xl relative overflow-hidden">
                  <div className="absolute inset-0 opacity-15">
                    <div className="h-full w-full bg-gradient-to-r from-transparent via-[#8B4513]/30 to-transparent transform rotate-12"></div>
                  </div>
                  
                  <div className="flex items-center justify-center space-x-1 relative z-10">
                    <span className="text-lg">{getWeatherIcon(currentWeather.condition)}</span>
                    <span className="text-[#8B4513] text-xs font-bold">{currentWeather.temp}°</span>
                  </div>
                  
                  <div className="text-center mt-1 relative z-10">
                    <div className="text-[#8B4513] text-[9px] font-bold leading-none">방문자</div>
                    <div className="text-[#654321] text-[10px] font-bold">{visitCount.today}</div>
                  </div>
                </div>
              </div>
            </div>
            
          </div>
          
          {/* 가라지 소개 - 메인페이지와 동일 */}
          <div className="bg-gradient-to-r from-[#2d3748]/80 via-[#4a5568]/80 to-[#2d3748]/80 backdrop-blur-sm rounded-xl p-3 border border-[#00ff88]/20">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">🏠</span>
              <span className="text-[#00ff88] font-bold text-sm">{targetUser.nickname}의 가라지</span>
            </div>
            <p className="text-gray-300 text-xs leading-relaxed">
              {targetUser.avatar_config?.garageIntro || `안녕하세요! ${targetUser.nickname}의 배달 가라지입니다. 오늘도 안전하고 빠른 배달로 최선을 다하겠습니다!`}
            </p>
          </div>
        </div>

        {/* 사용자 정보 카드 */}
        <div className="bg-gradient-to-br from-[#1a4a2e]/80 to-[#1a1a2e]/80 backdrop-blur-lg rounded-xl p-4 border border-[#00ff88]/20">
          <div className="text-center mb-3">
            <h2 className="text-xl font-bold mb-1 text-[#00ff88]">{targetUser.nickname}</h2>
            <p className="text-gray-300 text-sm">{targetUser.region}</p>
            {targetUser.status_message && (
              <p className="text-xs text-gray-400 mt-2 italic bg-black/20 rounded-lg px-2 py-1">"{targetUser.status_message}"</p>
            )}
          </div>
          
          <div className="grid grid-cols-2 gap-3 text-center">
            <div className="bg-gradient-to-br from-[#00ff88]/10 to-[#00cc6a]/10 rounded-lg p-3 border border-[#00ff88]/20">
              <div className="text-xl font-bold text-[#00ff88]">{visitCount.total}</div>
              <div className="text-xs text-gray-400">총 방문자</div>
            </div>
            <div className="bg-gradient-to-br from-[#00ff88]/10 to-[#00cc6a]/10 rounded-lg p-3 border border-[#00ff88]/20">
              <div className="text-xl font-bold text-[#00ff88]">{visitCount.today}</div>
              <div className="text-xs text-gray-400">오늘 방문자</div>
            </div>
          </div>
        </div>

        {/* 방명록 미리보기 */}
        <div className="bg-gradient-to-br from-[#1a4a2e]/80 to-[#1a1a2e]/80 backdrop-blur-lg rounded-xl p-4 border border-[#00ff88]/20">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-bold text-[#00ff88]">방명록</h3>
            <button 
              onClick={() => setShowGuestbook(true)}
              className="text-[#00ff88] hover:text-white text-sm bg-[#00ff88]/10 px-3 py-1 rounded-lg border border-[#00ff88]/30 transition-colors"
            >
              더보기
            </button>
          </div>
          <GuestbookPreview userId={userId} />
        </div>

        {/* 방명록 쓰기 버튼 */}
        {user && user.id !== userId && (
          <button 
            onClick={() => setShowGuestbook(true)}
            className="w-full bg-gradient-to-r from-[#00ff88] to-[#00cc6a] hover:from-[#00cc6a] hover:to-[#00ff88] text-black py-3 rounded-xl font-bold transition-all duration-300 shadow-lg hover:shadow-[#00ff88]/20"
          >
            📝 방명록 쓰기
          </button>
        )}
      </main>

      {/* 방명록 모달 */}
      {showGuestbook && (
        <GuestbookModal 
          targetUserId={userId}
          targetUserNickname={targetUser.nickname}
          onClose={() => setShowGuestbook(false)}
        />
      )}
    </div>
  )
}
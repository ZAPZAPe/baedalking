'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'

import GuestbookPreview from '@/components/garage/GuestbookPreview'
import UserProfileModal from '@/components/modals/UserProfileModal'
import { UserProfile } from '@/types'
import { useAppState } from '@/hooks/useAppState'
import KakaoAd from '@/components/ui/KakaoAd'

// prerender 방지를 위한 설정
export const dynamic = 'force-dynamic'

export default function MinihompyPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const userId = params.userId as string
  
  // useAppState에서 garageIntro 가져오기
  const { garageIntro } = useAppState()

  const [targetUser, setTargetUser] = useState<UserProfile | null>(null)
  const [visitCount, setVisitCount] = useState({ total: 0, today: 0 })
  const [isLoading, setIsLoading] = useState(true)
  const [currentWeather, setCurrentWeather] = useState({ temp: 22, condition: 'sunny' })
  const [selectedUserProfile, setSelectedUserProfile] = useState<any>(null)
  const [showUserProfile, setShowUserProfile] = useState(false)

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

  // 방문 기록 (세션 기반 중복 방지)
  const recordVisit = async () => {
    try {
      // 세션 스토리지에서 오늘 방문 기록 확인
      const today = new Date().toISOString().split('T')[0]
      // 오늘 방문했는지 확인 (Supabase에서 확인)
      const { data: todayVisits } = await supabase
        .from('visits')
        .select('id')
        .eq('visitor_id', currentUser?.id)
        .eq('visited_user_id', userId)
        .gte('created_at', `${today}T00:00:00`)
        .lt('created_at', `${today}T23:59:59`)
        .limit(1)
      
      if (todayVisits && todayVisits.length > 0) {
        console.log('🔄 오늘 이미 방문 기록됨 (Supabase 기반):', userId)
        return
      }
      
      console.log('📝 새로운 방문 기록 시도:', { visitedUserId: userId, visitorId: user?.id })
      
      const response = await fetch('/api/visits', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          visitedUserId: userId,
          visitorId: user?.id
        })
      })
      
      const data = await response.json()
      
      if (response.ok) {
        console.log('✅ 방문 기록 완료:', data.message)
      } else {
        console.log('ℹ️ 방문 기록 응답:', data.message)
      }
    } catch (error) {
      console.error('❌ 방문 기록 오류:', error)
    }
  }

  // 방문자 수 조회
  const fetchVisitCount = async () => {
    try {
      console.log('🔍 방문자 수 조회 시작:', userId)
      
      const response = await fetch(`/api/visits?userId=${userId}`)
      const data = await response.json()
      
      if (response.ok) {
        console.log('✅ 방문자 수 조회 완료:', { total: data.totalVisits, today: data.todayVisits })
        setVisitCount({
          total: data.totalVisits || 0,
          today: data.todayVisits || 0
        })
      } else {
        console.error('❌ 방문자 수 조회 실패:', data.error)
      }
    } catch (error) {
      console.error('❌ 방문자 수 조회 API 오류:', error)
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

  // 사용자 프로필 모달 열기
  const handleShowUserProfile = async (visitorId: string, nickname: string) => {
    console.log('📱 프로필 모달 요청 받음:', { visitorId, nickname })
    try {
      console.log('🔄 사용자 정보 API 호출 중...')
      const response = await fetch(`/api/users/${visitorId}`)
      const data = await response.json()
      
      if (response.ok && data.user) {
        console.log('✅ 사용자 정보 로드 성공:', data.user)
        setSelectedUserProfile(data.user)
        setShowUserProfile(true)
        console.log('🎉 프로필 모달 상태 업데이트 완료')
      } else {
        console.error('❌ 사용자 프로필 로딩 실패:', data.error)
      }
    } catch (error) {
      console.error('❌ 사용자 프로필 로딩 오류:', error)
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
        <div className="text-white text-xl font-bold">차고 로딩 중...</div>
      </div>
    )
  }

  if (!targetUser) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-[#0a0a0a] via-[#1a1a2e] to-[#16213e] text-white text-center p-4">
        <h1 className="text-2xl font-bold mb-4">사용자를 찾을 수 없습니다</h1>
        <p className="text-gray-300 mb-6">요청하신 차고가 존재하지 않습니다.</p>
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
            className="text-gray-300 hover:text-white transition-all duration-300 flex items-center justify-center border-2 border-gray-600 hover:border-[#00ff88] rounded-lg w-10 h-10 bg-black/20 hover:bg-[#00ff88]/10"
          >
            🏠
          </button>
          <h1 className="text-lg font-bold text-[#00ff88]">{targetUser.nickname}의 차고</h1>
          <div className="w-12"> {/* 스페이서 */}</div>
        </div>
      </header>

      {/* 메인 컨텐츠 */}
              <main className="max-w-md mx-auto p-4 space-y-4">
          


        {/* 꾸미기 공간 카드 - 메인페이지와 동일 */}
        <div className="bg-gradient-to-br from-[#1a4a2e]/90 to-[#1a1a2e]/90 backdrop-blur-lg rounded-2xl p-3 border border-[#00ff88]/20 shadow-2xl">
          
          {/* 방문자수 카드 - 맨 위 */}
          <div className="bg-[#1a202c] border-2 border-[#00ff88]/30 p-3 text-center relative mb-3" style={{borderRadius: '4px'}}>
            <div className="flex items-center justify-center space-x-6">
              <div className="flex items-center space-x-2">
                <span className="text-gray-300 text-xs font-mono">Total</span>
                <span className="text-white font-bold text-sm font-mono">{visitCount.total}명</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-gray-300 text-xs font-mono">Today</span>
                <span className="text-white font-bold text-sm font-mono">{visitCount.today}명</span>
              </div>
            </div>
            {/* 픽셀 도트들 */}
            <div className="absolute top-1 left-1 w-1 h-1 bg-[#00ff88]/50" style={{borderRadius: '1px'}}></div>
            <div className="absolute top-1 right-1 w-1 h-1 bg-[#00ff88]/50" style={{borderRadius: '1px'}}></div>
            <div className="absolute bottom-1 left-1 w-1 h-1 bg-[#00ff88]/50" style={{borderRadius: '1px'}}></div>
            <div className="absolute bottom-1 right-1 w-1 h-1 bg-[#00ff88]/50" style={{borderRadius: '1px'}}></div>
          </div>
          
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
            
            {/* 나무 푯말 - 우측 상단 (컴팩트 버전) */}
            <div className="absolute top-2 right-2 z-50">
              <div className="relative">
                {/* 로프 */}
                <div className="absolute -top-2 left-1 w-0.5 h-2 bg-gradient-to-b from-[#8B4513] to-[#A0522D] rounded-full opacity-80"></div>
                <div className="absolute -top-2 right-1 w-0.5 h-2 bg-gradient-to-b from-[#8B4513] to-[#A0522D] rounded-full opacity-80"></div>
                
                {/* 나무 푯말 */}
                <div className="bg-gradient-to-b from-[#DEB887]/85 via-[#D2B48C]/85 to-[#CD853F]/85 backdrop-blur-sm rounded p-1.5 border border-[#8B4513]/70 shadow-lg relative overflow-hidden">
                  <div className="absolute inset-0 opacity-10">
                    <div className="h-full w-full bg-gradient-to-r from-transparent via-[#8B4513]/30 to-transparent transform rotate-12"></div>
                  </div>
                  
                  <div className="flex flex-col items-center justify-center relative z-10">
                    <div className="text-[#8B4513] text-[7px] font-bold leading-none mb-0.5">Weather</div>
                    <div className="flex items-center justify-center space-x-0.5">
                      <span className="text-sm">{getWeatherIcon(currentWeather.condition)}</span>
                      <span className="text-[#654321] text-[8px] font-bold">{currentWeather.temp}°</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
          </div>
          
          {/* GARAGE INTRO - 메인페이지와 동일 */}
          <div className="bg-gradient-to-r from-[#2d3748]/80 via-[#4a5568]/80 to-[#2d3748]/80 backdrop-blur-sm rounded-xl p-3 border border-[#00ff88]/20">
            <div className="flex items-center justify-center gap-2 mb-2">
              <span className="text-[#00ff88] font-bold text-sm">GARAGE INTRO</span>
            </div>
            <p className="text-gray-300 text-xs leading-relaxed text-center">
              {garageIntro || `안녕하세요! ${targetUser.nickname}의 배달 차고입니다. 오늘도 안전하고 빠른 배달로 최선을 다하겠습니다!`}
            </p>
          </div>
        </div>

        {/* 카카오 광고 */}
        <KakaoAd 
          adUnit="DAN-xsiNefKQFaudq5Uw"
          width={320}
          height={100}
        />

        {/* 방명록 미리보기 */}
        <div className="bg-gradient-to-br from-[#1a4a2e]/80 to-[#1a1a2e]/80 backdrop-blur-lg rounded-xl p-4 border border-[#00ff88]/20">
          <div className="mb-3 text-center">
            <h3 className="text-lg font-bold text-[#00ff88]">방명록</h3>
          </div>
          <GuestbookPreview 
            userId={userId} 
            isOwnPage={user?.id === userId}
            onShowUserProfile={handleShowUserProfile}
          />
        </div>


      </main>

      {/* 사용자 프로필 모달 */}
      {showUserProfile && selectedUserProfile && (
        <UserProfileModal
          isOpen={showUserProfile}
          user={selectedUserProfile}
          onClose={() => {
            setShowUserProfile(false)
            setSelectedUserProfile(null)
          }}
        />
      )}
    </div>
  )
}
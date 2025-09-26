'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'

import GuestbookPreview from '@/components/garage/GuestbookPreview'
import ProfileModal from '@/components/features/shared/ProfileModal'
import { UserProfile } from '@/types'
import { useAppState } from '@/hooks/useAppState'
import KakaoAd from '@/components/ui/KakaoAd'
import MiniGarageCanvas from '@/components/minigame'
import PixelButton from '@/components/ui/PixelButton'
import { ModalManager } from '@/components/core'
import Header from '@/components/layout/Header'
import BottomNavigation from '@/components/layout/BottomNavigation'

// prerender 방지를 위한 설정
export const dynamic = 'force-dynamic'

export default function MinihompyPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuth()
  const userId = params.userId as string
  
  // useAppState에서 필요한 상태들 가져오기
  const { 
    garageIntro, 
    platforms, 
    totalBoxes,
    activeModal,
    openModal,
    closeModal,
  } = useAppState()

  const [targetUser, setTargetUser] = useState<UserProfile | null>(null)
  const [visitCount, setVisitCount] = useState({ total: 0, today: 0 })
  const [isLoading, setIsLoading] = useState(true)
  const [currentWeather, setCurrentWeather] = useState({ temp: 22, condition: 'sunny' })
  const [selectedUserProfile, setSelectedUserProfile] = useState<any>(null)
  const [showUserProfile, setShowUserProfile] = useState(false)
  const [targetUserBoxes, setTargetUserBoxes] = useState(0)

  // 사용자 정보 불러오기
  const fetchUserProfile = async () => {
    if (!userId) return

    setIsLoading(true)
    try {
      const response = await fetch(`/api/users/${userId}`)
      const data = await response.json()

      if (response.ok && data.user) {
        setTargetUser(data.user)
        
        // 해당 사용자의 박스 수 가져오기
        try {
          const boxesResponse = await fetch(`/api/boxes?userId=${userId}`)
          if (boxesResponse.ok) {
            const boxesData = await boxesResponse.json()
            setTargetUserBoxes(boxesData.totalBoxes || 0)
          }
        } catch (error) {
        }
        
        // 날씨 정보는 제거됨
      } else {
        setTargetUser(null)
        return
      }
      
      // 방문자 수 기록 (자신의 페이지가 아닌 경우에만)
      if (user && user.id !== userId) {
        await recordVisit()
      }
      
      await fetchVisitCount()
    } catch (error) {
      // 사용자 정보 로딩 오류 처리
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
        .eq('visitor_id', user?.id)
        .eq('visited_user_id', userId)
        .gte('created_at', `${today}T00:00:00`)
        .lt('created_at', `${today}T23:59:59`)
        .limit(1)
      
      if (todayVisits && todayVisits.length > 0) {
        return
      }
      
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
        // 방문 기록 완료
      } else {
        // 방문 기록 응답 처리
      }
    } catch (error) {
      // 방문 기록 오류 처리
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
      } else {
        // 방문자 수 조회 실패 처리
      }
    } catch (error) {
      // 방문자 수 조회 API 오류 처리
    }
  }

  // 날씨 정보는 제거됨 - 기본값 사용

  // 사용자 프로필 모달 열기
  const handleShowUserProfile = async (visitorId: string, nickname: string) => {
    try {
      const response = await fetch(`/api/users/${visitorId}`)
      const data = await response.json()
      
      if (response.ok && data.user) {
        setSelectedUserProfile(data.user)
        setShowUserProfile(true)
      } else {
        // 사용자 프로필 로딩 실패 처리
      }
    } catch (error) {
      // 사용자 프로필 로딩 오류 처리
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
        setTargetUser(null)
        setIsLoading(false)
        return
      }
      
      fetchUserProfile()
    }
  }, [userId, user])

  if (isLoading) {
    return (
      <div className="w-full min-h-[100dvh] bg-[#1a1a2e] flex flex-col relative"
        style={{ minHeight: '100dvh' }}>
        
        {/* 전체 도트 패턴 오버레이 */}
        <div 
          className="absolute inset-0 z-[1] opacity-[0.03]"
          style={{
            backgroundImage: `radial-gradient(circle, #ffffff 1px, transparent 1px)`,
            backgroundSize: '20px 20px'
          }}
        />
        
        <div className="flex items-center justify-center flex-1 relative z-10">
          <div className="text-white text-xl font-bold">차고 로딩 중...</div>
        </div>
      </div>
    )
  }

  if (!targetUser) {
    return (
      <div className="w-full min-h-[100dvh] bg-[#1a1a2e] flex flex-col relative"
        style={{ minHeight: '100dvh' }}>
        
        {/* 전체 도트 패턴 오버레이 */}
        <div 
          className="absolute inset-0 z-[1] opacity-[0.03]"
          style={{
            backgroundImage: `radial-gradient(circle, #ffffff 1px, transparent 1px)`,
            backgroundSize: '20px 20px'
          }}
        />
        
        <div className="flex flex-col items-center justify-center flex-1 relative z-10 text-white text-center p-4">
          <h1 className="text-2xl font-bold mb-4">사용자를 찾을 수 없습니다</h1>
          <p className="text-gray-300 mb-6">요청하신 차고가 존재하지 않습니다.</p>
          <PixelButton 
            onClick={() => router.push('/')}
            variant="success"
            size="lg"
          >
            홈으로 돌아가기
          </PixelButton>
        </div>
      </div>
    )
  }


  return (
    <div className="w-full min-h-[100dvh] bg-[#1a1a2e] flex flex-col relative"
      style={{ minHeight: '100dvh' }}>
      
      {/* 전체 도트 패턴 오버레이 */}
      <div 
        className="absolute inset-0 z-[1] opacity-[0.03]"
        style={{
          backgroundImage: `radial-gradient(circle, #ffffff 1px, transparent 1px)`,
          backgroundSize: '20px 20px'
        }}
      />

      {/* 헤더 */}
      <Header
        userNickname={targetUser.nickname}
        totalBoxes={targetUserBoxes}
        onShowHeaderCharacterPanel={() => {}}
      />

      {/* 메인 컨텐츠 영역 */}
      <div className="flex-1 relative z-10 flex flex-col">
        <div className="flex-1 relative bg-gradient-to-b from-[#0f0f23] to-[#1a1a2e] scroll-container">
          <div className="p-2 sm:p-3 lg:p-4 pb-24">
            <div className="max-w-md mx-auto w-full space-y-2 sm:space-y-3 lg:space-y-4">
              
              {/* 방문자 수 카드 */}
              <div className="bg-gradient-to-br from-[#1a4a2e]/90 to-[#1a1a2e]/90 backdrop-blur-lg rounded-2xl p-3 border border-[#00ff88]/20 shadow-2xl">
                <div className="bg-[#1a202c] border-2 border-[#00ff88]/30 p-3 text-center relative" style={{borderRadius: '4px'}}>
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
              </div>

              {/* 캔버스 영역 카드 */}
              <div className="bg-gradient-to-br from-[#1a4a2e]/90 to-[#1a1a2e]/90 backdrop-blur-lg rounded-2xl p-2 sm:p-3 lg:p-4 border border-[#00ff88]/20 shadow-2xl">
                {/* 캔버스 영역 */}
                <div className="relative bg-gradient-to-b from-[#2d3748] to-[#1a202c] rounded-xl p-3 sm:p-4 lg:p-5 mb-2 sm:mb-3 lg:mb-4 border border-[#00ff88]/30 shadow-inner">
                  <div className="w-full aspect-[4/3] bg-gray-900 rounded-lg overflow-hidden relative">
                    {/* 방문자 모드 플래그 전달 */}
                    <script
                      dangerouslySetInnerHTML={{
                        __html: `window.__GARAGE_VISITOR_MODE__ = true;`
                      }}
                    />
                    <div className="absolute inset-0">
                      <MiniGarageCanvas
                        width={800}
                        height={600}
                        mode="minigarage"
                        userId={userId}
                      />
                    </div>
                  </div>
                  
                  {/* 캔버스 공간 테두리 효과 */}
                  <div className="absolute inset-0 rounded-xl border-2 border-[#00ff88]/20 pointer-events-none"></div>
                  
                  {/* 코너 장식 */}
                  <div className="absolute top-2 left-2 w-4 h-4 border-l-2 border-t-2 border-[#00ff88]/60 rounded-tl-lg"></div>
                  <div className="absolute top-2 right-2 w-4 h-4 border-r-2 border-t-2 border-[#00ff88]/60 rounded-tr-lg"></div>
                  <div className="absolute bottom-2 left-2 w-4 h-4 border-l-2 border-b-2 border-[#00ff88]/60 rounded-bl-lg"></div>
                  <div className="absolute bottom-2 right-2 w-4 h-4 border-r-2 border-b-2 border-[#00ff88]/60 rounded-br-lg"></div>
                </div>

                {/* 차고 소개 */}
                <div className="bg-black/30 backdrop-blur-sm rounded-lg p-3 border border-[#00ff88]/20">
                  <div className="text-center">
                    <p className="text-white text-sm font-medium leading-relaxed">{garageIntro}</p>
                  </div>
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
            </div>
          </div>
        </div>
      </div>

      {/* 하단 네비게이션 */}
      <BottomNavigation
        activeTab="home"
        onTabChange={(tab) => {
          // 메인페이지로 이동
          router.push('/')
        }}
      />

      {/* 사용자 프로필 모달 */}
      {showUserProfile && selectedUserProfile && (
        <ProfileModal
          isOpen={showUserProfile}
          user={selectedUserProfile}
          platforms={platforms}
          onClose={() => {
            setShowUserProfile(false)
            setSelectedUserProfile(null)
          }}
        />
      )}

      {/* 모달 관리자 */}
      <ModalManager
        user={user!}
        activeModal={activeModal}
        closeModal={closeModal}
        openModal={openModal}
        errorMessage=""
        // 수입 관련 상태 (기본값)
        showIncomeInputPanel={false}
        setShowIncomeInputPanel={() => {}}
        incomeCount=""
        setIncomeCount={() => {}}
        incomeAmount=""
        setIncomeAmount={() => {}}
        missionAmount=""
        setMissionAmount={() => {}}
        selectedPlatform="baemin"
        setSelectedPlatform={() => {}}
        incomeDate={new Date().toISOString().split('T')[0]}
        setIncomeDate={() => {}}
        onSubmit={() => {}}
        platforms={platforms}
        // 수입 패널 상태 (기본값)
        showIncomePanel={false}
        setShowIncomePanel={() => {}}
        incomeRecords={[]}
        totalIncome={0}
        // 캐릭터 편집 상태 (기본값)
        showHeaderCharacterPanel={false}
        setShowHeaderCharacterPanel={() => {}}
        garageIntro={garageIntro}
        setGarageIntro={() => {}}
        // 아이템 선택 상태 (기본값)
        showCharacterItemPanel={false}
        setShowCharacterItemPanel={() => {}}
        currentCharacterItem="basic"
        setCurrentCharacterItem={() => {}}
        showVehicleItemPanel={false}
        setShowVehicleItemPanel={() => {}}
        currentVehicle="scooter"
        setCurrentVehicle={() => {}}
        showBackgroundItemPanel={false}
        setShowBackgroundItemPanel={() => {}}
        currentBackground="background"
        setCurrentBackground={() => {}}
        totalBoxes={totalBoxes}
        setTotalBoxes={() => {}}
        // 목표 설정 상태 (기본값)
        dailyGoal={50000}
        weeklyGoal={350000}
        monthlyGoal={1500000}
        updateGoals={() => {}}
        // 플랫폼 설정 상태 (기본값)
        togglePlatform={() => {}}
        addCustomPlatform={() => {}}
        removeCustomPlatform={() => {}}
        // 친구 관련 상태 (기본값)
        friendRequests={[]}
        setFriendRequests={() => {}}
        // 기타 상태 (기본값)
        todayIncome={0}
        onDeleteIncomeRecord={() => {}}
        // 수입 상세 모달 상태 (기본값)
        selectedDate={null}
        selectedRecords={[]}
        setSelectedRecords={() => {}}
        onEditIncomeRecord={() => {}}
        // 랭킹/프로필 관련 기본값 전달 (방문자 페이지 호환)
        selectedGrade={null}
        userRankInfo={{ rank: null, total: 0 }}
        topRankers={[]}
        selectedTopRanker={null}
      />
    </div>
  )
}
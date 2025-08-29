'use client'

import { useAppState } from '@/hooks/useAppState'
import { handleIncomeSubmit } from '@/lib/incomeUtils'
import { emotions, platforms } from '@/data/constants'
import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Header from '@/components/layout/Header'
import BottomNavigation from '@/components/layout/BottomNavigation'
import HomeTab from '@/components/tabs/HomeTab'
import IncomeTab from '@/components/tabs/IncomeTab'
import RankingTab from '@/components/tabs/RankingTab'
import FriendsTab from '@/components/tabs/FriendsTab'
import ProfileTab from '@/components/tabs/ProfileTab'
import IncomeInputPanel from '@/components/modals/IncomeInputPanel'
import IncomePanel from '@/components/modals/IncomePanel'
import CharacterEditPanel from '@/components/modals/CharacterEditPanel'
import ItemSelectionPanels from '@/components/modals/ItemSelectionPanels'
import GoalSettingsPanel from '@/components/modals/GoalSettingsPanel'
import PlatformSettingsPanel from '@/components/modals/PlatformSettingsPanel'
import IncomeDetailModal from '@/components/modals/IncomeDetailModal'
import IncomeEditModal from '@/components/modals/IncomeEditModal'
import FriendDetailModal from '@/components/modals/FriendDetailModal'
import TopRankerProfileModal from '@/components/modals/TopRankerProfileModal'
import GradeDetailModal from '@/components/modals/GradeDetailModal'
import RankingDetailModal from '@/components/modals/RankingDetailModal'
import PrivacyPolicyModal from '@/components/modals/PrivacyPolicyModal'
import TermsOfServiceModal from '@/components/modals/TermsOfServiceModal'
import FriendsModal from '@/components/modals/FriendsModal'

// prerender 방지를 위한 설정
export const dynamic = 'force-dynamic'

export default function Home() {
  const { user, loading, signOut } = useAuth()
  const router = useRouter()

  // 모든 Hooks를 항상 동일한 순서로 호출
  const {
    // 기본 상태들
    currentEmotion, setCurrentEmotion,
    speechText, setSpeechText,
    showCustomizePanel, setShowCustomizePanel,
    showIncomePanel, setShowIncomePanel,
    showIncomeInputPanel, setShowIncomeInputPanel,
    showHeaderCharacterPanel, setShowHeaderCharacterPanel,
    showCharacterItemPanel, setShowCharacterItemPanel,
    showVehicleItemPanel, setShowVehicleItemPanel,
    showBackgroundItemPanel, setShowBackgroundItemPanel,
    currentCharacterItem, setCurrentCharacterItem,
    currentVehicle, setCurrentVehicle,
    currentBackground, setCurrentBackground,
    activeTab, setActiveTab,
    incomeCount, setIncomeCount,
    incomeAmount, setIncomeAmount,
    missionAmount, setMissionAmount,
    selectedPlatform, setSelectedPlatform,
    incomeDate, setIncomeDate,
    dailyIncomeData, setDailyIncomeData,
    incomeRecords, setIncomeRecords,
    totalPoints, setTotalPoints,
    userLevel, setUserLevel,
    userNickname, setUserNickname,
    userLocation, setUserLocation,
    currentWeather, setCurrentWeather,
    todayVisitors, setTodayVisitors,
    totalVisitors, setTotalVisitors,
    isClient, setIsClient,
    garageIntro, setGarageIntro,

    level, setLevel,
    isIncomePrivate, setIsIncomePrivate,

    getTotalIncomeByPlatform,
    totalIncome,
    getWeatherIcon,
    addPoints,
    usePoints,
    canAfford,
    platforms: appPlatforms,
    togglePlatform,
    addCustomPlatform,
    removeCustomPlatform,
    dailyGoal,
    weeklyGoal,
    monthlyGoal,
    updateGoals
  } = useAppState()

  // 모달 상태들 - 항상 동일한 순서로 호출
  const [showGoalSettings, setShowGoalSettings] = useState(false)
  const [showPlatformSettings, setShowPlatformSettings] = useState(false)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedDate, setSelectedDate] = useState<string | null>('')
  const [editData, setEditData] = useState<{date: string, records: any[]} | null>(null)
  const [selectedGrade, setSelectedGrade] = useState<{
    name: string
    icon: string
    color: string
    minIncome: number
    maxIncome: number
    description: string
  } | null>(null)
  const [showGradeDetail, setShowGradeDetail] = useState(false)
  const [selectedTopRanker, setSelectedTopRanker] = useState<any>(null)
  const [showTopRankerProfile, setShowTopRankerProfile] = useState(false)
  const [showFriendDetail, setShowFriendDetail] = useState(false)
  const [selectedFriend, setSelectedFriend] = useState<any>(null)
  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false)
  const [showTermsOfService, setShowTermsOfService] = useState(false)
  const [showDeleteAccount, setShowDeleteAccount] = useState(false)
  const [showFriendsModal, setShowFriendsModal] = useState(false)

  // 디버깅: 로컬 스토리지 확인
  useEffect(() => {
    const kakaoUser = localStorage.getItem('kakaoUser')
    console.log('메인 페이지 - 로컬 스토리지 사용자 정보:', kakaoUser)
    console.log('useAuth user:', user)
    console.log('useAuth loading:', loading)
  }, [user, loading])

  // 인증 체크
  useEffect(() => {
    if (!loading && !user) {
      console.log('인증 실패 - 로그인 페이지로 이동')
      router.push('/login')
    }
  }, [user, loading, router])

  // 실제 날씨 데이터 가져오기
  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const response = await fetch('/api/weather')
        const data = await response.json()
        
        if (response.ok) {
          setCurrentWeather({
            temp: data.temperature,
            condition: data.condition
          })
        }
      } catch (error) {
        console.error('날씨 데이터 로딩 오류:', error)
        // 에러 시 기본값 유지
      }
    }

    fetchWeather()
  }, [])

  // 사용자 데이터 로딩
  useEffect(() => {
    if (user?.id) {
      loadUserData()
    }
  }, [user])

  const loadUserData = async () => {
    if (!user?.id) return

    try {
      // 사용자 기본 정보 설정
      setUserNickname(user.nickname || '배달킹')
      setUserLocation(user.region || '서울특별시')

      // 포인트 데이터 로딩
      const pointsResponse = await fetch(`/api/points?userId=${user.id}`)
      if (pointsResponse.ok) {
        const pointsData = await pointsResponse.json()
        setTotalPoints(pointsData.totalPoints || 0)
      }

      // 수익 데이터 로딩 (earnings API 호출)
      const earningsResponse = await fetch(`/api/users/${user.id}`)
      if (earningsResponse.ok) {
        const earningsData = await earningsResponse.json()
        // 수익 데이터를 incomeRecords 형식으로 변환
        if (earningsData.user?.earnings) {
          const formattedRecords = earningsData.user.earnings.map((earning: any, index: number) => ({
            id: index,
            platform: earning.source || 'other',
            count: 1, // API에서 제공되지 않으면 기본값
            deliveryAmount: earning.amount,
            missionAmount: 0, // API에서 제공되지 않으면 기본값
            amount: earning.amount,
            date: earning.date
          }))
          setIncomeRecords(formattedRecords)
        }
      }
    } catch (error) {
      console.error('사용자 데이터 로딩 오류:', error)
    }
  }

  // 수입 제출 핸들러
  const onIncomeSubmit = () => {
    handleIncomeSubmit(
      incomeCount,
      incomeAmount,
      missionAmount,
      selectedPlatform,
      setDailyIncomeData,
      setIncomeRecords,
      addPoints,
      setIncomeCount,
      setIncomeAmount,
      setMissionAmount,
      user?.id // 실제 사용자 ID 전달
    )
  }
  
  // 오늘 날짜
  const today = new Date()
  const todayStr = today.toISOString().split('T')[0]
  
  // 실제 수입 기록만 사용 (테스트 데이터 제거)
  const allRecords = incomeRecords

  // 로딩 중이거나 사용자가 없으면 로딩 화면 표시
  if (loading || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0f0f23] via-[#1a1a2e] to-[#16213e] flex items-center justify-center">
        <div className="text-white text-xl">로딩 중...</div>
      </div>
    )
  }

  return (
    <div className="w-full min-h-[100dvh] bg-[#1a1a2e] flex flex-col relative"
      style={{
        minHeight: '100dvh'
      }}>
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
        userNickname={userNickname}
        currentEmotion={currentEmotion}
        totalPoints={totalPoints}
        emotions={emotions}
        onShowHeaderCharacterPanel={() => setShowHeaderCharacterPanel(true)}
      />

      {/* 메인 컨텐츠 영역 */}
      <div className="flex-1 relative z-10 flex flex-col">
        <div className="flex-1 relative bg-gradient-to-b from-[#0f0f23] to-[#1a1a2e] scroll-container">
          <div className="p-2 sm:p-3 lg:p-4 pb-24">
            <div className="max-w-md mx-auto w-full space-y-2 sm:space-y-3 lg:space-y-4">
            
            {/* HOME 탭 */}
            {activeTab === 'home' && (
              <HomeTab
                currentBackground={currentBackground}
                currentEmotion={currentEmotion}
                speechText={speechText}
                currentVehicle={currentVehicle}
                garageIntro={garageIntro}
                todayVisitors={todayVisitors}
                currentWeather={currentWeather}
                getWeatherIcon={getWeatherIcon}
                incomeRecords={incomeRecords}
                totalIncome={totalIncome}

                isClient={isClient}
                setShowBackgroundItemPanel={setShowBackgroundItemPanel}
                setShowVehicleItemPanel={setShowVehicleItemPanel}
                setShowCharacterItemPanel={setShowCharacterItemPanel}
                setShowIncomeInputPanel={setShowIncomeInputPanel}
                setActiveTab={setActiveTab}
              />
            )}

            {/* INCOME 탭 */}
            {activeTab === 'income' && (
              <IncomeTab
                incomeRecords={incomeRecords}
                totalIncome={totalIncome}
                getTotalIncomeByPlatform={getTotalIncomeByPlatform}
                setShowIncomeInputPanel={setShowIncomeInputPanel}
                setShowIncomePanel={setShowIncomePanel}

                onAddIncome={onIncomeSubmit}
                platforms={appPlatforms}
                togglePlatform={togglePlatform}
                addCustomPlatform={addCustomPlatform}
                removeCustomPlatform={removeCustomPlatform}
                dailyGoal={dailyGoal}
                weeklyGoal={weeklyGoal}
                monthlyGoal={monthlyGoal}
                updateGoals={updateGoals}
                setShowGoalSettings={setShowGoalSettings}
                setShowPlatformSettings={setShowPlatformSettings}
                setShowDetailModal={setShowDetailModal}
                setSelectedDate={(date: string | null) => setSelectedDate(date)}
                selectedDate={selectedDate}
                showDetailModal={showDetailModal}
              />
            )}

            {/* RANKING 탭 */}
            {activeTab === 'ranking' && (
              <RankingTab 

                allRecords={allRecords}
                dailyGoal={dailyGoal}
                onShowGradeDetail={(grade: {
                  name: string
                  icon: string
                  color: string
                  minIncome: number
                  maxIncome: number
                  description: string
                }) => {
                  setSelectedGrade(grade)
                  setShowGradeDetail(true)
                }}
                onShowTopRankerProfile={(ranker) => {
                  setSelectedTopRanker(ranker)
                  setShowTopRankerProfile(true)
                }}
              />
            )}

            {/* FRIENDS 탭 */}
            {activeTab === 'friends' && (
              <FriendsTab
                currentUserId="current-user-id"
                setShowFriendDetail={setShowFriendDetail}
                setSelectedFriend={setSelectedFriend}
              />
            )}

            {/* PROFILE 탭 */}
            {activeTab === 'profile' && (
              <ProfileTab 
                userNickname={userNickname}
                currentEmotion={currentEmotion}
                userLocation={userLocation}
                emotions={emotions}
                isIncomePrivate={isIncomePrivate}
                setIsIncomePrivate={setIsIncomePrivate}
                setShowPrivacyPolicy={setShowPrivacyPolicy}
                setShowTermsOfService={setShowTermsOfService}
                setShowDeleteAccount={setShowDeleteAccount}
                setShowFriendsModal={setShowFriendsModal}
                onLogout={async () => {
                  // 로그아웃 처리
                  await signOut()
                  router.push('/login')
                }}
              />
            )}
            </div>
          </div>
        </div>
      </div>

      {/* 하단 네비게이션 */}
      <BottomNavigation
        activeTab={activeTab}
        onTabChange={setActiveTab}

      />

      {/* 수입 입력 패널 */}
      <IncomeInputPanel
        showIncomeInputPanel={showIncomeInputPanel}
        setShowIncomeInputPanel={setShowIncomeInputPanel}
        incomeCount={incomeCount}
        setIncomeCount={setIncomeCount}
        incomeAmount={incomeAmount}
        setIncomeAmount={setIncomeAmount}
        missionAmount={missionAmount}
        setMissionAmount={setMissionAmount}
        selectedPlatform={selectedPlatform}
        setSelectedPlatform={setSelectedPlatform}
        incomeDate={incomeDate}
        setIncomeDate={setIncomeDate}
        onSubmit={onIncomeSubmit}
        platforms={appPlatforms}
      />

      <IncomePanel 
        showIncomePanel={showIncomePanel}
        setShowIncomePanel={setShowIncomePanel}
        incomeRecords={incomeRecords}
        totalIncome={totalIncome}
        getTotalIncomeByPlatform={getTotalIncomeByPlatform}
        platforms={appPlatforms}
      />

      <CharacterEditPanel 
        showHeaderCharacterPanel={showHeaderCharacterPanel}
        setShowHeaderCharacterPanel={setShowHeaderCharacterPanel}
        currentEmotion={currentEmotion}
        setCurrentEmotion={setCurrentEmotion}
        speechText={speechText}
        setSpeechText={setSpeechText}
        garageIntro={garageIntro}
        setGarageIntro={setGarageIntro}
      />

      <ItemSelectionPanels 
        showCharacterItemPanel={showCharacterItemPanel}
        setShowCharacterItemPanel={setShowCharacterItemPanel}
        currentCharacterItem={currentCharacterItem}
        setCurrentCharacterItem={setCurrentCharacterItem}
        showVehicleItemPanel={showVehicleItemPanel}
        setShowVehicleItemPanel={setShowVehicleItemPanel}
        currentVehicle={currentVehicle}
        setCurrentVehicle={setCurrentVehicle}
        showBackgroundItemPanel={showBackgroundItemPanel}
        setShowBackgroundItemPanel={setShowBackgroundItemPanel}
        currentBackground={currentBackground}
        setCurrentBackground={setCurrentBackground}
        usePoints={usePoints}
      />

      <GoalSettingsPanel 
        isOpen={showGoalSettings}
        onClose={() => setShowGoalSettings(false)}
        dailyGoal={dailyGoal}
        weeklyGoal={weeklyGoal}
        monthlyGoal={monthlyGoal}
        onUpdateGoals={updateGoals}
      />

      <PlatformSettingsPanel 
        isOpen={showPlatformSettings}
        onClose={() => setShowPlatformSettings(false)}
        platforms={appPlatforms}
        onTogglePlatform={togglePlatform}
        onAddCustomPlatform={addCustomPlatform}
        onRemoveCustomPlatform={removeCustomPlatform}
      />

      <IncomeDetailModal 
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        selectedDate={selectedDate}
        allRecords={incomeRecords}
        platforms={appPlatforms}
        onEdit={(date, records) => {
          setEditData({date, records})
          setShowEditModal(true)
        }}
      />

      <IncomeEditModal 
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        selectedDate={editData?.date || ''}
        records={editData?.records || []}
        platforms={appPlatforms}
        onSave={(date, updatedRecords) => {
          // 수정된 데이터로 incomeRecords 업데이트
          const updatedIncomeRecords = incomeRecords.map(record => {
            const updatedRecord = updatedRecords.find(ur => 
              ur.platform === record.platform && 
              record.date === date
            )
            return updatedRecord || record
          })
          
          // 실제로는 여기서 서버에 저장하는 로직이 들어갑니다
          console.log('수정된 수익 기록:', {date, updatedRecords})
          alert('수익 기록이 수정되었습니다!')
          
          // 수정 모달 닫기
          setShowEditModal(false)
        }}
      />

      <FriendDetailModal 
        isOpen={showFriendDetail}
        onClose={() => setShowFriendDetail(false)}
        friend={selectedFriend}
      />

      <TopRankerProfileModal 
        isOpen={showTopRankerProfile}
        onClose={() => setShowTopRankerProfile(false)}
        user={selectedTopRanker}
      />

      <GradeDetailModal 
        isOpen={showGradeDetail}
        onClose={() => setShowGradeDetail(false)}
        grade={selectedGrade || {
          name: '',
          minIncome: 0,
          maxIncome: 0,
          color: '#ffffff',
          description: ''
        }}
        userIncome={0}
        userRank={0}
        totalUsers={0}
      />

      <PrivacyPolicyModal 
        isOpen={showPrivacyPolicy}
        onClose={() => setShowPrivacyPolicy(false)}
      />

      <TermsOfServiceModal 
        isOpen={showTermsOfService}
        onClose={() => setShowTermsOfService(false)}
      />

      {/* 친구 관리 모달 */}
      <FriendsModal
        isOpen={showFriendsModal}
        onClose={() => setShowFriendsModal(false)}
        currentUserId={user?.id || ''}
      />
    </div>
  )
} 

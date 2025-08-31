'use client'

import { useAppState } from '@/hooks/useAppState'
// incomeUtils 더 이상 필요 없음 - useAppState에 통합됨
import { emotions, platforms } from '@/data/constants'
import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useServerTime } from '@/hooks/useServerTime'
import { supabase } from '@/lib/supabase'
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
import UserProfileModal from '@/components/modals/UserProfileModal'
import DeleteAccountModal from '@/components/modals/DeleteAccountModal'

// prerender 방지를 위한 설정
export const dynamic = 'force-dynamic'

export default function Home() {
  const { user, loading, setUser, signOut } = useAuth()
  const router = useRouter()
  
  // 서버 시간 사용
  const { serverTime } = useServerTime()

  // 모든 Hooks를 항상 동일한 순서로 호출
  const {
    // 🔥 사용자 정보 (새로 추가)
    user: appUser, setUser: setAppUser,
    // 🆕 중앙화된 모달 관리
    activeModal, openModal, closeModal,
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
    // 수입 날짜 상태 추가
    incomeRecords, setIncomeRecords,
    saveIncomeRecord, loadIncomeRecords, deleteIncomeRecord,
    totalBoxes, setTotalBoxes,
    userLevel, setUserLevel,
    // userNickname, userLocation은 user 객체에서 가져옴
    currentWeather, setCurrentWeather,
    todayVisitors, setTodayVisitors,
    totalVisitors, setTotalVisitors,
    isClient, setIsClient,
    garageIntro, setGarageIntro,




    platforms: appPlatforms,
    togglePlatform,
    addCustomPlatform,
    removeCustomPlatform,
    dailyGoal,
    weeklyGoal,
    monthlyGoal,
    updateGoals,
    friendRequests,
    setFriendRequests
  } = useAppState()

  // 모달 상태들 - 항상 동일한 순서로 호출
  const [showGoalSettings, setShowGoalSettings] = useState(false)
  const [showPlatformSettings, setShowPlatformSettings] = useState(false)
  const [showDetailModal, setShowDetailModal] = useState(false)
  
  // 수입 입력 날짜 상태 (서버 시간 기준)
  const [incomeDate, setIncomeDate] = useState(() => {
    if (serverTime) {
      return serverTime.koreaDate
    }
    const today = new Date()
    return today.getFullYear() + '-' + 
           String(today.getMonth() + 1).padStart(2, '0') + '-' + 
           String(today.getDate()).padStart(2, '0')
  })
  
  // 강제 리렌더링을 위한 key 상태
  const [forceUpdateKey, setForceUpdateKey] = useState(0)
  
  const [showEditModal, setShowEditModal] = useState(false)
  const [showRankingDetail, setShowRankingDetail] = useState(false)
  const [topRankers, setTopRankers] = useState<any[]>([])
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
  const [showUserProfile, setShowUserProfile] = useState(false)
  const [selectedUserProfile, setSelectedUserProfile] = useState<any>(null)
  const [myRank, setMyRank] = useState<number | null>(null)
  const [totalUsers, setTotalUsers] = useState<number>(0)

  // 🆕 모달을 여는 함수들 - 중앙화된 시스템 사용
  const openGoalSettings = () => {
    openModal('goalSettings')
  }

  const openPlatformSettings = () => {
    openModal('platformSettings')
  }

  const openDetailModal = () => {
    openModal('incomeDetail')
  }

  const openEditModal = () => {
    openModal('incomeEdit')
  }

  const openRankingDetail = () => {
    openModal('rankingDetail')
  }

  const openGradeDetail = (grade: any) => {
    setSelectedGrade(grade)
    openModal('gradeDetail')
  }

  const openTopRankerProfile = (ranker: any) => {
    setSelectedTopRanker(ranker)
    openModal('topRankerProfile')
  }

  const openFriendDetail = (friend: any) => {
    setSelectedFriend(friend)
    openModal('friendDetail')
  }

  const openPrivacyPolicy = () => {
    openModal('privacyPolicy')
  }

  const openTermsOfService = () => {
    openModal('termsOfService')
  }

  const openDeleteAccount = () => {
    openModal('deleteAccount')
  }

  const openFriendsModal = () => {
    openModal('friends')
  }

  const openUserProfile = (user: any) => {
    setSelectedUserProfile(user)
    openModal('userProfile')
  }
  useEffect(() => {
    console.log('메인 페이지 - useAuth user:', user)
    console.log('useAuth loading:', loading)
  }, [user, loading])

  // 🔥 useAuth 사용자 정보를 useAppState에 동기화
  useEffect(() => {
    if (user && appUser && user !== appUser) {
      console.log('🔄 사용자 정보 동기화:', user)
      setAppUser(user)
    } else if (user && !appUser) {
      console.log('🔄 사용자 정보 초기 설정:', user)
      setAppUser(user)
    }
  }, [user, appUser, setAppUser])

  // 인증 체크 - 제대로 된 사용자 인증 흐름
  useEffect(() => {
    if (!loading && !user) {
      console.log('인증 실패 - 로그인 페이지로 이동')
      router.push('/login')
    }
  }, [user, loading, router])

  // 사용자 프로필 설정 체크
  useEffect(() => {
    if (!loading && user) {
      // 프로필이 완전히 설정되었는지 확인 (닉네임과 지역만 체크)
      const isProfileComplete = user.nickname && user.region
      
      if (!isProfileComplete) {
        console.log('프로필 설정 필요 - 프로필 설정 페이지로 이동')
        router.push('/auth/setup')
      } else {
        console.log('✅ 프로필 설정 완료:', { nickname: user.nickname, region: user.region })
      }
    }
  }, [user, loading, router])

  // 🌤️ 사용자 지역 기반 실제 날씨 데이터 가져오기
  useEffect(() => {
    const fetchWeather = async () => {
      try {
        // 사용자 지역 정보 확인
        const userRegion = user?.region || appUser?.region || '서울'
        console.log('🌤️ 사용자 지역으로 날씨 조회:', userRegion)
        
        const response = await fetch(`/api/weather?region=${encodeURIComponent(userRegion)}`)
        const data = await response.json()
        
        console.log('🌤️ 날씨 응답:', data)
        
        if (response.ok) {
          setCurrentWeather({
            temp: data.temperature,
            condition: data.condition
          })
          
          if (data.error) {
            console.warn('⚠️ 날씨 API 경고:', data.error)
          }
        }
      } catch (error) {
        console.error('❌ 날씨 데이터 로딩 오류:', error)
        // 에러 시 기본 날씨 설정
        setCurrentWeather({ temp: 22, condition: 'sunny' })
      }
    }

    fetchWeather()
  }, [user?.region, appUser?.region])

  // 사용자 데이터 로딩
  useEffect(() => {
    if (user?.id) {
      loadUserData()
    }
  }, [user])

  const loadUserData = async () => {
    if (!user?.id) return

    try {
      console.log('💾 사용자 데이터 로딩 시작:', user.id)

      // 박스 데이터 로딩
      const boxesResponse = await fetch(`/api/boxes?userId=${user.id}`)
      if (boxesResponse.ok) {
        const boxesData = await boxesResponse.json()
        setTotalBoxes(boxesData.totalBoxes || 0)
      }

      console.log('✅ 사용자 데이터 로딩 완료')

    } catch (error) {
      console.error('❌ 사용자 데이터 로딩 오류:', error)
    }
  }

  // 🔥 새로운 수입 제출 핸들러 - Supabase 중심
  const onIncomeSubmit = async () => {
    if (!incomeCount || (!incomeAmount && !missionAmount)) {
      alert('배달 건수와 수입 금액을 입력해주세요.')
      return
    }

    const count = parseInt(incomeCount) || 0
    const deliveryAmount = parseInt(incomeAmount) || 0
    const missionAmount_num = parseInt(missionAmount) || 0

    const success = await saveIncomeRecord({
      platform: selectedPlatform,
      delivery_count: count,
      delivery_amount: deliveryAmount,
      mission_amount: missionAmount_num,
      date: incomeDate // 사용자가 선택한 날짜 사용
    })

    if (success) {
      // 입력 필드 초기화
      setIncomeCount('')
      setIncomeAmount('')
      setMissionAmount('')
              setIncomeDate(serverTime ? serverTime.koreaDate : 
                     (() => {
                       const today = new Date()
                       return today.getFullYear() + '-' + 
                              String(today.getMonth() + 1).padStart(2, '0') + '-' + 
                              String(today.getDate()).padStart(2, '0')
                     })()) // 날짜도 오늘로 리셋 (서버 시간 기준)
      setShowIncomeInputPanel(false)
      
      console.log('✅ 수입 기록 저장 완료! INCOME 탭 강제 새로고침')
      
      // 강제 리렌더링을 위한 key 업데이트
      setForceUpdateKey(prev => prev + 1)
      
      // 성공 피드백
      alert('수입 기록이 성공적으로 저장되었습니다! 🎉')
    } else {
      alert('수입 기록 저장에 실패했습니다. 다시 시도해주세요.')
    }
  }

  // 🗑️ 수입 기록 삭제 핸들러
  const onDeleteIncomeRecord = async (recordId: string) => {
    if (confirm('이 수입 기록을 삭제하시겠습니까?')) {
      const success = await deleteIncomeRecord(recordId)
      if (success) {
        // 강제 리렌더링
        setForceUpdateKey(prev => prev + 1)
        alert('수입 기록이 삭제되었습니다.')
      } else {
        alert('수입 기록 삭제에 실패했습니다.')
      }
    }
  }
  
  // 오늘 날짜 (서버 시간 기준)
  const today = serverTime ? new Date(serverTime.koreaDate) : new Date()
  const todayStr = serverTime ? serverTime.koreaDate : 
                   today.getFullYear() + '-' + 
                   String(today.getMonth() + 1).padStart(2, '0') + '-' + 
                   String(today.getDate()).padStart(2, '0')
  
  // 실제 수입 기록만 사용 (테스트 데이터 제거)
  const allRecords = incomeRecords

  // 오늘 수입 계산 (INCOME 탭과 동일한 방식)
  const todayIncome = (() => {
    const todayRecords = allRecords.filter(record => record.date === todayStr)
    return todayRecords.reduce((sum, record) => sum + (record.delivery_amount || 0) + (record.mission_amount || 0), 0)
  })()
  
  // 총 수입 계산
  const totalIncome = allRecords.reduce((total, record) => total + (record.delivery_amount || 0) + (record.mission_amount || 0), 0)

  // 날씨 아이콘 함수
  const getWeatherIcon = (condition: string): string => {
    switch (condition.toLowerCase()) {
      case 'sunny':
      case 'clear':
        return '☀️'
      case 'cloudy':
      case 'partly_cloudy':
        return '⛅'
      case 'overcast':
        return '☁️'
      case 'rainy':
      case 'rain':
        return '🌧️'
      case 'snowy':
      case 'snow':
        return '❄️'
      case 'stormy':
      case 'thunderstorm':
        return '⛈️'
      default:
        return '☀️'
    }
  }

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
        userNickname={user?.nickname || '배달킹'}
        currentEmotion={currentEmotion}
        totalBoxes={totalBoxes}
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
                userId={user?.id || ''}
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
                key={`income-tab-${forceUpdateKey}`}
                incomeRecords={incomeRecords}
                totalIncome={totalIncome}
                getTotalIncomeByPlatform={(platform: string) => {
                  return incomeRecords
                    .filter(record => record.platform === platform)
                    .reduce((total, record) => total + record.total_amount, 0)
                }}
                setShowIncomeInputPanel={setShowIncomeInputPanel}
                setShowIncomePanel={setShowIncomePanel}

                isVerified={true}
                onAddIncome={onIncomeSubmit}
                platforms={appPlatforms}
                togglePlatform={togglePlatform}
                addCustomPlatform={addCustomPlatform}
                removeCustomPlatform={removeCustomPlatform}
                dailyGoal={dailyGoal}
                weeklyGoal={weeklyGoal}
                monthlyGoal={monthlyGoal}
                updateGoals={updateGoals}
                setShowGoalSettings={openGoalSettings}
                setShowPlatformSettings={openPlatformSettings}
                setShowDetailModal={openDetailModal}
                setSelectedDate={(date: string | null) => setSelectedDate(date)}
                selectedDate={selectedDate}
                showDetailModal={showDetailModal}
                onEditRecord={async (record: any) => {
                  // TODO: 수입 기록 수정 모달 열기
                  console.log('수입 기록 수정:', record)
                  alert('수입 기록 수정 기능은 곧 구현 예정입니다.')
                }}
                onDeleteRecord={onDeleteIncomeRecord}
              />
            )}

            {/* RANKING 탭 */}
            {activeTab === 'ranking' && (
              <RankingTab 
                isVerified={true}
                todayIncome={todayIncome}
                dailyGoal={dailyGoal}
                isIncomePrivate={user?.is_income_private || false}
                onShowGradeDetail={(grade: {
                  name: string
                  icon: string
                  color: string
                  minIncome: number
                  maxIncome: number
                  description: string
                }) => {
                  openGradeDetail(grade)
                }}
                onShowTopRankerProfile={(ranker) => {
                  openTopRankerProfile(ranker)
                }}
                onShowRankingDetail={openRankingDetail}
                onTopRankersUpdate={setTopRankers}
                onShowUserProfile={(userProfile) => {
                  openUserProfile(userProfile)
                }}
                onMyRankUpdate={(rank: number | null, total: number) => {
                  setMyRank(rank)
                  setTotalUsers(total)
                }}
              />
            )}

            {/* FRIENDS 탭 */}
            {activeTab === 'friends' && (
              <FriendsTab
                currentUserId={user?.id || ''}
                setShowFriendDetail={openFriendDetail}
                setSelectedFriend={setSelectedFriend}
                onShowUserProfile={(userProfile) => {
                  openUserProfile(userProfile)
                }}
                friendRequests={friendRequests}
                setFriendRequests={setFriendRequests}
              />
            )}

            {/* PROFILE 탭 */}
            {activeTab === 'profile' && (
              <ProfileTab 
                userNickname={user?.nickname || '배달킹'}
                currentEmotion={currentEmotion}
                userLocation={user?.region || '서울'}
                emotions={emotions}
                isIncomePrivate={user?.is_income_private || false}
                setIsIncomePrivate={async (isPrivate: boolean) => {
                  console.log('isIncomePrivate 업데이트:', isPrivate)
                  
                  // 사용자 상태 업데이트
                  if (user) {
                    const updatedUser = { ...user, is_income_private: isPrivate }
                    
                    // 1. useAppState의 user 상태 업데이트
                    setAppUser(updatedUser)
                    
                    // 2. useAuth의 user 상태도 업데이트 (실시간 반영을 위해)
                    setUser(updatedUser)
                    
                    // 3. Supabase에 업데이트된 정보 저장
                    await supabase
                      .from('users')
                      .update({ 
                        is_income_private: isPrivate,
                        updated_at: new Date().toISOString()
                      })
                      .eq('id', user.id)
                    
                    console.log('✅ Supabase에 업데이트된 정보 저장됨')
                  }
                }}
                setShowPrivacyPolicy={openPrivacyPolicy}
                setShowTermsOfService={openTermsOfService}
                showDeleteAccount={showDeleteAccount}
                setShowDeleteAccount={setShowDeleteAccount}
                onLogout={async () => {
                  // 로그아웃 처리
                  await signOut()
                  router.push('/login')
                }}
                onUpdateProfile={async (field: string, value: string) => {
                  try {
                    if (!user?.id) {
                      console.error('사용자 ID가 없습니다.')
                      return false
                    }

                    const response = await fetch(`/api/users/${user.id}`, {
                      method: 'PUT',
                      headers: {
                        'Content-Type': 'application/json',
                      },
                      body: JSON.stringify({ [field]: value }),
                    })

                    const data = await response.json()

                    if (response.ok) {
                      console.log('✅ 프로필 업데이트 성공:', { field, value })
                      
                      // 실시간 상태 업데이트
                      if (user) {
                        const updatedUser = { ...user, [field]: value }
                        
                        // 1. useAppState의 user 상태 업데이트
                        setAppUser(updatedUser)
                        
                        // 2. useAuth의 user 상태도 업데이트 (실시간 반영을 위해)
                        setUser(updatedUser)
                        
                                              // 3. Supabase에 업데이트된 정보 저장
                      await supabase
                        .from('users')
                        .update({ 
                          [field]: value,
                          updated_at: new Date().toISOString()
                        })
                        .eq('id', user.id)
                      
                      console.log('✅ Supabase에 업데이트된 정보 저장됨')
                      }
                      return true
                    } else {
                      console.error('프로필 업데이트 실패:', data.error)
                      if (data.error === '이미 사용 중인 닉네임입니다.') {
                        alert('이미 사용 중인 닉네임입니다. 다른 닉네임을 선택해주세요.')
                      }
                      return false
                    }
                  } catch (error) {
                    console.error('프로필 업데이트 오류:', error)
                    return false
                  }
                }}
                userId={user?.id || ''}
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
        getTotalIncomeByPlatform={(platform: string) => {
          return incomeRecords
            .filter(record => record.platform === platform)
            .reduce((total, record) => total + record.total_amount, 0)
        }}
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
        totalBoxes={totalBoxes}
        useBoxes={(amount: number, item?: string) => {
          if (totalBoxes >= amount) {
            setTotalBoxes(totalBoxes - amount)
            console.log(`포인트 사용: ${amount}점 (아이템: ${item || '알 수 없음'})`)
            return true
          }
                        console.log(`박스 부족: 필요 ${amount}개, 보유 ${totalBoxes}개`)
          return false
        }}
      />

      <GoalSettingsPanel 
        isOpen={activeModal === 'goalSettings'}
        onClose={closeModal}
        dailyGoal={dailyGoal}
        weeklyGoal={weeklyGoal}
        monthlyGoal={monthlyGoal}
        onUpdateGoals={updateGoals}
      />

      <PlatformSettingsPanel 
        isOpen={activeModal === 'platformSettings'}
        onClose={closeModal}
        platforms={appPlatforms}
        onTogglePlatform={togglePlatform}
        onAddCustomPlatform={addCustomPlatform}
        onRemoveCustomPlatform={removeCustomPlatform}
      />

      <IncomeDetailModal 
        isOpen={activeModal === 'incomeDetail'}
        onClose={closeModal}
        selectedDate={selectedDate}
        allRecords={incomeRecords}
        platforms={appPlatforms}
        onEdit={(date, records) => {
          setEditData({date, records})
          openModal('incomeEdit')
        }}
      />

      <IncomeEditModal 
        isOpen={activeModal === 'incomeEdit'}
        onClose={closeModal}
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
          closeModal()
        }}
        onDeleteRecord={(recordId) => {
          // 수입 기록 삭제 로직
          if (deleteIncomeRecord) {
            deleteIncomeRecord(recordId)
          }
          console.log('수입 기록 삭제:', recordId)
        }}
      />

      <FriendDetailModal 
        isOpen={activeModal === 'friendDetail'}
        onClose={closeModal}
        friend={selectedFriend}
      />

      <TopRankerProfileModal 
        isOpen={activeModal === 'topRankerProfile'}
        onClose={closeModal}
        user={selectedTopRanker}
      />

      <GradeDetailModal 
        isOpen={activeModal === 'gradeDetail'}
        onClose={closeModal}
        grade={selectedGrade || {
          name: '',
          minIncome: 0,
          maxIncome: 0,
          color: '#ffffff',
          description: ''
        }}
        userIncome={todayIncome}
        userRank={0}
        totalUsers={0}
      />

      <RankingDetailModal 
        isOpen={activeModal === 'rankingDetail'}
        onClose={closeModal}
        userRank={myRank || 0}
        userIncome={todayIncome}
        totalUsers={totalUsers}
        topRankers={topRankers}
        platforms={appPlatforms}
        onShowUserDetail={(ranker) => {
          setSelectedTopRanker(ranker)
          openModal('topRankerProfile')
        }}
      />

      <PrivacyPolicyModal 
        isOpen={activeModal === 'privacyPolicy'}
        onClose={closeModal}
      />

      <TermsOfServiceModal 
        isOpen={activeModal === 'termsOfService'}
        onClose={closeModal}
      />

      {/* 친구 관리 모달 */}
      <FriendsModal
        isOpen={activeModal === 'friends'}
        onClose={closeModal}
        currentUserId={user?.id || ''}
      />

      {/* 사용자 프로필 모달 */}
      <UserProfileModal
        isOpen={activeModal === 'userProfile'}
        onClose={closeModal}
        user={selectedUserProfile}
        platforms={appPlatforms}
        title="USER PROFILE"
      />

      {/* 계정 삭제 모달 */}
      <DeleteAccountModal
        isOpen={showDeleteAccount}
        onClose={() => setShowDeleteAccount(false)}
        onConfirmDelete={async () => {
          try {
            const response = await fetch('/api/users/delete-account', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                userId: user?.id
              }),
            })

            const data = await response.json()

            if (data.success) {
              // Supabase에서 사용자 세션 정리
              if (user?.id) {
                await supabase
                  .from('users')
                  .update({ 
                    last_login: null,
                    updated_at: new Date().toISOString()
                  })
                  .eq('id', user.id)
                
                console.log('💾 Supabase에서 사용자 세션 정리됨')
              }
              
              // 성공적으로 삭제되면 로그아웃 처리
              await signOut()
              router.push('/login')
              alert('계정이 성공적으로 삭제되었습니다.')
            } else {
              alert(`계정 삭제 실패: ${data.error}`)
            }
          } catch (error) {
            console.error('계정 삭제 오류:', error)
            alert('계정 삭제 중 오류가 발생했습니다.')
          } finally {
            setShowDeleteAccount(false)
          }
        }}
        isLoading={false}
      />
    </div>
  )
} 

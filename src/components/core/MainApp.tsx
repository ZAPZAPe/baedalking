'use client'

import { useAppState } from '@/hooks/useAppState'
import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useServerTime } from '@/hooks/useServerTime'
import { supabase } from '@/lib/supabase'
import Header from '@/components/layout/Header'
import BottomNavigation from '@/components/layout/BottomNavigation'
import { HomeTab } from '@/components/features/garage'
import { IncomeTab } from '@/components/features/income'
import { RankingTab } from '@/components/features/ranking'
import { FriendsTab } from '@/components/features/friends'
import { ProfileTab } from '@/components/features/profile'
import { ModalManager } from '@/components/core'
import { User } from '@/types'

interface MainAppProps {
  user: User
}

export default function MainApp({ user }: MainAppProps) {
  const { signOut } = useAuth()
  const router = useRouter()
  const { serverTime } = useServerTime()

  // 모든 상태 관리
  const {
    user: appUser, setUser: setAppUser,
    activeModal, openModal, closeModal,
    showIncomePanel, setShowIncomePanel,
    showIncomeInputPanel, setShowIncomeInputPanel,
    showHeaderCharacterPanel, setShowHeaderCharacterPanel,
    showCharacterItemPanel, setShowCharacterItemPanel,
    showVehicleItemPanel, setShowVehicleItemPanel,
    showBackgroundItemPanel, setShowBackgroundItemPanel,
    showInventoryUI, setShowInventoryUI,
    currentCharacterItem, setCurrentCharacterItem,
    currentVehicle, setCurrentVehicle,
    currentBackground, setCurrentBackground,
    activeTab, setActiveTab,
    incomeCount, setIncomeCount,
    incomeAmount, setIncomeAmount,
    missionAmount, setMissionAmount,
    selectedPlatform, setSelectedPlatform,
    incomeRecords, setIncomeRecords,
    saveIncomeRecord, loadIncomeRecords, deleteIncomeRecord,
    totalBoxes, setTotalBoxes,
    userLevel, setUserLevel,
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
    setFriendRequests,
    errorMessage,
    showErrorModal
  } = useAppState()

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

  // 구 감정표현 시스템 제거됨 - 새로운 상점 기반 감정표현 시스템 사용

  // 선택된 날짜 상태 (수입 상세 모달용)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  
  // 선택된 기록 상태 (수입 수정 모달용)
  const [selectedRecords, setSelectedRecords] = useState<any[]>([])

  // 수입 기록 수정 함수
  const onEditIncomeRecord = async (date: string, updatedRecords: any[]) => {
    try {
      
      // 기존 기록 삭제
      for (const record of selectedRecords) {
        if (record.id) {
          await deleteIncomeRecord(record.id)
        }
      }
      
      // 새 기록 추가
      for (const record of updatedRecords) {
        const newRecord = {
          delivery_amount: record.amount || record.delivery_amount || 0,
          mission_amount: record.missionAmount || record.mission_amount || 0,
          delivery_count: record.count || record.delivery_count || 0,
          platform: record.platform,
          date: date,
          user_id: user.id
        }
        
        await saveIncomeRecord(newRecord)
      }
      
      // 잠시 대기 후 데이터 다시 로드
      setTimeout(async () => {
        await loadIncomeRecords()
      }, 500)
      
      alert('수입 기록이 수정되었습니다!')
      setForceUpdateKey(prev => prev + 1) // 강제 리렌더링
    } catch (error) {
      alert('수입 기록 수정에 실패했습니다.')
    }
  }

  // 강제 리렌더링을 위한 key 상태
  const [forceUpdateKey, setForceUpdateKey] = useState(0)

  // useAuth 사용자 정보를 useAppState에 동기화
  useEffect(() => {
    if (user && appUser && user !== appUser) {
      setAppUser(user)
    } else if (user && !appUser) {
      setAppUser(user)
    }
  }, [user, appUser, setAppUser])

  // 날씨 데이터는 제거됨 - 기본값 설정
  useEffect(() => {
    setCurrentWeather({ temp: 22, condition: 'sunny' })
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
      // 박스 데이터 로딩
      const boxesResponse = await fetch(`/api/boxes?userId=${user.id}`)
      if (boxesResponse.ok) {
        const boxesData = await boxesResponse.json()
        setTotalBoxes(boxesData.totalBoxes || 0)
      }
    } catch (error) {
    }
  }

  // 수입 제출 핸들러
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
      date: incomeDate
    })

    if (success) {
      setIncomeCount('')
      setIncomeAmount('')
      setMissionAmount('')
      setIncomeDate(serverTime ? serverTime.koreaDate : 
        (() => {
          const today = new Date()
          return today.getFullYear() + '-' + 
                 String(today.getMonth() + 1).padStart(2, '0') + '-' + 
                 String(today.getDate()).padStart(2, '0')
        })())
      setShowIncomeInputPanel(false)
      setForceUpdateKey(prev => prev + 1)
      alert('수입 기록이 성공적으로 저장되었습니다! 🎉')
    } else {
      alert('수입 기록 저장에 실패했습니다. 다시 시도해주세요.')
    }
  }

  // 수입 기록 삭제 핸들러
  const onDeleteIncomeRecord = async (recordId: string) => {
    if (confirm('이 수입 기록을 삭제하시겠습니까?')) {
      const success = await deleteIncomeRecord(recordId)
      if (success) {
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

  // 실제 수입 기록만 사용
  const allRecords = incomeRecords

  // 오늘 수입 계산
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

  return (
    <div className="w-full min-h-[100dvh] bg-[#1a1a2e] flex flex-col relative"
      style={{ minHeight: '100dvh' }}>
      
      {/* 전체 도트 패턴 오버레이 - z-index 낮춤 */}
      <div 
        className="absolute inset-0 z-[-1] opacity-[0.03]"
        style={{
          backgroundImage: `radial-gradient(circle, #ffffff 1px, transparent 1px)`,
          backgroundSize: '20px 20px'
        }}
      />

      {/* 헤더 */}
      <Header
        userNickname={user?.nickname || '배달킹'}
        totalBoxes={totalBoxes}
        onShowHeaderCharacterPanel={() => setShowHeaderCharacterPanel(true)}
      />

      {/* 메인 컨텐츠 영역 */}
      <div className="flex-1 relative z-10 flex flex-col">
        <div className="flex-1 relative scroll-container">
          <div className="p-2 sm:p-3 lg:p-4 pb-24">
            <div className="max-w-md mx-auto w-full space-y-2 sm:space-y-3 lg:space-y-4">
            
              {/* HOME 탭 */}
              {activeTab === 'home' && (
        <HomeTab
          currentBackground={currentBackground}
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
          showInventoryUI={showInventoryUI}
          setShowInventoryUI={setShowInventoryUI}
          setActiveTab={setActiveTab}
          openModal={openModal}
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
                  setShowGoalSettings={() => openModal('goalSettings')}
                  setShowPlatformSettings={() => openModal('platformSettings')}
                  setShowDetailModal={() => openModal('incomeDetail')}
                  setSelectedDate={setSelectedDate}
                  selectedDate={selectedDate}
                  showDetailModal={false}
                  onEditRecord={(record: any) => {
                    setSelectedRecords([record])
                    onEditIncomeRecord(record.date, [record])
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
                  onShowGradeDetail={(grade: any) => {
                    openModal('gradeDetail')
                  }}
                  onShowTopRankerProfile={(ranker) => {
                    openModal('topRankerProfile')
                  }}
                  onShowRankingDetail={() => openModal('rankingDetail')}
                  onTopRankersUpdate={() => {}}
                  onShowUserProfile={(userProfile) => {
                    openModal('userProfile')
                  }}
                  onMyRankUpdate={(rank: number | null, total: number) => {}}
                />
              )}

              {/* FRIENDS 탭 */}
              {activeTab === 'friends' && (
                <FriendsTab
                  currentUserId={user?.id || ''}
                  setShowFriendDetail={() => openModal('friendDetail')}
                  setSelectedFriend={() => {}}
                  onShowUserProfile={(userProfile) => {
                    openModal('userProfile')
                  }}
                  friendRequests={friendRequests}
                  setFriendRequests={setFriendRequests}
                />
              )}

              {/* PROFILE 탭 */}
              {activeTab === 'profile' && (
                <ProfileTab 
                  userNickname={user?.nickname || '배달킹'}
                  userLocation={user?.region || '서울'}
                  isIncomePrivate={user?.is_income_private || false}
                  setIsIncomePrivate={(isPrivate: boolean) => {
                    if (user) {
                      const updatedUser = { ...user, is_income_private: isPrivate }
                      setAppUser(updatedUser)
                      
                      // 백그라운드에서 데이터베이스 업데이트 (비동기)
                      supabase
                        .from('users')
                        .update({ 
                          is_income_private: isPrivate,
                          updated_at: new Date().toISOString()
                        })
                        .eq('id', user.id)
                        .then(({ error }) => {
                          if (error) {
                            // 실패 시 원래 값으로 되돌리기
                            const revertedUser = { ...user, is_income_private: !isPrivate }
                            setAppUser(revertedUser)
                            alert('설정 저장에 실패했습니다. 다시 시도해주세요.')
                          }
                        })
                    }
                  }}
                  setShowPrivacyPolicy={() => openModal('privacyPolicy')}
                  setShowTermsOfService={() => openModal('termsOfService')}
                  showDeleteAccount={activeModal === 'deleteAccount'}
                  setShowDeleteAccount={() => openModal('deleteAccount')}
                  onLogout={async () => {
                    await signOut()
                    router.push('/login')
                  }}
                  onUpdateProfile={async (field: string, value: string) => {
                    try {
                      if (!user?.id) {
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
                        if (user) {
                          const updatedUser = { ...user, [field]: value }
                          setAppUser(updatedUser)
                          
                          await supabase
                            .from('users')
                            .update({ 
                              [field]: value,
                              updated_at: new Date().toISOString()
                            })
                            .eq('id', user.id)
                        }
                        return true
                      } else {
                        showErrorModal(data.error || '프로필 업데이트에 실패했습니다.')
                        return false
                      }
                    } catch (error) {
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

      {/* 모달 관리자 */}
      <ModalManager
        user={user}
        activeModal={activeModal}
        closeModal={closeModal}
        openModal={openModal}
        errorMessage={errorMessage}
        // 수입 관련 상태
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
        // 수입 패널 상태
        showIncomePanel={showIncomePanel}
        setShowIncomePanel={setShowIncomePanel}
        incomeRecords={incomeRecords}
        totalIncome={totalIncome}
        // 캐릭터 편집 상태
        showHeaderCharacterPanel={showHeaderCharacterPanel}
        setShowHeaderCharacterPanel={setShowHeaderCharacterPanel}
        garageIntro={garageIntro}
        setGarageIntro={setGarageIntro}
        // 아이템 선택 상태
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
        setTotalBoxes={setTotalBoxes}
        // 목표 설정 상태
        dailyGoal={dailyGoal}
        weeklyGoal={weeklyGoal}
        monthlyGoal={monthlyGoal}
        updateGoals={updateGoals}
        // 플랫폼 설정 상태
        togglePlatform={togglePlatform}
        addCustomPlatform={addCustomPlatform}
        removeCustomPlatform={removeCustomPlatform}
        // 친구 관련 상태
        friendRequests={friendRequests}
        setFriendRequests={setFriendRequests}
        // 기타 상태
        todayIncome={todayIncome}
        onDeleteIncomeRecord={onDeleteIncomeRecord}
        // 수입 상세 모달 상태
        selectedDate={selectedDate}
        selectedRecords={selectedRecords}
        setSelectedRecords={setSelectedRecords}
        onEditIncomeRecord={onEditIncomeRecord}
      />

    </div>
  )
}

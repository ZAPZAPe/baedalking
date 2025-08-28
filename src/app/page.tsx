'use client'

import { useState } from 'react'
import { useAppState } from '@/hooks/useAppState'
import { handleIncomeSubmit } from '@/lib/incomeUtils'
import { emotions, platforms } from '@/data/constants'
import Header from '@/components/layout/Header'
import BottomNavigation from '@/components/layout/BottomNavigation'
import HomeTab from '@/components/tabs/HomeTab'
import IncomeTab from '@/components/tabs/IncomeTab'
import RankingTab from '@/components/tabs/RankingTab'
import FriendsTab from '@/components/tabs/FriendsTab'
import ProfileTab from '@/components/tabs/ProfileTab'
import CustomizePanel from '@/components/modals/CustomizePanel'
import IncomeInputPanel from '@/components/modals/IncomeInputPanel'
import IncomePanel from '@/components/modals/IncomePanel'
import CharacterEditPanel from '@/components/modals/CharacterEditPanel'
import ItemSelectionPanels from '@/components/modals/ItemSelectionPanels'
import GoalSettingsPanel from '@/components/modals/GoalSettingsPanel'
import PlatformSettingsPanel from '@/components/modals/PlatformSettingsPanel'
import IncomeDetailModal from '@/components/modals/IncomeDetailModal'
import IncomeEditModal from '@/components/modals/IncomeEditModal'
import GradeDetailModal from '@/components/modals/GradeDetailModal'

import UserProfileModal from '@/components/modals/UserProfileModal'
import PrivacyPolicyModal from '@/components/modals/PrivacyPolicyModal'
import TermsOfServiceModal from '@/components/modals/TermsOfServiceModal'

export default function HomePage() {
  const [showGoalSettings, setShowGoalSettings] = useState(false)
  const [showPlatformSettings, setShowPlatformSettings] = useState(false)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editData, setEditData] = useState<{date: string, records: any[]} | null>(null)
  const [showGradeDetail, setShowGradeDetail] = useState(false)
  const [selectedGrade, setSelectedGrade] = useState<any>(null)
  const [showFriendDetail, setShowFriendDetail] = useState(false)
  const [selectedFriend, setSelectedFriend] = useState<any>(null)
  const [showTopRankerProfile, setShowTopRankerProfile] = useState(false)
  const [selectedTopRanker, setSelectedTopRanker] = useState<any>(null)
  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false)
  const [showTermsOfService, setShowTermsOfService] = useState(false)
  const [showDeleteAccount, setShowDeleteAccount] = useState(false)
  
  const {
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
    incomeImage, setIncomeImage,
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
    isVerified, setIsVerified,
    level, setLevel,
    isIncomePrivate, setIsIncomePrivate,

    getTotalIncomeByPlatform,
    totalIncome,
    getWeatherIcon,
    addPoints,
    usePoints,
    canAfford,
    platforms,
    togglePlatform,
    addCustomPlatform,
    removeCustomPlatform,
    dailyGoal,
    weeklyGoal,
    monthlyGoal,
    updateGoals
  } = useAppState()

  // 수입 제출 핸들러
  const onIncomeSubmit = () => {
    handleIncomeSubmit(
      incomeCount,
      incomeAmount,
      missionAmount,
      selectedPlatform,
      incomeImage,
      setDailyIncomeData,
      setIncomeRecords,
      addPoints,
      setIsVerified,
      setIncomeCount,
      setIncomeAmount,
      setMissionAmount,
      setIncomeImage
    )
  }
  
  // 오늘 날짜
  const today = new Date()
  const todayStr = today.toISOString().split('T')[0]
  
  // 실제 수입 기록만 사용 (테스트 데이터 제거)
  const allRecords = incomeRecords

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
                isVerified={isVerified}
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
                isVerified={isVerified}
                onAddIncome={onIncomeSubmit}
                platforms={platforms}
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
                setSelectedDate={setSelectedDate}
                selectedDate={selectedDate}
                showDetailModal={showDetailModal}
              />
            )}

            {/* RANKING 탭 */}
            {activeTab === 'ranking' && (
                      <RankingTab 
          isVerified={isVerified}
          allRecords={allRecords}
          dailyGoal={dailyGoal}
          onShowGradeDetail={(grade) => {
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
        isVerified={isVerified}
      />

      {/* 모달들 */}
      <CustomizePanel 
        showCustomizePanel={showCustomizePanel}
        setShowCustomizePanel={setShowCustomizePanel}
        totalPoints={totalPoints}
        usePoints={usePoints}
      />

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
        incomeImage={incomeImage}
        setIncomeImage={setIncomeImage}
        incomeDate={incomeDate}
        setIncomeDate={setIncomeDate}
        onSubmit={onIncomeSubmit}
        platforms={platforms}
      />

      <IncomePanel 
        showIncomePanel={showIncomePanel}
        setShowIncomePanel={setShowIncomePanel}
        incomeRecords={incomeRecords}
        totalIncome={totalIncome}
        getTotalIncomeByPlatform={getTotalIncomeByPlatform}
        platforms={platforms}
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
        platforms={platforms}
        onTogglePlatform={togglePlatform}
        onAddCustomPlatform={addCustomPlatform}
        onRemoveCustomPlatform={removeCustomPlatform}
      />

      <IncomeDetailModal 
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        selectedDate={selectedDate}
        allRecords={incomeRecords}
        platforms={platforms}
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
        platforms={platforms}
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
          setEditData(null)
        }}
      />

      <GradeDetailModal 
        isOpen={showGradeDetail}
        onClose={() => setShowGradeDetail(false)}
        grade={selectedGrade}
        userIncome={selectedGrade ? 180000 : 0} // 테스트용 수입
        userRank={selectedGrade ? Math.floor(Math.random() * 100) + 1 : 0} // 시뮬레이션
        totalUsers={300} // 시뮬레이션
      />

      <UserProfileModal 
        isOpen={showTopRankerProfile}
        onClose={() => setShowTopRankerProfile(false)}
        user={{
          id: selectedTopRanker?.id || '',
          nickname: selectedTopRanker?.nickname || '',
          region: selectedTopRanker?.region || '',
          income: selectedTopRanker?.income || 0,
          count: selectedTopRanker?.count || 0,
          platforms: selectedTopRanker?.platforms || [],
          rank: selectedTopRanker?.rank || 0,
          grade: selectedTopRanker?.grade || '',
          minihomeId: selectedTopRanker?.id || ''
        }}
        title="TOP 랭커 프로필"
      />

      <UserProfileModal 
        isOpen={showFriendDetail}
        onClose={() => setShowFriendDetail(false)}
        user={{
          id: selectedFriend?.friendId || '',
          nickname: selectedFriend?.friend?.nickname || '알 수 없음',
          region: selectedFriend?.friend?.region || '지역 없음',
          income: selectedFriend?.friend?.totalIncome || 0,
          count: selectedFriend?.friend?.totalCount || 0,
          platforms: selectedFriend?.friend?.mainPlatform ? [selectedFriend.friend.mainPlatform] : [],
          isIncomePrivate: selectedFriend?.friend?.isIncomePrivate || false,
          minihomeId: selectedFriend?.friendId || ''
        }}
        title="친구 프로필"
      />

      <PrivacyPolicyModal 
        isOpen={showPrivacyPolicy}
        onClose={() => setShowPrivacyPolicy(false)}
      />

            <TermsOfServiceModal
        isOpen={showTermsOfService}
        onClose={() => setShowTermsOfService(false)}
      />

      {/* ACCOUNT DELETE 모달 */}
      {showDeleteAccount && (
        <div 
          className="fixed inset-0 z-[999999] bg-black flex items-center justify-center p-2 sm:p-4"
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            // 패널 외부 클릭 시 바로 닫히지 않음
          }}
          onTouchStart={(e) => e.stopPropagation()}
          onTouchEnd={(e) => e.stopPropagation()}
        >
          <div 
            className="w-full max-w-sm sm:max-w-md bg-gradient-to-b from-[#0a0a23] via-[#16213e] to-[#1a1a2e] border-2 sm:border-4 border-[#ff6b6b]/50 shadow-2xl relative"
            style={{
              borderRadius: '6px',
              fontFamily: 'monospace',
              imageRendering: 'pixelated',
              boxShadow: '0 0 20px rgba(255, 107, 107, 0.2), inset 0 0 15px rgba(255, 107, 107, 0.05)'
            }}
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
            }}
            onTouchStart={(e) => e.stopPropagation()}
            onTouchEnd={(e) => e.stopPropagation()}
          >
            {/* 네온 글로우 테두리 */}
            <div className="absolute -inset-1 bg-gradient-to-r from-[#ff6b6b]/20 via-[#ff4757]/20 to-[#ff6b6b]/20 blur-sm -z-10" 
                 style={{borderRadius: '12px'}}></div>
            
            {/* 헤더 - 게임 스타일 */}
            <div className="bg-gradient-to-r from-[#0a0a23] to-[#16213e] p-3 sm:p-4 border-b-2 border-[#ff6b6b]/30 relative">
              {/* 상단 장식 라인 */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#ff6b6b]/60 to-transparent"></div>
              
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2 sm:gap-3">
                  {/* 픽셀 아이콘 */}
                  <div className="w-5 h-5 sm:w-6 sm:h-6 bg-gradient-to-br from-[#ff6b6b] to-[#ff4757] border border-[#ff6b6b]" 
                       style={{borderRadius: '3px'}}>
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="w-2 h-2 sm:w-3 sm:h-3 bg-white" style={{borderRadius: '1px'}}></div>
                    </div>
                  </div>
                  <h3 className="text-[#ff6b6b] font-bold text-sm sm:text-lg font-mono tracking-wider" 
                      style={{textShadow: '0 0 8px rgba(255, 107, 107, 0.5)'}}>
                    ACCOUNT DELETE
                  </h3>
                </div>
                <button
                  onClick={() => setShowDeleteAccount(false)}
                  className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-br from-[#ff6b6b]/20 to-[#ff4757]/20 border border-[#ff6b6b]/50 hover:border-[#ff6b6b] text-[#ff6b6b] hover:text-[#ff4757] font-bold transition-all duration-200 hover:scale-110 text-sm sm:text-base"
                  style={{borderRadius: '4px'}}
                >
                  ✕
                </button>
              </div>
            </div>

            {/* 내용 */}
            <div className="p-4 sm:p-6">
              <div className="text-center mb-6">
                <h3 className="text-[#ff6b6b] font-bold text-xl font-mono mb-2">계정 삭제</h3>
                <p className="text-gray-300 text-sm font-mono">정말로 계정을 삭제하시겠습니까?</p>
              </div>

              {/* 경고 메시지 */}
              <div className="bg-[#ff6b6b]/10 border border-[#ff6b6b]/30 rounded-lg p-4 mb-6">
                <p className="text-[#ff6b6b] text-sm font-mono">
                  ⚠️ 이 작업은 되돌릴 수 없습니다. 모든 데이터가 영구적으로 삭제됩니다.
                </p>
              </div>

              {/* 버튼들 */}
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteAccount(false)}
                  className="flex-1 bg-[#4a5568] hover:bg-[#2d3748] text-white font-bold py-3 px-4 rounded-lg transition-all duration-200 font-mono"
                  style={{borderRadius: '4px'}}
                >
                  취소
                </button>
                <button
                  onClick={() => {
                    // TODO: 계정 삭제 로직 구현
                    console.log('계정 삭제')
                    setShowDeleteAccount(false)
                  }}
                  className="flex-1 bg-[#ff6b6b] hover:bg-[#ff5252] text-white font-bold py-3 px-4 rounded-lg transition-all duration-200 font-mono"
                  style={{borderRadius: '4px'}}
                >
                  삭제
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 광고 클릭 방지 투명 레이어 */}
      {(showCustomizePanel || showIncomePanel || showIncomeInputPanel || showHeaderCharacterPanel || 
        showCharacterItemPanel || showVehicleItemPanel || showBackgroundItemPanel || showGoalSettings || showPlatformSettings || showDetailModal || showEditModal || showGradeDetail || showTopRankerProfile || showFriendDetail || showPrivacyPolicy || showTermsOfService || showDeleteAccount) && (
        <div 
          className="fixed inset-0 z-[9998] pointer-events-none"
          style={{
            backgroundColor: 'transparent',
            backdropFilter: 'none'
          }}
        />
      )}
    </div>
  )
}

'use client'

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

export default function HomePage() {
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
              />
            )}

            {/* RANKING 탭 */}
            {activeTab === 'ranking' && (
              <RankingTab
                isVerified={isVerified}
                allRecords={allRecords}
                dailyGoal={dailyGoal}
              />
            )}

            {/* FRIENDS 탭 */}
            {activeTab === 'friends' && (
              <FriendsTab
                currentUserId="current-user-id"
              />
            )}

            {/* PROFILE 탭 */}
            {activeTab === 'profile' && (
              <ProfileTab
                userNickname={userNickname}
                currentEmotion={currentEmotion}
                emotions={emotions}
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

      {/* 광고 클릭 방지 투명 레이어 */}
      {(showCustomizePanel || showIncomePanel || showIncomeInputPanel || showHeaderCharacterPanel || 
        showCharacterItemPanel || showVehicleItemPanel || showBackgroundItemPanel) && (
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

'use client'

import { User, Platform } from '@/types'
import { ModalType } from '@/hooks/useAppState'
import {
  IncomeInputPanel,
  IncomePanel,
  IncomeDetailModal,
  IncomeEditModal,
  GoalSettingsPanel,
  PlatformSettingsPanel
} from '@/components/features/income'

import {
  CharacterEditPanel,
  ItemSelectionPanels
} from '@/components/features/garage'

import {
  FriendDetailModal,
  FriendsModal,
  UserProfileModal
} from '@/components/features/friends'

import {
  TopRankerProfileModal,
  GradeDetailModal,
  RankingDetailModal
} from '@/components/features/ranking'

import {
  DeleteAccountModal,
  PrivacyPolicyModal,
  TermsOfServiceModal
} from '@/components/features/profile'

import { ErrorModal } from '@/components/ui/ErrorModal'
import ShopItemDetailModal from '@/components/decoration/ShopItemDetailModal'

interface ModalManagerProps {
  user: User
  activeModal: ModalType
  closeModal: () => void
  openModal: (modalName: ModalType) => void
  
  // 수입 관련 상태
  showIncomeInputPanel: boolean
  setShowIncomeInputPanel: (show: boolean) => void
  incomeCount: string
  setIncomeCount: (count: string) => void
  incomeAmount: string
  setIncomeAmount: (amount: string) => void
  missionAmount: string
  setMissionAmount: (amount: string) => void
  selectedPlatform: string
  setSelectedPlatform: (platform: string) => void
  incomeDate: string
  setIncomeDate: (date: string) => void
  onSubmit: () => void
  platforms: Platform[]
  
  // 수입 패널 상태
  showIncomePanel: boolean
  setShowIncomePanel: (show: boolean) => void
  incomeRecords: any[]
  totalIncome: number
  
  // 캐릭터 편집 상태
  showHeaderCharacterPanel: boolean
  setShowHeaderCharacterPanel: (show: boolean) => void
  currentEmotion: string
  setCurrentEmotion: (emotion: string) => void
  garageIntro: string
  setGarageIntro: (intro: string) => void
  
  // 아이템 선택 상태
  showCharacterItemPanel: boolean
  setShowCharacterItemPanel: (show: boolean) => void
  currentCharacterItem: string
  setCurrentCharacterItem: (item: string) => void
  showVehicleItemPanel: boolean
  setShowVehicleItemPanel: (show: boolean) => void
  currentVehicle: string
  setCurrentVehicle: (vehicle: string) => void
  showBackgroundItemPanel: boolean
  setShowBackgroundItemPanel: (show: boolean) => void
  currentBackground: string
  setCurrentBackground: (background: string) => void
  totalBoxes: number
  setTotalBoxes: (boxes: number) => void
  
  // 목표 설정 상태
  dailyGoal: number
  weeklyGoal: number
  monthlyGoal: number
  updateGoals: (goals: { daily: number; weekly: number; monthly: number }) => void
  
  // 플랫폼 설정 상태
  togglePlatform: (platformId: string) => void
  addCustomPlatform: (name: string) => void
  removeCustomPlatform: (platformId: string) => void
  
  // 에러 상태
  errorMessage: string
  
  // 친구 관련 상태
  friendRequests: any[]
  setFriendRequests: (requests: any[]) => void
  
  // 기타 상태
  todayIncome: number
  onDeleteIncomeRecord: (recordId: string) => void
  
  // 수입 상세 모달 상태
  selectedDate: string | null
  
  // 수입 수정 모달 상태
  selectedRecords: any[]
  setSelectedRecords: (records: any[]) => void
  onEditIncomeRecord: (date: string, updatedRecords: any[]) => void
  
  // 상점 아이템 모달 상태
  selectedShopItem: any | null
  setSelectedShopItem: (item: any | null) => void
  userMoney: number
  userInventory: any[]
  placedItems: any[]
  onPurchase: (itemId: string) => void
}

export default function ModalManager({
  user,
  activeModal,
  closeModal,
  openModal,
  // 수입 관련 상태
  showIncomeInputPanel,
  setShowIncomeInputPanel,
  incomeCount,
  setIncomeCount,
  incomeAmount,
  setIncomeAmount,
  missionAmount,
  setMissionAmount,
  selectedPlatform,
  setSelectedPlatform,
  incomeDate,
  setIncomeDate,
  onSubmit,
  platforms,
  // 수입 패널 상태
  showIncomePanel,
  setShowIncomePanel,
  incomeRecords,
  totalIncome,
  // 캐릭터 편집 상태
  showHeaderCharacterPanel,
  setShowHeaderCharacterPanel,
  currentEmotion,
  setCurrentEmotion,
  garageIntro,
  setGarageIntro,
  // 아이템 선택 상태
  showCharacterItemPanel,
  setShowCharacterItemPanel,
  currentCharacterItem,
  setCurrentCharacterItem,
  showVehicleItemPanel,
  setShowVehicleItemPanel,
  currentVehicle,
  setCurrentVehicle,
  showBackgroundItemPanel,
  setShowBackgroundItemPanel,
  currentBackground,
  setCurrentBackground,
  totalBoxes,
  setTotalBoxes,
  // 목표 설정 상태
  dailyGoal,
  weeklyGoal,
  monthlyGoal,
  updateGoals,
  // 플랫폼 설정 상태
  togglePlatform,
  addCustomPlatform,
  removeCustomPlatform,
  // 친구 관련 상태
  friendRequests,
  setFriendRequests,
  // 기타 상태
  todayIncome,
  onDeleteIncomeRecord,
  // 수입 상세 모달 상태
  selectedDate,
  selectedRecords,
  setSelectedRecords,
  onEditIncomeRecord,
  // 상점 아이템 모달 상태
  selectedShopItem,
  setSelectedShopItem,
  userMoney,
  userInventory,
  placedItems,
  onPurchase,
  // 에러 상태
  errorMessage
}: ModalManagerProps) {
  
  const getTotalIncomeByPlatform = (platform: string) => {
    return incomeRecords
      .filter(record => record.platform === platform)
      .reduce((total, record) => total + record.total_amount, 0)
  }

  const useBoxes = (amount: number, item?: string) => {
    if (totalBoxes >= amount) {
      setTotalBoxes(totalBoxes - amount)
      return true
    }
    return false
  }

  return (
    <>
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
        onSubmit={onSubmit}
        platforms={platforms}
      />

      {/* 수입 패널 */}
      <IncomePanel 
        showIncomePanel={showIncomePanel}
        setShowIncomePanel={setShowIncomePanel}
        incomeRecords={incomeRecords}
        totalIncome={totalIncome}
        getTotalIncomeByPlatform={getTotalIncomeByPlatform}
        platforms={platforms}
      />

      {/* 캐릭터 편집 패널 */}
      <CharacterEditPanel 
        showHeaderCharacterPanel={showHeaderCharacterPanel}
        setShowHeaderCharacterPanel={setShowHeaderCharacterPanel}
        currentEmotion={currentEmotion}
        setCurrentEmotion={setCurrentEmotion}
        garageIntro={garageIntro}
        setGarageIntro={setGarageIntro}
      />

      {/* 아이템 선택 패널들 */}
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
        useBoxes={useBoxes}
      />

      {/* 목표 설정 패널 */}
      <GoalSettingsPanel 
        isOpen={activeModal === 'goalSettings'}
        onClose={closeModal}
        dailyGoal={dailyGoal}
        weeklyGoal={weeklyGoal}
        monthlyGoal={monthlyGoal}
        onUpdateGoals={updateGoals}
      />

      {/* 플랫폼 설정 패널 */}
      <PlatformSettingsPanel 
        isOpen={activeModal === 'platformSettings'}
        onClose={closeModal}
        platforms={platforms}
        onTogglePlatform={togglePlatform}
        onAddCustomPlatform={addCustomPlatform}
        onRemoveCustomPlatform={removeCustomPlatform}
      />

      {/* 수입 상세 모달 */}
      <IncomeDetailModal 
        isOpen={activeModal === 'incomeDetail'}
        onClose={closeModal}
        selectedDate={selectedDate || ''}
        allRecords={incomeRecords}
        platforms={platforms}
        onEdit={(date, records) => {
          setSelectedRecords(records)
          openModal('incomeEdit')
        }}
      />

      {/* 수입 수정 모달 */}
      <IncomeEditModal 
        isOpen={activeModal === 'incomeEdit'}
        onClose={closeModal}
        selectedDate={selectedDate || ''}
        records={selectedRecords || []}
        platforms={platforms}
        onSave={onEditIncomeRecord}
        onDeleteRecord={onDeleteIncomeRecord}
      />

      {/* 친구 상세 모달 */}
      <FriendDetailModal 
        isOpen={activeModal === 'friendDetail'}
        onClose={closeModal}
        friend={{
          id: '',
          name: '',
          region: '',
          income: 0,
          rank: 0,
          grade: '',
          platform: '',
          count: 0
        }}
      />

      {/* 상위 랭커 프로필 모달 */}
      <TopRankerProfileModal 
        isOpen={activeModal === 'topRankerProfile'}
        onClose={closeModal}
        user={{
          id: '',
          nickname: '',
          region: '',
          income: 0,
          count: 0,
          platforms: [],
          rank: 0,
          grade: ''
        }}
      />

      {/* 등급 상세 모달 */}
      <GradeDetailModal 
        isOpen={activeModal === 'gradeDetail'}
        onClose={closeModal}
        grade={{
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

      {/* 랭킹 상세 모달 */}
      <RankingDetailModal 
        isOpen={activeModal === 'rankingDetail'}
        onClose={closeModal}
        userRank={0}
        userIncome={todayIncome}
        totalUsers={0}
        topRankers={[]}
        platforms={platforms}
        onShowUserDetail={(ranker) => {
          openModal('topRankerProfile')
        }}
      />

      {/* 개인정보 처리방침 모달 */}
      <PrivacyPolicyModal 
        isOpen={activeModal === 'privacyPolicy'}
        onClose={closeModal}
      />

      {/* 이용약관 모달 */}
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
        user={{
          id: '',
          nickname: '',
          region: '',
          income: 0,
          count: 0,
          platforms: [],
          rank: 0,
          grade: '',
          isIncomePrivate: false
        }}
        platforms={platforms}
        title="USER PROFILE"
      />

      {/* 계정 삭제 모달 */}
      <DeleteAccountModal
        isOpen={activeModal === 'deleteAccount'}
        onClose={closeModal}
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
              alert('계정이 성공적으로 삭제되었습니다.')
            } else {
              alert(`계정 삭제 실패: ${data.error}`)
            }
          } catch (error) {
            console.error('계정 삭제 오류:', error)
            alert('계정 삭제 중 오류가 발생했습니다.')
          } finally {
            closeModal()
          }
        }}
        isLoading={false}
      />

      {/* 상점 아이템 모달 */}
      {console.log('🛒 ModalManager - 상점 아이템 모달 조건:', { 
        activeModal, 
        isShopItemDetail: activeModal === 'shopItemDetail',
        selectedShopItem: selectedShopItem?.name 
      })}
      <ShopItemDetailModal
        isOpen={activeModal === 'shopItemDetail'}
        onClose={() => {
          setSelectedShopItem(null)
          closeModal()
        }}
        item={selectedShopItem}
        userMoney={userMoney}
        userInventory={userInventory}
        placedItems={placedItems}
        onPurchase={onPurchase}
      />

      {/* 에러 모달 */}
      <ErrorModal
        isOpen={activeModal === 'error'}
        onClose={closeModal}
        message={errorMessage}
      />
    </>
  )
}

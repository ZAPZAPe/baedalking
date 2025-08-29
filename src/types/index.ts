// ============================================================================
// 🏗️ 배달킹 앱 전체 타입 정의
// ============================================================================

// ============================================================================
// 👤 사용자 관련 타입
// ============================================================================

export interface User {
  id: string
  email: string
  nickname: string
  avatar_url?: string
  kakao_id?: string
  region?: string
  avatar_config?: Record<string, any>
  garage_config?: Record<string, any>
  created_at?: string
  updated_at?: string
}

export interface UserProfile {
  id: string
  nickname: string
  region: string
  income: number
  count: number
  platforms: string[]
  rank?: number
  grade?: string
}

// ============================================================================
// 💰 수입 관련 타입
// ============================================================================

export interface IncomeRecord {
  id: number
  platform: string
  count: number
  deliveryAmount: number
  missionAmount: number
  amount: number
  date: string
}

export interface DailyIncomeData {
  date: string
  platforms: {
    [key: string]: {
      count: number
      deliveryAmount: number
      missionAmount: number
    }
  }
  totalCount: number
  totalAmount: number
}

export interface IncomeTabProps {
  incomeRecords: IncomeRecord[]
  totalIncome: number
  getTotalIncomeByPlatform: (platform: string) => number
  setShowIncomeInputPanel: (show: boolean) => void
  setShowIncomePanel: (show: boolean) => void
  isVerified: boolean
  onAddIncome?: (record: IncomeRecord) => void
  platforms: Platform[]
  togglePlatform: (platformId: string) => void
  addCustomPlatform: (name: string) => void
  removeCustomPlatform: (platformId: string) => void
  dailyGoal: number
  weeklyGoal: number
  monthlyGoal: number
  updateGoals: (daily: number, weekly: number, monthly: number) => void
  setShowGoalSettings: (show: boolean) => void
  setShowPlatformSettings: (show: boolean) => void
  setShowDetailModal: (show: boolean) => void
  setSelectedDate: (date: string | null) => void
  selectedDate: string | null
  showDetailModal: boolean
}

// ============================================================================
// 🏪 플랫폼 관련 타입
// ============================================================================

export interface Platform {
  id: string
  name: string
  icon: string
  color: string
  bgColor: string
  isActive: boolean
  type: 'default' | 'custom'
}

// ============================================================================
// 🏆 랭킹 및 등급 관련 타입
// ============================================================================

export interface GradeInfo {
  name: string
  icon: string
  color: string
  minIncome: number
  maxIncome: number
  description: string
}

export interface TopRanker {
  id: string
  rank: number
  income: number
  count: number
  platform: string
  nickname: string
  region: string
  platforms: string[]
}

export interface RankingTabProps {
  isVerified: boolean
  allRecords: IncomeRecord[]
  dailyGoal: number
  onShowGradeDetail: (grade: GradeInfo) => void
  onShowTopRankerProfile: (ranker: TopRanker) => void
}

// ============================================================================
// 👥 친구 및 소셜 관련 타입
// ============================================================================

export interface Friendship {
  id: string
  userId: string
  friendId: string
  status: 'pending' | 'accepted' | 'rejected'
  createdAt: string
}

export interface FriendsTabProps {
  currentUserId: string
  setShowFriendDetail: (show: boolean) => void
  setSelectedFriend: (friend: UserProfile) => void
}

// ============================================================================
// 🎨 UI 컴포넌트 관련 타입
// ============================================================================

export interface Emotion {
  id: string
  label: string
  icon: string
  color: string
}

export interface HeaderProps {
  userNickname: string
  totalPoints: number
  currentEmotion: string
  emotions: Emotion[]
  onShowHeaderCharacterPanel: () => void
}

export interface ProfileTabProps {
  userNickname: string
  currentEmotion: string
  userLocation: string
  emotions: Emotion[]
  isIncomePrivate: boolean
  setIsIncomePrivate: (isPrivate: boolean) => void
  setShowPrivacyPolicy: (show: boolean) => void
  setShowTermsOfService: (show: boolean) => void
  setShowDeleteAccount: (show: boolean) => void
  onLogout: () => void
}

export interface BottomNavigationProps {
  activeTab: string
  onTabChange: (tab: string) => void
  isVerified: boolean
}

export interface HomeTabProps {
  currentBackground: string
  currentEmotion: string
  speechText: string
  currentVehicle: string
  garageIntro: string
  todayVisitors: number
  currentWeather: { temp: number; condition: string }
  getWeatherIcon: (condition: string) => string
  incomeRecords: IncomeRecord[]
  totalIncome: number
  isVerified: boolean
  isClient: boolean
  setShowBackgroundItemPanel: (show: boolean) => void
  setShowVehicleItemPanel: (show: boolean) => void
  setShowCharacterItemPanel: (show: boolean) => void
  setShowIncomeInputPanel: (show: boolean) => void
  setActiveTab: (tab: string) => void
}

// ============================================================================
// 🎮 게임 시스템 관련 타입
// ============================================================================

export interface CharacterItem {
  id: string
  name: string
  type: 'character' | 'vehicle' | 'background'
  price: number
  assetUrl: string
  description: string
}

export interface ItemSelectionPanelsProps {
  // Character Item Panel
  showCharacterItemPanel: boolean
  setShowCharacterItemPanel: (show: boolean) => void
  currentCharacterItem: string
  setCurrentCharacterItem: (item: string) => void
  
  // Vehicle Item Panel
  showVehicleItemPanel: boolean
  setShowVehicleItemPanel: (show: boolean) => void
  currentVehicle: string
  setCurrentVehicle: (vehicle: string) => void
  
  // Background Item Panel
  showBackgroundItemPanel: boolean
  setShowBackgroundItemPanel: (show: boolean) => void
  currentBackground: string
  setCurrentBackground: (background: string) => void
  
  // Point system
  usePoints: (amount: number, item: string) => boolean
}

export interface CustomizePanelProps {
  showCustomizePanel: boolean
  setShowCustomizePanel: (show: boolean) => void
  totalPoints: number
  usePoints: (amount: number, item: string) => boolean
}

// ============================================================================
// 🔐 인증 관련 타입
// ============================================================================

export interface AuthContextType {
  user: User | null
  isLoading: boolean
  loading: boolean
  signOut: () => Promise<void>
  signUp: (email: string, password: string, nickname: string) => Promise<any>
  signIn: (email: string, password: string) => Promise<any>
  resetPassword: (email: string) => Promise<any>
}

// ============================================================================
// 📊 모달 관련 타입
// ============================================================================

export interface IncomePanelProps {
  showIncomePanel: boolean
  setShowIncomePanel: (show: boolean) => void
  incomeRecords: IncomeRecord[]
  totalIncome: number
  getTotalIncomeByPlatform: (platform: string) => number
  platforms: Platform[]
}

export interface IncomeInputPanelProps {
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
}

export interface CharacterEditPanelProps {
  showHeaderCharacterPanel: boolean
  setShowHeaderCharacterPanel: (show: boolean) => void
  currentEmotion: string
  setCurrentEmotion: (emotion: string) => void
  speechText: string
  setSpeechText: (text: string) => void
  garageIntro: string
  setGarageIntro: (intro: string) => void
}

export interface GoalSettingsPanelProps {
  isOpen: boolean
  onClose: () => void
  dailyGoal: number
  weeklyGoal: number
  monthlyGoal: number
  onUpdateGoals: (daily: number, weekly: number, monthly: number) => void
}

export interface PlatformSettingsPanelProps {
  isOpen: boolean
  onClose: () => void
  platforms: Platform[]
  onTogglePlatform: (platformId: string) => void
  onAddCustomPlatform: (name: string) => void
  onRemoveCustomPlatform: (platformId: string) => void
}

export interface IncomeDetailModalProps {
  isOpen: boolean
  onClose: () => void
  selectedDate: string
  allRecords: IncomeRecord[]
  platforms: Platform[]
  onEdit: (date: string, records: IncomeRecord[]) => void
}

export interface IncomeEditModalProps {
  isOpen: boolean
  onClose: () => void
  selectedDate: string
  records: IncomeRecord[]
  platforms: Platform[]
  onSave: (date: string, updatedRecords: IncomeRecord[]) => void
}

export interface FriendDetailModalProps {
  isOpen: boolean
  onClose: () => void
  friend: UserProfile
}

export interface TopRankerProfileModalProps {
  isOpen: boolean
  onClose: () => void
  user: UserProfile
}

export interface GradeDetailModalProps {
  isOpen: boolean
  onClose: () => void
  grade: {
    name: string
    minIncome: number
    maxIncome: number
    color: string
    description: string
  }
  userIncome: number
  userRank: number
  totalUsers: number
}

export interface PrivacyPolicyModalProps {
  isOpen: boolean
  onClose: () => void
}

export interface TermsOfServiceModalProps {
  isOpen: boolean
  onClose: () => void
}

// ============================================================================
// 🌤️ 날씨 및 환경 관련 타입
// ============================================================================

export interface Weather {
  temp: number
  condition: string
}

// ============================================================================
// 📱 앱 상태 관련 타입
// ============================================================================

export interface AppState {
  // 기본 상태들
  currentEmotion: string
  setCurrentEmotion: (emotion: string) => void
  speechText: string
  setSpeechText: (text: string) => void

  showCustomizePanel: boolean
  setShowCustomizePanel: (show: boolean) => void
  showIncomePanel: boolean
  setShowIncomePanel: (show: boolean) => void
  showIncomeInputPanel: boolean
  setShowIncomeInputPanel: (show: boolean) => void
  showHeaderCharacterPanel: boolean
  setShowHeaderCharacterPanel: (show: boolean) => void
  showCharacterItemPanel: boolean
  setShowCharacterItemPanel: (show: boolean) => void
  showVehicleItemPanel: boolean
  setShowVehicleItemPanel: (show: boolean) => void
  showBackgroundItemPanel: boolean
  setShowBackgroundItemPanel: (show: boolean) => void
  currentCharacterItem: string
  setCurrentCharacterItem: (item: string) => void
  currentVehicle: string
  setCurrentVehicle: (vehicle: string) => void
  currentBackground: string
  setCurrentBackground: (background: string) => void
  activeTab: string
  setActiveTab: (tab: string) => void
  incomeCount: string
  setIncomeCount: (count: string) => void
  incomeAmount: string
  setIncomeAmount: (amount: string) => void
  missionAmount: string
  setMissionAmount: (amount: string) => void
  selectedPlatform: string
  setSelectedPlatform: (platform: string) => void
  dailyIncomeData: { [key: string]: DailyIncomeData }
  setDailyIncomeData: (data: { [key: string]: DailyIncomeData }) => void
  incomeRecords: IncomeRecord[]
  setIncomeRecords: (records: IncomeRecord[]) => void
  totalPoints: number
  setTotalPoints: (points: number) => void
  userLevel: number
  setUserLevel: (level: number) => void
  userNickname: string
  setUserNickname: (nickname: string) => void
  userLocation: string
  setUserLocation: (location: string) => void
  currentWeather: Weather
  setCurrentWeather: (weather: Weather) => void
  todayVisitors: number
  setTodayVisitors: (visitors: number) => void
  totalVisitors: number
  setTotalVisitors: (visitors: number) => void
  isClient: boolean
  setIsClient: (isClient: boolean) => void
  garageIntro: string
  setGarageIntro: (intro: string) => void
  isVerified: boolean
  setIsVerified: (isVerified: boolean) => void
  level: number
  setLevel: (level: number) => void
  isIncomePrivate: boolean
  setIsIncomePrivate: (isPrivate: boolean) => void
  
  // 친구/소셜 관련 상태들
  friends: { id: number; name: string; level: number; totalIncome: number; isOnline: boolean; avatar: string }[]
  setFriends: (friends: { id: number; name: string; level: number; totalIncome: number; isOnline: boolean; avatar: string }[]) => void
  friendRequests: { id: number; name: string; level: number; message: string }[]
  setFriendRequests: (requests: { id: number; name: string; level: number; message: string }[]) => void
  socialFeed: { id: number; userId: number; userName: string; action: string; points: number; timestamp: string }[]
  setSocialFeed: (feed: { id: number; userId: number; userName: string; action: string; points: number; timestamp: string }[]) => void
  
  // 계산된 값들과 함수들
  getTotalIncomeByPlatform: (platform: string) => number
  totalIncome: number
  getWeatherIcon: (condition: string) => string
  addPoints: (amount: number, reason?: string) => void
  usePoints: (amount: number, item?: string) => boolean
  canAfford: (price: number) => boolean

  // 플랫폼 설정 상태
  platforms: Platform[]
  setPlatforms: (platforms: Platform[]) => void
  togglePlatform: (platformId: string) => void
  addCustomPlatform: (name: string) => void
  removeCustomPlatform: (platformId: string) => void
  
  // 목표 설정 상태
  dailyGoal: number
  weeklyGoal: number
  monthlyGoal: number
  updateGoals: (daily: number, weekly: number, monthly: number) => void
}

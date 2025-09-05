// ============================================================================
// 🏗️ 배달킹 앱 전체 타입 정의 (정리된 버전)
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
  last_login?: string | null
  is_income_private?: boolean
  platforms?: Platform[]
  goals?: {
    daily: number
    weekly: number
    monthly: number
  }
  total_visitors?: number
  daily_visitors?: number
  status_message?: string
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
  avatar_config?: Record<string, any>
  status_message?: string
}

// ============================================================================
// 💰 수입 관련 타입
// ============================================================================

export interface IncomeRecord {
  id: string
  platform: string
  delivery_count: number
  delivery_amount: number
  mission_amount: number
  total_amount: number
  date: string
  created_at: string
  user_id?: string
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

export interface Friend {
  id: string
  friendId: string
  nickname: string
  region: string
  avatar_config: any
  status: 'pending' | 'accepted' | 'rejected'
  created_at: string
  isRequester: boolean
}

export interface SearchUser {
  id: string
  nickname: string
  region: string
  avatar_config: any
  friendStatus: 'none' | 'pending_sent' | 'pending_received' | 'accepted'
  memberSince: string
}

// ============================================================================
// 🛍️ 통합 상점 시스템 타입
// ============================================================================

export interface ShopItem {
  id: string
  name: string
  description: string
  main_category: 'character' | 'garage'
  sub_category: string
  image_url: string
  price: number
  anchor: { x: number; y: number }
  grid_data: {
    width: number
    height: number
    depth: number
  }
  pixel_data?: any
  is_admin_only: boolean
  is_active: boolean
  created_at: string
  updated_at: string
  created_by?: string
  userQuantity?: number // 사용자 보유 수량
}

export interface UserInventoryItem {
  id: string
  userId: string
  itemId: string
  quantity: number
  purchasedAt: string
  item?: ShopItem
}

export interface PlacedItem {
  id: string
  userId: string
  itemId: string
  position_x: number
  position_y: number
  position_z: number
  placed_at: string
  updated_at: string
  item?: ShopItem
  // 편의를 위한 추가 속성
  gridPosition?: Position3D
}

// ============================================================================
// 🎨 캐릭터 시스템 타입
// ============================================================================

export interface CharacterParts {
  hair: string
  top: string
  bottom: string
  emotion: string
}

export interface CharacterData {
  id?: string
  userId: string
  parts: CharacterParts
  position: { x: number; y: number }
  isVisible?: boolean
  imageUrl?: string
  equippedItems?: Array<{
    id: string
    quantity: number
    purchased_at: string
    item: {
      id: string
      name: string
      description: string
      main_category: string
      sub_category: string
      image_url: string
      price: number
    }
  }>
  created_at?: string
  updated_at?: string
}

// ============================================================================
// 🏠 차고 및 꾸미기 시스템 타입
// ============================================================================

export interface FloorTileConfig {
  type: 'default' | 'custom'
  imageUrl?: string
  pattern: 'checkerboard' | 'solid' | 'custom'
  lightColor?: number
  darkColor?: number
  opacity?: number
  scale?: number
}

export interface GridConfig {
  rows: number
  cols: number
  tileWidth: number
  tileHeight: number
  maxHeight: number
  floorTile?: FloorTileConfig
}

// ============================================================================
// 🏠 방명록 및 미니홈피 관련 타입
// ============================================================================

export interface GuestbookMessage {
  id: string
  message: string
  is_private: boolean
  created_at: string
  visitor: {
    id: string
    nickname: string
    avatar_config: any
  }
}

export interface Visit {
  id: string
  visitor_id: string
  visited_user_id: string
  created_at: string
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
// 🎨 UI 컴포넌트 타입
// ============================================================================

export interface Emotion {
  id: string
  label: string
  icon: string
  color: string
}

export interface Weather {
  condition: string
  temperature: number
  icon: string
}

// ============================================================================
// 🔌 API 응답 타입
// ============================================================================

export interface ApiResponse<T = any> {
  message?: string
  error?: string
  data?: T
  success?: boolean
}

export interface GuestbookApiResponse extends ApiResponse {
  messages?: GuestbookMessage[]
}

export interface FriendsApiResponse extends ApiResponse {
  friends?: Friend[]
}

export interface UsersSearchApiResponse extends ApiResponse {
  users?: SearchUser[]
  total?: number
}

export interface EarningsApiResponse extends ApiResponse {
  earnings?: IncomeRecord[]
  earning?: IncomeRecord
  boxesAwarded?: number
}

export interface VisitsApiResponse extends ApiResponse {
  totalVisits?: number
  todayVisits?: number
}

export interface UserProfileApiResponse extends ApiResponse {
  user?: UserProfile
}

// ============================================================================
// 📱 앱 상태 관련 타입
// ============================================================================

export interface AppState {
  // 사용자 정보
  user: User | null
  setUser: (user: User | null) => void
  
  // 모달 관리
  activeModal: string | null
  openModal: (modalName: string) => void
  closeModal: () => void
  
  // 기본 상태들
  currentEmotion: string
  setCurrentEmotion: (emotion: string) => void
  speechText: string
  setSpeechText: (text: string) => void

  // 패널 상태들
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
  
  // 아이템 상태들
  currentCharacterItem: string
  setCurrentCharacterItem: (item: string) => void
  currentVehicle: string
  setCurrentVehicle: (vehicle: string) => void
  currentBackground: string
  setCurrentBackground: (background: string) => void
  
  // 탭 상태
  activeTab: string
  setActiveTab: (tab: string) => void
  
  // 수입 관련 상태들
  incomeCount: string
  setIncomeCount: (count: string) => void
  incomeAmount: string
  setIncomeAmount: (amount: string) => void
  missionAmount: string
  setMissionAmount: (amount: string) => void
  selectedPlatform: string
  setSelectedPlatform: (platform: string) => void
  incomeRecords: IncomeRecord[]
  setIncomeRecords: (records: IncomeRecord[]) => void
  saveIncomeRecord: (record: Partial<IncomeRecord>) => Promise<boolean>
  loadIncomeRecords: () => Promise<void>
  deleteIncomeRecord: (recordId: string) => Promise<boolean>
  
  // 게임 시스템 상태들
  totalBoxes: number
  setTotalBoxes: (boxes: number) => void
  userLevel: number
  setUserLevel: (level: number) => void
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
  
  // 플랫폼 설정 상태
  platforms: Platform[]
  togglePlatform: (platformId: string) => void
  addCustomPlatform: (name: string) => void
  removeCustomPlatform: (platformId: string) => void
  
  // 목표 설정 상태
  dailyGoal: number
  weeklyGoal: number
  monthlyGoal: number
  updateGoals: (goals: { daily: number; weekly: number; monthly: number }) => void
  
  // 친구 관련 상태들
  friendRequests: any[]
  setFriendRequests: (requests: any[]) => void
  
  // 에러 관리
  errorMessage: string
  showErrorModal: boolean
  
  // 상점 관련 상태
  selectedShopItem: ShopItem | null
  setSelectedShopItem: (item: ShopItem | null) => void
}

// ============================================================================
// 🛠️ 유틸리티 타입
// ============================================================================

export type LoadingState = 'idle' | 'loading' | 'success' | 'error'
export type FriendRequestAction = 'accept' | 'reject'
export type EarningSource = 'baemin' | 'coupang' | 'other'
export type FriendshipStatus = 'pending' | 'accepted' | 'rejected'
export type FriendSearchStatus = 'none' | 'pending_sent' | 'pending_received' | 'accepted'
export type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | '2xl'
export type ButtonVariant = 'primary' | 'secondary' | 'success' | 'warning' | 'danger'
export type InputVariant = 'default' | 'success' | 'warning' | 'danger'
export type CardVariant = 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger'
export type DecorationMode = 'view' | 'edit' | 'shop' | 'inventory'

// ============================================================================
// 🎯 모달 관련 타입들
// ============================================================================

export interface IncomeTabProps {
  incomeRecords: IncomeRecord[]
  totalIncome: number
  getTotalIncomeByPlatform: (platform: string) => number
  setShowIncomeInputPanel: (show: boolean) => void
  setShowIncomePanel: (show: boolean) => void
  isVerified?: boolean
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
  onEditRecord?: (record: any) => void
  onDeleteRecord?: (recordId: string) => void
}

export interface RankingTabProps {
  isVerified?: boolean
  allRecords: IncomeRecord[]
  dailyGoal: number
  onShowGradeDetail: (grade: GradeInfo) => void
  onShowTopRankerProfile: (ranker: TopRanker) => void
  onShowRankingDetail?: () => void
  onTopRankersUpdate?: (rankers: any[]) => void
  onShowUserProfile?: (userProfile: any) => void
}

export interface FriendsTabProps {
  currentUserId: string
  setShowFriendDetail: (show: boolean) => void
  setSelectedFriend: (friend: UserProfile) => void
}

export interface ProfileTabProps {
  userNickname: string
  currentEmotion: string
  userLocation: string
  emotions: Emotion[]
  isIncomePrivate: boolean
  setIsIncomePrivate: (isPrivate: boolean) => Promise<void>
  setShowPrivacyPolicy: (show: boolean) => void
  setShowTermsOfService: (show: boolean) => void
  setShowDeleteAccount: (show: boolean) => void
  onLogout: () => void
}

export interface HomeTabProps {
  currentBackground: string
  currentEmotion: string
  speechText: string
  currentVehicle: string
  garageIntro: string
  todayVisitors: number
  currentWeather: { temp: number; condition: string }
  incomeRecords: IncomeRecord[]
  isClient: boolean
  setShowBackgroundItemPanel: (show: boolean) => void
  setShowVehicleItemPanel: (show: boolean) => void
  setShowCharacterItemPanel: (show: boolean) => void
  setShowIncomeInputPanel: (show: boolean) => void
  setActiveTab: (tab: string) => void
}

export interface HeaderProps {
  userNickname: string
  totalBoxes: number
  currentEmotion: string
  emotions: Emotion[]
  onShowHeaderCharacterPanel: () => void
}

export interface BottomNavigationProps {
  activeTab: string
  onTabChange: (tab: string) => void
}

// ============================================================================
// 🎮 게임 시스템 관련 타입
// ============================================================================

export interface CharacterItem {
  id: string
  name: string
  description: string
  category: 'hair' | 'top' | 'bottom' | 'emotion' | 'accessory'
  imageUrl: string
  price: number
  isActive: boolean
  isAdminOnly: boolean
  createdAt?: string
  updatedAt?: string
  userQuantity?: number
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
  
  // Box system
  useBoxes: (amount: number, item: string) => boolean
}

export interface CustomizePanelProps {
  showCustomizePanel: boolean
  setShowCustomizePanel: (show: boolean) => void
  totalBoxes: number
  useBoxes: (amount: number, item: string) => boolean
}

// ============================================================================
// 🎨 UI 컴포넌트 Props 타입들
// ============================================================================

export interface PixelModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  className?: string
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl'
}

export interface PixelButtonProps {
  onClick?: () => void
  children: React.ReactNode
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger'
  size?: 'xs' | 'sm' | 'md' | 'lg'
  disabled?: boolean
  className?: string
  type?: 'button' | 'submit' | 'reset'
}

export interface PixelInputProps {
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void
  placeholder?: string
  type?: 'text' | 'email' | 'password' | 'number'
  multiline?: boolean
  rows?: number
  maxLength?: number
  disabled?: boolean
  className?: string
  variant?: 'default' | 'success' | 'warning' | 'danger'
}

export interface PixelCardProps {
  children: React.ReactNode
  className?: string
  variant?: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger'
  withDots?: boolean
  onClick?: () => void
  hoverable?: boolean
}

// ============================================================================
// 🏠 꾸미기 시스템 관련 타입 (Decoration System)
// ============================================================================

// 기본 좌표 타입
export interface Position2D {
  x: number
  y: number
}

export interface Position3D extends Position2D {
  z: number
}

// 3D 그리드 셀 타입
export interface GridCell3D {
  x: number
  y: number
  z: number
  occupied: boolean
}

// 아이템 관련 타입
export interface ItemAnchor {
  x: number
  y: number
}

export interface DecorationItem {
  id: string
  name: string
  imageUrl: string
  anchor: ItemAnchor
  price?: number
  description?: string
  category?: string
  isAdminOnly?: boolean
  createdAt?: Date
  // ShopItem과의 호환성을 위한 추가 속성들
  main_category?: 'character' | 'garage'
  sub_category?: string
  image_url?: string
  grid_data?: {
    width: number
    height: number
    depth: number
  }
  pixel_data?: any
  is_active?: boolean
  created_at?: string
  updated_at?: string
  created_by?: string
  userQuantity?: number
  gridData?: {
    cells: GridCell3D[]
    width: number
    height: number
    depth: number
    centerX: number
    centerY: number
    totalCells: number
    imageOffsetX?: number
    imageOffsetY?: number
    pixelScale?: number
  }
}

export interface InventoryItem {
  id: string
  itemId: string
  quantity: number
  purchasedAt?: Date
  item?: DecorationItem
}

// 사용자 꾸미기 데이터 타입
export interface UserGarageData {
  userId: string
  placedItems: PlacedItem[]
  floorTileConfig: FloorTileConfig
  lastUpdated?: Date
}

// 편집기 관련 타입
export interface EditorState {
  selectedTool: 'select' | 'place' | 'delete'
  selectedItem: DecorationItem | null
  hoveredGrid: Position3D | null
  previewMode: boolean
}

// 렌더 상태 타입
export interface RenderState {
  currentMode: 'view' | 'edit' | 'shop' | 'inventory'
  selectedItem: DecorationItem | null
  hoveredGrid: Position3D | null
  showGrid: boolean
}

// PixiJS 관련 타입
export interface PixiContainers {
  main: any // PIXI.Container
  grid: any // PIXI.Container
  items: any // PIXI.Container
  character: any // PIXI.Container - 캐릭터 컨테이너
  preview: any // PIXI.Container
  ui: any // PIXI.Container
}

// 이벤트 타입
export interface GridInteractionEvent {
  gridPosition: Position3D
  worldPosition: Position2D
  item?: PlacedItem
}

export interface ItemInteractionEvent {
  item: PlacedItem
  action: 'select' | 'move' | 'delete'
  gridPosition: Position3D
}

// 컴포넌트 Props 타입들
export interface DecorationSpaceProps {
  userId: string
  isOwner: boolean
  className?: string
}

// ============================================================================
// 🎯 모달 관련 상세 타입들
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

export interface GuestbookModalProps {
  isOpen: boolean
  onClose: () => void
  targetUser: UserProfile | null
  currentUserId: string
}

export interface DeleteAccountModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
}

export interface ShopItemDetailModalProps {
  isOpen: boolean
  onClose: () => void
  item: ShopItem
  userMoney: number
  userInventory: UserInventoryItem[]
  placedItems: PlacedItem[]
  onPurchase: (itemId: string, quantity: number) => void
}

export interface CharacterItemInventoryModalProps {
  isOpen: boolean
  onClose: () => void
  userId: string
  onEquipItem: (itemId: string) => void
}

export interface CharacterItemShopModalProps {
  isOpen: boolean
  onClose: () => void
  userId: string
  onPurchaseItem: (itemId: string) => void
}

// ============================================================================
// 🎨 에디터 시스템 타입 (관리자용)
// ============================================================================

export interface StoreItem {
  id: string
  name: string
  category: string
  imageUrl: string
  anchor: { x: number; y: number }
  layer: number
  price: number
  description: string
}

export interface LayerFootprint {
  [key: string]: Array<[number, number]>
}

export interface EditorItemData {
  name: string
  category: string
  imageFile: File | null
  imageUrl: string
  anchor: { x: number; y: number }
  layer: number
  price: number
  description: string
  footprints: LayerFootprint
}

export interface UserInventory {
  userId: string
  items: UserInventoryItem[]
}

export interface UserPlacements {
  userId: string
  placements: PlacedItem[]
}
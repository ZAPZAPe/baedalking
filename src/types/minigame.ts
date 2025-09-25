// 새로운 미니게임 시스템을 위한 타입 정의

// ===========================================
// 🎮 핵심 게임 타입들
// ===========================================

// 3D 위치 좌표
export interface Position3D {
  x: number
  y: number  
  z: number
}

// 2D 크기
export interface Size2D {
  width: number
  height: number
}

// 아이소메트릭 뷰 설정
export interface IsometricConfig {
  tileWidth: number
  tileHeight: number
  gridSize: number
}

// ===========================================
// 🏠 미니차고 시스템
// ===========================================

// 미니차고 데이터
export interface MiniGarage {
  id: string
  ownerId: string
  name: string
  description: string
  size: Size2D
  tiles: GarageTile[]
  furniture: FurnitureItem[]
  character: Character
  vehicle?: Vehicle
  visitors: number
  lastModified: Date
}

// 차고 타일
export interface GarageTile {
  position: Position3D
  tileType: 'floor' | 'wall' | 'decoration'
  spriteId: string
  isWalkable: boolean
  data?: any
}

// 가구 아이템
export interface FurnitureItem {
  id: string
  itemId: string
  position: Position3D
  rotation: number // 0, 90, 180, 270도
  isPlaced: boolean
  purchaseDate: Date
  data?: any
}

// ===========================================
// 🏘️ 마을 시스템
// ===========================================

// 마을 데이터
export interface Town {
  id: string
  name: string
  description: string
  size: Size2D
  tiles: TownTile[]
  buildings: Building[]
  roads: Road[]
  decorations: Decoration[]
  npcs: NPC[]
}

// 마을 타일
export interface TownTile {
  position: Position3D
  tileType: 'grass' | 'dirt' | 'stone' | 'water' | 'sand'
  spriteId: string
  isWalkable: boolean
  biome?: string
}

// 건물
export interface Building {
  id: string
  type: 'shop' | 'house' | 'landmark' | 'facility'
  name: string
  position: Position3D
  size: Size2D
  spriteId: string
  isInteractable: boolean
  shopData?: Shop
}

// 도로 (간단 타입)
export interface Road {
  id: string
  position: Position3D
  length?: number
  direction?: 'horizontal' | 'vertical'
  spriteId: string
}

// 장식물 (간단 타입)
export interface Decoration {
  id: string
  name: string
  position: Position3D
  spriteId: string
  isInteractable?: boolean
}

// 상점 데이터
export interface Shop {
  shopType: 'furniture' | 'tiles' | 'character' | 'vehicle'
  items: ShopItem[]
  keeper: NPC
  isOpen: boolean
  openHours: string
}

// 상점 아이템
export interface ShopItem {
  id: string
  itemId: string
  price: number
  stock: number
  isAvailable: boolean
  discount?: number
}

// ===========================================
// 👤 캐릭터 시스템
// ===========================================

// 플레이어 캐릭터
export interface Character {
  id: string
  ownerId: string
  name: string
  position: Position3D
  direction: Direction
  spriteId: string
  currentAnimation: AnimationState
  customization: CharacterCustomization
  stats: CharacterStats
}

// 이동 방향 - 등각뷰 8방향 (ES, WN 포함)
export type Direction = 'N' | 'NE' | 'E' | 'ES' | 'S' | 'SW' | 'W' | 'WN'

// 애니메이션 상태
export type AnimationState = 'idle' | 'walk' | 'run' | 'interact' | 'sleep'

// 캐릭터 커스터마이징
export interface CharacterCustomization {
  skin: string
  hair: string
  clothing: string
  accessories: string[]
  colors: {
    skin: string
    hair: string
    clothing: string
  }
}

// 캐릭터 스탯
export interface CharacterStats {
  level: number
  experience: number
  happiness: number
  energy: number
  social: number
}

// NPC
export interface NPC {
  id: string
  name: string
  role: string
  position: Position3D
  spriteId: string
  dialogue: DialogueTree
  behavior: NPCBehavior
  schedule: NPCSchedule[]
}

// ===========================================
// 🛍️ 아이템 시스템
// ===========================================

// 기본 아이템
export interface BaseItem {
  id: string
  name: string
  description: string
  category: ItemCategory
  rarity: ItemRarity
  spriteId: string
  price: number
  unlockLevel: number
  tags: string[]
}

// 아이템 카테고리
export type ItemCategory = 'furniture' | 'decoration' | 'floor' | 'wall' | 'vehicle' | 'clothing'

// 아이템 희귀도
export type ItemRarity = 'common' | 'rare' | 'epic' | 'legendary'

// 가구 아이템 상세
export interface FurnitureItemData extends BaseItem {
  category: 'furniture'
  size: Size2D
  height: number
  isWalkable: boolean
  functionality: FurnitureFunctionality[]
  placementRules: PlacementRule[]
}

// 가구 기능
export type FurnitureFunctionality = 'sit' | 'sleep' | 'storage' | 'decoration' | 'work' | 'entertainment'

// 배치 규칙
export interface PlacementRule {
  type: 'near_wall' | 'corner_only' | 'center_only' | 'no_overlap'
  value?: any
}

// ===========================================
// 🚗 운송수단 시스템
// ===========================================

// 운송수단
export interface Vehicle {
  id: string
  itemId: string
  ownerId: string
  name: string
  type: VehicleType
  position: Position3D
  spriteId: string
  stats: VehicleStats
  customization: VehicleCustomization
}

// 운송수단 타입
export type VehicleType = 'bike' | 'scooter' | 'motorcycle' | 'car' | 'truck'

// 운송수단 스탯
export interface VehicleStats {
  speed: number
  efficiency: number
  capacity: number
  durability: number
}

// 운송수단 커스터마이징
export interface VehicleCustomization {
  color: string
  decals: string[]
  accessories: string[]
}

// ===========================================
// 🎨 스프라이트 시스템
// ===========================================

// 스프라이트 데이터
export interface SpriteData {
  id: string
  name: string
  url: string
  size: Size2D
  frames?: SpriteFrame[]
  animations?: SpriteAnimation[]
  isLoaded: boolean
}

// 스프라이트 프레임
export interface SpriteFrame {
  x: number
  y: number
  width: number
  height: number
  duration?: number
}

// 스프라이트 애니메이션
export interface SpriteAnimation {
  name: string
  frames: number[]
  loop: boolean
  speed: number
}

// ===========================================
// 🎯 상호작용 시스템
// ===========================================

// 상호작용 이벤트
export interface InteractionEvent {
  type: InteractionType
  source: string
  target: string
  position: Position3D
  data?: any
  timestamp: Date
}

// 상호작용 타입
export type InteractionType = 
  | 'click_tile'
  | 'click_object' 
  | 'character_move'
  | 'item_place'
  | 'item_remove'
  | 'shop_buy'
  | 'npc_talk'

// 대화 트리
export interface DialogueTree {
  id: string
  nodes: DialogueNode[]
  currentNode: string
}

// 대화 노드
export interface DialogueNode {
  id: string
  text: string
  character: string
  choices?: DialogueChoice[]
  actions?: DialogueAction[]
  nextNode?: string
}

// 대화 선택지
export interface DialogueChoice {
  text: string
  nextNode: string
  condition?: string
}

// 대화 액션
export interface DialogueAction {
  type: 'give_item' | 'take_money' | 'unlock_area' | 'change_flag'
  value: any
}

// ===========================================
// 🤖 NPC 행동 시스템
// ===========================================

// NPC 행동
export interface NPCBehavior {
  type: NPCBehaviorType
  pattern: MovementPattern
  interactionRadius: number
  isActive: boolean
}

// NPC 행동 타입
export type NPCBehaviorType = 'static' | 'patrol' | 'wander' | 'follow_player'

// 이동 패턴
export interface MovementPattern {
  points: Position3D[]
  speed: number
  pauseDuration: number
  loop: boolean
}

// NPC 일정
export interface NPCSchedule {
  time: string // "09:00"
  action: NPCAction
  location: Position3D
  duration: number // 분
}

// NPC 액션
export type NPCAction = 'work' | 'rest' | 'eat' | 'socialize' | 'patrol' | 'sleep'

// ===========================================
// 🔧 관리자 시스템
// ===========================================

// 관리자 도구 데이터
export interface AdminTool {
  id: string
  name: string
  type: AdminToolType
  permissions: AdminPermission[]
}

// 관리자 도구 타입
export type AdminToolType = 'town_editor' | 'item_manager' | 'user_manager' | 'analytics'

// 관리자 권한
export type AdminPermission = 'create' | 'read' | 'update' | 'delete' | 'publish'

// 마을 편집 데이터
export interface TownEditData {
  townId: string
  changes: TownChange[]
  author: string
  timestamp: Date
  isPublished: boolean
}

// 마을 변경사항
export interface TownChange {
  type: 'add' | 'remove' | 'update' | 'move'
  objectType: 'tile' | 'building' | 'road' | 'decoration' | 'npc'
  objectId: string
  oldData?: any
  newData?: any
  position?: Position3D
}

// ===========================================
// 🎮 게임 상태 관리
// ===========================================

// 게임 상태
export interface GameState {
  currentScene: GameScene
  player: Character
  currentGarage?: MiniGarage
  currentTown?: Town
  inventory: InventoryItem[]
  currency: number
  settings: GameSettings
}

// 게임 씬 (미니차고만 사용)
export type GameScene = 'minigarage' | 'admin'

// 인벤토리 아이템
export interface InventoryItem {
  itemId: string
  quantity: number
  isEquipped: boolean
  purchaseDate: Date
}

// 게임 설정
export interface GameSettings {
  soundEnabled: boolean
  musicEnabled: boolean
  fullscreen: boolean
  quality: 'low' | 'medium' | 'high'
  autoSave: boolean
}

// ===========================================
// 🌐 네트워크 관련
// ===========================================

// API 응답 타입
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
  timestamp: Date
}

// 실시간 이벤트
export interface RealtimeEvent {
  type: string
  userId: string
  garageId?: string
  data: any
  timestamp: Date
}

// ===========================================
// 📊 분석 데이터
// ===========================================

// 사용자 활동 로그
export interface UserActivity {
  userId: string
  action: string
  target: string
  position?: Position3D
  duration?: number
  timestamp: Date
  metadata?: any
}

// 게임 통계
export interface GameStatistics {
  totalPlayers: number
  activeGarages: number
  itemsSold: number
  popularItems: string[]
  averageSessionTime: number
  lastUpdated: Date
}

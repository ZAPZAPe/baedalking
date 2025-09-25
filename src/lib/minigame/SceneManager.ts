// 게임 씬 관리자

import * as PIXI from 'pixi.js'
import { IsometricUtils } from './IsometricUtils'
// 씬 관련 타입 정의
export type SceneType = 'garage' | 'village'

export interface SceneTransition {
  from?: SceneType
  to: SceneType
  fadeTime?: number
}

export interface SceneData {
  name: string
  type: SceneType
}

export interface UserCharacterData {
  garageCharacter: {
    characterId: string
    position: { x: number; y: number; z: number }
    customization: { skinId: string; outfitId: string }
  }
  villageCharacter: {
    vehicleId: string
    position: { x: number; y: number; z: number }
    ownedVehicles: string[]
  }
}

export interface UserInventory {
  furnitureItems: string[]
  tileItems: string[]
  characterItems: string[]
  vehicleItems: string[]
  placedFurniture: any[]
  placedTiles: any[]
}

export type ShopType = 'furniture' | 'tile' | 'character' | 'vehicle'
import { BaeminCharacter } from './BaeminCharacter'
import { VehicleCharacter } from './VehicleCharacter'

// VehicleCharacterData 타입 정의 (임시)
export interface VehicleCharacterData {
  position: { x: number; y: number; z: number }
  direction: string
}
import { TilemapData, TilemapLoader } from './TilemapLoader'
// ShopModal은 PIXI.js 게임 내부 UI로 대체됨
import { getItemsByShopName } from './shopItems'

// 타일 ID를 이미지 경로로 매핑하는 함수
function getTileImagePath(tileId: string): string {
  // 타일 ID 파싱 (예: lot_lotSW -> lot 폴더의 lotSW.png)
  const parts = tileId.split('_')
  if (parts.length !== 2) {
    return '/Garage/Tile/01_기본지형/grass.png' // 기본값
  }
  
  const [category, fileName] = parts
  
  // 카테고리별 폴더 매핑
  const categoryFolderMap: Record<string, string> = {
    'basic': '01_기본지형',
    'water': '02_물', 
    'river': '03_강하천',
    'road': '04_도로',
    'crossroad': '05_교차로',
    'terminal': '06_터미널',
    'bridge': '07_다리',
    'hill': '08_언덕',
    'lot': '09_건물부지',
    'beach': '10_해변',
    'tree': '11_나무'
  }
  
  const folderName = categoryFolderMap[category]
  if (!folderName) {
    return '/Garage/Tile/01_기본지형/grass.png' // 기본값
  }
  
  return `/Garage/Tile/${folderName}/${fileName}.png`
}

// 하드코딩된 타일 데이터는 제거됨 - MiniGameEngine이 JSON에서 로드함

export interface SceneConfig {
  name: string
  sceneType: SceneType
  setup: () => Promise<void>
  update?: (deltaTime: number) => void
  cleanup?: () => void
  onEnter?: (fromScene?: SceneType) => void
  onExit?: (toScene?: SceneType) => void
}

export class SceneManager {
  private app: PIXI.Application
  private worldContainer: PIXI.Container
  private fadeOverlay: PIXI.Graphics
  private currentScene: SceneConfig | null = null
  private scenes: Map<SceneType, SceneConfig> = new Map()
  
  // 씬별 컨테이너
  private garageContainer: PIXI.Container
  private villageContainer: PIXI.Container
  
  // 캐릭터 시스템
  private garageCharacter: BaeminCharacter | null = null
  private villageCharacter: VehicleCharacter | null = null
  
  // 사용자 데이터
  private userData: UserCharacterData | null = null
  private tilemapLoader: TilemapLoader
  private currentUserId: string | undefined
  private userInventory: UserInventory | null = null
  // shopModal은 PIXI.js 게임 내부 UI로 대체됨
  private activeVillageMap: any = null
  
  // 아이템 미리보기 시스템
  private itemPreviewSprite: PIXI.Sprite | null = null
  private itemPreviewContainer: PIXI.Container | null = null
  private isPreviewMode = false
  private previewItem: any = null
  private previewGrid: PIXI.Graphics | null = null
  private mousePosition = { x: 0, y: 0 }
  
  private isTransitioning = false
  
  constructor(app: PIXI.Application, worldContainer: PIXI.Container) {
    this.app = app
    this.worldContainer = worldContainer
    
    // 타일맵 로더 초기화
    this.tilemapLoader = new TilemapLoader()
    
    // 씬별 컨테이너 생성
    this.garageContainer = new PIXI.Container()
    this.villageContainer = new PIXI.Container()
    
    this.garageContainer.sortableChildren = true
    this.villageContainer.sortableChildren = true
    
    // 컨테이너 z-index 설정 (타일은 가장 아래)
    this.garageContainer.zIndex = 0
    this.villageContainer.zIndex = 0
    
    // 페이드 오버레이 생성
    this.fadeOverlay = new PIXI.Graphics()
    this.fadeOverlay.fill({ color: 0x000000, alpha: 0 })
    this.fadeOverlay.rect(0, 0, this.app.screen.width, this.app.screen.height)
    this.fadeOverlay.fill()
    this.fadeOverlay.zIndex = 999999
    
    this.setupScenes()
    
    // 기본 차고 씬으로 시작
    this.transitionTo('garage')
    
    // MiniGameEngine에서 userId 주입
    try {
      const miniGameEngine = (this.app.stage as any).miniGameEngine
      this.currentUserId = miniGameEngine?._userId
    } catch {}

    // 상점 모달은 PIXI.js 게임 내부 UI로 대체됨
    
    // 아이템 미리보기 이벤트 리스너 등록
    this.setupItemPreviewEvents()
  }
  
  // 연결 로직 제거 - MiniGameEngine에서 직접 SceneManager 사용
  
  // 씬 설정
  private setupScenes() {
    // Garage 씬
    this.registerScene('garage', {
      name: 'Mini Garage',
      sceneType: 'garage',
      setup: async () => {
        await this.setupGarageScene()
      },
      update: (deltaTime) => {
        if (this.garageCharacter) {
          this.garageCharacter.update(deltaTime)
        }
      },
      cleanup: () => {
        this.cleanupGarageScene()
      }
    })
    
    // Village 씬 제거됨 - 미니차고만 사용
  }
  
  // 씬 등록
  private registerScene(sceneType: SceneType, config: SceneConfig) {
    this.scenes.set(sceneType, config)
  }
  
  // Garage 씬 설정 (간소화 - MiniGameEngine에 위임)
  private async setupGarageScene() {
    
    // MiniGameEngine에서 모든 그리드 및 타일 처리를 담당하므로
    // SceneManager는 더 이상 직접 렌더링하지 않음
    
  }
  
  // Village 씬 제거됨 - 미니차고만 사용
  
  // 하드코딩된 차고 지도 데이터 로드 및 렌더링 (JSON 내용을 코드로 포함)
  private async loadAndRenderGarageMap() {
    
    // JSON 파일 내용을 즉시 사용 (fetch 없이)
    const garageData = {
      name: 'Garage_Tile',
      layers: [
        {
          name: '타일',
          tiles: []  // 임시로 빈 배열로 설정
        }
      ],
      metadata: { gridSize: 11, tileSize: 100, version: '1.0' }
    }
    
    
    // 차고 지도 렌더링
    this.renderGarageMap(garageData)
  }
  
  // 차고 지도 렌더링
  private renderGarageMap(garageData: any) {
    
    // 기존 차고 컨테이너 내용 제거
    this.garageContainer.removeChildren()
    
    // 차고 배경 렌더링
    this.renderGarageBackground(this.garageContainer, garageData)
    
  }
  
  // 차고 배경 렌더링
  private async renderGarageBackground(container: PIXI.Container, garageData: any) {
    
    const VOXEL_SIZE = 100
    const layers = garageData.layers || []
    
    for (const layer of layers) {
      const tiles = layer.tiles || []
      
      for (const tile of tiles) {
        const { x, y, z = 0, tileId } = tile
        const layerHeight = z * 25
        
        // 아이소메트릭 좌표 변환 (차고 타일맵은 이미 그리드 좌표이므로 VOXEL_SIZE 곱하지 않음)
        const coords = this.toIsoCoords(x, y)
        
        try {
          // 새로운 타일 ID를 이미지 경로로 매핑
          const imagePath = getTileImagePath(tileId || 'lot_lotN')
          
          // PIXI Assets로 텍스처 로드
          const texture = await PIXI.Assets.load(imagePath)
          const sprite = new PIXI.Sprite(texture)
          
          // 타일 스프라이트 설정 (tilemap-editor와 동일하게)
          sprite.anchor.set(0.5, 1.0) // x: 중앙, y: 하단
          sprite.x = coords.x
          sprite.y = coords.y + (VOXEL_SIZE / 8) + 37.5 - 12.5 - layerHeight // tilemap-editor와 동일한 위치 조정
          // 타일 레이어 (0-999): ISO뷰 z-ordering
          sprite.zIndex = y * 10 + x
          
          // 타일 크기 조정 (100px 폭으로 맞춤)
          const targetWidth = 100
          const scale = targetWidth / sprite.width
          sprite.scale.set(scale)
          
          container.addChild(sprite)
          
        } catch (error) {
          
          // 플레이스홀더 그래픽 생성
          const placeholder = new PIXI.Graphics()
          placeholder.fill({ color: 0x90EE90, alpha: 0.8 }) // 연두색
          placeholder.rect(-50, -25, 100, 50)
          placeholder.fill()
          placeholder.x = coords.x
          placeholder.y = coords.y - layerHeight
          placeholder.zIndex = z * 100 + y * 10
          
          container.addChild(placeholder)
        }
      }
    }
    
    // z-index 정렬 활성화 (tilemap-editor와 동일)
    container.sortableChildren = true
    
  }
  
  // 활성화된 마을 지도 로드 (하드코딩된 데이터 즉시 사용)
  private async loadActiveVillageMap() {
    
    // JSON 파일의 데이터를 하드코딩 (로딩 시간 제거)
    this.activeVillageMap = {
      "name": "새 마을",
      "layers": [
        {
          "layer": 0,
          "name": "타일",
          "items": [
            { "x": -4, "y": 4, "itemId": "villageTile_059", "itemType": "tile" },
            { "x": -5, "y": 4, "itemId": "villageTile_059", "itemType": "tile" },
            { "x": -5, "y": 5, "itemId": "villageTile_059", "itemType": "tile" },
            { "x": -4, "y": 5, "itemId": "villageTile_059", "itemType": "tile" },
            { "x": 5, "y": 5, "itemId": "villageTile_059", "itemType": "tile" },
            { "x": 4, "y": 5, "itemId": "villageTile_059", "itemType": "tile" },
            { "x": 4, "y": 4, "itemId": "villageTile_059", "itemType": "tile" },
            { "x": 5, "y": 4, "itemId": "villageTile_059", "itemType": "tile" },
            { "x": 5, "y": -5, "itemId": "villageTile_059", "itemType": "tile" },
            { "x": 4, "y": -5, "itemId": "villageTile_059", "itemType": "tile" },
            { "x": 4, "y": -4, "itemId": "villageTile_059", "itemType": "tile" },
            { "x": 5, "y": -4, "itemId": "villageTile_059", "itemType": "tile" },
            { "x": -4, "y": -5, "itemId": "villageTile_059", "itemType": "tile" },
            { "x": -5, "y": -5, "itemId": "villageTile_059", "itemType": "tile" },
            { "x": -5, "y": -4, "itemId": "villageTile_059", "itemType": "tile" },
            { "x": -4, "y": -4, "itemId": "villageTile_059", "itemType": "tile" },
            { "x": -1, "y": 1, "itemId": "villageTile_059", "itemType": "tile" },
            { "x": 0, "y": 1, "itemId": "villageTile_059", "itemType": "tile" },
            { "x": 0, "y": 0, "itemId": "villageTile_059", "itemType": "tile" },
            { "x": 0, "y": -1, "itemId": "villageTile_059", "itemType": "tile" },
            { "x": -1, "y": 0, "itemId": "villageTile_059", "itemType": "tile" },
            { "x": -1, "y": -1, "itemId": "villageTile_059", "itemType": "tile" },
            { "x": 1, "y": 1, "itemId": "villageTile_059", "itemType": "tile" },
            { "x": 1, "y": 0, "itemId": "villageTile_059", "itemType": "tile" },
            { "x": 1, "y": -1, "itemId": "villageTile_059", "itemType": "tile" },
            { "x": -2, "y": 1, "itemId": "villageTile_067", "itemType": "tile" },
            { "x": -2, "y": 0, "itemId": "villageTile_067", "itemType": "tile" },
            { "x": -2, "y": -1, "itemId": "villageTile_067", "itemType": "tile" },
            { "x": -2, "y": -2, "itemId": "villageTile_067", "itemType": "tile" },
            { "x": -1, "y": -2, "itemId": "villageTile_067", "itemType": "tile" },
            { "x": 0, "y": -2, "itemId": "villageTile_067", "itemType": "tile" },
            { "x": 1, "y": -2, "itemId": "villageTile_067", "itemType": "tile" },
            { "x": 2, "y": -2, "itemId": "villageTile_067", "itemType": "tile" },
            { "x": 2, "y": -1, "itemId": "villageTile_067", "itemType": "tile" },
            { "x": 2, "y": 0, "itemId": "villageTile_067", "itemType": "tile" },
            { "x": 2, "y": 1, "itemId": "villageTile_067", "itemType": "tile" },
            { "x": 2, "y": 2, "itemId": "villageTile_067", "itemType": "tile" },
            { "x": 1, "y": 2, "itemId": "villageTile_067", "itemType": "tile" },
            { "x": 0, "y": 2, "itemId": "villageTile_111", "itemType": "tile" },
            { "x": -1, "y": 2, "itemId": "villageTile_067", "itemType": "tile" },
            { "x": 0, "y": 3, "itemId": "villageTile_104", "itemType": "tile" },
            { "x": 1, "y": 3, "itemId": "villageTile_107", "itemType": "tile" },
            { "x": 2, "y": 3, "itemId": "villageTile_107", "itemType": "tile" },
            { "x": 4, "y": 3, "itemId": "villageTile_107", "itemType": "tile" },
            { "x": 5, "y": 3, "itemId": "villageTile_107", "itemType": "tile" },
            { "x": -1, "y": 3, "itemId": "villageTile_107", "itemType": "tile" },
            { "x": -2, "y": 3, "itemId": "villageTile_107", "itemType": "tile" },
            { "x": -4, "y": 3, "itemId": "villageTile_107", "itemType": "tile" },
            { "x": -5, "y": 3, "itemId": "villageTile_107", "itemType": "tile" },
            { "x": -5, "y": -3, "itemId": "villageTile_107", "itemType": "tile" },
            { "x": -2, "y": -3, "itemId": "villageTile_107", "itemType": "tile" },
            { "x": -1, "y": -3, "itemId": "villageTile_107", "itemType": "tile" },
            { "x": 0, "y": -3, "itemId": "villageTile_107", "itemType": "tile" },
            { "x": 1, "y": -3, "itemId": "villageTile_107", "itemType": "tile" },
            { "x": 2, "y": -3, "itemId": "villageTile_107", "itemType": "tile" },
            { "x": 4, "y": -3, "itemId": "villageTile_107", "itemType": "tile" },
            { "x": 5, "y": -3, "itemId": "villageTile_107", "itemType": "tile" },
            { "x": -3, "y": 5, "itemId": "villageTile_113", "itemType": "tile" },
            { "x": -3, "y": 4, "itemId": "villageTile_113", "itemType": "tile" },
            { "x": -3, "y": 2, "itemId": "villageTile_113", "itemType": "tile" },
            { "x": -3, "y": 1, "itemId": "villageTile_113", "itemType": "tile" },
            { "x": -3, "y": 0, "itemId": "villageTile_113", "itemType": "tile" },
            { "x": -3, "y": -1, "itemId": "villageTile_113", "itemType": "tile" },
            { "x": -3, "y": -2, "itemId": "villageTile_113", "itemType": "tile" },
            { "x": -3, "y": -4, "itemId": "villageTile_113", "itemType": "tile" },
            { "x": -3, "y": -5, "itemId": "villageTile_113", "itemType": "tile" },
            { "x": 3, "y": -5, "itemId": "villageTile_113", "itemType": "tile" },
            { "x": 3, "y": -4, "itemId": "villageTile_113", "itemType": "tile" },
            { "x": 3, "y": -2, "itemId": "villageTile_113", "itemType": "tile" },
            { "x": 3, "y": -1, "itemId": "villageTile_113", "itemType": "tile" },
            { "x": 3, "y": 0, "itemId": "villageTile_113", "itemType": "tile" },
            { "x": 3, "y": 1, "itemId": "villageTile_113", "itemType": "tile" },
            { "x": 3, "y": 4, "itemId": "villageTile_113", "itemType": "tile" },
            { "x": 3, "y": 5, "itemId": "villageTile_113", "itemType": "tile" },
            { "x": -3, "y": 3, "itemId": "villageTile_090", "itemType": "tile" },
            { "x": 3, "y": 3, "itemId": "villageTile_090", "itemType": "tile" },
            { "x": 3, "y": -3, "itemId": "villageTile_090", "itemType": "tile" },
            { "x": -3, "y": -3, "itemId": "villageTile_090", "itemType": "tile" },
            { "x": -4, "y": -3, "itemId": "villageTile_107", "itemType": "tile" },
            { "x": 3, "y": 2, "itemId": "villageTile_113", "itemType": "tile" },
            { "x": -4, "y": -2, "itemId": "villageTile_075", "itemType": "tile" },
            { "x": -4, "y": -1, "itemId": "villageTile_075", "itemType": "tile" },
            { "x": -5, "y": -2, "itemId": "villageTile_075", "itemType": "tile" },
            { "x": -5, "y": -1, "itemId": "villageTile_075", "itemType": "tile" },
            { "x": -5, "y": 0, "itemId": "villageTile_075", "itemType": "tile" },
            { "x": -5, "y": 1, "itemId": "villageTile_075", "itemType": "tile" },
            { "x": -5, "y": 2, "itemId": "villageTile_075", "itemType": "tile" },
            { "x": -4, "y": 2, "itemId": "villageTile_075", "itemType": "tile" },
            { "x": -4, "y": 1, "itemId": "villageTile_075", "itemType": "tile" },
            { "x": -4, "y": 0, "itemId": "villageTile_075", "itemType": "tile" },
            { "x": -2, "y": 4, "itemId": "villageTile_075", "itemType": "tile" },
            { "x": -2, "y": 5, "itemId": "villageTile_075", "itemType": "tile" },
            { "x": -1, "y": 5, "itemId": "villageTile_075", "itemType": "tile" },
            { "x": -1, "y": 4, "itemId": "villageTile_075", "itemType": "tile" },
            { "x": 0, "y": 4, "itemId": "villageTile_075", "itemType": "tile" },
            { "x": 0, "y": 5, "itemId": "villageTile_075", "itemType": "tile" },
            { "x": 1, "y": 5, "itemId": "villageTile_075", "itemType": "tile" },
            { "x": 1, "y": 4, "itemId": "villageTile_075", "itemType": "tile" },
            { "x": 2, "y": 4, "itemId": "villageTile_075", "itemType": "tile" },
            { "x": 2, "y": 5, "itemId": "villageTile_075", "itemType": "tile" },
            { "x": 4, "y": 2, "itemId": "villageTile_075", "itemType": "tile" },
            { "x": 4, "y": 1, "itemId": "villageTile_075", "itemType": "tile" },
            { "x": 5, "y": 1, "itemId": "villageTile_075", "itemType": "tile" },
            { "x": 5, "y": 2, "itemId": "villageTile_075", "itemType": "tile" },
            { "x": 5, "y": 0, "itemId": "villageTile_075", "itemType": "tile" },
            { "x": 4, "y": 0, "itemId": "villageTile_075", "itemType": "tile" },
            { "x": 4, "y": -1, "itemId": "villageTile_075", "itemType": "tile" },
            { "x": 5, "y": -1, "itemId": "villageTile_075", "itemType": "tile" },
            { "x": 5, "y": -2, "itemId": "villageTile_075", "itemType": "tile" },
            { "x": 4, "y": -2, "itemId": "villageTile_075", "itemType": "tile" },
            { "x": 2, "y": -5, "itemId": "villageTile_075", "itemType": "tile" },
            { "x": 2, "y": -4, "itemId": "villageTile_075", "itemType": "tile" },
            { "x": 1, "y": -4, "itemId": "villageTile_075", "itemType": "tile" },
            { "x": 1, "y": -5, "itemId": "villageTile_075", "itemType": "tile" },
            { "x": 0, "y": -5, "itemId": "villageTile_075", "itemType": "tile" },
            { "x": -1, "y": -5, "itemId": "villageTile_075", "itemType": "tile" },
            { "x": -2, "y": -5, "itemId": "villageTile_075", "itemType": "tile" },
            { "x": -2, "y": -4, "itemId": "villageTile_075", "itemType": "tile" },
            { "x": -1, "y": -4, "itemId": "villageTile_075", "itemType": "tile" },
            { "x": 0, "y": -4, "itemId": "villageTile_075", "itemType": "tile" }
          ]
        },
        {
          "layer": 1,
          "name": "1층",
          "items": [
            { "x": -1, "y": 1, "itemId": "building_concrete_097", "itemType": "building" },
            { "x": 0, "y": 1, "itemId": "building_concrete_097", "itemType": "building" },
            { "x": 1, "y": 1, "itemId": "building_concrete_097", "itemType": "building" },
            { "x": 1, "y": 0, "itemId": "building_concrete_097", "itemType": "building" },
            { "x": 0, "y": 0, "itemId": "building_concrete_097", "itemType": "building" },
            { "x": -1, "y": 0, "itemId": "building_concrete_097", "itemType": "building" },
            { "x": 1, "y": -1, "itemId": "building_concrete_097", "itemType": "building" },
            { "x": 0, "y": -1, "itemId": "building_concrete_097", "itemType": "building" },
            { "x": -1, "y": -1, "itemId": "building_concrete_097", "itemType": "building" },
            { "x": 5, "y": 5, "itemId": "building_stone_097", "itemType": "building" },
            { "x": 4, "y": 5, "itemId": "building_stone_097", "itemType": "building" },
            { "x": 4, "y": 4, "itemId": "building_stone_097", "itemType": "building" },
            { "x": 5, "y": 4, "itemId": "building_stone_097", "itemType": "building" },
            { "x": -5, "y": 5, "itemId": "building_wood_096", "itemType": "building" },
            { "x": -4, "y": 5, "itemId": "building_wood_096", "itemType": "building" },
            { "x": -4, "y": 4, "itemId": "building_wood_096", "itemType": "building" },
            { "x": -5, "y": 4, "itemId": "building_wood_096", "itemType": "building" },
            { "x": 5, "y": -5, "itemId": "building_sand_105", "itemType": "building" },
            { "x": 4, "y": -5, "itemId": "building_sand_105", "itemType": "building" },
            { "x": 4, "y": -4, "itemId": "building_sand_105", "itemType": "building" },
            { "x": 5, "y": -4, "itemId": "building_sand_105", "itemType": "building" },
            { "x": -5, "y": -4, "itemId": "building_concrete_111", "itemType": "building" },
            { "x": -4, "y": -4, "itemId": "building_concrete_111", "itemType": "building" },
            { "x": -5, "y": -5, "itemId": "building_concrete_111", "itemType": "building" },
            { "x": -4, "y": -5, "itemId": "building_concrete_111", "itemType": "building" }
          ]
        },
        {
          "layer": 2,
          "name": "2층",
          "items": [
            { "x": -5, "y": 5, "itemId": "building_concrete_068", "itemType": "building" },
            { "x": -5, "y": 4, "itemId": "building_concrete_068", "itemType": "building" },
            { "x": -4, "y": 4, "itemId": "building_concrete_068", "itemType": "building" },
            { "x": -4, "y": 5, "itemId": "building_concrete_068", "itemType": "building" },
            { "x": -1, "y": 1, "itemId": "building_concrete_091", "itemType": "building" },
            { "x": -1, "y": 0, "itemId": "building_concrete_091", "itemType": "building" },
            { "x": -1, "y": -1, "itemId": "building_concrete_091", "itemType": "building" },
            { "x": 0, "y": -1, "itemId": "building_concrete_091", "itemType": "building" },
            { "x": 1, "y": -1, "itemId": "building_concrete_091", "itemType": "building" },
            { "x": 0, "y": 0, "itemId": "building_concrete_091", "itemType": "building" },
            { "x": 1, "y": 0, "itemId": "building_concrete_091", "itemType": "building" },
            { "x": 1, "y": 1, "itemId": "building_concrete_091", "itemType": "building" },
            { "x": 0, "y": 1, "itemId": "building_concrete_091", "itemType": "building" },
            { "x": 4, "y": -4, "itemId": "building_stone_022", "itemType": "building" },
            { "x": 4, "y": -5, "itemId": "building_stone_022", "itemType": "building" },
            { "x": 5, "y": -5, "itemId": "building_stone_022", "itemType": "building" },
            { "x": 5, "y": -4, "itemId": "building_stone_022", "itemType": "building" },
            { "x": 5, "y": 5, "itemId": "building_stone_068", "itemType": "building" },
            { "x": 4, "y": 5, "itemId": "building_stone_068", "itemType": "building" },
            { "x": 4, "y": 4, "itemId": "building_stone_068", "itemType": "building" },
            { "x": 5, "y": 4, "itemId": "building_stone_068", "itemType": "building" },
            { "x": -5, "y": -5, "itemId": "building_wood_044", "itemType": "building" },
            { "x": -5, "y": -4, "itemId": "building_wood_044", "itemType": "building" },
            { "x": -4, "y": -4, "itemId": "building_wood_044", "itemType": "building" },
            { "x": -4, "y": -5, "itemId": "building_wood_044", "itemType": "building" }
          ]
        },
        { "layer": 3, "name": "3층", "items": [] },
        { "layer": 4, "name": "4층", "items": [] }
      ],
      "metadata": {
        "gridSize": 15,
        "tileSize": 100,
        "version": "1.0"
      }
    }
    
  }
  
  // 사용자 타일맵을 마을 형식으로 변환
  private convertTilemapToVillageFormat(tilemap: TilemapData): any {
    const villageMap = {
      name: tilemap.name || '사용자 마을',
      layers: [
        {
          layer: 0,
          name: '타일',
          items: [] as any[]
        },
        {
          layer: 1,
          name: '1층',
          items: [] as any[]
        },
        {
          layer: 2,
          name: '2층',
          items: [] as any[]
        },
        {
          layer: 3,
          name: '3층',
          items: [] as any[]
        },
        {
          layer: 4,
          name: '4층',
          items: [] as any[]
        }
      ],
      metadata: {
        gridSize: 15,
        tileSize: 100,
        version: '1.0'
      }
    }
    
    // 타일맵의 타일들을 마을 형식으로 변환
    for (const tile of tilemap.tiles) {
      // 타일 ID를 마을 형식으로 변환
      let itemId = tile.tileId || 'villageTile_000'
      let itemType = 'tile'
      
      // landscapeTile_xxx 형식을 villageTile_xxx로 변환
      if (tile.tileId && tile.tileId.startsWith('landscapeTile_')) {
        itemId = tile.tileId.replace('landscapeTile_', 'villageTile_')
        itemType = 'tile'
      }
      
      villageMap.layers[0].items.push({
        x: tile.x,
        y: tile.y,
        itemId: itemId,
        itemType: itemType
      })
    }
    
    
    return villageMap
  }
  
  // 마을 지도 렌더링 (새로운 디자인)
  private async renderVillageMap(tileContainer: PIXI.Container) {
    if (!tileContainer) return
    
    // 기존 타일들은 이미 setupVillageScene에서 정리됨
    
    const backgroundContainer = new PIXI.Container()
    const portalContainer = new PIXI.Container()
    
    backgroundContainer.sortableChildren = true
    portalContainer.sortableChildren = true
    
    // 배경 렌더링 (하드코딩된 데이터 기반)
    if (this.activeVillageMap) {
      await this.renderVillageBackground(backgroundContainer)
    }
    
    // 기존 원형 상점 포탈은 숨김 - 그리드 포탈로 대체됨
    // this.createShopPortals(portalContainer)
    
    tileContainer.addChild(backgroundContainer)
    tileContainer.addChild(portalContainer)
  }
  
  // 마을 배경 렌더링
  private async renderVillageBackground(container: PIXI.Container) {
    if (!this.activeVillageMap) {
      return
    }
    
    
    // 레이어별 아이템 렌더링
    for (const layer of this.activeVillageMap.layers) {
      for (const item of layer.items) {
        const coords = this.toIsoCoords(item.x, item.y)
        
          // 아이템 이미지 경로 결정
          let imagePath = ''
        
        try {
          if (item.itemType === 'tile') {
            const tileNumber = item.itemId.replace('villageTile_', '')
            imagePath = `/Garage/Tile/01_기본지형/grass.png` // village 경로 대신 기본 타일 사용
          } else if (item.itemType === 'building') {
            // 건물 이미지 경로 결정
            if (item.itemId.startsWith('building_awning_')) {
              const awningNumber = item.itemId.replace('building_awning_', '')
              imagePath = `/Garage/Tile/Building/Awnings/awning${awningNumber}.png`
            } else if (item.itemId.startsWith('building_sand_')) {
              const sandNumber = item.itemId.replace('building_sand_', '')
              imagePath = `/Garage/Tile/Building/Sand buildings/sand${sandNumber}.png`
            } else if (item.itemId.startsWith('building_concrete_')) {
              const concreteNumber = item.itemId.replace('building_concrete_', '')
              imagePath = `/Garage/Tile/Building/Concrete buildings/concrete${concreteNumber}.png`
            } else if (item.itemId.startsWith('building_stone_')) {
              const stoneNumber = item.itemId.replace('building_stone_', '')
              imagePath = `/Garage/Tile/Building/Stone buildings/stone${stoneNumber}.png`
            } else if (item.itemId.startsWith('building_wood_')) {
              const woodNumber = item.itemId.replace('building_wood_', '')
              imagePath = `/Garage/Tile/Building/Wood buildings/wood${woodNumber}.png`
            } else {
              // 기본 건물 이미지
            imagePath = `/Garage/Tile/Building/Concrete buildings/concrete000.png`
            }
          }
          
          if (imagePath) {
            const texture = await PIXI.Assets.load(imagePath)
            const sprite = new PIXI.Sprite(texture)
            
            // 타일 크기에 맞춰 스케일 조정 (100px 가로폭 기준)
            const targetWidth = 100
            const scaleX = targetWidth / texture.width
            const scaleY = scaleX  // 비율 유지를 위해 동일한 스케일 사용
            sprite.scale.set(scaleX, scaleY)
            
            // 앵커 포인트 설정
            if (item.itemType === 'building') {
              // 건물은 하단 중앙을 기준으로 배치 (그리드에 맞춤)
            sprite.anchor.set(0.5, 1.0)
            } else {
              // 타일은 중앙을 기준으로 배치
              sprite.anchor.set(0.5, 0.5)
            }
            
            sprite.x = coords.x
            
            // 🎯 마을 타일 클릭 이벤트 추가 (선택 가능하게!)
            sprite.eventMode = 'static'
            sprite.cursor = 'pointer'
            
            // 마을 타일 클릭 이벤트
            sprite.on('pointerdown', (event) => {
              event.stopPropagation()
              
              // MiniGameEngine의 타일 클릭 처리 호출
              const miniGameEngine = this.getMiniGameEngine()
              if (miniGameEngine) {
                miniGameEngine.selectTile(item.x, item.y)
                // 마을 캐릭터를 해당 위치로 이동
                if (this.villageCharacter) {
                  this.villageCharacter.moveTo(item.x, item.y)
                }
              }
            })
            
            // 마우스 호버 효과 추가
            sprite.on('pointerover', () => {
              sprite.tint = 0xaaaaaa // 약간 어둡게
            })
            
            sprite.on('pointerout', () => {
              sprite.tint = 0xffffff // 원래 색으로 복원
            })
            
            // 레이어 높이 계산 (마을 에디터와 동일)
            const layerHeight = layer.layer * 50  // 각 레이어마다 50px씩 높이 증가
            
            // 건물과 타일의 위치 차이 조정 (마을 에디터와 완전 동일하게!)
            if (item.itemType === 'building') {
              // 건물은 그리드 하단에서 75px 아래에 배치
              sprite.y = coords.y + 50 - layerHeight + 75  // 🎯 마을 에디터와 동일: +50 오프셋
            } else {
              // 타일은 마을 에디터와 동일하게 +50px 오프셋 적용
              sprite.y = coords.y + 50 - layerHeight  // 🎯 마을 에디터와 동일: +50 오프셋
            }
            
            // 타일 레이어 z-index (0-999 범위): 레이어와 y 좌표 고려
            sprite.zIndex = layer.layer * 100 + item.y * 10 + item.x
            
            container.addChild(sprite)
          }
        } catch (error) {
          // 텍스처 로드 실패 시 색상 사각형으로 대체
          const fallback = new PIXI.Graphics()
          fallback.fill({ 
            color: item.itemType === 'tile' ? 0x2ecc71 : 0x8e44ad, 
            alpha: 0.6 
          })
          
          const hw = 50
          const hh = 25
          
          fallback.moveTo(0, -hh)
          fallback.lineTo(hw, 0)
          fallback.lineTo(0, hh)
          fallback.lineTo(-hw, 0)
          fallback.lineTo(0, -hh)
          
          fallback.fill()
          fallback.x = coords.x
          
          // 레이어 높이 계산 (마을 에디터와 동일)
          const layerHeight = layer.layer * 50
          
          // 건물과 타일의 위치 차이 조정 (마을 에디터와 동일)
          if (item.itemType === 'building') {
            fallback.y = coords.y - layerHeight + 75
          } else {
            fallback.y = coords.y - layerHeight
          }
          
          fallback.zIndex = layer.layer * 100 + item.y * 10 + item.x
          
          container.addChild(fallback)
        }
      }
    }
  }
  
  
  // 상점 포탈 생성
  private createShopPortals(container: PIXI.Container) {
    const shopPortals = [
      { x: 5, y: 3, name: '타일상점', icon: '🏪', color: 0x3498db },
      { x: 5, y: -3, name: '캐릭터상점', icon: '👤', color: 0xe74c3c },
      { x: -5, y: 3, name: '인벤토리상점', icon: '🎒', color: 0x2ecc71 },
      { x: -5, y: -3, name: '운송수단상점', icon: '🚗', color: 0xf39c12 },
      { x: 0, y: 2, name: '미니차고', icon: '🏠', color: 0x9b59b6, isGarage: true }
    ]
    
    shopPortals.forEach(portal => {
      const coords = this.toIsoCoords(portal.x, portal.y)
      
      // 포탈 배경 (반투명 원형)
      const portalBg = new PIXI.Graphics()
      portalBg.fill({ color: portal.color, alpha: 0.3 })
      portalBg.setStrokeStyle({ color: portal.color, width: 3, alpha: 0.8 })
      portalBg.circle(0, 0, 40)
      portalBg.fill().stroke()
      
      portalBg.x = coords.x
      portalBg.y = coords.y
      portalBg.zIndex = 3000 // UI/오버레이 레이어
      
      // 포탈 아이콘
      const iconText = new PIXI.Text({
        text: portal.icon,
        style: {
          fontSize: 48,
          fill: 'white',
          stroke: { color: 'black', width: 2 }
        }
      })
      iconText.anchor.set(0.5, 0.5)
      iconText.x = coords.x
      iconText.y = coords.y - 5
      iconText.zIndex = 3001
      
      // 포탈 이름
      const nameText = new PIXI.Text({
        text: portal.name,
        style: {
          fontSize: 16,
          fill: 'white',
          stroke: { color: 'black', width: 1 }
        }
      })
      nameText.anchor.set(0.5, 0.5)
      nameText.x = coords.x
      nameText.y = coords.y + 50
      nameText.zIndex = 3001
      
      // 상호작용 설정
      portalBg.eventMode = 'static'
      portalBg.cursor = 'pointer'
      
      // 클릭 이벤트
      portalBg.on('pointerdown', () => {
        if (portal.isGarage) {
          this.transitionToGarage()
        } else {
          // 상점은 PIXI.js 게임 내부 UI로 처리됨
          console.log(`${portal.name} 상점 열기 (게임 내부 UI로 처리)`)
        }
      })
      
      // 호버 효과
      portalBg.on('pointerover', () => {
        portalBg.alpha = 0.8
        iconText.scale.set(1.1)
      })
      
      portalBg.on('pointerout', () => {
        portalBg.alpha = 0.3
        iconText.scale.set(1.0)
      })
      
      container.addChild(portalBg)
      container.addChild(iconText)
      container.addChild(nameText)
    })
  }
  
  // 상점 모달 관련 메서드들은 PIXI.js 게임 내부 UI로 대체됨
  
  // 미니차고로 이동
  private async transitionToGarage() {
    try {
      await this.transitionTo('garage')
    } catch (error) {
      alert('미니차고로 이동할 수 없습니다.')
    }
  }
  
  // MiniGameEngine 요소들 완전히 제거 (마을 씬용) - 직접 접근
  private hideMiniGameEngineElements() {
    
    // 모든 방법으로 MiniGameEngine 찾기
    let miniGameEngine = (this.app.stage as any).miniGameEngine
    if (!miniGameEngine) {
      miniGameEngine = (window as any).currentMiniGameEngine
    }
    if (!miniGameEngine && (window as any).engineRef) {
      miniGameEngine = (window as any).engineRef.current
    }
    
    
    if (miniGameEngine && miniGameEngine.worldContainer) {
      
      // MiniGameEngine의 worldContainer를 app.stage에서 완전히 제거
      if (miniGameEngine.worldContainer.parent) {
        miniGameEngine.worldContainer.parent.removeChild(miniGameEngine.worldContainer)
      }
      
      // 추가로 MiniGameEngine의 모든 컨테이너를 숨김
      miniGameEngine.worldContainer.visible = false
      miniGameEngine.worldContainer.alpha = 0
      
    } else {
      // MiniGameEngine을 찾을 수 없는 경우, app.stage의 모든 자식을 확인하여 강제로 숨김
      
      this.app.stage.children.forEach((child, index) => {
        // SceneManager의 컨테이너가 아닌 경우 숨김
        if (child !== this.worldContainer && child !== this.fadeOverlay) {
          child.visible = false
          child.alpha = 0
        }
      })
      
    }
  }

  // 차고 씬에서는 MiniGameEngine worldContainer를 직접 사용하므로 별도 복원 불필요
  
  // MiniGameEngine 인스턴스 가져오기
  private getMiniGameEngine(): any {
    let miniGameEngine = (this.app.stage as any).miniGameEngine
    if (!miniGameEngine) {
      miniGameEngine = (window as any).currentMiniGameEngine
    }
    if (!miniGameEngine && (window as any).engineRef) {
      miniGameEngine = (window as any).engineRef.current
    }
    return miniGameEngine
  }
  
  // 차고 타일 렌더링은 MiniGameEngine에 완전히 위임
  // (이 메서드는 더 이상 사용되지 않음)
  
  // MiniGameEngine의 기본 그리드 시스템을 사용하므로 별도 그리드 생성 불필요
  
  // 마을 그리드 생성 (10x10)
  private createVillageGrid() {
    
    const gridContainer = new PIXI.Container()
    gridContainer.sortableChildren = true
    
    // 10x10 그리드 생성 (-5~4, -5~4)
    const gridMin = -5
    const gridMax = 4
    
    for (let x = gridMin; x <= gridMax; x++) {
      for (let y = gridMin; y <= gridMax; y++) {
        const coords = this.toIsoCoords(x, y)
        
        const cell = new PIXI.Graphics()
        cell.fill({ color: 0x27ae60, alpha: 0.1 }) // 마을 그리드 색상
        cell.setStrokeStyle({ color: 0x2ecc71, width: 1, alpha: 0.3 })
        
        const hw = 50 // 타일 폭 절반
        const hh = 25 // 타일 높이 절반
        
        cell.moveTo(0, -hh)
        cell.lineTo(hw, 0)
        cell.lineTo(0, hh) 
        cell.lineTo(-hw, 0)
        cell.lineTo(0, -hh)
        
        cell.fill().stroke()
        
        cell.x = coords.x
        cell.y = coords.y
        // 그리드 레이어 내 z-index (1000-1999 범위)
        cell.zIndex = 1000 + y * 10 + x
        
        // 클릭 가능하게 설정
        cell.eventMode = 'static'
        cell.cursor = 'pointer'
        
        // 클릭 이벤트 - 마을 캐릭터 이동
        cell.on('pointerdown', () => {
          this.moveVillageCharacter(x, y)
        })
        
        // 호버 효과
        cell.on('pointerover', () => {
          cell.alpha = 0.7
        })
        
        cell.on('pointerout', () => {
          cell.alpha = 1.0
        })
        
        gridContainer.addChild(cell)
      }
    }
    
    // 마을 컨테이너에 그리드 추가 (배경으로)
    this.villageContainer.addChildAt(gridContainer, 0)
    
  }
  
  // 마을 캐릭터 생성
  private async createVillageCharacter() {
    
    // 기본 차량 정보
    const vehicleInfo = {
      id: 'civilian_blue_2',
      name: '파란 민수용 차량',
      imagePath: '/Garage/Character/배민/S_1.png', // 기본 캐릭터로 대체
      frames: 16,
      directions: ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW']
    }
    
    // 기본 위치 (0, 3, 0)에서 시작
    const initialPosition = { x: 0, y: 3, z: 0 }
    
    this.villageCharacter = new VehicleCharacter(this.app, vehicleInfo, initialPosition)
    
    // 마을 컨테이너에 추가 (임시 비활성화 - VehicleCharacter에 getContainer 메서드 없음)
    // this.villageContainer.addChild(this.villageCharacter.getContainer())
    
  }
  
  
  
  
  
  
  // Garage 씬 정리 (완전히 분리)
  private cleanupGarageScene() {
    
    // 🧹 MiniGameEngine의 캐릭터 완전 정리 (가장 중요!)
    const miniGameEngine = this.getMiniGameEngine()
    if (miniGameEngine) {
      miniGameEngine.cleanupCharacter()
    }
    
    // 차고 컨테이너를 월드에서 제거
    if (this.garageContainer.parent) {
      this.worldContainer.removeChild(this.garageContainer)
    }
    
    // 차고 캐릭터 정리 (SceneManager 내부 참조)
    if (this.garageCharacter) {
      this.garageCharacter = null
    }
    
    // 차고 컨테이너 내용 정리
    this.garageContainer.removeChildren()
    
  }
  
  // Village 씬 정리 (완전히 분리)
  private cleanupVillageScene() {
    
    // 마을 컨테이너를 월드에서 제거
    if (this.villageContainer.parent) {
      this.worldContainer.removeChild(this.villageContainer)
    }
    
    // 마을 캐릭터 정리
    if (this.villageCharacter) {
      this.villageCharacter.destroy()
      this.villageCharacter = null
    }
    
    // 마을 컨테이너 내용 정리
    this.villageContainer.removeChildren()
    
  }
  
  // 씬 전환 (완전한 분리 보장)
  public async transitionTo(
    sceneType: SceneType, 
    transition: Omit<SceneTransition, 'from' | 'to'> = {}
  ): Promise<void> {
    if (this.isTransitioning) return
    if (this.currentScene?.sceneType === sceneType) return
    
    this.isTransitioning = true
    const fromScene = this.currentScene?.sceneType
    const fadeTime = transition.fadeTime || 800 // 페이드 시간을 0.8초로 단축 (더 부드럽게)
    
    try {
      
      // 페이드 아웃 (검은 화면으로)
      await this.fadeOut(fadeTime / 2)
      
      // 씬 전환 중 완전한 분리를 위한 대기
      await new Promise(resolve => setTimeout(resolve, 100))
      
      // 현재 씬 완전 정리
      if (this.currentScene) {
        this.currentScene.cleanup?.()
      }
      
      // 새 씬 설정
      const newScene = this.scenes.get(sceneType)
      if (!newScene) {
        throw new Error(`씬을 찾을 수 없음: ${sceneType}`)
      }
      
      await newScene.setup()
      this.currentScene = newScene
      
      // 렌더링 강제 업데이트 (새 씬 완전 로드 보장)
      this.app.renderer.render(this.app.stage)
      
      // 새 씬 완전 로드 후 대기
      await new Promise(resolve => setTimeout(resolve, 100))
      
      // 페이드 인 (새 씬 표시)
      await this.fadeIn(fadeTime / 2)
      
      
    } catch (error) {
    } finally {
      this.isTransitioning = false
    }
  }
  
  // 페이드 아웃
  private async fadeOut(duration: number): Promise<void> {
    return new Promise((resolve) => {
      this.worldContainer.addChild(this.fadeOverlay)
      
      let elapsed = 0
      const animate = () => {
        elapsed += this.app.ticker.deltaMS
        const alpha = Math.min(elapsed / duration, 1)
        
        this.fadeOverlay.alpha = alpha
        
        if (alpha >= 1) {
          resolve()
        } else {
          requestAnimationFrame(animate)
        }
      }
      animate()
    })
  }
  
  // 페이드 인
  private async fadeIn(duration: number): Promise<void> {
    return new Promise((resolve) => {
      let elapsed = 0
      const animate = () => {
        elapsed += this.app.ticker.deltaMS
        const alpha = Math.max(1 - elapsed / duration, 0)
        
        this.fadeOverlay.alpha = alpha
        
        if (alpha <= 0) {
          if (this.fadeOverlay.parent) {
            this.worldContainer.removeChild(this.fadeOverlay)
          }
          resolve()
        } else {
          requestAnimationFrame(animate)
        }
      }
      animate()
    })
  }
  
  // 현재 씬 업데이트 (이미 위에서 구현됨)
  
  // 아이소메트릭 좌표 변환 (tilemap-editor와 동일하게)
  private toIsoCoords(x: number, y: number) {
    const VOXEL_SIZE = 100
    return {
      x: (x - y) * (VOXEL_SIZE / 2),     // 수평 간격: 50px (다이아몬드가 맞닿도록)
      y: (x + y) * (VOXEL_SIZE / 4)      // 수직 간격: 25px (표준 2:1 ISO 뷰)
    }
  }
  
  // 사용자 데이터 설정
  public setUserData(userData: UserCharacterData) {
    this.userData = userData
  }
  
  // 사용자 게임 데이터 로드
  public async loadUserGameData(userId: string) {
    try {
      const response = await fetch(`/api/user-game-data?userId=${userId}`)
      const result = await response.json()
      
      if (result.characterData) {
        this.userData = result.characterData
      }
      if (result.inventory) {
        this.userInventory = result.inventory
      }
    } catch (error) {
      
      // 기본 데이터로 fallback - 빈 인벤토리로 시작
      this.userData = {
        garageCharacter: {
          characterId: 'baemin_default',
          position: { x: 0, y: 0, z: 0 },
          customization: { skinId: 'default', outfitId: 'default' }
        },
        villageCharacter: {
          vehicleId: 'civilian_blue_2',
          position: { x: 0, y: 0, z: 0 },
          ownedVehicles: ['civilian_blue_2']
        }
      }
      this.userInventory = {
        furnitureItems: [], // 빈 배열로 시작
        tileItems: [], // 빈 배열로 시작
        characterItems: ['baemin_default'], // 배민커넥터만 기본 제공
        vehicleItems: ['civilian_blue_2'], // 기본 차량만 제공
        placedFurniture: [],
        placedTiles: []
      }
    }
  }
  
  // 사용자 게임 데이터 저장
  public async saveUserGameData(userId: string) {
    try {
      const response = await fetch('/api/user-game-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          characterData: this.userData
        })
      })
      
      const result = await response.json()
      
      if (result.success) {
      } else {
      }
    } catch (error) {
    }
  }
  
  // 현재 씬 타입 반환 (중복 제거)
  public getCurrentScene(): SceneType | null {
    return this.currentScene?.sceneType || null
  }
  
  // 정리
  public destroy() {
    this.cleanupGarageScene()
    this.cleanupVillageScene()
    
    if (this.garageContainer.parent) {
      this.worldContainer.removeChild(this.garageContainer)
    }
    if (this.villageContainer.parent) {
      this.worldContainer.removeChild(this.villageContainer)
    }
    
    this.scenes.clear()
    this.currentScene = null
  }
  
  // Village Character 클릭 이동 (외부에서 호출)
  public moveVillageCharacter(x: number, y: number) {
    if (this.villageCharacter && this.currentScene?.sceneType === 'village') {
      this.villageCharacter.moveTo(x, y, 0)
    }
  }
  
  // 현재 씬 가져오기 (중복 제거)
  
  // 씬 매니저 업데이트
  public update(deltaTime: number) {
    if (this.currentScene?.update) {
      this.currentScene.update(deltaTime)
    }
    
    // 🚫 아이템 미리보기 업데이트 제거됨 - MobileRoomDecorator가 처리
  }
  
  // 아이템 미리보기 이벤트 설정 (MiniGameEngine으로 통합됨)
  private setupItemPreviewEvents() {
    // ⚠️ 이 이벤트들은 MiniGameEngine에서 처리하므로 비활성화
    // 중복 배치 시스템 방지를 위해 주석 처리
    
    /*
    // 인벤토리에서 아이템 클릭 시 미리보기 표시
    window.addEventListener('showItemPreview', (event: any) => {
      const { item, userId } = event.detail
      this.showItemPreview(item, userId)
    })
    
    // ESC 키로 미리보기 취소
    window.addEventListener('keydown', (event: KeyboardEvent) => {
      if (event.key === 'Escape' && this.isPreviewMode) {
        this.hideItemPreview()
      }
    })
    
    // 캔버스 클릭으로 아이템 배치
    this.app.stage.eventMode = 'static'
    this.app.stage.on('pointerdown', (event: PIXI.FederatedPointerEvent) => {
      if (this.isPreviewMode && this.previewItem) {
        this.placeItem(event.global.x, event.global.y)
      }
    })
    
    // 마우스 이동 추적
    this.app.stage.on('pointermove', (event: PIXI.FederatedPointerEvent) => {
      this.mousePosition.x = event.global.x
      this.mousePosition.y = event.global.y
    })
    */
    
    console.log('🔧 SceneManager 아이템 배치 시스템 비활성화 (MiniGameEngine 사용)')
  }
  
  // 🚫 아이템 미리보기 및 배치 시스템 완전 제거됨 - MobileRoomDecorator가 처리
}

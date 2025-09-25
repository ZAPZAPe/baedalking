import * as PIXI from 'pixi.js'
import { GameObject, GridTileReference } from './types'
import { IsometricUtils } from './IsometricUtils'
import { BaeminCharacter } from './BaeminCharacter'
import { CharacterManager } from '../characterSystem'
import { registerDefaultSprites } from '../spriteSystem'
import { TilemapLoader, TilemapData } from './TilemapLoader'
import { SceneManager } from './SceneManager'
import { GameUIManager } from './ui/GameUIManager'
import { MobileRoomDecorator } from './MobileRoomDecorator'

// 타일 ID를 이미지 경로로 매핑하는 함수
function getTileImagePath(tileId: string): string {
  // 타일 ID 파싱 (예: lot_lotSW -> lot 폴더의 lotSW.png)
  const parts = tileId.split('_')
  if (parts.length !== 2) {
    return '/Garage/Tile/01_기본지형/grass.png' // 기본값
  }
  
  const [category, fileName] = parts
  
  // 카테고리별 폴더 매핑
  const folderMap: { [key: string]: string } = {
    'grass': '01_기본지형',
    'water': '02_물',
    'river': '03_강하천',
    'road': '04_도로',
    'intersection': '05_교차로',
    'terminal': '06_터미널',
    'bridge': '07_다리',
    'hill': '08_언덕',
    'lot': '09_건물부지',
    'beach': '10_해변',
    'tree': '11_나무'
  }
  
  const folderName = folderMap[category] || '01_기본지형' // 기본값
  
  return `/Garage/Tile/${folderName}/${fileName}.png`
}

// 새로운 게임 엔진 클래스
export class MiniGameEngine {
  public app!: PIXI.Application
  public gameObjects: Map<string, GameObject> = new Map()
  public sprites: Map<string, PIXI.Container> = new Map()
  public gridContainer!: PIXI.Container
  public objectContainer!: PIXI.Container
  public uiContainer!: PIXI.Container
  public characterManager!: CharacterManager
  public worldContainer!: PIXI.Container  // 줌/패닝을 위한 월드 컨테이너
  public tileContainer!: PIXI.Container   // 타일 전용 컨테이너 (SceneManager가 사용)
  public baeminCharacter: BaeminCharacter | null = null // 배민 캐릭터 (nullable)
  public tilemapLoader!: TilemapLoader // 타일맵 로더
  public selectionOverlay!: PIXI.Container // 선택 표시 오버레이
  public sceneManager!: SceneManager // 씬 매니저
  public gameUIManager!: GameUIManager // 게임 내부 UI 매니저
  public mobileRoomDecorator!: MobileRoomDecorator // 🏠 새로운 모바일 방꾸미기 시스템
  
  private gridSize = 20    // 20x20 그리드 (-10 ~ 9) 
  private gridMin = -10    // 그리드 최소값
  private gridMax = 9      // 그리드 최대값 (기본 영역)
  private currentTilemap: TilemapData | null = null // 현재 로드된 타일맵
  private selectedTile: { x: number, y: number } | null = null
  private gridTiles: Map<string, GridTileReference> = new Map() // 타일 참조 저장
  private tileSprites: Map<string, PIXI.Sprite> = new Map() // 타일 스프라이트 참조 저장
  private selectionGraphics: PIXI.Graphics | null = null // 현재 선택 표시
  private onTileClick?: (x: number, y: number, z: number) => void
  private onObjectClick?: (object: GameObject) => void
  private keyEventListener?: (event: KeyboardEvent) => void
  private cleanupResize?: () => void
  private playerCharacterId?: string
  
  // 🏠 새로운 모바일 방꾸미기 시스템만 사용

  // 줌/패닝 관련
  private zoomLevel = 0.4  // 기본 줌을 더 축소해서 넓게 보이게 (0.5 → 0.4)
  private minZoom = 0.15   // 최소 줌을 극단적으로 축소 (0.2 → 0.15)
  private maxZoom = 1.0    // 최대 줌을 적당하게 제한 (1.5 → 1.0)
  private panX = 0         // 패닝 X 좌표 (줌 적용 전)
  private panY = 0         // 패닝 Y 좌표 (줌 적용 전)
  
  // 드래그 관련
  private isDragging = false
  private lastPanPoint = { x: 0, y: 0 }
  
  // 파괴 상태 체크
  private isDestroyed = false

  constructor() {
    // 생성자는 비어있음
  }

  public async initialize(canvas: HTMLElement, width: number, height: number, userId?: string) {
    // 사용자 ID 저장 (UI 매니저에서 사용)
    (this as any)._userId = userId
    
    await this.initializeApp(canvas, width, height)
  }

  private async initializeApp(canvas: HTMLElement, width: number, height: number) {
    if (this.isDestroyed) {
      throw new Error('엔진이 이미 파괴됨')
    }

    try {
      // PIXI.js v8 방식으로 초기화 - 레퍼런스 기반 완전 재작성
      this.app = new PIXI.Application()

      // 초기화 설정 (v8 스타일)
      await this.app.init({
        canvas: canvas as HTMLCanvasElement,
        width: width,
        height: height,
        backgroundColor: 0x87ceeb,  // 하늘색 배경
        antialias: true,
        resolution: Math.min(window.devicePixelRatio || 1, 2),
        autoDensity: true,
        powerPreference: 'high-performance'
      })

      // PIXI 전역 설정 (성능/품질 균형)
      PIXI.settings.SCALE_MODE = PIXI.SCALE_MODES.LINEAR
      PIXI.settings.ROUND_PIXELS = true

      // 전역 참조 설정 (디버깅용)
      (this.app.stage as any).miniGameEngine = this
      ;(window as any).currentMiniGameEngine = this
      ;(window as any).engineRef = { current: this }

      console.log('✅ PIXI.js v8 엔진 초기화 성공 (레퍼런스 기반)')

    } catch (error) {
      console.error('❌ PIXI.js v8 앱 초기화 실패:', error)

      if (this.app) {
        try {
          // ResizePlugin 오류를 피하기 위한 최소 destroy
          this.app.destroy({ 
            removeView: false  // DOM 제거 안함
          })
        } catch (destroyError) {
        }
      }
      throw error
    }
    
    // PIXI 앱 완전 초기화 확인

    // 초고속 초기화 (로그 최소화)
    if (!this.isDestroyed) await this.initializeSpriteSystem()
    if (!this.isDestroyed) this.setupLayers()
    if (!this.isDestroyed) this.initializeCharacterSystem()
    if (!this.isDestroyed) await this.initializeBaeminCharacter((this as any)._userId)
    if (!this.isDestroyed) await this.initializeSceneManager()
    if (!this.isDestroyed) this.initializeGameUI((this as any)._userId)
    if (!this.isDestroyed) this.setupEvents()
    if (!this.isDestroyed) this.startGameLoop()
    // 타일맵과 그리드는 외부에서 loadTilemap 호출로 로드됨
    
    // 💾 배치된 아이템들 로딩 (초기화 완료 후)
    if (!this.isDestroyed) {
      setTimeout(() => {
        this.loadPlacedItemsWithNewSystem()
      }, 1000) // 1초 후 로딩 (UI 초기화 완료 후)
    }
    
    // 초기화 완료
  }

  private async initializeSpriteSystem() {
    // 기본 스프라이트 등록 (초고속)
    registerDefaultSprites()
    
    // 타일맵 로더 초기화
    this.tilemapLoader = new TilemapLoader()
    
    // 🚀 캐릭터 텍스처 프리로딩 (백그라운드) - 즉시 반환으로 초기화 지연 없음
    BaeminCharacter.preloadTextures().catch(error => {
    })
    
    // 모든 타일 텍스처 미리 로드
    await this.tilemapLoader.preloadAllTextures()
  }

  // PIXI.js 레이어 설정 (초고속)
  private setupLayers() {
    // 월드 컨테이너 (줌/패닝이 적용되는 모든 것)
    this.worldContainer = new PIXI.Container()
    this.worldContainer.sortableChildren = true
    this.app.stage.addChild(this.worldContainer)
    
    // 월드 내부의 레이어들
    this.tileContainer = new PIXI.Container()        // 타일 (가장 아래)
    this.gridContainer = new PIXI.Container()        // 그리드
    this.objectContainer = new PIXI.Container()      // 오브젝트 (캐릭터, 아이템)
    this.selectionOverlay = new PIXI.Container()     // 선택 표시 (가장 위)
    
    // 레이어별 Z-index 설정
    this.tileContainer.zIndex = 0
    this.gridContainer.zIndex = 1000
    this.objectContainer.zIndex = 2000
    this.selectionOverlay.zIndex = 9000
    
    // 오브젝트 컨테이너는 정렬 가능하도록 설정
    this.objectContainer.sortableChildren = true
    
    // 월드 컨테이너에 추가
    this.worldContainer.addChild(this.tileContainer)
    this.worldContainer.addChild(this.gridContainer)
    this.worldContainer.addChild(this.objectContainer)
    this.worldContainer.addChild(this.selectionOverlay)
    
    // UI 컨테이너 (줌/패닝 영향 안받음)
    this.uiContainer = new PIXI.Container()
    this.uiContainer.zIndex = 10000
    this.app.stage.addChild(this.uiContainer)
    
    // 스테이지 정렬 활성화
    this.app.stage.sortableChildren = true
    
    // 기본 줌 적용
    this.updateWorldTransform()
  }

  private initializeCharacterSystem() {
    // 캐릭터 매니저 초기화 (초고속)
    this.characterManager = new CharacterManager()
  }

  private async initializeBaeminCharacter(userId?: string) {
    // 사용자 ID가 있을 때만 초기화 (선택사항)
    if (userId) {
      try {
        this.baeminCharacter = new BaeminCharacter()
        await this.baeminCharacter.loadCharacterData(userId)
        await this.baeminCharacter.initialize(this.objectContainer)
      } catch (error) {
        // 에러 발생 시에도 계속 진행
        this.baeminCharacter = null
      }
    }
  }

  private async initializeSceneManager() {
    // 씬 매니저 생성
    this.sceneManager = new SceneManager(this.app, this.worldContainer)
    
  }

  private initializeGameUI(userId?: string) {
    // 🏠 모바일 방꾸미기 시스템 초기화
    this.mobileRoomDecorator = new MobileRoomDecorator(this.app, this.objectContainer, userId)
    
    // 게임 내부 UI 매니저 초기화 - 새로운 방꾸미기 시스템과 연결
    this.gameUIManager = new GameUIManager({
      app: this.app,
      userId: userId,
      onItemPurchase: async (item) => {
        return await this.handleItemPurchase(item)
      },
      onItemEquip: async (item) => {
        return await this.handleItemEquip(item)
      },
      onItemPlace: async (item, x, y) => {
        // 🚫 더 이상 사용하지 않음 - MobileRoomDecorator에서 처리
        return true
      },
      onItemSelect: (item) => {
        // 🏠 새로운 모바일 배치 시스템으로 연결
        this.mobileRoomDecorator.startPlacementMode(item)
      },
      onItemRecall: async (item) => {
        console.log('🚫 기존 회수 시스템 제거됨')
      }
    })
    
    console.log('🏠 새로운 모바일 중심 방꾸미기 시스템 초기화 완료')
  }

  // 🗑️ 기존 아이템 선택 및 회수 시스템 제거됨 - MobileRoomDecorator가 처리

  // 아이템 구매 처리
  private async handleItemPurchase(item: any): Promise<boolean> {
    try {
      console.log('아이템 구매:', item.name)
      return true
    } catch (error) {
      console.error('아이템 구매 실패:', error)
      return false
    }
  }

  // 아이템 장착 처리
  private async handleItemEquip(item: any): Promise<boolean> {
    try {
      console.log('아이템 장착:', item.name)
      return true
    } catch (error) {
      console.error('아이템 장착 실패:', error)
      return false
    }
  }

  // 🗑️ 기존 배치 시스템 메서드 제거됨 - MobileRoomDecorator가 처리

  // 🔑 현재 사용자 ID 가져오기 (로컬스토리지에서)
  private getCurrentUserId(): string | null {
    try {
      if (typeof window === 'undefined') {
        console.error('❌ 클라이언트 환경이 아닙니다')
        return null
      }

      // Supabase 세션에서 사용자 ID 가져오기
      const authStorageKey = 'sb-udpzfrpubwakakafznhb-auth-token'
      const authData = localStorage.getItem(authStorageKey)

      if (!authData) {
        console.log('⚠️ 인증 토큰이 없습니다')
        return null
      }

      const parsedAuth = JSON.parse(authData)
      const userId = parsedAuth?.user?.id

      if (!userId) {
        console.log('⚠️ 사용자 ID를 찾을 수 없습니다')
        return null
      }

      return userId
    } catch (error) {
      console.error('❌ 사용자 ID 가져오기 실패:', error)
      return null
    }
  }

  // 🏠 새로운 시스템으로 배치된 아이템들 로딩
  private async loadPlacedItemsWithNewSystem(): Promise<void> {
    try {
      if (this.mobileRoomDecorator) {
        await this.mobileRoomDecorator.loadExistingPlacements()
        
        // 인벤토리 새로고침
        if (this.gameUIManager?.inventoryPanel) {
          await this.gameUIManager.inventoryPanel.refreshItems()
          console.log('📦 인벤토리 새로고침 완료')
        }
      }
    } catch (error) {
      console.error('❌ 새로운 시스템으로 아이템 로딩 실패:', error)
    }
  }

  // 🗑️ 기존 배치 아이템 로딩/복원 시스템 제거됨 - MobileRoomDecorator가 처리

  private createGridTile(x: number, y: number) {
    const tileContainer = new PIXI.Container()
    
    // 아이소메트릭 좌표 계산 (에디터와 동일한 기준)
    const coords = IsometricUtils.toScreenCoords(x, y, 0)
    tileContainer.x = coords.screenX
    // 에디터와 동일: 그리드는 오프셋 없음 (coords.y)
    tileContainer.y = coords.screenY  // 에디터 그리드와 동일
    
    // 마을 포털 제거됨 - 모든 타일을 동일하게 처리
    // const isVillagePortal = this.isVillagePortalGrid(x, y)
    
    const tile = new PIXI.Graphics()
    
    // 기본 타일 색상 (회색 계열, 투명도 적용)
    const baseColor = 0x555555  // 더 어두운 회색
    const strokeColor = 0x888888  // 경계선 색상
    
    const hw = IsometricUtils.TILE_WIDTH / 2
    const hh = IsometricUtils.TILE_HEIGHT / 2
    
    // 타일 채우기 (투명도 적용)
    tile.fill({ color: baseColor, alpha: 0.3 })  // 30% 투명도
    tile.moveTo(0, -hh)
    tile.lineTo(hw, 0)
    tile.lineTo(0, hh)
    tile.lineTo(-hw, 0)
    tile.lineTo(0, -hh)
    tile.fill()
    
    // 타일 테두리
    tile.stroke({ color: strokeColor, width: 1, alpha: 0.6 })
    tile.moveTo(0, -hh)
    tile.lineTo(hw, 0)
    tile.lineTo(0, hh)
    tile.lineTo(-hw, 0)
    tile.lineTo(0, -hh)
    tile.stroke()
    
    tileContainer.addChild(tile)
    
    // 마우스 이벤트 설정
    tileContainer.eventMode = 'static'
    tileContainer.cursor = 'pointer'
    
    // 클릭 이벤트
    tileContainer.on('pointerdown', () => {
      this.selectTile(x, y)
      
      if (this.onTileClick) {
        this.onTileClick(x, y, 0)
      }
    })
    
    // 시각적 피드백
    tileContainer.on('pointerover', () => {
      tile.tint = 0xffff99  // 연한 노란색 하이라이트
    })
    
    tileContainer.on('pointerout', () => {
      tile.tint = 0xffffff  // 원래 색상으로 복구
    })
    
    // Z-index 설정 (보통 렌더링 순서)
    tileContainer.zIndex = 5000 + y * 10 + x
    
    this.gridContainer.addChild(tileContainer)
    
    // 타일 참조 저장
    const tileKey = `${x}-${y}`
    this.gridTiles.set(tileKey, { container: tileContainer, graphics: tile })
    
  }

  // 색상 유틸리티 함수들
  private getDarkerColor(color: number): number {
    const r = (color >> 16) & 0xFF
    const g = (color >> 8) & 0xFF
    const b = color & 0xFF
    
    return ((Math.floor(r * 0.7) << 16) | (Math.floor(g * 0.7) << 8) | Math.floor(b * 0.7))
  }
  
  private getBrighterColor(color: number): number {
    const r = (color >> 16) & 0xFF
    const g = (color >> 8) & 0xFF
    const b = color & 0xFF
    
    return ((Math.min(255, Math.floor(r * 1.3)) << 16) | 
            (Math.min(255, Math.floor(g * 1.3)) << 8) | 
            Math.min(255, Math.floor(b * 1.3)))
  }

  // 상점 포탈 클릭 처리
  private handleShopPortalClick() {
    // 레퍼런스 기반 상점 토글 (GameUIManager의 shopPanel 사용)
    if (this.gameUIManager) {
      // HUD의 상점 버튼과 동일한 동작
      this.gameUIManager.toggleShop()
      console.log('🏬 상점 포탈 클릭 - GameUIManager.toggleShop() 호출')
    } else {
      console.warn('⚠️ GameUIManager가 초기화되지 않음')
    }
  }

  public loadTilemap(tilemap: TilemapData) {
    this.currentTilemap = tilemap
    this.renderTilemap()
    this.createGrid()
  }

  private renderTilemap() {
    if (!this.currentTilemap) return

    this.tileContainer.removeChildren()
    this.tileSprites.clear()

    this.currentTilemap.layers.forEach(layer => {
      layer.data.forEach((row, y) => {
        row.forEach((tileId, x) => {
          if (tileId !== null) {
            this.createTileSprite(x, y, tileId)
          }
        })
      })
    })
  }

  private async createTileSprite(x: number, y: number, tileId: string) {
    try {
      const imagePath = getTileImagePath(tileId)
      const texture = await PIXI.Assets.load(imagePath)
      const sprite = new PIXI.Sprite(texture)
      
      // 아이소메트릭 좌표 계산
      const coords = IsometricUtils.toScreenCoords(x, y, 0)
      sprite.x = coords.screenX
      sprite.y = coords.screenY
      
      // 스프라이트 앵커를 중앙 하단으로 설정
      sprite.anchor.set(0.5, 1)
      
      // 스케일 조정 (필요에 따라)
      sprite.scale.set(1.0)
      
      // Z-index 설정 (타일은 배경이므로 낮은 값)
      sprite.zIndex = y * 100 + x
      
      this.tileContainer.addChild(sprite)
      
      // 스프라이트 참조 저장
      const key = `${x}-${y}`
      this.tileSprites.set(key, sprite)
      
    } catch (error) {
      console.warn(`타일 이미지 로드 실패: ${tileId}`, error)
    }
  }

  public createGrid() {
    // 기존 그리드 제거
    this.gridContainer.removeChildren()
    this.gridTiles.clear()
    
    // 20x20 그리드 생성 (중심 대칭: -10 ~ 9)
    for (let x = this.gridMin; x <= this.gridMax; x++) {
      for (let y = this.gridMin; y <= this.gridMax; y++) {
        this.createGridTile(x, y)
      }
    }
  }

  // 타일 선택
  public selectTile(x: number, y: number) {
    this.selectedTile = { x, y }
    
    // 기존 선택 표시 제거
    if (this.selectionGraphics) {
      this.selectionOverlay.removeChild(this.selectionGraphics)
      this.selectionGraphics.destroy()
      this.selectionGraphics = null
    }
    
    // 새로운 선택 표시 생성
    this.selectionGraphics = new PIXI.Graphics()
    
    // 선택된 타일의 아이소메트릭 좌표 계산
    const coords = IsometricUtils.toScreenCoords(x, y, 0)
    this.selectionGraphics.x = coords.screenX
    this.selectionGraphics.y = coords.screenY
    
    // 그리드와 동일한 위치
    
    // 다이아몬드 모양 선택 표시
    const hw = IsometricUtils.TILE_WIDTH / 2
    const hh = IsometricUtils.TILE_HEIGHT / 2
    
    this.selectionGraphics.fill({ color: 0xf39c12, alpha: 0.4 }) // 주황색 반투명 채우기
    this.selectionGraphics.setStrokeStyle({ color: 0xff6b35, width: 3, alpha: 0.9 }) // 주황색 테두리
    
    // 다이아몬드 모양 그리기
    this.selectionGraphics.moveTo(0, -hh)      // 상단
    this.selectionGraphics.lineTo(hw, 0)       // 우측
    this.selectionGraphics.lineTo(0, hh)       // 하단
    this.selectionGraphics.lineTo(-hw, 0)      // 좌측
    this.selectionGraphics.lineTo(0, -hh)      // 상단으로 닫기
    
    this.selectionGraphics.fill()
    this.selectionGraphics.stroke()
    
    // 선택 오버레이에 추가 (높은 z-index로 최상위 렌더링)
    this.selectionGraphics.zIndex = 99999  // 가장 위에 렌더링
    this.selectionOverlay.addChild(this.selectionGraphics)
    this.selectionOverlay.sortableChildren = true
  }

  private setupEvents() {
    // 파괴된 상태 체크
    if (this.isDestroyed) {
      return
    }

    // PIXI 앱이 완전히 준비될 때까지 기다리기
    if (!this.app || !this.app.stage || !this.app.screen) {
      return
    }

    try {
      // 전역 클릭 이벤트
      this.app.stage.eventMode = 'static'
      this.app.stage.hitArea = this.app.screen
      
    } catch (error) {
      return
    }
    
    // 키보드 이벤트 설정
    this.keyEventListener = (event: KeyboardEvent) => {
      // 줌/패닝 키보드 단축키 처리
      switch (event.key) {
        case '+':
        case '=':
          this.zoomIn()
          break
        case '-':
          this.zoomOut()
          break
        case '0':
          this.resetZoom()
          break
        case 'Escape':
          // 🏠 새로운 배치 모드 취소
          if (this.mobileRoomDecorator) {
            this.mobileRoomDecorator.cancelPlacementMode()
          }
          break
      }
    }

    // 마우스 휠 이벤트 (줌)
    const canvas = this.app.canvas as HTMLCanvasElement
    if (!canvas) {
      return
    }
    
    canvas.addEventListener('wheel', (event) => {
      if (this.isDestroyed) return
      event.preventDefault()
      
      if (event.deltaY < 0) {
        this.zoomIn()
      } else {
        this.zoomOut()
      }
    })

    // 핀치 줌 및 패닝 이벤트 처리 (개선된 버전)
    let isPinching = false
    let initialDistance = 0
    let initialZoom = this.zoomLevel
    
    // 터치 시작
    canvas.addEventListener('touchstart', (event) => {
      if (this.isDestroyed) return
      
      if (event.touches.length === 2) {
        // 핀치 시작
        isPinching = true
        initialDistance = this.getTouchDistance(event.touches)
        initialZoom = this.zoomLevel
        event.preventDefault()
      }
    })
    
    // 터치 이동
    canvas.addEventListener('touchmove', (event) => {
      if (this.isDestroyed) return
      
      if (isPinching && event.touches.length === 2) {
        const currentDistance = this.getTouchDistance(event.touches)
        const scale = currentDistance / initialDistance
        
        // 새로운 줌 레벨 계산 및 적용
        const newZoom = Math.max(this.minZoom, Math.min(this.maxZoom, initialZoom * scale))
        this.setZoom(newZoom)
        
        event.preventDefault()
      }
    })
    
    // 터치 종료
    canvas.addEventListener('touchend', (event) => {
      if (this.isDestroyed) return
      
      if (event.touches.length < 2) {
        isPinching = false
      }
    })
    
    window.addEventListener('keydown', this.keyEventListener)
    
    // 🏠 인벤토리 업데이트 이벤트 리스너 (새로운 방꾸미기 시스템용)
    window.addEventListener('inventoryUpdateRequired', async () => {
      if (this.gameUIManager?.inventoryPanel) {
        await this.gameUIManager.inventoryPanel.refreshItems()
        console.log('📦 인벤토리 업데이트 완료')
      }
    })
    
    // 화면 크기 변경 이벤트 추가
    const resizeHandler = () => {
      this.handleScreenResize()
    }
    window.addEventListener('resize', resizeHandler)
    
    // 정리 함수에 리사이즈 이벤트 제거 추가
    this.cleanupResize = () => {
      window.removeEventListener('resize', resizeHandler)
      window.removeEventListener('inventoryUpdateRequired', () => {})
    }
  }

  // 화면 크기 변경 처리 - 레퍼런스 기반 완전 재작성
  private handleScreenResize() {
    if (!this.app || this.isDestroyed) return
    
    const canvas = this.app.canvas as HTMLCanvasElement
    const parent = canvas.parentElement
    
    if (!parent) return
    
    const parentRect = parent.getBoundingClientRect()
    
    // 새로운 크기로 리사이즈
    this.app.renderer.resize(parentRect.width, parentRect.height)
    
    // 월드 변환 업데이트
    this.updateWorldTransform()
    
    // UI 매니저에게 리사이즈 알림
    if (this.gameUIManager) {
      this.gameUIManager.handleResize()
    }
  }

  // 게임 루프 시작 - 레퍼런스 기반 초고속 버전
  private startGameLoop() {
    if (this.isDestroyed) return
    
    this.app.ticker.add(() => {
      if (this.isDestroyed) return
      
      const deltaTime = this.app.ticker.deltaMS
      
      // 캐릭터 업데이트
      if (this.baeminCharacter) {
        this.baeminCharacter.update(deltaTime)
      }
      
      // UI 매니저 업데이트
      if (this.gameUIManager) {
        this.gameUIManager.update(deltaTime)
      }
      
      // 씬 매니저 업데이트
      if (this.sceneManager) {
        this.sceneManager.update(deltaTime)
      }
    })
  }

  // 터치 포인트 간 거리 계산
  private getTouchDistance(touches: TouchList): number {
    const touch1 = touches[0]
    const touch2 = touches[1]
    return Math.sqrt(
      Math.pow(touch2.clientX - touch1.clientX, 2) + 
      Math.pow(touch2.clientY - touch1.clientY, 2)
    )
  }

  // 터치 포인트 중심점 계산
  private getTouchCenter(touches: TouchList): { x: number, y: number } {
    const touch1 = touches[0]
    const touch2 = touches[1]
    return {
      x: (touch1.clientX + touch2.clientX) / 2,
      y: (touch1.clientY + touch2.clientY) / 2
    }
  }

  // 줌 기능들
  public zoomIn() {
    this.setZoom(Math.min(this.maxZoom, this.zoomLevel * 1.2))
  }

  public zoomOut() {
    this.setZoom(Math.max(this.minZoom, this.zoomLevel / 1.2))
  }

  public resetZoom() {
    this.setZoom(0.4) // 기본 줌 레벨
    this.panX = 0
    this.panY = 0
    this.updateWorldTransform()
  }

  private setZoom(newZoom: number) {
    this.zoomLevel = Math.max(this.minZoom, Math.min(this.maxZoom, newZoom))
    this.updateWorldTransform()
  }

  // 월드 변환 업데이트
  private updateWorldTransform() {
    if (!this.worldContainer) return
    
    const centerX = this.app.screen.width / 2
    const centerY = this.app.screen.height / 2
    
    this.worldContainer.scale.set(this.zoomLevel)
    this.worldContainer.x = centerX + this.panX
    this.worldContainer.y = centerY + this.panY
  }

  // 🗑️ 기존 그리드 하이라이트 시스템 제거됨
  
  // 🗑️ 기존 그리드 하이라이트 및 배치 컨트롤 시스템 제거됨
  
  // 🗑️ 기존 배치 모드 관련 모든 메서드들 제거됨 - MobileRoomDecorator가 처리

  // 엔진 정리
  public destroy() {
    this.isDestroyed = true
    
    // 이벤트 리스너 제거
    if (this.keyEventListener) {
      window.removeEventListener('keydown', this.keyEventListener)
    }
    
    if (this.cleanupResize) {
      this.cleanupResize()
    }
    
    // 🏠 새로운 방꾸미기 시스템 정리
    if (this.mobileRoomDecorator) {
      this.mobileRoomDecorator.destroy()
    }
    
    // UI 매니저 정리
    if (this.gameUIManager) {
      this.gameUIManager.destroy()
    }
    
    // 캐릭터 정리
    if (this.baeminCharacter) {
      this.baeminCharacter.destroy()
    }
    
    // 씬 매니저 정리
    if (this.sceneManager) {
      this.sceneManager.destroy()
    }
    
    // PIXI 앱 정리
    if (this.app) {
      try {
        this.app.destroy({ 
          removeView: true,  // DOM에서 캔버스 제거
          stageOptions: true // 스테이지 옵션도 정리
        })
      } catch (error) {
        console.warn('PIXI 앱 정리 중 오류:', error)
      }
    }
    
    // 전역 참조 정리
    ;(window as any).currentMiniGameEngine = null
    ;(window as any).engineRef = null
    
    console.log('🧹 MiniGameEngine 완전 정리 완료')
  }
}

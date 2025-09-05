// 🎮 모바일 우선 통합 캔버스 관리자
// 데스크톱과 모바일을 모두 지원하는 통합 시스템

import { 
  GridConfig, 
  DecorationItem, 
  PlacedItem, 
  Position3D, 
  Position2D,
  CharacterData
} from '@/types'
import { gridToIso, isoToGrid, DEFAULT_GRID_CONFIG } from './gridUtils'

// PixiJS 동적 로드
let PIXI: any = null
async function loadPixi() {
  if (!PIXI) {
    if (typeof window !== 'undefined' && (window as any).PIXI) {
      PIXI = (window as any).PIXI
      return PIXI
    }
    
    try {
      const pixiModule = await import('pixi.js')
      PIXI = pixiModule
      if (typeof window !== 'undefined') {
        (window as any).PIXI = PIXI
      }
    } catch (error) {
      throw new Error('PixiJS 로드 실패')
    }
  }
  return PIXI
}

// 터치 제스처 타입
interface TouchGesture {
  type: 'tap' | 'drag' | 'pinch' | 'rotate'
  startPos: Position2D
  currentPos: Position2D
  delta: Position2D
  scale: number
  rotation: number
}

// 충돌 검사 결과
interface CollisionResult {
  hasCollision: boolean
  collidingItems: PlacedItem[]
  suggestedPosition?: Position3D
}

// 미리보기 상태
interface PreviewState {
  item: DecorationItem | null
  position: Position3D | null
  isValid: boolean
  collisionResult: CollisionResult | null
}

export class UnifiedCanvasManager {
  private app: any = null
  private containers: any = {}
  private config: GridConfig = DEFAULT_GRID_CONFIG
  private isInitialized = false
  private canvas: HTMLCanvasElement | null = null
  
  // 모바일 최적화 설정
  private mobileSettings = {
    enableAntialias: false,
    powerPreference: 'low-power' as WebGLPowerPreference,
    maxTextureSize: 1024,
    backgroundColor: 0x1a202c
  }
  
  // 터치 제스처 관리
  private touchManager = {
    activeTouches: new Map<number, TouchGesture>(),
    gestureThreshold: 10, // 픽셀
    pinchThreshold: 0.1,
    rotationThreshold: 0.1
  }
  
  // 충돌 검사 시스템
  private collisionSystem = {
    gridOccupancy: new Map<string, PlacedItem>(),
    spatialIndex: new Map<string, PlacedItem[]>()
  }
  
  // Z축 관리 시스템
  private zAxisManager = {
    baseZIndex: 0,
    layerHeight: 20,
    maxLayers: 10
  }
  
  // 미리보기 시스템
  private previewSystem: PreviewState = {
    item: null,
    position: null,
    isValid: false,
    collisionResult: null
  }
  
  // 이벤트 콜백
  private eventCallbacks = {
    onItemPlace: null as ((item: DecorationItem, position: Position3D) => void) | null,
    onItemMove: null as ((itemId: string, newPosition: Position3D) => void) | null,
    onItemRemove: null as ((itemId: string) => void) | null,
    onPreviewUpdate: null as ((preview: PreviewState) => void) | null
  }

  /**
   * 통합 초기화 (모바일 우선)
   */
  async initialize(canvas: HTMLCanvasElement, width: number, height: number): Promise<void> {
    try {
      const PIXI = await loadPixi()
      this.canvas = canvas

      // 모바일 우선 설정으로 앱 생성
      this.app = new PIXI.Application()
      await this.app.init({
        canvas,
        width,
        height,
        backgroundColor: this.mobileSettings.backgroundColor,
        antialias: this.mobileSettings.enableAntialias,
        powerPreference: this.mobileSettings.powerPreference,
        resolution: Math.min(window.devicePixelRatio || 1, 2),
        autoDensity: true
      })

      // 컨테이너 생성
      await this.createContainers()
      
      // 터치 이벤트 설정
      this.setupTouchEvents()
      
      this.isInitialized = true
      console.log('🎮 통합 캔버스 매니저 초기화 완료')
    } catch (error) {
      console.error('❌ 통합 캔버스 매니저 초기화 실패:', error)
      throw error
    }
  }

  /**
   * 컨테이너 생성
   */
  private async createContainers(): Promise<void> {
    const PIXI = await loadPixi()
    
    // 레이어별 컨테이너 생성
    this.containers = {
      background: new PIXI.Container(),
      floor: new PIXI.Container(),
      items: new PIXI.Container(),
      character: new PIXI.Container(),
      preview: new PIXI.Container(),
      ui: new PIXI.Container()
    }
    
    // Z-index 설정
    Object.values(this.containers).forEach((container: any, index) => {
      container.zIndex = index
    })
    
    // 스테이지에 추가
    Object.values(this.containers).forEach(container => {
      this.app.stage.addChild(container)
    })
  }

  /**
   * 터치 이벤트 설정 (모바일 우선)
   */
  private setupTouchEvents(): void {
    if (!this.app) return

    // 터치 이벤트 활성화
    this.app.stage.interactive = true
    this.app.stage.interactiveChildren = true
    
    // 터치 이벤트 리스너
    this.app.stage.on('touchstart', this.handleTouchStart.bind(this))
    this.app.stage.on('touchmove', this.handleTouchMove.bind(this))
    this.app.stage.on('touchend', this.handleTouchEnd.bind(this))
    this.app.stage.on('touchendoutside', this.handleTouchEnd.bind(this))
    
    // 마우스 이벤트도 지원 (데스크톱 호환성)
    this.app.stage.on('pointerdown', this.handlePointerDown.bind(this))
    this.app.stage.on('pointermove', this.handlePointerMove.bind(this))
    this.app.stage.on('pointerup', this.handlePointerUp.bind(this))
  }

  /**
   * 터치 시작 처리
   */
  private handleTouchStart(event: any): void {
    const touch = event.data
    const touchId = touch.identifier || 0
    
    const gesture: TouchGesture = {
      type: 'tap',
      startPos: { x: touch.global.x, y: touch.global.y },
      currentPos: { x: touch.global.x, y: touch.global.y },
      delta: { x: 0, y: 0 },
      scale: 1,
      rotation: 0
    }
    
    this.touchManager.activeTouches.set(touchId, gesture)
    console.log('📱 터치 시작:', touchId, gesture.startPos)
  }

  /**
   * 터치 이동 처리
   */
  private handleTouchMove(event: any): void {
    const touch = event.data
    const touchId = touch.identifier || 0
    const gesture = this.touchManager.activeTouches.get(touchId)
    
    if (!gesture) return
    
    // 제스처 업데이트
    gesture.currentPos = { x: touch.global.x, y: touch.global.y }
    gesture.delta = {
      x: gesture.currentPos.x - gesture.startPos.x,
      y: gesture.currentPos.y - gesture.startPos.y
    }
    
    // 제스처 타입 결정
    const distance = Math.sqrt(gesture.delta.x ** 2 + gesture.delta.y ** 2)
    if (distance > this.touchManager.gestureThreshold) {
      gesture.type = 'drag'
    }
    
    // 드래그 처리
    if (gesture.type === 'drag') {
      this.handleDragGesture(gesture)
    }
    
    console.log('📱 터치 이동:', touchId, gesture.type, gesture.delta)
  }

  /**
   * 터치 종료 처리
   */
  private handleTouchEnd(event: any): void {
    const touch = event.data
    const touchId = touch.identifier || 0
    const gesture = this.touchManager.activeTouches.get(touchId)
    
    if (!gesture) return
    
    // 탭 처리
    if (gesture.type === 'tap') {
      this.handleTapGesture(gesture)
    }
    
    // 드래그 완료 처리
    if (gesture.type === 'drag') {
      this.handleDragComplete(gesture)
    }
    
    this.touchManager.activeTouches.delete(touchId)
    console.log('📱 터치 종료:', touchId, gesture.type)
  }

  /**
   * 포인터 다운 처리 (마우스/터치 통합)
   */
  private handlePointerDown(event: any): void {
    // 터치 이벤트가 이미 처리된 경우 스킵
    if (event.data.pointerType === 'touch') return
    
    const gesture: TouchGesture = {
      type: 'tap',
      startPos: { x: event.data.global.x, y: event.data.global.y },
      currentPos: { x: event.data.global.x, y: event.data.global.y },
      delta: { x: 0, y: 0 },
      scale: 1,
      rotation: 0
    }
    
    this.touchManager.activeTouches.set(0, gesture)
    console.log('🖱️ 포인터 다운:', gesture.startPos)
  }

  /**
   * 포인터 이동 처리
   */
  private handlePointerMove(event: any): void {
    if (event.data.pointerType === 'touch') return
    
    const gesture = this.touchManager.activeTouches.get(0)
    if (!gesture) return
    
    gesture.currentPos = { x: event.data.global.x, y: event.data.global.y }
    gesture.delta = {
      x: gesture.currentPos.x - gesture.startPos.x,
      y: gesture.currentPos.y - gesture.startPos.y
    }
    
    const distance = Math.sqrt(gesture.delta.x ** 2 + gesture.delta.y ** 2)
    if (distance > this.touchManager.gestureThreshold) {
      gesture.type = 'drag'
      this.handleDragGesture(gesture)
    }
  }

  /**
   * 포인터 업 처리
   */
  private handlePointerUp(event: any): void {
    if (event.data.pointerType === 'touch') return
    
    const gesture = this.touchManager.activeTouches.get(0)
    if (!gesture) return
    
    if (gesture.type === 'tap') {
      this.handleTapGesture(gesture)
    } else if (gesture.type === 'drag') {
      this.handleDragComplete(gesture)
    }
    
    this.touchManager.activeTouches.delete(0)
  }

  /**
   * 탭 제스처 처리
   */
  private handleTapGesture(gesture: TouchGesture): void {
    const gridPos = this.screenToGrid(gesture.startPos)
    console.log('👆 탭 처리:', gridPos)
    
    // 아이템 배치 또는 선택 처리
    this.handleItemInteraction(gridPos)
  }

  /**
   * 드래그 제스처 처리
   */
  private handleDragGesture(gesture: TouchGesture): void {
    const gridPos = this.screenToGrid(gesture.currentPos)
    
    // 미리보기 업데이트
    if (this.previewSystem.item) {
      this.updatePreview(this.previewSystem.item, gridPos)
    }
    
    console.log('🖱️ 드래그 처리:', gridPos)
  }

  /**
   * 드래그 완료 처리
   */
  private handleDragComplete(gesture: TouchGesture): void {
    const gridPos = this.screenToGrid(gesture.currentPos)
    
    // 아이템 배치 완료
    if (this.previewSystem.item && this.previewSystem.isValid) {
      this.placeItem(this.previewSystem.item, gridPos)
    }
    
    // 미리보기 초기화
    this.clearPreview()
    
    console.log('✅ 드래그 완료:', gridPos)
  }

  /**
   * 화면 좌표를 그리드 좌표로 변환
   */
  private screenToGrid(screenPos: Position2D): Position3D {
    // 캔버스 좌표로 변환
    const canvasRect = this.canvas?.getBoundingClientRect()
    if (!canvasRect) return { x: 0, y: 0, z: 0 }
    
    const canvasX = screenPos.x - canvasRect.left
    const canvasY = screenPos.y - canvasRect.top
    
    // 그리드 좌표로 변환
    const gridPos = isoToGrid(canvasX, canvasY, this.config)
    
    return {
      x: Math.round(gridPos.x),
      y: Math.round(gridPos.y),
      z: 0
    }
  }

  /**
   * 충돌 검사 시스템
   */
  private checkCollision(item: DecorationItem, position: Position3D): CollisionResult {
    const collidingItems: PlacedItem[] = []
    
    // 그리드 기반 충돌 검사
    if (item.gridData && item.gridData.cells) {
      for (const cell of item.gridData.cells) {
        const worldPos = {
          x: position.x + cell.x,
          y: position.y + cell.y,
          z: position.z + cell.z
        }
        
        const gridKey = `${worldPos.x},${worldPos.y},${worldPos.z}`
        const existingItem = this.collisionSystem.gridOccupancy.get(gridKey)
        
        if (existingItem) {
          collidingItems.push(existingItem)
        }
      }
    }
    
    return {
      hasCollision: collidingItems.length > 0,
      collidingItems,
      suggestedPosition: this.findValidPosition(item, position)
    }
  }

  /**
   * 유효한 위치 찾기 (Z축 자동 조정)
   */
  private findValidPosition(item: DecorationItem, position: Position3D): Position3D | undefined {
    // Z축을 점진적으로 올려가며 충돌 검사
    for (let z = position.z; z < this.zAxisManager.maxLayers; z++) {
      const testPos = { ...position, z }
      const collision = this.checkCollision(item, testPos)
      
      if (!collision.hasCollision) {
        return testPos
      }
    }
    
    return undefined
  }

  /**
   * 미리보기 업데이트
   */
  private updatePreview(item: DecorationItem, position: Position3D): void {
    const collisionResult = this.checkCollision(item, position)
    const validPosition = collisionResult.suggestedPosition || position
    
    this.previewSystem = {
      item,
      position: validPosition,
      isValid: !collisionResult.hasCollision,
      collisionResult
    }
    
    // 미리보기 렌더링
    this.renderPreview()
    
    // 콜백 호출
    this.eventCallbacks.onPreviewUpdate?.(this.previewSystem)
  }

  /**
   * 미리보기 렌더링
   */
  private async renderPreview(): Promise<void> {
    if (!this.containers.preview || !this.previewSystem.item) return
    
    try {
      const PIXI = await loadPixi()
      
      // 기존 미리보기 제거
      this.containers.preview.removeChildren()
      
      const { item, position, isValid } = this.previewSystem
      
      // 미리보기 스프라이트 생성
      const texture = await PIXI.Assets.load(item.image_url)
      const sprite = new PIXI.Sprite(texture)
      
      // 위치 설정
      if (!position) return
      const isoPos = gridToIso(position.x, position.y, position.z, this.config)
      sprite.x = isoPos.x
      sprite.y = isoPos.y
      
      // 시각적 효과
      sprite.alpha = 0.7
      sprite.tint = isValid ? 0x00ff00 : 0xff0000 // 녹색: 유효, 빨간색: 충돌
      
      // Z-index 설정
      sprite.zIndex = position.z * 1000 + position.y * 10 + position.x
      
      this.containers.preview.addChild(sprite)
      
    } catch (error) {
      console.error('❌ 미리보기 렌더링 실패:', error)
    }
  }

  /**
   * 미리보기 초기화
   */
  private clearPreview(): void {
    if (this.containers.preview) {
      this.containers.preview.removeChildren()
    }
    
    this.previewSystem = {
      item: null,
      position: null,
      isValid: false,
      collisionResult: null
    }
  }

  /**
   * 아이템 배치
   */
  private placeItem(item: DecorationItem, position: Position3D): void {
    const validPosition = this.findValidPosition(item, position)
    if (!validPosition) {
      console.warn('❌ 유효한 배치 위치를 찾을 수 없습니다')
      return
    }
    
    // 콜백 호출
    this.eventCallbacks.onItemPlace?.(item, validPosition)
    
    console.log('✅ 아이템 배치 완료:', item.name, validPosition)
  }

  /**
   * 아이템 상호작용 처리
   */
  private handleItemInteraction(gridPos: Position3D): void {
    // 배치된 아이템 클릭 확인
    const clickedItem = this.getItemAtPosition(gridPos)
    if (clickedItem) {
      console.log('🎯 아이템 클릭:', clickedItem.id)
      // 아이템 선택/편집 처리
      return
    }
    
    // 빈 공간 클릭 시 미리보기 시작
    if (this.previewSystem.item) {
      this.updatePreview(this.previewSystem.item, gridPos)
    }
  }

  /**
   * 특정 위치의 아이템 찾기
   */
  private getItemAtPosition(gridPos: Position3D): PlacedItem | null {
    const gridKey = `${gridPos.x},${gridPos.y},${gridPos.z}`
    return this.collisionSystem.gridOccupancy.get(gridKey) || null
  }


  /**
   * 아이템 선택 (미리보기 시작)
   */
  selectItem(item: DecorationItem): void {
    this.previewSystem.item = item
    console.log('🎯 아이템 선택:', item.name)
  }

  /**
   * 배치된 아이템들 렌더링
   */
  async renderPlacedItems(placedItems: PlacedItem[], storeItems: DecorationItem[]): Promise<void> {
    if (!this.containers.items || !this.isInitialized) return

    try {
      const PIXI = await loadPixi()
      
      // 기존 아이템들 제거
      this.containers.items.removeChildren()
      
      // 충돌 검사 시스템 업데이트
      this.updateCollisionSystem(placedItems)
      
      // 아이템들을 z축 순서로 정렬
      const sortedItems = this.sortItemsByZIndex(placedItems)
      
      for (const placedItem of sortedItems) {
        const storeItem = storeItems.find(item => item.id === placedItem.itemId)
        if (!storeItem) continue

        await this.renderPlacedItem(placedItem, storeItem)
      }
      
      console.log('🎮 배치된 아이템들 렌더링 완료:', placedItems.length)
    } catch (error) {
      console.error('❌ 배치된 아이템들 렌더링 실패:', error)
    }
  }

  /**
   * 개별 배치된 아이템 렌더링
   */
  private async renderPlacedItem(placedItem: PlacedItem, storeItem: DecorationItem): Promise<void> {
    if (!this.containers.items) return

    try {
      const PIXI = await loadPixi()
      
      // 텍스처 로드
      const texture = await PIXI.Assets.load(storeItem.image_url)
      if (!texture) {
        console.warn('⚠️ 텍스처 로드 실패:', storeItem.image_url)
        return
      }

      // 스프라이트 생성
      const sprite = new PIXI.Sprite(texture)
      sprite.label = `item-${placedItem.id}`
      
      // 위치 설정 (그리드 좌표를 픽셀 좌표로 변환)
      const gridPosition: Position3D = placedItem.gridPosition ?? {
        x: placedItem.position_x,
        y: placedItem.position_y,
        z: placedItem.position_z
      }
      
      const isoPos = gridToIso(gridPosition.x, gridPosition.y, gridPosition.z, this.config)
      sprite.x = isoPos.x
      sprite.y = isoPos.y
      
      // z축 설정
      sprite.zIndex = gridPosition.z * 1000 + gridPosition.y * 10 + gridPosition.x
      
      // 앵커 포인트 설정
      sprite.anchor.set(0.5, 0.5)
      
      // 터치 이벤트 설정
      sprite.interactive = true
      sprite.on('pointerdown', () => {
        console.log('🎯 아이템 터치:', placedItem.id)
        // 아이템 클릭 이벤트는 외부에서 처리
        console.log('🎯 아이템 클릭됨:', placedItem.id)
      })
      
      this.containers.items.addChild(sprite)
      
    } catch (error) {
      console.error('❌ 아이템 렌더링 실패:', error)
    }
  }

  /**
   * 충돌 검사 시스템 업데이트
   */
  private updateCollisionSystem(placedItems: PlacedItem[]): void {
    this.collisionSystem.gridOccupancy.clear()
    this.collisionSystem.spatialIndex.clear()
    
    // 그리드 점유 상태 업데이트
    for (const item of placedItems) {
      const gridPosition: Position3D = item.gridPosition ?? {
        x: item.position_x,
        y: item.position_y,
        z: item.position_z
      }
      
      const gridKey = `${gridPosition.x},${gridPosition.y},${gridPosition.z}`
      this.collisionSystem.gridOccupancy.set(gridKey, item)
      
      // 공간 인덱스 업데이트
      const spatialKey = `${Math.floor(gridPosition.x / 10)},${Math.floor(gridPosition.y / 10)}`
      if (!this.collisionSystem.spatialIndex.has(spatialKey)) {
        this.collisionSystem.spatialIndex.set(spatialKey, [])
      }
      this.collisionSystem.spatialIndex.get(spatialKey)!.push(item)
    }
  }

  /**
   * 아이템들을 z축 순서로 정렬
   */
  private sortItemsByZIndex(placedItems: PlacedItem[]): PlacedItem[] {
    return [...placedItems].sort((a, b) => {
      const aZ = a.gridPosition?.z ?? a.position_z
      const bZ = b.gridPosition?.z ?? b.position_z
      return aZ - bZ
    })
  }

  /**
   * 캐릭터 렌더링 (비활성화 - 아이템 배치에 집중)
   */
  async renderCharacter(characterData: CharacterData): Promise<any> {
    // 캐릭터 렌더링 비활성화 - 아이템 배치 기능에 집중
    console.log('🎭 캐릭터 렌더링 비활성화됨 (아이템 배치에 집중)')
    return null
  }

  /**
   * 바닥 타일 렌더링
   */
  async renderFloorTiles(floorTileConfig: any): Promise<void> {
    if (!this.containers.floor) return

    try {
      const PIXI = await loadPixi()
      
      // 기존 바닥 타일 제거
      this.containers.floor.removeChildren()
      
      // 바닥 타일 설정
      const config = floorTileConfig || {
        type: 'default',
        pattern: 'checkerboard',
        lightColor: 0xD2B48C,
        darkColor: 0xA0522D,
        opacity: 0.8
      }
      
      // 그리드 범위 설정
      const halfSize = 15
      
      // 바닥 타일 렌더링
      for (let y = -halfSize; y <= halfSize; y++) {
        for (let x = -halfSize; x <= halfSize; x++) {
          const isoPos = gridToIso(x + 0.5, y + 0.5, 0, this.config)
          
          const floorTile = new PIXI.Graphics()
          
          // 패턴에 따른 색상 결정
          let tileColor: number
          if (config.pattern === 'solid') {
            tileColor = config.lightColor || 0xD2B48C
          } else {
            // 체스판 패턴 (기본)
            const isLight = (x + y) % 2 === 0
            tileColor = isLight ? (config.lightColor || 0xD2B48C) : (config.darkColor || 0xA0522D)
          }
          
          // 타일 그리기 (PixiJS v8 호환)
          floorTile.fill({ color: tileColor, alpha: config.opacity || 0.8 })
          floorTile.moveTo(0, -this.config.tileHeight / 2)
          floorTile.lineTo(this.config.tileWidth / 2, 0)
          floorTile.lineTo(0, this.config.tileHeight / 2)
          floorTile.lineTo(-this.config.tileWidth / 2, 0)
          floorTile.lineTo(0, -this.config.tileHeight / 2)
          
          floorTile.x = isoPos.x
          floorTile.y = isoPos.y
          floorTile.zIndex = -1000
          
          this.containers.floor.addChild(floorTile)
        }
      }
      
      console.log('🏗️ 바닥 타일 렌더링 완료')
    } catch (error) {
      console.error('❌ 바닥 타일 렌더링 실패:', error)
    }
  }

  /**
   * 이벤트 콜백 설정 (아이템 클릭 추가)
   */
  setEventCallbacks(callbacks: Partial<typeof this.eventCallbacks & { onItemClick?: (item: PlacedItem) => void }>): void {
    this.eventCallbacks = { ...this.eventCallbacks, ...callbacks }
  }

  /**
   * 리소스 정리
   */
  destroy(): void {
    try {
      if (this.app) {
        this.app.destroy(true)
        this.app = null
      }
      
      this.containers = {}
      this.isInitialized = false
      this.touchManager.activeTouches.clear()
      this.collisionSystem.gridOccupancy.clear()
      this.collisionSystem.spatialIndex.clear()
      
      console.log('🧹 통합 캔버스 매니저 정리 완료')
    } catch (error) {
      console.error('❌ 통합 캔버스 매니저 정리 중 오류:', error)
    }
  }
}

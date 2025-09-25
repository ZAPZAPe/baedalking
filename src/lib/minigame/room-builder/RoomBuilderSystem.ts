/**
 * 🏠 Room Builder System - 방꾸미기 메인 시스템
 * 
 * 주요 기능:
 * - 상점 → 인벤토리 → 3D 배치 플로우
 * - 복셀 기반 충돌 처리 및 Z축 보상
 * - 모바일 친화적 D-Pad 컨트롤
 * - 캐릭터 자동 숨김/재생성
 */

import * as PIXI from 'pixi.js'
import { PlacementController } from './PlacementController'
import { VoxelCollisionManager } from './VoxelCollisionManager'
import { CharacterAutoNavigator } from './CharacterAutoNavigator'
import { IsometricUtils } from '../IsometricUtils'

export interface ItemData {
  id: string
  name: string
  description: string
  category: string
  sub_category?: string
  image_url: string
  pixel_data: {
    imageScale: number
    imageOffset: { x: number, y: number }
    voxelData: VoxelData[]
    dimensions: { width: number, height: number, depth: number }
  }
  price: number
  isPlaced?: boolean
  placementId?: string
}

export interface VoxelData {
  x: number
  y: number
  z: number
}

export interface PlacedItem {
  id: string
  itemData: ItemData
  position: { x: number, y: number, z: number }
  sprite: PIXI.Sprite
  voxels: VoxelData[] // 실제 월드 좌표의 복셀들
}

export interface RoomBuilderConfig {
  app: PIXI.Application
  objectContainer: PIXI.Container
  userId?: string
  onItemSelect?: (item: ItemData) => void
  onPlacementComplete?: (item: PlacedItem) => void
  onPlacementCancel?: () => void
}

export class RoomBuilderSystem {
  private app: PIXI.Application
  private objectContainer: PIXI.Container
  private userId?: string
  
  // 하위 시스템들
  private placementController: PlacementController
  private collisionManager: VoxelCollisionManager
  private characterNavigator: CharacterAutoNavigator
  
  // 배치된 아이템 관리
  private placedItems: Map<string, PlacedItem> = new Map()
  
  // 현재 배치 모드 상태
  private isPlacementMode: boolean = false
  private currentPlacingItem: ItemData | null = null
  private placementPreview: PIXI.Container | null = null
  
  // UI 요소들
  private uiLayer: PIXI.Container
  private feedbackText: PIXI.Text | null = null
  
  // 콜백 함수들
  private onItemSelect?: (item: ItemData) => void
  private onPlacementComplete?: (item: PlacedItem) => void
  private onPlacementCancel?: () => void
  
  // 그리드 설정
  private readonly GRID_MIN = -10
  private readonly GRID_MAX = 9
  private readonly GRID_SIZE = 20
  
  // Z축 설정
  private readonly MAX_Z_LEVEL = 5
  private readonly Z_STEP = 0.5 // Z축 보상 단위
  
  // 렌더 순서 계산: 타일 순서 + Z 보상(우선순위 높게)
  private getRenderZIndex(gridX: number, gridY: number, gridZ: number): number {
    // 등각뷰에서는 화면상 아래쪽(큰 screenY)이 위에, 동일 Y에서는 screenX로 안정화.
    // 동시에, Z축(층)이 하나라도 높으면 항상 위로 오도록 강한 가중치를 부여.
    const { screenX, screenY } = IsometricUtils.toScreenCoords(gridX, gridY, gridZ)
    const sy = Math.round(screenY * 10)
    const sx = Math.round(screenX * 10)
    const zSteps = Math.round(gridZ / this.Z_STEP)
    
    // Z가 한 단계라도 높으면 화면 좌표 차이를 압도하도록 큰 가중치 적용
    const Z_WEIGHT = 10_000_000
    const BASE_SCALE_Y = 10_000
    const OFFSET = 1_000_000_000
    
    return OFFSET + (zSteps * Z_WEIGHT) + (sy * BASE_SCALE_Y) + sx
  }

  constructor(config: RoomBuilderConfig) {
    this.app = config.app
    this.objectContainer = config.objectContainer
    this.userId = config.userId
    this.onItemSelect = config.onItemSelect
    this.onPlacementComplete = config.onPlacementComplete
    this.onPlacementCancel = config.onPlacementCancel
    
    // UI 레이어 초기화
    this.uiLayer = new PIXI.Container()
    this.uiLayer.zIndex = 10000
    this.app.stage.addChild(this.uiLayer)
    
    // 하위 시스템 초기화
    this.collisionManager = new VoxelCollisionManager({
      gridMin: this.GRID_MIN,
      gridMax: this.GRID_MAX,
      maxZ: this.MAX_Z_LEVEL
    })
    
    this.placementController = new PlacementController({
      app: this.app,
      container: this.objectContainer,
      uiLayer: this.uiLayer,
      onMove: (x: number, y: number) => this.handlePreviewMove(x, y),
      onPlace: async () => await this.handleItemPlace(),
      onCancel: () => this.cancelPlacementMode()
    })
    
    this.characterNavigator = new CharacterAutoNavigator({
      objectContainer: this.objectContainer,
      collisionManager: this.collisionManager,
      gridMin: this.GRID_MIN,
      gridMax: this.GRID_MAX
    })
    
    // 기존 배치 데이터 로드 (비동기로 처리)
    this.loadExistingPlacements().catch(error => {
      console.error('❌ 기존 배치 데이터 로드 실패:', error)
    })
  }
  
  /**
   * 📦 배치 모드 시작
   */
  public async startPlacementMode(item: ItemData): Promise<void> {
    console.log('🏗️ 배치 모드 시작:', item.name)
    
    // 이미 배치 모드인 경우 취소
    if (this.isPlacementMode) {
      this.cancelPlacementMode()
    }
    
    this.isPlacementMode = true
    this.currentPlacingItem = item
    
    // 캐릭터 숨기기
    this.characterNavigator.hideCharacter()
    
    // 배치 미리보기 생성 (비동기)
    await this.createPlacementPreview(item)
    
    // 배치 컨트롤러 활성화
    this.placementController.activate(this.placementPreview!)
    
    // 피드백 표시
    this.showFeedback('상하좌우 버튼으로 이동, 체크 버튼으로 배치')
  }
  
  /**
   * 🖼️ 배치 미리보기 생성
   */
  private async createPlacementPreview(item: ItemData): Promise<void> {
    if (this.placementPreview) {
      this.placementPreview.destroy()
    }
    
    this.placementPreview = new PIXI.Container()
    
    // 아이템 이미지 스프라이트 생성 (비동기)
    let sprite: PIXI.Sprite
    
    try {
      if (this.isValidImageUrl(item.image_url)) {
        const texture = await PIXI.Assets.load(item.image_url)
        sprite = new PIXI.Sprite(texture)
        console.log('✅ 미리보기 이미지 로드 성공:', item.image_url)
      } else {
        throw new Error(`유효하지 않은 이미지 URL: ${item.image_url}`)
      }
    } catch (error) {
      console.error('❌ 미리보기 이미지 로드 실패:', item.image_url, error)
      sprite = this.createFallbackSprite(item.name)
    }
    
    // 픽셀 데이터의 스케일과 오프셋 적용
    const scale = item.pixel_data.imageScale || 1.0
    sprite.scale.set(scale, scale)
    
    const offset = item.pixel_data.imageOffset || { x: 0, y: 0 }
    sprite.x = offset.x
    sprite.y = offset.y
    
    // 미리보기 격자와 동일한 Y 보정 적용 (이미지와 격자가 함께 움직이도록)
    const hh = (IsometricUtils as any).TILE_HEIGHT ? (IsometricUtils as any).TILE_HEIGHT / 2 : 25
    const yBias = hh * 0.40 // drawVoxelPreview와 동일한 보정 값
    sprite.y += yBias
    
    sprite.anchor.set(0.5, 1.0)
    sprite.alpha = 0.7
    
    // 복셀 영역 표시 (디버그용)
    const voxelGraphics = new PIXI.Graphics()
    this.drawVoxelPreview(voxelGraphics, item.pixel_data.voxelData)
    
    this.placementPreview.addChild(voxelGraphics)
    this.placementPreview.addChild(sprite)
    
    // 초기 위치 설정 (그리드 중앙)
    const { screenX, screenY } = IsometricUtils.toScreenCoords(0, 0, 0)
    this.placementPreview.x = screenX
    this.placementPreview.y = screenY
    this.placementPreview.zIndex = this.getRenderZIndex(0, 0, 0)
    
    this.objectContainer.addChild(this.placementPreview)
    this.objectContainer.sortChildren()
  }
  
  /**
   * 📐 복셀 미리보기 그리기
   */
  private drawVoxelPreview(graphics: PIXI.Graphics, voxelData: VoxelData[]): void {
    graphics.clear()
    
    // 타일 크기와 반값 사용 (타일 그리드와 동일 기준)
    const hw = (IsometricUtils as any).TILE_WIDTH ? (IsometricUtils as any).TILE_WIDTH / 2 : 50
    const hh = (IsometricUtils as any).TILE_HEIGHT ? (IsometricUtils as any).TILE_HEIGHT / 2 : 25
    
    // 원점(0,0,0)의 스크린 좌표를 기준으로 상대 좌표로 그리기
    const origin = IsometricUtils.toScreenCoords(0, 0, 0)
    
    // 미세 정렬 보정: 격자가 살짝 위로 보였던 현상 보정 (약 hh*0.40 만큼 아래로)
    const yBias = hh * 0.40
    
    voxelData.forEach(voxel => {
      const p = IsometricUtils.toScreenCoords(voxel.x, voxel.y, voxel.z)
      const dx = p.screenX - origin.screenX
      const dy = (p.screenY - origin.screenY) + yBias
      
      // 복셀 큐브(타일 다이아몬드) 그리기 - 타일 그리드와 동일 치수 사용
      graphics.lineStyle(2, 0x00ff00, 0.3)
      graphics.beginFill(0x00ff00, 0.1)
      graphics.moveTo(dx, dy - hh)      // 상단
      graphics.lineTo(dx + hw, dy)      // 우측
      graphics.lineTo(dx, dy + hh)      // 하단
      graphics.lineTo(dx - hw, dy)      // 좌측
      graphics.closePath()
      graphics.endFill()
    })
  }
  
  /**
   * 🎮 미리보기 이동 처리
   */
  private handlePreviewMove(gridX: number, gridY: number): void {
    if (!this.placementPreview || !this.currentPlacingItem) return
    
    // 그리드 범위 체크
    gridX = Math.max(this.GRID_MIN, Math.min(this.GRID_MAX, gridX))
    gridY = Math.max(this.GRID_MIN, Math.min(this.GRID_MAX, gridY))
    
    // Z축 보상 계산
    const zOffset = this.collisionManager.calculateZOffset(
      gridX, 
      gridY, 
      this.currentPlacingItem.pixel_data.voxelData
    )
    // 정수 층으로 스냅 (소수 오차 제거)
    const steps = Math.round(zOffset / this.Z_STEP)
    const snappedZ = steps * this.Z_STEP
    
    // 충돌 체크
    const canPlace = this.collisionManager.canPlaceItem(
      gridX,
      gridY, 
      snappedZ,
      this.currentPlacingItem.pixel_data.voxelData
    )
    
    // 미리보기 위치 업데이트
    const { screenX, screenY } = IsometricUtils.toScreenCoords(gridX, gridY, snappedZ)
    this.placementPreview.x = screenX
    this.placementPreview.y = screenY
    this.placementPreview.zIndex = this.getRenderZIndex(gridX, gridY, snappedZ)
    this.objectContainer.sortChildren()
    
    // 미리보기 색상 변경 (배치 가능 여부)
    const sprite = this.placementPreview.children.find(child => child instanceof PIXI.Sprite) as PIXI.Sprite
    if (sprite) {
      sprite.tint = canPlace ? 0xffffff : 0xff6666
    }
    
    // 피드백 업데이트
    if (!canPlace) {
      this.showFeedback('이 위치에는 배치할 수 없습니다', 0xff4444)
    } else if (snappedZ > 0) {
      const supportingName = this.getSupportingItemNameForFootprint(gridX, gridY, this.currentPlacingItem.pixel_data.voxelData)
      if (supportingName) {
        this.showFeedback(`${supportingName} 위에 배치됩니다`, 0xffaa00)
      } else {
        this.showFeedback('기존 아이템 위에 배치됩니다', 0xffaa00)
      }
    } else {
      this.showFeedback('체크 버튼으로 배치', 0x00ff00)
    }
  }
  
  /**
   * ✅ 아이템 배치 처리
   */
  private async handleItemPlace(): Promise<void> {
    if (!this.currentPlacingItem || !this.placementPreview) {
      console.error('❌ 배치 모드가 활성화되지 않았습니다:', {
        currentPlacingItem: this.currentPlacingItem,
        placementPreview: this.placementPreview
      })
      return
    }
    
    const currentPos = this.placementController.getCurrentPosition()
    if (!currentPos) {
      console.error('❌ 현재 위치를 가져올 수 없습니다')
      return
    }
    
    console.log('🏗️ 아이템 배치 시작:', {
      item: this.currentPlacingItem.name,
      position: currentPos
    })
    
    // Z축 보상 계산
    const zOffset = this.collisionManager.calculateZOffset(
      currentPos.x,
      currentPos.y,
      this.currentPlacingItem.pixel_data.voxelData
    )
    const steps = Math.round(zOffset / this.Z_STEP)
    const snappedZ = steps * this.Z_STEP
    
    // 최종 충돌 체크
    if (!this.collisionManager.canPlaceItem(
      currentPos.x,
      currentPos.y,
      snappedZ,
      this.currentPlacingItem.pixel_data.voxelData
    )) {
      this.showFeedback('이 위치에는 배치할 수 없습니다!', 0xff0000)
      return
    }
    
    try {
      // 서버에 배치 정보 저장
      const success = await this.saveItemPlacement(
        this.currentPlacingItem,
        currentPos.x,
        currentPos.y,
        snappedZ
      )
      
      if (success) {
        // 로컬에 아이템 배치
        await this.placeItemLocally(
          this.currentPlacingItem,
          currentPos.x,
          currentPos.y,
          snappedZ
        )
        
        this.showFeedback('아이템이 배치되었습니다!', 0x00ff00)
        
        // 배치 모드 종료
        this.endPlacementMode()
      } else {
        this.showFeedback('배치에 실패했습니다', 0xff0000)
      }
    } catch (error) {
      console.error('❌ 아이템 배치 오류:', error)
      this.showFeedback('배치 중 오류가 발생했습니다', 0xff0000)
    }
  }
  
  
  /**
   * 📍 로컬에 아이템 배치
   */
  private async placeItemLocally(
    item: ItemData,
    gridX: number,
    gridY: number,
    gridZ: number
  ): Promise<void> {
    // 아이템 데이터 유효성 검사
    if (!item || !item.image_url) {
      console.error('❌ 유효하지 않은 아이템 데이터:', item)
      return
    }
    
    const placementId = `placed_${Date.now()}_${Math.random()}`
    
    // 이미지 URL 검증
    console.log('🖼️ 이미지 URL 검증:', {
      originalUrl: item.image_url,
      isValidUrl: item.image_url && typeof item.image_url === 'string',
      urlLength: item.image_url?.length || 0
    })
    
    // 이미지 프리로딩 및 스프라이트 생성
    let sprite: PIXI.Sprite
    
    try {
      // 이미지 URL이 유효한지 확인
      if (!this.isValidImageUrl(item.image_url)) {
        throw new Error(`유효하지 않은 이미지 URL: ${item.image_url}`)
      }
      
      // 이미지 프리로딩
      console.log('🔄 이미지 프리로딩 시작:', item.image_url)
      const texture = await PIXI.Assets.load(item.image_url)
      
      if (!texture || texture.width <= 0 || texture.height <= 0) {
        throw new Error(`로드된 텍스처가 유효하지 않음: ${texture?.width}x${texture?.height}`)
      }
      
      console.log('✅ 이미지 프리로딩 성공:', {
        url: item.image_url,
        width: texture.width,
        height: texture.height,
        label: texture.label
      })
      
      // 스프라이트 생성
      sprite = new PIXI.Sprite(texture)
      
    } catch (error) {
      console.error('❌ 이미지 로딩 실패:', item.image_url, error)
      
      // 대체 이미지 생성 (빨간색 사각형)
      sprite = this.createFallbackSprite(item.name)
    }
    
    // 스프라이트 설정
    const scale = item.pixel_data.imageScale || 1.0
    sprite.scale.set(scale, scale)
    
    const offset = item.pixel_data.imageOffset || { x: 0, y: 0 }
    sprite.anchor.set(0.5, 1.0)
    
    // 위치 설정
    const { screenX, screenY } = IsometricUtils.toScreenCoords(gridX, gridY, gridZ)
    sprite.x = screenX + offset.x
    // 미리보기와 동일한 Y 보정 적용
    {
      const hh = (IsometricUtils as any).TILE_HEIGHT ? (IsometricUtils as any).TILE_HEIGHT / 2 : 25
      const yBias = hh * 0.40
      sprite.y = screenY + offset.y + yBias
    }
    
    // Z-order 설정
    sprite.zIndex = this.getRenderZIndex(gridX, gridY, gridZ)
    
    // 스프라이트 속성 설정
    sprite.visible = true
    sprite.alpha = 1.0
    
    this.objectContainer.addChild(sprite)
    this.objectContainer.sortChildren()
    
    // 최종 상태 로그
    console.log('🏠 아이템 배치 완료:', {
      name: item.name,
      imageUrl: item.image_url,
      position: { x: gridX, y: gridY, z: gridZ },
      screenPosition: { x: sprite.x, y: sprite.y },
      scale: sprite.scale.x,
      visible: sprite.visible,
      alpha: sprite.alpha,
      textureSize: sprite.texture ? { width: sprite.texture.width, height: sprite.texture.height } : null,
      textureLabel: sprite.texture?.label || 'unknown'
    })
    
    // 월드 좌표의 실제 복셀 계산
    const worldVoxels = item.pixel_data.voxelData.map(voxel => ({
      x: gridX + voxel.x,
      y: gridY + voxel.y,
      z: gridZ + voxel.z
    }))
    
    // 배치된 아이템 저장
    const placedItem: PlacedItem = {
      id: placementId,
      itemData: item,
      position: { x: gridX, y: gridY, z: gridZ },
      sprite,
      voxels: worldVoxels
    }
    
    this.placedItems.set(placementId, placedItem)
    
    // 충돌 맵에 등록
    this.collisionManager.registerItem(placementId, worldVoxels)
    
    // 콜백 호출
    if (this.onPlacementComplete) {
      this.onPlacementComplete(placedItem)
    }
  }
  
  /**
   * 💾 서버에 배치 정보 저장
   */
  private async saveItemPlacement(
    item: ItemData,
    x: number,
    y: number,
    z: number
  ): Promise<boolean> {
    if (!this.userId) return true // 로그인하지 않은 경우 로컬만
    
    try {
      const response = await fetch('/api/place-item', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: this.userId,
          itemId: item.id,
          positionX: x,
          positionY: y,
          positionZ: z,
          voxelData: item.pixel_data.voxelData
        })
      })
      
      return response.ok
    } catch (error) {
      console.error('❌ 서버 저장 실패:', error)
      return false
    }
  }
  
  /**
   * 🛑 배치 모드 종료
   */
  private endPlacementMode(): void {
    this.isPlacementMode = false
    this.currentPlacingItem = null
    
    // 미리보기 제거
    if (this.placementPreview) {
      this.placementPreview.destroy()
      this.placementPreview = null
    }
    
    // 컨트롤러 비활성화
    this.placementController.deactivate()
    
    // 캐릭터 재생성 (빈 공간에)
    const emptySpot = this.findEmptySpot()
    if (emptySpot) {
      this.characterNavigator.respawnCharacter(emptySpot.x, emptySpot.y)
    }
  }
  
  /**
   * ❌ 배치 모드 취소
   */
  public cancelPlacementMode(): void {
    console.log('🚫 배치 모드 취소')
    
    this.endPlacementMode()
    
    if (this.onPlacementCancel) {
      this.onPlacementCancel()
    }
    
    this.showFeedback('배치가 취소되었습니다', 0xffaa00)
  }
  
  /**
   * 🔍 빈 공간 찾기
   */
  private findEmptySpot(): { x: number, y: number } | null {
    // 중심(0,0)에서 가장 가까운 빈 타일을 BFS로 탐색 (z=0 고정)
    const start = { x: 0, y: 0 }
    const visited = new Set<string>()
    const queue: { x: number, y: number }[] = []
    const key = (x: number, y: number) => `${x},${y}`
    
    const inBounds = (x: number, y: number) => (
      x >= this.GRID_MIN && x <= this.GRID_MAX &&
      y >= this.GRID_MIN && y <= this.GRID_MAX
    )
    
    queue.push(start)
    visited.add(key(start.x, start.y))
    
    const dirs = [
      { dx: 0, dy: -1 },
      { dx: 1, dy: 0 },
      { dx: 0, dy: 1 },
      { dx: -1, dy: 0 }
    ]
    
    while (queue.length > 0) {
      const cur = queue.shift()!
      if (this.collisionManager.isEmptyAt(cur.x, cur.y, 0)) {
        return cur
      }
      for (const d of dirs) {
        const nx = cur.x + d.dx
        const ny = cur.y + d.dy
        if (!inBounds(nx, ny)) continue
        const k = key(nx, ny)
        if (visited.has(k)) continue
        visited.add(k)
        queue.push({ x: nx, y: ny })
      }
    }
    
    // 실패 시 안전 기본값
    return { x: 0, y: 0 }
  }
  
  /**
   * 📝 피드백 메시지 표시
   */
  private showFeedback(message: string, color: number = 0xffffff): void {
    if (this.feedbackText) {
      this.feedbackText.destroy()
    }
    
    this.feedbackText = new PIXI.Text(message, {
      fontFamily: 'Arial',
      fontSize: 16,
      fill: color,
      stroke: { color: '#000000', width: 4 },
      align: 'center'
    })
    
    this.feedbackText.anchor.set(0.5)
    this.feedbackText.x = this.app.screen.width / 2
    this.feedbackText.y = 100
    
    this.uiLayer.addChild(this.feedbackText)
    
    // 3초 후 자동 제거
    setTimeout(() => {
      if (this.feedbackText) {
        this.feedbackText.destroy()
        this.feedbackText = null
      }
    }, 3000)
  }
  
  /**
   * 🗑️ 아이템 제거
   */
  public removeItem(placementId: string): void {
    const item = this.placedItems.get(placementId)
    if (!item) return
    
    // 스프라이트 제거
    item.sprite.destroy()
    
    // 충돌 맵에서 제거
    this.collisionManager.unregisterItem(placementId)
    
    // 맵에서 제거
    this.placedItems.delete(placementId)
    
    console.log('🗑️ 아이템 제거됨:', placementId)
  }
  
  /**
   * 🔄 아이템 회수 (itemId로 찾기)
   */
  public recallItemByItemId(itemId: string): boolean {
    // 배치된 아이템 중 해당 itemId와 매칭되는 첫 항목 찾기
    for (const [placementId, placed] of this.placedItems.entries()) {
      if (placed.itemData?.id === itemId) {
        this.removeItem(placementId)
        console.log('🔄 아이템 회수 완료:', { itemId, placementId })
        // 서버 반영 (사용자 로그인된 경우)
        if (this.userId) {
          this.syncRecallToServer(this.userId, itemId).catch(err => {
            console.warn('⚠️ 서버 회수 반영 실패(로컬 유지):', err)
          })
        }
        return true
      }
    }
    console.warn('⚠️ 회수할 배치 아이템을 찾지 못함:', itemId)
    return false
  }

  /**
   * 💾 서버에 회수 반영
   */
  private async syncRecallToServer(userId: string, itemId: string): Promise<void> {
    try {
      const res = await fetch('/api/recall-item', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, itemId })
      })
      if (!res.ok) {
        const text = await res.text()
        throw new Error(text || `HTTP ${res.status}`)
      }
      console.log('✅ 서버 회수 반영 완료:', { userId, itemId })
    } catch (e) {
      throw e
    }
  }

  /**
   * 📦 기존 배치 데이터 로드
   */
  private async loadExistingPlacements(): Promise<void> {
    if (!this.userId) {
      console.log('❌ userId가 없어서 배치 데이터를 로드할 수 없습니다')
      return
    }
    
    console.log('🔄 기존 배치 데이터 로드 시작...', { userId: this.userId })
    
    try {
      const response = await fetch(`/api/garage-placements?userId=${this.userId}`)
      if (!response.ok) {
        console.error('❌ API 응답 실패:', response.status, response.statusText)
        return
      }
      
      const data = await response.json()
      console.log('📡 API 응답 데이터:', data)
      
      const { placements } = data
      if (!placements || !Array.isArray(placements)) {
        console.warn('⚠️ placements 데이터가 없거나 배열이 아닙니다:', placements)
        return
      }
      
      console.log(`📦 ${placements.length}개의 배치 데이터 발견`)
      
      for (let index = 0; index < placements.length; index++) {
        const placement = placements[index]
        console.log(`🔍 배치 ${index + 1} 분석:`, {
          placementId: placement.id,
          position: { x: placement.position_x, y: placement.position_y, z: placement.position_z },
          shopItems: placement.shop_items
        })
        
        // API 응답 구조에 맞게 아이템 데이터 추출
        const itemData = placement.shop_items
        
        // 아이템 데이터 유효성 검사
        if (!itemData) {
          console.warn('⚠️ shop_items가 없습니다:', placement)
          continue
        }
        
        if (!itemData.image_url) {
          console.warn('⚠️ image_url이 없습니다:', itemData)
          continue
        }
        
        console.log('✅ 유효한 배치 데이터 확인:', {
          name: itemData.name,
          imageUrl: itemData.image_url,
          position: { x: placement.position_x, y: placement.position_y, z: placement.position_z }
        })
        
        // 기존 배치 복원
        await this.placeItemLocally(
          itemData,
          placement.position_x,
          placement.position_y,
          placement.position_z || 0
        )
      }
      
      console.log(`✅ ${placements.length}개의 기존 아이템 로드 완료`)
    } catch (error) {
      console.error('❌ 기존 배치 로드 실패:', error)
    }
  }
  
  /**
   * 🔄 시스템 업데이트 (매 프레임)
   */
  public update(deltaTime: number): void {
    // 캐릭터 자동 이동 업데이트
    if (!this.isPlacementMode) {
      this.characterNavigator.update(deltaTime)
    }
  }
  
  /**
   * 🧹 정리
   */
  public destroy(): void {
    this.cancelPlacementMode()
    
    // 모든 배치된 아이템 제거
    this.placedItems.forEach(item => {
      item.sprite.destroy()
    })
    this.placedItems.clear()
    
    // 하위 시스템 정리
    this.placementController.destroy()
    this.characterNavigator.destroy()
    
    // UI 레이어 제거
    this.uiLayer.destroy()
  }
  
  // Getter 메서드들
  public getPlacedItems(): Map<string, PlacedItem> {
    return this.placedItems
  }
  
  public isInPlacementMode(): boolean {
    return this.isPlacementMode
  }
  
  public getCollisionManager(): VoxelCollisionManager {
    return this.collisionManager
  }
  
  public getCharacterNavigator(): CharacterAutoNavigator {
    return this.characterNavigator
  }
  
  /**
   * 🧱 발자국 전체에서 가장 위에 있는 지지 아이템 이름 찾기
   */
  private getSupportingItemNameForFootprint(
    baseX: number,
    baseY: number,
    footprint: VoxelData[]
  ): string | null {
    let bestPlacementId: string | null = null
    let bestZ = -Infinity
    
    for (const voxel of footprint) {
      const worldX = baseX + voxel.x
      const worldY = baseY + voxel.y
      // 아래에서 위로 스캔하여 가장 높은 점유를 찾음
      for (let z = 0; z <= this.MAX_Z_LEVEL; z += this.Z_STEP) {
        const pid = this.collisionManager.getItemAt(worldX, worldY, z)
        if (pid !== null) {
          if (z > bestZ) {
            bestZ = z
            bestPlacementId = pid
          }
        }
      }
    }
    if (!bestPlacementId) return null
    const placed = this.placedItems.get(bestPlacementId)
    return placed?.itemData?.name || null
  }
  
  /**
   * 🔍 이미지 URL 유효성 검사
   */
  private isValidImageUrl(url: string): boolean {
    if (!url || typeof url !== 'string') {
      return false
    }
    
    // 기본적인 URL 형식 검사
    try {
      const urlObj = new URL(url, window.location.origin)
      return urlObj.protocol === 'http:' || urlObj.protocol === 'https:' || urlObj.protocol === 'data:'
    } catch {
      // 상대 경로인 경우
      return url.startsWith('/') || url.startsWith('./') || url.startsWith('../')
    }
  }
  
  /**
   * 🎨 대체 스프라이트 생성 (이미지 로딩 실패 시)
   */
  private createFallbackSprite(itemName: string): PIXI.Sprite {
    // 빨간색 사각형 그래픽 생성
    const graphics = new PIXI.Graphics()
    graphics.beginFill(0xff0000, 0.8)
    graphics.drawRect(0, 0, 64, 64)
    graphics.endFill()
    
    // 텍스트 추가
    const text = new PIXI.Text(itemName, {
      fontFamily: 'Arial',
      fontSize: 12,
      fill: 0xffffff,
      align: 'center'
    })
    text.anchor.set(0.5)
    text.x = 32
    text.y = 32
    
    // 컨테이너에 그래픽과 텍스트 추가
    const container = new PIXI.Container()
    container.addChild(graphics)
    container.addChild(text)
    
    // 컨테이너를 텍스처로 변환
    const texture = this.app.renderer.generateTexture(container)
    const sprite = new PIXI.Sprite(texture)
    
    console.log('🎨 대체 스프라이트 생성:', itemName)
    
    return sprite
  }
}

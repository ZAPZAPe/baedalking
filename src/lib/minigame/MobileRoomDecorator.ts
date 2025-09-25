/**
 * 🏠 모바일 중심 방꾸미기 시스템
 * - 단일 배치 시스템으로 중복 방지
 * - 터치 기반 직관적 인터페이스
 * - 상점 → 인벤토리 → 3D 배치 플로우
 */

import * as PIXI from 'pixi.js'
import { IsometricUtils } from './IsometricUtils'

export interface PlacedItem {
  id: string
  item: any
  container: PIXI.Container
  gridX: number
  gridY: number
  gridZ: number
}

export interface PlacementPreview {
  container: PIXI.Container
  sprite: PIXI.Sprite
  gridIndicator: PIXI.Graphics
}

export class MobileRoomDecorator {
  private app: PIXI.Application
  private worldContainer: PIXI.Container
  private placedItems: Map<string, PlacedItem> = new Map()
  
  // 배치 모드 상태
  private isPlacementMode = false
  private selectedItem: any = null
  private placementPreview: PlacementPreview | null = null
  
  // 터치/마우스 상태
  private isDragging = false
  private lastTouchTime = 0
  private touchStartPos = { x: 0, y: 0 }
  
  // 그리드 설정
  private readonly GRID_SIZE = 20
  private readonly GRID_MIN = -10
  private readonly GRID_MAX = 9
  
  // 사용자 정보
  private userId?: string
  
  // 🎮 캐릭터와 UI 참조
  private characterSprite?: PIXI.Sprite
  private emotionContainer?: PIXI.Container
  private arrowControlsContainer?: PIXI.Container
  
  // 📐 미리보기 위치
  private previewGridX = 0
  private previewGridY = 0

  constructor(app: PIXI.Application, worldContainer: PIXI.Container, userId?: string) {
    if (!app) {
      throw new Error('PIXI Application이 제공되지 않았습니다')
    }
    if (!worldContainer) {
      throw new Error('worldContainer가 제공되지 않았습니다')
    }
    
    this.app = app
    this.worldContainer = worldContainer
    this.userId = userId
    
    this.setupMobileControls()
    console.log('🏠 모바일 방꾸미기 시스템 초기화 완료')
  }

  /**
   * 🎮 캐릭터와 감정표현 참조 설정
   */
  public setCharacterReferences(characterSprite?: PIXI.Sprite, emotionContainer?: PIXI.Container) {
    this.characterSprite = characterSprite
    this.emotionContainer = emotionContainer
    console.log('🎮 캐릭터 참조 설정됨:', !!characterSprite, !!emotionContainer)
  }

  /**
   * 🎯 아이템 배치 모드 시작
   */
  public startPlacementMode(item: any) {
    if (this.isPlacementMode) {
      this.cancelPlacementMode()
    }
    
    this.isPlacementMode = true
    this.selectedItem = item
    
    console.log('📱 모바일 배치 모드 시작:', item.name)
    
    // 🎮 캐릭터와 감정표현 숨기기
    this.hideCharacter()
    
    // 📐 미리보기 위치를 가운데로 설정 (0, 0)
    this.previewGridX = 0
    this.previewGridY = 0
    
    // 🎨 배치 미리보기 생성
    this.createPlacementPreview(item)
    
    // 🎮 화살표 컨트롤 생성
    this.createArrowControls()
    
    this.showPlacementInstructions()
  }

  /**
   * 🚫 배치 모드 취소
   */
  public cancelPlacementMode() {
    if (!this.isPlacementMode) return
    
    this.isPlacementMode = false
    this.selectedItem = null
    
    // 🎮 캐릭터와 감정표현 다시 보이기
    this.showCharacter()
    
    // 🎨 미리보기 제거
    if (this.placementPreview) {
      this.worldContainer.removeChild(this.placementPreview.container)
      this.placementPreview.container.destroy()
      this.placementPreview = null
    }
    
    // 🎮 화살표 컨트롤 제거
    this.removeArrowControls()
    
    this.hidePlacementInstructions()
    console.log('🚫 배치 모드 취소')
  }

  /**
   * 🎨 배치 미리보기 생성
   */
  private async createPlacementPreview(item: any) {
    try {
      const container = new PIXI.Container()
      
      // 그리드 위치 표시기
      const gridIndicator = new PIXI.Graphics()
      gridIndicator.fill({ color: 0x00ff00, alpha: 0.3 })
      gridIndicator.rect(-25, -25, 50, 50)
      gridIndicator.fill()
      gridIndicator.stroke({ color: 0x00ff00, width: 2 })
      gridIndicator.rect(-25, -25, 50, 50)
      gridIndicator.stroke()
      
      // 아이템 스프라이트
      let sprite: PIXI.Sprite | null = null
      if (item.image_url) {
        const texture = await PIXI.Assets.load(item.image_url)
        sprite = new PIXI.Sprite(texture)
        sprite.anchor.set(0.5, 1)
        sprite.alpha = 0.7 // 반투명으로 미리보기임을 표시
        sprite.tint = 0x88ff88 // 연한 초록색
        
        // 스케일 조정
        const scale = this.calculateItemScale(texture, item)
        sprite.scale.set(scale)
        
        container.addChild(sprite)
      }
      
      container.addChild(gridIndicator)
      container.zIndex = 1000 // 최상위 렌더링
      
      this.placementPreview = {
        container,
        sprite: sprite || new PIXI.Sprite(), // null 체크 추가
        gridIndicator
      }
      
      this.worldContainer.addChild(container)
      
      // 📐 초기 위치를 가운데(0, 0)로 설정
      this.updatePreviewPosition()
      
    } catch (error) {
      console.error('❌ 배치 미리보기 생성 실패:', error)
    }
  }

  /**
   * 📐 아이템 스케일 계산 (실제 dimensions 기반)
   */
  private calculateItemScale(texture: PIXI.Texture, item: any): number {
    // 🎯 아이템의 실제 dimensions 사용
    const dimensions = item.pixel_data?.dimensions || item.dimensions
    let dimensionScale = 1.0
    
    if (dimensions && (dimensions.width || dimensions.height)) {
      // dimensions가 있으면 그 크기에 맞춰 조정
      const maxDimension = Math.max(dimensions.width || 1, dimensions.height || 1)
      dimensionScale = maxDimension / 10 // 10픽셀을 1 단위로 계산 (조정 가능)
      console.log('📐 아이템 크기 적용:', item.name, 'dimensions:', dimensions, 'scale:', dimensionScale)
    }
    
    const baseScale = 0.8 // 모바일에서 적당한 크기
    const imageScale = item.pixel_data?.imageScale || item.imageScale || 1.0
    
    // 화면 크기에 따른 동적 스케일링 (반응형)
    const minScreenSize = Math.min(this.app.screen.width, this.app.screen.height)
    const screenScale = Math.max(0.3, Math.min(1.5, minScreenSize / 800)) // 최소/최대 제한
    
    return baseScale * imageScale * screenScale * dimensionScale
  }

  /**
   * 📱 화면 크기 변경 시 업데이트
   */
  public onScreenResize() {
    // 터치 영역 업데이트
    if (this.app && this.app.stage && this.app.screen) {
      this.app.stage.hitArea = this.app.screen
    }
    
    // 배치된 아이템들의 스케일 업데이트
    this.updatePlacedItemsScale()
    
    console.log('📱 MobileRoomDecorator 화면 크기 변경 대응 완료')
  }

  /**
   * 📏 배치된 아이템들의 스케일 업데이트
   */
  private updatePlacedItemsScale() {
    this.placedItems.forEach(placedItem => {
      // 아이템 컨테이너 내의 스프라이트 찾기
      const sprite = placedItem.container.children.find(child => child instanceof PIXI.Sprite) as PIXI.Sprite
      
      if (sprite && sprite.texture && placedItem.item) {
        const newScale = this.calculateItemScale(sprite.texture, placedItem.item)
        sprite.scale.set(newScale)
      }
    })
  }

  /**
   * 📱 모바일 터치 컨트롤 설정
   */
  private setupMobileControls() {
    try {
      if (!this.app || !this.app.stage || !this.app.screen) {
        throw new Error('PIXI App이 완전히 초기화되지 않았습니다')
      }
      
      this.app.stage.eventMode = 'static'
      this.app.stage.hitArea = this.app.screen
      
      // 터치/마우스 이벤트
      this.app.stage.on('pointerdown', this.onPointerDown.bind(this))
      this.app.stage.on('pointermove', this.onPointerMove.bind(this))
      this.app.stage.on('pointerup', this.onPointerUp.bind(this))
      
      // ESC 키로 배치 모드 취소
      window.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && this.isPlacementMode) {
          this.cancelPlacementMode()
        }
      })
      
      console.log('✅ 모바일 터치 컨트롤 설정 완료')
      
    } catch (error) {
      console.error('❌ 모바일 터치 컨트롤 설정 실패:', error)
      throw error
    }
  }

  /**
   * 👆 터치/클릭 시작
   */
  private onPointerDown(event: PIXI.FederatedPointerEvent) {
    const now = Date.now()
    this.touchStartPos = { x: event.global.x, y: event.global.y }
    this.isDragging = false
    
    // 더블 탭 감지 (모바일)
    const isDoubleTap = now - this.lastTouchTime < 300
    this.lastTouchTime = now
    
    if (this.isPlacementMode) {
      event.stopPropagation()
      return
    }
    
    // 배치된 아이템 선택/제거 (더블 탭)
    if (isDoubleTap) {
      this.handleItemRemoval(event.global.x, event.global.y)
    }
  }

  /**
   * 👆 터치/마우스 이동
   */
  private onPointerMove(event: PIXI.FederatedPointerEvent) {
    // 드래그 감지
    const distance = Math.sqrt(
      Math.pow(event.global.x - this.touchStartPos.x, 2) +
      Math.pow(event.global.y - this.touchStartPos.y, 2)
    )
    
    if (distance > 10) {
      this.isDragging = true
    }
    
    // 배치 모드에서 미리보기 업데이트
    if (this.isPlacementMode && this.placementPreview) {
      this.updatePlacementPreview(event.global.x, event.global.y)
    }
  }

  /**
   * 👆 터치/클릭 종료
   */
  private onPointerUp(event: PIXI.FederatedPointerEvent) {
    if (this.isPlacementMode && !this.isDragging) {
      // 드래그가 아닌 경우에만 배치 처리
      this.attemptItemPlacement(event.global.x, event.global.y)
    }
    
    this.isDragging = false
  }

  /**
   * 🎯 배치 미리보기 위치 업데이트
   */
  private updatePlacementPreview(screenX: number, screenY: number) {
    if (!this.placementPreview) return
    
    // 스크린 좌표를 그리드 좌표로 변환
    const gridPos = this.screenToGridCoords(screenX, screenY)
    
    // 그리드에 스냅
    const snappedPos = {
      x: Math.round(gridPos.x),
      y: Math.round(gridPos.y),
      z: 0
    }
    
    // 배치 가능 여부 확인
    const canPlace = this.canPlaceAt(snappedPos.x, snappedPos.y)
    
    // 미리보기 스타일 업데이트
    if (this.placementPreview.gridIndicator) {
      this.placementPreview.gridIndicator.clear()
      const color = canPlace ? 0x00ff00 : 0xff0000
      const alpha = canPlace ? 0.3 : 0.5
      
      this.placementPreview.gridIndicator.fill({ color, alpha })
      this.placementPreview.gridIndicator.rect(-25, -25, 50, 50)
      this.placementPreview.gridIndicator.fill()
      this.placementPreview.gridIndicator.stroke({ color, width: 2 })
      this.placementPreview.gridIndicator.rect(-25, -25, 50, 50)
      this.placementPreview.gridIndicator.stroke()
    }
    
    // 아이소메트릭 좌표로 변환하여 위치 설정
    const isoPos = IsometricUtils.toScreenCoords(snappedPos.x, snappedPos.y, snappedPos.z)
    this.placementPreview.container.x = isoPos.screenX
    this.placementPreview.container.y = isoPos.screenY
  }

  /**
   * 🎯 아이템 배치 시도
   */
  private async attemptItemPlacement(screenX: number, screenY: number) {
    if (!this.selectedItem || !this.userId) return
    
    const gridPos = this.screenToGridCoords(screenX, screenY)
    const snappedPos = {
      x: Math.round(gridPos.x),
      y: Math.round(gridPos.y),
      z: 0
    }
    
    // 배치 가능성 검사
    if (!this.canPlaceAt(snappedPos.x, snappedPos.y)) {
      this.showFeedback('이 위치에는 배치할 수 없습니다', 0xff4444)
      return
    }
    
    try {
      // 서버에 배치 요청
      const success = await this.saveItemPlacement(this.selectedItem, snappedPos)
      
      if (success) {
        // 로컬에 아이템 배치
        await this.placeItemLocally(this.selectedItem, snappedPos.x, snappedPos.y, snappedPos.z)
        
        this.showFeedback('아이템이 배치되었습니다!', 0x44ff44)
        this.cancelPlacementMode()
        
        // 인벤토리 업데이트 이벤트 발생
        this.dispatchInventoryUpdate()
        
      } else {
        this.showFeedback('배치에 실패했습니다', 0xff4444)
      }
      
    } catch (error) {
      console.error('❌ 아이템 배치 오류:', error)
      this.showFeedback('배치 중 오류가 발생했습니다', 0xff4444)
    }
  }

  /**
   * 📍 해당 위치에 배치 가능한지 확인
   */
  private canPlaceAt(gridX: number, gridY: number): boolean {
    // 그리드 범위 확인
    if (gridX < this.GRID_MIN || gridX > this.GRID_MAX || 
        gridY < this.GRID_MIN || gridY > this.GRID_MAX) {
      return false
    }
    
    // 이미 다른 아이템이 배치되어 있는지 확인
    const key = `${gridX},${gridY},0`
    return !this.placedItems.has(key)
  }

  /**
   * 💾 서버에 배치 정보 저장
   */
  private async saveItemPlacement(item: any, position: { x: number, y: number, z: number }): Promise<boolean> {
    try {
      const response = await fetch('/api/place-item', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: this.userId,
          itemId: item.id,
          positionX: position.x,
          positionY: position.y,
          positionZ: position.z
        })
      })
      
      const result = await response.json()
      return response.ok && result.success
      
    } catch (error) {
      console.error('❌ 서버 저장 실패:', error)
      return false
    }
  }

  /**
   * 🏠 로컬에 아이템 시각적 배치
   */
  private async placeItemLocally(item: any, gridX: number, gridY: number, gridZ: number) {
    try {
      const container = new PIXI.Container()
      const isoPos = IsometricUtils.toScreenCoords(gridX, gridY, gridZ)
      
      container.x = isoPos.screenX
      container.y = isoPos.screenY
      
      // 깊이 정렬을 위한 zIndex 설정
      container.zIndex = this.calculateDepthValue(gridX, gridY, gridZ)
      
      // 아이템 스프라이트 생성
      if (item.image_url) {
        const texture = await PIXI.Assets.load(item.image_url)
        const sprite = new PIXI.Sprite(texture)
        sprite.anchor.set(0.5, 1)
        
        const scale = this.calculateItemScale(texture, item)
        sprite.scale.set(scale)
        
        container.addChild(sprite)
      }
      
      // 터치 이벤트 (더블 탭으로 제거)
      container.eventMode = 'static'
      container.cursor = 'pointer'
      
      this.worldContainer.addChild(container)
      this.worldContainer.sortChildren() // 깊이 정렬
      
      // 배치된 아이템 저장
      const key = `${gridX},${gridY},${gridZ}`
      this.placedItems.set(key, {
        id: key,
        item,
        container,
        gridX,
        gridY,
        gridZ
      })
      
      console.log('🏠 아이템 로컬 배치 완료:', item.name, { gridX, gridY, gridZ })
      
    } catch (error) {
      console.error('❌ 로컬 배치 실패:', error)
    }
  }

  /**
   * 🗑️ 아이템 제거 처리 (더블 탭)
   */
  private async handleItemRemoval(screenX: number, screenY: number) {
    const gridPos = this.screenToGridCoords(screenX, screenY)
    const key = `${Math.round(gridPos.x)},${Math.round(gridPos.y)},0`
    
    const placedItem = this.placedItems.get(key)
    if (!placedItem) return
    
    try {
      // 서버에서 제거
      const success = await this.removeItemFromServer(placedItem.item.id)
      
      if (success) {
        // 로컬에서 제거
        this.worldContainer.removeChild(placedItem.container)
        placedItem.container.destroy()
        this.placedItems.delete(key)
        
        this.showFeedback('아이템이 제거되었습니다', 0x4444ff)
        this.dispatchInventoryUpdate()
        
      } else {
        this.showFeedback('제거에 실패했습니다', 0xff4444)
      }
      
    } catch (error) {
      console.error('❌ 아이템 제거 오류:', error)
      this.showFeedback('제거 중 오류가 발생했습니다', 0xff4444)
    }
  }

  /**
   * 🗑️ 서버에서 아이템 제거
   */
  private async removeItemFromServer(itemId: number): Promise<boolean> {
    try {
      const response = await fetch(`/api/garage-placements?userId=${this.userId}&itemId=${itemId}`, {
        method: 'DELETE'
      })
      
      const result = await response.json()
      return response.ok && result.success
      
    } catch (error) {
      console.error('❌ 서버 제거 실패:', error)
      return false
    }
  }

  /**
   * 📦 기존 배치된 아이템들 로드
   */
  public async loadExistingPlacements() {
    if (!this.userId) return
    
    try {
      const response = await fetch(`/api/garage-placements?userId=${this.userId}`)
      const result = await response.json()
      
      if (response.ok && result.success && result.placements) {
        // 기존 아이템들 제거
        this.clearAllPlacements()
        
        // 새로운 아이템들 배치
        for (const placement of result.placements) {
          if (placement.shop_items) {
            await this.placeItemLocally(
              placement.shop_items,
              placement.position_x,
              placement.position_y,
              placement.position_z
            )
          }
        }
        
        console.log('📦 기존 배치 아이템 로드 완료:', result.placements.length, '개')
      }
      
    } catch (error) {
      console.error('❌ 기존 배치 아이템 로드 실패:', error)
    }
  }

  /**
   * 🧹 모든 배치된 아이템 제거
   */
  private clearAllPlacements() {
    this.placedItems.forEach(placedItem => {
      this.worldContainer.removeChild(placedItem.container)
      placedItem.container.destroy()
    })
    this.placedItems.clear()
  }

  /**
   * 📐 스크린 좌표를 그리드 좌표로 변환
   */
  private screenToGridCoords(screenX: number, screenY: number): { x: number, y: number } {
    const centerX = this.app.screen.width / 2
    const centerY = this.app.screen.height / 2
    
    const relativeX = screenX - centerX
    const relativeY = screenY - centerY
    
    const coords = IsometricUtils.to3DCoords(relativeX, relativeY)
    return { x: coords.x, y: coords.y }
  }

  /**
   * 🎯 깊이 값 계산 (Z-Index 정렬용)
   */
  private calculateDepthValue(x: number, y: number, z: number): number {
    // 아이소메트릭 깊이 정렬 공식
    return (z * 10000) + (y * 100) + x
  }

  /**
   * 💬 사용자 피드백 표시
   */
  private showFeedback(message: string, color: number) {
    // TODO: 모바일 친화적인 토스트 메시지 구현
    console.log(`📱 피드백: ${message}`)
  }

  /**
   * 📋 배치 안내 표시
   */
  private showPlacementInstructions() {
    // TODO: 모바일 친화적인 안내 UI 구현
    console.log('📱 배치 안내: 원하는 위치를 터치하여 아이템을 배치하세요')
  }

  /**
   * 📋 배치 안내 숨기기
   */
  private hidePlacementInstructions() {
    // TODO: 안내 UI 숨기기
  }

  /**
   * 📦 인벤토리 업데이트 이벤트 발생
   */
  private dispatchInventoryUpdate() {
    window.dispatchEvent(new CustomEvent('inventoryUpdateRequired'))
  }

  // ==================== 🎮 캐릭터 관리 ====================

  /**
   * 🎮 캐릭터와 감정표현 숨기기
   */
  private hideCharacter() {
    if (this.characterSprite) {
      this.characterSprite.visible = false
      console.log('🫥 캐릭터 숨김')
    }
    if (this.emotionContainer) {
      this.emotionContainer.visible = false
      console.log('🫥 감정표현 숨김')
    }
  }

  /**
   * 🎮 캐릭터와 감정표현 보이기
   */
  private showCharacter() {
    if (this.characterSprite) {
      this.characterSprite.visible = true
      console.log('😊 캐릭터 표시')
    }
    if (this.emotionContainer) {
      this.emotionContainer.visible = true
      console.log('😊 감정표현 표시')
    }
  }

  // ==================== 🎮 화살표 컨트롤 ====================

  /**
   * 🎮 화살표 컨트롤 생성
   */
  private createArrowControls() {
    // 기존 컨트롤이 있으면 제거
    this.removeArrowControls()

    this.arrowControlsContainer = new PIXI.Container()

    // 화살표 버튼들 생성 (위, 아래, 좌, 우)
    const arrows = [
      { direction: 'up', x: 0, y: -80, gridDx: 0, gridDy: -1, icon: '⬆️' },
      { direction: 'down', x: 0, y: 80, gridDx: 0, gridDy: 1, icon: '⬇️' },
      { direction: 'left', x: -80, y: 0, gridDx: -1, gridDy: 0, icon: '⬅️' },
      { direction: 'right', x: 80, y: 0, gridDx: 1, gridDy: 0, icon: '➡️' }
    ]

    arrows.forEach(arrow => {
      const button = this.createArrowButton(arrow.icon, arrow.x, arrow.y, arrow.gridDx, arrow.gridDy)
      this.arrowControlsContainer!.addChild(button)
    })

    // 화살표 컨트롤을 화면 중앙에 배치
    this.arrowControlsContainer.x = this.app.screen.width / 2
    this.arrowControlsContainer.y = this.app.screen.height / 2 + 150 // 아래쪽에 배치

    // UI 컨테이너에 추가 (월드 컨테이너 위에 표시)
    this.app.stage.addChild(this.arrowControlsContainer)
    
    console.log('🎮 화살표 컨트롤 생성 완료')
  }

  /**
   * 🎮 개별 화살표 버튼 생성
   */
  private createArrowButton(icon: string, x: number, y: number, gridDx: number, gridDy: number): PIXI.Container {
    const button = new PIXI.Container()
    
    // 배경 원형 버튼
    const bg = new PIXI.Graphics()
    bg.fill({ color: 0x333333, alpha: 0.8 })
    bg.circle(0, 0, 30)
    bg.fill()
    bg.stroke({ color: 0x00ff88, width: 2, alpha: 0.8 })
    bg.circle(0, 0, 30)
    bg.stroke()
    
    // 아이콘 텍스트
    const text = new PIXI.Text({
      text: icon,
      style: {
        fontSize: 24,
        fill: 0xffffff
      }
    })
    text.anchor.set(0.5)
    
    button.addChild(bg, text)
    button.x = x
    button.y = y
    
    // 터치 이벤트 설정
    button.eventMode = 'static'
    button.cursor = 'pointer'
    
    button.on('pointerdown', () => {
      this.movePreview(gridDx, gridDy)
      // 버튼 눌림 효과
      button.scale.set(0.9)
    })
    
    button.on('pointerup', () => {
      button.scale.set(1.0)
    })
    
    button.on('pointerupoutside', () => {
      button.scale.set(1.0)
    })

    return button
  }

  /**
   * 🎮 미리보기 이동
   */
  private movePreview(dx: number, dy: number) {
    const newX = this.previewGridX + dx
    const newY = this.previewGridY + dy
    
    // 그리드 범위 확인
    if (newX >= this.GRID_MIN && newX <= this.GRID_MAX && 
        newY >= this.GRID_MIN && newY <= this.GRID_MAX) {
      
      this.previewGridX = newX
      this.previewGridY = newY
      
      console.log('🎮 미리보기 이동:', { x: newX, y: newY })
      
      // 미리보기 위치 업데이트
      this.updatePreviewPosition()
    } else {
      console.log('⚠️ 그리드 범위 초과:', { x: newX, y: newY })
    }
  }

  /**
   * 📐 미리보기 위치 업데이트
   */
  private updatePreviewPosition() {
    if (!this.placementPreview) return
    
    const coords = IsometricUtils.toScreenCoords(this.previewGridX, this.previewGridY, 0)
    this.placementPreview.container.x = coords.screenX
    this.placementPreview.container.y = coords.screenY
  }

  /**
   * 🎮 화살표 컨트롤 제거
   */
  private removeArrowControls() {
    if (this.arrowControlsContainer) {
      this.app.stage.removeChild(this.arrowControlsContainer)
      this.arrowControlsContainer.destroy()
      this.arrowControlsContainer = undefined
      console.log('🗑️ 화살표 컨트롤 제거')
    }
  }

  /**
   * 🧹 정리
   */
  public destroy() {
    this.cancelPlacementMode()
    this.clearAllPlacements()
    
    // 화살표 컨트롤 제거
    this.removeArrowControls()
    
    // 이벤트 리스너 제거
    this.app.stage.off('pointerdown')
    this.app.stage.off('pointermove')
    this.app.stage.off('pointerup')
    
    console.log('🧹 모바일 방꾸미기 시스템 정리 완료')
  }
}

// 🎮 PixiJS 관리 클래스

import { 
  GridConfig, 
  PixiContainers, 
  DecorationItem, 
  PlacedItem, 
  Position3D, 
  Position2D,
  CharacterData,
  CharacterParts
} from '@/types'
import { gridToIso, isoToGrid, DEFAULT_GRID_CONFIG, calculatePlacementPosition } from './gridUtils'

// PixiJS 동적 import를 위한 타입 정의
let PIXI: any = null

// PixiJS 동적 로드 함수 - 간소화된 버전
async function loadPixi() {
  if (!PIXI) {
    try {
      // 먼저 window에서 확인 (이미 로드된 경우)
      if (typeof window !== 'undefined' && (window as any).PIXI) {
        PIXI = (window as any).PIXI
        console.log('✅ PixiJS 이미 로드됨 (window에서 가져옴)')
        return PIXI
      }

      console.log('🔄 PixiJS 로딩 시작...')
      
      // 정적 import 시도 (더 빠른 로딩)
      const pixiModule = await import('pixi.js')
      PIXI = pixiModule
      
      // window에도 저장 (다음 로딩 시 빠른 접근)
      if (typeof window !== 'undefined') {
        (window as any).PIXI = PIXI
      }
      
      console.log('✅ PixiJS 정적 로드 성공')
    } catch (error) {
      console.warn('❌ PixiJS 정적 로드 실패, CDN 시도:', error)
      
      // CDN에서 로드 (폴백) - 더 간단한 방식
      if (typeof window !== 'undefined') {
        return new Promise((resolve, reject) => {
          // 이미 로드되어 있는지 재확인
          if ((window as any).PIXI) {
            PIXI = (window as any).PIXI
            console.log('✅ PixiJS 이미 로드됨 (CDN 재확인)')
            resolve(PIXI)
            return
          }

          console.log('🔄 PixiJS CDN 로딩 시작...')
          
          // CDN에서 로드
          const script = document.createElement('script')
          script.src = 'https://cdn.jsdelivr.net/npm/pixi.js@7.4.2/dist/pixi.min.js'
          script.async = true
          script.onload = () => {
            if ((window as any).PIXI) {
              PIXI = (window as any).PIXI
              console.log('✅ PixiJS CDN 로드 성공')
              resolve(PIXI)
            } else {
              console.error('❌ PixiJS CDN 로드 실패: PIXI 객체 없음')
              reject(new Error('PIXI not loaded from CDN'))
            }
          }
          script.onerror = (e) => {
            console.error('❌ PixiJS CDN 로드 실패:', e)
            reject(new Error('Failed to load PIXI from CDN'))
          }
          document.head.appendChild(script)
        })
      } else {
        throw new Error('Window not available')
      }
    }
  }
  return PIXI
}

export class PixiManager {
  private app: any = null
  private containers: PixiContainers | null = null
  private config: GridConfig
  private loadedTextures: Map<string, any> = new Map()
  private canvasElement: HTMLElement | null = null
  private canvasNode: HTMLCanvasElement | null = null
  public isInitialized: boolean = false
  private isDestroying: boolean = false
  private isRendering: boolean = false
  private destroyPromise: Promise<void> | null = null
  private gridRendered: boolean = false // 🔧 그리드 렌더링 상태 추적
  private lastShowFullGrid: boolean | null = null // 🔧 마지막 그리드 표시 설정

  constructor(config: GridConfig = DEFAULT_GRID_CONFIG) {
    this.config = config
  }

  /**
   * 바닥 타일 설정 업데이트
   */
  updateFloorTileConfig(floorTileConfig: any): void {
    console.log('🔄 PixiManager 바닥 타일 설정 업데이트:', floorTileConfig)
    this.config.floorTile = floorTileConfig
    // 🔧 바닥 타일 설정 변경 시 그리드 렌더링 플래그 리셋
    this.gridRendered = false
    this.lastShowFullGrid = null
  }

  /**
   * 이미지에서 픽셀 데이터 추출
   */
  private async extractPixelData(imageUrl: string): Promise<number[][]> {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => {
        console.log('🖼️ 이미지 로드됨:', img.width, 'x', img.height)
        
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d', { willReadFrequently: true })
        if (!ctx) {
          reject(new Error('Canvas context not available'))
          return
        }

        // 이미지 크기를 31x31로 강제 설정 (3D 바닥과 맞춤)
        canvas.width = 31
        canvas.height = 31
        ctx.drawImage(img, 0, 0, 31, 31)

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
        const data = imageData.data
        const pixelData: number[][] = []

        for (let y = 0; y < canvas.height; y++) {
          pixelData[y] = []
          for (let x = 0; x < canvas.width; x++) {
            const pixelIndex = (y * canvas.width + x) * 4
            const r = data[pixelIndex]
            const g = data[pixelIndex + 1]
            const b = data[pixelIndex + 2]
            const color = (r << 16) | (g << 8) | b
            pixelData[y][x] = color
          }
        }

        console.log('📊 픽셀 데이터 추출 완료:', pixelData.length, 'x', pixelData[0]?.length)
        console.log('🎨 샘플 픽셀 색상들:', pixelData[0]?.slice(0, 5))
        
        resolve(pixelData)
      }
      img.onerror = () => reject(new Error('Failed to load image'))
      img.src = imageUrl
    })
  }

  /**
   * 캔버스 요소 반환
   */
  get canvas(): HTMLCanvasElement | null {
    return this.canvasNode
  }

  /**
   * PixiJS 애플리케이션 초기화
   */
  async initialize(
    canvasElement: HTMLElement,
    width: number = 800,
    height: number = 600
  ): Promise<void> {
    try {
      console.log('🚀 PixiManager 초기화 시작...')
      
      // 이미 초기화되어 있다면 정리 후 재초기화
      if (this.isInitialized) {
        console.log('🔄 기존 인스턴스 정리 중...')
        await this.destroy()
        // 정리 후 최소한의 대기 (로딩 속도 향상)
        await new Promise(resolve => setTimeout(resolve, 10))
      }
      
      console.log('📦 PixiJS 로딩 중...')
      // PixiJS 동적 로드 (캐시된 버전 우선 사용)
      const PixiJS = await loadPixi()
      console.log('✅ PixiJS 로드 완료')
      
      console.log('🎮 PixiJS 앱 생성 중...')
      // PixiJS v8 방식으로 앱 생성 (최적화된 설정)
      this.app = new PixiJS.Application()
      await this.app.init({
        width,
        height,
        backgroundColor: 0x0a0a2a,
        antialias: false, // 성능 향상을 위해 antialias 비활성화
        resolution: Math.min(window.devicePixelRatio || 1, 2), // 최대 해상도 제한
        autoDensity: true,
        hello: false, // 불필요한 로그 제거
        powerPreference: 'high-performance', // 성능 우선
        sharedTicker: false, // 독립적인 ticker 사용
        sharedLoader: false // 독립적인 loader 사용
      })
      console.log('✅ PixiJS 앱 생성 완료')

      // 캔버스 직접 추가 (React DOM 관리 우회)
      const canvas = this.app.canvas as HTMLCanvasElement
      canvas.style.border = 'none'
      canvas.style.outline = 'none'
      canvas.style.display = 'block'
      canvas.style.width = '100%'
      canvas.style.height = '100%'
      canvas.style.touchAction = 'none' // 터치 스크롤 방지
      canvas.style.userSelect = 'none' // 텍스트 선택 방지
      
      console.log('🎨 캔버스 DOM 추가 중...')
      // DOM에 직접 추가 (React와 분리)
      try {
        // 기존 캔버스 제거 (안전하게)
        const existingCanvas = canvasElement.querySelector('canvas')
        if (existingCanvas) {
          try {
            canvasElement.removeChild(existingCanvas)
          } catch (e) {
            console.warn('기존 캔버스 제거 중 오류:', e)
          }
        }
        
        canvasElement.appendChild(canvas)
        
        // 캔버스 참조 저장 (정리용)
        this.canvasElement = canvasElement
        this.canvasNode = canvas
        console.log('✅ 캔버스 DOM 추가 완료')
      } catch (error) {
        console.error('❌ 캔버스 DOM 추가 실패:', error)
        throw error
      }

      console.log('🏗️ 컨테이너 구조 생성 중...')
      // 컨테이너 구조 생성
      this.createContainers()
      console.log('✅ 컨테이너 구조 생성 완료')

      console.log('📐 자동 스케일링 설정 중...')
      // 그리드 크기에 맞춰 자동 스케일링 설정
      this.setupAutoScaling(width, height)
      console.log('✅ 자동 스케일링 설정 완료')

      // 초기화 완료 표시
      this.isInitialized = true
      console.log('🎉 PixiManager 초기화 완료!')

    } catch (error) {
      console.error('❌ PixiManager 초기화 실패:', error)
      this.isInitialized = false
      throw error
    }
  }

  /**
   * 컨테이너 구조 생성
   */
  private createContainers(): void {
    if (!this.app || !PIXI) throw new Error('PixiJS app not initialized')

    const main = new PIXI.Container()
    const grid = new PIXI.Container()
    const items = new PIXI.Container()
    const character = new PIXI.Container() // 캐릭터 컨테이너 추가
    const preview = new PIXI.Container()
    const ui = new PIXI.Container()

    // 컨테이너 계층 구조 설정
    main.addChild(grid)
    main.addChild(items)
    main.addChild(character) // 캐릭터는 아이템 위에 렌더링
    main.addChild(preview)
    main.addChild(ui)

    // Z-index 정렬 활성화
    items.sortableChildren = true
    character.sortableChildren = true
    preview.sortableChildren = true

    this.app.stage.addChild(main)

    this.containers = { main, grid, items, character, preview, ui }
  }

  /**
   * 그리드 크기에 맞춰 자동 스케일링 설정
   */
  private setupAutoScaling(canvasWidth: number, canvasHeight: number): void {
    if (!this.containers?.main) return

    // 그리드 전체 크기 계산 (이소메트릭)
    const halfSize = 15
    const gridWorldWidth = halfSize * 2 * this.config.tileWidth // 전체 그리드 가로 크기
    const gridWorldHeight = halfSize * 2 * this.config.tileHeight // 전체 그리드 세로 크기

    // 여백을 고려한 스케일 계산 (세로 비율 줄임)
    const margin = 2 // 여백 거의 제거
    const scaleX = (canvasWidth - margin * 2) / gridWorldWidth
    const scaleY = (canvasHeight - margin * 2) / gridWorldHeight * 0.7 // 세로 비율 30% 줄임 (마름모 비율에 맞춤)
    
    // 작은 스케일을 선택해서 그리드가 완전히 보이도록 (최대 확대)
    const scale = Math.min(scaleX, scaleY, 6.0) // 최대 6.0까지 확대 허용
    

    
    // 메인 컨테이너에 스케일 적용
    this.containers.main.scale.set(scale)
    
    // 스케일 적용 후 아래쪽 배치
    this.containers.main.x = canvasWidth / 2
    this.containers.main.y = canvasHeight * 0.6 // 아래쪽으로 배치 (60% 지점)
  }

  /**
   * 캔버스 크기 변경 시 스케일링 업데이트
   */
  updateScaling(width: number, height: number): void {
    this.setupAutoScaling(width, height)
  }

  /**
   * 3D 이소메트릭 그리드 렌더링
   */
  async renderGrid(showFullGrid: boolean = true): Promise<void> {
    if (!this.containers || !PIXI || !this.isInitialized || !this.app || this.isDestroying) {
      return
    }

    // 렌더러가 유효한지 확인
    if (!this.app.renderer || !this.app.renderer.gl) {
      return
    }

    const { grid } = this.containers
    if (!grid) {
      return
    }

    // 🔧 그리드가 이미 렌더링되었고 설정이 동일하면 건너뛰기
    if (this.gridRendered && grid.children.length > 0 && this.lastShowFullGrid === showFullGrid) {
      return
    }

    try {
      grid.removeChildren()
    } catch (error) {
      console.warn('그리드 컨테이너 정리 중 오류:', error)
      return
    }

    const gridGraphics = new PIXI.Graphics()
    const halfSize = 15 // 원래 렌더 페이지 그리드 크기

    // 바닥 타일 그리기 (사용자 정의 지원)
    console.log('🔍 renderGrid: halfSize =', halfSize, '타일 범위:', -halfSize, '~', halfSize)
    await this.renderFloorTiles(grid, halfSize)

    // 🔧 배치 모드에서 보이는 그리드 라인 (에디터와 동일한 방식)
    if (showFullGrid) {
      // 에디터와 동일한 그리드 라인 스타일
      gridGraphics.setStrokeStyle({ width: 1, color: 0x666666, alpha: 0.2 })
      
      // Y축 라인들 (좌우 방향) - 에디터와 동일한 간격
      for (let y = -halfSize; y <= halfSize; y += 2) {
        const start = gridToIso(-halfSize, y, 0, this.config)
        const end = gridToIso(halfSize, y, 0, this.config)
        
        gridGraphics.moveTo(start.x, start.y)
        gridGraphics.lineTo(end.x, end.y)
      }

      // X축 라인들 (상하 방향) - 에디터와 동일한 간격
      for (let x = -halfSize; x <= halfSize; x += 2) {
        const start = gridToIso(x, -halfSize, 0, this.config)
        const end = gridToIso(x, halfSize, 0, this.config)
        
        gridGraphics.moveTo(start.x, start.y)
        gridGraphics.lineTo(end.x, end.y)
      }
      
      gridGraphics.stroke() // 참고용 그리드 완료

      // 현재 레이어 편집 평면 (에디터와 동일한 스타일)
      gridGraphics.setStrokeStyle({ width: 2, color: 0x4a90e2, alpha: 0.6 })
      for (let y = -halfSize; y <= halfSize; y += 2) {
        const start = gridToIso(-halfSize, y, 0, this.config)
        const end = gridToIso(halfSize, y, 0, this.config)
        gridGraphics.moveTo(start.x, start.y).lineTo(end.x, end.y)
      }
      for (let x = -halfSize; x <= halfSize; x += 2) {
        const start = gridToIso(x, -halfSize, 0, this.config)
        const end = gridToIso(x, halfSize, 0, this.config)
        gridGraphics.moveTo(start.x, start.y).lineTo(end.x, end.y)
      }
      gridGraphics.stroke() // 현재 레이어 평면 완료
    }

    if (showFullGrid && PIXI) {
      // 3D 벽면 그리드 (Z축)
      const maxHeight = 10
      
      // 4면의 벽면
      const walls = [
        { x: -halfSize, yRange: [-halfSize, halfSize] },  // 좌측
        { x: halfSize, yRange: [-halfSize, halfSize] },   // 우측
        { y: -halfSize, xRange: [-halfSize, halfSize] },  // 상단
        { y: halfSize, xRange: [-halfSize, halfSize] }    // 하단
      ]

      walls.forEach(wall => {
        if ('x' in wall && wall.yRange) {
          // 세로 벽면 (좌우 벽)
          for (let y = wall.yRange[0]; y <= wall.yRange[1]; y++) {
            for (let z = 0; z < maxHeight; z++) {
              const bottom = gridToIso(wall.x, y, z, this.config)
              const top = gridToIso(wall.x, y, z + 1, this.config)
              
              gridGraphics.moveTo(bottom.x, bottom.y)
              gridGraphics.lineTo(top.x, top.y)
            }
          }
        } else if ('y' in wall && wall.xRange) {
          // 가로 벽면 (상하 벽)
          for (let x = wall.xRange[0]; x <= wall.xRange[1]; x++) {
            for (let z = 0; z < maxHeight; z++) {
              const bottom = gridToIso(x, wall.y, z, this.config)
              const top = gridToIso(x, wall.y, z + 1, this.config)
              
              gridGraphics.moveTo(bottom.x, bottom.y)
              gridGraphics.lineTo(top.x, top.y)
            }
          }
        }
      })
    }

    grid.addChild(gridGraphics)
    
    // 🔧 그리드 렌더링 완료 플래그 설정
    this.gridRendered = true
    this.lastShowFullGrid = showFullGrid
  }

  /**
   * 텍스처 로드
   */
  async loadTexture(imageUrl: string): Promise<any> {
    if (!PIXI) {
      await loadPixi()
    }
    
    if (this.loadedTextures.has(imageUrl)) {
      return this.loadedTextures.get(imageUrl)!
    }

    try {
      const texture = await PIXI.Assets.load(imageUrl)
      
      // 텍스처가 유효한지 확인 (PixiJS v8+ 호환)
      if (!texture || !texture.source || !texture.source.resource) {
        console.warn(`유효하지 않은 텍스처: ${imageUrl}`)
        return null
      }
      
      this.loadedTextures.set(imageUrl, texture)
      return texture
    } catch (error) {
      console.warn(`텍스처 로딩 실패: ${imageUrl}`, error)
      return null
    }
  }

  /**
   * 아이템 렌더링 (3D 그리드 데이터 기반)
   */
  async renderItem(
    item: DecorationItem, 
    gridPosition: Position3D,
    container: any = this.containers!.items,
    isActive: boolean = false
  ): Promise<any> {
    try {
      if (!PIXI) await loadPixi()
      
      const texture = await this.loadTexture(item.imageUrl)
      if (!texture) {
        console.warn(`텍스처 로딩 실패: ${item.imageUrl}`)
        return null
      }
      const sprite = new PIXI.Sprite(texture)

      // 3D 그리드 데이터가 있으면 센터 기준으로, 없으면 앵커 기준으로 배치
      let position: Position2D
      
      if (item.gridData && Array.isArray(item.gridData.cells) && item.gridData.cells.length > 0) {
        // 🔧 Z축 조정 적용: 실제 배치될 높이에 맞게 이미지 위치 계산
        const adjustedZ = gridPosition.z // Z축 조정된 높이 사용
        const isoPos = gridToIso(gridPosition.x, gridPosition.y, adjustedZ, this.config)
        position = { 
          x: isoPos.x - sprite.width / 2,   // 이미지 중심에서 절반만큼 빼기
          y: isoPos.y - sprite.height / 2   // 이미지 중심에서 절반만큼 빼기
        }
        

      } else {
        // 기존 앵커 방식 (Z축 조정 적용)
        const adjustedZ = gridPosition.z
        const adjustedPosition = { ...gridPosition, z: adjustedZ }
        position = calculatePlacementPosition(
          adjustedPosition, 
          item.anchor.x, 
          item.anchor.y, 
          this.config
        )
        

      }

      sprite.x = position.x
      sprite.y = position.y

      // Z-index 설정 (Z축 조정된 높이 반영)
      sprite.zIndex = gridPosition.z * 1000 + gridPosition.y * 10 + gridPosition.x + 500

      // 아이템 정보 저장
      sprite.label = item.id
      sprite.interactive = true
      sprite.cursor = 'pointer'

      // 활성화 상태에 따른 시각적 효과
      if (isActive) {
        sprite.tint = 0x00ff00 // 초록색으로 활성화 표시
        sprite.alpha = 0.8
        // 활성화 테두리 추가
        const border = new PIXI.Graphics()
        border.lineStyle(3, 0x00ff00, 0.8)
        border.drawRect(-sprite.width/2 - 2, -sprite.height/2 - 2, sprite.width + 4, sprite.height + 4)
        border.zIndex = sprite.zIndex + 1
        container.addChild(border)
        sprite.border = border // 나중에 제거할 수 있도록 참조 저장
      }

      // 레이어별 Z-index 설정 (Z축 조정 반영)
      sprite.zIndex = gridPosition.z * 1000 + gridPosition.y * 10 + gridPosition.x

      container.addChild(sprite)
      return sprite
    } catch (error) {
      
      if (!PIXI) return null
      
      // 폴백: 투명한 사각형 그리기 (Z축 조정 적용)
      const fallbackGraphics = new PIXI.Graphics()
      fallbackGraphics.rect(0, 0, 24, 24)
      fallbackGraphics.fill({ color: 0x000000, alpha: 0 }) // 투명하게 설정
      
      const adjustedZ = gridPosition.z
      const adjustedPosition = { ...gridPosition, z: adjustedZ }
      const position = calculatePlacementPosition(
        adjustedPosition, 
        item.anchor.x, 
        item.anchor.y, 
        this.config
      )
      
      fallbackGraphics.x = position.x
      fallbackGraphics.y = position.y
      fallbackGraphics.label = item.id
      fallbackGraphics.interactive = true
      fallbackGraphics.cursor = 'pointer'
      
      container.addChild(fallbackGraphics)
      return fallbackGraphics
    }
  }

  /**
   * 배치된 아이템들 렌더링
   */
  async renderPlacedItems(
    placedItems: PlacedItem[], 
    storeItems: DecorationItem[],
    activeItemId: string | null = null
  ): Promise<void> {
    if (!this.containers || !this.isInitialized || !this.app || this.isDestroying) {
      return
    }

    // 렌더러가 유효한지 확인
    if (!this.app.renderer || !this.app.renderer.gl) {
      return
    }

    const { items } = this.containers
    if (!items) {
      return
    }

    try {
      items.removeChildren()
    } catch (error) {
      console.warn('컨테이너 정리 중 오류:', error)
      return
    }

    // 아이템 맵 생성 (빠른 조회를 위해)
    const itemMap = new Map(storeItems.map(item => [item.id, item]))

    // Z 레이어 순서로 정렬하여 렌더링
    const sortedItems = [...placedItems].sort((a, b) => {
      const aZ = a.gridPosition?.z ?? a.position_z
      const bZ = b.gridPosition?.z ?? b.position_z
      return aZ - bZ
    })

    for (const placedItem of sortedItems) {
      const storeItem = itemMap.get(placedItem.itemId)
      if (storeItem) {
        try {
          const gridPosition: Position3D = placedItem.gridPosition ?? {
            x: placedItem.position_x,
            y: placedItem.position_y,
            z: placedItem.position_z
          }
          const isActive = activeItemId === placedItem.id
          await this.renderItem(storeItem, gridPosition, items, isActive)
        } catch (error) {
          console.warn('아이템 렌더링 실패:', error)
        }
      }
    }
  }

  /**
   * 미리보기용 충돌 검사 (실제 배치된 아이템들과 비교)
   */
  private checkPreviewCollision(
    position: Position3D, 
    item: DecorationItem, 
    placedItems: PlacedItem[], 
    storeItems: DecorationItem[]
  ): boolean {
    if (!item.gridData) return false
    
    const { cells } = item.gridData
    const itemMap = new Map(storeItems.map(item => [item.id, item]))
    
    // 아이템의 각 셀에 대해 충돌 검사
    for (const cell of cells) {
      const worldX = position.x + cell.x
      const worldY = position.y + cell.y  
      const worldZ = position.z + cell.z

      // 그리드 경계 검사
      if (worldX < -20 || worldX > 20 || worldY < -20 || worldY > 20 || worldZ < 0 || worldZ > 10) {
        return true // 충돌
      }

      // 다른 아이템과의 충돌 검사
      const hasCollision = placedItems.some(placedItem => {
        const placedStoreItem = itemMap.get(placedItem.itemId)
        if (!placedStoreItem?.gridData) return false

        const { cells: placedCells } = placedStoreItem.gridData

        return placedCells.some(placedCell => {
          const gridPos = placedItem.gridPosition ?? {
            x: placedItem.position_x,
            y: placedItem.position_y,
            z: placedItem.position_z
          }
          const placedWorldX = gridPos.x + placedCell.x
          const placedWorldY = gridPos.y + placedCell.y
          const placedWorldZ = gridPos.z + placedCell.z

          return placedWorldX === worldX && placedWorldY === worldY && placedWorldZ === worldZ
        })
      })

      if (hasCollision) {
        return true
      }
    }

    return false // 충돌 없음
  }

  /**
   * 미리보기 아이템 렌더링 (실제 배치와 동일한 방식)
   */
  async renderPreview(
    item: DecorationItem | null, 
    gridPosition: Position3D | null,
    dataStore?: any,
    placedItems?: PlacedItem[],
    storeItems?: DecorationItem[]
  ): Promise<Position3D | null> {
    if (!this.containers || !this.isInitialized || !this.app || this.isDestroying) {
      return null
    }

    // 렌더러가 유효한지 확인
    if (!this.app.renderer || !this.app.renderer.gl) {
      return null
    }

    const { preview } = this.containers
    if (!preview) {
      return null
    }

    try {
      preview.removeChildren()
    } catch (error) {
      console.warn('미리보기 컨테이너 정리 중 오류:', error)
      return null
    }

    if (!item || !gridPosition) return null

    // 🔧 아이템의 모든 픽셀이 타일 영역 안에 있는지 확인
    if (!this.isItemWithinTileBounds(gridPosition, item)) {
      return null // 타일 영역을 넘어가면 미리보기도 표시하지 않음
    }

    try {
      // 🔧 Z축 자동 조정 적용: 실제 배치될 위치 계산
      let finalPosition = gridPosition
      
      // 🔧 미리보기에서 직접 Z축 조정 수행
      if (item.gridData && placedItems && storeItems) {
        const maxZ = 10 // 최대 높이 제한
        let foundPosition = false
        
        // Z축을 점진적으로 올려가며 충돌 검사
        for (let z = gridPosition.z; z <= maxZ; z++) {
          const testPosition = { ...gridPosition, z }
          
          // 직접 충돌 검사 수행
          const hasCollision = this.checkPreviewCollision(testPosition, item, placedItems, storeItems)
          
          if (!hasCollision) {
            finalPosition = testPosition
            foundPosition = true
            break
          }
        }
        
        if (!foundPosition) {
          return null
        }
      }

      // 🔧 실제 배치와 똑같은 방식으로 아이템 렌더링 (조정된 위치 사용)
      const sprite = await this.renderItem(item, finalPosition, preview)
      if (!sprite) {
        console.warn('미리보기 아이템 렌더링 실패:', item.name)
        return null
      }
      
      if (sprite) {
        sprite.alpha = 0.7 // 투명하게 표시
        
        // Z축 조정 여부에 따른 색상 변경
        if (finalPosition.z !== gridPosition.z) {
          sprite.tint = 0xffaa00 // 주황색 (Z축 조정됨)
          
          // 🔧 Z축 조정 시 시각적 효과 추가
          sprite.scale.set(1.05, 1.05) // 약간 크게 표시
          
          // 🔧 그림자 효과 추가 (Z축 조정 시)
          const shadow = new PIXI.Graphics()
          shadow.beginFill(0x000000, 0.3)
          shadow.drawEllipse(0, 0, sprite.width * 0.8, sprite.height * 0.3)
          shadow.endFill()
          shadow.x = sprite.x
          shadow.y = sprite.y + sprite.height * 0.8
          shadow.zIndex = sprite.zIndex - 1
          preview.addChild(shadow)
          
          // 🔧 Z축 높이 표시 텍스트 추가
          if (PIXI) {
            const heightText = new PIXI.Text(`기존 물품 상단에 배치`, {
              fontFamily: 'Arial',
              fontSize: 12,
              fill: 0xffaa00,
              stroke: 0x000000,
              strokeThickness: 2,
              align: 'center'
            })
            heightText.anchor.set(0.5, 0)
            heightText.x = sprite.x
            heightText.y = sprite.y - sprite.height / 2 - 20
            heightText.zIndex = sprite.zIndex + 1
            preview.addChild(heightText)
          }
          
        } else {
          sprite.tint = 0x00ff00 // 녹색 (정상 배치)
        }
      }
      
      // 🔧 계산된 최종 위치 반환
      return finalPosition
    } catch (error) {
      // 미리보기 렌더링 실패
      return null
    }
  }

  /**
   * 에디터에서 저장된 정확한 위치 정보를 사용해서 그리드 픽셀 렌더링 (완벽한 일치)
   */
  private renderPreviewGridPixelsFromSprite(item: DecorationItem, sprite: any, isCollision: boolean = false): void {
    if (!this.containers || !item.gridData || !PIXI) return

    const { preview } = this.containers
    const { cells, centerX, centerY, imageOffsetX, imageOffsetY } = item.gridData
    
    // 🔧 Z축 조정을 반영: 모든 레이어의 셀들을 렌더링 (1층만이 아닌)
    const allCells = cells // 모든 셀 렌더링
    
    if (allCells.length === 0) return



    // 🔧 에디터에서 저장된 앵커 정보를 사용한 정확한 기준점 계산
    let referenceX, referenceY
    
          if (imageOffsetX !== undefined && imageOffsetY !== undefined) {
        // 저장된 앵커 정보가 있으면 사용
        referenceX = sprite.x + imageOffsetX
        referenceY = sprite.y + imageOffsetY
      } else {
        // 기본값: sprite 중심점 사용
        referenceX = sprite.x + sprite.width / 2
        referenceY = sprite.y + sprite.height / 2
      }
    
    allCells.forEach(cell => {
      // 편집기에서 저장된 상대 좌표를 이소메트릭 오프셋으로 변환
      const offsetX = cell.x - centerX
      const offsetY = cell.y - centerY
      const isoOffset = gridToIso(offsetX, offsetY, 0, this.config)
      
      // 🔧 저장된 기준점 + 상대 오프셋 = 정확한 셀 위치
      const cellX = referenceX + isoOffset.x
      const cellY = referenceY + isoOffset.y
      

      
      // 🔧 Z축 높이에 따른 3D 복셀 렌더링
      const pixelGraphics = new PIXI.Graphics()
      const tileWidth = this.config.tileWidth
      const tileHeight = this.config.tileHeight
      const voxelHeight = this.config.tileHeight // 복셀 높이
      
      // Z축 조정 여부에 따른 색상 변경
      const strokeColor = isCollision ? 0xffaa00 : 0x00ff00
      const fillColor = isCollision ? 0xffaa00 : 0x00ff00
      
      // 🔧 3D 복셀 그리기 (Z축 높이 반영)
      if (cell.z > 0) {
        // 위쪽 레이어: 3D 정육면체
        pixelGraphics
          .setStrokeStyle({ width: 2, color: strokeColor, alpha: 0.8 })
          .setFillStyle({ color: fillColor, alpha: 0.3 })
          
        // 위면 (다이아몬드 모양)
        pixelGraphics
          .moveTo(0, -voxelHeight)                    // 위쪽 중심
          .lineTo(tileWidth / 2, -voxelHeight + tileHeight / 2)  // 위쪽 오른쪽
          .lineTo(0, -voxelHeight + tileHeight)       // 위쪽 아래
          .lineTo(-tileWidth / 2, -voxelHeight + tileHeight / 2) // 위쪽 왼쪽
          .lineTo(0, -voxelHeight)                    // 위쪽 중심으로 돌아가기
          .fill()
          .stroke()

        // 오른쪽 면 (사다리꼴)
        pixelGraphics
          .setFillStyle({ color: fillColor, alpha: 0.2 })
          .moveTo(tileWidth / 2, -voxelHeight + tileHeight / 2)  // 위쪽 오른쪽
          .lineTo(tileWidth / 2, tileHeight / 2)      // 아래쪽 오른쪽
          .lineTo(0, tileHeight)                      // 아래쪽 중심
          .lineTo(0, -voxelHeight + tileHeight)       // 위쪽 아래
          .lineTo(tileWidth / 2, -voxelHeight + tileHeight / 2)  // 위쪽 오른쪽으로 돌아가기
          .fill()
          .stroke()

        // 왼쪽 면 (사다리꼴)
        pixelGraphics
          .setFillStyle({ color: fillColor, alpha: 0.15 })
          .moveTo(-tileWidth / 2, -voxelHeight + tileHeight / 2) // 위쪽 왼쪽
          .lineTo(0, -voxelHeight + tileHeight)       // 위쪽 아래
          .lineTo(0, tileHeight)                      // 아래쪽 중심
          .lineTo(-tileWidth / 2, tileHeight / 2)     // 아래쪽 왼쪽
          .lineTo(-tileWidth / 2, -voxelHeight + tileHeight / 2) // 위쪽 왼쪽으로 돌아가기
          .fill()
          .stroke()
      } else {
        // 바닥 레이어: 평면 다이아몬드
        pixelGraphics
          .setStrokeStyle({ width: 2, color: strokeColor, alpha: 0.8 })
          .setFillStyle({ color: fillColor, alpha: 0.3 })
          .moveTo(0, -tileHeight / 2)
          .lineTo(tileWidth / 2, 0)
          .lineTo(0, tileHeight / 2)
          .lineTo(-tileWidth / 2, 0)
          .lineTo(0, -tileHeight / 2)
          .fill()
          .stroke()
      }
      
      pixelGraphics.x = cellX
      pixelGraphics.y = cellY
      pixelGraphics.zIndex = cell.z * 1000 + cell.y * 10 + cell.x - 100  // 이미지보다 아래
      
      preview.addChild(pixelGraphics)
    })
  }

  /**
   * 미리보기용 3D 그리드 픽셀을 바닥면에 렌더링 (기존 방식)
   */
  private renderPreviewGridPixels(item: DecorationItem, centerPosition: Position3D, isCollision: boolean = false): void {
    if (!this.containers || !item.gridData || !PIXI) return

    const { preview } = this.containers
    const { cells, centerX, centerY } = item.gridData
    
    // 1층(z=0) 셀들만 필터링
    const groundLevelCells = cells.filter(cell => cell.z === 0)
    
    if (groundLevelCells.length === 0) return



    // 1. 이미지 위치 계산 (centerPosition 기준으로 배치, 편집기와 동일한 중심 맞춤)
    const isoPos = gridToIso(centerPosition.x, centerPosition.y, centerPosition.z, this.config)
    
    // 미리보기에서는 아직 스프라이트가 생성되지 않았으므로 임시로 이미지 크기 추정
    // 실제 배치에서는 sprite.width/height를 사용
    const imagePosition = { x: isoPos.x, y: isoPos.y }
    

    
    groundLevelCells.forEach(cell => {
      // 2. 편집기 상대 좌표를 이미지 기준 오프셋으로 변환
      const offsetX = cell.x - centerX  // 편집기에서 중심점 기준 상대 X
      const offsetY = cell.y - centerY  // 편집기에서 중심점 기준 상대 Y
      
      // 3. 상대 오프셋을 이소메트릭 스크린 오프셋으로 변환
      const isoOffset = gridToIso(offsetX, offsetY, 0, this.config)
      
      // 4. 이미지 위치 + 상대 오프셋 = 최종 셀 위치
      const cellX = imagePosition.x + isoOffset.x
      const cellY = imagePosition.y + isoOffset.y
      

      
      // 바닥면 타일 그리기
      const pixelGraphics = new PIXI.Graphics()
      
      // 이소메트릭 타일 모양 (마름모)
      const tileWidth = this.config.tileWidth
      const tileHeight = this.config.tileHeight
      
      // 충돌 상태에 따른 색상 변경
      const strokeColor = isCollision ? 0xffaa00 : 0x00ff00  // 주황색 or 녹색
      const fillColor = isCollision ? 0xffaa00 : 0x00ff00    // 주황색 or 녹색
      
      pixelGraphics
        .setStrokeStyle({ width: 2, color: strokeColor, alpha: 0.8 })
        .setFillStyle({ color: fillColor, alpha: 0.3 })
        .moveTo(0, -tileHeight / 2)  // 위쪽 점
        .lineTo(tileWidth / 2, 0)     // 오른쪽 점
        .lineTo(0, tileHeight / 2)    // 아래쪽 점
        .lineTo(-tileWidth / 2, 0)    // 왼쪽 점
        .lineTo(0, -tileHeight / 2)   // 위쪽 점 (닫기)
        .fill()
        .stroke()
      
      // 🔧 타일 중심에 배치 (바닥 타일과 완전히 동일)
      pixelGraphics.x = cellX
      pixelGraphics.y = cellY
      // 그리드 픽셀이 이미지보다 아래에 오도록 Z-index 설정 (이미지는 +500)
      pixelGraphics.zIndex = cell.z * 1000 + cell.y * 10 + cell.x
      
      preview.addChild(pixelGraphics)
    })
  }

  /**
   * 마우스 좌표를 그리드 위치로 정확하게 변환 (스케일과 오프셋 고려)
   * 타일이 있는 영역에서만 배치 가능하도록 제한
   */
  getGridPositionFromMouse(mouseX: number, mouseY: number): Position3D | null {
    if (!this.containers || !this.isInitialized) {
      return null
    }

    const mainContainer = this.containers.main
    const scale = mainContainer.scale.x // 스케일 (x, y 동일)
    const offsetX = mainContainer.x
    const offsetY = mainContainer.y

    // 🔧 정확한 좌표 변환: 실제 캔버스 크기 고려
    const canvas = this.app.canvas as HTMLCanvasElement
    const rect = canvas.getBoundingClientRect()
    const displayWidth = rect.width
    const displayHeight = rect.height
    
    // PixiJS 앱의 실제 해상도
    const pixiWidth = this.app.screen.width
    const pixiHeight = this.app.screen.height
    
    // 마우스 좌표를 PixiJS 좌표계로 변환 (비율 정확히 계산)
    const pixiMouseX = (mouseX / displayWidth) * pixiWidth
    const pixiMouseY = (mouseY / displayHeight) * pixiHeight

    // main 컨테이너 좌표계로 역변환
    const localX = (pixiMouseX - offsetX) / scale
    const localY = (pixiMouseY - offsetY) / scale

    // 🔧 개선된 이소메트릭 변환 공식 (에디터와 동일)
    const tileWidth = this.config.tileWidth   // 40
    const tileHeight = this.config.tileHeight // 20
    
    const gridX = Math.round((localX / (tileWidth / 2) + localY / (tileHeight / 2)) / 2)
    const gridY = Math.round((localY / (tileHeight / 2) - localX / (tileWidth / 2)) / 2)

    const gridPosition: Position3D = { 
      x: gridX, 
      y: gridY, 
      z: 0 
    }

    return gridPosition
  }

  /**
   * 바닥 타일 렌더링 (사용자 정의 이미지 지원)
   */
  private async renderFloorTiles(grid: any, halfSize: number): Promise<void> {
    console.log('🏗️ renderFloorTiles 호출됨')
    const floorConfig = this.config.floorTile || {
      type: 'default',
      pattern: 'checkerboard',
      lightColor: 0xD2B48C,
      darkColor: 0xA0522D,
      opacity: 0.8,
      scale: 1.0
    }
    console.log('⚙️ 바닥 타일 설정:', floorConfig)

    // 사용자 정의 이미지가 있는 경우
    if (floorConfig.type === 'custom' && floorConfig.imageUrl) {
      console.log('🎨 커스텀 이미지 타일 렌더링 시작')
      try {
        // 이미지에서 픽셀 데이터 추출
        const imageData = await this.extractPixelData(floorConfig.imageUrl)
        
        for (let y = -halfSize; y <= halfSize; y++) {
          for (let x = -halfSize; x <= halfSize; x++) {
            const tileCenter = gridToIso(x + 0.5, y + 0.5, 0, this.config)
            
            // 이미지 좌표를 픽셀 에디터 좌표로 변환
            // 3D 바닥: -15 ~ 15 (31x31 타일)
            // 픽셀 에디터: 0 ~ 30 (31x31 픽셀)
            const pixelX = x + halfSize  // -15 + 15 = 0, 15 + 15 = 30
            const pixelY = y + halfSize  // -15 + 15 = 0, 15 + 15 = 30
            
            // 해당 픽셀의 색상 가져오기
            const pixelColor = imageData[pixelY]?.[pixelX] || 0xD2B48C
            
            // 디버깅: 첫 번째 타일만 로그 출력
            if (x === -halfSize && y === -halfSize) {
              console.log('🎯 첫 번째 타일 색상:', {
                gridPos: { x, y },
                pixelPos: { pixelX, pixelY },
                color: pixelColor.toString(16)
              })
            }
            
            // 개별 타일 생성
            const floorTile = new PIXI.Graphics()
            floorTile
              .setFillStyle({ color: pixelColor, alpha: floorConfig.opacity || 0.8 })
              .moveTo(0, -this.config.tileHeight / 2)
              .lineTo(this.config.tileWidth / 2, 0)
              .lineTo(0, this.config.tileHeight / 2)
              .lineTo(-this.config.tileWidth / 2, 0)
              .lineTo(0, -this.config.tileHeight / 2)
              .fill()
            
            floorTile.x = tileCenter.x
            floorTile.y = tileCenter.y
            floorTile.zIndex = -1000
            
            grid.addChild(floorTile)
          }
        }
        console.log('✅ 커스텀 이미지 타일 렌더링 완료')
        return
      } catch (error) {
        console.warn('사용자 정의 바닥 타일 로드 실패, 기본 타일 사용:', error)
      }
    }

    // 기본 타일 렌더링 (기존 로직)
    for (let y = -halfSize; y <= halfSize; y++) {
      for (let x = -halfSize; x <= halfSize; x++) {
        const tileCenter = gridToIso(x + 0.5, y + 0.5, 0, this.config)
        const tileWidth = this.config.tileWidth
        const tileHeight = this.config.tileHeight
        
        const floorTile = new PIXI.Graphics()
        
        // 패턴에 따른 색상 결정
        let tileColor: number
        if (floorConfig.pattern === 'solid') {
          tileColor = floorConfig.lightColor || 0xD2B48C
        } else {
          // 체스판 패턴 (기본)
          const isLight = (x + y) % 2 === 0
          tileColor = isLight ? (floorConfig.lightColor || 0xD2B48C) : (floorConfig.darkColor || 0xA0522D)
        }
        
        floorTile
          .setFillStyle({ color: tileColor, alpha: floorConfig.opacity || 0.8 })
          .moveTo(0, -tileHeight / 2)
          .lineTo(tileWidth / 2, 0)
          .lineTo(0, tileHeight / 2)
          .lineTo(-tileWidth / 2, 0)
          .lineTo(0, -tileHeight / 2)
          .fill()
        
        floorTile.x = tileCenter.x
        floorTile.y = tileCenter.y
        floorTile.zIndex = -1000
        
        grid.addChild(floorTile)
      }
    }
  }

  /**
   * 아이템의 모든 픽셀이 타일 영역 안에 있는지 확인
   */
  isItemWithinTileBounds(gridPosition: Position3D, item: DecorationItem): boolean {
    const halfSize = 15 // renderGrid에서 사용하는 것과 동일한 크기
    
    // 그리드 데이터가 없으면 중심점만 체크
    if (!item.gridData) {
      return gridPosition.x >= -halfSize && gridPosition.x < halfSize && 
             gridPosition.y >= -halfSize && gridPosition.y < halfSize
    }

    const { cells } = item.gridData

    // cells가 배열이 아닌 경우 기본 검사만 수행
    if (!Array.isArray(cells)) {
      console.warn('⚠️ gridData.cells가 배열이 아닙니다:', cells)
      return gridPosition.x >= -halfSize && gridPosition.x < halfSize && 
             gridPosition.y >= -halfSize && gridPosition.y < halfSize
    }

    // 아이템의 모든 셀(픽셀)이 타일 영역 안에 있는지 확인
    for (const cell of cells) {
      const worldX = gridPosition.x + cell.x
      const worldY = gridPosition.y + cell.y
      const worldZ = gridPosition.z + cell.z

      // 타일 영역 밖이거나 높이 제한을 넘으면 false
      if (worldX < -halfSize || worldX >= halfSize || 
          worldY < -halfSize || worldY >= halfSize || 
          worldZ < 0 || worldZ > 10) {
        return false
      }
    }

    return true
  }

  /**
   * 특정 위치의 아이템 찾기
   */
  getItemAtPosition(
    screenPosition: Position2D, 
    placedItems: PlacedItem[], 
    storeItems: DecorationItem[]
  ): PlacedItem | null {
    if (!this.containers) return null

    // 역순으로 검사 (상위 레이어부터)
    const sortedItems = [...placedItems].sort((a, b) => {
      const aZ = a.gridPosition?.z ?? a.position_z
      const bZ = b.gridPosition?.z ?? b.position_z
      return bZ - aZ
    })
    
    for (const placedItem of sortedItems) {
      const storeItem = storeItems.find(item => item.id === placedItem.itemId)
      if (!storeItem) continue

      const gridPosition: Position3D = placedItem.gridPosition ?? {
        x: placedItem.position_x,
        y: placedItem.position_y,
        z: placedItem.position_z
      }

      const itemPosition = calculatePlacementPosition(
        gridPosition,
        storeItem.anchor.x,
        storeItem.anchor.y,
        this.config
      )

      // 간단한 바운딩 박스 체크 (실제로는 텍스처 크기를 고려해야 함)
      const bounds = {
        x: itemPosition.x,
        y: itemPosition.y,
        width: 64, // 임시 크기
        height: 64
      }

      if (
        screenPosition.x >= bounds.x &&
        screenPosition.x <= bounds.x + bounds.width &&
        screenPosition.y >= bounds.y &&
        screenPosition.y <= bounds.y + bounds.height
      ) {
        return placedItem
      }
    }

    return null
  }

  /**
   * 배치된 아이템 클릭 이벤트 설정
   */
  setupPlacedItemClickEvents(
    onItemClick: (placedItem: PlacedItem) => void,
    placedItems: PlacedItem[],
    storeItems: DecorationItem[]
  ): void {
    if (!this.containers?.items) return

    // 기존 이벤트 리스너 제거
    this.containers.items.children.forEach((child: any) => {
      if (child.interactive) {
        child.removeAllListeners()
      }
    })

    // 각 배치된 아이템에 클릭 이벤트 추가
    placedItems.forEach(placedItem => {
      const storeItem = storeItems.find(item => item.id === placedItem.itemId)
      if (!storeItem) return

      // 해당 아이템의 스프라이트 찾기
      const sprite = this.containers?.items?.children?.find((child: any) => 
        child.label === storeItem.id
      ) as any

      if (sprite && sprite.interactive) {
        sprite.on('pointerdown', (event: any) => {
          event.stopPropagation()
          console.log('🎯 배치된 아이템 클릭됨:', placedItem.id, storeItem.name)
          onItemClick(placedItem)
        })
      }
    })
  }

  /**
   * 활성화된 아이템 드래그 앤 드롭 설정 (모바일 지원)
   */
  setupActiveItemDragDrop(
    activeItemId: string,
    placedItems: PlacedItem[],
    storeItems: DecorationItem[],
    onDragComplete: (newPosition: { x: number; y: number; z: number }) => void
  ): void {
    if (!this.containers?.items || !activeItemId) return

    // 활성화된 아이템 찾기
    const activePlacedItem = placedItems.find(item => item.id === activeItemId)
    if (!activePlacedItem) return

    const storeItem = storeItems.find(item => item.id === activePlacedItem.itemId)
    if (!storeItem) return

    // 해당 아이템의 스프라이트 찾기
    const sprite = this.containers?.items?.children?.find((child: any) => 
      child.label === storeItem.id
    ) as any

    if (!sprite || !sprite.interactive) return

    let isDragging = false
    let dragStart = { x: 0, y: 0 }
    let spriteStart = { x: 0, y: 0 }

    // 모바일 환경 감지
    const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768

    // 드래그 시작 (마우스와 터치 모두 지원)
    sprite.on('pointerdown', (event: any) => {
      console.log('🖱️ 드래그 시작:', activeItemId, isMobile ? '(모바일)' : '(데스크톱)')
      isDragging = true
      dragStart.x = event.data.global.x
      dragStart.y = event.data.global.y
      spriteStart.x = sprite.x
      spriteStart.y = sprite.y
      
      // 드래그 중인 아이템을 최상위로 이동
      sprite.zIndex = 9999
      
      // 모바일에서는 추가적인 터치 이벤트 설정
      if (isMobile) {
        sprite.on('pointermove', handlePointerMove)
        sprite.on('pointerup', handlePointerUp)
        sprite.on('pointerupoutside', handlePointerUpOutside)
      }
    })

    const handlePointerMove = (event: any) => {
      if (!isDragging) return

      const deltaX = event.data.global.x - dragStart.x
      const deltaY = event.data.global.y - dragStart.y

      sprite.x = spriteStart.x + deltaX
      sprite.y = spriteStart.y + deltaY
      
      console.log('🖱️ 드래그 중:', { deltaX, deltaY, newPos: { x: sprite.x, y: sprite.y } })
      
      // 모바일에서는 실시간 미리보기 표시
      if (isMobile) {
        const gridPos = this.getGridPositionFromSprite(sprite)
        if (gridPos) {
          // 미리보기 렌더링 (비동기로 처리하여 성능 최적화)
          requestAnimationFrame(() => {
            this.renderPreview(
              storeItem,
              gridPos,
              null, // dataStore는 배치된 아이템 드래그에서는 필요 없음
              placedItems.filter(item => item.id !== activeItemId), // 현재 드래그 중인 아이템 제외
              storeItems
            ).catch(error => {
              console.warn('모바일 드래그 미리보기 실패:', error)
            })
          })
        }
      }
    }

    const handlePointerUp = () => {
      if (!isDragging) return
      
      console.log('🖱️ 드래그 종료!')
      isDragging = false
      
      // 그리드에 맞춰 위치 조정
      const gridPos = this.getGridPositionFromSprite(sprite)
      if (gridPos) {
        // Z축 자동 조정
        const finalPosition = this.adjustZPosition(gridPos, storeItem, placedItems, storeItems)
        
        // 최종 위치로 스프라이트 이동
        const finalIsoPos = gridToIso(finalPosition.x, finalPosition.y, finalPosition.z, this.config)
        sprite.x = finalIsoPos.x - sprite.width / 2
        sprite.y = finalIsoPos.y - sprite.height / 2
        
        // Z-index 복원
        sprite.zIndex = finalPosition.z * 1000 + finalPosition.y * 10 + finalPosition.x
        
        console.log('✅ 드래그 완료, 최종 위치:', finalPosition)
        onDragComplete(finalPosition)
      }
      
      // 모바일 이벤트 리스너 제거
      if (isMobile) {
        sprite.off('pointermove', handlePointerMove)
        sprite.off('pointerup', handlePointerUp)
        sprite.off('pointerupoutside', handlePointerUpOutside)
      }
    }

    const handlePointerUpOutside = () => {
      if (isDragging) {
        isDragging = false
        // 원래 위치로 복원
        sprite.x = spriteStart.x
        sprite.y = spriteStart.y
        console.log('🔄 드래그 취소')
        
        // 모바일 이벤트 리스너 제거
        if (isMobile) {
          sprite.off('pointermove', handlePointerMove)
          sprite.off('pointerup', handlePointerUp)
          sprite.off('pointerupoutside', handlePointerUpOutside)
        }
      }
    }

    // 데스크톱에서는 기존 방식 유지
    if (!isMobile) {
      sprite.on('pointermove', handlePointerMove)
      sprite.on('pointerup', handlePointerUp)
      sprite.on('pointerupoutside', handlePointerUpOutside)
    }
  }

  /**
   * 스프라이트 위치에서 그리드 위치 계산
   */
  private getGridPositionFromSprite(sprite: any): { x: number; y: number; z: number } | null {
    if (!this.containers?.main) return null

    const mainContainer = this.containers.main
    const scale = mainContainer.scale.x
    const offsetX = mainContainer.x
    const offsetY = mainContainer.y

    // 스프라이트의 월드 좌표 계산
    const worldX = (sprite.x * scale) + offsetX
    const worldY = (sprite.y * scale) + offsetY

    // 캔버스 좌표로 변환
    const canvas = this.app.canvas as HTMLCanvasElement
    const rect = canvas.getBoundingClientRect()
    const displayWidth = rect.width
    const displayHeight = rect.height
    
    const pixiWidth = this.app.screen.width
    const pixiHeight = this.app.screen.height
    
    const canvasX = (worldX / pixiWidth) * displayWidth
    const canvasY = (worldY / pixiHeight) * displayHeight

    return this.getGridPositionFromMouse(canvasX, canvasY)
  }

  /**
   * Z축 위치 자동 조정
   */
  private adjustZPosition(
    position: { x: number; y: number; z: number },
    item: DecorationItem,
    placedItems: PlacedItem[],
    storeItems: DecorationItem[]
  ): { x: number; y: number; z: number } {
    if (!item.gridData) return position

    const maxZ = 10
    let foundPosition = false
    let finalPosition = position

    // Z축을 점진적으로 올려가며 충돌 검사
    for (let z = position.z; z <= maxZ; z++) {
      const testPosition = { ...position, z }
      
      // 충돌 검사 수행
      const hasCollision = this.checkPreviewCollision(testPosition, item, placedItems, storeItems)
      
      if (!hasCollision) {
        finalPosition = testPosition
        foundPosition = true
        console.log('🔧 Z축 자동 조정:', position.z, '→', finalPosition.z)
        break
      }
    }

    return finalPosition
  }

  /**
   * 장착한 아이템에서 특정 아이템 찾기
   */
  private findEquippedItem(characterData: CharacterData, itemId: string) {
    if (!characterData.equippedItems || !Array.isArray(characterData.equippedItems)) {
      return null
    }
    
    return characterData.equippedItems.find(equippedItem => {
      // null 체크 추가
      if (!equippedItem || !equippedItem.item || !equippedItem.item.id) {
        return false
      }
      return equippedItem.item.id === itemId
    })
  }

  /**
   * 캐릭터 렌더링 - 상점 프리뷰와 동일한 레이어드 시스템
   */
  async renderCharacter(characterData: CharacterData | null): Promise<any> {
    if (!characterData || !this.app) {
      return null
    }

    try {
      const PIXI = await loadPixi()
      
      // 캐릭터 데이터 로깅
      console.log('🎭 캐릭터 렌더링 시작:', {
        parts: characterData.parts,
        equippedItems: characterData.equippedItems,
        equippedItemsLength: characterData.equippedItems?.length || 0
      })
      
      // 캐릭터 컨테이너 생성
      const characterContainer = new PIXI.Container()
      characterContainer.label = 'character'
      
      // 캐릭터 크기 설정 (확실히 보이도록 크게)
      const characterSize = this.config?.tileWidth ? this.config.tileWidth * 3 : 96 // 더 크게
      
      // 기본 캐릭터 베이스 렌더링
      await this.renderCharacterPart(characterContainer, 'default-character.png', 'base', characterSize)
      
      // 각 파츠 렌더링 (레이어 순서: 하의 → 상의 → 헤어 → 감정)
      // 하의 렌더링
      if (characterData.parts.bottom && characterData.parts.bottom !== 'none.png') {
        const bottomItem = this.findEquippedItem(characterData, characterData.parts.bottom)
        const bottomImageUrl = bottomItem?.item?.image_url || characterData.parts.bottom
        console.log('👕 하의 렌더링:', { itemId: characterData.parts.bottom, bottomItem, bottomImageUrl })
        await this.renderCharacterPart(characterContainer, bottomImageUrl, 'bottom', characterSize)
      }
      
      // 상의 렌더링
      if (characterData.parts.top && characterData.parts.top !== 'none.png') {
        const topItem = this.findEquippedItem(characterData, characterData.parts.top)
        const topImageUrl = topItem?.item?.image_url || characterData.parts.top
        console.log('👔 상의 렌더링:', { itemId: characterData.parts.top, topItem, topImageUrl })
        await this.renderCharacterPart(characterContainer, topImageUrl, 'top', characterSize)
      }
      
      // 헤어 렌더링
      if (characterData.parts.hair && characterData.parts.hair !== 'none.png') {
        const hairItem = this.findEquippedItem(characterData, characterData.parts.hair)
        const hairImageUrl = hairItem?.item?.image_url || characterData.parts.hair
        console.log('💇 헤어 렌더링:', { itemId: characterData.parts.hair, hairItem, hairImageUrl })
        await this.renderCharacterPart(characterContainer, hairImageUrl, 'hair', characterSize)
      }
      
      // 감정 렌더링 (말풍선 형태)
      if (characterData.parts.emotion && characterData.parts.emotion !== 'none.png') {
        console.log('😊 감정 말풍선 렌더링:', { emotionFileName: characterData.parts.emotion })
        await this.renderEmotionBubble(characterContainer, characterData.parts.emotion, characterSize)
      }
      
      // 캐릭터 위치 설정 (화면 중앙에 고정 배치)
      characterContainer.x = 0 // 화면 중앙 X
      characterContainer.y = 0 // 화면 중앙 Y
      
      // 캐릭터 컨테이너 앵커 설정 (중앙 기준)
      characterContainer.anchor?.set(0.5, 0.5) // X, Y 모두 중앙
      
      // 캐릭터 드래그 설정 (즉시 활성화)
      characterContainer.interactive = true
      characterContainer.buttonMode = true
      characterContainer.cursor = 'pointer'
      
      // 캐릭터를 캔버스에 추가
      if (this.containers?.character) {
        this.containers.character.addChild(characterContainer)
        console.log('✅ 캐릭터가 character 컨테이너에 추가됨')
      } else {
        console.error('❌ character 컨테이너가 초기화되지 않았습니다.')
        return null
      }
      
      console.log('🎭 캐릭터 렌더링 완료:', {
        parts: characterData.parts,
        containerPosition: { x: characterContainer.x, y: characterContainer.y },
        containerChildren: characterContainer.children.length,
        containerVisible: characterContainer.visible,
        containerAlpha: characterContainer.alpha,
        containerScale: { x: characterContainer.scale.x, y: characterContainer.scale.y },
        containerAnchor: characterContainer.anchor ? { x: characterContainer.anchor.x, y: characterContainer.anchor.y } : 'no anchor',
        characterSize: characterSize,
        mainContainerChildren: this.containers?.main?.children?.length || 0,
        mainContainerVisible: this.containers?.main?.visible,
        mainContainerAlpha: this.containers?.main?.alpha,
        mainContainerPosition: this.containers?.main ? { x: this.containers.main.x, y: this.containers.main.y } : 'no main container',
        mainContainerScale: this.containers?.main ? { x: this.containers.main.scale.x, y: this.containers.main.scale.y } : 'no main container'
      })
      
      return characterContainer
    } catch (error) {
      console.error('❌ 캐릭터 렌더링 실패:', error)
      return null
    }
  }

  /**
   * 캐릭터 파츠 렌더링 - 상점 프리뷰와 동일한 이미지 처리
   */
  private async renderCharacterPart(container: any, partFileName: string, partType: string, size: number): Promise<void> {
    if (!this.app) return

    // 이미지 소스 결정 (상점 프리뷰와 동일한 로직)
    let imageSrc = ''
    if (!partFileName || partFileName === 'none.png') {
      imageSrc = '/assets/character/none.png'
    } else if (partFileName.startsWith('data:image/')) {
      imageSrc = partFileName // base64 이미지
    } else if (partFileName.startsWith('http') || partFileName.startsWith('/')) {
      imageSrc = partFileName // 전체 URL
    } else {
      // 파일명에 확장자가 없으면 .png 추가
      const fileName = partFileName.includes('.') ? partFileName : `${partFileName}.png`
      imageSrc = `/assets/character/${fileName}` // 파일명
    }

    try {
      const PIXI = await loadPixi()
      
      // 텍스처 로드
      const texture = await PIXI.Assets.load(imageSrc)
      
      // 텍스처가 null인 경우 처리
      if (!texture) {
        console.warn(`⚠️ 텍스처 로드 실패: ${imageSrc}, 기본 이미지로 대체`)
        // 기본 이미지로 대체 시도
        const fallbackTexture = await PIXI.Assets.load('/assets/character/default-character.png')
        if (!fallbackTexture) {
          console.error(`❌ 기본 이미지도 로드 실패: /assets/character/default-character.png`)
          return
        }
        const sprite = new PIXI.Sprite(fallbackTexture)
        sprite.label = `character-${partType}-fallback`
        sprite.width = size
        sprite.height = size
        sprite.anchor.set(0.5, 0.5)
        sprite.zIndex = this.getCharacterPartZIndex(partType)
        container.addChild(sprite)
        return
      }
      
      // 스프라이트 생성
      const sprite = new PIXI.Sprite(texture)
      sprite.label = `character-${partType}`
      
      // 크기 설정 (픽셀 아트 스타일 유지)
      sprite.width = size
      sprite.height = size
      
      // 앵커 포인트 설정 (중앙 기준)
      sprite.anchor.set(0.5, 0.5)
      
      // 레이어 순서에 따른 z-index 설정
      const zIndex = this.getCharacterPartZIndex(partType)
      sprite.zIndex = zIndex
      
      container.addChild(sprite)
      
      console.log(`✅ 캐릭터 파츠 렌더링 성공: ${partType}`, {
        imageSrc,
        size,
        zIndex
      })
    } catch (error) {
      console.error(`❌ 캐릭터 파츠 렌더링 실패: ${partType}`, {
        error: error instanceof Error ? error.message : String(error),
        imageSrc,
        partFileName,
        partType
      })
      
      // 에러 발생 시 기본 이미지로 대체 시도
      try {
        const PIXI = await loadPixi()
        const fallbackTexture = await PIXI.Assets.load('/assets/character/default-character.png')
        if (fallbackTexture) {
          const fallbackSprite = new PIXI.Sprite(fallbackTexture)
          fallbackSprite.label = `character-${partType}-error-fallback`
          fallbackSprite.width = size
          fallbackSprite.height = size
          fallbackSprite.anchor.set(0.5, 0.5)
          fallbackSprite.zIndex = this.getCharacterPartZIndex(partType)
          container.addChild(fallbackSprite)
          console.log(`✅ 에러 대체 이미지 렌더링 성공: ${partType}`)
        }
      } catch (fallbackError) {
        console.error(`❌ 대체 이미지 렌더링도 실패: ${partType}`, fallbackError)
      }
    }
  }
  
  /**
   * 캐릭터 파츠의 z-index 결정
   */
  private getCharacterPartZIndex(partType: string): number {
    const zIndexMap: Record<string, number> = {
      'base': 0,      // 기본 캐릭터 (맨 아래)
      'bottom': 1,    // 하의
      'top': 2,       // 상의
      'hair': 3,      // 헤어 (맨 위)
      'emotion': 4    // 감정 (최상위)
    }
    return zIndexMap[partType] || 0
  }

  /**
   * 감정 텍스트 매핑
   */
  private getEmotionText(emotionFileName: string): string {
    const emotionMap: Record<string, string> = {
      'happy.png': '😊',
      'sad.png': '😢',
      'angry.png': '😠',
      'surprised.png': '😲',
      'love.png': '❤️',
      'heart.png': '❤️',
      'laugh.png': '😂',
      'wink.png': '😉',
      'cool.png': '😎',
      'sleepy.png': '😴',
      'confused.png': '😕',
      'excited.png': '🤩',
      'default': '😊'
    }
    
    // 파일명에서 확장자 제거
    const emotionKey = emotionFileName.replace('.png', '')
    return emotionMap[emotionKey] || emotionMap['default']
  }

  /**
   * 감정 말풍선 렌더링 (텍스트 기반)
   */
  private async renderEmotionBubble(container: any, emotionFileName: string, size: number): Promise<void> {
    if (!this.app) return

    try {
      const PIXI = await loadPixi()
      
      // 감정 텍스트 가져오기
      const emotionText = this.getEmotionText(emotionFileName)
      
      // 말풍선 컨테이너 생성
      const bubbleContainer = new PIXI.Container()
      bubbleContainer.label = 'emotion-bubble'
      
      // 말풍선 배경 (원형)
      const bubbleGraphics = new PIXI.Graphics()
      bubbleGraphics.beginFill(0xFFFFFF, 0.9) // 흰색 배경, 약간 투명
      bubbleGraphics.lineStyle(2, 0x000000, 0.8) // 검은색 테두리
      bubbleGraphics.drawCircle(0, 0, size * 0.3) // 원형 말풍선
      bubbleGraphics.endFill()
      
      // 말풍선 꼬리 (아래쪽)
      bubbleGraphics.beginFill(0xFFFFFF, 0.9)
      bubbleGraphics.lineStyle(2, 0x000000, 0.8)
      bubbleGraphics.moveTo(-size * 0.1, size * 0.2)
      bubbleGraphics.lineTo(size * 0.1, size * 0.2)
      bubbleGraphics.lineTo(0, size * 0.4)
      bubbleGraphics.closePath()
      bubbleGraphics.endFill()
      
      bubbleContainer.addChild(bubbleGraphics)
      
      // 감정 텍스트 생성
      const emotionStyle = new PIXI.TextStyle({
        fontFamily: 'Arial',
        fontSize: size * 0.4,
        fill: 0x000000,
        align: 'center'
      })
      
      const emotionDisplay = new PIXI.Text(emotionText, emotionStyle)
      emotionDisplay.anchor.set(0.5, 0.5)
      emotionDisplay.x = 0
      emotionDisplay.y = 0
      
      bubbleContainer.addChild(emotionDisplay)
      
      // 말풍선 위치 설정 (캐릭터 위쪽)
      bubbleContainer.x = 0
      bubbleContainer.y = -size * 0.8 // 캐릭터 위쪽에 배치
      
      // 앵커 포인트 설정 (중앙 기준)
      bubbleContainer.anchor?.set(0.5, 0.5)
      
      // 최상위 레이어
      bubbleContainer.zIndex = this.getCharacterPartZIndex('emotion')
      
      container.addChild(bubbleContainer)
      
      console.log('✅ 감정 말풍선 렌더링 성공:', {
        emotionText,
        emotionFileName,
        bubbleSize: size * 0.3
      })
    } catch (error) {
      console.error('❌ 감정 말풍선 렌더링 실패:', error)
    }
  }

  /**
   * 캐릭터 드래그 앤 드롭 설정
   */
  setupCharacterDragDrop(characterContainer: any, onPositionChange: (position: Position2D) => void): void {
    if (!characterContainer || !this.app) return

    let isDragging = false
    let dragStart = { x: 0, y: 0 }
    let characterStart = { x: 0, y: 0 }

    // 마우스 이벤트 설정
    characterContainer.interactive = true
    characterContainer.cursor = 'pointer'

    // 드래그 시작
    characterContainer.on('pointerdown', (event: any) => {
      console.log('🎭 캐릭터 클릭됨! 드래그 시작')
      isDragging = true
      dragStart.x = event.data.global.x
      dragStart.y = event.data.global.y
      characterStart.x = characterContainer.x
      characterStart.y = characterContainer.y
      
      console.log('🎭 드래그 시작 위치:', { 
        dragStart: dragStart, 
        characterStart: characterStart,
        currentPos: { x: characterContainer.x, y: characterContainer.y }
      })
    })

    // 드래그 중
    characterContainer.on('pointermove', (event: any) => {
      if (!isDragging) return

      const deltaX = event.data.global.x - dragStart.x
      const deltaY = event.data.global.y - dragStart.y

      characterContainer.x = characterStart.x + deltaX
      characterContainer.y = characterStart.y + deltaY
      
      console.log('🎭 드래그 중:', { 
        deltaX, deltaY, 
        newPos: { x: characterContainer.x, y: characterContainer.y }
      })
    })

    // 드래그 종료
    characterContainer.on('pointerup', () => {
      if (!isDragging) return
      
      console.log('🎭 캐릭터 드래그 종료!')
      isDragging = false
      
      // 그리드에 맞춰 위치 조정
      const gridConfig = this.config || DEFAULT_GRID_CONFIG
      const gridPos = isoToGrid(characterContainer.x, characterContainer.y, gridConfig)
      
      // 캐릭터는 4픽셀 공간을 차지하므로 범위 조정
      const clampedX = Math.max(0, Math.min(gridPos.x, gridConfig.cols - 2))
      const clampedY = Math.max(0, Math.min(gridPos.y, gridConfig.rows - 2))
      
      // 최종 위치 설정
      const finalWorldPos = gridToIso(clampedX, clampedY, 0, gridConfig)
      characterContainer.x = finalWorldPos.x
      characterContainer.y = finalWorldPos.y
      
      // 위치 변경 콜백 호출
      onPositionChange({ x: clampedX, y: clampedY })
      
      console.log('🎭 캐릭터 드래그 완료:', {
        gridPos: { x: clampedX, y: clampedY },
        worldPos: { x: finalWorldPos.x, y: finalWorldPos.y }
      })
    })

    // 드래그 취소 (마우스가 캔버스 밖으로 나간 경우)
    characterContainer.on('pointerupoutside', () => {
      if (isDragging) {
        isDragging = false
        // 원래 위치로 복원
        characterContainer.x = characterStart.x
        characterContainer.y = characterStart.y
        console.log('🎭 캐릭터 드래그 취소')
      }
    })
  }

  /**
   * 정리
   */
  async destroy(): Promise<void> {
    if (this.isDestroying) {
      return // 이미 정리 중이면 중복 실행 방지
    }
    
    this.isDestroying = true
    
    // 이미 destroy가 진행 중이면 기존 Promise 반환
    if (this.destroyPromise) {
      return this.destroyPromise
    }
    
    this.destroyPromise = this.performDestroy()
    return this.destroyPromise
  }
  
  /**
   * 실제 정리 작업 수행
   */
  private async performDestroy(): Promise<void> {
    
    try {
      // 0단계: 이미 정리 중이면 중복 실행 방지
      if (this.isDestroying) {
        return
      }
      
      this.isDestroying = true
      
      // 1단계: 티커 완전 정지
      if (this.app?.ticker) {
        try {
          this.app.ticker.stop()
          // 티커의 모든 리스너 제거
          if (this.app.ticker.remove) {
            this.app.ticker.remove()
          }
        } catch (e) {
          console.warn('티커 정지 중 오류:', e)
        }
      }
      
      // 2단계: 컨테이너 정리 (자식 요소들 제거)
      if (this.containers) {
        try {
          const containers = ['main', 'grid', 'items', 'preview', 'ui']
          containers.forEach(containerName => {
            const container = this.containers?.[containerName as keyof PixiContainers]
            if (container) {
              try {
                container.removeChildren()
              } catch (e) {
                // 개별 컨테이너 정리 실패는 무시
              }
            }
          })
        } catch (e) {
          console.warn('컨테이너 정리 중 오류:', e)
        }
      }
      
      // 3단계: 스테이지 정리
      if (this.app?.stage) {
        try {
          this.app.stage.removeChildren()
        } catch (e) {
          console.warn('스테이지 정리 중 오류:', e)
        }
      }
      
      // 4단계: 캔버스 DOM에서 수동 제거
      if (this.canvasNode && this.canvasElement) {
        try {
          if (this.canvasElement.contains(this.canvasNode)) {
            this.canvasElement.removeChild(this.canvasNode)
          }
        } catch (e) {
          console.warn('DOM 제거 중 오류:', e)
        }
      }
      
      // 5단계: 렌더러 정리 (가장 마지막에)
      if (this.app?.renderer) {
        try {
          // 렌더러가 이미 정리되었는지 확인
          if (this.app.renderer.destroyed) {
            return
          }
          
          // WebGL 컨텍스트가 유효한지 먼저 확인
          if (this.app.renderer.gl && !this.app.renderer.gl.isContextLost()) {
            try {
              const loseContext = this.app.renderer.gl.getExtension('WEBGL_lose_context')
              if (loseContext) {
                loseContext.loseContext()
              }
            } catch (e) {
              // GL 컨텍스트 정리 실패는 무시
            }
          }
          
          // 렌더러 destroy 호출 전에 안전성 체크
          if (this.app.renderer.destroy && typeof this.app.renderer.destroy === 'function') {
            try {
              this.app.renderer.destroy(true)
            } catch (e) {
              console.warn('렌더러 destroy 중 오류:', e)
            }
          }
        } catch (e) {
          console.warn('렌더러 정리 중 오류:', e)
        }
      }
      
      // 6단계: 앱 정리 (마지막 단계)
      if (this.app) {
        try {
          // 앱이 이미 정리되었는지 확인
          if (this.app.destroyed) {
            return
          }
          
          // 앱 destroy 호출 전에 모든 참조를 null로 설정
          this.app.stage = null
          this.app.renderer = null
          this.app.ticker = null
          
          // 앱 정리 (안전한 옵션으로)
          if (this.app.destroy && typeof this.app.destroy === 'function') {
            try {
              this.app.destroy(true, { 
                children: true, 
                texture: true,
                baseTexture: true,
                removeView: false  // DOM 제거는 수동으로 처리
              })
            } catch (e) {
              console.warn('앱 destroy 중 오류:', e)
            }
          }
        } catch (e) {
          console.warn('앱 정리 중 오류:', e)
        }
      }

      // 7단계: 모든 참조 정리
      this.containers = null
      this.loadedTextures.clear()
      this.canvasElement = null
      this.canvasNode = null
      this.isInitialized = false
      this.isDestroying = false
      this.destroyPromise = null

    } catch (error) {
      console.warn('PixiManager 정리 중 오류:', error)
      // 강제로 모든 참조 정리
      this.app = null
      this.containers = null
      this.loadedTextures.clear()
      this.canvasElement = null
      this.canvasNode = null
      this.isInitialized = false
      this.isDestroying = false
      this.destroyPromise = null
      this.gridRendered = false // 🔧 그리드 렌더링 플래그 리셋
      this.lastShowFullGrid = null
    }
  }

  // Getter 메서드들
  get application(): any {
    return this.app
  }

  get pixiContainers(): PixiContainers | null {
    return this.containers
  }


}


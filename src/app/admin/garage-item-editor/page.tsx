// 🎨 3D 미니차고 아이템 에디터 - 관리자 전용 미니차고 아이템 등록 시스템
// 완전 리팩토링 버전 - RLS 문제 해결

'use client'

import React, { useState, useRef, useCallback, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

// decoration-system-standalone 타입 시스템 활용
interface Position2D {
  x: number
  y: number
}

interface Position3D extends Position2D {
  z: number
}

interface GridCell3D {
  x: number
  y: number
  z: number
  occupied: boolean
}

interface ItemAnchor {
  x: number
  y: number
}

interface StoreItem {
  id: string
  name: string
  imageUrl: string
  anchor: ItemAnchor
  price?: number
  description?: string
  subCategory?: 'vehicle' | 'interior' | 'props'
  gridData?: {
    cells: GridCell3D[]
    width: number
    height: number
    depth: number
    centerX: number
    centerY: number
    totalCells: number
    // 🔧 에디터에서 저장된 정확한 위치 정보
    imageOffsetX?: number  // 이미지 앵커 X 오프셋
    imageOffsetY?: number  // 이미지 앵커 Y 오프셋
    pixelScale?: number    // 픽셀 스케일 (향후 확장용)
  }
}

interface GridConfig {
  rows: number
  cols: number
  tileWidth: number
  tileHeight: number
  maxHeight: number
}

// PixiJS 동적 import
let PIXI: any = null

async function loadPixi() {
  if (!PIXI) {
    PIXI = await import('pixi.js')
  }
  return PIXI
}

// 기본 그리드 설정 (decoration-system-standalone과 동일)
const DEFAULT_GRID_CONFIG: GridConfig = {
  rows: 80,
  cols: 80,
  tileWidth: 20,
  tileHeight: 10,
  maxHeight: 10
}

// 그리드 유틸리티 함수들 (decoration-system-standalone에서 가져옴)
function gridToIso(x: number, y: number, z: number, config: GridConfig): Position2D {
  return {
    x: (x - y) * (config.tileWidth / 2),
    y: (x + y) * (config.tileHeight / 2) - z * config.tileHeight
  }
}

// 미니차고 카테고리 정의 (미니차고 전용)
const GARAGE_CATEGORIES = {
  vehicle: { label: '운송수단' },
  interior: { label: '인테리어' },
  props: { label: '소품' }
}

// 데이터베이스 기반 DataStore 클래스
class DatabaseDataStore {
  private storeItems: StoreItem[] = []

  constructor() {
    this.loadFromDatabase()
  }

  private async loadFromDatabase(): Promise<void> {
    try {
      const { data, error } = await supabase
        .from('shop_items')
        .select('*')
        .eq('is_active', true)
        .order('main_category', { ascending: true })
        .order('sub_category', { ascending: true })
        .order('name', { ascending: true })

      if (error) {
        console.error('데이터베이스 로드 실패:', error)
        return
      }

      this.storeItems = (data || []).map(item => ({
        id: item.id,
        name: item.name,
        description: item.description || '',
        imageUrl: item.image_url,
        subCategory: item.sub_category || 'props', // 기본값 설정
        price: item.price || 0,
        anchor: item.anchor || { x: 0, y: 0 },
        gridData: item.pixel_data || {
          cells: [],
          width: 32,
          height: 32,
          depth: 1,
          centerX: 16,
          centerY: 16,
          totalCells: 0
        }
      }))
    } catch (error) {
      console.error('데이터베이스 로드 실패:', error)
    }
  }

  async getStoreItems(): Promise<StoreItem[]> {
    await this.loadFromDatabase()
    return [...this.storeItems]
  }

  async addStoreItem(item: StoreItem): Promise<void> {
    try {
      // 현재 사용자 ID 가져오기
      const { data: { user } } = await supabase.auth.getUser()
      
      const dbItem = {
        name: item.name,
        description: item.description || '',
        image_url: item.imageUrl,
        main_category: 'garage', // 미니차고 전용
        sub_category: item.subCategory || 'props',
        price: item.price || 0,
        anchor: item.anchor,
        pixel_data: item.gridData,
        is_active: true,
        created_by: user?.id || null // 현재 사용자 ID 또는 NULL
      }

      console.log('아이템 추가 시도:', dbItem)

      const { error } = await supabase
        .from('shop_items')
        .insert([dbItem])

      if (error) {
        console.error('아이템 추가 실패:', error)
        throw error
      }

      console.log('아이템 추가 성공!')
      await this.loadFromDatabase()
    } catch (error) {
      console.error('아이템 추가 실패:', error)
      throw error
    }
  }

  async updateStoreItem(item: StoreItem): Promise<void> {
    try {
      // 현재 사용자 ID 가져오기
      const { data: { user } } = await supabase.auth.getUser()
      
      const dbItem = {
        name: item.name,
        description: item.description || '',
        image_url: item.imageUrl,
        main_category: 'garage', // 미니차고 전용
        sub_category: item.subCategory || 'props',
        price: item.price || 0,
        anchor: item.anchor,
        pixel_data: item.gridData,
        updated_at: new Date().toISOString(),
        created_by: user?.id || null // 현재 사용자 ID 또는 NULL
      }

      console.log('아이템 수정 시도:', dbItem)

      const { error } = await supabase
        .from('shop_items')
        .update(dbItem)
        .eq('id', item.id)

      if (error) {
        console.error('아이템 수정 실패:', error)
        throw error
      }

      console.log('아이템 수정 성공!')
      await this.loadFromDatabase()
    } catch (error) {
      console.error('아이템 수정 실패:', error)
      throw error
    }
  }

  async removeStoreItem(itemId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('shop_items')
        .update({ is_active: false })
        .eq('id', itemId)

      if (error) {
        console.error('아이템 삭제 실패:', error)
        return false
      }

      await this.loadFromDatabase()
      return true
    } catch (error) {
      console.error('아이템 삭제 실패:', error)
      return false
    }
  }
}

// 전역 DataStore 인스턴스
const dataStore = new DatabaseDataStore()

export default function ItemEditorPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  // 파일 입력 참조
  const fileInputRef = useRef<HTMLInputElement>(null)
  const canvasRef = useRef<HTMLDivElement>(null)

  // PixiJS 관리
  const pixiAppRef = useRef<any>(null)
  const pixiContainersRef = useRef<any>(null)
  const [isCanvasReady, setIsCanvasReady] = useState(false)

  // 편집 중인 아이템 상태
  const [editingItem, setEditingItem] = useState<StoreItem>({
    id: '',
    name: '',
    imageUrl: '',
    anchor: { x: 0, y: 0 },
    price: 0,
    description: '',
    subCategory: 'props',
    gridData: {
      cells: [],
      width: 32,
      height: 32,
      depth: 1,
      centerX: 16,
      centerY: 16,
      totalCells: 0
    }
  })

  // 3D 그리드 편집 상태
  const [selectedLayer, setSelectedLayer] = useState(0)
  const [selectedPixels, setSelectedPixels] = useState<Set<string>>(new Set())
  const [isSelectingPixels, setIsSelectingPixels] = useState(false)
  const [showGrid, setShowGrid] = useState(true)
  const [hoveredCell, setHoveredCell] = useState<Position2D | null>(null)
  const [hoveredVoxel, setHoveredVoxel] = useState<string | null>(null)

  // UI 상태
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [imageNaturalSize, setImageNaturalSize] = useState<{ width: number; height: number } | null>(null)
  
  // 아이템 관리 (통합됨)
  const [existingItems, setExistingItems] = useState<StoreItem[]>([])
  const [selectedExistingItem, setSelectedExistingItem] = useState<StoreItem | null>(null)
  


  // 🎮 PixiJS 캔버스 초기화
  const initializeCanvas = useCallback(async () => {
    if (!canvasRef.current || isCanvasReady) return

    try {
  
      
      // PixiJS 동적 로드
      const PixiJS = await loadPixi()
      
      // PixiJS v8 방식으로 앱 생성 (컨테이너에 맞는 크기)
      const app = new PixiJS.Application()
      await app.init({
        width: 800,  // 더 작은 너비
        height: 500, // 더 작은 높이
        backgroundColor: 0x0a0a2a,
        antialias: true,
        resolution: window.devicePixelRatio || 1,
        autoDensity: true
      })

      // 캔버스 추가 (컨테이너에 맞게 스타일링)
      const canvas = app.canvas as HTMLCanvasElement
      canvas.style.border = 'none'
      canvas.style.outline = 'none'
      canvas.style.display = 'block'
      canvas.style.width = '100%'
      canvas.style.height = 'auto'
      canvas.style.maxWidth = '800px'
      canvas.style.maxHeight = '500px'
      canvasRef.current.appendChild(canvas)

      // 컨테이너 구조 생성
      const main = new PixiJS.Container()
      const grid = new PixiJS.Container()
      const items = new PixiJS.Container()
      const preview = new PixiJS.Container()
      const ui = new PixiJS.Container()

      // 컨테이너 계층 구조 설정
      main.addChild(grid)
      main.addChild(items)
      main.addChild(preview)
      main.addChild(ui)

      // Z-index 정렬 활성화
      items.sortableChildren = true
      preview.sortableChildren = true

      app.stage.addChild(main)

      const containers = { main, grid, items, preview, ui }

      // 자동 스케일링 설정 (작은 캔버스에 맞게)
      const scale = 0.6
      main.scale.set(scale)
      main.x = 400  // 800/2
      main.y = 250  // 500/2

      pixiAppRef.current = app
      pixiContainersRef.current = containers

      setIsCanvasReady(true)
      
      
      // 초기화 완료 후 그리드 렌더링
      setTimeout(() => {
        renderGrid()
        setupCanvasEvents()
    
      }, 100)
    } catch (error) {
      console.error('❌ PixiJS 초기화 실패:', error)
    }
  }, [])

  // 🎨 이미지 크기에 맞는 동적 그리드 렌더링
  const renderGrid = useCallback(() => {

    
    if (!pixiContainersRef.current) {
      
      return
    }
    
    if (!PIXI) {
      
      return
    }

    const { grid } = pixiContainersRef.current
    
    
    grid.removeChildren()

    // 복셀과 동일한 크기 사용
    const tileWidth = DEFAULT_GRID_CONFIG.tileWidth  // 20
    const tileHeight = DEFAULT_GRID_CONFIG.tileHeight // 10

    // 3D 그리드 라인 표시 (복셀 선택용) - 항상 표시
    const gridGraphics = new PIXI.Graphics()
    

    // 이미지가 있으면 이미지 크기에 맞게, 없으면 기본 크기
    if (editingItem.imageUrl && editingItem.gridData) {
      const gridWidth = editingItem.gridData.width
      const gridHeight = editingItem.gridData.height
      

      
      // 이미지 크기에 여유있게 +1씩만 더 넓은 그리드 영역 계산
      const margin = 1
      const startX = -Math.floor(gridWidth / 2) - margin
      const startY = -Math.floor(gridHeight / 2) - margin
      const endX = startX + gridWidth + (margin * 2)
      const endY = startY + gridHeight + (margin * 2)
      
      // 이미지 영역에 맞는 참고용 그리드 (연하게)
      gridGraphics.setStrokeStyle({ width: 1, color: 0x666666, alpha: 0.2 })
      
      // 이미지 영역 내의 그리드 라인만 표시
      for (let y = startY; y <= endY; y++) {
        const start = gridToIso(startX, y, 0, { ...DEFAULT_GRID_CONFIG, tileWidth, tileHeight })
        const end = gridToIso(endX, y, 0, { ...DEFAULT_GRID_CONFIG, tileWidth, tileHeight })
        gridGraphics.moveTo(start.x, start.y).lineTo(end.x, end.y)
      }
      for (let x = startX; x <= endX; x++) {
        const start = gridToIso(x, startY, 0, { ...DEFAULT_GRID_CONFIG, tileWidth, tileHeight })
        const end = gridToIso(x, endY, 0, { ...DEFAULT_GRID_CONFIG, tileWidth, tileHeight })
        gridGraphics.moveTo(start.x, start.y).lineTo(end.x, end.y)
      }
      gridGraphics.stroke() // 참고용 그리드 완료

      // 현재 레이어 편집 평면 (이미지 크기에 맞게)
      gridGraphics.setStrokeStyle({ width: 2, color: 0x4a90e2, alpha: 0.6 })
      for (let y = startY; y <= endY; y += 2) {
        const start = gridToIso(startX, y, selectedLayer, { ...DEFAULT_GRID_CONFIG, tileWidth, tileHeight })
        const end = gridToIso(endX, y, selectedLayer, { ...DEFAULT_GRID_CONFIG, tileWidth, tileHeight })
        gridGraphics.moveTo(start.x, start.y).lineTo(end.x, end.y)
      }
      for (let x = startX; x <= endX; x += 2) {
        const start = gridToIso(x, startY, selectedLayer, { ...DEFAULT_GRID_CONFIG, tileWidth, tileHeight })
        const end = gridToIso(x, endY, selectedLayer, { ...DEFAULT_GRID_CONFIG, tileWidth, tileHeight })
        gridGraphics.moveTo(start.x, start.y).lineTo(end.x, end.y)
      }
      gridGraphics.stroke() // 현재 레이어 평면 완료

      // 위 레이어 평면 (이미지 크기에 맞게, 연한 초록색)
      const upperZ = selectedLayer + 1
      gridGraphics.setStrokeStyle({ width: 1, color: 0x4ecdc4, alpha: 0.3 })
      for (let y = startY; y <= endY; y += 2) {
        const start = gridToIso(startX, y, upperZ, { ...DEFAULT_GRID_CONFIG, tileWidth, tileHeight })
        const end = gridToIso(endX, y, upperZ, { ...DEFAULT_GRID_CONFIG, tileWidth, tileHeight })
        gridGraphics.moveTo(start.x, start.y).lineTo(end.x, end.y)
      }
      for (let x = startX; x <= endX; x += 2) {
        const start = gridToIso(x, startY, upperZ, { ...DEFAULT_GRID_CONFIG, tileWidth, tileHeight })
        const end = gridToIso(x, endY, upperZ, { ...DEFAULT_GRID_CONFIG, tileWidth, tileHeight })
        gridGraphics.moveTo(start.x, start.y).lineTo(end.x, end.y)
      }
      gridGraphics.stroke() // 위 레이어 평면 완료

      // 이미지 영역 테두리 (초록색으로 명확히 표시 - 원래 이미지 크기)
      gridGraphics.setStrokeStyle({ width: 2, color: 0x00ff00, alpha: 0.8 })
      gridGraphics.setFillStyle({ color: 0x00ff00, alpha: 0.1 })

      // 원래 이미지 크기로 초록색 영역 표시
      const imgStartX = -Math.floor(gridWidth / 2)
      const imgStartY = -Math.floor(gridHeight / 2)
      const imgEndX = imgStartX + gridWidth
      const imgEndY = imgStartY + gridHeight

      const corners = [
        gridToIso(imgStartX, imgStartY, selectedLayer, { ...DEFAULT_GRID_CONFIG, tileWidth, tileHeight }),
        gridToIso(imgEndX, imgStartY, selectedLayer, { ...DEFAULT_GRID_CONFIG, tileWidth, tileHeight }),
        gridToIso(imgEndX, imgEndY, selectedLayer, { ...DEFAULT_GRID_CONFIG, tileWidth, tileHeight }),
        gridToIso(imgStartX, imgEndY, selectedLayer, { ...DEFAULT_GRID_CONFIG, tileWidth, tileHeight })
      ]

      gridGraphics.moveTo(corners[0].x, corners[0].y)
      corners.forEach(corner => gridGraphics.lineTo(corner.x, corner.y))
      gridGraphics.lineTo(corners[0].x, corners[0].y)
      gridGraphics.fill().stroke()
      
    } else {
      // 이미지가 없을 때는 기본 작은 그리드
      const gridSize = 4
      
      // 간단한 참고용 그리드 (연하게)
      gridGraphics.setStrokeStyle({ width: 1, color: 0x666666, alpha: 0.2 })
      
      for (let y = -gridSize; y <= gridSize; y += 2) {
        const start = gridToIso(-gridSize, y, 0, { ...DEFAULT_GRID_CONFIG, tileWidth, tileHeight })
        const end = gridToIso(gridSize, y, 0, { ...DEFAULT_GRID_CONFIG, tileWidth, tileHeight })
        gridGraphics.moveTo(start.x, start.y).lineTo(end.x, end.y)
      }
      for (let x = -gridSize; x <= gridSize; x += 2) {
        const start = gridToIso(x, -gridSize, 0, { ...DEFAULT_GRID_CONFIG, tileWidth, tileHeight })
        const end = gridToIso(x, gridSize, 0, { ...DEFAULT_GRID_CONFIG, tileWidth, tileHeight })
        gridGraphics.moveTo(start.x, start.y).lineTo(end.x, end.y)
      }
      gridGraphics.stroke()
    }

    grid.addChild(gridGraphics)
    

  }, [editingItem.imageUrl, editingItem.gridData, selectedLayer])

  // 🖱️ 3D 복셀 에디터 이벤트 설정
  const setupCanvasEvents = useCallback(() => {
    if (!pixiAppRef.current) return

    const canvas = pixiAppRef.current.canvas as HTMLCanvasElement

    // 🎯 개선된 마우스 추적 로직 - 정확한 좌표 변환
    const getVoxelFromMouse = (event: MouseEvent) => {
      const rect = canvas.getBoundingClientRect()
      const mouseX = event.clientX - rect.left
      const mouseY = event.clientY - rect.top

      // 🔧 정확한 좌표 변환: 실제 캔버스 크기 고려
      const displayWidth = rect.width
      const displayHeight = rect.height
      
      // PixiJS 앱의 실제 해상도
      const pixiWidth = pixiAppRef.current.screen.width   // 실제 너비
      const pixiHeight = pixiAppRef.current.screen.height // 실제 높이
      
      // 마우스 좌표를 PixiJS 좌표계로 변환 (비율 정확히 계산)
      const pixiMouseX = (mouseX / displayWidth) * pixiWidth
      const pixiMouseY = (mouseY / displayHeight) * pixiHeight

      // PixiJS main 컨테이너의 변환 정보 (실제 값 사용)
      const mainContainer = pixiContainersRef.current.main
      const mainScale = mainContainer.scale.x  // 실제 스케일
      const mainOffsetX = mainContainer.x       // 실제 오프셋 X
      const mainOffsetY = mainContainer.y       // 실제 오프셋 Y
      
      // main 컨테이너 좌표계로 역변환
      const localX = (pixiMouseX - mainOffsetX) / mainScale
      const localY = (pixiMouseY - mainOffsetY) / mainScale

      // 이소메트릭 그리드 좌표로 변환 (정확한 공식)
      const tileWidth = DEFAULT_GRID_CONFIG.tileWidth   // 20
      const tileHeight = DEFAULT_GRID_CONFIG.tileHeight // 10
      
      // 🔧 개선된 이소메트릭 변환 공식
      const gridX = Math.round((localX / (tileWidth / 2) + localY / (tileHeight / 2)) / 2)
      const gridY = Math.round((localY / (tileHeight / 2) - localX / (tileWidth / 2)) / 2)



      // 디버깅 로그 (주변부에서 문제 확인용)
      if (Math.abs(gridX) > 2 || Math.abs(gridY) > 2) {

      }

      // 편집 영역 범위 체크
      const gridWidth = editingItem.gridData!.width
      const gridHeight = editingItem.gridData!.height
      const startX = -Math.floor(gridWidth / 2)
      const startY = -Math.floor(gridHeight / 2)
      const endX = startX + gridWidth
      const endY = startY + gridHeight

      if (gridX < startX || gridX >= endX || gridY < startY || gridY >= endY) {
        return null
      }

      // 편집 영역 내 상대 좌표로 변환 (0 ~ gridWidth-1)
      const localGridX = gridX - startX
      const localGridY = gridY - startY
      
      const voxelKey = `${localGridX},${localGridY},${selectedLayer}`

      return voxelKey
    }

    const handleCanvasClick = (event: MouseEvent) => {
      if (!isSelectingPixels || !editingItem.imageUrl) return

      const voxelKey = getVoxelFromMouse(event)
      if (!voxelKey) {

        return
      }



      // React 상태 업데이트 방식으로 복셀 토글
      setSelectedPixels(prevPixels => {
        const newSet = new Set(prevPixels)
        const wasSelected = newSet.has(voxelKey)
        
        if (wasSelected) {
          newSet.delete(voxelKey)
  
        } else {
          newSet.add(voxelKey)

          

        }
        
  
        
        return newSet
      })
    }

    const handleCanvasMouseMove = (event: MouseEvent) => {
      if (!isSelectingPixels || !editingItem.imageUrl) return

      const voxelKey = getVoxelFromMouse(event)
      setHoveredVoxel(voxelKey)
    }

    const handleCanvasMouseLeave = () => {
      setHoveredVoxel(null)
    }

    canvas.addEventListener('click', handleCanvasClick)
    canvas.addEventListener('mousemove', handleCanvasMouseMove)
    canvas.addEventListener('mouseleave', handleCanvasMouseLeave)

    return () => {
      canvas.removeEventListener('click', handleCanvasClick)
      canvas.removeEventListener('mousemove', handleCanvasMouseMove)
      canvas.removeEventListener('mouseleave', handleCanvasMouseLeave)
    }
  }, [isSelectingPixels, selectedLayer, editingItem.imageUrl, editingItem.gridData])

  // 🖼️ 아이템 미리보기 렌더링
  const renderItemPreview = useCallback(async () => {
    if (!pixiContainersRef.current || !PIXI || !editingItem.imageUrl) return

    const { preview } = pixiContainersRef.current
    preview.removeChildren()

    try {
      // 이미지 텍스처 로드
      const texture = await PIXI.Assets.load(editingItem.imageUrl)
      const sprite = new PIXI.Sprite(texture)

      // 중앙에 배치 (실제 이미지 크기 그대로, 항상 바닥에 고정)
      const centerPos = gridToIso(0, 0, 0, DEFAULT_GRID_CONFIG)
      sprite.anchor.set(0.5, 0.5)
      sprite.x = centerPos.x
      sprite.y = centerPos.y
      sprite.alpha = 0.8
      sprite.scale.set(1.0, 1.0)  // 실제 크기 그대로
      sprite.zIndex = 0 // 이미지는 Z=0 레이어에 명확히 배치
      



      preview.addChild(sprite)

      // 선택된 복셀들 시각화
      renderSelectedVoxels()

    } catch (error) {
      console.error('이미지 렌더링 실패:', error)
    }
  }, [editingItem.imageUrl])

  // 🧊 선택된 복셀들을 3D 정육면체로 시각화
  const renderSelectedVoxels = useCallback((voxelsToRender?: Set<string>) => {
    if (!pixiContainersRef.current || !PIXI) return

    const { ui } = pixiContainersRef.current
    ui.removeChildren()

    // 전달된 복셀 세트가 있으면 사용, 없으면 현재 상태 사용
    const voxelsSet = voxelsToRender || selectedPixels

          // 그리드와 동일한 크기 사용
      const tileWidth = DEFAULT_GRID_CONFIG.tileWidth  // 20
      const tileHeight = DEFAULT_GRID_CONFIG.tileHeight // 10
      const voxelHeight = DEFAULT_GRID_CONFIG.tileHeight // 복셀 높이

    // 편집 영역 기준점 계산
    const gridWidth = editingItem.gridData!.width
    const gridHeight = editingItem.gridData!.height
    const startX = -Math.floor(gridWidth / 2)
    const startY = -Math.floor(gridHeight / 2)

    // 모든 선택된 복셀들을 3D 정육면체로 표시
    Array.from(voxelsSet).forEach(voxelKey => {
      const [localX, localY, z] = voxelKey.split(',').map(Number)
      
      // 전역 그리드 좌표로 변환
      const globalX = startX + localX
      const globalY = startY + localY

      // 현재 레이어만 불투명하게, 다른 레이어는 반투명하게
      const isCurrentLayer = z === selectedLayer
      const alpha = isCurrentLayer ? 0.8 : 0.3
      const strokeAlpha = isCurrentLayer ? 1.0 : 0.5

      // 🎯 3D 복셀로 다시! 선택한 레이어에 정확히 배치
      const voxelGraphics = new PIXI.Graphics()
      
      // 선택한 그리드 위치의 정확히 그 z 높이에 배치
      const voxelZ = z  // 선택한 레이어와 동일한 높이
      const basePos = gridToIso(globalX, globalY, voxelZ, { ...DEFAULT_GRID_CONFIG, tileWidth, tileHeight })
      

      
      // 레이어별 색상
      const colors = [0xff6b6b, 0x4ecdc4, 0x45b7d1, 0x96ceb4, 0xffeaa7, 0xdda0dd, 0xf0a500, 0xff9999]
      const voxelColor = colors[z % colors.length]
      
      // 🧊 3D 정육면체 그리기 (아이소메트릭)
      
      // 위면 (다이아몬드 모양)
      voxelGraphics
        .setFillStyle({ color: voxelColor, alpha: alpha })
        .setStrokeStyle({ width: 1, color: 0x000000, alpha: strokeAlpha })
        .moveTo(0, -voxelHeight)                    // 위쪽 중심
        .lineTo(tileWidth / 2, -voxelHeight + tileHeight / 2)  // 위쪽 오른쪽
        .lineTo(0, -voxelHeight + tileHeight)       // 위쪽 아래
        .lineTo(-tileWidth / 2, -voxelHeight + tileHeight / 2) // 위쪽 왼쪽
        .lineTo(0, -voxelHeight)                    // 위쪽 중심으로 돌아가기
        .fill()
        .stroke()

      // 오른쪽 면 (사다리꼴)
      voxelGraphics
        .setFillStyle({ color: voxelColor, alpha: alpha * 0.7 })
        .moveTo(tileWidth / 2, -voxelHeight + tileHeight / 2)  // 위쪽 오른쪽
        .lineTo(tileWidth / 2, tileHeight / 2)      // 아래쪽 오른쪽
        .lineTo(0, tileHeight)                      // 아래쪽 중심
        .lineTo(0, -voxelHeight + tileHeight)       // 위쪽 아래
        .lineTo(tileWidth / 2, -voxelHeight + tileHeight / 2)  // 위쪽 오른쪽으로 돌아가기
        .fill()
        .stroke()

      // 왼쪽 면 (사다리꼴)
      voxelGraphics
        .setFillStyle({ color: voxelColor, alpha: alpha * 0.5 })
        .moveTo(-tileWidth / 2, -voxelHeight + tileHeight / 2) // 위쪽 왼쪽
        .lineTo(0, -voxelHeight + tileHeight)       // 위쪽 아래
        .lineTo(0, tileHeight)                      // 아래쪽 중심
        .lineTo(-tileWidth / 2, tileHeight / 2)     // 아래쪽 왼쪽
        .lineTo(-tileWidth / 2, -voxelHeight + tileHeight / 2) // 위쪽 왼쪽으로 돌아가기
        .fill()
        .stroke()

      voxelGraphics.x = basePos.x
      voxelGraphics.y = basePos.y
      voxelGraphics.zIndex = voxelZ * 1000 + globalY * 10 + globalX

      ui.addChild(voxelGraphics)
    })

    // 호버 중인 복셀 미리보기 (반투명)
    if (hoveredVoxel && isSelectingPixels && !voxelsSet.has(hoveredVoxel)) {
      const [localX, localY, z] = hoveredVoxel.split(',').map(Number)
      
      // 전역 그리드 좌표로 변환
      const globalX = startX + localX
      const globalY = startY + localY

      // 🎯 미리보기: 3D 복셀 미리보기!
      const previewGraphics = new PIXI.Graphics()
      
      // 선택한 그리드 위치의 정확히 그 z 높이에 배치
      const voxelZ = z  // 선택한 레이어와 동일한 높이
      const basePos = gridToIso(globalX, globalY, voxelZ, { ...DEFAULT_GRID_CONFIG, tileWidth, tileHeight })
      
      // 미리보기 색상 (흰색, 반투명)
      const previewColor = 0xffffff
      const previewAlpha = 0.4
      
      // 🧊 3D 미리보기 복셀 (반투명하게)
      
      // 위면 (다이아몬드 모양)
      previewGraphics
        .setFillStyle({ color: previewColor, alpha: previewAlpha })
        .setStrokeStyle({ width: 2, color: 0xffffff, alpha: 0.8 })
        .moveTo(0, -voxelHeight)                    // 위쪽 중심
        .lineTo(tileWidth / 2, -voxelHeight + tileHeight / 2)  // 위쪽 오른쪽
        .lineTo(0, -voxelHeight + tileHeight)       // 위쪽 아래
        .lineTo(-tileWidth / 2, -voxelHeight + tileHeight / 2) // 위쪽 왼쪽
        .lineTo(0, -voxelHeight)                    // 위쪽 중심으로 돌아가기
        .fill()
        .stroke()

      // 오른쪽 면 (사다리꼴, 더 반투명하게)
      previewGraphics
        .setFillStyle({ color: previewColor, alpha: previewAlpha * 0.7 })
        .moveTo(tileWidth / 2, -voxelHeight + tileHeight / 2)  // 위쪽 오른쪽
        .lineTo(tileWidth / 2, tileHeight / 2)      // 아래쪽 오른쪽
        .lineTo(0, tileHeight)                      // 아래쪽 중심
        .lineTo(0, -voxelHeight + tileHeight)       // 위쪽 아래
        .lineTo(tileWidth / 2, -voxelHeight + tileHeight / 2)  // 위쪽 오른쪽으로 돌아가기
        .fill()
        .stroke()

      // 왼쪽 면 (사다리꼴, 가장 반투명하게)
      previewGraphics
        .setFillStyle({ color: previewColor, alpha: previewAlpha * 0.5 })
        .moveTo(-tileWidth / 2, -voxelHeight + tileHeight / 2) // 위쪽 왼쪽
        .lineTo(0, -voxelHeight + tileHeight)       // 위쪽 아래
        .lineTo(0, tileHeight)                      // 아래쪽 중심
        .lineTo(-tileWidth / 2, tileHeight / 2)     // 아래쪽 왼쪽
        .lineTo(-tileWidth / 2, -voxelHeight + tileHeight / 2) // 위쪽 왼쪽으로 돌아가기
        .fill()
        .stroke()

      previewGraphics.x = basePos.x
      previewGraphics.y = basePos.y
      previewGraphics.zIndex = voxelZ * 1000 + globalY * 10 + globalX + 0.5 // 약간 위에

      ui.addChild(previewGraphics)
    }

    
  }, [selectedPixels, selectedLayer, editingItem.gridData, hoveredVoxel, isSelectingPixels])

  // 📷 이미지 업로드 처리
  const handleImageUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      alert('이미지 파일만 업로드 가능합니다.')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('파일 크기는 5MB 이하여야 합니다.')
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      const base64 = e.target?.result as string
      setEditingItem(prev => ({
        ...prev,
        imageUrl: base64
      }))
    }
    reader.readAsDataURL(file)


  }, [])

  // 📐 이미지 로드 완료 처리
  const handleImageLoad = useCallback((event: React.SyntheticEvent<HTMLImageElement>) => {
    const img = event.currentTarget
    setImageNaturalSize({
      width: img.naturalWidth,
      height: img.naturalHeight
    })
    
    // 기본 앵커를 중심점으로 설정
    setEditingItem(prev => ({
      ...prev,
      anchor: {
        x: Math.floor(img.naturalWidth / 2),
        y: Math.floor(img.naturalHeight / 2)
      }
    }))
    

  }, [])



  // 💾 선택된 픽셀들을 GridCell3D 배열로 변환
  const generateGridCells = useCallback((): GridCell3D[] => {
    const cells: GridCell3D[] = []
    
    selectedPixels.forEach(pixelKey => {
      const [x, y, z] = pixelKey.split(',').map(Number)
      cells.push({
        x: x - Math.floor(editingItem.gridData!.width / 2),
        y: y - Math.floor(editingItem.gridData!.height / 2),
        z: z,
        occupied: true
      })
    })
    
    return cells
  }, [selectedPixels, editingItem.gridData])

  // 🔄 데이터 로드 함수 (통합됨)
  const loadExistingItems = useCallback(async () => {
    const items = await dataStore.getStoreItems()
    setExistingItems(items)
  }, [])

  // 새 아이템 생성 모드로 전환
  const startNewItem = useCallback(() => {
    setEditingItem({
      id: '',
      name: '',
      imageUrl: '',
      anchor: { x: 0, y: 0 },
      price: 0,
      description: '',
      subCategory: 'props',
      gridData: {
        cells: [],
        width: 32,
        height: 32,
        depth: 1,
        centerX: 16,
        centerY: 16,
        totalCells: 0
      }
    })
    setSelectedPixels(new Set())
    setSelectedExistingItem(null)
    setSelectedLayer(0)
    setImageNaturalSize(null)
  }, [])

  // 💾 아이템 저장 (리팩토링된 버전)
  const handleSave = useCallback(async () => {
    if (!editingItem.name || !editingItem.imageUrl || !editingItem.subCategory) {
      alert('이름, 이미지, 카테고리는 필수입니다.')
      return
    }

    setIsSubmitting(true)

    try {
      const gridCells = generateGridCells()
      
      // 🔧 안정적인 ID 생성: 이름 기반 (다국어 지원)
      const stableId = editingItem.name
        .trim()
        .replace(/\s+/g, '_')           // 공백을 언더스코어로
        .replace(/[^\w가-힣]/g, '')     // 영문, 숫자, 한글, 언더스코어만 허용
        .toUpperCase()                  // 대문자로 변환 (한글은 그대로)
        || `ITEM_${Date.now()}`         // 이름이 비어있으면 타임스탬프 사용
      
      const savedItem: StoreItem = {
        ...editingItem,
        id: editingItem.id || stableId,
        gridData: {
          cells: gridCells,
          width: editingItem.gridData!.width,
          height: editingItem.gridData!.height,
          depth: editingItem.gridData!.depth,
          centerX: Math.floor(editingItem.gridData!.width / 2),
          centerY: Math.floor(editingItem.gridData!.height / 2),
          totalCells: gridCells.length,
          // 🔧 중요: 이미지와 그리드의 정확한 상대 위치 정보 저장
          imageOffsetX: editingItem.anchor.x,  // 이미지 앵커 X
          imageOffsetY: editingItem.anchor.y,  // 이미지 앵커 Y
          pixelScale: 1.0  // 픽셀 스케일 (향후 확장용)
        }
      }

      console.log('저장할 아이템:', savedItem)

      // 기존 아이템 수정인지 새 아이템 추가인지 확인
      if (selectedExistingItem) {
        // 기존 아이템 수정
        await dataStore.updateStoreItem(savedItem)
        console.log('✅ 아이템 수정 성공!')
        alert(`✅ "${savedItem.name}" 아이템이 성공적으로 수정되었습니다!`)
      } else {
        // 새 아이템 추가
        await dataStore.addStoreItem(savedItem)
        console.log('✅ 아이템 추가 성공!')
        alert(`✅ "${savedItem.name}" 아이템이 성공적으로 상점에 등록되었습니다!`)
      }
      
      // 로컬 상태 업데이트
      await loadExistingItems() // 아이템 목록 새로고침

      // 폼 초기화
      startNewItem()

    } catch (error) {
      console.error('아이템 저장 실패:', error)
      alert(`아이템 저장 중 오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`)
    } finally {
      setIsSubmitting(false)
    }
  }, [editingItem, generateGridCells, selectedExistingItem, startNewItem, loadExistingItems])


  // 기존 아이템 선택 시 데이터 로드
  const loadExistingItem = useCallback((item: StoreItem) => {
    
    
    setEditingItem({
      ...item,
      // 기존 아이템 정보 그대로 복사
    })
    
    // 그리드 픽셀 복원
    if (item.gridData && item.gridData.cells) {
      const pixelSet = new Set<string>()
      item.gridData.cells.forEach(cell => {
        // 상대 좌표를 절대 좌표로 변환
        const absX = cell.x + Math.floor((item.gridData?.width || 1) / 2)
        const absY = cell.y + Math.floor((item.gridData?.height || 1) / 2)
        pixelSet.add(`${absX},${absY},${cell.z}`)
      })
      setSelectedPixels(pixelSet)

    }
    
    setSelectedExistingItem(item)
  }, [])


  // 기존 아이템 복사 (새 아이템으로 만들기)
  const copyExistingItem = useCallback((item: StoreItem) => {
    setEditingItem({
      ...item,
      id: '', // 새 ID로 초기화
      name: `${item.name} (복사본)`, // 이름에 복사본 표시
    })
    
    // 그리드 픽셀 복원
    if (item.gridData && item.gridData.cells) {
      const pixelSet = new Set<string>()
      item.gridData.cells.forEach(cell => {
        // 상대 좌표를 절대 좌표로 변환
        const absX = cell.x + Math.floor((item.gridData?.width || 1) / 2)
        const absY = cell.y + Math.floor((item.gridData?.height || 1) / 2)
        pixelSet.add(`${absX},${absY},${cell.z}`)
      })
      setSelectedPixels(pixelSet)
    }
    
    setSelectedExistingItem(null) // 새 아이템이므로 선택 해제
  }, [])

  // 기존 아이템 삭제
  const deleteExistingItem = useCallback(async (item: StoreItem) => {
    if (!window.confirm(`정말로 "${item.name}" 아이템을 삭제하시겠습니까?`)) {
      return
    }

    try {
      const success = await dataStore.removeStoreItem(item.id)
      
      if (success) {
  
        alert('아이템이 삭제되었습니다.')
        
        // 삭제된 아이템이 현재 선택된 아이템이면 초기화
        if (selectedExistingItem?.id === item.id) {
          startNewItem()
        }
        
        // 목록 새로고침
        loadExistingItems()
      } else {
        throw new Error('삭제 실패')
      }
    } catch (error) {
      console.error('❌ 아이템 삭제 실패:', error)
      alert('아이템 삭제에 실패했습니다.')
    }
  }, [selectedExistingItem, startNewItem, loadExistingItems])

  // 🎮 초기화 및 이벤트 설정 (리팩토링된 버전)
  useEffect(() => {
    const initializeEditor = async () => {
      if (!loading && user) {
        try {
          console.log('에디터 초기화 시작...')
          await initializeCanvas()
          await loadExistingItems()
          console.log('에디터 초기화 완료!')
        } catch (error) {
          console.error('에디터 초기화 실패:', error)
          alert('에디터 초기화 중 오류가 발생했습니다.')
        }
      } else if (!loading && !user) {
        router.push('/login')
      }
    }

    initializeEditor()
  }, [user, loading, router, initializeCanvas, loadExistingItems])

  // 🎨 그리드 렌더링 (레이어 변경에 따라)
  useEffect(() => {
    if (isCanvasReady) {
      renderGrid()
    }
  }, [isCanvasReady, renderGrid, selectedLayer])

  // 🖼️ 이미지 렌더링 (항상 바닥에 고정)
  useEffect(() => {
    if (isCanvasReady) {
      renderItemPreview()
    }
  }, [isCanvasReady, renderItemPreview, editingItem.imageUrl])

  // 🧊 복셀 렌더링 (별도 관리)
  useEffect(() => {
    if (isCanvasReady) {
      renderSelectedVoxels()
    }
  }, [isCanvasReady, selectedPixels, selectedLayer, hoveredVoxel, renderSelectedVoxels])

  // 🖱️ 캔버스 이벤트 업데이트
  useEffect(() => {
    if (isCanvasReady) {
      const cleanup = setupCanvasEvents()
      return cleanup
    }
  }, [isCanvasReady, setupCanvasEvents, isSelectingPixels, selectedLayer])



  // 🧹 정리
  useEffect(() => {
    return () => {
      if (pixiAppRef.current) {
        try {
          pixiAppRef.current.destroy(true, { children: true, texture: false })
        } catch (error) {
          console.warn('PixiJS 정리 중 오류:', error)
        }
        pixiAppRef.current = null
      }
    }
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-spin">🎨</div>
          <div className="text-white text-xl">에디터 로딩 중...</div>
          <div className="text-white/60 text-sm mt-2">잠시만 기다려주세요</div>
        </div>
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-white">
      {/* 🎨 헤더 */}
      <header className="bg-white/10 backdrop-blur-sm border-b border-white/20 p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/')}
              className="text-white/80 hover:text-white transition-colors"
            >
              ← 홈으로
            </button>
            <h1 className="text-2xl font-bold">🏠 3D 미니차고 아이템 에디터</h1>
          </div>
          <div className="text-sm text-white/60">
            decoration-system-standalone 기반 에디터
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-4">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          
          {/* 🎮 메인 3D 캔버스 영역 (2/3 너비) */}
          <div className="xl:col-span-2">
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/20">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">🎮 3D 아이소뷰 캔버스</h2>
                <div className="flex gap-2">
                  <div className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded-lg text-sm">
                    🔲 그리드 활성화됨
                  </div>
                </div>
              </div>
              
              {/* 3D 캔버스 */}
              <div 
                ref={canvasRef}
                className="w-full bg-gradient-to-br from-blue-900/20 via-purple-900/20 to-pink-900/20 rounded-lg border border-white/30 relative"
                style={{ height: '600px' }}
              >
                {!isCanvasReady && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-6xl mb-4">🎮</div>
                      <div className="text-xl">PixiJS 초기화 중...</div>
                      <div className="text-sm text-white/60 mt-2">decoration-system-standalone 엔진</div>
                    </div>
                  </div>
                )}


              </div>
            </div>
          </div>

          {/* 🛠️ 편집 패널 (1/3 너비) */}
          <div className="space-y-4">
            
            {/* 아이템 관리 패널 */}
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/20">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold">🏠 미니차고 아이템 관리</h3>
                <button
                  onClick={startNewItem}
                  className="px-3 py-1 bg-blue-500/80 hover:bg-blue-500 text-white rounded text-sm transition-all"
                >
                  🆕 새 아이템
                </button>
              </div>
              
              {existingItems.length > 0 ? (
                <div className="space-y-3">
                  <div className="text-sm text-white/60 mb-2">
                    총 {existingItems.length}개 아이템
                  </div>
                  
                  <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto">
                    {existingItems.map((item) => (
                      <div
                        key={item.id}
                        className={`relative p-3 rounded-lg border transition-all ${
                          selectedExistingItem?.id === item.id
                            ? 'border-blue-400 bg-blue-400/20'
                            : 'border-white/20 bg-white/5 hover:border-white/30 hover:bg-white/10'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          {/* 아이템 이미지 */}
                          <div className="w-12 h-12 bg-white/10 rounded flex items-center justify-center overflow-hidden flex-shrink-0">
                            {item.imageUrl ? (
                              <img 
                                src={item.imageUrl} 
                                alt={item.name}
                                className="max-w-full max-h-full object-contain"
                                style={{ imageRendering: 'pixelated' }}
                              />
                            ) : (
                              <div className="text-white/40 text-lg">📦</div>
                            )}
                          </div>
                          
                          {/* 아이템 정보 */}
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm truncate">{item.name}</div>
                            <div className="flex items-center space-x-3 text-xs text-white/60">
                              <span>💎 {item.price?.toLocaleString() || 0}원</span>
                              <span>🎯 {item.gridData?.totalCells || 0}픽셀</span>
                              <span>🏗️ {item.gridData?.depth || 1}층</span>
                            </div>
                            <div className="text-xs text-blue-300 mt-1">
                              🏠 미니차고 → 🏷️ {GARAGE_CATEGORIES[item.subCategory || 'props']?.label || '알 수 없음'}
                            </div>
                          </div>
                          
                          {/* 액션 버튼들 */}
                          <div className="flex items-center space-x-1">
                            <button
                              onClick={() => loadExistingItem(item)}
                              className="px-2 py-1 bg-blue-500/80 hover:bg-blue-500 text-white rounded text-xs transition-all"
                              title="편집"
                            >
                              ✏️
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                copyExistingItem(item)
                              }}
                              className="px-2 py-1 bg-green-500/80 hover:bg-green-500 text-white rounded text-xs transition-all"
                              title="복사"
                            >
                              📋
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                deleteExistingItem(item)
                              }}
                              className="px-2 py-1 bg-red-500/80 hover:bg-red-500 text-white rounded text-xs transition-all"
                              title="삭제"
                            >
                              🗑️
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {selectedExistingItem && (
                    <div className="bg-green-400/10 border border-green-400/30 rounded p-3">
                      <div className="text-sm text-green-400">
                        ✅ <strong>{selectedExistingItem.name}</strong> 선택됨 - 아래에서 수정 후 저장하세요
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-4xl mb-2">📦</div>
                  <div className="text-white/60 mb-4">등록된 아이템이 없습니다</div>
                  <button
                    onClick={startNewItem}
                    className="px-4 py-2 bg-blue-500/80 hover:bg-blue-500 text-white rounded transition-all"
                  >
                    🆕 첫 번째 아이템 만들기
                  </button>
                </div>
              )}
            </div>

            {/* 📷 이미지 업로드 */}
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/20">
              <h3 className="text-lg font-bold mb-3">📷 이미지 업로드</h3>
              
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
              
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full h-48 border-2 border-dashed border-white/30 rounded-lg flex flex-col items-center justify-center hover:border-white/50 transition-colors relative overflow-hidden"
              >
                {editingItem.imageUrl ? (
                  <div className="relative w-full h-full">
                    <img 
                      src={editingItem.imageUrl} 
                      alt="업로드된 이미지"
                      className="max-w-full max-h-full object-contain"
                      style={{ imageRendering: 'pixelated' }}
                      onLoad={handleImageLoad}
                    />
                    

                  </div>
                ) : (
                  <>
                    <div className="text-3xl mb-2">📁</div>
                    <div className="text-sm text-white/60">이미지 선택</div>
                  </>
                )}
              </button>
              
              {imageNaturalSize && (
                <div className="mt-2 text-xs text-white/60">
                  크기: {imageNaturalSize.width} × {imageNaturalSize.height}px
                </div>
              )}
            </div>

            {/* 🎯 레이어 및 픽셀 선택 */}
            {editingItem.imageUrl && (
              <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <h3 className="text-lg font-bold mb-3">🎯 레이어 시스템</h3>
                
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium mb-2">총 층수</label>
                    <input
                      type="number"
                      value={editingItem.gridData!.depth}
                      onChange={(e) => setEditingItem(prev => ({ 
                        ...prev, 
                        gridData: {
                          ...prev.gridData!,
                          depth: Math.max(1, parseInt(e.target.value) || 1)
                        }
                      }))}
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
                      min="1"
                      max="10"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">작업 레이어</label>
                    <div className="grid grid-cols-3 gap-1">
                      {Array.from({ length: editingItem.gridData!.depth }, (_, i) => (
                        <button
                          key={i}
                          onClick={() => setSelectedLayer(i)}
                          className={`px-2 py-1 rounded text-xs transition-colors ${
                            selectedLayer === i 
                              ? 'bg-blue-500 text-white' 
                              : 'bg-white/10 text-white/60 hover:bg-white/20'
                          }`}
                        >
                          {i}층
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setIsSelectingPixels(!isSelectingPixels)
                  
                      }}
                      className={`flex-1 px-3 py-2 rounded-lg text-sm transition-all ${
                        isSelectingPixels 
                          ? 'bg-purple-500 text-white shadow-lg' 
                          : 'bg-white/10 text-white/60 hover:bg-white/20'
                      }`}
                    >
                      {isSelectingPixels ? '🧊 복셀 편집 중' : '🧊 복셀 선택'}
                    </button>
                    
                    <button
                      onClick={() => {
                        setSelectedPixels(new Set())
                  
                      }}
                      className="px-3 py-2 bg-red-500/20 text-red-300 rounded-lg text-sm hover:bg-red-500/30"
                    >
                      초기화
                    </button>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="text-sm text-white/60">
                      선택된 복셀: {selectedPixels.size}개 (레이어 {selectedLayer}층)
                    </div>
                    
                    {isSelectingPixels && (
                      <div className="p-2 bg-purple-500/20 rounded border border-purple-500/40">
                        <div className="text-xs text-purple-200">
                          🧊 복셀 선택 모드 활성화됨<br/>
                          3D 캔버스를 클릭하여 복셀을 선택하세요
                        </div>
                      </div>
                    )}
                    
                    {!isSelectingPixels && editingItem.imageUrl && (
                      <div className="p-2 bg-blue-500/20 rounded border border-blue-500/40">
                        <div className="text-xs text-blue-200">
                          🧊 "픽셀 선택" 버튼을 눌러 3D 복셀을 편집하세요
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* 📝 아이템 정보 */}
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/20">
              <h3 className="text-lg font-bold mb-3">
                📝 {selectedExistingItem ? `${selectedExistingItem.name} 수정` : '새 아이템 정보'}
              </h3>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium mb-1">이름 *</label>
                  <input
                    type="text"
                    value={editingItem.name}
                    onChange={(e) => setEditingItem(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
                    placeholder="아이템 이름"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">가격</label>
                  <input
                    type="number"
                    value={editingItem.price || 0}
                    onChange={(e) => setEditingItem(prev => ({ 
                      ...prev, 
                      price: Math.max(0, parseInt(e.target.value) || 0)
                    }))}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
                    min="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">설명</label>
                  <textarea
                    value={editingItem.description || ''}
                    onChange={(e) => setEditingItem(prev => ({ ...prev, description: e.target.value }))}
                    rows={2}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
                    placeholder="아이템 설명"
                  />
                </div>

                {/* 미니차고 카테고리 선택 */}
                <div>
                  <label className="block text-sm font-medium mb-2">미니차고 카테고리 *</label>
                  
                  {/* 서브 카테고리 */}
                  <div>
                    <label className="block text-xs text-white/60 mb-1">카테고리 선택</label>
                    <div className="grid grid-cols-3 gap-2">
                      {Object.entries(GARAGE_CATEGORIES).map(([key, category]) => (
                        <button
                          key={key}
                          onClick={() => setEditingItem(prev => ({ ...prev, subCategory: key as 'vehicle' | 'interior' | 'props' }))}
                          className={`px-3 py-2 rounded-lg text-sm transition-all ${
                            editingItem.subCategory === key
                              ? 'bg-green-500 text-white shadow-lg'
                              : 'bg-white/10 text-white/60 hover:bg-white/20'
                          }`}
                        >
                          {category.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 현재 선택된 카테고리 표시 */}
                  <div className="mt-2 p-2 bg-green-500/10 border border-green-500/30 rounded text-xs text-green-200">
                    <div>🏠 미니차고</div>
                    <div>🏷️ {GARAGE_CATEGORIES[editingItem.subCategory || 'props']?.label || '알 수 없음'}</div>
                  </div>
                </div>

              </div>
            </div>

            {/* 💾 저장 버튼 (개선된 버전) */}
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/20">
              <button
                onClick={handleSave}
                disabled={isSubmitting || !editingItem.name || (!selectedExistingItem && !editingItem.imageUrl) || !editingItem.subCategory}
                className={`w-full py-3 rounded-lg font-bold transition-all duration-200 ${
                  isSubmitting || !editingItem.name || (!selectedExistingItem && !editingItem.imageUrl) || !editingItem.subCategory
                    ? 'bg-gray-600 cursor-not-allowed text-gray-400'
                    : selectedExistingItem 
                      ? 'bg-blue-500 hover:bg-blue-600 text-white shadow-lg hover:shadow-blue-500/25'
                      : 'bg-green-500 hover:bg-green-600 text-white shadow-lg hover:shadow-green-500/25'
                }`}
              >
                {isSubmitting ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    {selectedExistingItem ? '수정 중...' : '등록 중...'}
                  </div>
                ) : (
                  selectedExistingItem ? '✏️ 아이템 수정' : '💾 상점에 등록'
                )}
              </button>
              
              {/* 저장 조건 안내 */}
              {(!editingItem.name || (!selectedExistingItem && !editingItem.imageUrl) || !editingItem.subCategory) && (
                <div className="mt-2 text-xs text-red-400">
                  {!editingItem.name ? '• 아이템 이름을 입력하세요' : ''}
                  {!selectedExistingItem && !editingItem.imageUrl ? '• 이미지를 업로드하세요' : ''}
                  {!editingItem.subCategory ? '• 미니차고 카테고리를 선택하세요' : ''}
                </div>
              )}
            </div>

            {/* 💡 사용법 안내 */}
            <div className="bg-blue-500/10 backdrop-blur-sm rounded-xl p-4 border border-blue-500/30">
              <h4 className="text-sm font-bold mb-2">💡 사용법</h4>
              <div className="text-xs text-white/70 space-y-1">
                <div><strong>🆕 새 아이템:</strong> 이미지 업로드 → 미니차고 카테고리 선택 → 복셀 편집 → 정보 입력 → 저장</div>
                <div><strong>✏️ 기존 편집:</strong> 아이템 선택 → 수정 → 저장</div>
                <div><strong>📋 복사:</strong> 아이템 복사 → 이름 변경 → 저장</div>
                <div><strong>🗑️ 삭제:</strong> 아이템 삭제 버튼 클릭</div>
                <div className="mt-2 pt-2 border-t border-white/20">
                  <div>🧊 복셀 선택 모드에서 3D 캔버스를 클릭하여 편집하세요</div>
                  <div>🏠 미니차고 카테고리: 운송수단 / 인테리어 / 소품</div>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
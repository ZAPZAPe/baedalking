'use client'

import React, { useState, useRef, useCallback, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'

// 타일 정보 인터페이스 (Landscape Tiles용)
interface TileInfo {
  id: string
  name: string
  category: string
  imagePath: string  // 개별 이미지 파일 경로
}

// 타일맵 데이터 인터페이스
interface TilemapData {
  name: string
  createdAt: string
  tiles: {
    x: number
    y: number
    tileId: string | null
  }[]
  metadata?: {
    gridSize: number
    tileSize: number
    version: string
  }
}

// 복셀 크기 상수 (그리드 간격)
const VOXEL_SIZE = 100

// 타일 카테고리 정의 (한국어 폴더별)
const TILE_CATEGORIES = [
  { id: 'basic', name: '🌱 기본지형', folder: '01_기본지형', files: ['dirt', 'dirtDouble', 'grass', 'grassWhole'] },
  { id: 'water', name: '🌊 물', folder: '02_물', files: ['water', 'waterCornerES', 'waterCornerNE', 'waterCornerNW', 'waterCornerSW', 'waterE', 'waterES', 'waterN', 'waterNE', 'waterNW', 'waterS', 'waterSW', 'waterW'] },
  { id: 'river', name: '🏞️ 강하천', folder: '03_강하천', files: ['riverBankedES', 'riverBankedEW', 'riverBankedNE', 'riverBankedNS', 'riverBankedNW', 'riverBankedSW', 'riverES', 'riverEW', 'riverNE', 'riverNS', 'riverNW', 'riverSW'] },
  { id: 'road', name: '🛣️ 도로', folder: '04_도로', files: ['road', 'roadES', 'roadEW', 'roadHill2E', 'roadHill2N', 'roadHill2S', 'roadHill2W', 'roadHillE', 'roadHillN', 'roadHillS', 'roadHillW', 'roadNE', 'roadNS', 'roadNW', 'roadSW'] },
  { id: 'crossroad', name: '🚦 교차로', folder: '05_교차로', files: ['crossroad', 'crossroadESW', 'crossroadNES', 'crossroadNEW', 'crossroadNSW'] },
  { id: 'terminal', name: '🏁 터미널', folder: '06_터미널', files: ['endE', 'endN', 'endS', 'endW', 'exitE', 'exitN', 'exitS', 'exitW'] },
  { id: 'bridge', name: '🌉 다리', folder: '07_다리', files: ['bridgeEW', 'bridgeNS'] },
  { id: 'hill', name: '⛰️ 언덕', folder: '08_언덕', files: ['hillE', 'hillES', 'hillN', 'hillNE', 'hillNW', 'hillS', 'hillSW', 'hillW'] },
  { id: 'lot', name: '🏗️ 건물부지', folder: '09_건물부지', files: ['lotE', 'lotES', 'lotN', 'lotNE', 'lotNW', 'lotS', 'lotSW', 'lotW'] },
  { id: 'beach', name: '🏖️ 해변', folder: '10_해변', files: ['beach', 'beachCornerES', 'beachCornerNE', 'beachCornerNW', 'beachCornerSW', 'beachE', 'beachES', 'beachN', 'beachNE', 'beachNW', 'beachS', 'beachSW', 'beachW'] },
  { id: 'tree', name: '🌲 나무', folder: '11_나무', files: ['coniferAltShort', 'coniferAltTall', 'coniferShort', 'coniferTall'] }
]

// 한국어 폴더별 타일 데이터 생성
const generateTileData = (): TileInfo[] => {
  
  const tiles: TileInfo[] = []
  
  // 각 카테고리별로 타일 생성
  TILE_CATEGORIES.forEach(category => {
    
    category.files.forEach(fileName => {
      tiles.push({
        id: `${category.id}_${fileName}`,
        name: `${category.name.replace(/[\u{1F300}-\u{1F9FF}]/gu, '').trim()} - ${fileName}`,
        category: category.id,
        imagePath: `/Garage/Tile/${category.folder}/${fileName}.png`
      })
    })
    
  })
  
  
  // 카테고리별 개수 로그
  const categoryCounts: Record<string, number> = {}
  TILE_CATEGORIES.forEach(category => {
    categoryCounts[category.id] = category.files.length
  })
  
  return tiles
}

// 줌/패닝 기능 설정 (메인화면과 동일한 방식)
const setupZoomAndPan = (app: any, worldContainer: any, zoomLevelRef: React.MutableRefObject<number>, isDraggingRef: React.MutableRefObject<boolean>, lastPanPointRef: React.MutableRefObject<{x: number, y: number}>) => {
  const minZoom = 0.3
  const maxZoom = 3
  
  // 마우스 휠 줌 이벤트
  const handleWheel = (event: WheelEvent) => {
    event.preventDefault()
    
    const zoomFactor = event.deltaY > 0 ? 0.9 : 1.1
    const newZoom = Math.min(maxZoom, Math.max(minZoom, zoomLevelRef.current * zoomFactor))
    
    if (newZoom !== zoomLevelRef.current) {
      zoomLevelRef.current = newZoom
      worldContainer.scale.set(newZoom)
    }
  }
  
  // 마우스 드래그 패닝
  const handlePointerDown = (event: any) => {
    if (event.button !== 2) return  // 우클릭만 허용 (타일 배치와 구분)
    isDraggingRef.current = true
    lastPanPointRef.current = { x: event.clientX, y: event.clientY }
  }
  
  const handlePointerMove = (event: any) => {
    if (!isDraggingRef.current) return
    
    const deltaX = event.clientX - lastPanPointRef.current.x
    const deltaY = event.clientY - lastPanPointRef.current.y
    
    worldContainer.x += deltaX
    worldContainer.y += deltaY
    
    lastPanPointRef.current = { x: event.clientX, y: event.clientY }
  }
  
  const handlePointerUp = () => {
    isDraggingRef.current = false
  }
  
  // 이벤트 등록
  app.canvas.addEventListener('wheel', handleWheel, { passive: false })
  app.canvas.addEventListener('pointerdown', handlePointerDown)
  app.canvas.addEventListener('pointermove', handlePointerMove)
  app.canvas.addEventListener('pointerup', handlePointerUp)
  app.canvas.addEventListener('contextmenu', (e: Event) => e.preventDefault())  // 우클릭 메뉴 방지
  
}

async function loadPixi() {
  try {
  const PIXI = await import('pixi.js')
  return PIXI
  } catch (error) {
    throw error
  }
}

export default function TilemapEditorPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  // 사용자 상태 모니터링
  useEffect(() => {
  }, [user, loading])

  // Canvas 및 PIXI 관련 refs
  const canvasRef = useRef<HTMLDivElement>(null)
  const pixiAppRef = useRef<any>(null)
  const worldContainerRef = useRef<any>(null)  // 줌/패닝용 월드 컨테이너
  const gridContainerRef = useRef<any>(null)
  const tileContainerRef = useRef<any>(null)
  const spriteSheetRef = useRef<any>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // 최신 상태를 참조하기 위한 ref들 (클로저 문제 해결)
  const selectedTileIdRef = useRef<string | null>(null)
  const availableTilesRef = useRef<TileInfo[]>([])
  const gridDataRef = useRef<Map<string, string | null>>(new Map())
  
  // 줌/패닝 상태
  const zoomLevelRef = useRef(1)
  const isDraggingRef = useRef(false)
  const lastPanPointRef = useRef({ x: 0, y: 0 })
  
  // 상태 관리
  const [isCanvasReady, setIsCanvasReady] = useState(false)
  const [selectedTileId, setSelectedTileId] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState('basic')
  const [tilemapName, setTilemapName] = useState('새로운 차고 타일맵')
  const [isLoading, setIsLoading] = useState(false)
  const [availableTiles, setAvailableTiles] = useState<TileInfo[]>([])
  
  // 상태 변화 추적을 위한 디버깅
  useEffect(() => {
    if (availableTiles.length > 0) {
    }
  }, [availableTiles])
  
  useEffect(() => {
    selectedTileIdRef.current = selectedTileId  // ref 업데이트
  }, [selectedTileId])
  
  // 그리드 상태 (-9부터 10까지, 20x20) - 차고용 확장 그리드
  const [gridData, setGridData] = useState<Map<string, string | null>>(new Map())
  
  // availableTiles 상태를 ref에 동기화
  useEffect(() => {
    availableTilesRef.current = availableTiles
  }, [availableTiles])
  
  // gridData 상태를 ref에 동기화  
  useEffect(() => {
    gridDataRef.current = gridData
  }, [gridData])
  
  // 현재 선택된 카테고리의 타일들
  const filteredTiles = availableTiles.filter(tile => tile.category === selectedCategory)

  // 표준 게임 ISO 좌표 변환 (메인 게임과 동일한 방식)
  const toIsoCoords = (x: number, y: number) => ({
    x: (x - y) * (VOXEL_SIZE / 2),     // 수평 간격: 50px (다이아몬드가 맞닿도록)
    y: (x + y) * (VOXEL_SIZE / 4)      // 수직 간격: 25px (표준 2:1 ISO 뷰)
  })

  const fromIsoCoords = (isoX: number, isoY: number) => {
    // 새로운 좌표 간격에 맞는 역변환 공식
    const cartX = (isoX / (VOXEL_SIZE / 2) + isoY / (VOXEL_SIZE / 4)) / 2
    const cartY = (isoY / (VOXEL_SIZE / 4) - isoX / (VOXEL_SIZE / 2)) / 2
    return {
      x: Math.round(cartX),
      y: Math.round(cartY)
    }
  }

  // PIXI.js 캔버스 초기화
  const initializeCanvas = async () => {
    try {
      if (!canvasRef.current) {
        setTimeout(() => initializeCanvas(), 200)
        return
      }

      
      const PIXI = await loadPixi()
      
      // PIXI.js v8 올바른 비동기 초기화
      
      const app = new PIXI.Application()
      
      // Application이 완전히 초기화될 때까지 대기
      await app.init({
        width: 800,
        height: 600,
        backgroundColor: 0x1e1e2e,
        antialias: true
      })

      pixiAppRef.current = app
      
      // 캔버스 확인 및 DOM 추가
      const canvas = app.canvas as HTMLCanvasElement
      if (!canvas) {
        throw new Error('PIXI.js 캔버스를 생성할 수 없습니다!')
      }
      
      canvasRef.current.appendChild(canvas)

      // 개별 이미지 방식에서는 스프라이트 시트 로딩 불필요
      spriteSheetRef.current = null  // 개별 이미지 방식에서는 불필요

      // 컨테이너 생성 (ISO 뷰 + 줌/패닝용)
      const worldContainer = new PIXI.Container()
      const gridContainer = new PIXI.Container()
      const tileContainer = new PIXI.Container()
      
      worldContainerRef.current = worldContainer
      gridContainerRef.current = gridContainer
      tileContainerRef.current = tileContainer
      
      worldContainer.addChild(gridContainer)
      worldContainer.addChild(tileContainer)
      app.stage.addChild(worldContainer)
      
      // 월드 컨테이너를 화면 중앙으로 이동
      worldContainer.x = 400
      worldContainer.y = 300
      
      // 줌/패닝 이벤트 설정
      setupZoomAndPan(app, worldContainer, zoomLevelRef, isDraggingRef, lastPanPointRef)
      
      // 그리드 생성 함수 (내부)
      const createGridInternal = (PIXI: any) => {
    if (!gridContainerRef.current) return

    gridContainerRef.current.removeChildren()

    // 차고용 확장 그리드 생성 (-9~10, -9~10) - 20x20 그리드
    for (let x = -9; x <= 10; x++) {
      for (let y = -9; y <= 10; y++) {
        const coords = toIsoCoords(x, y)
        
        // ISO 다이아몬드 타일 생성 (메인화면과 동일한 방식)
        const cell = new PIXI.Graphics()
        cell.fill({ color: 0x3498db, alpha: 0.15 })  // 연한 파란색
        cell.setStrokeStyle({ color: 0x2980b9, width: 1, alpha: 0.6 })  // 파란색 경계선
        
        // 다이아몬드 그리드 크기 (100px 가로폭)
        const hw = VOXEL_SIZE / 2  // 타일 반 너비 (50px) - 전체 가로폭 100px  
        const hh = VOXEL_SIZE / 4  // 타일 반 높이 (25px) - 표준 2:1 비율 유지
        
        cell.moveTo(0, -hh)      // 상단
        cell.lineTo(hw, 0)       // 우측
        cell.lineTo(0, hh)       // 하단  
        cell.lineTo(-hw, 0)      // 좌측
        cell.lineTo(0, -hh)      // 상단으로 닫기
        
        cell.fill()
        cell.stroke()
        
        cell.x = coords.x
        cell.y = coords.y
        
        // 그리드가 타일보다 위에 렌더링되도록 zIndex 설정
        cell.zIndex = y * 1000 + x + 10000
        
        // 클릭 이벤트 추가
        cell.eventMode = 'static'  // PIXI v8 방식
        cell.cursor = 'pointer'
        cell.on('pointerdown', (event: any) => {
          // 우클릭은 패닝용으로 사용하므로 좌클릭만 처리
          if (event.button === 2) {
            return
          }
          
          // 드래그 중이면 타일 배치 무시
          if (isDraggingRef.current) {
            return
          }
          
          // ref를 통해 최신 상태 참조
          const currentSelectedTileId = selectedTileIdRef.current
          const currentAvailableTiles = availableTilesRef.current
          const currentGridData = gridDataRef.current
          
          
          if (!currentSelectedTileId) {
            return
          }
          
          handleTileClickWithRefs(x, y, currentSelectedTileId, currentAvailableTiles, currentGridData)
        })
        
        // 호버 효과 (메인화면과 동일)
        cell.on('pointerover', () => {
          cell.clear()
          cell.fill({ color: 0xe74c3c, alpha: 0.5 })  // 호버 시 빨간색
          cell.setStrokeStyle({ color: 0xc0392b, width: 2, alpha: 1 })
          cell.moveTo(0, -hh).lineTo(hw, 0).lineTo(0, hh).lineTo(-hw, 0).lineTo(0, -hh)
          cell.fill().stroke()
        })
        
        cell.on('pointerout', () => {
          cell.clear()
          cell.fill({ color: 0x3498db, alpha: 0.15 })  // 원래 색상으로 복원
          cell.setStrokeStyle({ color: 0x2980b9, width: 1, alpha: 0.6 })
          cell.moveTo(0, -hh).lineTo(hw, 0).lineTo(0, hh).lineTo(-hw, 0).lineTo(0, -hh)
          cell.fill().stroke()
        })
        
        gridContainerRef.current.addChild(cell)
      }
    }
    
    // 🚫 마을 포털 그리드 제거됨 - 더 이상 사용하지 않음
    // 상점 UI로 대체되어 마을 포털이 필요 없음
        
        // zIndex 정렬 활성화
        gridContainerRef.current.sortableChildren = true
      }
      
      createGridInternal(PIXI)
      
      setIsCanvasReady(true)
      
    } catch (error) {
    }
  }

  // ref 기반 타일 클릭 처리 (클로저 문제 완전 해결)
  const handleTileClickWithRefs = async (
    x: number, 
    y: number, 
    currentSelectedTileId: string | null,
    currentAvailableTiles: TileInfo[],
    currentGridData: Map<string, string | null>
  ) => {
    
    if (!currentSelectedTileId) {
      // 타일이 있다면 첫 번째 타일로 강제 선택
      if (currentAvailableTiles.length > 0) {
        const fallbackTile = currentAvailableTiles[0]
        setSelectedTileId(fallbackTile.id)
        return
      }
      return
    }
    
    if (currentAvailableTiles.length === 0) {
      return
    }
    
    // 선택된 타일이 실제로 존재하는지 확인
    const selectedTile = currentAvailableTiles.find(t => t.id === currentSelectedTileId)
    if (!selectedTile) {
      return
    }
    
    
    const key = `${x},${y}`
    const newGridData = new Map(currentGridData)
    
    // 이미 해당 위치에 타일이 있는지 확인
    const existingTileId = currentGridData.get(key)
    
    if (existingTileId) {
      // 이미 타일이 있으면 삭제
      newGridData.delete(key)
      setGridData(newGridData)
      
      
      try {
        await updateTileVisual(x, y, null)  // null을 전달해서 타일 제거
      } catch (error) {
      }
    } else {
      // 타일이 없으면 새로 배치
      newGridData.set(key, currentSelectedTileId)
      setGridData(newGridData)
      
      
      try {
        await updateTileVisual(x, y, currentSelectedTileId)
      } catch (error) {
      }
    }
  }
  
  // 기존 handleTileClick도 유지 (다른 곳에서 사용할 수도 있음)
  const handleTileClick = async (x: number, y: number) => {
    return handleTileClickWithRefs(x, y, selectedTileIdRef.current, availableTilesRef.current, gridDataRef.current)
  }


  // 타일 비주얼 업데이트 (개별 이미지 파일로 단순화!)
  const updateTileVisual = useCallback(async (x: number, y: number, tileId: string | null) => {
    if (!pixiAppRef.current || !tileContainerRef.current) return
    
    const key = `tile_${x}_${y}`
    
    // 기존 타일 제거
    const existingTile = tileContainerRef.current.getChildByName(key)
    if (existingTile) {
      tileContainerRef.current.removeChild(existingTile)
    }
    
    if (!tileId) return
    
    // 새 타일 추가 - 개별 이미지 파일 로딩
    try {
      const PIXI = await loadPixi()
      const tileInfo = availableTilesRef.current.find(t => t.id === tileId)
      if (!tileInfo) {
        return
      }
      
      
      // PIXI.js v8 - 개별 이미지 파일 로딩 (매우 간단!)
      const tileTexture = await PIXI.Assets.load(tileInfo.imagePath)
      
      // 스프라이트 생성
      const sprite = new PIXI.Sprite(tileTexture)
      
      // 100px 가로폭으로 타일 크기 조정
      
      // 타일 가로폭을 100px로 설정
      const targetWidth = 100  // 100px 가로폭
      
      const scaleX = targetWidth / tileTexture.width
      const scaleY = scaleX  // 비율 유지를 위해 동일한 스케일 사용
      sprite.scale.set(scaleX, scaleY)
      
      // 앵커를 하단 중앙으로 설정 (타일이 그리드 다이아몬드 안에 배치되도록)
      sprite.anchor.set(0.5, 1.0)  // x: 중앙, y: 하단
      
      // 다이아몬드 그리드 영역에 맞게 위치 조정
      const coords = toIsoCoords(x, y)
      sprite.x = coords.x
      sprite.y = coords.y + (VOXEL_SIZE / 8) + 37.5 - 12.5  // 조밀해진 그리드에 맞게 위치 조정 + Z축으로 25px 아래
      
      sprite.name = key
      
      // ISO뷰 z-ordering: y 좌표가 클수록 더 앞에 (더 늦게 렌더링)
      sprite.zIndex = y * 1000 + x
      
      if (!tileContainerRef.current) {
        throw new Error('타일 컨테이너가 없습니다!')
      }
      
      tileContainerRef.current.addChild(sprite)
      tileContainerRef.current.sortableChildren = true
      
      
    } catch (error) {
    }
  }, [])  // ref 사용으로 의존성 최소화

  // JSON 파일로 타일맵 다운로드
  const downloadTilemapJSON = useCallback(() => {
      const tiles = Array.from(gridData.entries()).map(([key, tileId]) => {
        const [x, y] = key.split(',').map(Number)
        return { x, y, tileId }
      })
      
    const tilemapData: TilemapData = {
        name: tilemapName,
        createdAt: new Date().toISOString(),
      tiles,
      metadata: {
        gridSize: 11,
        tileSize: VOXEL_SIZE,
        version: "1.0"
      }
    }
    
    const jsonString = JSON.stringify(tilemapData, null, 2)
    const blob = new Blob([jsonString], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    
    const link = document.createElement('a')
    link.href = url
    link.download = `${tilemapName.replace(/[^a-zA-Z0-9가-힣]/g, '_')}_tilemap.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    URL.revokeObjectURL(url)
    
  }, [gridData, tilemapName])

  // JSON 파일에서 타일맵 로드
  const handleJSONUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.name.endsWith('.json')) {
      alert('JSON 파일만 업로드 가능합니다.')
        return
      }
      
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const jsonData = JSON.parse(e.target?.result as string) as TilemapData
        
        // 데이터 유효성 검사
        if (!jsonData.name || !jsonData.tiles || !Array.isArray(jsonData.tiles)) {
          alert('올바른 타일맵 JSON 파일이 아닙니다.')
          return
        }
        
        // 타일맵 이름 설정
        setTilemapName(jsonData.name)
    
    // 그리드 데이터 복원
    const newGridData = new Map<string, string | null>()
        jsonData.tiles.forEach(tile => {
      const key = `${tile.x},${tile.y}`
      newGridData.set(key, tile.tileId)
    })
    setGridData(newGridData)
    
    // 비주얼 업데이트
        clearGrid()
        jsonData.tiles.forEach(async (tile) => {
      if (tile.tileId) {
        await updateTileVisual(tile.x, tile.y, tile.tileId)
          }
        })
        
        alert(`✅ "${jsonData.name}" 타일맵이 성공적으로 로드되었습니다!`)
        
      } catch (error) {
        alert('JSON 파일을 읽는 중 오류가 발생했습니다.')
      }
    }
    reader.readAsText(file)
    
    // 파일 입력 초기화
    event.target.value = ''
  }, [tilemapName, updateTileVisual])

  // 그리드 전체 초기화
  const clearGrid = useCallback(() => {
    if (!tileContainerRef.current) return
    
    // 모든 타일 스프라이트 제거
    tileContainerRef.current.removeChildren()
    
    // 그리드 데이터 초기화
    setGridData(new Map())
    
  }, [])

  // 타일 데이터 로드 (개별 이미지 파일 기반)
  const loadTileData = useCallback(async () => {
    setIsLoading(true)
    try {
      const tiles = generateTileData()
      
      // 상태 업데이트
      setAvailableTiles(tiles)
      
      // 로드된 타일 정보 로그
      if (tiles.length > 0) {
      } else {
      }
      
      return tiles  // Promise가 완료되었음을 명시
      
    } catch (error) {
      throw error  // 에러를 상위로 전파
    } finally {
      setIsLoading(false)
    }
  }, [])

  // availableTiles가 업데이트되면 첫 번째 타일 선택
  useEffect(() => {
    if (availableTiles.length > 0 && !selectedTileId) {
      const firstTile = availableTiles[0]
      setSelectedTileId(firstTile.id)
    }
  }, [availableTiles, selectedTileId])
  
  // 초기 로딩 (순차적으로 실행)
  useEffect(() => {
    if (!loading && user) {
      const initializeEditor = async () => {
        try {
          // 1단계: 타일 데이터 먼저 로드
          await loadTileData()
          
          // 2단계: 캔버스 초기화
          setTimeout(() => {
            if (canvasRef.current) {
              initializeCanvas()
            }
          }, 200)
          
        } catch (error) {
        }
      }
      
      initializeEditor()
    }
  }, [loading, user])

  // 로그인하지 않은 경우 리다이렉트
  if (!loading && !user) {
    router.push('/login')
    return null
  }

  // 로딩 중일 때
  if (loading || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-white text-2xl">🔄 로딩 중...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4">
      <div className="max-w-7xl mx-auto">
        {/* 헤더 */}
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              🚗 차고 타일맵 에디터 (상점 UI 연동)
            </h1>
            <div className="flex gap-2">
              <input
                type="file"
                ref={fileInputRef}
                accept=".json"
                onChange={handleJSONUpload}
                style={{ display: 'none' }}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                📁 JSON 불러오기
              </button>
              <button
                onClick={downloadTilemapJSON}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                💾 JSON 다운로드
              </button>
              <button
                onClick={clearGrid}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                🧹 그리드 초기화
              </button>
            </div>
            
            {/* 줌 컨트롤 */}
            <div className="flex flex-wrap gap-2 mt-4">
              <button
                onClick={() => {
                  if (worldContainerRef.current) {
                    const newZoom = Math.max(0.3, zoomLevelRef.current * 0.8)
                    zoomLevelRef.current = newZoom
                    worldContainerRef.current.scale.set(newZoom)
                  }
                }}
                className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                title="줌 아웃 (마우스휠 위로도 가능)"
              >
                🔍➖ 축소
              </button>
              <button
                onClick={() => {
                  if (worldContainerRef.current) {
                    zoomLevelRef.current = 1
                    worldContainerRef.current.scale.set(1)
                    worldContainerRef.current.x = 400
                    worldContainerRef.current.y = 300
                  }
                }}
                className="px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                title="줌/위치 초기화"
              >
                🔄 리셋
              </button>
              <button
                onClick={() => {
                  if (worldContainerRef.current) {
                    const newZoom = Math.min(3, zoomLevelRef.current * 1.25)
                    zoomLevelRef.current = newZoom
                    worldContainerRef.current.scale.set(newZoom)
                  }
                }}
                className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                title="줌 인 (마우스휠 아래로도 가능)"
              >
                🔍➕ 확대
              </button>
            </div>
            
            {/* 조작법 안내 */}
            <div className="mt-4 p-3 bg-yellow-500/10 backdrop-blur-sm rounded-lg border border-yellow-500/30">
              <h4 className="text-sm font-bold mb-2 text-yellow-300">🎮 조작법</h4>
              <div className="text-xs text-white/70 space-y-1">
                <div>• <strong>좌클릭:</strong> 타일 배치</div>
                <div>• <strong>우클릭 + 드래그:</strong> 화면 이동</div>
                <div>• <strong>마우스휠:</strong> 줌인/줌아웃</div>
                <div>• <strong>호버:</strong> 그리드 셀 하이라이트</div>
              </div>
            </div>
          </div>
          
          {/* 타일맵 이름 입력 */}
          <input
            type="text"
            value={tilemapName}
            onChange={(e) => setTilemapName(e.target.value)}
            placeholder="타일맵 이름을 입력하세요"
            className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>

        {/* 메인 컨텐츠 */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* 타일 팔레트 */}
          <div className="lg:col-span-1">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <h2 className="text-xl font-bold text-white mb-4">🎨 타일 팔레트</h2>
              
              {/* 카테고리 탭 */}
              <div className="flex flex-wrap gap-2 mb-4">
                {TILE_CATEGORIES.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`px-3 py-2 rounded-lg text-sm transition-all ${
                      selectedCategory === category.id
                        ? 'bg-purple-600 text-white'
                        : 'bg-white/10 text-white/70 hover:bg-white/20'
                    }`}
                  >
                    {category.name} ({category.files.length})
                  </button>
                ))}
              </div>
              
              {/* 타일 그리드 */}
              <div className="grid grid-cols-3 gap-2 max-h-96 overflow-y-auto">
                {filteredTiles.map((tile) => (
                  <button
                    key={tile.id}
                    onClick={() => setSelectedTileId(tile.id)}
                    className={`aspect-square border-2 rounded-lg overflow-hidden transition-all ${
                      selectedTileId === tile.id
                        ? 'border-purple-400 bg-purple-500/20'
                        : 'border-white/20 bg-white/5 hover:border-white/40'
                    }`}
                    title={tile.name}
                  >
                    {/* 개별 이미지 파일 직접 표시 */}
                    <img
                      src={tile.imagePath}
                      alt={tile.name}
                      className="w-full h-full object-contain"
                      loading="lazy"
                    />
                  </button>
                ))}
              </div>
              
              {/* 선택된 타일 정보 */}
              <div className="mt-4 p-3 bg-white/5 rounded-lg">
                <div className="text-sm text-white">
                  {selectedTileId ? (
                    <>
                      <div><strong>선택된 타일:</strong> {availableTilesRef.current.find(t => t.id === selectedTileId)?.name || '불러오는 중...'}</div>
                      <div><strong>ID:</strong> {selectedTileId}</div>
                    </>
                  ) : (
                    <div className="text-white/50">
                      <div>타일을 로딩 중입니다...</div>
                      <div className="text-xs mt-1">로딩 완료 후 첫 번째 타일이 자동 선택됩니다</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* 캔버스 영역 */}
          <div className="lg:col-span-3">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-white">🎮 타일맵 캔버스 (ISO 뷰)</h2>
                <div className="text-sm text-white/70">
                  {isCanvasReady ? '✅ 준비완료' : '⏳ 로딩중...'}
                </div>
              </div>
              
              {/* PIXI.js 캔버스 */}
              <div 
                ref={canvasRef}
                className="border border-white/20 rounded-lg overflow-hidden"
                style={{ 
                  width: '800px', 
                  height: '600px',
                  margin: '0 auto'
                }}
              />
              
              {/* 컨트롤 */}
              <div className="mt-4 text-sm text-white/70 space-y-2">
                <div>🖱️ <strong>사용법:</strong></div>
                <div>• 왼쪽에서 타일을 선택한 후, 그리드를 클릭하여 배치</div>
                <div>• 같은 위치를 다시 클릭하면 타일이 교체됩니다</div>
                <div>• JSON 파일로 내보내기/불러오기가 가능합니다</div>
                <div>• <strong>🏪 상점 UI:</strong> 이제 상점 버튼으로 아이템 구매가 가능합니다</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
'use client'

import React, { useState, useRef, useCallback, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { IsometricUtils } from '@/lib/minigame/IsometricUtils'

// 아이템 데이터 인터페이스
interface VoxelData {
  x: number
  y: number  
  z: number
}

interface ItemData {
  id: string
  name: string
  description: string
  category: '가구' | '장식품' | '운송수단'
  imagePath: string
  imageFile?: File
  imageScale: number // 이미지 크기 조절 (10%~300%)
  imageOffset: { x: number, y: number } // 이미지 위치 조절 (픽셀 단위)
  voxelData: VoxelData[]
  dimensions: { width: number, height: number, depth: number }
  price: number
  createdAt: string
  updatedAt: string
}

// 단일 복셀 타입 - 모든 복셀은 배치 차단 역할
const VOXEL_TYPE = {
  name: '배치 차단',
  color: 0x3498db,
  alpha: 0.8,
  description: '물건을 놓을 수 없는 공간'
}

export default function ItemVoxelEditorPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  // 상태 관리
  const [currentItem, setCurrentItem] = useState<ItemData | null>(null)
  const [currentLayer, setCurrentLayer] = useState(0)
  const [isCanvasReady, setIsCanvasReady] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [registeredItems, setRegisteredItems] = useState<ItemData[]>([]) // 등록된 아이템 목록
  
  // Refs
  const canvasRef = useRef<HTMLDivElement>(null)
  const pixiAppRef = useRef<any>(null)
  const worldContainerRef = useRef<any>(null)
  const voxelContainerRef = useRef<any>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // 줌/패닝 refs
  const zoomLevelRef = useRef(1)
  const isDraggingRef = useRef(false)
  const lastPanPointRef = useRef({ x: 0, y: 0 })

  // PIXI.js 동적 로드
  const loadPixi = useCallback(async () => {
    try {
      const PIXI = await import('pixi.js')
      return PIXI
    } catch (error) {
      throw error
    }
  }, [])

  // 기존 이미지 목록 로드 제거 - 업로드만 사용

  // 새 아이템 생성
  const createNewItem = () => {
    const newItem: ItemData = {
      id: `item_${Date.now()}`,
      name: '새 아이템',
      description: '',
      category: '가구',
      imagePath: '',
      imageScale: 1.0, // 기본 이미지 크기
      imageOffset: { x: 0, y: 0 }, // 기본 이미지 위치 (그리드 중앙)
      voxelData: [],
      dimensions: { width: 20, height: 20, depth: 5 }, // 미니게임과 동일한 -9~10 범위의 20x20 그리드
      price: 1000,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    setCurrentItem(newItem)
    setCurrentLayer(0)
  }

  // 이미지 파일 업로드
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file && currentItem) {
      try {
        // 파일을 서버에 업로드
        const formData = new FormData()
        formData.append('file', file)
        formData.append('category', 'interior') // 인테리어 아이템용
        
        const response = await fetch('/api/upload-image', {
          method: 'POST',
          body: formData
        })
        
        if (!response.ok) {
          throw new Error('이미지 업로드 실패')
        }
        
        const data = await response.json()
        const imagePath = data.imagePath // 서버에서 반환된 경로
        
        setCurrentItem({
          ...currentItem,
          imagePath: imagePath,
          imageFile: file,
          imageScale: currentItem.imageScale || 1.0,
          imageOffset: currentItem.imageOffset || { x: 0, y: 0 },
          updatedAt: new Date().toISOString()
        })
        
      } catch (error) {
        alert('이미지 업로드에 실패했습니다.')
      }
    }
  }

  // 기존 이미지 선택 기능 제거 - 업로드만 사용

  // PIXI.js 캔버스 초기화
  const initializeCanvas = async () => {
    if (!canvasRef.current || !currentItem) return

    try {
      const PIXI = await loadPixi()
      
      // 기존 앱 정리
      if (pixiAppRef.current) {
        pixiAppRef.current.destroy(true)
        canvasRef.current.innerHTML = ''
      }

      // 새 앱 생성
      const app = new PIXI.Application()
      await app.init({
        width: 800,
        height: 600,
        backgroundColor: 0x2c3e50,
        antialias: true
      })

      canvasRef.current.appendChild(app.canvas as HTMLCanvasElement)
      pixiAppRef.current = app

      // 월드 컨테이너 생성
      const worldContainer = new PIXI.Container()
      worldContainer.sortableChildren = true
      app.stage.addChild(worldContainer)
      worldContainerRef.current = worldContainer

      // 복셀 컨테이너 생성
      const voxelContainer = new PIXI.Container()
      voxelContainer.sortableChildren = true
      worldContainer.addChild(voxelContainer)
      voxelContainerRef.current = voxelContainer

      // 미니게임과 동일한 중앙 배치
      worldContainer.x = app.screen.width / 2  // 400 (800/2)
      worldContainer.y = app.screen.height / 2  // 300 (600/2)

      setupEvents(app, worldContainer)
      createVoxelGrid(PIXI)

      setIsCanvasReady(true)

    } catch (error) {
    }
  }

  // 메인 캔버스와 동일한 20x20 그리드 생성
  const createVoxelGrid = async (PIXI: any) => {
    if (!voxelContainerRef.current || !currentItem) return

    voxelContainerRef.current.removeChildren()

    // 메인 캔버스와 동일한 20x20 그리드 설정 (-9 ~ 10)
    const gridMin = -9
    const gridMax = 10
    const layerOffset = IsometricUtils.TILE_HEIGHT // 50px 레이어 간격

    // 배경 이미지 추가 (있는 경우) - 중앙 고정, 크기 조절 가능
    if (currentItem.imagePath) {
      try {
        const backgroundTexture = await PIXI.Assets.load(currentItem.imagePath)
        const backgroundSprite = new PIXI.Sprite(backgroundTexture)
        
        // 이미지를 20x20 그리드 중앙에 맞게 조정
        const gridWidth = 20 * IsometricUtils.TILE_WIDTH * 0.4  // 20x20 그리드 가로폭
        const gridHeight = 20 * IsometricUtils.TILE_HEIGHT * 0.4 // 20x20 그리드 세로폭
        
        const scaleX = gridWidth / backgroundTexture.width
        const scaleY = gridHeight / backgroundTexture.height
        let baseScale = Math.min(scaleX, scaleY, 1) // 기본 스케일
        
        // 사용자 지정 이미지 크기 적용
        const finalScale = baseScale * (currentItem.imageScale || 1.0)
        
        backgroundSprite.scale.set(finalScale)
        backgroundSprite.anchor.set(0.5, 1) // 미니게임과 동일한 중앙 하단 기준
        
        // 사용자 지정 이미지 위치 적용 + 미니게임과 동일한 기본 오프셋
        const offsetX = currentItem.imageOffset?.x || 0
        const offsetY = currentItem.imageOffset?.y || 0
        backgroundSprite.x = offsetX  // X축 오프셋 적용
        backgroundSprite.y = offsetY + 37.5  // Y축 오프셋 + 미니게임과 동일한 기본 오프셋
        
        backgroundSprite.alpha = 0.5 // 적당한 투명도
        backgroundSprite.zIndex = -1000 // 가장 뒤에 배치
        
        voxelContainerRef.current.addChild(backgroundSprite)
      } catch (error) {
      }
    }

    // 모든 레이어의 복셀들 - 현재 레이어와 다른 레이어 구분
    const currentLayerVoxels = currentItem.voxelData.filter(v => v.z === currentLayer)
    const otherLayerVoxels = currentItem.voxelData.filter(v => v.z !== currentLayer)
    
    const currentVoxelMap = new Map<string, VoxelData>()
    const otherVoxelMap = new Map<string, VoxelData[]>()
    
    // 현재 레이어 복셀 맵
    currentLayerVoxels.forEach(v => currentVoxelMap.set(`${v.x},${v.y}`, v))
    
    // 다른 레이어 복셀 맵 (동일 x,y 좌표에 여러 z값 가능)
    otherLayerVoxels.forEach(v => {
      const key = `${v.x},${v.y}`
      if (!otherVoxelMap.has(key)) {
        otherVoxelMap.set(key, [])
      }
      otherVoxelMap.get(key)!.push(v)
    })

    // 메인 캔버스와 동일한 20x20 그리드 (-9 ~ 10)
    for (let x = gridMin; x <= gridMax; x++) {
      for (let y = gridMin; y <= gridMax; y++) {
        // IsometricUtils 사용한 좌표 변환
        const coords = IsometricUtils.toScreenCoords(x, y, currentLayer)
        const isoX = coords.screenX
        const isoY = coords.screenY

        const voxelKey = `${x},${y}`
        const currentVoxel = currentVoxelMap.get(voxelKey)
        const otherVoxels = otherVoxelMap.get(voxelKey) || []

        // 메인 캔버스와 동일한 타일 크기
        const hw = IsometricUtils.TILE_WIDTH / 2   // 50px - 다이아몬드 반 너비
        const hh = IsometricUtils.TILE_HEIGHT / 2  // 25px - 다이아몬드 반 높이
        const depth = IsometricUtils.TILE_HEIGHT   // 50px - 큐브 높이

        // 1. 먼저 다른 레이어의 복셀들을 빨간색으로 연하게 렌더링
        otherVoxels.forEach((otherVoxel, index) => {
          const otherVoxelGraphic = new PIXI.Graphics()
          
          // 빨간색 계열 + 연한 투명도
          const redColor = 0xff6b6b
          const lightAlpha = 0.3
          
          // 1. 상단면 (다이아몬드 모양) - 가장 밝은 빨간색
          otherVoxelGraphic.fill({ color: redColor, alpha: lightAlpha })
          otherVoxelGraphic.moveTo(0, -hh - depth)
          otherVoxelGraphic.lineTo(hw, -depth)
          otherVoxelGraphic.lineTo(0, hh - depth)
          otherVoxelGraphic.lineTo(-hw, -depth)
          otherVoxelGraphic.lineTo(0, -hh - depth)
          otherVoxelGraphic.fill()
          
          // 2. 좌측면 - 중간 빨간색
          otherVoxelGraphic.fill({ color: redColor * 0.75, alpha: lightAlpha })
          otherVoxelGraphic.moveTo(-hw, -depth)
          otherVoxelGraphic.lineTo(0, hh - depth)
          otherVoxelGraphic.lineTo(0, hh)
          otherVoxelGraphic.lineTo(-hw, 0)
          otherVoxelGraphic.lineTo(-hw, -depth)
          otherVoxelGraphic.fill()
          
          // 3. 우측면 - 어두운 빨간색
          otherVoxelGraphic.fill({ color: redColor * 0.5, alpha: lightAlpha })
          otherVoxelGraphic.moveTo(hw, -depth)
          otherVoxelGraphic.lineTo(0, hh - depth)
          otherVoxelGraphic.lineTo(0, hh)
          otherVoxelGraphic.lineTo(hw, 0)
          otherVoxelGraphic.lineTo(hw, -depth)
          otherVoxelGraphic.fill()
          
          // 연한 외곽선
          otherVoxelGraphic.setStrokeStyle({ color: redColor * 0.3, width: 1, alpha: 0.4 })
          otherVoxelGraphic.moveTo(0, -hh - depth)
          otherVoxelGraphic.lineTo(hw, -depth)
          otherVoxelGraphic.lineTo(0, hh - depth)
          otherVoxelGraphic.lineTo(-hw, -depth)
          otherVoxelGraphic.lineTo(0, -hh - depth)
          otherVoxelGraphic.moveTo(-hw, -depth)
          otherVoxelGraphic.lineTo(-hw, 0)
          otherVoxelGraphic.moveTo(hw, -depth)
          otherVoxelGraphic.lineTo(hw, 0)
          otherVoxelGraphic.moveTo(0, hh - depth)
          otherVoxelGraphic.lineTo(0, hh)
          otherVoxelGraphic.stroke()

          otherVoxelGraphic.x = isoX
          otherVoxelGraphic.y = isoY + 37.5 - (index * 5) // 미니게임과 동일한 오프셋 + 레이어 간격
          otherVoxelGraphic.zIndex = isoY - 1000 // 다른 레이어는 뒤에 배치
          
          // 다른 레이어 복셀은 클릭 이벤트를 받지 않도록 설정
          otherVoxelGraphic.eventMode = 'none'

          voxelContainerRef.current.addChild(otherVoxelGraphic)
        })

        // 2. 현재 레이어의 복셀을 초록색으로 렌더링
        const mainVoxel = new PIXI.Graphics()
        
        if (currentVoxel) {
          // 초록색 계열
          const greenColor = 0x2ecc71
          const normalAlpha = 0.8
          
          // 1. 상단면 (다이아몬드 모양) - 가장 밝은 초록색
          mainVoxel.fill({ color: greenColor, alpha: normalAlpha })
          mainVoxel.moveTo(0, -hh - depth)
          mainVoxel.lineTo(hw, -depth)
          mainVoxel.lineTo(0, hh - depth)
          mainVoxel.lineTo(-hw, -depth)
          mainVoxel.lineTo(0, -hh - depth)
          mainVoxel.fill()
          
          // 2. 좌측면 - 중간 초록색
          mainVoxel.fill({ color: greenColor * 0.75, alpha: normalAlpha })
          mainVoxel.moveTo(-hw, -depth)
          mainVoxel.lineTo(0, hh - depth)
          mainVoxel.lineTo(0, hh)
          mainVoxel.lineTo(-hw, 0)
          mainVoxel.lineTo(-hw, -depth)
          mainVoxel.fill()
          
          // 3. 우측면 - 어두운 초록색
          mainVoxel.fill({ color: greenColor * 0.5, alpha: normalAlpha })
          mainVoxel.moveTo(hw, -depth)
          mainVoxel.lineTo(0, hh - depth)
          mainVoxel.lineTo(0, hh)
          mainVoxel.lineTo(hw, 0)
          mainVoxel.lineTo(hw, -depth)
          mainVoxel.fill()
          
          // 초록색 외곽선
          mainVoxel.setStrokeStyle({ color: greenColor * 0.3, width: 1.5, alpha: 0.9 })
          mainVoxel.moveTo(0, -hh - depth)
          mainVoxel.lineTo(hw, -depth)
          mainVoxel.lineTo(0, hh - depth)
          mainVoxel.lineTo(-hw, -depth)
          mainVoxel.lineTo(0, -hh - depth)
          mainVoxel.moveTo(-hw, -depth)
          mainVoxel.lineTo(-hw, 0)
          mainVoxel.moveTo(hw, -depth)
          mainVoxel.lineTo(hw, 0)
          mainVoxel.moveTo(0, hh - depth)
          mainVoxel.lineTo(0, hh)
          mainVoxel.stroke()
        } else {
          // 빈 공간은 메인 캔버스와 동일한 투명 다이아몬드
          mainVoxel.fill({ color: 0x3498db, alpha: 0.05 })
          mainVoxel.setStrokeStyle({ color: 0x2980b9, width: 1, alpha: 0.2 })
          
          mainVoxel.moveTo(0, -hh)
          mainVoxel.lineTo(hw, 0)
          mainVoxel.lineTo(0, hh)
          mainVoxel.lineTo(-hw, 0)
          mainVoxel.lineTo(0, -hh)
          mainVoxel.fill()
          mainVoxel.stroke()
        }

        mainVoxel.x = isoX
        mainVoxel.y = isoY + 37.5  // 미니게임과 동일한 오프셋
        mainVoxel.zIndex = y * 1000 + x + 10000 // 다른 레이어보다 훨씬 높게 설정

        // 상호작용 설정 - 복셀이 있어도 없어도 모든 곳에서 클릭 가능
        mainVoxel.eventMode = 'static'
        mainVoxel.cursor = 'pointer'
        mainVoxel.interactive = true // 상호작용 확실히 활성화
        
        // 클릭 영역을 더 넓게 설정 (히트 영역 확장)
        mainVoxel.hitArea = new PIXI.Rectangle(-hw, -hh - depth, hw * 2, hh * 2 + depth)

        // 클릭 이벤트 - 복셀 추가/제거/변경
        mainVoxel.on('pointerdown', (event: any) => {
          event.stopPropagation() // 이벤트 전파 중단
          handleVoxelClick(x, y, currentLayer)
        })

        // 메인 캔버스와 동일한 호버 효과
        mainVoxel.on('pointerover', (event: any) => {
          event.stopPropagation() // 이벤트 전파 중단
          
          if (!currentVoxel) {
            // 빈 공간: 새 복셀 미리보기
            mainVoxel.clear()
            
            // 호버 시 반투명한 아이소메트릭 정육면체 미리보기 (초록색)
            const greenColor = 0x2ecc71
            
            // 상단면 (다이아몬드)
            mainVoxel.fill({ color: greenColor, alpha: 0.4 })
            mainVoxel.moveTo(0, -hh - depth)
            mainVoxel.lineTo(hw, -depth)
            mainVoxel.lineTo(0, hh - depth)
            mainVoxel.lineTo(-hw, -depth)
            mainVoxel.lineTo(0, -hh - depth)
            mainVoxel.fill()
            
            // 좌측면
            mainVoxel.fill({ color: greenColor * 0.75, alpha: 0.4 })
            mainVoxel.moveTo(-hw, -depth)
            mainVoxel.lineTo(0, hh - depth)
            mainVoxel.lineTo(0, hh)
            mainVoxel.lineTo(-hw, 0)
            mainVoxel.lineTo(-hw, -depth)
            mainVoxel.fill()
            
            // 우측면
            mainVoxel.fill({ color: greenColor * 0.5, alpha: 0.4 })
            mainVoxel.moveTo(hw, -depth)
            mainVoxel.lineTo(0, hh - depth)
            mainVoxel.lineTo(0, hh)
            mainVoxel.lineTo(hw, 0)
            mainVoxel.lineTo(hw, -depth)
            mainVoxel.fill()
            
            // 외곽선
            mainVoxel.setStrokeStyle({ color: greenColor, width: 2, alpha: 0.7 })
            mainVoxel.moveTo(0, -hh - depth)
            mainVoxel.lineTo(hw, -depth)
            mainVoxel.lineTo(0, hh - depth)
            mainVoxel.lineTo(-hw, -depth)
            mainVoxel.lineTo(0, -hh - depth)
            mainVoxel.stroke()
          } else {
            // 복셀이 있는 곳: 밝게 강조 표시
            mainVoxel.alpha = 1.0 // 완전 불투명으로 강조
            mainVoxel.scale.set(1.05) // 살짝 크게 표시
          }
        })

        mainVoxel.on('pointerout', (event: any) => {
          event.stopPropagation() // 이벤트 전파 중단
          
          if (!currentVoxel) {
            // 빈 공간: 원래 다이아몬드로 복원
            mainVoxel.clear()
            mainVoxel.fill({ color: 0x3498db, alpha: 0.05 })
            mainVoxel.setStrokeStyle({ color: 0x2980b9, width: 1, alpha: 0.2 })
            
            mainVoxel.moveTo(0, -hh)
            mainVoxel.lineTo(hw, 0)
            mainVoxel.lineTo(0, hh)
            mainVoxel.lineTo(-hw, 0)
            mainVoxel.lineTo(0, -hh)
            mainVoxel.fill()
            mainVoxel.stroke()
          } else {
            // 복셀이 있는 곳: 원래 상태로 복원
            mainVoxel.alpha = 0.8 // 원래 투명도
            mainVoxel.scale.set(1.0) // 원래 크기
          }
        })

        voxelContainerRef.current.addChild(mainVoxel)
      }
    }

    voxelContainerRef.current.sortableChildren = true
    
    // 컨테이너 전체에 백업 클릭 이벤트 추가 (안전장치)
    voxelContainerRef.current.eventMode = 'static'
    voxelContainerRef.current.interactive = true
    
    // 백업 클릭 핸들러 - 개별 복셀 클릭이 실패할 경우 대비
    voxelContainerRef.current.on('pointerdown', (event: any) => {
      // 개별 복셀에서 처리되지 않은 경우에만 실행됨
      const localPoint = voxelContainerRef.current!.toLocal(event.global)
      
      // 가장 가까운 그리드 좌표 계산
      let closestX = 0, closestY = 0, minDistance = Infinity
      
      for (let x = gridMin; x <= gridMax; x++) {
        for (let y = gridMin; y <= gridMax; y++) {
          const coords = IsometricUtils.toScreenCoords(x, y, currentLayer)
          const distance = Math.sqrt(
            Math.pow(localPoint.x - coords.screenX, 2) + 
            Math.pow(localPoint.y - coords.screenY, 2)
          )
          
          if (distance < minDistance) {
            minDistance = distance
            closestX = x
            closestY = y
          }
        }
      }
      
      if (minDistance < 100) { // 100px 이내에 있는 경우에만
        handleVoxelClick(closestX, closestY, currentLayer)
      }
    })
  }

  // 복셀 클릭 처리
  const handleVoxelClick = (x: number, y: number, z: number) => {
    if (!currentItem) return

    const newVoxelData = [...currentItem.voxelData]
    const existingIndex = newVoxelData.findIndex(v => v.x === x && v.y === y && v.z === z)

    if (existingIndex === -1) {
      // 새 복셀 추가
      newVoxelData.push({ x, y, z })
    } else {
      // 기존 복셀 제거
      newVoxelData.splice(existingIndex, 1)
    }

    const updatedItem = {
      ...currentItem,
      voxelData: newVoxelData,
      updatedAt: new Date().toISOString()
    }
    
    setCurrentItem(updatedItem)

    // 실시간 그리드 업데이트 (즉시 반영)
    loadPixi().then(PIXI => {
      createVoxelGrid(PIXI)
    }).catch(error => {
    })
  }

  // 이벤트 설정
  const setupEvents = (app: any, worldContainer: any) => {
    // 마우스휠 줌
    app.canvas.addEventListener('wheel', (e: WheelEvent) => {
      e.preventDefault()
      const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1
      const newZoom = Math.max(0.3, Math.min(3, zoomLevelRef.current * zoomFactor))
      zoomLevelRef.current = newZoom
      worldContainer.scale.set(newZoom)
    })

    // 우클릭 드래그 패닝
    app.canvas.addEventListener('mousedown', (e: MouseEvent) => {
      if (e.button === 2) {
        isDraggingRef.current = true
        lastPanPointRef.current = { x: e.clientX, y: e.clientY }
      }
    })

    app.canvas.addEventListener('mousemove', (e: MouseEvent) => {
      if (isDraggingRef.current) {
        const deltaX = e.clientX - lastPanPointRef.current.x
        const deltaY = e.clientY - lastPanPointRef.current.y
        
        worldContainer.x += deltaX
        worldContainer.y += deltaY
        
        lastPanPointRef.current = { x: e.clientX, y: e.clientY }
      }
    })

    app.canvas.addEventListener('mouseup', () => {
      isDraggingRef.current = false
    })

    app.canvas.addEventListener('contextmenu', (e: Event) => {
      e.preventDefault()
    })
  }

  // 아이템 저장 (상점에 등록)
  const saveItemToShop = async () => {
    if (!currentItem) return
    
    if (!currentItem.name.trim()) {
      alert('아이템 이름을 입력해주세요.')
      return
    }
    
    setIsLoading(true)
    try {
      const itemData = {
        name: currentItem.name,
        description: currentItem.description || '',
        category: '인테리어', // 메인 카테고리는 항상 '인테리어'
        sub_category: currentItem.category, // sub_category는 가구/장식품/운송수단
        image_url: currentItem.imagePath || '', // image_url 필드 사용
        pixel_data: {
          imageScale: currentItem.imageScale || 1.0,
          imageOffset: currentItem.imageOffset || { x: 0, y: 0 },
          voxelData: currentItem.voxelData || [],
          dimensions: currentItem.dimensions
        },
        price: currentItem.price || 1000
      }

      let response
      const existingItem = registeredItems.find(item => item.id === currentItem.id)
      
      if (existingItem) {
        // 기존 아이템 업데이트
        response = await fetch(`/api/items/${currentItem.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(itemData)
        })
      } else {
        // 새 아이템 생성
        response = await fetch('/api/items', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(itemData)
        })
      }

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || '아이템 저장에 실패했습니다.')
      }

      const { item } = await response.json()
      
      // 로컬 상태 업데이트
      const newItemData = {
        id: item.id,
        name: item.name,
        description: item.description,
        category: item.category,
        imagePath: item.image_path,
        imageScale: item.image_scale,
        imageOffset: item.image_offset,
        voxelData: item.voxel_data,
        dimensions: item.dimensions,
        price: item.price,
        createdAt: item.created_at,
        updatedAt: item.updated_at
      }
      
      if (existingItem) {
        setRegisteredItems(prev => (prev || []).map(i => i.id === item.id ? newItemData : i))
      } else {
        setRegisteredItems(prev => [...(prev || []), newItemData])
      }
      
      alert(`"${currentItem.name}" 아이템이 상점에 등록되었습니다!`)
      
      // 목록으로 돌아가기
      setCurrentItem(null)
    } catch (error) {
      alert(`아이템 저장에 실패했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`)
    } finally {
      setIsLoading(false)
    }
  }

  // 아이템 삭제 함수
  const deleteItem = async (itemId: string, itemName: string) => {
    if (!confirm(`"${itemName}" 아이템을 정말 삭제하시겠습니까?`)) {
      return
    }
    
    try {
      const response = await fetch(`/api/items/${itemId}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        // 로컬 상태에서 아이템 제거
        setRegisteredItems(prev => (prev || []).filter(item => item.id !== itemId))
        alert(`"${itemName}" 아이템이 삭제되었습니다.`)
      } else {
        const error = await response.json()
        throw new Error(error.error || '아이템 삭제에 실패했습니다.')
      }
    } catch (error) {
      alert(`아이템 삭제에 실패했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`)
    }
  }

  // 아이템 금액 수정 함수
  const updateItemPrice = async (itemId: string, itemName: string, currentPrice: number) => {
    const newPriceStr = prompt(`"${itemName}" 아이템의 새로운 가격을 입력하세요:`, currentPrice.toString())
    
    if (newPriceStr === null) return // 취소
    
    const newPrice = parseInt(newPriceStr)
    if (isNaN(newPrice) || newPrice < 0) {
      alert('올바른 가격을 입력해주세요. (0 이상의 숫자)')
      return
    }
    
    try {
      const item = registeredItems?.find(i => i.id === itemId)
      if (!item) return
      
      const response = await fetch(`/api/items/${itemId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: item.name,
          description: item.description,
          category: item.category,
          imagePath: item.imagePath,
          imageScale: item.imageScale,
          imageOffset: item.imageOffset,
          voxelData: item.voxelData,
          dimensions: item.dimensions,
          price: newPrice
        })
      })
      
      if (response.ok) {
        const { item: updatedItem } = await response.json()
        
        // 로컬 상태 업데이트
        setRegisteredItems(prev => (prev || []).map(i => 
          i.id === itemId 
            ? { ...i, price: updatedItem.price, updatedAt: updatedItem.updated_at }
            : i
        ))
        
        alert(`"${itemName}" 아이템의 가격이 ${newPrice.toLocaleString()}원으로 변경되었습니다.`)
      } else {
        const error = await response.json()
        throw new Error(error.error || '가격 수정에 실패했습니다.')
      }
    } catch (error) {
      alert(`가격 수정에 실패했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`)
    }
  }

  // 페이지 로드 시 아이템 목록 불러오기 (인테리어 아이템만)
  useEffect(() => {
    const loadItems = async () => {
      try {
        // 인테리어 카테고리 아이템만 조회
        const response = await fetch('/api/items?category=인테리어')
        if (response.ok) {
          const { items } = await response.json()
          const formattedItems = (items || []).map((item: any) => ({
            id: item.id || '',
            name: item.name || '제목 없음',
            description: item.description || '',
            category: item.sub_category || '가구', // sub_category 사용 (가구, 장식품, 운송수단)
            imagePath: item.image_url || '', // image_url 필드 사용
            imageScale: item.pixel_data?.imageScale || 1.0,
            imageOffset: item.pixel_data?.imageOffset || { x: 0, y: 0 },
            voxelData: item.pixel_data?.voxelData || [],
            dimensions: item.pixel_data?.dimensions || { width: 20, height: 20, depth: 5 },
            price: item.price || 0,
            createdAt: item.created_at || new Date().toISOString(),
            updatedAt: item.updated_at || new Date().toISOString()
          }))
          setRegisteredItems(formattedItems)
        } else {
          setRegisteredItems([]) // API 오류 시 빈 배열로 설정
        }
      } catch (error) {
        setRegisteredItems([]) // 오류 시 빈 배열로 설정
      }
    }
    
    loadItems()
  }, [])

  // 효과들
  useEffect(() => {
    if (currentItem) {
      initializeCanvas()
    }
  }, [currentItem])

  useEffect(() => {
    if (isCanvasReady && currentItem) {
      loadPixi().then(PIXI => createVoxelGrid(PIXI)).catch(error => {
      })
    }
  }, [currentLayer, isCanvasReady, currentItem?.imagePath, currentItem?.imageScale, currentItem?.imageOffset, currentItem?.dimensions])

  useEffect(() => {
    return () => {
      if (pixiAppRef.current) {
        pixiAppRef.current.destroy(true)
      }
    }
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-white text-2xl">🔄 로딩 중...</div>
      </div>
    )
  }

  if (!user) {
    router.push('/login')
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white">
      {/* 헤더 */}
      <header className="bg-white/10 backdrop-blur-sm border-b border-white/20 p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/admin')}
              className="text-white/80 hover:text-white transition-colors"
            >
              ← 관리자 페이지
            </button>
            <h1 className="text-2xl font-bold">🏪 상점 아이템 등록 에디터</h1>
          </div>
          <div className="text-sm text-white/60">
            복셀 기반 배치 차단 시스템으로 상점 아이템을 만들어보세요
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-4">
        {!currentItem ? (
          /* 아이템 갤러리 화면 */
          <>
            {/* 상단 새 아이템 만들기 버튼 */}
            <div className="mb-6 text-center">
              <button
                onClick={createNewItem}
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
              >
                + 새 아이템 만들기
              </button>
            </div>

            {/* 등록된 아이템 갤러리 */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
              {(registeredItems || []).map((item) => (
                  <div
                    key={item.id}
                  className="bg-white/10 backdrop-blur-sm rounded-xl p-4 hover:bg-white/20 hover:scale-105 transition-all duration-200 relative group border border-white/10 hover:border-white/30"
                >
                  {/* 편집/삭제 버튼 */}
                  <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        updateItemPrice(item.id, item.name, item.price)
                      }}
                      className="w-7 h-7 bg-blue-500/90 hover:bg-blue-600 rounded-full flex items-center justify-center text-white text-xs transition-all duration-200 hover:scale-110 shadow-lg backdrop-blur-sm"
                      title="가격 수정"
                    >
                      💰
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setCurrentItem(item)
                      }}
                      className="w-7 h-7 bg-green-500/90 hover:bg-green-600 rounded-full flex items-center justify-center text-white text-xs transition-all duration-200 hover:scale-110 shadow-lg backdrop-blur-sm"
                      title="편집"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        deleteItem(item.id, item.name)
                      }}
                      className="w-7 h-7 bg-red-500/90 hover:bg-red-600 rounded-full flex items-center justify-center text-white text-xs transition-all duration-200 hover:scale-110 shadow-lg backdrop-blur-sm"
                      title="삭제"
                    >
                      🗑️
                    </button>
                    </div>
                  {/* 클릭 가능한 카드 영역 */}
                  <div 
                    onClick={() => setCurrentItem(item)}
                    className="cursor-pointer"
                  >
                    {/* 아이템 이미지 */}
                    {item.imagePath ? (
                      <img
                        src={item.imagePath}
                        alt={item.name}
                        className="w-full h-24 object-contain bg-white/5 rounded mb-2"
                      />
                    ) : (
                      <div className="w-full h-24 bg-white/5 rounded mb-2 flex items-center justify-center">
                        <div className="text-white/40">📦</div>
                      </div>
                    )}
                    
                    {/* 아이템 정보 */}
                    <div className="text-center">
                      <h3 className="text-sm font-medium text-white truncate mb-1">{item.name}</h3>
                      <p className="text-xs text-white/60 mb-2">복셀: {item.voxelData?.length || 0}개</p>
                      <p className="text-xs text-green-400">{item.price.toLocaleString()}원</p>
                    </div>
                    </div>
                  </div>
                ))}
              
              {(!registeredItems || registeredItems.length === 0) && (
                <div className="col-span-full text-center py-12">
                  <div className="text-white/40 text-lg mb-2">📦</div>
                  <p className="text-white/60">아직 등록된 아이템이 없습니다</p>
                  <p className="text-white/40 text-sm mt-1">상단의 "새 아이템 만들기" 버튼으로 첫 아이템을 만들어보세요</p>
              </div>
              )}
              </div>
          </>
        ) : (
          /* 아이템 편집 화면 */
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
            
            {/* 이미지 선택 패널 */}
            <div className="xl:col-span-1">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 mb-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-white">📸 아이템 설정</h2>
                  <button
                    onClick={() => setCurrentItem(null)}
                    className="text-white/60 hover:text-white transition-colors"
                  >
                    ← 목록으로
              </button>
            </div>

              {currentItem && (
                <>
                  <div className="mb-4">
                    <input
                      type="file"
                      ref={fileInputRef}
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                      <button
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      📁 이미지 업로드
                    </button>
                  </div>
                  
                  {currentItem.imagePath && (
                    <div className="mb-4 p-3 bg-white/5 rounded-lg">
                      <img 
                        src={currentItem.imagePath} 
                        alt={currentItem.name}
                        className="w-full h-32 object-contain bg-white/10 rounded"
                      />
                      <div className="text-xs text-white/60 mt-2">선택된 이미지</div>
                      <div className="text-xs text-green-400 mt-1">✓ 20×20 그리드 배경으로 표시됩니다</div>
                      
                      {/* 이미지 크기 조절 슬라이더 */}
                      <div className="mt-3">
                        <label className="text-xs text-white/80 mb-1 block">
                          이미지 크기: {(currentItem.imageScale * 100).toFixed(0)}%
                        </label>
                        <input
                          type="range"
                          min="0.1"
                          max="3.0"
                          step="0.1"
                          value={currentItem.imageScale || 1.0}
                          onChange={(e) => setCurrentItem({
                            ...currentItem,
                            imageScale: parseFloat(e.target.value),
                            updatedAt: new Date().toISOString()
                          })}
                          className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer"
                          style={{
                            background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${((currentItem.imageScale - 0.1) / 2.9) * 100}%, rgba(255,255,255,0.2) ${((currentItem.imageScale - 0.1) / 2.9) * 100}%, rgba(255,255,255,0.2) 100%)`
                          }}
                        />
                        <div className="flex justify-between text-xs text-white/40 mt-1">
                          <span>10%</span>
                          <span>100%</span>
                          <span>300%</span>
                            </div>
                          </div>

                      {/* 이미지 위치 조절 슬라이더 */}
                      <div className="mt-4">
                        <label className="text-xs text-white/80 mb-2 block">
                          이미지 위치 조절
                        </label>
                        
                        {/* X축 위치 조절 */}
                        <div className="mb-3">
                          <label className="text-xs text-white/60 mb-1 block">
                            가로 위치: {(currentItem.imageOffset?.x || 0).toFixed(0)}px
                          </label>
                          <input
                            type="range"
                            min="-200"
                            max="200"
                            step="5"
                            value={currentItem.imageOffset?.x || 0}
                            onChange={(e) => setCurrentItem({
                              ...currentItem,
                              imageOffset: {
                                ...currentItem.imageOffset,
                                x: parseInt(e.target.value)
                              },
                              updatedAt: new Date().toISOString()
                            })}
                            className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer"
                          />
                          <div className="flex justify-between text-xs text-white/40 mt-1">
                            <span>←200</span>
                            <span>중앙</span>
                            <span>200→</span>
                        </div>
            </div>

                        {/* Y축 위치 조절 */}
                          <div>
                          <label className="text-xs text-white/60 mb-1 block">
                            세로 위치: {(currentItem.imageOffset?.y || 0).toFixed(0)}px
                          </label>
                          <input
                            type="range"
                            min="-200"
                            max="200"
                            step="5"
                            value={currentItem.imageOffset?.y || 0}
                            onChange={(e) => setCurrentItem({
                              ...currentItem,
                              imageOffset: {
                                ...currentItem.imageOffset,
                                y: parseInt(e.target.value)
                              },
                              updatedAt: new Date().toISOString()
                            })}
                            className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer"
                          />
                          <div className="flex justify-between text-xs text-white/40 mt-1">
                            <span>↑200</span>
                            <span>중앙</span>
                            <span>200↓</span>
                </div>
              </div>
                        
                        {/* 위치 리셋 버튼 */}
                    <button
                          onClick={() => setCurrentItem({
                            ...currentItem,
                            imageOffset: { x: 0, y: 0 },
                            updatedAt: new Date().toISOString()
                          })}
                          className="mt-2 px-3 py-1 bg-white/10 hover:bg-white/20 text-xs text-white/80 rounded transition-colors"
                        >
                          🎯 중앙으로 리셋
                    </button>
                </div>
                </div>
            )}

                  <div className="text-xs text-white/50 italic">
                    💡 이미지를 업로드하면 20×20 그리드 배경으로 표시되어 메인 캔버스와 동일한 복셀 배치가 가능합니다.
              </div>
                </>
            )}
          </div>

            {/* 복셀 타입 선택 제거 - 단일 타입만 사용 */}
          </div>

          {/* 3D 복셀 에디터 */}
          <div className="xl:col-span-2">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-white">
                  🎯 복셀 배치 에디터
                  {currentItem && (
                    <span className="text-sm text-white/60 ml-2">
                      - {currentLayer + 1}층 / {currentItem.dimensions.depth}층
                    </span>
                  )}
                </h2>
                
                {currentItem && (
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
                  >
                    🔄 리셋
                  </button>
                )}
              </div>

              {currentItem && (
                <>
                <div 
                  ref={canvasRef}
                    className="border border-white/20 rounded-lg overflow-hidden bg-slate-700 mb-4"
                    style={{ width: '100%', maxWidth: '800px', height: '500px' }}
                  />
                  
                  {/* 레이어 선택 */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {Array.from({ length: currentItem.dimensions.depth }, (_, i) => (
                      <button
                        key={i}
                        onClick={() => setCurrentLayer(i)}
                        className={`px-4 py-2 rounded-lg transition-colors ${
                          currentLayer === i
                            ? 'bg-blue-500 text-white'
                            : 'bg-white/10 text-white/80 hover:bg-white/20'
                        }`}
                      >
                        {i + 1}층
                      </button>
                    ))}
                  </div>
                  
                  <div className="text-sm text-white/60">
                    <div className="mb-1">현재 층: {currentLayer + 1}층, 복셀 수: {currentItem.voxelData.filter(v => v.z === currentLayer).length}개</div>
                    <div className="text-xs text-white/50 flex items-center gap-4">
                      <span className="flex items-center gap-1">
                        🟢 <span className="text-green-400">현재 레이어</span>
                      </span>
                      <span className="flex items-center gap-1">
                        🔴 <span className="text-red-400">다른 레이어 (연하게)</span>
                      </span>
                </div>
                </div>
                </>
              )}
            </div>
          </div>

          {/* 설정 및 미리보기 패널 */}
          <div className="xl:col-span-1">
            {currentItem && (
              <>
                {/* 아이템 설정 */}
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 mb-4">
                  <h3 className="text-lg font-bold text-white mb-3">⚙️ 아이템 설정</h3>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm text-white/80">이름</label>
                      <input
                        type="text"
                        value={currentItem.name}
                        onChange={(e) => setCurrentItem({...currentItem, name: e.target.value, updatedAt: new Date().toISOString()})}
                        className="w-full p-2 bg-white/10 border border-white/20 rounded text-white"
                      />
                </div>
                    
                    {/* 설명 필드 제거 - 불필요한 입력 줄이기 */}
                    
                    <div>
                      <label className="text-sm text-white/80">카테고리</label>
                      <select
                        value={currentItem.category}
                        onChange={(e) => setCurrentItem({...currentItem, category: e.target.value as any, updatedAt: new Date().toISOString()})}
                        className="w-full p-2 bg-white/10 border border-white/20 rounded text-white"
                      >
                        <option value="가구">🪑 가구</option>
                        <option value="장식품">🎨 장식품</option>
                        <option value="운송수단">🚗 운송수단</option>
                      </select>
              </div>
                    
                    <div>
                      <label className="text-sm text-white/80">가격</label>
                      <input
                        type="number"
                        value={currentItem.price}
                        onChange={(e) => setCurrentItem({...currentItem, price: parseInt(e.target.value) || 0, updatedAt: new Date().toISOString()})}
                        className="w-full p-2 bg-white/10 border border-white/20 rounded text-white"
                      />
                    </div>
                    
                    
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="text-xs text-white/80">가로 (고정)</label>
                        <input
                          type="number"
                          value={22}
                          disabled
                          className="w-full p-1 bg-white/5 border border-white/10 rounded text-white/50 text-sm"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-white/80">세로 (고정)</label>
                        <input
                          type="number"
                          value={22}
                          disabled
                          className="w-full p-1 bg-white/5 border border-white/10 rounded text-white/50 text-sm"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-white/80">높이 (층수)</label>
                        <input
                          type="number"
                          min="1"
                          max="10"
                          value={currentItem.dimensions.depth}
                          onChange={(e) => setCurrentItem({
                            ...currentItem,
                            dimensions: {...currentItem.dimensions, depth: parseInt(e.target.value) || 1},
                            updatedAt: new Date().toISOString()
                          })}
                          className="w-full p-1 bg-white/10 border border-white/20 rounded text-white text-sm"
                        />
                </div>
              </div>
            </div>
          </div>

                {/* 미리보기 */}
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                  <h3 className="text-lg font-bold text-white mb-3">👁️ 미리보기</h3>
                  
                  {currentItem.imagePath && (
                    <div className="mb-4">
                      <img 
                        src={currentItem.imagePath} 
                        alt={currentItem.name}
                        className="w-full h-32 object-contain bg-white/10 rounded"
                      />
        </div>
                  )}
                  
                  <div className="text-sm text-white/80 space-y-1">
                    <div><strong>이름:</strong> {currentItem.name}</div>
                    <div><strong>그리드:</strong> 20×20 (메인 캔버스와 동일)</div>
                    <div><strong>이미지 크기:</strong> {(currentItem.imageScale * 100).toFixed(0)}%</div>
                    <div><strong>이미지 위치:</strong> ({currentItem.imageOffset?.x || 0}, {currentItem.imageOffset?.y || 0})px</div>
                    <div><strong>층수:</strong> {currentItem.dimensions.depth}층</div>
                    <div><strong>복셀:</strong> {currentItem.voxelData.length}개</div>
                    <div><strong>가격:</strong> {currentItem.price.toLocaleString()}원</div>
                  </div>
                </div>
              </>
            )}
          </div>

            {/* 아이템 저장 버튼 */}
            <div className="mt-6 flex justify-center">
              <button
                onClick={saveItemToShop}
                disabled={!currentItem?.imagePath || currentItem?.voxelData.length === 0 || isLoading}
                className="px-8 py-4 bg-gradient-to-r from-green-600 to-blue-600 text-white font-bold text-lg rounded-xl hover:from-green-700 hover:to-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? '등록 중...' : '🏪 아이템 등록하기'}
              </button>
            </div>
        </div>
        )}
      </div>
    </div>
  )
}

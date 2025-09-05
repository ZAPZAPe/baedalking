'use client'

import React, { useState, useRef, useCallback, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

// PixiJS 동적 import
let PIXI: any = null

async function loadPixi() {
  if (!PIXI) {
    PIXI = await import('pixi.js')
  }
  return PIXI
}

// 그리드 설정 (item-editor와 동일)
const DEFAULT_GRID_CONFIG = {
  rows: 80,
  cols: 80,
  tileWidth: 20,
  tileHeight: 10,
  maxHeight: 10
}

// 그리드 좌표 변환 (item-editor와 동일)
function gridToIso(x: number, y: number, z: number, config: any = DEFAULT_GRID_CONFIG) {
  return {
    x: (x - y) * (config.tileWidth / 2),
    y: (x + y) * (config.tileHeight / 2) - z * config.tileHeight
  }
}

export default function DefaultCharacterSetupPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  
  // Refs
  const canvasRef = useRef<HTMLDivElement>(null)
  const pixiAppRef = useRef<any>(null)
  const pixiContainersRef = useRef<any>(null)
  
  // State
  const [isCanvasReady, setIsCanvasReady] = useState(false)
  const [defaultCharacter, setDefaultCharacter] = useState({
    name: '기본 캐릭터',
    description: '모든 사용자가 사용하는 기본 픽셀 아트 캐릭터입니다. 다른 아이템들이 레이어로 쌓이는 베이스 캐릭터입니다. 레이어 순서: 캐릭터(베이스) → 하의 → 상의 → 헤어',
    imageUrl: '/assets/character/default-character.png',
    pixelData: []
  })
  const [selectedPixels, setSelectedPixels] = useState(new Set<string>())
  const [isSelectingPixels, setIsSelectingPixels] = useState(false)
  const [showGrid, setShowGrid] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // 캔버스 초기화
  const initializeCanvas = useCallback(async () => {
    if (!canvasRef.current || isCanvasReady) return

    try {
      console.log('🎮 PixiJS 초기화 시작')
      
      const PixiJS = await loadPixi()
      
      const app = new PixiJS.Application()
      await app.init({
        width: 800,
        height: 500,
        backgroundColor: 0x0a0a2a,
        antialias: true,
        resolution: window.devicePixelRatio || 1,
        autoDensity: true
      })

      const canvas = app.canvas as HTMLCanvasElement
      canvas.style.width = '100%'
      canvas.style.height = '100%'
      canvas.style.display = 'block'
      
      canvasRef.current.appendChild(canvas)

      // 컨테이너 구조 생성 (item-editor와 동일)
      const main = new PixiJS.Container()
      const grid = new PixiJS.Container()
      const items = new PixiJS.Container()
      const preview = new PixiJS.Container()
      const ui = new PixiJS.Container()

      // 컨테이너 계층 구조 설정 (item-editor와 동일)
      main.addChild(grid)
      main.addChild(items)
      main.addChild(preview)
      main.addChild(ui)

      // Z-index 정렬 활성화 (item-editor와 동일)
      items.sortableChildren = true
      preview.sortableChildren = true

      app.stage.addChild(main)

      // 자동 스케일링 설정 (item-editor와 동일)
      const scale = 0.6
      main.scale.set(scale)
      main.x = 400  // 800/2
      main.y = 250  // 500/2

      const containers = { main, grid, items, preview, ui }
      pixiAppRef.current = app
      pixiContainersRef.current = containers
      setIsCanvasReady(true)
      
      console.log('✅ PixiJS 초기화 완료')
      
      // 초기화 완료 후 그리드 렌더링
      setTimeout(async () => {
        await renderGrid()
      }, 100)
      
    } catch (error) {
      console.error('❌ PixiJS 초기화 실패:', error)
    }
  }, [isCanvasReady])

  // 🎨 이미지 크기에 맞는 동적 그리드 렌더링 (item-editor와 동일)
  const renderGrid = useCallback(() => {
    if (!pixiContainersRef.current) return
    if (!PIXI) return

    const { grid } = pixiContainersRef.current
    grid.removeChildren()

    if (!showGrid) return

    // 복셀과 동일한 크기 사용
    const tileWidth = DEFAULT_GRID_CONFIG.tileWidth  // 20
    const tileHeight = DEFAULT_GRID_CONFIG.tileHeight // 10

    // 3D 그리드 라인 표시 (복셀 선택용) - 항상 표시
    const gridGraphics = new PIXI.Graphics()

    // 이미지가 있으면 이미지 크기에 맞게, 없으면 기본 크기
    if (defaultCharacter.imageUrl) {
      // 이미지가 있을 때는 기본 크기 그리드
      const gridSize = 10
      
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
  }, [defaultCharacter.imageUrl, showGrid])

  // 이미지 렌더링 (item-editor와 동일)
  const renderImage = useCallback(async () => {
    if (!pixiContainersRef.current || !defaultCharacter.imageUrl) return
    if (!PIXI) return

    const { preview } = pixiContainersRef.current
    preview.removeChildren()

    try {
      // 이미지 텍스처 로드
      const texture = await PIXI.Assets.load(defaultCharacter.imageUrl)
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
    } catch (error) {
      console.error('이미지 렌더링 실패:', error)
    }
  }, [defaultCharacter.imageUrl])

  // 픽셀 렌더링 (item-editor와 동일한 3D 복셀 스타일)
  const renderPixels = useCallback(() => {
    if (!pixiContainersRef.current) return
    if (!PIXI) return

    const { items } = pixiContainersRef.current
    items.removeChildren()

    // 복셀과 동일한 크기 사용
    const tileWidth = DEFAULT_GRID_CONFIG.tileWidth  // 20
    const tileHeight = DEFAULT_GRID_CONFIG.tileHeight // 10

    selectedPixels.forEach(pixelKey => {
      const [x, y] = pixelKey.split(',').map(Number)
      const z = 0  // 기본 레이어

      // 🎯 3D 복셀로 렌더링 (item-editor와 동일)
      const voxelGraphics = new PIXI.Graphics()
      
      // 선택한 그리드 위치의 정확히 그 z 높이에 배치
      const basePos = gridToIso(x, y, z, { ...DEFAULT_GRID_CONFIG, tileWidth, tileHeight })
      
      // 레이어별 색상 (item-editor와 동일)
      const colors = [0xff6b6b, 0x4ecdc4, 0x45b7d1, 0x96ceb4, 0xffeaa7, 0xdda0dd, 0xf0a500, 0xff9999]
      const voxelColor = colors[z % colors.length]
      
      // 🧊 3D 정육면체 그리기 (아이소메트릭) - item-editor와 완전 동일
      const alpha = 0.9
      const strokeAlpha = 1.0
      const voxelHeight = tileHeight
      
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
      voxelGraphics.zIndex = z * 1000 + y * 10 + x

      items.addChild(voxelGraphics)
    })
  }, [selectedPixels])

  // 마우스 이벤트 설정
  const setupCanvasEvents = useCallback(() => {
    if (!pixiAppRef.current || !isSelectingPixels) return

    const app = pixiAppRef.current
    const { main } = pixiContainersRef.current

    const handleClick = (event: any) => {
      const rect = app.canvas.getBoundingClientRect()
      const x = event.clientX - rect.left
      const y = event.clientY - rect.top

      // 월드 좌표로 변환
      const worldPos = main.toLocal({ x, y })
      
      // 그리드 좌표로 변환 (item-editor와 동일한 역변환)
      const tileWidth = DEFAULT_GRID_CONFIG.tileWidth
      const tileHeight = DEFAULT_GRID_CONFIG.tileHeight
      const gridX = Math.round(worldPos.x / tileWidth + worldPos.y / tileHeight)
      const gridY = Math.round(worldPos.y / tileHeight - worldPos.x / tileWidth)
      
      const pixelKey = `${gridX},${gridY}`
      
      setSelectedPixels(prev => {
        const newSet = new Set(prev)
        if (newSet.has(pixelKey)) {
          newSet.delete(pixelKey)
        } else {
          newSet.add(pixelKey)
        }
        return newSet
      })
    }

    app.canvas.addEventListener('click', handleClick)
    
    return () => {
      app.canvas.removeEventListener('click', handleClick)
    }
  }, [isSelectingPixels])

  // 이미지 업로드
  const handleImageUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      const imageUrl = e.target?.result as string
      setDefaultCharacter(prev => ({ ...prev, imageUrl }))
    }
    reader.readAsDataURL(file)
  }, [])

  // 저장
  const handleSave = useCallback(async () => {
    if (!defaultCharacter.name || !defaultCharacter.imageUrl) {
      alert('이름과 이미지를 모두 입력해주세요.')
      return
    }

    setIsSubmitting(true)
    try {
      const pixelData = Array.from(selectedPixels).map(pixelKey => {
        const [x, y] = pixelKey.split(',').map(Number)
        return { x, y, occupied: true }
      })

      const { error } = await supabase
        .from('default_character_setups')
        .upsert({
          name: defaultCharacter.name,
          description: defaultCharacter.description,
          image_url: defaultCharacter.imageUrl,
          pixel_data: pixelData
        })

      if (error) throw error

      alert('기본 캐릭터 설정이 저장되었습니다!')
    } catch (error) {
      console.error('저장 실패:', error)
      alert('저장에 실패했습니다.')
    } finally {
      setIsSubmitting(false)
    }
  }, [defaultCharacter, selectedPixels])

  // 초기화
  useEffect(() => {
    if (!loading && user && !isCanvasReady) {
      initializeCanvas()
    }
  }, [loading, user, isCanvasReady, initializeCanvas])

  // 그리드 렌더링
  useEffect(() => {
    if (isCanvasReady) {
      renderGrid()
    }
  }, [isCanvasReady, renderGrid])

  // 이미지 렌더링
  useEffect(() => {
    if (isCanvasReady && defaultCharacter.imageUrl) {
      renderImage()
    }
  }, [isCanvasReady, defaultCharacter.imageUrl, renderImage])

  // 픽셀 렌더링
  useEffect(() => {
    if (isCanvasReady) {
      renderPixels()
    }
  }, [isCanvasReady, renderPixels])

  // 마우스 이벤트
  useEffect(() => {
    if (isCanvasReady) {
      const cleanup = setupCanvasEvents()
      return cleanup
    }
  }, [isCanvasReady, setupCanvasEvents])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-white/60">로딩 중...</div>
        </div>
      </div>
    )
  }

  if (!user) {
    router.push('/login')
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">👤 기본 캐릭터 설정</h1>
          <p className="text-white/60">모든 사용자가 사용할 기본 캐릭터를 설정합니다</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 캔버스 영역 */}
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <h3 className="text-lg font-bold mb-4 text-white">🎨 캐릭터 편집 캔버스</h3>
            
            <div className="bg-black/20 rounded-lg p-4 mb-4">
              <div 
                ref={canvasRef}
                className="w-full bg-gradient-to-br from-blue-900/20 via-purple-900/20 to-pink-900/20 rounded-lg border border-white/30 relative"
                style={{ height: '500px' }}
              >
                {!isCanvasReady && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-6xl mb-4">🎮</div>
                      <div className="text-xl">PixiJS 초기화 중...</div>
                      <div className="text-sm text-white/60 mt-2">기본 캐릭터 설정 엔진</div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 캔버스 컨트롤 */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex gap-2">
                  <button
                    onClick={() => setIsSelectingPixels(!isSelectingPixels)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      isSelectingPixels
                        ? 'bg-red-500 text-white shadow-lg'
                        : 'bg-white/10 text-white/60 hover:bg-white/20'
                    }`}
                  >
                    {isSelectingPixels ? '픽셀 선택 중' : '픽셀 선택'}
                  </button>
                  <button
                    onClick={() => setShowGrid(!showGrid)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      showGrid
                        ? 'bg-blue-500 text-white shadow-lg'
                        : 'bg-white/10 text-white/60 hover:bg-white/20'
                    }`}
                  >
                    {showGrid ? '그리드 숨김' : '그리드 표시'}
                  </button>
                  <button
                    onClick={() => setSelectedPixels(new Set())}
                    className="px-4 py-2 rounded-lg text-sm font-medium bg-white/10 text-white/60 hover:bg-white/20 transition-all"
                  >
                    전체 선택 해제
                  </button>
                </div>
                <div className="text-white/60 text-sm">
                  선택된 픽셀: {selectedPixels.size}개
                </div>
              </div>
              
              {isSelectingPixels && (
                <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-lg p-3">
                  <div className="text-yellow-400 text-sm">
                    💡 캔버스를 클릭하여 픽셀을 선택하세요. 다시 클릭하면 선택 해제됩니다.
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 설정 패널 */}
          <div className="space-y-6">
            {/* 기본 정보 */}
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <h3 className="text-lg font-bold mb-4 text-white">📝 기본 정보</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-white/80 text-sm mb-2">캐릭터 이름</label>
                  <input
                    type="text"
                    value={defaultCharacter.name}
                    onChange={(e) => setDefaultCharacter(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="기본 캐릭터 이름을 입력하세요"
                  />
                </div>
                
                <div>
                  <label className="block text-white/80 text-sm mb-2">설명</label>
                  <textarea
                    value={defaultCharacter.description}
                    onChange={(e) => setDefaultCharacter(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="캐릭터에 대한 설명을 입력하세요"
                    rows={3}
                  />
                </div>
              </div>
            </div>

            {/* 이미지 업로드 */}
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <h3 className="text-lg font-bold mb-4 text-white">🖼️ 이미지 업로드</h3>
              
              <div className="space-y-4">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-500 file:text-white hover:file:bg-blue-600"
                />
                
                {defaultCharacter.imageUrl && (
                  <div className="mt-4">
                    <img
                      src={defaultCharacter.imageUrl}
                      alt="업로드된 이미지"
                      className="w-full h-48 object-contain bg-white/5 rounded-lg border border-white/20"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* 저장 버튼 */}
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <button
                onClick={handleSave}
                disabled={isSubmitting || !defaultCharacter.name || !defaultCharacter.imageUrl}
                className="w-full px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold rounded-lg hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {isSubmitting ? '저장 중...' : '💾 기본 캐릭터 저장'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
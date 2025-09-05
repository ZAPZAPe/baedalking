'use client'

import React, { useState, useRef, useCallback, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

// 기본 캐릭터 픽셀 레이아웃 타입 정의
interface CharacterPixelLayout {
  id: string
  userId: string
  itemId: string
  pixelData: {
    x: number
    y: number
    occupied: boolean
  }[]
  createdAt?: string
  updatedAt?: string
  shop_items?: {
    name: string
  }
}

interface CharacterItem {
  id: string
  name: string
  category: string
  imageUrl: string
}

// PixiJS 동적 import
let PIXI: any = null

async function loadPixi() {
  if (!PIXI) {
    PIXI = await import('pixi.js')
  }
  return PIXI
}

export default function CharacterPixelEditorPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  // 파일 입력 참조
  const fileInputRef = useRef<HTMLInputElement>(null)
  const canvasRef = useRef<HTMLDivElement>(null)

  // PixiJS 관리
  const pixiAppRef = useRef<any>(null)
  const pixiContainersRef = useRef<any>(null)
  const [isCanvasReady, setIsCanvasReady] = useState(false)

  // 편집 중인 레이아웃 상태
  const [editingLayout, setEditingLayout] = useState<CharacterPixelLayout>({
    id: '',
    userId: '',
    itemId: '',
    pixelData: []
  })

  // 픽셀 배치 상태
  const [selectedPixels, setSelectedPixels] = useState<Set<string>>(new Set())
  const [isSelectingPixels, setIsSelectingPixels] = useState(false)
  const [showGrid, setShowGrid] = useState(true)

  // UI 상태
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [imageNaturalSize, setImageNaturalSize] = useState<{ width: number; height: number } | null>(null)
  
  // 아이템 관리
  const [availableItems, setAvailableItems] = useState<CharacterItem[]>([])
  const [selectedItem, setSelectedItem] = useState<CharacterItem | null>(null)
  const [existingLayouts, setExistingLayouts] = useState<CharacterPixelLayout[]>([])

  // 🎮 PixiJS 캔버스 초기화
  const initializeCanvas = useCallback(async () => {
    if (!canvasRef.current || isCanvasReady) return

    try {
      const PixiJS = await loadPixi()
      
      const app = new PixiJS.Application()
      await app.init({
        width: 400,
        height: 400,
        backgroundColor: 0x0a0a2a,
        antialias: true,
        resolution: window.devicePixelRatio || 1,
        autoDensity: true
      })

      const canvas = app.canvas as HTMLCanvasElement
      canvas.style.border = 'none'
      canvas.style.outline = 'none'
      canvas.style.display = 'block'
      canvas.style.width = '100%'
      canvas.style.height = 'auto'
      canvas.style.maxWidth = '400px'
      canvas.style.maxHeight = '400px'
      canvasRef.current.appendChild(canvas)

      // 컨테이너 구조 생성
      const main = new PixiJS.Container()
      const grid = new PixiJS.Container()
      const items = new PixiJS.Container()
      const preview = new PixiJS.Container()
      const ui = new PixiJS.Container()

      main.addChild(grid)
      main.addChild(items)
      main.addChild(preview)
      main.addChild(ui)

      items.sortableChildren = true
      preview.sortableChildren = true

      app.stage.addChild(main)

      const containers = { main, grid, items, preview, ui }

      // 스케일링 설정
      const scale = 0.8
      main.scale.set(scale)
      main.x = 200
      main.y = 200

      pixiAppRef.current = app
      pixiContainersRef.current = containers

      setIsCanvasReady(true)
      
      setTimeout(() => {
        renderGrid()
        setupCanvasEvents()
      }, 100)
    } catch (error) {
      console.error('❌ PixiJS 초기화 실패:', error)
    }
  }, [])

  // 🎨 그리드 렌더링
  const renderGrid = useCallback(() => {
    if (!pixiContainersRef.current || !PIXI) return

    const { grid } = pixiContainersRef.current
    grid.removeChildren()

    const tileWidth = 20
    const tileHeight = 10

    const gridGraphics = new PIXI.Graphics()
    
    const gridSize = 16
    
    // 그리드 라인 표시
    gridGraphics.setStrokeStyle({ width: 1, color: 0x666666, alpha: 0.3 })
    
    for (let y = -gridSize; y <= gridSize; y += 2) {
      const start = { x: (-gridSize - y) * (tileWidth / 2), y: (-gridSize + y) * (tileHeight / 2) }
      const end = { x: (gridSize - y) * (tileWidth / 2), y: (gridSize + y) * (tileHeight / 2) }
      gridGraphics.moveTo(start.x, start.y).lineTo(end.x, end.y)
    }
    for (let x = -gridSize; x <= gridSize; x += 2) {
      const start = { x: (x - gridSize) * (tileWidth / 2), y: (x + gridSize) * (tileHeight / 2) }
      const end = { x: (x + gridSize) * (tileWidth / 2), y: (x - gridSize) * (tileHeight / 2) }
      gridGraphics.moveTo(start.x, start.y).lineTo(end.x, end.y)
    }
    gridGraphics.stroke()

    grid.addChild(gridGraphics)
  }, [])

  // 🖱️ 캔버스 이벤트 설정
  const setupCanvasEvents = useCallback(() => {
    if (!pixiAppRef.current) return

    const canvas = pixiAppRef.current.canvas as HTMLCanvasElement

    const getPixelFromMouse = (event: MouseEvent) => {
      const rect = canvas.getBoundingClientRect()
      const mouseX = event.clientX - rect.left
      const mouseY = event.clientY - rect.top

      const displayWidth = rect.width
      const displayHeight = rect.height
      
      const pixiWidth = pixiAppRef.current.screen.width
      const pixiHeight = pixiAppRef.current.screen.height
      
      const pixiMouseX = (mouseX / displayWidth) * pixiWidth
      const pixiMouseY = (mouseY / displayHeight) * pixiHeight

      const mainContainer = pixiContainersRef.current.main
      const mainScale = mainContainer.scale.x
      const mainOffsetX = mainContainer.x
      const mainOffsetY = mainContainer.y
      
      const localX = (pixiMouseX - mainOffsetX) / mainScale
      const localY = (pixiMouseY - mainOffsetY) / mainScale

      const tileWidth = 20
      const tileHeight = 10
      
      const gridX = Math.round((localX / (tileWidth / 2) + localY / (tileHeight / 2)) / 2)
      const gridY = Math.round((localY / (tileHeight / 2) - localX / (tileWidth / 2)) / 2)

      const gridSize = 16
      if (gridX < -gridSize || gridX >= gridSize || gridY < -gridSize || gridY >= gridSize) {
        return null
      }

      const pixelKey = `${gridX},${gridY}`
      return pixelKey
    }

    const handleCanvasClick = (event: MouseEvent) => {
      if (!isSelectingPixels || !selectedItem) return

      const pixelKey = getPixelFromMouse(event)
      if (!pixelKey) return

      setSelectedPixels(prevPixels => {
        const newSet = new Set(prevPixels)
        const wasSelected = newSet.has(pixelKey)
        
        if (wasSelected) {
          newSet.delete(pixelKey)
        } else {
          newSet.add(pixelKey)
        }
        
        return newSet
      })
    }

    canvas.addEventListener('click', handleCanvasClick)

    return () => {
      canvas.removeEventListener('click', handleCanvasClick)
    }
  }, [isSelectingPixels, selectedItem])

  // 🖼️ 아이템 미리보기 렌더링
  const renderItemPreview = useCallback(async () => {
    if (!pixiContainersRef.current || !PIXI || !selectedItem) return

    const { preview } = pixiContainersRef.current
    preview.removeChildren()

    try {
      const texture = await PIXI.Assets.load(selectedItem.imageUrl)
      const sprite = new PIXI.Sprite(texture)

      sprite.anchor.set(0.5, 0.5)
      sprite.x = 0
      sprite.y = 0
      sprite.alpha = 0.8
      sprite.scale.set(1.0, 1.0)
      sprite.zIndex = 0

      preview.addChild(sprite)
      renderSelectedPixels()

    } catch (error) {
      console.error('이미지 렌더링 실패:', error)
    }
  }, [selectedItem])

  // 🧊 선택된 픽셀들을 시각화
  const renderSelectedPixels = useCallback(() => {
    if (!pixiContainersRef.current || !PIXI) return

    const { ui } = pixiContainersRef.current
    ui.removeChildren()

    const tileWidth = 20
    const tileHeight = 10

    Array.from(selectedPixels).forEach(pixelKey => {
      const [gridX, gridY] = pixelKey.split(',').map(Number)

      const pixelGraphics = new PIXI.Graphics()
      
      const basePos = {
        x: (gridX - gridY) * (tileWidth / 2),
        y: (gridX + gridY) * (tileHeight / 2)
      }
      
      pixelGraphics
        .setFillStyle({ color: 0xff6b6b, alpha: 0.8 })
        .setStrokeStyle({ width: 1, color: 0x000000, alpha: 1.0 })
        .rect(-tileWidth/2, -tileHeight/2, tileWidth, tileHeight)
        .fill()
        .stroke()

      pixelGraphics.x = basePos.x
      pixelGraphics.y = basePos.y
      pixelGraphics.zIndex = gridY * 10 + gridX

      ui.addChild(pixelGraphics)
    })
  }, [selectedPixels])

  // 🔄 데이터 로드 함수들
  const loadAvailableItems = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('shop_items')
        .select('*')
        .eq('is_active', true)
        .eq('main_category', 'character')
        .order('sub_category', { ascending: true })
        .order('name', { ascending: true })

      if (error) {
        console.error('아이템 로드 실패:', error)
        return
      }

      setAvailableItems((data || []).map(item => ({
        id: item.id,
        name: item.name,
        category: item.sub_category || 'hair',
        imageUrl: item.image_url
      })))
    } catch (error) {
      console.error('아이템 로드 실패:', error)
    }
  }, [])

  const loadExistingLayouts = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('character_pixel_layouts')
        .select(`
          *,
          shop_items (
            id,
            name,
            sub_category,
            image_url
          )
        `)
        .order('updated_at', { ascending: false })

      if (error) {
        console.error('레이아웃 로드 실패:', error)
        return
      }

      setExistingLayouts(data || [])
    } catch (error) {
      console.error('레이아웃 로드 실패:', error)
    }
  }, [])

  // 새 레이아웃 생성 모드로 전환
  const startNewLayout = useCallback(() => {
    setEditingLayout({
      id: '',
      userId: user?.id || '',
      itemId: '',
      pixelData: []
    })
    setSelectedPixels(new Set())
    setSelectedItem(null)
  }, [user])

  // 💾 레이아웃 저장
  const handleSave = useCallback(async () => {
    if (!selectedItem || selectedPixels.size === 0) {
      alert('아이템을 선택하고 픽셀을 배치해주세요.')
      return
    }

    setIsSubmitting(true)

    try {
      const pixelData = Array.from(selectedPixels).map(pixelKey => {
        const [x, y] = pixelKey.split(',').map(Number)
        return { x, y, occupied: true }
      })

      const layoutData = {
        user_id: user?.id,
        item_id: selectedItem.id,
        pixel_data: pixelData
      }

      if (editingLayout.id) {
        // 기존 레이아웃 수정
        const { error } = await supabase
          .from('character_pixel_layouts')
          .update(layoutData)
          .eq('id', editingLayout.id)

        if (error) throw error

        alert(`✅ "${selectedItem.name}" 레이아웃이 성공적으로 수정되었습니다!`)
      } else {
        // 새 레이아웃 추가
        const { error } = await supabase
          .from('character_pixel_layouts')
          .insert([layoutData])

        if (error) throw error

        alert(`✅ "${selectedItem.name}" 레이아웃이 성공적으로 등록되었습니다!`)
      }
      
      await loadExistingLayouts()
      startNewLayout()

    } catch (error) {
      console.error('레이아웃 저장 실패:', error)
      alert(`레이아웃 저장 중 오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`)
    } finally {
      setIsSubmitting(false)
    }
  }, [editingLayout.id, selectedItem, selectedPixels, user, startNewLayout, loadExistingLayouts])

  // 기존 레이아웃 선택 시 데이터 로드
  const loadExistingLayout = useCallback((layout: CharacterPixelLayout) => {
    setEditingLayout(layout)
    
    // 픽셀 데이터 복원
    if (layout.pixelData) {
      const pixelSet = new Set<string>()
      layout.pixelData.forEach(pixel => {
        pixelSet.add(`${pixel.x},${pixel.y}`)
      })
      setSelectedPixels(pixelSet)
    }
    
    // 해당 아이템 찾기
    const item = availableItems.find(item => item.id === layout.itemId)
    setSelectedItem(item || null)
  }, [availableItems])

  // 🎮 초기화 및 이벤트 설정
  useEffect(() => {
    const initializeEditor = async () => {
      if (!loading && user) {
        try {
          console.log('에디터 초기화 시작...')
          await initializeCanvas()
          await loadAvailableItems()
          await loadExistingLayouts()
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
  }, [user, loading, router, initializeCanvas, loadAvailableItems, loadExistingLayouts])

  // 🎨 그리드 렌더링
  useEffect(() => {
    if (isCanvasReady) {
      renderGrid()
    }
  }, [isCanvasReady, renderGrid])

  // 🖼️ 이미지 렌더링
  useEffect(() => {
    if (isCanvasReady) {
      renderItemPreview()
    }
  }, [isCanvasReady, renderItemPreview, selectedItem])

  // 🧊 픽셀 렌더링
  useEffect(() => {
    if (isCanvasReady) {
      renderSelectedPixels()
    }
  }, [isCanvasReady, selectedPixels, renderSelectedPixels])

  // 🖱️ 캔버스 이벤트 업데이트
  useEffect(() => {
    if (isCanvasReady) {
      const cleanup = setupCanvasEvents()
      return cleanup
    }
  }, [isCanvasReady, setupCanvasEvents, isSelectingPixels])

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
          <div className="text-white text-xl">캐릭터 픽셀 에디터 로딩 중...</div>
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
            <h1 className="text-2xl font-bold">🎨 캐릭터 픽셀 에디터</h1>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-4">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          
          {/* 🎮 메인 캔버스 영역 */}
          <div className="xl:col-span-2">
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/20">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">🎮 캐릭터 픽셀 캔버스</h2>
                <div className="flex gap-2">
                  <div className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded-lg text-sm">
                    🔲 그리드 활성화됨
                  </div>
                </div>
              </div>
              
              {/* 캔버스 */}
              <div 
                ref={canvasRef}
                className="w-full bg-gradient-to-br from-blue-900/20 via-purple-900/20 to-pink-900/20 rounded-lg border border-white/30 relative"
                style={{ height: '400px' }}
              >
                {!isCanvasReady && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-6xl mb-4">🎮</div>
                      <div className="text-xl">PixiJS 초기화 중...</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 🛠️ 편집 패널 */}
          <div className="space-y-4">
            
            {/* 아이템 선택 */}
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/20">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold">🎨 아이템 선택</h3>
                <button
                  onClick={startNewLayout}
                  className="px-3 py-1 bg-blue-500/80 hover:bg-blue-500 text-white rounded text-sm transition-all"
                >
                  🆕 새 레이아웃
                </button>
              </div>
              
              {availableItems.length > 0 ? (
                <div className="space-y-3">
                  <div className="text-sm text-white/60 mb-2">
                    총 {availableItems.length}개 아이템
                  </div>
                  
                  <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto">
                    {availableItems.map((item) => (
                      <div
                        key={item.id}
                        className={`relative p-3 rounded-lg border transition-all ${
                          selectedItem?.id === item.id
                            ? 'border-blue-400 bg-blue-400/20'
                            : 'border-white/20 bg-white/5 hover:border-white/30 hover:bg-white/10'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 bg-white/10 rounded flex items-center justify-center overflow-hidden flex-shrink-0">
                            {item.imageUrl ? (
                              <img 
                                src={item.imageUrl} 
                                alt={item.name}
                                className="max-w-full max-h-full object-contain"
                                style={{ imageRendering: 'pixelated' }}
                              />
                            ) : (
                              <div className="text-white/40 text-lg">👤</div>
                            )}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm truncate">{item.name}</div>
                            <div className="flex items-center space-x-3 text-xs text-white/60">
                              <span>🏷️ {item.category}</span>
                            </div>
                          </div>
                          
                          <button
                            onClick={() => setSelectedItem(item)}
                            className="px-2 py-1 bg-blue-500/80 hover:bg-blue-500 text-white rounded text-xs transition-all"
                            title="선택"
                          >
                            선택
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-4xl mb-2">👤</div>
                  <div className="text-white/60 mb-4">사용 가능한 캐릭터 아이템이 없습니다</div>
                </div>
              )}
            </div>

            {/* 🎯 픽셀 선택 */}
            {selectedItem && (
              <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <h3 className="text-lg font-bold mb-3">🎯 픽셀 배치</h3>
                
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <button
                      onClick={() => setIsSelectingPixels(!isSelectingPixels)}
                      className={`flex-1 px-3 py-2 rounded-lg text-sm transition-all ${
                        isSelectingPixels 
                          ? 'bg-purple-500 text-white shadow-lg' 
                          : 'bg-white/10 text-white/60 hover:bg-white/20'
                      }`}
                    >
                      {isSelectingPixels ? '🧊 픽셀 편집 중' : '🧊 픽셀 배치'}
                    </button>
                    
                    <button
                      onClick={() => setSelectedPixels(new Set())}
                      className="px-3 py-2 bg-red-500/20 text-red-300 rounded-lg text-sm hover:bg-red-500/30"
                    >
                      초기화
                    </button>
                  </div>
                  
                  <div className="text-sm text-white/60">
                    배치된 픽셀: {selectedPixels.size}개
                  </div>
                  
                  {isSelectingPixels && (
                    <div className="p-2 bg-purple-500/20 rounded border border-purple-500/40">
                      <div className="text-xs text-purple-200">
                        🧊 픽셀 배치 모드 활성화됨<br/>
                        캔버스를 클릭하여 픽셀을 배치하세요
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 💾 저장 버튼 */}
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/20">
              <button
                onClick={handleSave}
                disabled={isSubmitting || !selectedItem || selectedPixels.size === 0}
                className={`w-full py-3 rounded-lg font-bold transition-all duration-200 ${
                  isSubmitting || !selectedItem || selectedPixels.size === 0
                    ? 'bg-gray-600 cursor-not-allowed text-gray-400'
                    : editingLayout.id 
                      ? 'bg-blue-500 hover:bg-blue-600 text-white shadow-lg hover:shadow-blue-500/25'
                      : 'bg-green-500 hover:bg-green-600 text-white shadow-lg hover:shadow-green-500/25'
                }`}
              >
                {isSubmitting ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    {editingLayout.id ? '수정 중...' : '등록 중...'}
                  </div>
                ) : (
                  editingLayout.id ? '✏️ 레이아웃 수정' : '💾 레이아웃 등록'
                )}
              </button>
              
              {(!selectedItem || selectedPixels.size === 0) && (
                <div className="mt-2 text-xs text-red-400">
                  {!selectedItem ? '• 아이템을 선택하세요' : ''}
                  {selectedPixels.size === 0 ? '• 픽셀을 배치하세요' : ''}
                </div>
              )}
            </div>

            {/* 기존 레이아웃 목록 */}
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/20">
              <h3 className="text-lg font-bold mb-3">📋 기존 레이아웃</h3>
              
              {existingLayouts.length > 0 ? (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {existingLayouts.map((layout) => (
                    <div
                      key={layout.id}
                      className="p-2 bg-white/5 rounded border border-white/20 hover:border-white/30 transition-all cursor-pointer"
                      onClick={() => loadExistingLayout(layout)}
                    >
                      <div className="text-sm font-medium">{layout.shop_items?.name || '알 수 없음'}</div>
                      <div className="text-xs text-white/60">
                        픽셀: {layout.pixelData?.length || 0}개
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4">
                  <div className="text-white/60 text-sm">등록된 레이아웃이 없습니다</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

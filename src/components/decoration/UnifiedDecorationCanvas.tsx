'use client'

import * as React from 'react'
import { useRef, useEffect, useState, useCallback, memo } from 'react'
import { RenderState, DecorationItem, PlacedItem, Position3D, FloorTileConfig, CharacterData } from '@/types'
import { UnifiedCanvasManager } from '@/utils/decoration/unifiedCanvasManager'
import { DecorationDataStore } from '@/utils/decoration/dataStore'

interface UnifiedDecorationCanvasProps {
  width?: number
  height?: number
  renderState?: RenderState
  onStateChange?: (newState: Partial<RenderState>) => void
  className?: string
  userId?: string
  isOwner?: boolean
  selectedItemRef?: React.MutableRefObject<DecorationItem | null>
  storeItems?: DecorationItem[]
  placedItems?: PlacedItem[]
  isViewMode?: boolean
  onItemClick?: (item: PlacedItem) => void
  onPlacedItemsUpdate?: (placedItems: PlacedItem[]) => void
  floorTileConfig?: FloorTileConfig
  characterData?: CharacterData | null
  onPlacedItemClick?: (placedItem: PlacedItem) => void
  activeItemId?: string | null
  onDragComplete?: ((newPosition: { x: number; y: number; z: number }) => void) | null
}

const UnifiedDecorationCanvas = memo(function UnifiedDecorationCanvas({
  width = 400,
  height = 300,
  renderState,
  onStateChange,
  className = '',
  userId,
  isOwner = true,
  selectedItemRef,
  storeItems = [],
  placedItems = [],
  isViewMode = false,
  onItemClick,
  onPlacedItemsUpdate,
  floorTileConfig,
  characterData,
  onPlacedItemClick,
  activeItemId,
  onDragComplete
}: UnifiedDecorationCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const managerRef = useRef<UnifiedCanvasManager | null>(null)
  const dataStoreRef = useRef<DecorationDataStore | null>(null)
  
  // 상태 관리
  const [isInitialized, setIsInitialized] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [previewState, setPreviewState] = useState<any>(null)
  
  // 모바일 화면 크기 감지
  const [screenSize, setScreenSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 400,
    height: typeof window !== 'undefined' ? window.innerHeight : 300
  })

  // 화면 크기 업데이트
  useEffect(() => {
    const updateScreenSize = () => {
      setScreenSize({
        width: window.innerWidth,
        height: window.innerHeight
      })
    }

    window.addEventListener('resize', updateScreenSize)
    return () => window.removeEventListener('resize', updateScreenSize)
  }, [])

  // 모바일 최적화된 캔버스 크기 계산
  const mobileCanvasSize = React.useMemo(() => {
    const maxWidth = Math.min(screenSize.width - 20, 400)
    const maxHeight = Math.min(screenSize.height * 0.6, 300)
    return {
      width: maxWidth,
      height: maxHeight
    }
  }, [screenSize])

  // 캔버스 매니저 초기화
  const initializeManager = useCallback(async () => {
    if (!canvasRef.current || managerRef.current) return

    try {
      setIsLoading(true)
      setError(null)

      const manager = new UnifiedCanvasManager()
      await manager.initialize(canvasRef.current, mobileCanvasSize.width, mobileCanvasSize.height)
      
      // 이벤트 콜백 설정
      manager.setEventCallbacks({
        onItemPlace: async (item: DecorationItem, position: Position3D) => {
          if (!userId || !dataStoreRef.current) return
          
          const success = await dataStoreRef.current.placeItem(userId, item.id, position)
          if (success) {
            // 상태 업데이트
            const newPlacedItem: PlacedItem = {
              id: `temp-${Date.now()}`,
              userId: userId,
              itemId: item.id,
              position_x: position.x,
              position_y: position.y,
              position_z: position.z,
              placed_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              gridPosition: position,
              item: item as any
            }
            
            onPlacedItemsUpdate?.([...placedItems, newPlacedItem])
            onStateChange?.({ selectedItem: null })
            if (selectedItemRef) selectedItemRef.current = null
          }
        },
        onItemMove: async (itemId: string, newPosition: Position3D) => {
          if (!userId || !dataStoreRef.current) return
          
          // 아이템 이동 로직
          console.log('아이템 이동:', itemId, newPosition)
        },
        onItemRemove: async (itemId: string) => {
          if (!userId || !dataStoreRef.current) return
          
          const success = await dataStoreRef.current.removeItem(userId, itemId)
          if (success) {
            onPlacedItemsUpdate?.(placedItems.filter(item => item.id !== itemId))
          }
        },
        onPreviewUpdate: (preview: any) => {
          setPreviewState(preview)
        },
        onItemClick: (item: PlacedItem) => {
          if (onPlacedItemClick) {
            onPlacedItemClick(item)
          }
        }
      })
      
      managerRef.current = manager
      dataStoreRef.current = DecorationDataStore.getInstance()
      setIsInitialized(true)
      
      console.log('🎮 통합 캔버스 매니저 초기화 완료')
    } catch (err) {
      console.error('❌ 통합 캔버스 매니저 초기화 실패:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setIsLoading(false)
    }
  }, [mobileCanvasSize, userId, placedItems, onPlacedItemsUpdate, onStateChange, selectedItemRef])

  // 선택된 아이템 처리
  useEffect(() => {
    if (managerRef.current && renderState?.selectedItem) {
      managerRef.current.selectItem(renderState.selectedItem)
    }
  }, [renderState?.selectedItem])

  // 배치된 아이템들 렌더링
  useEffect(() => {
    if (managerRef.current && isInitialized && placedItems.length > 0 && storeItems.length > 0) {
      managerRef.current.renderPlacedItems(placedItems, storeItems)
    }
  }, [isInitialized, placedItems, storeItems])

  // 바닥 타일 렌더링
  useEffect(() => {
    if (managerRef.current && isInitialized && floorTileConfig) {
      managerRef.current.renderFloorTiles(floorTileConfig)
    }
  }, [isInitialized, floorTileConfig])

  // 초기화
  useEffect(() => {
    initializeManager()
  }, [initializeManager])

  // 캔버스 크기 변경 시 매니저 업데이트
  useEffect(() => {
    if (managerRef.current && isInitialized) {
      try {
        // 크기 조정 로직 (필요시 구현)
        console.log('📱 캔버스 크기 조정:', mobileCanvasSize)
      } catch (error) {
        console.error('❌ 캔버스 크기 조정 실패:', error)
      }
    }
  }, [mobileCanvasSize, isInitialized])

  // 정리
  useEffect(() => {
    return () => {
      if (managerRef.current) {
        managerRef.current.destroy()
        managerRef.current = null
      }
    }
  }, [])

  if (error) {
    return (
      <div className="flex items-center justify-center w-full h-full bg-gray-900 text-red-400">
        <div className="text-center">
          <div className="text-lg font-bold mb-2">❌ 오류 발생</div>
          <div className="text-sm">{error}</div>
        </div>
      </div>
    )
  }

  return (
    <div className={`relative ${className}`}>
      {/* 로딩 오버레이 */}
      {isLoading && (
        <div className="absolute inset-0 bg-gray-900/80 flex items-center justify-center z-10">
          <div className="text-center text-white">
            <div className="animate-spin w-8 h-8 border-2 border-[#00ff88] border-t-transparent rounded-full mx-auto mb-2"></div>
            <div className="text-sm font-mono">통합 캔버스 로딩 중...</div>
          </div>
        </div>
      )}

      {/* 캔버스 */}
      <canvas
        ref={canvasRef}
        width={mobileCanvasSize.width}
        height={mobileCanvasSize.height}
        className="w-full h-full touch-none select-none"
        style={{
          borderRadius: '8px',
          backgroundColor: '#1a202c'
        }}
      />

      {/* 미리보기 상태 표시 */}
      {previewState && (
        <div className="absolute top-2 left-2 bg-black/70 text-white px-2 py-1 rounded text-xs font-mono">
          {previewState.isValid ? (
            <span className="text-green-400">✅ 배치 가능</span>
          ) : (
            <span className="text-red-400">❌ 충돌 발생</span>
          )}
          {previewState.position && (
            <div className="text-gray-300">
              위치: ({previewState.position.x}, {previewState.position.y}, {previewState.position.z})
            </div>
          )}
        </div>
      )}

      {/* 터치 가이드 */}
      {renderState?.selectedItem && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/80 text-white px-4 py-2 rounded-lg text-sm">
          💡 원하는 위치를 터치하여 배치하세요
        </div>
      )}
    </div>
  )
})

export default UnifiedDecorationCanvas

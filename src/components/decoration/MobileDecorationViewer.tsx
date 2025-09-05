'use client'

import React, { useState, useCallback, useEffect } from 'react'
import { DecorationItem, PlacedItem, Position3D, CharacterData, FloorTileConfig } from '@/types'
import UnifiedDecorationCanvas from './UnifiedDecorationCanvas'
import MobileControlPanel from './MobileControlPanel'

interface MobileDecorationViewerProps {
  userId: string
  isOwner: boolean
  storeItems: DecorationItem[]
  placedItems: PlacedItem[]
  characterData?: CharacterData | null
  floorTileConfig?: FloorTileConfig
  isViewMode?: boolean
  onPlacedItemsUpdate?: (placedItems: PlacedItem[]) => void
  onItemClick?: (item: PlacedItem) => void
}

export default function MobileDecorationViewer({
  userId,
  isOwner,
  storeItems,
  placedItems,
  characterData,
  floorTileConfig,
  isViewMode = false,
  onPlacedItemsUpdate,
  onItemClick
}: MobileDecorationViewerProps) {
  const [selectedItem, setSelectedItem] = useState<DecorationItem | null>(null)
  const [draggedItem, setDraggedItem] = useState<DecorationItem | null>(null)
  const [previewPosition, setPreviewPosition] = useState<Position3D | null>(null)
  const [showGrid, setShowGrid] = useState(true)
  const [showCollision, setShowCollision] = useState(true)

  // 모바일 화면 크기 감지
  const [screenSize, setScreenSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 400,
    height: typeof window !== 'undefined' ? window.innerHeight : 300
  })

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

  // 아이템 배치
  const handlePlaceItem = useCallback((item: DecorationItem, position: Position3D) => {
    if (isViewMode) return

    const newPlacedItem: PlacedItem = {
      id: `placed_${Date.now()}`,
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

    const updatedItems = [...placedItems, newPlacedItem]
    onPlacedItemsUpdate?.(updatedItems)
    
    console.log('📱 아이템 배치:', { item: item.name, position })
  }, [placedItems, userId, onPlacedItemsUpdate, isViewMode])

  // 아이템 제거
  const handleRemoveItem = useCallback((itemId: string) => {
    if (isViewMode) return

    const updatedItems = placedItems.filter(item => item.id !== itemId)
    onPlacedItemsUpdate?.(updatedItems)
    
    console.log('📱 아이템 제거:', itemId)
  }, [placedItems, onPlacedItemsUpdate, isViewMode])

  // 아이템 회전
  const handleRotateItem = useCallback((itemId: string) => {
    if (isViewMode) return

    const updatedItems = placedItems.map(item => 
      item.id === itemId 
        ? { ...item }
        : item
    )
    onPlacedItemsUpdate?.(updatedItems)
    
    console.log('📱 아이템 회전:', itemId)
  }, [placedItems, onPlacedItemsUpdate, isViewMode])

  // 아이템 이동
  const handleMoveItem = useCallback((itemId: string, position: Position3D) => {
    if (isViewMode) return

    const updatedItems = placedItems.map(item => 
      item.id === itemId 
        ? { ...item, position, updated_at: new Date().toISOString() }
        : item
    )
    onPlacedItemsUpdate?.(updatedItems)
    
    console.log('📱 아이템 이동:', { itemId, position })
  }, [placedItems, onPlacedItemsUpdate, isViewMode])

  // 모바일 드래그 시작
  const handleMobileDragStart = useCallback((item: DecorationItem) => {
    setDraggedItem(item)
    setSelectedItem(item)
    console.log('📱 모바일 드래그 시작:', item.name)
  }, [])

  // 드래그 완료
  const handleDragComplete = useCallback((position: Position3D) => {
    if (draggedItem) {
      handlePlaceItem(draggedItem, position)
      setDraggedItem(null)
      setSelectedItem(null)
      setPreviewPosition(null)
    }
  }, [draggedItem, handlePlaceItem])

  // 캔버스 높이 계산 (모바일 최적화)
  const canvasHeight = Math.min(screenSize.height * 0.4, 300) // 화면의 40% 이하
  const controlPanelHeight = 200 // 컨트롤 패널 높이

  return (
    <div className="flex flex-col h-full bg-gray-900">
      {/* 헤더 */}
      <div className="flex items-center justify-between p-4 bg-gray-800 border-b border-gray-700">
        <div className="text-white font-mono text-lg">
          {isViewMode ? '🏠 방 보기' : '🎨 방 꾸미기'}
        </div>
        
        {!isViewMode && (
          <div className="flex space-x-2">
            <button
              onClick={() => setShowGrid(!showGrid)}
              className={`px-3 py-1 text-xs font-mono rounded transition-colors ${
                showGrid ? 'bg-[#00ff88] text-black' : 'bg-gray-600 text-white'
              }`}
            >
              격자
            </button>
            <button
              onClick={() => setShowCollision(!showCollision)}
              className={`px-3 py-1 text-xs font-mono rounded transition-colors ${
                showCollision ? 'bg-[#00ff88] text-black' : 'bg-gray-600 text-white'
              }`}
            >
              충돌
            </button>
          </div>
        )}
      </div>

      {/* 캔버스 영역 */}
      <div 
        className="flex-1 flex items-center justify-center p-4"
        style={{ minHeight: `${canvasHeight}px` }}
      >
        <UnifiedDecorationCanvas
          width={Math.min(screenSize.width - 32, 400)}
          height={canvasHeight}
          userId={userId}
          isOwner={isOwner}
          storeItems={storeItems}
          placedItems={placedItems}
          characterData={characterData}
          floorTileConfig={floorTileConfig}
          isViewMode={isViewMode}
          onPlacedItemsUpdate={onPlacedItemsUpdate}
          onItemClick={onItemClick}
          onDragComplete={handleDragComplete}
          className="border border-gray-600 rounded-lg"
        />
      </div>

      {/* 상태 표시 */}
      {draggedItem && (
        <div className="px-4 py-2 bg-[#00ff88]/20 text-[#00ff88] text-sm font-mono text-center">
          🎯 {draggedItem.name} 드래그 중... 캔버스에 터치하여 배치하세요
        </div>
      )}

      {/* 컨트롤 패널 */}
      {!isViewMode && (
        <div style={{ height: `${controlPanelHeight}px` }}>
          <MobileControlPanel
            selectedItem={selectedItem}
            placedItems={placedItems}
            onPlaceItem={handlePlaceItem}
            onRemoveItem={handleRemoveItem}
            onRotateItem={handleRotateItem}
            onMoveItem={handleMoveItem}
            isViewMode={isViewMode}
            onMobileDragStart={handleMobileDragStart}
          />
        </div>
      )}

      {/* 터치 가이드 */}
      {!isViewMode && (
        <div className="px-4 py-2 bg-gray-800 text-gray-400 text-xs font-mono text-center">
          💡 팁: 아이템을 선택하고 캔버스에 터치하여 배치하세요
        </div>
      )}
    </div>
  )
}

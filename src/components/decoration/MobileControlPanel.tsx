'use client'

import React, { useState, useCallback } from 'react'
import { DecorationItem, PlacedItem, Position3D } from '@/types'

interface MobileControlPanelProps {
  selectedItem: DecorationItem | null
  placedItems: PlacedItem[]
  onPlaceItem: (item: DecorationItem, position: Position3D) => void
  onRemoveItem: (itemId: string) => void
  onRotateItem: (itemId: string) => void
  onMoveItem: (itemId: string, position: Position3D) => void
  isViewMode?: boolean
  onMobileDragStart?: (item: DecorationItem) => void
}

export default function MobileControlPanel({
  selectedItem,
  placedItems,
  onPlaceItem,
  onRemoveItem,
  onRotateItem,
  onMoveItem,
  isViewMode = false,
  onMobileDragStart
}: MobileControlPanelProps) {
  const [activeTab, setActiveTab] = useState<'inventory' | 'placed'>('inventory')
  const [draggedItem, setDraggedItem] = useState<DecorationItem | null>(null)

  // 모바일 드래그 시작
  const handleMobileDragStart = useCallback((item: DecorationItem) => {
    setDraggedItem(item)
    onMobileDragStart?.(item)
  }, [onMobileDragStart])

  // 모바일 드래그 종료
  const handleMobileDragEnd = useCallback(() => {
    setDraggedItem(null)
  }, [])

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gray-900/95 backdrop-blur-sm border-t border-[#00ff88]/30 z-50">
      {/* 탭 헤더 */}
      <div className="flex border-b border-gray-700">
        <button
          onClick={() => setActiveTab('inventory')}
          className={`flex-1 py-3 px-4 text-sm font-mono transition-colors ${
            activeTab === 'inventory'
              ? 'bg-[#00ff88]/20 text-[#00ff88] border-b-2 border-[#00ff88]'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          📦 인벤토리
        </button>
        <button
          onClick={() => setActiveTab('placed')}
          className={`flex-1 py-3 px-4 text-sm font-mono transition-colors ${
            activeTab === 'placed'
              ? 'bg-[#00ff88]/20 text-[#00ff88] border-b-2 border-[#00ff88]'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          🏠 배치된 아이템
        </button>
      </div>

      {/* 컨텐츠 영역 */}
      <div className="max-h-64 overflow-y-auto">
        {activeTab === 'inventory' && (
          <InventoryTab
            selectedItem={selectedItem}
            onMobileDragStart={handleMobileDragStart}
            isViewMode={isViewMode}
          />
        )}
        
        {activeTab === 'placed' && (
          <PlacedItemsTab
            placedItems={placedItems}
            onRemoveItem={onRemoveItem}
            onRotateItem={onRotateItem}
            onMoveItem={onMoveItem}
            isViewMode={isViewMode}
          />
        )}
      </div>

      {/* 드래그 상태 표시 */}
      {draggedItem && (
        <div className="absolute top-0 left-0 right-0 bg-[#00ff88]/20 text-[#00ff88] py-2 px-4 text-center text-sm font-mono">
          🎯 {draggedItem.name} 드래그 중... 캔버스에 터치하여 배치하세요
        </div>
      )}
    </div>
  )
}

// 인벤토리 탭 컴포넌트
function InventoryTab({
  selectedItem,
  onMobileDragStart,
  isViewMode
}: {
  selectedItem: DecorationItem | null
  onMobileDragStart: (item: DecorationItem) => void
  isViewMode: boolean
}) {
  // 임시 인벤토리 데이터 (실제로는 props로 받아야 함)
  const inventoryItems: DecorationItem[] = [
    {
      id: '1',
      name: '게이밍 의자',
      image_url: '/assets/decoration/chair_gaming.png',
      imageUrl: '/assets/decoration/chair_gaming.png',
      category: 'furniture',
      price: 1000,
      description: '편안한 게이밍 의자',
      anchor: { x: 0.5, y: 0.5 }
    },
    {
      id: '2',
      name: '미니 냉장고',
      image_url: '/assets/decoration/fridge_mini.png',
      imageUrl: '/assets/decoration/fridge_mini.png',
      category: 'appliance',
      price: 2000,
      description: '작은 미니 냉장고',
      anchor: { x: 0.5, y: 0.5 }
    }
  ]

  if (isViewMode) {
    return (
      <div className="p-4 text-center text-gray-400">
        <div className="text-sm font-mono">보기 모드에서는 인벤토리를 사용할 수 없습니다</div>
      </div>
    )
  }

  return (
    <div className="p-4">
      <div className="grid grid-cols-2 gap-3">
        {inventoryItems.map((item) => (
          <div
            key={item.id}
            className={`bg-gray-800 rounded-lg p-3 border transition-all ${
              selectedItem?.id === item.id
                ? 'border-[#00ff88] bg-[#00ff88]/10'
                : 'border-gray-600 hover:border-gray-500'
            }`}
            onClick={() => onMobileDragStart(item)}
          >
            <div className="aspect-square bg-gray-700 rounded mb-2 flex items-center justify-center">
              <img
                src={item.image_url}
                alt={item.name}
                className="w-8 h-8 object-contain"
              />
            </div>
            <div className="text-xs font-mono text-white truncate">{item.name}</div>
            <div className="text-xs text-gray-400">💰 {item.price}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

// 배치된 아이템 탭 컴포넌트
function PlacedItemsTab({
  placedItems,
  onRemoveItem,
  onRotateItem,
  onMoveItem,
  isViewMode
}: {
  placedItems: PlacedItem[]
  onRemoveItem: (itemId: string) => void
  onRotateItem: (itemId: string) => void
  onMoveItem: (itemId: string, position: Position3D) => void
  isViewMode: boolean
}) {
  if (placedItems.length === 0) {
    return (
      <div className="p-4 text-center text-gray-400">
        <div className="text-sm font-mono">배치된 아이템이 없습니다</div>
      </div>
    )
  }

  return (
    <div className="p-4">
      <div className="space-y-2">
        {placedItems.map((placedItem) => (
          <div
            key={placedItem.id}
            className="bg-gray-800 rounded-lg p-3 border border-gray-600"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gray-700 rounded flex items-center justify-center">
                  <span className="text-xs">📦</span>
                </div>
                <div>
                  <div className="text-sm font-mono text-white">아이템 #{placedItem.id.slice(0, 8)}</div>
                  <div className="text-xs text-gray-400">
                    위치: ({placedItem.position_x}, {placedItem.position_y}, {placedItem.position_z})
                  </div>
                </div>
              </div>
              
              {!isViewMode && (
                <div className="flex space-x-1">
                  <button
                    onClick={() => onRotateItem(placedItem.id)}
                    className="w-8 h-8 bg-blue-600 hover:bg-blue-500 rounded text-white text-xs font-mono"
                    title="회전"
                  >
                    ↻
                  </button>
                  <button
                    onClick={() => onRemoveItem(placedItem.id)}
                    className="w-8 h-8 bg-red-600 hover:bg-red-500 rounded text-white text-xs font-mono"
                    title="제거"
                  >
                    ✕
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

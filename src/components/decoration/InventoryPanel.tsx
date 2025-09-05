'use client'

import React, { memo } from 'react'
import { DecorationItem, InventoryItem, PlacedItem } from '@/types'
import PixelButton from '@/components/ui/PixelButton'

interface InventoryPanelProps {
  inventoryItems: InventoryItem[]
  storeItems: DecorationItem[]
  placedItems: PlacedItem[]
  selectedItemId: string | null
  onItemSelect: (item: DecorationItem) => void
  onItemDeselect: () => void
  onRemoveItem: (placedItem: PlacedItem) => void
  onPlacedItemReselect: (placedItem: PlacedItem) => void
  isVisible: boolean
  isLoading?: boolean
  highlightedItemId?: string | null
}

// 📍 배치된 아이템 카드 컴포넌트 Props
interface PlacedItemCardProps {
  placedItem: PlacedItem & { storeItem: DecorationItem }
  storeItem: DecorationItem
  onRemove: () => void
  onReselect: () => void
}

const InventoryPanel = memo(function InventoryPanel({
  inventoryItems,
  storeItems,
  placedItems,
  selectedItemId,
  onItemSelect,
  onItemDeselect,
  onRemoveItem,
  onPlacedItemReselect,
  isVisible,
  isLoading = false,
  highlightedItemId = null
}: InventoryPanelProps) {
  if (!isVisible) return null

  // 아이템 맵 생성 (빠른 조회를 위해)
  const storeItemMap = new Map((storeItems || [])
    .filter(item => item.id) // id가 있는 아이템만 필터링
    .map(item => [item.id, item]))
  
  console.log('🔍 InventoryPanel 렌더링:', {
    inventoryItems: inventoryItems?.length || 0,
    storeItems: storeItems?.length || 0,
    placedItems: placedItems?.length || 0,
    inventoryItemsData: inventoryItems,
    storeItemsData: storeItems
  })
  
  console.log('🔍 StoreItemMap 생성:', {
    storeItemMapKeys: Array.from(storeItemMap.keys()),
    storeItemMapSize: storeItemMap.size,
    storeItemMapEntries: Array.from(storeItemMap.entries()).map(([key, value]) => ({ key, name: value.name }))
  })
  
  console.log('🔍 StoreItemMap 상세:', Array.from(storeItemMap.entries()).map(([key, value]) => ({ 
    key, 
    name: value.name,
    id: value.id,
    hasId: !!value.id
  })))

  // 배치된 아이템들의 상세 정보
  const placedItemsWithDetails = (placedItems || [])
    .map(placedItem => ({
      ...placedItem,
      storeItem: storeItemMap.get(placedItem.itemId)
    }))
    .filter(item => item.storeItem)
    .sort((a, b) => (a.storeItem?.name || '').localeCompare(b.storeItem?.name || ''))

  // 🔧 배치된 아이템 개수 맵 (아이템ID별 배치된 개수)
  const placedItemCounts = new Map<string, number>()
  ;(placedItems || []).forEach(placedItem => {
    const count = placedItemCounts.get(placedItem.itemId) || 0
    placedItemCounts.set(placedItem.itemId, count + 1)
  })

  // 배치 가능한 아이템들 (총 보유 수량 - 배치된 수량 > 0)
  const availableItems = (inventoryItems || [])
    .map(invItem => {
      // 인벤토리 아이템의 실제 아이템 ID는 itemId 필드
      const itemId = invItem.itemId // itemId 필드 사용
      const placedCount = placedItemCounts.get(itemId) || 0
      const availableCount = invItem.quantity - placedCount
      
      console.log('🔍 인벤토리 아이템 처리:', {
        invItem,
        itemId,
        placedCount,
        availableCount,
        storeItem: storeItemMap.get(itemId)
      })
      
      return {
        ...invItem,
        id: itemId, // ID 통일
        availableCount, // 실제 배치 가능한 수량
        storeItem: storeItemMap.get(itemId)
      }
    })
    .filter(item => {
      const hasStoreItem = !!item.storeItem
      const hasAvailableCount = item.availableCount > 0
      console.log('🔍 필터링 결과:', {
        item: item.item?.name || 'Unknown',
        hasStoreItem,
        hasAvailableCount,
        availableCount: item.availableCount
      })
      return hasStoreItem && hasAvailableCount
    }) // 배치 가능한 것만
    .sort((a, b) => (a.storeItem?.name || '').localeCompare(b.storeItem?.name || ''))

  // 🔧 카테고리별로 아이템 분류
  const categorizedItems = {
    vehicle: availableItems.filter(item => item.storeItem?.sub_category === 'vehicle'),
    interior: availableItems.filter(item => item.storeItem?.sub_category === 'interior'),
    props: availableItems.filter(item => item.storeItem?.sub_category === 'props')
  }

  // 카테고리 정보
  const categories = [
    { id: 'vehicle', name: 'Vehicle', icon: '🚗', items: categorizedItems.vehicle },
    { id: 'interior', name: '인테리어', icon: '🪑', items: categorizedItems.interior },
    { id: 'props', name: '소품', icon: '🎨', items: categorizedItems.props }
  ].filter(category => category.items.length > 0) // 아이템이 있는 카테고리만 표시

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="text-white/60 mb-2">🔄</div>
        <div className="text-white/60 text-sm">인벤토리 로딩 중...</div>
      </div>
    )
  }

  if (availableItems.length === 0 && placedItemsWithDetails.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-white/60 mb-2">🎒</div>
        <div className="text-white/60 text-sm">인벤토리가 비어있습니다</div>
        <div className="text-white/40 text-xs mt-1">상점에서 아이템을 구매해보세요</div>
      </div>
    )
  }

  return (
    <div className="space-y-4 pb-4 mx-4 mb-4 bg-black/20 backdrop-blur-sm rounded-lg p-4 border border-white/10">
      {/* 전체 헤더 */}
      <div className="flex items-center justify-between">
        <h3 className="text-white font-bold text-lg">🎒 내 인벤토리</h3>
        <div className="text-white/60 text-sm">
          배치됨: {placedItemsWithDetails.length} | 보유: {availableItems.length}
        </div>
      </div>

      {/* 안내 메시지 */}
      {selectedItemId && (
        <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-green-400 text-sm font-medium">📦 배치 모드 활성화</div>
              <div className="text-green-300 text-xs mt-1">
                아이템을 배치하세요
              </div>
            </div>
            <PixelButton
              onClick={onItemDeselect}
              variant="secondary"
              size="sm"
            >
              배치 종료
            </PixelButton>
          </div>
        </div>
      )}

      {/* 📍 배치된 아이템 섹션 */}
      {placedItemsWithDetails.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-white font-medium text-md flex items-center gap-2">
              📍 배치된 아이템
              <span className="text-white/60 text-sm">({placedItemsWithDetails.length}개)</span>
            </h4>
          </div>
          <div className="overflow-x-auto scrollbar-hide">
            <div className="flex gap-2 pb-2" style={{ minWidth: 'max-content' }}>
              {placedItemsWithDetails.map((item, index) => (
                <div key={`placed-${item.itemId}-${item.position_x || 0}-${item.position_y || 0}-${item.position_z || 0}`} className="w-16 flex-shrink-0">
                  <PlacedItemCard
                    placedItem={item as any}
                    storeItem={item.storeItem!}
                    onRemove={() => onRemoveItem(item)}
                    onReselect={() => onPlacedItemReselect(item)}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 📦 배치 가능한 아이템 섹션 - 카테고리별 표시 */}
      {availableItems.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-white font-medium text-md flex items-center gap-2">
              📦 배치 가능한 아이템
              <span className="text-white/60 text-sm">({availableItems.length}개)</span>
            </h4>
          </div>
          
          {/* 카테고리별 아이템 표시 */}
          {categories.map(category => (
            <div key={category.id} className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-lg">{category.icon}</span>
                <h5 className="text-white font-medium text-sm">
                  {category.name}
                  <span className="text-white/60 text-xs ml-1">({category.items.length}개)</span>
                </h5>
              </div>
              <div className="overflow-x-auto scrollbar-hide">
                <div className="flex gap-2 pb-2" style={{ minWidth: 'max-content' }}>
                  {category.items.map(({ id, quantity, availableCount, storeItem }, index) => (
                    <div key={`${category.id}-${id}-${index}`} className="w-16 flex-shrink-0">
                      <AvailableItemCard
                        inventoryItem={{ id, itemId: id, quantity: availableCount }}
                        storeItem={storeItem!}
                        isSelected={selectedItemId === id}
                        onSelect={() => onItemSelect(storeItem!)}
                        onDeselect={onItemDeselect}
                        isHighlighted={highlightedItemId === id}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 하단 안내 메시지 */}
      <div className="text-center">
        <div className="text-white/40 text-xs">
          💡 배치 가능한 아이템을 선택하여 차고에 배치하거나, 배치된 아이템을 제거할 수 있습니다
        </div>
      </div>
    </div>
  )
})

// 📍 배치된 아이템 카드 컴포넌트
function PlacedItemCard({
  placedItem,
  storeItem,
  onRemove,
  onReselect
}: PlacedItemCardProps) {
  const handleClick = () => {
    // 배치된 아이템 클릭 시 수거
    onRemove()
  }

  return (
    <div 
      className="flex flex-col bg-black/30 p-2 rounded-lg border border-white/10 hover:border-white/20 transition-colors h-full cursor-pointer"
      onClick={handleClick}
    >
      {/* 아이템 이미지 미리보기 - 정사각형 박스 */}
      <div className="w-full aspect-square bg-white/10 rounded border border-white/20 flex items-center justify-center overflow-hidden mb-1">
        {storeItem.imageUrl ? (
          <img 
            src={storeItem.imageUrl} 
            alt={storeItem.name}
            className="w-full h-full object-contain"
            style={{ imageRendering: 'pixelated' }}
          />
        ) : (
          <span className="text-white/40 text-xs">🖼️</span>
        )}
      </div>
      
      {/* 아이템 이름 */}
      <div className="text-white text-xs font-medium truncate text-center">
        {storeItem.name}
      </div>
    </div>
  )
}

// 📦 배치 가능한 아이템 카드 컴포넌트 Props
interface AvailableItemCardProps {
  inventoryItem: InventoryItem
  storeItem: DecorationItem
  isSelected: boolean
  onSelect: () => void
  onDeselect: () => void
  isHighlighted?: boolean
}

function AvailableItemCard({
  inventoryItem,
  storeItem,
  isSelected,
  onSelect,
  onDeselect,
  isHighlighted = false
}: AvailableItemCardProps) {
  const handleClick = () => {
    if (isSelected) {
      onDeselect()
    } else {
      onSelect()
    }
  }

  return (
    <div 
      className={`flex flex-col bg-black/30 p-2 rounded-lg border transition-all duration-300 h-full cursor-pointer ${
        isHighlighted
          ? 'border-yellow-400/70 bg-yellow-400/20 shadow-lg shadow-yellow-400/30 animate-pulse'
          : isSelected 
            ? 'border-green-500/50 bg-green-500/20' 
            : 'border-white/10 hover:border-white/20'
      }`}
      onClick={handleClick}
    >
      {/* 아이템 이미지 미리보기 - 정사각형 박스 */}
      <div className={`w-full aspect-square bg-white/10 rounded border flex items-center justify-center overflow-hidden mb-1 ${
        isSelected ? 'border-green-500/50 bg-green-500/10' : 'border-white/20'
      }`}>
        {storeItem.imageUrl ? (
          <img 
            src={storeItem.imageUrl} 
            alt={storeItem.name}
            className="w-full h-full object-contain"
            style={{ imageRendering: 'pixelated' }}
          />
        ) : (
          <span className="text-white/40 text-xs">🖼️</span>
        )}
      </div>
      
      {/* 아이템 이름 */}
      <div className="text-white text-xs font-medium truncate text-center">
        {storeItem.name}
      </div>
    </div>
  )
}

export default InventoryPanel

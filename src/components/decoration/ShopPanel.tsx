'use client'

import React, { useState } from 'react'
import { DecorationItem, InventoryItem, PlacedItem } from '@/types'
import PixelButton from '@/components/ui/PixelButton'

interface ShopPanelProps {
  items: DecorationItem[]
  onPurchase: (itemId: string) => void
  userMoney: number
  userInventory: InventoryItem[]
  placedItems: PlacedItem[]
  isVisible: boolean
  isLoading?: boolean
  onItemClick: (item: DecorationItem) => void
}

export default function ShopPanel({
  items,
  onPurchase,
  userMoney,
  userInventory,
  placedItems,
  isVisible,
  isLoading = false,
  onItemClick
}: ShopPanelProps) {
  if (!isVisible) return null

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="text-white/60 mb-2">🔄</div>
        <div className="text-white/60 text-sm">상점 아이템 로딩 중...</div>
      </div>
    )
  }

  if (!items || items.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-white/60 mb-2">🏪</div>
        <div className="text-white/60 text-sm">등록된 상품이 없습니다</div>
        <div className="text-white/40 text-xs mt-1">관리자가 아이템을 추가할 때까지 기다려주세요</div>
      </div>
    )
  }

  return (
    <div className="space-y-4 pb-4 mx-4 mb-4 bg-black/20 backdrop-blur-sm rounded-lg p-4 border border-white/10">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <h3 className="text-white font-bold text-lg">🛒 꾸미기 상점</h3>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 bg-yellow-500/20 px-3 py-1 rounded-lg border border-yellow-500/30">
            <span className="text-yellow-400 text-sm">📦</span>
            <span className="text-yellow-200 font-bold">{userMoney.toLocaleString()}</span>
          </div>
          <button
            onClick={() => window.location.href = '/shop'}
            className="bg-gradient-to-r from-[#ffd93d]/20 to-[#ff6b6b]/20 border border-[#ffd93d]/50 hover:border-[#ffd93d] px-3 py-1 rounded-lg transition-all duration-200 hover:scale-105"
            style={{borderRadius: '4px'}}
          >
            <span className="text-[#ffd93d] text-xs font-mono">🛍️ 상점</span>
          </button>
        </div>
      </div>

      {/* 아이템 목록 - 가로 스크롤 */}
      <div className="overflow-x-auto scrollbar-hide">
        <div className="flex gap-2 pb-2" style={{ minWidth: 'max-content' }}>
          {items.map(item => (
            <div key={item.id} className="w-16 flex-shrink-0">
              <ShopItem
                item={item}
                userMoney={userMoney}
                userInventory={userInventory}
                placedItems={placedItems}
                onPurchase={onPurchase}
                onItemClick={() => onItemClick(item)}
              />
            </div>
          ))}
        </div>
      </div>


      {/* 안내 메시지 */}
      <div className="text-center">
        <div className="text-white/40 text-xs">
          구매한 아이템은 인벤토리에서 확인할 수 있습니다
        </div>
      </div>
    </div>
  )
}


interface ShopItemProps {
  item: DecorationItem
  userMoney: number
  userInventory: InventoryItem[]
  placedItems: PlacedItem[]
  onPurchase: (itemId: string) => void
  onItemClick: () => void
}

function ShopItem({ item, userMoney, userInventory, placedItems, onPurchase, onItemClick }: ShopItemProps) {
  // 구매된 아이템인지 확인 (인벤토리 + 배치된 아이템 모두 확인)
  const isInInventory = userInventory.some(invItem => 
    (invItem.id === item.id || invItem.itemId === item.id) && invItem.quantity > 0
  )
  const isPlaced = placedItems.some(placedItem => placedItem.itemId === item.id)
  const isAlreadyPurchased = isInInventory || isPlaced
  
  return (
    <div 
      className={`flex flex-col p-2 rounded-lg border transition-colors h-full cursor-pointer ${
        isAlreadyPurchased 
          ? 'bg-green-500/20 border-green-500/30 hover:border-green-500/50' 
          : 'bg-black/30 border-white/10 hover:border-white/20'
      }`}
      onClick={onItemClick}
    >
      {/* 아이템 이미지 미리보기 - 정사각형 박스 */}
      <div className={`w-full aspect-square rounded border flex items-center justify-center overflow-hidden mb-1 ${
        isAlreadyPurchased 
          ? 'bg-green-500/10 border-green-500/30' 
          : 'bg-white/10 border-white/20'
      }`}>
        {item.imageUrl ? (
          <img 
            src={item.imageUrl} 
            alt={item.name}
            className={`w-full h-full object-contain ${
              isAlreadyPurchased ? 'opacity-60' : ''
            }`}
            style={{ imageRendering: 'pixelated' }}
          />
        ) : (
          <span className={`text-xs ${
            isAlreadyPurchased ? 'text-green-400' : 'text-white/40'
          }`}>🖼️</span>
        )}
      </div>
      
      {/* 박스 가격 또는 구매완료 표시 */}
      <div className="text-center">
        {isAlreadyPurchased ? (
          <span className="text-green-400 font-bold text-xs">
            {isPlaced ? '배치됨' : '구매완료'}
          </span>
        ) : (
          <span className="text-yellow-400 font-bold text-xs">📦 {(item.price || 0).toLocaleString()}</span>
        )}
      </div>
    </div>
  )
}

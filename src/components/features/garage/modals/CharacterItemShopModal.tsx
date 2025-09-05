'use client'

import React, { useState, useEffect } from 'react'
import { CharacterItem } from '@/types'

interface CharacterItemShopModalProps {
  isOpen: boolean
  onClose: () => void
  userId: string
  onItemPurchased?: (item: CharacterItem) => void
}

interface ShopItem extends CharacterItem {
  userQuantity: number
}

export default function CharacterItemShopModal({
  isOpen,
  onClose,
  userId,
  onItemPurchased
}: CharacterItemShopModalProps) {
  const [items, setItems] = useState<ShopItem[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [purchasingItem, setPurchasingItem] = useState<string | null>(null)

  const categories = [
    { id: 'all', name: '전체', icon: '🛍️' },
    { id: 'hair', name: '헤어', icon: '💇' },
    { id: 'top', name: '상의', icon: '👕' },
    { id: 'bottom', name: '하의', icon: '👖' },
    { id: 'emotion', name: '감정', icon: '😊' },
    { id: 'accessory', name: '액세서리', icon: '💍' }
  ]

  // 아이템 목록 로드
  const loadItems = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ userId })
      if (selectedCategory !== 'all') {
        params.append('category', selectedCategory)
      }

      const response = await fetch(`/api/character-items?${params}`)
      const data = await response.json()

      if (data.success) {
        setItems(data.items)
      } else {
        console.error('아이템 로드 실패:', data.error)
      }
    } catch (error) {
      console.error('아이템 로드 오류:', error)
    } finally {
      setLoading(false)
    }
  }

  // 아이템 구매
  const purchaseItem = async (item: ShopItem) => {
    setPurchasingItem(item.id)
    try {
      const response = await fetch('/api/character-items', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          itemId: item.id,
          userId: userId,
          quantity: 1
        }),
      })

      const data = await response.json()

      if (data.success) {
        alert(data.message)
        onItemPurchased?.(item)
        loadItems() // 목록 새로고침
      } else {
        alert(data.error || '구매에 실패했습니다.')
      }
    } catch (error) {
      console.error('구매 오류:', error)
      alert('구매 중 오류가 발생했습니다.')
    } finally {
      setPurchasingItem(null)
    }
  }

  // 카테고리 변경 시 아이템 다시 로드
  useEffect(() => {
    if (isOpen) {
      loadItems()
    }
  }, [isOpen, selectedCategory, userId])

  if (!isOpen) return null

  const filteredItems = selectedCategory === 'all' 
    ? items 
    : items.filter(item => item.category === selectedCategory)

  return (
    <div 
      className="fixed inset-0 z-[999999] bg-black/80 flex items-center justify-center p-4 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose()
        }
      }}
    >
      <div 
        className="w-full max-w-4xl bg-gradient-to-b from-[#0a0a23] via-[#16213e] to-[#1a1a2e] border-2 border-[#00ff88]/50 shadow-2xl relative max-h-[90vh] overflow-y-auto"
        style={{
          borderRadius: '8px',
          fontFamily: 'monospace',
          imageRendering: 'pixelated',
          boxShadow: '0 0 20px rgba(0, 255, 136, 0.2), inset 0 0 15px rgba(0, 255, 136, 0.05)'
        }}
      >
        {/* 네온 글로우 테두리 */}
        <div className="absolute -inset-1 bg-gradient-to-r from-[#00ff88]/20 via-[#00d4ff]/20 to-[#00ff88]/20 blur-sm -z-10" 
             style={{borderRadius: '12px'}}></div>
        
        {/* 헤더 */}
        <div className="bg-gradient-to-r from-[#0a0a23] to-[#16213e] p-4 border-b-2 border-[#00ff88]/30 relative">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#00ff88]/60 to-transparent"></div>
          
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 bg-gradient-to-br from-[#00d4ff] to-[#9c88ff] border border-[#00ff88]" 
                   style={{borderRadius: '3px'}}>
                <div className="w-full h-full flex items-center justify-center">
                  <div className="w-3 h-3 bg-white" style={{borderRadius: '1px'}}></div>
                </div>
              </div>
              <h3 className="text-[#00ff88] font-bold text-lg font-mono tracking-wider" 
                  style={{textShadow: '0 0 8px rgba(0, 255, 136, 0.5)'}}>
                CHARACTER ITEM SHOP
              </h3>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 bg-gradient-to-br from-[#ff6b6b]/20 to-[#ff4757]/20 border border-[#ff6b6b]/50 hover:border-[#ff6b6b] text-[#ff6b6b] hover:text-[#ff4757] font-bold transition-all duration-200 hover:scale-110"
              style={{borderRadius: '4px'}}
            >
              ✕
            </button>
          </div>
          
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#00ff88]/40 to-transparent"></div>
        </div>

        <div className="p-4 space-y-4 relative">
          {/* 배경 패턴 */}
          <div className="absolute inset-0 opacity-5">
            <div className="w-full h-full" 
                 style={{
                   backgroundImage: `radial-gradient(circle, #00ff88 1px, transparent 1px)`,
                   backgroundSize: '12px 12px'
                 }}></div>
          </div>

          {/* 카테고리 필터 */}
          <div className="bg-gradient-to-r from-[#00d4ff]/20 to-[#9c88ff]/20 border border-[#00d4ff]/50 p-3 relative"
               style={{borderRadius: '4px'}}>
            <h4 className="text-[#00d4ff] text-center font-bold text-sm font-mono tracking-wider mb-3" 
                style={{textShadow: '0 0 6px rgba(0, 212, 255, 0.5)'}}>
              CATEGORY FILTER
            </h4>
            <div className="flex flex-wrap gap-2 justify-center">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`px-3 py-2 border transition-all duration-200 ${
                    selectedCategory === category.id
                      ? 'bg-[#00d4ff]/20 border-[#00d4ff] scale-105'
                      : 'bg-[#0a0a23]/40 border-[#00d4ff]/30 hover:border-[#00d4ff]/60'
                  }`}
                  style={{borderRadius: '3px'}}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{category.icon}</span>
                    <span className="text-white text-xs font-mono">{category.name}</span>
                  </div>
                </button>
              ))}
            </div>
            {/* 모서리 픽셀 도트 */}
            <div className="absolute top-1 left-1 w-1 h-1 bg-[#00d4ff]" style={{borderRadius: '1px'}}></div>
            <div className="absolute top-1 right-1 w-1 h-1 bg-[#00d4ff]" style={{borderRadius: '1px'}}></div>
            <div className="absolute bottom-1 left-1 w-1 h-1 bg-[#00d4ff]" style={{borderRadius: '1px'}}></div>
            <div className="absolute bottom-1 right-1 w-1 h-1 bg-[#00d4ff]" style={{borderRadius: '1px'}}></div>
          </div>

          {/* 아이템 그리드 */}
          <div className="bg-gradient-to-br from-[#0a0a23]/80 to-[#16213e]/80 border-2 border-[#00ff88]/30 p-4 relative"
               style={{borderRadius: '6px'}}>
            <h4 className="text-[#00ff88] text-center font-bold text-sm font-mono tracking-wider mb-4" 
                style={{textShadow: '0 0 6px rgba(0, 255, 136, 0.5)'}}>
              ITEMS ({filteredItems.length})
            </h4>
            
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-center">
                  <div className="text-4xl mb-2 animate-spin">🛍️</div>
                  <div className="text-white/60 text-sm">아이템 로딩 중...</div>
                </div>
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-2">📦</div>
                <div className="text-white/60 mb-4">해당 카테고리에 아이템이 없습니다</div>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {filteredItems.map((item) => (
                  <div
                    key={item.id}
                    className="bg-gradient-to-br from-[#0a0a23]/60 to-[#16213e]/60 border border-[#00ff88]/30 p-3 relative hover:border-[#00ff88]/60 transition-all duration-200"
                    style={{borderRadius: '4px'}}
                  >
                    {/* 아이템 이미지 */}
                    <div className="w-full h-20 bg-white/10 rounded flex items-center justify-center overflow-hidden mb-2">
                      {item.imageUrl ? (
                        <img 
                          src={item.imageUrl} 
                          alt={item.name}
                          className="max-w-full max-h-full object-contain"
                          style={{ imageRendering: 'pixelated' }}
                        />
                      ) : (
                        <div className="text-white/40 text-2xl">👤</div>
                      )}
                    </div>
                    
                    {/* 아이템 정보 */}
                    <div className="space-y-1">
                      <div className="font-medium text-xs text-white truncate">{item.name}</div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[#00ff88]">💎 {item.price.toLocaleString()}</span>
                        {item.userQuantity > 0 && (
                          <span className="text-[#00d4ff]">보유: {item.userQuantity}</span>
                        )}
                      </div>
                    </div>
                    
                    {/* 구매 버튼 */}
                    <button
                      onClick={() => purchaseItem(item)}
                      disabled={purchasingItem === item.id || item.price === 0}
                      className={`w-full mt-2 py-1 px-2 text-xs font-bold transition-all duration-200 ${
                        purchasingItem === item.id
                          ? 'bg-gray-600 cursor-not-allowed text-gray-400'
                          : item.price === 0
                            ? 'bg-green-500/20 text-green-300 cursor-not-allowed'
                            : 'bg-[#00ff88]/20 hover:bg-[#00ff88]/30 text-[#00ff88] hover:text-white'
                      }`}
                      style={{borderRadius: '3px'}}
                    >
                      {purchasingItem === item.id ? (
                        <div className="flex items-center justify-center gap-1">
                          <div className="w-2 h-2 border border-white/30 border-t-white rounded-full animate-spin"></div>
                          구매중...
                        </div>
                      ) : item.price === 0 ? (
                        '무료'
                      ) : (
                        '구매'
                      )}
                    </button>
                    
                    {/* 모서리 픽셀 도트 */}
                    <div className="absolute top-1 left-1 w-1 h-1 bg-[#00ff88]" style={{borderRadius: '1px'}}></div>
                    <div className="absolute top-1 right-1 w-1 h-1 bg-[#00ff88]" style={{borderRadius: '1px'}}></div>
                    <div className="absolute bottom-1 left-1 w-1 h-1 bg-[#00ff88]" style={{borderRadius: '1px'}}></div>
                    <div className="absolute bottom-1 right-1 w-1 h-1 bg-[#00ff88]" style={{borderRadius: '1px'}}></div>
                  </div>
                ))}
              </div>
            )}
            
            {/* 프레임 모서리 픽셀 도트 */}
            <div className="absolute top-1 left-1 w-1 h-1 bg-[#00ff88]" style={{borderRadius: '1px'}}></div>
            <div className="absolute top-1 right-1 w-1 h-1 bg-[#00ff88]" style={{borderRadius: '1px'}}></div>
            <div className="absolute bottom-1 left-1 w-1 h-1 bg-[#00ff88]" style={{borderRadius: '1px'}}></div>
            <div className="absolute bottom-1 right-1 w-1 h-1 bg-[#00ff88]" style={{borderRadius: '1px'}}></div>
          </div>
        </div>
      </div>
    </div>
  )
}

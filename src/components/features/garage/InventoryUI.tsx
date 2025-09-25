'use client'

import { useState, useEffect } from 'react'

interface InventoryItem {
  id: string
  name: string
  description: string
  image_url: string
  category: string
  sub_category: string
  price: number
  pixel_data: {
    voxelData: any[]
    dimensions: { width: number, height: number, depth: number }
  }
  quantity: number
  purchased_at: string
}

interface InventoryUIProps {
  isVisible: boolean
  onClose: () => void
  userId: string
}

export default function InventoryUI({ isVisible, onClose, userId }: InventoryUIProps) {
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null)

  // 인벤토리 아이템 로드
  const loadInventoryItems = async () => {
    if (!userId) return
    
    setLoading(true)
    try {
      const response = await fetch(`/api/user-owned-items?userId=${userId}&category=인테리어`)
      if (response.ok) {
        const data = await response.json()
        setInventoryItems(data.items || [])
      }
    } catch (error) {
    } finally {
      setLoading(false)
    }
  }

  // 아이템 클릭 핸들러
  const handleItemClick = (item: InventoryItem) => {
    setSelectedItem(item)
    // 캔버스에 미리보기 표시하는 이벤트 발생
    window.dispatchEvent(new CustomEvent('showItemPreview', { 
      detail: { item, userId } 
    }))
  }

  useEffect(() => {
    if (isVisible) {
      loadInventoryItems()
    }
  }, [isVisible, userId])

  if (!isVisible) return null

  return (
    <>
      {/* 오버레이 배경 */}
      <div 
        className="fixed inset-0 bg-black/20 z-[9998]"
        onClick={onClose}
      />
      
      {/* 인벤토리 패널 - 캔버스 컨테이너 하단에서 아래로 슬라이드 */}
      <div className={`fixed left-1/2 transform -translate-x-1/2 z-[9999] transition-all duration-500 ease-out ${
        isVisible 
          ? 'bottom-4 opacity-100 translate-y-0' 
          : '-bottom-full opacity-0 translate-y-4'
      }`}>
        <div className="bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460] border-3 border-[#00ff88] rounded-2xl p-4 shadow-2xl min-w-[300px] max-w-[500px]">
          
          {/* 아이템 그리드 */}
          <div className="flex gap-3 overflow-x-auto pb-2">
            {loading ? (
              <div className="flex items-center justify-center py-8 text-white w-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00ff88]"></div>
                <span className="ml-2">로딩중...</span>
              </div>
            ) : inventoryItems.length === 0 ? (
              <div className="flex items-center justify-center py-8 text-gray-400 w-full">
                <div>인테리어 아이템이 없습니다</div>
              </div>
            ) : (
              // 아이템을 ID별로 그룹화하여 중복 제거
              Array.from(
                inventoryItems.reduce((acc, item) => {
                  if (!acc.has(item.id)) {
                    acc.set(item.id, item)
                  }
                  return acc
                }, new Map()).values()
              ).map((item, index) => (
                <div
                  key={item.id || index}
                  onClick={() => handleItemClick(item)}
                  className={`flex-shrink-0 w-16 h-16 bg-gradient-to-br from-[#34495e] to-[#2c3e50] border-2 rounded-xl flex items-center justify-center hover:scale-105 transition-all duration-200 cursor-pointer group relative ${
                    selectedItem?.id === item.id 
                      ? 'border-[#00ff88] shadow-lg shadow-[#00ff88]/50' 
                      : 'border-[#7f8c8d] hover:border-[#00ff88]'
                  }`}
                >
                  {item.image_url ? (
                    <img 
                      src={item.image_url} 
                      alt={item.name}
                      className="w-12 h-12 object-contain rounded"
                      style={{ imageRendering: 'pixelated' }}
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        target.style.display = 'none'
                        const parent = target.parentElement
                        if (parent) {
                          const fallback = document.createElement('div')
                          fallback.className = 'text-2xl'
                          fallback.textContent = '📦'
                          parent.appendChild(fallback)
                        }
                      }}
                    />
                  ) : (
                    <div className="text-2xl">📦</div>
                  )}
                  
                  {/* 수량 표시 */}
                  {item.quantity > 1 && (
                    <div className="absolute -top-1 -right-1 bg-[#00ff88] text-black text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center border border-white">
                      {item.quantity}
                    </div>
                  )}
                  
                  {/* 호버 시 아이템 이름 표시 */}
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 bg-black/80 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                    {item.name} {item.quantity > 1 && `(${item.quantity}개)`}
                  </div>
                </div>
              ))
            )}
          </div>
          
          {/* 닫기 버튼 */}
          <div className="flex justify-center mt-3">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gradient-to-r from-[#e74c3c] to-[#c0392b] text-white text-sm font-bold rounded-lg hover:from-[#c0392b] hover:to-[#a93226] transition-all duration-200 shadow-lg"
            >
              닫기
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

'use client'

import { DecorationItem, InventoryItem } from '@/types'
import PixelButton from '@/components/ui/PixelButton'

interface ShopItemDetailModalProps {
  isOpen: boolean
  onClose: () => void
  item: DecorationItem | null
  userMoney: number
  userInventory: InventoryItem[]
  placedItems: any[]
  onPurchase: (itemId: string) => void
}

export default function ShopItemDetailModal({
  isOpen,
  onClose,
  item,
  userMoney,
  userInventory,
  placedItems,
  onPurchase
}: ShopItemDetailModalProps) {
  if (!isOpen || !item) {
    return null
  }

  const canAfford = userMoney >= (item.price || 0)
  const isAdminOnly = item.isAdminOnly || false
  const isInInventory = userInventory.some(invItem => 
    (invItem.id === item.id || (invItem as any).itemId === item.id) && invItem.quantity > 0
  )
  const isPlaced = placedItems.some(placedItem => placedItem.itemId === item.id)
  const isAlreadyPurchased = isInInventory || isPlaced

  return (
    <div 
      className="fixed inset-0 z-[999999] bg-black flex items-center justify-center p-2 sm:p-4 overflow-y-auto"
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        // 모달 외부 클릭 시 바로 닫히지 않음
      }}
      onTouchStart={(e) => e.stopPropagation()}
      onTouchEnd={(e) => e.stopPropagation()}
    >
      <div 
        className="w-full max-w-sm sm:max-w-md bg-gradient-to-b from-[#0a0a23] via-[#16213e] to-[#1a1a2e] border-2 sm:border-4 border-[#00ff88]/50 shadow-2xl relative max-h-[calc(100vh-32px)] overflow-y-auto"
        style={{
          borderRadius: '6px',
          fontFamily: 'monospace',
          imageRendering: 'pixelated',
          boxShadow: '0 0 20px rgba(0, 255, 136, 0.2), inset 0 0 15px rgba(0, 255, 136, 0.05)'
        }}
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
        }}
        onTouchStart={(e) => e.stopPropagation()}
        onTouchEnd={(e) => e.stopPropagation()}
      >
        {/* 네온 글로우 테두리 */}
        <div className="absolute -inset-1 bg-gradient-to-r from-[#00ff88]/20 via-[#00d4ff]/20 to-[#00ff88]/20 blur-sm -z-10" 
             style={{borderRadius: '12px'}}></div>
        
        {/* 헤더 - 게임 스타일 반응형 */}
        <div className="bg-gradient-to-r from-[#0a0a23] to-[#16213e] p-3 sm:p-4 border-b-2 border-[#00ff88]/30 relative">
          {/* 상단 장식 라인 */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#00ff88]/60 to-transparent"></div>
          
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2 sm:gap-3">
              {/* 픽셀 아이콘 */}
              <div className="w-5 h-5 sm:w-6 sm:h-6 bg-gradient-to-br from-[#00d4ff] to-[#9c88ff] border border-[#00ff88]" 
                   style={{borderRadius: '3px'}}>
                <div className="w-full h-full flex items-center justify-center">
                  <div className="w-2 h-2 sm:w-3 sm:h-3 bg-white" style={{borderRadius: '1px'}}></div>
                </div>
              </div>
              <h3 className="text-[#00ff88] font-bold text-sm sm:text-lg font-mono tracking-wider" 
                  style={{textShadow: '0 0 8px rgba(0, 255, 136, 0.5)'}}>
                ITEM DETAIL
              </h3>
            </div>
            <button
              onClick={onClose}
              className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-br from-[#ff6b6b]/20 to-[#ff4757]/20 border border-[#ff6b6b]/50 hover:border-[#ff6b6b] text-[#ff6b6b] hover:text-[#ff4757] font-bold transition-all duration-200 hover:scale-110 text-sm sm:text-base"
              style={{borderRadius: '4px'}}
            >
              ✕
            </button>
          </div>
          
          {/* 하단 장식 라인 */}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#00ff88]/40 to-transparent"></div>
        </div>

        <div className="p-3 sm:p-4 space-y-3 sm:space-y-4 relative">
          {/* 배경 패턴 */}
          <div className="absolute inset-0 opacity-5">
            <div className="w-full h-full" 
                 style={{
                   backgroundImage: `radial-gradient(circle, #00ff88 1px, transparent 1px)`,
                   backgroundSize: '12px 12px'
                 }}></div>
          </div>
          
          {/* 아이템 이미지 - 게임 스타일 */}
          <div className="space-y-2 sm:space-y-3 relative">
            <div className="bg-gradient-to-r from-[#00d4ff]/20 to-[#9c88ff]/20 border border-[#00d4ff]/50 p-2 sm:p-3 relative"
                 style={{borderRadius: '4px'}}>
              <h4 className="text-[#00d4ff] text-center font-bold text-xs sm:text-sm font-mono tracking-wider mb-2 sm:mb-3" 
                  style={{textShadow: '0 0 6px rgba(0, 212, 255, 0.5)'}}>
                ITEM PREVIEW
              </h4>
              <div className="w-24 h-24 mx-auto bg-white/10 rounded border border-white/20 flex items-center justify-center overflow-hidden">
                {item.imageUrl ? (
                  <img 
                    src={item.imageUrl} 
                    alt={item.name}
                    className="w-20 h-20 object-contain"
                    style={{ imageRendering: 'pixelated' }}
                  />
                ) : (
                  <span className="text-white/40 text-xl">🖼️</span>
                )}
              </div>
            </div>
          </div>

          {/* 아이템 정보 - 게임 스타일 */}
          <div className="space-y-2 sm:space-y-3 relative">
            <div className="bg-gradient-to-r from-[#00ff88]/20 to-[#00d4ff]/20 border border-[#00ff88]/50 p-2 sm:p-3 relative"
                 style={{borderRadius: '4px'}}>
              <h4 className="text-[#00ff88] text-center font-bold text-xs sm:text-sm font-mono tracking-wider mb-2 sm:mb-3" 
                  style={{textShadow: '0 0 6px rgba(0, 255, 136, 0.5)'}}>
                ITEM INFO
              </h4>
              <div className="space-y-2">
                {/* 아이템 이름 */}
                <div className="text-center">
                  <h5 className="text-white font-bold text-sm sm:text-base">{item.name}</h5>
                </div>
                {item.description && (
                  <p className="text-white/80 text-xs sm:text-sm text-center">{item.description}</p>
                )}
                <div className="text-center">
                  <span className="text-yellow-400 font-bold text-xs sm:text-sm">📦 {(item.price || 0).toLocaleString()} 박스</span>
                  {isAdminOnly && (
                    <div className="mt-2">
                      <span className="bg-red-500/20 text-red-400 text-xs px-2 py-1 rounded border border-red-500/30">
                        관리자 전용
                      </span>
                    </div>
                  )}
                </div>
                {isAlreadyPurchased && (
                  <div className="text-green-400 text-xs sm:text-sm text-center">
                    {isPlaced ? '✅ 배치된 아이템입니다' : '✅ 이미 구매한 아이템입니다'}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 구매 버튼 - 게임 스타일 */}
          <div className="space-y-2 sm:space-y-3 relative">
            <div className="bg-gradient-to-r from-[#ffd93d]/20 to-[#ff6b6b]/20 border border-[#ffd93d]/50 p-2 sm:p-3 relative"
                 style={{borderRadius: '4px'}}>
              <h4 className="text-[#ffd93d] text-center font-bold text-xs sm:text-sm font-mono tracking-wider mb-2 sm:mb-3" 
                  style={{textShadow: '0 0 6px rgba(255, 217, 61, 0.5)'}}>
                PURCHASE
              </h4>
              <button
                onClick={() => {
                  if (!isAlreadyPurchased && canAfford && !isAdminOnly) {
                    onPurchase(item.id)
                    onClose()
                  }
                }}
                disabled={!canAfford || isAdminOnly || isAlreadyPurchased}
                className={`w-full py-3 sm:py-4 transition-all duration-300 hover:scale-105 hover:shadow-lg relative font-mono tracking-wide ${
                  isAlreadyPurchased 
                    ? 'bg-gradient-to-r from-[#00d4ff]/20 to-[#9c88ff]/20 border-2 border-[#00d4ff]/50 text-[#00d4ff] cursor-not-allowed' 
                    : (!canAfford || isAdminOnly)
                    ? 'bg-gradient-to-r from-[#ff6b6b]/20 to-[#ff4757]/20 border-2 border-[#ff6b6b]/50 text-[#ff6b6b] cursor-not-allowed'
                    : 'bg-gradient-to-r from-[#00ff88]/20 to-[#00d4ff]/20 border-2 border-[#00ff88]/50 hover:border-[#00ff88] text-[#00ff88] hover:text-white'
                }`}
                style={{
                  borderRadius: '6px',
                  textShadow: isAlreadyPurchased 
                    ? '0 0 6px rgba(0, 212, 255, 0.5)' 
                    : (!canAfford || isAdminOnly)
                    ? '0 0 6px rgba(255, 107, 107, 0.5)'
                    : '0 0 6px rgba(0, 255, 136, 0.5)',
                  boxShadow: isAlreadyPurchased 
                    ? '0 0 15px rgba(0, 212, 255, 0.2)' 
                    : (!canAfford || isAdminOnly)
                    ? '0 0 15px rgba(255, 107, 107, 0.2)'
                    : '0 0 15px rgba(0, 255, 136, 0.2)'
                }}
              >
                <div className="flex items-center justify-center gap-1.5 sm:gap-2">
                  <div className={`w-2.5 h-2.5 sm:w-3 sm:h-3 border border-white ${isAlreadyPurchased ? 'bg-[#00d4ff]' : (!canAfford || isAdminOnly) ? 'bg-[#ff6b6b]' : 'bg-[#00ff88]'}`} style={{borderRadius: '1px'}}></div>
                  <span className="text-sm sm:text-base font-mono tracking-wider">
                    {isAlreadyPurchased ? (isPlaced ? '✅ 배치됨' : '✅ 구매완료') : (!canAfford ? '📦 박스 부족' : isAdminOnly ? '제한됨' : '구매하기')}
                  </span>
                  <div className={`w-2.5 h-2.5 sm:w-3 sm:h-3 border border-white ${isAlreadyPurchased ? 'bg-[#00d4ff]' : (!canAfford || isAdminOnly) ? 'bg-[#ff6b6b]' : 'bg-[#00ff88]'}`} style={{borderRadius: '1px'}}></div>
                </div>
                
                {/* 버튼 모서리 픽셀 도트 */}
                <div className={`absolute top-1 left-1 w-1 h-1 ${isAlreadyPurchased ? 'bg-[#00d4ff]' : (!canAfford || isAdminOnly) ? 'bg-[#ff6b6b]' : 'bg-[#00ff88]'}`} style={{borderRadius: '1px'}}></div>
                <div className={`absolute top-1 right-1 w-1 h-1 ${isAlreadyPurchased ? 'bg-[#00d4ff]' : (!canAfford || isAdminOnly) ? 'bg-[#ff6b6b]' : 'bg-[#00ff88]'}`} style={{borderRadius: '1px'}}></div>
                <div className={`absolute bottom-1 left-1 w-1 h-1 ${isAlreadyPurchased ? 'bg-[#00d4ff]' : (!canAfford || isAdminOnly) ? 'bg-[#ff6b6b]' : 'bg-[#00ff88]'}`} style={{borderRadius: '1px'}}></div>
                <div className={`absolute bottom-1 right-1 w-1 h-1 ${isAlreadyPurchased ? 'bg-[#00d4ff]' : (!canAfford || isAdminOnly) ? 'bg-[#ff6b6b]' : 'bg-[#00ff88]'}`} style={{borderRadius: '1px'}}></div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

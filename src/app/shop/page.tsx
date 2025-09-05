'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { DecorationItem, InventoryItem, CharacterItem } from '@/types'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'

type MainCategory = 'character' | 'garage'

export default function ShopPage() {
  const router = useRouter()
  const { user } = useAuth()
  
  // 상태 관리
  const [decorationItems, setDecorationItems] = useState<DecorationItem[]>([])
  const [characterItems, setCharacterItems] = useState<CharacterItem[]>([])
  const [userInventory, setUserInventory] = useState<InventoryItem[]>([])
  const [placedItems, setPlacedItems] = useState<any[]>([]) // 배치된 아이템 추가
  const [currentCharacterData, setCurrentCharacterData] = useState<any>(null) // 현재 캐릭터 데이터
  const [userMoney, setUserMoney] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedItem, setSelectedItem] = useState<DecorationItem | CharacterItem | null>(null)
  const [showItemDetail, setShowItemDetail] = useState(false)
  
  // 카테고리 상태
  const [activeMainCategory, setActiveMainCategory] = useState<MainCategory>('character')

  // 아이템 목록 가져오기
  useEffect(() => {
    const fetchItems = async () => {
      try {
        // 통합 상점 아이템 가져오기
        const shopResponse = await fetch('/api/shop-items')
        if (shopResponse.ok) {
          const shopData = await shopResponse.json()
          const allItems = shopData.items || []
          
          console.log('🛍️ 상점 아이템 데이터:', allItems)
          
          // 캐릭터 아이템과 미니차고 아이템 분리 및 데이터 매핑
          const characterItems = allItems
            .filter((item: any) => item.main_category === 'character')
            .map((item: any) => ({
              ...item,
              imageUrl: item.image_url, // image_url을 imageUrl로 매핑
              subCategory: item.sub_category
            }))
          
          const decorationItems = allItems
            .filter((item: any) => item.main_category === 'garage')
            .map((item: any) => ({
              ...item,
              imageUrl: item.image_url, // image_url을 imageUrl로 매핑
              subCategory: item.sub_category
            }))
          
                  console.log('👤 캐릭터 아이템:', characterItems)
        console.log('👤 캐릭터 아이템 상세:', characterItems.map((item: any) => ({
          name: item.name,
          sub_category: item.sub_category,
          imageUrl: item.imageUrl,
          fileName: item.imageUrl ? item.imageUrl.split('/').pop() : 'no-url',
          imageUrlLength: item.imageUrl ? item.imageUrl.length : 0
        })))
        console.log('🏠 미니차고 아이템:', decorationItems)
          
          setCharacterItems(characterItems)
          setDecorationItems(decorationItems)
        }
      } catch (error) {
        console.error('아이템 목록 가져오기 실패:', error)
      }
    }

    fetchItems()
  }, [])

  // 사용자 정보 가져오기
  useEffect(() => {
    const fetchUserData = async () => {
      if (!user?.id) {
        setIsLoading(false)
        return
      }

      try {
        // 사용자 박스 정보 가져오기
        const boxesResponse = await fetch(`/api/boxes?userId=${user.id}`)
        if (boxesResponse.ok) {
          const boxesData = await boxesResponse.json()
          setUserMoney(boxesData.totalBoxes || 0)
        }
        
        // 인벤토리 가져오기
        const inventoryResponse = await fetch(`/api/user-shop-inventory?userId=${user.id}`)
        if (inventoryResponse.ok) {
          const inventoryData = await inventoryResponse.json()
          setUserInventory(inventoryData.inventory || [])
        }
        
        // 배치된 아이템 가져오기 (Supabase에서 직접)
        try {
          const { data: garage, error: garageError } = await supabase
            .from('garage_placements')
            .select('item_id')
            .eq('user_id', user.id)

          if (!garageError && garage) {
            const placedItemsData = garage.map(item => ({
              itemId: item.item_id
            }))
            setPlacedItems(placedItemsData)
            console.log('🏠 배치된 아이템 로드됨:', placedItemsData.length)
          }
        } catch (error) {
          console.error('배치된 아이템 로드 실패:', error)
          setPlacedItems([])
        }
        
        // 현재 캐릭터 데이터 가져오기
        try {
          const characterResponse = await fetch(`/api/character?userId=${user.id}`)
          if (characterResponse.ok) {
            const characterData = await characterResponse.json()
            setCurrentCharacterData(characterData)
                    console.log('👤 현재 캐릭터 데이터 로드됨:', characterData)
        console.log('👤 캐릭터 파츠 상세:', characterData.parts)
        console.log('👤 캐릭터 장착 아이템들:', characterData.equippedItems)
          }
        } catch (error) {
          console.error('캐릭터 데이터 로드 실패:', error)
          setCurrentCharacterData(null)
        }
      } catch (error) {
        console.error('사용자 정보 가져오기 실패:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchUserData()
  }, [user?.id])

  // 아이템 구매
  const handlePurchase = async (itemId: string, itemType: 'decoration' | 'character') => {
    try {
      const response = await fetch('/api/shop-items', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          itemId,
          userId: user?.id || 'anonymous',
          quantity: 1
        }),
      })

      if (response.ok) {
        const result = await response.json()
        setUserMoney(result.remainingBoxes || userMoney - (selectedItem?.price || 0))
        
        // 인벤토리 업데이트
        if (user?.id) {
          const inventoryResponse = await fetch(`/api/user-shop-inventory?userId=${user.id}`)
          if (inventoryResponse.ok) {
            const inventoryData = await inventoryResponse.json()
            setUserInventory(inventoryData.inventory || [])
          }
        }
        
        alert('구매가 완료되었습니다!')
      } else {
        const error = await response.json()
        alert(error.error || '구매에 실패했습니다.')
      }
    } catch (error) {
      console.error('구매 실패:', error)
      alert('구매 중 오류가 발생했습니다.')
    }
  }

  // 캐릭터 프리뷰 생성 함수
  const createCharacterPreview = (selectedItem: CharacterItem) => {
    if (!currentCharacterData || !selectedItem) return null
    
    // 선택한 아이템의 카테고리 확인
    const subCategory = selectedItem.category
    
    // 현재 캐릭터가 장착한 아이템들의 이미지 URL을 찾는 함수
    const findEquippedItemImageUrl = (itemId: string) => {
      if (!currentCharacterData.equippedItems) return 'none.png'
      
      const equippedItem = currentCharacterData.equippedItems.find((item: any) => 
        item.item && item.item.id === itemId
      )
      
      return equippedItem?.item?.image_url || 'none.png'
    }
    
    // 현재 캐릭터의 파츠를 실제 이미지 URL로 변환
    const previewParts = {
      hair: findEquippedItemImageUrl(currentCharacterData.parts.hair),
      top: findEquippedItemImageUrl(currentCharacterData.parts.top),
      bottom: findEquippedItemImageUrl(currentCharacterData.parts.bottom),
      emotion: currentCharacterData.parts.emotion || 'heart.png'
    }
    
    // 선택한 아이템의 이미지 URL로 해당 파츠 교체
    if (subCategory === 'hair') {
      previewParts.hair = selectedItem.imageUrl || 'none.png'
    } else if (subCategory === 'top') {
      previewParts.top = selectedItem.imageUrl || 'none.png'
    } else if (subCategory === 'bottom') {
      previewParts.bottom = selectedItem.imageUrl || 'none.png'
    }
    
    console.log('🎭 프리뷰 생성:', {
      원본파츠: currentCharacterData.parts,
      선택아이템: selectedItem.name,
      카테고리: subCategory,
      새파츠: previewParts
    })
    
    return {
      ...currentCharacterData,
      parts: previewParts
    }
  }

  // 아이템 클릭 핸들러
  const handleItemClick = (item: DecorationItem | CharacterItem) => {
    setSelectedItem(item)
    setShowItemDetail(true)
  }

  // 카테고리별 아이템 필터링
  const getItemsByCategory = (category: string) => {
    if (activeMainCategory === 'character') {
      return characterItems.filter(item => item.category === category)
    } else {
      return decorationItems.filter(item => item.sub_category === category)
    }
  }

  // 아이템 구매 상태 확인
  const getItemStatus = (item: DecorationItem | CharacterItem) => {
    const isInInventory = userInventory.some(invItem => 
      (invItem.itemId === item.id || invItem.item?.id === item.id) && invItem.quantity > 0
    )
    const isPlaced = placedItems.some(placedItem => placedItem.itemId === item.id)
    const canAfford = userMoney >= (item.price || 0)
    const isAdminOnly = item.isAdminOnly || false

    return { isInInventory, isPlaced, canAfford, isAdminOnly }
  }

  // 아이템 상태에 따른 색상 및 스타일 결정
  const getItemStyle = (item: DecorationItem | CharacterItem) => {
    const { isInInventory, isPlaced, canAfford, isAdminOnly } = getItemStatus(item)
    
    if (isPlaced) {
      return {
        borderColor: 'border-blue-500/70',
        hoverBorderColor: 'hover:border-blue-400',
        bgGradient: 'from-blue-500/20 via-blue-400/20 to-blue-500/20',
        boxShadow: '0 0 20px rgba(59, 130, 246, 0.3), inset 0 0 15px rgba(59, 130, 246, 0.1)',
        statusText: '배치완료',
        statusColor: 'text-blue-400'
      }
    } else if (isInInventory) {
      return {
        borderColor: 'border-green-500/70',
        hoverBorderColor: 'hover:border-green-400',
        bgGradient: 'from-green-500/20 via-green-400/20 to-green-500/20',
        boxShadow: '0 0 20px rgba(34, 197, 94, 0.3), inset 0 0 15px rgba(34, 197, 94, 0.1)',
        statusText: '구매완료',
        statusColor: 'text-green-400'
      }
    } else if (!canAfford) {
      return {
        borderColor: 'border-red-500/50',
        hoverBorderColor: 'hover:border-red-400',
        bgGradient: 'from-red-500/20 via-red-400/20 to-red-500/20',
        boxShadow: '0 0 20px rgba(239, 68, 68, 0.2), inset 0 0 15px rgba(239, 68, 68, 0.05)',
        statusText: '박스 부족',
        statusColor: 'text-red-400'
      }
    } else if (isAdminOnly) {
      return {
        borderColor: 'border-purple-500/50',
        hoverBorderColor: 'hover:border-purple-400',
        bgGradient: 'from-purple-500/20 via-purple-400/20 to-purple-500/20',
        boxShadow: '0 0 20px rgba(147, 51, 234, 0.2), inset 0 0 15px rgba(147, 51, 234, 0.05)',
        statusText: '제한됨',
        statusColor: 'text-purple-400'
      }
    } else {
      return {
        borderColor: 'border-[#00ff88]/50',
        hoverBorderColor: 'hover:border-[#00ff88]',
        bgGradient: 'from-[#00ff88]/20 via-[#00d4ff]/20 to-[#00ff88]/20',
        boxShadow: '0 0 20px rgba(0, 255, 136, 0.2), inset 0 0 15px rgba(0, 255, 136, 0.05)',
        statusText: '구매가능',
        statusColor: 'text-[#00ff88]'
      }
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a0a0a] via-[#1a1a2e] to-[#16213e] flex items-center justify-center">
        <div className="text-white text-xl">로딩 중...</div>
      </div>
    )
  }

  // 카테고리 설정
  const characterCategories = [
    { id: 'hair', label: 'Hair' },
    { id: 'top', label: 'Top' },
    { id: 'bottom', label: 'Bottom' }
  ]
  
  const garageCategories = [
    { id: 'vehicle', label: 'Vehicle' },
    { id: 'interior', label: 'Interior' },
    { id: 'props', label: 'Props' }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a0a] via-[#1a1a2e] to-[#16213e] text-white">
      {/* 헤더 */}
      <header className="bg-black/30 backdrop-blur-lg border-b border-[#00ff88]/20 p-4">
        <div className="flex items-center justify-between max-w-md mx-auto">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 bg-gradient-to-br from-[#ff6b6b]/20 to-[#ff4757]/20 border border-[#ff6b6b]/50 hover:border-[#ff6b6b] text-[#ff6b6b] hover:text-[#ff4757] font-bold transition-all duration-200 hover:scale-110 flex items-center justify-center"
            style={{borderRadius: '4px'}}
          >
            ←
          </button>
          <h1 className="text-lg font-bold text-[#00ff88]">상점</h1>
          <div className="h-10 px-3 flex items-center justify-center text-xs bg-gradient-to-br from-[#1a1a2e]/80 to-[#16213e]/80 border-2 border-[#ffd93d]/40"
            style={{borderRadius: '6px'}}
          >
            <div className="flex items-center gap-2">
              <span className="text-[#ffd93d]">📦</span>
              <span className="text-[#ffd93d] text-[10px] leading-none font-bold" style={{textShadow: '0 0 6px rgba(255, 217, 61, 0.5)'}}>{userMoney.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </header>

      {/* 메인 컨텐츠 */}
      <main className="max-w-md mx-auto p-4 space-y-4">
        {/* 메인 카테고리 탭 - INCOME 스타일 */}
        <div className="bg-gradient-to-br from-[#1a4a2e]/90 to-[#1a1a2e]/90 backdrop-blur-lg rounded-2xl p-2 sm:p-3 border border-[#00ff88]/20 shadow-2xl">
          <div className="flex gap-2">
            {[
              { id: 'character', label: '캐릭터' },
              { id: 'garage', label: '미니차고' }
            ].map((category) => (
              <button
                key={category.id}
                onClick={() => setActiveMainCategory(category.id as MainCategory)}
                className={`flex-1 py-2.5 px-3 font-mono transition-all duration-200 border-2 relative ${
                  activeMainCategory === category.id
                    ? 'bg-gradient-to-r from-[#2d3748] to-[#1a202c] shadow-lg'
                    : 'bg-[#1a202c]/60 hover:bg-[#1a202c]/80'
                } ${
                  activeMainCategory === category.id
                    ? category.id === 'character' ? 'border-[#00ff88]/60' : 'border-[#ffd93d]/60'
                    : 'border-gray-600/30'
                }`}
                style={{borderRadius: '4px'}}
              >
                <div className="text-center">
                  <div className={`text-sm font-bold ${
                    activeMainCategory === category.id
                      ? category.id === 'character' ? 'text-[#00ff88]' : 'text-[#ffd93d]'
                      : 'text-gray-300'
                  }`}>
                    {category.label}
                  </div>
                </div>
                
                {/* 픽셀 도트들 */}
                <div className={`absolute top-1 left-1 w-1 h-1 ${
                  activeMainCategory === category.id
                    ? category.id === 'character' ? 'bg-[#00ff88]/80' : 'bg-[#ffd93d]/80'
                    : 'bg-gray-600/60'
                }`} style={{borderRadius: '1px'}}></div>
                <div className={`absolute top-1 right-1 w-1 h-1 ${
                  activeMainCategory === category.id
                    ? category.id === 'character' ? 'bg-[#00ff88]/80' : 'bg-[#ffd93d]/80'
                    : 'bg-gray-600/60'
                }`} style={{borderRadius: '1px'}}></div>
                <div className={`absolute bottom-1 left-1 w-1 h-1 ${
                  activeMainCategory === category.id
                    ? category.id === 'character' ? 'bg-[#00ff88]/80' : 'bg-[#ffd93d]/80'
                    : 'bg-gray-600/60'
                }`} style={{borderRadius: '1px'}}></div>
                <div className={`absolute bottom-1 right-1 w-1 h-1 ${
                  activeMainCategory === category.id
                    ? category.id === 'character' ? 'bg-[#00ff88]/80' : 'bg-[#ffd93d]/80'
                    : 'bg-gray-600/60'
                }`} style={{borderRadius: '1px'}}></div>
              </button>
            ))}
          </div>
        </div>

        {/* 카테고리별 아이템 섹션 */}
        <div className="space-y-4">
          {(activeMainCategory === 'character' ? characterCategories : garageCategories).map((category) => {
            const categoryItems = getItemsByCategory(category.id)
            
            return (
              <div key={category.id} className="bg-gradient-to-br from-[#1a4a2e]/90 to-[#1a1a2e]/90 backdrop-blur-lg rounded-2xl p-3 sm:p-4 border border-[#00ff88]/20 shadow-2xl">
                {/* 카테고리 헤더 */}
                <div className="text-center mb-3">
                  <h3 className={`text-sm font-bold font-mono ${
                    activeMainCategory === 'character' ? 'text-[#00ff88]' : 'text-[#ffd93d]'
                  }`}>
                    {category.label}
                  </h3>
                </div>
                
                {/* 아이템 스크롤 그리드 */}
                <div className="relative bg-gradient-to-b from-[#2d3748] to-[#1a202c] rounded-xl p-3 border border-[#00ff88]/30">
                  {categoryItems.length > 0 ? (
                    <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                      {categoryItems.map((item) => {
                        const itemStyle = getItemStyle(item)

                        return (
                          <div
                            key={item.id}
                            onClick={() => handleItemClick(item)}
                            className={`flex-shrink-0 w-28 bg-gradient-to-b from-[#0a0a23] via-[#16213e] to-[#1a1a2e] border-2 shadow-lg relative cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-xl ${itemStyle.borderColor} ${itemStyle.hoverBorderColor}`}
                            style={{
                              borderRadius: '6px',
                              fontFamily: 'monospace',
                              imageRendering: 'pixelated',
                              boxShadow: itemStyle.boxShadow
                            }}
                          >
                            {/* 네온 글로우 테두리 */}
                            <div className={`absolute -inset-1 blur-sm -z-10 bg-gradient-to-r ${itemStyle.bgGradient}`} 
                                 style={{borderRadius: '12px'}}></div>
                            
                            {/* 아이템 이미지 */}
                            <div className="p-1.5">
                              <div className={`w-12 h-12 rounded border flex items-center justify-center overflow-hidden mb-1.5 mx-auto ${
                                itemStyle.statusText === '구매완료' 
                                  ? 'bg-green-500/30 border-green-400/50' 
                                  : itemStyle.statusText === '배치완료'
                                  ? 'bg-blue-500/30 border-blue-400/50'
                                  : 'bg-white/10 border-white/20'
                              }`}>
                                {item.imageUrl ? (
                                  <img 
                                    src={item.imageUrl} 
                                    alt={item.name}
                                    className="w-8 h-8 object-contain"
                                    style={{ imageRendering: 'pixelated' }}
                                  />
                                ) : (
                                  <span className="text-white/40 text-sm">🖼️</span>
                                )}
                              </div>
                              
                              {/* 아이템 정보 */}
                              <div className="text-center">
                                <h4 className="text-white font-bold text-[10px] mb-1 truncate">{item.name}</h4>
                                
                                {/* 박스 금액 - 구매 완료되거나 배치 완료된 경우 숨김 */}
                                {itemStyle.statusText !== '구매완료' && itemStyle.statusText !== '배치완료' && (
                                  <div className="text-yellow-400 font-bold text-[10px] mb-1">
                                    📦 {(item.price || 0).toLocaleString()}
                                  </div>
                                )}
                                
                                {/* 상태 표시 - 구매 완료되거나 배치 완료된 경우 표시 */}
                                {(itemStyle.statusText === '구매완료' || itemStyle.statusText === '배치완료') && (
                                  <div className="text-[10px]">
                                    <span className={itemStyle.statusColor}>
                                      {itemStyle.statusText === '배치완료' ? '🏠' : '✅'} {itemStyle.statusText}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    /* 아이템이 없을 때 메시지 */
                    <div className="text-center py-8">
                      <div className="text-white/60 text-sm mb-2">
                        {category.label} 아이템이 없습니다
                      </div>
                      <div className="text-white/40 text-xs">
                        관리자가 아이템을 추가할 때까지 기다려주세요
                      </div>
                    </div>
                  )}
                  
                  {/* 꾸미기 공간 테두리 효과 */}
                  <div className="absolute inset-0 rounded-xl border-2 border-[#00ff88]/20 pointer-events-none"></div>
                  
                  {/* 코너 장식 */}
                  <div className="absolute top-2 left-2 w-4 h-4 border-l-2 border-t-2 border-[#00ff88]/60 rounded-tl-lg"></div>
                  <div className="absolute top-2 right-2 w-4 h-4 border-r-2 border-t-2 border-[#00ff88]/60 rounded-tr-lg"></div>
                  <div className="absolute bottom-2 left-2 w-4 h-4 border-l-2 border-b-2 border-[#00ff88]/60 rounded-bl-lg"></div>
                  <div className="absolute bottom-2 right-2 w-4 h-4 border-r-2 border-b-2 border-[#00ff88]/60 rounded-br-lg"></div>
                </div>
              </div>
            )
          })}
        </div>

      </main>

      {/* 아이템 상세 모달 - INCOME 스타일 */}
      {showItemDetail && selectedItem && (
        <div 
          className="fixed inset-0 z-[999999] bg-black flex items-center justify-center p-2 sm:p-4 overflow-y-auto"
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            setShowItemDetail(false)
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
                  onClick={() => setShowItemDetail(false)}
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
              
              {/* 아이템 이미지 또는 캐릭터 프리뷰 */}
              <div className="space-y-2 sm:space-y-3 relative">
                <div className="bg-gradient-to-r from-[#00d4ff]/20 to-[#9c88ff]/20 border border-[#00d4ff]/50 p-2 sm:p-3 relative"
                     style={{borderRadius: '4px'}}>
                  <h4 className="text-[#00d4ff] text-center font-bold text-xs sm:text-sm font-mono tracking-wider mb-2 sm:mb-3" 
                      style={{textShadow: '0 0 6px rgba(0, 212, 255, 0.5)'}}>
                    {activeMainCategory === 'character' ? 'CHARACTER PREVIEW' : 'ITEM PREVIEW'}
                  </h4>
                  <div className="mx-auto bg-white/10 rounded flex items-center justify-center overflow-hidden p-4">
                    {activeMainCategory === 'character' && selectedItem ? (
                      // 캐릭터 프리뷰 표시
                      <div className="flex flex-col items-center space-y-2">
                        <div className="text-xs text-white/60 text-center">
                          {selectedItem.category === 'hair' ? '' :
                           selectedItem.category === 'top' ? '' :
                           selectedItem.category === 'bottom' ? '' : '캐릭터 미리보기'}
                        </div>
                        <CharacterPreview 
                          characterData={createCharacterPreview(selectedItem as CharacterItem)}
                          currentCharacterData={currentCharacterData}
                        />
                      </div>
                    ) : selectedItem.imageUrl ? (
                      // 일반 아이템 이미지 표시
                      <img 
                        src={selectedItem.imageUrl} 
                        alt={selectedItem.name}
                        style={{ imageRendering: 'pixelated' }}
                      />
                    ) : (
                      <span className="text-white/40 text-5xl">🖼️</span>
                    )}
                  </div>
                </div>
              </div>

              {/* 아이템 정보 */}
              <div className="space-y-2 sm:space-y-3 relative">
                <div className="bg-gradient-to-r from-[#00ff88]/20 to-[#00d4ff]/20 border border-[#00ff88]/50 p-2 sm:p-3 relative"
                     style={{borderRadius: '4px'}}>
                  <h4 className="text-[#00ff88] text-center font-bold text-xs sm:text-sm font-mono tracking-wider mb-2 sm:mb-3" 
                      style={{textShadow: '0 0 6px rgba(0, 255, 136, 0.5)'}}>
                    ITEM INFO
                  </h4>
                  <div className="space-y-2">
                    <div className="text-center">
                      <h5 className="text-white font-bold text-sm sm:text-base">{selectedItem.name}</h5>
                    </div>
                    {selectedItem.description && (
                      <p className="text-white/80 text-xs sm:text-sm text-center">{selectedItem.description}</p>
                    )}
                    <div className="text-center">
                      {/* 박스 금액 - 구매 완료되거나 배치 완료된 경우 숨김 */}
                      {!userInventory.some(invItem => 
                        (invItem.itemId === selectedItem.id || invItem.item?.id === selectedItem.id) && invItem.quantity > 0
                      ) && !placedItems.some(placedItem => placedItem.itemId === selectedItem.id) && (
                        <span className="text-yellow-400 font-bold text-xs sm:text-sm">📦 {(selectedItem.price || 0).toLocaleString()} 박스</span>
                      )}
                      {selectedItem.isAdminOnly && (
                        <div className="mt-2">
                          <span className="bg-red-500/20 text-red-400 text-xs px-2 py-1 rounded border border-red-500/30">
                            관리자 전용
                          </span>
                        </div>
                      )}
                    </div>
                    {placedItems.some(placedItem => placedItem.itemId === selectedItem.id) ? (
                      <div className="text-blue-400 text-xs sm:text-sm text-center">
                        배치완료
                      </div>
                    ) : userInventory.some(invItem => 
                      (invItem.itemId === selectedItem.id || invItem.item?.id === selectedItem.id) && invItem.quantity > 0
                    ) && (
                      <div className="text-green-400 text-xs sm:text-sm text-center">
                        구매완료
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* 구매 버튼 */}
              <div className="space-y-2 sm:space-y-3 relative">
                <div className="bg-gradient-to-r from-[#ffd93d]/20 to-[#ff6b6b]/20 border border-[#ffd93d]/50 p-2 sm:p-3 relative"
                     style={{borderRadius: '4px'}}>
                  <h4 className="text-[#ffd93d] text-center font-bold text-xs sm:text-sm font-mono tracking-wider mb-2 sm:mb-3" 
                      style={{textShadow: '0 0 6px rgba(255, 217, 61, 0.5)'}}>
                    PURCHASE
                  </h4>
                  <button
                    onClick={() => {
                      const { isInInventory, isPlaced, canAfford, isAdminOnly } = getItemStatus(selectedItem)
                      
                      if (!isInInventory && !isPlaced && canAfford && !isAdminOnly) {
                        const itemType = activeMainCategory === 'character' ? 'character' : 'decoration'
                        handlePurchase(selectedItem.id, itemType)
                        setShowItemDetail(false)
                      }
                    }}
                    disabled={userInventory.some(invItem => 
                      (invItem.itemId === selectedItem.id || invItem.item?.id === selectedItem.id) && invItem.quantity > 0
                    ) || placedItems.some(placedItem => placedItem.itemId === selectedItem.id) || userMoney < (selectedItem.price || 0) || selectedItem.isAdminOnly}
                    className={`w-full py-3 sm:py-4 transition-all duration-300 hover:scale-105 hover:shadow-lg relative font-mono tracking-wide ${
                      userInventory.some(invItem => 
                        (invItem.itemId === selectedItem.id || invItem.item?.id === selectedItem.id) && invItem.quantity > 0
                      )
                        ? 'bg-gradient-to-r from-[#00d4ff]/20 to-[#9c88ff]/20 border-2 border-[#00d4ff]/50 text-[#00d4ff] cursor-not-allowed' 
                        : placedItems.some(placedItem => placedItem.itemId === selectedItem.id)
                        ? 'bg-gradient-to-r from-[#3b82f6]/20 to-[#1d4ed8]/20 border-2 border-[#3b82f6]/50 text-[#3b82f6] cursor-not-allowed'
                        : (userMoney < (selectedItem.price || 0) || selectedItem.isAdminOnly)
                        ? 'bg-gradient-to-r from-[#ff6b6b]/20 to-[#ff4757]/20 border-2 border-[#ff6b6b]/50 text-[#ff6b6b] cursor-not-allowed'
                        : 'bg-gradient-to-r from-[#00ff88]/20 to-[#00d4ff]/20 border-2 border-[#00ff88]/50 hover:border-[#00ff88] text-[#00ff88] hover:text-white'
                    }`}
                    style={{
                      borderRadius: '6px',
                      textShadow: userInventory.some(invItem => 
                        (invItem.itemId === selectedItem.id || invItem.item?.id === selectedItem.id) && invItem.quantity > 0
                      )
                        ? '0 0 6px rgba(0, 212, 255, 0.5)' 
                        : (userMoney < (selectedItem.price || 0) || selectedItem.isAdminOnly)
                        ? '0 0 6px rgba(255, 107, 107, 0.5)'
                        : '0 0 6px rgba(0, 255, 136, 0.5)',
                      boxShadow: userInventory.some(invItem => 
                        (invItem.itemId === selectedItem.id || invItem.item?.id === selectedItem.id) && invItem.quantity > 0
                      )
                        ? '0 0 15px rgba(0, 212, 255, 0.2)' 
                        : (userMoney < (selectedItem.price || 0) || selectedItem.isAdminOnly)
                        ? '0 0 15px rgba(255, 107, 107, 0.2)'
                        : '0 0 15px rgba(0, 255, 136, 0.2)'
                    }}
                  >
                    <div className="flex items-center justify-center gap-1.5 sm:gap-2">
                      <div className={`w-2.5 h-2.5 sm:w-3 sm:h-3 border border-white ${
                        userInventory.some(invItem => 
                          (invItem.itemId === selectedItem.id || invItem.item?.id === selectedItem.id) && invItem.quantity > 0
                        ) ? 'bg-[#00d4ff]' : placedItems.some(placedItem => placedItem.itemId === selectedItem.id) ? 'bg-[#3b82f6]' : (userMoney < (selectedItem.price || 0) || selectedItem.isAdminOnly) ? 'bg-[#ff6b6b]' : 'bg-[#00ff88]'
                      }`} style={{borderRadius: '1px'}}></div>
                      <span className="text-sm sm:text-base font-mono tracking-wider">
                        {userInventory.some(invItem => 
                          (invItem.itemId === selectedItem.id || invItem.item?.id === selectedItem.id) && invItem.quantity > 0
                        ) ? '✅ 구매완료' : placedItems.some(placedItem => placedItem.itemId === selectedItem.id) ? '🏠 배치완료' : (userMoney < (selectedItem.price || 0) ? '📦 박스 부족' : selectedItem.isAdminOnly ? '제한됨' : '구매하기')}
                      </span>
                      <div className={`w-2.5 h-2.5 sm:w-3 sm:h-3 border border-white ${
                        userInventory.some(invItem => 
                          (invItem.itemId === selectedItem.id || invItem.item?.id === selectedItem.id) && invItem.quantity > 0
                        ) ? 'bg-[#00d4ff]' : placedItems.some(placedItem => placedItem.itemId === selectedItem.id) ? 'bg-[#3b82f6]' : (userMoney < (selectedItem.price || 0) || selectedItem.isAdminOnly) ? 'bg-[#ff6b6b]' : 'bg-[#00ff88]'
                      }`} style={{borderRadius: '1px'}}></div>
                    </div>
                    
                    {/* 버튼 모서리 픽셀 도트 */}
                    <div className={`absolute top-1 left-1 w-1 h-1 ${
                      userInventory.some(invItem => 
                        (invItem.itemId === selectedItem.id || invItem.item?.id === selectedItem.id) && invItem.quantity > 0
                      ) ? 'bg-[#00d4ff]' : (userMoney < (selectedItem.price || 0) || selectedItem.isAdminOnly) ? 'bg-[#ff6b6b]' : 'bg-[#00ff88]'
                    }`} style={{borderRadius: '1px'}}></div>
                    <div className={`absolute top-1 right-1 w-1 h-1 ${
                      userInventory.some(invItem => 
                        (invItem.itemId === selectedItem.id || invItem.item?.id === selectedItem.id) && invItem.quantity > 0
                      ) ? 'bg-[#00d4ff]' : (userMoney < (selectedItem.price || 0) || selectedItem.isAdminOnly) ? 'bg-[#ff6b6b]' : 'bg-[#00ff88]'
                    }`} style={{borderRadius: '1px'}}></div>
                    <div className={`absolute bottom-1 left-1 w-1 h-1 ${
                      userInventory.some(invItem => 
                        (invItem.itemId === selectedItem.id || invItem.item?.id === selectedItem.id) && invItem.quantity > 0
                      ) ? 'bg-[#00d4ff]' : (userMoney < (selectedItem.price || 0) || selectedItem.isAdminOnly) ? 'bg-[#ff6b6b]' : 'bg-[#00ff88]'
                    }`} style={{borderRadius: '1px'}}></div>
                    <div className={`absolute bottom-1 right-1 w-1 h-1 ${
                      userInventory.some(invItem => 
                        (invItem.itemId === selectedItem.id || invItem.item?.id === selectedItem.id) && invItem.quantity > 0
                      ) ? 'bg-[#00d4ff]' : (userMoney < (selectedItem.price || 0) || selectedItem.isAdminOnly) ? 'bg-[#ff6b6b]' : 'bg-[#00ff88]'
                    }`} style={{borderRadius: '1px'}}></div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// 캐릭터 프리뷰 컴포넌트
function CharacterPreview({ 
  characterData, 
  currentCharacterData 
}: { 
  characterData: any, 
  currentCharacterData: any 
}) {
  if (!characterData || !currentCharacterData) {
    return (
      <div className="w-20 h-20 flex items-center justify-center">
        <span className="text-white/40 text-sm">👤</span>
      </div>
    )
  }

  // 이미지 URL을 처리하는 함수
  const getImageSrc = (imageUrl: string) => {
    if (!imageUrl || imageUrl === 'none.png') return '/assets/character/none.png'
    
    // base64 이미지인 경우 직접 사용
    if (imageUrl.startsWith('data:image/')) return imageUrl
    
    // URL인 경우 직접 사용
    if (imageUrl.startsWith('http') || imageUrl.startsWith('/')) return imageUrl
    
    // 파일명인 경우 assets 폴더에서 찾기
    return `/assets/character/${imageUrl}`
  }

  console.log('🎨 CharacterPreview 렌더링:', {
    characterData: characterData.parts,
    currentCharacterData: currentCharacterData.parts
  })
  
  console.log('🔍 이미지 URL들:', {
    hair: characterData.parts.hair,
    top: characterData.parts.top,
    bottom: characterData.parts.bottom,
    emotion: characterData.parts.emotion
  })

  return (
    <div className="relative w-20 h-20">
      {/* 레이어 순서: 기본캐릭터 → 하의 → 상의 → 헤어 → 감정 */}
      
      {/* 1. 기본 캐릭터 베이스 (맨 아래) */}
      <img 
        src="/assets/character/default-character.png"
        alt="기본 캐릭터" 
        className="absolute w-full h-full object-contain"
        style={{ imageRendering: 'pixelated' }}
      />
      
      {/* 2. 하의 레이어 */}
      {characterData.parts.bottom && characterData.parts.bottom !== 'none.png' && (
        <img 
          src={getImageSrc(characterData.parts.bottom)}
          alt="하의" 
          className="absolute w-full h-full object-contain"
          style={{ 
            imageRendering: 'pixelated',
            zIndex: 1
          }}
          onError={(e) => {
            console.log('❌ 하의 이미지 로드 실패:', characterData.parts.bottom)
            e.currentTarget.style.display = 'none'
          }}
          onLoad={() => {
            console.log('✅ 하의 이미지 로드 성공:', characterData.parts.bottom)
          }}
        />
      )}
      
      {/* 3. 상의 레이어 */}
      {characterData.parts.top && characterData.parts.top !== 'none.png' && (
        <img 
          src={getImageSrc(characterData.parts.top)}
          alt="상의" 
          className="absolute w-full h-full object-contain"
          style={{ 
            imageRendering: 'pixelated',
            zIndex: 2
          }}
          onError={(e) => {
            console.log('❌ 상의 이미지 로드 실패:', characterData.parts.top)
            e.currentTarget.style.display = 'none'
          }}
          onLoad={() => {
            console.log('✅ 상의 이미지 로드 성공:', characterData.parts.top)
          }}
        />
      )}
      
      {/* 4. 헤어 레이어 (맨 위) */}
      {characterData.parts.hair && characterData.parts.hair !== 'none.png' && (
        <img 
          src={getImageSrc(characterData.parts.hair)}
          alt="헤어" 
          className="absolute w-full h-full object-contain"
          style={{ 
            imageRendering: 'pixelated',
            zIndex: 3
          }}
          onError={(e) => {
            console.log('❌ 헤어 이미지 로드 실패:', characterData.parts.hair)
            e.currentTarget.style.display = 'none'
          }}
          onLoad={() => {
            console.log('✅ 헤어 이미지 로드 성공:', characterData.parts.hair)
          }}
        />
      )}
      
      {/* 5. 감정 이모티콘 (최상위) */}
      {characterData.parts.emotion && characterData.parts.emotion !== 'none.png' && (
        <img 
          src={`/assets/character/emotions/${characterData.parts.emotion}`}
          alt="감정" 
          className="absolute w-full h-full object-contain"
          style={{ imageRendering: 'pixelated' }}
          onError={(e) => {
            console.log('❌ 감정 이미지 로드 실패:', characterData.parts.emotion)
            e.currentTarget.style.display = 'none'
          }}
          onLoad={() => {
            console.log('✅ 감정 이미지 로드 성공:', characterData.parts.emotion)
          }}
        />
      )}
      
    </div>
  )
}
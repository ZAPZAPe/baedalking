'use client'

import React, { useState, useCallback, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { RenderState, DecorationItem, InventoryItem, PlacedItem, FloorTileConfig, CharacterData } from '@/types'
import { DecorationDataStore } from '@/utils/decoration/dataStore'
import { useAuth } from '@/hooks/useAuth'
import { useAppState } from '@/hooks/useAppState'
import { loadFloorTileSettings, saveFloorTileSettings } from '@/lib/database'
import { supabase } from '@/lib/supabase'

// 컴포넌트 임포트
import DecorationCanvas from './DecorationCanvas'
import ShopPanel from './ShopPanel'
import InventoryPanel from './InventoryPanel'
import FloorTilePanel from './FloorTilePanel'
import PixelButton from '@/components/ui/PixelButton'
import CharacterCustomizePanel from '@/components/features/garage/modals/CharacterCustomizePanel'
import ShopItemDetailModal from './ShopItemDetailModal'

interface DecorationRendererProps {
  userId: string
  isOwner: boolean
  onNavigateBack?: () => void
  viewOnly?: boolean
}

export default function DecorationRenderer({ 
  userId,
  isOwner,
  onNavigateBack,
  viewOnly = false
}: DecorationRendererProps) {
  const router = useRouter()
  const { user } = useAuth()
  const { setSelectedShopItem, openModal, closeModal, activeModal, selectedShopItem } = useAppState()
  
  // 실제 로그인한 사용자의 ID 사용 (구매용)
  const currentUserId = user?.id || userId
  // 마운트 상태 추적
  const mountedRef = useRef<boolean>(false)
  // 최신 선택된 아이템 추적 (상태 업데이트 지연 문제 해결)
  const selectedItemRef = useRef<DecorationItem | null>(null)
  // 렌더링 상태
  const [renderState, setRenderState] = useState<RenderState>({
    currentMode: 'view',
    selectedItem: null,
    hoveredGrid: null,
    showGrid: false  // 🔧 그리드 숨김
  })

  // UI 상태
  const [activePanel, setActivePanel] = useState<'shop' | 'inventory' | 'floor' | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)
  
  // 캐릭터 상태
  const [characterData, setCharacterData] = useState<CharacterData | null>(null)
  const [showCharacterCustomize, setShowCharacterCustomize] = useState(false)
  const [showCharacter, setShowCharacter] = useState(true) // 캐릭터 표시/숨기기 상태

  // 데이터 상태
  const [storeItems, setStoreItems] = useState<DecorationItem[]>([])
  const [userInventory, setUserInventory] = useState<{ userId: string; items: InventoryItem[] }>({ userId, items: [] })
  const [placedItems, setPlacedItems] = useState<PlacedItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [userBoxes, setUserBoxes] = useState(0)
  
  // 바닥 타일 설정 상태 (데이터베이스에서 로드)
  const [floorTileConfig, setFloorTileConfig] = useState<FloorTileConfig>({
    type: 'default',
    pattern: 'checkerboard',
    lightColor: 0xD2B48C,
    darkColor: 0xA0522D,
    opacity: 0.8,
    scale: 1.0
  })

  // 바닥 타일 설정 변경 핸들러 (데이터베이스 저장 포함)
  const handleFloorTileConfigChange = async (newConfig: FloorTileConfig) => {
    console.log('🏗️ DecorationRenderer 바닥 타일 설정 변경:', newConfig)
    setFloorTileConfig(newConfig)
    
    // 데이터베이스에 저장
    try {
      const success = await saveFloorTileSettings(userId, newConfig)
      if (success) {
        console.log('💾 바닥 타일 설정 데이터베이스 저장 완료:', newConfig)
      } else {
        console.error('바닥 타일 설정 데이터베이스 저장 실패')
      }
    } catch (error) {
      console.error('바닥 타일 설정 저장 실패:', error)
    }
  }

  /**
   * 렌더링 상태 업데이트
   */
  const handleStateChange = useCallback((newState: Partial<RenderState>) => {
    setRenderState(prev => ({ ...prev, ...newState }))
  }, [])

  /**
   * 바닥 타일 설정 로드
   */
  const loadFloorTileConfig = useCallback(async () => {
    if (!mountedRef.current) return
    
    try {
      const config = await loadFloorTileSettings(userId)
      console.log('🏗️ 바닥 타일 설정 로드됨:', config)
      setFloorTileConfig(config)
    } catch (error) {
      console.error('바닥 타일 설정 로드 실패:', error)
    }
  }, [userId])

  /**
   * 캐릭터 데이터 로딩
   */
  const loadCharacterData = useCallback(async () => {
    if (!mountedRef.current) return
    
    try {
      const response = await fetch(`/api/character?userId=${userId}`)
      if (response.ok) {
        const data = await response.json()
        setCharacterData(data)
      }
    } catch (error) {
      console.error('캐릭터 데이터 로딩 실패:', error)
    }
  }, [userId])

  /**
   * 캐릭터 업데이트
   */
  const handleCharacterUpdate = useCallback((newCharacterData: CharacterData) => {
    setCharacterData(newCharacterData)
    // 캔버스에 캐릭터 다시 렌더링하도록 키 업데이트
    setRefreshKey(prev => prev + 1)
  }, [])

  /**
   * 데이터 로드
   */
  const loadData = useCallback(async () => {
    if (!mountedRef.current) return
    
    setIsLoading(true)
    try {

      // 캐릭터 데이터 로드
      await loadCharacterData()
      
      // 상점 아이템 로드 (데이터베이스에서)
      try {
        const { data: items, error: itemsError } = await supabase
          .from('decoration_items')
          .select('*')
          .eq('is_active', true)
          .order('category', { ascending: true })
          .order('name', { ascending: true })

        if (itemsError) {
          console.error('❌ 상점 아이템 로드 오류:', itemsError)
          setStoreItems([])
        } else {
          console.log('📦 데이터베이스에서 상점 아이템 로드됨:', items?.length || 0)
          // 데이터베이스 필드를 컴포넌트에서 사용하는 필드로 변환
          const transformedItems = (items || []).map(item => ({
            ...item,
            imageUrl: item.image_url, // image_url -> imageUrl 변환
            gridData: item.grid_data // grid_data -> gridData 변환
          }))
          setStoreItems(transformedItems)
        }
      } catch (error) {
        console.error('❌ 상점 아이템 로드 실패:', error)
        setStoreItems([])
      }

      // 사용자 인벤토리 로드 (데이터베이스에서)
      if (mountedRef.current && currentUserId) {
        try {
          console.log('🔍 인벤토리 로드 시작 - 사용자 ID:', currentUserId)
          
          const { data: inventory, error: inventoryError } = await supabase
            .from('user_inventory')
            .select(`
              *,
              decoration_items (
                id,
                name,
                description,
                image_url,
                category,
                price,
                anchor,
                grid_data
              )
            `)
            .eq('user_id', currentUserId)

          if (inventoryError) {
            console.error('❌ 사용자 인벤토리 로드 오류:', inventoryError)
            setUserInventory({ userId: currentUserId, items: [] })
          } else {
            console.log('📦 데이터베이스에서 사용자 인벤토리 로드됨:', inventory?.length || 0)
            console.log('📦 인벤토리 원본 데이터:', inventory)
            
            const inventoryItems = inventory?.map(item => {
              console.log('📦 인벤토리 아이템 처리:', {
                id: item.id,
                item_id: item.item_id,
                quantity: item.quantity,
                decoration_items: item.decoration_items
              })
              
              // decoration_items도 변환
              const transformedDecorationItem = item.decoration_items ? {
                ...item.decoration_items,
                imageUrl: item.decoration_items.image_url,
                gridData: item.decoration_items.grid_data
              } : null
              
              return {
                id: item.id,
                itemId: item.item_id,
                quantity: item.quantity,
                purchasedAt: item.purchased_at,
                item: transformedDecorationItem
              }
            }) || []
            
            console.log('📦 처리된 인벤토리 아이템들:', inventoryItems)
            setUserInventory({ userId: currentUserId, items: inventoryItems })
          }
        } catch (error) {
          console.error('❌ 사용자 인벤토리 로드 실패:', error)
          setUserInventory({ userId: currentUserId, items: [] })
        }
      }

      // 사용자 박스 수 로드 (박스 API 사용)
      if (mountedRef.current && currentUserId) {
        const boxesResponse = await fetch(`/api/boxes?userId=${currentUserId}`)
        const boxesData = await boxesResponse.json()
        
        if (mountedRef.current && boxesResponse.ok) {
          setUserBoxes(boxesData.totalBoxes || 0)

        }
      }

      // 배치된 아이템 로드 (데이터베이스에서)
      if (mountedRef.current && userId) {
        try {
          const { data: garage, error: garageError } = await supabase
            .from('garage_placements')
            .select(`
              id,
              user_id,
              item_id,
              position_x,
              position_y,
              position_z,
              placed_at,
              updated_at,
              decoration_items (
                id,
                name,
                description,
                image_url,
                category,
                anchor,
                grid_data
              )
            `)
            .eq('user_id', userId)

          if (garageError) {
            console.error('❌ 배치된 아이템 로드 오류:', garageError)
            setPlacedItems([])
          } else {
            console.log('🏠 데이터베이스에서 배치된 아이템 로드됨:', garage?.length || 0)
            const placedItemsData = garage?.map(item => {
              // decoration_items도 변환 (단일 객체로 조인됨)
              const decorationItem = item.decoration_items as any
              const transformedDecorationItem = decorationItem ? {
                ...decorationItem,
                imageUrl: decorationItem.image_url,
                gridData: decorationItem.grid_data
              } : null
              
              return {
                id: item.id,
                itemId: item.item_id,
                gridPosition: { 
                  x: item.position_x || 0, 
                  y: item.position_y || 0, 
                  z: item.position_z || 0 
                },
                placedAt: item.placed_at,
                updatedAt: item.updated_at,
                item: transformedDecorationItem
              }
            }) || []
            setPlacedItems(placedItemsData)
          }
        } catch (error) {
          console.error('❌ 배치된 아이템 로드 실패:', error)
          setPlacedItems([])
        }
      }
    } catch (error) {
      // 데이터 로드 실패
    } finally {
      if (mountedRef.current) {
        setIsLoading(false)
      }
    }
  }, [currentUserId])

  /**
   * 데이터 새로고침
   */
  const handleDataRefresh = useCallback(() => {
    loadData()
    setRefreshKey(prev => prev + 1)
    // 상태 초기화
    setRenderState(prev => ({
      ...prev,
      selectedItem: null,
      hoveredGrid: null
    }))
  }, [loadData])

  /**
   * 상점 아이템 클릭 핸들러
   */
  const handleShopItemClick = useCallback((item: DecorationItem) => {
    console.log('🛒 상점 아이템 클릭:', item.name, item)
    console.log('🛒 현재 activeModal:', activeModal)
    console.log('🛒 현재 selectedShopItem:', selectedShopItem)
    
    setSelectedShopItem(item)
    console.log('🛒 setSelectedShopItem 호출됨')
    
    // 약간의 지연을 두고 모달 열기 (상태 업데이트 보장)
    setTimeout(() => {
      console.log('🛒 openModal 호출:', 'shopItemDetail')
      openModal('shopItemDetail')
    }, 10)
  }, [setSelectedShopItem, openModal, activeModal, selectedShopItem])

  /**
   * 상점에서 아이템 구매
   */
  const handlePurchase = useCallback(async (itemId: string) => {
    if (!currentUserId) {
      alert('로그인이 필요합니다.')
      return
    }

    try {
      console.log('🛒 구매 시작:', { currentUserId, itemId, storeItems: storeItems.length })
      
      // 🔧 상점 아이템이 비어있으면 다시 로드 시도
      if (storeItems.length === 0) {
        console.log('🔄 상점 아이템이 비어있음, 다시 로드 시도...')
        try {
          const { data: items, error: itemsError } = await supabase
            .from('decoration_items')
            .select('*')
            .eq('is_active', true)
            .order('category', { ascending: true })
            .order('name', { ascending: true })

          if (itemsError) {
            console.error('❌ 상점 아이템 재로드 오류:', itemsError)
            alert('상점 아이템을 불러올 수 없습니다.')
            return
          } else {
            console.log('📦 상점 아이템 재로드 성공:', items?.length || 0)
            setStoreItems(items || [])
            
            // 재로드된 아이템에서 찾기
            const purchasedItem = (items || []).find(item => item.id === itemId)
            if (!purchasedItem) {
              console.error('❌ 재로드 후에도 아이템을 찾을 수 없습니다:', { itemId, items })
              alert('아이템을 찾을 수 없습니다.')
              return
            }
            
            // 구매 로직 계속 진행
            await processPurchase(purchasedItem, itemId)
            return
          }
        } catch (error) {
          console.error('❌ 상점 아이템 재로드 실패:', error)
          alert('상점 아이템을 불러올 수 없습니다.')
          return
        }
      }
      
      // 아이템 가격 정보 가져오기
      console.log('🔍 구매 시도 - storeItems:', storeItems)
      console.log('🔍 구매 시도 - itemId:', itemId)
      
      const purchasedItem = storeItems.find(item => item.id === itemId)
      console.log('🔍 찾은 아이템:', purchasedItem)
      
      if (!purchasedItem) {
        console.error('❌ 아이템을 찾을 수 없습니다:', { itemId, storeItems })
        alert('아이템을 찾을 수 없습니다.')
        return
      }
      
      // 구매 로직 실행
      await processPurchase(purchasedItem, itemId)
      
    } catch (error) {
      console.error('❌ 구매 처리 중 오류:', error)
      alert('구매 중 오류가 발생했습니다.')
    }
  }, [currentUserId, storeItems])

  /**
   * 실제 구매 처리 로직
   */
  const processPurchase = async (purchasedItem: any, itemId: string) => {
    try {
      
      const itemPrice = purchasedItem.price || 0
      
      if (itemPrice <= 0) {
        alert('아이템 가격이 설정되지 않았습니다.')
        return
      }
      
      console.log('💰 아이템 정보:', { purchasedItem, itemPrice })

      const requestBody = {
        userId: currentUserId,
        itemId,
        quantity: 1,
        price: itemPrice
      }
      
      console.log('📤 전송할 데이터:', requestBody)

      const response = await fetch('/api/decoration/purchase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      })

      const data = await response.json()
      
      if (response.ok) {
        console.log('✅ 구매 성공:', data)
        alert(`✅ "${purchasedItem.name}" 구매 완료!`)
        
        // 구매 후 즉시 인벤토리 패널로 이동
        setActivePanel('inventory')
        
        // 데이터베이스에서 최신 데이터 새로고침 (즉시)
        console.log('🔄 구매 후 데이터 새로고침 시작...')
        await loadData()
        console.log('✅ 구매 후 데이터 새로고침 완료!')
      } else {
        console.error('❌ 구매 실패:', data)
        alert(`구매 실패: ${data.message || '알 수 없는 오류'}`)
      }
    } catch (error) {
      console.error('❌ 구매 처리 중 오류:', error)
      alert('구매 중 오류가 발생했습니다.')
    }
  }

  /**
   * 모바일 드래그 배치 모드 시작
   */
  const handleMobileDragStart = useCallback((item: DecorationItem) => {
    // 모바일에서 아이템 선택 시 드래그 배치 모드 시작
    selectedItemRef.current = item
    // 모바일에서도 selectedItem을 설정하여 배치 모드 활성화
    handleStateChange({
      selectedItem: item,
      currentMode: 'edit'
    })
  }, [handleStateChange])

  /**
   * 인벤토리에서 아이템 선택
   */
  const handleItemSelect = useCallback((item: DecorationItem) => {
    selectedItemRef.current = item // ref에도 저장
    
    // 모바일 환경에서는 드래그 배치 모드 시작
    if (typeof window !== 'undefined' && window.innerWidth <= 768) {
      handleMobileDragStart(item)
      return
    }
    
    handleStateChange({
      selectedItem: item,
      currentMode: 'edit'
    })
  }, [handleStateChange, handleMobileDragStart])

  /**
   * 아이템 선택 해제
   */
  const handleItemDeselect = useCallback(() => {
    selectedItemRef.current = null // ref도 초기화
    handleStateChange({
      selectedItem: null,
      hoveredGrid: null,
      currentMode: 'view'
    })
  }, [handleStateChange])

  /**
   * 배치된 아이템 재선택 핸들러
   */
  const handlePlacedItemReselect = useCallback((placedItem: PlacedItem) => {
    // 해당 아이템을 상점에서 찾기
    const storeItem = storeItems.find(item => item.id === placedItem.itemId)
    
    if (storeItem) {
      // 배치 모드로 전환
      handleStateChange({ 
        currentMode: 'edit',
        selectedItem: storeItem
      })
      // 인벤토리 패널로 전환
      setActivePanel('inventory')
    }
  }, [storeItems, handleStateChange])

  /**
   * 배치된 아이템 제거 (차고에서 제거 → 인벤토리로 복귀)
   */
  const handleRemoveItem = useCallback(async (placedItem: PlacedItem) => {
    if (!userId) {
      return
    }

    try {
      const dataStore = DecorationDataStore.getInstance()
      const success = await dataStore.removeItem(userId, placedItem.id)
      
      if (success) {
        // 데이터 새로고침
        await loadData()
        
        // 성공 알림
        const removedItem = storeItems.find(item => item.id === placedItem.itemId)
        alert(`${removedItem?.name || '아이템'} 제거 완료! 인벤토리로 복귀했습니다.`)
      } else {
        alert('아이템 제거에 실패했습니다.')
      }
    } catch (error) {
      alert('아이템 제거 중 오류가 발생했습니다.')
    }
  }, [userId, storeItems, loadData])



  // 마운트 상태 관리
  useEffect(() => {
    mountedRef.current = true
    
    return () => {
      mountedRef.current = false
    }
  }, [])

  // 초기 데이터 로드
  useEffect(() => {
    if (mountedRef.current) {
      loadData()
      loadFloorTileConfig()
    }
  }, [loadData, loadFloorTileConfig])

  // 보기 모드에서는 편집 화면 그대로 사용하되 편집 기능만 비활성화

  // 로딩 상태 처리
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="text-4xl mb-4">🔄</div>
          <div className="text-lg">3D 꾸미기 시스템 로딩 중...</div>
          <div className="text-sm text-white/60 mt-2">잠시만 기다려주세요</div>
        </div>
      </div>
    )
  }

  return (
    <div className={viewOnly ? "w-full h-full bg-transparent" : "min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-white"}>
      {/* 📱 모바일 헤더 */}
      {!viewOnly && (
        <header className="bg-black/30 backdrop-blur-lg border-b border-[#00ff88]/20 p-4">
          <div className="flex items-center justify-between max-w-md mx-auto">
            <PixelButton 
              onClick={onNavigateBack}
              variant="secondary"
              size="sm"
              className="w-10 h-10 p-0 flex items-center justify-center"
            >
              🏠
            </PixelButton>
            <h1 className="text-lg font-bold text-[#00ff88]">미니차고 꾸미기</h1>
            <div className="h-10 px-3 flex items-center justify-center text-xs bg-gradient-to-br from-[#1a1a2e]/80 to-[#16213e]/80 border-2 border-[#ffd93d]/40"
              style={{borderRadius: '6px'}}
            >
              <div className="flex items-center gap-2">
                <span className="text-[#ffd93d]">📦</span>
                <span className="text-[#ffd93d] text-[10px] leading-none font-bold" style={{textShadow: '0 0 6px rgba(255, 217, 61, 0.5)'}}>{userBoxes.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </header>
      )}

      {/* 📱 메인 컨테이너 */}
      <div className={viewOnly ? "w-full h-full" : "flex-1 max-w-7xl mx-auto w-full px-2 sm:px-4"}>
        {/* 꾸미기 섹션 */}
        <section className={viewOnly ? "w-full h-full bg-transparent" : "bg-white/5 backdrop-blur-sm rounded-xl shadow-xl my-4 pt-4 pb-4"}>
          {/* 섹션 헤더 */}
          {!viewOnly && (
            <div className="px-4 py-1">
              <h2 className="text-lg font-semibold text-white flex items-center justify-center gap-2">
                <span className="text-sm text-white/60 font-normal">
                  {renderState.currentMode === 'view' ? '보기 모드' : '편집 모드'}
                </span>
                {!isOwner && (
                  <span className="text-xs text-yellow-400 bg-yellow-500/20 px-2 py-1 rounded">
                    읽기 전용
                  </span>
                )}
              </h2>
            </div>
          )}

          {/* 캔버스 영역 */}
          {viewOnly ? (
            // 보기 모드: 고정 크기로 깔끔하게
            <div className="relative w-full h-full flex items-center justify-center">
              <DecorationCanvas
                key={refreshKey}
                width={320}
                height={240}
                renderState={renderState}
                onStateChange={handleStateChange}
                userId={userId}
                isOwner={isOwner}
                selectedItemRef={selectedItemRef}
                className="shadow-2xl rounded-xl"
                storeItems={storeItems}
                characterData={showCharacter ? characterData : null}
                placedItems={placedItems}
                isViewMode={viewOnly}
                onPlacedItemsUpdate={setPlacedItems}
                onMobileDragStart={handleMobileDragStart}
                floorTileConfig={floorTileConfig}
              />
            </div>
          ) : (
            // 편집 모드: 기존과 동일
            <div className="flex items-center justify-center px-4 pt-0 pb-2 relative min-h-[300px]">
              <DecorationCanvas
                key={refreshKey}
                width={Math.min(typeof window !== 'undefined' ? window.innerWidth - 64 : 400, 700)}
                height={Math.min(typeof window !== 'undefined' ? window.innerHeight - 500 : 300, 600)}
                renderState={renderState}
                onStateChange={handleStateChange}
                userId={userId}
                isOwner={isOwner}
                selectedItemRef={selectedItemRef}
                className="shadow-xl rounded-lg max-w-full max-h-full"
                storeItems={storeItems}
                characterData={showCharacter ? characterData : null}
                placedItems={placedItems}
                isViewMode={viewOnly}
                onPlacedItemsUpdate={setPlacedItems}
                onMobileDragStart={handleMobileDragStart}
                floorTileConfig={floorTileConfig}
              />
            </div>
          )}
            
            {/* 선택된 아이템 표시 */}
            {!viewOnly && renderState.selectedItem && (
              <div className="absolute top-16 left-1/2 transform -translate-x-1/2 bg-black/40 backdrop-blur-sm rounded-lg px-3 py-2 border border-green-400/50">
                <div className="text-sm text-green-400 font-medium text-center">📦 {renderState.selectedItem.name}</div>
                <div className="text-xs text-white/60 text-center whitespace-nowrap">원하시는 위치에 아이템을 배치하세요!</div>
              </div>
            )}

          {/* 하단 버튼들 (소유자만) */}
          {isOwner && !viewOnly && (
            <div className="flex gap-2 px-4 py-3 pb-2">
              <PixelButton
                onClick={() => setActivePanel('shop')}
                variant={activePanel === 'shop' ? 'primary' : 'secondary'}
                size="sm"
                className="flex-1"
              >
                🛒 상점
              </PixelButton>
              
              <PixelButton
                onClick={() => setActivePanel('inventory')}
                variant={activePanel === 'inventory' ? 'success' : 'secondary'}
                size="sm"
                className="flex-1"
              >
                🎒 인벤토리
              </PixelButton>
              
              <PixelButton
                onClick={() => setActivePanel('floor')}
                variant={activePanel === 'floor' ? 'danger' : 'secondary'}
                size="sm"
                className="flex-1"
              >
                🏗️ 타일
              </PixelButton>
            </div>
          )}

          {/* 캐릭터 관련 버튼들 */}
          {isOwner && !viewOnly && (
            <div className="flex justify-center gap-2 mb-4">
              <PixelButton
                onClick={() => setShowCharacterCustomize(true)}
                variant="primary"
                size="sm"
                className="px-4"
              >
                👤 캐릭터 커스터마이즈
              </PixelButton>
              <PixelButton
                onClick={() => {
                  console.log('🔄 캐릭터 표시 상태 변경:', showCharacter, '->', !showCharacter)
                  setShowCharacter(!showCharacter)
                  setRefreshKey(prev => prev + 1) // 캔버스 강제 리렌더링
                }}
                variant={showCharacter ? "secondary" : "success"}
                size="sm"
                className="px-4"
              >
                {showCharacter ? "🙈 캐릭터 숨기기" : "👁️ 캐릭터 보이기"}
              </PixelButton>
            </div>
          )}

          {/* 선택된 패널 표시 */}
          {isOwner && !viewOnly && activePanel !== null && (
            <>
              <ShopPanel
                items={storeItems}
                onPurchase={handlePurchase}
                userMoney={userBoxes}
                userInventory={userInventory.items}
                placedItems={placedItems}
                isVisible={activePanel === 'shop'}
                isLoading={isLoading}
                onItemClick={handleShopItemClick}
              />

              <InventoryPanel
                inventoryItems={userInventory.items}
                storeItems={storeItems}
                placedItems={placedItems}
                selectedItemId={renderState.selectedItem?.id || null}
                onItemSelect={handleItemSelect}
                onItemDeselect={handleItemDeselect}
                onRemoveItem={handleRemoveItem}
                onPlacedItemReselect={handlePlacedItemReselect}
                isVisible={activePanel === 'inventory'}
                isLoading={isLoading}
              />

              <FloorTilePanel
                currentConfig={floorTileConfig}
                onConfigChange={handleFloorTileConfigChange}
                isVisible={activePanel === 'floor'}
              />
            </>
          )}

          {/* 비소유자를 위한 안내 */}
          {!isOwner && !viewOnly && (
            <div className="px-4 pb-4">
              <div className="bg-blue-500/20 border border-blue-500/30 rounded-lg p-3 text-center">
                <div className="text-blue-400 text-sm font-medium">👁️ 구경 모드</div>
                <div className="text-blue-300 text-xs mt-1">
                  이 차고의 3D 꾸미기를 구경하고 있습니다
                </div>
              </div>
            </div>
          )}
        </section>
      </div>


      {/* 캐릭터 커스터마이즈 패널 */}
      <CharacterCustomizePanel
        isOpen={showCharacterCustomize}
        onClose={() => setShowCharacterCustomize(false)}
        userId={userId}
        currentCharacterData={characterData}
        onCharacterUpdate={handleCharacterUpdate}
      />

      {/* 상점 아이템 모달 */}
      <ShopItemDetailModal
        isOpen={activeModal === 'shopItemDetail'}
        onClose={() => {
          setSelectedShopItem(null)
          closeModal()
        }}
        item={selectedShopItem}
        userMoney={userBoxes}
        userInventory={userInventory.items}
        placedItems={placedItems}
        onPurchase={handlePurchase}
      />
    </div>
  )
}

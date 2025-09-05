'use client'

import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { RenderState, DecorationItem, InventoryItem, PlacedItem, FloorTileConfig, CharacterData } from '@/types'
import { DecorationDataStore } from '@/utils/decoration/dataStore'
import { useAuth } from '@/hooks/useAuth'
import { useAppState } from '@/hooks/useAppState'
import { loadFloorTileSettings, saveFloorTileSettings } from '@/lib/database'
import { supabase } from '@/lib/supabase'

// 컴포넌트 임포트
import DecorationCanvas from './DecorationCanvas'
import InventoryPanel from './InventoryPanel'
import FloorTilePanel from './FloorTilePanel'
import PixelButton from '@/components/ui/PixelButton'

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
  const { openModal, closeModal, activeModal } = useAppState()
  
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
  // 캐릭터 표시/숨기기 상태 제거됨

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
  
  // 하이라이트 상태 (제거된 아이템 표시용)
  const [highlightedItemId, setHighlightedItemId] = useState<string | null>(null)
  
  // 활성화된 배치 아이템 상태 (드래그 모드용)
  const [activePlacedItemId, setActivePlacedItemId] = useState<string | null>(null)
  const [isDraggingPlacedItem, setIsDraggingPlacedItem] = useState(false)
  
  // 드래그 완료 콜백 참조
  const dragCompleteCallbackRef = useRef<((newPosition: { x: number; y: number; z: number }) => void) | null>(null)

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
      
      // 상점 아이템 로드 (데이터베이스에서) - 미니차고 아이템만
      try {
        const { data: items, error: itemsError } = await supabase
          .from('shop_items')
          .select('*')
          .eq('is_active', true)
          .eq('main_category', 'garage') // 🔧 미니차고 아이템만 필터링
          .order('sub_category', { ascending: true })
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
          
          console.log('🔍 StoreItems 변환 결과:', {
            originalItems: items?.slice(0, 2), // 처음 2개만 로그
            transformedItems: transformedItems.slice(0, 2), // 처음 2개만 로그
            hasId: transformedItems.every(item => !!item.id)
          })
          
          console.log('🔍 StoreItems ID 확인:', transformedItems.map(item => ({
            id: item.id,
            name: item.name,
            hasId: !!item.id
          })))
          
          setStoreItems(transformedItems)
        }
      } catch (error) {
        console.error('❌ 상점 아이템 로드 실패:', error)
        setStoreItems([])
      }

      // 사용자 인벤토리 로드 (데이터베이스에서) - 미니차고 아이템만
      if (mountedRef.current && currentUserId) {
        try {
          console.log('🔍 인벤토리 로드 시작 - 사용자 ID:', currentUserId)
          
          const { data: inventory, error: inventoryError } = await supabase
            .from('user_inventory')
            .select(`
              *,
              shop_items (
                id,
                name,
                description,
                image_url,
                main_category,
                sub_category,
                price,
                anchor,
                grid_data,
                pixel_data
              )
            `)
            .eq('user_id', currentUserId)
            .eq('shop_items.is_active', true)
            .eq('shop_items.main_category', 'garage') // 🔧 미니차고 아이템만 필터링

          if (inventoryError) {
            console.error('❌ 사용자 인벤토리 로드 오류:', inventoryError)
            setUserInventory({ userId: currentUserId, items: [] })
          } else {
            console.log('📦 데이터베이스에서 사용자 인벤토리 로드됨:', inventory?.length || 0)
            console.log('📦 인벤토리 원본 데이터:', inventory)
            
            const inventoryItems = inventory?.filter(item => {
              // shop_items가 null이거나 undefined인 경우 필터링
              if (!item.shop_items) {
                console.log('⚠️ shop_items가 null인 아이템 필터링:', item.id, item.item_id)
                return false
              }
              return true
            }).map(item => {
              console.log('📦 인벤토리 아이템 처리:', {
                id: item.id,
                item_id: item.item_id,
                quantity: item.quantity,
                shop_items: item.shop_items
              })
              
              // shop_items도 변환 (이미 null 체크 완료)
              const transformedShopItem = {
                ...item.shop_items,
                imageUrl: item.shop_items.image_url,
                gridData: item.shop_items.grid_data,
                pixelData: item.shop_items.pixel_data,
                subCategory: item.shop_items.sub_category,
                mainCategory: item.shop_items.main_category
              }
              
              return {
                id: item.id,
                itemId: item.item_id,
                quantity: item.quantity,
                purchasedAt: item.purchased_at,
                item: transformedShopItem
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
              shop_items (
                id,
                name,
                description,
                image_url,
                main_category,
                sub_category,
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
              // shop_items도 변환 (단일 객체로 조인됨)
              const shopItem = item.shop_items as any
              const transformedShopItem = shopItem ? {
                ...shopItem,
                imageUrl: shopItem.image_url,
                gridData: shopItem.grid_data,
                subCategory: shopItem.sub_category,
                mainCategory: shopItem.main_category
              } : null
              
              return {
                id: item.id,
                userId: item.user_id,
                itemId: item.item_id,
                position_x: item.position_x || 0,
                position_y: item.position_y || 0,
                position_z: item.position_z || 0,
                placed_at: item.placed_at,
                updated_at: item.updated_at,
                item: transformedShopItem
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
        // 로딩 없이 즉시 상태 업데이트
        setPlacedItems(prev => prev.filter(item => item.id !== placedItem.id))
        
        // 성공 알림 (간단한 토스트 메시지로 변경)
        const removedItem = storeItems.find(item => item.id === placedItem.itemId)
        console.log(`✅ ${removedItem?.name || '아이템'} 제거 완료! 인벤토리로 복귀했습니다.`)
        
        // 인벤토리에서 해당 아이템 하이라이트
        if (removedItem) {
          setHighlightedItemId(removedItem.id)
          // 2초 후 하이라이트 제거
          setTimeout(() => {
            setHighlightedItemId(null)
          }, 2000)
        }
      } else {
        console.error('아이템 제거에 실패했습니다.')
      }
    } catch (error) {
      console.error('아이템 제거 중 오류가 발생했습니다:', error)
    }
  }, [userId, storeItems])

  /**
   * 배치된 아이템 클릭 핸들러 (활성화/드래그 모드)
   */
  const handlePlacedItemClick = useCallback((placedItem: PlacedItem) => {
    console.log('🎯 배치된 아이템 클릭됨:', placedItem.id)
    
    if (activePlacedItemId === placedItem.id) {
      // 이미 활성화된 아이템을 다시 클릭하면 드래그 모드 종료
      setActivePlacedItemId(null)
      setIsDraggingPlacedItem(false)
      console.log('🔄 드래그 모드 종료')
    } else {
      // 새로운 아이템 활성화
      setActivePlacedItemId(placedItem.id)
      setIsDraggingPlacedItem(true)
      console.log('🟢 아이템 활성화, 드래그 모드 시작:', placedItem.id)
    }
  }, [activePlacedItemId])

  /**
   * 활성화된 아이템 드래그 완료 핸들러
   */
  const handlePlacedItemDragComplete = useCallback(async (newPosition: { x: number; y: number; z: number }) => {
    if (!activePlacedItemId || !userId) return

    try {
      const dataStore = DecorationDataStore.getInstance()
      const success = await dataStore.updateItemPosition(userId, activePlacedItemId, newPosition)
      
      if (success) {
        // 상태 업데이트
        setPlacedItems(prev => prev.map(item => 
          item.id === activePlacedItemId 
            ? { ...item, position_x: newPosition.x, position_y: newPosition.y, position_z: newPosition.z, gridPosition: newPosition }
            : item
        ))
        
        console.log('✅ 아이템 위치 업데이트 완료:', newPosition)
      }
    } catch (error) {
      console.error('아이템 위치 업데이트 실패:', error)
    } finally {
      // 드래그 모드 종료
      setActivePlacedItemId(null)
      setIsDraggingPlacedItem(false)
    }
  }, [activePlacedItemId, userId])

  // 드래그 완료 콜백 설정
  useEffect(() => {
    dragCompleteCallbackRef.current = handlePlacedItemDragComplete
  }, [handlePlacedItemDragComplete])



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
      <div className="w-full min-h-[100dvh] bg-[#1a1a2e] flex flex-col relative"
        style={{ minHeight: '100dvh' }}>
        
        {/* 전체 도트 패턴 오버레이 */}
        <div 
          className="absolute inset-0 z-[1] opacity-[0.03]"
          style={{
            backgroundImage: `radial-gradient(circle, #ffffff 1px, transparent 1px)`,
            backgroundSize: '20px 20px'
          }}
        />
        
        <div className="flex items-center justify-center flex-1 relative z-10">
          <div className="text-center text-white">
            <div className="text-4xl mb-4">🔄</div>
            <div className="text-lg">3D 꾸미기 시스템 로딩 중...</div>
            <div className="text-sm text-white/60 mt-2">잠시만 기다려주세요</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={viewOnly ? "w-full h-full bg-transparent" : "w-full min-h-[100dvh] bg-[#1a1a2e] flex flex-col relative text-white"}
      style={{ minHeight: '100dvh' }}>
      
      {/* 전체 도트 패턴 오버레이 */}
      {!viewOnly && (
        <div 
          className="absolute inset-0 z-[1] opacity-[0.03]"
          style={{
            backgroundImage: `radial-gradient(circle, #ffffff 1px, transparent 1px)`,
            backgroundSize: '20px 20px'
          }}
        />
      )}

      {/* 📱 모바일 헤더 */}
      {!viewOnly && (
        <header className="bg-black/30 backdrop-blur-lg border-b border-[#00ff88]/20 p-4 relative z-10">
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
            <button
              onClick={() => router.push('/shop')}
              className="h-10 px-3 flex items-center justify-center text-xs bg-gradient-to-br from-[#1a1a2e]/80 to-[#16213e]/80 border-2 border-[#ffd93d]/40 hover:border-[#ffd93d]/70 transition-all duration-300 hover:scale-105 hover:shadow-lg relative group backdrop-blur-sm"
              style={{borderRadius: '6px'}}
            >
              <div className="flex items-center gap-2">
                <span className="text-[#ffd93d]">📦</span>
                <span className="text-[#ffd93d] text-[10px] leading-none font-bold" style={{textShadow: '0 0 6px rgba(255, 217, 61, 0.5)'}}>{userBoxes.toLocaleString()}</span>
              </div>

              {/* 호버 글로우 */}
              <div className="absolute inset-0 bg-gradient-to-r from-[#ffd93d]/0 via-[#ffd93d]/10 to-[#ffd93d]/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" 
                   style={{borderRadius: '6px'}}></div>
            </button>
          </div>
        </header>
      )}

      {/* 📱 메인 컨테이너 */}
      <div className={viewOnly ? "w-full h-full" : "flex-1 relative z-10 flex flex-col"}>
        <div className={viewOnly ? "w-full h-full" : "flex-1 relative bg-gradient-to-b from-[#0f0f23] to-[#1a1a2e] scroll-container"}>
          <div className={viewOnly ? "w-full h-full" : "p-2 sm:p-3 lg:p-4 pb-24"}>
            <div className={viewOnly ? "w-full h-full" : "max-w-md mx-auto w-full space-y-2 sm:space-y-3 lg:space-y-4"}>
              
              {/* 꾸미기 섹션 */}
              <section className={viewOnly ? "w-full h-full bg-transparent" : "bg-gradient-to-br from-[#1a4a2e]/90 to-[#1a1a2e]/90 backdrop-blur-lg rounded-2xl p-2 sm:p-3 lg:p-4 border border-[#00ff88]/20 shadow-2xl"}>
                {/* 섹션 헤더 */}
                {!viewOnly && (
                  <div className="px-4 py-1 mb-2">
                    <h2 className="text-lg font-semibold text-white flex items-center justify-center gap-2">
                      <span className="text-sm text-white/60 font-normal">
                        {renderState.currentMode === 'view' ? '' : '편집 모드'}
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
                      characterData={characterData}
                      placedItems={placedItems}
                      isViewMode={viewOnly}
                      onPlacedItemsUpdate={setPlacedItems}
                      onMobileDragStart={handleMobileDragStart}
                      floorTileConfig={floorTileConfig}
                      onPlacedItemClick={handlePlacedItemClick}
                      activeItemId={activePlacedItemId}
                      onDragComplete={dragCompleteCallbackRef.current}
                    />
                  </div>
                ) : (
                  // 편집 모드: 메인 페이지 스타일 적용
                  <div className="relative bg-gradient-to-b from-[#2d3748] to-[#1a202c] rounded-xl p-3 sm:p-4 lg:p-5 mb-2 sm:mb-3 lg:mb-4 border border-[#00ff88]/30 shadow-inner">
                    <div className="flex items-center justify-center relative min-h-[300px]">
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
                        characterData={characterData}
                        placedItems={placedItems}
                        isViewMode={viewOnly}
                        onPlacedItemsUpdate={setPlacedItems}
                        onMobileDragStart={handleMobileDragStart}
                        floorTileConfig={floorTileConfig}
                        onPlacedItemClick={handlePlacedItemClick}
                        activeItemId={activePlacedItemId}
                        onDragComplete={dragCompleteCallbackRef.current}
                      />
                    </div>
                    
                    {/* 꾸미기 공간 테두리 효과 */}
                    <div className="absolute inset-0 rounded-xl border-2 border-[#00ff88]/20 pointer-events-none"></div>
                    
                    {/* 코너 장식 */}
                    <div className="absolute top-2 left-2 w-4 h-4 border-l-2 border-t-2 border-[#00ff88]/60 rounded-tl-lg"></div>
                    <div className="absolute top-2 right-2 w-4 h-4 border-r-2 border-t-2 border-[#00ff88]/60 rounded-tr-lg"></div>
                    <div className="absolute bottom-2 left-2 w-4 h-4 border-l-2 border-b-2 border-[#00ff88]/60 rounded-bl-lg"></div>
                    <div className="absolute bottom-2 right-2 w-4 h-4 border-r-2 border-b-2 border-[#00ff88]/60 rounded-br-lg"></div>
                  </div>
                )}
                  
                  {/* 선택된 아이템 표시 */}
                  {!viewOnly && renderState.selectedItem && (
                    <div className="absolute top-16 left-1/2 transform -translate-x-1/2 bg-black/40 backdrop-blur-sm rounded-lg px-3 py-2 border border-green-400/50 z-20">
                      <div className="text-sm text-green-400 font-medium text-center">📦 {renderState.selectedItem.name}</div>
                      <div className="text-xs text-white/60 text-center whitespace-nowrap">원하시는 위치에 아이템을 배치하세요!</div>
                    </div>
                  )}

                  {/* 활성화된 배치 아이템 표시 */}
                  {!viewOnly && activePlacedItemId && (
                    <div className="absolute top-16 left-1/2 transform -translate-x-1/2 bg-black/40 backdrop-blur-sm rounded-lg px-3 py-2 border border-blue-400/50 z-20">
                      <div className="text-sm text-blue-400 font-medium text-center">🟢 아이템 활성화됨</div>
                      <div className="text-xs text-white/60 text-center whitespace-nowrap">
                        {isDraggingPlacedItem ? '드래그하여 이동하세요!' : '다시 클릭하여 드래그 모드를 시작하세요!'}
                      </div>
                    </div>
                  )}

                {/* 하단 버튼들 (소유자만) */}
                {isOwner && !viewOnly && (
                  <div className="flex gap-2 px-4 py-3 pb-2">
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

                {/* 캐릭터 표시/숨기기 버튼 제거됨 */}

                {/* 선택된 패널 표시 */}
                {isOwner && !viewOnly && activePanel !== null && (
                  <>
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
                      highlightedItemId={highlightedItemId}
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
          </div>
        </div>
      </div>
    </div>
  )
}

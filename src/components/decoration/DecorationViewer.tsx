'use client'

import React, { useState, useCallback, useEffect, useRef } from 'react'
import { DecorationItem, PlacedItem } from '@/types'
import { supabase } from '@/lib/supabase'
import DecorationCanvas from './DecorationCanvas'

interface DecorationViewerProps {
  userId: string
  isOwner: boolean
}

export default function DecorationViewer({ 
  userId,
  isOwner
}: DecorationViewerProps) {
  // 마운트 상태 추적
  const mountedRef = useRef<boolean>(false)
  
  // 데이터 상태
  const [storeItems, setStoreItems] = useState<DecorationItem[]>([])
  const [placedItems, setPlacedItems] = useState<PlacedItem[]>([])
  const [isLoading, setIsLoading] = useState(true)

  /**
   * 데이터 로드
   */
  const loadData = useCallback(async () => {
    if (!mountedRef.current) return
    
    setIsLoading(true)
    try {
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
          setStoreItems(items || [])
        }
      } catch (error) {
        console.error('❌ 상점 아이템 로드 실패:', error)
        setStoreItems([])
      }

      // 배치된 아이템 로드 (새로운 테이블 구조에서)
      if (mountedRef.current && userId) {
        try {
          const { data: garage, error: garageError } = await supabase
            .from('garage_placements_detailed')
            .select('*')
            .eq('user_id', userId)

          if (garageError) {
            console.error('❌ 배치된 아이템 로드 오류:', garageError)
            setPlacedItems([])
          } else {
            console.log('🏠 데이터베이스에서 배치된 아이템 로드됨:', garage?.length || 0)
            const placedItemsData = garage?.map(item => ({
              id: item.id,
              userId: item.user_id,
              itemId: item.item_id,
              position_x: item.position_x,
              position_y: item.position_y,
              position_z: item.position_z,
              placed_at: item.placed_at,
              updated_at: item.updated_at,
              gridPosition: {
                x: item.position_x,
                y: item.position_y,
                z: item.position_z
              },
              item: {
                id: item.item_id,
                name: item.item_name,
                description: item.item_description,
                imageUrl: item.item_image_url,
                category: item.item_category,
                anchor: item.item_anchor,
                gridData: item.item_grid_data
              }
            })) || []
            setPlacedItems(placedItemsData as unknown as PlacedItem[])
          }
        } catch (error) {
          console.error('❌ 배치된 아이템 로드 실패:', error)
          setPlacedItems([])
        }
      }
    } catch (error) {
      // 데이터 로드 실패 처리
    } finally {
      if (mountedRef.current) {
        setIsLoading(false)
      }
    }
  }, [userId])

  // 컴포넌트 마운트/언마운트 처리
  useEffect(() => {
    mountedRef.current = true
    loadData()
    
    return () => {
      mountedRef.current = false
    }
  }, [loadData])

  if (isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-900 rounded-lg">
        <div className="text-white text-sm">로딩 중...</div>
      </div>
    )
  }

  return (
    <div className="w-full h-full relative">
      <DecorationCanvas
        userId={userId}
        storeItems={storeItems}
        placedItems={placedItems}
        isViewMode={true}
        isOwner={isOwner}
        onItemClick={() => {}} // 보기 모드에서는 클릭 이벤트 무시
      />
      
      {/* 디버깅용 정보 */}
      <div className="absolute bottom-2 left-2 text-white text-xs bg-black/50 px-2 py-1 rounded">
        상점: {storeItems.length}개, 배치: {placedItems.length}개
      </div>
      
      {/* 편집 버튼 (소유자인 경우에만 표시) */}
      {isOwner && (
        <div className="absolute top-2 right-2 z-50">
          <button
            onClick={() => {
              window.location.href = `/garage/${userId}?mode=decoration`
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1 rounded border border-blue-500 shadow-lg"
          >
            편집하기
          </button>
        </div>
      )}
    </div>
  )
}

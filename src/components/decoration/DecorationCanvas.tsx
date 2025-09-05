'use client'

import React, { useRef, useEffect, useState, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { RenderState, DecorationItem, PlacedItem, Position3D, FloorTileConfig, CharacterData } from '@/types'
import { PixiManager } from '@/utils/decoration/pixiManager'
import { DecorationDataStore } from '@/utils/decoration/dataStore'
import { DEFAULT_GRID_CONFIG } from '@/utils/decoration/gridUtils'

interface DecorationCanvasProps {
  width?: number
  height?: number
  renderState?: RenderState
  onStateChange?: (newState: Partial<RenderState>) => void
  className?: string
  userId?: string
  isOwner?: boolean
  selectedItemRef?: React.MutableRefObject<DecorationItem | null>
  // 보기 모드용 props
  storeItems?: DecorationItem[]
  placedItems?: PlacedItem[]
  isViewMode?: boolean
  onItemClick?: (item: PlacedItem) => void
  // 실시간 업데이트용 콜백
  onPlacedItemsUpdate?: (placedItems: PlacedItem[]) => void
  // 모바일 드래그 배치 모드 콜백
  onMobileDragStart?: (item: DecorationItem) => void
  // 바닥 타일 설정
  floorTileConfig?: FloorTileConfig
  // 캐릭터 데이터
  characterData?: CharacterData | null
}

export default function DecorationCanvas({
  width = 800,
  height = 600,
  renderState,
  onStateChange,
  className = '',
  userId,
  isOwner = false,
  selectedItemRef,
  storeItems: externalStoreItems,
  placedItems: externalPlacedItems,
  isViewMode = false,
  onItemClick,
  onPlacedItemsUpdate,
  onMobileDragStart,
  floorTileConfig,
  characterData
}: DecorationCanvasProps) {
  // DOM 요소 직접 관리
  const containerRef = useRef<HTMLDivElement | null>(null)
  const pixiContainerRef = useRef<HTMLDivElement | null>(null)
  const pixiManagerRef = useRef<PixiManager | null>(null)
  const dataStoreRef = useRef<DecorationDataStore | null>(null)
  const isInitializedRef = useRef<boolean>(false)
  const isMountedRef = useRef<boolean>(false)

  const [placedItems, setPlacedItems] = useState<PlacedItem[]>(externalPlacedItems || [])
  const [storeItems, setStoreItems] = useState<DecorationItem[]>(externalStoreItems || [])
  const [isReady, setIsReady] = useState(isViewMode && externalStoreItems && externalPlacedItems)
  
  // 모바일 드래그 배치 모드 상태
  const [isMobileDragMode, setIsMobileDragMode] = useState(false)
  const [dragItem, setDragItem] = useState<DecorationItem | null>(null)
  const [dragPosition, setDragPosition] = useState<{ x: number; y: number } | null>(null)

  // 모바일 환경 감지
  const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768

  // 바닥 타일 설정이 변경될 때마다 캔버스 다시 렌더링
  useEffect(() => {
    if (pixiManagerRef.current && isInitializedRef.current) {
      console.log('🔄 floorTileConfig 변경 감지, 전체 렌더링 업데이트')
      // PixiManager의 바닥 타일 설정 업데이트
      pixiManagerRef.current.updateFloorTileConfig(floorTileConfig)
      // 바닥 타일 설정이 변경되었으므로 전체 렌더링 업데이트
      updateRender()
    }
  }, [floorTileConfig])


  /**
   * 아이템 충돌 검사 함수 (미리보기와 동일한 로직)
   */
  const checkItemCollision = useCallback((
    position: Position3D, 
    item: DecorationItem, 
    placedItems: PlacedItem[], 
    storeItems: DecorationItem[]
  ): boolean => {
    if (!item.gridData) return false
    
    const { cells } = item.gridData
    const itemMap = new Map(storeItems.map(item => [item.id, item]))
    
    // 아이템의 각 셀에 대해 충돌 검사
    for (const cell of cells) {
      const worldX = position.x + cell.x
      const worldY = position.y + cell.y  
      const worldZ = position.z + cell.z

      // 그리드 경계 검사
      if (worldX < -20 || worldX > 20 || worldY < -20 || worldY > 20 || worldZ < 0 || worldZ > 10) {
        return true // 충돌
      }

      // 다른 아이템과의 충돌 검사
      const hasCollision = placedItems.some(placedItem => {
        const placedStoreItem = itemMap.get(placedItem.itemId)
        if (!placedStoreItem?.gridData) return false

        const { cells: placedCells } = placedStoreItem.gridData

        return placedCells.some(placedCell => {
          const placedWorldX = placedItem.gridPosition.x + placedCell.x
          const placedWorldY = placedItem.gridPosition.y + placedCell.y
          const placedWorldZ = placedItem.gridPosition.z + placedCell.z

          return placedWorldX === worldX && placedWorldY === worldY && placedWorldZ === worldZ
        })
      })

      if (hasCollision) {
        return true
      }
    }

    return false // 충돌 없음
  }, [])

  /**
   * 모바일 드래그 배치 모드 시작
   */
  const startMobileDragMode = useCallback((item: DecorationItem) => {
    if (!isMobile) return
    
    setIsMobileDragMode(true)
    setDragItem(item)
    setDragPosition(null)
    
    // 모바일 터치 이벤트 설정
    if (containerRef.current) {
      const handleTouchMove = (event: TouchEvent) => {
        event.preventDefault()
        const touch = event.touches[0]
        if (touch && containerRef.current) {
          const rect = containerRef.current.getBoundingClientRect()
          setDragPosition({
            x: touch.clientX - rect.left,
            y: touch.clientY - rect.top
          })
        }
      }
      
      const handleTouchEnd = async (event: TouchEvent) => {
        event.preventDefault()
        const touch = event.changedTouches[0]
        if (touch && containerRef.current && dragItem && userId && dataStoreRef.current) {
          const rect = containerRef.current.getBoundingClientRect()
          const touchX = touch.clientX - rect.left
          const touchY = touch.clientY - rect.top
          
          // 터치 위치를 그리드 좌표로 변환
          if (pixiManagerRef.current) {
            const gridPos = pixiManagerRef.current.getGridPositionFromMouse(touchX, touchY)
            if (gridPos) {
              // 🔧 Z축 자동 조정 적용: 미리보기와 동일한 로직 사용
              let finalPosition = gridPos
              
              if (dragItem.gridData && placedItems.length > 0 && storeItems.length > 0) {
                const maxZ = 10 // 최대 높이 제한
                let foundPosition = false
                
                // Z축을 점진적으로 올려가며 충돌 검사
                for (let z = gridPos.z; z <= maxZ; z++) {
                  const testPosition = { ...gridPos, z }
                  
                  // 충돌 검사 수행
                  const hasCollision = checkItemCollision(testPosition, dragItem, placedItems, storeItems)
                  
                  if (!hasCollision) {
                    finalPosition = testPosition
                    foundPosition = true
                    console.log('🔧 Z축 자동 조정 (모바일 드래그):', gridPos.z, '→', finalPosition.z)
                    break
                  }
                }
                
                if (!foundPosition) {
                  console.log('❌ 배치 가능한 위치를 찾을 수 없습니다 (모바일 드래그)')
                  return
                }
              }
              
              // 아이템 배치
              const success = await dataStoreRef.current.placeItem(userId, dragItem.id, finalPosition)
              if (success) {
                // 데이터 새로고침을 위해 loadGarageData 대신 직접 호출
                if (userId && !isViewMode && isMountedRef.current) {
                  try {
                    if (!dataStoreRef.current) return
                    
                    const allStoreItems = await dataStoreRef.current.getStoreItems()
                    setStoreItems(allStoreItems)
                    
                    const garageData = await dataStoreRef.current.getUserGarageData(userId)
                    
                    if (garageData && garageData.placedItems) {
                      setPlacedItems(garageData.placedItems)
                      onPlacedItemsUpdate?.(garageData.placedItems)
                    } else {
                      setPlacedItems([])
                      onPlacedItemsUpdate?.([])
                    }
                  } catch (error) {
                    // 데이터 로드 실패 처리
                  }
                }
                onStateChange?.({ selectedItem: null })
                if (selectedItemRef) selectedItemRef.current = null
              }
            }
          }
        }
        
        // 드래그 모드 종료
        setIsMobileDragMode(false)
        setDragItem(null)
        setDragPosition(null)
        
        // 이벤트 리스너 제거
        if (containerRef.current) {
          containerRef.current.removeEventListener('touchmove', handleTouchMove)
          containerRef.current.removeEventListener('touchend', handleTouchEnd)
        }
      }
      
      containerRef.current.addEventListener('touchmove', handleTouchMove, { passive: false })
      containerRef.current.addEventListener('touchend', handleTouchEnd, { passive: false })
    }
  }, [isMobile, dragItem, userId, dataStoreRef, onStateChange, selectedItemRef, isViewMode, onPlacedItemsUpdate, checkItemCollision, placedItems, storeItems])

  // 모바일 드래그 배치 모드 시작 (외부에서 호출)
  useEffect(() => {
    if (onMobileDragStart && renderState?.selectedItem && isMobile) {
      startMobileDragMode(renderState.selectedItem)
    }
  }, [renderState?.selectedItem, isMobile, onMobileDragStart])

  /**
   * 차고 데이터 로드 (로컬 스토리지에서 직접)
   */
  const loadGarageData = useCallback(async () => {
    if (!userId || !isMountedRef.current || isViewMode) return

    try {
      // 🔧 로컬 스토리지에서 직접 로드 (API 대신)
      if (!dataStoreRef.current) {
        return
      }
      
      // 상점 아이템 로드 (배치된 아이템 렌더링에 필요)
      const allStoreItems = await dataStoreRef.current.getStoreItems()
      setStoreItems(allStoreItems)
      
      const garageData = await dataStoreRef.current.getUserGarageData(userId)
      
      if (garageData && garageData.placedItems) {
        setPlacedItems(garageData.placedItems)
        // 실시간 업데이트 콜백 호출
        onPlacedItemsUpdate?.(garageData.placedItems)
      } else {
        setPlacedItems([])
        // 실시간 업데이트 콜백 호출
        onPlacedItemsUpdate?.([])
      }
    } catch (error) {
      // 데이터 로드 실패 처리
    }
  }, [userId, isViewMode])

  /**
   * 마우스 이벤트 설정
   */
  const setupMouseEvents = useCallback((pixiManager: PixiManager) => {
    if (!pixiManager.application?.canvas || !pixiContainerRef.current || isViewMode) return

    const canvas = pixiManager.application.canvas as HTMLCanvasElement
    
    const handleMouseMove = (event: MouseEvent) => {
      if (!isMountedRef.current) return
      
      try {
        const rect = canvas.getBoundingClientRect()
        const mouseX = event.clientX - rect.left
        const mouseY = event.clientY - rect.top

        // 🔧 PixiManager의 정확한 좌표 변환 사용
        const gridPos = pixiManager.getGridPositionFromMouse(mouseX, mouseY)
        
        if (gridPos && onStateChange) {
          // 🔧 선택된 아이템이 있으면 픽셀 데이터를 고려한 배치 가능 여부 확인
          const selectedItem = selectedItemRef?.current || renderState?.selectedItem
          if (selectedItem && !pixiManager.isItemWithinTileBounds(gridPos, selectedItem)) {
            // 아이템의 픽셀이 타일 영역을 넘어가면 hoveredGrid를 null로 설정
            onStateChange({ hoveredGrid: null })
            return
          }
          
          if (gridPos.x !== renderState?.hoveredGrid?.x || gridPos.y !== renderState?.hoveredGrid?.y || gridPos.z !== renderState?.hoveredGrid?.z) {
            onStateChange({ hoveredGrid: gridPos })
          }
        }
      } catch (error) {
        // 마우스 이벤트 처리 중 오류
      }
    }

    const handleMouseClick = async (event: MouseEvent) => {
      if (!isMountedRef.current) {
        return
      }
      
      // 소유자가 아니면 배치 불가
      if (!isOwner) {
        return
      }
      
      // 편집 모드이거나 아이템이 선택되어 있으면 배치 허용 (상태 업데이트 지연 고려)
      // 단, 소유자이고 dataStore가 있으면 조건을 완화
      if (renderState?.currentMode !== 'edit' && !renderState?.selectedItem && !dataStoreRef.current) {
        return
      }
      
      try {
        const rect = canvas.getBoundingClientRect()
        const mouseX = event.clientX - rect.left
        const mouseY = event.clientY - rect.top

        // 🔧 PixiManager의 정확한 좌표 변환 사용
        const gridPos = pixiManager.getGridPositionFromMouse(mouseX, mouseY)
        
        // 배치 시도 (ref를 통해 최신 선택된 아이템 확인)
        if (gridPos && dataStoreRef.current && userId) {
          // ref 또는 상태에서 선택된 아이템 확인 (ref 우선)
          const selectedItem = selectedItemRef?.current || renderState?.selectedItem
          
          if (selectedItem) {
            // 🔧 아이템의 모든 픽셀이 타일 영역 안에 있는지 확인
            if (!pixiManager.isItemWithinTileBounds(gridPos, selectedItem)) {
              console.log('❌ 아이템이 타일 영역을 넘어갑니다:', selectedItem.name)
              return
            }
            
            // 재선택된 아이템인지 확인 (이미 배치된 아이템인지 체크)
            const existingPlacedItem = placedItems.find(item => item.itemId === selectedItem.id)
            
            if (existingPlacedItem) {
              // 기존 아이템 제거 후 새 위치에 배치
              const removeSuccess = await dataStoreRef.current.removeItem(userId, existingPlacedItem.id)
              if (!removeSuccess) {
                return
              }
            }
            
            // 🔧 Z축 자동 조정 적용: 미리보기와 동일한 로직 사용
            let finalPosition = gridPos
            
            if (selectedItem.gridData && placedItems.length > 0 && storeItems.length > 0) {
              const maxZ = 10 // 최대 높이 제한
              let foundPosition = false
              
              // Z축을 점진적으로 올려가며 충돌 검사
              for (let z = gridPos.z; z <= maxZ; z++) {
                const testPosition = { ...gridPos, z }
                
                // 충돌 검사 수행
                const hasCollision = checkItemCollision(testPosition, selectedItem, placedItems, storeItems)
                
                if (!hasCollision) {
                  finalPosition = testPosition
                  foundPosition = true
                  console.log('🔧 Z축 자동 조정:', gridPos.z, '→', finalPosition.z)
                  break
                }
              }
              
              if (!foundPosition) {
                console.log('❌ 배치 가능한 위치를 찾을 수 없습니다')
                return
              }
            }
            
            const success = await dataStoreRef.current.placeItem(userId, selectedItem.id, finalPosition)
            
            if (success) {
              loadGarageData() // 데이터 새로고침
              onStateChange?.({ selectedItem: null }) // 선택된 아이템 해제
              // ref도 초기화
              if (selectedItemRef) selectedItemRef.current = null
            }
          }
        }
      } catch (error) {
        console.error('❌ 클릭 이벤트 처리 중 오류:', error)
      }
    }

    // 터치 이벤트 핸들러 (모바일 지원)
    const handleTouchStart = (event: TouchEvent) => {
      if (!isMountedRef.current) return
      
      console.log('🖐️ 터치 시작:', event.touches.length)
      event.preventDefault() // 기본 터치 동작 방지
    }

    const handleTouchMove = (event: TouchEvent) => {
      if (!isMountedRef.current) return
      
      event.preventDefault() // 스크롤 방지
      
      try {
        const rect = canvas.getBoundingClientRect()
        const touch = event.touches[0]
        const touchX = touch.clientX - rect.left
        const touchY = touch.clientY - rect.top

        console.log('🖐️ 터치 좌표:', { touchX, touchY, rect: { width: rect.width, height: rect.height } })

        // 🔧 PixiManager의 정확한 좌표 변환 사용
        const gridPos = pixiManager.getGridPositionFromMouse(touchX, touchY)
        
        console.log('🖐️ 그리드 좌표:', gridPos)
        
        if (gridPos && onStateChange) {
          // 🔧 선택된 아이템이 있으면 픽셀 데이터를 고려한 배치 가능 여부 확인
          const selectedItem = selectedItemRef?.current || renderState?.selectedItem
          if (selectedItem && !pixiManager.isItemWithinTileBounds(gridPos, selectedItem)) {
            // 아이템의 픽셀이 타일 영역을 넘어가면 hoveredGrid를 null로 설정
            onStateChange({ hoveredGrid: null })
            return
          }
          
          if (gridPos.x !== renderState?.hoveredGrid?.x || gridPos.y !== renderState?.hoveredGrid?.y || gridPos.z !== renderState?.hoveredGrid?.z) {
            onStateChange({ hoveredGrid: gridPos })
          }
        }
      } catch (error) {
        console.error('❌ 터치 이벤트 처리 중 오류:', error)
      }
    }

    const handleTouchEnd = async (event: TouchEvent) => {
      if (!isMountedRef.current) {
        return
      }
      
      // 소유자가 아니면 배치 불가
      if (!isOwner) {
        return
      }
      
      // 편집 모드이거나 아이템이 선택되어 있으면 배치 허용
      if (renderState?.currentMode !== 'edit' && !renderState?.selectedItem && !dataStoreRef.current) {
        return
      }
      
      try {
        const rect = canvas.getBoundingClientRect()
        const touch = event.changedTouches[0]
        const touchX = touch.clientX - rect.left
        const touchY = touch.clientY - rect.top

        // 🔧 PixiManager의 정확한 좌표 변환 사용
        const gridPos = pixiManager.getGridPositionFromMouse(touchX, touchY)
        
        // 배치 시도 (ref를 통해 최신 선택된 아이템 확인)
        if (gridPos && dataStoreRef.current && userId) {
          // ref 또는 상태에서 선택된 아이템 확인 (ref 우선)
          const selectedItem = selectedItemRef?.current || renderState?.selectedItem
          
          if (selectedItem) {
            // 🔧 아이템의 모든 픽셀이 타일 영역 안에 있는지 확인
            if (!pixiManager.isItemWithinTileBounds(gridPos, selectedItem)) {
              console.log('❌ 아이템이 타일 영역을 넘어갑니다:', selectedItem.name)
              return
            }
            
            // 재선택된 아이템인지 확인 (이미 배치된 아이템인지 체크)
            const existingPlacedItem = placedItems.find(item => item.itemId === selectedItem.id)
            
            if (existingPlacedItem) {
              // 기존 아이템 제거 후 새 위치에 배치
              const removeSuccess = await dataStoreRef.current.removeItem(userId, existingPlacedItem.id)
              if (!removeSuccess) {
                return
              }
            }
            
            // 🔧 Z축 자동 조정 적용: 미리보기와 동일한 로직 사용
            let finalPosition = gridPos
            
            if (selectedItem.gridData && placedItems.length > 0 && storeItems.length > 0) {
              const maxZ = 10 // 최대 높이 제한
              let foundPosition = false
              
              // Z축을 점진적으로 올려가며 충돌 검사
              for (let z = gridPos.z; z <= maxZ; z++) {
                const testPosition = { ...gridPos, z }
                
                // 충돌 검사 수행
                const hasCollision = checkItemCollision(testPosition, selectedItem, placedItems, storeItems)
                
                if (!hasCollision) {
                  finalPosition = testPosition
                  foundPosition = true
                  console.log('🔧 Z축 자동 조정 (터치):', gridPos.z, '→', finalPosition.z)
                  break
                }
              }
              
              if (!foundPosition) {
                console.log('❌ 배치 가능한 위치를 찾을 수 없습니다 (터치)')
                return
              }
            }
            
            const success = await dataStoreRef.current.placeItem(userId, selectedItem.id, finalPosition)
            
            if (success) {
              loadGarageData() // 데이터 새로고침
              onStateChange?.({ selectedItem: null }) // 선택된 아이템 해제
              // ref도 초기화
              if (selectedItemRef) selectedItemRef.current = null
            }
          }
        }
      } catch (error) {
        console.error('❌ 터치 이벤트 처리 중 오류:', error)
      }
    }

    canvas.addEventListener('mousemove', handleMouseMove)
    canvas.addEventListener('click', handleMouseClick)
    canvas.addEventListener('touchstart', handleTouchStart, { passive: false })
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false })
    canvas.addEventListener('touchend', handleTouchEnd)

    // cleanup 함수 저장
    ;(canvas as any).__cleanupEvents = () => {
      canvas.removeEventListener('mousemove', handleMouseMove)
      canvas.removeEventListener('click', handleMouseClick)
      canvas.removeEventListener('touchstart', handleTouchStart)
      canvas.removeEventListener('touchmove', handleTouchMove)
      canvas.removeEventListener('touchend', handleTouchEnd)
    }
  }, [renderState, onStateChange, userId, loadGarageData, checkItemCollision, placedItems, storeItems])

  /**
   * PixiJS 초기화 (React 외부에서)
   */
  const initializePixi = useCallback(async () => {
    if (!pixiContainerRef.current || isInitializedRef.current || !isMountedRef.current) {
      return
    }

    try {
      isInitializedRef.current = true

      // viewOnly 모드에서는 간단한 초기화만
      if (isViewMode) {
        const pixiManager = new PixiManager({
          ...DEFAULT_GRID_CONFIG,
          floorTile: floorTileConfig
        })
        // viewOnly 모드에서는 크기를 고정
        await pixiManager.initialize(pixiContainerRef.current, 320, 240)
        pixiManagerRef.current = pixiManager
        dataStoreRef.current = DecorationDataStore.getInstance()
        setIsReady(true as any)
        // viewOnly 모드에서는 초기 렌더링만 한 번
        setTimeout(() => {
          if (pixiManagerRef.current && isMountedRef.current) {
            updateRender()
          }
        }, 300)
        return
      }

      // 일반 모드에서는 완전한 초기화
      const pixiManager = new PixiManager({
        ...DEFAULT_GRID_CONFIG,
        floorTile: floorTileConfig
      })
      
      // 초기화 전에 이전 인스턴스가 있다면 정리
      if (pixiManagerRef.current) {
        try {
          await pixiManagerRef.current.destroy()
        } catch (error) {
          console.warn('이전 PixiJS 인스턴스 정리 중 오류:', error)
        }
        pixiManagerRef.current = null
      }
      
      await pixiManager.initialize(pixiContainerRef.current, width, height)
      pixiManagerRef.current = pixiManager
      dataStoreRef.current = DecorationDataStore.getInstance()
      setupMouseEvents(pixiManager)
      setIsReady(true as any)
      
    } catch (error) {
      isInitializedRef.current = false
    }
  }, [width, height, setupMouseEvents, isViewMode])

  /**
   * 렌더링 업데이트
   */
  const updateRender = useCallback(async () => {
    const pixiManager = pixiManagerRef.current
    
    if (!pixiManager || !pixiManager.isInitialized || !isMountedRef.current) {
      return
    }

    try {
      // viewOnly 모드에서는 간단한 렌더링만
      if (isViewMode) {
        // 그리드 렌더링 (고정)
        await pixiManager.renderGrid(true)
        
        // 배치된 아이템들만 렌더링
        if (placedItems.length > 0 && storeItems.length > 0) {
          await pixiManager.renderPlacedItems(placedItems, storeItems)
        }
        
        // 캐릭터 렌더링 (null이면 캐릭터 제거)
        await pixiManager.renderCharacter(characterData || null)
        return
      }

      // 일반 모드에서는 완전한 렌더링
      await pixiManager.renderGrid(renderState?.showGrid ?? false)

      // 배치된 아이템들 렌더링
      if (placedItems.length > 0 && storeItems.length > 0) {
        await pixiManager.renderPlacedItems(placedItems, storeItems)
      }
      
      // 캐릭터 렌더링 (null이면 캐릭터 제거)
      const characterContainer = await pixiManager.renderCharacter(characterData || null)
      if (characterContainer && isOwner && characterData) {
        // 캐릭터 드래그 앤 드롭 설정
        pixiManager.setupCharacterDragDrop(characterContainer, async (newPosition) => {
          // 캐릭터 위치 업데이트
          const updatedCharacterData = {
            ...characterData,
            position: newPosition
          }
          
          try {
            const response = await fetch('/api/character', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                userId,
                characterData: updatedCharacterData
              }),
            })
            
            if (response.ok) {
              // 성공적으로 저장됨
              console.log('캐릭터 위치 저장 완료')
            }
          } catch (error) {
            console.error('캐릭터 위치 저장 실패:', error)
          }
        })
      }

      // 🔧 Z축 자동 조정이 적용된 미리보기 렌더링
      if (renderState?.selectedItem && renderState?.hoveredGrid) {
        await pixiManager.renderPreview(
          renderState!.selectedItem,
          renderState!.hoveredGrid,
          dataStoreRef.current,
          placedItems,
          storeItems
        )
      } else {
        await pixiManager.renderPreview(null, null)
      }
    } catch (error) {
      // 렌더링 업데이트 실패
    }
  }, [renderState?.showGrid, renderState?.selectedItem?.id, renderState?.hoveredGrid, placedItems.length, storeItems.length, isViewMode])

  // 캐릭터 데이터가 변경될 때마다 캔버스 다시 렌더링
  useEffect(() => {
    if (pixiManagerRef.current && isInitializedRef.current) {
      console.log('🔄 characterData 변경 감지, 전체 렌더링 업데이트:', characterData ? '캐릭터 표시' : '캐릭터 숨김')
      console.log('📊 characterData 값:', characterData)
      updateRender()
    }
  }, [characterData, updateRender])

  // 컴포넌트 마운트/언마운트 관리
  useEffect(() => {
    isMountedRef.current = true
    
    // DOM 컨테이너 생성
    if (typeof window !== 'undefined' && !pixiContainerRef.current) {
      const pixiDiv = document.createElement('div')
      pixiDiv.style.width = `${width}px`
      pixiDiv.style.height = `${height}px`
      pixiDiv.style.position = 'relative'
      pixiDiv.style.overflow = 'hidden'
      pixiDiv.style.touchAction = 'none' // 터치 스크롤 방지
      pixiContainerRef.current = pixiDiv
    }

    return () => {
      // 먼저 마운트 상태를 false로 설정하여 추가 렌더링 방지
      isMountedRef.current = false
      isInitializedRef.current = false
      setIsReady(false)
      
      // 🔧 안전한 PixiJS 정리
      if (pixiManagerRef.current) {
        try {
          // 먼저 렌더링 루프를 완전히 중단
          if (pixiManagerRef.current.application?.ticker) {
            // 티커를 즉시 정지
            const ticker = pixiManagerRef.current.application.ticker
            ticker.stop()
            
            // 티커의 모든 리스너를 제거
            if (ticker.remove) {
              ticker.remove()
            }
          }
          
          // 렌더러가 유효한지 확인 후 destroy
          if (pixiManagerRef.current.application?.renderer) {
            // 더 긴 지연 시간을 두어 렌더링 루프가 완전히 정지된 후 destroy
            setTimeout(async () => {
              if (pixiManagerRef.current && pixiManagerRef.current.application?.renderer) {
                try {
                  // PixiManager의 destroy 메서드 사용
                  await pixiManagerRef.current.destroy()
                  pixiManagerRef.current = null
                } catch (error) {
                  console.warn('PixiJS 정리 중 오류:', error)
                  pixiManagerRef.current = null
                }
              }
            }, 1000) // 더 긴 지연 시간
          } else {
            // 렌더러가 없는 경우 바로 정리
            pixiManagerRef.current = null
          }
        } catch (error) {
          console.warn('PixiJS 정리 준비 중 오류:', error)
          pixiManagerRef.current = null
        }
      }
      
      // 🔧 안전한 DOM 정리
      if (pixiContainerRef.current) {
        try {
          // 이벤트 리스너 정리
          const canvas = pixiContainerRef.current.querySelector('canvas')
          if (canvas && (canvas as any).__cleanupEvents) {
            (canvas as any).__cleanupEvents()
          }
        } catch (error) {
          // DOM 정리 경고
        } finally {
          pixiContainerRef.current = null
        }
      }
    }
  }, [width, height])

  // PixiJS 초기화
  useEffect(() => {
    if (pixiContainerRef.current && !isInitializedRef.current) {
      // 약간의 지연을 주어 DOM이 완전히 준비된 후 초기화
      const timer = setTimeout(() => {
        if (isMountedRef.current) {
          initializePixi()
        }
      }, 200) // 지연 시간 증가
      
      return () => clearTimeout(timer)
    }
  }, [initializePixi])

  // 차고 데이터 로드
  useEffect(() => {
    if (isReady && userId && !isViewMode) {
      loadGarageData()
    }
  }, [isReady, userId, loadGarageData, isViewMode])

  // 보기 모드에서는 편집 모드와 동일하게 렌더링하되 편집 기능만 비활성화

  // 렌더링 업데이트 (viewOnly 모드에서는 비활성화)
  useEffect(() => {
    if (isReady && !isViewMode && isMountedRef.current) {
      // PixiJS가 유효한지 추가 확인
      if (pixiManagerRef.current?.isInitialized && pixiManagerRef.current?.application?.renderer) {
        try {
          updateRender()
        } catch (error) {
          console.warn('렌더링 업데이트 중 오류:', error)
        }
      }
    }
  }, [isReady, isViewMode]) // updateRender를 의존성에서 제거

  // 캔버스 크기 변경 시 스케일링 업데이트 (viewOnly 모드에서는 비활성화)
  useEffect(() => {
    if (pixiManagerRef.current?.isInitialized && isReady && !isViewMode && isMountedRef.current) {
      // PixiJS가 유효한지 추가 확인
      if (pixiManagerRef.current?.application?.renderer) {
        try {
          pixiManagerRef.current.updateScaling(width, height)
        } catch (error) {
          console.warn('스케일링 업데이트 중 오류:', error)
        }
      }
    }
  }, [width, height, isReady, isViewMode])

  return (
    <div 
      ref={containerRef}
      className={`decoration-canvas-container ${className}`}
      style={{ 
        width: isViewMode ? '320px' : (typeof width === 'string' ? width : `${width}px`), 
        height: isViewMode ? '240px' : (typeof height === 'string' ? height : `${height}px`),
        position: 'relative',
        border: '2px solid #444',
        borderRadius: '8px',
        overflow: 'hidden',
        backgroundColor: '#1a1a1a',
        display: 'block',
        minWidth: isViewMode ? '320px' : 'auto',
        minHeight: isViewMode ? '240px' : 'auto',
        maxWidth: isViewMode ? '320px' : 'none',
        maxHeight: isViewMode ? '240px' : 'none'
      }}
    >
      {!isReady && (
        <div className="absolute inset-0 flex items-center justify-center text-white">
          <div className="text-center">
            <div className="text-2xl mb-2">🎮</div>
            <div className="text-sm">3D 캔버스 로딩 중...</div>
          </div>
        </div>
      )}
      
      {/* 모바일 배치 안내 메시지 */}
      {isMobile && renderState?.selectedItem && (
        <div className="absolute inset-0 pointer-events-none z-50">
          {/* 배치 안내 메시지 */}
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/80 text-white px-4 py-2 rounded-lg text-sm">
            💡 원하는 위치를 터치하여 배치하세요
          </div>
        </div>
      )}
      
      {/* 모바일 드래그 배치 모드 UI */}
      {isMobile && isMobileDragMode && dragItem && (
        <div className="absolute inset-0 pointer-events-none z-50">
          {/* 드래그 중인 아이템 */}
          {dragPosition && (
            <div 
              className="absolute w-16 h-16 bg-green-500/30 border-2 border-green-400 rounded-lg flex items-center justify-center"
              style={{
                left: dragPosition.x - 32,
                top: dragPosition.y - 32,
                transform: 'translate(-50%, -50%)'
              }}
            >
              <img 
                src={dragItem.imageUrl} 
                alt={dragItem.name}
                className="w-full h-full object-contain"
                style={{ imageRendering: 'pixelated' }}
              />
            </div>
          )}
          
          {/* 배치 안내 메시지 */}
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/80 text-white px-4 py-2 rounded-lg text-sm">
            💡 원하는 위치를 터치하여 배치하세요
          </div>
        </div>
      )}
      
      {/* PixiJS 컨테이너를 DOM에 직접 추가 */}
      {pixiContainerRef.current && containerRef.current && (() => {
        if (!containerRef.current?.contains(pixiContainerRef.current!)) {
          containerRef.current?.appendChild(pixiContainerRef.current!)
        }
        return null
      })()}
    </div>
  )
}
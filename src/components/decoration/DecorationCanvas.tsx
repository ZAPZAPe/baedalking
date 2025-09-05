'use client'

import * as React from 'react'
import { memo } from 'react'
import { RenderState, DecorationItem, PlacedItem, Position3D, FloorTileConfig, CharacterData } from '@/types'
import UnifiedDecorationCanvas from './UnifiedDecorationCanvas'

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
  // 배치된 아이템 클릭 이벤트
  onPlacedItemClick?: (placedItem: PlacedItem) => void
  // 활성화된 아이템 ID
  activeItemId?: string | null
  // 드래그 완료 콜백
  onDragComplete?: ((newPosition: { x: number; y: number; z: number }) => void) | null
}

const DecorationCanvas = memo(function DecorationCanvas(props: DecorationCanvasProps) {
  // 모든 기능을 통합 캔버스에 위임
  return <UnifiedDecorationCanvas {...props} />
})

export default DecorationCanvas
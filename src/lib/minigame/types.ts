// 미니게임 시스템 타입 정의
export interface Position3D {
  x: number
  y: number
  z: number
}

export interface Size2D {
  width: number
  height: number
}

// 3D 게임 오브젝트 인터페이스
export interface GameObject {
  id: string
  type: 'character' | 'furniture' | 'vehicle' | 'tile' | 'building'
  position: Position3D
  spriteUrl?: string
  size: Size2D
  isInteractable: boolean
  data?: any
}

// 미니게임 캔버스 Props
export interface MiniGameCanvasProps {
  width?: number
  height?: number
  mode?: 'minigarage' | 'town'
  onTileClick?: (x: number, y: number, z: number) => void
  onObjectClick?: (object: GameObject) => void
}

// 캐릭터 관련 타입들 (표준 아이소메트릭 8방향)
export type Direction = 'N' | 'NE' | 'E' | 'SE' | 'S' | 'SW' | 'W' | 'NW'

export interface CharacterAnimationState {
  direction: Direction
  frame: number
  isMoving: boolean
}

export interface TileData {
  x: number
  y: number
  z: number
  type: string
  isWalkable: boolean
  sprite?: string
}

export interface GridTileReference {
  container: any // PIXI.Container
  graphics: any | null  // PIXI.Graphics (텍스처 기반 타일의 경우 null)
}

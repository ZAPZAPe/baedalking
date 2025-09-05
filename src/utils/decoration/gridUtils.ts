// 🎯 그리드 좌표 변환 유틸리티

import { Position2D, Position3D, GridConfig } from '@/types'

// 기본 그리드 설정
export const DEFAULT_GRID_CONFIG: GridConfig = {
  rows: 80,
  cols: 80,
  tileWidth: 20,
  tileHeight: 10,
  maxHeight: 10,
  floorTile: {
    type: 'default',
    pattern: 'checkerboard',
    lightColor: 0xD2B48C,  // 밝은 나무색
    darkColor: 0xA0522D,   // 어두운 나무색
    opacity: 0.8,
    scale: 1.0
  }
}

/**
 * 그리드 좌표를 이소메트릭 스크린 좌표로 변환
 */
export function gridToIso(
  x: number, 
  y: number, 
  z: number = 0, 
  config: GridConfig = DEFAULT_GRID_CONFIG
): Position2D {
  const isoX = (x - y) * config.tileWidth / 2
  const isoY = (x + y) * config.tileHeight / 2 - z * config.tileHeight
  return { x: isoX, y: isoY }
}

/**
 * 이소메트릭 스크린 좌표를 그리드 좌표로 변환
 */
export function isoToGrid(
  isoX: number, 
  isoY: number, 
  config: GridConfig = DEFAULT_GRID_CONFIG
): Position2D {
  const x = (isoX / (config.tileWidth / 2) + isoY / config.tileHeight) / 2
  const y = (isoY / config.tileHeight - isoX / (config.tileWidth / 2)) / 2
  return { x: Math.round(x), y: Math.round(y) }
}

/**
 * 마우스 좌표를 그리드 좌표로 변환 (컨테이너 오프셋 고려)
 */
export function mouseToGrid(
  mouseX: number,
  mouseY: number,
  containerX: number,
  containerY: number,
  config: GridConfig = DEFAULT_GRID_CONFIG
): Position2D {
  const relativeX = mouseX - containerX
  const relativeY = mouseY - containerY
  return isoToGrid(relativeX, relativeY, config)
}

/**
 * 그리드 위치가 유효한 범위 내에 있는지 확인
 * 타일이 있는 영역에서만 배치 가능하도록 제한
 */
export function isValidGridPosition(
  x: number, 
  y: number, 
  z: number = 0,
  config: GridConfig = DEFAULT_GRID_CONFIG
): boolean {
  // 🔧 타일이 있는 영역만 배치 가능하도록 제한 (renderGrid와 동일한 크기)
  const halfSize = 15 // renderGrid에서 사용하는 것과 동일한 크기
  return (
    x >= -halfSize && x < halfSize &&
    y >= -halfSize && y < halfSize &&
    z >= 0 && z <= config.maxHeight
  )
}

/**
 * 두 그리드 위치가 같은지 비교
 */
export function isEqualGridPosition(pos1: Position3D, pos2: Position3D): boolean {
  return pos1.x === pos2.x && pos1.y === pos2.y && pos1.z === pos2.z
}

/**
 * 그리드 위치에서 거리 계산 (맨하탄 거리)
 */
export function getGridDistance(pos1: Position3D, pos2: Position3D): number {
  return Math.abs(pos1.x - pos2.x) + Math.abs(pos1.y - pos2.y) + Math.abs(pos1.z - pos2.z)
}

/**
 * 특정 레이어의 모든 그리드 위치 생성
 */
export function generateGridPositions(
  layer: number, 
  config: GridConfig = DEFAULT_GRID_CONFIG
): Position3D[] {
  const positions: Position3D[] = []
  const halfSize = Math.floor(config.rows / 2)
  
  for (let x = -halfSize; x <= halfSize; x++) {
    for (let y = -halfSize; y <= halfSize; y++) {
      positions.push({ x, y, z: layer })
    }
  }
  
  return positions
}

/**
 * 아이템 앵커를 고려한 배치 위치 계산
 */
export function calculatePlacementPosition(
  gridPos: Position3D,
  anchorX: number,
  anchorY: number,
  config: GridConfig = DEFAULT_GRID_CONFIG
): Position2D {
  const isoPos = gridToIso(gridPos.x, gridPos.y, gridPos.z, config)
  return {
    x: isoPos.x - anchorX,
    y: isoPos.y - anchorY
  }
}

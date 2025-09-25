// 아이템 복셀 시스템 타입 정의

export interface VoxelPoint {
  x: number
  y: number
  type: 'solid' | 'decoration' | 'passable'  // solid=충돌, decoration=장식, passable=통과 가능
}

export interface VoxelLayer {
  layer: number       // Z 레벨 (0=1층, 1=2층, 2=3층...)
  voxels: VoxelPoint[]
}

export interface ItemVoxelData {
  id: string
  name: string
  imagePath: string
  category: string
  voxelMap: VoxelLayer[]  // 레이어별 복셀 데이터
  dimensions: {
    width: number   // X축 최대 크기
    height: number  // Y축 최대 크기
    depth: number   // Z축 크기 (레이어 수)
  }
  createdAt: string
  updatedAt: string
}

export interface PlacedItem {
  id: string
  itemVoxelId: string  // ItemVoxelData의 ID 참조
  position: {
    x: number
    y: number
    z: number  // 시작 레이어
  }
  rotation: number  // 회전 (0, 90, 180, 270도)
}

// 복셀 타입별 설정
export const VOXEL_TYPE_CONFIG = {
  solid: {
    name: '고체 (충돌)',
    color: 0xe74c3c,  // 빨간색
    alpha: 0.8,
    blocksMovement: true,
    blocksPlacement: true
  },
  decoration: {
    name: '장식 (통과 가능)',
    color: 0x3498db,  // 파란색
    alpha: 0.6,
    blocksMovement: false,
    blocksPlacement: false
  },
  passable: {
    name: '통과 가능',
    color: 0x2ecc71,  // 초록색
    alpha: 0.4,
    blocksMovement: false,
    blocksPlacement: false
  }
} as const

export type VoxelType = keyof typeof VOXEL_TYPE_CONFIG

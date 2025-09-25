/**
 * 🧱 Voxel Collision Manager - 복셀 기반 충돌 처리 시스템
 * 
 * 3D 복셀 공간에서 아이템 간 충돌을 감지하고
 * Z축 보상을 통해 자연스러운 쌓기를 구현합니다.
 */

export interface VoxelData {
  x: number
  y: number
  z: number
}

export interface VoxelCollisionConfig {
  gridMin: number
  gridMax: number
  maxZ: number
}

export class VoxelCollisionManager {
  private gridMin: number
  private gridMax: number
  private maxZ: number
  
  // 3D 복셀 맵 - "x,y,z" 형식의 키로 점유 여부 저장
  private voxelMap: Map<string, string> = new Map() // value는 아이템 ID
  
  // 아이템별 복셀 저장
  private itemVoxels: Map<string, VoxelData[]> = new Map()
  
  // Z축 보상 단위
  private readonly Z_STEP = 0.5
  
  constructor(config: VoxelCollisionConfig) {
    this.gridMin = config.gridMin
    this.gridMax = config.gridMax
    this.maxZ = config.maxZ
  }
  
  /**
   * 🧱 복셀 키 생성
   */
  private getVoxelKey(x: number, y: number, z: number): string {
    // 격자 좌표: x,y는 정수 격자 기준으로 고정
    const roundedX = Math.round(x)
    const roundedY = Math.round(y)
    // z는 Z_STEP(0.5) 단위로 스냅해서 키 안정화
    const snappedZ = Math.round(z / this.Z_STEP) * this.Z_STEP
    // 부동소수 오차 방지 위해 고정 자리수 문자열화
    const zKey = snappedZ.toFixed(2)
    return `${roundedX},${roundedY},${zKey}`
  }
  
  /**
   * 📍 아이템 등록
   */
  public registerItem(itemId: string, voxels: VoxelData[]): void {
    // 기존 아이템이 있다면 먼저 제거
    if (this.itemVoxels.has(itemId)) {
      this.unregisterItem(itemId)
    }
    
    // 아이템 복셀 저장
    this.itemVoxels.set(itemId, voxels)
    
    // 복셀 맵에 등록 (그리드 밖은 무시/클립)
    voxels.forEach(voxel => {
      const x = Math.round(voxel.x)
      const y = Math.round(voxel.y)
      const z = Math.round(voxel.z / this.Z_STEP) * this.Z_STEP
      if (x < this.gridMin || x > this.gridMax || y < this.gridMin || y > this.gridMax || z < 0 || z > this.maxZ) {
        return
      }
      const key = this.getVoxelKey(x, y, z)
      this.voxelMap.set(key, itemId)
    })
    
    console.log(`✅ 아이템 등록: ${itemId}, 복셀 수: ${voxels.length}`)
  }
  
  /**
   * 🗑️ 아이템 제거
   */
  public unregisterItem(itemId: string): void {
    const voxels = this.itemVoxels.get(itemId)
    if (!voxels) return
    
    // 복셀 맵에서 제거
    voxels.forEach(voxel => {
      const key = this.getVoxelKey(voxel.x, voxel.y, voxel.z)
      if (this.voxelMap.get(key) === itemId) {
        this.voxelMap.delete(key)
      }
    })
    
    // 아이템 복셀 제거
    this.itemVoxels.delete(itemId)
    
    console.log(`🗑️ 아이템 제거: ${itemId}`)
  }
  
  /**
   * 🔍 특정 위치가 비어있는지 확인
   */
  public isEmptyAt(x: number, y: number, z: number): boolean {
    const key = this.getVoxelKey(x, y, z)
    return !this.voxelMap.has(key)
  }
  
  /**
   * 🔍 특정 위치의 아이템 ID 가져오기
   */
  public getItemAt(x: number, y: number, z: number): string | null {
    const key = this.getVoxelKey(x, y, z)
    return this.voxelMap.get(key) || null
  }
  
  /**
   * 📐 아이템 배치 가능 여부 확인
   */
  public canPlaceItem(
    baseX: number,
    baseY: number,
    baseZ: number,
    voxelData: VoxelData[]
  ): boolean {
    // 그리드 범위 체크 및 충돌 체크 (끝 라인 허용: 그리드 밖 복셀은 클립)
    for (const voxel of voxelData) {
      const worldX = baseX + voxel.x
      const worldY = baseY + voxel.y
      const worldZ = baseZ + voxel.z
      
      // XY가 그리드 밖이면 해당 복셀은 무시 (클리핑)
      if (worldX < this.gridMin || worldX > this.gridMax ||
          worldY < this.gridMin || worldY > this.gridMax) {
        continue
      }
      
      // Z가 범위를 벗어나면 해당 복셀 무시 (바닥/천장 밖은 점유 불가)
      if (worldZ < 0 || worldZ > this.maxZ) {
        continue
      }
      
      // 충돌 체크 (그리드 내에 있는 복셀만 검사)
      if (!this.isEmptyAt(worldX, worldY, worldZ)) {
        return false
      }
    }
    
    return true
  }
  
  /**
   * 📊 Z축 보상 계산
   * 
   * 아이템을 배치하려는 위치에서 기존 아이템과 충돌하는 경우
   * 자동으로 위에 쌓을 수 있도록 Z축 오프셋을 계산합니다.
   */
  public calculateZOffset(
    baseX: number,
    baseY: number,
    voxelData: VoxelData[]
  ): number {
    let maxZ = 0
    
    // 모든 복셀에 대해 충돌하는 최대 높이 찾기
    for (const voxel of voxelData) {
      const worldX = baseX + voxel.x
      const worldY = baseY + voxel.y
      
      // 해당 XY 위치에서 가장 높은 점유된 Z 찾기
      const highestZ = this.findHighestOccupiedZ(worldX, worldY)
      
      if (highestZ >= 0) {
        // 충돌하는 아이템의 상단 + 1 레벨
        const requiredZ = Math.ceil((highestZ + 1) / this.Z_STEP) * this.Z_STEP
        maxZ = Math.max(maxZ, requiredZ)
      }
    }
    
    return maxZ
  }
  
  /**
   * 🔍 특정 XY 위치에서 가장 높은 점유된 Z 찾기
   */
  private findHighestOccupiedZ(x: number, y: number): number {
    let highestZ = -1
    
    // 모든 Z 레벨 확인 (아래에서 위로)
    for (let z = 0; z <= this.maxZ; z += this.Z_STEP) {
      if (!this.isEmptyAt(x, y, z)) {
        highestZ = z
      }
    }
    
    return highestZ
  }
  
  /**
   * 🗺️ 특정 Z 레벨의 점유 맵 가져오기 (디버그용)
   */
  public getOccupancyMapAtZ(z: number): boolean[][] {
    const size = this.gridMax - this.gridMin + 1
    const map: boolean[][] = Array(size).fill(null).map(() => Array(size).fill(false))
    
    for (let x = this.gridMin; x <= this.gridMax; x++) {
      for (let y = this.gridMin; y <= this.gridMax; y++) {
        const mapX = x - this.gridMin
        const mapY = y - this.gridMin
        map[mapY][mapX] = !this.isEmptyAt(x, y, z)
      }
    }
    
    return map
  }
  
  /**
   * 🧭 빈 공간 찾기 (캐릭터 이동용)
   */
  public findEmptySpaces(z: number = 0): { x: number, y: number }[] {
    const emptySpaces: { x: number, y: number }[] = []
    
    for (let x = this.gridMin; x <= this.gridMax; x++) {
      for (let y = this.gridMin; y <= this.gridMax; y++) {
        if (this.isEmptyAt(x, y, z)) {
          emptySpaces.push({ x, y })
        }
      }
    }
    
    return emptySpaces
  }
  
  /**
   * 🚶 경로 찾기 (A* 알고리즘)
   */
  public findPath(
    startX: number,
    startY: number,
    endX: number,
    endY: number,
    z: number = 0
  ): { x: number, y: number }[] | null {
    // 시작점과 끝점이 유효한지 확인
    if (!this.isEmptyAt(startX, startY, z) || !this.isEmptyAt(endX, endY, z)) {
      return null
    }
    
    interface Node {
      x: number
      y: number
      g: number // 시작점으로부터의 거리
      h: number // 목적지까지의 추정 거리
      f: number // g + h
      parent: Node | null
    }
    
    const openSet: Node[] = []
    const closedSet = new Set<string>()
    
    // 시작 노드
    const startNode: Node = {
      x: startX,
      y: startY,
      g: 0,
      h: this.heuristic(startX, startY, endX, endY),
      f: 0,
      parent: null
    }
    startNode.f = startNode.g + startNode.h
    
    openSet.push(startNode)
    
    while (openSet.length > 0) {
      // F값이 가장 낮은 노드 찾기
      let current = openSet.reduce((min, node) => 
        node.f < min.f ? node : min, openSet[0])
      
      // 목적지 도달
      if (current.x === endX && current.y === endY) {
        return this.reconstructPath(current)
      }
      
      // openSet에서 제거하고 closedSet에 추가
      openSet.splice(openSet.indexOf(current), 1)
      closedSet.add(`${current.x},${current.y}`)
      
      // 이웃 노드들 확인
      const neighbors = this.getNeighbors(current.x, current.y, z)
      
      for (const neighbor of neighbors) {
        const key = `${neighbor.x},${neighbor.y}`
        if (closedSet.has(key)) continue
        
        const g = current.g + 1
        
        let neighborNode = openSet.find(n => n.x === neighbor.x && n.y === neighbor.y)
        
        if (!neighborNode) {
          // 새 노드 생성
          neighborNode = {
            x: neighbor.x,
            y: neighbor.y,
            g: g,
            h: this.heuristic(neighbor.x, neighbor.y, endX, endY),
            f: 0,
            parent: current
          }
          neighborNode.f = neighborNode.g + neighborNode.h
          openSet.push(neighborNode)
        } else if (g < neighborNode.g) {
          // 더 나은 경로 발견
          neighborNode.g = g
          neighborNode.f = neighborNode.g + neighborNode.h
          neighborNode.parent = current
        }
      }
    }
    
    return null // 경로를 찾을 수 없음
  }
  
  /**
   * 🧭 이웃 노드 가져오기
   */
  private getNeighbors(x: number, y: number, z: number): { x: number, y: number }[] {
    const neighbors: { x: number, y: number }[] = []
    const directions = [
      { dx: 0, dy: -1 }, // 상
      { dx: 1, dy: 0 },  // 우
      { dx: 0, dy: 1 },  // 하
      { dx: -1, dy: 0 }, // 좌
    ]
    
    for (const dir of directions) {
      const newX = x + dir.dx
      const newY = y + dir.dy
      
      // 범위 체크 및 빈 공간 체크
      if (newX >= this.gridMin && newX <= this.gridMax &&
          newY >= this.gridMin && newY <= this.gridMax &&
          this.isEmptyAt(newX, newY, z)) {
        neighbors.push({ x: newX, y: newY })
      }
    }
    
    return neighbors
  }
  
  /**
   * 📏 휴리스틱 함수 (맨해튼 거리)
   */
  private heuristic(x1: number, y1: number, x2: number, y2: number): number {
    return Math.abs(x1 - x2) + Math.abs(y1 - y2)
  }
  
  /**
   * 🛤️ 경로 재구성
   */
  private reconstructPath(node: any): { x: number, y: number }[] {
    const path: { x: number, y: number }[] = []
    let current = node
    
    while (current) {
      path.unshift({ x: current.x, y: current.y })
      current = current.parent
    }
    
    return path
  }
  
  /**
   * 🧹 전체 맵 초기화
   */
  public clear(): void {
    this.voxelMap.clear()
    this.itemVoxels.clear()
    console.log('🧹 복셀 맵 초기화됨')
  }
  
  /**
   * 📊 통계 정보
   */
  public getStats(): {
    totalVoxels: number
    totalItems: number
    occupancyRate: number
  } {
    const totalVoxels = this.voxelMap.size
    const totalItems = this.itemVoxels.size
    const maxVoxels = (this.gridMax - this.gridMin + 1) ** 2 * (this.maxZ / this.Z_STEP + 1)
    const occupancyRate = (totalVoxels / maxVoxels) * 100
    
    return {
      totalVoxels,
      totalItems,
      occupancyRate: Math.round(occupancyRate * 100) / 100
    }
  }
}

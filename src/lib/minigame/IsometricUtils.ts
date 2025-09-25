// 아이소메트릭 좌표 변환 유틸리티
export class IsometricUtils {
  static readonly TILE_WIDTH = 100  // 100px로 증가한 타일 너비
  static readonly TILE_HEIGHT = 50  // 2:1 비율 유지한 타일 높이
  
  // 3D 좌표를 2D 스크린 좌표로 변환
  static toScreenCoords(x: number, y: number, z: number = 0): { screenX: number, screenY: number } {
    const screenX = (x - y) * (this.TILE_WIDTH / 2)
    const screenY = (x + y) * (this.TILE_HEIGHT / 2) - (z * this.TILE_HEIGHT)
    return { screenX, screenY }
  }
  
  // 2D 스크린 좌표를 3D 좌표로 변환
  static to3DCoords(screenX: number, screenY: number): { x: number, y: number } {
    const x = Math.floor((screenX / (this.TILE_WIDTH / 2) + screenY / (this.TILE_HEIGHT / 2)) / 2)
    const y = Math.floor((screenY / (this.TILE_HEIGHT / 2) - screenX / (this.TILE_WIDTH / 2)) / 2)
    return { x, y }
  }
  
  // 거리 계산 (3D)
  static distance3D(pos1: { x: number, y: number, z: number }, pos2: { x: number, y: number, z: number }): number {
    const dx = pos2.x - pos1.x
    const dy = pos2.y - pos1.y
    const dz = pos2.z - pos1.z
    return Math.sqrt(dx * dx + dy * dy + dz * dz)
  }
  
  // 좌표 차이를 8방향으로 변환 (표준 아이소메트릭 8방향)
  static coordsToDirection(dx: number, dy: number): 'N' | 'NE' | 'E' | 'SE' | 'S' | 'SW' | 'W' | 'NW' {
    // 아이소메트릭 뷰에서 실제 화면상 보이는 방향과 애니메이션 일치
    
    // 4방향 그리드 기반 이동 (표준 방향)
    if (dx === 1 && dy === 0) return 'SE'    // X+1: 화면 우측 아래
    if (dx === 0 && dy === 1) return 'SW'    // Y+1: 화면 좌측 아래  
    if (dx === -1 && dy === 0) return 'NW'   // X-1: 화면 좌측 위
    if (dx === 0 && dy === -1) return 'NE'   // Y-1: 화면 우측 위
    
    // 8방향 대각선 이동
    if (dx === 1 && dy === -1) return 'E'    // 화면 우측
    if (dx === 1 && dy === 1) return 'S'     // 화면 아래  
    if (dx === -1 && dy === 1) return 'W'    // 화면 좌측
    if (dx === -1 && dy === -1) return 'N'   // 화면 위
    
    // 벡터 정규화 후 가장 가까운 방향 찾기
    const length = Math.sqrt(dx * dx + dy * dy)
    if (length === 0) return 'S' // 기본값
    
    const normalizedDx = dx / length
    const normalizedDy = dy / length
    
    // 8방향 단위벡터와의 내적으로 가장 가까운 방향 찾기
    const directions = [
      { name: 'N' as const, dx: -1, dy: -1 },   // 화면 위
      { name: 'NE' as const, dx: 0, dy: -1 },   // 화면 우측 위  
      { name: 'E' as const, dx: 1, dy: -1 },    // 화면 우측
      { name: 'SE' as const, dx: 1, dy: 0 },    // 화면 우측 아래
      { name: 'S' as const, dx: 1, dy: 1 },     // 화면 아래
      { name: 'SW' as const, dx: 0, dy: 1 },    // 화면 좌측 아래
      { name: 'W' as const, dx: -1, dy: 1 },    // 화면 좌측
      { name: 'NW' as const, dx: -1, dy: 0 }    // 화면 좌측 위
    ]
    
    let bestDirection: 'N' | 'NE' | 'E' | 'SE' | 'S' | 'SW' | 'W' | 'NW' = 'S'
    let maxDotProduct = -2
    
    for (const dir of directions) {
      const dotProduct = normalizedDx * dir.dx + normalizedDy * dir.dy
      if (dotProduct > maxDotProduct) {
        maxDotProduct = dotProduct
        bestDirection = dir.name
      }
    }
    
    return bestDirection
  }
}

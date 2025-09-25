// 새로운 캐릭터 이동 시스템
import * as PIXI from 'pixi.js'
import { 
  Character, 
  Direction, 
  AnimationState, 
  Position3D,
  InteractionEvent,
  InteractionType
} from '@/types/minigame'
import { SpriteFactory, SpriteManager } from './spriteSystem'

// ===========================================
// 🎮 캐릭터 컨트롤러
// ===========================================

export class CharacterController {
  public character: Character
  public sprite: PIXI.Container
  public isMoving = false
  public moveSpeed = 2 // 픽셀/프레임
  public gridSize = 64 // 그리드 셀 크기

  private spriteFactory = new SpriteFactory()
  private currentTween?: any
  private walkCycle = 0
  private onInteraction?: (event: InteractionEvent) => void

  constructor(character: Character, onInteraction?: (event: InteractionEvent) => void) {
    this.character = character
    this.onInteraction = onInteraction
    this.sprite = new PIXI.Container()
    this.initializeSprite()
  }

  private async initializeSprite() {
    // 캐릭터 스프라이트 생성 - 등각뷰 타일 크기에 맞춰 조정
    const characterSprite = await this.spriteFactory.createSprite(
      this.character.spriteId,
      {
        size: { width: 64, height: 75 }, // BaeminCharacter와 일관성 유지
        anchor: { x: 0.5, y: 1 }
      }
    )

    this.sprite.addChild(characterSprite)
    this.updatePosition()
    this.updateAnimation()

  }

  // 위치 업데이트
  private updatePosition() {
    const screenPos = this.gridToScreen(this.character.position)
    this.sprite.x = screenPos.x
    this.sprite.y = screenPos.y
  }

  // 그리드 좌표를 스크린 좌표로 변환 (월드 좌표 기준)
  private gridToScreen(gridPos: Position3D): { x: number, y: number } {
    // 아이소메트릭 좌표 변환 (IsometricUtils와 동일한 방식)
    const x = (gridPos.x - gridPos.y) * 50  // TILE_WIDTH / 2 = 100 / 2
    const y = (gridPos.x + gridPos.y) * 25 - (gridPos.z * 50)  // TILE_HEIGHT / 2 = 50 / 2
    return { x, y }
  }

  // 애니메이션 업데이트
  private updateAnimation() {
    // TODO: 실제 애니메이션 스프라이트 교체
    const animationName = this.getAnimationName()
  }

  private getAnimationName(): string {
    const baseAnimation = this.character.currentAnimation
    const direction = this.character.direction
    return `${baseAnimation}_${direction.toLowerCase()}`
  }

  // 8방향 이동
  public async moveTo(targetPos: Position3D): Promise<boolean> {
    if (this.isMoving) {
      return false
    }

    // 이동 가능성 검사
    if (!this.canMoveTo(targetPos)) {
      return false
    }

    this.isMoving = true
    this.character.currentAnimation = 'walk'
    
    // 방향 계산 및 설정
    this.character.direction = this.calculateDirection(this.character.position, targetPos)
    this.updateAnimation()

    // 부드러운 이동 애니메이션
    const success = await this.animateMovement(targetPos)
    
    if (success) {
      this.character.position = { ...targetPos }
      this.character.currentAnimation = 'idle'
      this.updateAnimation()
      
      // 이동 이벤트 발생
      this.onInteraction?.({
        type: 'character_move',
        source: this.character.id,
        target: '',
        position: targetPos,
        timestamp: new Date()
      })
    }

    this.isMoving = false
    return success
  }

  // 이동 가능성 검사
  private canMoveTo(targetPos: Position3D): boolean {
    // 그리드 범위 검사
    if (targetPos.x < 0 || targetPos.x >= 10 || 
        targetPos.y < 0 || targetPos.y >= 10) {
      return false
    }

    // 높이 차이 검사 (1칸 이상 차이나면 이동 불가)
    if (Math.abs(targetPos.z - this.character.position.z) > 1) {
      return false
    }

    // TODO: 장애물 검사, 다른 캐릭터와 충돌 검사 등

    return true
  }

  // 방향 계산 - 등각뷰 좌표계 기준 (사용자 정의 규칙)
  private calculateDirection(from: Position3D, to: Position3D): Direction {
    const dx = to.x - from.x
    const dy = to.y - from.y

    // 8방향 계산 - 4,4 중심 기준 좌표계
    if (dx === -1 && dy === -1) return 'N'   // 3,3 → N
    if (dx === 0 && dy === -1) return 'NE'   // 4,3 → NE
    if (dx === 1 && dy === -1) return 'E'    // 5,3 → E
    if (dx === 1 && dy === 0) return 'ES'    // 5,4 → ES
    if (dx === 1 && dy === 1) return 'S'     // 5,5 → S
    if (dx === 0 && dy === 1) return 'SW'    // 4,5 → SW
    if (dx === -1 && dy === 1) return 'W'    // 3,5 → W
    if (dx === -1 && dy === 0) return 'WN'   // 3,4 → WN

    // 대각선이 아닌 경우 가장 가까운 방향 선택
    if (Math.abs(dx) > Math.abs(dy)) {
      // 가로 방향이 더 큰 경우
      if (dx > 0) return dy > 0 ? 'ES' : 'E'
      else return dy > 0 ? 'WN' : 'W'
    } else if (Math.abs(dy) > Math.abs(dx)) {
      // 세로 방향이 더 큰 경우
      if (dy > 0) return dx > 0 ? 'SW' : 'W'
      else return dx > 0 ? 'NE' : 'N'
    } else {
      // 동일한 경우 대각선
      if (dx > 0 && dy > 0) return 'S'
      else if (dx > 0 && dy < 0) return 'E'
      else if (dx < 0 && dy > 0) return 'W'
      else return 'N'
    }
  }

  // 부드러운 이동 애니메이션
  private async animateMovement(targetPos: Position3D): Promise<boolean> {
    return new Promise((resolve) => {
      const startPos = this.gridToScreen(this.character.position)
      const endPos = this.gridToScreen(targetPos)
      const distance = Math.sqrt(
        Math.pow(endPos.x - startPos.x, 2) + 
        Math.pow(endPos.y - startPos.y, 2)
      )
      
      const duration = distance / this.moveSpeed // 프레임 수

      let currentFrame = 0
      const animate = () => {
        currentFrame++
        const progress = Math.min(currentFrame / duration, 1)
        
        // Easing 함수 적용 (easeInOutQuad)
        const eased = progress < 0.5 
          ? 2 * progress * progress 
          : -1 + (4 - 2 * progress) * progress

        this.sprite.x = startPos.x + (endPos.x - startPos.x) * eased
        this.sprite.y = startPos.y + (endPos.y - startPos.y) * eased

        // 걸음걸이 애니메이션 효과
        this.walkCycle = (this.walkCycle + 1) % 20
        const bobOffset = Math.sin(this.walkCycle * Math.PI / 10) * 2
        this.sprite.y += bobOffset

        if (progress >= 1) {
          this.sprite.x = endPos.x
          this.sprite.y = endPos.y
          resolve(true)
        } else {
          requestAnimationFrame(animate)
        }
      }

      animate()
    })
  }

  // 키보드 입력 처리
  public handleKeyPress(key: string): boolean {
    if (this.isMoving) return false

    const currentPos = this.character.position
    let targetPos: Position3D | null = null

    switch (key.toLowerCase()) {
      case 'w':
      case 'arrowup':
        targetPos = { ...currentPos, y: currentPos.y - 1 }
        break
      case 's':
      case 'arrowdown':
        targetPos = { ...currentPos, y: currentPos.y + 1 }
        break
      case 'a':
      case 'arrowleft':
        targetPos = { ...currentPos, x: currentPos.x - 1 }
        break
      case 'd':
      case 'arrowright':
        targetPos = { ...currentPos, x: currentPos.x + 1 }
        break
      case 'q':
        targetPos = { ...currentPos, x: currentPos.x - 1, y: currentPos.y - 1 }
        break
      case 'e':
        targetPos = { ...currentPos, x: currentPos.x + 1, y: currentPos.y - 1 }
        break
      case 'z':
        targetPos = { ...currentPos, x: currentPos.x - 1, y: currentPos.y + 1 }
        break
      case 'c':
        targetPos = { ...currentPos, x: currentPos.x + 1, y: currentPos.y + 1 }
        break
      case ' ':
        // 상호작용
        this.interact()
        return true
    }

    if (targetPos) {
      this.moveTo(targetPos)
      return true
    }

    return false
  }

  // 상호작용
  private interact() {
    const interactionPos = this.getInteractionPosition()
    
    this.onInteraction?.({
      type: 'character_move', // TODO: 실제로는 'interact' 타입 추가 필요
      source: this.character.id,
      target: '',
      position: interactionPos,
      timestamp: new Date()
    })

  }

  private getInteractionPosition(): Position3D {
    const currentPos = this.character.position
    const direction = this.character.direction

    switch (direction) {
      case 'N': return { ...currentPos, y: currentPos.y - 1 }
      case 'NE': return { ...currentPos, x: currentPos.x + 1, y: currentPos.y - 1 }
      case 'E': return { ...currentPos, x: currentPos.x + 1 }
      case 'ES': return { ...currentPos, x: currentPos.x + 1, y: currentPos.y + 1 }
      case 'S': return { ...currentPos, y: currentPos.y + 1 }
      case 'SW': return { ...currentPos, x: currentPos.x - 1, y: currentPos.y + 1 }
      case 'W': return { ...currentPos, x: currentPos.x - 1 }
      case 'WN': return { ...currentPos, x: currentPos.x - 1, y: currentPos.y - 1 }
      default: return currentPos
    }
  }

  // AI 자동 이동 (NPC용)
  public async moveToPath(path: Position3D[]): Promise<boolean> {
    for (const position of path) {
      const success = await this.moveTo(position)
      if (!success) {
        return false
      }
      
      // 각 이동 후 잠시 대기
      await new Promise(resolve => setTimeout(resolve, 100))
    }
    
    return true
  }

  // 정리
  public destroy() {
    if (this.currentTween) {
      // TODO: Tween 정리
    }
    
    if (this.sprite.parent) {
      this.sprite.parent.removeChild(this.sprite)
    }
    
    this.sprite.destroy()
  }
}

// ===========================================
// 🗺️ 패스파인딩 (A* 알고리즘)
// ===========================================

export class Pathfinder {
  private gridSize: number

  constructor(gridSize: number = 10) {
    this.gridSize = gridSize
  }

  // A* 경로 찾기
  public findPath(
    start: Position3D, 
    goal: Position3D, 
    obstacles: Position3D[] = []
  ): Position3D[] {
    const openSet: PathNode[] = []
    const closedSet: PathNode[] = []
    
    const startNode: PathNode = {
      position: start,
      g: 0,
      h: this.heuristic(start, goal),
      f: 0,
      parent: null
    }
    startNode.f = startNode.g + startNode.h
    
    openSet.push(startNode)

    while (openSet.length > 0) {
      // f값이 가장 낮은 노드 선택
      let currentNode = openSet[0]
      let currentIndex = 0
      
      for (let i = 1; i < openSet.length; i++) {
        if (openSet[i].f < currentNode.f) {
          currentNode = openSet[i]
          currentIndex = i
        }
      }

      // 현재 노드를 openSet에서 제거하고 closedSet에 추가
      openSet.splice(currentIndex, 1)
      closedSet.push(currentNode)

      // 목표에 도달했으면 경로 구성
      if (this.positionsEqual(currentNode.position, goal)) {
        const path: Position3D[] = []
        let current: PathNode | null = currentNode
        
        while (current) {
          path.unshift(current.position)
          current = current.parent
        }
        
        return path
      }

      // 인접한 노드들 검사
      const neighbors = this.getNeighbors(currentNode.position)
      
      for (const neighbor of neighbors) {
        // 장애물이나 범위를 벗어난 경우 스킵
        if (this.isObstacle(neighbor, obstacles) || 
            this.isOutOfBounds(neighbor)) {
          continue
        }

        // 이미 closedSet에 있으면 스킵
        if (closedSet.some(node => this.positionsEqual(node.position, neighbor))) {
          continue
        }

        const tentativeG = currentNode.g + this.distance(currentNode.position, neighbor)
        
        let neighborNode = openSet.find(node => this.positionsEqual(node.position, neighbor))
        
        if (!neighborNode) {
          neighborNode = {
            position: neighbor,
            g: tentativeG,
            h: this.heuristic(neighbor, goal),
            f: 0,
            parent: currentNode
          }
          neighborNode.f = neighborNode.g + neighborNode.h
          openSet.push(neighborNode)
        } else if (tentativeG < neighborNode.g) {
          neighborNode.g = tentativeG
          neighborNode.f = neighborNode.g + neighborNode.h
          neighborNode.parent = currentNode
        }
      }
    }

    // 경로를 찾지 못한 경우
    return []
  }

  private heuristic(pos1: Position3D, pos2: Position3D): number {
    // 맨하탄 거리 + 높이 차이
    return Math.abs(pos1.x - pos2.x) + 
           Math.abs(pos1.y - pos2.y) + 
           Math.abs(pos1.z - pos2.z)
  }

  private distance(pos1: Position3D, pos2: Position3D): number {
    // 유클리드 거리
    return Math.sqrt(
      Math.pow(pos1.x - pos2.x, 2) +
      Math.pow(pos1.y - pos2.y, 2) +
      Math.pow(pos1.z - pos2.z, 2)
    )
  }

  private getNeighbors(position: Position3D): Position3D[] {
    const neighbors: Position3D[] = []
    
    // 8방향 + 위/아래
    const directions = [
      { dx: 0, dy: -1, dz: 0 },  // N
      { dx: 1, dy: -1, dz: 0 },  // NE
      { dx: 1, dy: 0, dz: 0 },   // E
      { dx: 1, dy: 1, dz: 0 },   // SE
      { dx: 0, dy: 1, dz: 0 },   // S
      { dx: -1, dy: 1, dz: 0 },  // SW
      { dx: -1, dy: 0, dz: 0 },  // W
      { dx: -1, dy: -1, dz: 0 }, // NW
      { dx: 0, dy: 0, dz: 1 },   // UP
      { dx: 0, dy: 0, dz: -1 }   // DOWN
    ]

    for (const dir of directions) {
      neighbors.push({
        x: position.x + dir.dx,
        y: position.y + dir.dy,
        z: position.z + dir.dz
      })
    }

    return neighbors
  }

  private isObstacle(position: Position3D, obstacles: Position3D[]): boolean {
    return obstacles.some(obstacle => this.positionsEqual(obstacle, position))
  }

  private isOutOfBounds(position: Position3D): boolean {
    return position.x < 0 || position.x >= this.gridSize ||
           position.y < 0 || position.y >= this.gridSize ||
           position.z < 0 || position.z >= 5 // 높이 제한
  }

  private positionsEqual(pos1: Position3D, pos2: Position3D): boolean {
    return pos1.x === pos2.x && pos1.y === pos2.y && pos1.z === pos2.z
  }
}

interface PathNode {
  position: Position3D
  g: number // 시작점으로부터의 거리
  h: number // 목표점까지의 추정 거리
  f: number // g + h
  parent: PathNode | null
}

// ===========================================
// 🎮 캐릭터 매니저
// ===========================================

export class CharacterManager {
  private characters: Map<string, CharacterController> = new Map()
  private container: PIXI.Container
  private pathfinder: Pathfinder

  constructor(container: PIXI.Container) {
    this.container = container
    this.pathfinder = new Pathfinder()
  }

  // 캐릭터 추가
  public addCharacter(
    character: Character, 
    onInteraction?: (event: InteractionEvent) => void
  ): CharacterController {
    const controller = new CharacterController(character, onInteraction)
    this.characters.set(character.id, controller)
    this.container.addChild(controller.sprite)
    
    return controller
  }

  // 캐릭터 제거
  public removeCharacter(characterId: string): boolean {
    const controller = this.characters.get(characterId)
    if (controller) {
      controller.destroy()
      this.characters.delete(characterId)
      return true
    }
    return false
  }

  // 캐릭터 가져오기
  public getCharacter(characterId: string): CharacterController | undefined {
    return this.characters.get(characterId)
  }

  // 모든 캐릭터 가져오기
  public getAllCharacters(): CharacterController[] {
    return Array.from(this.characters.values())
  }

  // 키보드 이벤트 처리 (플레이어 캐릭터용)
  public handleKeyPress(key: string, playerId: string): boolean {
    const player = this.characters.get(playerId)
    if (player) {
      return player.handleKeyPress(key)
    }
    return false
  }

  // 경로 찾기
  public findPath(start: Position3D, goal: Position3D): Position3D[] {
    // 다른 캐릭터들의 위치를 장애물로 처리
    const obstacles = this.getAllCharacters()
      .map(controller => controller.character.position)
    
    return this.pathfinder.findPath(start, goal, obstacles)
  }

  // 업데이트 (매 프레임 호출)
  public update() {
    // 캐릭터들의 Z-order 정렬
    this.sortCharactersByDepth()
  }

  private sortCharactersByDepth() {
    const controllers = Array.from(this.characters.values())
    controllers.sort((a, b) => {
      const posA = a.character.position
      const posB = b.character.position
      return (posB.y + posB.x) - (posA.y + posA.x)
    })

    controllers.forEach((controller, index) => {
      controller.sprite.zIndex = index
    })
  }

  // 정리
  public destroy() {
    this.characters.forEach(controller => controller.destroy())
    this.characters.clear()
  }
}

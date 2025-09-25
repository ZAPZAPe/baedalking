/**
 * 🚶 Character Auto Navigator - 캐릭터 자동 이동 시스템
 * 
 * 배치 모드에서 캐릭터를 숨기고,
 * 배치 완료 후 빈 공간에 재생성하여
 * 물건이 없는 영역만 자동으로 돌아다니도록 합니다.
 */

import * as PIXI from 'pixi.js'
import { VoxelCollisionManager } from './VoxelCollisionManager'
import { IsometricUtils } from '../IsometricUtils'

export interface CharacterAutoNavigatorConfig {
  objectContainer: PIXI.Container
  collisionManager: VoxelCollisionManager
  gridMin: number
  gridMax: number
}

interface PathNode {
  x: number
  y: number
}

export class CharacterAutoNavigator {
  private objectContainer: PIXI.Container
  private collisionManager: VoxelCollisionManager
  private gridMin: number
  private gridMax: number
  
  // 캐릭터 참조 (외부에서 주입)
  private characterSprite: PIXI.Sprite | null = null
  private emotionContainer: PIXI.Container | null = null
  
  // 캐릭터 상태
  private isHidden: boolean = false
  private currentPosition: { x: number, y: number, z: number } = { x: 0, y: 0, z: 0 }
  private targetPosition: { x: number, y: number, z: number } | null = null
  
  // 자동 이동 관련
  private isAutoMoving: boolean = false
  private currentPath: PathNode[] = []
  private pathIndex: number = 0
  // 타일 단위 이동: 한 타일까지 이동에 걸리는 시간(ms)
  private moveDurationMs: number = 220
  private moveTimerMs: number = 0
  private stepActive: boolean = false
  private stepStartScreen: { x: number, y: number } | null = null
  private stepEndScreen: { x: number, y: number } | null = null
  private idleTimer: number = 0
  private idleDelay: number = 180 // 3초 대기
  
  // 애니메이션
  private animationTimer: number = 0
  private animationFrame: number = 0
  private isWalking: boolean = false
  private walkAnimation: PIXI.Texture[] = []
  
  // 캐릭터 방향
  private currentDirection: string = 'S'
  
  constructor(config: CharacterAutoNavigatorConfig) {
    this.objectContainer = config.objectContainer
    this.collisionManager = config.collisionManager
    this.gridMin = config.gridMin
    this.gridMax = config.gridMax
  }
  
  /**
   * 🔗 캐릭터 참조 설정
   */
  public setCharacterReferences(
    characterSprite: PIXI.Sprite,
    emotionContainer?: PIXI.Container
  ): void {
    console.log('🎮 캐릭터 참조 설정:', {
      characterSprite: !!characterSprite,
      emotionContainer: !!emotionContainer,
      characterPosition: characterSprite ? { x: characterSprite.x, y: characterSprite.y } : null
    })
    
    this.characterSprite = characterSprite
    this.emotionContainer = emotionContainer || null
    
    // 앵커를 하단 중앙으로 강제 (그리드 정렬 기준 통일)
    if ((this.characterSprite as any).anchor) {
      this.characterSprite.anchor.set(0.5, 1.0)
    }
    
    // 캐릭터 초기 위치 설정 (그리드 스냅)
    if (characterSprite) {
      const { x, y } = IsometricUtils.to3DCoords(
        characterSprite.x,
        characterSprite.y
      )
      this.currentPosition = { x: Math.round(x), y: Math.round(y), z: 0 }
      console.log('📍 캐릭터 초기 위치 설정:', this.currentPosition)
    }
  }
  
  /**
   * 👻 캐릭터 숨기기 (배치 모드 시작)
   */
  public hideCharacter(): void {
    console.log('👻 캐릭터 숨김 시도:', {
      characterSprite: !!this.characterSprite,
      emotionContainer: !!this.emotionContainer,
      characterVisible: this.characterSprite?.visible,
      emotionVisible: this.emotionContainer?.visible
    })
    
    if (this.characterSprite) {
      this.characterSprite.visible = false
      this.isHidden = true
      this.isAutoMoving = false
      this.currentPath = []
      
      console.log('✅ 캐릭터 스프라이트 숨김 완료')
    } else {
      console.warn('⚠️ 캐릭터 스프라이트가 설정되지 않았습니다')
    }
    
    if (this.emotionContainer) {
      this.emotionContainer.visible = false
      console.log('✅ 감정표현 컨테이너 숨김 완료')
    } else {
      console.warn('⚠️ 감정표현 컨테이너가 설정되지 않았습니다')
    }
  }
  
  /**
   * 🎭 캐릭터 재생성 (배치 모드 종료)
   */
  public respawnCharacter(x: number, y: number, z: number = 0): void {
    console.log('🎭 캐릭터 재생성 시도:', { x, y, z, characterSprite: !!this.characterSprite })
    
    if (!this.characterSprite) {
      console.warn('⚠️ 캐릭터 스프라이트가 설정되지 않았습니다')
      return
    }
    
    // 그리드 클램프/스냅
    x = Math.max(this.gridMin, Math.min(this.gridMax, Math.round(x)))
    y = Math.max(this.gridMin, Math.min(this.gridMax, Math.round(y)))
    z = 0
    
    // 빈 공간 확인
    if (!this.collisionManager.isEmptyAt(x, y, z)) {
      console.log('🔍 지정된 위치가 비어있지 않음, 다른 위치 찾는 중...')
      // 다른 빈 공간 찾기
      const emptySpot = this.findNearestEmptySpace(x, y, z)
      if (emptySpot) {
        x = emptySpot.x
        y = emptySpot.y
        console.log('✅ 빈 공간 발견:', { x, y })
      } else {
        console.warn('⚠️ 빈 공간을 찾을 수 없습니다, 기본 위치 사용')
        x = 0
        y = 0
      }
    }
    
    // 캐릭터 위치 설정
    this.currentPosition = { x, y, z }
    const { screenX, screenY } = IsometricUtils.toScreenCoords(x, y, z)
    this.characterSprite.x = screenX
    this.characterSprite.y = screenY
    
    // 렌더 순서: 화면 아래쪽이 위에 보이도록
    this.characterSprite.zIndex = Math.round(screenY * 10)
    this.objectContainer.sortChildren()
    
    // 캐릭터 보이기
    this.characterSprite.visible = true
    this.isHidden = false
    
    console.log('✅ 캐릭터 스프라이트 재생성 완료:', {
      position: this.currentPosition,
      screenPosition: { x: screenX, y: screenY },
      visible: this.characterSprite.visible
    })
    
    if (this.emotionContainer) {
      this.emotionContainer.visible = true
      this.emotionContainer.x = screenX
      this.emotionContainer.y = screenY - 120 // 캐릭터 위에 표시
      console.log('✅ 감정표현 컨테이너 재생성 완료')
    }
    
    // 자동 이동 시작
    this.startAutoMovement()
    
    console.log(`🎭 캐릭터 재생성: (${x}, ${y}, ${z})`)
  }
  
  /**
   * 🔍 가장 가까운 빈 공간 찾기
   */
  private findNearestEmptySpace(
    targetX: number,
    targetY: number,
    z: number = 0
  ): { x: number, y: number } | null {
    const emptySpaces = this.collisionManager.findEmptySpaces(z)
    
    if (emptySpaces.length === 0) return null
    
    // 거리 기준으로 정렬
    emptySpaces.sort((a, b) => {
      const distA = Math.abs(a.x - targetX) + Math.abs(a.y - targetY)
      const distB = Math.abs(b.x - targetX) + Math.abs(b.y - targetY)
      return distA - distB
    })
    
    return emptySpaces[0]
  }
  
  /**
   * 🚀 자동 이동 시작
   */
  private startAutoMovement(): void {
    this.isAutoMoving = true
    this.idleTimer = 0
    this.findNewDestination()
  }
  
  /**
   * 🎯 새로운 목적지 찾기
   */
  private findNewDestination(): void {
    // 이웃 중 비어있는 칸들만 후보
    const neighbors = [
      { x: this.currentPosition.x, y: this.currentPosition.y - 1 },
      { x: this.currentPosition.x + 1, y: this.currentPosition.y },
      { x: this.currentPosition.x, y: this.currentPosition.y + 1 },
      { x: this.currentPosition.x - 1, y: this.currentPosition.y },
    ]
    const inBounds = (x: number, y: number) => (
      x >= this.gridMin && x <= this.gridMax && y >= this.gridMin && y <= this.gridMax
    )
    const candidates = neighbors.filter(n => inBounds(n.x, n.y) && this.collisionManager.isEmptyAt(n.x, n.y, this.currentPosition.z))
    
    if (candidates.length === 0) {
      // 주변이 막혀있으면 잠시 대기 후 다시 시도
      this.isWalking = false
      this.idleTimer = 0
      return
    }
    
    // 무작위 후보 선택
    const dest = candidates[Math.floor(Math.random() * candidates.length)]
    this.currentPath = [ { x: dest.x, y: dest.y } ]
    this.pathIndex = 0
    this.targetPosition = { x: dest.x, y: dest.y, z: this.currentPosition.z }
    
    // 스텝 초기화 (화면 좌표로 보간)
    const start = IsometricUtils.toScreenCoords(this.currentPosition.x, this.currentPosition.y, this.currentPosition.z)
    const end = IsometricUtils.toScreenCoords(dest.x, dest.y, this.currentPosition.z)
    this.stepStartScreen = { x: start.screenX, y: start.screenY }
    this.stepEndScreen = { x: end.screenX, y: end.screenY }
    this.moveTimerMs = 0
    this.stepActive = true
    this.isWalking = true
    
    // 방향 설정
    this.updateDirection(dest.x - this.currentPosition.x, dest.y - this.currentPosition.y)
  }
  
  /**
   * 🔄 업데이트 (매 프레임)
   */
  public update(deltaTime: number): void {
    if (!this.characterSprite || this.isHidden || !this.isAutoMoving) return
    
    // 목적지가 없으면 대기 → 잠시 후 이웃으로 한 칸 이동 시도
    if (!this.targetPosition || this.currentPath.length === 0) {
      this.idleTimer += deltaTime
      
      // 대기 시간이 지나면 새 목적지 찾기
      if (this.idleTimer >= this.idleDelay) {
        this.idleTimer = 0
        this.findNewDestination()
      }
      return
    }
    
    // 캐릭터 타일-스텝 이동
    this.moveCharacter(deltaTime)
    
    // 애니메이션 업데이트
    this.updateAnimation(deltaTime)
  }
  
  /**
   * 🚶 캐릭터 이동 처리
   */
  private moveCharacter(deltaTime: number): void {
    if (!this.characterSprite || !this.targetPosition) return
    if (!this.stepActive || !this.stepStartScreen || !this.stepEndScreen) {
      // 다음 스텝이 없으면 새로운 목적지를 찾는다
      this.targetPosition = null
      this.currentPath = []
      this.isWalking = false
      this.idleTimer = 0
      return
    }
    
    this.moveTimerMs += (deltaTime * 16.6667) // PIXI deltaTime ≈ frame count, 60fps 환산
    const tRaw = Math.min(1, this.moveTimerMs / this.moveDurationMs)
    // 이징(자연스러운 가감속)
    const t = tRaw < 0.5 ? 2*tRaw*tRaw : -1 + (4 - 2*tRaw)*tRaw
    const nx = this.stepStartScreen.x + (this.stepEndScreen.x - this.stepStartScreen.x) * t
    const ny = this.stepStartScreen.y + (this.stepEndScreen.y - this.stepStartScreen.y) * t
    
    this.characterSprite.x = nx
    this.characterSprite.y = ny
    this.characterSprite.zIndex = Math.round(ny * 10)
    this.objectContainer.sortChildren()
    
    if (this.emotionContainer) {
      this.emotionContainer.x = nx
      this.emotionContainer.y = ny - 120
    }
    
    if (tRaw >= 1) {
      // 스텝 완료
      this.currentPosition = { ...this.targetPosition }
      this.stepActive = false
      this.stepStartScreen = null
      this.stepEndScreen = null
      this.moveTimerMs = 0
      this.isWalking = false
      
      // 잠깐 쉬었다 다음 이웃으로 이동
      this.targetPosition = null
      this.currentPath = []
      this.idleTimer = 0
    }
  }
  
  /**
   * 🧭 방향 업데이트
   */
  private updateDirection(dx: number, dy: number): void {
    if (dx === 0 && dy === 0) return
    
    // 8방향 판단
    const angle = Math.atan2(dy, dx) * 180 / Math.PI
    
    if (angle >= -22.5 && angle < 22.5) {
      this.currentDirection = 'E'
    } else if (angle >= 22.5 && angle < 67.5) {
      this.currentDirection = 'SE'
    } else if (angle >= 67.5 && angle < 112.5) {
      this.currentDirection = 'S'
    } else if (angle >= 112.5 && angle < 157.5) {
      this.currentDirection = 'SW'
    } else if (angle >= 157.5 || angle < -157.5) {
      this.currentDirection = 'W'
    } else if (angle >= -157.5 && angle < -112.5) {
      this.currentDirection = 'NW'
    } else if (angle >= -112.5 && angle < -67.5) {
      this.currentDirection = 'N'
    } else if (angle >= -67.5 && angle < -22.5) {
      this.currentDirection = 'NE'
    }
  }
  
  /**
   * 🎬 애니메이션 업데이트
   */
  private updateAnimation(deltaTime: number): void {
    if (!this.characterSprite) return
    
    // 걷는 중에만 프레임 전환
    if (this.isWalking) {
      this.animationTimer += deltaTime
      if (this.animationTimer >= 8) { // 프레임 속도 조절
        this.animationTimer = 0
        this.animationFrame = (this.animationFrame + 1) % 3
        // TODO: 실제 캐릭터 텍스처 스왑 시스템 연동
      }
    } else {
      // 정지 상태 프레임
      this.animationTimer = 0
      this.animationFrame = 0
    }
  }
  
  /**
   * 🛑 자동 이동 중지
   */
  public stopAutoMovement(): void {
    this.isAutoMoving = false
    this.currentPath = []
    this.targetPosition = null
    this.idleTimer = 0
    
    console.log('🛑 자동 이동 중지')
  }
  
  /**
   * 📍 현재 위치 가져오기
   */
  public getCurrentPosition(): { x: number, y: number, z: number } {
    return { ...this.currentPosition }
  }
  
  /**
   * 📍 특정 위치로 이동
   */
  public moveTo(x: number, y: number, z: number = 0): void {
    if (!this.characterSprite) return
    
    // 빈 공간 확인
    if (!this.collisionManager.isEmptyAt(x, y, z)) {
      console.warn(`⚠️ (${x}, ${y}, ${z})는 이동할 수 없는 위치입니다`)
      return
    }
    
    // 경로 찾기
    const path = this.collisionManager.findPath(
      this.currentPosition.x,
      this.currentPosition.y,
      x,
      y,
      z
    )
    
    if (path && path.length > 1) {
      this.currentPath = path.slice(1)
      this.pathIndex = 0
      this.targetPosition = {
        x: this.currentPath[0].x,
        y: this.currentPath[0].y,
        z: z
      }
      
      this.isAutoMoving = false // 수동 이동 모드
    }
  }
  
  /**
   * 🧹 정리
   */
  public destroy(): void {
    this.stopAutoMovement()
    this.characterSprite = null
    this.emotionContainer = null
  }
}

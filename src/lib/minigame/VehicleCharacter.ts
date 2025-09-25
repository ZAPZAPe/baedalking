// 마을에서 사용할 운송수단 캐릭터 클래스

// VehicleInfo 타입 정의
interface VehicleInfo {
  id: string
  name: string
  imagePath: string
  frames?: number
  directions?: string[]
  category?: string
  color?: string
  type?: string
}
import { IsometricUtils } from './IsometricUtils'

interface Position3D {
  x: number
  y: number
  z: number
}

export class VehicleCharacter {
  public sprite!: any // PIXI.Sprite
  private app: any
  
  // 캐릭터 상태
  public position: Position3D = { x: 0, y: 0, z: 0 }
  private targetPosition: Position3D | null = null
  private startPosition: Position3D | null = null
  private isMoving: boolean = false
  private moveProgress: number = 0
  
  // 운송수단 정보
  public vehicleInfo: VehicleInfo
  private currentDirection: string = 'S' // 현재 방향
  private targetDirection: string = 'S'
  private animationIndex: number = 0
  private animationTimer: number = 0
  private textures: any[] = [] // PIXI.Texture[]
  
  // 애니메이션 설정
  private animationSpeed = 120 // 자연스러운 애니메이션 속도
  private baseSpeed = 0.06    // 자연스러운 시작 속도
  private currentSpeed = 0.06
  private acceleration = 0.015 // 부드러운 가속
  private deceleration = 0.02  // 부드러운 감속
  private maxSpeed = 0.12     // 적당한 최대 속도
  private minSpeed = 0.04     // 최소 속도
  private directionChangeSpeed = 0.25 // 부드러운 방향 전환
  
  // L자 이동 시스템
  private moveQueue: Position3D[] = [] // L자 이동 대기열
  private currentStepIndex = 0 // 현재 이동 단계
  
  // 흔들림 효과
  private bobbingTimer = 0
  private bobbingAmount = 1.5
  private randomOffset = { x: 0, y: 0 }
  
  constructor(app: any, vehicleInfo: VehicleInfo, initialPosition: Position3D = { x: 0, y: 0, z: 0 }) {
    this.app = app
    this.vehicleInfo = vehicleInfo
    this.position = { ...initialPosition }
    this.loadVehicleTextures()
  }
  
  // 운송수단 텍스처 로드
  private async loadVehicleTextures() {
    try {
      this.textures = []
      
      // 운송수단 애니메이션 프레임 로드 (16프레임)
      for (let i = 1; i <= 3; i++) { // 배민 캐릭터는 1~3 프레임만 있음
        let imagePath = ''
        
        // Vehicle 이미지 경로 (실제 파일이 없으므로 기본 캐릭터로 대체)
        imagePath = `/Garage/Character/배민/S_${i}.png`
        
        try {
          const texture = await this.loadTextureFromPath(imagePath)
          if (texture) {
            this.textures.push(texture)
          }
        } catch (textureError) {
        }
      }
      
      if (this.textures.length > 0) {
        this.createSprite()
      }
    } catch (error) {
      this.createFallbackSprite()
    }
  }
  
  // 타입 번호 추출 (Sedan 1 -> 2, Pick-up 1 -> 1 등)
  private getTypeNumber(): number {
    const typeMap: { [key: string]: number } = {
      'Pick-up 1': 1,
      'Sedan 1': 2,
      'Sedan 2': 3,
      'Sedan 3': 4,
      'Sedan 4': 5,
      'Truck 1': 6
    }
    return typeMap[this.vehicleInfo.type || ''] || 1
  }
  
  // 운송수단별 기본 경로
  private getVehicleBasePath(): string {
    switch (this.vehicleInfo.category) {
      case 'taxi':
        return '/Garage/Vehicle/Taxi'
      case 'police':
        return '/Garage/Vehicle/Police'
      case 'ambulance':
        return '/Garage/Vehicle/Ambulance'
      case 'garbage':
        return '/Garage/Vehicle/Garbage'
      default:
        return '/Garage/Vehicle/Civilian'
    }
  }
  
  // 텍스처 로드 헬퍼
  private async loadTextureFromPath(path: string): Promise<any> {
    try {
      const PIXI = await import('pixi.js')
      return await PIXI.Texture.from(path)
    } catch (error) {
      return null
    }
  }
  
  // 스프라이트 생성
  private async createSprite() {
    try {
      const PIXI = await import('pixi.js')
      
      this.sprite = new PIXI.Sprite(this.textures[0])
      
      // 운송수단 크기 설정 (100x100px 복셀에 맞춤)
      this.sprite.width = 100
      this.sprite.height = 100
      this.sprite.anchor.set(0.5, 0.5)
      
      // 초기 위치 설정
      this.updateSpritePosition()
      this.generateRandomOffset()
      
      // 애니메이션 시작
      this.animationTimer = Math.random() * 1000
    } catch (error) {
      this.createFallbackSprite()
    }
  }
  
  // 폴백 스프라이트 생성 (텍스처 로드 실패시)
  private async createFallbackSprite() {
    try {
      const PIXI = await import('pixi.js')
      
      // 임시 색상 사각형
      const graphics = new PIXI.Graphics()
      let color = 0x3498db // 기본 파란색
      
      switch (this.vehicleInfo.category) {
        case 'taxi':
          color = 0xf1c40f // 노란색
          break
        case 'police':
          color = 0x2980b9 // 경찰 파란색
          break
        case 'ambulance':
          color = 0xe74c3c // 빨간색
          break
        case 'garbage':
          color = 0x27ae60 // 초록색
          break
      }
      
      graphics.fill({ color, alpha: 0.8 })
      graphics.rect(-40, -20, 80, 40)
      graphics.fill()
      
      const texture = this.app.renderer.generateTexture(graphics)
      this.sprite = new PIXI.Sprite(texture)
      this.sprite.width = 100
      this.sprite.height = 100
      this.sprite.anchor.set(0.5, 0.5)
      
      this.updateSpritePosition()
    } catch (error) {
    }
  }
  
  // 스프라이트 위치 업데이트
  private updateSpritePosition() {
    if (!this.sprite) return
    
    const coords = IsometricUtils.toScreenCoords(this.position.x, this.position.y, this.position.z)
    
    // 운송수단 높이 오프셋 (지면에 맞춤)
    const vehicleHeightOffset = -50
    
    // 흔들림 효과 적용
    const bobbingOffset = Math.sin(this.bobbingTimer) * this.bobbingAmount
    
    this.sprite.x = coords.screenX + this.randomOffset.x
    this.sprite.y = coords.screenY + vehicleHeightOffset + bobbingOffset + this.randomOffset.y
     // 캐릭터 레이어 z-index (2000-2999 범위)
     this.sprite.zIndex = 2000 + this.position.z * 100 + this.position.y * 10 + this.position.x
  }
  
  // 이동 명령
  public moveTo(gridX: number, gridY: number, gridZ: number = 0) {
    const currentPos = this.position
    const dx = gridX - currentPos.x
    const dy = gridY - currentPos.y
    
    this.moveQueue = []
    this.currentStepIndex = 0
    
    if (dx !== 0 && dy !== 0) {
      // L자 이동: X축 먼저, 그다음 Y축
      this.moveQueue.push({ x: gridX, y: currentPos.y, z: gridZ })
      this.moveQueue.push({ x: gridX, y: gridY, z: gridZ })
    } else {
      // 직선 이동
      this.moveQueue.push({ x: gridX, y: gridY, z: gridZ })
    }
    
    this.startNextStep()
  }
  
  // 다음 이동 단계 시작
  private startNextStep() {
    if (this.currentStepIndex >= this.moveQueue.length) {
      // 이동 완료
      this.isMoving = false
      this.moveQueue = []
      this.currentStepIndex = 0
      this.targetPosition = null
      this.startPosition = null
      this.currentSpeed = this.minSpeed
      this.targetDirection = 'S'
      this.animationIndex = 0
      this.updateSpriteTexture()
      return
    }
    
    // 새 단계 시작
    this.startPosition = { ...this.position }
    this.targetPosition = this.moveQueue[this.currentStepIndex]
    
    const dx = this.targetPosition.x - this.startPosition.x
    const dy = this.targetPosition.y - this.startPosition.y
    
    this.setTargetDirection(dx, dy)
    this.isMoving = true
    this.moveProgress = 0
    this.currentSpeed = this.baseSpeed
    this.bobbingTimer = 0
    
    if (this.currentStepIndex === 0) {
      this.generateRandomOffset()
    }
  }
  
  // 목표 방향 설정
  private setTargetDirection(dx: number, dy: number) {
    this.targetDirection = IsometricUtils.coordsToDirection(dx, dy)
  }
  
  // 랜덤 오프셋 생성
  private generateRandomOffset() {
    this.randomOffset = {
      x: (Math.random() - 0.5) * 6, // 더 작은 범위
      y: (Math.random() - 0.5) * 4
    }
  }
  
  // 스프라이트 텍스처 업데이트
  private updateSpriteTexture() {
    if (!this.sprite || this.textures.length === 0) return
    
    // 방향에 따른 텍스처 인덱스 계산
    const directionIndex = this.getDirectionIndex(this.currentDirection)
    const textureIndex = (directionIndex * 2 + this.animationIndex) % this.textures.length
    
    if (this.textures[textureIndex]) {
      this.sprite.texture = this.textures[textureIndex]
    }
  }
  
  // 방향별 인덱스
  private getDirectionIndex(direction: string): number {
    const directionMap: { [key: string]: number } = {
      'N': 0, 'NE': 1, 'E': 2, 'ES': 3,
      'S': 4, 'SW': 5, 'W': 6, 'WN': 7
    }
    return directionMap[direction] || 4 // 기본값: S
  }
  
  // 업데이트 함수 (매 프레임 호출)
  public update(deltaTime: number) {
    if (this.isMoving && this.targetPosition && this.startPosition) {
      this.updateMovement(deltaTime)
    }
    
    this.updateAnimation(deltaTime)
    this.updateSpritePosition()
  }
  
  // 이동 업데이트
  private updateMovement(deltaTime: number) {
    if (!this.targetPosition || !this.startPosition) return
    
    // 이동 진행률 업데이트
    this.moveProgress += this.currentSpeed * deltaTime * 0.006
    
    // 가속/감속 처리
    if (this.moveProgress < 0.3) {
      this.currentSpeed = Math.min(this.maxSpeed, this.currentSpeed + this.acceleration)
    } else if (this.moveProgress > 0.7) {
      this.currentSpeed = Math.max(this.minSpeed, this.currentSpeed - this.deceleration)
    }
    
    if (this.moveProgress >= 1.0) {
      // 현재 단계 완료
      this.position = { ...this.targetPosition }
      this.currentStepIndex++
      this.startNextStep()
    } else {
      // 보간된 위치 계산
      this.position = {
        x: this.startPosition.x + (this.targetPosition.x - this.startPosition.x) * this.moveProgress,
        y: this.startPosition.y + (this.targetPosition.y - this.startPosition.y) * this.moveProgress,
        z: this.startPosition.z + (this.targetPosition.z - this.startPosition.z) * this.moveProgress
      }
    }
  }
  
  // 애니메이션 업데이트
  private updateAnimation(deltaTime: number) {
    this.animationTimer += deltaTime
    this.bobbingTimer += deltaTime * 0.003
    
    // 방향 전환
    if (this.currentDirection !== this.targetDirection) {
      this.currentDirection = this.targetDirection
    }
    
    // 애니메이션 프레임 업데이트
    if (this.animationTimer > this.animationSpeed) {
      this.animationIndex = (this.animationIndex + 1) % 2 // 0, 1 토글
      this.animationTimer = 0
      this.updateSpriteTexture()
    }
  }
  
  // 정리
  public destroy() {
    if (this.sprite && this.sprite.parent) {
      this.sprite.parent.removeChild(this.sprite)
    }
    this.textures = []
  }
  
  // Getter들
  public getSprite() {
    return this.sprite
  }
  
  public isCurrentlyMoving(): boolean {
    return this.isMoving
  }
  
  public getCurrentPosition(): Position3D {
    return { ...this.position }
  }
}

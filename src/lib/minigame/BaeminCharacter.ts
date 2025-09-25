import * as PIXI from 'pixi.js'
import { Position3D, Direction } from './types'
import { IsometricUtils } from './IsometricUtils'

// 배민 캐릭터 시스템 - 자연스러운 ISO 등각뷰 움직임
export class BaeminCharacter {
  public sprite: PIXI.Sprite
  private position: Position3D
  private targetPosition: Position3D | null = null
  private isMoving = false
  private currentDirection: Direction = 'S' // ISO 등각뷰 기본 방향 (정면)
  private animationFrame = 2
  private animationTimer = 0
  private animationSpeed = 120 // 더 빠른 애니메이션 속도
  private animationPattern = [1, 2, 3, 2] // 1-2-3-2-1 패턴
  private animationIndex = 1 // 기본값 1 (2번 프레임이 서 있는 모습) - 실제로는 2번 프레임 사용
  private textures: Map<string, PIXI.Texture[]> = new Map()
  
  // 감정표현 관련 속성들
  private emotionSprite: PIXI.Sprite | null = null
  private emotionContainer: PIXI.Container | null = null
  private currentEmotion: any = null
  private emotionFloatTimer = 0
  private emotionFloatSpeed = 0.05 // 더 빠른 애니메이션 속도
  
  // 자연스러운 이동 속도 (개선됨)
  private baseSpeed = 0.08   // 더 빠른 시작 속도
  private currentSpeed = 0.08
  private acceleration = 0.02  // 더 빠른 가속
  private deceleration = 0.025 // 더 빠른 감속
  private maxSpeed = 0.15    // 더 빠른 최대 속도
  private minSpeed = 0.05    // 더 빠른 최소 속도
  
  // 그리드 기반 직선 이동을 위한 변수들
  private moveProgress = 0 // 이동 진행도 (0~1)
  private startPosition: Position3D | null = null
  private moveQueue: Position3D[] = [] // 이동 대기열
  private currentStepIndex = 0 // 현재 이동 단계
  
  // 자연스러운 효과들 (아이소메트릭 8방향 이동에 최적화)
  private bobbingTimer = 0 // 위아래 흔들림 (걸음걸이)
  private bobbingAmount = 2.0 // 더 역동적인 걸음걸이 효과
  private randomOffset = { x: 0, y: 0 } // 약간의 랜덤 오프셋
  
  // 즉시 방향 전환 (자연스러운 8방향 애니메이션)
  private targetDirection: Direction = 'S'
  
  // 마을 포털 트리거 콜백
  private onVillagePortalTrigger?: () => void

  constructor() {
    // 기본 스프라이트 생성 (나중에 텍스처로 교체)
    this.sprite = new PIXI.Sprite(PIXI.Texture.WHITE)
    this.sprite.width = 100  // 1복셀 = 100x100px에 정확히 맞춤
    this.sprite.height = 100 // 1복셀 = 100x100px에 정확히 맞춤
    this.sprite.anchor.set(0.5, 1.0) // 하단 중앙 기준 (타일과 동일 기준)
    this.sprite.tint = 0x00ff88 // 초록색으로 표시 (로딩 전까지)
    
    // 감정표현 컨테이너 생성
    this.emotionContainer = new PIXI.Container()
    
    // 아이소메트릭 그리드 중앙 (0,0) 정확한 시작 위치
    this.position = { 
      x: 0, 
      y: 0, 
      z: 0 
    }
    
    // 초기 랜덤 오프셋 설정
    this.generateRandomOffset()
    
    this.updateSpritePosition()
  }
  
  async loadTextures(userId?: string) {
    
    // 사용자의 현재 캐릭터 정보 가져오기
    let characterSpritePath = '/Garage/Character/배민/' // 기본값 (배민커넥터)
    let userEmotion = null
    
    if (userId) {
      try {
        const response = await fetch(`/api/user-current-character?userId=${userId}`)
        if (response.ok) {
          const data = await response.json()
          if (data.character && data.character.pixel_data && data.character.pixel_data.sprite_path) {
            characterSpritePath = data.character.pixel_data.sprite_path
          } else {
          }
          
          // 감정표현 정보도 함께 로드
          if (data.emotion) {
            userEmotion = data.emotion
          }
        }
      } catch (error) {
      }
    }
    
    // 표준 아이소메트릭 8방향
    const directions: Direction[] = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW']
    const frames = [1, 2, 3]
    
    // 🚀 프리로드 확인: 이미 캐시된 텍스처 사용하면 즉시 로딩!
    const preloadedCount = this.checkPreloadedTextures(directions, frames)
    if (preloadedCount > 0) {
    }
    
    // 🎯 1단계: 기본 방향(S) 우선 로딩 - 캐릭터 즉시 표시
    await this.loadDirectionTextures('S', frames, characterSpritePath)
    
    // 기본 텍스처 즉시 설정 - 사용자에게 캐릭터 바로 보여주기
    this.updateSpriteTexture()
    
    // 🚀 2단계: 나머지 모든 방향 병렬 로딩 (백그라운드)
    const remainingDirections = directions.filter(dir => dir !== 'S')
    
    // 병렬 로딩으로 3-5배 빠르게!
    const loadPromises = remainingDirections.map(direction => 
      this.loadDirectionTextures(direction, frames, characterSpritePath)
    )
    
    try {
      await Promise.all(loadPromises)
    } catch (error) {
    }
    
    // 감정표현 로드
    if (userEmotion) {
      await this.loadEmotion(userEmotion)
    }
  }

  // 프리로드된 텍스처 확인
  private checkPreloadedTextures(directions: Direction[], frames: number[]): number {
    let cachedCount = 0
    
    directions.forEach(direction => {
      frames.forEach(frame => {
        const path = `/Garage/Character/배민/${direction}_${frame}.png`
        if (PIXI.Assets.cache.has(path)) {
          cachedCount++
        }
      })
    })
    
    return cachedCount
  }

  // 개별 방향 텍스처 로딩 (병렬 처리용)
  private async loadDirectionTextures(direction: Direction, frames: number[], spritePath: string = '/Garage/Character/배민/') {
    const frameTextures: PIXI.Texture[] = []
    
    // 해당 방향의 모든 프레임을 병렬 로딩
    const framePromises = frames.map(async (frame) => {
      try {
        // S_1.png를 S_2.png로 변경 (CHARACTER EDIT와 동일하게)
        let actualFrame = frame
        if (frame === 1) {
          actualFrame = 2
        }
        
        const path = `${spritePath}${direction}_${actualFrame}.png`
        const texture = await PIXI.Assets.load(path)
        return texture
      } catch (error) {
        return PIXI.Texture.WHITE
      }
    })
    
    const loadedTextures = await Promise.all(framePromises)
    frameTextures.push(...loadedTextures)
    
    // 텍스처 맵에 저장
    this.textures.set(direction, frameTextures)
  }

  // 🚀 정적 메서드: 게임 시작 시 미리 텍스처 프리로딩 
  static async preloadTextures(): Promise<void> {
    
    const directions: Direction[] = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW']
    const frames = [1, 2, 3]
    
    // 모든 텍스처 경로 생성
    const allPaths = directions.flatMap(direction => 
      frames.map(frame => `/Garage/Character/배민/${direction}_${frame}.png`)
    )
    
    try {
      // PIXI.Assets 배치 로딩 - 가장 빠른 방법!
      await PIXI.Assets.load(allPaths)
    } catch (error) {
    }
  }
  
  private updateSpriteTexture() {
    const directionTextures = this.textures.get(this.currentDirection)
    if (directionTextures && directionTextures.length > 0) {
      const frameIndex = this.animationPattern[this.animationIndex] - 1
      if (directionTextures[frameIndex]) {
        this.sprite.texture = directionTextures[frameIndex]
        this.sprite.width = 100  // 1복셀 = 100x100px에 정확히 맞춤
        this.sprite.height = 100 // 1복셀 = 100x100px에 정확히 맞춤
        this.sprite.anchor.set(0.5, 1.0)
        this.sprite.tint = 0xffffff // 원래 색으로 복구
      }
    }
  }
  
  // 랜덤 오프셋 생성 (아이소메트릭 8방향 이동에 최적화)
  private generateRandomOffset() {
    // 복셀 내에서 매우 작은 범위로 자연스러운 움직임
    this.randomOffset = {
      x: (Math.random() - 0.5) * 3,  // 매우 작은 X 오프셋
      y: (Math.random() - 0.5) * 2   // 매우 작은 Y 오프셋
    }
  }
  
  private updateSpritePosition() {
    const screenPos = IsometricUtils.toScreenCoords(this.position.x, this.position.y, this.position.z)
    
    // 보빙 효과 (걸을 때 위아래 흔들림)
    const bobbingOffset = this.isMoving ? Math.sin(this.bobbingTimer * 0.01) * this.bobbingAmount : 0
    
    // 그리드와 동일한 베이스라인 - 캐릭터가 그리드 위에 정확히 배치
    // 오프셋 없음 - 그리드와 완전히 일치
    
    // 1복셀(100x100px) 하단을 그리드 베이스라인에 맞춤
    this.sprite.x = screenPos.screenX + this.randomOffset.x
    this.sprite.y = screenPos.screenY + this.randomOffset.y + bobbingOffset
    this.sprite.zIndex = 2000 + this.position.z * 100 + this.position.y * 10 + this.position.x // 캐릭터가 그리드 레이어보다 위에 오도록
    
    // 감정표현 위치도 함께 업데이트
    this.updateEmotionPosition()
  }
  
  update(deltaTime: number) {
    this.updateAnimation(deltaTime)
    this.updateMovement(deltaTime)
    this.updateDirection(deltaTime)
    
    // 보빙 타이머 업데이트 (걸음걸이)
    if (this.isMoving) {
      this.bobbingTimer += deltaTime
    }
    
    // 감정표현 떠다니는 애니메이션 업데이트 (항상 실행)
    this.updateEmotionFloat()
  }
  
  private updateAnimation(deltaTime: number) {
    this.animationTimer += deltaTime
    
    if (this.animationTimer >= this.animationSpeed) {
      this.animationTimer = 0
      
      // 움직이고 있을 때만 애니메이션
      if (this.isMoving) {
        this.animationIndex = (this.animationIndex + 1) % this.animationPattern.length
        this.updateSpriteTexture()
      } else {
        // 정지 시 기본 프레임 (2번이 자연스러운 서 있는 모습)
        this.animationIndex = 1  // animationPattern[1] = 2번 프레임
        this.updateSpriteTexture()
      }
    }
  }
  
  private updateMovement(deltaTime: number) {
    if (!this.targetPosition || !this.isMoving) {
      // 정지 시 속도 감소
      this.currentSpeed = Math.max(this.currentSpeed - this.deceleration * deltaTime * 0.05, 0)
      return
    }
    
    // 그리드 기반 L자 이동 진행도 업데이트 (자연스러운 속도)
    this.moveProgress += this.currentSpeed * deltaTime * 0.006
    
    if (this.moveProgress >= 1) {
      // 목표에 정확히 도착 (아이소메트릭 그리드에 정렬)
      this.position.x = this.targetPosition.x
      this.position.y = this.targetPosition.y
      
      // 다음 이동 단계로 진행
      this.currentStepIndex++
      this.moveProgress = 0
      this.startNextStep()
    } else {
      // 이동 중 속도 조절 (가속/감속)
      if (this.moveProgress < 0.15) {
        // 시작 구간에서 가속
        this.currentSpeed = Math.min(this.currentSpeed + this.acceleration * deltaTime * 0.05, this.maxSpeed)
      } else if (this.moveProgress > 0.85) {
        // 끝 구간에서 감속
        this.currentSpeed = Math.max(this.currentSpeed - this.deceleration * deltaTime * 0.03, this.minSpeed)
      } else {
        // 중간 구간에서 최대 속도 유지
        this.currentSpeed = this.maxSpeed
      }
      
      // 그리드 기반 직선 이동 (L자의 각 단계는 직선)
      if (this.startPosition && this.targetPosition) {
        const t = this.moveProgress
        
        // 선형 보간으로 직선 이동
        this.position.x = this.startPosition.x + (this.targetPosition.x - this.startPosition.x) * t
        this.position.y = this.startPosition.y + (this.targetPosition.y - this.startPosition.y) * t
        this.position.z = this.startPosition.z + (this.targetPosition.z - this.startPosition.z) * t
        
        // 이동 방향은 목표점 기준으로 한번만 설정 (깜빡임 방지)
        if (this.moveProgress < 0.1) {  // 이동 시작 시에만 방향 설정
          const dx = this.targetPosition.x - this.startPosition.x
          const dy = this.targetPosition.y - this.startPosition.y
          this.setTargetDirection(dx, dy)
        }
      }
    }
    
    this.updateSpritePosition()
  }
  
  // 아이소메트릭 8방향 정확한 설정 (화면 좌표 기반)
  private setTargetDirection(dx: number, dy: number) {
    // 벡터의 크기가 0이면 기본 방향 유지
    if (dx === 0 && dy === 0) return
    
    // 🎯 아이소메트릭 그리드 좌표를 화면 좌표로 변환
    // 그리드 (dx, dy) → 화면 방향 벡터
    const screenDx = (dx - dy) * (IsometricUtils.TILE_WIDTH / 2)  // 화면 X 방향
    const screenDy = (dx + dy) * (IsometricUtils.TILE_HEIGHT / 2) // 화면 Y 방향
    
    // 화면 좌표계에서 각도 계산 (Y축이 아래쪽이므로 반전)
    const angle = Math.atan2(screenDy, screenDx) * (180 / Math.PI)
    
    // 8방향으로 각도 영역 분할 (45도씩, 아이소메트릭 화면 기준)
    let newDirection: Direction = 'S' // 기본값
    
    // 🎯 정확한 아이소메트릭 8방향 매핑 (화면 각도 기준)
    if (angle >= -22.5 && angle < 22.5) {
      newDirection = 'E'        // 우측 (0도, 그리드: dx=1, dy=-1)
    } else if (angle >= 22.5 && angle < 67.5) {
      newDirection = 'SE'       // 우하향 (45도, 그리드: dx=1, dy=0)  
    } else if (angle >= 67.5 && angle < 112.5) {
      newDirection = 'S'        // 하향 (90도, 그리드: dx=1, dy=1)
    } else if (angle >= 112.5 && angle < 157.5) {
      newDirection = 'SW'       // 좌하향 (135도, 그리드: dx=0, dy=1)
    } else if (angle >= 157.5 || angle < -157.5) {
      newDirection = 'W'        // 좌측 (180도, 그리드: dx=-1, dy=1)
    } else if (angle >= -157.5 && angle < -112.5) {
      newDirection = 'NW'       // 좌상향 (-135도, 그리드: dx=-1, dy=0)
    } else if (angle >= -112.5 && angle < -67.5) {
      newDirection = 'N'        // 상향 (-90도, 그리드: dx=-1, dy=-1)
    } else if (angle >= -67.5 && angle < -22.5) {
      newDirection = 'NE'       // 우상향 (-45도, 그리드: dx=0, dy=-1)
    }
    
    // 즉시 방향 전환 (자연스러운 8방향 애니메이션)
    if (this.targetDirection !== newDirection) {
      this.targetDirection = newDirection
    }
  }
  
  // 즉시 방향 전환 (부드러운 애니메이션을 위해)
  private updateDirection(deltaTime: number) {
    if (this.currentDirection !== this.targetDirection) {
      // 즉시 방향 전환 (애니메이션은 텍스처 변경으로만)
      this.currentDirection = this.targetDirection
      this.updateSpriteTexture() // 즉시 텍스처 업데이트
    }
  }
  
  moveTo(gridX: number, gridY: number, gridZ: number = 0) {
    // 이미 이동 중이면 현재 위치에서 새로운 목표로 바로 이동 (마지막 선택 우선)
    const currentPos = this.position
    
    // 대각선 이동인지 확인
    const dx = gridX - currentPos.x
    const dy = gridY - currentPos.y
    
    // 이동 대기열 초기화
    this.moveQueue = []
    this.currentStepIndex = 0
    
    // 대각선 포함 직선 이동: 목표로 바로 이동 (부드러운 자연스러운 경로)
    this.moveQueue.push({ x: gridX, y: gridY, z: gridZ })
    
    // 첫 번째 단계 시작
    this.startNextStep()
  }

  private startNextStep() {
    if (this.currentStepIndex >= this.moveQueue.length) {
      // 모든 단계 완료
      this.isMoving = false
      this.moveQueue = []
      this.currentStepIndex = 0
      this.targetPosition = null
      this.startPosition = null
      this.currentSpeed = this.minSpeed
      
      // 정지 시 기본 방향으로 복귀 (ISO 등각뷰 정면)
      this.targetDirection = 'S'
      
      // 정지 시 기본 프레임으로 설정 (2번 프레임)
      this.animationIndex = 1
      this.updateSpriteTexture()
      
      // 마을 포털 제거됨 - 더 이상 체크하지 않음
      // this.checkVillagePortal()
      return
    }
    
    // 현재 단계 설정
    this.startPosition = { ...this.position }
    this.targetPosition = this.moveQueue[this.currentStepIndex]
    
    // 이동 방향 설정 (그리드 기반 4방향)
    const dx = this.targetPosition.x - this.startPosition.x
    const dy = this.targetPosition.y - this.startPosition.y
    this.setTargetDirection(dx, dy)
    
    // 이동 상태 초기화
    this.isMoving = true
    this.moveProgress = 0
    this.currentSpeed = this.baseSpeed
    this.bobbingTimer = 0
    
    // 새로운 랜덤 오프셋 준비 (단계 시작 시에만)
    if (this.currentStepIndex === 0) {
      this.generateRandomOffset()
    }
  }
  
  // 마을 포털 제거됨 - 더 이상 체크하지 않음
  // private checkVillagePortal() {
  //   const currentX = Math.round(this.position.x)
  //   const currentY = Math.round(this.position.y)
  //   
  //   // 마을 포털 그리드인지 확인 (-1,6), (0,6), (1,6)
  //   if ((currentX === -1 && currentY === 6) || 
  //       (currentX === 0 && currentY === 6) || 
  //       (currentX === 1 && currentY === 6)) {
  //     
  //     // 마을로 이동 처리
  //     this.handleVillageTransition()
  //   }
  // }
  // 
  // // 마을 이동 처리
  // private handleVillageTransition() {
  //   // 씬 전환 이벤트 발생 (MiniGameEngine에서 처리)
  //   if (this.onVillagePortalTrigger) {
  //     this.onVillagePortalTrigger()
  //   }
  // }

  getSprite(): PIXI.Sprite {
    return this.sprite
  }
  
  // 마을 포털 트리거 콜백 설정
  setVillagePortalCallback(callback: () => void) {
    this.onVillagePortalTrigger = callback
  }
  
  getPosition(): Position3D {
    return { ...this.position }
  }
  
  isCharacterMoving(): boolean {
    return this.isMoving
  }
  
  getCurrentDirection(): Direction {
    return this.currentDirection
  }
  
  // 감정표현 로드
  private async loadEmotion(emotion: any) {
    try {
      this.currentEmotion = emotion
      
      // 감정표현 텍스처 로드
      const texture = await PIXI.Assets.load(emotion.image_url)
      
      // 감정표현 스프라이트 생성
      this.emotionSprite = new PIXI.Sprite(texture)
      this.emotionSprite.width = 50  // 크기를 50px로 증가
      this.emotionSprite.height = 50
      this.emotionSprite.anchor.set(0.5, 0.5)
      
      // 감정표현 컨테이너에 추가
      if (this.emotionContainer) {
        this.emotionContainer.addChild(this.emotionSprite)
        this.updateEmotionPosition()
      }
      
    } catch (error) {
    }
  }
  
  // 감정표현 위치 업데이트
  private updateEmotionPosition() {
    if (!this.emotionContainer || !this.emotionSprite) return
    
    // 캐릭터 머리 위로 적당한 높이에 배치
    const characterHeight = 100 // 캐릭터 높이
    const emotionOffset = -characterHeight * 1.4 // 캐릭터 머리 위로 적당한 높이 (140% 위쪽)
    
    this.emotionContainer.x = this.sprite.x
    this.emotionContainer.y = this.sprite.y + emotionOffset
    this.emotionContainer.zIndex = this.position.y * 10 + this.position.x + 2000 // 감정표현이 캐릭터보다 위에 오도록
  }
  
  // 감정표현 떠다니는 애니메이션 업데이트
  private updateEmotionFloat() {
    if (!this.emotionSprite) return
    
    this.emotionFloatTimer += this.emotionFloatSpeed
    const floatOffset = Math.sin(this.emotionFloatTimer) * 8 // 더 큰 움직임으로 변경 (8px)
    
    this.emotionSprite.y = floatOffset
  }
  
  // 감정표현 컨테이너 가져오기
  getEmotionContainer(): PIXI.Container | null {
    return this.emotionContainer
  }
}

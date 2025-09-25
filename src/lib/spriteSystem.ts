// 새로운 스프라이트 시스템
import * as PIXI from 'pixi.js'
import { SpriteData, SpriteFrame, SpriteAnimation, Size2D } from '@/types/minigame'

// ===========================================
// 🎨 스프라이트 매니저
// ===========================================

export class SpriteManager {
  private static instance: SpriteManager
  private sprites: Map<string, SpriteData> = new Map()
  private textures: Map<string, PIXI.Texture> = new Map()
  private loadingPromises: Map<string, Promise<PIXI.Texture>> = new Map()

  private constructor() {}

  public static getInstance(): SpriteManager {
    if (!SpriteManager.instance) {
      SpriteManager.instance = new SpriteManager()
    }
    return SpriteManager.instance
  }

  // 스프라이트 등록
  public registerSprite(spriteData: SpriteData): void {
    this.sprites.set(spriteData.id, spriteData)
  }

  // 스프라이트 로드
  public async loadSprite(spriteId: string): Promise<PIXI.Texture> {
    // 이미 로드된 텍스처 반환
    if (this.textures.has(spriteId)) {
      return this.textures.get(spriteId)!
    }

    // 로딩 중이면 기존 Promise 반환
    if (this.loadingPromises.has(spriteId)) {
      return this.loadingPromises.get(spriteId)!
    }

    const sprite = this.sprites.get(spriteId)
    if (!sprite) {
      throw new Error(`스프라이트를 찾을 수 없습니다: ${spriteId}`)
    }

    // 새로운 로딩 Promise 생성
    const loadingPromise = this.loadTexture(sprite)
    this.loadingPromises.set(spriteId, loadingPromise)

    try {
      const texture = await loadingPromise
      this.textures.set(spriteId, texture)
      this.loadingPromises.delete(spriteId)
      
      // 스프라이트 데이터 업데이트
      sprite.isLoaded = true
      return texture
    } catch (error) {
      this.loadingPromises.delete(spriteId)
      throw error
    }
  }

  private async loadTexture(sprite: SpriteData): Promise<PIXI.Texture> {
    return new Promise((resolve, reject) => {
      // Data URL인 경우 (Base64)
      if (sprite.url.startsWith('data:')) {
        const image = new Image()
        image.onload = () => {
          const canvas = document.createElement('canvas')
          const context = canvas.getContext('2d')!
          canvas.width = image.width
          canvas.height = image.height
          context.drawImage(image, 0, 0)
          
          const texture = PIXI.Texture.from(canvas)
          resolve(texture)
        }
        image.onerror = reject
        image.src = sprite.url
      } else {
        // 일반 URL인 경우
        PIXI.Assets.load(sprite.url)
          .then(texture => resolve(texture))
          .catch(reject)
      }
    })
  }

  // 스프라이트 가져오기
  public getSprite(spriteId: string): PIXI.Sprite | null {
    const texture = this.textures.get(spriteId)
    if (!texture) {
      return null
    }

    const sprite = new PIXI.Sprite(texture)
    return sprite
  }

  // 애니메이션 스프라이트 생성
  public getAnimatedSprite(spriteId: string, animationName: string): PIXI.AnimatedSprite | null {
    const spriteData = this.sprites.get(spriteId)
    if (!spriteData || !spriteData.animations) {
      return null
    }

    const animation = spriteData.animations.find(anim => anim.name === animationName)
    if (!animation) {
      return null
    }

    const texture = this.textures.get(spriteId)
    if (!texture || !spriteData.frames) {
      return null
    }

    // 프레임별 텍스처 생성
    const frameTextures: PIXI.Texture[] = []
    for (const frameIndex of animation.frames) {
      const frame = spriteData.frames[frameIndex]
      if (frame) {
        const frameTexture = new PIXI.Texture({
          source: texture.source,
          frame: new PIXI.Rectangle(frame.x, frame.y, frame.width, frame.height)
        })
        frameTextures.push(frameTexture)
      }
    }

    if (frameTextures.length === 0) {
      return null
    }

    const animatedSprite = new PIXI.AnimatedSprite(frameTextures)
    animatedSprite.loop = animation.loop
    animatedSprite.animationSpeed = animation.speed
    
    return animatedSprite
  }

  // 모든 스프라이트 배치 로드
  public async loadSpriteSet(spriteIds: string[]): Promise<void> {
    const promises = spriteIds.map(id => this.loadSprite(id))
    await Promise.all(promises)
  }

  // 메모리 정리
  public cleanup(): void {
    this.textures.forEach(texture => texture.destroy())
    this.textures.clear()
    this.sprites.clear()
    this.loadingPromises.clear()
  }
}

// ===========================================
// 🎯 스프라이트 팩토리
// ===========================================

export class SpriteFactory {
  private spriteManager = SpriteManager.getInstance()

  // 기본 스프라이트 생성
  public async createSprite(spriteId: string, options?: SpriteCreateOptions): Promise<PIXI.Container> {
    const container = new PIXI.Container()
    
    try {
      await this.spriteManager.loadSprite(spriteId)
      const sprite = this.spriteManager.getSprite(spriteId)
      
      if (sprite) {
        if (options?.size) {
          sprite.width = options.size.width
          sprite.height = options.size.height
        }
        
        if (options?.anchor) {
          sprite.anchor.set(options.anchor.x, options.anchor.y)
        } else {
          sprite.anchor.set(0.5, 1) // 기본값: 하단 중앙
        }
        
        if (options?.tint) {
          sprite.tint = options.tint
        }
        
        container.addChild(sprite)
      }
    } catch (error) {
      // 플레이스홀더 생성
      const placeholder = this.createPlaceholder(options?.size || { width: 32, height: 32 })
      container.addChild(placeholder)
    }
    
    return container
  }

  // 애니메이션 스프라이트 생성
  public async createAnimatedSprite(
    spriteId: string, 
    animationName: string, 
    options?: SpriteCreateOptions
  ): Promise<PIXI.Container> {
    const container = new PIXI.Container()
    
    try {
      await this.spriteManager.loadSprite(spriteId)
      const animatedSprite = this.spriteManager.getAnimatedSprite(spriteId, animationName)
      
      if (animatedSprite) {
        if (options?.size) {
          animatedSprite.width = options.size.width
          animatedSprite.height = options.size.height
        }
        
        if (options?.anchor) {
          animatedSprite.anchor.set(options.anchor.x, options.anchor.y)
        } else {
          animatedSprite.anchor.set(0.5, 1)
        }
        
        if (options?.autoPlay !== false) {
          animatedSprite.play()
        }
        
        container.addChild(animatedSprite)
      }
    } catch (error) {
      const placeholder = this.createPlaceholder(options?.size || { width: 32, height: 32 })
      container.addChild(placeholder)
    }
    
    return container
  }

  // 플레이스홀더 생성
  private createPlaceholder(size: Size2D, color: number = 0xff0000): PIXI.Graphics {
    const placeholder = new PIXI.Graphics()
    placeholder.fill({ color, alpha: 0.5 })
    placeholder.rect(-size.width/2, -size.height, size.width, size.height)
    placeholder.fill()
    
    // X 표시
    placeholder.stroke({ color: 0xffffff, width: 2 })
    placeholder.moveTo(-size.width/4, -size.height/2)
    placeholder.lineTo(size.width/4, -size.height/2)
    placeholder.moveTo(0, -size.height * 3/4)
    placeholder.lineTo(0, -size.height/4)
    placeholder.stroke()
    
    return placeholder
  }
}

// ===========================================
// 🔧 유틸리티
// ===========================================

export interface SpriteCreateOptions {
  size?: Size2D
  anchor?: { x: number, y: number }
  tint?: number
  autoPlay?: boolean
}

// 기본 스프라이트 데이터 생성 헬퍼
export function createSpriteData(
  id: string,
  name: string,
  url: string,
  size: Size2D,
  frames?: SpriteFrame[],
  animations?: SpriteAnimation[]
): SpriteData {
  return {
    id,
    name,
    url,
    size,
    frames,
    animations,
    isLoaded: false
  }
}

// 기본 스프라이트 세트
export const DefaultSprites = {
  // 캐릭터
  CHARACTER_IDLE: 'character_idle',
  CHARACTER_WALK: 'character_walk',
  
  // 가구
  BED: 'furniture_bed',
  CHAIR: 'furniture_chair',
  TABLE: 'furniture_table',
  
  // 타일
  GRASS: 'tile_grass',
  DIRT: 'tile_dirt',
  STONE: 'tile_stone',
  
  // 건물
  SHOP_FURNITURE: 'building_furniture_shop',
  SHOP_VEHICLE: 'building_vehicle_shop',
  
  // 운송수단
  SCOOTER: 'vehicle_scooter',
  BIKE: 'vehicle_bike'
}

// 기본 스프라이트 등록
export function registerDefaultSprites(): void {
  const spriteManager = SpriteManager.getInstance()
  
  // 기본 스프라이트들 등록 (실제 URL은 나중에 설정)
  const defaultSprites = [
    createSpriteData(DefaultSprites.CHARACTER_IDLE, '캐릭터 (대기)', '/sprites/character_idle.png', { width: 32, height: 48 }),
    createSpriteData(DefaultSprites.BED, '침대', '/sprites/furniture/bed.png', { width: 64, height: 48 }),
    createSpriteData(DefaultSprites.GRASS, '잔디 타일', '/sprites/tiles/grass.png', { width: 64, height: 32 }),
    createSpriteData(DefaultSprites.SHOP_FURNITURE, '가구 상점', '/sprites/buildings/furniture_shop.png', { width: 96, height: 128 })
  ]
  
  defaultSprites.forEach(sprite => spriteManager.registerSprite(sprite))
}

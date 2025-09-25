import * as PIXI from 'pixi.js'
import { supabase } from '@/lib/supabase'

// 타일맵 데이터 타입
export interface TileData {
  x: number
  y: number
  tileId: string | null
}

export interface TilemapData {
  id: string
  name: string
  tiles: TileData[]
}

// 타일 정보 타입
export interface TileInfo {
  id: string
  name: string
  imagePath: string
}

// 사용 가능한 타일 정보 (하드코딩된 차고 타일맵에서 사용하는 타일들만)
const AVAILABLE_TILES: Record<string, TileInfo> = {
  // 건물부지 타일들
  'lot_lotN': { id: 'lot_lotN', name: '건물부지 북쪽', imagePath: '/Garage/Tile/09_건물부지/lotN.png' },
  'lot_lotS': { id: 'lot_lotS', name: '건물부지 남쪽', imagePath: '/Garage/Tile/09_건물부지/lotS.png' },
  'lot_lotE': { id: 'lot_lotE', name: '건물부지 동쪽', imagePath: '/Garage/Tile/09_건물부지/lotE.png' },
  'lot_lotW': { id: 'lot_lotW', name: '건물부지 서쪽', imagePath: '/Garage/Tile/09_건물부지/lotW.png' },
  'lot_lotNE': { id: 'lot_lotNE', name: '건물부지 북동', imagePath: '/Garage/Tile/09_건물부지/lotNE.png' },
  'lot_lotNW': { id: 'lot_lotNW', name: '건물부지 북서', imagePath: '/Garage/Tile/09_건물부지/lotNW.png' },
  'lot_lotSW': { id: 'lot_lotSW', name: '건물부지 남서', imagePath: '/Garage/Tile/09_건물부지/lotSW.png' },
  'lot_lotES': { id: 'lot_lotES', name: '건물부지 동남', imagePath: '/Garage/Tile/09_건물부지/lotES.png' },
  
  // 도로 타일
  'road_road': { id: 'road_road', name: '기본 도로', imagePath: '/Garage/Tile/04_도로/road.png' },
  
  // 기본 지형 (필요한 경우)
  'basic_grass': { id: 'basic_grass', name: '잔디', imagePath: '/Garage/Tile/01_기본지형/grass.png' },
  'basic_dirt': { id: 'basic_dirt', name: '흙', imagePath: '/Garage/Tile/01_기본지형/dirt.png' }
}

// 하드코딩된 차고 타일맵에서 사용하는 타일들만 로드하므로 동적 추가 불필요

export class TilemapLoader {
  private textureCache: Map<string, PIXI.Texture> = new Map()

  // 텍스처 로드 및 캐싱
  async loadTexture(tileId: string): Promise<PIXI.Texture | null> {
    if (this.textureCache.has(tileId)) {
      return this.textureCache.get(tileId)!
    }

    const tileInfo = AVAILABLE_TILES[tileId]
    if (!tileInfo) {
      return null
    }

    try {
      const texture = await PIXI.Assets.load(tileInfo.imagePath)
      this.textureCache.set(tileId, texture)
      return texture
    } catch (error) {
      return null
    }
  }

  // 기본 타일맵 생성 (빈 타일맵 - 그리드만 표시)
  createDefaultTilemap(): TilemapData {
    // 빈 타일맵 반환 - 그리드만 표시되도록 함
    return {
      id: 'default',
      name: '기본 타일맵 (그리드만)',
      tiles: [] // 빈 타일 배열
    }
  }

  // 데이터베이스에서 타일맵 로드
  async loadTilemapFromDB(tilemapId: string): Promise<TilemapData | null> {
    try {
      const { data, error } = await supabase
        .from('tilemaps')
        .select('*')
        .eq('id', tilemapId)
        .single()

      if (error) {
        return null
      }

      return {
        id: data.id,
        name: data.name,
        tiles: data.data?.tiles || []
      }
    } catch (error) {
      return null
    }
  }

  // JSON 파일에서 타일맵 로드
  async loadTilemapFromJSON(jsonPath: string): Promise<TilemapData | null> {
    try {
      const response = await fetch(jsonPath)
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const jsonData = await response.json()
      
      // JSON 데이터 유효성 검사
      if (!jsonData.name || !jsonData.tiles || !Array.isArray(jsonData.tiles)) {
        throw new Error('잘못된 타일맵 JSON 형식')
      }

      const tilemap: TilemapData = {
        id: jsonData.name.replace(/\s+/g, '_').toLowerCase(),
        name: jsonData.name,
        tiles: jsonData.tiles.map((tile: any) => ({
          x: tile.x,
          y: tile.y,
          tileId: tile.tileId
        }))
      }

      return tilemap

    } catch (error) {
      return null
    }
  }

  // 사용자의 최신 타일맵 로드 (JSON 파일 우선)
  async loadLatestUserTilemap(userId: string): Promise<TilemapData | null> {
    try {
      // 사용자가 만든 JSON 파일 로드 (Next.js public 폴더 절대 경로)
      const jsonPath = '/Garage/Tile/Tile_tilemap.json'
      const jsonTilemap = await this.loadTilemapFromJSON(jsonPath)
      
      if (jsonTilemap) {
        return jsonTilemap
      } else {
      }

      // JSON 로드 실패 시 기존 로직 사용
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        if (process.env.NODE_ENV === 'development') {
        }
        
        // 로컬 저장소에서 사용자 타일맵 찾기
        if (typeof window !== 'undefined') {
          const localTilemaps = localStorage.getItem(`tilemaps_${userId}`)
          if (localTilemaps) {
            const tilemaps = JSON.parse(localTilemaps)
            if (tilemaps.length > 0) {
              if (process.env.NODE_ENV === 'development') {
              }
              return tilemaps[0] // 가장 최신 것
            }
          }
        }
        
        if (process.env.NODE_ENV === 'development') {
        }
        return this.createDefaultTilemap()
      }

      const { data, error } = await supabase
        .from('tilemaps')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (error) {
        if (process.env.NODE_ENV === 'development') {
        }
        
        // 로컬 저장소 폴백
        if (typeof window !== 'undefined') {
          const localTilemaps = localStorage.getItem(`tilemaps_${userId}`)
          if (localTilemaps) {
            const tilemaps = JSON.parse(localTilemaps)
            if (tilemaps.length > 0) {
              if (process.env.NODE_ENV === 'development') {
              }
              return tilemaps[0]
            }
          }
        }
        
        if (process.env.NODE_ENV === 'development') {
        }
        return this.createDefaultTilemap()
      }

      const tilemap = {
        id: data.id,
        name: data.name,
        tiles: data.data?.tiles || []
      }
      
      if (process.env.NODE_ENV === 'development') {
      }
      return tilemap
      
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        const err = error as any
      }
      
      // 최종 폴백: 로컬 저장소 확인
      if (typeof window !== 'undefined') {
        const localTilemaps = localStorage.getItem(`tilemaps_${userId}`)
        if (localTilemaps) {
          try {
            const tilemaps = JSON.parse(localTilemaps)
            if (tilemaps.length > 0) {
              if (process.env.NODE_ENV === 'development') {
              }
              return tilemaps[0]
            }
          } catch (parseError) {
            if (process.env.NODE_ENV === 'development') {
            }
          }
        }
      }
      
      return this.createDefaultTilemap()
    }
  }

  // 모든 텍스처 미리 로드
  async preloadAllTextures(): Promise<void> {
    const loadPromises = Object.keys(AVAILABLE_TILES).map(async (tileId) => {
      try {
        await this.loadTexture(tileId)
      } catch (error) {
      }
    })

    await Promise.all(loadPromises)
  }

  // 캐시 정리
  clearCache(): void {
    this.textureCache.clear()
  }

  // 사용 가능한 타일 목록 반환
  getAvailableTiles(): Record<string, TileInfo> {
    return { ...AVAILABLE_TILES }
  }
}

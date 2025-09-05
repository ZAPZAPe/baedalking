// 🗄️ 새로운 꾸미기 시스템 데이터 스토어 (Supabase 전용)
// 로컬스토리지 완전 제거, 모든 데이터를 Supabase로 통일

import { supabase } from '@/lib/supabase'
import { 
  DecorationItem, 
  InventoryItem, 
  UserGarageData, 
  PlacedItem, 
  Position3D 
} from '@/types'

export class DecorationDataStore {
  private static instance: DecorationDataStore
  private cache: {
    storeItems: DecorationItem[]
    userInventory: { userId: string; items: InventoryItem[] } | null
    userGarageData: UserGarageData | null
  } = {
    storeItems: [],
    userInventory: null,
    userGarageData: null
  }

  private constructor() {}

  static getInstance(): DecorationDataStore {
    if (!DecorationDataStore.instance) {
      DecorationDataStore.instance = new DecorationDataStore()
    }
    return DecorationDataStore.instance
  }

  /**
   * 상점 아이템 목록 조회 (Supabase에서)
   */
  async getStoreItems(): Promise<DecorationItem[]> {
    try {
      const { data, error } = await supabase
        .from('decoration_items')
        .select('*')
        .eq('is_active', true)
        .order('category', { ascending: true })
        .order('name', { ascending: true })

      if (error) {
        console.error('❌ 상점 아이템 조회 오류:', error)
        return []
      }

      const items = data?.map(item => ({
        id: item.id,
        name: item.name,
        description: item.description,
        imageUrl: item.image_url,
        category: item.category,
        price: item.price,
        anchor: item.anchor,
        gridData: item.grid_data,
        isAdminOnly: item.is_admin_only
      })) || []

      this.cache.storeItems = items
      console.log('✅ 상점 아이템 로드 완료:', items.length, '개')
      return items

    } catch (error) {
      console.error('❌ 상점 아이템 조회 실패:', error)
      return []
    }
  }

  /**
   * 사용자 인벤토리 조회 (Supabase에서)
   */
  async getUserInventory(userId: string): Promise<InventoryItem[]> {
    try {
      const { data, error } = await supabase
        .from('user_inventory_detailed')
        .select('*')
        .eq('user_id', userId)

      if (error) {
        console.error('❌ 사용자 인벤토리 조회 오류:', error)
        return []
      }

      const inventory = data?.map(item => ({
        id: item.id,
        itemId: item.item_id,
        quantity: item.quantity,
        purchasedAt: item.purchased_at,
        item: {
          id: item.item_id,
          name: item.item_name,
          description: item.item_description,
          imageUrl: item.item_image_url,
          category: item.item_category,
          price: item.item_price,
          anchor: item.item_anchor,
          gridData: item.item_grid_data
        }
      })) || []

      console.log('✅ 사용자 인벤토리 로드 완료:', inventory.length, '개')
      return inventory

    } catch (error) {
      console.error('❌ 사용자 인벤토리 조회 실패:', error)
      return []
    }
  }

  /**
   * 사용자 차고 데이터 조회 (Supabase에서)
   */
  async getUserGarageData(userId: string): Promise<UserGarageData | null> {
    try {
      const { data, error } = await supabase
        .from('garage_placements_detailed')
        .select('*')
        .eq('user_id', userId)

      if (error) {
        console.error('❌ 차고 데이터 조회 오류:', error)
        return null
      }

      const placedItems: PlacedItem[] = data?.map(item => ({
        id: item.id,
        itemId: item.item_id,
        gridPosition: {
          x: item.position_x,
          y: item.position_y,
          z: item.position_z
        },
        placedAt: item.placed_at,
        updatedAt: item.updated_at,
        item: {
          id: item.item_id,
          name: item.item_name,
          description: item.item_description,
          imageUrl: item.item_image_url,
          category: item.item_category,
          anchor: item.item_anchor,
          gridData: item.item_grid_data
        }
      })) || []

      const garageData: UserGarageData = {
        userId,
        placedItems,
        floorTileConfig: await this.getFloorTileConfig(userId)
      }

      console.log('✅ 차고 데이터 로드 완료:', placedItems.length, '개 배치')
      return garageData

    } catch (error) {
      console.error('❌ 차고 데이터 조회 실패:', error)
      return null
    }
  }

  /**
   * 바닥 타일 설정 조회 (Supabase에서)
   */
  async getFloorTileConfig(userId: string): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('floor_tile_settings')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          // 설정이 없는 경우 기본값 반환
          return {
            type: 'default',
            pattern: 'checkerboard',
            lightColor: 0xD2B48C,
            darkColor: 0xA0522D,
            opacity: 0.8,
            scale: 1.0
          }
        }
        throw error
      }

      return {
        type: data.tile_type,
        pattern: data.pattern,
        lightColor: data.light_color,
        darkColor: data.dark_color,
        opacity: data.opacity,
        scale: data.scale,
        imageUrl: data.custom_image_url
      }

    } catch (error) {
      console.error('❌ 바닥 타일 설정 조회 실패:', error)
      return {
        type: 'default',
        pattern: 'checkerboard',
        lightColor: 0xD2B48C,
        darkColor: 0xA0522D,
        opacity: 0.8,
        scale: 1.0
      }
    }
  }

  /**
   * 아이템 구매 (Supabase 함수 사용)
   */
  async purchaseItem(userId: string, itemId: string, quantity: number = 1): Promise<boolean> {
    try {
      const { data, error } = await supabase.rpc('purchase_item', {
        p_user_id: userId,
        p_item_id: itemId,
        p_quantity: quantity
      })

      if (error) {
        console.error('❌ 아이템 구매 오류:', error)
        return false
      }

      if (data?.success) {
        console.log('✅ 아이템 구매 완료:', data)
        // 캐시 무효화
        this.cache.userInventory = null
        return true
      } else {
        console.error('❌ 아이템 구매 실패:', data?.error)
        return false
      }

    } catch (error) {
      console.error('❌ 아이템 구매 실패:', error)
      return false
    }
  }

  /**
   * 아이템 배치 (Supabase 함수 사용)
   */
  async placeItem(userId: string, itemId: string, position: Position3D): Promise<boolean> {
    try {
      console.log('🔧 placeItem 호출 시작:', {
        userId,
        itemId,
        position,
        timestamp: new Date().toISOString()
      })

      const { data, error } = await supabase.rpc('place_item', {
        p_user_id: userId,
        p_item_id: itemId,
        p_position_x: position.x,
        p_position_y: position.y,
        p_position_z: position.z
      })

      console.log('🔧 Supabase RPC 응답:', { data, error })

      if (error) {
        console.error('❌ 아이템 배치 오류:', {
          error,
          errorCode: error.code,
          errorMessage: error.message,
          errorDetails: error.details,
          errorHint: error.hint,
          userId,
          itemId,
          position
        })
        return false
      }

      if (data?.success) {
        console.log('✅ 아이템 배치 완료:', data)
        // 캐시 무효화
        this.cache.userGarageData = null
        this.cache.userInventory = null
        return true
      } else {
        console.error('❌ 아이템 배치 실패:', {
          data,
          dataError: data?.error,
          userId,
          itemId,
          position
        })
        return false
      }

    } catch (error) {
      console.error('❌ 아이템 배치 실패 (catch):', {
        error,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        errorStack: error instanceof Error ? error.stack : undefined,
        userId,
        itemId,
        position
      })
      return false
    }
  }

  /**
   * 아이템 제거 (Supabase 함수 사용)
   */
  async removeItem(userId: string, placementId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase.rpc('remove_item', {
        p_user_id: userId,
        p_placement_id: placementId
      })

      if (error) {
        console.error('❌ 아이템 제거 오류:', error)
        return false
      }

      if (data?.success) {
        console.log('✅ 아이템 제거 완료:', data)
        // 캐시 무효화
        this.cache.userGarageData = null
        this.cache.userInventory = null
        return true
      } else {
        console.error('❌ 아이템 제거 실패:', data?.error)
        return false
      }

    } catch (error) {
      console.error('❌ 아이템 제거 실패:', error)
      return false
    }
  }

  /**
   * 바닥 타일 설정 저장 (Supabase에서)
   */
  async saveFloorTileConfig(userId: string, config: any): Promise<boolean> {
    try {
      const dbConfig = {
        user_id: userId,
        tile_type: config.type,
        pattern: config.pattern,
        light_color: config.lightColor,
        dark_color: config.darkColor,
        opacity: config.opacity,
        scale: config.scale,
        custom_image_url: config.imageUrl || null
      }

      const { error } = await supabase
        .from('floor_tile_settings')
        .upsert(dbConfig, { onConflict: 'user_id' })

      if (error) {
        console.error('❌ 바닥 타일 설정 저장 오류:', error)
        return false
      }

      console.log('✅ 바닥 타일 설정 저장 완료:', config)
      return true

    } catch (error) {
      console.error('❌ 바닥 타일 설정 저장 실패:', error)
      return false
    }
  }

  /**
   * 사용자 박스 잔액 조회 (Supabase 함수 사용)
   */
  async getUserBoxes(userId: string): Promise<number> {
    try {
      const { data, error } = await supabase.rpc('get_user_boxes', {
        p_user_id: userId
      })

      if (error) {
        console.error('❌ 박스 잔액 조회 오류:', error)
        return 0
      }

      return data || 0

    } catch (error) {
      console.error('❌ 박스 잔액 조회 실패:', error)
      return 0
    }
  }

  /**
   * 캐시 무효화
   */
  clearCache(): void {
    this.cache.storeItems = []
    this.cache.userInventory = null
    this.cache.userGarageData = null
    console.log('🗑️ 데이터 캐시 무효화 완료')
  }

  /**
   * 특정 사용자 캐시 무효화
   */
  clearUserCache(userId: string): void {
    if (this.cache.userInventory?.userId === userId) {
      this.cache.userInventory = null
    }
    if (this.cache.userGarageData?.userId === userId) {
      this.cache.userGarageData = null
    }
    console.log('🗑️ 사용자 캐시 무효화 완료:', userId)
  }
}

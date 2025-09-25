import { ShopType } from './SceneManager'

// ShopItem 타입 정의
export interface ShopItem {
  id: string
  name: string
  description: string
  price: number
  category: ShopType
  imagePath: string
}

// 최소 샵 아이템 목록 (디자인/자산 변경 없이 식별자만 사용)

export const VEHICLE_ITEMS: ShopItem[] = [
  {
    id: 'civilian_blue_2',
    name: '파란 민수용 차량',
    description: '기본 차량',
    price: 100,
    category: 'vehicle',
    imagePath: ''
  },
  {
    id: 'garbage_SE',
    name: '쓰레기차',
    description: '무겁지만 튼튼해요',
    price: 120,
    category: 'vehicle',
    imagePath: ''
  }
]

export const TILE_ITEMS: ShopItem[] = [
  {
    id: 'grass',
    name: '잔디',
    description: '기본 잔디 타일',
    price: 5,
    category: 'tile',
    imagePath: ''
  },
  {
    id: 'dirt',
    name: '흙',
    description: '기본 흙 타일',
    price: 5,
    category: 'tile',
    imagePath: ''
  }
]

export const FURNITURE_ITEMS: ShopItem[] = [
  {
    id: 'chair_gaming',
    name: '게이밍 의자',
    description: '편안한 의자',
    price: 30,
    category: 'furniture',
    imagePath: ''
  },
  {
    id: 'plant_green',
    name: '초록 식물',
    description: '공기정화 식물',
    price: 10,
    category: 'furniture',
    imagePath: ''
  }
]

export const CHARACTER_ITEMS: ShopItem[] = [
  {
    id: 'baemin_default',
    name: '배민커넥터',
    description: '기본 캐릭터 세트',
    price: 0,
    category: 'character',
    imagePath: ''
  }
]

export function getItemsByShopName(shopName: string): ShopItem[] {
  if (shopName.includes('운송수단')) return VEHICLE_ITEMS
  if (shopName.includes('타일')) return TILE_ITEMS
  if (shopName.includes('인테리어') || shopName.includes('인벤토리')) return FURNITURE_ITEMS
  if (shopName.includes('캐릭터')) return CHARACTER_ITEMS
  return []
}



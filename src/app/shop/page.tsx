'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import PixelModal from '@/components/ui/PixelModal'
import PixelButton from '@/components/ui/PixelButton'
import PixelCard from '@/components/ui/PixelCard'

// prerender 방지를 위한 설정
export const dynamic = 'force-dynamic'

interface ShopItem {
  id: string
  name: string
  type: 'character' | 'garage'
  asset_url: string
  price: number
  description: string
  category: string
}

interface UserItem {
  id: string
  item_id: string
  equipped: boolean
}

export default function ShopPage() {
  const { user } = useAuth()
  const router = useRouter()
  
  const [items, setItems] = useState<ShopItem[]>([])
  const [userItems, setUserItems] = useState<UserItem[]>([])
  const [userBoxes, setUserBoxes] = useState(0)
  const [selectedCategory, setSelectedCategory] = useState<'character' | 'garage'>('character')
  const [selectedItem, setSelectedItem] = useState<ShopItem | null>(null)
  const [showPreview, setShowPreview] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // 상점 아이템 불러오기
  const fetchShopItems = async () => {
    try {
      const response = await fetch('/api/items')
      const data = await response.json()
      
      if (response.ok) {
        setItems(data.items || [])
      }
    } catch (error) {
      console.error('상점 아이템 로딩 오류:', error)
    }
  }

  // 사용자 보유 아이템 불러오기
  const fetchUserItems = async () => {
    if (!user?.id) return

    try {
      const response = await fetch(`/api/user-items?userId=${user.id}`)
      const data = await response.json()
      
      if (response.ok) {
        setUserItems(data.userItems || [])
      }
    } catch (error) {
      console.error('보유 아이템 로딩 오류:', error)
    }
  }

  // 사용자 박스 불러오기
  const fetchUserBoxes = async () => {
    if (!user?.id) return

    try {
      const response = await fetch(`/api/boxes?userId=${user.id}`)
      const data = await response.json()
      
      if (response.ok) {
        setUserBoxes(data.totalBoxes || 0)
      }
    } catch (error) {
      console.error('박스 로딩 오류:', error)
    }
  }

  // 아이템 구매
  const purchaseItem = async (item: ShopItem) => {
    if (!user?.id) return
    
    if (userBoxes < item.price) {
      alert('박스가 부족합니다!')
      return
    }

    try {
      const response = await fetch('/api/purchase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          itemId: item.id,
          price: item.price
        })
      })

      const data = await response.json()

      if (response.ok) {
        alert(`${item.name}을(를) 구매했습니다!`)
        await fetchUserItems()
        await fetchUserBoxes()
        setSelectedItem(null)
        setShowPreview(false)
      } else {
        alert(data.error || '구매에 실패했습니다.')
      }
    } catch (error) {
      console.error('구매 오류:', error)
      alert('구매 중 오류가 발생했습니다.')
    }
  }

  // 아이템 장착/해제
  const toggleEquipItem = async (userItemId: string, currentEquipped: boolean) => {
    try {
      const response = await fetch('/api/equip-item', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userItemId,
          equipped: !currentEquipped
        })
      })

      const data = await response.json()

      if (response.ok) {
        await fetchUserItems()
        alert(currentEquipped ? '아이템을 해제했습니다.' : '아이템을 장착했습니다.')
      } else {
        alert(data.error || '장착/해제에 실패했습니다.')
      }
    } catch (error) {
      console.error('장착/해제 오류:', error)
      alert('장착/해제 중 오류가 발생했습니다.')
    }
  }

  useEffect(() => {
    if (!user) {
      router.push('/login')
      return
    }

    const loadData = async () => {
      setIsLoading(true)
      await Promise.all([
        fetchShopItems(),
        fetchUserItems(),
        fetchUserBoxes()
      ])
      setIsLoading(false)
    }

    loadData()
  }, [user])

  // 카테고리별 아이템 필터링
  const filteredItems = items.filter(item => item.type === selectedCategory)

  // 사용자가 이미 보유한 아이템인지 확인
  const isOwned = (itemId: string) => {
    return userItems.some(userItem => userItem.item_id === itemId)
  }

  // 장착된 아이템인지 확인
  const isEquipped = (itemId: string) => {
    return userItems.some(userItem => userItem.item_id === itemId && userItem.equipped)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0f0f23] via-[#1a1a2e] to-[#16213e] flex items-center justify-center">
        <div className="text-white text-xl font-mono">상점 로딩 중...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f0f23] via-[#1a1a2e] to-[#16213e] p-4">
      {/* 전체 도트 패턴 오버레이 */}
      <div 
        className="absolute inset-0 z-[1] opacity-[0.03]"
        style={{
          backgroundImage: `radial-gradient(circle, #ffffff 1px, transparent 1px)`,
          backgroundSize: '20px 20px'
        }}
      />

      <div className="max-w-4xl mx-auto relative z-10">
        {/* 헤더 */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-[#ffd93d] text-3xl font-bold font-mono"
                style={{textShadow: '0 0 10px rgba(255, 217, 61, 0.5)'}}>
              🏪 배달킹 상점
            </h1>
            <PixelButton
              onClick={() => router.push('/')}
              variant="secondary"
            >
              홈으로
            </PixelButton>
          </div>

          {/* 박스 표시 */}
          <PixelCard variant="primary" className="mb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-[#ffd93d] rounded-full flex items-center justify-center">
                  <span className="text-black font-bold text-lg">📦</span>
                </div>
                <div>
                  <div className="text-[#ffd93d] font-bold text-lg font-mono">보유 박스</div>
                  <div className="text-white text-sm font-mono">아이템 구매에 사용하세요</div>
                </div>
              </div>
              <div className="text-[#ffd93d] font-bold text-2xl font-mono">
                {userBoxes.toLocaleString()}📦
              </div>
            </div>
          </PixelCard>

          {/* 카테고리 탭 */}
          <div className="flex gap-2">
            <PixelButton
              onClick={() => setSelectedCategory('character')}
              variant={selectedCategory === 'character' ? 'primary' : 'secondary'}
            >
              캐릭터 아이템
            </PixelButton>
            <PixelButton
              onClick={() => setSelectedCategory('garage')}
              variant={selectedCategory === 'garage' ? 'primary' : 'secondary'}
            >
              꾸미기 아이템
            </PixelButton>
          </div>
        </div>

        {/* 아이템 그리드 */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredItems.map((item) => {
            const owned = isOwned(item.id)
            const equipped = isEquipped(item.id)

            return (
              <PixelCard 
                key={item.id} 
                variant="primary" 
                className="cursor-pointer hover:scale-105 transition-all"
                onClick={() => {
                  setSelectedItem(item)
                  setShowPreview(true)
                }}
              >
                <div className="text-center">
                  {/* 아이템 이미지 */}
                  <div className="w-full h-24 bg-gradient-to-br from-[#9c88ff]/20 to-[#ff6b6b]/20 border border-[#9c88ff]/50 rounded mb-2 flex items-center justify-center relative">
                    <img 
                      src={item.asset_url}
                      alt={item.name}
                      className="w-16 h-16 object-contain"
                      style={{ imageRendering: 'pixelated' }}
                      onError={(e) => {
                        e.currentTarget.src = '/assets/character/default-outfit.png'
                      }}
                    />
                    
                    {/* 상태 표시 */}
                    {owned && (
                      <div className={`absolute top-1 right-1 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        equipped 
                          ? 'bg-[#00ff88] text-black'
                          : 'bg-[#9c88ff] text-white'
                      }`}>
                        {equipped ? '✓' : '◦'}
                      </div>
                    )}
                  </div>

                  {/* 아이템 정보 */}
                  <div className="text-white font-bold text-sm font-mono mb-1">
                    {item.name}
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="text-[#ffd93d] text-xs font-mono font-bold">
                      {item.price.toLocaleString()}P
                    </div>
                    <div className="text-xs font-mono">
                      {owned ? (
                        <span className={equipped ? 'text-[#00ff88]' : 'text-[#9c88ff]'}>
                          {equipped ? '장착됨' : '보유중'}
                        </span>
                      ) : (
                        <span className="text-gray-400">미보유</span>
                      )}
                    </div>
                  </div>
                </div>
              </PixelCard>
            )
          })}
        </div>

        {filteredItems.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 text-lg font-mono">
              아직 {selectedCategory === 'character' ? '캐릭터' : '꾸미기'} 아이템이 없습니다.
            </div>
          </div>
        )}
      </div>

      {/* 아이템 상세 모달 */}
      {selectedItem && (
        <PixelModal
          isOpen={showPreview}
          onClose={() => {
            setShowPreview(false)
            setSelectedItem(null)
          }}
          title={selectedItem.name}
          maxWidth="md"
        >
          <div className="text-center space-y-4">
            {/* 아이템 이미지 */}
            <div className="w-32 h-32 mx-auto bg-gradient-to-br from-[#9c88ff]/20 to-[#ff6b6b]/20 border border-[#9c88ff]/50 rounded flex items-center justify-center">
              <img 
                src={selectedItem.asset_url}
                alt={selectedItem.name}
                className="w-24 h-24 object-contain"
                style={{ imageRendering: 'pixelated' }}
                onError={(e) => {
                  e.currentTarget.src = '/assets/character/default-outfit.png'
                }}
              />
            </div>

            {/* 아이템 정보 */}
            <div>
              <h3 className="text-white text-xl font-bold font-mono mb-2">
                {selectedItem.name}
              </h3>
              <p className="text-gray-300 text-sm font-mono mb-4">
                {selectedItem.description || '멋진 아이템입니다!'}
              </p>
              <div className="text-[#ffd93d] text-lg font-bold font-mono">
                {selectedItem.price.toLocaleString()} 포인트
              </div>
            </div>

            {/* 액션 버튼 */}
            <div className="flex gap-2 justify-center">
              {isOwned(selectedItem.id) ? (
                <>
                  <PixelButton
                    onClick={() => {
                      const userItem = userItems.find(ui => ui.item_id === selectedItem.id)
                      if (userItem) {
                        toggleEquipItem(userItem.id, userItem.equipped)
                      }
                    }}
                    variant={isEquipped(selectedItem.id) ? 'danger' : 'success'}
                  >
                    {isEquipped(selectedItem.id) ? '해제하기' : '장착하기'}
                  </PixelButton>
                </>
              ) : (
                <PixelButton
                  onClick={() => purchaseItem(selectedItem)}
                  variant="primary"
                  disabled={userPoints < selectedItem.price}
                >
                  구매하기
                </PixelButton>
              )}
              <PixelButton
                onClick={() => {
                  setShowPreview(false)
                  setSelectedItem(null)
                }}
                variant="secondary"
              >
                닫기
              </PixelButton>
            </div>

            {userPoints < selectedItem.price && !isOwned(selectedItem.id) && (
              <div className="text-[#ff6b6b] text-sm font-mono">
                포인트가 부족합니다. ({(selectedItem.price - userPoints).toLocaleString()}P 부족)
              </div>
            )}
          </div>
        </PixelModal>
      )}
    </div>
  )
}
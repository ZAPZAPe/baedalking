'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAppState } from '@/hooks/useAppState'

interface ShopItem {
  id: string
  name: string
  description: string
  price: number
  category: 'character' | 'vehicle' | 'background' | 'decor'
  image: string
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
  isOwned: boolean
}

export default function ShopPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'shop' | 'inventory' | 'customize'>('shop')
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'character' | 'vehicle' | 'background' | 'decor'>('all')
  const [selectedItem, setSelectedItem] = useState<ShopItem | null>(null)
  const [previewItem, setPreviewItem] = useState<ShopItem | null>(null)
  
  const {
    totalPoints,
    usePoints,
    currentCharacterItem,
    setCurrentCharacterItem,
    currentVehicle,
    setCurrentVehicle,
    currentBackground,
    setCurrentBackground
  } = useAppState()

  // 상점 아이템 데이터
  const [shopItems] = useState<ShopItem[]>([
    // 캐릭터 아이템
    {
      id: 'char_1',
      name: '행복한 캐릭터',
      description: '항상 웃고 있는 행복한 캐릭터입니다.',
      price: 100,
      category: 'character',
      image: '/assets/character/character-happy.png',
      rarity: 'common',
      isOwned: true
    },
    {
      id: 'char_2',
      name: '화난 캐릭터',
      description: '열심히 일하는 화난 표정의 캐릭터입니다.',
      price: 150,
      category: 'character',
      image: '/assets/character/character-angry.png',
      rarity: 'rare',
      isOwned: false
    },
    {
      id: 'char_3',
      name: '피곤한 캐릭터',
      description: '오늘도 열심히 일한 피곤한 캐릭터입니다.',
      price: 200,
      category: 'character',
      image: '/assets/character/character-tired.png',
      rarity: 'epic',
      isOwned: false
    },
    // 차량 아이템
    {
      id: 'vehicle_1',
      name: '스쿠터',
      description: '빠르고 효율적인 배달용 스쿠터입니다.',
      price: 300,
      category: 'vehicle',
      image: '/assets/vehicle/scooter.png',
      rarity: 'common',
      isOwned: true
    },
    // 배경 아이템
    {
      id: 'bg_1',
      name: '기본 배경',
      description: '깔끔하고 심플한 기본 배경입니다.',
      price: 50,
      category: 'background',
      image: '/assets/background/background.png',
      rarity: 'common',
      isOwned: true
    },
    {
      id: 'bg_2',
      name: '도시 배경',
      description: '현대적인 도시 풍경을 담은 배경입니다.',
      price: 120,
      category: 'background',
      image: '/assets/background/background1.png',
      rarity: 'rare',
      isOwned: false
    },
    {
      id: 'bg_3',
      name: '자연 배경',
      description: '아름다운 자연 풍경을 담은 배경입니다.',
      price: 180,
      category: 'background',
      image: '/assets/background/background2.png',
      rarity: 'epic',
      isOwned: false
    }
  ])

  // 아이템 구매
  const handlePurchase = (item: ShopItem) => {
    if (totalPoints >= item.price) {
      usePoints(item.price)
      // 아이템 소유 상태 변경
      const updatedItems = shopItems.map(shopItem => 
        shopItem.id === item.id ? { ...shopItem, isOwned: true } : shopItem
      )
      // TODO: 실제 데이터베이스에 저장
      console.log(`${item.name} 구매 완료!`)
      setSelectedItem(null)
    } else {
      alert('포인트가 부족합니다!')
    }
  }

  // 아이템 장착
  const handleEquip = (item: ShopItem) => {
    switch (item.category) {
      case 'character':
        setCurrentCharacterItem(item.id)
        break
      case 'vehicle':
        setCurrentVehicle(item.id)
        break
      case 'background':
        setCurrentBackground(item.id)
        break
    }
    console.log(`${item.name} 장착 완료!`)
  }

  // 필터링된 아이템
  const filteredItems = shopItems.filter(item => 
    selectedCategory === 'all' || item.category === selectedCategory
  )

  // 보유 아이템
  const ownedItems = shopItems.filter(item => item.isOwned)

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'text-gray-400'
      case 'rare': return 'text-blue-400'
      case 'epic': return 'text-purple-400'
      case 'legendary': return 'text-yellow-400'
      default: return 'text-gray-400'
    }
  }

  const getRarityBorder = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'border-gray-400/30'
      case 'rare': return 'border-blue-400/30'
      case 'epic': return 'border-purple-400/30'
      case 'legendary': return 'border-yellow-400/30'
      default: return 'border-gray-400/30'
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'character': return 'from-[#00d4ff] to-[#9c88ff]'
      case 'vehicle': return 'from-[#ffd93d] to-[#ff6b6b]'
      case 'background': return 'from-[#ff6b6b] to-[#ff4757]'
      case 'decor': return 'from-[#00ff88] to-[#00d4ff]'
      default: return 'from-[#9c88ff] to-[#ff6b6b]'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a23] via-[#16213e] to-[#1a1a2e] text-white">
      {/* 헤더 */}
      <div className="bg-gradient-to-r from-[#0a0a23] to-[#16213e] border-b-2 border-[#00d4ff]/30 p-4 relative">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <button
            onClick={() => router.push('/')}
            className="bg-gradient-to-r from-[#ff6b6b]/20 to-[#ff4757]/20 border border-[#ff6b6b]/50 hover:border-[#ff6b6b] text-[#ff6b6b] hover:text-white font-bold px-4 py-2 rounded-lg transition-all duration-200 font-mono"
          >
            ← 홈으로
          </button>
          
          <h1 className="text-[#00d4ff] font-bold text-2xl font-mono tracking-wide" 
              style={{textShadow: '0 0 8px rgba(0, 212, 255, 0.5)'}}>
            🏪 SHOP
          </h1>
          
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-[#ffd93d] to-[#ff6b6b] rounded-full flex items-center justify-center">
              <span className="text-black text-sm font-bold">💎</span>
            </div>
            <span className="text-[#ffd93d] font-bold text-xl font-mono">
              {totalPoints.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-4">
        {/* 탭 네비게이션 - 가운데 정렬 */}
        <div className="flex justify-center mb-8">
          <div className="bg-gradient-to-br from-[#2d3748] to-[#1a202c] rounded-2xl p-2 border border-[#00d4ff]/30 inline-flex">
            {[
              { id: 'shop', label: '🏪 상점', color: '#00d4ff' },
              { id: 'inventory', label: '🎒 보유 아이템', color: '#9c88ff' },
              { id: 'customize', label: '🎨 꾸미기', color: '#ffd93d' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-6 py-3 font-mono transition-all duration-300 border-2 relative ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-[#1a202c] to-[#2d3748] shadow-lg border-[#00d4ff]/60'
                    : 'bg-[#1a202c]/60 hover:bg-[#1a202c]/80 border-transparent hover:border-[#00d4ff]/30'
                }`}
                style={{
                  borderRadius: activeTab === tab.id ? '12px' : '8px',
                  fontFamily: 'monospace',
                  imageRendering: 'pixelated'
                }}
              >
                <span className={`font-bold text-base font-mono ${
                  activeTab === tab.id ? 'text-[#00d4ff]' : 'text-gray-300'
                }`}>
                  {tab.label}
                </span>

                {/* 픽셀 도트들 */}
                {activeTab === tab.id && (
                  <>
                    <div className="absolute top-1 left-1 w-1 h-1 bg-[#00d4ff]" style={{borderRadius: '1px'}}></div>
                    <div className="absolute top-1 right-1 w-1 h-1 bg-[#00d4ff]" style={{borderRadius: '1px'}}></div>
                    <div className="absolute bottom-1 left-1 w-1 h-1 bg-[#00d4ff]" style={{borderRadius: '1px'}}></div>
                    <div className="absolute bottom-1 right-1 w-1 h-1 bg-[#00d4ff]" style={{borderRadius: '1px'}}></div>
                  </>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* 상점 탭 */}
        {activeTab === 'shop' && (
          <div className="max-w-4xl mx-auto">
            {/* 카테고리 필터 - 가운데 정렬 */}
            <div className="flex justify-center mb-8">
              <div className="bg-gradient-to-br from-[#2d3748] to-[#1a202c] rounded-2xl p-3 border border-[#9c88ff]/30 inline-flex gap-2">
                {[
                  { id: 'all', label: '전체', color: '#9c88ff' },
                  { id: 'character', label: '캐릭터', color: '#00d4ff' },
                  { id: 'vehicle', label: '차량', color: '#ffd93d' },
                  { id: 'background', label: '배경', color: '#ff6b6b' },
                  { id: 'decor', label: '장식', color: '#00ff88' }
                ].map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id as any)}
                    className={`px-4 py-2 font-mono transition-all duration-200 border-2 rounded-lg ${
                      selectedCategory === category.id
                        ? `bg-[${category.color}]/20 border-[${category.color}]/60 text-[${category.color}]`
                        : 'bg-[#1a202c]/60 border-gray-600/30 text-gray-400 hover:border-gray-500/50'
                    }`}
                  >
                    {category.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 아이템 그리드 - 가운데 정렬 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {filteredItems.map((item) => (
                <div
                  key={item.id}
                  className={`bg-gradient-to-br from-[#2d3748] to-[#1a202c] rounded-2xl p-6 border-2 transition-all duration-300 hover:scale-105 cursor-pointer relative group ${
                    item.isOwned 
                      ? 'border-[#00ff88]/50 bg-[#00ff88]/10' 
                      : getRarityBorder(item.rarity)
                  }`}
                  onClick={() => setSelectedItem(item)}
                  onMouseEnter={() => setPreviewItem(item)}
                  onMouseLeave={() => setPreviewItem(null)}
                >
                  {/* 아이템 이미지 */}
                  <div className="w-full h-40 mb-4 bg-[#1a202c]/50 rounded-xl flex items-center justify-center border border-gray-600/30 overflow-hidden">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-24 h-24 object-contain transition-transform duration-300 group-hover:scale-110"
                      style={{ imageRendering: 'pixelated' }}
                    />
                  </div>

                  {/* 아이템 정보 */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-white font-bold text-lg font-mono">{item.name}</h3>
                      <span className={`text-xs font-mono px-2 py-1 rounded-lg ${getRarityColor(item.rarity)} bg-[#1a202c]/60 border border-current/30`}>
                        {item.rarity.toUpperCase()}
                      </span>
                    </div>
                    
                    <p className="text-gray-400 text-sm font-mono leading-relaxed">{item.description}</p>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-[#ffd93d] font-bold text-lg font-mono flex items-center gap-2">
                        <span className="text-xl">💎</span>
                        {item.price.toLocaleString()}
                      </span>
                      {item.isOwned && (
                        <span className="text-[#00ff88] text-sm font-mono bg-[#00ff88]/20 px-3 py-1 rounded-lg border border-[#00ff88]/30">
                          보유중
                        </span>
                      )}
                    </div>
                  </div>

                  {/* 호버 효과 */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#00d4ff]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl"></div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 보유 아이템 탭 */}
        {activeTab === 'inventory' && (
          <div className="max-w-4xl mx-auto">
            <div className="bg-gradient-to-br from-[#2d3748] to-[#1a202c] rounded-2xl p-6 border border-[#9c88ff]/30">
              <h2 className="text-[#9c88ff] font-bold text-2xl font-mono mb-6 text-center">🎒 보유 아이템 ({ownedItems.length}개)</h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {ownedItems.map((item) => (
                  <div
                    key={item.id}
                    className="bg-gradient-to-br from-[#2d3748] to-[#1a202c] rounded-2xl p-6 border-2 border-[#00ff88]/50 bg-[#00ff88]/10 relative group hover:scale-105 transition-all duration-300"
                  >
                    {/* 아이템 이미지 */}
                    <div className="w-full h-32 mb-4 bg-[#1a202c]/50 rounded-xl flex items-center justify-center border border-gray-600/30 overflow-hidden">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-20 h-20 object-contain transition-transform duration-300 group-hover:scale-110"
                        style={{ imageRendering: 'pixelated' }}
                      />
                    </div>

                    {/* 아이템 정보 */}
                    <div className="space-y-3">
                      <h3 className="text-white font-bold text-lg font-mono text-center">{item.name}</h3>
                      <p className="text-gray-400 text-sm font-mono text-center leading-relaxed">{item.description}</p>
                      
                      <button
                        onClick={() => handleEquip(item)}
                        className="w-full bg-gradient-to-r from-[#00ff88]/20 to-[#00d4ff]/20 border border-[#00ff88]/50 hover:border-[#00ff88] text-[#00ff88] hover:text-white font-bold py-3 px-4 rounded-xl transition-all duration-300 font-mono text-base hover:scale-105"
                      >
                        장착하기
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 꾸미기 탭 */}
        {activeTab === 'customize' && (
          <div className="max-w-4xl mx-auto">
            <div className="bg-gradient-to-br from-[#2d3748] to-[#1a202c] rounded-2xl p-6 border border-[#ffd93d]/30">
              <h2 className="text-[#ffd93d] font-bold text-2xl font-mono mb-6 text-center">🎨 현재 꾸미기 상태</h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {/* 캐릭터 */}
                <div className="bg-[#1a202c]/50 rounded-2xl p-6 border border-[#00d4ff]/30 text-center">
                  <h3 className="text-[#00d4ff] font-bold text-xl font-mono mb-4">캐릭터</h3>
                  <div className="w-32 h-32 mx-auto mb-4 bg-[#1a202c]/80 rounded-2xl flex items-center justify-center border border-gray-600/30 overflow-hidden">
                    <img
                      src="/assets/character/character-happy.png"
                      alt="현재 캐릭터"
                      className="w-28 h-28 object-contain"
                      style={{ imageRendering: 'pixelated' }}
                    />
                  </div>
                  <p className="text-white text-lg font-mono">행복한 캐릭터</p>
                </div>

                {/* 차량 */}
                <div className="bg-[#1a202c]/50 rounded-2xl p-6 border border-[#ffd93d]/30 text-center">
                  <h3 className="text-[#ffd93d] font-bold text-xl font-mono mb-4">차량</h3>
                  <div className="w-32 h-32 mx-auto mb-4 bg-[#1a202c]/80 rounded-2xl flex items-center justify-center border border-gray-600/30 overflow-hidden">
                    <img
                      src="/assets/vehicle/scooter.png"
                      alt="현재 차량"
                      className="w-28 h-28 object-contain"
                      style={{ imageRendering: 'pixelated' }}
                    />
                  </div>
                  <p className="text-white text-lg font-mono">스쿠터</p>
                </div>

                {/* 배경 */}
                <div className="bg-[#1a202c]/50 rounded-2xl p-6 border border-[#ff6b6b]/30 text-center">
                  <h3 className="text-[#ff6b6b] font-bold text-xl font-mono mb-4">배경</h3>
                  <div className="w-32 h-32 mx-auto mb-4 bg-[#1a202c]/80 rounded-2xl flex items-center justify-center border border-gray-600/30 overflow-hidden">
                    <img
                      src="/assets/background/background.png"
                      alt="현재 배경"
                      className="w-28 h-28 object-contain"
                      style={{ imageRendering: 'pixelated' }}
                    />
                  </div>
                  <p className="text-white text-lg font-mono">기본 배경</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 미리보기 섹션 - 가운데 하단 */}
        {previewItem && (
          <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-40">
            <div className="bg-gradient-to-br from-[#0a0a23] via-[#16213e] to-[#1a1a2e] border-2 border-[#00d4ff]/50 rounded-2xl p-6 shadow-2xl max-w-md">
              <div className="text-center">
                <h3 className="text-[#00d4ff] font-bold text-xl font-mono mb-3">미리보기</h3>
                <div className="w-24 h-24 mx-auto mb-3 bg-[#1a202c]/60 rounded-xl flex items-center justify-center border border-[#00d4ff]/30">
                  <img
                    src={previewItem.image}
                    alt={previewItem.name}
                    className="w-20 h-20 object-contain"
                    style={{ imageRendering: 'pixelated' }}
                  />
                </div>
                <h4 className="text-white font-bold text-lg font-mono mb-2">{previewItem.name}</h4>
                <p className="text-gray-400 text-sm font-mono mb-3">{previewItem.description}</p>
                <div className="flex items-center justify-center gap-4">
                  <span className={`text-xs font-mono px-2 py-1 rounded-lg ${getRarityColor(previewItem.rarity)} bg-[#1a202c]/60 border border-current/30`}>
                    {previewItem.rarity.toUpperCase()}
                  </span>
                  <span className="text-[#ffd93d] font-bold text-sm font-mono">💎 {previewItem.price.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 아이템 상세 모달 */}
      {selectedItem && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gradient-to-br from-[#0a0a23] via-[#16213e] to-[#1a1a2e] border-2 border-[#00d4ff]/50 rounded-2xl p-8 max-w-lg w-full max-h-[80vh] overflow-y-auto relative">
            {/* 헤더 */}
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-[#00d4ff] font-bold text-2xl font-mono">아이템 상세</h3>
              <button
                onClick={() => setSelectedItem(null)}
                className="text-gray-400 hover:text-white transition-colors duration-200 text-2xl"
              >
                ✕
              </button>
            </div>

            {/* 아이템 정보 */}
            <div className="space-y-6">
              <div className="text-center">
                <div className="w-40 h-40 mx-auto mb-6 bg-[#1a202c]/60 rounded-2xl flex items-center justify-center border border-[#00d4ff]/30 overflow-hidden">
                  <img
                    src={selectedItem.image}
                    alt={selectedItem.name}
                    className="w-36 h-36 object-contain"
                    style={{ imageRendering: 'pixelated' }}
                  />
                </div>
                <h4 className="text-white font-bold text-2xl font-mono mb-3">{selectedItem.name}</h4>
                <p className="text-gray-400 text-base font-mono mb-4 leading-relaxed">{selectedItem.description}</p>
                <div className={`inline-block px-4 py-2 rounded-xl text-sm font-mono font-bold ${getRarityColor(selectedItem.rarity)} bg-[#1a202c]/60 border border-current/30`}>
                  {selectedItem.rarity.toUpperCase()}
                </div>
              </div>

              <div className="bg-[#1a202c]/60 border border-[#00d4ff]/30 rounded-xl p-6 text-center">
                <p className="text-[#ffd93d] font-bold text-lg font-mono mb-2">가격</p>
                <p className="text-white font-bold text-2xl font-mono flex items-center justify-center gap-2">
                  <span className="text-3xl">💎</span>
                  {selectedItem.price.toLocaleString()}
                </p>
              </div>
            </div>

            {/* 하단 버튼 */}
            <div className="mt-8 flex gap-4">
              <button
                onClick={() => setSelectedItem(null)}
                className="flex-1 bg-[#1a202c]/60 border border-[#00d4ff]/30 text-[#00d4ff] hover:border-[#00d4ff]/60 hover:text-white font-bold py-4 px-6 rounded-xl transition-all duration-200 font-mono text-lg"
              >
                닫기
              </button>
              
              {selectedItem.isOwned ? (
                <button
                  onClick={() => {
                    handleEquip(selectedItem)
                    setSelectedItem(null)
                  }}
                  className="flex-1 bg-gradient-to-r from-[#00ff88] to-[#00d4ff] hover:from-[#00d4ff] hover:to-[#00ff88] text-white font-bold py-4 px-6 rounded-xl transition-all duration-200 font-mono text-lg hover:scale-105"
                >
                  장착하기
                </button>
              ) : (
                <button
                  onClick={() => handlePurchase(selectedItem)}
                  disabled={totalPoints < selectedItem.price}
                  className="flex-1 bg-gradient-to-r from-[#ffd93d] to-[#ff6b6b] hover:from-[#ff6b6b] hover:to-[#ffd93d] text-white font-bold py-4 px-6 rounded-xl transition-all duration-200 font-mono text-lg disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105"
                >
                  구매하기
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

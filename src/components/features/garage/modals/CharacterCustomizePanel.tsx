'use client'

import { useState, useEffect } from 'react'
import { CharacterParts, CharacterData } from '@/types'

interface UserCharacterItem {
  id: string
  userId: string
  itemId: string
  quantity: number
  purchasedAt: string
  item: {
    id: string
    name: string
    description: string
    main_category: string
    sub_category: string
    image_url: string
    price: number
  }
}

interface CharacterCustomizePanelProps {
  isOpen: boolean
  onClose: () => void
  userId: string
  currentCharacterData: CharacterData | null
  onCharacterUpdate: (characterData: CharacterData) => void
}

// 기본 캐릭터 파츠 옵션들
const CHARACTER_PARTS = {
  hair: [
    { id: 'none.png', name: '없음', preview: '/assets/character/none.png' },
  ],
  top: [
    { id: 'none.png', name: '없음', preview: '/assets/character/none.png' },
  ],
  bottom: [
    { id: 'none.png', name: '없음', preview: '/assets/character/none.png' },
  ],
  emotion: [
    { id: 'happy.png', name: '행복', preview: '/assets/character/emotions/happy.png' },
    { id: 'angry.png', name: '화남', preview: '/assets/character/emotions/angry.png' },
    { id: 'tired.png', name: '피곤', preview: '/assets/character/emotions/tired.png' },
    { id: 'heart.png', name: '하트', preview: '/assets/character/emotions/heart.png' },
  ]
}

export default function CharacterCustomizePanel({
  isOpen,
  onClose,
  userId,
  currentCharacterData,
  onCharacterUpdate
}: CharacterCustomizePanelProps) {
  const [selectedParts, setSelectedParts] = useState<CharacterParts>({
    hair: 'none.png',
    top: 'none.png',
    bottom: 'none.png',
    emotion: 'happy.png'
  })
  
  // 사용자 캐릭터 아이템 상태
  const [userCharacterItems, setUserCharacterItems] = useState<UserCharacterItem[]>([])
  const [loadingItems, setLoadingItems] = useState(false)

  // 사용자 캐릭터 아이템 로드
  const loadUserCharacterItems = async () => {
    if (!userId) return
    
    setLoadingItems(true)
    try {
      const response = await fetch(`/api/user-shop-inventory?userId=${userId}&mainCategory=character`)
      if (response.ok) {
        const data = await response.json()
        setUserCharacterItems(data.inventory || [])
      }
    } catch (error) {
      console.error('캐릭터 아이템 로드 실패:', error)
    } finally {
      setLoadingItems(false)
    }
  }

  // 동적 캐릭터 파츠 옵션 생성
  const getCharacterPartsOptions = () => {
    const baseOptions = {
      hair: [{ id: 'none.png', name: '없음', preview: '/assets/character/none.png' }],
      top: [{ id: 'none.png', name: '없음', preview: '/assets/character/none.png' }],
      bottom: [{ id: 'none.png', name: '없음', preview: '/assets/character/none.png' }],
      emotion: [
        { id: 'happy.png', name: '행복', preview: '/assets/character/emotions/happy.png' },
        { id: 'angry.png', name: '화남', preview: '/assets/character/emotions/angry.png' },
        { id: 'tired.png', name: '피곤', preview: '/assets/character/emotions/tired.png' },
        { id: 'heart.png', name: '하트', preview: '/assets/character/emotions/heart.png' },
      ]
    }

    // 사용자가 구매한 캐릭터 아이템들을 카테고리별로 추가
    userCharacterItems.forEach(userItem => {
      if (!userItem || !userItem.item) return
      
      const item = userItem.item
      const partOption = {
        id: item.id,
        name: item.name,
        preview: item.image_url
      }

      if (item.sub_category === 'hair') {
        baseOptions.hair.push(partOption)
      } else if (item.sub_category === 'top') {
        baseOptions.top.push(partOption)
      } else if (item.sub_category === 'bottom') {
        baseOptions.bottom.push(partOption)
      }
    })

    // 현재 캐릭터 데이터에서 착용한 아이템들도 추가
    if (currentCharacterData?.equippedItems) {
      currentCharacterData.equippedItems.forEach((equippedItem: any) => {
        if (!equippedItem || !equippedItem.item) return
        
        const item = equippedItem.item
        const partOption = {
          id: item.id,
          name: item.name,
          preview: item.image_url
        }

        // 이미 추가되지 않은 경우에만 추가
        if (item.sub_category === 'hair' && !baseOptions.hair.find(hair => hair.id === item.id)) {
          baseOptions.hair.push(partOption)
        } else if (item.sub_category === 'top' && !baseOptions.top.find(top => top.id === item.id)) {
          baseOptions.top.push(partOption)
        } else if (item.sub_category === 'bottom' && !baseOptions.bottom.find(bottom => bottom.id === item.id)) {
          baseOptions.bottom.push(partOption)
        }
      })
    }

    return baseOptions
  }

  // 패널이 열릴 때 현재 캐릭터 데이터로 초기화
  useEffect(() => {
    if (isOpen) {
      if (currentCharacterData) {
        setSelectedParts(currentCharacterData.parts)
      }
      // 사용자 캐릭터 아이템 로드
      loadUserCharacterItems()
    }
  }, [isOpen, currentCharacterData, userId])

  const handlePartChange = (partType: keyof CharacterParts, partId: string) => {
    setSelectedParts(prev => ({
      ...prev,
      [partType]: partId
    }))
  }

  const handleSave = async () => {
    const characterData: CharacterData = {
      userId,
      parts: selectedParts,
      position: currentCharacterData?.position || { x: 0, y: 0 }
    }

    try {
      const response = await fetch('/api/character', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(characterData),
      })

      if (response.ok) {
        onCharacterUpdate(characterData)
        onClose()
      } else {
        alert('캐릭터 저장에 실패했습니다.')
      }
    } catch (error) {
      console.error('캐릭터 저장 오류:', error)
      alert('캐릭터 저장 중 오류가 발생했습니다.')
    }
  }

  if (!isOpen) return null

  return (
    <div 
      className="fixed inset-0 z-[999999] bg-black/80 flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose()
        }
      }}
    >
      <div 
        className="w-full max-w-md bg-gradient-to-b from-[#0a0a23] via-[#16213e] to-[#1a1a2e] border-2 border-[#00ff88]/50 shadow-2xl relative max-h-[80vh] overflow-y-auto"
        style={{
          borderRadius: '8px',
          fontFamily: 'monospace',
          imageRendering: 'pixelated',
          boxShadow: '0 0 20px rgba(0, 255, 136, 0.2), inset 0 0 15px rgba(0, 255, 136, 0.05)'
        }}
      >
        {/* 헤더 */}
        <div className="bg-gradient-to-r from-[#0a0a23] to-[#16213e] p-4 border-b-2 border-[#00ff88]/30 relative">
          <div className="flex justify-between items-center">
            <h3 className="text-[#00ff88] font-bold text-lg font-mono tracking-wider" 
                style={{textShadow: '0 0 8px rgba(0, 255, 136, 0.5)'}}>
              CHARACTER CUSTOMIZE
            </h3>
            <button
              onClick={onClose}
              className="w-8 h-8 bg-gradient-to-br from-[#ff6b6b]/20 to-[#ff4757]/20 border border-[#ff6b6b]/50 hover:border-[#ff6b6b] text-[#ff6b6b] hover:text-[#ff4757] font-bold transition-all duration-200 hover:scale-110"
              style={{borderRadius: '4px'}}
            >
              ✕
            </button>
          </div>
        </div>

        <div className="p-4 space-y-4">
          {/* 캐릭터 미리보기 */}
          <div className="bg-gradient-to-br from-[#0a0a23]/80 to-[#16213e]/80 border-2 border-[#00ff88]/30 p-4 relative"
               style={{borderRadius: '6px'}}>
            <h4 className="text-[#00ff88] text-center font-bold text-sm font-mono tracking-wider mb-4" 
                style={{textShadow: '0 0 6px rgba(0, 255, 136, 0.5)'}}>
              PREVIEW
            </h4>
            <div className="flex justify-center">
              <div className="relative">
                {/* 캐릭터 프레임 */}
                <div className="w-20 h-24 bg-gradient-to-br from-[#00d4ff]/20 to-[#9c88ff]/20 border-2 border-[#00ff88]/50 relative"
                     style={{borderRadius: '6px'}}>
                  
                  {/* 캐릭터 파츠들을 레이어 순서대로 렌더링 */}
                  <div className="absolute bottom-0.5 left-1/2 transform -translate-x-1/2 w-5/6 h-5/6">
                    {/* 기본 캐릭터 베이스 (가장 아래 레이어) */}
                    <img 
                      src="/assets/character/default-character.png"
                      alt="기본 캐릭터" 
                      className="absolute w-full h-full object-contain"
                      style={{ imageRendering: 'pixelated' }}
                    />
                    {/* 하의 레이어 - "없음"이 아닐 때만 표시 */}
                    {selectedParts.bottom !== 'none.png' && (
                      <img 
                        src={getCharacterPartsOptions().bottom.find(item => item.id === selectedParts.bottom)?.preview || '/assets/character/none.png'}
                        alt="하의" 
                        className="absolute w-full h-full object-contain"
                        style={{ imageRendering: 'pixelated' }}
                      />
                    )}
                    {/* 상의 레이어 - "없음"이 아닐 때만 표시 */}
                    {selectedParts.top !== 'none.png' && (
                      <img 
                        src={getCharacterPartsOptions().top.find(item => item.id === selectedParts.top)?.preview || '/assets/character/none.png'}
                        alt="상의" 
                        className="absolute w-full h-full object-contain"
                        style={{ imageRendering: 'pixelated' }}
                      />
                    )}
                    {/* 헤어 레이어 (가장 위) - "없음"이 아닐 때만 표시 */}
                    {selectedParts.hair !== 'none.png' && (
                      <img 
                        src={getCharacterPartsOptions().hair.find(item => item.id === selectedParts.hair)?.preview || '/assets/character/none.png'}
                        alt="헤어" 
                        className="absolute w-full h-full object-contain"
                        style={{ imageRendering: 'pixelated' }}
                      />
                    )}
                  </div>
                  
                  {/* 말풍선 스타일 감정 이모티콘 - 캐릭터 상단에 표시 */}
                  <div className="absolute top-1 left-1/2 transform -translate-x-1/2 z-10">
                    <div className="bg-white border border-gray-300 px-1 py-0.5 rounded relative shadow-sm">
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-2 border-r-2 border-t-2 border-l-transparent border-r-transparent border-t-white"></div>
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 translate-y-px w-0 h-0 border-l-2 border-r-2 border-t-2 border-l-transparent border-r-transparent border-t-gray-300"></div>
                      <div className="text-xs">
                        {selectedParts.emotion === 'happy.png' ? '😊' :
                         selectedParts.emotion === 'angry.png' ? '😠' :
                         selectedParts.emotion === 'tired.png' ? '😴' :
                         selectedParts.emotion === 'heart.png' ? '❤️' : '😊'}
                      </div>
                    </div>
                  </div>
                  
                  {/* 프레임 모서리 픽셀 도트 */}
                  <div className="absolute top-0.5 left-0.5 w-1 h-1 bg-[#00ff88]" style={{borderRadius: '1px'}}></div>
                  <div className="absolute top-0.5 right-0.5 w-1 h-1 bg-[#00ff88]" style={{borderRadius: '1px'}}></div>
                  <div className="absolute bottom-0.5 left-0.5 w-1 h-1 bg-[#00ff88]" style={{borderRadius: '1px'}}></div>
                  <div className="absolute bottom-0.5 right-0.5 w-1 h-1 bg-[#00ff88]" style={{borderRadius: '1px'}}></div>
                </div>
              </div>
            </div>
          </div>

          {/* 파츠 선택 */}
          {Object.entries(getCharacterPartsOptions()).map(([partType, parts]) => (
            <div key={partType} className="space-y-2">
              <h4 className="text-[#00d4ff] font-bold text-sm font-mono tracking-wider uppercase">
                {partType}
              </h4>
              <div className="grid grid-cols-3 gap-2">
                {parts.map((part) => (
                  <button
                    key={part.id}
                    onClick={() => handlePartChange(partType as keyof CharacterParts, part.id)}
                    className={`p-2 border-2 transition-all duration-200 relative ${
                      selectedParts[partType as keyof CharacterParts] === part.id
                        ? 'bg-[#00d4ff]/20 border-[#00d4ff] scale-105'
                        : 'bg-[#0a0a23]/40 border-[#00d4ff]/30 hover:border-[#00d4ff]/60'
                    }`}
                    style={{borderRadius: '4px'}}
                  >
                    {part.id === 'none.png' ? (
                      <div className="w-full h-12 flex items-center justify-center mb-1 text-2xl text-red-500">
                        ✕
                      </div>
                    ) : (
                      <img 
                        src={part.preview} 
                        alt={part.name}
                        className="w-full h-12 object-contain mb-1"
                        style={{ imageRendering: 'pixelated' }}
                      />
                    )}
                    <div className="text-white text-xs font-mono text-center">
                      {part.name}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}

          {/* 버튼들 */}
          <div className="flex gap-2 pt-4">
            <button
              onClick={handleSave}
              className="flex-1 bg-gradient-to-r from-[#00ff88]/20 to-[#00d4ff]/20 border-2 border-[#00ff88]/50 hover:border-[#00ff88] text-[#00ff88] hover:text-white font-bold py-3 transition-all duration-300 hover:scale-105 hover:shadow-lg relative font-mono tracking-wide"
              style={{
                borderRadius: '6px',
                textShadow: '0 0 6px rgba(0, 255, 136, 0.5)',
                boxShadow: '0 0 15px rgba(0, 255, 136, 0.2)'
              }}
            >
              SAVE CHARACTER
            </button>
            <button
              onClick={onClose}
              className="flex-1 bg-gradient-to-r from-[#ff6b6b]/20 to-[#ff4757]/20 border-2 border-[#ff6b6b]/50 hover:border-[#ff6b6b] text-[#ff6b6b] hover:text-white font-bold py-3 transition-all duration-300 hover:scale-105 hover:shadow-lg relative font-mono tracking-wide"
              style={{
                borderRadius: '6px',
                textShadow: '0 0 6px rgba(255, 107, 107, 0.5)',
                boxShadow: '0 0 15px rgba(255, 107, 107, 0.2)'
              }}
            >
              CANCEL
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}


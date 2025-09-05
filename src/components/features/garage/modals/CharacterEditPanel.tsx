'use client'

import { useState, useEffect } from 'react'
import { emotions } from '@/data/constants'
import { CharacterParts, CharacterData } from '@/types'
import { composeCharacterImage, uploadCharacterImage } from '@/utils/character/composeCharacter'
import CharacterItemShopModal from './CharacterItemShopModal'
import CharacterItemInventoryModal from './CharacterItemInventoryModal'

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
    { id: 'happy.png', name: '행복', preview: '😊', emoji: '😊' },
    { id: 'angry.png', name: '화남', preview: '😠', emoji: '😠' },
    { id: 'tired.png', name: '피곤', preview: '😴', emoji: '😴' },
    { id: 'heart.png', name: '하트', preview: '❤️', emoji: '❤️' },
  ]
}

interface CharacterEditPanelProps {
  showHeaderCharacterPanel: boolean
  setShowHeaderCharacterPanel: (show: boolean) => void
  garageIntro: string
  setGarageIntro: (intro: string) => void
  // 캐릭터 커스터마이즈 관련 props 추가
  userId?: string
  currentCharacterData?: any
  onCharacterUpdate?: (characterData: any) => void
}

export default function CharacterEditPanel({
  showHeaderCharacterPanel,
  setShowHeaderCharacterPanel,
  garageIntro,
  setGarageIntro,
  userId,
  currentCharacterData,
  onCharacterUpdate
}: CharacterEditPanelProps) {
  // 임시 상태들
  const [tempGarageIntro, setTempGarageIntro] = useState(garageIntro)
  
  // 캐릭터 커스터마이즈 상태
  const [showCharacterCustomize, setShowCharacterCustomize] = useState(false)
  const [selectedParts, setSelectedParts] = useState<CharacterParts>({
    hair: 'none.png',
    top: 'none.png',
    bottom: 'none.png',
    emotion: 'happy.png'
  })

  // 캐릭터 아이템 상점 및 인벤토리 상태
  const [showCharacterItemShop, setShowCharacterItemShop] = useState(false)
  const [showCharacterItemInventory, setShowCharacterItemInventory] = useState(false)
  
  // 사용자 캐릭터 아이템 상태
  const [userCharacterItems, setUserCharacterItems] = useState<UserCharacterItem[]>([])
  const [loadingItems, setLoadingItems] = useState(false)

  // 패널이 열릴 때마다 임시 상태를 현재 값으로 초기화
  useEffect(() => {
    if (showHeaderCharacterPanel) {
      setTempGarageIntro(garageIntro)
      
      // 캐릭터 데이터 초기화
      if (currentCharacterData) {
        setSelectedParts(currentCharacterData.parts)
      }
      
      // 사용자 캐릭터 아이템 로드
      loadUserCharacterItems()
    }
  }, [showHeaderCharacterPanel, garageIntro, currentCharacterData, userId])

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
        { id: 'happy.png', name: '행복', preview: '😊', emoji: '😊' },
        { id: 'angry.png', name: '화남', preview: '😠', emoji: '😠' },
        { id: 'tired.png', name: '피곤', preview: '😴', emoji: '😴' },
        { id: 'heart.png', name: '하트', preview: '❤️', emoji: '❤️' },
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

  // 아이템 구매 후 새로고침
  const handleItemPurchased = () => {
    loadUserCharacterItems()
  }

  // 캐릭터 파츠 변경 함수
  const handlePartChange = (partType: keyof CharacterParts, partId: string) => {
    setSelectedParts(prev => ({
      ...prev,
      [partType]: partId
    }))
  }

  // 캐릭터 저장 함수 - 기본 저장 방식 (이미지 합성 기능 일시 비활성화)
  const handleCharacterSave = async () => {
    if (!userId) return
    
    try {
      console.log('캐릭터 저장 시작:', { userId, selectedParts })
      console.log('selectedParts 상세:', selectedParts)
      console.log('currentCharacterData:', currentCharacterData)
      
      // 캐릭터 데이터 저장 (파츠 정보만)
      const characterData: CharacterData = {
        userId,
        parts: selectedParts,
        position: currentCharacterData?.position || { x: 0, y: 0 },
        isVisible: true
      }

      console.log('전송할 캐릭터 데이터:', characterData)
      console.log('전송할 데이터 JSON:', JSON.stringify(characterData))

      const response = await fetch('/api/character', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(characterData),
      })

      console.log('API 응답 상태:', response.status)
      
      if (response.ok) {
        const savedData = await response.json()
        console.log('저장된 캐릭터 데이터:', savedData)
        onCharacterUpdate?.(savedData)
        setShowCharacterCustomize(false)
        alert('캐릭터가 저장되었습니다!')
      } else {
        const errorData = await response.json()
        console.error('API 에러 응답:', errorData)
        alert(`캐릭터 저장에 실패했습니다: ${errorData.error || '알 수 없는 오류'}`)
      }
    } catch (error) {
      console.error('캐릭터 저장 오류:', error)
      alert('캐릭터 저장 중 오류가 발생했습니다.')
    }
  }

  // 완료 버튼 클릭 시 실제 상태에 저장
  const handleComplete = async () => {
    try {
      // Garage intro 저장
      if (userId && tempGarageIntro !== garageIntro) {
        console.log('Garage intro 저장 시작:', { userId, intro: tempGarageIntro })
        
        const response = await fetch(`/api/users/${userId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            garage_config: {
              intro: tempGarageIntro
            }
          }),
        })

        if (response.ok) {
          console.log('Garage intro 저장 성공')
          setGarageIntro(tempGarageIntro)
          
          // 사용자 정보 다시 로드하여 최신 garage_config 반영
          if (onCharacterUpdate) {
            // 부모 컴포넌트에 업데이트 알림
            onCharacterUpdate({ garageIntro: tempGarageIntro })
          }
        } else {
          const errorData = await response.json()
          console.error('Garage intro 저장 실패:', errorData)
          alert(`Garage intro 저장에 실패했습니다: ${errorData.error || '알 수 없는 오류'}`)
          return
        }
      } else {
        // 변경사항이 없으면 그냥 상태만 업데이트
        setGarageIntro(tempGarageIntro)
      }
      
      setShowHeaderCharacterPanel(false)
    } catch (error) {
      console.error('Garage intro 저장 오류:', error)
      alert('Garage intro 저장 중 오류가 발생했습니다.')
    }
  }

  // 취소 시 패널만 닫기
  const handleCancel = () => {
    setShowHeaderCharacterPanel(false)
  }

  if (!showHeaderCharacterPanel) return null

  return (
    <div 
              className="fixed inset-0 z-[999999] bg-black flex items-center justify-center p-2 sm:p-4 overflow-y-auto"
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        // 패널 외부 클릭 시 바로 닫히지 않음
      }}
      onTouchStart={(e) => e.stopPropagation()}
      onTouchEnd={(e) => e.stopPropagation()}
    >
      <div 
        className="w-full max-w-sm sm:max-w-md bg-gradient-to-b from-[#0a0a23] via-[#16213e] to-[#1a1a2e] border-2 sm:border-4 border-[#00ff88]/50 shadow-2xl relative max-h-[calc(100vh-32px)] overflow-y-auto"
        style={{
          borderRadius: '6px',
          fontFamily: 'monospace',
          imageRendering: 'pixelated',
          boxShadow: '0 0 20px rgba(0, 255, 136, 0.2), inset 0 0 15px rgba(0, 255, 136, 0.05)'
        }}
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
        }}
        onTouchStart={(e) => e.stopPropagation()}
        onTouchEnd={(e) => e.stopPropagation()}
      >
        
        {/* 네온 글로우 테두리 */}
        <div className="absolute -inset-1 bg-gradient-to-r from-[#00ff88]/20 via-[#00d4ff]/20 to-[#00ff88]/20 blur-sm -z-10" 
             style={{borderRadius: '12px'}}></div>
        
        {/* 헤더 - 게임 스타일 반응형 */}
        <div className="bg-gradient-to-r from-[#0a0a23] to-[#16213e] p-3 sm:p-4 border-b-2 border-[#00ff88]/30 relative">
          {/* 상단 장식 라인 */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#00ff88]/60 to-transparent"></div>
          
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2 sm:gap-3">
              {/* 픽셀 아이콘 */}
              <div className="w-5 h-5 sm:w-6 sm:h-6 bg-gradient-to-br from-[#00d4ff] to-[#9c88ff] border border-[#00ff88]" 
                   style={{borderRadius: '3px'}}>
                <div className="w-full h-full flex items-center justify-center">
                  <div className="w-2 h-2 sm:w-3 sm:h-3 bg-white" style={{borderRadius: '1px'}}></div>
                </div>
              </div>
                          <h3 className="text-[#00ff88] font-bold text-sm sm:text-lg font-mono tracking-wider" 
                style={{textShadow: '0 0 8px rgba(0, 255, 136, 0.5)'}}>
              CHARACTER EDIT
            </h3>
            </div>
            <button
              onClick={handleCancel}
              className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-br from-[#ff6b6b]/20 to-[#ff4757]/20 border border-[#ff6b6b]/50 hover:border-[#ff6b6b] text-[#ff6b6b] hover:text-[#ff4757] font-bold transition-all duration-200 hover:scale-110 text-sm sm:text-base"
              style={{borderRadius: '4px'}}
            >
              ✕
            </button>
          </div>
          
          {/* 하단 장식 라인 */}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#00ff88]/40 to-transparent"></div>
        </div>

        <div className="p-3 sm:p-4 space-y-3 sm:space-y-4 relative">
          {/* 배경 패턴 */}
          <div className="absolute inset-0 opacity-5">
            <div className="w-full h-full" 
                 style={{
                   backgroundImage: `radial-gradient(circle, #00ff88 1px, transparent 1px)`,
                   backgroundSize: '12px 12px'
                 }}></div>
          </div>
          
          {/* 가라지 소개 입력 - 게임 스타일 반응형 */}
          <div className="space-y-2 sm:space-y-3 relative">
            <div className="bg-gradient-to-r from-[#00d4ff]/20 to-[#9c88ff]/20 border border-[#00d4ff]/50 p-2 sm:p-3 relative"
                 style={{borderRadius: '4px'}}>
              <h4 className="text-[#00d4ff] text-center font-bold text-xs sm:text-sm font-mono tracking-wider mb-2 sm:mb-3" 
                  style={{textShadow: '0 0 6px rgba(0, 212, 255, 0.5)'}}>
                GARAGE INTRO
              </h4>
              <div className="relative">
                <textarea
                  value={tempGarageIntro}
                  onChange={(e) => setTempGarageIntro(e.target.value)}
                  placeholder="가라지 소개글을 입력하세요..."
                  className="w-full bg-[#0a0a23]/80 border-2 border-[#00d4ff]/30 px-2 sm:px-3 py-1.5 sm:py-2 text-white placeholder:text-gray-400 resize-none focus:border-[#00d4ff] transition-all duration-200 text-xs sm:text-sm font-mono"
                  style={{borderRadius: '4px'}}
                  rows={1}
                  maxLength={28}
                />
                <div className="absolute bottom-0.5 right-1 sm:bottom-1 sm:right-2 text-[#00d4ff] text-xs bg-[#0a0a23]/90 px-1 sm:px-2 py-0.5 border border-[#00d4ff]/30" style={{borderRadius: '2px'}}>
                  {tempGarageIntro.length}/28
                </div>
              </div>
              {/* 모서리 픽셀 도트 */}
              <div className="absolute top-1 left-1 w-1 h-1 bg-[#00d4ff]" style={{borderRadius: '1px'}}></div>
              <div className="absolute top-1 right-1 w-1 h-1 bg-[#00d4ff]" style={{borderRadius: '1px'}}></div>
              <div className="absolute bottom-1 left-1 w-1 h-1 bg-[#00d4ff]" style={{borderRadius: '1px'}}></div>
              <div className="absolute bottom-1 right-1 w-1 h-1 bg-[#00d4ff]" style={{borderRadius: '1px'}}></div>
            </div>
          </div>



          {/* 캐릭터 커스터마이즈 섹션 */}
          <div className="space-y-2 sm:space-y-3 relative">
            <div className="bg-gradient-to-r from-[#9c88ff]/20 to-[#00ff88]/20 border border-[#9c88ff]/50 p-2 sm:p-3 relative"
                 style={{borderRadius: '4px'}}>
              <h4 className="text-[#9c88ff] text-center font-bold text-xs sm:text-sm font-mono tracking-wider mb-2 sm:mb-3" 
                  style={{textShadow: '0 0 6px rgba(156, 136, 255, 0.5)'}}>
                CHARACTER CUSTOMIZE
              </h4>
              
              <div className="space-y-2">
                {/* 캐릭터 커스터마이즈 버튼 */}
                <button
                  onClick={() => setShowCharacterCustomize(true)}
                  className="w-full bg-gradient-to-r from-[#9c88ff]/20 to-[#00ff88]/20 border-2 border-[#9c88ff]/50 hover:border-[#9c88ff] text-[#9c88ff] hover:text-white font-bold py-2 transition-all duration-300 hover:scale-105 hover:shadow-lg relative font-mono tracking-wide text-xs sm:text-sm"
                  style={{
                    borderRadius: '4px',
                    textShadow: '0 0 6px rgba(156, 136, 255, 0.5)',
                    boxShadow: '0 0 15px rgba(156, 136, 255, 0.2)'
                  }}
                >
                  캐릭터 꾸미기
                </button>

              </div>
            </div>
          </div>

          {/* 미리보기 - 게임 스타일 반응형 */}
          <div className="bg-gradient-to-br from-[#0a0a23]/80 to-[#16213e]/80 border-2 border-[#00ff88]/30 p-2 sm:p-3 relative"
               style={{borderRadius: '6px'}}>
            <h4 className="text-[#00ff88] text-center font-bold text-xs sm:text-sm font-mono tracking-wider mb-1 sm:mb-1.5" 
                style={{textShadow: '0 0 6px rgba(0, 255, 136, 0.5)'}}>
              PREVIEW
            </h4>
            <div className="flex flex-col items-center justify-center space-y-1 sm:space-y-1.5 pt-0.5 sm:pt-1 pb-0.5 sm:pb-1">
                  <div className="relative">
                    {/* 캐릭터 프레임 - 감정표현까지 포함한 캐릭터 전체 */}
                    <div className="w-16 h-20 sm:w-20 sm:h-24 bg-gradient-to-br from-[#00d4ff]/20 to-[#9c88ff]/20 border-2 border-[#00ff88]/50 relative"
                         style={{borderRadius: '6px'}}>
                      
                      {/* 캐릭터 파츠들을 레이어 순서대로 렌더링 - 하단에 배치하여 감정 이모티콘 공간 확보 */}
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
                  
                  {/* 말풍선 스타일 감정 이모티콘 - 캐릭터 이미지 상단과 맞춤 */}
                  <div className="absolute top-1 left-1/2 transform -translate-x-1/2 z-10">
                    {/* 말풍선 배경 */}
                    <div className="bg-white border border-gray-300 px-1 py-0.5 rounded relative shadow-sm">
                      {/* 말풍선 꼬리 */}
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-2 border-r-2 border-t-2 border-l-transparent border-r-transparent border-t-white"></div>
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 translate-y-px w-0 h-0 border-l-2 border-r-2 border-t-2 border-l-transparent border-r-transparent border-t-gray-300"></div>
                      
                      {/* 감정 이모티콘 */}
                      <div className="text-xs">
                        {CHARACTER_PARTS.emotion.find(emotion => emotion.id === selectedParts.emotion)?.emoji || '😊'}
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
              
              {/* 가라지 소개 미리보기 */}
              <div className="bg-gradient-to-r from-[#00d4ff]/10 to-[#9c88ff]/10 border border-[#00d4ff]/30 px-2 sm:px-3 py-1 sm:py-1.5 max-w-[180px] sm:max-w-[220px]"
                   style={{borderRadius: '4px'}}>
                <p className="text-[8px] sm:text-[10px] text-[#00d4ff] font-mono text-center leading-tight"
                   style={{textShadow: '0 0 4px rgba(0, 212, 255, 0.3)'}}>
                  {tempGarageIntro || '가라지 소개글을 입력하세요...'}
                </p>
              </div>
            </div>
            {/* 미리보기 프레임 모서리 픽셀 도트 */}
            <div className="absolute top-1 left-1 w-1 h-1 bg-[#00ff88]" style={{borderRadius: '1px'}}></div>
            <div className="absolute top-1 right-1 w-1 h-1 bg-[#00ff88]" style={{borderRadius: '1px'}}></div>
            <div className="absolute bottom-1 left-1 w-1 h-1 bg-[#00ff88]" style={{borderRadius: '1px'}}></div>
            <div className="absolute bottom-1 right-1 w-1 h-1 bg-[#00ff88]" style={{borderRadius: '1px'}}></div>
          </div>

          {/* 버튼들 */}
          <div className="flex gap-2">
            {/* 완료 버튼 */}
            <button
              onClick={handleComplete}
              className="flex-1 bg-gradient-to-r from-[#00ff88]/20 to-[#00d4ff]/20 border-2 border-[#00ff88]/50 hover:border-[#00ff88] text-[#00ff88] hover:text-white font-bold py-3 sm:py-4 transition-all duration-300 hover:scale-105 hover:shadow-lg relative font-mono tracking-wide"
              style={{
                borderRadius: '6px',
                textShadow: '0 0 6px rgba(0, 255, 136, 0.5)',
                boxShadow: '0 0 15px rgba(0, 255, 136, 0.2)'
              }}
            >
              <div className="flex items-center justify-center gap-1.5 sm:gap-2">
                <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-[#00ff88] border border-white" style={{borderRadius: '1px'}}></div>
                <span className="text-sm sm:text-base font-mono tracking-wider">COMPLETE</span>
                <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-[#00ff88] border border-white" style={{borderRadius: '1px'}}></div>
              </div>
              
              {/* 버튼 모서리 픽셀 도트 */}
              <div className="absolute top-1 left-1 w-1 h-1 bg-[#00ff88]" style={{borderRadius: '1px'}}></div>
              <div className="absolute top-1 right-1 w-1 h-1 bg-[#00ff88]" style={{borderRadius: '1px'}}></div>
              <div className="absolute bottom-1 left-1 w-1 h-1 bg-[#00ff88]" style={{borderRadius: '1px'}}></div>
              <div className="absolute bottom-1 right-1 w-1 h-1 bg-[#00ff88]" style={{borderRadius: '1px'}}></div>
            </button>

            {/* 나가기 버튼 */}
            <button
              onClick={handleCancel}
              className="flex-1 bg-gradient-to-r from-[#ff6b6b]/20 to-[#ff4757]/20 border-2 border-[#ff6b6b]/50 hover:border-[#ff6b6b] text-[#ff6b6b] hover:text-white font-bold py-3 sm:py-4 transition-all duration-300 hover:scale-105 hover:shadow-lg relative font-mono tracking-wide"
              style={{
                borderRadius: '6px',
                textShadow: '0 0 6px rgba(255, 107, 107, 0.5)',
                boxShadow: '0 0 15px rgba(255, 107, 107, 0.2)'
              }}
            >
              <div className="flex items-center justify-center gap-1.5 sm:gap-2">
                <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-[#ff6b6b] border border-white" style={{borderRadius: '1px'}}></div>
                <span className="text-sm sm:text-base font-mono tracking-wider">EXIT</span>
                <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-[#ff6b6b] border border-white" style={{borderRadius: '1px'}}></div>
              </div>
              
              {/* 버튼 모서리 픽셀 도트 */}
              <div className="absolute top-1 left-1 w-1 h-1 bg-[#ff6b6b]" style={{borderRadius: '1px'}}></div>
              <div className="absolute top-1 right-1 w-1 h-1 bg-[#ff6b6b]" style={{borderRadius: '1px'}}></div>
              <div className="absolute bottom-1 left-1 w-1 h-1 bg-[#ff6b6b]" style={{borderRadius: '1px'}}></div>
              <div className="absolute bottom-1 right-1 w-1 h-1 bg-[#ff6b6b]" style={{borderRadius: '1px'}}></div>
            </button>
          </div>
        </div>
      </div>

      {/* 캐릭터 커스터마이즈 모달 */}
      {showCharacterCustomize && (
        <div 
          className="fixed inset-0 z-[999999] bg-black flex items-center justify-center p-2 sm:p-4 overflow-y-auto"
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            // 패널 외부 클릭 시 바로 닫히지 않음
          }}
          onTouchStart={(e) => e.stopPropagation()}
          onTouchEnd={(e) => e.stopPropagation()}
        >
          <div 
            className="w-full max-w-sm sm:max-w-md bg-gradient-to-b from-[#0a0a23] via-[#16213e] to-[#1a1a2e] border-2 sm:border-4 border-[#00ff88]/50 shadow-2xl relative max-h-[calc(100vh-32px)] overflow-y-auto"
            style={{
              borderRadius: '6px',
              fontFamily: 'monospace',
              imageRendering: 'pixelated',
              boxShadow: '0 0 20px rgba(0, 255, 136, 0.2), inset 0 0 15px rgba(0, 255, 136, 0.05)'
            }}
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
            }}
            onTouchStart={(e) => e.stopPropagation()}
            onTouchEnd={(e) => e.stopPropagation()}
          >
            
            {/* 네온 글로우 테두리 */}
            <div className="absolute -inset-1 bg-gradient-to-r from-[#00ff88]/20 via-[#00d4ff]/20 to-[#00ff88]/20 blur-sm -z-10" 
                 style={{borderRadius: '12px'}}></div>
            
            {/* 헤더 - 게임 스타일 반응형 */}
            <div className="bg-gradient-to-r from-[#0a0a23] to-[#16213e] p-3 sm:p-4 border-b-2 border-[#00ff88]/30 relative">
              {/* 상단 장식 라인 */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#00ff88]/60 to-transparent"></div>
              
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2 sm:gap-3">
                  {/* 픽셀 아이콘 */}
                  <div className="w-5 h-5 sm:w-6 sm:h-6 bg-gradient-to-br from-[#00d4ff] to-[#9c88ff] border border-[#00ff88]" 
                       style={{borderRadius: '3px'}}>
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="w-2 h-2 sm:w-3 sm:h-3 bg-white" style={{borderRadius: '1px'}}></div>
                    </div>
                  </div>
                  <h3 className="text-[#00ff88] font-bold text-sm sm:text-lg font-mono tracking-wider" 
                      style={{textShadow: '0 0 8px rgba(0, 255, 136, 0.5)'}}>
                    CHARACTER CUSTOMIZE
                  </h3>
                </div>
                <button
                  onClick={() => setShowCharacterCustomize(false)}
                  className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-br from-[#ff6b6b]/20 to-[#ff4757]/20 border border-[#ff6b6b]/50 hover:border-[#ff6b6b] text-[#ff6b6b] hover:text-[#ff4757] font-bold transition-all duration-200 hover:scale-110 text-sm sm:text-base"
                  style={{borderRadius: '4px'}}
                >
                  ✕
                </button>
              </div>
              
              {/* 하단 장식 라인 */}
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#00ff88]/40 to-transparent"></div>
            </div>

            <div className="p-3 sm:p-4 space-y-3 sm:space-y-4 relative">
              {/* 배경 패턴 */}
              <div className="absolute inset-0 opacity-5">
                <div className="w-full h-full" 
                     style={{
                       backgroundImage: `radial-gradient(circle, #00ff88 1px, transparent 1px)`,
                       backgroundSize: '12px 12px'
                     }}></div>
              </div>
              
              {/* 캐릭터 미리보기 - 게임 스타일 반응형 */}
              <div className="bg-gradient-to-br from-[#0a0a23]/80 to-[#16213e]/80 border-2 border-[#00ff88]/30 p-2 sm:p-3 relative"
                   style={{borderRadius: '6px'}}>
                <h4 className="text-[#00ff88] text-center font-bold text-xs sm:text-sm font-mono tracking-wider mb-1 sm:mb-1.5" 
                    style={{textShadow: '0 0 6px rgba(0, 255, 136, 0.5)'}}>
                  PREVIEW
                </h4>
                <div className="flex flex-col items-center justify-center space-y-1 sm:space-y-1.5 pt-0.5 sm:pt-1 pb-0.5 sm:pb-1">
                  <div className="relative">
                    {/* 캐릭터 프레임 - 감정표현까지 포함한 캐릭터 전체 */}
                    <div className="w-16 h-20 sm:w-20 sm:h-24 bg-gradient-to-br from-[#00d4ff]/20 to-[#9c88ff]/20 border-2 border-[#00ff88]/50 relative"
                         style={{borderRadius: '6px'}}>
                      
                      {/* 캐릭터 파츠들을 레이어 순서대로 렌더링 - 하단에 배치하여 감정 이모티콘 공간 확보 */}
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
                      
                      {/* 말풍선 스타일 감정 이모티콘 - 프레임 내 상단에 배치 */}
                      <div className="absolute top-1 left-1/2 transform -translate-x-1/2 z-10">
                        {/* 말풍선 배경 */}
                        <div className="bg-white border border-gray-300 px-1 py-0.5 rounded relative shadow-sm">
                          {/* 말풍선 꼬리 */}
                          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-2 border-r-2 border-t-2 border-l-transparent border-r-transparent border-t-white"></div>
                          <div className="absolute top-full left-1/2 transform -translate-x-1/2 translate-y-px w-0 h-0 border-l-2 border-r-2 border-t-2 border-l-transparent border-r-transparent border-t-gray-300"></div>
                          
                          {/* 감정 이모티콘 */}
                          <div className="text-xs">
                            {CHARACTER_PARTS.emotion.find(emotion => emotion.id === selectedParts.emotion)?.emoji || '😊'}
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
                {/* 미리보기 프레임 모서리 픽셀 도트 */}
                <div className="absolute top-1 left-1 w-1 h-1 bg-[#00ff88]" style={{borderRadius: '1px'}}></div>
                <div className="absolute top-1 right-1 w-1 h-1 bg-[#00ff88]" style={{borderRadius: '1px'}}></div>
                <div className="absolute bottom-1 left-1 w-1 h-1 bg-[#00ff88]" style={{borderRadius: '1px'}}></div>
                <div className="absolute bottom-1 right-1 w-1 h-1 bg-[#00ff88]" style={{borderRadius: '1px'}}></div>
              </div>

              {/* 파츠 선택 섹션들 */}
              {Object.entries(getCharacterPartsOptions()).map(([partType, parts]) => (
                <div key={partType} className="space-y-2 sm:space-y-3 relative">
                  <div className="bg-gradient-to-r from-[#00d4ff]/20 to-[#9c88ff]/20 border border-[#00d4ff]/50 p-2 sm:p-3 relative"
                       style={{borderRadius: '4px'}}>
                    <h4 className="text-[#00d4ff] text-center font-bold text-xs sm:text-sm font-mono tracking-wider mb-2 sm:mb-3" 
                        style={{textShadow: '0 0 6px rgba(0, 212, 255, 0.5)'}}>
                      {partType.toUpperCase()}
                    </h4>
                    <div className="overflow-x-auto scrollbar-hide">
                      <div className="flex gap-1 pb-1" style={{width: 'max-content'}}>
                        {parts.map((part) => (
                          <button
                            key={part.id}
                            onClick={() => handlePartChange(partType as keyof CharacterParts, part.id)}
                            className={`p-1 border transition-all duration-200 relative flex-shrink-0 ${
                              selectedParts[partType as keyof CharacterParts] === part.id
                                ? 'bg-[#00d4ff]/20 border-[#00d4ff] scale-105'
                                : 'bg-[#0a0a23]/40 border-[#00d4ff]/30 hover:border-[#00d4ff]/60'
                            }`}
                            style={{
                              borderRadius: '3px',
                              width: partType === 'emotion' ? '50px' : '60px',
                              height: '50px'
                            }}
                          >
                            {partType === 'emotion' ? (
                              <div className="w-full h-5 flex items-center justify-center mb-0.5 text-sm">
                                {'emoji' in part ? part.emoji : '😊'}
                              </div>
                            ) : part.id === 'none.png' ? (
                              <div className="w-full h-5 flex items-center justify-center mb-0.5 text-lg text-red-500">
                                ✕
                              </div>
                            ) : (
                              <img 
                                src={part.preview} 
                                alt={part.name}
                                className="w-full h-5 object-contain mb-0.5"
                                style={{ imageRendering: 'pixelated' }}
                              />
                            )}
                            <div className="text-white text-[7px] font-mono text-center leading-none">
                              {part.name}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                    {/* 모서리 픽셀 도트 */}
                    <div className="absolute top-1 left-1 w-1 h-1 bg-[#00d4ff]" style={{borderRadius: '1px'}}></div>
                    <div className="absolute top-1 right-1 w-1 h-1 bg-[#00d4ff]" style={{borderRadius: '1px'}}></div>
                    <div className="absolute bottom-1 left-1 w-1 h-1 bg-[#00d4ff]" style={{borderRadius: '1px'}}></div>
                    <div className="absolute bottom-1 right-1 w-1 h-1 bg-[#00d4ff]" style={{borderRadius: '1px'}}></div>
                  </div>
                </div>
              ))}

              {/* 버튼들 */}
              <div className="flex gap-2">
                {/* 저장 버튼 */}
                <button
                  onClick={handleCharacterSave}
                  className="flex-1 bg-gradient-to-r from-[#00ff88]/20 to-[#00d4ff]/20 border-2 border-[#00ff88]/50 hover:border-[#00ff88] text-[#00ff88] hover:text-white font-bold py-3 sm:py-4 transition-all duration-300 hover:scale-105 hover:shadow-lg relative font-mono tracking-wide"
                  style={{
                    borderRadius: '6px',
                    textShadow: '0 0 6px rgba(0, 255, 136, 0.5)',
                    boxShadow: '0 0 15px rgba(0, 255, 136, 0.2)'
                  }}
                >
                  <div className="flex items-center justify-center gap-1.5 sm:gap-2">
                    <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-[#00ff88] border border-white" style={{borderRadius: '1px'}}></div>
                    <span className="text-sm sm:text-base font-mono tracking-wider">SAVE</span>
                    <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-[#00ff88] border border-white" style={{borderRadius: '1px'}}></div>
                  </div>
                  
                  {/* 버튼 모서리 픽셀 도트 */}
                  <div className="absolute top-1 left-1 w-1 h-1 bg-[#00ff88]" style={{borderRadius: '1px'}}></div>
                  <div className="absolute top-1 right-1 w-1 h-1 bg-[#00ff88]" style={{borderRadius: '1px'}}></div>
                  <div className="absolute bottom-1 left-1 w-1 h-1 bg-[#00ff88]" style={{borderRadius: '1px'}}></div>
                  <div className="absolute bottom-1 right-1 w-1 h-1 bg-[#00ff88]" style={{borderRadius: '1px'}}></div>
                </button>

                {/* 취소 버튼 */}
                <button
                  onClick={() => {
                    // 기존 캐릭터 데이터로 복원
                    if (currentCharacterData) {
                      setSelectedParts(currentCharacterData.parts)
                    }
                    setShowCharacterCustomize(false)
                  }}
                  className="flex-1 bg-gradient-to-r from-[#ff6b6b]/20 to-[#ff4757]/20 border-2 border-[#ff6b6b]/50 hover:border-[#ff6b6b] text-[#ff6b6b] hover:text-white font-bold py-3 sm:py-4 transition-all duration-300 hover:scale-105 hover:shadow-lg relative font-mono tracking-wide"
                  style={{
                    borderRadius: '6px',
                    textShadow: '0 0 6px rgba(255, 107, 107, 0.5)',
                    boxShadow: '0 0 15px rgba(255, 107, 107, 0.2)'
                  }}
                >
                  <div className="flex items-center justify-center gap-1.5 sm:gap-2">
                    <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-[#ff6b6b] border border-white" style={{borderRadius: '1px'}}></div>
                    <span className="text-sm sm:text-base font-mono tracking-wider">CANCEL</span>
                    <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-[#ff6b6b] border border-white" style={{borderRadius: '1px'}}></div>
                  </div>
                  
                  {/* 버튼 모서리 픽셀 도트 */}
                  <div className="absolute top-1 left-1 w-1 h-1 bg-[#ff6b6b]" style={{borderRadius: '1px'}}></div>
                  <div className="absolute top-1 right-1 w-1 h-1 bg-[#ff6b6b]" style={{borderRadius: '1px'}}></div>
                  <div className="absolute bottom-1 left-1 w-1 h-1 bg-[#ff6b6b]" style={{borderRadius: '1px'}}></div>
                  <div className="absolute bottom-1 right-1 w-1 h-1 bg-[#ff6b6b]" style={{borderRadius: '1px'}}></div>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 캐릭터 아이템 상점 모달 */}
      <CharacterItemShopModal
        isOpen={showCharacterItemShop}
        onClose={() => setShowCharacterItemShop(false)}
        userId={userId || ''}
        onItemPurchased={handleItemPurchased}
      />

      {/* 캐릭터 아이템 인벤토리 모달 */}
      <CharacterItemInventoryModal
        isOpen={showCharacterItemInventory}
        onClose={() => setShowCharacterItemInventory(false)}
        userId={userId || ''}
        onItemEquipped={(item) => {
          console.log('아이템 장착됨:', item)
          // 캐릭터 데이터 업데이트
          if (onCharacterUpdate) {
            onCharacterUpdate({ 
              parts: {
                ...selectedParts,
                [item.category]: item.image_url.split('/').pop()
              }
            })
          }
        }}
      />
    </div>
  )
}

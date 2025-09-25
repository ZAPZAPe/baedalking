'use client'

import { useState, useEffect } from 'react'

interface CharacterItem {
  id: string
  name: string
  description: string
  image_url: string
  category: string
  sub_category: string
  price: number
  pixel_data: any
}

interface CharacterEditPanelProps {
  showHeaderCharacterPanel: boolean
  setShowHeaderCharacterPanel: (show: boolean) => void
  garageIntro: string
  setGarageIntro: (intro: string) => void
  userId?: string
}

export default function CharacterEditPanel({
  showHeaderCharacterPanel,
  setShowHeaderCharacterPanel,
  garageIntro,
  setGarageIntro,
  userId
}: CharacterEditPanelProps) {
  
  // 둥둥 떠다니는 애니메이션 스타일
  const floatingStyle = `
    @keyframes float {
      0%, 100% {
        transform: translateY(0px);
      }
      50% {
        transform: translateY(-3px);
      }
    }
  `
  // 기존 시스템과 호환되는 상태들
  const [tempGarageIntro, setTempGarageIntro] = useState(garageIntro)
  
  // 새로운 캐립터 시스템 상태들
  const [availableCharacters, setAvailableCharacters] = useState<CharacterItem[]>([])
  const [availableEmotions, setAvailableEmotions] = useState<CharacterItem[]>([])
  const [currentCharacter, setCurrentCharacter] = useState<CharacterItem | null>(null) // 현재 선택된 캐릭터
  const [equippedCharacter, setEquippedCharacter] = useState<CharacterItem | null>(null) // 현재 장착된 캐릭터
  const [selectedEmotion, setSelectedEmotion] = useState<CharacterItem | null>(null)
  const [equippedEmotion, setEquippedEmotion] = useState<CharacterItem | null>(null) // 현재 장착된 이모션
  const [isLoading, setIsLoading] = useState(true)
  
  // 상점 아이템 관련 상태
  const [allCharacters, setAllCharacters] = useState<CharacterItem[]>([]) // 모든 캐릭터 (구매/미구매)
  const [allEmotions, setAllEmotions] = useState<CharacterItem[]>([]) // 모든 감정표현 (구매/미구매)
  const [showPurchaseModal, setShowPurchaseModal] = useState(false)
  const [selectedPurchaseItem, setSelectedPurchaseItem] = useState<CharacterItem | null>(null)
  const [purchaseType, setPurchaseType] = useState<'character' | 'emotion'>('character')


  // 패널이 열릴 때마다 임시 상태를 현재 값으로 초기화
  useEffect(() => {
    if (showHeaderCharacterPanel) {
      setTempGarageIntro(garageIntro)
      // 상태 초기화
      setSelectedEmotion(null)
      setEquippedEmotion(null)
      if (userId) {
        loadUserCharacterData()
      }
    }
  }, [showHeaderCharacterPanel, garageIntro, userId])

  const loadUserCharacterData = async () => {
    if (!userId) return
    
    setIsLoading(true)
    try {
      // 1. 사용자가 보유한 캐릭터/감정표현 로드 (카테고리별로 개별 호출)
      const [ownedCharactersRes, ownedEmotionsRes] = await Promise.all([
        fetch(`/api/user-owned-items?userId=${userId}&category=${encodeURIComponent('캐릭터')}`),
        fetch(`/api/user-owned-items?userId=${userId}&category=${encodeURIComponent('감정표현')}`)
      ])
      
      let characters: CharacterItem[] = []
      let emotions: CharacterItem[] = []
      
      if (ownedCharactersRes.ok) {
        const data = await ownedCharactersRes.json()
        characters = data.items || []
        setAvailableCharacters(characters)
      }
      
      if (ownedEmotionsRes.ok) {
        const data = await ownedEmotionsRes.json()
        emotions = data.items || []
        setAvailableEmotions(emotions)
      }
      
      // 2. 상점의 모든 캐릭터/감정표현 로드 (API는 category만 지원하므로 캐릭터로 통합 요청 후 sub_category로 분리)
      const allShopItemsRes = await fetch('/api/items?category=' + encodeURIComponent('캐릭터'))
      if (allShopItemsRes.ok) {
        const data = await allShopItemsRes.json()
        const shopItems: CharacterItem[] = data.items || []
        setAllCharacters(shopItems.filter(item => item && item.category === '캐릭터' && item.sub_category === '캐릭터'))
        setAllEmotions(shopItems.filter(item => item && item.category === '캐릭터' && item.sub_category === '감정표현'))
      }
      
      // 3. 현재 장착된 캐릭터/감정표현 로드
      const currentResponse = await fetch(`/api/user-current-character?userId=${userId}`)
      if (currentResponse.ok) {
        const currentData = await currentResponse.json()
        
        if (currentData.character && characters.length > 0) {
          const equipped = characters.find((c: CharacterItem) => c.id === currentData.character.id)
          if (equipped) {
            setEquippedCharacter(equipped)
            setCurrentCharacter(equipped)
          }
        }
        
        if (currentData.emotion && emotions.length > 0) {
          const equippedEmotion = emotions.find((e: CharacterItem) => e.id === currentData.emotion.id)
          if (equippedEmotion) {
            setEquippedEmotion(equippedEmotion)
            setSelectedEmotion(equippedEmotion)
          }
        }
      }
    } catch (error) {
      console.error('캐릭터 데이터 로드 실패:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCharacterSelect = async (character: CharacterItem) => {
    if (!userId) return
    
    try {
      // 소유 목록에서 동일 항목을 id 또는 name으로 탐색 (id 변경 대비)
      const ownedCharacter = availableCharacters.find(c => (c && c.id === character.id) || (c && c.name && c.name === character.name))
      const targetCharacterId = ownedCharacter?.id || character.id

      const response = await fetch('/api/user-current-character', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          characterId: targetCharacterId
        })
      })

      if (response.ok) {
        const normalizedCharacter = ownedCharacter || character
        setCurrentCharacter(normalizedCharacter)
      }
    } catch (error) {
    }
  }

  const handleEmotionSelect = async (emotion: CharacterItem) => {
    // 감정표현이 없거나 유효하지 않으면 함수 실행 중단
    if (!availableEmotions || availableEmotions.length === 0 || availableEmotions.every(e => !e || !e.id)) {
      return
    }
    
    if (!userId) return
    
    // 전달받은 감정표현이 유효하지 않은 경우 함수 실행 중단
    if (!emotion || !emotion.id || !emotion.name) {
      return
    }
    
    try {
      // 현재 장착된 감정표현과 같은 것을 클릭했다면 장착해제 (id 또는 name 기준)
      const isCurrentlyEquipped = (equippedEmotion?.id === emotion.id) || (!!equippedEmotion?.name && equippedEmotion.name === emotion.name)

      // 소유 목록에서 동일 항목을 id 또는 name으로 탐색 (id 변경 대비)
      const ownedEmotion = availableEmotions.find(e => (e && e.id === emotion.id) || (e && e.name && e.name === emotion.name))

      const targetEmotionId = ownedEmotion?.id || emotion.id
      const emotionIdToSet = isCurrentlyEquipped ? null : targetEmotionId

      const response = await fetch('/api/user-current-character', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          emotionId: emotionIdToSet
        })
      })

      if (response.ok) {
        if (emotionIdToSet) {
          // 감정표현 장착 (소유 레코드 기준으로 동기화)
          const normalizedEmotion = ownedEmotion || emotion
          setSelectedEmotion(normalizedEmotion)
          setEquippedEmotion(normalizedEmotion)
        } else {
          // 감정표현 장착해제
          setSelectedEmotion(null)
          setEquippedEmotion(null)
        }
      }
    } catch (error) {
    }
  }

  // 완료 버튼 클릭 시 실제 상태에 저장
  const handleComplete = () => {
    setGarageIntro(tempGarageIntro)
    setShowHeaderCharacterPanel(false)
    // 페이지 새로고침으로 변경사항 즉시 적용
    window.location.reload()
  }

  // 취소 시 패널만 닫기
  const handleCancel = () => {
    setShowHeaderCharacterPanel(false)
  }

  // 구매 모달 열기
  const handlePurchaseClick = (item: CharacterItem, type: 'character' | 'emotion') => {
    setSelectedPurchaseItem(item)
    setPurchaseType(type)
    setShowPurchaseModal(true)
  }
  
  // 구매 처리
  const handlePurchase = async () => {
    if (!selectedPurchaseItem || !userId) return
    
    try {
      const response = await fetch('/api/purchase-item', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          itemId: selectedPurchaseItem.id
        })
      })
      
      if (response.ok) {
        // 구매 성공 시 데이터 새로고침
        await loadUserCharacterData()
        setShowPurchaseModal(false)
        setSelectedPurchaseItem(null)
      } else {
        const error = await response.json()
        alert(error.error || '구매에 실패했습니다.')
      }
    } catch (error) {
      console.error('구매 실패:', error)
      alert('구매 중 오류가 발생했습니다.')
    }
  }

  if (!showHeaderCharacterPanel) return null

  return (
    <>
      <style>{floatingStyle}</style>
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
          
          {/* 로딩 상태 */}
          {isLoading ? (
            <div className="text-center py-8">
              <div className="text-[#00ff88] font-mono text-sm font-bold">🎭 데이터 로딩중...</div>
              <div className="flex justify-center mt-4">
                <div className="animate-spin w-6 h-6 border-2 border-[#00ff88] border-t-transparent rounded-full"></div>
              </div>
              <div className="text-[#00ff88]/70 font-mono text-xs mt-2">잠시만 기다려주세요</div>
            </div>
          ) : (
            <>
              {/* 1. 미리보기 - 게임 스타일 반응형 */}
              <div className="space-y-2 sm:space-y-3 relative">
                <div className="bg-gradient-to-br from-[#0a0a23]/80 to-[#16213e]/80 border-2 border-[#00ff88]/30 p-2 sm:p-3 relative"
                     style={{borderRadius: '6px'}}>
                <h4 className="text-[#00ff88] text-center font-bold text-xs sm:text-sm font-mono tracking-wider mb-2 sm:mb-3"
                    style={{textShadow: '0 0 6px rgba(0, 255, 136, 0.5)'}}>
                  PREVIEW
                </h4>
                <div className="flex flex-col items-center justify-center space-y-3 sm:space-y-4">
                  <div className="relative">
                    {/* 통합 프리뷰 프레임 - 가로 60px, 세로 96px (60% 스케일) */}
                    <div className="w-15 h-24 bg-gradient-to-br from-[#00d4ff]/20 to-[#9c88ff]/20 border-2 border-[#00ff88]/50 flex flex-col items-center justify-center overflow-hidden relative"
                         style={{borderRadius: '6px', width: '60px', height: '96px'}}>
                      
                      {/* 감정표현 영역 - 상단 36px */}
                      <div className="w-full h-9 flex items-end justify-center relative"
                           style={{height: '36px', paddingBottom: '2px'}}>
                        {equippedEmotion && (
                          <img
                            src={equippedEmotion.image_url}
                            alt={equippedEmotion.name}
                            className="w-6 h-6 object-contain animate-bounce"
                            style={{ 
                              imageRendering: 'pixelated',
                              animation: 'float 2s ease-in-out infinite'
                            }}
                          />
                        )}
                      </div>
                      
                      {/* 캐릭터 영역 - 하단 60px */}
                      <div className="w-full h-15 flex items-center justify-center relative"
                           style={{height: '60px'}}>
                        <img 
                          src={currentCharacter?.image_url?.replace('S_1.png', 'S_2.png') || "/Garage/Character/배민/S_2.png"}
                          alt="캐릭터" 
                          className="w-12 h-12 object-contain"
                          style={{ imageRendering: 'pixelated' }}
                        />
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
              </div>

              {/* 2. 감정표현 선택 섹션 - 모든 아이템 표시 (구매/미구매) */}
              <div className="space-y-2 sm:space-y-3 relative">
                <div className="bg-gradient-to-r from-[#ffd93d]/20 to-[#ff6b6b]/20 border border-[#ffd93d]/50 p-2 sm:p-3 relative"
                     style={{borderRadius: '4px'}}>
                  <h4 className="text-[#ffd93d] text-center font-bold text-xs sm:text-sm font-mono tracking-wider mb-2 sm:mb-3"
                      style={{textShadow: '0 0 6px rgba(255, 217, 61, 0.5)'}}>
                    EMOTION SELECT
                  </h4>
                  {!allEmotions || allEmotions.length === 0 ? (
                     <div className="text-center py-6 sm:py-8">
                       <div className="text-[#ffd93d] font-mono text-sm sm:text-base font-bold"
                            style={{textShadow: '0 0 6px rgba(255, 217, 61, 0.5)'}}>
                         감정표현을 불러오는 중...
                       </div>
                     </div>
                  ) : (
                    <div className="relative">
                      <div className="flex gap-2 overflow-x-auto pb-2" style={{scrollbarWidth: 'none', msOverflowStyle: 'none'}}>
                        {/* 모든 감정표현 아이템들 표시 */}
                        {allEmotions
                          .filter(emotion => emotion && emotion.id && emotion.name)
                          .filter(emotion => emotion.category === '캐릭터' && emotion.sub_category === '감정표현')
                          .map((emotion, index) => {
                          const isOwned = availableEmotions.some(e =>
                            (e && e.id === emotion.id) || (e && e.name && e.name === emotion.name)
                          )
                          return (
                            <div key={emotion.id || `emotion-${index}`} className="flex-shrink-0 text-center">
                              <button
                                onClick={() => isOwned ? handleEmotionSelect(emotion) : handlePurchaseClick(emotion, 'emotion')}
                                className={`w-16 h-16 sm:w-18 sm:h-18 p-1 transition-all duration-200 relative ${
                                  equippedEmotion?.id && equippedEmotion.id === emotion.id
                                    ? 'bg-[#ffd93d]/20 border-2 border-[#ffd93d] scale-105 shadow-lg shadow-[#ffd93d]/30'
                                    : isOwned
                                      ? 'bg-[#0a0a23]/40 border border-[#ffd93d]/30 hover:border-[#ffd93d]/60 hover:scale-102'
                                      : 'bg-[#1a1a1a]/60 border border-[#666666]/50 hover:border-[#888888]/70 hover:scale-102'
                                }`}
                                style={{borderRadius: '4px'}}
                              >
                                <div className="h-full flex items-center justify-center">
                                  <img
                                    src={emotion.image_url}
                                    alt={emotion.name}
                                    className={`w-10 h-10 sm:w-12 sm:h-12 object-contain ${!isOwned ? 'opacity-50' : ''}`}
                                    style={{ imageRendering: 'pixelated' }}
                                  />
                                </div>
                                {/* 미구매 아이템 잠금 아이콘 */}
                                {!isOwned && (
                                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded">
                                    <span className="text-white text-xs font-bold">🔒</span>
                                  </div>
                                )}
                                {/* 선택된 아이템 모서리 도트 */}
                                {equippedEmotion?.id && equippedEmotion.id === emotion.id && (
                                  <>
                                    <div className="absolute top-0.5 left-0.5 w-1 h-1 bg-[#ffd93d]" style={{borderRadius: '1px'}}></div>
                                    <div className="absolute top-0.5 right-0.5 w-1 h-1 bg-[#ffd93d]" style={{borderRadius: '1px'}}></div>
                                    <div className="absolute bottom-0.5 left-0.5 w-1 h-1 bg-[#ffd93d]" style={{borderRadius: '1px'}}></div>
                                    <div className="absolute bottom-0.5 right-0.5 w-1 h-1 bg-[#ffd93d]" style={{borderRadius: '1px'}}></div>
                                  </>
                                )}
                              </button>
                              <div className={`text-[8px] sm:text-[10px] font-mono font-bold truncate mt-1 px-1 ${isOwned ? 'text-white' : 'text-gray-500'}`}>
                                {emotion.name}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}
                  {/* 모서리 픽셀 도트 */}
                  <div className="absolute top-1 left-1 w-1 h-1 bg-[#ffd93d]" style={{borderRadius: '1px'}}></div>
                  <div className="absolute top-1 right-1 w-1 h-1 bg-[#ffd93d]" style={{borderRadius: '1px'}}></div>
                  <div className="absolute bottom-1 left-1 w-1 h-1 bg-[#ffd93d]" style={{borderRadius: '1px'}}></div>
                  <div className="absolute bottom-1 right-1 w-1 h-1 bg-[#ffd93d]" style={{borderRadius: '1px'}}></div>
                </div>
              </div>

            {/* 3. 캐릭터 선택 섹션 - 모든 아이템 표시 (구매/미구매) */}
            <div className="space-y-2 sm:space-y-3 relative">
              <div className="bg-gradient-to-r from-[#9c88ff]/20 to-[#00d4ff]/20 border border-[#9c88ff]/50 p-2 sm:p-3 relative"
                   style={{borderRadius: '4px'}}>
                <h4 className="text-[#9c88ff] text-center font-bold text-xs sm:text-sm font-mono tracking-wider mb-2 sm:mb-3"
                    style={{textShadow: '0 0 6px rgba(156, 136, 255, 0.5)'}}>
                  CHARACTER SELECT
                </h4>
                {!allCharacters || allCharacters.length === 0 ? (
                  <div className="text-center py-6 sm:py-8">
                    <div className="text-[#9c88ff] font-mono text-sm sm:text-base font-bold"
                         style={{textShadow: '0 0 6px rgba(156, 136, 255, 0.5)'}}>
                      캐릭터를 불러오는 중...
                    </div>
                  </div>
                ) : (
                  <div className="relative">
                    <div className="flex gap-2 overflow-x-auto pb-2" style={{scrollbarWidth: 'none', msOverflowStyle: 'none'}}>
                      <style jsx>{`
                        div::-webkit-scrollbar {
                          display: none;
                        }
                      `}</style>
                      {allCharacters
                        .filter(character => character.category === '캐릭터' && character.sub_category === '캐릭터')
                        .map((character, index) => {
                        const isOwned = availableCharacters.some(c => (c && c.id === character.id) || (c && c.name && c.name === character.name))
                        return (
                          <div key={character.id || `character-${index}`} className="flex-shrink-0 text-center">
                            <button
                              onClick={() => isOwned ? handleCharacterSelect(character) : handlePurchaseClick(character, 'character')}
                              className={`w-16 h-16 sm:w-18 sm:h-18 p-1 transition-all duration-200 relative ${
                                currentCharacter?.id === character.id
                                  ? 'bg-[#9c88ff]/20 border-2 border-[#9c88ff] scale-105 shadow-lg shadow-[#9c88ff]/30'
                                  : isOwned
                                    ? 'bg-[#0a0a23]/40 border border-[#9c88ff]/30 hover:border-[#9c88ff]/60 hover:scale-102'
                                    : 'bg-[#1a1a1a]/60 border border-[#666666]/50 hover:border-[#888888]/70 hover:scale-102'
                              }`}
                              style={{borderRadius: '4px'}}
                            >
                              <div className="h-full flex items-center justify-center">
                                <img
                                  src={character.image_url}
                                  alt={character.name}
                                  className={`w-10 h-10 sm:w-12 sm:h-12 object-contain ${!isOwned ? 'opacity-50' : ''}`}
                                  style={{ imageRendering: 'pixelated' }}
                                />
                              </div>
                              {/* 미구매 아이템 잠금 아이콘 */}
                              {!isOwned && (
                                <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded">
                                  <span className="text-white text-xs font-bold">🔒</span>
                                </div>
                              )}
                              {/* 선택된 아이템 모서리 도트 */}
                              {currentCharacter?.id === character.id && (
                                <>
                                  <div className="absolute top-0.5 left-0.5 w-1 h-1 bg-[#9c88ff]" style={{borderRadius: '1px'}}></div>
                                  <div className="absolute top-0.5 right-0.5 w-1 h-1 bg-[#9c88ff]" style={{borderRadius: '1px'}}></div>
                                  <div className="absolute bottom-0.5 left-0.5 w-1 h-1 bg-[#9c88ff]" style={{borderRadius: '1px'}}></div>
                                  <div className="absolute bottom-0.5 right-0.5 w-1 h-1 bg-[#9c88ff]" style={{borderRadius: '1px'}}></div>
                                </>
                              )}
                            </button>
                            <div className={`text-[8px] sm:text-[10px] font-mono font-bold truncate mt-1 px-1 ${isOwned ? 'text-white' : 'text-gray-500'}`}>
                              {character.name}
                            </div>
                          </div>
                        )}
                      )}
                    </div>
                  </div>
                )}
                {/* 모서리 픽셀 도트 */}
                <div className="absolute top-1 left-1 w-1 h-1 bg-[#9c88ff]" style={{borderRadius: '1px'}}></div>
                <div className="absolute top-1 right-1 w-1 h-1 bg-[#9c88ff]" style={{borderRadius: '1px'}}></div>
                <div className="absolute bottom-1 left-1 w-1 h-1 bg-[#9c88ff]" style={{borderRadius: '1px'}}></div>
                <div className="absolute bottom-1 right-1 w-1 h-1 bg-[#9c88ff]" style={{borderRadius: '1px'}}></div>
              </div>
            </div>

              {/* 4. 가라지 소개 입력 - 게임 스타일 반응형 */}
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
            </>
          )}

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
    </div>

      {/* 구매 확인 모달 */}
      {showPurchaseModal && selectedPurchaseItem && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[1000000] p-4">
          <div className="bg-gradient-to-br from-[#1a1a2e] to-[#0a0a23] border-2 border-[#00ff88] rounded-lg p-6 max-w-sm w-full">
            <h3 className="text-[#00ff88] text-lg font-bold font-mono mb-4 text-center">
              아이템 구매
            </h3>
            <div className="text-center mb-4">
              <img
                src={selectedPurchaseItem.image_url}
                alt={selectedPurchaseItem.name}
                className="w-20 h-20 mx-auto mb-2 object-contain"
                style={{ imageRendering: 'pixelated' }}
              />
              <p className="text-white font-mono text-sm mb-2">{selectedPurchaseItem.name}</p>
              <p className="text-[#ffd93d] font-mono text-lg font-bold">
                📦 {selectedPurchaseItem.price} 박스
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowPurchaseModal(false)}
                className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white font-mono text-sm rounded transition-colors"
              >
                취소
              </button>
              <button
                onClick={handlePurchase}
                className="flex-1 px-4 py-2 bg-[#00ff88] hover:bg-[#00cc70] text-black font-mono text-sm font-bold rounded transition-colors"
              >
                구매하기
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
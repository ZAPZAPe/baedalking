'use client'

import { useState, useEffect } from 'react'
import { CharacterParts, CharacterData } from '@/types'

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
    { id: 'hair01.png', name: '기본 헤어', preview: '/assets/character/hair01.png' },
    { id: 'hair02.png', name: '짧은 헤어', preview: '/assets/character/hair02.png' },
    { id: 'hair03.png', name: '긴 헤어', preview: '/assets/character/hair03.png' },
  ],
  top: [
    { id: 'jacket01.png', name: '기본 상의', preview: '/assets/character/jacket01.png' },
    { id: 'jacket02.png', name: '후드티', preview: '/assets/character/jacket02.png' },
    { id: 'shirt01.png', name: '셔츠', preview: '/assets/character/shirt01.png' },
  ],
  bottom: [
    { id: 'pants01.png', name: '기본 하의', preview: '/assets/character/pants01.png' },
    { id: 'pants02.png', name: '청바지', preview: '/assets/character/pants02.png' },
    { id: 'shorts01.png', name: '반바지', preview: '/assets/character/shorts01.png' },
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
    hair: 'hair01.png',
    top: 'jacket01.png',
    bottom: 'pants01.png',
    emotion: 'happy.png'
  })

  // 패널이 열릴 때 현재 캐릭터 데이터로 초기화
  useEffect(() => {
    if (isOpen && currentCharacterData) {
      setSelectedParts(currentCharacterData.parts)
    }
  }, [isOpen, currentCharacterData])

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
                {/* 캐릭터 파츠들을 레이어 순서대로 렌더링 */}
                <img 
                  src={`/assets/character/${selectedParts.bottom}`}
                  alt="하의" 
                  className="absolute"
                  style={{ imageRendering: 'pixelated' }}
                />
                <img 
                  src={`/assets/character/${selectedParts.top}`}
                  alt="상의" 
                  className="absolute"
                  style={{ imageRendering: 'pixelated' }}
                />
                <img 
                  src={`/assets/character/${selectedParts.hair}`}
                  alt="헤어" 
                  className="absolute"
                  style={{ imageRendering: 'pixelated' }}
                />
                {/* 감정 이모티콘 */}
                <img 
                  src={`/assets/character/emotions/${selectedParts.emotion}`}
                  alt="감정" 
                  className="absolute -top-8 left-1/2 transform -translate-x-1/2"
                  style={{ imageRendering: 'pixelated', width: '24px', height: '24px' }}
                />
              </div>
            </div>
          </div>

          {/* 파츠 선택 */}
          {Object.entries(CHARACTER_PARTS).map(([partType, parts]) => (
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
                    <img 
                      src={part.preview} 
                      alt={part.name}
                      className="w-full h-12 object-contain mb-1"
                      style={{ imageRendering: 'pixelated' }}
                    />
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


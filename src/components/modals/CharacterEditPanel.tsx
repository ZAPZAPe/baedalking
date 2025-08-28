'use client'

import { useState, useEffect } from 'react'
import { emotions } from '@/data/constants'

interface CharacterEditPanelProps {
  showHeaderCharacterPanel: boolean
  setShowHeaderCharacterPanel: (show: boolean) => void
  currentEmotion: string
  setCurrentEmotion: (emotion: string) => void
  speechText: string
  setSpeechText: (text: string) => void
  garageIntro: string
  setGarageIntro: (intro: string) => void
}

export default function CharacterEditPanel({
  showHeaderCharacterPanel,
  setShowHeaderCharacterPanel,
  currentEmotion,
  setCurrentEmotion,
  speechText,
  setSpeechText,
  garageIntro,
  setGarageIntro
}: CharacterEditPanelProps) {
  // 임시 상태들
  const [tempGarageIntro, setTempGarageIntro] = useState(garageIntro)
  const [tempSpeechText, setTempSpeechText] = useState(speechText)
  const [tempCurrentEmotion, setTempCurrentEmotion] = useState(currentEmotion)

  // 패널이 열릴 때마다 임시 상태를 현재 값으로 초기화
  useEffect(() => {
    if (showHeaderCharacterPanel) {
      setTempGarageIntro(garageIntro)
      setTempSpeechText(speechText)
      setTempCurrentEmotion(currentEmotion)
    }
  }, [showHeaderCharacterPanel, garageIntro, speechText, currentEmotion])

  // 완료 버튼 클릭 시 실제 상태에 저장
  const handleComplete = () => {
    setGarageIntro(tempGarageIntro)
    setSpeechText(tempSpeechText)
    setCurrentEmotion(tempCurrentEmotion)
    setShowHeaderCharacterPanel(false)
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

          {/* 말풍선 텍스트 입력 - 게임 스타일 반응형 */}
          <div className="space-y-2 sm:space-y-3 relative">
            <div className="bg-gradient-to-r from-[#9c88ff]/20 to-[#ffd93d]/20 border border-[#9c88ff]/50 p-2 sm:p-3 relative"
                 style={{borderRadius: '4px'}}>
              <h4 className="text-[#9c88ff] text-center font-bold text-xs sm:text-sm font-mono tracking-wider mb-2 sm:mb-3" 
                  style={{textShadow: '0 0 6px rgba(156, 136, 255, 0.5)'}}>
                SPEECH BUBBLE
              </h4>
              <div className="relative">
                <textarea
                  value={tempSpeechText}
                  onChange={(e) => setTempSpeechText(e.target.value)}
                  placeholder="말풍선에 표시할 텍스트를 입력하세요..."
                  className="w-full bg-[#0a0a23]/80 border-2 border-[#9c88ff]/30 px-2 sm:px-3 py-1.5 sm:py-2 text-white placeholder:text-gray-400 resize-none focus:border-[#9c88ff] transition-all duration-200 text-xs sm:text-sm font-mono"
                  style={{borderRadius: '4px'}}
                  rows={1}
                  maxLength={15}
                />
                <div className="absolute bottom-0.5 right-1 sm:bottom-1 sm:right-2 text-[#9c88ff] text-xs bg-[#0a0a23]/90 px-1 sm:px-2 py-0.5 border border-[#9c88ff]/30" style={{borderRadius: '2px'}}>
                  {tempSpeechText.length}/15
                </div>
              </div>
              {/* 모서리 픽셀 도트 */}
              <div className="absolute top-1 left-1 w-1 h-1 bg-[#9c88ff]" style={{borderRadius: '1px'}}></div>
              <div className="absolute top-1 right-1 w-1 h-1 bg-[#9c88ff]" style={{borderRadius: '1px'}}></div>
              <div className="absolute bottom-1 left-1 w-1 h-1 bg-[#9c88ff]" style={{borderRadius: '1px'}}></div>
              <div className="absolute bottom-1 right-1 w-1 h-1 bg-[#9c88ff]" style={{borderRadius: '1px'}}></div>
            </div>
          </div>

          {/* 감정 선택 - 게임 스타일 반응형 */}
          <div className="space-y-2 sm:space-y-3 relative">
            <div className="bg-gradient-to-r from-[#ffd93d]/20 to-[#ff6b6b]/20 border border-[#ffd93d]/50 p-2 sm:p-3 relative"
                 style={{borderRadius: '4px'}}>
              <h4 className="text-[#ffd93d] text-center font-bold text-xs sm:text-sm font-mono tracking-wider mb-2 sm:mb-3" 
                  style={{textShadow: '0 0 6px rgba(255, 217, 61, 0.5)'}}>
                EMOTION SELECT
              </h4>
              <div className="grid grid-cols-4 gap-1 sm:gap-2">
                {emotions.map((emotion) => (
                  <button
                    key={emotion.id}
                    onClick={() => setTempCurrentEmotion(emotion.id)}
                    className={`p-1.5 sm:p-2 border-2 transition-all duration-200 relative ${
                      tempCurrentEmotion === emotion.id
                        ? 'bg-[#ffd93d]/20 border-[#ffd93d] scale-105 shadow-lg'
                        : 'bg-[#0a0a23]/40 border-[#ffd93d]/30 hover:border-[#ffd93d]/60 hover:scale-102'
                    }`}
                    style={{borderRadius: '4px'}}
                  >
                    <div className="text-center">
                      <div className="text-sm sm:text-lg mb-0.5 sm:mb-1">{emotion.icon}</div>
                      <div className="text-white text-[8px] sm:text-[9px] font-mono font-bold">{emotion.label}</div>
                    </div>
                    {/* 선택된 버튼 픽셀 도트 */}
                    {tempCurrentEmotion === emotion.id && (
                      <>
                        <div className="absolute top-0.5 left-0.5 w-1 h-1 bg-[#ffd93d]" style={{borderRadius: '1px'}}></div>
                        <div className="absolute top-0.5 right-0.5 w-1 h-1 bg-[#ffd93d]" style={{borderRadius: '1px'}}></div>
                        <div className="absolute bottom-0.5 left-0.5 w-1 h-1 bg-[#ffd93d]" style={{borderRadius: '1px'}}></div>
                        <div className="absolute bottom-0.5 right-0.5 w-1 h-1 bg-[#ffd93d]" style={{borderRadius: '1px'}}></div>
                      </>
                    )}
                  </button>
                ))}
              </div>
              {/* 모서리 픽셀 도트 */}
              <div className="absolute top-1 left-1 w-1 h-1 bg-[#ffd93d]" style={{borderRadius: '1px'}}></div>
              <div className="absolute top-1 right-1 w-1 h-1 bg-[#ffd93d]" style={{borderRadius: '1px'}}></div>
              <div className="absolute bottom-1 left-1 w-1 h-1 bg-[#ffd93d]" style={{borderRadius: '1px'}}></div>
              <div className="absolute bottom-1 right-1 w-1 h-1 bg-[#ffd93d]" style={{borderRadius: '1px'}}></div>
            </div>
          </div>

          {/* 미리보기 - 게임 스타일 반응형 */}
          <div className="bg-gradient-to-br from-[#0a0a23]/80 to-[#16213e]/80 border-2 border-[#00ff88]/30 p-2 sm:p-3 relative"
               style={{borderRadius: '6px'}}>
            <h4 className="text-[#00ff88] text-center font-bold text-xs sm:text-sm font-mono tracking-wider mb-6 sm:mb-8" 
                style={{textShadow: '0 0 6px rgba(0, 255, 136, 0.5)'}}>
              PREVIEW
            </h4>
            <div className="flex flex-col items-center justify-center space-y-3 sm:space-y-4 pt-4 sm:pt-6 pb-2 sm:pb-3">
              <div className="relative">
                {/* 캐릭터 프레임 */}
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-[#00d4ff]/20 to-[#9c88ff]/20 border-2 border-[#00ff88]/50 flex items-center justify-center overflow-hidden relative"
                     style={{borderRadius: '6px'}}>
                  <img 
                    src={`/assets/character/character-${tempCurrentEmotion}.png`}
                    alt="캐릭터" 
                    className="w-12 h-12 sm:w-16 sm:h-16 object-contain"
                    style={{ imageRendering: 'pixelated' }}
                  />
                  {/* 프레임 모서리 픽셀 도트 */}
                  <div className="absolute top-0.5 left-0.5 w-1 h-1 bg-[#00ff88]" style={{borderRadius: '1px'}}></div>
                  <div className="absolute top-0.5 right-0.5 w-1 h-1 bg-[#00ff88]" style={{borderRadius: '1px'}}></div>
                  <div className="absolute bottom-0.5 left-0.5 w-1 h-1 bg-[#00ff88]" style={{borderRadius: '1px'}}></div>
                  <div className="absolute bottom-0.5 right-1 w-1 h-1 bg-[#00ff88]" style={{borderRadius: '1px'}}></div>
                </div>
                
                {/* 픽셀 말풍선 */}
                <div className="absolute -top-8 sm:-top-10 left-1/2 -translate-x-1/2 bg-white border-2 border-gray-800 min-w-[50px] sm:min-w-[60px] max-w-[100px] sm:max-w-[120px]"
                     style={{
                       borderRadius: '0px',
                       imageRendering: 'pixelated',
                       boxShadow: '3px 3px 0px rgba(0,0,0,0.3)'
                     }}>
                  <div className="absolute bottom-[-5px] sm:bottom-[-6px] left-1/2 -translate-x-1/2 w-2.5 h-2.5 sm:w-3 sm:h-3 bg-white border-r-2 border-b-2 border-gray-800 rotate-45"></div>
                  <p className="text-[8px] sm:text-[10px] text-gray-800 font-bold text-center leading-tight break-words overflow-hidden px-1.5 sm:px-2 py-1 sm:py-1.5"
                     style={{
                       display: '-webkit-box',
                       WebkitLineClamp: 2,
                       WebkitBoxOrient: 'vertical',
                       wordBreak: 'keep-all',
                       fontFamily: 'monospace'
                     }}>
                    {tempSpeechText}
                  </p>
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
    </div>
  )
}

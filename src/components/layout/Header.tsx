'use client'

import { useRouter } from 'next/navigation'

interface HeaderProps {
  userNickname: string
  totalBoxes: number
  onShowHeaderCharacterPanel: () => void
}

export default function Header({
  userNickname,
  totalBoxes,
  onShowHeaderCharacterPanel
}: HeaderProps) {
  const router = useRouter()
  
  return (
    <div 
      className="relative z-10 bg-gradient-to-r from-[#0a0a23] via-[#16213e] to-[#0a0a23] border-b-4 border-[#00ff88]/30 flex-shrink-0 shadow-xl"
      style={{
        fontFamily: 'monospace',
        imageRendering: 'pixelated',
        background: 'linear-gradient(135deg, #0a0a23 0%, #16213e 25%, #1a1a2e 50%, #16213e 75%, #0a0a23 100%)'
      }}
    >
      {/* 네온 글로우 라인 */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#00ff88]/60 to-transparent"></div>
      
      <div className="max-w-md mx-auto px-4 py-4 relative">
        {/* 상단 라인 - 게임 타이틀과 닉네임 */}
        <div className="flex justify-between items-center mb-3">
          <div className="text-[#00ff88] font-bold text-sm font-mono tracking-wider" 
               style={{textShadow: '0 0 8px rgba(0, 255, 136, 0.5)'}}>
            BAEDAL KING
          </div>
          <div className="text-white font-bold text-sm font-mono" 
               style={{textShadow: '1px 1px 2px rgba(0,0,0,0.8)'}}>
            {userNickname}
          </div>
        </div>
        
        {/* 메인 영역 - 플레이어 정보와 다이아 */}
        <div className="flex justify-between items-center">
          {/* 좌측 - 플레이어 카드 (클릭 가능) */}
          <button 
            onClick={onShowHeaderCharacterPanel}
            className="h-10 px-3 flex items-center justify-center text-xs bg-gradient-to-br from-[#1a1a2e]/80 to-[#16213e]/80 border-2 border-[#00d4ff]/40 hover:border-[#00d4ff]/70 transition-all duration-300 hover:scale-105 hover:shadow-lg relative group backdrop-blur-sm"
            style={{borderRadius: '6px'}}
          >
            <div className="flex items-center gap-2">
              <span className="text-[#00d4ff] text-[10px] leading-none font-bold" style={{textShadow: '0 0 6px rgba(0, 212, 255, 0.5)'}}>CHARACTER</span>
            </div>

            {/* 호버 글로우 */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#00d4ff]/0 via-[#00d4ff]/10 to-[#00d4ff]/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" 
                 style={{borderRadius: '6px'}}></div>
          </button>
          
          {/* 우측 - 박스 디스플레이 (클릭 불가) */}
          <div className="h-10 px-3 flex items-center justify-center text-xs bg-gradient-to-br from-[#1a1a2e]/80 to-[#16213e]/80 border-2 border-[#ffd93d]/40 backdrop-blur-sm"
            style={{borderRadius: '6px'}}
          >
            <div className="flex items-center gap-2">
              <span className="text-[#ffd93d]">📦</span>
              <span className="text-[#ffd93d] text-[10px] leading-none font-bold" style={{textShadow: '0 0 6px rgba(255, 217, 61, 0.5)'}}>{totalBoxes.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* 장식용 사이드 라인들 */}
        <div className="absolute left-2 top-1/2 -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-transparent via-[#00ff88]/30 to-transparent" 
             style={{borderRadius: '2px'}}></div>
        <div className="absolute right-2 top-1/2 -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-transparent via-[#ffd93d]/30 to-transparent" 
             style={{borderRadius: '2px'}}></div>
      </div>
      
      {/* 하단 네온 글로우 라인 */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#00ff88]/40 to-transparent"></div>
    </div>
  )
}

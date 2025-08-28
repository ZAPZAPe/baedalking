'use client'

import { useRouter } from 'next/navigation'

interface HeaderProps {
  userNickname: string
  totalPoints: number
  currentEmotion: string
  emotions: Array<{
    id: string
    label: string
    icon: string
    color: string
  }>
  onShowHeaderCharacterPanel: () => void
}

export default function Header({
  userNickname,
  totalPoints,
  currentEmotion,
  emotions,
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
            className="bg-gradient-to-br from-[#1a1a2e]/80 to-[#16213e]/80 border-2 border-[#00d4ff]/40 hover:border-[#00d4ff]/70 px-3 py-2 transition-all duration-300 hover:scale-105 hover:shadow-lg relative group backdrop-blur-sm"
            style={{borderRadius: '6px'}}
          >
            <div className="flex items-center gap-3">
              {/* 아바타 with 글로우 */}
              <div className="relative">
                <div className="w-8 h-8 bg-gradient-to-br from-[#00d4ff]/20 to-[#9c88ff]/20 border border-[#00d4ff]/50 flex items-center justify-center overflow-hidden" 
                     style={{borderRadius: '4px'}}>
                  <img 
                    src={`/assets/character/character-${currentEmotion}.png`}
                    alt="캐릭터" 
                    className="w-6 h-6 object-contain"
                    style={{ imageRendering: 'pixelated' }}
                  />
                </div>
                {/* 온라인 인디케이터 */}
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-[#00ff88] border border-[#0a0a23]" 
                     style={{borderRadius: '50%', boxShadow: '0 0 8px rgba(0, 255, 136, 0.6)'}}></div>
              </div>
              
              {/* 감정 정보만 */}
              <div className="text-left">
                <div className="text-[#00d4ff] text-sm font-mono" 
                     style={{textShadow: '0 0 4px rgba(0, 212, 255, 0.5)'}}>
                  {emotions.find(e => e.id === currentEmotion)?.label}
                </div>
              </div>
            </div>

            {/* 호버 글로우 */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#00d4ff]/0 via-[#00d4ff]/10 to-[#00d4ff]/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" 
                 style={{borderRadius: '6px'}}></div>
          </button>
          
          {/* 우측 - 다이아 포인트 디스플레이 (클릭 가능) */}
          <button
            onClick={() => router.push('/shop')}
            className="bg-gradient-to-br from-[#1a1a2e]/80 to-[#16213e]/80 border-2 border-[#ffd93d]/40 hover:border-[#ffd93d]/70 px-4 py-2 relative backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:shadow-lg group"
            style={{borderRadius: '6px'}}
          >
            <div className="flex items-center gap-2">
              {/* 픽셀 다이아 아이콘 */}
              <div className="relative">
                <div className="w-4 h-4 bg-gradient-to-br from-[#ffd93d] to-[#ff6b6b] transform rotate-45" 
                     style={{borderRadius: '2px', filter: 'drop-shadow(0 0 6px rgba(255, 217, 61, 0.5))'}}></div>
                <div className="absolute inset-1 bg-gradient-to-br from-[#fff] to-[#ffd93d] transform" 
                     style={{borderRadius: '1px'}}></div>
              </div>
              <span className="text-[#ffd93d] font-bold text-sm font-mono tracking-wide" 
                    style={{textShadow: '0 0 6px rgba(255, 217, 61, 0.5)'}}>
                {totalPoints.toLocaleString()}
              </span>
            </div>

            {/* 포인트 글로우 */}
            <div className="absolute -inset-1 bg-gradient-to-r from-[#ffd93d]/20 via-[#ffd93d]/10 to-[#ffd93d]/20 blur-sm -z-10" 
                 style={{borderRadius: '8px'}}></div>
            
            {/* 호버 글로우 */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#ffd93d]/0 via-[#ffd93d]/10 to-[#ffd93d]/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" 
                 style={{borderRadius: '6px'}}></div>
          </button>
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

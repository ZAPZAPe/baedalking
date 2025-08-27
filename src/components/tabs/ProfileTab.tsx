'use client'

interface ProfileTabProps {
  userNickname: string
  currentEmotion: string
  emotions: Array<{
    id: string
    label: string
    icon: string
    color: string
  }>
}

export default function ProfileTab({
  userNickname,
  currentEmotion,
  emotions
}: ProfileTabProps) {
  return (
    <div className="space-y-3 sm:space-y-4">
      {/* 헤더 */}
      <div className="bg-gradient-to-r from-[#9c88ff]/20 to-[#6366f1]/20 border border-[#9c88ff]/50 p-3 sm:p-4 relative"
           style={{borderRadius: '6px'}}>
        <div className="text-center">
          <h2 className="text-[#9c88ff] font-bold text-lg sm:text-xl font-mono tracking-wide mb-1" 
              style={{textShadow: '0 0 8px rgba(156, 136, 255, 0.5)'}}>
            👤 PROFILE
          </h2>
          <p className="text-gray-400 text-xs font-mono">나의 배달왕 프로필</p>
        </div>
        {/* 픽셀 도트들 */}
        <div className="absolute top-1 left-1 w-1 h-1 bg-[#9c88ff]" style={{borderRadius: '1px'}}></div>
        <div className="absolute top-1 right-1 w-1 h-1 bg-[#9c88ff]" style={{borderRadius: '1px'}}></div>
        <div className="absolute bottom-1 left-1 w-1 h-1 bg-[#9c88ff]" style={{borderRadius: '1px'}}></div>
        <div className="absolute bottom-1 right-1 w-1 h-1 bg-[#9c88ff]" style={{borderRadius: '1px'}}></div>
      </div>

      {/* 프로필 카드 */}
      <div className="bg-gradient-to-r from-[#00ff88]/20 to-[#00d4ff]/20 border border-[#00ff88]/50 p-4 relative"
           style={{borderRadius: '6px'}}>
        <div className="text-center mb-4">
          {/* 캐릭터 아바타 */}
          <div className="w-20 h-20 mx-auto mb-3 relative">
            <img 
              src={`/assets/character/character-${currentEmotion}.png`}
              alt="캐릭터"
              className="w-full h-full object-contain rounded-lg border-2 border-[#00ff88]/50"
              style={{ imageRendering: 'pixelated' }}
            />
          </div>
          
          {/* 기본 정보 */}
          <h3 className="text-[#00ff88] font-bold text-xl mb-1">{userNickname}</h3>
          <p className="text-gray-300 text-sm mb-2">
            {emotions.find(e => e.id === currentEmotion)?.label || '행복'}
          </p>
        </div>

        {/* 픽셀 도트들 */}
        <div className="absolute top-1 left-1 w-1 h-1 bg-[#00ff88]" style={{borderRadius: '1px'}}></div>
        <div className="absolute top-1 right-1 w-1 h-1 bg-[#00ff88]" style={{borderRadius: '1px'}}></div>
        <div className="absolute bottom-1 left-1 w-1 h-1 bg-[#00ff88]" style={{borderRadius: '1px'}}></div>
        <div className="absolute bottom-1 right-1 w-1 h-1 bg-[#00ff88]" style={{borderRadius: '1px'}}></div>
      </div>

      {/* 설정 */}
      <div className="bg-gradient-to-r from-[#6b73ff]/20 to-[#9c88ff]/20 border border-[#6b73ff]/50 p-3 sm:p-4 relative"
           style={{borderRadius: '6px'}}>
        <h3 className="text-[#6b73ff] font-bold text-sm sm:text-base font-mono tracking-wide mb-3" 
            style={{textShadow: '0 0 6px rgba(107, 115, 255, 0.5)'}}>
          ⚙️ 설정
        </h3>
        
        <div className="space-y-2">
          <button className="w-full bg-[#1a202c]/60 border border-[#6b73ff]/30 p-3 rounded text-left hover:bg-[#1a202c]/80 transition-all">
            <div className="text-white text-sm font-bold">닉네임 변경</div>
            <div className="text-gray-400 text-xs">현재: {userNickname}</div>
          </button>
          
          <button className="w-full bg-[#1a202c]/60 border border-[#6b73ff]/30 p-3 rounded text-left hover:bg-[#1a202c]/80 transition-all">
            <div className="text-white text-sm font-bold">알림 설정</div>
            <div className="text-gray-400 text-xs">푸시 알림 관리</div>
          </button>
          
          <button className="w-full bg-[#1a202c]/60 border border-[#6b73ff]/30 p-3 rounded text-left hover:bg-[#1a202c]/80 transition-all">
            <div className="text-white text-sm font-bold">데이터 내보내기</div>
            <div className="text-gray-400 text-xs">수입 기록 백업</div>
          </button>
        </div>

        {/* 픽셀 도트들 */}
        <div className="absolute top-1 left-1 w-1 h-1 bg-[#6b73ff]" style={{borderRadius: '1px'}}></div>
        <div className="absolute top-1 right-1 w-1 h-1 bg-[#6b73ff]" style={{borderRadius: '1px'}}></div>
        <div className="absolute bottom-1 left-1 w-1 h-1 bg-[#6b73ff]" style={{borderRadius: '1px'}}></div>
        <div className="absolute bottom-1 right-1 w-1 h-1 bg-[#6b73ff]" style={{borderRadius: '1px'}}></div>
      </div>
    </div>
  )
}
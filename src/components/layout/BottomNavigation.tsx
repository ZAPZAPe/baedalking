'use client'

interface BottomNavigationProps {
  activeTab: string
  onTabChange: (tab: string) => void
  isVerified: boolean
}

export default function BottomNavigation({ 
  activeTab, 
  onTabChange, 
  isVerified 
}: BottomNavigationProps) {
  return (
    <div 
      className="fixed bottom-0 left-0 right-0 z-10 bg-gradient-to-r from-[#1a202c] to-[#2d3748] border-t-2 border-gray-600/50"
      style={{
        fontFamily: 'monospace',
        imageRendering: 'pixelated'
      }}
    >
      <div className="max-w-md mx-auto p-2 relative">
        <div className="grid grid-cols-5 gap-1">
          {/* 홈 */}
          <button
            onClick={() => onTabChange('home')}
            className={`py-2 px-2 border-2 transition-all duration-200 relative ${
              activeTab === 'home'
                ? 'bg-gradient-to-r from-[#2d3748] to-[#1a202c] border-[#00ff88]/60 text-[#00ff88]'
                : 'bg-gradient-to-r from-[#1a202c] to-[#2d3748] border-gray-600/30 text-gray-300 hover:border-gray-500'
            }`}
            style={{borderRadius: '4px'}}
          >
            <div className="text-center">
              {/* 픽셀 집 아이콘 */}
              <div className="flex justify-center mb-1">
                <div className="relative">
                  {/* 지붕 */}
                  <div className={`w-1 h-1 mx-auto mb-0.5 ${activeTab === 'home' ? 'bg-[#00ff88]' : 'bg-gray-300'}`} style={{borderRadius: '1px'}}></div>
                  <div className={`w-3 h-1 mx-auto mb-0.5 ${activeTab === 'home' ? 'bg-[#00ff88]' : 'bg-gray-300'}`} style={{borderRadius: '1px'}}></div>
                  {/* 벽 */}
                  <div className={`w-3 h-2 mx-auto border ${activeTab === 'home' ? 'border-[#00ff88] bg-[#00ff88]/20' : 'border-gray-300 bg-gray-300/20'}`} style={{borderRadius: '1px'}}>
                    {/* 문 */}
                    <div className={`w-1 h-1 mx-auto mt-0.5 ${activeTab === 'home' ? 'bg-[#00ff88]' : 'bg-gray-300'}`} style={{borderRadius: '1px'}}></div>
                  </div>
                </div>
              </div>
              <div className="text-xs font-mono font-bold">HOME</div>
            </div>
            {/* 픽셀 도트들 */}
            <div className={`absolute top-0.5 left-0.5 w-1 h-1 ${activeTab === 'home' ? 'bg-[#00ff88]/60' : 'bg-gray-600/50'}`} style={{borderRadius: '1px'}}></div>
            <div className={`absolute top-0.5 right-0.5 w-1 h-1 ${activeTab === 'home' ? 'bg-[#00ff88]/60' : 'bg-gray-600/50'}`} style={{borderRadius: '1px'}}></div>
            <div className={`absolute bottom-0.5 left-0.5 w-1 h-1 ${activeTab === 'home' ? 'bg-[#00ff88]/60' : 'bg-gray-600/50'}`} style={{borderRadius: '1px'}}></div>
            <div className={`absolute bottom-0.5 right-0.5 w-1 h-1 ${activeTab === 'home' ? 'bg-[#00ff88]/60' : 'bg-gray-600/50'}`} style={{borderRadius: '1px'}}></div>
          </button>

          {/* 수입관리 */}
          <button
            onClick={() => onTabChange('income')}
            className={`py-2 px-2 border-2 transition-all duration-200 relative ${
              activeTab === 'income'
                ? 'bg-gradient-to-r from-[#2d3748] to-[#1a202c] border-[#00d4ff]/60 text-[#00d4ff]'
                : 'bg-gradient-to-r from-[#1a202c] to-[#2d3748] border-gray-600/30 text-gray-300 hover:border-gray-500'
            }`}
            style={{borderRadius: '4px'}}
          >
            <div className="text-center">
              {/* 픽셀 동전 스택 아이콘 */}
              <div className="flex justify-center mb-1">
                <div className="relative">
                  {/* 동전 스택 */}
                  <div className="flex items-end gap-0.5">
                    <div className={`w-1 h-2 ${activeTab === 'income' ? 'bg-[#00d4ff]' : 'bg-gray-300'}`} style={{borderRadius: '1px'}}></div>
                    <div className={`w-1 h-3 ${activeTab === 'income' ? 'bg-[#00d4ff]' : 'bg-gray-300'}`} style={{borderRadius: '1px'}}></div>
                    <div className={`w-1 h-1 ${activeTab === 'income' ? 'bg-[#00d4ff]' : 'bg-gray-300'}`} style={{borderRadius: '1px'}}></div>
                  </div>
                </div>
              </div>
              <div className="text-xs font-mono font-bold">INCOME</div>
            </div>
            {/* 픽셀 도트들 */}
            <div className={`absolute top-0.5 left-0.5 w-1 h-1 ${activeTab === 'income' ? 'bg-[#00d4ff]/60' : 'bg-gray-600/50'}`} style={{borderRadius: '1px'}}></div>
            <div className={`absolute top-0.5 right-0.5 w-1 h-1 ${activeTab === 'income' ? 'bg-[#00d4ff]/60' : 'bg-gray-600/50'}`} style={{borderRadius: '1px'}}></div>
            <div className={`absolute bottom-0.5 left-0.5 w-1 h-1 ${activeTab === 'income' ? 'bg-[#00d4ff]/60' : 'bg-gray-600/50'}`} style={{borderRadius: '1px'}}></div>
            <div className={`absolute bottom-0.5 right-0.5 w-1 h-1 ${activeTab === 'income' ? 'bg-[#00d4ff]/60' : 'bg-gray-600/50'}`} style={{borderRadius: '1px'}}></div>
          </button>

          {/* 랭킹 */}
          <button
            onClick={() => {
              if (isVerified) {
                onTabChange('ranking')
              } else {
                alert('랭킹을 보려면 먼저 오늘의 수입을 사진으로 인증해주세요!')
              }
            }}
            className={`py-2 px-2 border-2 transition-all duration-200 relative ${
              activeTab === 'ranking'
                ? 'bg-gradient-to-r from-[#2d3748] to-[#1a202c] border-[#ffd93d]/60 text-[#ffd93d]'
                : isVerified
                  ? 'bg-gradient-to-r from-[#1a202c] to-[#2d3748] border-gray-600/30 text-gray-300 hover:border-gray-500'
                  : 'bg-gradient-to-r from-[#1a1a1a] to-[#2a2a2a] border-gray-600/20 text-gray-500 cursor-not-allowed opacity-60'
            }`}
            style={{borderRadius: '4px'}}
            disabled={!isVerified}
          >
            <div className="text-center">
              {/* 픽셀 트로피 아이콘 */}
              <div className="flex justify-center mb-1">
                <div className="relative">
                  {/* 트로피 */}
                  <div className="flex flex-col items-center">
                    {/* 컵 상단 */}
                    <div className={`w-3 h-1 ${activeTab === 'ranking' ? 'bg-[#ffd93d]' : isVerified ? 'bg-gray-300' : 'bg-gray-500'}`} style={{borderRadius: '1px'}}></div>
                    {/* 컵 몸체 */}
                    <div className={`w-2 h-2 border ${activeTab === 'ranking' ? 'border-[#ffd93d] bg-[#ffd93d]/20' : isVerified ? 'border-gray-300 bg-gray-300/20' : 'border-gray-500 bg-gray-500/20'}`} style={{borderRadius: '1px'}}></div>
                    {/* 받침 */}
                    <div className={`w-3 h-1 ${activeTab === 'ranking' ? 'bg-[#ffd93d]' : isVerified ? 'bg-gray-300' : 'bg-gray-500'}`} style={{borderRadius: '1px'}}></div>
                  </div>
                </div>
              </div>
              <div className="text-xs font-mono font-bold">RANKING</div>
            </div>
            {/* 픽셀 도트들 */}
            <div className={`absolute top-0.5 left-0.5 w-1 h-1 ${activeTab === 'ranking' ? 'bg-[#ffd93d]/60' : isVerified ? 'bg-gray-600/50' : 'bg-gray-700/30'}`} style={{borderRadius: '1px'}}></div>
            <div className={`absolute top-0.5 right-0.5 w-1 h-1 ${activeTab === 'ranking' ? 'bg-[#ffd93d]/60' : isVerified ? 'bg-gray-600/50' : 'bg-gray-700/30'}`} style={{borderRadius: '1px'}}></div>
            <div className={`absolute bottom-0.5 left-0.5 w-1 h-1 ${activeTab === 'ranking' ? 'bg-[#ffd93d]/60' : isVerified ? 'bg-gray-600/50' : 'bg-gray-700/30'}`} style={{borderRadius: '1px'}}></div>
            <div className={`absolute bottom-0.5 right-0.5 w-1 h-1 ${activeTab === 'ranking' ? 'bg-[#ffd93d]/60' : isVerified ? 'bg-gray-600/50' : 'bg-gray-700/30'}`} style={{borderRadius: '1px'}}></div>
          </button>

          {/* 친구 */}
          <button
            onClick={() => onTabChange('friends')}
            className={`py-2 px-2 border-2 transition-all duration-200 relative ${
              activeTab === 'friends'
                ? 'bg-gradient-to-r from-[#2d3748] to-[#1a202c] border-[#9c88ff]/60 text-[#9c88ff]'
                : 'bg-gradient-to-r from-[#1a202c] to-[#2d3748] border-gray-600/30 text-gray-300 hover:border-gray-500'
            }`}
            style={{borderRadius: '4px'}}
          >
            <div className="text-center">
              {/* 픽셀 사람들 아이콘 */}
              <div className="flex justify-center mb-1">
                <div className="relative">
                  {/* 사람들 실루엣 */}
                  <div className="flex items-end gap-1">
                    {/* 첫 번째 사람 */}
                    <div className="flex flex-col items-center">
                      <div className={`w-1.5 h-1.5 rounded-full ${activeTab === 'friends' ? 'bg-[#9c88ff]' : 'bg-gray-300'}`} style={{borderRadius: '1px'}}></div>
                      <div className={`w-2 h-1.5 ${activeTab === 'friends' ? 'bg-[#9c88ff]' : 'bg-gray-300'}`} style={{borderRadius: '1px'}}></div>
                    </div>
                    {/* 두 번째 사람 */}
                    <div className="flex flex-col items-center">
                      <div className={`w-1.5 h-1.5 rounded-full ${activeTab === 'friends' ? 'bg-[#9c88ff]' : 'bg-gray-300'}`} style={{borderRadius: '1px'}}></div>
                      <div className={`w-2 h-1.5 ${activeTab === 'friends' ? 'bg-[#9c88ff]' : 'bg-gray-300'}`} style={{borderRadius: '1px'}}></div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="text-xs font-mono font-bold">FRIENDS</div>
            </div>
            {/* 픽셀 도트들 */}
            <div className={`absolute top-0.5 left-0.5 w-1 h-1 ${activeTab === 'friends' ? 'bg-[#9c88ff]/60' : 'bg-gray-600/50'}`} style={{borderRadius: '1px'}}></div>
            <div className={`absolute top-0.5 right-0.5 w-1 h-1 ${activeTab === 'friends' ? 'bg-[#9c88ff]/60' : 'bg-gray-600/50'}`} style={{borderRadius: '1px'}}></div>
            <div className={`absolute bottom-0.5 left-0.5 w-1 h-1 ${activeTab === 'friends' ? 'bg-[#9c88ff]/60' : 'bg-gray-600/50'}`} style={{borderRadius: '1px'}}></div>
            <div className={`absolute bottom-0.5 right-0.5 w-1 h-1 ${activeTab === 'friends' ? 'bg-[#9c88ff]/60' : 'bg-gray-600/50'}`} style={{borderRadius: '1px'}}></div>
          </button>

          {/* 프로필 */}
          <button
            onClick={() => onTabChange('profile')}
            className={`py-2 px-2 border-2 transition-all duration-200 relative ${
              activeTab === 'profile'
                ? 'bg-gradient-to-r from-[#2d3748] to-[#1a202c] border-[#ff6b6b]/60 text-[#ff6b6b]'
                : 'bg-gradient-to-r from-[#1a202c] to-[#2d3748] border-gray-600/30 text-gray-300 hover:border-gray-500'
            }`}
            style={{borderRadius: '4px'}}
          >
            <div className="text-center">
              {/* 픽셀 사람 실루엣 아이콘 */}
              <div className="flex justify-center mb-1">
                <div className="relative">
                  {/* 사람 실루엣 */}
                  <div className="flex flex-col items-center">
                    {/* 머리 */}
                    <div className={`w-2 h-2 rounded-full ${activeTab === 'profile' ? 'bg-[#ff6b6b]' : 'bg-gray-300'}`} style={{borderRadius: '1px'}}></div>
                    {/* 몸 */}
                    <div className={`w-3 h-2 ${activeTab === 'profile' ? 'bg-[#ff6b6b]' : 'bg-gray-300'}`} style={{borderRadius: '1px'}}></div>
                  </div>
                </div>
              </div>
              <div className="text-xs font-mono font-bold">PROFILE</div>
            </div>
            {/* 픽셀 도트들 */}
            <div className={`absolute top-0.5 left-0.5 w-1 h-1 ${activeTab === 'profile' ? 'bg-[#ff6b6b]/60' : 'bg-gray-600/50'}`} style={{borderRadius: '1px'}}></div>
            <div className={`absolute top-0.5 right-0.5 w-1 h-1 ${activeTab === 'profile' ? 'bg-[#ff6b6b]/60' : 'bg-gray-600/50'}`} style={{borderRadius: '1px'}}></div>
            <div className={`absolute bottom-0.5 left-0.5 w-1 h-1 ${activeTab === 'profile' ? 'bg-[#ff6b6b]/60' : 'bg-gray-600/50'}`} style={{borderRadius: '1px'}}></div>
            <div className={`absolute bottom-0.5 right-0.5 w-1 h-1 ${activeTab === 'profile' ? 'bg-[#ff6b6b]/60' : 'bg-gray-600/50'}`} style={{borderRadius: '1px'}}></div>
          </button>
        </div>

        {/* 하단바 전체 픽셀 도트들 */}
        <div className="absolute top-1 left-1 w-1 h-1 bg-gray-600/30" style={{borderRadius: '1px'}}></div>
        <div className="absolute top-1 right-1 w-1 h-1 bg-gray-600/30" style={{borderRadius: '1px'}}></div>
        <div className="absolute bottom-1 left-1 w-1 h-1 bg-gray-600/30" style={{borderRadius: '1px'}}></div>
        <div className="absolute bottom-1 right-1 w-1 h-1 bg-gray-600/30" style={{borderRadius: '1px'}}></div>
      </div>
    </div>
  )
}

import React from 'react'

interface RankingDetailModalProps {
  isOpen: boolean
  onClose: () => void
  userRank: number
  userIncome: number
  totalUsers: number
  topRankers: Array<{
    id: string
    rank: number
    income: number
    count: number
    platform: string
    nickname: string
    region: string
    platforms: string[]
  }>
}

export default function RankingDetailModal({
  isOpen,
  onClose,
  userRank,
  userIncome,
  totalUsers,
  topRankers
}: RankingDetailModalProps) {
  if (!isOpen) return null

  const rankPercentage = totalUsers > 0 ? ((totalUsers - userRank + 1) / totalUsers) * 100 : 0

  return (
    <>
      {/* 전체 화면을 덮는 블랙 배경 */}
      <div 
        className="fixed inset-0 z-[999999] bg-black"
        onClick={onClose}
      />
      
      {/* 모달 컨테이너 */}
      <div className="fixed inset-0 z-[999999] flex items-center justify-center p-2 sm:p-4 overflow-y-auto pointer-events-none">
        <div 
          className="w-full max-w-md bg-gradient-to-b from-[#0a0a23] via-[#16213e] to-[#1a1a2e] border-2 sm:border-4 border-[#00d4ff]/50 shadow-2xl relative max-h-[calc(100vh-32px)] overflow-y-auto pointer-events-auto"
          style={{
            borderRadius: '6px',
            fontFamily: 'monospace',
            imageRendering: 'pixelated',
            boxShadow: '0 0 20px rgba(0, 212, 255, 0.3), inset 0 0 15px rgba(0, 212, 255, 0.1)'
          }}
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
          }}
          onTouchStart={(e) => e.stopPropagation()}
          onTouchEnd={(e) => e.stopPropagation()}
        >
          
          {/* 네온 글로우 테두리 */}
          <div className="absolute -inset-1 bg-gradient-to-r from-[#00d4ff]/20 via-[#9c88ff]/20 to-[#00d4ff]/20 blur-sm -z-10" 
               style={{borderRadius: '12px'}}></div>
          
          {/* 헤더 */}
          <div className="bg-gradient-to-r from-[#0a0a23] to-[#16213e] p-3 sm:p-4 border-b-2 border-[#00d4ff]/30 relative">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2 sm:gap-3">
                {/* 픽셀 아이콘 */}
                <div className="w-5 h-5 sm:w-6 sm:h-6 bg-gradient-to-br from-[#00d4ff] to-[#9c88ff] border border-[#00d4ff]" 
                     style={{borderRadius: '3px'}}>
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="w-2 h-2 sm:w-3 sm:h-3 bg-white" style={{borderRadius: '1px'}}></div>
                  </div>
                </div>
                <h3 className="text-[#00d4ff] font-bold text-sm sm:text-lg font-mono tracking-wide" 
                    style={{textShadow: '0 0 8px rgba(0, 212, 255, 0.5)'}}>
                  RANKING DETAIL
                </h3>
              </div>
              <button
                onClick={onClose}
                className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-br from-[#9c88ff]/20 to-[#ff6b6b]/20 border border-[#9c88ff]/50 hover:border-[#9c88ff] text-[#9c88ff] hover:text-white font-bold transition-all duration-200 hover:scale-110 text-sm sm:text-base"
                style={{borderRadius: '4px'}}
              >
                ✕
              </button>
            </div>
          </div>

          <div className="p-3 sm:p-4 space-y-4">

            {/* 내 현재 순위 상태 */}
            <div className="bg-gradient-to-r from-[#00d4ff]/20 to-[#9c88ff]/20 border border-[#00d4ff]/50 p-3 relative"
                 style={{borderRadius: '4px'}}>
              <h5 className="text-[#00d4ff] text-center font-bold text-sm font-mono tracking-wide mb-3" 
                  style={{textShadow: '0 0 6px rgba(0, 212, 255, 0.5)'}}>
                MY RANKING STATUS
              </h5>
              <div className="space-y-3">
                {/* 현재 순위 */}
                <div className="text-center">
                  <div className="text-white text-xs font-mono mb-1">현재 순위</div>
                  <div className="text-[#00d4ff] font-bold text-lg font-mono">
                    {userRank}위
                  </div>
                </div>
                
                {/* 현재 수익 */}
                <div className="text-center">
                  <div className="text-white text-xs font-mono mb-1">현재 수익</div>
                  <div className="text-[#00d4ff] font-bold text-lg font-mono">
                    ₩{userIncome.toLocaleString()}
                  </div>
                </div>
                
                {/* 상위 퍼센티지 */}
                <div className="space-y-2">
                  <div className="text-white text-xs font-mono text-center">상위 퍼센티지</div>
                  <div className="bg-[#1a202c] h-3 rounded-full overflow-hidden border border-[#00d4ff]/30">
                    <div 
                      className="h-full bg-gradient-to-r from-[#00d4ff] to-[#9c88ff] transition-all duration-500"
                      style={{width: `${rankPercentage}%`}}
                    ></div>
                  </div>
                  <div className="text-[#00d4ff] text-xs font-mono text-center">
                    상위 {rankPercentage.toFixed(1)}%
                  </div>
                </div>
              </div>
              
              {/* 모서리 픽셀 도트 */}
              <div className="absolute top-1 left-1 w-1 h-1 bg-[#00d4ff]" style={{borderRadius: '1px'}}></div>
              <div className="absolute top-1 right-1 w-1 h-1 bg-[#00d4ff]" style={{borderRadius: '1px'}}></div>
              <div className="absolute bottom-1 left-1 w-1 h-1 bg-[#00d4ff]" style={{borderRadius: '1px'}}></div>
              <div className="absolute bottom-1 right-1 w-1 h-1 bg-[#00d4ff]" style={{borderRadius: '1px'}}></div>
            </div>

            {/* 내 주변 랭킹 */}
            <div className="bg-gradient-to-br from-[#1a202c] to-[#2d3748] border-2 border-[#00d4ff]/50 p-3 relative"
                 style={{borderRadius: '8px'}}>
              
              {/* 헤더 */}
              <div className="flex items-center justify-center mb-3">
                <h5 className="text-[#00d4ff] font-bold text-sm font-mono tracking-wide" 
                    style={{textShadow: '0 0 8px rgba(0, 212, 255, 0.5)'}}>
                  내 주변 랭킹
                </h5>
              </div>
              
              {/* 내 주변 랭커들 목록 (위 2명, 나, 아래 2명) */}
              <div className="space-y-2">
                {(() => {
                  // 내 주변 랭커들 생성 (위 2명, 나, 아래 2명)
                  const myRankingList = [];
                  
                  // 위 2명
                  for (let i = Math.max(1, userRank - 2); i < userRank; i++) {
                    myRankingList.push({
                      id: `rank-${i}`,
                      rank: i,
                      income: Math.floor(Math.random() * 50000) + userIncome + (userRank - i) * 10000,
                      count: Math.floor(Math.random() * 20) + 15,
                      nickname: `배달러${i}호`,
                      region: '서울',
                      platforms: ['배민']
                    });
                  }
                  
                  // 나
                  myRankingList.push({
                    id: 'me',
                    rank: userRank,
                    income: userIncome,
                    count: Math.floor(Math.random() * 20) + 10,
                    nickname: '나',
                    region: '내 지역',
                    platforms: ['배민']
                  });
                  
                  // 아래 2명
                  for (let i = userRank + 1; i <= Math.min(1000, userRank + 2); i++) {
                    myRankingList.push({
                      id: `rank-${i}`,
                      rank: i,
                      income: Math.floor(Math.random() * 30000) + userIncome - (i - userRank) * 8000,
                      count: Math.floor(Math.random() * 15) + 10,
                      nickname: `배달러${i}호`,
                      region: '서울',
                      platforms: ['배민']
                    });
                  }
                  
                  return myRankingList;
                })().map((ranker, index) => {
                  const incomeDifference = ranker.income - userIncome
                  const isHigher = incomeDifference > 0
                  const isMe = ranker.id === 'me'
                  
                  return (
                    <div 
                      key={ranker.id} 
                      className={`border p-2 rounded-lg relative ${
                        isMe 
                          ? 'bg-[#ffd93d]/10 border-[#ffd93d] shadow-lg shadow-[#ffd93d]/20' 
                          : 'bg-[#1a202c]/60 border-[#00d4ff]/30'
                      }`}
                      style={{borderRadius: '4px'}}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {/* 순위 배지 */}
                          <div className={`w-6 h-6 border-2 flex items-center justify-center font-bold text-xs font-mono rounded-full ${
                            ranker.rank === 1 ? 'bg-[#ffd93d] text-black border-[#ffd93d]' :
                            ranker.rank === 2 ? 'bg-[#c0c0c0] text-black border-[#c0c0c0]' :
                            ranker.rank === 3 ? 'bg-[#cd7f32] text-white border-[#cd7f32]' :
                            isMe ? 'bg-[#ffd93d] text-black border-[#ffd93d]' :
                            'bg-[#4a5568] text-white border-[#4a5568]'
                          }`}>
                            {ranker.rank}
                          </div>
                          
                          {/* 랭커 정보 */}
                          <div>
                            <div className={`text-xs font-mono font-bold ${
                              isMe ? 'text-[#ffd93d]' : 'text-white'
                            }`}>
                              {ranker.nickname}
                            </div>
                            <div className="text-[#00d4ff] text-xs font-mono">
                              ₩{ranker.income.toLocaleString()}
                            </div>
                          </div>
                        </div>
                        
                        {/* 수익 차이 (나는 표시하지 않음) */}
                        {!isMe && (
                          <div className={`text-xs font-mono font-bold ${
                            isHigher ? 'text-[#ff6b6b]' : 'text-[#00ff88]'
                          }`}>
                            {isHigher ? '+' : ''}₩{Math.abs(incomeDifference).toLocaleString()}
                          </div>
                        )}
                      </div>
                      
                      {/* 모서리 픽셀 도트 */}
                      <div className={`absolute top-0.5 left-0.5 w-0.5 h-0.5 ${isMe ? 'bg-[#ffd93d]' : 'bg-[#00d4ff]'}`} style={{borderRadius: '1px'}}></div>
                      <div className={`absolute top-0.5 right-0.5 w-0.5 h-0.5 ${isMe ? 'bg-[#ffd93d]' : 'bg-[#00d4ff]'}`} style={{borderRadius: '1px'}}></div>
                      <div className={`absolute bottom-0.5 left-0.5 w-0.5 h-0.5 ${isMe ? 'bg-[#ffd93d]' : 'bg-[#00d4ff]'}`} style={{borderRadius: '1px'}}></div>
                      <div className={`absolute bottom-0.5 right-0.5 w-0.5 h-0.5 ${isMe ? 'bg-[#ffd93d]' : 'bg-[#00d4ff]'}`} style={{borderRadius: '1px'}}></div>
                    </div>
                  )
                })}
              </div>
              
              {/* 모서리 픽셀 도트 */}
              <div className="absolute top-1 left-1 w-1 h-1 bg-[#00d4ff]" style={{borderRadius: '1px'}}></div>
              <div className="absolute top-1 right-1 w-1 h-1 bg-[#00d4ff]" style={{borderRadius: '1px'}}></div>
              <div className="absolute bottom-1 left-1 w-1 h-1 bg-[#00d4ff]" style={{borderRadius: '1px'}}></div>
              <div className="absolute bottom-1 right-1 w-1 h-1 bg-[#00d4ff]" style={{borderRadius: '1px'}}></div>
            </div>

            {/* 닫기 버튼 */}
            <button
              onClick={onClose}
              className="w-full bg-gradient-to-r from-[#00d4ff]/20 to-[#9c88ff]/20 border-2 border-[#00d4ff]/50 hover:border-[#00d4ff] text-[#00d4ff] hover:text-white font-bold py-3 transition-all duration-300 hover:scale-105 hover:shadow-lg relative font-mono tracking-wide"
              style={{
                borderRadius: '6px',
                textShadow: '0 0 6px rgba(0, 212, 255, 0.5)',
                boxShadow: '0 0 15px rgba(0, 212, 255, 0.2)'
              }}
            >
              <div className="flex items-center justify-center gap-2">
                <div className="w-2.5 h-2.5 bg-[#00d4ff] border border-white" style={{borderRadius: '1px'}}></div>
                <span className="text-sm">CLOSE</span>
                <div className="w-2.5 h-2.5 bg-[#00d4ff] border border-white" style={{borderRadius: '1px'}}></div>
              </div>
              
              {/* 버튼 모서리 픽셀 도트 */}
              <div className="absolute top-1 left-1 w-1 h-1 bg-[#00d4ff]" style={{borderRadius: '1px'}}></div>
              <div className="absolute top-1 right-1 w-1 h-1 bg-[#00d4ff]" style={{borderRadius: '1px'}}></div>
              <div className="absolute bottom-1 left-1 w-1 h-1 bg-[#00d4ff]" style={{borderRadius: '1px'}}></div>
              <div className="absolute bottom-1 right-1 w-1 h-1 bg-[#00d4ff]" style={{borderRadius: '1px'}}></div>
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

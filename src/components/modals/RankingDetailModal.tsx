import React from 'react'
import PixelModal from '@/components/ui/PixelModal'
import PixelButton from '@/components/ui/PixelButton'
import PixelCard from '@/components/ui/PixelCard'

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
  onShowUserDetail: (user: any) => void
}

export default function RankingDetailModal({
  isOpen,
  onClose,
  userRank,
  userIncome,
  totalUsers,
  topRankers,
  onShowUserDetail
}: RankingDetailModalProps) {
  if (!isOpen) return null

  const getRankColor = (rank: number) => {
    if (rank === 1) return '#ffd93d' // 금색
    if (rank === 2) return '#c0c0c0' // 은색
    if (rank === 3) return '#cd7f32' // 동색
    return '#9c88ff' // 보라색
  }

  // 내 위아래 2명씩 포함해서 총 5명의 랭킹 생성 (데이터가 없을 때만 사용)
  const generateContextRanking = () => {
    // 실제 데이터가 있으면 빈 배열 반환
    if (topRankers.length > 0) {
      return []
    }
    
    const contextRankers = []
    
    // 내 위 2명
    for (let i = 2; i > 0; i--) {
      const rank = userRank - i
      if (rank > 0) {
        contextRankers.push({
          id: `above-${i}`,
          rank: rank,
          income: userIncome + (i * 50000) + Math.floor(Math.random() * 20000),
          count: Math.floor(15 + Math.random() * 10),
          platform: 'baemin',
          nickname: `배달러${rank}호`,
          region: '서울특별시',
          platforms: ['baemin', 'coupang']
        })
      }
    }
    
    // 나
    contextRankers.push({
      id: 'me',
      rank: userRank,
      income: userIncome,
      count: Math.floor(10 + Math.random() * 10),
      platform: 'baemin',
      nickname: '나',
      region: '서울특별시',
      platforms: ['baemin']
    })
    
    // 내 아래 2명
    for (let i = 1; i <= 2; i++) {
      const rank = userRank + i
      if (rank <= totalUsers) {
        contextRankers.push({
          id: `below-${i}`,
          rank: rank,
          income: Math.max(0, userIncome - (i * 30000) - Math.floor(Math.random() * 15000)),
          count: Math.floor(8 + Math.random() * 8),
          platform: 'coupang',
          nickname: `배달러${rank}호`,
          region: '서울특별시',
          platforms: ['coupang']
        })
      }
    }
    
    return contextRankers
  }

  const contextRankers = generateContextRanking()
  const displayRankers = topRankers.length > 0 ? topRankers : contextRankers

  return (
    <PixelModal
      isOpen={isOpen}
      onClose={onClose}
      title="RANKING DETAIL"
      maxWidth="lg"
    >
      <div className="space-y-6">
        {/* 내 순위 정보 */}
        <PixelCard title="MY RANKING" variant="primary">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[#1a202c]/50 p-3 rounded-lg text-center border"
                 style={{borderColor: '#ffd93d30', borderRadius: '4px'}}>
              <div className="text-white text-xs font-mono font-bold mb-1">내 순위</div>
              <div className="text-lg font-bold font-mono text-[#ffd93d]">
                {userRank}위
              </div>
            </div>
            
            <div className="bg-[#1a202c]/50 p-3 rounded-lg text-center border"
                 style={{borderColor: '#00d4ff30', borderRadius: '4px'}}>
              <div className="text-white text-xs font-mono font-bold mb-1">내 수입</div>
              <div className="text-lg font-bold font-mono text-[#00d4ff]">
                ₩{userIncome.toLocaleString()}
              </div>
            </div>
          </div>
        </PixelCard>

        {/* 주변 랭킹 목록 */}
        <PixelCard title="주변 랭킹" variant="secondary">
          <div className="space-y-1">
            {displayRankers.length > 0 ? (
              displayRankers.map((ranker) => (
                <div 
                  key={ranker.id}
                  className={`bg-[#1a202c]/50 p-2 rounded-lg border cursor-pointer hover:bg-[#1a202c]/70 transition-all ${
                    ranker.id === 'me' ? 'border-[#00ff88] border-2' : ''
                  }`}
                  style={{
                    borderColor: ranker.id === 'me' ? '#00ff88' : `${getRankColor(ranker.rank)}30`, 
                    borderRadius: '4px'
                  }}
                  onClick={() => onShowUserDetail(ranker)}
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      {/* 사용자 정보 */}
                      <div>
                        <div className="text-white font-bold text-sm font-mono">
                          {ranker.nickname}
                        </div>
                        <div className="text-gray-400 text-xs font-mono">
                          {ranker.region.split(' ').slice(0, 2).join(' ')} • 
                          <span className="inline-flex gap-1 ml-1">
                            {ranker.platforms.map((p, index) => (
                              <span 
                                key={index}
                                className={`px-1.5 py-0.5 rounded text-xs font-mono font-bold border ${
                                  p === 'baemin' 
                                    ? 'bg-[#00ff88]/20 text-[#00ff88] border-[#00ff88]/50' 
                                    : p === 'coupang'
                                    ? 'bg-[#ffd93d]/20 text-[#ffd93d] border-[#ffd93d]/50'
                                    : 'bg-[#9c88ff]/20 text-[#9c88ff] border-[#9c88ff]/50'
                                }`}
                              >
                                {p === 'baemin' ? '배민' : p === 'coupang' ? '쿠팡' : p}
                              </span>
                            ))}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {/* 수입 */}
                    <div className="text-right">
                      <div className="text-white font-bold text-sm font-mono">
                        ₩{(ranker.income || 0).toLocaleString()}
                      </div>
                      
                      {/* 건수 */}
                      <div className="text-gray-400 text-xs font-mono mt-1">
                        {ranker.count}건
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center text-gray-400 py-8 font-mono">
                랭킹 데이터가 없습니다.
              </div>
            )}
          </div>
        </PixelCard>

        {/* 닫기 버튼 */}
        <PixelButton
          variant="primary"
          fullWidth
          onClick={onClose}
        >
          CLOSE
        </PixelButton>
      </div>
    </PixelModal>
  )
}
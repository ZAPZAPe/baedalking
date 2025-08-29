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

  return (
    <PixelModal
      isOpen={isOpen}
      onClose={onClose}
      title="RANKING DETAIL"
      maxWidth="lg"
    >
      {/* 내 순위 정보 */}
      <PixelCard title="MY RANKING" variant="primary">
        <div className="grid grid-cols-3 gap-3">
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
            <div className="text-sm font-bold font-mono text-[#00d4ff]">
              ₩{userIncome.toLocaleString()}
            </div>
          </div>
          
          <div className="bg-[#1a202c]/50 p-3 rounded-lg text-center border"
               style={{borderColor: '#9c88ff30', borderRadius: '4px'}}>
            <div className="text-white text-xs font-mono font-bold mb-1">전체</div>
            <div className="text-sm font-bold font-mono text-[#9c88ff]">
              {totalUsers}명
            </div>
          </div>
        </div>
      </PixelCard>

      {/* 상위 랭커 목록 */}
      <PixelCard title="TOP RANKERS" variant="secondary">
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {topRankers.map((ranker) => (
            <div 
              key={ranker.id}
              className="bg-[#1a202c]/50 p-3 rounded-lg border cursor-pointer hover:bg-[#1a202c]/70 transition-all"
              style={{borderColor: `${getRankColor(ranker.rank)}30`, borderRadius: '4px'}}
              onClick={() => onShowUserDetail(ranker)}
            >
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  {/* 순위 */}
                  <div 
                    className="w-8 h-8 flex items-center justify-center rounded font-bold text-sm"
                    style={{
                      backgroundColor: `${getRankColor(ranker.rank)}20`,
                      color: getRankColor(ranker.rank),
                      border: `1px solid ${getRankColor(ranker.rank)}50`
                    }}
                  >
                    {ranker.rank}
                  </div>
                  
                  {/* 사용자 정보 */}
                  <div>
                    <div className="text-white font-bold text-sm font-mono">
                      {ranker.nickname}
                    </div>
                    <div className="text-gray-400 text-xs font-mono">
                      {ranker.region} • {ranker.count}건
                    </div>
                  </div>
                </div>
                
                {/* 수입 */}
                <div className="text-right">
                  <div className="text-white font-bold text-sm font-mono">
                    ₩{ranker.income.toLocaleString()}
                  </div>
                  
                  {/* 플랫폼 */}
                  <div className="flex gap-1 justify-end mt-1">
                    {ranker.platforms.map((platform, index) => (
                      <div 
                        key={index}
                        className={`px-1.5 py-0.5 rounded text-xs font-mono font-bold ${
                          platform === 'baemin' 
                            ? 'bg-[#00ff88]/20 text-[#00ff88]' 
                            : platform === 'coupang'
                            ? 'bg-[#ff6b6b]/20 text-[#ff6b6b]'
                            : 'bg-[#9c88ff]/20 text-[#9c88ff]'
                        }`}
                      >
                        {platform === 'baemin' ? '배민' : platform === 'coupang' ? '쿠팡' : platform}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {topRankers.length === 0 && (
          <div className="text-center text-gray-400 py-8 font-mono">
            랭킹 데이터가 없습니다.
          </div>
        )}
      </PixelCard>

      {/* 안내 메시지 */}
      <PixelCard title="INFO" variant="info">
        <div className="text-center">
          <div className="text-gray-300 text-sm font-mono leading-relaxed">
            🏆 랭킹은 이번 달 총 수입을 기준으로 계산됩니다.<br/>
            👆 랭커를 클릭하면 상세 정보를 볼 수 있습니다.
          </div>
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
    </PixelModal>
  )
}
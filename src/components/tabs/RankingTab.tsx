'use client'

import React, { useState } from 'react'

interface RankingTabProps {
  isVerified: boolean
  allRecords: any[]
  dailyGoal: number
}

interface GradeInfo {
  name: string
  icon: string
  color: string
  minIncome: number
  maxIncome: number
  description: string
}

interface TopRanker {
  rank: number
  income: number
  count: number
  platform: string
}

export default function RankingTab({ isVerified, allRecords, dailyGoal }: RankingTabProps) {
  const [showTopRankerProfile, setShowTopRankerProfile] = useState(false)
  const [selectedProfileRanker, setSelectedProfileRanker] = useState<TopRanker | null>(null)

  // 오늘 일간 수입 계산
  const getDailyIncome = () => {
    if (!allRecords || allRecords.length === 0) return 0
    
    const today = new Date()
    const todayStr = today.toISOString().split('T')[0]
    
    return allRecords
      .filter(record => record.date === todayStr)
      .reduce((total, record) => total + record.amount + record.missionAmount, 0)
  }

  const myIncome = getDailyIncome()

  // 등급별 정보 정의 - 수입 기반
  const grades: GradeInfo[] = [
    { name: 'LEGEND', icon: '👑', color: '#ff6b35', minIncome: 300000, maxIncome: Infinity, description: '전설의 배달왕' },
    { name: 'DIAMOND', icon: '💎', color: '#00d4ff', minIncome: 200000, maxIncome: 299999, description: '다이아몬드 배달왕' },
    { name: 'PLATINUM', icon: '🥇', color: '#9c88ff', minIncome: 150000, maxIncome: 199999, description: '플래티넘 배달왕' },
    { name: 'GOLD', icon: '🥈', color: '#ffd93d', minIncome: 100000, maxIncome: 149999, description: '골드 배달왕' },
    { name: 'SILVER', icon: '🥉', color: '#c0c0c0', minIncome: 50000, maxIncome: 99999, description: '실버 배달왕' },
    { name: 'BRONZE', icon: '🏅', color: '#cd7f32', minIncome: 0, maxIncome: 49999, description: '브론즈 배달왕' }
  ]

  // 내 등급 찾기
  const myGrade = grades.find(grade => myIncome >= grade.minIncome && myIncome <= (grade.maxIncome === Infinity ? 999999999 : grade.maxIncome)) || grades[grades.length - 1]

  // 상위 5명 랭킹 생성 (시뮬레이션)
  const generateTopRankers = (): TopRanker[] => {
    const baseIncome = myIncome * 1.5 // 내 수입보다 높은 수입으로 시작
    return Array.from({ length: 5 }, (_, index) => ({
      rank: index + 1,
      income: Math.floor(baseIncome + (index * 50000) + Math.random() * 100000),
      count: Math.floor(15 + Math.random() * 20),
      platform: Math.random() > 0.5 ? 'baemin' : 'coupang'
    }))
  }

  const topRankers = generateTopRankers()

  // 등급별 분포 계산 (시뮬레이션)
  const getGradeDistribution = () => {
    // 실제로는 allRecords에서 계산해야 하지만, 시뮬레이션으로 구현
    // 수입을 기록한 사용자만 계산 (전체 사용자의 약 30% 정도)
    const activeUsers = 300 // 수입을 기록한 활성 사용자 수
    const distribution = {
      LEGEND: Math.floor(activeUsers * 0.02), // 2% (6명)
      DIAMOND: Math.floor(activeUsers * 0.05), // 5% (15명)
      PLATINUM: Math.floor(activeUsers * 0.08), // 8% (24명)
      GOLD: Math.floor(activeUsers * 0.15), // 15% (45명)
      SILVER: Math.floor(activeUsers * 0.25), // 25% (75명)
      BRONZE: Math.floor(activeUsers * 0.45) // 45% (135명)
    }
    return distribution
  }

  const gradeDistribution = getGradeDistribution()

  // TOP 랭커 프로필 모달 표시
  const handleShowTopRankerProfile = (ranker: TopRanker) => {
    setSelectedProfileRanker(ranker)
    setShowTopRankerProfile(true)
  }

  // TOP 랭커 미니홈피 방문
  const handleVisitTopRankerMinihome = async (ranker: TopRanker) => {
    // 미니홈피 페이지로 이동
    window.location.href = `/minihome/top-ranker-${ranker.rank}`
  }

  // 인증되지 않은 경우 잠금 화면 표시
  if (!isVerified) {
    return (
      <div className="space-y-3 sm:space-y-4">
        <div className="bg-gradient-to-br from-[#2d3748] to-[#1a202c] rounded-xl p-4 border border-[#ff6b6b]/30 shadow-inner mb-2 sm:mb-3 lg:mb-4 flex-shrink-0">
          <div className="text-center">
            <div className="text-6xl mb-4">🔒</div>
            <h3 className="text-white font-bold text-base font-mono">
              랭킹 잠금
            </h3>
            <p className="text-gray-400 text-xs font-mono mt-2">Ranking Locked</p>
            <p className="text-gray-300 text-sm mb-4 mt-4">
              랭킹을 확인하려면 먼저 오늘의 수입을 사진으로 인증해주세요!
            </p>
            <div className="text-xs text-gray-400">
              수입 탭에서 사진 업로드 후 이용 가능합니다.
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3 sm:space-y-4">


      {/* 내 등급 정보 컨테이너 */}
      <div className="bg-gradient-to-r from-[#1a202c] to-[#2d3748] p-3 sm:p-4 lg:p-5 mb-3 sm:mb-4 lg:mb-5 rounded-xl relative transition-all duration-300">
        <div className="bg-[#1a202c]/60 border-2 border-[#ffd93d]/30 p-3 sm:p-4 relative mb-4 rounded-lg">
          <h4 className="text-[#ffd93d] font-bold text-sm font-mono tracking-wide mb-3 text-center">
            내 일간 등급
          </h4>
          
          <div className="text-center">
            <div className="text-[#ffd93d] font-bold text-2xl sm:text-3xl mb-2 font-mono">{myGrade.name}</div>
            <div className="text-white font-bold text-xl sm:text-2xl font-mono">₩{myIncome.toLocaleString()}</div>
          </div>
          
          {/* 픽셀 도트들 */}
          <div className="absolute top-1 left-1 w-1 h-1 bg-[#ffd93d]" style={{borderRadius: '1px'}}></div>
          <div className="absolute top-1 right-1 w-1 h-1 bg-[#ffd93d]" style={{borderRadius: '1px'}}></div>
          <div className="absolute bottom-1 left-1 w-1 h-1 bg-[#ffd93d]" style={{borderRadius: '1px'}}></div>
          <div className="absolute bottom-1 right-1 w-1 h-1 bg-[#ffd93d]" style={{borderRadius: '1px'}}></div>
        </div>
        
        {/* 등급 분포도 그래프 */}
        <div className="bg-[#1a202c]/60 border-2 border-[#ffd93d]/30 p-3 sm:p-4 relative">
          <h5 className="text-[#ffd93d] font-bold text-sm font-mono tracking-wide mb-3 text-center">
            등급 분포도
          </h5>
          
          <div className="space-y-2">
            {grades.map((grade) => {
                          const count = gradeDistribution[grade.name as keyof typeof gradeDistribution] || 0
            const percentage = Math.round((count / 300) * 100)
              const isMyGrade = myGrade.name === grade.name
              
              return (
                <div key={grade.name} className="relative">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <div 
                        className={`w-2 h-2 rounded-sm ${isMyGrade ? 'ring-2 ring-white ring-offset-1 ring-offset-[#1a202c]' : ''}`}
                        style={{ backgroundColor: grade.color }}
                      ></div>
                      <span className={`text-sm font-mono ${isMyGrade ? 'text-[#ffd93d] font-bold' : 'text-gray-300'}`}>
                        {grade.name}
                      </span>
                    </div>
                    <div className="text-right">
                      <div className={`text-sm font-mono ${isMyGrade ? 'text-[#ffd93d]' : 'text-gray-400'}`}>
                        {grade.minIncome === 0 ? '₩0' : `₩${(grade.minIncome / 10000).toFixed(0)}만`} ~ 
                        {grade.maxIncome === Infinity ? '' : ` ₩${(grade.maxIncome / 10000).toFixed(0)}만`}
                      </div>
                    </div>
                  </div>
                  
                  {/* 진행률 바 */}
                  <div className="bg-[#1a202c]/60 h-6 rounded-sm overflow-hidden border border-[#ffd93d]/30 relative">
                    <div 
                      className="h-full transition-all duration-500 ease-out"
                      style={{ 
                        width: `${percentage}%`,
                        backgroundColor: grade.color,
                        opacity: 0.8
                      }}
                    ></div>
                    
                    {/* 인원과 퍼센트를 막대가 채워지지 않은 빈 공간 우측에 표시 */}
                    <div className="absolute left-0 top-0 h-6 flex items-center justify-center" style={{ left: `${percentage}%`, width: `${100 - percentage}%` }}>
                      <span className={`text-sm font-mono ${isMyGrade ? 'text-[#ffd93d] font-bold' : 'text-gray-300'}`}>
                        {count}명 {percentage}%
                      </span>
                    </div>
                    
                    {/* 픽셀 도트들 */}
                    <div className="absolute top-0.5 left-0.5 w-0.5 h-0.5 bg-[#ffd93d]" style={{borderRadius: '1px'}}></div>
                    <div className="absolute top-0.5 right-0.5 w-0.5 h-0.5 bg-[#ffd93d]" style={{borderRadius: '1px'}}></div>
                    <div className="absolute bottom-0.5 left-0.5 w-0.5 h-0.5 bg-[#ffd93d]" style={{borderRadius: '1px'}}></div>
                    <div className="absolute bottom-0.5 right-0.5 w-0.5 h-0.5 bg-[#ffd93d]" style={{borderRadius: '1px'}}></div>
                  </div>
                </div>
              )
            })}
          </div>
          
          {/* 픽셀 도트들 */}
          <div className="absolute top-1 left-1 w-1 h-1 bg-[#ffd93d]" style={{borderRadius: '1px'}}></div>
          <div className="absolute top-1 right-1 w-1 h-1 bg-[#ffd93d]" style={{borderRadius: '1px'}}></div>
          <div className="absolute bottom-1 left-1 w-1 h-1 bg-[#ffd93d]" style={{borderRadius: '1px'}}></div>
          <div className="absolute bottom-1 right-1 w-1 h-1 bg-[#ffd93d]" style={{borderRadius: '1px'}}></div>
        </div>
      </div>

      {/* 상위 5명 랭킹 */}
      <div className="bg-gradient-to-br from-[#2d3748] to-[#1a202c] rounded-xl sm:rounded-2xl p-3 sm:p-4 lg:p-5 border border-[#ff6b6b]/30 shadow-inner mb-2 sm:mb-3 lg:mb-4 flex-shrink-0">
        {/* 픽셀 헤더 - INCOME 탭 7일 트렌드와 동일한 스타일 */}
        <div
          className="w-full bg-gradient-to-r from-[#1a202c] to-[#2d3748] border-2 border-[#ff6b6b]/50 hover:border-[#ff6b6b] text-white font-mono py-3 px-4 transition-all duration-200 relative mb-4"
          style={{
            borderRadius: '4px',
            fontFamily: 'monospace',
            imageRendering: 'pixelated'
          }}
        >
          <div className="flex items-center justify-center">
            <h3 className="text-white font-bold text-base font-mono" style={{
              imageRendering: 'pixelated'
            }}>
              🥇 TOP 5 랭킹
            </h3>
          </div>

          {/* 픽셀 도트들 - INCOME 탭과 동일한 스타일 */}
          <div className="absolute top-1 left-1 w-1 h-1 bg-[#ff6b6b]/60" style={{borderRadius: '1px'}}></div>
          <div className="absolute top-1 right-1 w-1 h-1 bg-[#ff6b6b]/60" style={{borderRadius: '1px'}}></div>
          <div className="absolute bottom-1 left-1 w-1 h-1 bg-[#ff6b6b]/60" style={{borderRadius: '1px'}}></div>
          <div className="absolute bottom-1 right-1 w-1 h-1 bg-[#ff6b6b]/60" style={{borderRadius: '1px'}}></div>
        </div>
        
        <div className="space-y-2 sm:space-y-3">
          {topRankers.map((ranker, index) => (
            <div key={index} className="bg-[#1a202c]/60 border-2 border-[#ff6b6b]/30 p-3 sm:p-4 relative">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 sm:w-10 sm:h-10 border-2 flex items-center justify-center font-bold text-sm sm:text-base font-mono ${
                    ranker.rank === 1 ? 'bg-[#ffd93d] text-black border-[#ffd93d]' :
                    ranker.rank === 2 ? 'bg-[#c0c0c0] text-black border-[#c0c0c0]' :
                    ranker.rank === 3 ? 'bg-[#cd7f32] text-white border-[#cd7f32]' :
                    'bg-[#4a5568] text-white border-[#4a5568]'
                  }`}>
                    {ranker.rank}
                  </div>
                  <div>
                    <button
                      onClick={() => handleShowTopRankerProfile(ranker)}
                      className="text-white font-bold text-sm sm:text-base font-mono hover:text-[#00d4ff] transition-colors duration-200 cursor-pointer"
                    >
                      배달왕 {ranker.rank}호
                    </button>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[#ffd93d] font-bold text-sm sm:text-base font-mono">₩{ranker.income.toLocaleString()}</div>
                  <div className="text-gray-400 text-xs sm:text-sm font-mono">{ranker.count}건</div>
                </div>
              </div>
              
              {/* 픽셀 도트들 */}
              <div className="absolute top-1 left-1 w-1 h-1 bg-[#ff6b6b]" style={{borderRadius: '1px'}}></div>
              <div className="absolute top-1 right-1 w-1 h-1 bg-[#ff6b6b]" style={{borderRadius: '1px'}}></div>
              <div className="absolute bottom-1 left-1 w-1 h-1 bg-[#ff6b6b]" style={{borderRadius: '1px'}}></div>
              <div className="absolute bottom-1 right-1 w-1 h-1 bg-[#ff6b6b]" style={{borderRadius: '1px'}}></div>
            </div>
          ))}
        </div>
      </div>

      {/* TOP 랭커 프로필 모달 */}
      {showTopRankerProfile && selectedProfileRanker && (
        <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
          <div 
            className="w-full max-w-sm sm:max-w-md bg-gradient-to-b from-[#0a0a23] via-[#16213e] to-[#1a1a2e] border-2 sm:border-4 border-[#ffd93d]/50 shadow-2xl relative max-h-[calc(100vh-32px)] overflow-y-auto"
            style={{
              borderRadius: '6px',
              fontFamily: 'monospace',
              imageRendering: 'pixelated',
              boxShadow: '0 0 20px rgba(255, 217, 61, 0.2), inset 0 0 15px rgba(255, 217, 61, 0.05)'
            }}
          >
            {/* 네온 글로우 테두리 */}
            <div className="absolute -inset-1 bg-gradient-to-r from-[#ffd93d]/20 via-[#ff6b6b]/20 to-[#ffd93d]/20 blur-sm -z-10" 
                 style={{borderRadius: '12px'}}></div>
            
            {/* 헤더 - CHARACTER EDIT와 동일한 스타일 */}
            <div className="bg-gradient-to-r from-[#0a0a23] to-[#16213e] p-3 sm:p-4 border-b-2 border-[#ffd93d]/30 relative">
              {/* 상단 장식 라인 */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#ffd93d]/60 to-transparent"></div>
              
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2 sm:gap-3">
                  {/* 픽셀 아이콘 */}
                  <div className="w-5 h-5 sm:w-6 sm:h-6 bg-gradient-to-br from-[#ffd93d] to-[#ff6b6b] border border-[#ffd93d]" 
                       style={{borderRadius: '3px'}}>
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="w-2 h-2 sm:w-3 sm:h-3 bg-white" style={{borderRadius: '1px'}}></div>
                    </div>
                  </div>
                  <h3 className="text-[#ffd93d] font-bold text-sm sm:text-lg font-mono tracking-wide" 
                      style={{textShadow: '0 0 8px rgba(255, 217, 61, 0.5)'}}>
                    TOP {selectedProfileRanker.rank} 랭커
                  </h3>
                </div>
                <button
                  onClick={() => setShowTopRankerProfile(false)}
                  className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-br from-[#ff6b6b]/20 to-[#ff4757]/20 border border-[#ff6b6b]/50 hover:border-[#ff6b6b] text-[#ff6b6b] hover:text-[#ff4757] font-bold transition-all duration-200 hover:scale-110 text-sm sm:text-base"
                  style={{borderRadius: '4px'}}
                >
                  ✕
                </button>
              </div>
              
              {/* 하단 장식 라인 */}
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#ffd93d]/40 to-transparent"></div>
            </div>

            <div className="p-3 sm:p-4 space-y-3 sm:space-y-4 relative">
              {/* 배경 패턴 */}
              <div className="absolute inset-0 opacity-5">
                <div className="w-full h-full" 
                     style={{
                       backgroundImage: `radial-gradient(circle, #ffd93d 1px, transparent 1px)`,
                       backgroundSize: '12px 12px'
                     }}></div>
              </div>
              
              {/* 랭커 정보 - CHARACTER EDIT 스타일 */}
              <div className="space-y-2 sm:space-y-3 relative">
                <div className="bg-gradient-to-r from-[#ffd93d]/20 to-[#ff6b6b]/20 border border-[#ffd93d]/50 p-2 sm:p-3 relative"
                     style={{borderRadius: '4px'}}>
                  <h4 className="text-[#ffd93d] text-center font-bold text-xs sm:text-sm font-mono tracking-wide mb-2 sm:mb-3" 
                      style={{textShadow: '0 0 6px rgba(255, 217, 61, 0.5)'}}>
                    RANKER INFO
                  </h4>
                  <div className="text-center mb-4">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-3">
                      <img 
                        src={`/assets/character/character-happy.png`}
                        alt="캐릭터"
                        className="w-full h-full object-contain drop-shadow-lg"
                        style={{ imageRendering: 'pixelated' }}
                      />
                    </div>
                    <h4 className="text-white font-bold text-base sm:text-lg font-mono mb-2">
                      배달왕 {selectedProfileRanker.rank}호
                    </h4>
                  </div>
                  
                  {/* 모서리 픽셀 도트 */}
                  <div className="absolute top-1 left-1 w-1 h-1 bg-[#ffd93d]" style={{borderRadius: '1px'}}></div>
                  <div className="absolute top-1 right-1 w-1 h-1 bg-[#ffd93d]" style={{borderRadius: '1px'}}></div>
                  <div className="absolute bottom-1 left-1 w-1 h-1 bg-[#ffd93d]" style={{borderRadius: '1px'}}></div>
                  <div className="absolute bottom-1 right-1 w-1 h-1 bg-[#ffd93d]" style={{borderRadius: '1px'}}></div>
                </div>
              </div>
              
              {/* 수입 상세 정보 - INCOME DETAIL 스타일 */}
              <div className="space-y-2 sm:space-y-3 relative">
                <div className="bg-gradient-to-r from-[#00d4ff]/20 to-[#9c88ff]/20 border border-[#00d4ff]/50 p-2 sm:p-3 relative"
                     style={{borderRadius: '4px'}}>
                  <h4 className="text-[#00d4ff] text-center font-bold text-xs sm:text-sm font-mono tracking-wide mb-2 sm:mb-3" 
                      style={{textShadow: '0 0 6px rgba(0, 212, 255, 0.5)'}}>
                    INCOME DETAIL
                  </h4>
                  
                  {/* 상세 정보 그리드 - INCOME DETAIL과 동일한 스타일 */}
                  <div className="grid grid-cols-3 gap-3">
                    {/* 건수 */}
                    <div className="bg-[#1a202c]/50 p-3 rounded-lg text-center border"
                         style={{borderColor: '#00d4ff30'}}>
                      <div className="text-xs text-gray-400 font-mono mb-1">건수</div>
                      <div className="text-sm font-bold font-mono text-[#00d4ff]">
                        {selectedProfileRanker.count}건
                      </div>
                    </div>

                    {/* 배달 금액 */}
                    <div className="bg-[#1a202c]/50 p-3 rounded-lg text-center border"
                         style={{borderColor: '#ffd93d30'}}>
                      <div className="text-xs text-gray-400 font-mono mb-1">배달금액</div>
                      <div className="text-sm font-bold font-mono text-white">
                        ₩{Math.floor(selectedProfileRanker.income * 0.7).toLocaleString()}
                      </div>
                    </div>

                                         {/* 미션비 */}
                     <div className="bg-[#1a202c]/50 p-3 rounded-lg text-center border"
                          style={{borderColor: '#9c88ff30'}}>
                       <div className="text-xs text-gray-400 font-mono mb-1">미션비</div>
                       <div className="text-sm font-bold font-mono text-[#9c88ff]">
                         ₩{Math.floor(selectedProfileRanker.income * 0.3).toLocaleString()}
                       </div>
                     </div>
                  </div>
                  
                  {/* 모서리 픽셀 도트 */}
                  <div className="absolute top-1 left-1 w-1 h-1 bg-[#00d4ff]" style={{borderRadius: '1px'}}></div>
                  <div className="absolute top-1 right-1 w-1 h-1 bg-[#00d4ff]" style={{borderRadius: '1px'}}></div>
                  <div className="absolute bottom-1 left-1 w-1 h-1 bg-[#00d4ff]" style={{borderRadius: '1px'}}></div>
                  <div className="absolute bottom-1 right-1 w-1 h-1 bg-[#00d4ff]" style={{borderRadius: '1px'}}></div>
                </div>
              </div>
              
              {/* 플랫폼별 상세 정보 - 플랫폼 설정과 동일한 스타일 */}
              <div className="space-y-2 sm:space-y-3 relative">
                <div className="bg-gradient-to-r from-[#00ff88]/20 to-[#00d4ff]/20 border border-[#00ff88]/50 p-2 sm:p-3 relative"
                     style={{borderRadius: '4px'}}>
                  <h4 className="text-[#00ff88] text-center font-bold text-xs sm:text-sm font-mono tracking-wide mb-2 sm:mb-3" 
                      style={{textShadow: '0 0 6px rgba(0, 255, 136, 0.5)'}}>
                    플랫폼별 상세
                  </h4>
                  
                  {/* 플랫폼별 정보 - 플랫폼 설정과 동일한 디자인 */}
                  <div className="space-y-2">
                    {/* 배민 */}
                    <div className="bg-[#0a0a23]/40 border-2 border-[#00ff88]/30 p-2 rounded-lg relative hover:border-[#00ff88]/60 transition-all duration-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 overflow-hidden rounded-lg flex items-center justify-center border border-[#00ff88]/60"
                               style={{backgroundColor: '#00ff8820'}}>
                            <img 
                              src="/baemin-logo.svg" 
                              alt="배민"
                              className="w-4 h-4 object-contain"
                            />
                          </div>
                          <span className="text-xs font-mono text-[#00ff88] font-bold">배민</span>
                        </div>
                        <div className="text-right">
                          <div className="text-xs font-mono text-white font-bold">
                            ₩{Math.floor(selectedProfileRanker.income * 0.6).toLocaleString()}
                          </div>
                          <div className="text-xs font-mono text-gray-400">
                            {Math.floor(selectedProfileRanker.count * 0.6)}건
                          </div>
                        </div>
                      </div>
                      
                      {/* 선택된 플랫폼 픽셀 도트 */}
                      <div className="absolute top-0.5 left-0.5 w-1 h-1 bg-[#00ff88]" style={{borderRadius: '1px'}}></div>
                      <div className="absolute top-0.5 right-0.5 w-1 h-1 bg-[#00ff88]" style={{borderRadius: '1px'}}></div>
                      <div className="absolute bottom-0.5 left-0.5 w-1 h-1 bg-[#00ff88]" style={{borderRadius: '1px'}}></div>
                      <div className="absolute bottom-0.5 right-0.5 w-1 h-1 bg-[#00ff88]" style={{borderRadius: '1px'}}></div>
                    </div>
                    
                    {/* 쿠팡 */}
                    <div className="bg-[#0a0a23]/40 border-2 border-[#ff6b6b]/30 p-2 rounded-lg relative hover:border-[#ff6b6b]/60 transition-all duration-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 overflow-hidden rounded-lg flex items-center justify-center border border-[#ff6b6b]/60"
                               style={{backgroundColor: '#ff6b6b20'}}>
                            <img 
                              src="/coupang-logo.svg" 
                              alt="쿠팡"
                              className="w-4 h-4 object-contain"
                            />
                          </div>
                          <span className="text-xs font-mono text-[#ff6b6b] font-bold">쿠팡</span>
                        </div>
                        <div className="text-right">
                          <div className="text-xs font-mono text-white font-bold">
                            ₩{Math.floor(selectedProfileRanker.income * 0.4).toLocaleString()}
                          </div>
                          <div className="text-xs font-mono text-gray-400">
                            {Math.floor(selectedProfileRanker.count * 0.4)}건
                          </div>
                        </div>
                      </div>
                      
                      {/* 선택된 플랫폼 픽셀 도트 */}
                      <div className="absolute top-0.5 left-0.5 w-1 h-1 bg-[#ff6b6b]" style={{borderRadius: '1px'}}></div>
                      <div className="absolute top-0.5 right-0.5 w-0.5 h-0.5 bg-[#ff6b6b]" style={{borderRadius: '1px'}}></div>
                      <div className="absolute bottom-0.5 left-0.5 w-1 h-1 bg-[#ff6b6b]" style={{borderRadius: '1px'}}></div>
                      <div className="absolute bottom-0.5 right-0.5 w-0.5 h-0.5 bg-[#ff6b6b]" style={{borderRadius: '1px'}}></div>
                    </div>
                  </div>
                  
                  {/* 모서리 픽셀 도트 */}
                  <div className="absolute top-1 left-1 w-1 h-1 bg-[#00ff88]" style={{borderRadius: '1px'}}></div>
                  <div className="absolute top-1 right-1 w-1 h-1 bg-[#00ff88]" style={{borderRadius: '1px'}}></div>
                  <div className="absolute bottom-1 left-1 w-1 h-1 bg-[#00ff88]" style={{borderRadius: '1px'}}></div>
                  <div className="absolute bottom-1 right-1 w-1 h-1 bg-[#00ff88]" style={{borderRadius: '1px'}}></div>
                </div>
              </div>

              {/* VISIT MINIHOME 버튼 - CHARACTER EDIT 스타일 */}
              <div className="space-y-2 sm:space-y-3 relative">
                <div className="bg-gradient-to-r from-[#9c88ff]/20 to-[#ffd93d]/20 border border-[#9c88ff]/50 p-2 sm:p-3 relative"
                     style={{borderRadius: '4px'}}>
                  <button
                    onClick={() => {
                      setShowTopRankerProfile(false)
                      handleVisitTopRankerMinihome(selectedProfileRanker)
                    }}
                    className="w-full bg-gradient-to-r from-[#00d4ff]/20 to-[#9c88ff]/20 border-2 border-[#00d4ff]/50 hover:border-[#00d4ff] text-[#00d4ff] hover:text-white font-bold py-2 sm:py-3 transition-all duration-300 hover:scale-105 hover:shadow-lg relative font-mono tracking-wide"
                    style={{
                      borderRadius: '6px',
                      textShadow: '0 0 6px rgba(0, 212, 255, 0.5)',
                      boxShadow: '0 0 15px rgba(0, 212, 255, 0.2)'
                    }}
                  >
                    <div className="flex items-center justify-center gap-1.5 sm:gap-2">
                      <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-[#00d4ff] border border-white" style={{borderRadius: '1px'}}></div>
                      <span className="text-sm sm:text-base">VISIT MINIHOME</span>
                      <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-[#00d4ff] border border-white" style={{borderRadius: '1px'}}></div>
                    </div>
                    
                    {/* 버튼 모서리 픽셀 도트 */}
                    <div className="absolute top-1 left-1 w-1 h-1 bg-[#00d4ff]" style={{borderRadius: '1px'}}></div>
                    <div className="absolute top-1 right-1 w-1 h-1 bg-[#00d4ff]" style={{borderRadius: '1px'}}></div>
                    <div className="absolute bottom-1 left-1 w-1 h-1 bg-[#00d4ff]" style={{borderRadius: '1px'}}></div>
                    <div className="absolute bottom-1 right-1 w-1 h-1 bg-[#00d4ff]" style={{borderRadius: '1px'}}></div>
                  </button>
                  
                  {/* 모서리 픽셀 도트 */}
                  <div className="absolute top-1 left-1 w-1 h-1 bg-[#9c88ff]" style={{borderRadius: '1px'}}></div>
                  <div className="absolute top-1 right-1 w-1 h-1 bg-[#9c88ff]" style={{borderRadius: '1px'}}></div>
                  <div className="absolute bottom-1 left-1 w-1 h-1 bg-[#9c88ff]" style={{borderRadius: '1px'}}></div>
                  <div className="absolute bottom-1 right-1 w-1 h-1 bg-[#9c88ff]" style={{borderRadius: '1px'}}></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 



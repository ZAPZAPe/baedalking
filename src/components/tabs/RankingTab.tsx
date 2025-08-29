'use client'

import React, { useState, useEffect } from 'react'

interface RankingTabProps {
  isVerified?: boolean
  allRecords: any[]
  dailyGoal: number
  onShowGradeDetail: (grade: GradeInfo) => void
  onShowTopRankerProfile: (ranker: TopRanker) => void
  onShowRankingDetail: () => void
  onTopRankersUpdate: (rankers: TopRanker[]) => void
  onShowUserProfile: (userProfile: any) => void
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
  id: string
  rank: number
  income: number
  count: number
  platform: string
  nickname: string
  region: string
  platforms: string[] // 수입 등록된 플랫폼들
}

export default function RankingTab({ allRecords, dailyGoal, onShowGradeDetail, onShowTopRankerProfile, onShowRankingDetail, onTopRankersUpdate, onShowUserProfile }: RankingTabProps) {


  // 오늘 일간 수입 계산
  const getDailyIncome = () => {
    if (!allRecords || allRecords.length === 0) return 0
    
    const today = new Date()
    const todayStr = today.toISOString().split('T')[0]
    
    return allRecords
      .filter(record => record.date === todayStr)
      .reduce((total, record) => total + record.amount + record.missionAmount, 0)
  }

  // 실제 사용자 수입 계산
  const myIncome = getDailyIncome()
  // const myIncome = getDailyIncome() // 실제 데이터 사용 시 이 줄 사용

  // 등급별 정보 정의 - 수입 기반
  const grades: GradeInfo[] = [
    { name: 'LEGEND', icon: '👑', color: '#ff6b35', minIncome: 300000, maxIncome: Infinity, description: '전설의 배달왕' },
    { name: 'DIAMOND', icon: '💎', color: '#00d4ff', minIncome: 200000, maxIncome: 299999, description: '다이아몬드 배달왕' },
    { name: 'PLATINUM', icon: '🥇', color: '#9c88ff', minIncome: 150000, maxIncome: 199999, description: '플래티넘 배달왕' },
    { name: 'GOLD', icon: '🥈', color: '#ffd93d', minIncome: 100000, maxIncome: 149999, description: '골드 배달왕' },
    { name: 'SILVER', icon: '🥉', color: '#c0c0c0', minIncome: 50000, maxIncome: 99999, description: '실버 배달왕' },
    { name: 'BRONZE', icon: '🏅', color: '#cd7f32', minIncome: 0, maxIncome: 49999, description: '브론즈 배달왕' }
  ]

  // 내 등급 찾기 (수입이 있을 때만)
  const myGrade = myIncome > 0 ? grades.find(grade => myIncome >= grade.minIncome && myIncome <= (grade.maxIncome === Infinity ? 999999999 : grade.maxIncome)) || grades[grades.length - 1] : null

  // 상위 5명 랭킹 생성 (시뮬레이션)
  const generateTopRankers = (): TopRanker[] => {
    const baseIncome = myIncome * 1.5 // 내 수입보다 높은 수입으로 시작
    const nicknames = ['배달왕김철수', '배달여신이영희', '스피드맨박민수', '정확맨최지영', '친절맨정수민']
    const regions = [
      '서울특별시 강남구',
      '서울특별시 서초구', 
      '서울특별시 마포구',
      '서울특별시 종로구',
      '서울특별시 용산구'
    ]
    
    return Array.from({ length: 5 }, (_, index) => {
      // 랜덤하게 1~3개 플랫폼 선택
      const allPlatforms = ['baemin', 'coupang', '기타']
      const platformCount = Math.floor(Math.random() * 3) + 1
      const platforms = allPlatforms
        .sort(() => Math.random() - 0.5)
        .slice(0, platformCount)
      
      return {
        id: `top-ranker-${index + 1}`,
        rank: index + 1,
        income: Math.floor(baseIncome + (index * 50000) + Math.random() * 100000),
        count: Math.floor(15 + Math.random() * 20),
        platform: platforms[0], // 기존 호환성을 위해 유지
        nickname: nicknames[index],
        region: regions[index],
        platforms: platforms
      }
    })
  }

  // 실제 랭킹 데이터 상태
  const [topRankers, setTopRankers] = useState<TopRanker[]>([])
  const [isLoadingRanking, setIsLoadingRanking] = useState(true)

  // topRankers가 업데이트될 때마다 페이지로 전달
  useEffect(() => {
    onTopRankersUpdate(topRankers)
  }, [topRankers, onTopRankersUpdate])

  // 랭킹 데이터 가져오기
  useEffect(() => {
    const fetchRankings = async () => {
      try {
        const response = await fetch('/api/rankings?period=daily&limit=5')
        const data = await response.json()
        
        if (response.ok && data.rankings) {
          const formattedRankers = data.rankings.map((ranking: any) => ({
            id: ranking.user_id,
            rank: ranking.rank,
            income: ranking.total_income,
            count: 0, // API에서 제공되지 않으면 0으로 설정
            platform: '배민', // 기본값
            nickname: ranking.nickname,
            region: ranking.region,
            platforms: ['배민'] // 기본값
          }))
          setTopRankers(formattedRankers)
        } else {
          // API 응답이 없으면 빈 배열
          setTopRankers([])
        }
      } catch (error) {
        console.error('랭킹 데이터 로딩 오류:', error)
        // 에러 시에도 빈 배열
        setTopRankers([])
      } finally {
        setIsLoadingRanking(false)
      }
    }

    fetchRankings()
  }, [myIncome])

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
    // UserProfileModal을 위한 사용자 프로필 데이터 생성
    const userProfile = {
      id: ranker.id,
      nickname: ranker.nickname,
      region: ranker.region,
      income: ranker.income,
      count: ranker.count,
      platforms: ranker.platforms,
      minihomeId: ranker.id
    }
    
    onShowUserProfile(userProfile)
  }



  // 등급 상세 정보 모달 표시
  const handleShowGradeDetail = (grade: GradeInfo) => {
    onShowGradeDetail(grade)
  }



  // 인증되지 않은 경우 잠금 화면 표시
  if (false) {
    return (
      <div className="space-y-3 sm:space-y-4">
        <div className="bg-gradient-to-br from-[#2d3748] to-[#1a202c] rounded-xl p-4 border border-[#ff6b6b]/30 shadow-inner mb-2 sm:mb-3 lg:mb-4 flex-shrink-0 relative">
          {/* 픽셀 도트들 */}
          <div className="absolute top-1 left-1 w-1 h-1 bg-[#ff6b6b]/60" style={{borderRadius: '1px'}}></div>
          <div className="absolute top-1 right-1 w-1 h-1 bg-[#ff6b6b]/60" style={{borderRadius: '1px'}}></div>
          <div className="absolute bottom-1 left-1 w-1 h-1 bg-[#ff6b6b]/60" style={{borderRadius: '1px'}}></div>
          <div className="absolute bottom-1 right-1 w-1 h-1 bg-[#ff6b6b]/60" style={{borderRadius: '1px'}}></div>
          
          <div className="text-center">
            <div className="text-6xl mb-4">🔒</div>
            <h3 className="text-white font-bold text-base font-mono">
              랭킹 잠금
            </h3>
            <p className="text-gray-400 text-xs font-mono tracking-wider mt-2">RANKING LOCKED</p>
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
      {/* 내 일간 등급 섹션 */}
      <div className="bg-gradient-to-br from-[#2d3748] to-[#1a202c] rounded-xl p-4 border border-[#ffd93d]/30 shadow-inner mb-2 sm:mb-3 lg:mb-4 flex-shrink-0 relative">
        
        {/* 픽셀 헤더 */}
        <div
          className="w-full bg-gradient-to-r from-[#1a202c] to-[#2d3748] border-2 border-[#ffd93d]/50 hover:border-[#ffd93d] text-white font-mono py-3 px-4 transition-all duration-200 relative mb-4"
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
              내 일간 등급
            </h3>
          </div>

          {/* 픽셀 도트들 */}
          <div className="absolute top-1 left-1 w-1 h-1 bg-[#ffd93d]/60" style={{borderRadius: '1px'}}></div>
          <div className="absolute top-1 right-1 w-1 h-1 bg-[#ffd93d]/60" style={{borderRadius: '1px'}}></div>
          <div className="absolute bottom-1 left-1 w-1 h-1 bg-[#ffd93d]/60" style={{borderRadius: '1px'}}></div>
          <div className="absolute bottom-1 right-1 w-1 h-1 bg-[#ffd93d]/60" style={{borderRadius: '1px'}}></div>
        </div>
        
        <div className="grid grid-cols-2 gap-3 mb-3">
          {/* 내 등급 */}
          <div 
            className={`bg-[#1a202c]/50 p-3 rounded-lg text-center border border-[#ffd93d]/30 relative transition-all duration-200 ${
              myGrade ? 'cursor-pointer hover:bg-[#1a202c]/70' : 'cursor-not-allowed opacity-60'
            }`}
            onClick={() => myGrade && handleShowGradeDetail(myGrade)}
          >
            {/* 픽셀 도트들 */}
            <div className="absolute top-1 left-1 w-1 h-1 bg-[#ffd93d]" style={{borderRadius: '1px'}}></div>
            <div className="absolute top-1 right-1 w-1 h-1 bg-[#ffd93d]" style={{borderRadius: '1px'}}></div>
            <div className="absolute bottom-1 left-1 w-1 h-1 bg-[#ffd93d]" style={{borderRadius: '1px'}}></div>
            <div className="absolute bottom-1 right-1 w-1 h-1 bg-[#ffd93d]" style={{borderRadius: '1px'}}></div>
            
            <div className="text-white text-xs font-mono font-bold mb-1">내 등급</div>
            <div className="text-sm font-bold font-mono text-[#ffd93d]">
              {myGrade ? myGrade.name : '등급 없음'}
            </div>
          </div>

          {/* 내 순위 */}
          <div 
            className={`bg-[#1a202c]/50 p-3 rounded-lg text-center border border-[#ffd93d]/30 relative transition-all duration-200 ${
              myGrade ? 'cursor-pointer hover:bg-[#1a202c]/70' : 'cursor-not-allowed opacity-60'
            }`}
            onClick={() => myGrade && onShowRankingDetail()}
          >
            {/* 픽셀 도트들 */}
            <div className="absolute top-1 left-1 w-1 h-1 bg-[#ffd93d]" style={{borderRadius: '1px'}}></div>
            <div className="absolute top-1 right-1 w-1 h-1 bg-[#ffd93d]" style={{borderRadius: '1px'}}></div>
            <div className="absolute bottom-1 left-1 w-1 h-1 bg-[#ffd93d]" style={{borderRadius: '1px'}}></div>
            <div className="absolute bottom-1 right-1 w-1 h-1 bg-[#ffd93d]" style={{borderRadius: '1px'}}></div>
            
            <div className="text-white text-xs font-mono font-bold mb-1">내 순위</div>
            <div className="text-sm font-bold font-mono text-[#ffd93d]">
              {myGrade ? `${Math.floor(Math.random() * 100) + 1}위` : '순위 없음'}
            </div>
          </div>
        </div>
        
        {/* 수입 미입력 시 안내 메시지 */}
        {!myGrade && (
          <div className="text-center text-gray-400 text-xs font-mono bg-[#1a202c]/30 p-2 rounded-lg border border-[#ffd93d]/20 relative">
            {/* 픽셀 도트들 */}
            <div className="absolute top-1 left-1 w-1 h-1 bg-[#ffd93d]" style={{borderRadius: '1px'}}></div>
            <div className="absolute top-1 right-1 w-1 h-1 bg-[#ffd93d]" style={{borderRadius: '1px'}}></div>
            <div className="absolute bottom-1 left-1 w-1 h-1 bg-[#ffd93d]" style={{borderRadius: '1px'}}></div>
            <div className="absolute bottom-1 right-1 w-1 h-1 bg-[#ffd93d]" style={{borderRadius: '1px'}}></div>
            
            수입을 기록하고 순위를 확인해보세요
          </div>
        )}
      </div>



      {/* 상위 5명 랭킹 */}
      <div className="bg-gradient-to-br from-[#2d3748] to-[#1a202c] rounded-xl p-4 border border-[#ff6b6b]/30 shadow-inner mb-2 sm:mb-3 lg:mb-4 flex-shrink-0 relative">
        
        {/* 픽셀 헤더 - INCOME 탭과 동일한 스타일 */}
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
              TOP 5 랭킹
            </h3>
          </div>

          {/* 픽셀 도트들 - INCOME 탭과 동일한 스타일 */}
          <div className="absolute top-1 left-1 w-1 h-1 bg-[#ff6b6b]/60" style={{borderRadius: '1px'}}></div>
          <div className="absolute top-1 right-1 w-1 h-1 bg-[#ff6b6b]/60" style={{borderRadius: '1px'}}></div>
          <div className="absolute bottom-1 left-1 w-1 h-1 bg-[#ff6b6b]/60" style={{borderRadius: '1px'}}></div>
          <div className="absolute bottom-1 right-1 w-1 h-1 bg-[#ff6b6b]/60" style={{borderRadius: '1px'}}></div>
        </div>
        
        {topRankers.length === 0 ? (
          <div className="text-center py-8 text-gray-400 font-mono bg-[#1a202c]/30 rounded-lg border border-[#ff6b6b]/20 relative">
            {/* 픽셀 도트들 */}
            <div className="absolute top-1 left-1 w-1 h-1 bg-[#ff6b6b]" style={{borderRadius: '1px'}}></div>
            <div className="absolute top-1 right-1 w-1 h-1 bg-[#ff6b6b]" style={{borderRadius: '1px'}}></div>
            <div className="absolute bottom-1 left-1 w-1 h-1 bg-[#ff6b6b]" style={{borderRadius: '1px'}}></div>
            <div className="absolute bottom-1 right-1 w-1 h-1 bg-[#ff6b6b]" style={{borderRadius: '1px'}}></div>
            
            <p className="text-lg mb-2">아직 랭킹 데이터가 없습니다</p>
            <p className="text-sm">수입을 기록한 사용자가 나타나면 표시됩니다</p>
          </div>
        ) : (
          <div className="space-y-2 sm:space-y-3">
            {topRankers.slice(0, 5).map((ranker, index) => (
            <div key={index} className="bg-[#1a202c]/60 border-2 border-[#ff6b6b]/30 p-3 sm:p-4 relative">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 sm:w-10 sm:h-10 border-2 flex items-center justify-center font-bold text-sm sm:text-base font-mono rounded-full ${
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
        )}
      </div>


    </div>
  )
} 



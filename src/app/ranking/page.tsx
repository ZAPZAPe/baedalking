'use client';

import { useState, useEffect, useMemo } from 'react';
import { FaCrown, FaTrophy, FaMedal, FaStar, FaFilter, FaUsers, FaFireAlt, FaCamera, FaCoins, FaList, FaChevronDown, FaShare, FaTimes, FaUser, FaMapMarkerAlt, FaMotorcycle, FaBicycle, FaCar, FaWalking, FaChartLine, FaBolt } from 'react-icons/fa';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import { getTodayRanking, getWeeklyRanking, getMonthlyRanking, RankingData } from '@/services/rankingService';
import { Ranking } from '@/types/ranking';
import Loading from '@/components/Loading';

import { shareRanking, initKakaoShare } from '@/services/kakaoShare';
import { toast } from 'react-hot-toast';
import KakaoAdGlobal from '@/components/KakaoAdGlobal';

// 현실적인 기본 랭킹 데이터 생성
const generateDefaultRankings = (): RankingData[] => {
  const nicknames = [
    '배달왕', '스피드러너', '번개배달', '로켓배송', '퀵실버',
    '달리는치타', '바람의전설', '배달의신', '라이더킹', '질주본능',
    '배달천사', '도로위황제', '스피드마스터', '배달영웅', '나이트라이더',
    '번개맨', '광속배달', '터보라이더', '배달전사', '로드러너',
    '바람을가르는', '배달의달인', '스피드헌터', '도로의지배자', '배달특급',
    '미친속도', '배달의제왕', '스피드킹', '배달명장', '로드마스터',
    '폭풍질주', '배달프로', '스피드퀸', '배달의여왕', '도로위여신',
    '배달장인', '번개소녀', '스피드걸', '배달공주', '로드프린세스',
    '바람처럼', '배달의정석', '스피드팬텀', '도로위유령', '배달의전설',
    '광속소년', '배달히어로', '스피드보이', '배달의희망', '로드워리어'
  ];
  
  const regions = ['서울', '부산', '대구', '인천', '광주', '대전', '울산', '경기', '강원', '충북', '충남', '전북', '전남', '경북', '경남', '제주', '세종'];
  const vehicles = ['motorcycle', 'bicycle', 'car', 'walk'] as const;
  
  // 플랫폼 선택 함수 - 상위권일수록 두 플랫폼 사용 확률 높음
  const selectPlatform = (rank: number): string => {
    const random = Math.random();
    if (rank <= 10 && random < 0.5) {
      return '배민커넥트, 쿠팡이츠';
    } else if (rank <= 20 && random < 0.3) {
      return '배민커넥트, 쿠팡이츠';
    } else if (rank <= 30 && random < 0.2) {
      return '배민커넥트, 쿠팡이츠';
    } else {
      return Math.random() < 0.5 ? '배민커넥트' : '쿠팡이츠';
    }
  };
  
  // 수익 곡선 생성 (1위: 300만원 -> 50위: 20만원)
  const generateAmount = (rank: number): number => {
    if (rank === 1) return 3000000;
    if (rank <= 5) return Math.floor(2500000 - (rank - 1) * 200000);
    if (rank <= 10) return Math.floor(1700000 - (rank - 5) * 140000);
    if (rank <= 20) return Math.floor(1000000 - (rank - 10) * 50000);
    if (rank <= 30) return Math.floor(500000 - (rank - 20) * 15000);
    if (rank <= 40) return Math.floor(350000 - (rank - 30) * 10000);
    return Math.floor(250000 - (rank - 40) * 5000);
  };
  
  // 건수 계산 (건당 평균 25,000 ~ 35,000원)
  const generateOrders = (amount: number): number => {
    const avgPerOrder = 25000 + Math.random() * 10000;
    return Math.max(1, Math.round(amount / avgPerOrder));
  };
  
  const rankings: RankingData[] = [];
  
  // 50명의 랭킹 데이터 생성
  for (let i = 0; i < 50; i++) {
    const rank = i + 1;
    const totalAmount = generateAmount(rank);
    const totalOrders = generateOrders(totalAmount);
    
    rankings.push({
      rank,
      userId: `default-${rank}`,
      nickname: nicknames[i],
      region: regions[Math.floor(Math.random() * regions.length)],
      totalAmount,
      totalOrders,
      platform: selectPlatform(rank),
      vehicle: vehicles[Math.floor(Math.random() * vehicles.length)]
    });
  }
  
  return rankings;
};

const DEFAULT_RANKINGS = generateDefaultRankings();

export default function RankingPage() {
  const { user, userProfile, loading } = useAuth();
  // 기간 선택 (일간/주간)
  const [period, setPeriod] = useState('today');
  // 정렬 기준 (금액/건수)
  const [sortBy, setSortBy] = useState('amount');
  // 지역 필터
  const [region, setRegion] = useState('all');
  // 플랫폼 필터 추가
  const [platform, setPlatform] = useState('all');
  const [rankings, setRankings] = useState<RankingData[]>(DEFAULT_RANKINGS);
  const [rankingLoading, setRankingLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<RankingData | null>(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [displayCount, setDisplayCount] = useState(10); // 표시할 랭킹 개수

  // 랭킹 데이터 가져오기
  useEffect(() => {
    const fetchRankings = async () => {
      setRankingLoading(true);
      try {
        let data: RankingData[] = [];
        if (period === 'today') {
          data = await getTodayRanking() as unknown as RankingData[];
        } else if (period === 'week') {
          data = await getWeeklyRanking() as unknown as RankingData[];
        } else {
          data = await getMonthlyRanking() as unknown as RankingData[];
        }
        
        // 데이터가 없으면 기본 데이터 사용
        if (!data || data.length === 0) {
          data = DEFAULT_RANKINGS;
        }
        
        // 정렬 기준에 따라 데이터 정렬
        data.sort((a, b) => {
          if (sortBy === 'amount') {
            if (b.totalAmount !== a.totalAmount) {
              return b.totalAmount - a.totalAmount;
            }
            return b.totalOrders - a.totalOrders;
          } else {
            if (b.totalOrders !== a.totalOrders) {
              return b.totalOrders - a.totalOrders;
            }
            return b.totalAmount - a.totalAmount;
          }
        });

        // 필터 적용
        let filtered = data;
        if (region !== 'all') {
          filtered = filtered.filter(item => item.region && item.region.includes(region));
        }
        if (platform !== 'all') {
          filtered = filtered.filter(item => item.platform && item.platform.includes(platform));
        }

        // 랭킹 순위 재계산 (공동 순위 처리)
        filtered = filtered.reduce((acc: RankingData[], curr, idx, arr) => {
          if (idx === 0) {
            curr.rank = 1;
          } else {
            const prev = arr[idx - 1];
            if (prev.totalAmount === curr.totalAmount && prev.totalOrders === curr.totalOrders) {
              curr.rank = prev.rank;
            } else {
              curr.rank = idx + 1;
            }
          }
          return [...acc, curr];
        }, []);

        setRankings(filtered);
        setDisplayCount(10); // 필터 변경 시 표시 개수 초기화
      } catch (error) {
        console.error('랭킹 데이터 가져오기 오류:', error);
        setRankings(DEFAULT_RANKINGS);
      } finally {
        setRankingLoading(false);
      }
    };

    fetchRankings();
  }, [period, sortBy, region, platform]);

  const handleShareMyRank = () => {
    console.log('내 순위 자랑하기 버튼 클릭됨');
    
    if (!userProfile) {
      toast.error('로그인이 필요한 기능입니다.');
      return;
    }
    
    // 현재 필터 조건에서 내 순위 찾기
    const myRank = rankings.find(r => r.userId === userProfile.id);
    
    // 선택된 지역이 내 지역이 아닌 경우 공유 불가
    if (region !== 'all' && userProfile.region !== region) {
      toast.error('선택한 지역의 순위만 공유할 수 있습니다.');
      return;
    }

    // 선택된 플랫폼이 내 플랫폼이 아닌 경우 공유 불가
    if (platform !== 'all' && myRank?.platform !== platform) {
      toast.error('선택한 플랫폼의 순위만 공유할 수 있습니다.');
      return;
    }
    
    if (!myRank) {
      toast.error('현재 조건에서의 순위 정보가 없습니다.');
      return;
    }

    if (
      myRank.rank !== undefined &&
      myRank.totalAmount !== undefined &&
      myRank.totalOrders !== undefined
    ) {
      // 동적 공유 메시지 생성
      const periodText = period === 'today' ? '오늘' : period === 'week' ? '이번 주' : '이번 달';
      const regionText = region === 'all' ? '전국' : region;
      const platformText = platform === 'all' ? '전체 플랫폼' : platform;
      shareRanking({
        rank: myRank.rank,
        totalAmount: myRank.totalAmount,
        deliveryCount: myRank.totalOrders,
        platform: platformText,
        period: periodText,
        region: regionText
      });
    } else {
      toast.error('순위 정보가 없습니다.');
    }
  };

  const handleUserClick = (ranker: RankingData) => {
    setSelectedUser(ranker);
    setShowUserModal(true);
  };

  const closeUserModal = () => {
    setShowUserModal(false);
    setSelectedUser(null);
  };

  const getVehicleIcon = (vehicle?: string) => {
    switch (vehicle) {
      case 'motorcycle':
        return <FaMotorcycle className="text-white" size={20} />;
      case 'bicycle':
        return <FaBicycle className="text-white" size={20} />;
      case 'car':
        return <FaCar className="text-white" size={20} />;
      case 'walk':
        return <FaWalking className="text-white" size={20} />;
      default:
        return <FaMotorcycle className="text-white" size={20} />;
    }
  };

  const getVehicleText = (vehicle?: string) => {
    switch (vehicle) {
      case 'motorcycle':
        return '오토바이';
      case 'bicycle':
        return '자전거';
      case 'car':
        return '자동차';
      case 'walk':
        return '도보';
      default:
        return '오토바이';
    }
  };

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="relative z-10">
      <div className="max-w-3xl mx-auto px-4">
        {/* 통합된 랭킹 섹션 */}
        <section className="mb-4 mt-2">
          <div className="bg-gradient-to-br from-purple-900/30 to-pink-900/30 backdrop-blur-lg rounded-3xl p-3 sm:p-6 shadow-2xl border border-purple-500/30 relative overflow-hidden">
            {/* 배경 애니메이션 효과 */}
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 via-pink-600/10 to-purple-600/10 animate-pulse"></div>
            
            <div className="relative z-10">
              {/* 헤더 - 실시간 Top 3 스타일 */}
              <div className="text-center mb-3 sm:mb-6">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <FaTrophy className="text-yellow-400 animate-bounce w-4 h-4 sm:w-7 sm:h-7" />
                  <h2 className="text-lg sm:text-2xl md:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-orange-400 to-pink-400">
                    실시간 랭킹
                  </h2>
                  <FaTrophy className="text-yellow-400 animate-bounce w-4 h-4 sm:w-7 sm:h-7" />
                </div>
                <p className="text-purple-200 text-xs">
                  {rankings.length}명의 배달킹이 함께 달리는중! 🚀
                </p>
              </div>

              {/* 내 순위 정보 */}
              {user && (
                <div className="mb-3 sm:mb-4 bg-gradient-to-r from-amber-400/20 to-orange-500/20 backdrop-blur-sm rounded-xl p-3 sm:p-4 border border-amber-400/30">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-amber-200 text-xs sm:text-sm mb-1">내 순위</p>
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-orange-400 to-pink-400">
                          {rankings.findIndex(r => r.userId === user.id) + 1 || '?'}위
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-3 sm:gap-4">
                      <div className="text-right">
                        <p className="text-amber-200 text-xs sm:text-sm mb-1">오늘 수익</p>
                        <p className="text-base sm:text-lg font-bold text-white">
                          {rankings.find(r => r.userId === user.id)?.totalAmount.toLocaleString() || '0'}원
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-amber-200 text-xs sm:text-sm mb-1">오늘 건수</p>
                        <p className="text-base sm:text-lg font-bold text-white">
                          {rankings.find(r => r.userId === user.id)?.totalOrders || '0'}건
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 자랑하기 버튼 */}
              {user && (
                <button
                  onClick={handleShareMyRank}
                  className="w-full bg-gradient-to-r from-purple-400 to-pink-500 hover:from-purple-500 hover:to-pink-600 text-white font-bold py-2.5 px-4 rounded-xl shadow-lg hover:shadow-xl transition-all hover:scale-[1.02] flex items-center justify-center gap-2"
                >
                  <FaShare className="text-white w-3.5 h-3.5" />
                  <span className="text-sm">내 순위 자랑하기</span>
                </button>
              )}
            </div>
          </div>
        </section>

        {/* 광고 - 실시간 랭킹 하단으로 이동 */}
        <section className="mb-4">
          <KakaoAdGlobal page="ranking" index={0} />
        </section>

        {/* 통합된 필터 및 랭킹 섹션 */}
        <section className="mb-2">
          <div className="bg-gradient-to-br from-purple-900/30 to-pink-900/30 backdrop-blur-lg rounded-3xl p-3 sm:p-6 shadow-2xl border border-purple-500/30 relative overflow-hidden">
            {/* 배경 애니메이션 효과 */}
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 via-pink-600/10 to-purple-600/10 animate-pulse"></div>
            
            <div className="relative z-10">
              {/* 헤더 - 실시간 Top 3 스타일 */}
              <div className="text-center mb-3 sm:mb-6">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <FaChartLine className="text-purple-400 animate-bounce w-4 h-4 sm:w-7 sm:h-7" />
                  <h2 className="text-lg sm:text-2xl md:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-orange-400 to-pink-400">
                    전체 랭킹
                  </h2>
                  <FaChartLine className="text-purple-400 animate-bounce w-4 h-4 sm:w-7 sm:h-7" />
                </div>
                <p className="text-purple-200 text-xs">자세한 순위를 확인하세요! 📊</p>
              </div>

              {/* 필터 섹션 */}
              <div className="space-y-3 mb-3 sm:mb-4">
                {/* 기간 선택 */}
                <div className="flex gap-2">
                  {[
                    { value: 'today', label: '일간', Icon: FaStar },
                    { value: 'week', label: '주간', Icon: FaFireAlt },
                    { value: 'month', label: '월간', Icon: FaCrown }
                  ].map((p) => (
                    <button
                      key={p.value}
                      type="button"
                      onClick={() => setPeriod(p.value)}
                      className={`
                        flex-1 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2
                        ${period === p.value
                          ? 'bg-gradient-to-r from-purple-400 to-pink-500 text-white shadow-lg'
                          : 'bg-white/10 text-purple-200 hover:text-white hover:bg-white/20'}
                      `}
                    >
                      <p.Icon className="w-3 h-3 sm:w-4 sm:h-4" />
                      {p.label}
                    </button>
                  ))}
                </div>

                {/* 정렬 기준 선택 */}
                <div className="flex gap-2">
                  {[
                    { value: 'amount', label: '금액순', Icon: FaCoins },
                    { value: 'count', label: '건수순', Icon: FaList }
                  ].map((s) => (
                    <button
                      key={s.value}
                      type="button"
                      onClick={() => setSortBy(s.value)}
                      className={`
                        flex-1 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2
                        ${sortBy === s.value
                          ? 'bg-gradient-to-r from-purple-400 to-pink-500 text-white shadow-lg'
                          : 'bg-white/10 text-purple-200 hover:text-white hover:bg-white/20'}
                      `}
                    >
                      <s.Icon className="w-3 h-3 sm:w-4 sm:h-4" />
                      {s.label}
                    </button>
                  ))}
                </div>

                {/* 플랫폼 선택 */}
                <div className="flex gap-2">
                  {[
                    { value: 'all', label: '전체', Icon: FaUsers },
                    { value: '배민커넥트', label: '배민커넥트' },
                    { value: '쿠팡이츠', label: '쿠팡이츠' }
                  ].map((p) => (
                    <button
                      key={p.value}
                      type="button"
                      onClick={() => setPlatform(p.value)}
                      className={`
                        flex-1 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2
                        ${platform === p.value
                          ? 'bg-gradient-to-r from-purple-400 to-pink-500 text-white shadow-lg'
                          : 'bg-white/10 text-purple-200 hover:text-white hover:bg-white/20'}
                      `}
                    >
                      {p.Icon && <p.Icon className="w-3 h-3 sm:w-4 sm:h-4" />}
                      {p.label}
                    </button>
                  ))}
                </div>

                {/* 지역 선택 - 필터 제일 하단으로 이동 */}
                <div className="relative">
                  <select
                    value={region}
                    onChange={(e) => setRegion(e.target.value)}
                    className="w-full py-2 px-3 rounded-xl bg-white/10 text-white border border-purple-400/30 focus:outline-none focus:border-purple-400/50 focus:ring-2 focus:ring-purple-400/20 appearance-none cursor-pointer text-xs sm:text-sm"
                  >
                    <option value="all" className="bg-slate-900">전체 지역</option>
                    <option value="서울" className="bg-slate-900">서울</option>
                    <option value="부산" className="bg-slate-900">부산</option>
                    <option value="대구" className="bg-slate-900">대구</option>
                    <option value="인천" className="bg-slate-900">인천</option>
                    <option value="광주" className="bg-slate-900">광주</option>
                    <option value="대전" className="bg-slate-900">대전</option>
                    <option value="울산" className="bg-slate-900">울산</option>
                    <option value="세종" className="bg-slate-900">세종</option>
                    <option value="경기" className="bg-slate-900">경기</option>
                    <option value="강원" className="bg-slate-900">강원</option>
                    <option value="충북" className="bg-slate-900">충북</option>
                    <option value="충남" className="bg-slate-900">충남</option>
                    <option value="전북" className="bg-slate-900">전북</option>
                    <option value="전남" className="bg-slate-900">전남</option>
                    <option value="경북" className="bg-slate-900">경북</option>
                    <option value="경남" className="bg-slate-900">경남</option>
                    <option value="제주" className="bg-slate-900">제주</option>
                  </select>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                    <FaChevronDown className="w-3 h-3 text-purple-200" />
                  </div>
                </div>
              </div>

              {/* 구분선 */}
              <div className="border-t border-purple-400/20 mb-3 sm:mb-4"></div>

              {/* 랭킹 목록 - 실시간 Top3 스타일 */}
              <div className="space-y-3">
                {rankings.length > 0 ? (
                  rankings.slice(0, displayCount).map((ranker, index) => (
                    <div 
                      key={ranker.rank}
                      className={`
                        relative transition-all duration-300 hover:scale-[1.02]
                      `}
                    >
                      <button
                        onClick={() => handleUserClick(ranker)}
                        className={`
                          w-full flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-2xl sm:rounded-3xl shadow-lg text-left
                          transition-all duration-300 hover:scale-[1.02] relative overflow-hidden
                          ${index === 0 
                            ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white' 
                            : index === 1 
                              ? 'bg-gradient-to-r from-gray-300 to-gray-500 text-white'
                              : index === 2
                                ? 'bg-gradient-to-r from-amber-600 to-amber-800 text-white'
                                : ranker.userId === user?.id 
                                  ? 'bg-gradient-to-r from-purple-400/80 to-pink-500/80 text-white'
                                  : 'bg-white/10 hover:bg-white/20 text-white'}
                        `}
                      >
                        {/* 순위 메달 */}
                        <div className="relative flex-shrink-0">
                          <div className={`
                            w-10 h-10 sm:w-16 sm:h-16 rounded-full flex items-center justify-center
                            ${index === 0 
                              ? 'bg-white/30 shadow-2xl' 
                              : index <= 2
                                ? 'bg-white/20'
                                : 'bg-white/10'
                            }
                          `}>
                            {index === 0 ? (
                              <FaCrown className="text-white drop-shadow-lg w-5 h-5 sm:w-8 sm:h-8" />
                            ) : index === 1 ? (
                              <FaMedal className="text-white w-4 h-4 sm:w-7 sm:h-7" />
                            ) : index === 2 ? (
                              <FaStar className="text-white w-3.5 h-3.5 sm:w-6 sm:h-6" />
                            ) : (
                              <span className="text-white font-black text-base sm:text-xl">
                                {ranker.rank || index + 1}
                              </span>
                            )}
                          </div>
                          {index < 3 && (
                            <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 sm:w-6 sm:h-6 bg-white/90 rounded-full flex items-center justify-center">
                              <span className="text-black font-black text-xs">{index + 1}</span>
                            </div>
                          )}
                        </div>

                        {/* 정보 영역 */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1 mb-0.5">
                            <span className={`
                              font-black truncate 
                              ${index === 0 ? 'text-base sm:text-2xl' : 
                                index <= 2 ? 'text-sm sm:text-xl' : 
                                'text-sm sm:text-base'}
                              text-white
                            `}>
                              {ranker.nickname}
                            </span>
                            {ranker.userId === user?.id && (
                              <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">나</span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-xs opacity-80">
                            <span className="flex items-center gap-0.5">
                              <FaMapMarkerAlt className="w-2 h-2 sm:w-3 sm:h-3" />
                              <span className="text-xs">{ranker.region}</span>
                            </span>
                          </div>
                        </div>

                        {/* 실적 영역 - 우측 정렬 강화 */}
                        <div className="text-right flex-shrink-0 ml-auto">
                          <div className={`
                            font-black mb-0.5 whitespace-nowrap text-white
                            ${index === 0 ? 'text-sm sm:text-2xl' : 
                              index <= 2 ? 'text-xs sm:text-xl' : 
                              'text-xs sm:text-base'}
                          `}>
                            {ranker.totalAmount.toLocaleString()}원
                          </div>
                          <div className="flex justify-end">
                            <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs whitespace-nowrap">
                              {ranker.totalOrders}건
                            </span>
                          </div>
                        </div>

                        {/* 1등 추가 효과 */}
                        {index === 0 && (
                          <>
                            <div className="absolute -top-1 -left-1 w-4 h-4 sm:w-8 sm:h-8 bg-yellow-300 rounded-full animate-ping opacity-30"></div>
                            <div className="absolute -bottom-1 -right-1 w-3 h-3 sm:w-6 sm:h-6 bg-orange-300 rounded-full animate-ping opacity-30 animation-delay-200"></div>
                          </>
                        )}
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <p className="text-purple-200">아직 랭킹 데이터가 없습니다.</p>
                  </div>
                )}
              
              {/* 더보기 버튼 */}
                {rankings.length > displayCount && displayCount < 50 && (
                  <div className="mt-4 text-center">
                    <button
                      onClick={() => setDisplayCount(Math.min(displayCount + 10, 50))}
                      className="px-6 py-2 bg-gradient-to-r from-purple-400 to-pink-500 hover:from-purple-500 hover:to-pink-600 text-white rounded-xl font-bold text-xs sm:text-sm transition-all shadow-lg"
                    >
                      더보기 ({displayCount}/{Math.min(rankings.length, 50)})
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* 사용자 상세 정보 모달 */}
      {showUserModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gradient-to-br from-purple-900/30 to-pink-900/30 backdrop-blur-lg rounded-3xl p-3 sm:p-6 shadow-2xl border border-purple-500/30 max-w-md w-full max-h-[80vh] overflow-y-auto relative overflow-hidden">
            {/* 배경 애니메이션 효과 */}
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 via-pink-600/10 to-purple-600/10 animate-pulse"></div>
            
            <div className="relative z-10">
              {/* 헤더 - 실시간 Top 3 스타일 */}
              <div className="text-center mb-3 sm:mb-6">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <FaUser className="text-purple-400 animate-bounce w-4 h-4 sm:w-7 sm:h-7" />
                  <h2 className="text-lg sm:text-2xl md:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-orange-400 to-pink-400">
                    라이더 정보
                  </h2>
                  <FaUser className="text-purple-400 animate-bounce w-4 h-4 sm:w-7 sm:h-7" />
                </div>
                <p className="text-purple-200 text-xs">상세 정보를 확인하세요! 👤</p>
              </div>

              {/* 닫기 버튼 */}
              <button
                onClick={closeUserModal}
                className="absolute top-2 right-2 w-8 h-8 bg-white/20 rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-all"
              >
                <FaTimes size={16} />
              </button>

              {/* 프로필 이미지 */}
              <div className="flex justify-center mb-3 sm:mb-4">
                <div className="w-16 h-16 sm:w-24 sm:h-24 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full flex items-center justify-center">
                  <FaUser size={24} className="text-white sm:w-10 sm:h-10" />
                </div>
              </div>

              {/* 닉네임과 순위 */}
              <div className="text-center mb-3 sm:mb-6">
                <h2 className="text-xl sm:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-orange-400 to-pink-400 mb-1">{selectedUser.nickname}</h2>
                <div className="flex items-center justify-center gap-2">
                  <FaTrophy className="text-yellow-400 w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="text-white text-sm sm:text-base">현재 {selectedUser.rank}위</span>
                </div>
              </div>

              {/* 상세 정보 */}
              <div className="space-y-2 sm:space-y-3 mb-3 sm:mb-4">
                <div className="bg-gradient-to-r from-amber-400/20 to-orange-500/20 backdrop-blur-sm rounded-xl p-2.5 sm:p-3 border border-amber-400/30">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FaMapMarkerAlt className="text-amber-200 w-3 h-3 sm:w-4 sm:h-4" />
                      <span className="text-amber-200 text-xs sm:text-sm">지역</span>
                    </div>
                    <span className="text-white font-bold text-xs sm:text-sm">{selectedUser.region}</span>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-purple-400/20 to-pink-500/20 backdrop-blur-sm rounded-xl p-2.5 sm:p-3 border border-purple-400/30">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getVehicleIcon(selectedUser.vehicle)}
                      <span className="text-purple-200 text-xs sm:text-sm">운송수단</span>
                    </div>
                    <span className="text-white font-bold text-xs sm:text-sm">{getVehicleText(selectedUser.vehicle)}</span>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-yellow-400/20 to-orange-500/20 backdrop-blur-sm rounded-xl p-2.5 sm:p-3 border border-yellow-400/30">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FaCoins className="text-yellow-200 w-3 h-3 sm:w-4 sm:h-4" />
                      <span className="text-yellow-200 text-xs sm:text-sm">
                        {period === 'today' ? '오늘' : period === 'week' ? '이번 주' : '이번 달'} 수익
                      </span>
                    </div>
                    <span className="text-white font-bold text-xs sm:text-sm">{selectedUser.totalAmount.toLocaleString()}원</span>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-green-400/20 to-emerald-500/20 backdrop-blur-sm rounded-xl p-2.5 sm:p-3 border border-green-400/30">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FaList className="text-green-200 w-3 h-3 sm:w-4 sm:h-4" />
                      <span className="text-green-200 text-xs sm:text-sm">
                        {period === 'today' ? '오늘' : period === 'week' ? '이번 주' : '이번 달'} 건수
                      </span>
                    </div>
                    <span className="text-white font-bold text-xs sm:text-sm">{selectedUser.totalOrders}건</span>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-blue-400/20 to-cyan-500/20 backdrop-blur-sm rounded-xl p-2.5 sm:p-3 border border-blue-400/30">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FaCamera className="text-blue-200 w-3 h-3 sm:w-4 sm:h-4" />
                      <span className="text-blue-200 text-xs sm:text-sm">플랫폼</span>
                    </div>
                    <span className="text-white font-bold text-xs sm:text-sm">{selectedUser.platform}</span>
                  </div>
                </div>
              </div>

              {/* 닫기 버튼 */}
              <button
                onClick={closeUserModal}
                className="w-full bg-gradient-to-r from-purple-400 to-pink-500 hover:from-purple-500 hover:to-pink-600 text-white font-bold py-2.5 px-4 rounded-xl shadow-lg hover:shadow-xl transition-all hover:scale-[1.02] flex items-center justify-center gap-2"
              >
                <FaTimes className="text-white w-3.5 h-3.5" />
                <span className="text-sm">닫기</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
} 
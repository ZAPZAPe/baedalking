"use client";

import { useAuth } from '@/contexts/AuthContext';
import { useState, useEffect, useCallback, memo, Suspense } from 'react';
import { getTodayRanking, RankingData } from '@/services/rankingService';
import { UserProfile } from '@/components/home/UserProfile';
import { TopRankers } from '@/components/home/TopRankers';
import { PlatformStatistics } from '@/components/home/PlatformStatistics';
import Link from 'next/link';
import { FaCrown, FaTrophy, FaUpload, FaUsers, FaStar, FaMedal, FaChartLine, FaFireAlt, FaBell, FaGift, FaCamera, FaSignInAlt, FaRocket, FaShieldAlt, FaCoins, FaArrowRight, FaPlay, FaHeart, FaBolt, FaStore, FaUserFriends, FaShare, FaComment, FaCalendarCheck, FaMapMarker } from 'react-icons/fa';
import { useRouter } from 'next/navigation';
import { initKakaoShare, inviteFriends } from '@/services/kakaoShare';
import KakaoAd from '@/components/KakaoAd';
import Loading from '@/components/Loading';

const DEFAULT_RANKERS: RankingData[] = [
  { rank: 1, userId: '', nickname: '배달왕', region: '서울', totalAmount: 2850000, totalOrders: 89, platform: '배민커넥트', vehicle: 'motorcycle' },
  { rank: 2, userId: '', nickname: '음식마니아', region: '부산', totalAmount: 2650000, totalOrders: 82, platform: '쿠팡이츠', vehicle: 'bicycle' },
  { rank: 3, userId: '', nickname: '맛집탐험가', region: '대구', totalAmount: 2450000, totalOrders: 76, platform: '배민커넥트', vehicle: 'motorcycle' }
];

// TopRankers 컴포넌트를 메모이제이션하여 성능 개선
const TopRankersSection = memo(({ rankers }: { rankers: RankingData[] }) => (
  <div className="bg-gradient-to-br from-purple-900/30 to-pink-900/30 backdrop-blur-lg rounded-3xl p-4 sm:p-6 shadow-2xl border border-purple-500/30 relative overflow-hidden">
    {/* 배경 애니메이션 효과 */}
    <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 via-pink-600/10 to-purple-600/10 animate-pulse"></div>
    
    <div className="relative z-10">
      {/* 헤더 */}
      <div className="text-center mb-4 sm:mb-6">
        <div className="flex items-center justify-center gap-2 sm:gap-3 mb-2">
          <FaTrophy className="text-yellow-400 animate-bounce w-5 h-5 sm:w-7 sm:h-7" />
          <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-orange-400 to-pink-400">
            실시간 TOP 3
          </h2>
          <FaTrophy className="text-yellow-400 animate-bounce w-5 h-5 sm:w-7 sm:h-7" />
        </div>
        <p className="text-purple-200 text-xs sm:text-sm">오늘의 배달 챔피언들 🔥</p>
      </div>

      {/* 랭킹 카드들 */}
      <div className="space-y-3 sm:space-y-4">
        {rankers.map((ranker, index) => (
          <div 
            key={ranker.rank}
            className={`
              relative group transition-all duration-500 hover:scale-[1.02] sm:hover:scale-[1.03] hover:rotate-0 sm:hover:rotate-1
              ${index === 0 ? 'mb-4 sm:mb-6' : ''}
            `}
          >
            {/* 1등 특별 효과 */}
            {index === 0 && (
              <div className="absolute -inset-1 bg-gradient-to-r from-yellow-400 via-orange-400 to-pink-400 rounded-2xl blur-lg opacity-75 group-hover:opacity-100 animate-pulse"></div>
            )}
            
            <div 
              className={`
                relative flex items-center gap-3 sm:gap-4 p-3 sm:p-5 rounded-2xl shadow-xl
                ${index === 0 
                  ? 'bg-gradient-to-r from-yellow-400 via-orange-400 to-pink-400 text-white' 
                  : index === 1 
                    ? 'bg-gradient-to-r from-slate-400 to-slate-600 text-white'
                    : 'bg-gradient-to-r from-amber-600 to-amber-800 text-white'
                }
              `}
            >
              {/* 순위 메달 */}
              <div className="relative flex-shrink-0">
                <div className={`
                  w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center
                  ${index === 0 
                    ? 'bg-white/30 shadow-2xl' 
                    : 'bg-white/20'
                  }
                `}>
                  {index === 0 ? (
                    <FaCrown className="text-white drop-shadow-lg w-6 h-6 sm:w-8 sm:h-8" />
                  ) : index === 1 ? (
                    <FaMedal className="text-white w-5 h-5 sm:w-7 sm:h-7" />
                  ) : (
                    <FaStar className="text-white w-4 h-4 sm:w-6 sm:h-6" />
                  )}
                </div>
                <div className="absolute -bottom-1 -right-1 w-5 h-5 sm:w-6 sm:h-6 bg-white/90 rounded-full flex items-center justify-center">
                  <span className="text-black font-black text-xs sm:text-sm">{index + 1}</span>
                </div>
              </div>

              {/* 정보 영역 */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`font-black truncate ${index === 0 ? 'text-lg sm:text-2xl' : 'text-base sm:text-xl'}`}>
                    {ranker.nickname}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs sm:text-sm opacity-90">
                  <span className="flex items-center gap-1">
                    <FaMapMarker className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                    {ranker.region}
                  </span>
                </div>
              </div>

              {/* 실적 영역 */}
              <div className="text-right flex-shrink-0">
                <div className={`font-black ${index === 0 ? 'text-base sm:text-2xl' : 'text-sm sm:text-xl'} mb-1`}>
                  {ranker.totalAmount.toLocaleString()}원
                </div>
                <div className="flex items-center gap-2 text-xs sm:text-sm opacity-90">
                  <span className="bg-white/20 px-1.5 sm:px-2 py-0.5 rounded-full">
                    {ranker.totalOrders}건
                  </span>
                </div>
              </div>

              {/* 1등 추가 효과 */}
              {index === 0 && (
                <>
                  <div className="absolute -top-2 -left-2 w-6 h-6 sm:w-8 sm:h-8 bg-yellow-300 rounded-full animate-ping opacity-30"></div>
                  <div className="absolute -bottom-2 -right-2 w-4 h-4 sm:w-6 sm:h-6 bg-orange-300 rounded-full animate-ping opacity-30 animation-delay-200"></div>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* 하단 CTA */}
      <div className="mt-4 sm:mt-6 text-center">
        <Link 
          href="/ranking" 
          prefetch={true}
          className="inline-flex items-center justify-center gap-2 w-full bg-gradient-to-r from-purple-400 to-pink-500 hover:from-purple-500 hover:to-pink-600 text-white font-bold py-3 px-4 rounded-xl shadow-lg hover:shadow-xl transition-all hover:scale-[1.02]"
        >
          <FaTrophy className="text-white w-4 h-4" />
          <span className="text-sm">전체 랭킹 보기</span>
        </Link>
      </div>
    </div>
  </div>
));

TopRankersSection.displayName = 'TopRankersSection';

// 스켈레톤 UI 컴포넌트
const SkeletonLoader = () => (
  <div className="animate-pulse">
    <div className="bg-gradient-to-br from-purple-900/30 to-pink-900/30 backdrop-blur-lg rounded-3xl p-4 sm:p-6 shadow-2xl border border-purple-500/30">
      <div className="h-8 bg-white/20 rounded-lg w-48 mx-auto mb-4"></div>
      <div className="space-y-3">
        <div className="h-20 bg-white/20 rounded-xl"></div>
        <div className="h-20 bg-white/20 rounded-xl"></div>
        <div className="h-20 bg-white/20 rounded-xl"></div>
      </div>
    </div>
  </div>
);

// 사용자 프로필 스켈레톤
const UserProfileSkeleton = () => (
  <div className="animate-pulse">
    <div className="bg-gradient-to-br from-purple-900/30 to-pink-900/30 backdrop-blur-lg rounded-3xl p-4 sm:p-6 shadow-2xl border border-purple-500/30">
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 bg-white/20 rounded-full"></div>
        <div className="flex-1">
          <div className="h-6 bg-white/20 rounded w-32 mb-2"></div>
          <div className="h-4 bg-white/20 rounded w-24"></div>
        </div>
      </div>
    </div>
  </div>
);

export default function Home() {
  const { user, userProfile, loading: authLoading } = useAuth();
  const router = useRouter();
  const [topRankers, setTopRankers] = useState<RankingData[]>(DEFAULT_RANKERS);
  const [loadingRanking, setLoadingRanking] = useState(true);
  const [hasLoadedRanking, setHasLoadedRanking] = useState(false);

  const fetchRanking = useCallback(async () => {
    try {
      const ranking = await getTodayRanking();
      setTopRankers(ranking.slice(0, 3).length > 0 ? ranking.slice(0, 3) : DEFAULT_RANKERS);
      setHasLoadedRanking(true);
    } catch (error) {
      console.error('랭킹 로드 실패:', error);
      // 에러 시 기본값 유지
    } finally {
      setLoadingRanking(false);
    }
  }, []);

  useEffect(() => {
    // 페이지 로드 시 즉시 랭킹 데이터 로드 (Auth와 독립적으로)
    if (!hasLoadedRanking) {
      fetchRanking();
    }
  }, [fetchRanking, hasLoadedRanking]);

  // 로그인 함수
  const handleLogin = () => {
    router.push('/login');
  };

  if (authLoading) {
    return <Loading />;
  }

  return (
    <div className="relative z-10">
      <div className="max-w-3xl mx-auto px-4">
        {/* 사용자별 콘텐츠 */}
        {authLoading ? (
          // Auth 로딩 중
          <>
            {/* 상단 광고 */}
            <section className="mt-2 mb-4">
              <KakaoAd page="home" index={0} />
            </section>
            
            <section className="mb-4">
              <UserProfileSkeleton />
            </section>
          </>
        ) : user && userProfile ? (
          // 로그인 상태
          <>
            {/* 상단 광고 */}
            <section className="mt-2 mb-4">
              <KakaoAd page="home" index={0} />
            </section>

            {/* 프로필 정보 */}
            <section className="mb-4">
              <UserProfile userProfile={userProfile} />
            </section>

            {/* 실시간 TOP3 */}
            <section className="mb-4">
              {loadingRanking ? (
                <SkeletonLoader />
              ) : (
                <TopRankersSection rankers={topRankers} />
              )}
            </section>

            {/* 중간 광고 */}
            <section className="mb-4">
              <KakaoAd page="home" index={1} />
            </section>

            {/* 플랫폼 건당 단가 */}
            <section className="mb-4">
              <Suspense fallback={
                <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-4 shadow-xl border border-white/20">
                  <div className="animate-pulse">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="h-20 bg-white/20 rounded-xl"></div>
                      <div className="h-20 bg-white/20 rounded-xl"></div>
                    </div>
                  </div>
                </div>
              }>
                <PlatformStatistics />
              </Suspense>
            </section>

            {/* 주요 기능 */}
            <section className="mb-4">
              <div className="bg-gradient-to-br from-purple-900/30 to-pink-900/30 backdrop-blur-lg rounded-3xl p-4 sm:p-6 shadow-2xl border border-purple-500/30 relative overflow-hidden">
                {/* 배경 애니메이션 효과 */}
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 via-pink-600/10 to-purple-600/10 animate-pulse"></div>
                
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-xl sm:text-2xl font-bold text-white">주요 기능</h2>
                      <p className="text-purple-200 text-xs sm:text-sm">오늘도 화이팅! 💪</p>
                    </div>
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-purple-400 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg animate-bounce">
                      <FaRocket className="text-white w-4 h-4 sm:w-5 sm:h-5" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 sm:gap-3">
                    <Link href="/upload" prefetch={true} className="bg-gradient-to-r from-amber-400/20 to-orange-500/20 rounded-xl p-3 sm:p-4 border border-amber-400/30 hover:scale-105 transition-all group hover:from-amber-400/30 hover:to-orange-500/30">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center group-hover:animate-pulse">
                          <FaCamera className="text-white w-4 h-4 sm:w-5 sm:h-5" />
                        </div>
                        <div>
                          <h3 className="text-white font-bold text-xs sm:text-sm">실적 업로드</h3>
                          <p className="text-amber-200 text-xs">AI 자동 분석</p>
                        </div>
                      </div>
                    </Link>

                    <Link href="/ranking" prefetch={true} className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-xl p-3 sm:p-4 border border-purple-400/30 hover:scale-105 transition-all group hover:from-purple-500/30 hover:to-pink-500/30">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-purple-400 to-pink-500 rounded-xl flex items-center justify-center group-hover:animate-pulse">
                          <FaTrophy className="text-white w-4 h-4 sm:w-5 sm:h-5" />
                        </div>
                        <div>
                          <h3 className="text-white font-bold text-xs sm:text-sm">실시간 랭킹</h3>
                          <p className="text-purple-200 text-xs">전국 라이더 순위</p>
                        </div>
                      </div>
                    </Link>

                    <Link href="/settings/points" prefetch={true} className="bg-gradient-to-r from-yellow-400/20 to-orange-500/20 rounded-xl p-3 sm:p-4 border border-yellow-400/30 hover:scale-105 transition-all group hover:from-yellow-400/30 hover:to-orange-500/30">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl flex items-center justify-center group-hover:animate-pulse">
                          <FaCalendarCheck className="text-white w-4 h-4 sm:w-5 sm:h-5" />
                        </div>
                        <div>
                          <h3 className="text-white font-bold text-xs sm:text-sm">출근도장</h3>
                          <p className="text-yellow-200 text-xs">매일 10P 지급</p>
                        </div>
                      </div>
                    </Link>

                    <Link href="/store" prefetch={true} className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-xl p-3 sm:p-4 border border-green-400/30 hover:scale-105 transition-all group hover:from-green-500/30 hover:to-emerald-500/30">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-green-400 to-emerald-500 rounded-xl flex items-center justify-center group-hover:animate-pulse">
                          <FaStore className="text-white w-4 h-4 sm:w-5 sm:h-5" />
                        </div>
                        <div>
                          <h3 className="text-white font-bold text-xs sm:text-sm">포인트 상점</h3>
                          <p className="text-green-200 text-xs">리워드 교환</p>
                        </div>
                      </div>
                    </Link>

                    <button onClick={inviteFriends} className="bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-xl p-3 sm:p-4 border border-blue-400/30 hover:scale-105 transition-all col-span-2 group hover:from-blue-500/30 hover:to-cyan-500/30">
                      <div className="flex items-center gap-2 sm:gap-3 justify-center">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-xl flex items-center justify-center group-hover:animate-pulse">
                          <FaShare className="text-white w-4 h-4 sm:w-5 sm:h-5" />
                        </div>
                        <div>
                          <h3 className="text-white font-bold text-xs sm:text-sm">친구 초대하기</h3>
                          <p className="text-blue-200 text-xs">카카오톡으로 공유</p>
                        </div>
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            </section>
          </>
        ) : (
          // 비로그인 상태
          <>
            {/* 상단 광고 */}
            <section className="mt-2 mb-4">
              <KakaoAd page="home" index={0} />
            </section>

            {/* 배달킹에 오신 것을 환영합니다 */}
            <section className="mb-4">
              <div className="bg-gradient-to-br from-purple-900/30 to-pink-900/30 backdrop-blur-lg rounded-3xl p-6 shadow-2xl border border-purple-500/30 text-center relative overflow-hidden">
                {/* 배경 애니메이션 효과 */}
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 via-pink-600/10 to-purple-600/10 animate-pulse"></div>
                
                <div className="relative z-10">
                  <div className="animate-bounce mb-4">
                    <FaCrown size={100} className="mx-auto text-yellow-400 drop-shadow-lg " />
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-orange-400 to-pink-400 mb-2">
                    배달킹에 <br></br> 오신 것을 환영합니다!
                  </h1>
                  <p className="text-purple-200 mb-6 text-sm sm:text-base">
                    전국 배달 라이더들의 실시간 랭킹 서비스
                  </p>

                  <div className="space-y-2">
                    <Link 
                      href="/login" 
                      prefetch={true}
                      className="block w-full bg-[#FEE500] text-[#000000D9] py-3 px-4 rounded-xl font-bold hover:bg-[#FDD835] hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-[#FEE500]/50 transition-all shadow-lg"
                    >
                      <div className="flex items-center justify-center gap-2">
                        <FaComment size={16} />
                        <span>카카오로 시작하기</span>
                      </div>
                    </Link>
                  </div>
                </div>
              </div>
            </section>

            {/* 중간 광고 */}
            <section className="mb-4">
              <KakaoAd page="home" index={1} />
            </section>

            {/* 실시간 TOP3 */}
            <section className="mb-4">
              {loadingRanking ? (
                <SkeletonLoader />
              ) : (
                <TopRankersSection rankers={topRankers} />
              )}
            </section>

            {/* 왜 배달킹인가? */}
            <section className="mb-4">
              <div className="bg-gradient-to-br from-purple-900/30 to-pink-900/30 backdrop-blur-lg rounded-3xl p-4 sm:p-6 shadow-2xl border border-purple-500/30 relative overflow-hidden">
                {/* 배경 애니메이션 효과 */}
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 via-pink-600/10 to-purple-600/10 animate-pulse"></div>
                
                <div className="relative z-10">
                  <h3 className="text-lg sm:text-xl font-bold text-white mb-4 text-center">왜 배달킹인가? 🎯</h3>
                  <div className="space-y-3">
                    <div className="bg-gradient-to-r from-amber-400/20 to-orange-500/20 rounded-xl p-3 border border-amber-400/30 hover:from-amber-400/30 hover:to-orange-500/30 transition-all group">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-amber-400/20 rounded-full flex items-center justify-center flex-shrink-0 group-hover:bg-amber-400/30">
                          <FaBolt size={14} className="text-amber-400" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-white font-bold text-sm">실시간 랭킹 시스템</h3>
                          <p className="text-amber-200 text-xs">매일 업데이트되는 전국 라이더 순위</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-xl p-3 border border-blue-400/30 hover:from-blue-500/30 hover:to-cyan-500/30 transition-all group">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-400/20 rounded-full flex items-center justify-center flex-shrink-0 group-hover:bg-blue-400/30">
                          <FaGift size={14} className="text-blue-400" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-white font-bold text-sm">포인트 리워드</h3>
                          <p className="text-blue-200 text-xs">실적 업로드로 포인트 적립</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-xl p-3 border border-purple-400/30 hover:from-purple-500/30 hover:to-pink-500/30 transition-all group">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-purple-400/20 rounded-full flex items-center justify-center flex-shrink-0 group-hover:bg-purple-400/30">
                          <FaShieldAlt size={14} className="text-purple-400" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-white font-bold text-sm">안전한 커뮤니티</h3>
                          <p className="text-purple-200 text-xs">검증된 라이더들만의 공간</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gradient-to-r from-yellow-400/20 to-orange-500/20 rounded-xl p-3 border border-yellow-400/30 hover:from-yellow-400/30 hover:to-orange-500/30 transition-all group">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-yellow-400/20 rounded-full flex items-center justify-center flex-shrink-0 group-hover:bg-yellow-400/30">
                          <FaCalendarCheck size={14} className="text-yellow-400" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-white font-bold text-sm">출근도장 시스템</h3>
                          <p className="text-yellow-200 text-xs">매일 출근하고 포인트 받기</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </>
        )}

        {/* 하단 광고 */}
        <section className="mb-2">
          <KakaoAd page="home" index={2} />
        </section>
      </div>
    </div>
  );
}

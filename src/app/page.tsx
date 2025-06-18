"use client";

import { useAuth } from '@/contexts/AuthContext';
import { useState, useEffect, useCallback, memo } from 'react';
import { getTodayRanking, RankingData } from '@/services/rankingService';
import { UserProfile } from '@/components/home/UserProfile';
import { TopRankers } from '@/components/home/TopRankers';
import { PlatformStatistics } from '@/components/home/PlatformStatistics';
import Link from 'next/link';
import { FaCrown, FaTrophy, FaUpload, FaUsers, FaStar, FaMedal, FaChartLine, FaFireAlt, FaBell, FaGift, FaCamera, FaSignInAlt, FaRocket, FaShieldAlt, FaCoins, FaArrowRight, FaPlay, FaHeart, FaBolt, FaStore, FaUserFriends, FaShare, FaComment, FaCalendarCheck } from 'react-icons/fa';
import { useRouter } from 'next/navigation';
import { initKakaoShare, inviteFriends } from '@/services/kakaoShare';
import KakaoAd from '@/components/KakaoAd';
import Loading from '@/components/Loading';

const DEFAULT_RANKERS: RankingData[] = [
  { rank: 1, userId: '', nickname: '배달왕', region: '서울', totalAmount: 2850000, totalOrders: 89, platform: '배민커넥트', bikeType: 'motorcycle' },
  { rank: 2, userId: '', nickname: '음식마니아', region: '부산', totalAmount: 2650000, totalOrders: 82, platform: '쿠팡이츠', bikeType: 'bicycle' },
  { rank: 3, userId: '', nickname: '맛집탐험가', region: '대구', totalAmount: 2450000, totalOrders: 76, platform: '배민커넥트', bikeType: 'motorcycle' }
];

// TopRankers 컴포넌트를 메모이제이션하여 성능 개선
const TopRankersSection = memo(({ rankers }: { rankers: RankingData[] }) => (
  <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 shadow-xl border border-white/20">
    <div className="text-center mb-4">
      <h2 className="text-2xl font-black text-white flex items-center justify-center gap-2">
        <FaFireAlt className="text-orange-400" size={24} />
        실시간 TOP 3
        <FaFireAlt className="text-orange-400" size={24} />
      </h2>
      <p className="text-blue-200 text-sm pt-2">지금 가장 열심히 달리고 있는 배달킹들!</p>
    </div>
    <div className="space-y-3">
      {rankers.map((ranker, index) => (
        <div 
          key={ranker.rank}
          className={`
            flex items-center gap-4 p-4 rounded-xl shadow-lg
            transition-all duration-300 hover:scale-[1.02]
            ${index === 0 
              ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-black' 
              : index === 1 
                ? 'bg-gradient-to-r from-gray-300 to-gray-500 text-black'
                : 'bg-gradient-to-r from-amber-600 to-amber-800 text-white'
            }
          `}
        >
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-white/20">
            <span className="text-2xl font-black">{index + 1}</span>
          </div>
          <div className="flex-1">
            <div className="font-black text-lg">{ranker.nickname}</div>
            <div className="text-sm opacity-80">{ranker.region}</div>
          </div>
          <div className="text-right">
            <div className="font-black text-lg">
              {ranker.totalAmount.toLocaleString()}원
            </div>
            <div className="text-sm opacity-80">
              {ranker.totalOrders}건
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
));

TopRankersSection.displayName = 'TopRankersSection';

export default function Home() {
  const { user, userProfile, loading } = useAuth();
  const router = useRouter();
  const [topRankers, setTopRankers] = useState<RankingData[]>(DEFAULT_RANKERS);
  const [loadingRanking, setLoadingRanking] = useState(true);

  const fetchRanking = useCallback(async () => {
    try {
      const ranking = await getTodayRanking();
      setTopRankers(ranking.slice(0, 3));
    } catch (error) {
      console.error('랭킹 로드 실패:', error);
      // 에러 시 기본값 유지
    } finally {
      setLoadingRanking(false);
    }
  }, []);

  useEffect(() => {
    fetchRanking();
  }, [fetchRanking]);

  // 카카오 공유 초기화
  useEffect(() => {
    initKakaoShare();
  }, []);

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="relative z-10">
      <div className="max-w-3xl mx-auto px-4">
        {/* 상단 광고 */}
        <section className="mt-2 mb-4">
          <KakaoAd page="home" index={0} />
        </section>

        {user && userProfile ? (
          <>
            {/* 사용자 프로필 */}
            <section className="mb-4">
              <UserProfile userProfile={userProfile} />
            </section>

            {/* 실시간 TOP3 */}
            <section className="mb-4">
              <TopRankers topRankers={topRankers} />
            </section>

            {/* 플랫폼별 실시간 통계 */}
            <section className="mb-4">
              <PlatformStatistics />
            </section>

            {/* 주요 기능 섹션 */}
            <section className="mb-4">
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-4 shadow-xl border border-white/20">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-2xl font-bold text-white">주요 기능</h2>
                    <p className="text-blue-200 text-sm">오늘도 화이팅!</p>
                  </div>
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-2xl flex items-center justify-center shadow-lg">
                    <FaRocket className="text-white" size={20} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Link href="/upload" prefetch={true} className="bg-gradient-to-r from-amber-400/20 to-orange-500/20 rounded-xl p-4 border border-amber-400/30 hover:scale-105 transition-all">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center">
                        <FaCamera className="text-white" size={18} />
                      </div>
                      <div>
                        <h3 className="text-white font-bold text-sm">실적 업로드</h3>
                        <p className="text-amber-200 text-xs">AI 자동 분석</p>
                      </div>
                    </div>
                  </Link>

                  <Link href="/ranking" prefetch={true} className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-xl p-4 border border-purple-400/30 hover:scale-105 transition-all">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-pink-500 rounded-xl flex items-center justify-center">
                        <FaTrophy className="text-white" size={18} />
                      </div>
                      <div>
                        <h3 className="text-white font-bold text-sm">실시간 랭킹</h3>
                        <p className="text-purple-200 text-xs">전국 라이더 순위</p>
                      </div>
                    </div>
                  </Link>

                  <Link href="/settings/points" prefetch={true} className="bg-gradient-to-r from-yellow-400/20 to-orange-500/20 rounded-xl p-4 border border-yellow-400/30 hover:scale-105 transition-all">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl flex items-center justify-center">
                        <FaCalendarCheck className="text-white" size={18} />
                      </div>
                      <div>
                        <h3 className="text-white font-bold text-sm">출근도장</h3>
                        <p className="text-yellow-200 text-xs">매일 10P 지급</p>
                      </div>
                    </div>
                  </Link>

                  <Link href="/store" prefetch={true} className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-xl p-4 border border-green-400/30 hover:scale-105 transition-all">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-emerald-500 rounded-xl flex items-center justify-center">
                        <FaStore className="text-white" size={18} />
                      </div>
                      <div>
                        <h3 className="text-white font-bold text-sm">포인트 상점</h3>
                        <p className="text-green-200 text-xs">리워드 교환</p>
                      </div>
                    </div>
                  </Link>

                  <button onClick={inviteFriends} className="bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-xl p-4 border border-blue-400/30 hover:scale-105 transition-all col-span-2">
                    <div className="flex items-center gap-3 justify-center">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-xl flex items-center justify-center">
                        <FaShare className="text-white" size={18} />
                      </div>
                      <div>
                        <h3 className="text-white font-bold text-sm">친구 초대하기</h3>
                        <p className="text-blue-200 text-xs">카카오톡으로 공유</p>
                      </div>
                    </div>
                  </button>
                </div>
              </div>
            </section>

            {/* 중간 광고 */}
            <section className="mb-4">
              <KakaoAd page="home" index={1} />
            </section>

            {/* 서비스 특징 */}
            <section className="mb-4">
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-4 shadow-xl border border-white/20">
                <h3 className="text-xl font-bold text-white mb-4 text-center">왜 배달킹인가?</h3>
                <div className="space-y-3">
                  <div className="bg-gradient-to-r from-amber-400/20 to-orange-500/20 rounded-xl p-3 border border-amber-400/30">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-amber-400/20 rounded-full flex items-center justify-center">
                        <FaBolt size={14} className="text-amber-400" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-white font-bold text-sm">실시간 랭킹 시스템</h3>
                        <p className="text-amber-200 text-xs">매일 업데이트되는 전국 라이더 순위</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-xl p-3 border border-blue-400/30">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-400/20 rounded-full flex items-center justify-center">
                        <FaGift size={14} className="text-blue-400" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-white font-bold text-sm">포인트 리워드</h3>
                        <p className="text-blue-200 text-xs">실적 업로드로 포인트 적립</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-xl p-3 border border-purple-400/30">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-purple-400/20 rounded-full flex items-center justify-center">
                        <FaShieldAlt size={14} className="text-purple-400" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-white font-bold text-sm">안전한 커뮤니티</h3>
                        <p className="text-purple-200 text-xs">검증된 라이더들만의 공간</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-yellow-400/20 to-orange-500/20 rounded-xl p-3 border border-yellow-400/30">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-yellow-400/20 rounded-full flex items-center justify-center">
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
            </section>
          </>
        ) : (
          <>
            {/* 비로그인 상태 - 환영 메시지 */}
            <section className="mb-4">
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 shadow-xl border border-white/20 text-center">
                <div className="animate-bounce mb-4">
                  <FaCrown size={60} className="mx-auto text-yellow-400 drop-shadow-lg" />
                </div>
                <h1 className="text-3xl font-black text-white mb-2">
                  배달킹에 오신 것을 환영합니다!
                </h1>
                <p className="text-blue-200 mb-6">
                  전국 배달 라이더들의 실시간 랭킹 서비스
                </p>

                <div className="space-y-2">
                  <Link 
                    href="/login" 
                    prefetch={true}
                    className="block w-full bg-[#FEE500] text-[#000000D9] py-3 px-4 rounded-xl font-bold hover:bg-[#FDD835] hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-[#FEE500]/50 transition-all"
                  >
                    <div className="flex items-center justify-center gap-2">
                      <FaComment size={16} />
                      <span>카카오로 시작하기</span>
                    </div>
                  </Link>
                </div>
              </div>
            </section>

            {/* 실시간 TOP3 */}
            <section className="mb-4">
              <TopRankers topRankers={topRankers} />
            </section>

            {/* 플랫폼별 실시간 통계 */}
            <section className="mb-4">
              <PlatformStatistics />
            </section>

            {/* 비 로그인 상태 광고 */}
            <section className="mb-4">
              <KakaoAd page="home" index={1} />
            </section>

            {/* 서비스 특징 */}
            <section className="mb-4">
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-4 shadow-xl border border-white/20">
                <h3 className="text-xl font-bold text-white mb-4 text-center">왜 배달킹인가?</h3>
                <div className="space-y-3">
                  <div className="bg-gradient-to-r from-amber-400/20 to-orange-500/20 rounded-xl p-3 border border-amber-400/30">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-amber-400/20 rounded-full flex items-center justify-center">
                        <FaBolt size={14} className="text-amber-400" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-white font-bold text-sm">실시간 랭킹 시스템</h3>
                        <p className="text-amber-200 text-xs">매일 업데이트되는 전국 라이더 순위</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-xl p-3 border border-blue-400/30">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-400/20 rounded-full flex items-center justify-center">
                        <FaGift size={14} className="text-blue-400" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-white font-bold text-sm">포인트 리워드</h3>
                        <p className="text-blue-200 text-xs">실적 업로드로 포인트 적립</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-xl p-3 border border-purple-400/30">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-purple-400/20 rounded-full flex items-center justify-center">
                        <FaShieldAlt size={14} className="text-purple-400" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-white font-bold text-sm">안전한 커뮤니티</h3>
                        <p className="text-purple-200 text-xs">검증된 라이더들만의 공간</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-yellow-400/20 to-orange-500/20 rounded-xl p-3 border border-yellow-400/30">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-yellow-400/20 rounded-full flex items-center justify-center">
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

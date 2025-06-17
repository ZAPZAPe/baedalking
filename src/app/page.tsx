"use client";

import { useAuth } from '@/contexts/AuthContext';
import { useState, useEffect, useCallback, memo } from 'react';
import { getTodayRanking, RankingData } from '@/services/rankingService';
import { UserProfile } from '@/components/home/UserProfile';
import Link from 'next/link';
import { FaCrown, FaTrophy, FaUpload, FaUsers, FaStar, FaMedal, FaChartLine, FaFireAlt, FaBell, FaGift, FaCamera, FaSignInAlt, FaRocket, FaShieldAlt, FaCoins, FaArrowRight, FaPlay, FaHeart, FaBolt, FaStore, FaUserFriends, FaShare, FaComment } from 'react-icons/fa';
import { useRouter } from 'next/navigation';
import { initKakaoShare, inviteFriends } from '@/services/kakaoShare';
import KakaoAd from '@/components/KakaoAd';

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
  const router = useRouter();
  const { user, userProfile, loading: authLoading } = useAuth();
  const [topRankers, setTopRankers] = useState<RankingData[]>(DEFAULT_RANKERS);
  const [rankingLoading, setRankingLoading] = useState(true);

  const fetchRanking = useCallback(async () => {
    try {
      const ranking = await getTodayRanking();
      setTopRankers(ranking.slice(0, 3));
    } catch (error) {
      console.error('랭킹 로드 실패:', error);
      // 에러 시 기본값 유지
    } finally {
      setRankingLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRanking();
  }, [fetchRanking]);

  // 카카오 공유 초기화
  useEffect(() => {
    initKakaoShare();
  }, []);

  // 로딩 중일 때 스켈레톤 UI 표시
  if (authLoading) {
    return (
      <div className="relative z-10">
        <div className="max-w-3xl mx-auto px-4">
          <div className="animate-pulse">
            <div className="h-[100px] bg-white/5 rounded-lg mb-4"></div>
            <div className="h-40 bg-white/10 rounded-2xl mb-4"></div>
            <div className="h-60 bg-white/10 rounded-2xl mb-4"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative z-10">
      <div className="max-w-3xl mx-auto px-4">
        {/* 상단 광고 */}
        <section className="mt-2 mb-4">
          <KakaoAd page="home" index={0} />
        </section>

        {user ? (
          <>
            {/* 내정보 */}
            <section className="mb-4">
              <UserProfile userProfile={userProfile} />
            </section>

            {/* 친구 초대 버튼 */}
            <section className="mb-4">
              <button
                onClick={() => {
                  try {
                    inviteFriends();
                  } catch (error) {
                    console.error('친구 초대 중 오류:', error);
                    alert('친구 초대 기능을 준비 중입니다. 잠시 후 다시 시도해주세요.');
                  }
                }}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 px-4 rounded-xl font-bold hover:shadow-lg hover:shadow-purple-500/25 hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-purple-400/50 transition-all flex items-center justify-center gap-2"
              >
                <FaShare size={18} />
                친구 초대하고 포인트 받기
              </button>
            </section>

            {/* 실시간 TOP3 */}
            <section className="mb-4">
              <TopRankersSection rankers={topRankers} />
            </section>

            {/* 빠른 메뉴 */}
            <section className="mb-4">
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <h2 className="text-xl font-bold mb-6 text-center">빠른 메뉴</h2>
                <div className="grid grid-cols-2 gap-4">
                  <Link href="/upload" className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-2">
                      <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                    </div>
                    <span className="text-sm font-medium text-gray-900">실적업로드</span>
                  </Link>
                  <Link href="/ranking" className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                    <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mb-2">
                      <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <span className="text-sm font-medium text-gray-900">랭킹보기</span>
                  </Link>
                  <Link href="/point-shop" className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-2">
                      <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <span className="text-sm font-medium text-gray-900">포인트 상점</span>
                  </Link>
                  <Link href="/history" className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                    <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mb-2">
                      <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    </div>
                    <span className="text-sm font-medium text-gray-900">실적 내역</span>
                  </Link>
                </div>
              </div>
            </section>
          </>
        ) : (
          <>
            {/* 메인 히어로 섹션 */}
            <section className="mb-4">
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 shadow-xl border border-white/20 text-center">
                <div className="animate-bounce mb-4">
                  <FaCrown size={60} className="mx-auto text-yellow-400 drop-shadow-lg" />
                </div>
                <h1 className="text-3xl font-black text-white mb-2">
                  배달킹
                </h1>
                <p className="text-lg text-blue-200 mb-1">
                  전국 배달 라이더들의
                </p>
                <p className="text-xl text-yellow-300 font-bold mb-4">
                  실적 경쟁 플랫폼
                </p>
                <div className="bg-gradient-to-r from-yellow-400/20 to-orange-500/20 rounded-xl p-4 border border-yellow-400/30 mb-4">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <FaRocket size={20} className="text-yellow-400" />
                    <h3 className="text-lg font-bold text-white">지금 가입하면</h3>
                  </div>
                  <p className="text-yellow-300 font-bold text-xl">500P 즉시 지급!</p>
                </div>
                <div className="space-y-2">
                  <Link 
                    href="/login" 
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

            {/* 비 로그인 상태 광고 */}
            <section className="mb-4">
              <KakaoAd page="home" index={1} />
            </section>

            {/* 실시간 TOP3 */}
            <section className="mb-4">
              <TopRankersSection rankers={topRankers} />
            </section>

            {/* 서비스 특징 */}
            <section className="mb-4">
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-4 shadow-xl border border-white/20">
                <h2 className="text-xl font-bold text-white text-center mb-3">
                  ⚡ 배달킹이 특별한 이유
                </h2>
                <div className="space-y-2">
                  <div className="bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-xl p-3 border border-blue-400/30">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-400/20 rounded-full flex items-center justify-center">
                        <FaCamera size={14} className="text-blue-400" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-white font-bold text-sm">실적 인증 시스템</h3>
                        <p className="text-blue-200 text-xs">배민/쿠팡이츠 캡처로 간편 업로드</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-xl p-3 border border-green-400/30">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-green-400/20 rounded-full flex items-center justify-center">
                        <FaTrophy size={14} className="text-green-400" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-white font-bold text-sm">실시간 랭킹</h3>
                        <p className="text-green-200 text-xs">전국 라이더들과 실시간 경쟁</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-xl p-3 border border-yellow-400/30">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-yellow-400/20 rounded-full flex items-center justify-center">
                        <FaCoins size={14} className="text-yellow-400" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-white font-bold text-sm">포인트 리워드</h3>
                        <p className="text-yellow-200 text-xs">업로드하고 랭킹 달성하면 포인트 지급</p>
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

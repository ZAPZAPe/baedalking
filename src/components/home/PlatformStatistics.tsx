'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';
import { FaTruck, FaMotorcycle, FaChartLine, FaFire, FaBolt, FaCoins, FaTrophy, FaMedal, FaStar } from 'react-icons/fa';
import { getPlatformTopRankers, RankingData } from '@/services/rankingService';

interface PlatformStat {
  platform: string;
  totalAmount: number;
  totalOrders: number;
  averagePerOrder: number;
  logo: string;
  color: string;
}

// 기본 플랫폼별 랭킹 데이터
const DEFAULT_PLATFORM_RANKERS = {
  baemin: [
    { rank: 1, userId: '', nickname: '배민왕', region: '강남', totalAmount: 285000, totalOrders: 12, platform: '배민커넥트', vehicle: 'motorcycle' },
    { rank: 2, userId: '', nickname: '스피드', region: '서초', totalAmount: 265000, totalOrders: 11, platform: '배민커넥트', vehicle: 'motorcycle' },
    { rank: 3, userId: '', nickname: '번개배달', region: '송파', totalAmount: 245000, totalOrders: 10, platform: '배민커넥트', vehicle: 'bicycle' }
  ] as RankingData[],
  coupang: [
    { rank: 1, userId: '', nickname: '쿠팡맨', region: '마포', totalAmount: 275000, totalOrders: 13, platform: '쿠팡이츠', vehicle: 'motorcycle' },
    { rank: 2, userId: '', nickname: '이츠왕', region: '용산', totalAmount: 255000, totalOrders: 11, platform: '쿠팡이츠', vehicle: 'bicycle' },
    { rank: 3, userId: '', nickname: '퀵배송', region: '성동', totalAmount: 235000, totalOrders: 9, platform: '쿠팡이츠', vehicle: 'motorcycle' }
  ] as RankingData[]
};

// 기본 플랫폼 통계 데이터
const DEFAULT_PLATFORM_STATS: PlatformStat[] = [
  {
    platform: '배민커넥트',
    totalAmount: 0,
    totalOrders: 0,
    averagePerOrder: 23750, // 예시 건당 단가
    logo: '/baemin-logo.svg',
    color: 'from-cyan-400 to-blue-500'
  },
  {
    platform: '쿠팡이츠',
    totalAmount: 0,
    totalOrders: 0,
    averagePerOrder: 21200, // 예시 건당 단가
    logo: '/coupang-logo.svg',
    color: 'from-green-400 to-emerald-500'
  }
];

export function PlatformStatistics() {
  const [stats, setStats] = useState<PlatformStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [platformRankers, setPlatformRankers] = useState<{
    baemin: RankingData[];
    coupang: RankingData[];
  }>(DEFAULT_PLATFORM_RANKERS);

  const fetchPlatformStats = useCallback(async (retryCount = 0) => {
    const MAX_RETRIES = 2;
    
    try {
      // platform_stats_realtime 뷰에서 이미 집계된 데이터 가져오기
      const { data, error } = await supabase
        .from('platform_stats_realtime')
        .select('*')
        .in('platform', ['배민커넥트', '쿠팡이츠']);

      if (error) throw error;

      // 통계 정리
      const platformStats: PlatformStat[] = ['배민커넥트', '쿠팡이츠'].map(platform => {
        const stat = data?.find(s => s.platform === platform);
        const defaultStat = DEFAULT_PLATFORM_STATS.find(s => s.platform === platform)!;
        
        return {
          platform,
          totalAmount: stat?.total_amount || 0,
          totalOrders: stat?.total_orders || 0,
          averagePerOrder: stat?.average_per_order || defaultStat.averagePerOrder, // 데이터 없으면 기본값 사용
          logo: defaultStat.logo,
          color: defaultStat.color
        };
      });

      setStats(platformStats);
    } catch (error) {
      console.error('플랫폼 통계 조회 오류:', error);
      
      // 재시도
      if (retryCount < MAX_RETRIES) {
        console.log(`플랫폼 통계 재시도 ${retryCount + 1}/${MAX_RETRIES}`);
        await new Promise(resolve => setTimeout(resolve, 1000)); // 1초 대기
        return fetchPlatformStats(retryCount + 1);
      }
      
      // 최종 실패 시 기본값 설정
      setStats(DEFAULT_PLATFORM_STATS);
    }
  }, []);

  const fetchPlatformRankers = useCallback(async (retryCount = 0) => {
    const MAX_RETRIES = 2;
    
    try {
      const rankers = await getPlatformTopRankers();
      // 데이터가 비어있으면 기본값 사용
      setPlatformRankers({
        baemin: rankers.baemin.length > 0 ? rankers.baemin : DEFAULT_PLATFORM_RANKERS.baemin,
        coupang: rankers.coupang.length > 0 ? rankers.coupang : DEFAULT_PLATFORM_RANKERS.coupang
      });
    } catch (error) {
      console.error('플랫폼별 랭킹 조회 오류:', error);
      
      // 재시도
      if (retryCount < MAX_RETRIES) {
        console.log(`플랫폼 랭킹 재시도 ${retryCount + 1}/${MAX_RETRIES}`);
        await new Promise(resolve => setTimeout(resolve, 1000)); // 1초 대기
        return fetchPlatformRankers(retryCount + 1);
      }
      
      // 최종 실패 시 기본값 유지
      setPlatformRankers(DEFAULT_PLATFORM_RANKERS);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    
    const loadData = async () => {
      try {
        if (mounted) setLoading(true);
        await Promise.all([
          fetchPlatformStats(),
          fetchPlatformRankers()
        ]);
      } catch (error) {
        console.error('데이터 로드 중 오류:', error);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    
    loadData();
    
    return () => {
      mounted = false;
    };
  }, [fetchPlatformStats, fetchPlatformRankers]);

  // 플랫폼별 비율 계산
  const baeminAvg = stats.find(s => s.platform === '배민커넥트')?.averagePerOrder || 0;
  const coupangAvg = stats.find(s => s.platform === '쿠팡이츠')?.averagePerOrder || 0;
  const totalAvg = baeminAvg + coupangAvg;
  const baeminPercent = totalAvg > 0 ? Math.round((baeminAvg / totalAvg) * 100) : 50;
  const coupangPercent = totalAvg > 0 ? Math.round((coupangAvg / totalAvg) * 100) : 50;

  // 실제 데이터 여부 확인
  const hasRealData = stats.some(s => s.totalOrders > 0);

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-purple-900/30 to-pink-900/30 backdrop-blur-lg rounded-3xl p-3 shadow-2xl border border-purple-500/30">
        <div className="animate-pulse">
          <div className="grid grid-cols-2 gap-3">
            <div className="h-20 bg-white/20 rounded-xl"></div>
            <div className="h-20 bg-white/20 rounded-xl"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-purple-900/30 to-pink-900/30 backdrop-blur-lg rounded-3xl p-3 sm:p-6 shadow-2xl border border-purple-500/30 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 via-pink-600/10 to-purple-600/10 animate-pulse"></div>
      
      <div className="relative z-10 space-y-3 sm:space-y-4">
        {/* 헤더 - 실시간 Top 3 스타일 */}
        <div className="text-center mb-3 sm:mb-6">
          <div className="flex items-center justify-center gap-2 mb-1">
            <Image src="/baemin-logo.svg" alt="배민" width={28} height={28} className="w-4 h-4 sm:w-7 sm:h-7 animate-bounce" />
            <h2 className="text-lg sm:text-2xl md:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-orange-400 to-pink-400">
              배민커넥트 VS 쿠팡이츠
            </h2>
            <Image src="/coupang-logo.svg" alt="쿠팡" width={28} height={28} className="w-4 h-4 sm:w-7 sm:h-7 animate-bounce" />
          </div>
          <p className="text-purple-200 text-xs">오늘의 플랫폼 대결! ⚔️</p>
        </div>

        {/* 구분선 */}
        <div className="border-t border-purple-400/20 mb-3 sm:mb-4"></div>

        {/* 플랫폼 건당 단가 */}
        <div>
          <p className="text-center text-purple-200 text-xs mb-2">
            {hasRealData ? '오늘의 플랫폼 건당 단가 💰' : '플랫폼 평균 건당 단가 💰'}
          </p>
          <div className="grid grid-cols-2 gap-2 sm:gap-3">
            {stats.map((stat, index) => (
              <div 
                key={`${stat.platform}-${index}`}
                className={`
                  relative rounded-xl p-2.5 sm:p-3 shadow-lg hover:scale-[1.02] transition-all group
                  ${index === 0 
                    ? 'bg-gradient-to-r from-cyan-400 to-blue-500' 
                    : 'bg-gradient-to-r from-green-400 to-emerald-500'
                  }
                `}
              >
                <div className="flex flex-col items-center text-center">
                  <div className="flex items-center gap-1 mb-1 sm:mb-2">
                    <FaCoins className="text-white/90 w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="text-white font-black text-base sm:text-xl">
                      {stat.averagePerOrder.toLocaleString()}원
                    </span>
                  </div>
                  <p className="text-white/80 text-xs">건당 평균</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 플랫폼 대결 막대 그래프 */}
        <div>
          <div className="flex h-6 sm:h-8 rounded-full overflow-hidden shadow-inner bg-white/10 mb-1 sm:mb-2">
            <div 
              className="bg-gradient-to-r from-cyan-400 to-blue-500 flex items-center justify-center text-white font-bold text-xs transition-all duration-500"
              style={{ width: `${baeminPercent}%` }}
            >
              {baeminAvg > 0 && `${baeminPercent}%`}
            </div>
            <div 
              className="bg-gradient-to-r from-green-400 to-emerald-500 flex items-center justify-center text-white font-bold text-xs transition-all duration-500"
              style={{ width: `${coupangPercent}%` }}
            >
              {coupangAvg > 0 && `${coupangPercent}%`}
            </div>
          </div>
          
          {/* 승리 플랫폼 표시 */}
          {baeminAvg > coupangAvg && (
            <p className="text-center text-cyan-400 text-xs font-bold animate-pulse">
              🏆 배민커넥트가 앞서고 있습니다!
            </p>
          )}
          {coupangAvg > baeminAvg && (
            <p className="text-center text-green-400 text-xs font-bold animate-pulse">
              🏆 쿠팡이츠가 앞서고 있습니다!
            </p>
          )}
          {baeminAvg === coupangAvg && baeminAvg > 0 && (
            <p className="text-center text-yellow-400 text-xs font-bold animate-pulse">
              🤝 두 플랫폼이 동률입니다!
            </p>
          )}
        </div>

        {/* 구분선 */}
        <div className="border-t border-purple-400/20 my-3 sm:my-4"></div>

        {/* 플랫폼별 TOP 3 */}
        <div>
          <p className="text-center text-purple-200 text-xs mb-2">오늘의 플랫폼 TOP 3 🏆</p>
          <div className="grid grid-cols-2 gap-2 sm:gap-3">
            {/* 배민커넥트 TOP 3 */}
            <div className="bg-white/5 rounded-xl p-2.5 sm:p-3 border border-cyan-400/30">
              <div className="flex items-center justify-center gap-1 mb-1.5 sm:mb-2">
                <Image src="/baemin-logo.svg" alt="배민" width={16} height={16} className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="text-cyan-400 font-bold text-xs">배민커넥트</span>
              </div>
              <div className="space-y-1 sm:space-y-1.5">
                {platformRankers.baemin.length > 0 ? (
                  platformRankers.baemin.map((ranker, index) => (
                    <div 
                      key={`baemin-${index}-${ranker.nickname}`}
                      className="bg-cyan-400/20 rounded-xl p-1.5 sm:p-2 flex items-center gap-1.5 sm:gap-2 hover:bg-cyan-400/30 transition-all border border-cyan-400/40"
                    >
                      <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-cyan-400/40 flex items-center justify-center flex-shrink-0 border border-cyan-400/50">
                        {index === 0 ? (
                          <FaTrophy className="text-yellow-400 w-2.5 h-2.5 sm:w-3 sm:h-3" />
                        ) : index === 1 ? (
                          <FaMedal className="text-gray-300 w-2.5 h-2.5 sm:w-3 sm:h-3" />
                        ) : (
                          <FaStar className="text-orange-400 w-2.5 h-2.5 sm:w-3 sm:h-3" />
                        )}
                      </div>
                      <div className="flex-1 text-right">
                        <p className="text-white font-bold text-xs">
                          {ranker.totalAmount.toLocaleString()}원
                        </p>
                        <p className="text-cyan-200 text-xs">
                          {ranker.totalOrders}건
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-cyan-200 text-xs text-center py-3 sm:py-4">데이터 없음</p>
                )}
              </div>
            </div>

            {/* 쿠팡이츠 TOP 3 */}
            <div className="bg-white/5 rounded-xl p-2.5 sm:p-3 border border-green-400/30">
              <div className="flex items-center justify-center gap-1 mb-1.5 sm:mb-2">
                <Image src="/coupang-logo.svg" alt="쿠팡" width={16} height={16} className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="text-green-400 font-bold text-xs">쿠팡이츠</span>
              </div>
              <div className="space-y-1 sm:space-y-1.5">
                {platformRankers.coupang.length > 0 ? (
                  platformRankers.coupang.map((ranker, index) => (
                    <div 
                      key={`coupang-${index}-${ranker.nickname}`}
                      className="bg-green-400/20 rounded-xl p-1.5 sm:p-2 flex items-center gap-1.5 sm:gap-2 hover:bg-green-400/30 transition-all border border-green-400/40"
                    >
                      <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-green-400/40 flex items-center justify-center flex-shrink-0 border border-green-400/50">
                        {index === 0 ? (
                          <FaTrophy className="text-yellow-400 w-2.5 h-2.5 sm:w-3 sm:h-3" />
                        ) : index === 1 ? (
                          <FaMedal className="text-gray-300 w-2.5 h-2.5 sm:w-3 sm:h-3" />
                        ) : (
                          <FaStar className="text-orange-400 w-2.5 h-2.5 sm:w-3 sm:h-3" />
                        )}
                      </div>
                      <div className="flex-1 text-right">
                        <p className="text-white font-bold text-xs">
                          {ranker.totalAmount.toLocaleString()}원
                        </p>
                        <p className="text-green-200 text-xs">
                          {ranker.totalOrders}건
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-green-200 text-xs text-center py-3 sm:py-4">데이터 없음</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 
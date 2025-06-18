'use client';

import { useState, useEffect } from 'react';
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

export function PlatformStatistics() {
  const [stats, setStats] = useState<PlatformStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [platformRankers, setPlatformRankers] = useState<{
    baemin: RankingData[];
    coupang: RankingData[];
  }>({ baemin: [], coupang: [] });

  useEffect(() => {
    Promise.all([fetchPlatformStats(), fetchPlatformRankers()]);
  }, []);

  const fetchPlatformStats = async () => {
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
        return {
          platform,
          totalAmount: stat?.total_amount || 0,
          totalOrders: stat?.total_orders || 0,
          averagePerOrder: stat?.average_per_order || 0,
          logo: platform === '배민커넥트' ? '/baemin-logo.svg' : '/coupang-logo.svg',
          color: platform === '배민커넥트' ? 'from-cyan-400 to-blue-500' : 'from-green-400 to-emerald-500'
        };
      });

      setStats(platformStats);
    } catch (error) {
      console.error('플랫폼 통계 조회 오류:', error);
      // 에러 시 기본값 설정
      setStats([
        {
          platform: '배민커넥트',
          totalAmount: 0,
          totalOrders: 0,
          averagePerOrder: 0,
          logo: '/baemin-logo.svg',
          color: 'from-cyan-400 to-blue-500'
        },
        {
          platform: '쿠팡이츠',
          totalAmount: 0,
          totalOrders: 0,
          averagePerOrder: 0,
          logo: '/coupang-logo.svg',
          color: 'from-green-400 to-emerald-500'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const fetchPlatformRankers = async () => {
    try {
      const rankers = await getPlatformTopRankers();
      setPlatformRankers(rankers);
    } catch (error) {
      console.error('플랫폼별 랭킹 조회 오류:', error);
    }
  };

  // 플랫폼별 비율 계산
  const baeminAvg = stats.find(s => s.platform === '배민커넥트')?.averagePerOrder || 0;
  const coupangAvg = stats.find(s => s.platform === '쿠팡이츠')?.averagePerOrder || 0;
  const totalAvg = baeminAvg + coupangAvg;
  const baeminPercent = totalAvg > 0 ? Math.round((baeminAvg / totalAvg) * 100) : 50;
  const coupangPercent = totalAvg > 0 ? Math.round((coupangAvg / totalAvg) * 100) : 50;

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-purple-900/30 to-pink-900/30 backdrop-blur-lg rounded-3xl p-4 shadow-2xl border border-purple-500/30">
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
    <div className="bg-gradient-to-br from-purple-900/30 to-pink-900/30 backdrop-blur-lg rounded-3xl p-4 shadow-2xl border border-purple-500/30 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 via-pink-600/10 to-purple-600/10 animate-pulse"></div>
      
      <div className="relative z-10 space-y-4">
        {/* 헤더 */}
        <div className="text-center mb-4">
          <h2 className="text-2xl sm:text-3xl font-black text-white flex items-center justify-center gap-3">
            <img src="/baemin-logo.svg" alt="배민" className="w-10 h-10 sm:w-12 sm:h-12" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">VS</span>
            <img src="/coupang-logo.svg" alt="쿠팡" className="w-10 h-10 sm:w-12 sm:h-12" />
          </h2>
          <p className="text-purple-200 text-sm sm:text-base">배민커넥트 VS 쿠팡이츠</p>
        </div>

        {/* 플랫폼 건당 단가 */}
        <div>
          <h3 className="text-center text-white font-bold mb-3 text-sm">오늘의 플랫폼 건당 단가 💰</h3>
          <div className="grid grid-cols-2 gap-3">
            {stats.map((stat, index) => (
              <div 
                key={stat.platform}
                className={`
                  relative rounded-xl p-3 shadow-lg hover:scale-[1.02] transition-all group
                  ${index === 0 
                    ? 'bg-gradient-to-r from-cyan-400 to-blue-500' 
                    : 'bg-gradient-to-r from-green-400 to-emerald-500'
                  }
                `}
              >
                <div className="flex flex-col items-center text-center">
                  <div className="flex items-center gap-1 mb-2">
                    <FaCoins className="text-white/90 w-4 h-4" />
                    <span className="text-white font-black text-lg sm:text-xl">
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
          <div className="flex h-8 rounded-full overflow-hidden shadow-inner bg-white/10 mb-2">
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

        {/* 플랫폼별 TOP 3 */}
        <div className="grid grid-cols-2 gap-3">
          {/* 배민커넥트 TOP 3 */}
          <div className="bg-white/5 rounded-xl p-3 border border-cyan-400/30">
            <div className="flex items-center justify-center gap-1 mb-2">
              <img src="/baemin-logo.svg" alt="배민" className="w-4 h-4" />
              <span className="text-cyan-400 font-bold text-xs">배민커넥트 TOP 3</span>
            </div>
            <div className="space-y-1.5">
              {platformRankers.baemin.length > 0 ? (
                platformRankers.baemin.map((ranker, index) => (
                  <div 
                    key={ranker.userId}
                    className="bg-cyan-400/20 rounded-xl p-2 flex items-center gap-2 hover:bg-cyan-400/30 transition-all border border-cyan-400/40"
                  >
                    <div className="w-5 h-5 rounded-full bg-cyan-400/40 flex items-center justify-center flex-shrink-0 border border-cyan-400/50">
                      {index === 0 ? (
                        <FaTrophy className="text-yellow-400 w-3 h-3" />
                      ) : index === 1 ? (
                        <FaMedal className="text-gray-300 w-3 h-3" />
                      ) : (
                        <FaStar className="text-orange-400 w-3 h-3" />
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
                <p className="text-cyan-200 text-xs text-center py-4">데이터 없음</p>
              )}
            </div>
          </div>

          {/* 쿠팡이츠 TOP 3 */}
          <div className="bg-white/5 rounded-xl p-3 border border-green-400/30">
            <div className="flex items-center justify-center gap-1 mb-2">
              <img src="/coupang-logo.svg" alt="쿠팡" className="w-4 h-4" />
              <span className="text-green-400 font-bold text-xs">쿠팡이츠 TOP 3</span>
            </div>
            <div className="space-y-1.5">
              {platformRankers.coupang.length > 0 ? (
                platformRankers.coupang.map((ranker, index) => (
                  <div 
                    key={ranker.userId}
                    className="bg-green-400/20 rounded-xl p-2 flex items-center gap-2 hover:bg-green-400/30 transition-all border border-green-400/40"
                  >
                    <div className="w-5 h-5 rounded-full bg-green-400/40 flex items-center justify-center flex-shrink-0 border border-green-400/50">
                      {index === 0 ? (
                        <FaTrophy className="text-yellow-400 w-3 h-3" />
                      ) : index === 1 ? (
                        <FaMedal className="text-gray-300 w-3 h-3" />
                      ) : (
                        <FaStar className="text-orange-400 w-3 h-3" />
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
                <p className="text-green-200 text-xs text-center py-4">데이터 없음</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 
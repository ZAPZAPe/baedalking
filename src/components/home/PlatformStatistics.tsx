'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { FaTruck, FaMotorcycle, FaChartLine, FaFire, FaBolt, FaCoins } from 'react-icons/fa';

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

  useEffect(() => {
    fetchPlatformStats();
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
      {/* 배경 애니메이션 효과 */}
      <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 via-pink-600/10 to-purple-600/10 animate-pulse"></div>
      
      <div className="relative z-10">
        <h3 className="text-center text-white font-bold mb-3 text-sm">오늘의 플랫폼 건당 단가 💰</h3>
        <div className="grid grid-cols-2 gap-3">
          {stats.map((stat, index) => (
            <div 
              key={stat.platform}
              className={`
                relative rounded-xl p-4 shadow-lg hover:scale-[1.02] transition-all group
                ${index === 0 
                  ? 'bg-gradient-to-r from-cyan-400 to-blue-500' 
                  : 'bg-gradient-to-r from-green-400 to-emerald-500'
                }
              `}
            >
              <div className="flex flex-col items-center text-center">
                <img 
                  src={stat.logo} 
                  alt={stat.platform} 
                  className="w-8 h-8 sm:w-10 sm:h-10 mb-2 group-hover:scale-110 transition-transform" 
                />
                <h3 className="text-white font-bold text-sm sm:text-base mb-1">{stat.platform}</h3>
                <div className="flex items-center gap-1">
                  <FaCoins className="text-white/90 w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="text-white font-black text-base sm:text-lg">
                    {stat.averagePerOrder.toLocaleString()}원
                  </span>
                </div>
                <p className="text-white/80 text-xs">건당 평균</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 
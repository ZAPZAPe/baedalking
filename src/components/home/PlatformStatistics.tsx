'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { FaCoins } from 'react-icons/fa';

interface PlatformStat {
  platform: string;
  totalAmount: number;
  totalOrders: number;
  averagePerOrder: number;
  logo?: string;
  color?: string;
}

export function PlatformStatistics() {
  const [stats, setStats] = useState<PlatformStat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPlatformStats();
    
    // 실시간 업데이트를 위한 구독 - platform_stats 테이블 구독으로 변경
    const channel = supabase
      .channel('platform-stats-optimized')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'delivery_records',
        filter: 'verified=eq.true'
      }, () => {
        // 디바운스를 위한 타임아웃
        setTimeout(fetchPlatformStats, 1000);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
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
      console.error('플랫폼 통계 로드 실패:', error);
      // 에러 시 빈 통계 표시
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
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-4 shadow-xl border border-white/20">
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
    <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-4 shadow-xl border border-white/20">
      <div className="grid grid-cols-2 gap-3">
        {stats.map((stat) => (
          <div 
            key={stat.platform}
            className={`bg-gradient-to-r ${stat.color} rounded-xl p-4 shadow-lg hover:scale-[1.02] transition-all`}
          >
            <div className="flex flex-col items-center text-center">
              <img src={stat.logo} alt={stat.platform} className="w-10 h-10 mb-2" />
              <h3 className="text-white font-bold text-base mb-1">{stat.platform}</h3>
              <div className="flex items-center gap-1">
                <FaCoins className="text-white/80" size={14} />
                <span className="text-white font-black text-lg">
                  {stat.averagePerOrder.toLocaleString()}원
                </span>
              </div>
              <p className="text-white/70 text-xs">건당 평균</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 
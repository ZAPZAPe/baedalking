'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { FaTruck, FaChartBar, FaCoins } from 'react-icons/fa';

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
    
    // 실시간 업데이트를 위한 구독
    const channel = supabase
      .channel('platform-stats')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'delivery_records' }, () => {
        fetchPlatformStats();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchPlatformStats = async () => {
    try {
      // 인증된 배달 기록만 가져오기
      const { data, error } = await supabase
        .from('delivery_records')
        .select('platform, amount, delivery_count')
        .eq('verified', true);

      if (error) throw error;

      // 플랫폼별로 집계
      const platformMap = new Map<string, { totalAmount: number; totalOrders: number }>();
      
      data?.forEach(record => {
        const existing = platformMap.get(record.platform) || { totalAmount: 0, totalOrders: 0 };
        platformMap.set(record.platform, {
          totalAmount: existing.totalAmount + Number(record.amount),
          totalOrders: existing.totalOrders + Number(record.delivery_count)
        });
      });

      // 통계 정리
      const platformStats: PlatformStat[] = Array.from(platformMap.entries()).map(([platform, stats]) => ({
        platform,
        totalAmount: stats.totalAmount,
        totalOrders: stats.totalOrders,
        averagePerOrder: stats.totalOrders > 0 ? Math.round(stats.totalAmount / stats.totalOrders) : 0,
        logo: platform === '배민커넥트' ? '/baemin-logo.svg' : platform === '쿠팡이츠' ? '/coupang-logo.svg' : undefined,
        color: platform === '배민커넥트' ? 'from-cyan-400 to-blue-500' : platform === '쿠팡이츠' ? 'from-green-400 to-emerald-500' : 'from-gray-400 to-gray-600'
      }));

      // 총 금액 기준으로 정렬
      platformStats.sort((a, b) => b.totalAmount - a.totalAmount);

      setStats(platformStats);
    } catch (error) {
      console.error('플랫폼 통계 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 shadow-xl border border-white/20">
        <div className="animate-pulse">
          <div className="h-8 bg-white/20 rounded-lg w-48 mx-auto mb-4"></div>
          <div className="space-y-3">
            <div className="h-20 bg-white/20 rounded-xl"></div>
            <div className="h-20 bg-white/20 rounded-xl"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 shadow-xl border border-white/20">
      <div className="text-center mb-4">
        <h2 className="text-2xl font-black text-white flex items-center justify-center gap-2">
          <FaChartBar className="text-blue-400" size={24} />
          플랫폼별 실시간 통계
          <FaChartBar className="text-blue-400" size={24} />
        </h2>
        <p className="text-blue-200 text-sm pt-2">전체 라이더 인증 데이터 집계</p>
      </div>

      <div className="space-y-3">
        {stats.length > 0 ? (
          stats.map((stat, index) => (
            <div 
              key={stat.platform}
              className={`bg-gradient-to-r ${stat.color} rounded-xl p-4 shadow-lg hover:scale-[1.02] transition-all`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {stat.logo ? (
                    <img src={stat.logo} alt={stat.platform} className="w-8 h-8" />
                  ) : (
                    <FaTruck className="text-white" size={24} />
                  )}
                  <div>
                    <h3 className="text-white font-bold text-lg">{stat.platform}</h3>
                    <p className="text-white/80 text-sm">
                      총 {stat.totalOrders.toLocaleString()}건
                    </p>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="text-white font-black text-xl">
                    {stat.totalAmount.toLocaleString()}원
                  </div>
                  <div className="flex items-center gap-1 text-white/80 text-sm">
                    <FaCoins size={12} />
                    <span>건당 {stat.averagePerOrder.toLocaleString()}원</span>
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8">
            <p className="text-white/60">아직 인증된 데이터가 없습니다.</p>
          </div>
        )}
      </div>

      {stats.length > 0 && (
        <div className="mt-4 pt-4 border-t border-white/20">
          <div className="bg-gradient-to-r from-yellow-400/20 to-orange-500/20 rounded-xl p-3 border border-yellow-400/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FaChartBar className="text-yellow-400" size={16} />
                <span className="text-white font-bold">전체 합계</span>
              </div>
              <div className="text-right">
                <div className="text-yellow-400 font-black text-lg">
                  {stats.reduce((sum, stat) => sum + stat.totalAmount, 0).toLocaleString()}원
                </div>
                <div className="text-yellow-200 text-sm">
                  총 {stats.reduce((sum, stat) => sum + stat.totalOrders, 0).toLocaleString()}건
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 
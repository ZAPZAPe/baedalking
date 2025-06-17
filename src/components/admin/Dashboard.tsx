'use client';

import { useState, useEffect } from 'react';
import { getStatistics, getUsers, getDeliveryRecords } from '@/services/adminService';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { FaUsers, FaTruck, FaMoneyBillWave, FaExclamationTriangle, FaArrowUp, FaArrowDown } from 'react-icons/fa';
import { toast } from 'react-hot-toast';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface Statistics {
  totalUsers: number;
  userGrowth: number;
  totalRecords: number;
  recordGrowth: number;
  totalAmount: number;
  amountGrowth: number;
  fraudCount: number;
  trendData: { date: string; count: number }[];
  platformStats: { platform: string; count: number; amount: number }[];
  regionStats: { region: string; count: number; amount: number }[];
}

export default function Dashboard() {
  const [stats, setStats] = useState<Statistics>({
    totalUsers: 0,
    userGrowth: 0,
    totalRecords: 0,
    recordGrowth: 0,
    totalAmount: 0,
    amountGrowth: 0,
    fraudCount: 0,
    trendData: [],
    platformStats: [],
    regionStats: []
  });
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year'>('week');

  useEffect(() => {
    fetchData();
  }, [timeRange]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // 사용자 데이터 가져오기
      const users = await getUsers();
      const records = await getDeliveryRecords();
      
      // 통계 계산
      const now = new Date();
      const rangeStart = new Date();
      
      if (timeRange === 'week') {
        rangeStart.setDate(now.getDate() - 7);
      } else if (timeRange === 'month') {
        rangeStart.setMonth(now.getMonth() - 1);
      } else {
        rangeStart.setFullYear(now.getFullYear() - 1);
      }
      
      // 기간별 데이터 필터링
      const recentUsers = users.filter(u => new Date(u.createdAt) >= rangeStart);
      const recentRecords = records.filter(r => new Date(r.date) >= rangeStart);
      
      // 플랫폼별 통계
      const platformData = records.reduce((acc, record) => {
        const platform = record.platform;
        if (!acc[platform]) {
          acc[platform] = { count: 0, amount: 0 };
        }
        acc[platform].count += record.deliveryCount;
        acc[platform].amount += record.amount;
        return acc;
      }, {} as Record<string, { count: number; amount: number }>);
      
      const platformStats = Object.entries(platformData).map(([platform, data]) => ({
        platform,
        count: data.count,
        amount: data.amount
      }));
      
      // 지역별 통계
      const regionData = users.reduce((acc, user) => {
        const region = user.region || '미설정';
        if (!acc[region]) {
          acc[region] = { count: 0, amount: 0 };
        }
        acc[region].count += 1;
        
        // 해당 유저의 배달 기록 합산
        const userRecords = records.filter(r => r.userId === user.id);
        acc[region].amount += userRecords.reduce((sum, r) => sum + r.amount, 0);
        
        return acc;
      }, {} as Record<string, { count: number; amount: number }>);
      
      const regionStats = Object.entries(regionData)
        .map(([region, data]) => ({
          region,
          count: data.count,
          amount: data.amount
        }))
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 5);
      
      // 일별 트렌드 데이터
      const trendData: { date: string; count: number }[] = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        
        const count = records.filter(r => r.date === dateStr).length;
        trendData.push({ date: dateStr, count });
      }
      
      // 성장률 계산
      const previousUsers = users.length - recentUsers.length;
      const userGrowth = previousUsers > 0 ? ((recentUsers.length / previousUsers) * 100) : 0;
      
      const previousRecords = records.length - recentRecords.length;
      const recordGrowth = previousRecords > 0 ? ((recentRecords.length / previousRecords) * 100) : 0;
      
      const totalAmount = records.reduce((sum, r) => sum + r.amount, 0);
      const recentAmount = recentRecords.reduce((sum, r) => sum + r.amount, 0);
      const previousAmount = totalAmount - recentAmount;
      const amountGrowth = previousAmount > 0 ? ((recentAmount / previousAmount) * 100) : 0;
      
      setStats({
        totalUsers: users.length,
        userGrowth,
        totalRecords: records.length,
        recordGrowth,
        totalAmount,
        amountGrowth,
        fraudCount: 0, // 부정행위 감지 기능은 추후 구현
        trendData,
        platformStats,
        regionStats
      });
    } catch (error) {
      console.error('데이터 가져오기 오류:', error);
      toast.error('데이터를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const lineChartData = {
    labels: stats.trendData.map(d => {
      const date = new Date(d.date);
      return `${date.getMonth() + 1}/${date.getDate()}`;
    }),
    datasets: [
      {
        label: '일별 업로드',
        data: stats.trendData.map(d => d.count),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4
      }
    ]
  };

  const barChartData = {
    labels: stats.platformStats.map(p => p.platform),
    datasets: [
      {
        label: '플랫폼별 수익',
        data: stats.platformStats.map(p => p.amount),
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',
          'rgba(251, 146, 60, 0.8)',
          'rgba(34, 197, 94, 0.8)'
        ]
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      }
    },
    scales: {
      y: {
        beginAtZero: true
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-800"></div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* 시간 범위 선택 */}
      <div className="mb-6 flex justify-end">
        <div className="flex gap-2">
          {(['week', 'month', 'year'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-4 py-2 rounded-lg transition-colors ${
                timeRange === range
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              {range === 'week' ? '주간' : range === 'month' ? '월간' : '연간'}
            </button>
          ))}
        </div>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <FaUsers className="text-blue-600" size={24} />
            <span className={`text-sm font-medium flex items-center gap-1 ${
              stats.userGrowth >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {stats.userGrowth >= 0 ? <FaArrowUp /> : <FaArrowDown />}
              {Math.abs(stats.userGrowth).toFixed(1)}%
            </span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.totalUsers}</p>
          <p className="text-sm text-gray-600 mt-1">전체 사용자</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <FaTruck className="text-green-600" size={24} />
            <span className={`text-sm font-medium flex items-center gap-1 ${
              stats.recordGrowth >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {stats.recordGrowth >= 0 ? <FaArrowUp /> : <FaArrowDown />}
              {Math.abs(stats.recordGrowth).toFixed(1)}%
            </span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.totalRecords}</p>
          <p className="text-sm text-gray-600 mt-1">전체 배달 기록</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <FaMoneyBillWave className="text-yellow-600" size={24} />
            <span className={`text-sm font-medium flex items-center gap-1 ${
              stats.amountGrowth >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {stats.amountGrowth >= 0 ? <FaArrowUp /> : <FaArrowDown />}
              {Math.abs(stats.amountGrowth).toFixed(1)}%
            </span>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {(stats.totalAmount / 1000000).toFixed(1)}M
          </p>
          <p className="text-sm text-gray-600 mt-1">총 수익</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <FaExclamationTriangle className="text-red-600" size={24} />
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.fraudCount}</p>
          <p className="text-sm text-gray-600 mt-1">부정 감지</p>
        </div>
      </div>

      {/* 차트 섹션 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">업로드 트렌드</h3>
          <div className="h-64">
            <Line data={lineChartData} options={chartOptions} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">플랫폼별 수익</h3>
          <div className="h-64">
            <Bar data={barChartData} options={chartOptions} />
          </div>
        </div>
      </div>

      {/* 지역별 통계 테이블 */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">지역별 TOP 5</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">지역</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-700">사용자 수</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-700">총 수익</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-700">평균 수익</th>
              </tr>
            </thead>
            <tbody>
              {stats.regionStats.map((region, index) => (
                <tr key={region.region} className="border-b border-gray-100">
                  <td className="py-3 px-4 text-sm text-gray-900">{region.region}</td>
                  <td className="py-3 px-4 text-sm text-gray-900 text-right">{region.count}</td>
                  <td className="py-3 px-4 text-sm text-gray-900 text-right">
                    {region.amount.toLocaleString()}원
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-900 text-right">
                    {region.count > 0 ? Math.round(region.amount / region.count).toLocaleString() : 0}원
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
} 
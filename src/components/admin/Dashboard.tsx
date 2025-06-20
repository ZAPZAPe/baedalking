'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  FaChartLine, 
  FaUsers, 
  FaClipboardList, 
  FaCoins,
  FaUpload,
  FaTrophy,
  FaExclamationTriangle,
  FaCalendarCheck,
  FaArrowUp,
  FaArrowDown,
  FaBolt,
  FaFire,
  FaGift,
  FaBell,
  FaChartBar,
  FaCheckCircle
} from 'react-icons/fa';
import { getStatistics, getUsers, getAllDeliveryRecords, getFraudRecords } from '@/services/adminService';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, startOfMonth } from 'date-fns';
import { ko } from 'date-fns/locale';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

export default function Dashboard() {
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year'>('week');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [recentActivities, setRecentActivities] = useState<any[]>([]);

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      
      // 통계 데이터 가져오기
      const statistics = await getStatistics(timeRange);
      const users = await getUsers();
      const records = await getAllDeliveryRecords();
      
      // fraud_records 테이블이 없는 경우를 대비한 처리
      let frauds = [];
      try {
        frauds = await getFraudRecords();
      } catch (error) {
        console.log('부정 사용 기록 테이블이 아직 생성되지 않았습니다.');
      }

      // 최근 활동 생성
      const activities = [
        ...records.slice(0, 5).map(r => ({
          type: 'upload',
          user: r.userNickname || '알 수 없음',
          message: `배달 기록 업로드 (${r.deliveryCount}건)`,
          time: r.createdAt ? new Date(r.createdAt) : new Date(),
          icon: FaUpload,
          color: 'text-blue-400'
        })),
        ...users.slice(0, 3).map(u => ({
          type: 'user',
          user: u.nickname,
          message: '새로운 사용자 가입',
          time: new Date(u.createdAt),
          icon: FaUsers,
          color: 'text-purple-400'
        }))
      ].sort((a, b) => b.time.getTime() - a.time.getTime()).slice(0, 8);

      setStats(statistics);
      setRecentActivities(activities);
    } catch (error) {
      console.error('대시보드 데이터 로드 오류:', error);
    } finally {
      setLoading(false);
    }
  }, [timeRange]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // 차트 데이터 생성
  const chartData = stats?.trendData || [];
  const platformData = stats?.platformStats || [];
  const regionData = stats?.regionStats || [];

  // 차트 색상
  const COLORS = ['#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899'];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-h-[calc(100vh-200px)] overflow-y-auto pr-4">
      {/* 시간 범위 선택 */}
      <div className="flex items-center justify-between">
        <h3 className="text-2xl font-bold text-white">대시보드 개요</h3>
        <div className="flex gap-2">
          {(['week', 'month', 'year'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-4 py-2 rounded-lg transition-all ${
                timeRange === range
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                  : 'bg-white/10 text-zinc-400 hover:text-white hover:bg-white/20'
              }`}
            >
              {range === 'week' ? '주간' : range === 'month' ? '월간' : '연간'}
            </button>
          ))}
        </div>
      </div>

      {/* 주요 지표 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <div className="group relative bg-gradient-to-br from-zinc-900 to-black rounded-2xl p-6 border border-purple-500/20 hover:border-purple-500/40 transition-all duration-300 hover:scale-105">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 to-cyan-600/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
          
          <div className="relative">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-xl flex items-center justify-center shadow-lg group-hover:animate-pulse">
                <FaUsers className="text-white" size={20} />
              </div>
              <div className={`flex items-center gap-1 text-xs ${stats?.userGrowth > 0 ? 'text-green-400' : 'text-red-400'}`}>
                {stats?.userGrowth > 0 ? <FaArrowUp size={10} /> : <FaArrowDown size={10} />}
                <span>{Math.abs(stats?.userGrowth || 0)}%</span>
              </div>
            </div>
            <h3 className="text-zinc-400 text-sm mb-1">전체 사용자</h3>
            <p className="text-2xl lg:text-3xl font-black text-white">
              {(stats?.totalUsers || 0).toLocaleString()}명
            </p>
          </div>
        </div>

        <div className="group relative bg-gradient-to-br from-zinc-900 to-black rounded-2xl p-6 border border-purple-500/20 hover:border-purple-500/40 transition-all duration-300 hover:scale-105">
          <div className="absolute inset-0 bg-gradient-to-br from-green-600/10 to-emerald-600/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
          
          <div className="relative">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-green-600 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg group-hover:animate-pulse">
                <FaClipboardList className="text-white" size={20} />
              </div>
              <div className={`flex items-center gap-1 text-xs ${stats?.recordGrowth > 0 ? 'text-green-400' : 'text-red-400'}`}>
                {stats?.recordGrowth > 0 ? <FaArrowUp size={10} /> : <FaArrowDown size={10} />}
                <span>{Math.abs(stats?.recordGrowth || 0)}%</span>
              </div>
            </div>
            <h3 className="text-zinc-400 text-sm mb-1">총 배달 기록</h3>
            <p className="text-2xl lg:text-3xl font-black text-white">
              {(stats?.totalRecords || 0).toLocaleString()}건
            </p>
          </div>
        </div>

        <div className="group relative bg-gradient-to-br from-zinc-900 to-black rounded-2xl p-6 border border-purple-500/20 hover:border-purple-500/40 transition-all duration-300 hover:scale-105">
          <div className="absolute inset-0 bg-gradient-to-br from-yellow-600/10 to-orange-600/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
          
          <div className="relative">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-yellow-600 to-orange-600 rounded-xl flex items-center justify-center shadow-lg group-hover:animate-pulse">
                <FaCoins className="text-white" size={20} />
              </div>
              <div className={`flex items-center gap-1 text-xs ${stats?.amountGrowth > 0 ? 'text-green-400' : 'text-red-400'}`}>
                {stats?.amountGrowth > 0 ? <FaArrowUp size={10} /> : <FaArrowDown size={10} />}
                <span>{Math.abs(stats?.amountGrowth || 0)}%</span>
              </div>
            </div>
            <h3 className="text-zinc-400 text-sm mb-1">총 매출액</h3>
            <p className="text-2xl lg:text-3xl font-black text-white">
              {(stats?.totalAmount || 0).toLocaleString()}원
            </p>
          </div>
        </div>

        <div className="group relative bg-gradient-to-br from-zinc-900 to-black rounded-2xl p-6 border border-purple-500/20 hover:border-purple-500/40 transition-all duration-300 hover:scale-105">
          <div className="absolute inset-0 bg-gradient-to-br from-red-600/10 to-rose-600/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
          
          <div className="relative">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-red-600 to-rose-600 rounded-xl flex items-center justify-center shadow-lg group-hover:animate-pulse">
                <FaExclamationTriangle className="text-white" size={20} />
              </div>
              <div className="flex items-center gap-1 text-xs text-yellow-400">
                <FaBell size={10} />
                <span>주의</span>
              </div>
            </div>
            <h3 className="text-zinc-400 text-sm mb-1">부정 사용 감지</h3>
            <p className="text-2xl lg:text-3xl font-black text-white">
              {(stats?.fraudCount || 0).toLocaleString()}건
            </p>
          </div>
        </div>
      </div>

      {/* 차트 섹션 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 업로드 트렌드 차트 */}
        <div className="bg-gradient-to-br from-zinc-900 to-black rounded-2xl p-6 border border-purple-500/20">
          <h4 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <FaChartLine className="text-purple-400" />
            업로드 트렌드
          </h4>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="date" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#18181b', border: '1px solid #374151' }}
                  labelStyle={{ color: '#e5e7eb' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="count" 
                  stroke="#8b5cf6" 
                  fillOpacity={1} 
                  fill="url(#colorGradient)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 플랫폼별 통계 */}
        <div className="bg-gradient-to-br from-zinc-900 to-black rounded-2xl p-6 border border-purple-500/20">
          <h4 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <FaChartBar className="text-cyan-400" />
            플랫폼별 실적
          </h4>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={platformData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="platform" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#18181b', border: '1px solid #374151' }}
                  labelStyle={{ color: '#e5e7eb' }}
                />
                <Bar dataKey="count" fill="#06b6d4" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 최근 활동 및 지역별 통계 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 최근 활동 */}
        <div className="bg-gradient-to-br from-zinc-900 to-black rounded-2xl p-6 border border-purple-500/20">
          <h4 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <FaBolt className="text-yellow-400" />
            최근 활동
          </h4>
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {recentActivities.map((activity, index) => {
              const Icon = activity.icon;
              return (
                <div key={index} className="flex items-start gap-3 p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-colors">
                  <div className={`w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center ${activity.color}`}>
                    <Icon size={16} />
                  </div>
                  <div className="flex-1">
                    <p className="text-white text-sm font-medium">{activity.user}</p>
                    <p className="text-zinc-400 text-xs">{activity.message}</p>
                    <p className="text-zinc-500 text-xs mt-1">
                      {format(activity.time, 'MM월 dd일 HH:mm', { locale: ko })}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 지역별 통계 */}
        <div className="bg-gradient-to-br from-zinc-900 to-black rounded-2xl p-6 border border-purple-500/20">
          <h4 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <FaTrophy className="text-orange-400" />
            지역별 TOP 5
          </h4>
          <div className="space-y-3">
                         {regionData.slice(0, 5).map((region: any, index: number) => (
              <div key={index} className="flex items-center justify-between p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-white ${
                    index === 0 ? 'bg-gradient-to-br from-yellow-400 to-orange-500' :
                    index === 1 ? 'bg-gradient-to-br from-slate-400 to-slate-600' :
                    index === 2 ? 'bg-gradient-to-br from-amber-600 to-amber-800' :
                    'bg-gradient-to-br from-zinc-600 to-zinc-800'
                  }`}>
                    {index + 1}
                  </div>
                  <div>
                    <p className="text-white font-medium">{region.region}</p>
                    <p className="text-zinc-400 text-xs">{region.count}건</p>
                  </div>
                </div>
                <p className="text-white font-bold">{region.amount.toLocaleString()}원</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 알림 섹션 */}
      <div className="bg-gradient-to-br from-purple-900/30 to-pink-900/30 backdrop-blur-lg rounded-2xl p-6 border border-purple-500/30">
        <h4 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <FaBell className="text-purple-400" />
          시스템 알림
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white/10 rounded-xl p-4 flex items-center gap-3">
            <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
              <FaCheckCircle className="text-green-400" size={20} />
            </div>
            <div>
              <p className="text-white font-medium">시스템 정상</p>
              <p className="text-zinc-400 text-sm">모든 서비스 정상 작동중</p>
            </div>
          </div>
          <div className="bg-white/10 rounded-xl p-4 flex items-center gap-3">
            <div className="w-12 h-12 bg-yellow-500/20 rounded-lg flex items-center justify-center">
              <FaExclamationTriangle className="text-yellow-400" size={20} />
            </div>
            <div>
              <p className="text-white font-medium">대기중 인증</p>
              <p className="text-zinc-400 text-sm">15건의 배달 기록 검토 필요</p>
            </div>
          </div>
          <div className="bg-white/10 rounded-xl p-4 flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
              <FaGift className="text-blue-400" size={20} />
            </div>
            <div>
              <p className="text-white font-medium">이벤트 진행중</p>
              <p className="text-zinc-400 text-sm">신규 가입 이벤트 활성화</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 
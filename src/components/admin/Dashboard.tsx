'use client';

import { useState, useEffect } from 'react';
import { 
  FaUsers, 
  FaClipboardList, 
  FaCoins,
  FaTrophy,
  FaExclamationTriangle,
  FaArrowUp,
  FaClock,
  FaCheckCircle,
  FaChartLine,
  FaMapMarkerAlt,
  FaBell,
  FaEye,
  FaCalendarDay,
  FaPercentage
} from 'react-icons/fa';
import { getUsers, getAllDeliveryRecords } from '@/services/adminService';
import { format, isToday, startOfDay, endOfDay } from 'date-fns';
import { ko } from 'date-fns/locale';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface TodayData {
  totalRecords: number;
  totalAmount: number;
  activeUsers: number;
  verificationRate: number;
  platformStats: { platform: string; count: number; amount: number }[];
  hourlyActivity: { hour: string; count: number }[];
  topUsers: { name: string; count: number; amount: number }[];
  regionStats: { region: string; count: number; amount: number }[];
  pendingRecords: number;
  suspiciousActivity: number;
}

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [todayData, setTodayData] = useState<TodayData>({
    totalRecords: 0,
    totalAmount: 0,
    activeUsers: 0,
    verificationRate: 0,
    platformStats: [],
    hourlyActivity: [],
    topUsers: [],
    regionStats: [],
    pendingRecords: 0,
    suspiciousActivity: 0,
  });

  const fetchTodayData = async () => {
    try {
      setLoading(true);
      
      const users = await getUsers();
      const allRecords = await getAllDeliveryRecords();
      
      // 오늘 데이터만 필터링
      const todayRecords = allRecords.filter(record => 
        isToday(new Date(record.date))
      );
      
      // 오늘의 활성 사용자 (오늘 기록이 있는 사용자)
      const activeUserIds = new Set(todayRecords.map(r => r.userId));
      
      // 인증률 계산
      const verifiedRecords = todayRecords.filter(r => r.verified);
      const verificationRate = todayRecords.length > 0 
        ? Math.round((verifiedRecords.length / todayRecords.length) * 100) 
        : 0;
      
      // 플랫폼별 통계
      const platformStats = todayRecords.reduce((acc, record) => {
        const existing = acc.find(p => p.platform === record.platform);
        if (existing) {
          existing.count += record.deliveryCount;
          existing.amount += record.amount;
        } else {
          acc.push({
            platform: record.platform,
            count: record.deliveryCount,
            amount: record.amount
          });
        }
        return acc;
      }, [] as { platform: string; count: number; amount: number }[]);
      
      // 시간대별 활동 (24시간)
      const hourlyActivity = Array.from({ length: 24 }, (_, hour) => {
        const hourStr = hour.toString().padStart(2, '0');
        const hourRecords = todayRecords.filter(record => {
          const recordHour = new Date(record.createdAt || record.date).getHours();
          return recordHour === hour;
        });
        return {
          hour: `${hourStr}:00`,
          count: hourRecords.length
        };
      });
      
      // 오늘의 TOP 사용자
      const userStats = new Map();
      todayRecords.forEach(record => {
        const userId = record.userId;
        const existing = userStats.get(userId);
        if (existing) {
          existing.count += record.deliveryCount;
          existing.amount += record.amount;
        } else {
          const user = users.find(u => u.id === userId);
          userStats.set(userId, {
            name: user?.nickname || '알 수 없음',
            count: record.deliveryCount,
            amount: record.amount
          });
        }
      });
      
      const topUsers = Array.from(userStats.values())
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 5);
      
      // 지역별 통계
      const regionStats = new Map();
      todayRecords.forEach(record => {
        const user = users.find(u => u.id === record.userId);
        const region = user?.region || '미설정';
        const existing = regionStats.get(region);
        if (existing) {
          existing.count += record.deliveryCount;
          existing.amount += record.amount;
        } else {
          regionStats.set(region, {
            region,
            count: record.deliveryCount,
            amount: record.amount
          });
        }
      });
      
      const topRegions = Array.from(regionStats.values())
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 5);
      
      // 미인증 기록 수
      const pendingRecords = todayRecords.filter(r => !r.verified).length;
      
      // 의심스러운 활동 (하루에 10건 이상 업로드한 사용자)
      const suspiciousUsers = Array.from(userStats.values()).filter(u => u.count > 10);
      
      setTodayData({
        totalRecords: todayRecords.reduce((sum, r) => sum + r.deliveryCount, 0),
        totalAmount: todayRecords.reduce((sum, r) => sum + r.amount, 0),
        activeUsers: activeUserIds.size,
        verificationRate,
        platformStats,
        hourlyActivity,
        topUsers,
        regionStats: topRegions,
        pendingRecords,
        suspiciousActivity: suspiciousUsers.length,
      });
      
    } catch (error) {
      console.error('오늘 데이터 로드 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTodayData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const currentTime = format(new Date(), 'yyyy년 MM월 dd일 HH:mm', { locale: ko });

  return (
    <div className="space-y-6">
      {/* 페이지 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <FaCalendarDay className="text-blue-600" />
            오늘의 종합 현황
          </h3>
          <p className="text-gray-600 mt-1">{currentTime} 기준 실시간 데이터</p>
        </div>
        <button
          onClick={fetchTodayData}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <FaEye size={16} />
          새로고침
        </button>
      </div>

      {/* 🔥 오늘의 핵심 지표 (가장 중요) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white border-l-4 border-blue-500 rounded-lg p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">오늘 총 배달 건수</p>
              <p className="text-3xl font-bold text-gray-900">{todayData.totalRecords.toLocaleString()}<span className="text-lg font-normal text-gray-500">건</span></p>
              <div className="flex items-center mt-2 text-blue-600">
                <FaArrowUp size={12} />
                <span className="text-sm ml-1 font-medium">실시간 업데이트</span>
              </div>
            </div>
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
              <FaClipboardList size={24} className="text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white border-l-4 border-green-500 rounded-lg p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">오늘 총 수익</p>
              <p className="text-3xl font-bold text-gray-900">{(todayData.totalAmount / 10000).toFixed(1)}<span className="text-lg font-normal text-gray-500">만원</span></p>
              <div className="flex items-center mt-2 text-green-600">
                <FaCoins size={12} />
                <span className="text-sm ml-1 font-medium">{todayData.totalAmount.toLocaleString()}원</span>
              </div>
            </div>
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <FaCoins size={24} className="text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white border-l-4 border-purple-500 rounded-lg p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">오늘 활성 사용자</p>
              <p className="text-3xl font-bold text-gray-900">{todayData.activeUsers}<span className="text-lg font-normal text-gray-500">명</span></p>
              <div className="flex items-center mt-2 text-purple-600">
                <FaUsers size={12} />
                <span className="text-sm ml-1 font-medium">기록 업로드한 사용자</span>
              </div>
            </div>
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center">
              <FaUsers size={24} className="text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white border-l-4 border-orange-500 rounded-lg p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">오늘 인증률</p>
              <p className="text-3xl font-bold text-gray-900">{todayData.verificationRate}<span className="text-lg font-normal text-gray-500">%</span></p>
              <div className="flex items-center mt-2 text-orange-600">
                <FaPercentage size={12} />
                <span className="text-sm ml-1 font-medium">인증된 기록 비율</span>
              </div>
            </div>
            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center">
              <FaCheckCircle size={24} className="text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* 실시간 현황 차트 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 시간대별 활동 */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <h4 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <FaChartLine className="text-blue-500" />
            오늘의 시간대별 활동
          </h4>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={todayData.hourlyActivity}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="hour" stroke="#6B7280" />
                <YAxis stroke="#6B7280" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #E5E7EB', borderRadius: '8px' }}
                  labelStyle={{ color: '#374151' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="count" 
                  stroke="#3B82F6" 
                  strokeWidth={3}
                  dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 플랫폼별 실적 */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <h4 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <FaTrophy className="text-green-500" />
            오늘의 플랫폼별 실적
          </h4>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={todayData.platformStats}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="platform" stroke="#6B7280" />
                <YAxis stroke="#6B7280" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #E5E7EB', borderRadius: '8px' }}
                  labelStyle={{ color: '#374151' }}
                />
                <Bar dataKey="count" fill="#10B981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 오늘의 TOP 랭킹 & 지역별 현황 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 오늘의 TOP 사용자 */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <h4 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <FaTrophy className="text-yellow-500" />
            오늘의 TOP 사용자
          </h4>
          <div className="space-y-3">
            {todayData.topUsers.map((user, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-white text-lg ${
                    index === 0 ? 'bg-yellow-500' :
                    index === 1 ? 'bg-gray-400' :
                    index === 2 ? 'bg-orange-500' :
                    'bg-gray-300'
                  }`}>
                    {index + 1}
                  </div>
                  <div>
                    <p className="text-gray-900 font-bold text-lg">{user.name}</p>
                    <p className="text-gray-600 text-sm">{user.count}건 배달</p>
                  </div>
                </div>
                <p className="text-gray-900 font-bold text-xl">{user.amount.toLocaleString()}원</p>
              </div>
            ))}
          </div>
        </div>

        {/* 지역별 현황 */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <h4 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <FaMapMarkerAlt className="text-red-500" />
            오늘의 지역별 현황
          </h4>
          <div className="space-y-3">
            {todayData.regionStats.map((region, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                    <FaMapMarkerAlt className="text-red-600" size={20} />
                  </div>
                  <div>
                    <p className="text-gray-900 font-bold text-lg">{region.region}</p>
                    <p className="text-gray-600 text-sm">{region.count}건</p>
                  </div>
                </div>
                <p className="text-gray-900 font-bold text-xl">{region.amount.toLocaleString()}원</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 🚨 관리 필요 항목 */}
      <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-lg p-6 border border-red-200">
        <h4 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <FaBell className="text-red-500" />
          오늘 관리 필요 항목
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg p-4 flex items-center gap-3 shadow-sm border border-red-100">
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <FaClock className="text-yellow-600" size={20} />
            </div>
            <div>
              <p className="text-gray-900 font-bold text-lg">{todayData.pendingRecords}건</p>
              <p className="text-gray-600 text-sm">미인증 기록</p>
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-4 flex items-center gap-3 shadow-sm border border-red-100">
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <FaExclamationTriangle className="text-red-600" size={20} />
            </div>
            <div>
              <p className="text-gray-900 font-bold text-lg">{todayData.suspiciousActivity}명</p>
              <p className="text-gray-600 text-sm">의심스러운 활동</p>
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-4 flex items-center gap-3 shadow-sm border border-green-100">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <FaCheckCircle className="text-green-600" size={20} />
            </div>
            <div>
              <p className="text-gray-900 font-bold text-lg">정상</p>
              <p className="text-gray-600 text-sm">시스템 상태</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
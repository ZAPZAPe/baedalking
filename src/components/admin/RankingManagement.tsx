'use client';

import { useState, useEffect, useCallback } from 'react';
import { getUsers, getDeliveryRecords } from '@/services/adminService';
import { UserProfile } from '@/types';
import { FaTrophy, FaMedal, FaCalendar, FaFilter, FaDownload } from 'react-icons/fa';
import { toast } from 'react-hot-toast';

interface RankingData {
  userId: string;
  nickname: string;
  region: string;
  vehicle: string;
  totalAmount: number;
  totalDeliveries: number;
  avgPerDelivery: number;
  rank: number;
  previousRank?: number;
}

export default function RankingManagement() {
  const [rankings, setRankings] = useState<RankingData[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'day' | 'week' | 'month' | 'all'>('month');
  const [regionFilter, setRegionFilter] = useState('all');
  const [vehicleFilter, setVehicleFilter] = useState('all');
  const [regions, setRegions] = useState<string[]>([]);

  const fetchRankingData = useCallback(async () => {
    try {
      setLoading(true);
      
      const users = await getUsers();
      const records = await getDeliveryRecords();
      
      // 기간 필터링
      const now = new Date();
      const periodStart = new Date();
      
      switch (period) {
        case 'day':
          periodStart.setDate(now.getDate() - 1);
          break;
        case 'week':
          periodStart.setDate(now.getDate() - 7);
          break;
        case 'month':
          periodStart.setMonth(now.getMonth() - 1);
          break;
      }
      
      // 기간에 따른 레코드 필터링
      const filteredRecords = period === 'all' 
        ? records 
        : records.filter(r => new Date(r.date) >= periodStart);
      
      // 사용자별 통계 계산
      const userStats = users.map(user => {
        const userRecords = filteredRecords.filter(r => r.userId === user.id);
        const totalAmount = userRecords.reduce((sum, r) => sum + r.amount, 0);
        const totalDeliveries = userRecords.reduce((sum, r) => sum + r.deliveryCount, 0);
        
        return {
          userId: user.id,
          nickname: user.nickname || 'Unknown',
          region: user.region || '미설정',
          vehicle: user.vehicle || 'bicycle',
          totalAmount,
          totalDeliveries,
          avgPerDelivery: totalDeliveries > 0 ? Math.round(totalAmount / totalDeliveries) : 0,
          rank: 0
        };
      });
      
      // 필터링
      let filtered = userStats;
      
      if (regionFilter !== 'all') {
        filtered = filtered.filter(u => u.region === regionFilter);
      }
      
      if (vehicleFilter !== 'all') {
        filtered = filtered.filter(u => u.vehicle === vehicleFilter);
      }
      
      // 총 수익으로 정렬 및 순위 부여
      const sorted = filtered
        .filter(u => u.totalAmount > 0)
        .sort((a, b) => b.totalAmount - a.totalAmount)
        .map((user, index) => ({
          ...user,
          rank: index + 1
        }));
      
      setRankings(sorted);
      
      // 지역 목록 추출
      const uniqueRegions = Array.from(new Set(users.map(u => u.region || '미설정')));
      setRegions(uniqueRegions);
      
    } catch (error) {
      console.error('랭킹 데이터 가져오기 오류:', error);
      toast.error('랭킹 데이터를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, [period, regionFilter, vehicleFilter]);

  useEffect(() => {
    fetchRankingData();
  }, [fetchRankingData]);

  const exportToCSV = () => {
    const headers = ['순위', '닉네임', '지역', '차량', '총 수익', '총 건수', '건당 평균'];
    const rows = rankings.map(r => [
      r.rank,
      r.nickname,
      r.region,
      r.vehicle === 'bicycle' ? '자전거' : r.vehicle === 'motorcycle' ? '오토바이' : '자동차',
      r.totalAmount,
      r.totalDeliveries,
      r.avgPerDelivery
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `ranking_${period}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success('CSV 파일이 다운로드되었습니다.');
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
      {/* 헤더 및 필터 */}
      <div className="mb-6">
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">랭킹 관리</h2>
            <p className="text-gray-600 mt-1">배달원 실적 순위</p>
          </div>
          
          <div className="flex flex-wrap gap-3">
            {/* 기간 선택 */}
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value as any)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="day">일간</option>
              <option value="week">주간</option>
              <option value="month">월간</option>
              <option value="all">전체</option>
            </select>
            
            {/* 지역 필터 */}
            <select
              value={regionFilter}
              onChange={(e) => setRegionFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">모든 지역</option>
              {regions.map(region => (
                <option key={region} value={region}>{region}</option>
              ))}
            </select>
            
            {/* 차량 필터 */}
            <select
              value={vehicleFilter}
              onChange={(e) => setVehicleFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">모든 차량</option>
              <option value="bicycle">자전거</option>
              <option value="motorcycle">오토바이</option>
              <option value="car">자동차</option>
            </select>
            
            {/* CSV 다운로드 */}
            <button
              onClick={exportToCSV}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
            >
              <FaDownload size={14} />
              CSV 다운로드
            </button>
          </div>
        </div>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
          <p className="text-sm text-gray-600">참여 인원</p>
          <p className="text-2xl font-bold text-gray-900">{rankings.length}명</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
          <p className="text-sm text-gray-600">총 배달 수익</p>
          <p className="text-2xl font-bold text-gray-900">
            {(rankings.reduce((sum, r) => sum + r.totalAmount, 0) / 1000000).toFixed(1)}M
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
          <p className="text-sm text-gray-600">총 배달 건수</p>
          <p className="text-2xl font-bold text-gray-900">
            {rankings.reduce((sum, r) => sum + r.totalDeliveries, 0).toLocaleString()}건
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
          <p className="text-sm text-gray-600">평균 건당 수익</p>
          <p className="text-2xl font-bold text-gray-900">
            {rankings.length > 0
              ? Math.round(
                  rankings.reduce((sum, r) => sum + r.totalAmount, 0) /
                  rankings.reduce((sum, r) => sum + r.totalDeliveries, 0)
                ).toLocaleString()
              : 0}원
          </p>
        </div>
      </div>

      {/* 랭킹 테이블 */}
      <div className="bg-white shadow-sm rounded-lg overflow-hidden border border-gray-100">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                순위
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                배달원
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                지역
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                차량
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                총 수익
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                총 건수
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                건당 평균
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {rankings.map((ranking) => (
              <tr key={ranking.userId} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    {ranking.rank === 1 && (
                      <FaTrophy className="text-yellow-500 mr-2" size={20} />
                    )}
                    {ranking.rank === 2 && (
                      <FaMedal className="text-gray-400 mr-2" size={20} />
                    )}
                    {ranking.rank === 3 && (
                      <FaMedal className="text-orange-600 mr-2" size={20} />
                    )}
                    <span className={`text-lg font-bold ${
                      ranking.rank <= 3 ? 'text-gray-900' : 'text-gray-600'
                    }`}>
                      {ranking.rank}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {ranking.nickname}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                    {ranking.region}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {ranking.vehicle === 'bicycle' ? '🚴 자전거' :
                   ranking.vehicle === 'motorcycle' ? '🏍️ 오토바이' : '🚗 자동차'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right font-medium">
                  {ranking.totalAmount.toLocaleString()}원
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                  {ranking.totalDeliveries.toLocaleString()}건
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                  {ranking.avgPerDelivery.toLocaleString()}원
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {rankings.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">해당 조건에 맞는 랭킹 데이터가 없습니다.</p>
          </div>
        )}
      </div>
    </div>
  );
} 
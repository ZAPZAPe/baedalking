'use client';

import { useState, useEffect } from 'react';
import { getDeliveryRecords, getUsers } from '@/services/adminService';
import { DeliveryRecord, UserProfile } from '@/types';
import { FaExclamationTriangle, FaCheckCircle, FaTimesCircle, FaSearch, FaFilter } from 'react-icons/fa';
import { toast } from 'react-hot-toast';

interface SuspiciousActivity {
  id: string;
  userId: string;
  userName: string;
  type: 'duplicate' | 'high_amount' | 'rapid_upload' | 'pattern_anomaly';
  description: string;
  severity: 'low' | 'medium' | 'high';
  status: 'pending' | 'reviewed' | 'resolved';
  detectedAt: Date;
  relatedRecords: DeliveryRecord[];
}

export default function FraudDetection() {
  const [activities, setActivities] = useState<SuspiciousActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    detectSuspiciousActivities();
  }, []);

  const detectSuspiciousActivities = async () => {
    try {
      setLoading(true);
      const records = await getDeliveryRecords();
      const users = await getUsers();
      
      const suspiciousActivities: SuspiciousActivity[] = [];
      
      // 사용자별로 레코드 그룹화
      const userRecords = new Map<string, DeliveryRecord[]>();
      records.forEach(record => {
        const existing = userRecords.get(record.userId) || [];
        userRecords.set(record.userId, [...existing, record]);
      });
      
      // 각 사용자의 활동 분석
      userRecords.forEach((userRecordList, userId) => {
        const user = users.find(u => u.id === userId);
        if (!user) return;
        
        // 1. 중복 업로드 감지 (같은 날짜에 여러 업로드)
        const dateGroups = new Map<string, DeliveryRecord[]>();
        userRecordList.forEach(record => {
          const existing = dateGroups.get(record.date) || [];
          dateGroups.set(record.date, [...existing, record]);
        });
        
        dateGroups.forEach((dateRecords, date) => {
          if (dateRecords.length > 1) {
            suspiciousActivities.push({
              id: `dup-${userId}-${date}`,
              userId,
              userName: user.nickname || user.email,
              type: 'duplicate',
              description: `${date}에 ${dateRecords.length}개의 중복 업로드 감지`,
              severity: dateRecords.length > 2 ? 'high' : 'medium',
              status: 'pending',
              detectedAt: new Date(),
              relatedRecords: dateRecords
            });
          }
        });
        
        // 2. 비정상적으로 높은 금액 감지
        const avgAmount = userRecordList.reduce((sum, r) => sum + r.amount, 0) / userRecordList.length;
        userRecordList.forEach(record => {
          if (record.amount > avgAmount * 3) {
            suspiciousActivities.push({
              id: `high-${record.id}`,
              userId,
              userName: user.nickname || user.email,
              type: 'high_amount',
              description: `평균(${Math.round(avgAmount).toLocaleString()}원)보다 3배 이상 높은 금액(${record.amount.toLocaleString()}원)`,
              severity: record.amount > avgAmount * 5 ? 'high' : 'medium',
              status: 'pending',
              detectedAt: new Date(),
              relatedRecords: [record]
            });
          }
        });
        
                 // 3. 짧은 시간 내 연속 업로드 감지
         const sortedRecords = [...userRecordList]
           .filter(r => r.createdAt) // createdAt이 있는 것만 필터링
           .sort((a, b) => 
             new Date(a.createdAt!).getTime() - new Date(b.createdAt!).getTime()
           );
         
         for (let i = 1; i < sortedRecords.length; i++) {
           const timeDiff = new Date(sortedRecords[i].createdAt!).getTime() - 
                           new Date(sortedRecords[i-1].createdAt!).getTime();
           const minutesDiff = timeDiff / (1000 * 60);
          
          if (minutesDiff < 5) {
            suspiciousActivities.push({
              id: `rapid-${sortedRecords[i].id}`,
              userId,
              userName: user.nickname || user.email,
              type: 'rapid_upload',
              description: `${Math.round(minutesDiff)}분 간격으로 연속 업로드`,
              severity: minutesDiff < 1 ? 'high' : 'low',
              status: 'pending',
              detectedAt: new Date(),
              relatedRecords: [sortedRecords[i-1], sortedRecords[i]]
            });
          }
        }
        
        // 4. 패턴 이상 감지 (일정한 금액의 반복)
        const amountCounts = new Map<number, number>();
        userRecordList.forEach(record => {
          const count = amountCounts.get(record.amount) || 0;
          amountCounts.set(record.amount, count + 1);
        });
        
        amountCounts.forEach((count, amount) => {
          if (count >= 3 && userRecordList.length > 5) {
            const percentage = (count / userRecordList.length) * 100;
            if (percentage > 50) {
              suspiciousActivities.push({
                id: `pattern-${userId}-${amount}`,
                userId,
                userName: user.nickname || user.email,
                type: 'pattern_anomaly',
                description: `${amount.toLocaleString()}원이 전체의 ${Math.round(percentage)}% 반복`,
                severity: percentage > 70 ? 'high' : 'medium',
                status: 'pending',
                detectedAt: new Date(),
                relatedRecords: userRecordList.filter(r => r.amount === amount)
              });
            }
          }
        });
      });
      
      setActivities(suspiciousActivities);
    } catch (error) {
      console.error('부정 행위 감지 오류:', error);
      toast.error('부정 행위 감지에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const updateActivityStatus = async (activityId: string, newStatus: 'reviewed' | 'resolved') => {
    try {
      setActivities(activities.map(activity =>
        activity.id === activityId
          ? { ...activity, status: newStatus }
          : activity
      ));
      toast.success(`상태가 ${newStatus === 'reviewed' ? '검토됨' : '해결됨'}으로 변경되었습니다.`);
    } catch (error) {
      console.error('상태 업데이트 오류:', error);
      toast.error('상태 업데이트에 실패했습니다.');
    }
  };

  const filteredActivities = activities.filter(activity => {
    const matchesType = filterType === 'all' || activity.type === filterType;
    const matchesStatus = filterStatus === 'all' || activity.status === filterStatus;
    const matchesSearch = activity.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         activity.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesType && matchesStatus && matchesSearch;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-800"></div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* 헤더 */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">부정행위 감지</h2>
        <p className="text-gray-600 mt-1">의심스러운 활동을 자동으로 감지하고 관리합니다</p>
      </div>

      {/* 필터 및 검색 */}
      <div className="mb-6 flex flex-col lg:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <input
              type="text"
              placeholder="사용자 이름 또는 설명으로 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          </div>
        </div>
        
        <div className="flex gap-3">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">모든 유형</option>
            <option value="duplicate">중복 업로드</option>
            <option value="high_amount">높은 금액</option>
            <option value="rapid_upload">연속 업로드</option>
            <option value="pattern_anomaly">패턴 이상</option>
          </select>
          
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">모든 상태</option>
            <option value="pending">대기중</option>
            <option value="reviewed">검토됨</option>
            <option value="resolved">해결됨</option>
          </select>
        </div>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
          <p className="text-sm text-gray-600">전체 감지</p>
          <p className="text-2xl font-bold text-gray-900">{activities.length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
          <p className="text-sm text-gray-600">대기중</p>
          <p className="text-2xl font-bold text-yellow-600">
            {activities.filter(a => a.status === 'pending').length}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
          <p className="text-sm text-gray-600">높은 위험도</p>
          <p className="text-2xl font-bold text-red-600">
            {activities.filter(a => a.severity === 'high').length}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
          <p className="text-sm text-gray-600">해결됨</p>
          <p className="text-2xl font-bold text-green-600">
            {activities.filter(a => a.status === 'resolved').length}
          </p>
        </div>
      </div>

      {/* 의심 활동 목록 */}
      <div className="bg-white shadow-sm rounded-lg overflow-hidden border border-gray-100">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                사용자
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                유형
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                설명
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                위험도
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                상태
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                작업
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredActivities.map((activity) => (
              <tr key={activity.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {activity.userName}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                    {activity.type === 'duplicate' && '중복 업로드'}
                    {activity.type === 'high_amount' && '높은 금액'}
                    {activity.type === 'rapid_upload' && '연속 업로드'}
                    {activity.type === 'pattern_anomaly' && '패턴 이상'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-900">{activity.description}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    관련 기록: {activity.relatedRecords.length}개
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    activity.severity === 'high' 
                      ? 'bg-red-100 text-red-800'
                      : activity.severity === 'medium'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {activity.severity === 'high' && '높음'}
                    {activity.severity === 'medium' && '중간'}
                    {activity.severity === 'low' && '낮음'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    activity.status === 'pending'
                      ? 'bg-yellow-100 text-yellow-800'
                      : activity.status === 'reviewed'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {activity.status === 'pending' && '대기중'}
                    {activity.status === 'reviewed' && '검토됨'}
                    {activity.status === 'resolved' && '해결됨'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex items-center gap-2">
                    {activity.status === 'pending' && (
                      <button
                        onClick={() => updateActivityStatus(activity.id, 'reviewed')}
                        className="text-blue-600 hover:text-blue-900"
                        title="검토 완료"
                      >
                        <FaCheckCircle />
                      </button>
                    )}
                    {activity.status !== 'resolved' && (
                      <button
                        onClick={() => updateActivityStatus(activity.id, 'resolved')}
                        className="text-green-600 hover:text-green-900"
                        title="해결됨"
                      >
                        <FaTimesCircle />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {filteredActivities.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">감지된 의심 활동이 없습니다.</p>
          </div>
        )}
      </div>
    </div>
  );
} 
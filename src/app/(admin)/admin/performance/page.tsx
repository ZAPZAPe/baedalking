'use client';

import { useState, useEffect } from 'react';
import { FaSearch, FaFilter, FaCheck, FaTimes, FaVideo, FaExclamationTriangle } from 'react-icons/fa';
import { getDeliveryRecords, updateDeliveryStatus } from '@/services/adminService';
import { DeliveryRecord } from '@/types/delivery';

interface ExtendedDeliveryRecord extends Omit<DeliveryRecord, 'userId' | 'status'> {
  userNickname?: string;
  userRegion?: string;
  userId?: string;
  status: 'pending' | 'verified' | 'rejected';
  platform: string;
  amount: number;
  isFraud?: boolean;
}

export default function PerformanceReviewPage() {
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState('');
  const [showFraudOnly, setShowFraudOnly] = useState(false);

  useEffect(() => {
    const fetchRecords = async () => {
      try {
        const data = await getDeliveryRecords();
        setRecords(data);
      } catch (error) {
        console.error('실적 목록 가져오기 오류:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRecords();
  }, []);

  const handleStatusUpdate = async (recordId: string, status: 'verified' | 'rejected' | 'pending') => {
    try {
      await updateDeliveryStatus(recordId, status);
      setRecords(records.map(record => 
        record.id === recordId ? { ...record, status } as ExtendedDeliveryRecord : record
      ));
    } catch (error) {
      console.error('실적 상태 업데이트 오류:', error);
      alert('상태 업데이트에 실패했습니다.');
    }
  };

  const filteredRecords = records
    .filter(record => 
      record.userNickname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.platform.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .filter(record => !selectedPlatform || record.platform === selectedPlatform)
    .filter(record => !showFraudOnly || record.isFraud);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-white">실적 검토</h1>
        <div className="flex gap-4">
          {/* 검색 */}
          <div className="relative">
            <input
              type="text"
              placeholder="사용자/플랫폼 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-gray-800 text-white pl-10 pr-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          </div>

          {/* 플랫폼 필터 */}
          <select
            value={selectedPlatform}
            onChange={(e) => setSelectedPlatform(e.target.value)}
            className="bg-gray-800 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">전체 플랫폼</option>
            <option value="배민">배민</option>
            <option value="요기요">요기요</option>
            <option value="쿠팡이츠">쿠팡이츠</option>
            <option value="기타">기타</option>
          </select>

          {/* 위조 의심 필터 */}
          <button
            onClick={() => setShowFraudOnly(!showFraudOnly)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
              showFraudOnly
                ? 'bg-red-500/20 text-red-400'
                : 'bg-gray-800 text-gray-400'
            }`}
          >
            <FaExclamationTriangle />
            <span>위조 의심</span>
          </button>
        </div>
      </div>

      {/* 실적 목록 */}
      <div className="bg-gray-800 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-700 text-gray-300 text-sm">
              <th className="px-6 py-3 text-left">사용자</th>
              <th className="px-6 py-3 text-left">플랫폼</th>
              <th className="px-6 py-3 text-left">금액</th>
              <th className="px-6 py-3 text-left">업로드 시간</th>
              <th className="px-6 py-3 text-left">상태</th>
              <th className="px-6 py-3 text-left">관리</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {filteredRecords.map((record) => (
              <tr key={record.id} className="text-gray-300 hover:bg-gray-700/50">
                <td className="px-6 py-4">{record.userNickname}</td>
                <td className="px-6 py-4">{record.platform}</td>
                <td className="px-6 py-4">{record.amount.toLocaleString()}원</td>
                <td className="px-6 py-4">
                  {new Date(record.createdAt).toLocaleString()}
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    record.status === 'verified'
                      ? 'bg-green-500/20 text-green-400'
                      : record.status === 'rejected'
                      ? 'bg-red-500/20 text-red-400'
                      : 'bg-yellow-500/20 text-yellow-400'
                  }`}>
                    {record.status === 'verified' ? '승인' : 
                     record.status === 'rejected' ? '거절' : '대기'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleStatusUpdate(record.id, 'verified')}
                      className="p-2 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30"
                    >
                      <FaCheck />
                    </button>
                    <button
                      onClick={() => handleStatusUpdate(record.id, 'rejected')}
                      className="p-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30"
                    >
                      <FaTimes />
                    </button>
                    <button
                      onClick={() => handleStatusUpdate(record.id, 'pending')}
                      className="p-2 rounded-lg bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30"
                    >
                      <FaVideo />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
} 
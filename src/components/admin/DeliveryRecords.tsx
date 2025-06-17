'use client';

import { useState, useEffect } from 'react';
import { getDeliveryRecords, updateDeliveryStatus, deleteDeliveryRecord } from '@/services/adminService';
import { DeliveryRecord } from '@/types';
import { FaCheck, FaTimes, FaTrash, FaFilter, FaSort, FaSearch, FaCalendar } from 'react-icons/fa';
import { toast } from 'react-hot-toast';

interface ExtendedDeliveryRecord extends DeliveryRecord {
  userNickname?: string;
  userRegion?: string;
}

export default function DeliveryRecords() {
  const [records, setRecords] = useState<ExtendedDeliveryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPlatform, setFilterPlatform] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState<'date' | 'amount' | 'deliveries'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    fetchRecords();
  }, []);

  const fetchRecords = async () => {
    try {
      setLoading(true);
      const data = await getDeliveryRecords();
      setRecords(data);
    } catch (error) {
      console.error('배달 기록 가져오기 오류:', error);
      toast.error('배달 기록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (recordId: string) => {
    try {
      await updateDeliveryStatus(recordId, 'verified');
      setRecords(records.map(record => 
        record.id === recordId ? { ...record, verified: true } : record
      ));
      toast.success('기록이 승인되었습니다.');
    } catch (error) {
      console.error('기록 승인 오류:', error);
      toast.error('기록 승인에 실패했습니다.');
    }
  };

  const handleReject = async (recordId: string) => {
    if (!window.confirm('정말로 이 기록을 거부하시겠습니까?')) return;
    
    try {
      await updateDeliveryStatus(recordId, 'rejected');
      setRecords(records.map(record => 
        record.id === recordId ? { ...record, verified: false } : record
      ));
      toast.success('기록이 거부되었습니다.');
    } catch (error) {
      console.error('기록 거부 오류:', error);
      toast.error('기록 거부에 실패했습니다.');
    }
  };

  const handleDelete = async (recordId: string) => {
    if (!window.confirm('정말로 이 기록을 삭제하시겠습니까?')) return;
    
    try {
      await deleteDeliveryRecord('', recordId);
      setRecords(records.filter(record => record.id !== recordId));
      toast.success('기록이 삭제되었습니다.');
    } catch (error) {
      console.error('기록 삭제 오류:', error);
      toast.error('기록 삭제에 실패했습니다.');
    }
  };

  // 필터링 및 정렬
  const filteredRecords = records
    .filter(record => {
      const matchesSearch = 
        record.userNickname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.userRegion?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesPlatform = filterPlatform === 'all' || record.platform === filterPlatform;
      const matchesStatus = 
        filterStatus === 'all' ||
        (filterStatus === 'verified' && record.verified) ||
        (filterStatus === 'pending' && !record.verified);
      
      return matchesSearch && matchesPlatform && matchesStatus;
    })
    .sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'date':
          comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
          break;
        case 'amount':
          comparison = a.amount - b.amount;
          break;
        case 'deliveries':
          comparison = a.deliveryCount - b.deliveryCount;
          break;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
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
      {/* 헤더 섹션 */}
      <div className="mb-6">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* 검색 */}
          <div className="flex-1">
            <div className="relative">
              <input
                type="text"
                placeholder="사용자 이름 또는 지역으로 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            </div>
          </div>
          
          {/* 필터 */}
          <div className="flex gap-3">
            <select
              value={filterPlatform}
              onChange={(e) => setFilterPlatform(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">모든 플랫폼</option>
              <option value="배민커넥트">배민커넥트</option>
              <option value="쿠팡이츠">쿠팡이츠</option>
            </select>
            
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">모든 상태</option>
              <option value="verified">승인됨</option>
              <option value="pending">대기중</option>
            </select>
            
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'date' | 'amount' | 'deliveries')}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="date">날짜순</option>
              <option value="amount">금액순</option>
              <option value="deliveries">건수순</option>
            </select>
            
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <FaSort className={`transform ${sortOrder === 'desc' ? 'rotate-180' : ''} transition-transform`} />
            </button>
          </div>
        </div>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
          <p className="text-sm text-gray-600">전체 기록</p>
          <p className="text-2xl font-bold text-gray-900">{records.length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
          <p className="text-sm text-gray-600">승인된 기록</p>
          <p className="text-2xl font-bold text-green-600">{records.filter(r => r.verified).length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
          <p className="text-sm text-gray-600">대기 중</p>
          <p className="text-2xl font-bold text-yellow-600">{records.filter(r => !r.verified).length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
          <p className="text-sm text-gray-600">총 배달 금액</p>
          <p className="text-2xl font-bold text-gray-900">
            {records.reduce((sum, r) => sum + r.amount, 0).toLocaleString()}원
          </p>
        </div>
      </div>

      {/* 배달 기록 테이블 */}
      <div className="bg-white shadow-sm rounded-lg overflow-hidden border border-gray-100">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                날짜
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                사용자
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                플랫폼
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                건수
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                금액
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
            {filteredRecords.map((record) => (
              <tr key={record.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <FaCalendar className="text-gray-400 mr-2" size={14} />
                    <span className="text-sm text-gray-900">{record.date}</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {record.userNickname || '알 수 없음'}
                    </div>
                    <div className="text-sm text-gray-500">
                      {record.userRegion || '지역 미상'}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    record.platform === '배민커넥트' 
                      ? 'bg-cyan-100 text-cyan-800' 
                      : 'bg-orange-100 text-orange-800'
                  }`}>
                    {record.platform}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {record.deliveryCount}건
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {record.amount?.toLocaleString()}원
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    record.verified
                      ? 'bg-green-100 text-green-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {record.verified ? '승인됨' : '대기중'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex items-center gap-2">
                    {!record.verified && (
                      <button
                        onClick={() => handleVerify(record.id)}
                        className="text-green-600 hover:text-green-900"
                        title="승인"
                      >
                        <FaCheck />
                      </button>
                    )}
                    <button
                      onClick={() => handleReject(record.id)}
                      className="text-yellow-600 hover:text-yellow-900"
                      title="거부"
                    >
                      <FaTimes />
                    </button>
                    <button
                      onClick={() => handleDelete(record.id)}
                      className="text-red-600 hover:text-red-900"
                      title="삭제"
                    >
                      <FaTrash />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {filteredRecords.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">검색 결과가 없습니다.</p>
          </div>
        )}
      </div>
    </div>
  );
} 
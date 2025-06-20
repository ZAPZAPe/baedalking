'use client';

import { useState, useEffect } from 'react';
import { 
  FaEye, 
  FaCheckCircle, 
  FaTimesCircle,
  FaClock,
  FaSearch,
  FaFilter,
  FaDownload,
  FaCalendar,
  FaSortUp,
  FaSortDown,
  FaExclamationTriangle,
  FaCamera,
  FaTruck,
  FaBicycle,
  FaMotorcycle,
  FaCar
} from 'react-icons/fa';
import { getAllDeliveryRecords, updateDeliveryStatus, deleteDeliveryRecord } from '@/services/adminService';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { toast } from 'sonner';
import Image from 'next/image';

interface ExtendedDeliveryRecord {
  id: string;
  userId: string;
  date: string;
  amount: number;
  deliveryCount: number;
  platform: string;
  verified: boolean;
  createdAt?: string;
  updatedAt?: string;
  userNickname?: string;
  userRegion?: string;
  imageUrl?: string;
}

export default function DeliveryRecords() {
  const [records, setRecords] = useState<ExtendedDeliveryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPlatform, setFilterPlatform] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterDate, setFilterDate] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'amount' | 'deliveryCount'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedRecord, setSelectedRecord] = useState<ExtendedDeliveryRecord | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => {
    fetchRecords();
  }, []);

  const fetchRecords = async () => {
    try {
      setLoading(true);
      const data = await getAllDeliveryRecords();
      setRecords(data);
    } catch (error) {
      console.error('배달 기록 로드 오류:', error);
      toast.error('배달 기록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (recordId: string, newStatus: 'pending' | 'verified' | 'rejected') => {
    try {
      await updateDeliveryStatus(recordId, newStatus);
      toast.success('배달 기록 상태가 업데이트되었습니다.');
      await fetchRecords();
    } catch (error) {
      console.error('상태 업데이트 오류:', error);
      toast.error('상태 업데이트에 실패했습니다.');
    }
  };

  const handleDelete = async (recordId: string, userId: string) => {
    if (!confirm('정말로 이 배달 기록을 삭제하시겠습니까?')) {
      return;
    }

    try {
      await deleteDeliveryRecord(userId, recordId);
      toast.success('배달 기록이 삭제되었습니다.');
      await fetchRecords();
    } catch (error) {
      console.error('삭제 오류:', error);
      toast.error('삭제에 실패했습니다.');
    }
  };

  const getPlatformColor = (platform: string) => {
    switch (platform) {
      case 'baemin':
      case '배민커넥트':
        return 'text-blue-600';
      case 'coupang':
      case '쿠팡이츠':
        return 'text-green-600';
      case 'yogiyo':
      case '요기요':
        return 'text-orange-600';
      default:
        return 'text-gray-600';
    }
  };

  const getStatusBadge = (verified: boolean) => {
    if (verified) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <FaCheckCircle size={12} className="mr-1" />
          인증됨
        </span>
      );
    } else {
      return (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          <FaClock size={12} className="mr-1" />
                          미인증
                        </span>
      );
    }
  };

  // 필터링 및 정렬
  const filteredAndSortedRecords = records
    .filter(record => {
      const matchesSearch = record.userNickname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          record.userRegion?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesPlatform = filterPlatform === 'all' || record.platform === filterPlatform;
      const matchesStatus = filterStatus === 'all' || 
                          (filterStatus === 'verified' && record.verified) ||
                          (filterStatus === 'pending' && !record.verified);
      const matchesDate = !filterDate || record.date === filterDate;
      
      return matchesSearch && matchesPlatform && matchesStatus && matchesDate;
    })
    .sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'date':
          aValue = new Date(a.date).getTime();
          bValue = new Date(b.date).getTime();
          break;
        case 'amount':
          aValue = a.amount;
          bValue = b.amount;
          break;
        case 'deliveryCount':
          aValue = a.deliveryCount;
          bValue = b.deliveryCount;
          break;
        default:
          aValue = 0;
          bValue = 0;
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

  const platforms = Array.from(new Set(records.map(r => r.platform).filter(Boolean)));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h3 className="text-2xl font-bold text-gray-900">배달 기록 관리</h3>
          <p className="text-gray-600">총 {records.length}개의 배달 기록</p>
        </div>
        <button
          onClick={() => {/* TODO: 엑셀 다운로드 기능 */}}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all shadow-sm"
        >
          <FaDownload size={16} />
          <span className="font-medium">엑셀 다운로드</span>
        </button>
      </div>

      {/* 검색 및 필터 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="relative">
          <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="사용자 이름 또는 지역..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:outline-none text-sm"
          />
        </div>

        <div className="relative">
          <FaCalendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-900 focus:border-blue-500 focus:outline-none text-sm"
          />
        </div>

        <select
          value={filterPlatform}
          onChange={(e) => setFilterPlatform(e.target.value)}
          className="px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-900 focus:border-blue-500 focus:outline-none text-sm"
        >
          <option value="all">모든 플랫폼</option>
          {platforms.map(platform => (
            <option key={platform} value={platform}>{platform}</option>
          ))}
        </select>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-900 focus:border-blue-500 focus:outline-none text-sm"
        >
          <option value="all">모든 상태</option>
          <option value="verified">인증됨</option>
                      <option value="pending">미인증</option>
        </select>

        <select
          value={`${sortBy}-${sortOrder}`}
          onChange={(e) => {
            const [field, order] = e.target.value.split('-') as [typeof sortBy, typeof sortOrder];
            setSortBy(field);
            setSortOrder(order);
          }}
          className="px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-900 focus:border-blue-500 focus:outline-none text-sm"
        >
          <option value="date-desc">날짜 (최신순)</option>
          <option value="date-asc">날짜 (오래된순)</option>
          <option value="amount-desc">금액 (높은순)</option>
          <option value="amount-asc">금액 (낮은순)</option>
          <option value="deliveryCount-desc">건수 (많은순)</option>
          <option value="deliveryCount-asc">건수 (적은순)</option>
        </select>
      </div>

      {/* 배달 기록 테이블 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">날짜</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">사용자</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">플랫폼</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">배달 건수</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">금액</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">상태</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">제출일</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">작업</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredAndSortedRecords.map((record) => (
                <tr key={record.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 text-gray-900 font-medium">
                    {format(new Date(record.date), 'yyyy.MM.dd', { locale: ko })}
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-gray-900 font-medium">{record.userNickname || '알 수 없음'}</div>
                      <div className="text-gray-500 text-sm">{record.userRegion || '지역 미설정'}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`font-medium px-2 py-1 rounded-full text-xs bg-gray-100 ${getPlatformColor(record.platform)}`}>
                      {record.platform}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-900">
                    {record.deliveryCount}건
                  </td>
                  <td className="px-6 py-4 text-gray-900 font-medium">
                    {record.amount.toLocaleString()}원
                  </td>
                  <td className="px-6 py-4">
                    {getStatusBadge(record.verified)}
                  </td>
                  <td className="px-6 py-4 text-gray-500 text-sm">
                    {format(new Date(record.createdAt || record.date), 'yyyy-MM-dd HH:mm', { locale: ko })}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => {
                          setSelectedRecord(record);
                          setShowDetailModal(true);
                        }}
                        className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                        title="상세 보기"
                      >
                        <FaEye size={14} />
                      </button>
                      {!record.verified && (
                        <>
                          <button
                            onClick={() => handleStatusUpdate(record.id, 'verified')}
                            className="p-2 text-green-600 hover:bg-green-100 rounded-lg transition-colors"
                            title="승인"
                          >
                            <FaCheckCircle size={14} />
                          </button>
                          <button
                            onClick={() => handleStatusUpdate(record.id, 'rejected')}
                            className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                            title="반려"
                          >
                            <FaTimesCircle size={14} />
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => handleDelete(record.id, record.userId)}
                        className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                        title="삭제"
                      >
                        <FaExclamationTriangle size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 상세 보기 모달 */}
      {showDetailModal && selectedRecord && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">배달 기록 상세</h3>
              <button
                onClick={() => setShowDetailModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <FaTimesCircle size={24} />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">날짜</label>
                  <p className="text-gray-900 font-medium mt-1">
                    {format(new Date(selectedRecord.date), 'yyyy년 MM월 dd일', { locale: ko })}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">사용자</label>
                  <p className="text-gray-900 font-medium mt-1">
                    {selectedRecord.userNickname} ({selectedRecord.userRegion})
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">플랫폼</label>
                  <p className={`font-medium mt-1 ${getPlatformColor(selectedRecord.platform)}`}>
                    {selectedRecord.platform}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">상태</label>
                  <div className="mt-1">
                    {getStatusBadge(selectedRecord.verified)}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">배달 건수</label>
                  <p className="text-gray-900 font-bold text-xl mt-1">
                    {selectedRecord.deliveryCount}건
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">총 금액</label>
                  <p className="text-gray-900 font-bold text-xl mt-1">
                    {selectedRecord.amount.toLocaleString()}원
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">건당 평균</label>
                  <p className="text-blue-600 font-medium mt-1">
                    {Math.round(selectedRecord.amount / selectedRecord.deliveryCount).toLocaleString()}원
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">제출 시간</label>
                  <p className="text-gray-900 mt-1">
                    {format(new Date(selectedRecord.createdAt || selectedRecord.date), 'yyyy년 MM월 dd일 HH:mm', { locale: ko })}
                  </p>
                </div>
              </div>
            </div>

            {selectedRecord.imageUrl && (
              <div className="mt-6">
                <label className="text-sm font-medium text-gray-600 block mb-2">업로드된 이미지</label>
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <Image 
                    src={selectedRecord.imageUrl} 
                    alt="배달 기록 이미지"
                    width={600}
                    height={400}
                    className="w-full rounded-lg"
                  />
                </div>
              </div>
            )}

            <div className="mt-6 flex gap-3">
              {!selectedRecord.verified && (
                <>
                  <button
                    onClick={() => {
                      handleStatusUpdate(selectedRecord.id, 'verified');
                      setShowDetailModal(false);
                    }}
                    className="flex-1 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all font-medium"
                  >
                    승인하기
                  </button>
                  <button
                    onClick={() => {
                      handleStatusUpdate(selectedRecord.id, 'rejected');
                      setShowDetailModal(false);
                    }}
                    className="flex-1 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all font-medium"
                  >
                    반려하기
                  </button>
                </>
              )}
              <button
                onClick={() => setShowDetailModal(false)}
                className="flex-1 py-3 bg-gray-200 text-gray-900 rounded-lg hover:bg-gray-300 transition-all font-medium"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 
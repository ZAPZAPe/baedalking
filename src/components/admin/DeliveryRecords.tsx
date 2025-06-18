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
  status?: 'pending' | 'verified' | 'rejected';
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
        return 'text-cyan-400';
      case 'coupang':
      case '쿠팡이츠':
        return 'text-green-400';
      case 'yogiyo':
      case '요기요':
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  };

  const getStatusBadge = (status: string | undefined, verified: boolean) => {
    if (status === 'verified' || verified) {
      return (
        <div className="flex items-center gap-1 text-green-400">
          <FaCheckCircle size={14} />
          <span className="text-xs">인증됨</span>
        </div>
      );
    } else if (status === 'rejected') {
      return (
        <div className="flex items-center gap-1 text-red-400">
          <FaTimesCircle size={14} />
          <span className="text-xs">반려됨</span>
        </div>
      );
    } else {
      return (
        <div className="flex items-center gap-1 text-yellow-400">
          <FaClock size={14} />
          <span className="text-xs">대기중</span>
        </div>
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
                          (filterStatus === 'verified' && (record.status === 'verified' || record.verified)) ||
                          (filterStatus === 'pending' && (!record.status || record.status === 'pending') && !record.verified) ||
                          (filterStatus === 'rejected' && record.status === 'rejected');
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
          <h3 className="text-2xl font-bold text-white">배달 기록 관리</h3>
          <p className="text-zinc-400 mt-1">총 {records.length}개의 배달 기록</p>
        </div>
        <button
          onClick={() => {/* TODO: 엑셀 다운로드 기능 */}}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all shadow-lg hover:shadow-xl"
        >
          <FaDownload size={18} />
          <span className="font-medium">엑셀 다운로드</span>
        </button>
      </div>

      {/* 검색 및 필터 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="relative">
          <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            placeholder="사용자 이름 또는 지역..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-zinc-500 focus:border-purple-500 focus:outline-none"
          />
        </div>

        <div className="relative">
          <FaCalendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-400" />
          <input
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-purple-500 focus:outline-none"
          />
        </div>

        <select
          value={filterPlatform}
          onChange={(e) => setFilterPlatform(e.target.value)}
          className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-purple-500 focus:outline-none"
        >
          <option value="all">모든 플랫폼</option>
          {platforms.map(platform => (
            <option key={platform} value={platform}>{platform}</option>
          ))}
        </select>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-purple-500 focus:outline-none"
        >
          <option value="all">모든 상태</option>
          <option value="verified">인증됨</option>
          <option value="pending">대기중</option>
          <option value="rejected">반려됨</option>
        </select>

        <select
          value={`${sortBy}-${sortOrder}`}
          onChange={(e) => {
            const [field, order] = e.target.value.split('-') as [typeof sortBy, typeof sortOrder];
            setSortBy(field);
            setSortOrder(order);
          }}
          className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-purple-500 focus:outline-none"
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
      <div className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-white/5 border-b border-white/10">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-medium text-zinc-400">날짜</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-zinc-400">사용자</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-zinc-400">플랫폼</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-zinc-400">배달 건수</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-zinc-400">금액</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-zinc-400">상태</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-zinc-400">제출일</th>
                <th className="px-6 py-4 text-right text-sm font-medium text-zinc-400">작업</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredAndSortedRecords.map((record) => (
                <tr key={record.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4 text-white font-medium">
                    {format(new Date(record.date), 'yyyy.MM.dd', { locale: ko })}
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-white font-medium">{record.userNickname || '알 수 없음'}</div>
                      <div className="text-zinc-400 text-sm">{record.userRegion || '지역 미설정'}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`font-medium ${getPlatformColor(record.platform)}`}>
                      {record.platform}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-white">
                    {record.deliveryCount}건
                  </td>
                  <td className="px-6 py-4 text-white font-medium">
                    {record.amount.toLocaleString()}원
                  </td>
                  <td className="px-6 py-4">
                    {getStatusBadge(record.status, record.verified)}
                  </td>
                  <td className="px-6 py-4 text-zinc-400 text-sm">
                    {format(new Date(record.createdAt || record.date), 'yyyy-MM-dd HH:mm', { locale: ko })}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => {
                          setSelectedRecord(record);
                          setShowDetailModal(true);
                        }}
                        className="p-2 text-blue-400 hover:bg-blue-500/20 rounded-lg transition-colors"
                        title="상세 보기"
                      >
                        <FaEye size={16} />
                      </button>
                      {(!record.status || record.status === 'pending') && !record.verified && (
                        <>
                          <button
                            onClick={() => handleStatusUpdate(record.id, 'verified')}
                            className="p-2 text-green-400 hover:bg-green-500/20 rounded-lg transition-colors"
                            title="승인"
                          >
                            <FaCheckCircle size={16} />
                          </button>
                          <button
                            onClick={() => handleStatusUpdate(record.id, 'rejected')}
                            className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                            title="반려"
                          >
                            <FaTimesCircle size={16} />
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => handleDelete(record.id, record.userId)}
                        className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                        title="삭제"
                      >
                        <FaExclamationTriangle size={16} />
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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-zinc-900 to-black rounded-2xl p-6 w-full max-w-2xl border border-purple-500/20 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">배달 기록 상세</h3>
              <button
                onClick={() => setShowDetailModal(false)}
                className="text-zinc-400 hover:text-white transition-colors"
              >
                <FaTimesCircle size={24} />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-zinc-400">날짜</label>
                  <p className="text-white font-medium">
                    {format(new Date(selectedRecord.date), 'yyyy년 MM월 dd일', { locale: ko })}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-zinc-400">사용자</label>
                  <p className="text-white font-medium">
                    {selectedRecord.userNickname} ({selectedRecord.userRegion})
                  </p>
                </div>
                <div>
                  <label className="text-sm text-zinc-400">플랫폼</label>
                  <p className={`font-medium ${getPlatformColor(selectedRecord.platform)}`}>
                    {selectedRecord.platform}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-zinc-400">상태</label>
                  <div className="mt-1">
                    {getStatusBadge(selectedRecord.status, selectedRecord.verified)}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm text-zinc-400">배달 건수</label>
                  <p className="text-white font-medium text-xl">
                    {selectedRecord.deliveryCount}건
                  </p>
                </div>
                <div>
                  <label className="text-sm text-zinc-400">총 금액</label>
                  <p className="text-white font-medium text-xl">
                    {selectedRecord.amount.toLocaleString()}원
                  </p>
                </div>
                <div>
                  <label className="text-sm text-zinc-400">건당 평균</label>
                  <p className="text-purple-400 font-medium">
                    {Math.round(selectedRecord.amount / selectedRecord.deliveryCount).toLocaleString()}원
                  </p>
                </div>
                <div>
                  <label className="text-sm text-zinc-400">제출 시간</label>
                  <p className="text-white">
                    {format(new Date(selectedRecord.createdAt || selectedRecord.date), 'yyyy년 MM월 dd일 HH:mm', { locale: ko })}
                  </p>
                </div>
              </div>
            </div>

            {selectedRecord.imageUrl && (
              <div className="mt-6">
                <label className="text-sm text-zinc-400 block mb-2">업로드된 이미지</label>
                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                  <img 
                    src={selectedRecord.imageUrl} 
                    alt="배달 기록 이미지" 
                    className="w-full rounded-lg"
                  />
                </div>
              </div>
            )}

            <div className="mt-6 flex gap-3">
              {(!selectedRecord.status || selectedRecord.status === 'pending') && !selectedRecord.verified && (
                <>
                  <button
                    onClick={() => {
                      handleStatusUpdate(selectedRecord.id, 'verified');
                      setShowDetailModal(false);
                    }}
                    className="flex-1 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all font-medium"
                  >
                    승인하기
                  </button>
                  <button
                    onClick={() => {
                      handleStatusUpdate(selectedRecord.id, 'rejected');
                      setShowDetailModal(false);
                    }}
                    className="flex-1 py-3 bg-gradient-to-r from-red-600 to-rose-600 text-white rounded-xl hover:from-red-700 hover:to-rose-700 transition-all font-medium"
                  >
                    반려하기
                  </button>
                </>
              )}
              <button
                onClick={() => setShowDetailModal(false)}
                className="flex-1 py-3 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-all font-medium"
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
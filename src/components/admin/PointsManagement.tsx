'use client';

import { useState, useEffect } from 'react';
import { getUsers } from '@/services/adminService';
import { UserProfile } from '@/types';
import { FaCoins, FaPlus, FaMinus, FaHistory, FaSearch, FaGift } from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import { supabase } from '@/lib/supabase';

interface PointHistory {
  id: string;
  userId: string;
  amount: number;
  type: 'add' | 'subtract' | 'reward' | 'penalty';
  reason: string;
  createdAt: string;
  adminId?: string;
}

interface UserWithHistory extends UserProfile {
  pointHistory?: PointHistory[];
}

export default function PointsManagement() {
  const [users, setUsers] = useState<UserWithHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserWithHistory | null>(null);
  const [showPointModal, setShowPointModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [pointAction, setPointAction] = useState<'add' | 'subtract'>('add');
  const [pointAmount, setPointAmount] = useState('');
  const [pointReason, setPointReason] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const userData = await getUsers();
      setUsers(userData);
    } catch (error) {
      console.error('사용자 데이터 가져오기 오류:', error);
      toast.error('사용자 데이터를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const fetchPointHistory = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('point_history')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as PointHistory[];
    } catch (error) {
      console.error('포인트 내역 가져오기 오류:', error);
      return [];
    }
  };

  const handlePointAction = async () => {
    if (!selectedUser || !pointAmount || !pointReason) {
      toast.error('모든 필드를 입력해주세요.');
      return;
    }

    const amount = parseInt(pointAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('올바른 포인트 금액을 입력해주세요.');
      return;
    }

    try {
      // 포인트 업데이트
      const newPoints = pointAction === 'add' 
        ? selectedUser.points + amount 
        : Math.max(0, selectedUser.points - amount);

      const { error: updateError } = await supabase
        .from('users')
        .update({ 
          points: newPoints,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedUser.id);

      if (updateError) throw updateError;

      // 포인트 내역 기록
      const { error: historyError } = await supabase
        .from('point_history')
        .insert({
          user_id: selectedUser.id,
          amount: pointAction === 'add' ? amount : -amount,
          type: pointAction === 'add' ? 'reward' : 'penalty',
          reason: pointReason,
          created_at: new Date().toISOString()
        });

      if (historyError) throw historyError;

      // 상태 업데이트
      setUsers(users.map(user => 
        user.id === selectedUser.id 
          ? { ...user, points: newPoints }
          : user
      ));

      toast.success(`포인트가 ${pointAction === 'add' ? '지급' : '차감'}되었습니다.`);
      setShowPointModal(false);
      resetPointForm();
    } catch (error) {
      console.error('포인트 처리 오류:', error);
      toast.error('포인트 처리에 실패했습니다.');
    }
  };

  const handleBulkReward = async () => {
    if (!window.confirm('모든 사용자에게 100 포인트를 지급하시겠습니까?')) return;

    try {
      // 모든 사용자 포인트 업데이트
      const { error: updateError } = await supabase
        .from('users')
        .update({ 
          points: supabase.sql`points + 100`,
          updated_at: new Date().toISOString()
        })
        .neq('id', '');

      if (updateError) throw updateError;

      // 포인트 내역 기록
      const historyInserts = users.map(user => ({
        user_id: user.id,
        amount: 100,
        type: 'reward',
        reason: '전체 사용자 보상',
        created_at: new Date().toISOString()
      }));

      const { error: historyError } = await supabase
        .from('point_history')
        .insert(historyInserts);

      if (historyError) throw historyError;

      // 사용자 목록 새로고침
      fetchUsers();
      toast.success('모든 사용자에게 포인트가 지급되었습니다.');
    } catch (error) {
      console.error('일괄 포인트 지급 오류:', error);
      toast.error('일괄 포인트 지급에 실패했습니다.');
    }
  };

  const showHistory = async (user: UserWithHistory) => {
    setSelectedUser(user);
    const history = await fetchPointHistory(user.id);
    setSelectedUser({ ...user, pointHistory: history });
    setShowHistoryModal(true);
  };

  const resetPointForm = () => {
    setPointAmount('');
    setPointReason('');
    setPointAction('add');
    setSelectedUser(null);
  };

  const filteredUsers = users.filter(user =>
    user.nickname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.region?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">포인트 관리</h2>
            <p className="text-gray-600 mt-1">사용자 포인트 지급 및 차감</p>
          </div>
          
          <button
            onClick={handleBulkReward}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
          >
            <FaGift />
            전체 사용자 보상
          </button>
        </div>
      </div>

      {/* 검색 바 */}
      <div className="mb-6">
        <div className="relative max-w-lg">
          <input
            type="text"
            placeholder="이름, 이메일, 지역으로 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        </div>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
          <p className="text-sm text-gray-600">총 포인트</p>
          <p className="text-2xl font-bold text-gray-900">
            {users.reduce((sum, u) => sum + u.points, 0).toLocaleString()}P
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
          <p className="text-sm text-gray-600">평균 포인트</p>
          <p className="text-2xl font-bold text-gray-900">
            {users.length > 0 
              ? Math.round(users.reduce((sum, u) => sum + u.points, 0) / users.length).toLocaleString()
              : 0}P
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
          <p className="text-sm text-gray-600">최고 포인트</p>
          <p className="text-2xl font-bold text-gray-900">
            {Math.max(...users.map(u => u.points), 0).toLocaleString()}P
          </p>
        </div>
      </div>

      {/* 사용자 포인트 테이블 */}
      <div className="bg-white shadow-sm rounded-lg overflow-hidden border border-gray-100">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                사용자
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                지역
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                현재 포인트
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                작업
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredUsers.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {user.nickname || '미설정'}
                    </div>
                    <div className="text-sm text-gray-500">
                      {user.email}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                    {user.region || '미설정'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <FaCoins className="text-yellow-500 mr-2" />
                    <span className="text-lg font-bold text-gray-900">
                      {user.points.toLocaleString()}P
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setSelectedUser(user);
                        setPointAction('add');
                        setShowPointModal(true);
                      }}
                      className="text-green-600 hover:text-green-900"
                      title="포인트 지급"
                    >
                      <FaPlus />
                    </button>
                    <button
                      onClick={() => {
                        setSelectedUser(user);
                        setPointAction('subtract');
                        setShowPointModal(true);
                      }}
                      className="text-red-600 hover:text-red-900"
                      title="포인트 차감"
                    >
                      <FaMinus />
                    </button>
                    <button
                      onClick={() => showHistory(user)}
                      className="text-blue-600 hover:text-blue-900"
                      title="포인트 내역"
                    >
                      <FaHistory />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {filteredUsers.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">검색 결과가 없습니다.</p>
          </div>
        )}
      </div>

      {/* 포인트 지급/차감 모달 */}
      {showPointModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              포인트 {pointAction === 'add' ? '지급' : '차감'}
            </h3>
            
            <div className="mb-4">
              <p className="text-sm text-gray-600">대상 사용자</p>
              <p className="font-medium">{selectedUser.nickname} ({selectedUser.email})</p>
              <p className="text-sm text-gray-500">현재 포인트: {selectedUser.points.toLocaleString()}P</p>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {pointAction === 'add' ? '지급' : '차감'}할 포인트
                </label>
                <input
                  type="number"
                  value={pointAmount}
                  onChange={(e) => setPointAmount(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="포인트 입력"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  사유
                </label>
                <textarea
                  value={pointReason}
                  onChange={(e) => setPointReason(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="포인트 지급/차감 사유를 입력하세요"
                />
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowPointModal(false);
                  resetPointForm();
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                취소
              </button>
              <button
                onClick={handlePointAction}
                className={`flex-1 px-4 py-2 text-white rounded-md ${
                  pointAction === 'add' 
                    ? 'bg-green-600 hover:bg-green-700' 
                    : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {pointAction === 'add' ? '지급' : '차감'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 포인트 내역 모달 */}
      {showHistoryModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                포인트 내역 - {selectedUser.nickname}
              </h3>
              <button
                onClick={() => setShowHistoryModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto">
              {selectedUser.pointHistory && selectedUser.pointHistory.length > 0 ? (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        날짜
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        유형
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        포인트
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        사유
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {selectedUser.pointHistory.map((history) => (
                      <tr key={history.id}>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                          {new Date(history.createdAt).toLocaleString()}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            history.type === 'reward' || history.type === 'add'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {history.type === 'reward' || history.type === 'add' ? '지급' : '차감'}
                          </span>
                        </td>
                        <td className={`px-4 py-3 whitespace-nowrap text-sm font-medium ${
                          history.amount > 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {history.amount > 0 ? '+' : ''}{history.amount.toLocaleString()}P
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {history.reason}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="text-center text-gray-500 py-8">포인트 내역이 없습니다.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 
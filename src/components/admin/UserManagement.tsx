'use client';

import { useEffect, useState } from 'react';
import { getUsers, updateUserRole, createUser, deleteUser, updateUserData, getTodayDeliveryData } from '@/services/adminService';
import { UserProfile } from '@/types';
import { FaUserShield, FaUser, FaPlus, FaTimes, FaTrash, FaEdit, FaSearch, FaSave } from 'react-icons/fa';
import { toast } from 'react-hot-toast';

interface UserWithTodayData extends UserProfile {
  todayDeliveries: number;
  todayEarnings: number;
  verified: boolean;
  editedDeliveries?: number;
  editedEarnings?: number;
  editedVerified?: boolean;
  editedPoints?: number;
  saving?: boolean;
}

export default function UserManagement() {
  const [users, setUsers] = useState<UserWithTodayData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newUser, setNewUser] = useState({
    email: '',
    password: '',
    nickname: '',
    region: '',
    vehicle: 'bicycle',
    phone: '',
    role: 'user' as 'user' | 'admin'
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const [userData, todayData] = await Promise.all([
        getUsers(),
        getTodayDeliveryData()
      ]);
      
      const usersWithTodayData = userData.map(user => {
        const today = todayData.get(user.id) || { deliveryCount: 0, earnings: 0, verified: false };
        return {
          ...user,
          todayDeliveries: today.deliveryCount,
          todayEarnings: today.earnings,
          verified: today.verified
        };
      });
      
      setUsers(usersWithTodayData);
    } catch (error) {
      console.error('사용자 목록 가져오기 오류:', error);
      toast.error('사용자 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await createUser(newUser);
      toast.success('새 사용자가 추가되었습니다!');
      setShowAddModal(false);
      setNewUser({
        email: '',
        password: '',
        nickname: '',
        region: '',
        vehicle: 'bicycle',
        phone: '',
        role: 'user'
      });
      fetchUsers(); // 사용자 목록 새로고침
    } catch (error: any) {
      console.error('사용자 생성 오류:', error);
      toast.error(error.message || '사용자 생성에 실패했습니다.');
    }
  };

  const handleRoleChange = async (userId: string, newRole: 'user' | 'admin') => {
    try {
      await updateUserRole(userId, newRole);
      setUsers(users.map(user => 
        user.id === userId ? { ...user, role: newRole } : user
      ));
      toast.success('권한이 변경되었습니다.');
    } catch (error) {
      console.error('사용자 권한 변경 오류:', error);
      toast.error('권한 변경에 실패했습니다.');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm('정말로 이 사용자를 삭제하시겠습니까?')) return;
    
    try {
      await deleteUser(userId);
      setUsers(users.filter(user => user.id !== userId));
      toast.success('사용자가 삭제되었습니다.');
    } catch (error) {
      console.error('사용자 삭제 오류:', error);
      toast.error('사용자 삭제에 실패했습니다.');
    }
  };

  const handleFieldEdit = (userId: string, field: string, value: any) => {
    setUsers(users.map(user => 
      user.id === userId ? { ...user, [field]: value } : user
    ));
  };

  const handleSaveUser = async (user: UserWithTodayData) => {
    setUsers(users.map(u => 
      u.id === user.id ? { ...u, saving: true } : u
    ));

    try {
      const updateData: any = {};
      
      if (user.editedDeliveries !== undefined) {
        updateData.todayDeliveries = user.editedDeliveries;
      }
      if (user.editedEarnings !== undefined) {
        updateData.todayEarnings = user.editedEarnings;
      }
      if (user.editedVerified !== undefined) {
        updateData.verified = user.editedVerified;
      }
      if (user.editedPoints !== undefined) {
        updateData.points = user.editedPoints;
      }
      
      // 실제 API 호출
      await updateUserData(user.id, updateData);
      
      // 성공 시 편집 값들을 실제 값으로 반영
      setUsers(users.map(u => 
        u.id === user.id ? {
          ...u,
          todayDeliveries: user.editedDeliveries ?? u.todayDeliveries,
          todayEarnings: user.editedEarnings ?? u.todayEarnings,
          verified: user.editedVerified ?? u.verified,
          points: user.editedPoints ?? u.points,
          editedDeliveries: undefined,
          editedEarnings: undefined,
          editedVerified: undefined,
          editedPoints: undefined,
          saving: false
        } : u
      ));
      
      toast.success('사용자 정보가 저장되었습니다.');
    } catch (error) {
      console.error('사용자 정보 저장 오류:', error);
      toast.error('저장에 실패했습니다.');
      setUsers(users.map(u => 
        u.id === user.id ? { ...u, saving: false } : u
      ));
    }
  };

  const filteredUsers = users.filter(user => 
    user.nickname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.region?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const hasChanges = (user: UserWithTodayData) => {
    return user.editedDeliveries !== undefined ||
           user.editedEarnings !== undefined ||
           user.editedVerified !== undefined ||
           user.editedPoints !== undefined;
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
      {/* 헤더 섹션 */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex-1 max-w-lg">
          <div className="relative">
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
        <button
          onClick={() => setShowAddModal(true)}
          className="ml-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <FaPlus size={14} />
          새 사용자 추가
        </button>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
          <p className="text-sm text-gray-600">전체 사용자</p>
          <p className="text-2xl font-bold text-gray-900">{users.length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
          <p className="text-sm text-gray-600">관리자</p>
          <p className="text-2xl font-bold text-gray-900">{users.filter(u => u.role === 'admin').length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
          <p className="text-sm text-gray-600">오늘 활동</p>
          <p className="text-2xl font-bold text-gray-900">{users.filter(u => u.todayDeliveries > 0).length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
          <p className="text-sm text-gray-600">오늘 수익</p>
          <p className="text-2xl font-bold text-gray-900">
            {users.reduce((sum, u) => sum + (u.todayEarnings || 0), 0).toLocaleString()}원
          </p>
        </div>
      </div>

      {/* 사용자 테이블 */}
      <div className="bg-white shadow-sm rounded-lg overflow-hidden border border-gray-100">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                사용자 이름
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                이메일
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                오늘 배달 건수
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                오늘 수익
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                인증 여부
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                포인트
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
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center mr-3">
                      {user.role === 'admin' ? <FaUserShield className="text-gray-600" /> : <FaUser className="text-gray-600" />}
                    </div>
                    <div className="text-sm font-medium text-gray-900">
                      {user.nickname || '미설정'}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{user.email}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <input
                    type="number"
                    value={user.editedDeliveries ?? user.todayDeliveries}
                    onChange={(e) => handleFieldEdit(user.id, 'editedDeliveries', parseInt(e.target.value) || 0)}
                    className="w-20 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <input
                    type="number"
                    value={user.editedEarnings ?? user.todayEarnings}
                    onChange={(e) => handleFieldEdit(user.id, 'editedEarnings', parseInt(e.target.value) || 0)}
                    className="w-24 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <select
                    value={user.editedVerified !== undefined ? user.editedVerified.toString() : user.verified.toString()}
                    onChange={(e) => handleFieldEdit(user.id, 'editedVerified', e.target.value === 'true')}
                    className="text-sm border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 px-2 py-1"
                  >
                    <option value="true">인증</option>
                    <option value="false">미인증</option>
                  </select>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <input
                      type="number"
                      value={user.editedPoints ?? user.points}
                      onChange={(e) => handleFieldEdit(user.id, 'editedPoints', parseInt(e.target.value) || 0)}
                      className="w-20 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                    <span className="ml-1 text-sm text-gray-500">P</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleSaveUser(user)}
                      disabled={!hasChanges(user) || user.saving}
                      className={`px-3 py-1 rounded text-white flex items-center gap-1 ${
                        hasChanges(user) && !user.saving
                          ? 'bg-green-600 hover:bg-green-700' 
                          : 'bg-gray-300 cursor-not-allowed'
                      }`}
                      title="저장"
                    >
                      <FaSave size={14} />
                      {user.saving ? '저장 중...' : '저장'}
                    </button>
                    <button
                      onClick={() => handleDeleteUser(user.id)}
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
      </div>

      {/* 새 사용자 추가 모달 */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">새 사용자 추가</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <FaTimes size={20} />
              </button>
            </div>
            
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">이메일</label>
                <input
                  type="email"
                  required
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">비밀번호</label>
                <input
                  type="password"
                  required
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">닉네임</label>
                <input
                  type="text"
                  required
                  value={newUser.nickname}
                  onChange={(e) => setNewUser({ ...newUser, nickname: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">지역</label>
                <input
                  type="text"
                  value={newUser.region}
                  onChange={(e) => setNewUser({ ...newUser, region: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">차량</label>
                <select
                  value={newUser.vehicle}
                  onChange={(e) => setNewUser({ ...newUser, vehicle: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="bicycle">자전거</option>
                  <option value="motorcycle">오토바이</option>
                  <option value="car">자동차</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">전화번호</label>
                <input
                  type="tel"
                  value={newUser.phone}
                  onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">권한</label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value as 'user' | 'admin' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="user">일반 사용자</option>
                  <option value="admin">관리자</option>
                </select>
              </div>
              
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  추가
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
} 
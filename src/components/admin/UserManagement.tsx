'use client';

import { useEffect, useState } from 'react';
import { getUsers, updateUserRole, createUser, deleteUser, updateUserData, getTodayDeliveryData } from '@/services/adminService';
import { UserProfile } from '@/types';
import { FaUserShield, FaUser, FaPlus, FaTimes, FaTrash, FaEdit, FaSearch, FaSave, FaCalendar, FaCoins } from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import { supabase } from '@/lib/supabase';

interface UserWithTodayData extends UserProfile {
  todayDeliveries: number;
  todayEarnings: number;
  verified: boolean;
  pointsAdjustment?: number;
  saving?: boolean;
}

export default function UserManagement() {
  const [users, setUsers] = useState<UserWithTodayData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDateModal, setShowDateModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserWithTodayData | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [dateData, setDateData] = useState({
    deliveries: 0,
    earnings: 0,
    verified: false,
    platform: '배민커넥트' as '배민커넥트' | '쿠팡이츠'
  });
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
      
      // 포인트 조정이 있는 경우
      if (user.pointsAdjustment !== undefined && user.pointsAdjustment !== 0) {
        const newPoints = user.points + user.pointsAdjustment;
        updateData.points = newPoints;
        
        // 포인트 변경 기록
        await supabase
          .from('point_history')
          .insert({
            user_id: user.id,
            points: user.pointsAdjustment,
            reason: user.pointsAdjustment > 0 ? '관리자 포인트 추가' : '관리자 포인트 차감'
          });
      }
      
      // 실제 API 호출
      await updateUserData(user.id, updateData);
      
      // 성공 시 편집 값들을 실제 값으로 반영
      setUsers(users.map(u => 
        u.id === user.id ? {
          ...u,
          points: updateData.points ?? u.points,
          pointsAdjustment: undefined,
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

  const handleDateDataSubmit = async () => {
    if (!selectedUser) return;

    try {
      console.log('실적 저장 시작:', {
        user: selectedUser.nickname,
        date: selectedDate,
        data: dateData
      });

      // 선택한 날짜의 배달 기록 확인
      const { data: existingRecords, error: selectError } = await supabase
        .from('delivery_records')
        .select('*')
        .eq('user_id', selectedUser.id)
        .eq('date', selectedDate)
        .eq('platform', dateData.platform);

      if (selectError) {
        console.error('기존 기록 조회 오류:', selectError);
        throw selectError;
      }

      if (existingRecords && existingRecords.length > 0) {
        // 기존 기록 업데이트
        const { data: updateData, error: updateError } = await supabase
          .from('delivery_records')
          .update({
            delivery_count: dateData.deliveries,
            amount: dateData.earnings,
            verified: dateData.verified,
            platform: dateData.platform,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingRecords[0].id);

        if (updateError) {
          console.error('업데이트 오류:', updateError);
          throw updateError;
        }
        console.log('업데이트 성공:', updateData);
      } else {
        // 새 기록 생성
        const { data: insertData, error: insertError } = await supabase
          .from('delivery_records')
          .insert({
            user_id: selectedUser.id,
            date: selectedDate,
            delivery_count: dateData.deliveries,
            amount: dateData.earnings,
            platform: dateData.platform,
            verified: dateData.verified,
            created_at: new Date().toISOString()
          });

        if (insertError) {
          console.error('삽입 오류:', insertError);
          throw insertError;
        }
        console.log('삽입 성공:', insertData);
      }

      toast.success('날짜별 실적이 저장되었습니다.');
      setShowDateModal(false);
      setSelectedUser(null);
      setDateData({ deliveries: 0, earnings: 0, verified: false, platform: '배민커넥트' });
      
      // 목록 새로고침
      fetchUsers();
    } catch (error: any) {
      console.error('날짜별 실적 저장 오류:', error);
      toast.error(error.message || '저장에 실패했습니다.');
    }
  };

  const filteredUsers = users.filter(user => 
    user.nickname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.region?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const hasChanges = (user: UserWithTodayData) => {
    return (user.pointsAdjustment !== undefined && user.pointsAdjustment !== 0);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
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
              className="w-full pl-10 pr-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-400" />
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
        <div className="bg-zinc-800 p-4 rounded-lg border border-zinc-700">
          <p className="text-sm text-zinc-400">전체 사용자</p>
          <p className="text-2xl font-bold text-white">{users.length}</p>
        </div>
        <div className="bg-zinc-800 p-4 rounded-lg border border-zinc-700">
          <p className="text-sm text-zinc-400">관리자</p>
          <p className="text-2xl font-bold text-white">{users.filter(u => u.role === 'admin').length}</p>
        </div>
        <div className="bg-zinc-800 p-4 rounded-lg border border-zinc-700">
          <p className="text-sm text-zinc-400">오늘 활동</p>
          <p className="text-2xl font-bold text-white">{users.filter(u => u.todayDeliveries > 0).length}</p>
        </div>
        <div className="bg-zinc-800 p-4 rounded-lg border border-zinc-700">
          <p className="text-sm text-zinc-400">오늘 수익</p>
          <p className="text-2xl font-bold text-white">
            {users.reduce((sum, u) => sum + (u.todayEarnings || 0), 0).toLocaleString()}원
          </p>
        </div>
      </div>

      {/* 사용자 테이블 */}
      <div className="bg-zinc-800 rounded-lg overflow-hidden border border-zinc-700">
        <table className="min-w-full divide-y divide-zinc-700">
          <thead className="bg-zinc-900">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">
                사용자 이름
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">
                이메일
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">
                오늘 실적
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">
                포인트
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">
                권한
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">
                작업
              </th>
            </tr>
          </thead>
          <tbody className="bg-zinc-800 divide-y divide-zinc-700">
            {filteredUsers.map((user) => (
              <tr key={user.id} className="hover:bg-zinc-700/50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-zinc-700 rounded-full flex items-center justify-center mr-3">
                      {user.role === 'admin' ? <FaUserShield className="text-yellow-400" /> : <FaUser className="text-zinc-400" />}
                    </div>
                    <div className="text-sm font-medium text-white">
                      {user.nickname || '미설정'}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-zinc-300">{user.email}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-zinc-400">{user.todayDeliveries}건</span>
                      <span className="text-sm text-zinc-400">{user.todayEarnings.toLocaleString()}원</span>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedUser(user);
                        setShowDateModal(true);
                      }}
                      className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm flex items-center gap-1"
                      title="날짜별 실적 입력"
                    >
                      <FaCalendar size={12} />
                      실적 입력
                    </button>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="space-y-1">
                    <div className="flex items-center">
                      <span className="text-sm text-white font-medium">{user.points.toLocaleString()}P</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        value={user.pointsAdjustment ?? 0}
                        onChange={(e) => handleFieldEdit(user.id, 'pointsAdjustment', parseInt(e.target.value) || 0)}
                        placeholder="+/-"
                        className="w-20 px-2 py-1 text-sm bg-zinc-700 border border-zinc-600 rounded text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                      <FaCoins className="text-yellow-400" size={12} />
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <select
                    value={user.role}
                    onChange={(e) => handleRoleChange(user.id, e.target.value as 'user' | 'admin')}
                    className="text-sm bg-zinc-700 border border-zinc-600 rounded px-2 py-1 text-white focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="user">일반</option>
                    <option value="admin">관리자</option>
                  </select>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleSaveUser(user)}
                      disabled={!hasChanges(user) || user.saving}
                      className={`px-3 py-1 rounded text-white flex items-center gap-1 ${
                        hasChanges(user) && !user.saving
                          ? 'bg-green-600 hover:bg-green-700' 
                          : 'bg-zinc-600 cursor-not-allowed'
                      }`}
                      title="저장"
                    >
                      <FaSave size={14} />
                      {user.saving ? '저장 중...' : '저장'}
                    </button>
                    <button
                      onClick={() => handleDeleteUser(user.id)}
                      className="text-red-400 hover:text-red-300"
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

      {/* 날짜별 실적 입력 모달 */}
      {showDateModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 rounded-lg p-6 w-full max-w-md border border-zinc-800">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">
                {selectedUser.nickname} - 날짜별 실적 입력
              </h3>
              <button
                onClick={() => {
                  setShowDateModal(false);
                  setSelectedUser(null);
                  setDateData({ deliveries: 0, earnings: 0, verified: false, platform: '배민커넥트' });
                }}
                className="text-zinc-400 hover:text-white"
              >
                <FaTimes size={20} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1">날짜</label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1">플랫폼</label>
                <select
                  value={dateData.platform}
                  onChange={(e) => setDateData({ ...dateData, platform: e.target.value as '배민커넥트' | '쿠팡이츠' })}
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="배민커넥트">배민커넥트</option>
                  <option value="쿠팡이츠">쿠팡이츠</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1">배달 건수</label>
                <input
                  type="number"
                  value={dateData.deliveries}
                  onChange={(e) => setDateData({ ...dateData, deliveries: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1">수익</label>
                <input
                  type="number"
                  value={dateData.earnings}
                  onChange={(e) => setDateData({ ...dateData, earnings: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1">인증 상태</label>
                <select
                  value={dateData.verified.toString()}
                  onChange={(e) => setDateData({ ...dateData, verified: e.target.value === 'true' })}
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="false">미인증</option>
                  <option value="true">인증</option>
                </select>
              </div>
              
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowDateModal(false);
                    setSelectedUser(null);
                    setDateData({ deliveries: 0, earnings: 0, verified: false, platform: '배민커넥트' });
                  }}
                  className="flex-1 px-4 py-2 border border-zinc-700 text-zinc-300 rounded-md hover:bg-zinc-800"
                >
                  취소
                </button>
                <button
                  onClick={handleDateDataSubmit}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  저장
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 새 사용자 추가 모달 */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 rounded-lg p-6 w-full max-w-md border border-zinc-800">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">새 사용자 추가</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-zinc-400 hover:text-white"
              >
                <FaTimes size={20} />
              </button>
            </div>
            
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1">이메일</label>
                <input
                  type="email"
                  required
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1">비밀번호</label>
                <input
                  type="password"
                  required
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1">닉네임</label>
                <input
                  type="text"
                  required
                  value={newUser.nickname}
                  onChange={(e) => setNewUser({ ...newUser, nickname: e.target.value })}
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1">지역</label>
                <input
                  type="text"
                  value={newUser.region}
                  onChange={(e) => setNewUser({ ...newUser, region: e.target.value })}
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1">차량</label>
                <select
                  value={newUser.vehicle}
                  onChange={(e) => setNewUser({ ...newUser, vehicle: e.target.value })}
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="bicycle">자전거</option>
                  <option value="motorcycle">오토바이</option>
                  <option value="car">자동차</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1">전화번호</label>
                <input
                  type="tel"
                  value={newUser.phone}
                  onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })}
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1">권한</label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value as 'user' | 'admin' })}
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="user">일반 사용자</option>
                  <option value="admin">관리자</option>
                </select>
              </div>
              
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-2 border border-zinc-700 text-zinc-300 rounded-md hover:bg-zinc-800"
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
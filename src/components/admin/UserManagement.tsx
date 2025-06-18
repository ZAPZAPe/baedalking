'use client';

import { useState, useEffect } from 'react';
import { 
  FaUserPlus, 
  FaEdit, 
  FaTrash, 
  FaCoins, 
  FaEye, 
  FaSearch,
  FaFilter,
  FaDownload,
  FaTruck,
  FaBicycle,
  FaMotorcycle,
  FaCar,
  FaCheckCircle,
  FaTimesCircle,
  FaClock,
  FaGift,
  FaHistory,
  FaBan,
  FaUnlock,
  FaSortUp,
  FaSortDown,
  FaExclamationTriangle
} from 'react-icons/fa';
import { getUsers, createUser, deleteUser, updateUserRole, updateUserData, getTodayDeliveryData } from '@/services/adminService';
import { UserProfile } from '@/types';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { toast } from 'sonner';
import { addPoints } from '@/services/pointService';

export default function UserManagement() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRegion, setFilterRegion] = useState('all');
  const [filterVehicle, setFilterVehicle] = useState('all');
  const [sortBy, setSortBy] = useState<'createdAt' | 'totalDeliveries' | 'totalEarnings' | 'points'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showPointModal, setShowPointModal] = useState(false);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [pointAmount, setPointAmount] = useState('');
  const [pointReason, setPointReason] = useState('');
  const [todayDeliveryData, setTodayDeliveryData] = useState<Map<string, any>>(new Map());
  
  // 새 사용자 추가 폼 상태
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
    fetchTodayData();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const userData = await getUsers();
      setUsers(userData);
    } catch (error) {
      console.error('사용자 목록 로드 오류:', error);
      toast.error('사용자 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const fetchTodayData = async () => {
    try {
      const data = await getTodayDeliveryData();
      setTodayDeliveryData(data);
    } catch (error) {
      console.error('오늘 배달 데이터 로드 오류:', error);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('정말로 이 사용자를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
      return;
    }

    try {
      await deleteUser(userId);
      toast.success('사용자가 삭제되었습니다.');
      await fetchUsers();
    } catch (error) {
      console.error('사용자 삭제 오류:', error);
      toast.error('사용자 삭제에 실패했습니다.');
    }
  };

  const handleRoleChange = async (userId: string, newRole: 'user' | 'admin') => {
    try {
      await updateUserRole(userId, newRole);
      toast.success('사용자 권한이 변경되었습니다.');
      await fetchUsers();
    } catch (error) {
      console.error('권한 변경 오류:', error);
      toast.error('권한 변경에 실패했습니다.');
    }
  };

  const handleGivePoints = async () => {
    if (!selectedUser || !pointAmount || !pointReason) {
      toast.error('모든 필드를 입력해주세요.');
      return;
    }

    try {
      await addPoints(selectedUser.id, parseInt(pointAmount), 'admin', pointReason);
      toast.success(`${selectedUser.nickname}님에게 ${pointAmount} 포인트가 지급되었습니다.`);
      setShowPointModal(false);
      setPointAmount('');
      setPointReason('');
      await fetchUsers();
    } catch (error) {
      console.error('포인트 지급 오류:', error);
      toast.error('포인트 지급에 실패했습니다.');
    }
  };

  const handleCreateUser = async () => {
    if (!newUser.email || !newUser.password || !newUser.nickname) {
      toast.error('필수 필드를 모두 입력해주세요.');
      return;
    }

    try {
      await createUser(newUser);
      toast.success('새 사용자가 생성되었습니다.');
      setShowAddUserModal(false);
      setNewUser({
        email: '',
        password: '',
        nickname: '',
        region: '',
        vehicle: 'bicycle',
        phone: '',
        role: 'user'
      });
      await fetchUsers();
    } catch (error: any) {
      console.error('사용자 생성 오류:', error);
      toast.error(error.message || '사용자 생성에 실패했습니다.');
    }
  };

  // 필터링 및 정렬
  const filteredAndSortedUsers = users
    .filter(user => {
      const matchesSearch = (user.nickname?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                          (user.email?.toLowerCase() || '').includes(searchTerm.toLowerCase());
      const matchesRegion = filterRegion === 'all' || user.region === filterRegion;
      const matchesVehicle = filterVehicle === 'all' || user.vehicle === filterVehicle;
      return matchesSearch && matchesRegion && matchesVehicle;
    })
    .sort((a, b) => {
      const aValue = a[sortBy] || 0;
      const bValue = b[sortBy] || 0;
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

  const regions = Array.from(new Set(users.map(u => u.region).filter(Boolean)));
  
  const getVehicleIcon = (vehicle: string) => {
    switch (vehicle) {
      case 'bicycle': return <FaBicycle className="text-green-400" />;
      case 'motorcycle': return <FaMotorcycle className="text-orange-400" />;
      case 'car': return <FaCar className="text-blue-400" />;
      default: return <FaTruck className="text-purple-400" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 헤더 및 액션 버튼 */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h3 className="text-2xl font-bold text-white">사용자 관리</h3>
          <p className="text-zinc-400 mt-1">총 {users.length}명의 사용자</p>
        </div>
        <button
          onClick={() => setShowAddUserModal(true)}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl hover:from-blue-700 hover:to-cyan-700 transition-all shadow-lg hover:shadow-xl"
        >
          <FaUserPlus size={18} />
          <span className="font-medium">사용자 추가</span>
        </button>
      </div>

      {/* 검색 및 필터 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="relative">
          <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            placeholder="이름 또는 이메일로 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-zinc-500 focus:border-purple-500 focus:outline-none"
          />
        </div>

        <select
          value={filterRegion}
          onChange={(e) => setFilterRegion(e.target.value)}
          className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-purple-500 focus:outline-none"
        >
          <option value="all">모든 지역</option>
          {regions.map(region => (
            <option key={region} value={region}>{region}</option>
          ))}
        </select>

        <select
          value={filterVehicle}
          onChange={(e) => setFilterVehicle(e.target.value)}
          className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-purple-500 focus:outline-none"
        >
          <option value="all">모든 차량</option>
          <option value="bicycle">자전거</option>
          <option value="motorcycle">오토바이</option>
          <option value="car">자동차</option>
          <option value="truck">트럭</option>
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
          <option value="createdAt-desc">가입일 (최신순)</option>
          <option value="createdAt-asc">가입일 (오래된순)</option>
          <option value="totalDeliveries-desc">배달 건수 (많은순)</option>
          <option value="totalDeliveries-asc">배달 건수 (적은순)</option>
          <option value="totalEarnings-desc">총 수익 (많은순)</option>
          <option value="totalEarnings-asc">총 수익 (적은순)</option>
          <option value="points-desc">포인트 (많은순)</option>
          <option value="points-asc">포인트 (적은순)</option>
        </select>
      </div>

      {/* 사용자 테이블 */}
      <div className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-white/5 border-b border-white/10">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-medium text-zinc-400">사용자</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-zinc-400">지역/차량</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-zinc-400">오늘 실적</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-zinc-400">누적 실적</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-zinc-400">포인트</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-zinc-400">권한</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-zinc-400">가입일</th>
                <th className="px-6 py-4 text-right text-sm font-medium text-zinc-400">작업</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredAndSortedUsers.map((user) => {
                const todayData = todayDeliveryData.get(user.id) || { deliveryCount: 0, earnings: 0, verified: false };
                
                return (
                  <tr key={user.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full flex items-center justify-center text-white font-bold">
                          {user.nickname.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="text-white font-medium">{user.nickname}</div>
                          <div className="text-zinc-400 text-sm">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {getVehicleIcon(user.vehicle)}
                        <span className="text-zinc-300">{user.region || '미설정'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <div className="text-white">
                          {todayData.deliveryCount}건 / {todayData.earnings.toLocaleString()}원
                        </div>
                        <div className="flex items-center gap-1">
                          {todayData.verified ? (
                            <>
                              <FaCheckCircle className="text-green-400" size={14} />
                              <span className="text-green-400 text-xs">인증됨</span>
                            </>
                          ) : todayData.deliveryCount > 0 ? (
                            <>
                              <FaClock className="text-yellow-400" size={14} />
                              <span className="text-yellow-400 text-xs">대기중</span>
                            </>
                          ) : (
                            <>
                              <FaTimesCircle className="text-zinc-500" size={14} />
                              <span className="text-zinc-500 text-xs">미제출</span>
                            </>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <div className="text-white">{user.totalDeliveries.toLocaleString()}건</div>
                        <div className="text-zinc-400 text-sm">{user.totalEarnings.toLocaleString()}원</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <FaCoins className="text-yellow-400" />
                        <span className="text-white font-medium">{user.points.toLocaleString()}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={user.role}
                        onChange={(e) => handleRoleChange(user.id, e.target.value as 'user' | 'admin')}
                        className={`px-3 py-1 rounded-lg text-sm font-medium ${
                          user.role === 'admin' 
                            ? 'bg-red-500/20 text-red-300 border border-red-500/30' 
                            : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                        }`}
                      >
                        <option value="user">일반 사용자</option>
                        <option value="admin">관리자</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 text-zinc-400 text-sm">
                      {format(new Date(user.createdAt), 'yyyy.MM.dd', { locale: ko })}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => {
                            setSelectedUser(user);
                            setShowUserModal(true);
                          }}
                          className="p-2 text-blue-400 hover:bg-blue-500/20 rounded-lg transition-colors"
                          title="상세 보기"
                        >
                          <FaEye size={16} />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedUser(user);
                            setShowPointModal(true);
                          }}
                          className="p-2 text-yellow-400 hover:bg-yellow-500/20 rounded-lg transition-colors"
                          title="포인트 지급"
                        >
                          <FaGift size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user.id)}
                          className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                          title="삭제"
                        >
                          <FaTrash size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 사용자 추가 모달 */}
      {showAddUserModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-zinc-900 to-black rounded-2xl p-6 w-full max-w-md border border-purple-500/20">
            <h3 className="text-xl font-bold text-white mb-4">새 사용자 추가</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">이메일 *</label>
                <input
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-purple-500 focus:outline-none"
                  placeholder="user@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">비밀번호 *</label>
                <input
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-purple-500 focus:outline-none"
                  placeholder="최소 6자 이상"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">닉네임 *</label>
                <input
                  type="text"
                  value={newUser.nickname}
                  onChange={(e) => setNewUser({ ...newUser, nickname: e.target.value })}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-purple-500 focus:outline-none"
                  placeholder="배달왕"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">지역</label>
                <input
                  type="text"
                  value={newUser.region}
                  onChange={(e) => setNewUser({ ...newUser, region: e.target.value })}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-purple-500 focus:outline-none"
                  placeholder="서울"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">차량</label>
                <select
                  value={newUser.vehicle}
                  onChange={(e) => setNewUser({ ...newUser, vehicle: e.target.value })}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-purple-500 focus:outline-none"
                >
                  <option value="bicycle">자전거</option>
                  <option value="motorcycle">오토바이</option>
                  <option value="car">자동차</option>
                  <option value="truck">트럭</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">전화번호</label>
                <input
                  type="tel"
                  value={newUser.phone}
                  onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-purple-500 focus:outline-none"
                  placeholder="010-1234-5678"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">권한</label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value as 'user' | 'admin' })}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-purple-500 focus:outline-none"
                >
                  <option value="user">일반 사용자</option>
                  <option value="admin">관리자</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleCreateUser}
                className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl hover:from-blue-700 hover:to-cyan-700 transition-all font-medium"
              >
                생성하기
              </button>
              <button
                onClick={() => setShowAddUserModal(false)}
                className="flex-1 py-3 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-all font-medium"
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 포인트 지급 모달 */}
      {showPointModal && selectedUser && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-zinc-900 to-black rounded-2xl p-6 w-full max-w-md border border-purple-500/20">
            <h3 className="text-xl font-bold text-white mb-4">포인트 지급</h3>
            <p className="text-zinc-400 mb-4">{selectedUser.nickname}님에게 포인트를 지급합니다</p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">포인트 금액</label>
                <input
                  type="number"
                  value={pointAmount}
                  onChange={(e) => setPointAmount(e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-purple-500 focus:outline-none"
                  placeholder="1000"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">지급 사유</label>
                <textarea
                  value={pointReason}
                  onChange={(e) => setPointReason(e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-purple-500 focus:outline-none resize-none"
                  rows={3}
                  placeholder="이벤트 보상, 보너스 지급 등..."
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleGivePoints}
                className="flex-1 py-3 bg-gradient-to-r from-yellow-600 to-orange-600 text-white rounded-xl hover:from-yellow-700 hover:to-orange-700 transition-all font-medium"
              >
                지급하기
              </button>
              <button
                onClick={() => {
                  setShowPointModal(false);
                  setPointAmount('');
                  setPointReason('');
                }}
                className="flex-1 py-3 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-all font-medium"
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 사용자 상세 모달 */}
      {showUserModal && selectedUser && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-zinc-900 to-black rounded-2xl p-6 w-full max-w-2xl border border-purple-500/20 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">사용자 상세 정보</h3>
              <button
                onClick={() => setShowUserModal(false)}
                className="text-zinc-400 hover:text-white transition-colors"
              >
                <FaTimesCircle size={24} />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-zinc-400">닉네임</label>
                  <p className="text-white font-medium">{selectedUser.nickname}</p>
                </div>
                <div>
                  <label className="text-sm text-zinc-400">이메일</label>
                  <p className="text-white">{selectedUser.email}</p>
                </div>
                <div>
                  <label className="text-sm text-zinc-400">전화번호</label>
                  <p className="text-white">{selectedUser.phone || '미등록'}</p>
                </div>
                <div>
                  <label className="text-sm text-zinc-400">지역</label>
                  <p className="text-white">{selectedUser.region || '미설정'}</p>
                </div>
                <div>
                  <label className="text-sm text-zinc-400">차량</label>
                  <div className="flex items-center gap-2 mt-1">
                    {getVehicleIcon(selectedUser.vehicle)}
                    <span className="text-white">{selectedUser.vehicle}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm text-zinc-400">총 배달 건수</label>
                  <p className="text-white font-medium text-xl">{selectedUser.totalDeliveries.toLocaleString()}건</p>
                </div>
                <div>
                  <label className="text-sm text-zinc-400">총 수익</label>
                  <p className="text-white font-medium text-xl">{selectedUser.totalEarnings.toLocaleString()}원</p>
                </div>
                <div>
                  <label className="text-sm text-zinc-400">보유 포인트</label>
                  <p className="text-yellow-400 font-medium text-xl">{selectedUser.points.toLocaleString()}P</p>
                </div>
                <div>
                  <label className="text-sm text-zinc-400">권한</label>
                  <p className={`font-medium ${selectedUser.role === 'admin' ? 'text-red-400' : 'text-blue-400'}`}>
                    {selectedUser.role === 'admin' ? '관리자' : '일반 사용자'}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-zinc-400">가입일</label>
                  <p className="text-white">
                    {format(new Date(selectedUser.createdAt), 'yyyy년 MM월 dd일', { locale: ko })}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => {
                  setShowUserModal(false);
                  setShowPointModal(true);
                }}
                className="flex-1 py-3 bg-gradient-to-r from-yellow-600 to-orange-600 text-white rounded-xl hover:from-yellow-700 hover:to-orange-700 transition-all font-medium flex items-center justify-center gap-2"
              >
                <FaGift />
                포인트 지급
              </button>
              <button
                onClick={() => {/* TODO: 활동 내역 페이지로 이동 */}}
                className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all font-medium flex items-center justify-center gap-2"
              >
                <FaHistory />
                활동 내역
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 
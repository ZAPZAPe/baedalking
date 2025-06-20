'use client';

import { useState, useEffect, useMemo } from 'react';
import { 
  FaUserPlus, 
  FaEdit, 
  FaTrash, 
  FaCoins, 
  FaEye, 
  FaSearch,
  FaTruck,
  FaBicycle,
  FaMotorcycle,
  FaCar,
  FaCheckCircle,
  FaTimesCircle,
  FaClock,
  FaGift,
  FaHistory,
  FaPhone,
  FaMapMarkerAlt,
  FaPlus
} from 'react-icons/fa';
import { getUsers, createUser, deleteUser, updateUserRole, updateUserData, updateUserProfile, getTodayDeliveryData } from '@/services/adminService';
import { UserProfile } from '@/types';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { toast } from 'sonner';
import { addPoints } from '@/services/pointService';
import { supabase } from '@/lib/supabase';

export default function UserManagement() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRegion, setFilterRegion] = useState('all');
  const [filterVehicle, setFilterVehicle] = useState('all');
  const [sortBy, setSortBy] = useState<'totalDeliveries' | 'totalEarnings' | 'points'>('totalDeliveries');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [showPointModal, setShowPointModal] = useState(false);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [pointAmount, setPointAmount] = useState('');
  const [pointReason, setPointReason] = useState('');
  const [todayDeliveryData, setTodayDeliveryData] = useState<Map<string, any>>(new Map());
  const [showDeliveryModal, setShowDeliveryModal] = useState(false);
  const [deliveryData, setDeliveryData] = useState({
    deliveryCount: 0,
    earnings: 0,
    verified: false,
    platform: '배민커넥트' as '배민커넥트' | '쿠팡이츠',
    date: new Date().toISOString().split('T')[0]
  });
  
  const [editUser, setEditUser] = useState({
    nickname: '',
    region: '',
    vehicle: 'bicycle',
    phone: ''
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

  const handleGivePoints = async () => {
    if (!selectedUser || !pointAmount || !pointReason) {
      toast.error('모든 필드를 입력해주세요.');
      return;
    }

    try {
      await addPoints(selectedUser.id, parseInt(pointAmount), 'admin', pointReason);
      toast.success(`${selectedUser.nickname || '사용자'}님에게 ${pointAmount} 포인트가 지급되었습니다.`);
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

  const handleEditUser = async () => {
    if (!selectedUser || !editUser.nickname) {
      toast.error('닉네임은 필수 입력사항입니다.');
      return;
    }

    try {
      await updateUserProfile(selectedUser.id, editUser);
      toast.success('사용자 정보가 수정되었습니다.');
      setShowEditUserModal(false);
      await fetchUsers();
    } catch (error: any) {
      console.error('사용자 정보 수정 오류:', error);
      toast.error(error.message || '사용자 정보 수정에 실패했습니다.');
    }
  };

  const handleAddDelivery = async () => {
    if (!selectedUser) return;
    
    try {
      const newTodayData = new Map(todayDeliveryData);
      const existingData = newTodayData.get(selectedUser.id) || { 
        deliveryCount: 0, 
        earnings: 0, 
        verified: false, 
        platforms: {} 
      };
      
      const platforms = {
        ...existingData.platforms,
        [deliveryData.platform]: {
          deliveryCount: (existingData.platforms?.[deliveryData.platform]?.deliveryCount || 0) + deliveryData.deliveryCount,
          earnings: (existingData.platforms?.[deliveryData.platform]?.earnings || 0) + deliveryData.earnings
        }
      };

      const { error: userError } = await supabase
        .from('users')
        .update({
          total_deliveries: (selectedUser.totalDeliveries || 0) + deliveryData.deliveryCount,
          total_earnings: (selectedUser.totalEarnings || 0) + deliveryData.earnings,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedUser.id);

      if (userError) throw userError;

      const { error: historyError } = await supabase
        .from('delivery_records')
        .insert({
          user_id: selectedUser.id,
          date: deliveryData.date,
          amount: deliveryData.earnings,
          delivery_count: deliveryData.deliveryCount,
          platform: deliveryData.platform,
          verified: deliveryData.verified
        });

      if (historyError) throw historyError;

      newTodayData.set(selectedUser.id, {
        deliveryCount: existingData.deliveryCount + deliveryData.deliveryCount,
        earnings: existingData.earnings + deliveryData.earnings,
        verified: deliveryData.verified,
        platforms
      });
      setTodayDeliveryData(newTodayData);
      
      toast.success('배달 기록이 추가되었습니다.');
      setShowDeliveryModal(false);
      setDeliveryData({ 
        deliveryCount: 0, 
        earnings: 0, 
        verified: false, 
        platform: '배민커넥트',
        date: new Date().toISOString().split('T')[0]
      });
      await fetchUsers();
    } catch (error) {
      console.error('배달 기록 추가 오류:', error);
      toast.error('배달 기록 추가에 실패했습니다.');
    }
  };

  const filteredAndSortedUsers = useMemo(() => {
    return users
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
  }, [users, searchTerm, filterRegion, filterVehicle, sortBy, sortOrder]);

  const regions = useMemo(() => {
    return Array.from(new Set(users.map(u => u.region).filter(Boolean)));
  }, [users]);
  
  const getVehicleIcon = (vehicle: string) => {
    switch (vehicle) {
      case 'bicycle': return <FaBicycle className="text-green-600" />;
      case 'motorcycle': return <FaMotorcycle className="text-orange-600" />;
      case 'car': return <FaCar className="text-blue-600" />;
      default: return <FaTruck className="text-purple-600" />;
    }
  };

  const getStatusBadge = (todayData: any) => {
    if (todayData.verified) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <FaCheckCircle size={10} />
          인증됨
        </span>
      );
    } else if (todayData.deliveryCount > 0) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          <FaClock size={10} />
          미인증
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
          <FaTimesCircle size={10} />
          미제출
        </span>
      );
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">사용자 관리</h2>
          <p className="text-gray-600 mt-1">총 {users.length}명의 사용자가 등록되어 있습니다</p>
        </div>
        <button
          onClick={() => setShowAddUserModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          <FaUserPlus size={16} />
          사용자 추가
        </button>
      </div>

      {/* 검색 및 필터 */}
      <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={14} />
            <input
              type="text"
              placeholder="닉네임 또는 이메일 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>

          <select
            value={filterRegion}
            onChange={(e) => setFilterRegion(e.target.value)}
            className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          >
            <option value="all">전체 지역</option>
            {regions.map(region => (
              <option key={region} value={region}>{region}</option>
            ))}
          </select>

          <select
            value={filterVehicle}
            onChange={(e) => setFilterVehicle(e.target.value)}
            className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          >
            <option value="all">전체 차량</option>
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
            className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          >
            <option value="totalDeliveries-desc">배달 건수 많은순</option>
            <option value="totalDeliveries-asc">배달 건수 적은순</option>
            <option value="totalEarnings-desc">수익 많은순</option>
            <option value="totalEarnings-asc">수익 적은순</option>
            <option value="points-desc">포인트 많은순</option>
            <option value="points-asc">포인트 적은순</option>
          </select>
        </div>
      </div>

      {/* 사용자 카드 리스트 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filteredAndSortedUsers.map((user) => {
          const todayData = todayDeliveryData.get(user.id) || { 
            deliveryCount: 0, 
            earnings: 0, 
            verified: false,
            platforms: {}
          };
          
          return (
            <div key={user.id} className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="p-6">
                {/* 사용자 기본 정보 */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{user.nickname || '닉네임 없음'}</h3>
                      {getStatusBadge(todayData)}
                    </div>
                    <p className="text-gray-600 text-sm mb-2">{user.email}</p>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <FaMapMarkerAlt size={12} />
                        <span>{user.region || '미설정'}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        {getVehicleIcon(user.vehicle)}
                        <span className="capitalize">{user.vehicle}</span>
                      </div>
                      {user.phone && (
                        <div className="flex items-center gap-1">
                          <FaPhone size={12} />
                          <span>{user.phone}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setSelectedUser(user);
                        setShowDeliveryModal(true);
                      }}
                      className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                      title="배달 기록 추가"
                    >
                      <FaPlus size={14} />
                    </button>
                    <button
                      onClick={() => {
                        setSelectedUser(user);
                        setEditUser({
                          nickname: user.nickname || '',
                          region: user.region || '',
                          vehicle: user.vehicle || 'bicycle',
                          phone: user.phone || ''
                        });
                        setShowEditUserModal(true);
                      }}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="정보 수정"
                    >
                      <FaEdit size={14} />
                    </button>
                    <button
                      onClick={() => {
                        setSelectedUser(user);
                        setShowPointModal(true);
                      }}
                      className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors"
                      title="포인트 지급"
                    >
                      <FaGift size={14} />
                    </button>
                    <button
                      onClick={() => handleDeleteUser(user.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="삭제"
                    >
                      <FaTrash size={14} />
                    </button>
                  </div>
                </div>

                {/* 실적 정보 */}
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">{user.totalDeliveries.toLocaleString()}</div>
                    <div className="text-xs text-gray-500">총 배달</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">{Math.floor(user.totalEarnings / 10000).toLocaleString()}만원</div>
                    <div className="text-xs text-gray-500">총 수익</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-600">{user.points.toLocaleString()}</div>
                    <div className="text-xs text-gray-500">포인트</div>
                  </div>
                </div>

                {/* 오늘 실적 */}
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">오늘 실적</span>
                    <span className="text-sm text-gray-600">
                      {todayData.deliveryCount}건 / {todayData.earnings.toLocaleString()}원
                    </span>
                  </div>
                  
                  {/* 플랫폼별 실적 */}
                  {Object.entries(todayData.platforms || {}).map(([platform, data]: [string, any]) => (
                    <div key={platform} className="flex items-center justify-between text-xs text-gray-600">
                      <span className={`font-medium ${
                        platform === '배민커넥트' ? 'text-green-600' : 'text-orange-600'
                      }`}>
                        {platform}
                      </span>
                      <span>{data.deliveryCount}건 / {data.earnings.toLocaleString()}원</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredAndSortedUsers.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 text-lg mb-2">검색 결과가 없습니다</div>
          <div className="text-gray-500 text-sm">다른 검색어나 필터를 시도해보세요</div>
        </div>
      )}

      {/* 배달 기록 추가 모달 */}
      {showDeliveryModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl">
            <h3 className="text-xl font-bold text-gray-900 mb-4">배달 기록 추가</h3>
            <p className="text-gray-600 mb-4">{selectedUser.nickname}님의 배달 기록을 추가합니다</p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">날짜</label>
                <input
                  type="date"
                  value={deliveryData.date}
                  onChange={(e) => setDeliveryData({ ...deliveryData, date: e.target.value })}
                  className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">플랫폼</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setDeliveryData({ ...deliveryData, platform: '배민커넥트' })}
                    className={`p-3 rounded-lg border transition-all ${
                      deliveryData.platform === '배민커넥트'
                        ? 'bg-green-50 border-green-500 text-green-700'
                        : 'bg-gray-50 border-gray-300 text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    배민커넥트
                  </button>
                  <button
                    onClick={() => setDeliveryData({ ...deliveryData, platform: '쿠팡이츠' })}
                    className={`p-3 rounded-lg border transition-all ${
                      deliveryData.platform === '쿠팡이츠'
                        ? 'bg-orange-50 border-orange-500 text-orange-700'
                        : 'bg-gray-50 border-gray-300 text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    쿠팡이츠
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">배달 건수</label>
                <input
                  type="number"
                  value={deliveryData.deliveryCount}
                  onChange={(e) => setDeliveryData({ ...deliveryData, deliveryCount: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  placeholder="0"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">수익 금액</label>
                <input
                  type="number"
                  value={deliveryData.earnings}
                  onChange={(e) => setDeliveryData({ ...deliveryData, earnings: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  placeholder="0"
                  min="0"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="verified"
                  checked={deliveryData.verified}
                  onChange={(e) => setDeliveryData({ ...deliveryData, verified: e.target.checked })}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="verified" className="text-sm text-gray-700">
                  인증 완료로 표시
                </label>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleAddDelivery}
                className="flex-1 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                추가하기
              </button>
              <button
                onClick={() => {
                  setShowDeliveryModal(false);
                  setDeliveryData({ 
                    deliveryCount: 0, 
                    earnings: 0, 
                    verified: false, 
                    platform: '배민커넥트',
                    date: new Date().toISOString().split('T')[0]
                  });
                }}
                className="flex-1 py-3 bg-gray-200 text-gray-900 rounded-lg hover:bg-gray-300 transition-colors font-medium"
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 사용자 편집 모달 */}
      {showEditUserModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl">
            <h3 className="text-xl font-bold text-gray-900 mb-4">사용자 정보 수정</h3>
            <p className="text-gray-600 mb-4">{selectedUser.nickname}님의 정보를 수정합니다</p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">닉네임 *</label>
                <input
                  type="text"
                  value={editUser.nickname}
                  onChange={(e) => setEditUser({ ...editUser, nickname: e.target.value })}
                  className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  placeholder="닉네임을 입력하세요"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">지역</label>
                <input
                  type="text"
                  value={editUser.region}
                  onChange={(e) => setEditUser({ ...editUser, region: e.target.value })}
                  className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  placeholder="서울"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">차량</label>
                <select
                  value={editUser.vehicle}
                  onChange={(e) => setEditUser({ ...editUser, vehicle: e.target.value })}
                  className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                >
                  <option value="bicycle">자전거</option>
                  <option value="motorcycle">오토바이</option>
                  <option value="car">자동차</option>
                  <option value="truck">트럭</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">전화번호</label>
                <input
                  type="tel"
                  value={editUser.phone}
                  onChange={(e) => setEditUser({ ...editUser, phone: e.target.value })}
                  className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  placeholder="010-1234-5678"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleEditUser}
                className="flex-1 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                수정하기
              </button>
              <button
                onClick={() => setShowEditUserModal(false)}
                className="flex-1 py-3 bg-gray-200 text-gray-900 rounded-lg hover:bg-gray-300 transition-colors font-medium"
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 포인트 지급 모달 */}
      {showPointModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl">
            <h3 className="text-xl font-bold text-gray-900 mb-4">포인트 지급</h3>
            <p className="text-gray-600 mb-4">{selectedUser.nickname}님에게 포인트를 지급합니다</p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">포인트 금액</label>
                <input
                  type="number"
                  value={pointAmount}
                  onChange={(e) => setPointAmount(e.target.value)}
                  className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  placeholder="1000"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">지급 사유</label>
                <textarea
                  value={pointReason}
                  onChange={(e) => setPointReason(e.target.value)}
                  className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
                  rows={3}
                  placeholder="이벤트 보상, 보너스 지급 등..."
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleGivePoints}
                className="flex-1 py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors font-medium"
              >
                지급하기
              </button>
              <button
                onClick={() => {
                  setShowPointModal(false);
                  setPointAmount('');
                  setPointReason('');
                }}
                className="flex-1 py-3 bg-gray-200 text-gray-900 rounded-lg hover:bg-gray-300 transition-colors font-medium"
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 사용자 추가 모달 */}
      {showAddUserModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl">
            <h3 className="text-xl font-bold text-gray-900 mb-4">새 사용자 추가</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">이메일 *</label>
                <input
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  placeholder="user@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">비밀번호 *</label>
                <input
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  placeholder="최소 6자 이상"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">닉네임 *</label>
                <input
                  type="text"
                  value={newUser.nickname}
                  onChange={(e) => setNewUser({ ...newUser, nickname: e.target.value })}
                  className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  placeholder="배달왕"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">지역</label>
                <input
                  type="text"
                  value={newUser.region}
                  onChange={(e) => setNewUser({ ...newUser, region: e.target.value })}
                  className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  placeholder="서울"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">차량</label>
                <select
                  value={newUser.vehicle}
                  onChange={(e) => setNewUser({ ...newUser, vehicle: e.target.value })}
                  className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                >
                  <option value="bicycle">자전거</option>
                  <option value="motorcycle">오토바이</option>
                  <option value="car">자동차</option>
                  <option value="truck">트럭</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">전화번호</label>
                <input
                  type="tel"
                  value={newUser.phone}
                  onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })}
                  className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  placeholder="010-1234-5678"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleCreateUser}
                className="flex-1 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                생성하기
              </button>
              <button
                onClick={() => setShowAddUserModal(false)}
                className="flex-1 py-3 bg-gray-200 text-gray-900 rounded-lg hover:bg-gray-300 transition-colors font-medium"
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 
'use client';

import { useState, useEffect } from 'react';
import { FaSearch, FaFilter, FaSort, FaUserSlash, FaUserCheck } from 'react-icons/fa';
import { getUsers, updateUserRole } from '@/services/adminService';
import { UserProfile } from '@/types';

export default function UserManagementPage() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('');
  const [sortBy, setSortBy] = useState<'createdAt' | 'nickname'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const data = await getUsers();
        setUsers(data);
      } catch (error) {
        console.error('사용자 목록 가져오기 오류:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const handleRoleChange = async (userId: string, newRole: 'user' | 'admin') => {
    try {
      await updateUserRole(userId, newRole);
      setUsers(users =>
        users.map(user =>
          user.id === userId ? { ...user, role: newRole } : user
        )
      );
    } catch (error) {
      console.error('사용자 권한 변경 오류:', error);
      alert('권한 변경에 실패했습니다.');
    }
  };

  const filteredUsers = users
    .filter(user => 
      user.nickname.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .filter(user => !selectedRegion || user.region === selectedRegion)
    .sort((a, b) => {
      if (sortBy === 'createdAt') {
        return sortOrder === 'asc' 
          ? new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      } else {
        return sortOrder === 'asc'
          ? a.nickname.localeCompare(b.nickname)
          : b.nickname.localeCompare(a.nickname);
      }
    });

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
        <h1 className="text-3xl font-bold text-white">사용자 관리</h1>
        <div className="flex gap-4">
          {/* 검색 */}
          <div className="relative">
            <input
              type="text"
              placeholder="사용자 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-gray-800 text-white pl-10 pr-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          </div>

          {/* 지역 필터 */}
          <select
            value={selectedRegion}
            onChange={(e) => setSelectedRegion(e.target.value)}
            className="bg-gray-800 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">전체 지역</option>
            <option value="서울">서울</option>
            <option value="부산">부산</option>
            <option value="대구">대구</option>
            <option value="인천">인천</option>
            <option value="광주">광주</option>
            <option value="대전">대전</option>
            <option value="울산">울산</option>
            <option value="세종">세종</option>
            <option value="경기">경기</option>
            <option value="강원">강원</option>
            <option value="충북">충북</option>
            <option value="충남">충남</option>
            <option value="전북">전북</option>
            <option value="전남">전남</option>
            <option value="경북">경북</option>
            <option value="경남">경남</option>
            <option value="제주">제주</option>
          </select>

          {/* 정렬 */}
          <select
            value={`${sortBy}-${sortOrder}`}
            onChange={(e) => {
              const [newSortBy, newSortOrder] = e.target.value.split('-');
              setSortBy(newSortBy as 'createdAt' | 'nickname');
              setSortOrder(newSortOrder as 'asc' | 'desc');
            }}
            className="bg-gray-800 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="createdAt-desc">가입일 최신순</option>
            <option value="createdAt-asc">가입일 오래된순</option>
            <option value="nickname-asc">닉네임 가나다순</option>
            <option value="nickname-desc">닉네임 역순</option>
          </select>
        </div>
      </div>

      {/* 사용자 목록 */}
      <div className="bg-gray-800 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-700 text-gray-300 text-sm">
              <th className="px-6 py-3 text-left">닉네임</th>
              <th className="px-6 py-3 text-left">이메일</th>
              <th className="px-6 py-3 text-left">지역</th>
              <th className="px-6 py-3 text-left">가입일</th>
              <th className="px-6 py-3 text-left">포인트</th>
              <th className="px-6 py-3 text-left">권한</th>
              <th className="px-6 py-3 text-left">관리</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {filteredUsers.map((user) => (
              <tr key={user.id} className="text-gray-300 hover:bg-gray-700/50">
                <td className="px-6 py-4">{user.nickname}</td>
                <td className="px-6 py-4">{user.email}</td>
                <td className="px-6 py-4">{user.region}</td>
                <td className="px-6 py-4">
                  {new Date(user.createdAt).toLocaleDateString()}
                </td>
                <td className="px-6 py-4">{user.points}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    user.role === 'admin' 
                      ? 'bg-purple-500/20 text-purple-400' 
                      : 'bg-blue-500/20 text-blue-400'
                  }`}>
                    {user.role === 'admin' ? '관리자' : '일반'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleRoleChange(user.id, user.role === 'admin' ? 'user' : 'admin')}
                      className={`p-2 rounded-lg ${
                        user.role === 'admin'
                          ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                          : 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                      }`}
                    >
                      {user.role === 'admin' ? <FaUserSlash /> : <FaUserCheck />}
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
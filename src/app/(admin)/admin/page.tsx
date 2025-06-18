'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { 
  FaUsers, 
  FaClipboardList, 
  FaTrophy, 
  FaCoins, 
  FaChartBar,
  FaSignOutAlt,
  FaExclamationTriangle,
  FaChartLine,
  FaHome,
  FaCog,
  FaBell,
  FaShieldAlt,
  FaUserShield,
  FaArrowUp,
  FaArrowDown,
  FaSearch,
  FaCalendar,
  FaUpload
} from 'react-icons/fa';
import Loading from '@/components/Loading';
import Dashboard from '@/components/admin/Dashboard';
import UserManagement from '@/components/admin/UserManagement';
import DeliveryRecords from '@/components/admin/DeliveryRecords';
import RankingManagement from '@/components/admin/RankingManagement';
import PointsManagement from '@/components/admin/PointsManagement';
import FraudDetection from '@/components/admin/FraudDetection';
import SystemSettings from '@/components/admin/SystemSettings';
import { getDashboardStats } from '@/services/adminService';

interface DashboardStats {
  todayUploads: number;
  totalUsers: number;
  totalDeliveries: number;
  fraudDetections: number;
  uploadTrend: {
    date: string;
    count: number;
  }[];
}

export default function AdminPage() {
  const { user, userProfile, loading, signOut } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    // 관리자 권한이 없으면 홈으로
    if (!loading && (!user || userProfile?.role !== 'admin')) {
      router.push('/');
    }
  }, [user, userProfile, loading, router]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await getDashboardStats();
        setStats(data);
      } catch (error) {
        console.error('대시보드 데이터 로드 오류:', error);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return <Loading />;
  }

  // 관리자 권한이 없으면 아무것도 렌더링하지 않음
  if (!user || userProfile?.role !== 'admin') {
    return null;
  }

  const tabs = [
    { id: 'dashboard', label: '대시보드', icon: <FaChartBar size={20} />, color: 'from-blue-500 to-cyan-500' },
    { id: 'users', label: '사용자 관리', icon: <FaUsers size={20} />, color: 'from-purple-500 to-pink-500' },
    { id: 'records', label: '배달 기록', icon: <FaClipboardList size={20} />, color: 'from-green-500 to-emerald-500' },
    { id: 'rankings', label: '랭킹 관리', icon: <FaTrophy size={20} />, color: 'from-yellow-500 to-orange-500' },
    { id: 'points', label: '포인트 관리', icon: <FaCoins size={20} />, color: 'from-indigo-500 to-purple-500' },
    { id: 'fraud', label: '부정행위 감지', icon: <FaExclamationTriangle size={20} />, color: 'from-red-500 to-pink-500' },
    { id: 'settings', label: '시스템 설정', icon: <FaCog size={20} />, color: 'from-gray-500 to-gray-600' },
  ];

  const currentTab = tabs.find(tab => tab.id === activeTab);

  return (
    <div className="flex h-screen bg-black">
      {/* 사이드바 */}
      <aside className={`${sidebarCollapsed ? 'w-20' : 'w-64'} bg-zinc-900 border-r border-zinc-800 transition-all duration-300`}>
        <div className="p-4 h-full flex flex-col">
          {/* 로고 */}
          <div className="mb-8">
            <div className="flex items-center justify-center">
              <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                <FaShieldAlt className="text-white" size={24} />
              </div>
              {!sidebarCollapsed && (
                <h1 className="ml-3 text-xl font-bold text-white">관리자</h1>
              )}
            </div>
          </div>

          <nav className="space-y-1 flex-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center' : ''} px-3 py-2.5 text-sm font-medium rounded-lg transition-all group ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r ' + tab.color + ' text-white'
                    : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'
                }`}
                title={tab.label}
              >
                <span className={`${activeTab === tab.id ? 'text-white' : 'text-zinc-400 group-hover:text-white'}`}>
                  {tab.icon}
                </span>
                {!sidebarCollapsed && <span className="ml-3">{tab.label}</span>}
              </button>
            ))}
          </nav>
          
          <div className="mt-auto pt-4 border-t border-zinc-800">
            <button
              onClick={async () => {
                await signOut();
                router.push('/');
              }}
              className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center' : ''} px-3 py-2.5 text-sm font-medium text-red-400 hover:bg-red-500/10 hover:text-red-300 rounded-lg transition-all`}
            >
              <FaSignOutAlt size={20} />
              {!sidebarCollapsed && <span className="ml-3">로그아웃</span>}
            </button>
            <button
              onClick={() => router.push('/')}
              className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center' : ''} px-3 py-2.5 text-sm font-medium text-zinc-400 hover:bg-zinc-800 hover:text-white rounded-lg transition-all mt-1`}
            >
              <FaHome size={20} />
              {!sidebarCollapsed && <span className="ml-3">메인으로</span>}
            </button>
          </div>
        </div>
      </aside>

      {/* 메인 컨텐츠 */}
      <main className="flex-1 overflow-y-auto bg-black">
        <div className="w-full h-full flex flex-col">
          {/* 페이지 헤더 */}
          <div className="bg-zinc-900 border-b border-zinc-800">
            <div className="flex items-center justify-between px-8 py-6">
              <div>
                <h2 className={`text-3xl font-bold text-white mb-2`}>
                  {currentTab?.label}
                </h2>
                <p className="text-zinc-400">
                  {activeTab === 'dashboard' && '전체 시스템 현황을 한눈에 확인하세요'}
                  {activeTab === 'users' && '사용자 계정을 관리하고 모니터링합니다'}
                  {activeTab === 'records' && '배달 기록을 검토하고 관리합니다'}
                  {activeTab === 'rankings' && '랭킹 시스템을 관리하고 조정합니다'}
                  {activeTab === 'points' && '포인트 발급 및 사용 내역을 관리합니다'}
                  {activeTab === 'fraud' && '부정행위를 감지하고 처리합니다'}
                  {activeTab === 'settings' && '시스템 설정을 구성합니다'}
                </p>
              </div>
              <div className={`w-14 h-14 bg-gradient-to-br ${currentTab?.color} rounded-xl flex items-center justify-center shadow-lg`}>
                <span className="text-white">{currentTab?.icon}</span>
              </div>
            </div>
          </div>

          {/* 통계 카드 (대시보드일 때만 표시) */}
          {activeTab === 'dashboard' && stats && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 px-8 py-6">
              <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                    <FaUpload className="text-blue-400" size={20} />
                  </div>
                  <span className="text-xs text-green-400 font-semibold flex items-center">
                    <FaArrowUp size={12} className="mr-1" /> 12%
                  </span>
                </div>
                <h3 className="text-2xl font-bold text-white">{stats?.todayUploads != null ? stats.todayUploads.toLocaleString() : '0'}</h3>
                <p className="text-sm text-zinc-400 mt-1">오늘 업로드</p>
              </div>
              
              <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
                    <FaUsers className="text-purple-400" size={20} />
                  </div>
                  <span className="text-xs text-green-400 font-semibold flex items-center">
                    <FaArrowUp size={12} className="mr-1" /> 8%
                  </span>
                </div>
                <h3 className="text-2xl font-bold text-white">{stats?.totalUsers != null ? stats.totalUsers.toLocaleString() : '0'}</h3>
                <p className="text-sm text-zinc-400 mt-1">전체 사용자</p>
              </div>
              
              <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
                    <FaClipboardList className="text-green-400" size={20} />
                  </div>
                  <span className="text-xs text-green-400 font-semibold flex items-center">
                    <FaArrowUp size={12} className="mr-1" /> 15%
                  </span>
                </div>
                <h3 className="text-2xl font-bold text-white">{stats?.totalDeliveries != null ? stats.totalDeliveries.toLocaleString() : '0'}</h3>
                <p className="text-sm text-zinc-400 mt-1">총 배달 건수</p>
              </div>
              
              <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-red-500/20 rounded-lg flex items-center justify-center">
                    <FaExclamationTriangle className="text-red-400" size={20} />
                  </div>
                  <span className="text-xs text-red-400 font-semibold flex items-center">
                    <FaArrowDown size={12} className="mr-1" /> 3%
                  </span>
                </div>
                <h3 className="text-2xl font-bold text-white">{stats?.fraudDetections != null ? stats.fraudDetections.toLocaleString() : '0'}</h3>
                <p className="text-sm text-zinc-400 mt-1">부정행위 감지</p>
              </div>
            </div>
          )}

          {/* 컨텐츠 영역 */}
          <div className="flex-1 px-8 py-6">
            <div className="bg-zinc-900 rounded-xl border border-zinc-800 h-full">
              <div className="p-6">
                {activeTab === 'dashboard' && <Dashboard />}
                {activeTab === 'users' && <UserManagement />}
                {activeTab === 'records' && <DeliveryRecords />}
                {activeTab === 'rankings' && <RankingManagement />}
                {activeTab === 'points' && <PointsManagement />}
                {activeTab === 'fraud' && <FraudDetection />}
                {activeTab === 'settings' && <SystemSettings />}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
} 
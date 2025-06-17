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
  const { user, userProfile, loading } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    // 관리자 비밀번호 인증 확인
    const checkAdminAuth = () => {
      const isAuthenticated = sessionStorage.getItem('adminAuthenticated');
      const authTime = sessionStorage.getItem('adminAuthTime');
      
      if (!isAuthenticated || !authTime) {
        router.push('/admin-login');
        return;
      }
      
      // 인증 시간 확인 (24시간 유효)
      const authDate = new Date(authTime);
      const now = new Date();
      const hoursDiff = (now.getTime() - authDate.getTime()) / (1000 * 60 * 60);
      
      if (hoursDiff > 24) {
        sessionStorage.removeItem('adminAuthenticated');
        sessionStorage.removeItem('adminAuthTime');
        router.push('/admin-login');
        return;
      }
      
      setIsCheckingAuth(false);
    };

    checkAdminAuth();
  }, [router]);

  useEffect(() => {
    // 관리자 권한 체크
    if (!loading && !isCheckingAuth && (!user || userProfile?.role !== 'admin')) {
      router.push('/');
    }
  }, [user, userProfile, loading, isCheckingAuth, router]);

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

  if (loading || isCheckingAuth) {
    return <Loading text="인증 확인 중..." />;
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
    <div className="flex h-screen">
      {/* 사이드바 */}
      <aside className={`${sidebarCollapsed ? 'w-20' : 'w-64'} bg-white border-r border-gray-200 transition-all duration-300`}>
        <div className="p-4 h-full flex flex-col">
          <nav className="space-y-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center' : ''} px-3 py-2.5 text-sm font-medium rounded-lg transition-all group ${
                  activeTab === tab.id
                    ? 'bg-gray-900 text-white'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
                title={tab.label}
              >
                <span className={`${activeTab === tab.id ? 'text-white' : 'text-gray-400 group-hover:text-gray-600'}`}>
                  {tab.icon}
                </span>
                {!sidebarCollapsed && <span className="ml-3">{tab.label}</span>}
              </button>
            ))}
          </nav>
          
          <div className="mt-auto pt-4 border-t border-gray-200">
            <button
              onClick={() => {
                sessionStorage.removeItem('adminAuthenticated');
                sessionStorage.removeItem('adminAuthTime');
                router.push('/admin-login');
              }}
              className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center' : ''} px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-all`}
            >
              <FaSignOutAlt size={20} />
              {!sidebarCollapsed && <span className="ml-3">로그아웃</span>}
            </button>
            <button
              onClick={() => router.push('/')}
              className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center' : ''} px-3 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-all mt-1`}
            >
              <FaHome size={20} />
              {!sidebarCollapsed && <span className="ml-3">메인으로</span>}
            </button>
          </div>
        </div>
      </aside>
      {/* 메인 컨텐츠 */}
      <main className="flex-1 overflow-y-auto bg-gray-50 p-0">
        <div className="w-full h-full flex flex-col gap-8">
          {/* 페이지 헤더 */}
          <div className="flex items-center justify-between w-full px-8 pt-8 pb-4">
            <div>
              <h2 className={`text-3xl font-bold text-gray-900 mb-2`}>
                {currentTab?.label}
              </h2>
              <p className="text-gray-600">
                {activeTab === 'dashboard' && '전체 시스템 현황을 한눈에 확인하세요'}
                {activeTab === 'users' && '사용자 계정을 관리하고 모니터링합니다'}
                {activeTab === 'records' && '배달 기록을 검토하고 관리합니다'}
                {activeTab === 'rankings' && '랭킹 시스템을 관리하고 조정합니다'}
                {activeTab === 'points' && '포인트 발급 및 사용 내역을 관리합니다'}
                {activeTab === 'fraud' && '부정행위를 감지하고 처리합니다'}
                {activeTab === 'settings' && '시스템 설정을 구성합니다'}
              </p>
            </div>
            <div className={`w-12 h-12 bg-gradient-to-br ${currentTab?.color} rounded-xl flex items-center justify-center shadow-lg`}>
              <span className="text-white">{currentTab?.icon}</span>
            </div>
          </div>
          {/* 통계 카드 (대시보드일 때만 표시) */}
          {activeTab === 'dashboard' && stats && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 w-full px-8">
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <FaUpload className="text-blue-600" size={20} />
                  </div>
                  <span className="text-xs text-green-600 font-semibold flex items-center">
                    <FaArrowUp size={12} className="mr-1" /> 12%
                  </span>
                </div>
                <h3 className="text-2xl font-bold text-gray-900">{stats?.todayUploads != null ? stats.todayUploads.toLocaleString() : '0'}</h3>
                <p className="text-sm text-gray-600 mt-1">오늘 업로드</p>
              </div>
              
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <FaUsers className="text-purple-600" size={20} />
                  </div>
                  <span className="text-xs text-green-600 font-semibold flex items-center">
                    <FaArrowUp size={12} className="mr-1" /> 8%
                  </span>
                </div>
                <h3 className="text-2xl font-bold text-gray-900">{stats?.totalUsers != null ? stats.totalUsers.toLocaleString() : '0'}</h3>
                <p className="text-sm text-gray-600 mt-1">전체 사용자</p>
              </div>
              
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <FaClipboardList className="text-green-600" size={20} />
                  </div>
                  <span className="text-xs text-green-600 font-semibold flex items-center">
                    <FaArrowUp size={12} className="mr-1" /> 15%
                  </span>
                </div>
                <h3 className="text-2xl font-bold text-gray-900">{stats?.totalDeliveries != null ? stats.totalDeliveries.toLocaleString() : '0'}</h3>
                <p className="text-sm text-gray-600 mt-1">총 배달 건수</p>
              </div>
              
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                    <FaExclamationTriangle className="text-red-600" size={20} />
                  </div>
                  <span className="text-xs text-red-600 font-semibold flex items-center">
                    <FaArrowDown size={12} className="mr-1" /> 3%
                  </span>
                </div>
                <h3 className="text-2xl font-bold text-gray-900">{stats?.fraudDetections != null ? stats.fraudDetections.toLocaleString() : '0'}</h3>
                <p className="text-sm text-gray-600 mt-1">부정행위 감지</p>
              </div>
            </div>
          )}
          {/* 컨텐츠 영역 */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 w-full mx-0 px-8 py-8">
            {activeTab === 'dashboard' && <Dashboard />}
            {activeTab === 'users' && <UserManagement />}
            {activeTab === 'records' && <DeliveryRecords />}
            {activeTab === 'rankings' && <RankingManagement />}
            {activeTab === 'points' && <PointsManagement />}
            {activeTab === 'fraud' && <FraudDetection />}
            {activeTab === 'settings' && <SystemSettings />}
          </div>
        </div>
      </main>
    </div>
  );
} 
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
  FaHome,
  FaCog,
  FaArrowUp,
  FaArrowDown,
  FaUpload,
  FaBolt,
  FaEye,
  FaGift,
  FaMoneyBillWave,
  FaBell,
  FaChartLine,
  FaDownload,
  FaSyncAlt,
  FaPlus,
  FaEdit
} from 'react-icons/fa';
import Loading from '@/components/Loading';
import { getDashboardStats } from '@/services/adminService';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import dynamic from 'next/dynamic';

// 컴포넌트 동적 임포트
const Dashboard = dynamic(() => import('@/components/admin/Dashboard'), {
  loading: () => <Loading />
});
const UserManagement = dynamic(() => import('@/components/admin/UserManagement'), {
  loading: () => <Loading />
});
const DeliveryRecords = dynamic(() => import('@/components/admin/DeliveryRecords'), {
  loading: () => <Loading />
});
const PointsManagement = dynamic(() => import('@/components/admin/PointsManagement'), {
  loading: () => <Loading />
});
const RankingManagement = dynamic(() => import('@/components/admin/RankingManagement'), {
  loading: () => <Loading />
});
const FraudDetection = dynamic(() => import('@/components/admin/FraudDetection'), {
  loading: () => <Loading />
});
const SystemSettings = dynamic(() => import('@/components/admin/SystemSettings'), {
  loading: () => <Loading />
});

interface AdminDashboardStats {
  todayUploads: number;
  totalUsers: number;
  totalDeliveries: number;
  fraudDetections: number;
  todayRevenue: number;
  activeUsers: number;
  pendingVerifications: number;
  todayPoints: number;
}

export default function AdminPage() {
  const { user, userProfile, loading, signOut } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!loading && (!user || userProfile?.role !== 'admin')) {
      router.push('/');
    }
  }, [user, userProfile, loading, router]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setIsLoading(true);
        const data = await getDashboardStats();
        setStats({
          ...data,
          todayRevenue: 0,
          activeUsers: Math.floor(data.totalUsers * 0.3),
          pendingVerifications: 0,
          todayPoints: 0
        });
      } catch (error) {
        console.error('대시보드 데이터 로드 오류:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (user && userProfile?.role === 'admin') {
      fetchStats();
    }
  }, [user, userProfile]);

  if (loading) {
    return <Loading />;
  }

  if (!user || userProfile?.role !== 'admin') {
    return null;
  }

  const menuTabs = [
    { id: 'dashboard', label: '대시보드', icon: FaChartBar, color: 'blue' },
    { id: 'users', label: '사용자 관리', icon: FaUsers, color: 'green' },
    { id: 'deliveries', label: '배달 기록', icon: FaClipboardList, color: 'purple' },
    { id: 'points', label: '포인트 관리', icon: FaCoins, color: 'yellow' },
    { id: 'rankings', label: '랭킹 관리', icon: FaTrophy, color: 'orange' },
    { id: 'fraud', label: '부정행위 감지', icon: FaExclamationTriangle, color: 'red' },
    { id: 'settings', label: '시스템 설정', icon: FaCog, color: 'gray' }
  ];

  const statsCards = [
    {
      title: '총 사용자',
      value: stats?.totalUsers || 0,
      icon: FaUsers,
      color: 'bg-blue-500',
      trend: '+12%'
    },
    {
      title: '오늘 업로드',
      value: stats?.todayUploads || 0,
      icon: FaUpload,
      color: 'bg-green-500',
      trend: '+8%'
    },
    {
      title: '총 배달',
      value: stats?.totalDeliveries || 0,
      icon: FaClipboardList,
      color: 'bg-purple-500',
      trend: '+15%'
    },
    {
      title: '오늘 수익',
      value: `${(stats?.todayRevenue || 0).toLocaleString()}원`,
      icon: FaMoneyBillWave,
      color: 'bg-yellow-500',
      trend: '+23%'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <FaChartBar className="text-white" size={20} />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">배달킹 관리자</h1>
                <p className="text-sm text-gray-500">
                  {format(new Date(), 'yyyy년 MM월 dd일 EEEE', { locale: ko })}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/')}
                className="px-4 py-2 text-gray-600 hover:text-gray-900 flex items-center space-x-2"
              >
                <FaHome size={16} />
                <span>메인으로</span>
              </button>
              <button
                onClick={async () => {
                  await signOut();
                  router.push('/');
                }}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 flex items-center space-x-2"
              >
                <FaSignOutAlt size={16} />
                <span>로그아웃</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* 탭 네비게이션 */}
      <nav className="bg-white border-b border-gray-200">
        <div className="px-6">
          <div className="flex space-x-8">
            {menuTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex items-center space-x-2 py-4 px-1 border-b-2 text-sm font-medium transition-colors
                    ${isActive 
                      ? 'border-blue-500 text-blue-600' 
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }
                  `}
                >
                  <Icon size={16} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* 메인 컨텐츠 */}
      <main className="px-6 py-6">
        {/* 대시보드 통계 카드 (대시보드 탭에서만 표시) */}
        {activeTab === 'dashboard' && (
          <div className="mb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {statsCards.map((card, index) => {
                const Icon = card.icon;
                return (
                  <div key={index} className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">{card.title}</p>
                        <p className="text-2xl font-bold text-gray-900 mt-1">
                          {typeof card.value === 'number' ? card.value.toLocaleString() : card.value}
                        </p>
                        <p className="text-sm text-green-600 mt-1">{card.trend}</p>
                      </div>
                      <div className={`w-12 h-12 ${card.color} rounded-lg flex items-center justify-center`}>
                        <Icon className="text-white" size={24} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 컨텐츠 영역 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {isLoading ? (
            <div className="flex items-center justify-center h-96">
              <Loading />
            </div>
          ) : (
            <div className="p-6">
              {activeTab === 'dashboard' && <Dashboard />}
              {activeTab === 'users' && <UserManagement />}
              {activeTab === 'deliveries' && <DeliveryRecords />}
              {activeTab === 'points' && <PointsManagement />}
              {activeTab === 'rankings' && <RankingManagement />}
              {activeTab === 'fraud' && <FraudDetection />}
              {activeTab === 'settings' && <SystemSettings />}
            </div>
          )}
        </div>
      </main>
    </div>
  );
} 
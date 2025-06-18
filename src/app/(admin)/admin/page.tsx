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
  FaShieldAlt,
  FaArrowUp,
  FaArrowDown,
  FaSearch,
  FaCalendar,
  FaUpload,
  FaBolt,
  FaFire,
  FaEye,
  FaBars,
  FaTimes,
  FaCrown,
  FaPlus,
  FaEdit,
  FaTrash,
  FaCheckCircle,
  FaTimesCircle,
  FaGift,
  FaHistory,
  FaMoneyBillWave,
  FaUserPlus,
  FaMobileAlt,
  FaDesktop,
  FaBell,
  FaChartLine,
  FaDatabase,
  FaFilter,
  FaDownload,
  FaSyncAlt
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
  const [activeMenu, setActiveMenu] = useState('dashboard');
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
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
        // getDashboardStats의 반환 타입에 맞춰 추가 필드 설정
        setStats({
          ...data,
          todayRevenue: 0, // 기본값 또는 계산된 값
          activeUsers: Math.floor(data.totalUsers * 0.3), // 예시: 전체 사용자의 30%
          pendingVerifications: 0, // 기본값
          todayPoints: 0 // 기본값
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

  const menuItems = [
    { 
      id: 'dashboard', 
      label: '대시보드', 
      icon: FaChartBar, 
      gradient: 'from-purple-600 to-pink-600',
      description: '실시간 통계 및 현황'
    },
    { 
      id: 'users', 
      label: '사용자 관리', 
      icon: FaUsers, 
      gradient: 'from-blue-600 to-cyan-600',
      description: '회원 정보 및 활동 관리'
    },
    { 
      id: 'deliveries', 
      label: '배달 기록', 
      icon: FaClipboardList, 
      gradient: 'from-green-600 to-emerald-600',
      description: '배달 인증 및 기록 관리'
    },
    { 
      id: 'points', 
      label: '포인트 관리', 
      icon: FaCoins, 
      gradient: 'from-yellow-600 to-orange-600',
      description: '포인트 지급 및 내역'
    },
    { 
      id: 'rankings', 
      label: '랭킹 관리', 
      icon: FaTrophy, 
      gradient: 'from-amber-600 to-red-600',
      description: '랭킹 시스템 관리'
    },
    { 
      id: 'fraud', 
      label: '부정행위 감지', 
      icon: FaExclamationTriangle, 
      gradient: 'from-red-600 to-rose-600',
      description: '이상 패턴 모니터링'
    },
    { 
      id: 'settings', 
      label: '시스템 설정', 
      icon: FaCog, 
      gradient: 'from-slate-600 to-zinc-600',
      description: '시스템 환경 설정'
    }
  ];

  const currentMenu = menuItems.find(item => item.id === activeMenu);

  const statsCards = [
    {
      title: '오늘 업로드',
      value: stats?.todayUploads || 0,
      icon: FaUpload,
      gradient: 'from-purple-600 to-pink-600',
      trend: 15,
      trendUp: true
    },
    {
      title: '활성 사용자',
      value: stats?.activeUsers || 0,
      icon: FaBolt,
      gradient: 'from-blue-600 to-cyan-600',
      trend: 8,
      trendUp: true
    },
    {
      title: '오늘 매출',
      value: `${(stats?.todayRevenue || 0).toLocaleString()}원`,
      icon: FaMoneyBillWave,
      gradient: 'from-green-600 to-emerald-600',
      trend: 23,
      trendUp: true
    },
    {
      title: '대기중 인증',
      value: stats?.pendingVerifications || 0,
      icon: FaEye,
      gradient: 'from-yellow-600 to-orange-600',
      trend: 5,
      trendUp: false
    }
  ];

  return (
    <div className="min-h-screen bg-black">
      {/* 모바일 메뉴 오버레이 */}
      {mobileMenuOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* 사이드바 */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50
        w-80 lg:w-64 xl:w-80
        bg-gradient-to-b from-zinc-900 to-black
        border-r border-purple-500/20
        transform transition-transform duration-300
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="h-full flex flex-col p-6">
          {/* 헤더 */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg animate-pulse">
                  <FaCrown className="text-white" size={24} />
                </div>
                <div>
                  <h1 className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500">
                    배달킹 관리자
                  </h1>
                  <p className="text-xs text-purple-300">Admin Dashboard</p>
                </div>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="lg:hidden text-zinc-400 hover:text-white transition-colors"
              >
                <FaTimes size={24} />
              </button>
            </div>
          </div>

          {/* 메뉴 */}
          <nav className="flex-1 space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeMenu === item.id;
              
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveMenu(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`
                    w-full group relative
                    flex items-center gap-3 p-3 rounded-xl
                    transition-all duration-300
                    ${isActive 
                      ? `bg-gradient-to-r ${item.gradient} text-white shadow-lg scale-105` 
                      : 'text-zinc-400 hover:text-white hover:bg-white/5'
                    }
                  `}
                >
                  {isActive && (
                    <div className={`absolute inset-0 bg-gradient-to-r ${item.gradient} rounded-xl blur-xl opacity-50`} />
                  )}
                  <div className={`
                    relative w-10 h-10 rounded-xl flex items-center justify-center
                    ${isActive 
                      ? 'bg-white/20' 
                      : 'bg-white/5 group-hover:bg-white/10'
                    }
                  `}>
                    <Icon size={20} />
                  </div>
                  <div className="relative flex-1 text-left">
                    <div className="font-bold text-sm">{item.label}</div>
                    <div className={`text-xs ${isActive ? 'text-white/80' : 'text-zinc-500'}`}>
                      {item.description}
                    </div>
                  </div>
                  {isActive && (
                    <div className="relative w-2 h-2 bg-white rounded-full animate-pulse" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* 하단 버튼 */}
          <div className="mt-6 space-y-2 pt-6 border-t border-zinc-800">
            <button
              onClick={() => router.push('/')}
              className="w-full flex items-center gap-3 p-3 rounded-xl text-zinc-400 hover:text-white hover:bg-white/5 transition-all"
            >
              <FaHome size={20} />
              <span className="font-medium">메인으로</span>
            </button>
            <button
              onClick={async () => {
                await signOut();
                router.push('/');
              }}
              className="w-full flex items-center gap-3 p-3 rounded-xl text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all"
            >
              <FaSignOutAlt size={20} />
              <span className="font-medium">로그아웃</span>
            </button>
          </div>
        </div>
      </aside>

      {/* 메인 컨텐츠 */}
      <main className="lg:ml-64 xl:ml-80 min-h-screen">
        {/* 모바일 헤더 */}
        <header className="lg:hidden bg-zinc-900/80 backdrop-blur-lg border-b border-purple-500/20 sticky top-0 z-30">
          <div className="flex items-center justify-between p-4">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="text-white hover:text-purple-400 transition-colors"
            >
              <FaBars size={24} />
            </button>
            <h2 className="text-lg font-bold text-white">{currentMenu?.label}</h2>
            <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl flex items-center justify-center">
              <FaShieldAlt className="text-white" size={20} />
            </div>
          </div>
        </header>

        {/* 페이지 헤더 */}
        <div className="bg-gradient-to-b from-zinc-900 to-transparent border-b border-purple-500/20">
          <div className="p-6 lg:p-8">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h1 className="text-2xl lg:text-3xl font-black text-white mb-2">
                  {currentMenu?.label}
                </h1>
                <p className="text-purple-300 text-sm lg:text-base">
                  {format(new Date(), 'yyyy년 MM월 dd일 EEEE', { locale: ko })}
                </p>
              </div>
              <div className={`
                hidden lg:flex w-16 h-16 
                bg-gradient-to-br ${currentMenu?.gradient} 
                rounded-2xl items-center justify-center shadow-2xl
                animate-pulse
              `}>
                {currentMenu && <currentMenu.icon className="text-white" size={32} />}
              </div>
            </div>

            {/* 퀵 액션 버튼들 */}
            <div className="flex flex-wrap gap-2 mt-4">
              <button className="flex items-center gap-2 px-4 py-2 bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 rounded-lg transition-all">
                <FaSyncAlt size={14} />
                <span className="text-sm">새로고침</span>
              </button>
              <button className="flex items-center gap-2 px-4 py-2 bg-green-600/20 hover:bg-green-600/30 text-green-300 rounded-lg transition-all">
                <FaDownload size={14} />
                <span className="text-sm">엑셀 다운로드</span>
              </button>
              <button className="flex items-center gap-2 px-4 py-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 rounded-lg transition-all">
                <FaFilter size={14} />
                <span className="text-sm">필터</span>
              </button>
            </div>
          </div>
        </div>

        {/* 대시보드 통계 카드 */}
        {activeMenu === 'dashboard' && (
          <div className="p-6 lg:p-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-6 mb-8">
              {statsCards.map((card, index) => {
                const Icon = card.icon;
                return (
                  <div
                    key={index}
                    className="group relative bg-gradient-to-br from-zinc-900 to-black rounded-2xl p-6 border border-purple-500/20 hover:border-purple-500/40 transition-all duration-300 hover:scale-105"
                  >
                    {/* 배경 효과 */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${card.gradient} rounded-2xl opacity-10 group-hover:opacity-20 transition-opacity`} />
                    
                    <div className="relative">
                      <div className="flex items-start justify-between mb-4">
                        <div className={`w-12 h-12 bg-gradient-to-br ${card.gradient} rounded-xl flex items-center justify-center shadow-lg group-hover:animate-pulse`}>
                          <Icon className="text-white" size={20} />
                        </div>
                        <div className={`flex items-center gap-1 text-xs ${card.trendUp ? 'text-green-400' : 'text-red-400'}`}>
                          {card.trendUp ? <FaArrowUp size={10} /> : <FaArrowDown size={10} />}
                          <span>{card.trend}%</span>
                        </div>
                      </div>
                      <h3 className="text-zinc-400 text-sm mb-1">{card.title}</h3>
                      <p className="text-2xl lg:text-3xl font-black text-white">
                        {typeof card.value === 'number' ? card.value.toLocaleString() : card.value}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 컨텐츠 영역 */}
        <div className="p-6 lg:p-8">
          <div className="bg-gradient-to-br from-zinc-900 to-black rounded-3xl border border-purple-500/20 shadow-2xl overflow-hidden">
            {isLoading ? (
              <div className="flex items-center justify-center h-96">
                <Loading />
              </div>
            ) : (
              <div className="p-6 lg:p-8">
                {/* 각 메뉴별 컨텐츠 렌더링 */}
                {activeMenu === 'dashboard' && <Dashboard />}

                {activeMenu === 'users' && <UserManagement />}

                {activeMenu === 'deliveries' && <DeliveryRecords />}
                {activeMenu === 'points' && <PointsManagement />}
                {activeMenu === 'rankings' && <RankingManagement />}
                {activeMenu === 'fraud' && <FraudDetection />}
                {activeMenu === 'settings' && <SystemSettings />}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
} 
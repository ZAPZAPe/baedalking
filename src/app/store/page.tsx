'use client';

import { useState, useEffect } from 'react';
import { FaStore, FaCoins, FaGift, FaCrown, FaShoppingCart, FaCheckCircle, FaUsers, FaRocket, FaClock, FaStar, FaFire, FaHeart, FaTimes, FaHistory } from 'react-icons/fa';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { getPointTransactions, PointTransaction } from '@/services/pointService';
import Loading from '@/components/Loading';
import KakaoAdGlobal from '@/components/KakaoAdGlobal';

export default function StorePage() {
  const { user, userProfile, loading } = useAuth();
  const router = useRouter();
  const [transactions, setTransactions] = useState<PointTransaction[]>([]);
  const [transactionsLoading, setTransactionsLoading] = useState(true);
  const [showPointHistory, setShowPointHistory] = useState(false);

  useEffect(() => {
    const fetchTransactions = async () => {
      if (!user) return;
      
      setTransactionsLoading(true);
      try {
        const userTransactions = await getPointTransactions(user.id, 10);
        setTransactions(userTransactions);
      } catch (error) {
        console.error('거래 내역 가져오기 오류:', error);
      } finally {
        setTransactionsLoading(false);
      }
    };

    fetchTransactions();
  }, [user]);

  if (loading) {
    return <Loading />;
  }

  useEffect(() => {
    if (!loading && (!user || !userProfile)) {
      router.push('/login');
    }
  }, [user, userProfile, loading, router]);

  if (!user || !userProfile) {
    return null;
  }

  return (
    <div className="relative z-10">
      <div className="max-w-3xl mx-auto px-4">
        {/* 내 포인트 */}
        <section className="mb-4 mt-2">
          <div className="bg-gradient-to-br from-purple-900/30 to-pink-900/30 backdrop-blur-lg rounded-3xl p-4 sm:p-6 shadow-2xl border border-purple-500/30 relative overflow-hidden">
            {/* 배경 애니메이션 효과 */}
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 via-pink-600/10 to-purple-600/10 animate-pulse"></div>
            
            <div className="relative z-10">
              {/* 상단 타이틀 */}
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white">내 포인트</h2>
                  <p className="text-purple-200 text-xs sm:text-sm">
                    사용 가능한 포인트
                  </p>
                </div>
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg animate-bounce">
                  <FaCoins className="text-white w-4 h-4 sm:w-5 sm:h-5" />
                </div>
              </div>

              {/* 포인트 정보 */}
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center mb-3 hover:bg-white/20 transition-all">
                <div className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-orange-400 to-pink-400 mb-1">
                  {userProfile.points?.toLocaleString() || '0'}P
                </div>
                <div className="text-xs text-purple-200">보유 포인트</div>
              </div>

              {/* 포인트 내역 버튼 */}
              <button
                onClick={() => setShowPointHistory(true)}
                className="w-full bg-white/10 backdrop-blur-sm rounded-xl py-3 text-white font-bold text-sm hover:bg-white/20 transition-all flex items-center justify-center gap-2"
              >
                <FaHistory className="w-3 h-3 sm:w-4 sm:h-4" />
                포인트 내역 확인
              </button>
            </div>
          </div>
        </section>

        {/* 광고 - 내 포인트 하단으로 이동 */}
        <section className="mb-4">
          <KakaoAdGlobal page="store" index={0} />
        </section>

        {/* 상점 곧 오픈 */}
        <section className="mb-4">
          <div className="bg-gradient-to-br from-purple-900/30 to-pink-900/30 backdrop-blur-lg rounded-3xl p-4 sm:p-6 shadow-2xl border border-purple-500/30 relative overflow-hidden">
            {/* 배경 애니메이션 효과 */}
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 via-pink-600/10 to-purple-600/10 animate-pulse"></div>
            
            <div className="relative z-10">
              {/* 상단 타이틀 */}
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white">배달킹 상점</h2>
                  <p className="text-purple-200 text-xs sm:text-sm">
                    특별한 아이템들이 준비 중입니다
                  </p>
                </div>
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-purple-400 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg">
                  <FaStore className="text-white w-4 h-4 sm:w-5 sm:h-5" />
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-xl p-6 text-center border border-purple-400/30">
                <FaRocket size={48} className="mx-auto text-purple-300 mb-4 animate-bounce" />
                <h4 className="text-xl font-black text-white mb-2">🚀 곧 오픈 예정!</h4>
                <p className="text-purple-200 text-sm mb-4">
                  배달킹들을 위한 특별한 아이템과<br />
                  실적 향상에 도움되는 상품들을<br />
                  준비하고 있습니다
                </p>
                <div className="flex items-center justify-center gap-2 text-purple-300">
                  <FaClock className="w-4 h-4" />
                  <span className="text-sm font-bold">Coming Soon...</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 포인트 획득 방법 */}
        <section className="mb-4">
          <div className="bg-gradient-to-br from-purple-900/30 to-pink-900/30 backdrop-blur-lg rounded-3xl p-4 sm:p-6 shadow-2xl border border-purple-500/30 relative overflow-hidden">
            {/* 배경 애니메이션 효과 */}
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 via-pink-600/10 to-purple-600/10 animate-pulse"></div>
            
            <div className="relative z-10">
              {/* 상단 타이틀 */}
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white">포인트 획득 방법</h2>
                  <p className="text-purple-200 text-xs sm:text-sm">
                    다양한 방법으로 포인트를 획득하세요
                  </p>
                </div>
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg">
                  <FaGift className="text-white w-4 h-4 sm:w-5 sm:h-5" />
                </div>
              </div>

              <div className="space-y-2">
                <div className="bg-white/10 rounded-xl p-3 hover:bg-white/20 transition-all">
                  <div className="flex justify-between items-center">
                    <span className="text-purple-200 text-sm">실적 업로드</span>
                    <span className="text-yellow-300 font-bold text-sm">+50P</span>
                  </div>
                </div>
                <div className="bg-white/10 rounded-xl p-3 hover:bg-white/20 transition-all">
                  <div className="flex justify-between items-center">
                    <span className="text-purple-200 text-sm">출근도장</span>
                    <span className="text-yellow-300 font-bold text-sm">+50P</span>
                  </div>
                </div>
                <div className="bg-white/10 rounded-xl p-3 hover:bg-white/20 transition-all">
                  <div className="flex justify-between items-center">
                    <span className="text-purple-200 text-sm">일간 1등</span>
                    <span className="text-yellow-300 font-bold text-sm">+500P</span>
                  </div>
                </div>
                <div className="bg-white/10 rounded-xl p-3 hover:bg-white/20 transition-all">
                  <div className="flex justify-between items-center">
                    <span className="text-purple-200 text-sm">일간 2등</span>
                    <span className="text-yellow-300 font-bold text-sm">+400P</span>
                  </div>
                </div>
                <div className="bg-white/10 rounded-xl p-3 hover:bg-white/20 transition-all">
                  <div className="flex justify-between items-center">
                    <span className="text-purple-200 text-sm">일간 3등</span>
                    <span className="text-yellow-300 font-bold text-sm">+300P</span>
                  </div>
                </div>
                <div className="bg-white/10 rounded-xl p-3 hover:bg-white/20 transition-all">
                  <div className="flex justify-between items-center">
                    <span className="text-purple-200 text-sm">일간 4등~10등</span>
                    <span className="text-yellow-300 font-bold text-sm">+100P</span>
                  </div>
                </div>
                <div className="bg-white/10 rounded-xl p-3 hover:bg-white/20 transition-all">
                  <div className="flex justify-between items-center">
                    <span className="text-purple-200 text-sm">친구 초대</span>
                    <span className="text-yellow-300 font-bold text-sm">+500P</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* 포인트 내역 팝업 */}
      {showPointHistory && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gradient-to-br from-purple-900/90 to-pink-900/90 backdrop-blur-lg rounded-3xl p-4 shadow-2xl border border-purple-500/30 max-w-md w-full max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-black text-white text-center flex-1">📊 포인트 내역</h3>
              <button
                onClick={() => setShowPointHistory(false)}
                className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-all"
              >
                <FaTimes className="w-3 h-3" />
              </button>
            </div>
            
            {!transactionsLoading && transactions.length > 0 ? (
              <div className="space-y-2">
                {transactions.map((transaction) => (
                  <div key={transaction.id} className="bg-white/10 rounded-xl p-3 hover:bg-white/20 transition-all">
                    <div className="flex justify-between items-center">
                      <div className="text-center flex-1">
                        <div className="text-white text-sm font-medium">{transaction.description}</div>
                        <div className="text-purple-200 text-xs">
                          {new Date(transaction.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                      <div className={`font-bold text-sm ${
                        transaction.type === 'earn' ? 'text-green-300' : 'text-red-300'
                      }`}>
                        {transaction.type === 'earn' ? '+' : '-'}{transaction.amount.toLocaleString()}P
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : !transactionsLoading && transactions.length === 0 ? (
              <div className="text-center py-6">
                <FaCoins size={40} className="mx-auto text-purple-400 mb-3" />
                <h4 className="text-base font-bold text-white mb-2">포인트 내역이 없습니다</h4>
                <p className="text-purple-200 text-xs mb-4">
                  배달 실적을 업로드하고<br />
                  포인트를 획득해보세요!
                </p>
                <button 
                  onClick={() => {
                    setShowPointHistory(false);
                    router.push('/upload');
                  }}
                  className="bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600 text-white px-4 py-2 rounded-xl font-bold text-sm hover:scale-105 transition-all"
                >
                  실적 업로드하기
                </button>
              </div>
            ) : (
              <div className="text-center py-6">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-white mx-auto mb-3"></div>
                <p className="text-white text-sm">로딩 중...</p>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
} 
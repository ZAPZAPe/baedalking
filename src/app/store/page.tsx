'use client';

import { useState, useEffect } from 'react';
import { FaStore, FaCoins, FaGift, FaCrown, FaShoppingCart, FaCheckCircle, FaUsers, FaRocket, FaClock, FaStar, FaFire, FaHeart, FaTimes, FaHistory } from 'react-icons/fa';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { getPointTransactions, PointTransaction } from '@/services/pointService';
import Loading from '@/components/Loading';
import KakaoAdGlobal from '@/components/KakaoAdGlobal';
import ProtectedRoute from '@/components/ProtectedRoute';

export default function StorePage() {
  const { user, userProfile, loading } = useAuth();
  const router = useRouter();
  const [transactions, setTransactions] = useState<PointTransaction[]>([]);
  const [transactionsLoading, setTransactionsLoading] = useState(true);
  const [showPointHistory, setShowPointHistory] = useState(false);

  useEffect(() => {
    const fetchTransactions = async () => {
      if (!user || !showPointHistory) return;
      
      try {
        console.log('포인트 내역 가져오기 시작:', user.id);
        const userTransactions = await getPointTransactions(user.id, 10);
        console.log('포인트 내역 가져오기 완료:', userTransactions);
        setTransactions(userTransactions);
      } catch (error) {
        console.error('거래 내역 가져오기 오류:', error);
        setTransactions([]);
      } finally {
        setTransactionsLoading(false);
      }
    };

    fetchTransactions();
  }, [user, showPointHistory]);

  // 모달이 닫힐 때 로딩 상태 초기화
  useEffect(() => {
    if (!showPointHistory) {
      setTransactionsLoading(false);
    }
  }, [showPointHistory]);

  useEffect(() => {
    if (!loading && (!user || !userProfile)) {
      router.push('/login');
    }
  }, [user, userProfile, loading, router]);

  const openPointHistory = () => {
    setShowPointHistory(true);
    setTransactionsLoading(true);
    setTransactions([]);
  };

  const closePointHistory = () => {
    setShowPointHistory(false);
    setTransactionsLoading(false);
    setTransactions([]);
  };

  if (loading) return <Loading />;
  if (!user || !userProfile) return null;

  return (
    <ProtectedRoute>
      <div className="relative z-10">
        <div className="max-w-3xl mx-auto px-4">
          {/* 내 포인트 */}
          <section className="mb-4 mt-2">
            <div className="bg-gradient-to-br from-purple-900/30 to-pink-900/30 backdrop-blur-lg rounded-3xl p-4 sm:p-6 shadow-2xl border border-purple-500/30 relative overflow-hidden">
              {/* 배경 애니메이션 효과 */}
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 via-pink-600/10 to-purple-600/10 animate-pulse"></div>
              
              <div className="relative z-10">
                {/* 헤더 - 실시간 Top 3 스타일 */}
                <div className="text-center mb-4 sm:mb-6">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <FaCoins className="text-purple-400 animate-bounce w-4 h-4 sm:w-7 sm:h-7" />
                    <h2 className="text-lg sm:text-2xl md:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-orange-400 to-pink-400">
                      내 포인트
                    </h2>
                    <FaCoins className="text-purple-400 animate-bounce w-4 h-4 sm:w-7 sm:h-7" />
                  </div>
                  <p className="text-purple-200 text-xs">사용 가능한 포인트</p>
                </div>

                {/* 포인트 정보 */}
                <div className="bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-sm rounded-xl p-3 text-center mb-3 hover:from-white/15 hover:to-white/10 transition-all border border-white/20">
                  <div className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-orange-400 to-pink-400 mb-1">
                    {userProfile.points?.toLocaleString() || '0'}P
                  </div>
                  <div className="text-xs text-purple-200">보유 포인트</div>
                </div>

                {/* 포인트 내역 버튼 */}
                <button
                  onClick={openPointHistory}
                  className="w-full bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-sm rounded-xl py-3 text-white font-bold text-sm hover:from-white/15 hover:to-white/10 transition-all flex items-center justify-center gap-2 border border-white/20"
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
                {/* 헤더 - 실시간 Top 3 스타일 */}
                <div className="text-center mb-4 sm:mb-6">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <FaStore className="text-purple-400 animate-bounce w-4 h-4 sm:w-7 sm:h-7" />
                    <h2 className="text-lg sm:text-2xl md:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-orange-400 to-pink-400">
                      배달킹 상점
                    </h2>
                    <FaStore className="text-purple-400 animate-bounce w-4 h-4 sm:w-7 sm:h-7" />
                  </div>
                  <p className="text-purple-200 text-xs">특별한 아이템들이 준비 중입니다</p>
                </div>

                <div className="bg-gradient-to-r from-white/10 to-white/5 rounded-xl p-6 text-center border border-white/20">
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
                {/* 헤더 - 실시간 Top 3 스타일 */}
                <div className="text-center mb-4 sm:mb-6">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <FaGift className="text-purple-400 animate-bounce w-4 h-4 sm:w-7 sm:h-7" />
                    <h2 className="text-lg sm:text-2xl md:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-orange-400 to-pink-400">
                      포인트 획득 방법
                    </h2>
                    <FaGift className="text-purple-400 animate-bounce w-4 h-4 sm:w-7 sm:h-7" />
                  </div>
                  <p className="text-purple-200 text-xs">다양한 방법으로 포인트를 획득하세요</p>
                </div>

                <div className="space-y-2">
                  <div className="bg-gradient-to-r from-white/10 to-white/5 rounded-xl p-3 hover:from-white/15 hover:to-white/10 transition-all border border-white/20">
                    <div className="flex justify-between items-center">
                      <span className="text-purple-200 text-sm">실적 업로드</span>
                      <span className="text-yellow-300 font-bold text-sm">+50P</span>
                    </div>
                  </div>
                  <div className="bg-gradient-to-r from-white/10 to-white/5 rounded-xl p-3 hover:from-white/15 hover:to-white/10 transition-all border border-white/20">
                    <div className="flex justify-between items-center">
                      <span className="text-purple-200 text-sm">출근도장</span>
                      <span className="text-yellow-300 font-bold text-sm">+50P</span>
                    </div>
                  </div>
                  <div className="bg-gradient-to-r from-white/10 to-white/5 rounded-xl p-3 hover:from-white/15 hover:to-white/10 transition-all border border-white/20">
                    <div className="flex justify-between items-center">
                      <span className="text-purple-200 text-sm">일간 1등</span>
                      <span className="text-yellow-300 font-bold text-sm">+500P</span>
                    </div>
                  </div>
                  <div className="bg-gradient-to-r from-white/10 to-white/5 rounded-xl p-3 hover:from-white/15 hover:to-white/10 transition-all border border-white/20">
                    <div className="flex justify-between items-center">
                      <span className="text-purple-200 text-sm">일간 2등</span>
                      <span className="text-yellow-300 font-bold text-sm">+400P</span>
                    </div>
                  </div>
                  <div className="bg-gradient-to-r from-white/10 to-white/5 rounded-xl p-3 hover:from-white/15 hover:to-white/10 transition-all border border-white/20">
                    <div className="flex justify-between items-center">
                      <span className="text-purple-200 text-sm">일간 3등</span>
                      <span className="text-yellow-300 font-bold text-sm">+300P</span>
                    </div>
                  </div>
                  <div className="bg-gradient-to-r from-white/10 to-white/5 rounded-xl p-3 hover:from-white/15 hover:to-white/10 transition-all border border-white/20">
                    <div className="flex justify-between items-center">
                      <span className="text-purple-200 text-sm">일간 4등~10등</span>
                      <span className="text-yellow-300 font-bold text-sm">+100P</span>
                    </div>
                  </div>
                  <div className="bg-gradient-to-r from-white/10 to-white/5 rounded-xl p-3 hover:from-white/15 hover:to-white/10 transition-all border border-white/20">
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
            <div className="bg-gradient-to-br from-purple-900/30 to-pink-900/30 backdrop-blur-lg rounded-3xl p-3 sm:p-6 w-full max-w-lg mx-4 max-h-[80vh] overflow-y-auto shadow-2xl border border-purple-500/30 relative overflow-hidden">
              {/* 배경 애니메이션 효과 */}
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 via-pink-600/10 to-purple-600/10 animate-pulse"></div>
              
              <div className="relative z-10">
                {/* 헤더 - 실시간 Top 3 스타일 */}
                <div className="text-center mb-3 sm:mb-6">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <FaHistory className="text-purple-400 animate-bounce w-4 h-4 sm:w-7 sm:h-7" />
                    <h2 className="text-lg sm:text-2xl md:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-orange-400 to-pink-400">
                      포인트 내역
                    </h2>
                    <FaHistory className="text-purple-400 animate-bounce w-4 h-4 sm:w-7 sm:h-7" />
                  </div>
                  <p className="text-purple-200 text-xs">포인트 획득 및 사용 내역을 확인하세요! 📊</p>
                </div>

                {/* 닫기 버튼 */}
                <button
                  onClick={closePointHistory}
                  className="absolute top-2 right-2 w-8 h-8 bg-white/20 rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-all"
                >
                  <FaTimes size={16} />
                </button>
                
                {transactionsLoading ? (
                  <div className="text-center py-6">
                    <div className="w-8 h-8 border-2 border-purple-300/20 border-t-purple-300 rounded-full animate-spin mx-auto mb-3"></div>
                    <p className="text-white text-sm">포인트 내역을 불러오는 중...</p>
                  </div>
                ) : transactions && transactions.length > 0 ? (
                  <div className="space-y-2 sm:space-y-3">
                    {transactions.map((transaction) => (
                      <div key={transaction.id} className="bg-gradient-to-r from-white/10 to-white/5 rounded-xl p-3 hover:from-white/15 hover:to-white/10 transition-all border border-white/20">
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
                ) : (
                  <div className="text-center py-6">
                    <FaCoins size={40} className="mx-auto text-purple-400 mb-3" />
                    <h4 className="text-base font-bold text-white mb-2">포인트 내역이 없습니다</h4>
                    <p className="text-purple-200 text-xs mb-4">
                      배달 실적을 업로드하고<br />
                      포인트를 획득해보세요!
                    </p>
                    <button 
                      onClick={() => {
                        closePointHistory();
                        router.push('/upload');
                      }}
                      className="bg-gradient-to-r from-purple-400 to-pink-500 hover:from-purple-500 hover:to-pink-600 text-white px-4 py-2 rounded-xl font-bold text-sm hover:scale-105 transition-all"
                    >
                      실적 업로드하기
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
} 
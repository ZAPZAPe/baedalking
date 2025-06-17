'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { FaCoins, FaGift, FaCheckCircle, FaTimes, FaSpinner } from 'react-icons/fa';
import { useRouter } from 'next/navigation';
import { getPointTransactions, PointTransaction } from '@/services/pointService';

export default function PointsHistoryPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [points, setPoints] = useState<PointTransaction[]>([]);
  const router = useRouter();

  useEffect(() => {
    const fetchPointsHistory = async () => {
      if (!user) return;

      try {
        const transactions = await getPointTransactions(user.id, 10);
        setPoints(transactions);
      } catch (error) {
        console.error('포인트 내역 조회 오류:', error);
        setError('포인트 내역을 불러오는데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchPointsHistory();
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin text-blue-500">
          <FaSpinner size={40} />
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 shadow-xl border border-white/20 max-w-md w-full max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <FaCoins className="text-yellow-400" />
            <h1 className="text-xl font-bold text-white">포인트 내역</h1>
          </div>
          <button
            onClick={() => router.back()}
            className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-all"
          >
            <FaTimes size={16} />
          </button>
        </div>

        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 mb-6">
            {error}
          </div>
        )}

        {points.length === 0 ? (
          <div className="text-center py-8">
            <FaCoins size={48} className="mx-auto text-gray-400 mb-4" />
            <h4 className="text-lg font-bold text-white mb-2">포인트 내역이 없습니다</h4>
            <p className="text-gray-400 text-sm mb-6">
              출석체크하고<br />
              포인트를 획득해보세요!
            </p>
            <button 
              onClick={() => {
                router.back();
                router.push('/settings');
              }}
              className="bg-gradient-to-r from-yellow-400 to-orange-500 text-black px-6 py-3 rounded-xl font-bold hover:scale-105 transition-all"
            >
              출석체크하기
            </button>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {points.map((point) => (
                <div key={point.id} className="bg-white/5 rounded-xl p-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-white font-bold">{point.description}</span>
                    <span className={`font-bold ${point.type === 'earn' ? 'text-green-400' : 'text-red-400'}`}>
                      {point.type === 'earn' ? '+' : '-'}{point.amount}P
                    </span>
                  </div>
                  <div className="text-gray-400 text-sm">
                    {new Date(point.createdAt).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
            <div className="text-center mt-6 text-gray-400 text-sm">
              최근 10개의 포인트 내역만 표시됩니다
            </div>
          </>
        )}
      </div>
    </div>
  );
} 
import { useState } from 'react';
import { FaFireAlt } from 'react-icons/fa';

type RankingPeriod = 'today' | 'week';
type RankingType = 'count' | 'amount';

interface RankingListProps {
  period: RankingPeriod;
}

export default function RankingList({ period }: RankingListProps) {
  const [rankingType, setRankingType] = useState<RankingType>('count');

  // 임시 데이터
  const rankings = [
    {
      id: 1,
      rank: 1,
      nickname: '라이더1',
      count: 15,
      amount: 150000,
      region: '서울',
      platform: '배민',
      profileImage: null,
    },
    {
      id: 2,
      rank: 2,
      nickname: '라이더2',
      count: 12,
      amount: 120000,
      region: '경기',
      platform: '쿠팡이츠',
      profileImage: null,
    },
    {
      id: 3,
      rank: 3,
      nickname: '라이더3',
      count: 10,
      amount: 100000,
      region: '인천',
      platform: '배민',
      profileImage: null,
    },
  ];

  return (
    <div className="space-y-4">
      {/* 랭킹 타입 선택 */}
      <div className="flex border-b">
        <button
          className={`flex-1 py-3 text-center ${
            rankingType === 'count'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600'
          }`}
          onClick={() => setRankingType('count')}
        >
          배달 건수
        </button>
        <button
          className={`flex-1 py-3 text-center ${
            rankingType === 'amount'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600'
          }`}
          onClick={() => setRankingType('amount')}
        >
          배달 금액
        </button>
      </div>

      {/* TOP 3 랭킹 */}
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 shadow-xl border border-white/20">
        <div className="text-center mb-4">
          <h2 className="text-2xl font-black text-white mb-3 flex items-center justify-center gap-2">
            <FaFireAlt className="text-orange-400" size={24} />
            실시간 TOP 3
            <FaFireAlt className="text-orange-400" size={24} />
          </h2>
          <p className="text-blue-200 text-sm">지금 가장 많이 벌고 있는 배달킹들!</p>
        </div>
        <div className="space-y-3">
          {rankings.slice(0, 3).map((user, index) => (
            <div 
              key={user.id}
              className={`
                flex items-center gap-4 p-4 rounded-xl shadow-lg
                transition-all duration-300 hover:scale-102
                ${index === 0 
                  ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-black' 
                  : index === 1 
                    ? 'bg-gradient-to-r from-gray-300 to-gray-500 text-black'
                    : 'bg-gradient-to-r from-amber-600 to-amber-800 text-white'
                }
              `}
            >
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-white/20">
                <span className="text-2xl font-black">{index + 1}</span>
              </div>
              <div className="flex-1">
                <div className="font-black text-lg">{user.nickname}</div>
                <div className="text-sm opacity-80">{user.region}</div>
              </div>
              <div className="text-right">
                <div className="font-black text-lg">
                  {rankingType === 'count' 
                    ? `${user.count}건`
                    : `${user.amount.toLocaleString()}원`
                  }
                </div>
                <div className="text-sm opacity-80">{user.platform}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 나머지 랭킹 리스트 */}
      <div className="bg-white rounded-lg shadow divide-y">
        {rankings.slice(3).map((user) => (
          <div key={user.id} className="p-4 flex items-center">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">
              {user.rank}
            </div>
            <div className="ml-4 flex-1">
              <div className="font-medium">{user.nickname}</div>
              <div className="text-sm text-gray-500">
                {rankingType === 'count'
                  ? `${user.count}건`
                  : `${user.amount.toLocaleString()}원`}
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500">{user.region}</div>
              <div className="text-xs text-gray-400">{user.platform}</div>
            </div>
          </div>
        ))}
      </div>

      {/* 내 순위 */}
      <div className="bg-blue-50 rounded-lg p-4">
        <div className="flex items-center">
          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
            42
          </div>
          <div className="ml-4 flex-1">
            <div className="font-medium">내 순위</div>
            <div className="text-sm text-gray-500">
              {rankingType === 'count' ? '8건' : '80,000원'}
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500">서울</div>
            <div className="text-xs text-gray-400">배민</div>
          </div>
        </div>
      </div>
    </div>
  );
} 
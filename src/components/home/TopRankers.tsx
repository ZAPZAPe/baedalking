import React from 'react';
import { FaFireAlt, FaCrown, FaMedal, FaTrophy } from 'react-icons/fa';
import { RankingData } from '@/services/rankingService';
import { memo } from 'react';

interface TopRankersProps {
  topRankers: RankingData[];
}

const getRankIcon = (rank: number) => {
  switch (rank) {
    case 1:
      return <FaCrown className="text-yellow-400" size={20} />;
    case 2:
      return <FaMedal className="text-gray-300" size={20} />;
    case 3:
      return <FaTrophy className="text-amber-600" size={20} />;
    default:
      return null;
  }
};

const RankerItem = memo(({ ranker, index }: { ranker: RankingData; index: number }) => (
  <div 
    className={`
      flex items-center gap-3 p-3 rounded-xl
      transition-all duration-300 hover:scale-[1.02]
      ${index === 0 
        ? 'bg-gradient-to-r from-yellow-400/20 to-orange-500/20 border border-yellow-400/30' 
        : index === 1 
          ? 'bg-gradient-to-r from-gray-300/20 to-gray-500/20 border border-gray-400/30'
          : 'bg-gradient-to-r from-amber-600/20 to-amber-800/20 border border-amber-600/30'
      }
    `}
  >
    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-white/10">
      {getRankIcon(index + 1)}
    </div>
    <div className="flex-1">
      <div className="font-bold text-white text-sm">{ranker.nickname}</div>
      <div className="text-xs text-blue-200">{ranker.region}</div>
    </div>
    <div className="text-right">
      <div className="font-bold text-white text-sm">
        {ranker.totalAmount.toLocaleString()}원
      </div>
      <div className="text-xs text-blue-200">
        {ranker.totalOrders}건
      </div>
    </div>
  </div>
));

RankerItem.displayName = 'RankerItem';

export function TopRankers({ topRankers }: TopRankersProps) {
  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 shadow-xl border border-white/20">
      <div className="text-center mb-4">
        <h2 className="text-2xl font-black text-white flex items-center justify-center gap-2">
          <FaFireAlt className="text-orange-400" size={24} />
          실시간 TOP 3
          <FaFireAlt className="text-orange-400" size={24} />
        </h2>
        <p className="text-blue-200 text-sm pt-2">지금 가장 열심히 달리고 있는 배달킹들!</p>
      </div>
      <div className="space-y-3">
        {topRankers.length > 0 ? (
          topRankers.map((ranker, index) => (
            <div 
              key={ranker.rank}
              className={`
                flex items-center gap-4 p-4 rounded-xl shadow-lg
                transition-all duration-300 hover:scale-[1.02]
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
                <div className="font-black text-lg">{ranker.nickname}</div>
                <div className="text-sm opacity-80">{ranker.region}</div>
              </div>
              <div className="text-right">
                <div className="font-black text-lg">
                  {ranker.totalAmount.toLocaleString()}원
                </div>
                <div className="text-sm opacity-80">
                  {ranker.totalOrders}건
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8">
            <p className="text-white/60">아직 오늘의 랭킹이 없습니다.</p>
          </div>
        )}
      </div>
    </div>
  );
}

TopRankers.displayName = 'TopRankers'; 
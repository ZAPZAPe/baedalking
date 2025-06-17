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

export const TopRankers = memo(({ topRankers }: TopRankersProps) => (
  <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-4 shadow-xl border border-white/20">
    <div className="flex items-center justify-between mb-4">
      <div>
        <h2 className="text-2xl font-bold text-white">실시간 TOP 3</h2>
        <p className="text-blue-200 text-sm">오늘의 배달왕은 누구?</p>
      </div>
      <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg">
        <FaFireAlt className="text-white" size={20} />
      </div>
    </div>
    <div className="space-y-2">
      {topRankers.map((ranker, index) => (
        <RankerItem key={ranker.rank} ranker={ranker} index={index} />
      ))}
    </div>
  </div>
));

TopRankers.displayName = 'TopRankers'; 
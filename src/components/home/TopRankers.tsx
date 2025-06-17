import { FaFireAlt } from 'react-icons/fa';
import { RankingData } from '@/services/rankingService';
import { memo } from 'react';

interface TopRankersProps {
  topRankers: RankingData[];
}

const RankerItem = memo(({ ranker, index }: { ranker: RankingData; index: number }) => (
  <div 
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
));

RankerItem.displayName = 'RankerItem';

export const TopRankers = memo(({ topRankers }: TopRankersProps) => (
  <section className="mb-6">
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
        {topRankers.map((ranker, index) => (
          <RankerItem key={ranker.rank} ranker={ranker} index={index} />
        ))}
      </div>
    </div>
  </section>
));

TopRankers.displayName = 'TopRankers'; 
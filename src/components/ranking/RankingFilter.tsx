type RankingPeriod = 'today' | 'week';

interface RankingFilterProps {
  period: RankingPeriod;
  onPeriodChange: (period: RankingPeriod) => void;
}

export default function RankingFilter({ period, onPeriodChange }: RankingFilterProps) {
  return (
    <div className="bg-white rounded-lg shadow">
      <div className="flex">
        <button
          className={`flex-1 py-3 text-center ${
            period === 'today'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600'
          }`}
          onClick={() => onPeriodChange('today')}
        >
          오늘 랭킹
        </button>
        <button
          className={`flex-1 py-3 text-center ${
            period === 'week'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600'
          }`}
          onClick={() => onPeriodChange('week')}
        >
          주간 랭킹
        </button>
      </div>
    </div>
  );
} 
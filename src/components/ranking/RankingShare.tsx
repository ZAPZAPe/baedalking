import { RankingData } from '@/services/rankingService';

interface RankingShareProps {
  rankingData?: RankingData[];
}

export default function RankingShare({ rankingData }: RankingShareProps) {
  const handleShare = () => {
    // 카카오톡 공유 기능 구현 예정
    alert('카카오톡 공유 기능이 곧 추가됩니다!');
  };

  return (
    <div className="flex justify-center">
      <button
        onClick={handleShare}
        className="flex items-center gap-2 bg-gradient-to-r from-purple-400 to-pink-500 hover:from-purple-500 hover:to-pink-600 text-white px-6 py-3 rounded-xl font-bold text-sm transition-all shadow-lg hover:shadow-xl hover:scale-[1.02]"
      >
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
          />
        </svg>
        <span>랭킹 공유하기</span>
      </button>
    </div>
  );
} 
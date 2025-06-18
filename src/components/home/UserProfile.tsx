import Link from 'next/link';
import { FaUpload, FaTrophy, FaCrown } from 'react-icons/fa';
import { User } from '@/contexts/AuthContext';
import { memo, useMemo } from 'react';

interface UserProfileProps {
  userProfile: User | null;
}

const ProfileStat = memo(({ label, value }: { label: string; value: string | number }) => (
  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center hover:bg-white/20 transition-all">
    <p className="text-xs text-purple-200 mb-1">{label}</p>
    <p className="font-bold text-white">{value}</p>
  </div>
));

ProfileStat.displayName = 'ProfileStat';

const ProfileButton = memo(({ href, icon: Icon, children, gradient }: { href: string; icon: any; children: React.ReactNode; gradient: string }) => (
  <Link 
    href={href} 
    className={`w-full ${gradient} text-white font-bold py-3 px-4 rounded-xl shadow-lg hover:shadow-xl flex items-center justify-center transition-all hover:scale-[1.02] gap-2`}
  >
    <Icon size={16} />
    <span className="text-sm">{children}</span>
  </Link>
));

ProfileButton.displayName = 'ProfileButton';

export const UserProfile = memo(({ userProfile }: UserProfileProps) => {
  const vehicleText = useMemo(() => {
    if (!userProfile?.vehicle) return '자동차';
    return userProfile.vehicle === 'motorcycle' ? '오토바이' : 
           userProfile.vehicle === 'bicycle' ? '자전거' : '자동차';
  }, [userProfile?.vehicle]);

  const points = useMemo(() => {
    return userProfile?.points?.toLocaleString() || '0';
  }, [userProfile?.points]);

  return (
    <div className="bg-gradient-to-br from-purple-900/30 to-pink-900/30 backdrop-blur-lg rounded-3xl p-4 sm:p-6 shadow-2xl border border-purple-500/30 relative overflow-hidden">
      {/* 배경 애니메이션 효과 */}
      <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 via-pink-600/10 to-purple-600/10 animate-pulse"></div>
      
      <div className="relative z-10">
        <div className="flex items-center justify-center text-center mb-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-orange-400 to-pink-400 mb-1 flex items-center justify-center gap-2">
              <FaCrown className="text-yellow-400 animate-pulse w-5 h-5 sm:w-6 sm:h-6" />
              {userProfile?.nickname || '배달킹'}님
            </h1>
            <p className="text-purple-200 text-xs sm:text-sm">오늘도 안전 배달하세요! 🚀</p>
          </div>
        </div>
        
        <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-4">
          <ProfileStat 
            label="지역" 
            value={userProfile?.region || '서울'} 
          />
          <ProfileStat 
            label="배달수단" 
            value={vehicleText} 
          />
          <ProfileStat 
            label="포인트" 
            value={`${points}P`} 
          />
        </div>
        
        <div className="space-y-2 sm:space-y-3">
          <ProfileButton 
            href="/upload" 
            icon={FaUpload}
            gradient="bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600"
          >
            오늘 실적 업로드하기
          </ProfileButton>
        </div>
      </div>
    </div>
  );
});

UserProfile.displayName = 'UserProfile'; 
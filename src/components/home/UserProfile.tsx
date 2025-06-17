import Link from 'next/link';
import { FaUpload, FaTrophy, FaCrown } from 'react-icons/fa';
import { User } from '@/contexts/AuthContext';
import { memo, useMemo } from 'react';

interface UserProfileProps {
  userProfile: User | null;
}

const ProfileStat = memo(({ label, value }: { label: string; value: string | number }) => (
  <div className="bg-white/5 rounded-xl p-3 text-center">
    <p className="text-sm text-blue-200 mb-1">{label}</p>
    <p className="font-bold text-white">{value}</p>
  </div>
));

ProfileStat.displayName = 'ProfileStat';

const ProfileButton = memo(({ href, icon: Icon, children }: { href: string; icon: any; children: React.ReactNode }) => (
  <Link 
    href={href} 
    className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-bold py-3 px-4 rounded-xl shadow-lg hover:shadow-blue-500/25 flex items-center justify-center transition-all hover:scale-[1.02] gap-2"
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
    <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 shadow-xl border border-white/20">
      <div className="flex items-center justify-center text-center mb-4">
        <div>
          <h1 className="text-2xl font-black text-yellow-400 mb-1 flex items-center justify-center gap-2">
            <FaCrown className="text-yellow-400" size={20} />
            {userProfile?.nickname || '배달킹'}님
          </h1>
          <p className="text-blue-200 text-sm">오늘도 안전 배달하세요!</p>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-4 mb-4">
        <ProfileStat label="지역" value={userProfile?.region || '서울'} />
        <ProfileStat label="배달수단" value={vehicleText} />
        <ProfileStat label="포인트" value={`${points}P`} />
      </div>
      <div className="space-y-3">
        <ProfileButton href="/upload" icon={FaUpload}>
          오늘 실적 업로드하기
        </ProfileButton>
        <ProfileButton href="/ranking" icon={FaTrophy}>
          전체 랭킹 보기
        </ProfileButton>
      </div>
    </div>
  );
});

UserProfile.displayName = 'UserProfile'; 
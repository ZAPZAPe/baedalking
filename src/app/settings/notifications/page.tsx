'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { FaBell, FaChartLine, FaGift, FaTrophy, FaUserFriends } from 'react-icons/fa';
import { useRouter } from 'next/navigation';
import Loading from '@/components/Loading';

interface NotificationSetting {
  id: string;
  title: string;
  description: string;
  enabled: boolean;
  icon: React.ReactNode;
}

export default function NotificationsPage() {
  const { user, userProfile, loading: authLoading } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [settings, setSettings] = useState<NotificationSetting[]>([
    {
      id: 'ranking',
      title: '랭킹 변동 알림',
      description: '내 랭킹이 변동될 때 알림을 받습니다.',
      enabled: true,
      icon: <FaChartLine size={20} className="text-blue-400" />
    },
    {
      id: 'points',
      title: '포인트 지급 알림',
      description: '포인트를 획득하거나 사용할 때 알림을 받습니다.',
      enabled: true,
      icon: <FaGift size={20} className="text-yellow-400" />
    },
    {
      id: 'achievements',
      title: '업적 달성 알림',
      description: '새로운 업적을 달성했을 때 알림을 받습니다.',
      enabled: true,
      icon: <FaTrophy size={20} className="text-purple-400" />
    },
    {
      id: 'friends',
      title: '친구 활동 알림',
      description: '친구의 새로운 활동에 대한 알림을 받습니다.',
      enabled: true,
      icon: <FaUserFriends size={20} className="text-green-400" />
    }
  ]);

  useEffect(() => {
    if (userProfile?.notificationSettings) {
      setSettings(prev => prev.map(setting => ({
        ...setting,
        enabled: userProfile.notificationSettings?.[setting.id] ?? true
      })));
    }
  }, [userProfile]);

  if (loading || !userProfile) {
    return <Loading />;
  }

  if (!user) {
    router.push('/login');
    return null;
  }

  const toggleSetting = async (settingId: string) => {
    if (!user) return;

    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      const newSettings = settings.map(setting => ({
        ...setting,
        enabled: setting.id === settingId ? !setting.enabled : setting.enabled
      }));

      const notificationSettings = newSettings.reduce((acc, setting) => ({
        ...acc,
        [setting.id]: setting.enabled
      }), {});

      const { error } = await supabase
        .from('users')
        .update({ notification_settings: notificationSettings })
        .eq('id', user.id);

      if (error) throw error;

      setSettings(newSettings);
      setSuccess(true);
    } catch (error) {
      console.error('알림 설정 업데이트 오류:', error);
      setError('알림 설정을 업데이트하는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative z-10">
      <div className="max-w-3xl mx-auto px-4">
        <h1 className="text-2xl font-bold mb-6">알림 설정</h1>

        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 mb-6">
            {error}
          </div>
        )}

        {success && (
          <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg text-green-400 mb-6">
            알림 설정이 저장되었습니다.
          </div>
        )}

        <div className="space-y-4">
          {settings.map((setting) => (
            <div
              key={setting.id}
              className="bg-white/5 border border-white/10 rounded-lg p-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                    {setting.icon}
                  </div>
                  <div>
                    <div className="font-medium">{setting.title}</div>
                    <div className="text-sm text-gray-400">
                      {setting.description}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => toggleSetting(setting.id)}
                  disabled={loading}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-offset-2 focus:ring-offset-gray-900 ${
                    setting.enabled ? 'bg-yellow-400' : 'bg-gray-600'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      setting.enabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 
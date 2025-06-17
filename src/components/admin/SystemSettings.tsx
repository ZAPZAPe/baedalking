'use client';

import { useState, useEffect } from 'react';
import { FaSave, FaRedo, FaCog, FaBell, FaShieldAlt, FaDatabase } from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import { supabase } from '@/lib/supabase';

interface SystemConfig {
  // 기본 설정
  siteName: string;
  adminEmail: string;
  maintenanceMode: boolean;
  
  // 포인트 설정
  signupBonus: number;
  referralBonus: number;
  dailyUploadLimit: number;
  
  // 보안 설정
  requireEmailVerification: boolean;
  passwordMinLength: number;
  sessionTimeout: number;
  
  // 알림 설정
  emailNotifications: boolean;
  pushNotifications: boolean;
  fraudAlertThreshold: number;
  
  // 데이터 설정
  dataRetentionDays: number;
  autoBackupEnabled: boolean;
  backupFrequency: 'daily' | 'weekly' | 'monthly';
}

export default function SystemSettings() {
  const [config, setConfig] = useState<SystemConfig>({
    siteName: '배달왕',
    adminEmail: 'admin@baedalking.com',
    maintenanceMode: false,
    signupBonus: 500,
    referralBonus: 100,
    dailyUploadLimit: 5,
    requireEmailVerification: true,
    passwordMinLength: 8,
    sessionTimeout: 30,
    emailNotifications: true,
    pushNotifications: false,
    fraudAlertThreshold: 3,
    dataRetentionDays: 365,
    autoBackupEnabled: true,
    backupFrequency: 'daily'
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [originalConfig, setOriginalConfig] = useState<SystemConfig | null>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      // 실제로는 Supabase에서 설정을 가져옴
      const { data, error } = await supabase
        .from('system_settings')
        .select('*')
        .single();
      
      if (data) {
        setConfig(data);
        setOriginalConfig(data);
      }
    } catch (error) {
      console.error('설정 가져오기 오류:', error);
      // 기본값 사용
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    try {
      setSaving(true);
      
      // 실제로는 Supabase에 저장
      const { error } = await supabase
        .from('system_settings')
        .upsert({
          id: 1,
          ...config,
          updated_at: new Date().toISOString()
        });
      
      if (error) throw error;
      
      setOriginalConfig(config);
      toast.success('설정이 저장되었습니다.');
    } catch (error) {
      console.error('설정 저장 오류:', error);
      toast.error('설정 저장에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (originalConfig && window.confirm('모든 변경사항을 취소하시겠습니까?')) {
      setConfig(originalConfig);
      toast('설정이 초기화되었습니다.', { icon: '↩️' });
    }
  };

  const hasChanges = JSON.stringify(config) !== JSON.stringify(originalConfig);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-800"></div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* 헤더 */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">시스템 설정</h2>
        <p className="text-gray-600 mt-1">플랫폼의 전반적인 설정을 관리합니다</p>
      </div>

      {/* 설정 섹션들 */}
      <div className="space-y-6">
        {/* 기본 설정 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
          <div className="flex items-center mb-4">
            <FaCog className="text-gray-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">기본 설정</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                사이트 이름
              </label>
              <input
                type="text"
                value={config.siteName}
                onChange={(e) => setConfig({ ...config, siteName: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                관리자 이메일
              </label>
              <input
                type="email"
                value={config.adminEmail}
                onChange={(e) => setConfig({ ...config, adminEmail: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div className="md:col-span-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={config.maintenanceMode}
                  onChange={(e) => setConfig({ ...config, maintenanceMode: e.target.checked })}
                  className="mr-2"
                />
                <span className="text-sm font-medium text-gray-700">유지보수 모드</span>
              </label>
              <p className="text-xs text-gray-500 mt-1">활성화 시 관리자만 접속 가능합니다</p>
            </div>
          </div>
        </div>

        {/* 포인트 설정 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
          <div className="flex items-center mb-4">
            <FaDatabase className="text-gray-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">포인트 설정</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                가입 보너스
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={config.signupBonus}
                  onChange={(e) => setConfig({ ...config, signupBonus: parseInt(e.target.value) || 0 })}
                  className="w-full pl-3 pr-8 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">P</span>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                추천인 보너스
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={config.referralBonus}
                  onChange={(e) => setConfig({ ...config, referralBonus: parseInt(e.target.value) || 0 })}
                  className="w-full pl-3 pr-8 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">P</span>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                일일 업로드 제한
              </label>
              <input
                type="number"
                value={config.dailyUploadLimit}
                onChange={(e) => setConfig({ ...config, dailyUploadLimit: parseInt(e.target.value) || 1 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* 보안 설정 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
          <div className="flex items-center mb-4">
            <FaShieldAlt className="text-gray-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">보안 설정</h3>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={config.requireEmailVerification}
                  onChange={(e) => setConfig({ ...config, requireEmailVerification: e.target.checked })}
                  className="mr-2"
                />
                <span className="text-sm font-medium text-gray-700">이메일 인증 필수</span>
              </label>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  최소 비밀번호 길이
                </label>
                <input
                  type="number"
                  value={config.passwordMinLength}
                  onChange={(e) => setConfig({ ...config, passwordMinLength: parseInt(e.target.value) || 8 })}
                  min="6"
                  max="20"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  세션 타임아웃 (분)
                </label>
                <input
                  type="number"
                  value={config.sessionTimeout}
                  onChange={(e) => setConfig({ ...config, sessionTimeout: parseInt(e.target.value) || 30 })}
                  min="5"
                  max="1440"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* 알림 설정 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
          <div className="flex items-center mb-4">
            <FaBell className="text-gray-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">알림 설정</h3>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={config.emailNotifications}
                  onChange={(e) => setConfig({ ...config, emailNotifications: e.target.checked })}
                  className="mr-2"
                />
                <span className="text-sm font-medium text-gray-700">이메일 알림</span>
              </label>
            </div>
            
            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={config.pushNotifications}
                  onChange={(e) => setConfig({ ...config, pushNotifications: e.target.checked })}
                  className="mr-2"
                />
                <span className="text-sm font-medium text-gray-700">푸시 알림</span>
              </label>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                부정행위 알림 기준 (건)
              </label>
              <input
                type="number"
                value={config.fraudAlertThreshold}
                onChange={(e) => setConfig({ ...config, fraudAlertThreshold: parseInt(e.target.value) || 3 })}
                min="1"
                max="10"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">지정된 건수 이상 감지 시 알림</p>
            </div>
          </div>
        </div>

        {/* 데이터 설정 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
          <div className="flex items-center mb-4">
            <FaDatabase className="text-gray-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">데이터 설정</h3>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                데이터 보관 기간 (일)
              </label>
              <input
                type="number"
                value={config.dataRetentionDays}
                onChange={(e) => setConfig({ ...config, dataRetentionDays: parseInt(e.target.value) || 365 })}
                min="30"
                max="3650"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={config.autoBackupEnabled}
                  onChange={(e) => setConfig({ ...config, autoBackupEnabled: e.target.checked })}
                  className="mr-2"
                />
                <span className="text-sm font-medium text-gray-700">자동 백업 활성화</span>
              </label>
            </div>
            
            {config.autoBackupEnabled && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  백업 주기
                </label>
                <select
                  value={config.backupFrequency}
                  onChange={(e) => setConfig({ ...config, backupFrequency: e.target.value as 'daily' | 'weekly' | 'monthly' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="daily">매일</option>
                  <option value="weekly">매주</option>
                  <option value="monthly">매월</option>
                </select>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 액션 버튼 */}
      <div className="mt-8 flex justify-end gap-3">
        <button
          onClick={handleReset}
          disabled={!hasChanges}
          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          <FaRedo size={14} />
          초기화
        </button>
        <button
          onClick={handleSaveSettings}
          disabled={saving || !hasChanges}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          <FaSave size={14} />
          {saving ? '저장 중...' : '설정 저장'}
        </button>
      </div>
    </div>
  );
} 
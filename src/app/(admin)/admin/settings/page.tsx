'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { getSettings, updateSettings } from '@/services/adminService';
import { Settings } from '@/types/settings';
import { toast } from 'sonner';

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const data = await getSettings();
      setSettings(data);
    } catch (error) {
      console.error('설정 로드 실패:', error);
      toast.error('설정을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!settings) return;

    setSaving(true);
    try {
      await updateSettings(settings);
      toast.success('설정이 저장되었습니다.');
    } catch (error) {
      console.error('설정 저장 실패:', error);
      toast.error('설정 저장에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (key: keyof Settings, value: any) => {
    if (!settings) return;
    setSettings(prev => prev ? { ...prev, [key]: value } : null);
  };

  if (loading || !settings) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">설정</h1>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? '저장 중...' : '저장'}
        </Button>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>일반 설정</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>사이트 이름</Label>
              <Input
                value={settings.siteName}
                onChange={(e) => handleChange('siteName', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>관리자 이메일</Label>
              <Input
                type="email"
                value={settings.adminEmail}
                onChange={(e) => handleChange('adminEmail', e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>실적 설정</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>OCR 자동 검증</Label>
                <p className="text-sm text-muted-foreground">
                  OCR 결과의 신뢰도가 높은 경우 자동으로 검증
                </p>
              </div>
              <Switch
                checked={settings.autoVerifyOcr}
                onChange={(e) => handleChange('autoVerifyOcr', e.target.checked)}
              />
            </div>
            <div className="space-y-2">
              <Label>OCR 신뢰도 임계값 (%)</Label>
              <Input
                type="number"
                min="0"
                max="100"
                value={settings.ocrConfidenceThreshold}
                onChange={(e) => handleChange('ocrConfidenceThreshold', Number(e.target.value))}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>사기 탐지 설정</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>자동 사기 탐지</Label>
                <p className="text-sm text-muted-foreground">
                  AI를 사용한 자동 사기 탐지 활성화
                </p>
              </div>
              <Switch
                checked={settings.autoFraudDetection}
                onChange={(e) => handleChange('autoFraudDetection', e.target.checked)}
              />
            </div>
            <div className="space-y-2">
              <Label>사기 탐지 임계값 (%)</Label>
              <Input
                type="number"
                min="0"
                max="100"
                value={settings.fraudDetectionThreshold}
                onChange={(e) => handleChange('fraudDetectionThreshold', Number(e.target.value))}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>알림 설정</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>이메일 알림</Label>
                <p className="text-sm text-muted-foreground">
                  중요 이벤트 발생 시 이메일 알림 전송
                </p>
              </div>
              <Switch
                checked={settings.emailNotifications}
                onChange={(e) => handleChange('emailNotifications', e.target.checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>사기 의심 알림</Label>
                <p className="text-sm text-muted-foreground">
                  사기 의심 실적 발생 시 즉시 알림
                </p>
              </div>
              <Switch
                checked={settings.fraudNotifications}
                onChange={(e) => handleChange('fraudNotifications', e.target.checked)}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 
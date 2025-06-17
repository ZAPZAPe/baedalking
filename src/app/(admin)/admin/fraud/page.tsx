'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getFraudRecords, updateFraudStatus } from '@/services/adminService';
import { FraudRecord } from '@/types/fraud';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

export default function FraudDetectionPage() {
  const [records, setRecords] = useState<FraudRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'pending' | 'confirmed' | 'rejected'>('all');

  useEffect(() => {
    loadRecords();
  }, []);

  const loadRecords = async () => {
    try {
      const data = await getFraudRecords();
      setRecords(data);
    } catch (error) {
      console.error('사기 기록 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (recordId: string, status: 'confirmed' | 'rejected') => {
    try {
      await updateFraudStatus(recordId, status);
      await loadRecords();
    } catch (error) {
      console.error('상태 업데이트 실패:', error);
    }
  };

  const filteredRecords = records.filter(record => {
    const matchesSearch = record.userNickname.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatus === 'all' || record.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">사기 탐지</h1>
        <div className="flex gap-4">
          <Input
            placeholder="사용자 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-64"
          />
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value as any)}
            className="px-3 py-2 border rounded-md"
          >
            <option value="all">전체</option>
            <option value="pending">대기중</option>
            <option value="confirmed">확인됨</option>
            <option value="rejected">거부됨</option>
          </select>
        </div>
      </div>

      <div className="grid gap-6">
        {filteredRecords.map((record) => (
          <Card key={record.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">
                    {record.userNickname}
                    <Badge
                      variant={record.status === 'confirmed' ? 'destructive' : 'secondary'}
                      className="ml-2"
                    >
                      {record.status === 'confirmed' ? '사기 확인' : record.status === 'rejected' ? '거부됨' : '대기중'}
                    </Badge>
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {format(record.createdAt, 'PPP', { locale: ko })}
                  </p>
                </div>
                {record.status === 'pending' && (
                  <div className="flex gap-2">
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleStatusUpdate(record.id, 'confirmed')}
                    >
                      사기 확인
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleStatusUpdate(record.id, 'rejected')}
                    >
                      거부
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">의심 사유</h3>
                  <p className="text-sm">{record.reason}</p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">관련 실적</h3>
                  <div className="text-sm">
                    <p>플랫폼: {record.platform}</p>
                    <p>금액: {record.amount.toLocaleString()}원</p>
                    <p>신뢰도: {record.confidence}%</p>
                  </div>
                </div>
                {record.imageUrl && (
                  <div>
                    <h3 className="font-semibold mb-2">증거 이미지</h3>
                    <img
                      src={record.imageUrl}
                      alt="증거 이미지"
                      className="max-w-md rounded-lg"
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
} 
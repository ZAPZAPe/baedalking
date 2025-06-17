'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getStatistics } from '@/services/adminService';
import { Statistics } from '@/types/statistics';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function StatisticsPage() {
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year'>('week');

  useEffect(() => {
    loadStatistics();
  }, [timeRange]);

  const loadStatistics = async () => {
    try {
      const data = await getStatistics(timeRange);
      setStatistics(data);
    } catch (error) {
      console.error('통계 데이터 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !statistics) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">통계</h1>
        <Select value={timeRange} onValueChange={(value: 'week' | 'month' | 'year') => setTimeRange(value)}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="기간 선택" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="week">주간</SelectItem>
            <SelectItem value="month">월간</SelectItem>
            <SelectItem value="year">연간</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">총 사용자</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.totalUsers.toLocaleString()}명</div>
            <p className="text-xs text-muted-foreground">
              전월 대비 {statistics.userGrowth > 0 ? '+' : ''}{statistics.userGrowth}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">총 실적</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.totalRecords.toLocaleString()}건</div>
            <p className="text-xs text-muted-foreground">
              전월 대비 {statistics.recordGrowth > 0 ? '+' : ''}{statistics.recordGrowth}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">총 금액</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.totalAmount.toLocaleString()}원</div>
            <p className="text-xs text-muted-foreground">
              전월 대비 {statistics.amountGrowth > 0 ? '+' : ''}{statistics.amountGrowth}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">사기 의심</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.fraudCount.toLocaleString()}건</div>
            <p className="text-xs text-muted-foreground">
              전체 실적의 {((statistics.fraudCount / statistics.totalRecords) * 100).toFixed(1)}%
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>실적 추이</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={statistics.trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(date) => format(new Date(date), 'MM/dd', { locale: ko })}
                />
                <YAxis />
                <Tooltip
                  labelFormatter={(date) => format(new Date(date), 'PPP', { locale: ko })}
                  formatter={(value: number) => [value.toLocaleString(), '실적']}
                />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="#8884d8"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>플랫폼별 실적</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {statistics.platformStats.map((stat) => (
                <div key={stat.platform} className="flex items-center justify-between">
                  <span className="text-sm font-medium">{stat.platform}</span>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-muted-foreground">
                      {stat.count.toLocaleString()}건
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {stat.amount.toLocaleString()}원
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>지역별 실적</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {statistics.regionStats.map((stat) => (
                <div key={stat.region} className="flex items-center justify-between">
                  <span className="text-sm font-medium">{stat.region}</span>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-muted-foreground">
                      {stat.count.toLocaleString()}건
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {stat.amount.toLocaleString()}원
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 
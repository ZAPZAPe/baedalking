"use client";

import { useState, useEffect } from 'react';
import { FaClipboardList, FaCalendarAlt, FaMoneyBillWave, FaPlus, FaImage, FaCheck, FaTimes, FaChartLine, FaUsers, FaTrophy, FaFire, FaList, FaCalendar, FaTrash, FaFilter, FaCamera, FaSpinner } from 'react-icons/fa';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { getUserDeliveryRecords, deleteDeliveryRecord } from '@/services/deliveryService';
import type { DeliveryRecord } from '@/types/index';
import Loading from '@/components/Loading';
import ManualEntry from '@/components/delivery/ManualEntry';
import Link from 'next/link';
import Image from 'next/image';
import KakaoAd from '@/components/KakaoAd';

export default function RecordsPage() {
  const { user, userProfile, loading } = useAuth();
  const router = useRouter();
  const [records, setRecords] = useState<DeliveryRecord[]>([]);
  const [recordsLoading, setRecordsLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month'>('week');
  const [selectedPlatform, setSelectedPlatform] = useState<'all' | '배민커넥트' | '쿠팡이츠'>('all');
  const [manualOpen, setManualOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // 달력 관련 함수들
  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  // 달력 관련 변수들
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth();
  const firstDayOfMonth = getFirstDayOfMonth(today);
  const daysInMonth = getDaysInMonth(today);
  const todayStr = today.toISOString().split('T')[0];

  // 사용자 배달 기록 가져오기
  useEffect(() => {
    const fetchRecords = async () => {
      if (!user) return;
      
      setRecordsLoading(true);
      try {
        const userRecords = await getUserDeliveryRecords(user.id);
        setRecords(userRecords);
      } catch (error) {
        console.error('기록 가져오기 오류:', error);
      } finally {
        setRecordsLoading(false);
      }
    };

    fetchRecords();
  }, [user]);

  // 기록 새로고침 함수
  const refreshRecords = async () => {
    if (!user) return;
    
    setRecordsLoading(true);
    try {
      const userRecords = await getUserDeliveryRecords(user.id);
      setRecords(userRecords);
    } catch (error) {
      console.error('기록 새로고침 오류:', error);
    } finally {
      setRecordsLoading(false);
    }
  };

  // 기록 삭제 함수
  const handleDeleteRecord = async (recordId: string) => {
    if (!user || !recordId) return;
    
    if (confirm('정말로 이 기록을 삭제하시겠습니까?')) {
      try {
        await deleteDeliveryRecord(recordId);
        await refreshRecords();
        // 팝업이 열려있다면 닫기
        if (selectedDate) {
          setSelectedDate(null);
        }
      } catch (error) {
        console.error('기록 삭제 오류:', error);
        alert('기록 삭제 중 오류가 발생했습니다.');
      }
    }
  };

  if (loading || recordsLoading) {
    return <Loading text="기록을 불러오는 중..." />;
  }

  if (!user) {
    router.push('/login');
    return null;
  }

  // 날짜 계산 함수들
  const getWeekStart = (date: Date) => {
    const d = new Date(date);
    const day = d.getDay();
    // 일요일(0)을 7로 변환하여 월요일(1)을 기준으로 계산
    const adjustedDay = day === 0 ? 7 : day;
    const diff = d.getDate() - (adjustedDay - 1);
    const weekStart = new Date(d.setDate(diff));
    weekStart.setHours(0, 0, 0, 0);
    console.log('주 시작일:', weekStart.toISOString().split('T')[0]);
    return weekStart;
  };

  const getMonthStart = (date: Date) => {
    const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
    monthStart.setHours(0, 0, 0, 0);
    console.log('월 시작일:', monthStart.toISOString().split('T')[0]);
    return monthStart;
  };

  // 기간별 필터링
  const getFilteredRecords = () => {
    let filteredByPlatform = records;
    if (selectedPlatform !== 'all') {
      filteredByPlatform = records.filter(record => record.platform === selectedPlatform);
    }

    if (selectedPeriod === 'week') {
      const weekStart = getWeekStart(today);
      const weekStartStr = weekStart.toISOString().split('T')[0];
      return filteredByPlatform.filter(record => {
        // 날짜 문자열 직접 비교
        return record.date >= weekStartStr;
      });
    } else {
      const monthStart = getMonthStart(today);
      const monthStartStr = monthStart.toISOString().split('T')[0];
      return filteredByPlatform.filter(record => {
        // 날짜 문자열 직접 비교
        return record.date >= monthStartStr;
      });
    }
  };

  const filteredRecords = getFilteredRecords();
  
  // 오늘 기록 계산
  const todayRecords = records.filter(record => record.date === todayStr);
  const todayTotal = todayRecords.reduce((sum, record) => sum + record.amount, 0);
  const todayCount = todayRecords.reduce((sum, record) => sum + record.deliveryCount, 0);

  // 선택된 기간 통계
  const periodTotal = filteredRecords.reduce((sum, record) => sum + record.amount, 0);
  const periodCount = filteredRecords.reduce((sum, record) => sum + record.deliveryCount, 0);
  const periodDays = selectedPeriod === 'week' ? 7 : new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const dailyAverage = Math.floor(periodTotal / periodDays);

  // 플랫폼별 통계
  const baeminRecords = filteredRecords.filter(r => r.platform === '배민커넥트');
  const coupangRecords = filteredRecords.filter(r => r.platform === '쿠팡이츠');
  const baeminTotal = baeminRecords.reduce((sum, record) => sum + record.amount, 0);
  const coupangTotal = coupangRecords.reduce((sum, record) => sum + record.amount, 0);

  const getPlatformName = (platform: string) => {
    switch (platform) {
      case '배민커넥트': return '배민커넥트';
      case '쿠팡이츠': return '쿠팡이츠';
      default: return platform;
    }
  };

  const getPlatformColor = (platform: string) => {
    switch (platform) {
      case '배민커넥트': return 'text-cyan-300';
      case '쿠팡이츠': return 'text-orange-300';
      default: return 'text-gray-300';
    }
  };

  // 날짜별로 그룹화
  const recordsByDate = filteredRecords.reduce((groups, record) => {
    const date = record.date;
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(record);
    return groups;
  }, {} as Record<string, DeliveryRecord[]>);

  const sortedDates = Object.keys(recordsByDate).sort((a, b) => b.localeCompare(a));

  const getCalendarDays = () => {
    const year = today.getFullYear();
    const month = today.getMonth();
    const daysInMonth = getDaysInMonth(today);
    const firstDay = getFirstDayOfMonth(today);
    const days = [];

    // 이전 달의 빈 날짜들
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }

    // 이번 달의 날짜들
    for (let i = 1; i <= daysInMonth; i++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      days.push(dateStr);
    }

    return days;
  };

  const getRecordsByDateStr = (dateStr: string) => {
    return records.filter(record => record.date === dateStr);
  };

  const getDayTotal = (dateStr: string) => {
    const dayRecords = getRecordsByDateStr(dateStr);
    return dayRecords.reduce((sum, record) => sum + record.amount, 0);
  };

  return (
    <div className="relative z-10">
      <div className="max-w-3xl mx-auto px-4">
        {/* 상단 광고 */}
        <section className="mt-2 mb-4">
          <KakaoAd page="shop" index={1} />
        </section>

        {/* 오늘의 실적 */}
        <section className="mb-4">
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-4 shadow-xl border border-white/20">
            {/* 상단 타이틀 */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-2xl font-bold text-white">오늘의 실적</h2>
                <p className="text-blue-200 text-sm">
                  오늘도 열심히 달리고 계시네요! 🚀
                </p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg">
                <FaFire className="text-white" size={20} />
              </div>
            </div>

            {/* 실적 정보 */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-white/5 rounded-xl p-3 text-center">
                <p className="text-sm text-blue-200 mb-1">오늘 수익</p>
                <p className="text-xl font-bold text-white">{todayTotal.toLocaleString()}원</p>
                <p className="text-xs text-blue-200">{todayCount}건</p>
              </div>
              <div className="bg-white/5 rounded-xl p-3 text-center">
                <p className="text-sm text-blue-200 mb-1">일평균</p>
                <p className="text-xl font-bold text-white">{dailyAverage.toLocaleString()}원</p>
                <p className="text-xs text-blue-200">{selectedPeriod === 'week' ? '이번 주' : '이번 달'}</p>
              </div>
            </div>

            {/* 버튼 그룹 */}
            <div className="flex flex-col gap-2">
              <button
                onClick={() => setManualOpen(true)}
                className="flex-1 py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 bg-gradient-to-r from-amber-400 to-orange-500 text-white shadow-lg hover:shadow-xl hover:scale-[1.02]"
              >
                <FaPlus size={14} />
                수기 입력
              </button>
              <Link
                href="/upload"
                className="flex-1 py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg hover:shadow-blue-500/25 hover:scale-[1.02]"
              >
                <FaCamera size={14} />
                캡처 업로드
              </Link>
            </div>
          </div>
        </section>

        {/* 통합된 필터 및 기록 섹션 */}
        <section className="mb-4">
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-4 shadow-xl border border-white/20">
            {/* 필터 섹션 */}
            <div className="space-y-3 mb-4">
              {/* 기간 선택 */}
              <div className="flex gap-2">
                {[
                  { value: 'week' as const, label: '주간', icon: FaCalendarAlt },
                  { value: 'month' as const, label: '월간', icon: FaCalendar }
                ].map((v) => (
                  <button
                    key={v.value}
                    onClick={() => setSelectedPeriod(v.value)}
                    className={`
                      flex-1 py-2 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2
                      ${selectedPeriod === v.value
                        ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-white shadow-lg'
                        : 'bg-white/5 text-blue-200 hover:text-white hover:bg-white/10'}
                    `}
                  >
                    <v.icon size={14} />
                    {v.label}
                  </button>
                ))}
              </div>

              {/* 플랫폼 선택 */}
              <div className="flex gap-2">
                {[
                  { value: 'all' as const, label: '전체', icon: FaList },
                  { value: '배민커넥트' as const, label: '배민커넥트', icon: FaClipboardList },
                  { value: '쿠팡이츠' as const, label: '쿠팡이츠', icon: FaMoneyBillWave }
                ].map((v) => (
                  <button
                    key={v.value}
                    onClick={() => setSelectedPlatform(v.value)}
                    className={`
                      flex-1 py-2 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2
                      ${selectedPlatform === v.value
                        ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-white shadow-lg'
                        : 'bg-white/5 text-blue-200 hover:text-white hover:bg-white/10'}
                    `}
                  >
                    <v.icon size={14} />
                    {v.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 구분선 */}
            <div className="h-px bg-white/10 my-4"></div>

            {/* 달력 보기 */}
            <div className="bg-white/5 rounded-xl p-3">
              {selectedPeriod === 'week' ? (
                // 주간 리포트
                <div className="space-y-3">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-base font-bold text-white">
                      {getWeekStart(today).toLocaleDateString('ko-KR', {
                        month: 'long',
                        day: 'numeric'
                      })} ~ {new Date(getWeekStart(today).getTime() + 6 * 24 * 60 * 60 * 1000).toLocaleDateString('ko-KR', {
                        month: 'long',
                        day: 'numeric'
                      })}
                    </h3>
                  </div>

                  {/* 주간 통계 */}
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <div className="bg-white/5 rounded-xl p-3">
                      <div className="text-xs text-blue-200 mb-1">주간 합산 금액</div>
                      <div className="text-lg font-bold text-white">
                        {periodTotal.toLocaleString()}원
                      </div>
                    </div>
                    <div className="bg-white/5 rounded-xl p-3">
                      <div className="text-xs text-blue-200 mb-1">주간 합산 건수</div>
                      <div className="text-lg font-bold text-white">
                        {periodCount}건
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-7 gap-1">
                    {['일', '월', '화', '수', '목', '금', '토'].map((day) => (
                      <div
                        key={day}
                        className="text-center text-xs font-bold text-blue-200 py-1"
                      >
                        {day}
                      </div>
                    ))}
                    {Array.from({ length: 7 }, (_, i) => {
                      const date = new Date(getWeekStart(today).getTime() + i * 24 * 60 * 60 * 1000);
                      const dateStr = date.toISOString().split('T')[0];
                      const isToday = dateStr === todayStr;
                      const hasRecords = getRecordsByDateStr(dateStr).length > 0;

                      return (
                        <button
                          key={dateStr}
                          onClick={() => setSelectedDate(dateStr)}
                          className={`
                            aspect-square relative rounded-lg transition-all
                            ${isToday ? 'bg-amber-400/20' : ''}
                            ${hasRecords ? 'hover:bg-white/10' : ''}
                            ${selectedDate === dateStr ? 'ring-2 ring-amber-400' : ''}
                          `}
                        >
                          <div className="text-center">
                            <div className="text-xs font-bold text-white mb-1">
                              {parseInt(dateStr.split('-')[2])}
                            </div>
                            {hasRecords && (
                              <div className="w-1.5 h-1.5 bg-amber-400 rounded-full mx-auto" />
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : (
                // 월간 리포트
                <div className="space-y-3">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-base font-bold text-white">
                      {today.getFullYear()}년 {today.getMonth() + 1}월
                    </h3>
                  </div>

                  {/* 월간 통계 */}
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <div className="bg-white/5 rounded-xl p-3">
                      <div className="text-xs text-blue-200 mb-1">월간 합산 금액</div>
                      <div className="text-lg font-bold text-white">
                        {periodTotal.toLocaleString()}원
                      </div>
                    </div>
                    <div className="bg-white/5 rounded-xl p-3">
                      <div className="text-xs text-blue-200 mb-1">월간 합산 건수</div>
                      <div className="text-lg font-bold text-white">
                        {periodCount}건
                      </div>
                    </div>
                  </div>

                  {/* 일평균 통계 */}
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <div className="bg-white/5 rounded-xl p-3">
                      <div className="text-xs text-blue-200 mb-1">일평균 금액</div>
                      <div className="text-lg font-bold text-white">
                        {dailyAverage.toLocaleString()}원
                      </div>
                    </div>
                    <div className="bg-white/5 rounded-xl p-3">
                      <div className="text-xs text-blue-200 mb-1">일평균 건수</div>
                      <div className="text-lg font-bold text-white">
                        {Math.floor(periodCount / periodDays)}건
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-7 gap-1">
                    {['일', '월', '화', '수', '목', '금', '토'].map((day) => (
                      <div
                        key={day}
                        className="text-center text-xs font-bold text-blue-200 py-1"
                      >
                        {day}
                      </div>
                    ))}
                    {Array.from({ length: firstDayOfMonth }, (_, i) => (
                      <div key={`empty-${i}`} className="aspect-square" />
                    ))}
                    {Array.from({ length: daysInMonth }, (_, i) => {
                      const date = new Date(currentYear, currentMonth, i + 1);
                      const dateStr = date.toISOString().split('T')[0];
                      const isToday = dateStr === todayStr;
                      const hasRecords = getRecordsByDateStr(dateStr).length > 0;

                      return (
                        <button
                          key={dateStr}
                          onClick={() => setSelectedDate(dateStr)}
                          className={`
                            aspect-square relative rounded-lg transition-all
                            ${isToday ? 'bg-amber-400/20' : ''}
                            ${hasRecords ? 'hover:bg-white/10' : ''}
                            ${selectedDate === dateStr ? 'ring-2 ring-amber-400' : ''}
                          `}
                        >
                          <div className="text-center">
                            <div className="text-xs font-bold text-white mb-1">
                              {parseInt(dateStr.split('-')[2])}
                            </div>
                            {hasRecords && (
                              <div className="w-1.5 h-1.5 bg-amber-400 rounded-full mx-auto" />
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* 하단 광고 */}
        <section className="mb-2">
          <KakaoAd page="shop" index={2} />
        </section>
      </div>

      {/* 수기 입력 모달 */}
      <ManualEntry
        isOpen={manualOpen}
        onClose={() => setManualOpen(false)}
        onSuccess={() => {
          setManualOpen(false);
          refreshRecords();
        }}
      />

      {/* 달력 보기일 때 선택된 날짜의 상세 정보 */}
      {selectedDate && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-blue-900/95 via-purple-900/95 to-indigo-900/95 backdrop-blur-lg rounded-2xl p-6 w-full max-w-lg mx-4 max-h-[80vh] overflow-y-auto shadow-2xl border border-white/20">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white">
                {new Date(selectedDate).toLocaleDateString('ko-KR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  weekday: 'long'
                })}
              </h3>
              <button
                onClick={() => setSelectedDate(null)}
                className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors"
              >
                <FaTimes className="text-white" size={16} />
              </button>
            </div>
            
            <div className="space-y-3">
              {getRecordsByDateStr(selectedDate).length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-white/60">이 날짜에 기록이 없습니다.</p>
                </div>
              ) : (
                <>
                  {getRecordsByDateStr(selectedDate).map((record) => (
                    <div
                      key={record.id}
                      className="flex items-center justify-between p-4 bg-white/10 rounded-xl border border-white/20"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center overflow-hidden">
                          {record.platform === '배민커넥트' ? (
                            <Image
                              src="/images/baemin-logo.svg"
                              alt="배민커넥트"
                              width={24}
                              height={24}
                              className="object-contain"
                            />
                          ) : (
                            <Image
                              src="/images/coupang-logo.svg"
                              alt="쿠팡"
                              width={24}
                              height={24}
                              className="object-contain"
                            />
                          )}
                        </div>
                        <div>
                          <div className="font-bold text-white">{record.platform}</div>
                          <div className="text-sm text-blue-200">
                            {record.deliveryCount}건
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <div className="font-bold text-white">
                            {record.amount.toLocaleString()}원
                          </div>
                          <div className="text-sm">
                            {record.verified ? (
                              <span className="text-green-400">✓ 인증됨</span>
                            ) : (
                              <span className="text-yellow-400">⚠ 미인증</span>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => handleDeleteRecord(record.id)}
                          className="w-8 h-8 flex items-center justify-center rounded-full bg-red-500/20 hover:bg-red-500/30 transition-colors"
                        >
                          <FaTrash className="text-red-400" size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                  
                  <div className="flex items-center justify-between p-4 bg-gradient-to-r from-amber-400/20 to-orange-500/20 rounded-xl border border-amber-400/30">
                    <div className="font-bold text-white">총계</div>
                    <div className="font-bold text-white text-lg">
                      {getDayTotal(selectedDate).toLocaleString()}원
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 
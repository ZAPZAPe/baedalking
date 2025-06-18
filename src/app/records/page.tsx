"use client";

import { useState, useEffect, useMemo } from 'react';
import { FaClipboardList, FaCalendarAlt, FaMoneyBillWave, FaPlus, FaImage, FaCheck, FaTimes, FaChartLine, FaUsers, FaTrophy, FaFire, FaList, FaCalendar, FaTrash, FaFilter, FaCamera, FaSpinner, FaMotorcycle, FaBicycle, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { getUserDeliveryRecords, deleteDeliveryRecord } from '@/services/deliveryService';
import type { DeliveryRecord } from '@/types/index';
import Loading from '@/components/Loading';
import ManualEntry from '@/components/delivery/ManualEntry';
import Link from 'next/link';
import Image from 'next/image';
import KakaoAdGlobal from '@/components/KakaoAdGlobal';

export default function RecordsPage() {
  const { user, userProfile, loading } = useAuth();
  const router = useRouter();
  const [records, setRecords] = useState<DeliveryRecord[]>([]);
  const [recordsLoading, setRecordsLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month'>('week');
  const [selectedPlatform, setSelectedPlatform] = useState<'all' | '배민커넥트' | '쿠팡이츠'>('all');
  const [manualOpen, setManualOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [currentPeriodOffset, setCurrentPeriodOffset] = useState(0); // 0: 현재, -1: 지난주/지난달, 1: 다음주/다음달

  // 날짜 관련 계산을 useMemo로 최적화
  const dateInfo = useMemo(() => {
    const today = new Date();
    let targetDate: Date;
    
    if (selectedPeriod === 'week') {
      // 주간: currentPeriodOffset * 7일만큼 이동
      targetDate = new Date(today.getTime() + currentPeriodOffset * 7 * 24 * 60 * 60 * 1000);
    } else {
      // 월간: currentPeriodOffset개월만큼 이동
      targetDate = new Date(today.getFullYear(), today.getMonth() + currentPeriodOffset, today.getDate());
    }
    
    const currentYear = targetDate.getFullYear();
    const currentMonth = targetDate.getMonth();
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const todayStr = today.toISOString().split('T')[0];
    
    return { today, targetDate, currentYear, currentMonth, firstDayOfMonth, daysInMonth, todayStr };
  }, [selectedPeriod, currentPeriodOffset]);

  // 날짜 계산 함수들
  const getWeekStart = (date: Date) => {
    const d = new Date(date);
    const day = d.getDay();
    const adjustedDay = day === 0 ? 7 : day;
    const diff = d.getDate() - (adjustedDay - 1);
    const weekStart = new Date(d.setDate(diff));
    weekStart.setHours(0, 0, 0, 0);
    return weekStart;
  };

  const getMonthStart = (date: Date) => {
    const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
    monthStart.setHours(0, 0, 0, 0);
    return monthStart;
  };

  // 기간별 필터링 - useMemo로 최적화
  const filteredRecords = useMemo(() => {
    let filteredByPlatform = records;
    if (selectedPlatform !== 'all') {
      filteredByPlatform = records.filter(record => record.platform === selectedPlatform);
    }

    if (selectedPeriod === 'week') {
      const weekStart = getWeekStart(dateInfo.targetDate);
      const weekEnd = new Date(weekStart.getTime() + 6 * 24 * 60 * 60 * 1000);
      const weekStartStr = weekStart.toISOString().split('T')[0];
      const weekEndStr = weekEnd.toISOString().split('T')[0];
      return filteredByPlatform.filter(record => record.date >= weekStartStr && record.date <= weekEndStr);
    } else {
      const monthStart = getMonthStart(dateInfo.targetDate);
      const monthEnd = new Date(dateInfo.targetDate.getFullYear(), dateInfo.targetDate.getMonth() + 1, 0);
      const monthStartStr = monthStart.toISOString().split('T')[0];
      const monthEndStr = monthEnd.toISOString().split('T')[0];
      return filteredByPlatform.filter(record => record.date >= monthStartStr && record.date <= monthEndStr);
    }
  }, [records, selectedPlatform, selectedPeriod, dateInfo.targetDate]);

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

  // 기간이 변경될 때 offset 초기화
  useEffect(() => {
    setCurrentPeriodOffset(0);
  }, [selectedPeriod]);

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
        if (selectedDate) {
          setSelectedDate(null);
        }
      } catch (error) {
        console.error('기록 삭제 오류:', error);
        alert('기록 삭제 중 오류가 발생했습니다.');
      }
    }
  };

  const getRecordsByDateStr = (dateStr: string) => {
    return records.filter(record => record.date === dateStr);
  };

  const getDayTotal = (dateStr: string) => {
    const dayRecords = getRecordsByDateStr(dateStr);
    return dayRecords.reduce((sum, record) => sum + record.amount, 0);
  };

  // 기간 네비게이션 함수들
  const goToPreviousPeriod = () => {
    setCurrentPeriodOffset(prev => prev - 1);
  };

  const goToNextPeriod = () => {
    setCurrentPeriodOffset(prev => prev + 1);
  };

  const goToCurrentPeriod = () => {
    setCurrentPeriodOffset(0);
  };

  // 기간 표시 텍스트 생성
  const getPeriodDisplayText = () => {
    if (selectedPeriod === 'week') {
      const weekStart = getWeekStart(dateInfo.targetDate);
      const weekEnd = new Date(weekStart.getTime() + 6 * 24 * 60 * 60 * 1000);
      
      if (currentPeriodOffset === 0) {
        return '이번 주';
      } else if (currentPeriodOffset === -1) {
        return '지난 주';
      } else if (currentPeriodOffset === 1) {
        return '다음 주';
      } else {
        return `${Math.abs(currentPeriodOffset)}${currentPeriodOffset < 0 ? '주 전' : '주 후'}`;
      }
    } else {
      if (currentPeriodOffset === 0) {
        return '이번 달';
      } else if (currentPeriodOffset === -1) {
        return '지난 달';
      } else if (currentPeriodOffset === 1) {
        return '다음 달';
      } else {
        return `${Math.abs(currentPeriodOffset)}${currentPeriodOffset < 0 ? '개월 전' : '개월 후'}`;
      }
    }
  };

  // 로딩 중이거나 사용자가 없는 경우 처리
  if (loading) {
    return <Loading />;
  }

  if (!user) {
    router.push('/login');
    return null;
  }

  // 통계 계산
  const todayRecords = records.filter(record => record.date === dateInfo.todayStr);
  const todayTotal = todayRecords.reduce((sum, record) => sum + record.amount, 0);
  const todayCount = todayRecords.reduce((sum, record) => sum + record.deliveryCount, 0);

  const periodTotal = filteredRecords.reduce((sum, record) => sum + record.amount, 0);
  const periodCount = filteredRecords.reduce((sum, record) => sum + record.deliveryCount, 0);
  const periodDays = selectedPeriod === 'week' ? 7 : new Date(dateInfo.targetDate.getFullYear(), dateInfo.targetDate.getMonth() + 1, 0).getDate();
  const dailyAverage = Math.floor(periodTotal / periodDays);

  return (
    <div className="relative z-10">
      <div className="max-w-3xl mx-auto px-4">
        {/* 오늘의 실적 */}
        <section className="mb-4 mt-2">
          <div className="bg-gradient-to-br from-purple-900/30 to-pink-900/30 backdrop-blur-lg rounded-3xl p-4 sm:p-6 shadow-2xl border border-purple-500/30 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 via-pink-600/10 to-purple-600/10 animate-pulse"></div>
            
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white">오늘의 실적</h2>
                  <p className="text-purple-200 text-xs sm:text-sm">
                    오늘도 열심히 달리고 계시네요! 🚀
                  </p>
                </div>
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg animate-bounce">
                  <FaFire className="text-white w-4 h-4 sm:w-5 sm:h-5" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 sm:gap-3 mb-4">
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center hover:bg-white/20 transition-all">
                  <p className="text-xs sm:text-sm text-purple-200 mb-1">오늘 수익</p>
                  <p className="text-lg sm:text-xl font-bold text-white">{todayTotal.toLocaleString()}원</p>
                  <p className="text-xs text-purple-200">{todayCount}건</p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center hover:bg-white/20 transition-all">
                  <p className="text-xs sm:text-sm text-purple-200 mb-1">일평균</p>
                  <p className="text-lg sm:text-xl font-bold text-white">{dailyAverage.toLocaleString()}원</p>
                  <p className="text-xs text-purple-200">{getPeriodDisplayText()}</p>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <button
                  onClick={() => setManualOpen(true)}
                  className="flex-1 py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600 text-white shadow-lg hover:shadow-xl hover:scale-[1.02]"
                >
                  <FaPlus className="w-3 h-3 sm:w-4 sm:h-4" />
                  수기 입력
                </button>
                <Link
                  href="/upload"
                  className="flex-1 py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 bg-gradient-to-r from-purple-400 to-pink-500 hover:from-purple-500 hover:to-pink-600 text-white shadow-lg hover:shadow-xl hover:scale-[1.02]"
                >
                  <FaCamera className="w-3 h-3 sm:w-4 sm:h-4" />
                  캡처 업로드
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* 광고 */}
        <section className="mb-4">
          <KakaoAdGlobal page="records" index={0} />
        </section>

        {/* 필터 및 기록 섹션 */}
        <section className="mb-2">
          <div className="bg-gradient-to-br from-purple-900/30 to-pink-900/30 backdrop-blur-lg rounded-3xl p-4 sm:p-6 shadow-2xl border border-purple-500/30 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 via-pink-600/10 to-purple-600/10 animate-pulse"></div>
            
            <div className="relative z-10">
              {/* 필터 섹션 */}
              <div className="space-y-3 mb-4">
                <div className="flex gap-2">
                  {[
                    { value: 'week' as const, label: '주간', Icon: FaCalendarAlt },
                    { value: 'month' as const, label: '월간', Icon: FaCalendar }
                  ].map((v) => (
                    <button
                      key={v.value}
                      onClick={() => setSelectedPeriod(v.value)}
                      className={`
                        flex-1 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2
                        ${selectedPeriod === v.value
                          ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-white shadow-lg'
                          : 'bg-white/10 text-purple-200 hover:text-white hover:bg-white/20'}
                      `}
                    >
                      <v.Icon className="w-3 h-3 sm:w-4 sm:h-4" />
                      {v.label}
                    </button>
                  ))}
                </div>

                <div className="flex gap-2">
                  {[
                    { value: 'all' as const, label: '전체', Icon: FaList },
                    { value: '배민커넥트' as const, label: '배민커넥트' },
                    { value: '쿠팡이츠' as const, label: '쿠팡이츠' }
                  ].map((v) => (
                    <button
                      key={v.value}
                      onClick={() => setSelectedPlatform(v.value)}
                      className={`
                        flex-1 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2
                        ${selectedPlatform === v.value
                          ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-white shadow-lg'
                          : 'bg-white/10 text-purple-200 hover:text-white hover:bg-white/20'}
                      `}
                    >
                      {v.Icon && <v.Icon className="w-3 h-3 sm:w-4 sm:h-4" />}
                      {v.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="h-px bg-purple-400/20 my-4"></div>

              {/* 달력 보기 */}
              <div className="bg-white/10 rounded-xl p-3">
                {selectedPeriod === 'week' ? (
                  // 주간 리포트
                  <div className="space-y-3">
                    <div className="flex items-center justify-between mb-3">
                      <button
                        onClick={goToPreviousPeriod}
                        className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                      >
                        <FaChevronLeft className="text-white" size={14} />
                      </button>
                      
                      <div className="text-center">
                        <h3 className="text-base font-bold text-white">
                          {getWeekStart(dateInfo.targetDate).toLocaleDateString('ko-KR', {
                            month: 'long',
                            day: 'numeric'
                          })} ~ {new Date(getWeekStart(dateInfo.targetDate).getTime() + 6 * 24 * 60 * 60 * 1000).toLocaleDateString('ko-KR', {
                            month: 'long',
                            day: 'numeric'
                          })}
                        </h3>
                        <p className="text-xs text-purple-200 mt-1">{getPeriodDisplayText()}</p>
                        {currentPeriodOffset !== 0 && (
                          <button
                            onClick={goToCurrentPeriod}
                            className="text-xs text-amber-400 hover:text-amber-300 mt-1"
                          >
                            현재로 돌아가기
                          </button>
                        )}
                      </div>
                      
                      <button
                        onClick={goToNextPeriod}
                        className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                      >
                        <FaChevronRight className="text-white" size={14} />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2 mb-3">
                      <div className="bg-white/10 rounded-xl p-3">
                        <div className="text-xs text-purple-200 mb-1">주간 합산 금액</div>
                        <div className="text-lg font-bold text-white">
                          {periodTotal.toLocaleString()}원
                        </div>
                      </div>
                      <div className="bg-white/10 rounded-xl p-3">
                        <div className="text-xs text-purple-200 mb-1">주간 합산 건수</div>
                        <div className="text-lg font-bold text-white">
                          {periodCount}건
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-7 gap-1">
                      {['일', '월', '화', '수', '목', '금', '토'].map((day) => (
                        <div
                          key={day}
                          className="text-center text-xs font-bold text-purple-200 py-1"
                        >
                          {day}
                        </div>
                      ))}
                      {Array.from({ length: 7 }, (_, i) => {
                        const date = new Date(getWeekStart(dateInfo.targetDate).getTime() + i * 24 * 60 * 60 * 1000);
                        const dateStr = date.toISOString().split('T')[0];
                        const isToday = dateStr === dateInfo.todayStr;
                        const hasRecords = getRecordsByDateStr(dateStr).length > 0;

                        return (
                          <button
                            key={dateStr}
                            onClick={() => setSelectedDate(dateStr)}
                            className={`
                              aspect-square relative rounded-lg transition-all
                              ${isToday ? 'bg-amber-400/20' : ''}
                              ${hasRecords ? 'hover:bg-white/20' : ''}
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
                      <button
                        onClick={goToPreviousPeriod}
                        className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                      >
                        <FaChevronLeft className="text-white" size={14} />
                      </button>
                      
                      <div className="text-center">
                        <h3 className="text-base font-bold text-white">
                          {dateInfo.targetDate.getFullYear()}년 {dateInfo.targetDate.getMonth() + 1}월
                        </h3>
                        <p className="text-xs text-purple-200 mt-1">{getPeriodDisplayText()}</p>
                        {currentPeriodOffset !== 0 && (
                          <button
                            onClick={goToCurrentPeriod}
                            className="text-xs text-amber-400 hover:text-amber-300 mt-1"
                          >
                            현재로 돌아가기
                          </button>
                        )}
                      </div>
                      
                      <button
                        onClick={goToNextPeriod}
                        className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                      >
                        <FaChevronRight className="text-white" size={14} />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2 mb-3">
                      <div className="bg-white/10 rounded-xl p-3">
                        <div className="text-xs text-purple-200 mb-1">월간 합산 금액</div>
                        <div className="text-lg font-bold text-white">
                          {periodTotal.toLocaleString()}원
                        </div>
                      </div>
                      <div className="bg-white/10 rounded-xl p-3">
                        <div className="text-xs text-purple-200 mb-1">월간 합산 건수</div>
                        <div className="text-lg font-bold text-white">
                          {periodCount}건
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 mb-3">
                      <div className="bg-white/10 rounded-xl p-3">
                        <div className="text-xs text-purple-200 mb-1">일평균 금액</div>
                        <div className="text-lg font-bold text-white">
                          {dailyAverage.toLocaleString()}원
                        </div>
                      </div>
                      <div className="bg-white/10 rounded-xl p-3">
                        <div className="text-xs text-purple-200 mb-1">일평균 건수</div>
                        <div className="text-lg font-bold text-white">
                          {Math.floor(periodCount / periodDays)}건
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-7 gap-1">
                      {['일', '월', '화', '수', '목', '금', '토'].map((day) => (
                        <div
                          key={day}
                          className="text-center text-xs font-bold text-purple-200 py-1"
                        >
                          {day}
                        </div>
                      ))}
                      {Array.from({ length: dateInfo.firstDayOfMonth }, (_, i) => (
                        <div key={`empty-${i}`} className="aspect-square" />
                      ))}
                      {Array.from({ length: dateInfo.daysInMonth }, (_, i) => {
                        const date = new Date(dateInfo.currentYear, dateInfo.currentMonth, i + 1);
                        const dateStr = date.toISOString().split('T')[0];
                        const isToday = dateStr === dateInfo.todayStr;
                        const hasRecords = getRecordsByDateStr(dateStr).length > 0;

                        return (
                          <button
                            key={dateStr}
                            onClick={() => setSelectedDate(dateStr)}
                            className={`
                              aspect-square relative rounded-lg transition-all
                              ${isToday ? 'bg-amber-400/20' : ''}
                              ${hasRecords ? 'hover:bg-white/20' : ''}
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
          </div>
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

      {/* 선택된 날짜의 상세 정보 */}
      {selectedDate && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-purple-900/90 to-pink-900/90 backdrop-blur-lg rounded-3xl p-6 w-full max-w-lg mx-4 max-h-[80vh] overflow-y-auto shadow-2xl border border-purple-500/30">
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
                  <p className="text-purple-200/60">이 날짜에 기록이 없습니다.</p>
                </div>
              ) : (
                <>
                  {getRecordsByDateStr(selectedDate).map((record) => (
                    <div
                      key={record.id}
                      className="flex items-center justify-between p-4 bg-white/10 rounded-xl border border-purple-400/20"
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
                          <div className="text-sm text-purple-200">
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
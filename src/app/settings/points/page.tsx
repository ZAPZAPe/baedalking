'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { FaCalendarCheck, FaCoins, FaGift, FaChevronLeft, FaCheck, FaTrophy, FaStar, FaFireAlt } from 'react-icons/fa';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Loading from '@/components/Loading';
import KakaoAd from '@/components/KakaoAd';
import { toast } from 'react-hot-toast';

interface AttendanceRecord {
  date: string;
  points: number;
  consecutive_days: number;
}

export default function AttendancePage() {
  const { user, userProfile, refreshUserProfile } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [todayAttended, setTodayAttended] = useState(false);
  const [consecutiveDays, setConsecutiveDays] = useState(0);
  const [monthlyAttendance, setMonthlyAttendance] = useState<number>(0);
  const [claiming, setClaiming] = useState(false);

  useEffect(() => {
    if (user && userProfile) {
      fetchAttendanceData();
    }
  }, [user, userProfile]);

  const fetchAttendanceData = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // 이번 달 출석 기록 가져오기
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);
      
      const { data: records, error } = await supabase
        .from('point_history')
        .select('*')
        .eq('user_id', user.id)
        .eq('type', 'attendance')
        .gte('created_at', startOfMonth.toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;

      // 오늘 출석 여부 확인
      const today = new Date().toDateString();
      const todayRecord = records?.find(r => 
        new Date(r.created_at).toDateString() === today
      );
      setTodayAttended(!!todayRecord);

      // 연속 출석 일수 계산
      let consecutive = 0;
      const sortedRecords = records?.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      ) || [];

      for (let i = 0; i < sortedRecords.length; i++) {
        const recordDate = new Date(sortedRecords[i].created_at);
        const expectedDate = new Date();
        expectedDate.setDate(expectedDate.getDate() - i);
        
        if (recordDate.toDateString() === expectedDate.toDateString()) {
          consecutive++;
        } else {
          break;
        }
      }
      
      setConsecutiveDays(consecutive);
      setMonthlyAttendance(records?.length || 0);
      setAttendanceRecords(records?.map(r => ({
        date: r.created_at,
        points: r.amount,
        consecutive_days: consecutive
      })) || []);
    } catch (error) {
      console.error('출석 데이터 로드 실패:', error);
      toast.error('출석 데이터를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleAttendance = async () => {
    if (!user || todayAttended || claiming) return;
    
    setClaiming(true);
    try {
      // 기본 포인트 + 연속 출석 보너스
      const basePoints = 10;
      const bonusPoints = Math.min(consecutiveDays * 5, 50); // 최대 50포인트 보너스
      const totalPoints = basePoints + bonusPoints;

      // 포인트 지급
      const { error: pointError } = await supabase
        .from('point_history')
        .insert({
          user_id: user.id,
          type: 'attendance',
          amount: totalPoints,
          description: `출석체크 (${consecutiveDays + 1}일 연속)`
        });

      if (pointError) throw pointError;

      // 사용자 포인트 업데이트
      const { error: updateError } = await supabase
        .from('users')
        .update({
          points: (userProfile?.points || 0) + totalPoints
        })
        .eq('id', user.id);

      if (updateError) throw updateError;

      // 상태 업데이트
      await refreshUserProfile();
      setTodayAttended(true);
      setConsecutiveDays(consecutiveDays + 1);
      
      toast.success(`출석체크 완료! +${totalPoints} 포인트`);
      await fetchAttendanceData();
    } catch (error) {
      console.error('출석체크 실패:', error);
      toast.error('출석체크에 실패했습니다.');
    } finally {
      setClaiming(false);
    }
  };

  const getDaysInMonth = () => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  };

  const getCalendarDays = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = getDaysInMonth();
    
    const calendar = [];
    
    // 이전 달 빈 칸
    for (let i = 0; i < firstDay; i++) {
      calendar.push(null);
    }
    
    // 이번 달 날짜
    for (let i = 1; i <= daysInMonth; i++) {
      calendar.push(i);
    }
    
    return calendar;
  };

  const isAttendedDay = (day: number | null) => {
    if (!day) return false;
    const now = new Date();
    const checkDate = new Date(now.getFullYear(), now.getMonth(), day);
    
    return attendanceRecords.some(record => {
      const recordDate = new Date(record.date);
      return recordDate.toDateString() === checkDate.toDateString();
    });
  };

  if (!user) {
    router.push('/login');
    return null;
  }

  if (loading || !userProfile) {
    return <Loading />;
  }

  return (
    <div className="relative z-10">
      <div className="max-w-3xl mx-auto px-4">
        {/* 헤더 */}
        <header className="flex items-center justify-between mb-4 pt-2">
          <Link href="/settings" className="text-white">
            <FaChevronLeft size={24} />
          </Link>
          <h1 className="text-xl font-bold text-white">출석체크</h1>
          <div className="w-6" />
        </header>

        {/* 상단 광고 */}
        <section className="mb-4">
          <KakaoAd page="attendance" index={0} />
        </section>

        {/* 출석 현황 */}
        <section className="mb-4">
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-4 shadow-xl border border-white/20">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-2xl font-bold text-white">출석 현황</h2>
                <p className="text-blue-200 text-sm">매일 출석하고 포인트 받기</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg">
                <FaCalendarCheck className="text-white" size={20} />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-xl p-3 border border-blue-400/30 text-center">
                <FaFireAlt className="text-blue-400 mx-auto mb-1" size={20} />
                <p className="text-white font-bold text-lg">{consecutiveDays}일</p>
                <p className="text-blue-200 text-xs">연속 출석</p>
              </div>
              
              <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-xl p-3 border border-purple-400/30 text-center">
                <FaStar className="text-purple-400 mx-auto mb-1" size={20} />
                <p className="text-white font-bold text-lg">{monthlyAttendance}일</p>
                <p className="text-purple-200 text-xs">이번 달 출석</p>
              </div>
              
              <div className="bg-gradient-to-r from-amber-500/20 to-orange-500/20 rounded-xl p-3 border border-amber-400/30 text-center">
                <FaCoins className="text-amber-400 mx-auto mb-1" size={20} />
                <p className="text-white font-bold text-lg">{userProfile.points}P</p>
                <p className="text-amber-200 text-xs">보유 포인트</p>
              </div>
            </div>

            {/* 출석체크 버튼 */}
            <button
              onClick={handleAttendance}
              disabled={todayAttended || claiming}
              className={`w-full py-3 rounded-xl font-bold text-white transition-all flex items-center justify-center gap-2 ${
                todayAttended
                  ? 'bg-gray-500/50 cursor-not-allowed'
                  : 'bg-gradient-to-r from-yellow-400 to-orange-500 hover:scale-105 shadow-lg'
              }`}
            >
              {todayAttended ? (
                <>
                  <FaCheck size={16} />
                  오늘 출석 완료
                </>
              ) : (
                <>
                  <FaGift size={16} />
                  {claiming ? '처리 중...' : '출석체크 하기'}
                </>
              )}
            </button>
          </div>
        </section>

        {/* 출석 캘린더 */}
        <section className="mb-4">
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-4 shadow-xl border border-white/20">
            <h3 className="text-xl font-bold text-white mb-4">이번 달 출석 현황</h3>
            
            <div className="grid grid-cols-7 gap-2">
              {['일', '월', '화', '수', '목', '금', '토'].map(day => (
                <div key={day} className="text-center text-blue-200 text-sm font-bold">
                  {day}
                </div>
              ))}
              
              {getCalendarDays().map((day, index) => (
                <div
                  key={index}
                  className={`aspect-square flex items-center justify-center rounded-lg ${
                    day === null
                      ? ''
                      : isAttendedDay(day)
                      ? 'bg-gradient-to-br from-yellow-400 to-orange-500 text-white font-bold'
                      : day === new Date().getDate()
                      ? 'bg-white/20 text-white border border-white/40'
                      : 'bg-white/5 text-white/60'
                  }`}
                >
                  {day && (
                    <span className="text-sm">
                      {day}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 보상 안내 */}
        <section className="mb-4">
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-4 shadow-xl border border-white/20">
            <h3 className="text-xl font-bold text-white mb-4">출석 보상</h3>
            
            <div className="space-y-3">
              <div className="bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-xl p-3 border border-blue-400/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FaCalendarCheck className="text-blue-400" size={20} />
                    <div>
                      <p className="text-white font-bold text-sm">일일 출석</p>
                      <p className="text-blue-200 text-xs">매일 로그인하면</p>
                    </div>
                  </div>
                  <span className="text-blue-200 font-bold">+10P</span>
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-xl p-3 border border-purple-400/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FaFireAlt className="text-purple-400" size={20} />
                    <div>
                      <p className="text-white font-bold text-sm">연속 출석 보너스</p>
                      <p className="text-purple-200 text-xs">연속 출석 시 추가</p>
                    </div>
                  </div>
                  <span className="text-purple-200 font-bold">+5P/일</span>
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-amber-500/20 to-orange-500/20 rounded-xl p-3 border border-amber-400/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FaTrophy className="text-amber-400" size={20} />
                    <div>
                      <p className="text-white font-bold text-sm">최대 보너스</p>
                      <p className="text-amber-200 text-xs">10일 이상 연속 출석</p>
                    </div>
                  </div>
                  <span className="text-amber-200 font-bold">+60P</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 하단 광고 */}
        <section className="mb-2">
          <KakaoAd page="attendance" index={1} />
        </section>
      </div>
    </div>
  );
} 
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { FaCalendarCheck, FaCoins, FaGift, FaChevronLeft, FaCheck, FaTrophy, FaStar, FaFireAlt, FaStamp } from 'react-icons/fa';
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
  const [justAttended, setJustAttended] = useState(false);

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
        .like('reason', '출근도장%')
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
        points: r.points,
        consecutive_days: consecutive
      })) || []);
    } catch (error) {
      console.error('출근 데이터 로드 실패:', error);
      toast.error('출근 데이터를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleAttendance = async () => {
    console.log('출근도장 버튼 클릭됨');
    console.log('user:', user);
    console.log('userProfile:', userProfile);
    console.log('todayAttended:', todayAttended);
    console.log('claiming:', claiming);
    
    if (!user || todayAttended || claiming) {
      console.log('조건 미충족으로 리턴');
      if (!user) toast.error('로그인이 필요합니다.');
      if (todayAttended) toast.error('오늘은 이미 출근도장을 찍으셨습니다.');
      return;
    }
    
    setClaiming(true);
    try {
      // 고정 포인트 10P
      const totalPoints = 10;

      console.log('포인트 지급 시도...');
      // 포인트 지급
      const { data: pointData, error: pointError } = await supabase
        .from('point_history')
        .insert({
          user_id: user.id,
          points: totalPoints,
          reason: `출근도장 (${consecutiveDays + 1}일 연속)`
        })
        .select()
        .single();

      console.log('포인트 지급 결과:', { pointData, pointError });

      if (pointError) {
        console.error('포인트 지급 에러:', pointError);
        // 더 구체적인 에러 메시지
        if (pointError.code === '42501') {
          toast.error('포인트 지급 권한이 없습니다. 관리자에게 문의하세요.');
        } else {
          toast.error(`포인트 지급 실패: ${pointError.message}`);
        }
        throw pointError;
      }

      console.log('사용자 포인트 업데이트 시도...');
      // 사용자 포인트 업데이트
      const { data: updateData, error: updateError } = await supabase
        .from('users')
        .update({
          points: (userProfile?.points || 0) + totalPoints
        })
        .eq('id', user.id)
        .select()
        .single();

      console.log('사용자 포인트 업데이트 결과:', { updateData, updateError });

      if (updateError) {
        console.error('사용자 포인트 업데이트 에러:', updateError);
        toast.error(`포인트 업데이트 실패: ${updateError.message}`);
        throw updateError;
      }

      // 상태 업데이트
      await refreshUserProfile();
      setTodayAttended(true);
      setConsecutiveDays(consecutiveDays + 1);
      setJustAttended(true);
      
      toast.success(`출근도장 완료! +${totalPoints} 포인트`);
      await fetchAttendanceData();
      
      // 3초 후 애니메이션 효과 제거
      setTimeout(() => {
        setJustAttended(false);
      }, 3000);
    } catch (error) {
      console.error('출근도장 실패 상세:', error);
      // toast.error 는 이미 위에서 처리함
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
          <h1 className="text-xl font-bold text-white">출근도장</h1>
          <div className="w-6" />
        </header>

        {/* 출근 현황 */}
        <section className="mb-4">
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-4 shadow-xl border border-white/20">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-2xl font-bold text-white">출근 현황</h2>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg">
                <FaCalendarCheck className="text-white" size={20} />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-xl p-3 border border-blue-400/30 text-center">
                <FaFireAlt className="text-blue-400 mx-auto mb-1" size={20} />
                <p className="text-white font-bold text-lg">{consecutiveDays}일</p>
                <p className="text-blue-200 text-xs">연속 출근</p>
              </div>
              
              <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-xl p-3 border border-purple-400/30 text-center">
                <FaStar className="text-purple-400 mx-auto mb-1" size={20} />
                <p className="text-white font-bold text-lg">{monthlyAttendance}일</p>
                <p className="text-purple-200 text-xs">이번 달 출근</p>
              </div>
              
              <div className="bg-gradient-to-r from-amber-500/20 to-orange-500/20 rounded-xl p-3 border border-amber-400/30 text-center">
                <FaCoins className="text-amber-400 mx-auto mb-1" size={20} />
                <p className="text-white font-bold text-lg">{userProfile.points}P</p>
                <p className="text-amber-200 text-xs">보유 포인트</p>
              </div>
            </div>

            {/* 출근도장 버튼 */}
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
                  오늘 출근 완료
                </>
              ) : (
                <>
                  <FaGift size={16} />
                  {claiming ? '처리 중...' : '출근도장 찍기 (+10P)'}
                </>
              )}
            </button>
          </div>
        </section>

        {/* 출근 캘린더 */}
        <section className="mb-4">
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-4 shadow-xl border border-white/20">
            <h3 className="text-xl font-bold text-white mb-4">이번 달 출근 현황</h3>
            
            <div className="grid grid-cols-7 gap-2">
              {['일', '월', '화', '수', '목', '금', '토'].map(day => (
                <div key={day} className="text-center text-blue-200 text-sm font-bold">
                  {day}
                </div>
              ))}
              
              {getCalendarDays().map((day, index) => {
                const isToday = day === new Date().getDate();
                const attended = day ? isAttendedDay(day) : false;
                const showAnimation = attended && isToday && justAttended;
                
                return (
                  <div
                    key={index}
                    className={`aspect-square flex items-center justify-center rounded-lg relative ${
                      day === null
                        ? ''
                        : attended
                        ? ''
                        : isToday
                        ? 'bg-white/20 border border-white/40'
                        : 'bg-white/5'
                    }`}
                  >
                    {day && (
                      <>
                        {attended ? (
                          <div className="relative w-full h-full flex items-center justify-center group">
                            {/* 도장 컨테이너 */}
                            <div className={`absolute inset-1 ${showAnimation ? 'animate-stamp-effect' : ''}`}>
                              {/* 빨간 도장 베이스 */}
                              <div className="relative w-full h-full">
                                {/* 도장 본체 */}
                                <div className="absolute inset-0 bg-gradient-to-br from-red-600 via-red-500 to-red-700 rounded-lg transform rotate-6 shadow-lg" />
                                
                                {/* 도장 테두리 */}
                                <div className="absolute inset-0 border-2 border-red-800 rounded-lg transform rotate-6" />
                                
                                {/* 도장 중앙 디자인 */}
                                <div className="absolute inset-0 flex items-center justify-center transform rotate-6">
                                  <div className="w-3/4 h-3/4 border-2 border-red-300/50 rounded-full flex items-center justify-center">
                                    <FaCheck className="text-white/80" size={12} />
                                  </div>
                                </div>
                                
                                {/* 도장 잉크 효과 */}
                                <div className="absolute -inset-1 bg-gradient-to-br from-red-400/30 via-transparent to-red-600/20 rounded-lg blur-sm transform rotate-6" />
                              </div>
                            </div>
                            
                            {/* 날짜 표시 */}
                            <span className="absolute bottom-0 left-0 right-0 text-center text-[10px] text-white/90 font-bold z-20">
                              {day}
                            </span>
                          </div>
                        ) : (
                          <span className={`text-sm ${isToday ? 'text-white font-bold' : 'text-white/60'}`}>
                            {day}
                          </span>
                        )}
                      </>
                    )}
                  </div>
                );
              })}
            </div>
            
            {/* 범례 추가 */}
            <div className="mt-4 flex items-center justify-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-red-600 to-red-700 rounded transform rotate-6"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <FaCheck className="text-white text-[8px] transform rotate-6" />
                  </div>
                </div>
                <span className="text-white/80">출근 완료</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-white/20 border border-white/40 rounded"></div>
                <span className="text-white/80">오늘</span>
              </div>
            </div>
          </div>
        </section>

        {/* 하단 광고 */}
        <section className="mb-2">
          <KakaoAd page="attendance" index={1} />
        </section>
      </div>
      
      <style jsx>{`
        @keyframes stamp-effect {
          0% {
            transform: scale(0) rotate(6deg);
            opacity: 0;
          }
          50% {
            transform: scale(1.2) rotate(6deg);
            opacity: 1;
          }
          70% {
            transform: scale(0.9) rotate(6deg);
            opacity: 1;
          }
          100% {
            transform: scale(1) rotate(6deg);
            opacity: 1;
          }
        }
        
        .animate-stamp-effect {
          animation: stamp-effect 0.6s ease-out;
        }
      `}</style>
    </div>
  );
} 
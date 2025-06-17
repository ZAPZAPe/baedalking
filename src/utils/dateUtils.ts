import { format, subHours } from 'date-fns';

// 커스텀 일자 계산 (오전 6시 기준)
export const getCustomDay = (date: Date = new Date()): string => {
  // 오전 6시 이전이면 전날로 계산
  const adjustedDate = date.getHours() < 6 ? subHours(date, 6) : date;
  return format(adjustedDate, 'yyyy-MM-dd');
};

// 오늘의 커스텀 일자
export const getTodayCustomDay = (): string => {
  return getCustomDay(new Date());
};

// 이번 주 시작일 (월요일)
export const getWeekStart = (date: Date = new Date()): string => {
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  const weekStart = new Date(date.setDate(diff));
  return format(weekStart, 'yyyy-MM-dd');
};

// 날짜 포맷팅
export const formatDate = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return format(dateObj, 'MM월 dd일');
}; 
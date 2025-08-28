'use client'

import html2canvas from 'html2canvas'

interface MonthlyViewProps {
  allRecords: any[]
  monthlyGoal: number
  dailyGoal: number
  setShowDetailModal: (show: boolean) => void
  setShowGoalSettings: (show: boolean) => void
  setSelectedDate: (date: string) => void
  selectedMonth?: string
  onMonthChange?: (yearMonth: string) => void
}

export default function MonthlyView({ allRecords, monthlyGoal, dailyGoal, setShowDetailModal, setShowGoalSettings, setSelectedDate, selectedMonth, onMonthChange }: MonthlyViewProps) {
  // 선택된 월 또는 이번 달
  const today = new Date()
  let year: number
  let month: number
  
  if (selectedMonth) {
    const [selectedYear, selectedMonthNum] = selectedMonth.split('-')
    year = parseInt(selectedYear)
    month = parseInt(selectedMonthNum) - 1
  } else {
    year = today.getFullYear()
    month = today.getMonth()
  }
  
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const startDate = new Date(firstDay)
  
  // 일요일부터 시작하는 달력으로 복원
  startDate.setDate(firstDay.getDate() - firstDay.getDay())
  
  
  interface MonthDayData {
    date: string;
    day: number;
    total: number;
    isToday: boolean;
    isCurrentMonth: boolean;
    dayOfWeek: number;
  }
  
  const monthData: MonthDayData[] = []
  let monthTotal = 0
  let monthCount = 0
  let monthAmount = 0
  let monthMissionAmount = 0
  
  for (let i = 0; i < 42; i++) {
    const date = new Date(startDate)
    date.setDate(startDate.getDate() + i)
    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
    const dayRecords = allRecords.filter(r => r.date === dateStr)
    const dayTotal = dayRecords.reduce((sum, r) => sum + (r.amount || 0) + (r.missionAmount || 0), 0)
    
    if (date.getMonth() === month) {
      monthTotal += dayTotal
      monthCount += dayRecords.reduce((sum, r) => sum + r.count, 0)
      monthAmount += dayRecords.reduce((sum, r) => sum + (r.amount || 0), 0)
      monthMissionAmount += dayRecords.reduce((sum, r) => sum + (r.missionAmount || 0), 0)
    }
    
    monthData.push({
      date: dateStr,
      day: date.getDate(),
      total: dayTotal,
      isToday: dateStr === `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`,
      isCurrentMonth: date.getMonth() === month,
      dayOfWeek: date.getDay() // 0=일요일, 6=토요일
    })
    

  }

  // 월간 목표 달성률 계산 (화면 표시용)
  const monthGoalAchievement = monthlyGoal > 0 ? (monthTotal / monthlyGoal) * 100 : 0

  // 모바일 바이럴용 사진 출력 기능
  const captureMonthlyView = async () => {
    try {
      const element = document.getElementById('monthly-view-container')
      if (!element) return

      // 버튼들 숨기기
      const buttons = document.querySelectorAll('button')
      buttons.forEach(btn => (btn as HTMLElement).style.display = 'none')

      // DOM 안정화를 위한 대기
      await new Promise(resolve => setTimeout(resolve, 100))

      // 모바일 바이럴용 최적화된 캡처 설정
      const canvas = await html2canvas(element, {
        backgroundColor: '#1a202c',
        scale: window.devicePixelRatio || 2,
        width: element.offsetWidth,
        height: element.offsetHeight,
        x: 0,
        y: 0,
        scrollX: 0,
        scrollY: 0,
        windowWidth: window.innerWidth,
        windowHeight: window.innerHeight,
        ignoreElements: (element) => element.tagName === 'BUTTON'
      })

      // 버튼들 다시 표시
      buttons.forEach(btn => (btn as HTMLElement).style.display = '')

      // 모바일에서 이미지 다운로드
      const monthStr = `${year}${String(month + 1).padStart(2, '0')}`
      const link = document.createElement('a')
      link.download = `월간수익_${monthStr}.png`
      link.href = canvas.toDataURL('image/png', 1.0)
      
      // 모바일 브라우저 호환성을 위한 클릭 처리
      if (/iPhone|iPad|iPod|Android/i.test(navigator.userAgent)) {
        const newWindow = window.open()
        if (newWindow) {
          newWindow.document.write(`
            <html>
              <head><title>월간 수익 - ${monthStr}</title></head>
              <body style="margin:0;padding:20px;background:#000;display:flex;justify-content:center;align-items:center;">
                <img src="${canvas.toDataURL('image/png', 1.0)}" style="max-width:100%;height:auto;" />
                <div style="position:fixed;top:10px;right:10px;background:rgba(0,0,0,0.7);color:white;padding:10px;border-radius:5px;font-family:monospace;">
                  길게 눌러서 이미지 저장하세요
                </div>
              </body>
            </html>
          `)
        }
      } else {
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      }

    } catch (error) {
      console.error('사진 출력 실패:', error)
      const buttons = document.querySelectorAll('button')
      buttons.forEach(btn => (btn as HTMLElement).style.display = '')
      alert('사진 출력에 실패했습니다. 다시 시도해주세요.')
    }
  }

  return (
    <div id="monthly-view-container" className="space-y-3 sm:space-y-4">
      {/* 이번달 수익 - 오늘의 수익과 완전히 동일한 디자인 */}
      <div 
        className="bg-gradient-to-br from-[#2d3748] to-[#1a202c] rounded-xl p-4 border border-[#ffd93d]/30 shadow-inner"
        style={{
          fontFamily: 'monospace',
          imageRendering: 'pixelated'
        }}
      >
        {/* 픽셀 헤더 - 월간 목표 달성률에 따른 테두리 */}
        <div 
          className="bg-gradient-to-r from-[#1a202c] to-[#2d3748] pt-4 pb-3 px-3 mb-4 border-2 relative border-[#ffd93d]"
          style={{
            borderRadius: '4px',
            boxShadow: '0 0 10px #ffd93d40, inset 0 0 10px #ffd93d20'
          }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div>
                <h3 className="text-white font-bold text-base font-mono" style={{
                  textShadow: '2px 0 0 #000, -2px 0 0 #000, 0 2px 0 #000, 0 -2px 0 #000',
                  imageRendering: 'pixelated'
                }}>
                  월간 수익
                </h3>

                <p className="text-[#ffd93d] text-xs font-mono mt-1">
                  {year}년 {month + 1}월
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {/* 월 이동 버튼들 */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    if (onMonthChange) {
                      const prevMonth = new Date(year, month - 1, 1)
                      const prevMonthStr = `${prevMonth.getFullYear()}-${String(prevMonth.getMonth() + 1).padStart(2, '0')}`
                      onMonthChange(prevMonthStr)
                    }
                  }}
                  className="px-2 py-1 text-xs font-mono border-2 border-[#ffd93d]/60 text-[#ffd93d] hover:border-[#ffd93d] transition-all duration-200"
                  style={{borderRadius: '2px'}}
                >
                  ◀
                </button>

                <button
                  onClick={() => {
                    if (onMonthChange) {
                      const nextMonth = new Date(year, month + 1, 1)
                      const nextMonthStr = `${nextMonth.getFullYear()}-${String(nextMonth.getMonth() + 1).padStart(2, '0')}`
                      onMonthChange(nextMonthStr)
                    }
                  }}
                  className="px-2 py-1 text-xs font-mono border-2 border-[#ffd93d]/60 text-[#ffd93d] hover:border-[#ffd93d] transition-all duration-200"
                  style={{borderRadius: '2px'}}
                >
                  ▶
                </button>
              </div>
              
              {/* 이번달 버튼 */}
              <button
                onClick={() => {
                  if (onMonthChange) {
                    const today = new Date()
                    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`
                    onMonthChange(todayStr)
                  }
                }}
                className={`px-3 py-1 text-xs font-mono border-2 transition-all duration-200 ${
                  year === new Date().getFullYear() && month === new Date().getMonth()
                    ? 'bg-[#ffd93d] text-black border-[#ffd93d]'
                    : 'bg-transparent text-[#ffd93d] border-[#ffd93d]/60 hover:border-[#ffd93d]'
                }`}
                style={{borderRadius: '2px'}}
              >
                이번달
              </button>
            </div>
          </div>

          {/* 총 금액 표시 */}
          <div className="text-center mt-4">
            <div className="text-3xl font-bold font-mono text-[#ffd93d]">
              ₩{monthTotal.toLocaleString()}
            </div>
            
            {/* 건당 평균금액 */}
            {monthCount > 0 && (
              <div className="mt-2 text-sm text-gray-300 font-mono">
                건당 평균: ₩{Math.round(monthTotal / monthCount).toLocaleString()}
              </div>
            )}
            
            {/* 지난달 대비 증감률 */}
            <div className="mt-1 text-xs font-mono flex items-center justify-center gap-1 text-[#ffd93d]">
              지난달 대비 데이터 준비 중
            </div>
            
            {/* 목표 달성률 */}
            <div className="mt-4 mb-2">
              <div className="flex items-center justify-between text-xs text-gray-300 font-mono mb-4">
                <span>월간 목표</span>
                <button
                  onClick={() => setShowGoalSettings(true)}
                  className="bg-[#ffd93d]/20 border border-[#ffd93d]/50 text-[#ffd93d] px-3 py-1 text-xs font-mono hover:border-[#ffd93d] transition-all duration-200"
                  style={{borderRadius: '2px'}}
                >
                  설정
                </button>
              </div>
              <div className="w-full bg-[#1a202c] rounded-full h-6 border border-[#ffd93d]/30 relative">
                <div 
                  className="h-full rounded-full transition-all duration-500 bg-[#ffd93d]"
                  style={{ width: `${Math.min(monthGoalAchievement, 100)}%` }}
                ></div>
                
                {/* 그래프 안에 정보 표시 */}
                <div className="absolute inset-0 flex items-center justify-between px-4 text-xs font-mono">
                  <div className="text-white font-bold">
                    {monthGoalAchievement.toFixed(1)}%
                  </div>
                  <div className="text-gray-300">
                    ₩{monthTotal.toLocaleString()} / ₩{monthlyGoal.toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 픽셀 장식 요소들 - 노랑 고정 */}
          <div className="absolute top-1 left-1 w-2 h-2 bg-[#ffd93d] transition-all duration-300" style={{borderRadius: '1px'}}></div>
          <div className="absolute top-1 right-1 w-2 h-2 bg-[#ffd93d] transition-all duration-300" style={{borderRadius: '1px'}}></div>
          <div className="absolute bottom-1 left-1 w-2 h-2 bg-[#ffd93d] transition-all duration-300" style={{borderRadius: '1px'}}></div>
          <div className="absolute bottom-1 right-1 w-2 h-2 bg-[#ffd93d] transition-all duration-300" style={{borderRadius: '1px'}}></div>
        </div>

        {/* 픽셀 통계 카드들 */}
        <div className="grid grid-cols-3 gap-2">
          {/* 건수 */}
          <div className="bg-[#1a202c] border-2 border-[#00d4ff]/30 p-3 text-center relative" style={{borderRadius: '4px'}}>
            <p className="text-gray-300 text-xs font-mono mb-1">건수</p>
            <p className="text-white font-bold text-sm font-mono">
              {monthCount}건
            </p>
            <div className="absolute top-1 left-1 w-1 h-1 bg-[#00d4ff]/50" style={{borderRadius: '1px'}}></div>
            <div className="absolute top-1 right-1 w-1 h-1 bg-[#00d4ff]/50" style={{borderRadius: '1px'}}></div>
            <div className="absolute bottom-1 left-1 w-1 h-1 bg-[#00d4ff]/50" style={{borderRadius: '1px'}}></div>
            <div className="absolute bottom-1 right-1 w-1 h-1 bg-[#00d4ff]/50" style={{borderRadius: '1px'}}></div>
          </div>

          {/* 배달금액 */}
          <div className="bg-[#1a202c] border-2 border-[#00ff88]/30 p-3 text-center relative" style={{borderRadius: '4px'}}>
            <p className="text-white text-xs font-mono font-bold mb-1">배달금액</p>
            <p className="text-white font-bold text-sm font-mono">
              ₩{monthAmount.toLocaleString()}
            </p>
            <div className="absolute top-1 left-1 w-1 h-1 bg-[#00ff88]/50" style={{borderRadius: '1px'}}></div>
            <div className="absolute top-1 right-1 w-1 h-1 bg-[#00ff88]/50" style={{borderRadius: '1px'}}></div>
            <div className="absolute bottom-1 left-1 w-1 h-1 bg-[#00ff88]/50" style={{borderRadius: '1px'}}></div>
            <div className="absolute bottom-1 right-1 w-1 h-1 bg-[#00ff88]/50" style={{borderRadius: '1px'}}></div>
          </div>

          {/* 미션비 */}
          <div className="bg-[#1a202c] border-2 border-[#9c88ff]/30 p-3 text-center relative" style={{borderRadius: '4px'}}>
            <p className="text-white text-xs font-mono font-bold mb-1">미션비</p>
            <p className="text-white font-bold text-sm font-mono">
              ₩{monthMissionAmount.toLocaleString()}
            </p>
            <div className="absolute top-1 left-1 w-1 h-1 bg-[#9c88ff]/50" style={{borderRadius: '1px'}}></div>
            <div className="absolute top-1 right-1 w-1 h-1 bg-[#9c88ff]/50" style={{borderRadius: '1px'}}></div>
            <div className="absolute bottom-1 left-1 w-1 h-1 bg-[#9c88ff]/50" style={{borderRadius: '1px'}}></div>
            <div className="absolute bottom-1 right-1 w-1 h-1 bg-[#9c88ff]/50" style={{borderRadius: '1px'}}></div>
          </div>
        </div>
      </div>





      {/* 월간 달력 컨테이너 */}
      <div 
        className="bg-gradient-to-br from-[#2d3748] to-[#1a202c] rounded-xl p-4 border border-[#ffd93d]/30 shadow-inner"
        style={{
          fontFamily: 'monospace',
          imageRendering: 'pixelated'
        }}
      >

        {/* 요일 헤더 - 일요일부터 시작, 주말 색상 구분 */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {['일', '월', '화', '수', '목', '금', '토'].map((day, index) => (
            <div key={day} className={`text-center font-mono text-xs py-1 ${
              index === 0 ? 'text-red-400' : // 일요일: 빨간색
              index === 6 ? 'text-blue-400' : // 토요일: 파란색
              'text-gray-400' // 평일: 회색
            }`}>
              {day}
            </div>
          ))}
        </div>

        {/* 날짜 그리드 - 간소화 */}
        <div className="grid grid-cols-7 gap-1">
          {monthData.map((day, index) => {
            return (
              <div
                key={index}
                onClick={() => {
                  if (day.isCurrentMonth && day.total > 0) {
                    setSelectedDate(day.date)
                    setShowDetailModal(true)
                  }
                }}
                className={`
                  p-3 rounded border text-center transition-all duration-200 relative
                  ${day.isCurrentMonth ? (day.total > 0 ? 'cursor-pointer hover:bg-[#ffd93d]/10 hover:border-[#ffd93d]/60' : '') : 'opacity-30'}
                  ${day.isToday ? 'border-[#ffd93d]' : 'border-gray-600/40'}
                  ${day.total > 0 && day.isCurrentMonth ? 'bg-[#ffd93d]/5 border-[#ffd93d]/30' : ''}
                `}
                style={{ minHeight: '45px' }}
              >
                <div className={`text-sm font-mono ${
                  day.isToday ? 'text-[#ffd93d] font-bold' : 
                  day.dayOfWeek === 0 ? 'text-red-400' : // 일요일: 빨간색
                  day.dayOfWeek === 6 ? 'text-blue-400' : // 토요일: 파란색
                  day.total > 0 && day.isCurrentMonth ? 'text-white' : 'text-gray-400'
                }`}>
                  {day.day}
                </div>
                
                {/* 수입 금액 표시 (소수점 1자리) */}
                {day.total > 0 && day.isCurrentMonth && (
                  <div className="text-[10px] font-bold font-mono mt-1 text-[#ffd93d] text-center">
                    {(day.total / 10000).toFixed(1)}
                  </div>
                )}
                
                {/* 픽셀 장식 요소들 - 통일된 색상 */}
                <div className="absolute top-1 left-1 w-1 h-1 bg-[#ffd93d]/50" style={{borderRadius: '1px'}}></div>
                <div className="absolute top-1 right-1 w-1 h-1 bg-[#ffd93d]/50" style={{borderRadius: '1px'}}></div>
                <div className="absolute bottom-1 left-1 w-1 h-1 bg-[#ffd93d]/50" style={{borderRadius: '1px'}}></div>
                <div className="absolute bottom-1 right-1 w-1 h-1 bg-[#ffd93d]/50" style={{borderRadius: '1px'}}></div>
              </div>
            )
          })}
        </div>
        
        {/* 이번달 총 수익 - 간단하게 */}
        <div className="mt-4 p-3 bg-[#1a202c]/50 border border-[#ffd93d]/20 rounded-lg">
          <div className="text-center">
            <p className="text-[#ffd93d] text-xl font-bold font-mono">
              ₩{monthTotal.toLocaleString()}
            </p>
          </div>
        </div>

        {/* 출근 일수 & 최고 수익일 */}
        <div className="grid grid-cols-2 gap-3 mt-3">
          {/* 출근 일수 */}
          <div className="bg-[#1a202c]/50 border border-[#ffd93d]/20 p-3 rounded-lg">
            <div className="text-center">
              <p className="text-gray-400 text-xs font-mono mb-1">출근 일수</p>
              <div className="text-white text-sm font-mono">
                {monthData.filter(day => day.isCurrentMonth && day.total > 0).length}일
              </div>
              
              {/* 출근률 막대 그래프 */}
              <div className="mt-2">
                <div className="relative w-full bg-gray-700 rounded-full h-4">
                  <div 
                    className="bg-[#ffd93d] h-4 rounded-full transition-all duration-300"
                    style={{ 
                      width: `${Math.round((monthData.filter(day => day.isCurrentMonth && day.total > 0).length / monthData.filter(day => day.isCurrentMonth).length) * 100)}%` 
                    }}
                  ></div>
                  {/* 그래프 안에 텍스트 표시 */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-[11px] font-bold font-mono text-white drop-shadow-md">
                      {monthData.filter(day => day.isCurrentMonth && day.total > 0).length}/{monthData.filter(day => day.isCurrentMonth).length} {Math.round((monthData.filter(day => day.isCurrentMonth && day.total > 0).length / monthData.filter(day => day.isCurrentMonth).length) * 100)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 최고 수익일 */}
          <div className="bg-[#1a202c]/50 border border-[#ffd93d]/20 p-3 rounded-lg">
            <div className="text-center">
              <p className="text-gray-400 text-xs font-mono mb-1">최고 수익일</p>
              {(() => {
                const maxDay = monthData
                  .filter(day => day.isCurrentMonth && day.total > 0)
                  .reduce((max, day) => day.total > max.total ? day : max, { total: 0, day: 0 });
                return maxDay.total > 0 ? (
                  <>
                    <div className="text-white text-sm font-mono mb-2">{maxDay.day}일</div>
                    <div className="text-[#ffd93d] text-sm font-bold font-mono h-4 flex items-center justify-center">₩{maxDay.total.toLocaleString()}</div>
                  </>
                ) : (
                  <div className="text-gray-500 text-xs">수익 없음</div>
                );
              })()}
            </div>
          </div>
        </div>

        {/* 요일별 평균 수익 그래프 */}
        <div className="mt-3 p-3 bg-[#1a202c]/50 border border-[#ffd93d]/20 rounded-lg">
          <div className="text-center">
            <p className="text-gray-400 text-xs font-mono mb-3">요일별 평균 수익</p>
            
            {/* 그래프 컨테이너 - 기준선 포함 */}
            <div className="relative">
                             {/* 하루 목표 기준선 */}
               <div className="absolute left-0 right-0 border-t-2 border-dashed border-[#ffd93d]/60" 
                    style={{ top: `${Math.max(4, (dailyGoal / 10000) / Math.max(...['일', '월', '화', '수', '목', '금', '토'].map((_, i) => {
                      const d = monthData.filter(d => d.isCurrentMonth && d.dayOfWeek === i);
                      const total = d.reduce((sum, d) => sum + d.total, 0);
                      const count = d.filter(d => d.total > 0).length;
                      return count > 0 ? total / count : 0;
                    }), dailyGoal / 10000) * 60)}px` }}>
               </div>
              
              {/* 요일별 막대 그래프 */}
              <div className="flex items-end justify-between h-20 gap-1">
                {['일', '월', '화', '수', '목', '금', '토'].map((day, index) => {
                  const dayData = monthData.filter(d => d.isCurrentMonth && d.dayOfWeek === index);
                  const dayTotal = dayData.reduce((sum, d) => sum + d.total, 0);
                  const dayCount = dayData.filter(d => d.total > 0).length;
                  const dayAverage = dayCount > 0 ? dayTotal / dayCount : 0;
                  
                  // 최대값 대비 높이 계산 (최소 높이 4px)
                  const maxAverage = Math.max(...['일', '월', '화', '수', '목', '금', '토'].map((_, i) => {
                    const d = monthData.filter(d => d.isCurrentMonth && d.dayOfWeek === i);
                    const total = d.reduce((sum, d) => sum + d.total, 0);
                    const count = d.filter(d => d.total > 0).length;
                    return count > 0 ? total / count : 0;
                  }));
                  
                  const barHeight = maxAverage > 0 ? Math.max(4, (dayAverage / maxAverage) * 60) : 4;
                  
                  return (
                    <div key={day} className="flex-1 flex flex-col items-center">
                      <div 
                        className={`w-full rounded-t transition-all duration-300 ${
                          index === 0 ? 'bg-red-400' : 
                          index === 6 ? 'bg-blue-400' : 
                          'bg-[#ffd93d]'
                        }`}
                        style={{ height: `${barHeight}px` }}
                      ></div>
                      <div className="text-[10px] text-gray-400 font-mono mt-1">
                        {(dayAverage / 10000).toFixed(1)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 저장 버튼 */}
      <button
        onClick={captureMonthlyView}
        className="w-full bg-gradient-to-r from-[#1a202c] to-[#2d3748] border-2 border-[#ffd93d]/50 hover:border-[#ffd93d] text-white font-mono py-3 px-4 transition-all duration-200 relative"
        style={{
          borderRadius: '4px',
          fontFamily: 'monospace',
          imageRendering: 'pixelated'
        }}
      >
        <div className="flex items-center justify-center">
          <div className="text-center">
            <p className="text-base font-bold">📸 월간 수익 캡처 저장</p>
          </div>
        </div>
        <div className="absolute top-1 left-1 w-1 h-1 bg-[#ffd93d]/60" style={{borderRadius: '1px'}}></div>
        <div className="absolute top-1 right-1 w-1 h-1 bg-[#ffd93d]/60" style={{borderRadius: '1px'}}></div>
        <div className="absolute bottom-1 left-1 w-1 h-1 bg-[#ffd93d]/60" style={{borderRadius: '1px'}}></div>
        <div className="absolute bottom-1 right-1 w-1 h-1 bg-[#ffd93d]/60" style={{borderRadius: '1px'}}></div>
      </button>
    </div>
  )
}

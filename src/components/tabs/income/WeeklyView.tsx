'use client'

import { Platform } from '@/hooks/useAppState'
import { useServerTime } from '@/hooks/useServerTime'
import html2canvas from 'html2canvas'

interface WeeklyViewProps {
  allRecords: any[]
  weeklyGoal: number
  dailyGoal: number
  platforms: Platform[]
  setShowGoalSettings: (show: boolean) => void
  setShowPlatformSettings: (show: boolean) => void
  setSelectedDate: (date: string) => void
  setShowDetailModal: (show: boolean) => void
  selectedWeek?: string
  onWeekChange?: (weekStart: string) => void
}

export default function WeeklyView({
  allRecords,
  weeklyGoal,
  dailyGoal,
  platforms,
  setShowGoalSettings,
  setShowPlatformSettings,
  setSelectedDate,
  setShowDetailModal,
  selectedWeek,
  onWeekChange
}: WeeklyViewProps) {
  // 서버 시간 사용
  const { serverTime } = useServerTime()
  
  // 서버 시간 기준으로 오늘 날짜 계산
  const today = serverTime ? new Date(serverTime.koreaDate) : new Date()
  const todayStr = serverTime ? serverTime.koreaDate : 
                   today.getFullYear() + '-' + 
                   String(today.getMonth() + 1).padStart(2, '0') + '-' + 
                   String(today.getDate()).padStart(2, '0')
  
  let startOfWeek: Date
  if (selectedWeek) {
    startOfWeek = new Date(selectedWeek)
  } else {
    // 일요일부터 시작하는 주 계산 (서버 시간 기준)
    startOfWeek = new Date(today)
    const dayOfWeek = today.getDay() // 0: 일요일, 1: 월요일, ..., 6: 토요일
    const daysToSubtract = dayOfWeek // 일요일을 0으로 만들기
    startOfWeek.setDate(today.getDate() - daysToSubtract)
  }
  
  // weekData 배열 초기화
  const weekData: any[] = []
  
  for (let i = 0; i < 7; i++) {
    const date = new Date(startOfWeek)
    date.setDate(startOfWeek.getDate() + i)
    // 서버 시간 기준으로 날짜 문자열 생성
    const dateStr = date.getFullYear() + '-' + 
                   String(date.getMonth() + 1).padStart(2, '0') + '-' + 
                   String(date.getDate()).padStart(2, '0')
    
    const dayRecords = allRecords.filter(r => r.date === dateStr)
    const dayCount = dayRecords.reduce((sum, r) => sum + r.count, 0)
    const dayAmount = dayRecords.reduce((sum, r) => sum + (r.amount || 0), 0)
    const dayMissionAmount = dayRecords.reduce((sum, r) => sum + (r.missionAmount || 0), 0)
    const dayTotal = dayAmount + dayMissionAmount
    
    weekData.push({
      date: dateStr,
      dayName: ['일', '월', '화', '수', '목', '금', '토'][i], // 일요일부터 시작
      dayOfWeek: i, // 0: 일요일, 6: 토요일
      count: dayCount,
      amount: dayAmount,
      missionAmount: dayMissionAmount,
      total: dayTotal,
      isToday: dateStr === todayStr
    })
  }
  
  // 디버깅용 로그
  console.log('🔍 주간 데이터 생성:', {
    serverTime: serverTime?.koreaDate,
    today: todayStr,
    startOfWeek: startOfWeek.getFullYear() + '-' + 
                 String(startOfWeek.getMonth() + 1).padStart(2, '0') + '-' + 
                 String(startOfWeek.getDate()).padStart(2, '0'),
    weekData: weekData.map(d => `${d.dayName}(${d.date})`)
  })

  // 주간 누적 데이터 계산
  const weekTotal = weekData.reduce((sum, day) => sum + day.total, 0)
  const weekCount = weekData.reduce((sum, day) => sum + day.count, 0)
  const weekAmount = weekData.reduce((sum, day) => {
    const dayRecords = allRecords.filter(r => r.date === day.date)
    return sum + dayRecords.reduce((sum, r) => sum + (r.amount || 0), 0)
  }, 0)
  const weekMissionAmount = weekData.reduce((sum, day) => {
    const dayRecords = allRecords.filter(r => r.date === day.date)
    return sum + dayRecords.reduce((sum, r) => sum + (r.missionAmount || 0), 0)
  }, 0)

  // 주간 목표 달성률 계산 (화면 표시용)
  const weekGoalAchievement = weeklyGoal > 0 ? (weekTotal / weeklyGoal) * 100 : 0

  // 모바일 바이럴용 사진 출력 기능
  const captureWeeklyView = async () => {
    try {
      const element = document.getElementById('weekly-view-container')
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
      const weekStart = (startOfWeek.getFullYear() + '-' + 
                        String(startOfWeek.getMonth() + 1).padStart(2, '0') + '-' + 
                        String(startOfWeek.getDate()).padStart(2, '0')).replace(/-/g, '')
      const link = document.createElement('a')
      link.download = `주간수익_${weekStart}.png`
      link.href = canvas.toDataURL('image/png', 1.0)
      
      // 모바일 브라우저 호환성을 위한 클릭 처리
      if (/iPhone|iPad|iPod|Android/i.test(navigator.userAgent)) {
        const newWindow = window.open()
        if (newWindow) {
          newWindow.document.write(`
            <html>
              <head><title>주간 수익 - ${weekStart}</title></head>
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
    <div id="weekly-view-container" className="space-y-3 sm:space-y-4">
      {/* 이번주 수익 - 오늘의 수익과 완전히 동일한 디자인 */}
      <div 
        className="bg-gradient-to-br from-[#2d3748] to-[#1a202c] rounded-xl p-4 border border-[#00ff88]/30 shadow-inner"
        style={{
          fontFamily: 'monospace',
          imageRendering: 'pixelated'
        }}
      >
        {/* 픽셀 헤더 - 주간 목표 달성률에 따른 테두리 */}
        <div 
          className="bg-gradient-to-r from-[#1a202c] to-[#2d3748] pt-4 pb-3 px-3 mb-4 border-2 relative border-[#ff6b6b]"
          style={{
            borderRadius: '4px',
            boxShadow: '0 0 10px #ff6b6b40, inset 0 0 10px #ff6b6b20'
          }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div>
                <h3 className="text-white font-bold text-base font-mono" style={{
                  textShadow: '2px 0 0 #000, -2px 0 0 #000, 0 2px 0 #000, 0 -2px 0 #000',
                  imageRendering: 'pixelated'
                }}>
                  주간 수익
                </h3>
                <p className="text-[#ff6b6b] text-xs font-mono mt-1">
                  {startOfWeek.toLocaleDateString('ko-KR', { 
                    month: 'long', 
                    day: 'numeric' 
                  })} ~ {new Date(startOfWeek.getTime() + 6 * 24 * 60 * 60 * 1000).toLocaleDateString('ko-KR', { 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {/* 주 이동 버튼들 */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    if (onWeekChange) {
                      const prevWeek = new Date(startOfWeek)
                      prevWeek.setDate(prevWeek.getDate() - 7)
                      const prevWeekStr = prevWeek.getFullYear() + '-' + 
                                        String(prevWeek.getMonth() + 1).padStart(2, '0') + '-' + 
                                        String(prevWeek.getDate()).padStart(2, '0')
                      onWeekChange(prevWeekStr)
                    }
                  }}
                  className="px-2 py-1 text-xs font-mono border-2 border-[#ff6b6b]/60 text-[#ff6b6b] hover:border-[#ff6b6b] transition-all duration-200"
                  style={{borderRadius: '2px'}}
                >
                  ◀
                </button>

                <button
                  onClick={() => {
                    if (onWeekChange) {
                      const nextWeek = new Date(startOfWeek)
                      nextWeek.setDate(nextWeek.getDate() + 7)
                      const nextWeekStr = nextWeek.getFullYear() + '-' + 
                                        String(nextWeek.getMonth() + 1).padStart(2, '0') + '-' + 
                                        String(nextWeek.getDate()).padStart(2, '0')
                      onWeekChange(nextWeekStr)
                    }
                  }}
                  className="px-2 py-1 text-xs font-mono border-2 border-[#ff6b6b]/60 text-[#ff6b6b] hover:border-[#ff6b6b] transition-all duration-200"
                  style={{borderRadius: '2px'}}
                >
                  ▶
                </button>
              </div>
              
              {/* 이번주 버튼 */}
              <button
                onClick={() => {
                  if (onWeekChange) {
                    // 서버 시간 기준으로 일요일부터 시작하는 주의 시작일 계산
                    const today = serverTime ? new Date(serverTime.koreaDate) : new Date()
                    const startOfThisWeek = new Date(today)
                    startOfThisWeek.setDate(today.getDate() - today.getDay())
                    const startOfThisWeekStr = startOfThisWeek.getFullYear() + '-' + 
                                             String(startOfThisWeek.getMonth() + 1).padStart(2, '0') + '-' + 
                                             String(startOfThisWeek.getDate()).padStart(2, '0')
                    onWeekChange(startOfThisWeekStr)
                  }
                }}
                className={`px-3 py-1 text-xs font-mono border-2 transition-all duration-200 ${
                  (() => {
                    const today = serverTime ? new Date(serverTime.koreaDate) : new Date()
                    const startOfThisWeek = new Date(today)
                    startOfThisWeek.setDate(today.getDate() - today.getDay())
                    return startOfThisWeek.getFullYear() + '-' + 
                           String(startOfThisWeek.getMonth() + 1).padStart(2, '0') + '-' + 
                           String(startOfThisWeek.getDate()).padStart(2, '0')
                  })() === (() => {
                    return startOfWeek.getFullYear() + '-' + 
                           String(startOfWeek.getMonth() + 1).padStart(2, '0') + '-' + 
                           String(startOfWeek.getDate()).padStart(2, '0')
                  })()
                    ? 'bg-[#ff6b6b] text-black border-[#ff6b6b]'
                    : 'bg-transparent text-[#ff6b6b] border-[#ff6b6b]/60 hover:border-[#ff6b6b]'
                }`}
                style={{borderRadius: '2px'}}
              >
                이번주
              </button>
            </div>
          </div>

          {/* 총 금액 표시 */}
          <div className="text-center mt-4">
            <div className="text-3xl font-bold font-mono text-[#ff6b6b]">
              ₩{(weekTotal || 0).toLocaleString()}
            </div>
            
            {/* 건당 평균금액 */}
            {weekCount > 0 && (
              <div className="mt-2 text-sm text-gray-300 font-mono">
                건당 평균: ₩{Math.round((weekTotal || 0) / (weekCount || 1)).toLocaleString()}
              </div>
            )}
            
            {/* 지난주 대비 증감률 */}
            <div className="mt-1 text-xs font-mono flex items-center justify-center gap-1 text-[#ff6b6b]">
              지난주 대비 데이터 준비 중
            </div>
            
            {/* 목표 달성률 */}
            <div className="mt-4 mb-2">
              <div className="flex items-center justify-between text-xs text-gray-300 font-mono mb-4">
                <span>주간 목표</span>
                <button
                  onClick={() => setShowGoalSettings(true)}
                  className="bg-[#ff6b6b]/20 border border-[#ff6b6b]/50 text-[#ff6b6b] px-3 py-1 text-xs font-mono hover:border-[#ff6b6b] transition-all duration-200"
                  style={{borderRadius: '2px'}}
                >
                  설정
                </button>
              </div>
              <div className="w-full bg-[#1a202c] rounded-full h-6 border border-[#ff6b6b]/30 relative">
                <div 
                  className="h-full rounded-full transition-all duration-500 bg-[#ff6b6b]"
                  style={{ width: `${Math.min(weekGoalAchievement, 100)}%` }}
                ></div>
                
                {/* 그래프 안에 정보 표시 */}
                <div className="absolute inset-0 flex items-center justify-between px-4 text-xs font-mono">
                  <div className="text-white font-bold">
                    {weekGoalAchievement.toFixed(1)}%
                  </div>
                  <div className="text-gray-300">
                    ₩{(weekTotal || 0).toLocaleString()} / ₩{(weeklyGoal || 0).toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 픽셀 장식 요소들 - 빨강 고정 */}
          <div className="absolute top-1 left-1 w-2 h-2 bg-[#ff6b6b] transition-all duration-300" style={{borderRadius: '1px'}}></div>
          <div className="absolute top-1 right-1 w-2 h-2 bg-[#ff6b6b] transition-all duration-300" style={{borderRadius: '1px'}}></div>
          <div className="absolute bottom-1 left-1 w-2 h-2 bg-[#ff6b6b] transition-all duration-300" style={{borderRadius: '1px'}}></div>
          <div className="absolute bottom-1 right-1 w-2 h-2 bg-[#ff6b6b] transition-all duration-300" style={{borderRadius: '1px'}}></div>
        </div>

        {/* 픽셀 통계 카드들 */}
        <div className="grid grid-cols-3 gap-2">
          {/* 건수 */}
          <div className="bg-[#1a202c] border-2 border-[#00d4ff]/30 p-3 text-center relative" style={{borderRadius: '4px'}}>
            <p className="text-gray-300 text-xs font-mono mb-1">건수</p>
            <p className="text-white font-bold text-sm font-mono">
              {weekCount}건
            </p>
            <div className="absolute top-1 left-1 w-1 h-1 bg-[#00d4ff]/50" style={{borderRadius: '1px'}}></div>
            <div className="absolute top-1 right-1 w-1 h-1 bg-[#00d4ff]/50" style={{borderRadius: '1px'}}></div>
            <div className="absolute bottom-1 left-1 w-1 h-1 bg-[#00d4ff]/50" style={{borderRadius: '1px'}}></div>
            <div className="absolute bottom-1 right-1 w-1 h-1 bg-[#00d4ff]/50" style={{borderRadius: '1px'}}></div>
          </div>

          {/* 배달금액 */}
          <div className="bg-[#1a202c] border-2 border-[#00ff88]/30 p-3 text-center relative" style={{borderRadius: '4px'}}>
            <p className="text-gray-300 text-xs font-mono mb-1">배달금액</p>
            <p className="text-white font-bold text-sm font-mono">
              ₩{weekAmount.toLocaleString()}
            </p>
            <div className="absolute top-1 left-1 w-1 h-1 bg-[#00ff88]/50" style={{borderRadius: '1px'}}></div>
            <div className="absolute top-1 right-1 w-1 h-1 bg-[#00ff88]/50" style={{borderRadius: '1px'}}></div>
            <div className="absolute bottom-1 left-1 w-1 h-1 bg-[#00ff88]/50" style={{borderRadius: '1px'}}></div>
            <div className="absolute bottom-1 right-1 w-1 h-1 bg-[#00ff88]/50" style={{borderRadius: '1px'}}></div>
          </div>

          {/* 미션비 */}
          <div className="bg-[#1a202c] border-2 border-[#9c88ff]/30 p-3 text-center relative" style={{borderRadius: '4px'}}>
            <p className="text-gray-300 text-xs font-mono mb-1">미션비</p>
            <p className="text-white font-bold text-sm font-mono">
              ₩{weekMissionAmount.toLocaleString()}
            </p>
            <div className="absolute top-1 left-1 w-1 h-1 bg-[#9c88ff]/50" style={{borderRadius: '1px'}}></div>
            <div className="absolute top-1 right-1 w-1 h-1 bg-[#9c88ff]/50" style={{borderRadius: '1px'}}></div>
            <div className="absolute bottom-1 left-1 w-1 h-1 bg-[#9c88ff]/50" style={{borderRadius: '1px'}}></div>
            <div className="absolute bottom-1 right-1 w-1 h-1 bg-[#9c88ff]/50" style={{borderRadius: '1px'}}></div>
          </div>
        </div>
      </div>

      {/* 주간 달력 컨테이너 */}
      <div 
        className="bg-gradient-to-br from-[#2d3748] to-[#1a202c] rounded-xl p-4 border border-[#ff6b6b]/30 shadow-inner"
        style={{
          fontFamily: 'monospace',
          imageRendering: 'pixelated'
        }}
      >
        {/* 주간 달력 내용 - 구간별 카드 형식 */}
        <div className="space-y-2">
          {weekData.map((day, index) => (
            <div
              key={index}
              className={`bg-[#1a202c] border-2 relative cursor-pointer transition-all duration-200 ${
                day.isToday 
                  ? 'border-[#ff6b6b]' 
                  : 'border-gray-600/30 hover:border-gray-500/50'
              }`}
              style={{borderRadius: '8px'}}
              onClick={() => {
                setSelectedDate(day.date)
                setShowDetailModal(true)
              }}
            >
              <div className="flex">
                {/* 왼쪽: 요일/날짜 카드 */}
                <div className={`p-3 flex flex-col items-center justify-center min-w-[70px] border-r-2 ${
                  day.isToday 
                    ? 'border-r-[#ff6b6b]' 
                    : 'bg-[#2d3748]/50 border-r-gray-600/30'
                }`}>
                  <div className="text-xs text-gray-400 font-mono mb-1">{day.dayName}</div>
                  <div className={`text-base font-bold font-mono ${
                    day.dayOfWeek === 0 ? 'text-red-400' : // 일요일: 빨간색
                    day.dayOfWeek === 6 ? 'text-blue-400' : // 토요일: 파란색
                    'text-white'
                  }`}>
                    {day.date.split('-')[2]}
                  </div>
                </div>

                {/* 오른쪽: 수입 정보 카드 */}
                <div className="flex-1 p-3">
                  {/* 총액 헤더 */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-white text-sm font-mono font-bold">총 수입</div>
                    <div className={`text-base font-bold font-mono ${
                      day.dayOfWeek === 0 ? 'text-red-400' : // 일요일: 빨간색
                      day.dayOfWeek === 6 ? 'text-blue-400' : // 토요일: 파란색
                      'text-white'
                    }`}>
                      ₩{day.total.toLocaleString()}
                    </div>
                  </div>

                  {/* 상세 정보 그리드 */}
                  {day.total > 0 ? (
                    <div className="grid grid-cols-3 gap-2">
                      {/* 건수 */}
                      <div className="bg-[#2d3748]/50 p-2 text-center" style={{borderRadius: '4px'}}>
                        <div className="text-xs text-gray-400 font-mono mb-1">건수</div>
                        <div className="text-xs font-bold font-mono text-[#ff6b6b]">
                          {day.count}건
                        </div>
                      </div>

                      {/* 배달 금액 */}
                      <div className="bg-[#2d3748]/50 p-2 text-center" style={{borderRadius: '4px'}}>
                        <div className="text-white text-xs font-mono font-bold mb-1">배달금액</div>
                        <div className="text-xs font-bold font-mono text-white">
                          ₩{day.amount.toLocaleString()}
                        </div>
                      </div>

                      {/* 미션비 */}
                      <div className="bg-[#2d3748]/50 p-2 text-center" style={{borderRadius: '4px'}}>
                        <div className="text-white text-xs font-mono font-bold mb-1">미션비</div>
                        <div className="text-xs font-bold font-mono text-[#00d4ff]">
                          ₩{day.missionAmount.toLocaleString()}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-2">
                      <div className="text-sm text-gray-500 font-mono">
                        수입 없음
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              {/* 픽셀 장식 요소들 */}
              <div className="absolute top-1 left-1 w-1 h-1 bg-[#ff6b6b]/50" style={{borderRadius: '1px'}}></div>
              <div className="absolute top-1 right-1 w-1 h-1 bg-[#ff6b6b]/50" style={{borderRadius: '1px'}}></div>
              <div className="absolute bottom-1 left-1 w-1 h-1 bg-[#ff6b6b]/50" style={{borderRadius: '1px'}}></div>
              <div className="absolute bottom-1 right-1 w-1 h-1 bg-[#ff6b6b]/50" style={{borderRadius: '1px'}}></div>
            </div>
          ))}
        </div>

        {/* 주간 차트 */}
        <div className="mt-6 pt-4 border-t border-[#ff6b6b]/30">
          <div className="text-sm text-gray-400 font-mono mb-4 text-center">주간 수익 차트</div>
          
          {/* 차트 영역 */}
          <div className="relative">
            {/* 꺾은선형 차트 */}
            <div className="relative h-24 bg-[#1a202c]/50 rounded px-4 py-2" 
                 style={{borderRadius: '4px'}}>
              
              {/* 차트 선과 점들 */}
              <svg className="absolute inset-2 w-full h-full" style={{width: 'calc(100% - 16px)', height: 'calc(100% - 16px)'}}>
                {/* 배경 그리드 라인 */}
                <defs>
                  <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                    <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#374151" strokeWidth="0.5" opacity="0.3"/>
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid)" />
                
                {/* 일간 목표 기준선 */}
                {(() => {
                  const maxValue = Math.max(...weekData.map(d => d.total))
                  if (maxValue > 0 && dailyGoal > 0) {
                    const goalY = 100 - ((dailyGoal / maxValue) * 80)
                    return (
                      <g>
                        {/* 목표 기준선 */}
                        <line
                          x1="0%"
                          y1={`${goalY}%`}
                          x2="100%"
                          y2={`${goalY}%`}
                          stroke="#ffd93d"
                          strokeWidth="1"
                          strokeDasharray="4,4"
                          opacity="0.6"
                        />
                        {/* 목표 라벨 */}
                        <text
                          x="100%"
                          y={`${Math.max(goalY - 3, 8)}%`}
                          textAnchor="end"
                          fontSize="9"
                          fill="#ffd93d"
                          fontFamily="monospace"
                          className="font-mono"
                          opacity="0.8"
                        >
                          목표: {(dailyGoal / 10000).toFixed(1)}만
                        </text>
                      </g>
                    )
                  }
                  return null
                })()}
                
                {/* 꺾은선 그리기 */}
                {weekData.map((day, index) => {
                  const maxValue = Math.max(...weekData.map(d => d.total))
                  const x = (index / (weekData.length - 1)) * 100
                  const y = maxValue > 0 ? 100 - ((day.total / maxValue) * 80) : 75
                  
                  return (
                    <g key={index}>
                      {/* 다음 점과 연결하는 선 */}
                      {index < weekData.length - 1 && (
                        (() => {
                          const nextDay = weekData[index + 1]
                          const nextX = ((index + 1) / (weekData.length - 1)) * 100
                          const nextY = maxValue > 0 ? 100 - ((nextDay.total / maxValue) * 80) : 75
                          
                          return (
                            <line
                              x1={`${x}%`}
                              y1={`${y}%`}
                              x2={`${nextX}%`}
                              y2={`${nextY}%`}
                              stroke="#ff6b6b"
                              strokeWidth="2"
                              className="transition-all duration-500"
                            />
                          )
                        })()
                      )}
                      
                      {/* 데이터 포인트 */}
                      <circle
                        cx={`${x}%`}
                        cy={`${y}%`}
                        r={day.isToday ? "4" : "3"}
                        fill={day.isToday ? "#ff6b6b" : "#ff6b6b"}
                        stroke={day.isToday ? "#ffffff" : "#ff6b6b"}
                        strokeWidth={day.isToday ? "2" : "0"}
                        className="transition-all duration-500"
                      />
                      
                      {/* 금액 라벨 */}
                      {day.total > 0 && (
                        <text
                          x={`${x}%`}
                          y={`${Math.max(y - 8, 10)}%`}
                          textAnchor="middle"
                          fontSize="10"
                          fill="#e5e7eb"
                          fontFamily="monospace"
                          className="font-mono"
                        >
                          {(day.total / 10000).toFixed(1)}만
                        </text>
                      )}
                    </g>
                  )
                })}
              </svg>
              
            </div>
            
            {/* 요일 표시 - 차트 아래에 별도 배치 */}
            <div className="mt-4 flex justify-between px-4">
              {weekData.map((day, index) => (
                <div key={index} className={`text-xs font-mono ${
                  day.dayOfWeek === 0 ? 'text-red-400' : // 일요일: 빨간색
                  day.dayOfWeek === 6 ? 'text-blue-400' : // 토요일: 파란색
                  day.isToday ? 'text-[#ff6b6b] font-bold' : 'text-gray-400'
                }`}>
                  {day.dayName}
                </div>
              ))}
            </div>
            
            {/* 차트 하단 정보 */}
            <div className="mt-3 text-center">
              <div className="text-xs text-gray-400 font-mono">
                주간 총 수익: <span className="text-[#ff6b6b] font-bold">
                  {(weekTotal / 10000).toFixed(1)}만원
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 저장 버튼 */}
      <button
        onClick={captureWeeklyView}
        className="w-full bg-gradient-to-r from-[#1a202c] to-[#2d3748] border-2 border-[#ff6b6b]/50 hover:border-[#ff6b6b] text-white font-mono py-3 px-4 transition-all duration-200 relative"
        style={{
          borderRadius: '4px',
          fontFamily: 'monospace',
          imageRendering: 'pixelated'
        }}
      >
        <div className="flex items-center justify-center">
          <div className="text-center">
            <p className="text-base font-bold">📸 주간 수익 캡처 저장</p>
          </div>
        </div>
        <div className="absolute top-1 left-1 w-1 h-1 bg-[#ff6b6b]/60" style={{borderRadius: '1px'}}></div>
        <div className="absolute top-1 right-1 w-1 h-1 bg-[#ff6b6b]/60" style={{borderRadius: '1px'}}></div>
        <div className="absolute bottom-1 left-1 w-1 h-1 bg-[#ff6b6b]/60" style={{borderRadius: '1px'}}></div>
        <div className="absolute bottom-1 right-1 w-1 h-1 bg-[#ff6b6b]/60" style={{borderRadius: '1px'}}></div>
      </button>
    </div>
  )
}

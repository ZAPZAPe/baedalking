'use client'

interface HomeTabProps {
  currentBackground: string
  currentEmotion: string
  speechText: string
  currentVehicle: string
  garageIntro: string
  todayVisitors: number
  currentWeather: { temp: number; condition: string }
  getWeatherIcon: (condition: string) => string
  incomeRecords: any[]
  totalIncome: number
  isVerified: boolean
  isClient: boolean
  setShowBackgroundItemPanel: (show: boolean) => void
  setShowVehicleItemPanel: (show: boolean) => void
  setShowCharacterItemPanel: (show: boolean) => void
  setShowIncomeInputPanel: (show: boolean) => void
  setActiveTab: (tab: string) => void
}

export default function HomeTab({
  currentBackground,
  currentEmotion,
  speechText,
  currentVehicle,
  garageIntro,
  todayVisitors,
  currentWeather,
  getWeatherIcon,
  incomeRecords,
  totalIncome,
  isVerified,
  isClient,
  setShowBackgroundItemPanel,
  setShowVehicleItemPanel,
  setShowCharacterItemPanel,
  setShowIncomeInputPanel,
  setActiveTab
}: HomeTabProps) {
  // 오늘 날짜 계산 (INCOME 탭과 동일한 방식)
  const today = new Date()
  const todayStr = today.toISOString().split('T')[0]
  
  return (
    <div className="space-y-3 sm:space-y-4">
      {/* 꾸미기 공간 카드 - 최상단으로 이동 */}
      <div className="bg-gradient-to-br from-[#1a4a2e]/90 to-[#1a1a2e]/90 backdrop-blur-lg rounded-2xl p-2 sm:p-3 lg:p-4 border border-[#00ff88]/20 shadow-2xl">

        {/* 배경, 캐릭터, 스쿠터 꾸미기 공간 - 비율 유지하며 크기 조절 */}
        <div className="relative bg-gradient-to-b from-[#2d3748] to-[#1a202c] rounded-xl p-3 sm:p-4 lg:p-5 mb-2 sm:mb-3 lg:mb-4 min-h-[330px] sm:min-h-[370px] lg:min-h-[420px] border border-[#00ff88]/30 shadow-inner">
          {/* 배경 이미지 - 클릭 가능 */}
          <button 
            onClick={() => setShowBackgroundItemPanel(true)}
            className="absolute inset-0 w-full h-full z-10 hover:scale-[1.02] transition-all duration-200 group"
          >
            <img 
              src={`/assets/background/${currentBackground}.png`}
              alt="배경"
              className="absolute inset-0 w-full h-full object-cover rounded-lg opacity-85 group-hover:opacity-90"
              style={{ imageRendering: 'pixelated' }}
            />
            {/* 배경 변경 힌트 */}
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <div className="bg-black/60 backdrop-blur-sm rounded-lg px-3 py-2 border border-white/20">
                <span className="text-white text-xs font-bold">🖼️ 배경 변경</span>
              </div>
            </div>
          </button>
          
          {/* 스쿠터 - 클릭 가능 */}
          <button 
            onClick={() => setShowVehicleItemPanel(true)}
            className="absolute bottom-[0%] left-[-5%] sm:left-[8%] lg:left-[10%] w-[240px] sm:w-[280px] lg:w-[320px] h-[180px] sm:h-[210px] lg:h-[240px] z-20 hover:scale-105 transition-all duration-200 group"
          >
            <img 
              src="/assets/vehicle/scooter.png" 
              alt="스쿠터" 
              className="w-full h-full object-contain drop-shadow-lg group-hover:drop-shadow-xl"
              style={{ imageRendering: 'pixelated' }}
            />
            {/* 호버 힌트 */}
            <div className="absolute inset-0 bg-white/10 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 border-2 border-white/30">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white text-xs font-bold bg-black/50 px-2 py-1 rounded">
                🛵 운송수단
              </div>
            </div>
          </button>
          
          {/* 캐릭터 - 클릭 가능 */}
          <button 
            onClick={() => setShowCharacterItemPanel(true)}
            className="absolute bottom-[5%] right-[5%] sm:right-[12%] lg:right-[15%] w-[160px] sm:w-[180px] lg:w-[200px] h-[160px] sm:h-[180px] lg:h-[200px] z-30 hover:scale-105 transition-all duration-200 group"
          >
            <img 
              src={`/assets/character/character-${currentEmotion}.png`}
              alt="캐릭터"
              className="w-full h-full object-contain drop-shadow-lg group-hover:drop-shadow-xl"
              style={{ imageRendering: 'pixelated' }}
            />
            {/* 호버 힌트 */}
            <div className="absolute inset-0 bg-white/10 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 border-2 border-white/30">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white text-xs font-bold bg-black/50 px-2 py-1 rounded">
                👕 의상
              </div>
            </div>

            {/* 말풍선 - 도트형식 스타일 */}
            <div className="absolute -top-8 sm:-top-9 lg:-top-10 left-1/2 -translate-x-1/2 bg-white border-2 border-gray-800 min-w-[50px] sm:min-w-[55px] lg:min-w-[60px] max-w-[100px] sm:max-w-[110px] lg:max-w-[120px] z-40 pointer-events-none" 
                 style={{
                   borderRadius: '0px',
                   imageRendering: 'pixelated',
                   boxShadow: '4px 4px 0px rgba(0,0,0,0.3)'
                 }}>
              <div className="absolute bottom-[-6px] left-1/2 -translate-x-1/2 w-3 h-3 bg-white border-r-2 border-b-2 border-gray-800 rotate-45"></div>
              <p className="text-[10px] text-gray-800 font-bold text-center leading-tight break-words overflow-hidden px-2 py-1.5" 
                 style={{
                   display: '-webkit-box',
                   WebkitLineClamp: 2,
                   WebkitBoxOrient: 'vertical',
                   wordBreak: 'keep-all',
                   fontFamily: 'monospace'
                 }}>
                {speechText}
              </p>
            </div>
          </button>
          

          {/* 나무 푯말 - 우측 상단에 투명하게 오버레이 */}
          <div className="absolute top-3 right-3 z-50">
            <div className="relative">
              {/* 왼쪽 로프 */}
              <div className="absolute -top-4 left-2 w-1 h-4 bg-gradient-to-b from-[#8B4513] to-[#A0522D] rounded-full opacity-80"></div>
              <div className="absolute -top-4 left-2 w-0.5 h-4.5 bg-[#654321] rounded-full shadow-sm opacity-80"></div>
              
              {/* 오른쪽 로프 */}
              <div className="absolute -top-4 right-2 w-1 h-4 bg-gradient-to-b from-[#8B4513] to-[#A0522D] rounded-full opacity-80"></div>
              <div className="absolute -top-4 right-2 w-0.5 h-4.5 bg-[#654321] rounded-full shadow-sm opacity-80"></div>
              
              {/* 나무 푯말 - 투명 효과, Today 제거 */}
              <div className="bg-gradient-to-b from-[#DEB887]/85 via-[#D2B48C]/85 to-[#CD853F]/85 backdrop-blur-sm rounded-lg p-2 border-2 border-[#8B4513]/70 shadow-xl relative overflow-hidden">
                {/* 나무 결 패턴 */}
                <div className="absolute inset-0 opacity-15">
                  <div className="h-full w-full bg-gradient-to-r from-transparent via-[#8B4513]/30 to-transparent transform rotate-12"></div>
                  <div className="absolute top-1 left-0 h-0.5 w-full bg-[#8B4513]/20 rounded-full"></div>
                  <div className="absolute bottom-1 left-0 h-0.5 w-full bg-[#8B4513]/20 rounded-full"></div>
                </div>
                
                {/* 못 */}
                <div className="absolute top-0.5 left-0.5 w-1 h-1 bg-[#696969]/80 rounded-full shadow-inner"></div>
                <div className="absolute top-0.5 right-0.5 w-1 h-1 bg-[#696969]/80 rounded-full shadow-inner"></div>
                <div className="absolute bottom-0.5 left-0.5 w-1 h-1 bg-[#696969]/80 rounded-full shadow-inner"></div>
                <div className="absolute bottom-0.5 right-0.5 w-1 h-1 bg-[#696969]/80 rounded-full shadow-inner"></div>
                
                <div className="relative z-10">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col items-center justify-center">
                      <p className="text-[#5D4037] text-xs font-bold h-3 flex items-center justify-center">Today</p>
                      <p className="text-[#2F1B14] text-sm font-black drop-shadow-sm h-5 flex items-center justify-center">{todayVisitors}명</p>
                    </div>
                    <div className="flex flex-col items-center justify-center">
                      <p className="text-[#5D4037] text-xs font-bold h-3 flex items-center justify-center">Weather</p>
                      <p className="text-[#2F1B14] text-sm font-black drop-shadow-sm h-5 flex items-center justify-center">{getWeatherIcon(currentWeather.condition)} {currentWeather.temp}°</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 꾸미기 공간 테두리 효과 */}
          <div className="absolute inset-0 rounded-xl border-2 border-[#00ff88]/20 pointer-events-none"></div>
          
          {/* 코너 장식 */}
          <div className="absolute top-2 left-2 w-4 h-4 border-l-2 border-t-2 border-[#00ff88]/60 rounded-tl-lg"></div>
          <div className="absolute top-2 right-2 w-4 h-4 border-r-2 border-t-2 border-[#00ff88]/60 rounded-tr-lg"></div>
          <div className="absolute bottom-2 left-2 w-4 h-4 border-l-2 border-b-2 border-[#00ff88]/60 rounded-bl-lg"></div>
          <div className="absolute bottom-2 right-2 w-4 h-4 border-r-2 border-b-2 border-[#00ff88]/60 rounded-br-lg"></div>
        </div>

        {/* 가라지 소개 */}
        <div className="bg-black/30 backdrop-blur-sm rounded-lg p-3 border border-[#00ff88]/20">
          <div className="text-center">
            <p className="text-white text-sm font-medium leading-relaxed">{garageIntro}</p>
          </div>
        </div>

      </div>

      {/* 카카오 광고 - 클라이언트에서만 렌더링 */}
      <div className="bg-gradient-to-br from-[#2d2d2d]/90 to-[#1a1a1a]/90 backdrop-blur-lg rounded-xl sm:rounded-2xl p-3 border border-gray-600/20 shadow-2xl mb-2 sm:mb-3 lg:mb-4 text-center flex-shrink-0 min-h-[100px] flex items-center justify-center">
        {isClient ? (
          <>
            <ins className="kakao_ad_area"
              data-ad-unit="DAN-hoOuYkLu161z0omL"
              data-ad-width="320"
              data-ad-height="100"></ins>
            <script type="text/javascript" src="//t1.daumcdn.net/kas/static/ba.min.js" async></script>
          </>
        ) : (
          <div className="flex items-center justify-center text-gray-500 text-sm">
            광고 로딩 중...
          </div>
        )}
      </div>

      {/* 픽셀아트 스타일 수익 현황 */}
      <div 
        className="bg-gradient-to-br from-[#2d3748] to-[#1a202c] rounded-xl p-4 border border-[#00ff88]/30 shadow-inner mb-2 sm:mb-3 lg:mb-4 flex-shrink-0"
        style={{
          fontFamily: 'monospace',
          imageRendering: 'pixelated'
        }}
      >
        {/* 픽셀 헤더 - 인증 상태에 따른 테두리 */}
        <div 
          className={`bg-gradient-to-r from-[#1a202c] to-[#2d3748] p-3 mb-4 border-2 relative transition-all duration-300 ${
            isVerified 
              ? 'border-[#00ff88]' 
              : 'border-gray-600/50'
          }`} 
          style={{
            borderRadius: '4px',
            boxShadow: isVerified ? '0 0 10px #00ff8840, inset 0 0 10px #00ff8820' : 'none'
          }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div>
                <h3 className="text-white font-bold text-base font-mono" style={{
                  textShadow: '2px 0 0 #000, -2px 0 0 #000, 0 2px 0 #000, 0 -2px 0 #000, 1px 1px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000',
                  imageRendering: 'pixelated'
                }}>
                  오늘의 수익
                </h3>
                <p className="text-gray-400 text-xs font-mono">Today's Earnings</p>
              </div>
            </div>
            <div 
              className={`bg-[#1a202c] border-2 px-2 py-1 font-mono text-xs transition-all duration-300 ${
                isVerified 
                  ? 'border-[#00ff88]/60 text-[#00ff88]' 
                  : 'border-gray-600/50 text-gray-300'
              }`} 
              style={{borderRadius: '2px'}}
            >
              {new Date(todayStr).toLocaleDateString('ko-KR')}
            </div>
          </div>

          {/* 총 금액 표시 */}
          <div className="text-center mt-4">
            <div className="text-3xl font-bold font-mono text-[#00ff88]">
              ₩{(incomeRecords.filter(record => record.date === todayStr)
                  .reduce((sum, record) => sum + (record.amount || 0), 0) + 
                 incomeRecords.filter(record => record.date === todayStr)
                  .reduce((sum, record) => sum + (record.missionAmount || 0), 0)).toLocaleString()}
            </div>
          </div>

          {/* 픽셀 장식 요소들 - 인증 상태에 따른 색상 */}
          <div 
            className={`absolute top-1 left-1 w-2 h-2 transition-all duration-300 ${
              isVerified ? 'bg-[#00ff88]' : 'bg-gray-600/50'
            }`} 
            style={{borderRadius: '1px'}}
          ></div>
          <div 
            className={`absolute top-1 right-1 w-2 h-2 transition-all duration-300 ${
              isVerified ? 'bg-[#00ff88]' : 'bg-gray-600/50'
            }`} 
            style={{borderRadius: '1px'}}></div>
          <div 
            className={`absolute bottom-1 left-1 w-2 h-2 transition-all duration-300 ${
              isVerified ? 'bg-[#00ff88]' : 'bg-gray-600/50'
            }`} 
            style={{borderRadius: '1px'}}></div>
          <div 
            className={`absolute bottom-1 right-1 w-2 h-2 transition-all duration-300 ${
              isVerified ? 'bg-[#00ff88]' : 'bg-gray-600/50'
            }`} 
            style={{borderRadius: '1px'}}></div>
        </div>

        {/* 픽셀 통계 카드들 */}
        <div className="grid grid-cols-3 gap-2">
          {/* 건수 */}
          <div className="bg-[#1a202c] border-2 border-gray-600/50 p-3 text-center relative" style={{borderRadius: '4px'}}>
            <p className="text-gray-300 text-xs font-mono mb-2">건수</p>
            <p className="text-white font-bold text-lg font-mono">
              {incomeRecords.filter(record => record.date === todayStr)
                .reduce((sum, record) => sum + record.count, 0)}건
            </p>
            {/* 픽셀 도트들 */}
            <div className="absolute top-1 left-1 w-1 h-1 bg-gray-600/50" style={{borderRadius: '1px'}}></div>
            <div className="absolute top-1 right-1 w-1 h-1 bg-gray-600/50" style={{borderRadius: '1px'}}></div>
            <div className="absolute bottom-1 left-1 w-1 h-1 bg-gray-600/50" style={{borderRadius: '1px'}}></div>
            <div className="absolute bottom-1 right-1 w-1 h-1 bg-gray-600/50" style={{borderRadius: '1px'}}></div>
          </div>

          {/* 배달금액 */}
          <div className="bg-[#1a202c] border-2 border-gray-600/50 p-3 text-center relative" style={{borderRadius: '4px'}}>
            <p className="text-gray-300 text-xs font-mono mb-2">배달금액</p>
            <p className="text-white font-bold text-lg font-mono">
              ₩{incomeRecords.filter(record => record.date === todayStr)
                .reduce((sum, record) => sum + (record.amount || 0), 0).toLocaleString()}
            </p>
            {/* 픽셀 도트들 */}
            <div className="absolute top-1 left-1 w-1 h-1 bg-gray-600/50" style={{borderRadius: '1px'}}></div>
            <div className="absolute top-1 right-1 w-1 h-1 bg-gray-600/50" style={{borderRadius: '1px'}}></div>
            <div className="absolute bottom-1 left-1 w-1 h-1 bg-gray-600/50" style={{borderRadius: '1px'}}></div>
            <div className="absolute bottom-1 right-1 w-1 h-1 bg-gray-600/50" style={{borderRadius: '1px'}}></div>
          </div>

          {/* 미션비 */}
          <div className="bg-[#1a202c] border-2 border-gray-600/50 p-3 text-center relative" style={{borderRadius: '4px'}}>
            <p className="text-gray-300 text-xs font-mono mb-2">미션비</p>
            <p className="text-white font-bold text-lg font-mono">
              ₩{incomeRecords.filter(record => record.date === todayStr)
                .reduce((sum, record) => sum + (record.missionAmount || 0), 0).toLocaleString()}
            </p>
            {/* 픽셀 도트들 */}
            <div className="absolute top-1 left-1 w-1 h-1 bg-gray-600/50" style={{borderRadius: '1px'}}></div>
            <div className="absolute top-1 right-1 w-1 h-1 bg-gray-600/50" style={{borderRadius: '1px'}}></div>
            <div className="absolute bottom-1 left-1 w-1 h-1 bg-gray-600/50" style={{borderRadius: '1px'}}></div>
            <div className="absolute bottom-1 right-1 w-1 h-1 bg-gray-600/50" style={{borderRadius: '1px'}}></div>
          </div>
        </div>
      </div>

      {/* 수입 입력 버튼 - 픽셀아트 스타일 */}
      <div className="mb-2 sm:mb-3 lg:mb-4 flex-shrink-0">
        <button
          onClick={() => setShowIncomeInputPanel(true)}
          className="w-full bg-gradient-to-r from-[#1a202c] to-[#2d3748] border-2 border-[#00d4ff]/50 hover:border-[#00d4ff] text-white font-mono py-3 px-4 transition-all duration-200 relative"
          style={{
            borderRadius: '4px',
            fontFamily: 'monospace',
            imageRendering: 'pixelated'
          }}
        >
          <div className="flex items-center justify-center">
            <div className="text-center">
              <p className="text-base font-bold">수입 기록하기</p>
              <p className="text-xs text-gray-300">오늘의 배달 수익을 입력하세요</p>
            </div>
          </div>
          {/* 픽셀 도트들 */}
          <div className="absolute top-1 left-1 w-1 h-1 bg-[#00d4ff]/60" style={{borderRadius: '1px'}}></div>
          <div className="absolute top-1 right-1 w-1 h-1 bg-[#00d4ff]/60" style={{borderRadius: '1px'}}></div>
          <div className="absolute bottom-1 left-1 w-1 h-1 bg-[#00d4ff]/60" style={{borderRadius: '1px'}}></div>
          <div className="absolute bottom-1 right-1 w-1 h-1 bg-[#00d4ff]/60" style={{borderRadius: '1px'}}></div>
        </button>
      </div>
      
      {/* 하단 여백 - 상단과 동일하게 */}
      <div className="mb-2 sm:mb-3 lg:mb-4"></div>


    </div>
  )
}
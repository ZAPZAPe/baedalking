import { NextRequest, NextResponse } from 'next/server'

// prerender 방지를 위한 설정
export const dynamic = 'force-dynamic'

// 지역명을 위도/경도로 변환하는 함수 (구까지 지원)
const getCoordinatesFromRegion = (region: string): { lat: string, lon: string, city: string } => {
  // 구까지 포함된 지역명 처리
  const regionParts = region.split(' ')
  const province = regionParts[0] // 시/도
  const district = regionParts.slice(1).join(' ') // 구
  
  const regionMap: Record<string, { lat: string, lon: string, city: string }> = {
    // 서울특별시 구별 좌표
    '서울특별시 강남구': { lat: '37.5172', lon: '127.0473', city: '서울 강남구' },
    '서울특별시 강동구': { lat: '37.5301', lon: '127.1238', city: '서울 강동구' },
    '서울특별시 강북구': { lat: '37.6396', lon: '127.0257', city: '서울 강북구' },
    '서울특별시 강서구': { lat: '37.5509', lon: '126.8495', city: '서울 강서구' },
    '서울특별시 관악구': { lat: '37.4784', lon: '126.9516', city: '서울 관악구' },
    '서울특별시 광진구': { lat: '37.5384', lon: '127.0822', city: '서울 광진구' },
    '서울특별시 구로구': { lat: '37.4954', lon: '126.8874', city: '서울 구로구' },
    '서울특별시 금천구': { lat: '37.4601', lon: '126.9009', city: '서울 금천구' },
    '서울특별시 노원구': { lat: '37.6542', lon: '127.0568', city: '서울 노원구' },
    '서울특별시 도봉구': { lat: '37.6688', lon: '127.0471', city: '서울 도봉구' },
    '서울특별시 동대문구': { lat: '37.5744', lon: '127.0395', city: '서울 동대문구' },
    '서울특별시 동작구': { lat: '37.5124', lon: '126.9393', city: '서울 동작구' },
    '서울특별시 마포구': { lat: '37.5637', lon: '126.9084', city: '서울 마포구' },
    '서울특별시 서대문구': { lat: '37.5791', lon: '126.9368', city: '서울 서대문구' },
    '서울특별시 서초구': { lat: '37.4837', lon: '127.0324', city: '서울 서초구' },
    '서울특별시 성동구': { lat: '37.5506', lon: '127.0409', city: '서울 성동구' },
    '서울특별시 성북구': { lat: '37.5894', lon: '127.0167', city: '서울 성북구' },
    '서울특별시 송파구': { lat: '37.5145', lon: '127.1059', city: '서울 송파구' },
    '서울특별시 양천구': { lat: '37.5270', lon: '126.8562', city: '서울 양천구' },
    '서울특별시 영등포구': { lat: '37.5264', lon: '126.8892', city: '서울 영등포구' },
    '서울특별시 용산구': { lat: '37.5384', lon: '126.9654', city: '서울 용산구' },
    '서울특별시 은평구': { lat: '37.6027', lon: '126.9291', city: '서울 은평구' },
    '서울특별시 종로구': { lat: '37.5735', lon: '126.9788', city: '서울 종로구' },
    '서울특별시 중구': { lat: '37.5640', lon: '126.9975', city: '서울 중구' },
    '서울특별시 중랑구': { lat: '37.6060', lon: '127.0926', city: '서울 중랑구' },
    
    // 경기도 주요 시/군별 좌표
    '경기도 수원시': { lat: '37.2636', lon: '127.0286', city: '수원' },
    '경기도 성남시': { lat: '37.4449', lon: '127.1389', city: '성남' },
    '경기도 의정부시': { lat: '37.7381', lon: '127.0338', city: '의정부' },
    '경기도 안양시': { lat: '37.3943', lon: '126.9568', city: '안양' },
    '경기도 부천시': { lat: '37.5035', lon: '126.7660', city: '부천' },
    '경기도 광명시': { lat: '37.4792', lon: '126.8649', city: '광명' },
    '경기도 평택시': { lat: '36.9920', lon: '127.1128', city: '평택' },
    '경기도 과천시': { lat: '37.4292', lon: '126.9879', city: '과천' },
    '경기도 오산시': { lat: '37.1498', lon: '127.0772', city: '오산' },
    '경기도 시흥시': { lat: '37.3799', lon: '126.8031', city: '시흥' },
    '경기도 군포시': { lat: '37.3616', lon: '126.9352', city: '군포' },
    '경기도 의왕시': { lat: '37.3446', lon: '126.9482', city: '의왕' },
    '경기도 하남시': { lat: '37.5392', lon: '127.2149', city: '하남' },
    '경기도 용인시': { lat: '37.2411', lon: '127.1776', city: '용인' },
    '경기도 파주시': { lat: '37.8151', lon: '126.7929', city: '파주' },
    '경기도 이천시': { lat: '37.2720', lon: '127.4350', city: '이천' },
    '경기도 안성시': { lat: '37.0080', lon: '127.2797', city: '안성' },
    '경기도 김포시': { lat: '37.6153', lon: '126.7158', city: '김포' },
    '경기도 화성시': { lat: '37.1995', lon: '126.8319', city: '화성' },
    '경기도 광주시': { lat: '37.4295', lon: '127.2550', city: '광주' },
    '경기도 여주시': { lat: '37.2984', lon: '127.6370', city: '여주' },
    '경기도 양평군': { lat: '37.4910', lon: '127.4874', city: '양평' },
    '경기도 고양시': { lat: '37.6584', lon: '126.8320', city: '고양' },
    '경기도 구리시': { lat: '37.5944', lon: '127.1296', city: '구리' },
    '경기도 남양주시': { lat: '37.6364', lon: '127.2161', city: '남양주' },
    '경기도 동두천시': { lat: '37.9036', lon: '127.0606', city: '동두천' },
    '경기도 안산시': { lat: '37.3219', lon: '126.8309', city: '안산' },
    '경기도 가평군': { lat: '37.8315', lon: '127.5105', city: '가평' },
    '경기도 연천군': { lat: '38.0966', lon: '127.0747', city: '연천' },
    
    // 기타 주요 도시들
    '부산': { lat: '35.1796', lon: '129.0756', city: '부산' },
    '부산광역시': { lat: '35.1796', lon: '129.0756', city: '부산' },
    '대구': { lat: '35.8714', lon: '128.6014', city: '대구' },
    '대구광역시': { lat: '35.8714', lon: '128.6014', city: '대구' },
    '인천': { lat: '37.4563', lon: '126.7052', city: '인천' },
    '인천광역시': { lat: '37.4563', lon: '126.7052', city: '인천' },
    '광주': { lat: '35.1595', lon: '126.8526', city: '광주' },
    '광주광역시': { lat: '35.1595', lon: '126.8526', city: '광주' },
    '대전': { lat: '36.3504', lon: '127.3845', city: '대전' },
    '대전광역시': { lat: '36.3504', lon: '127.3845', city: '대전' },
    '울산': { lat: '35.5384', lon: '129.3114', city: '울산' },
    '울산광역시': { lat: '35.5384', lon: '129.3114', city: '울산' },
    '세종': { lat: '36.4800', lon: '127.2890', city: '세종' },
    '세종특별자치시': { lat: '36.4800', lon: '127.2890', city: '세종' },
    '경기': { lat: '37.4138', lon: '127.5183', city: '수원' },
    '경기도': { lat: '37.4138', lon: '127.5183', city: '수원' },
    
    // 기본값은 서울
    default: { lat: '37.5665', lon: '126.9780', city: '서울' }
  }
  
  // 구까지 포함된 지역명이 있으면 우선 사용
  if (regionMap[region]) {
    return regionMap[region]
  }
  
  // 시/도만 있는 경우 기본 좌표 반환
  const defaultCoords = regionMap[province] || regionMap.default
  return {
    ...defaultCoords,
    city: district ? `${defaultCoords.city} ${district}` : defaultCoords.city
  }
}

// 날씨 정보 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const region = searchParams.get('region') || '서울'
    const userLat = searchParams.get('lat')
    const userLon = searchParams.get('lon')
    
    // 사용자가 위도/경도를 제공했으면 사용, 아니면 지역명으로 변환
    let lat, lon, city
    if (userLat && userLon) {
      lat = userLat
      lon = userLon 
      city = region
    } else {
      const coords = getCoordinatesFromRegion(region)
      lat = coords.lat
      lon = coords.lon
      city = coords.city
    }

    console.log('🌤️ 날씨 API 요청:', { region, lat, lon, city })

    // 🌤️ 실제 날씨 정보 가져오기 (한국 기상청 스타일 데이터)
    // 실제 배포 시에는 OpenWeatherMap 등의 API 연결
    
    // 지역별 실제 날씨 패턴 기반 데이터
    const getRealisticWeather = (region: string, lat: string, lon: string) => {
      const currentHour = new Date().getHours()
      const currentMonth = new Date().getMonth() + 1
      
      // 시간대별 온도 변화
      let baseTemp = 20
      if (currentHour >= 6 && currentHour < 12) baseTemp = 18 // 아침
      else if (currentHour >= 12 && currentHour < 18) baseTemp = 25 // 낮
      else if (currentHour >= 18 && currentHour < 22) baseTemp = 22 // 저녁
      else baseTemp = 16 // 밤
      
      // 계절별 조정
      if (currentMonth >= 12 || currentMonth <= 2) baseTemp -= 10 // 겨울
      else if (currentMonth >= 3 && currentMonth <= 5) baseTemp += 0 // 봄
      else if (currentMonth >= 6 && currentMonth <= 8) baseTemp += 8 // 여름
      else baseTemp += 2 // 가을
      
      // 지역별 조정
      if (region.includes('부산') || region.includes('울산')) baseTemp += 2 // 남쪽
      else if (region.includes('강원') || region.includes('대구')) baseTemp -= 1 // 내륙
      
      // 날씨 상태 결정
      const weatherTypes = ['clear', 'clouds', 'clouds', 'rain'] // 맑음이 더 자주
      const randomWeather = weatherTypes[Math.floor(Math.random() * weatherTypes.length)]
      
      const conditions = {
        'clear': { condition: 'sunny', desc: '맑음' },
        'clouds': { condition: 'cloudy', desc: '흐림' },
        'rain': { condition: 'rainy', desc: '비' }
      }
      
      const selected = conditions[randomWeather as keyof typeof conditions]
      
      return {
        main: { 
          temp: baseTemp + Math.floor(Math.random() * 6) - 3,
          humidity: 50 + Math.floor(Math.random() * 40) // 50-90% 습도
        },
        weather: [{ main: randomWeather, description: selected.desc }],
        wind: { speed: Math.floor(Math.random() * 10) + 1 }, // 1-10 m/s 풍속
        name: city
      }
    }
    
    const data = getRealisticWeather(region, lat, lon)

    // 날씨 상태 매핑
    const getCondition = (weatherMain: string): string => {
      switch (weatherMain.toLowerCase()) {
        case 'clear':
          return 'sunny'
        case 'clouds':
          return 'cloudy'
        case 'rain':
        case 'drizzle':
          return 'rainy'
        case 'snow':
          return 'snowy'
        case 'thunderstorm':
          return 'stormy'
        default:
          return 'cloudy'
      }
    }

    return NextResponse.json({
      temperature: Math.round(data.main.temp),
      condition: getCondition(data.weather[0].main),
      description: data.weather[0].description,
      location: data.name || city,
      humidity: data.main.humidity,
      windSpeed: data.wind.speed,
      source: 'realistic',
      requestedRegion: region,
      success: true
    })

  } catch (error) {
    console.error('❌ 날씨 API 오류:', error)
    
    // 에러 시에는 사용자 지역의 평균 날씨 반환
    const region = new URL(request.url).searchParams.get('region') || '서울'
    const coords = getCoordinatesFromRegion(region)
    
    return NextResponse.json({
      temperature: Math.floor(Math.random() * 10) + 15, // 15-25도 랜덤
      condition: 'cloudy',
      description: '구름많음',
      location: coords.city,
      source: 'fallback',
      requestedRegion: region,
      error: '실시간 날씨 정보를 불러올 수 없어 예상 날씨를 표시합니다.',
      success: false
    }, { status: 200 })
  }
}

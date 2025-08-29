import { NextRequest, NextResponse } from 'next/server'

// prerender 방지를 위한 설정
export const dynamic = 'force-dynamic'

// 날씨 정보 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const lat = searchParams.get('lat') || '37.5665' // 기본: 서울 위도
    const lon = searchParams.get('lon') || '126.9780' // 기본: 서울 경도

    // OpenWeatherMap API 키 (환경변수에서 가져오기)
    const API_KEY = process.env.OPENWEATHER_API_KEY || 'demo_key'
    
    if (API_KEY === 'demo_key') {
      // API 키가 없으면 더미 데이터 반환
      return NextResponse.json({
        temperature: Math.floor(Math.random() * 20) + 10, // 10-30도
        condition: ['sunny', 'cloudy', 'rainy'][Math.floor(Math.random() * 3)],
        description: '맑음',
        location: '서울',
        source: 'demo'
      })
    }

    const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric&lang=kr`
    
    const response = await fetch(weatherUrl)
    const data = await response.json()

    if (!response.ok) {
      throw new Error(`Weather API error: ${data.message}`)
    }

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
      location: data.name,
      humidity: data.main.humidity,
      windSpeed: data.wind.speed,
      source: 'openweather'
    })

  } catch (error) {
    console.error('날씨 API 오류:', error)
    
    // 에러 시 더미 데이터 반환
    return NextResponse.json({
      temperature: 22,
      condition: 'sunny',
      description: '맑음',
      location: '서울',
      source: 'fallback',
      error: '날씨 정보를 불러올 수 없습니다.'
    })
  }
}

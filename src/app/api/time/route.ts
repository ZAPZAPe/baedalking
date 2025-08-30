import { NextResponse } from 'next/server'

// prerender 방지를 위한 설정
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    console.log('⏰ 서버 시간 API 호출됨')
    
    // 현재 시간을 한국 시간대로 직접 계산
    const now = new Date()
    
    // 한국 시간을 더 정확하게 계산
    const koreaOffset = 9 * 60 // UTC+9 (분 단위)
    const koreaTime = new Date(now.getTime() + koreaOffset * 60 * 1000)
    
    // 한국 날짜 형식 (YYYY-MM-DD)
    const koreaDate = koreaTime.toISOString().split('T')[0]
    const koreaTimeString = koreaTime.toISOString().split('T')[1].split('.')[0]
    
    const result = {
      success: true,
      utc: now.toISOString(),
      korea: koreaTime.toISOString(),
      koreaDate: koreaDate, // YYYY-MM-DD
      koreaTime: koreaTimeString, // HH:MM:SS
      timezone: 'Asia/Seoul',
      timestamp: now.getTime()
    }
    
    console.log('✅ 서버 시간 응답:', result)
    
    return NextResponse.json(result)
  } catch (error) {
    console.error('❌ 서버 시간 API 오류:', error)
    
    return NextResponse.json({
      success: false,
      error: '서버 시간을 가져올 수 없습니다.',
      fallback: new Date().toISOString()
    }, { status: 500 })
  }
}

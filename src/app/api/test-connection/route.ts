import { NextResponse } from 'next/server'
import { testSupabaseConnection } from '@/lib/supabase'

// prerender 방지를 위한 설정
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const isConnected = await testSupabaseConnection()
    
    if (isConnected) {
      return NextResponse.json({ 
        status: 'success', 
        message: 'Supabase 연결 성공!',
        timestamp: new Date().toISOString()
      })
    } else {
      return NextResponse.json({ 
        status: 'error', 
        message: 'Supabase 연결 실패',
        timestamp: new Date().toISOString()
      }, { status: 500 })
    }
  } catch (error) {
    return NextResponse.json({ 
      status: 'error', 
      message: '연결 테스트 중 오류 발생',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

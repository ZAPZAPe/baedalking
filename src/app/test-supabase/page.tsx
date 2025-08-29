'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function TestSupabasePage() {
  const [connectionStatus, setConnectionStatus] = useState<string>('테스트 중...')
  const [testResult, setTestResult] = useState<string>('')

  useEffect(() => {
    testSupabaseConnection()
  }, [])

  const testSupabaseConnection = async () => {
    try {
      setConnectionStatus('연결 테스트 중...')
      
      // 1. 기본 연결 테스트
      const { data, error } = await supabase
        .from('items')
        .select('*')
        .limit(1)

      if (error) {
        throw error
      }

      setConnectionStatus('✅ Supabase 연결 성공!')
      setTestResult(`데이터베이스에서 ${data?.length || 0}개의 아이템을 가져왔습니다.`)
      
    } catch (error: any) {
      setConnectionStatus('❌ Supabase 연결 실패')
      setTestResult(`오류: ${error.message}`)
      console.error('Supabase 연결 오류:', error)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f0f23] via-[#1a1a2e] to-[#16213e] p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8 text-center">
          🧪 Supabase 연결 테스트
        </h1>
        
        <div className="bg-gradient-to-br from-[#1a4a2e]/90 to-[#1a1a2e]/90 backdrop-blur-lg rounded-2xl p-6 border border-[#00ff88]/20 shadow-2xl">
          <h2 className="text-xl font-bold text-[#00ff88] mb-4">
            연결 상태
          </h2>
          <p className="text-white text-lg mb-6">{connectionStatus}</p>
          
          <div className="bg-[#1a202c]/60 border border-[#00ff88]/30 p-4 rounded-lg mb-6">
            <h3 className="text-lg font-bold text-white mb-2">테스트 결과</h3>
            <p className="text-gray-300">{testResult}</p>
          </div>
          
          <div className="space-y-4">
            <button
              onClick={testSupabaseConnection}
              className="w-full bg-[#00ff88] hover:bg-[#00cc6a] text-black font-bold py-3 px-4 rounded-lg transition-all duration-200"
            >
              🔄 연결 재테스트
            </button>
          </div>
        </div>
        
        <div className="mt-8 text-center">
          <a 
            href="/"
            className="text-[#00ff88] hover:text-[#00cc6a] transition-colors duration-200"
          >
            ← 메인 페이지로 돌아가기
          </a>
        </div>
      </div>
    </div>
  )
}

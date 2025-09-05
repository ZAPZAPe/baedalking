'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function ClearDataPage() {
  const [isClearing, setIsClearing] = useState(false)
  const [result, setResult] = useState<string>('')
  const router = useRouter()

  const clearAllData = () => {
    setIsClearing(true)
    setResult('')

    try {
      // 로컬스토리지에서 모든 배달킹 관련 데이터 삭제
      const keysToRemove = []
      
      // 모든 키를 확인하여 배달킹 관련 데이터 찾기
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && (
          key.startsWith('decoration-') ||
          key.startsWith('baedalking-') ||
          key.startsWith('user-') ||
          key.includes('inventory') ||
          key.includes('garage') ||
          key.includes('earnings') ||
          key.includes('boxes')
        )) {
          keysToRemove.push(key)
        }
      }
      
      let deletedCount = 0
      
      // 관련 데이터 삭제
      keysToRemove.forEach(key => {
        localStorage.removeItem(key)
        deletedCount++
      })
      
      setResult(`✅ 총 ${deletedCount}개의 로컬 데이터가 삭제되었습니다!\n\n🗑️ 삭제된 데이터:\n${keysToRemove.join('\n')}\n\n💡 이제 모든 데이터는 Supabase에 저장됩니다!`)
      
    } catch (error) {
      setResult('❌ 데이터 삭제 중 오류가 발생했습니다.')
    } finally {
      setIsClearing(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a0a] via-[#1a1a2e] to-[#16213e] text-white flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-700 rounded-xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-4">
              🗑️ 데이터 초기화
            </h1>
            <p className="text-gray-300 text-lg">
              로컬스토리지의 모든 데이터를 삭제하고 Supabase로 완전 전환합니다
            </p>
          </div>

          <div className="space-y-6">
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
              <h3 className="text-yellow-400 font-semibold mb-2">⚠️ 주의사항</h3>
              <ul className="text-yellow-200 text-sm space-y-1">
                <li>• 로컬스토리지의 모든 꾸미기 데이터가 삭제됩니다</li>
                <li>• 수입 기록, 박스, 인벤토리 등 모든 로컬 데이터가 초기화됩니다</li>
                <li>• 이 작업은 되돌릴 수 없습니다</li>
                <li>• 새로운 Supabase 데이터베이스 구조로 완전 전환됩니다</li>
              </ul>
            </div>

            <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
              <h3 className="text-green-400 font-semibold mb-2">✅ 새로운 시스템</h3>
              <ul className="text-green-200 text-sm space-y-1">
                <li>• 모든 데이터가 Supabase에 안전하게 저장됩니다</li>
                <li>• 실시간 동기화 및 백업이 지원됩니다</li>
                <li>• 더 안정적이고 확장 가능한 데이터 관리</li>
                <li>• 로컬스토리지 의존성 완전 제거</li>
              </ul>
            </div>

            <button
              onClick={clearAllData}
              disabled={isClearing}
              className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              {isClearing ? '🗑️ 삭제 중...' : '🗑️ 모든 로컬 데이터 삭제'}
            </button>

            {result && (
              <div className="bg-gray-800 border border-gray-600 rounded-lg p-4">
                <pre className="text-sm text-gray-200 whitespace-pre-wrap">
                  {result}
                </pre>
              </div>
            )}

            <div className="flex space-x-4">
              <button
                onClick={() => router.push('/')}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
              >
                🏠 홈으로 돌아가기
              </button>
              
              <button
                onClick={() => window.location.reload()}
                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
              >
                🔄 페이지 새로고침
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
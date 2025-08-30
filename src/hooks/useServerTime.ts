import { useState, useEffect } from 'react'

interface ServerTime {
  koreaDate: string
  koreaTime: string
  utc: string
  timezone: string
}

export function useServerTime(updateInterval: number = 60000) { // 기본 1분마다 업데이트
  const [serverTime, setServerTime] = useState<ServerTime | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchServerTime = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const response = await fetch('/api/time')
      const data = await response.json()
      
      if (data.success) {
        setServerTime(data)
      } else {
        throw new Error(data.error || '서버 시간을 가져올 수 없습니다.')
      }
    } catch (err) {
      console.error('서버 시간 가져오기 실패:', err)
      setError(err instanceof Error ? err.message : '알 수 없는 오류')
      
      // 폴백: 로컬 시간 사용 (한국 시간대 직접)
      const now = new Date()
      
      setServerTime({
        koreaDate: now.toLocaleDateString('ko-KR', { 
          year: 'numeric', 
          month: '2-digit', 
          day: '2-digit' 
        }).replace(/\. /g, '-').replace('.', ''),
        koreaTime: now.toLocaleTimeString('ko-KR', { 
          hour12: false,
          timeZone: 'Asia/Seoul'
        }),
        utc: now.toISOString(),
        timezone: 'Asia/Seoul (local fallback)'
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    // 초기 로드
    fetchServerTime()
    
    // 주기적 업데이트
    const interval = setInterval(fetchServerTime, updateInterval)
    
    return () => clearInterval(interval)
  }, [updateInterval])

  // 현재 날짜가 바뀌었는지 확인
  const isNewDay = (): boolean => {
    if (!serverTime) return false
    
    const now = new Date()
    const koreaNow = new Date(now.getTime() + (9 * 60 * 60 * 1000))
    const currentDate = koreaNow.toISOString().split('T')[0]
    
    return serverTime.koreaDate !== currentDate
  }

  // 수동 새로고침
  const refresh = () => {
    fetchServerTime()
  }

  return {
    serverTime,
    isLoading,
    error,
    isNewDay,
    refresh
  }
}

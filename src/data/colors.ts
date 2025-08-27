// 수익 뷰별 고정 색상 시스템
export const VIEW_COLORS = {
  DAILY: '#00ff88',     // 네온그린
  WEEKLY: '#ff6b6b',    // 빨강
  MONTHLY: '#ffd93d',   // 노랑
} as const

// 플랫폼별 색상 (각 뷰에서 공통 사용)
export const PLATFORM_COLORS = [
  { border: '#00d4ff', text: '#00d4ff' },
  { border: '#ff6b6b', text: '#ff6b6b' },
  { border: '#9c88ff', text: '#9c88ff' },
  { border: '#ffd93d', text: '#ffd93d' },
  { border: '#ff8c42', text: '#ff8c42' }
] as const

// 통계 카드별 고정 색상
export const STAT_COLORS = {
  COUNT: '#00d4ff',      // 건수 - 파란색
  DELIVERY: '#00ff88',   // 배달금액 - 녹색
  MISSION: '#9c88ff',    // 미션비 - 보라색
  PLATFORM: '#ffd93d',   // 플랫폼 - 노란색
  TREND: '#9c88ff',      // 트렌드 - 보라색
} as const

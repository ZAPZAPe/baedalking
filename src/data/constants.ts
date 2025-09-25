// 게임 데이터 상수들

// 기본 감정표현은 더 이상 사용하지 않음 - 모든 감정표현은 상점에서 구매

export const characterItems = [
  { id: 'basic', name: '기본', icon: '👤', price: 0 },
  { id: 'helmet', name: '헬멧', icon: '⛑️', price: 100 },
  { id: 'jacket', name: '자켓', icon: '🧥', price: 200 },
  { id: 'sunglasses', name: '선글라스', icon: '🕶️', price: 150 },
  { id: 'cap', name: '모자', icon: '🧢', price: 80 },
  { id: 'uniform', name: '유니폼', icon: '👕', price: 250 },
]

export const vehicles = [
  { id: 'scooter', name: '스쿠터', icon: '🛵', price: 0 },
  { id: 'bike', name: '자전거', icon: '🚲', price: 300 },
  { id: 'motorcycle', name: '오토바이', icon: '🏍️', price: 800 },
  { id: 'car', name: '자동차', icon: '🚗', price: 1500 },
  { id: 'truck', name: '트럭', icon: '🚚', price: 2000 },
  { id: 'ebike', name: '전기바이크', icon: '⚡🚲', price: 600 },
]

export const backgrounds = [
  { id: 'background', name: '기본 차고', icon: '🏠', price: 0 },
  { id: 'background1', name: '도시 차고', icon: '🏢', price: 200 },
  { id: 'background2', name: '야외 차고', icon: '🌳', price: 300 },
  { id: 'background3', name: '공업 차고', icon: '🏭', price: 500 },
  { id: 'background4', name: '럭셔리 차고', icon: '✨', price: 1000 }
]

export const platforms = [
  { id: 'baemin', name: '배민', icon: '/baemin-logo.svg', color: '#00C851' },
  { id: 'coupang', name: '쿠팡', icon: '/coupang-logo.svg', color: '#0078D4' }
]

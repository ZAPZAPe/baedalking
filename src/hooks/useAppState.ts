'use client'

import { useState, useEffect } from 'react'

export interface Platform {
  id: string
  name: string
  icon: string
  color: string
  bgColor: string
  isActive: boolean
  type: 'default' | 'custom'
}

export interface AppState {
  // 상태들
  currentEmotion: string
  setCurrentEmotion: (emotion: string) => void
  speechText: string
  setSpeechText: (text: string) => void

  showCustomizePanel: boolean
  setShowCustomizePanel: (show: boolean) => void
  showIncomePanel: boolean
  setShowIncomePanel: (show: boolean) => void
  showIncomeInputPanel: boolean
  setShowIncomeInputPanel: (show: boolean) => void
  showHeaderCharacterPanel: boolean
  setShowHeaderCharacterPanel: (show: boolean) => void
  showCharacterItemPanel: boolean
  setShowCharacterItemPanel: (show: boolean) => void
  showVehicleItemPanel: boolean
  setShowVehicleItemPanel: (show: boolean) => void
  showBackgroundItemPanel: boolean
  setShowBackgroundItemPanel: (show: boolean) => void
  currentCharacterItem: string
  setCurrentCharacterItem: (item: string) => void
  currentVehicle: string
  setCurrentVehicle: (vehicle: string) => void
  currentBackground: string
  setCurrentBackground: (background: string) => void
  activeTab: string
  setActiveTab: (tab: string) => void
  incomeCount: string
  setIncomeCount: (count: string) => void
  incomeAmount: string
  setIncomeAmount: (amount: string) => void
  missionAmount: string
  setMissionAmount: (amount: string) => void
  incomeImage: File | null
  setIncomeImage: (image: File | null) => void
  selectedPlatform: string
  setSelectedPlatform: (platform: string) => void
  dailyIncomeData: { [key: string]: { date: string; platforms: { [key: string]: { count: number; deliveryAmount: number; missionAmount: number } }; hasImage: boolean; totalCount: number; totalAmount: number } }
  setDailyIncomeData: (data: { [key: string]: { date: string; platforms: { [key: string]: { count: number; deliveryAmount: number; missionAmount: number } }; hasImage: boolean; totalCount: number; totalAmount: number } }) => void
  incomeRecords: { id: number; platform: string; count: number; deliveryAmount: number; missionAmount: number; amount: number; date: string }[]
  setIncomeRecords: (records: { id: number; platform: string; count: number; deliveryAmount: number; missionAmount: number; amount: number; date: string }[]) => void
  totalPoints: number
  setTotalPoints: (points: number) => void
  userLevel: number
  setUserLevel: (level: number) => void
  userNickname: string
  setUserNickname: (nickname: string) => void
  userLocation: string
  setUserLocation: (location: string) => void
  currentWeather: { temp: number; condition: string }
  setCurrentWeather: (weather: { temp: number; condition: string }) => void
  todayVisitors: number
  setTodayVisitors: (visitors: number) => void
  totalVisitors: number
  setTotalVisitors: (visitors: number) => void
  isClient: boolean
  setIsClient: (isClient: boolean) => void
  garageIntro: string
  setGarageIntro: (intro: string) => void
  isVerified: boolean
  setIsVerified: (isVerified: boolean) => void
  level: number
  setLevel: (level: number) => void
  
  // 친구/소셜 관련 상태들
  friends: { id: number; name: string; level: number; totalIncome: number; isOnline: boolean; avatar: string }[]
  setFriends: (friends: { id: number; name: string; level: number; totalIncome: number; isOnline: boolean; avatar: string }[]) => void
  friendRequests: { id: number; name: string; level: number; message: string }[]
  setFriendRequests: (requests: { id: number; name: string; level: number; message: string }[]) => void
  socialFeed: { id: number; userId: number; userName: string; action: string; points: number; timestamp: string }[]
  setSocialFeed: (feed: { id: number; userId: number; userName: string; action: string; points: number; timestamp: string }[]) => void
  
  // 계산된 값들과 함수들
  getTotalIncomeByPlatform: (platform: string) => number
  totalIncome: number
  getWeatherIcon: (condition: string) => string
  addPoints: (amount: number, reason?: string) => void
  usePoints: (amount: number, item?: string) => boolean
  canAfford: (price: number) => boolean

  // 플랫폼 설정 상태
  platforms: Platform[]
  setPlatforms: (platforms: Platform[]) => void
  togglePlatform: (platformId: string) => void
  addCustomPlatform: (name: string) => void
  removeCustomPlatform: (platformId: string) => void
  
  // 목표 설정 상태
  dailyGoal: number
  weeklyGoal: number
  monthlyGoal: number
  updateGoals: (daily: number, weekly: number, monthly: number) => void
}

export function useAppState() {
  // 기본 상태들
  const [currentEmotion, setCurrentEmotion] = useState('happy')
  const [speechText, setSpeechText] = useState('안녕하세요!')

  const [showCustomizePanel, setShowCustomizePanel] = useState(false)
  const [showIncomePanel, setShowIncomePanel] = useState(false)
  const [showIncomeInputPanel, setShowIncomeInputPanel] = useState(false)
  const [showHeaderCharacterPanel, setShowHeaderCharacterPanel] = useState(false)
  const [showCharacterItemPanel, setShowCharacterItemPanel] = useState(false)
  const [showVehicleItemPanel, setShowVehicleItemPanel] = useState(false)
  const [showBackgroundItemPanel, setShowBackgroundItemPanel] = useState(false)
  const [currentCharacterItem, setCurrentCharacterItem] = useState('basic')
  const [currentVehicle, setCurrentVehicle] = useState('scooter')
  const [currentBackground, setCurrentBackground] = useState('background')
  const [activeTab, setActiveTab] = useState('home')
  
  // 수입 기록 관련 상태
  const [incomeCount, setIncomeCount] = useState('')
  const [incomeAmount, setIncomeAmount] = useState('')
  const [missionAmount, setMissionAmount] = useState('')
  const [incomeImage, setIncomeImage] = useState<File | null>(null)
  const [selectedPlatform, setSelectedPlatform] = useState('baemin')
  const [incomeDate, setIncomeDate] = useState(new Date().toISOString().split('T')[0]) // 오늘 날짜를 기본값으로
  
  // 목표 설정 상태
  const [dailyGoal, setDailyGoal] = useState(50000)
  const [weeklyGoal, setWeeklyGoal] = useState(350000)
  const [monthlyGoal, setMonthlyGoal] = useState(1500000)
  
  // 친구/소셜 관련 상태
  const [friends, setFriends] = useState([
    { id: 1, name: '배달킹1', level: 15, totalIncome: 150000, isOnline: true, avatar: '👨‍💼' },
    { id: 2, name: '배달킹2', level: 12, totalIncome: 120000, isOnline: false, avatar: '👩‍💼' },
    { id: 3, name: '배달킹3', level: 18, totalIncome: 180000, isOnline: true, avatar: '👨‍💼' }
  ])
  const [friendRequests, setFriendRequests] = useState([
    { id: 1, name: '새친구1', level: 10, message: '친구가 되어요!' }
  ])
  const [socialFeed, setSocialFeed] = useState([
    { id: 1, userId: 1, userName: '배달킹1', action: '오늘 5건 완료!', points: 25, timestamp: '2시간 전' },
    { id: 2, userId: 2, userName: '배달킹2', action: '레벨업 달성!', points: 50, timestamp: '4시간 전' },
    { id: 3, userId: 3, userName: '배달킹3', action: '주간 목표 달성!', points: 100, timestamp: '1일 전' }
  ])
  
  // 날짜별 수입 데이터 (덮어쓰기 방식)
  const [dailyIncomeData, setDailyIncomeData] = useState({
    [new Date().toISOString().split('T')[0]]: {
      date: new Date().toISOString().split('T')[0],
      platforms: {
        baemin: { count: 3, deliveryAmount: 10000, missionAmount: 5000 },
        coupang: { count: 2, deliveryAmount: 8000, missionAmount: 4000 },
        other: { count: 0, deliveryAmount: 0, missionAmount: 0 }
      },
      hasImage: true,
      totalCount: 5,
      totalAmount: 27000
    }
  })
  
  // 수입 기록 상태 - 로컬스토리지에서 로드
  const [incomeRecords, setIncomeRecords] = useState<{ id: number; platform: string; count: number; deliveryAmount: number; missionAmount: number; amount: number; date: string }[]>([])
  
  const [totalPoints, setTotalPoints] = useState(1234)
  const [userLevel, setUserLevel] = useState(10)
  const [userNickname, setUserNickname] = useState('배달킹')
  const [userLocation, setUserLocation] = useState('서울')
  const [currentWeather, setCurrentWeather] = useState({ temp: 22, condition: 'sunny' })
  const [todayVisitors, setTodayVisitors] = useState(12)
  const [totalVisitors, setTotalVisitors] = useState(247)
  const [isClient, setIsClient] = useState(false)
  const [garageIntro, setGarageIntro] = useState('열심히 달리는 배달킹입니다! 🛵💨')
  const [isVerified, setIsVerified] = useState(true) // 인증 상태 (임시로 true 설정)
  const [level, setLevel] = useState(1) // 플레이어 레벨

  // 플랫폼 설정 상태
  const [platforms, setPlatforms] = useState<Platform[]>([
    { id: 'baemin', name: '배민', icon: '/baemin-logo.svg', color: '#00C851', bgColor: '#00C851/20', isActive: true, type: 'default' as const },
    { id: 'coupang', name: '쿠팡', icon: '/coupang-logo.svg', color: '#E4002B', bgColor: '#E4002B/20', isActive: true, type: 'default' as const }
  ])

  // 플랫폼 활성화/비활성화
  const togglePlatform = (platformId: string) => {
    setPlatforms(prev => prev.map(p => 
      p.id === platformId ? { ...p, isActive: !p.isActive } : p
    ))
  }

  // 커스텀 플랫폼 추가
  const addCustomPlatform = (name: string) => {
    if (platforms.length >= 5) return // 최대 5개 제한
    
    const newPlatform: Platform = {
      id: `custom_${Date.now()}`,
      name,
      icon: '📋',
      color: '#9C88FF',
      bgColor: '#9C88FF/20',
      isActive: true,
      type: 'custom'
    }
    
    setPlatforms(prev => [...prev, newPlatform])
  }

  // 커스텀 플랫폼 제거
  const removeCustomPlatform = (platformId: string) => {
    setPlatforms(prev => prev.filter(p => p.id !== platformId))
  }
  
  // 목표 설정 업데이트
  const updateGoals = (daily: number, weekly: number, monthly: number) => {
    setDailyGoal(daily)
    setWeeklyGoal(weekly)
    setMonthlyGoal(monthly)
  }

  // 클라이언트에서만 실행
  useEffect(() => {
    setIsClient(true)
  }, [])

  // 계산된 값들 (로컬 시간 기준)
  const todayDate = new Date()
  const today = `${todayDate.getFullYear()}-${String(todayDate.getMonth() + 1).padStart(2, '0')}-${String(todayDate.getDate()).padStart(2, '0')}`
  
  const getTotalIncomeByPlatform = (platform: string) => {
    return incomeRecords
      .filter(record => record.platform === platform && record.date === today)
      .reduce((sum, record) => sum + record.amount, 0)
  }

  // 오늘의 총 수입 계산 (amount는 이미 deliveryAmount + missionAmount)
  const totalIncome = incomeRecords
    .filter(record => record.date === today)
    .reduce((sum, record) => sum + record.amount, 0)

  // 날씨 아이콘 반환 함수
  const getWeatherIcon = (condition: string) => {
    switch (condition) {
      case 'sunny': return '☀️'
      case 'cloudy': return '☁️'
      case 'rainy': return '🌧️'
      case 'snowy': return '❄️'
      case 'windy': return '💨'
      default: return '☀️'
    }
  }

  // 포인트 시스템 함수들
  const addPoints = (amount: number, reason = '') => {
    setTotalPoints(prev => prev + amount)
    console.log(`💎 +${amount} 포인트 획득! ${reason}`)
  }

  const usePoints = (amount: number, item = '') => {
    if (totalPoints >= amount) {
      setTotalPoints(prev => prev - amount)
      console.log(`💎 -${amount} 포인트 사용! ${item}`)
      return true
    } else {
      console.log(`💎 포인트가 부족합니다! (필요: ${amount}, 보유: ${totalPoints})`)
      return false
    }
  }

  const canAfford = (price: number) => totalPoints >= price

  // 로컬스토리지에서 플랫폼 설정과 수입 기록 불러오기
  useEffect(() => {
    try {
      // 플랫폼 설정 로드
      const savedPlatforms = localStorage.getItem('userPlatforms')
      if (savedPlatforms) {
        const parsedPlatforms = JSON.parse(savedPlatforms)
        setPlatforms(parsedPlatforms)
        console.log('✅ 저장된 플랫폼 설정 로드 완료:', parsedPlatforms.map((p: Platform) => `${p.name}(${p.isActive ? '활성' : '비활성'})`))
      } else {
        const defaultPlatforms: Platform[] = [
          { id: 'baemin', name: '배민', icon: '/baemin-logo.svg', color: '#00C851', bgColor: '#00C851/20', isActive: true, type: 'default' as const },
          { id: 'coupang', name: '쿠팡', icon: '/coupang-logo.svg', color: '#E4002B', bgColor: '#E4002B/20', isActive: true, type: 'default' as const }
        ]
        setPlatforms(defaultPlatforms)
        localStorage.setItem('userPlatforms', JSON.stringify(defaultPlatforms))
        console.log('✅ 기본 플랫폼 설정 완료:', defaultPlatforms.map(p => `${p.name}(${p.type})`))
      }

      // 수입 기록 로드
      const savedIncomeRecords = localStorage.getItem('userIncomeRecords')
      if (savedIncomeRecords) {
        const parsedRecords = JSON.parse(savedIncomeRecords)
        setIncomeRecords(parsedRecords)
        console.log('✅ 저장된 수입 기록 로드 완료:', parsedRecords.length, '건')
      } else {
        // 기본 테스트 데이터 (첫 실행시에만)
        const defaultRecords = [
          { 
            id: Date.now(), 
            platform: 'baemin', 
            count: 3, 
            deliveryAmount: 10000,
            missionAmount: 5000,
            amount: 15000, 
            date: new Date().toISOString().split('T')[0]
          },
          { 
            id: Date.now() + 1, 
            platform: 'coupang', 
            count: 2, 
            deliveryAmount: 8000,
            missionAmount: 4000,
            amount: 12000, 
            date: new Date().toISOString().split('T')[0]
          }
        ]
        setIncomeRecords(defaultRecords)
        localStorage.setItem('userIncomeRecords', JSON.stringify(defaultRecords))
        console.log('✅ 기본 수입 기록 설정 완료:', defaultRecords.length, '건')
      }
    } catch (error) {
      console.error('설정 로드 실패:', error)
      // 에러 발생시 기본값 사용
      const defaultPlatforms: Platform[] = [
        { id: 'baemin', name: '배민', icon: '/baemin-logo.svg', color: '#00C851', bgColor: '#00C851/20', isActive: true, type: 'default' as const },
        { id: 'coupang', name: '쿠팡', icon: '/coupang-logo.svg', color: '#E4002B', bgColor: '#E4002B/20', isActive: true, type: 'default' as const }
      ]
      setPlatforms(defaultPlatforms)
      localStorage.setItem('userPlatforms', JSON.stringify(defaultPlatforms))
      
      const defaultRecords = [
        { 
          id: Date.now(), 
          platform: 'baemin', 
          count: 3, 
          deliveryAmount: 10000,
          missionAmount: 5000,
          amount: 15000, 
          date: new Date().toISOString().split('T')[0]
        }
      ]
      setIncomeRecords(defaultRecords)
      localStorage.setItem('userIncomeRecords', JSON.stringify(defaultRecords))
    }
  }, [])

  // 플랫폼 설정 변경시 로컬스토리지에 저장
  useEffect(() => {
    localStorage.setItem('userPlatforms', JSON.stringify(platforms))
  }, [platforms])

  // 수입 기록 변경시 로컬스토리지에 저장
  useEffect(() => {
    if (incomeRecords.length > 0) {
      localStorage.setItem('userIncomeRecords', JSON.stringify(incomeRecords))
      console.log('💾 수입 기록 저장 완료:', incomeRecords.length, '건')
      console.log('📊 저장된 데이터:', incomeRecords)
    }
  }, [incomeRecords])

  return {
    // 상태들
    currentEmotion, setCurrentEmotion,
    speechText, setSpeechText,

    showCustomizePanel, setShowCustomizePanel,
    showIncomePanel, setShowIncomePanel,
    showIncomeInputPanel, setShowIncomeInputPanel,
    showHeaderCharacterPanel, setShowHeaderCharacterPanel,
    showCharacterItemPanel, setShowCharacterItemPanel,
    showVehicleItemPanel, setShowVehicleItemPanel,
    showBackgroundItemPanel, setShowBackgroundItemPanel,
    currentCharacterItem, setCurrentCharacterItem,
    currentVehicle, setCurrentVehicle,
    currentBackground, setCurrentBackground,
    activeTab, setActiveTab,
    incomeCount, setIncomeCount,
    incomeAmount, setIncomeAmount,
    missionAmount, setMissionAmount,
    incomeImage, setIncomeImage,
    selectedPlatform, setSelectedPlatform,
    incomeDate, setIncomeDate,
    dailyIncomeData, setDailyIncomeData,
    incomeRecords, setIncomeRecords,
    totalPoints, setTotalPoints,
    userLevel, setUserLevel,
    userNickname, setUserNickname,
    userLocation, setUserLocation,
    currentWeather, setCurrentWeather,
    todayVisitors, setTodayVisitors,
    totalVisitors, setTotalVisitors,
    isClient, setIsClient,
    garageIntro, setGarageIntro,
    isVerified, setIsVerified,
    level, setLevel,
    
    // 친구/소셜 관련 상태들
    friends, setFriends,
    friendRequests, setFriendRequests,
    socialFeed, setSocialFeed,
    
    // 계산된 값들과 함수들
    getTotalIncomeByPlatform,
    totalIncome,
    getWeatherIcon,
    addPoints,
    usePoints,
    canAfford,

    // 플랫폼 설정 상태
    platforms,
    setPlatforms,
    togglePlatform,
    addCustomPlatform,
    removeCustomPlatform,
    
    // 목표 설정 상태
    dailyGoal,
    weeklyGoal,
    monthlyGoal,
    updateGoals
  }
}

'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { IncomeRecord } from '@/types'

export interface Platform {
  id: string
  name: string
  icon: string
  color: string
  bgColor: string
  isActive: boolean
  type: 'default' | 'custom'
}

// IncomeRecord 타입은 @/types에서 가져옴

export interface User {
  id: string
  kakao_id: string
  email: string
  nickname: string
  region: string
  avatar_config: any
  garage_config: any
  status_message?: string
  is_income_private: boolean
  platforms: Platform[]
  goals: {
    daily: number
    weekly: number
    monthly: number
  }
  total_visitors: number
  daily_visitors: number
}

export interface AppState {
  // 사용자 정보
  user: User | null
  setUser: (user: User | null) => void
  
  // UI 상태들 (기존과 동일)
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
  
  // 수입 입력 상태
  incomeCount: string
  setIncomeCount: (count: string) => void
  incomeAmount: string
  setIncomeAmount: (amount: string) => void
  missionAmount: string
  setMissionAmount: (amount: string) => void
  selectedPlatform: string
  setSelectedPlatform: (platform: string) => void
  
  // 수입 기록 (Supabase 중심)
  incomeRecords: IncomeRecord[]
  setIncomeRecords: (records: IncomeRecord[]) => void
  loadIncomeRecords: () => Promise<void>
  saveIncomeRecord: (record: Omit<IncomeRecord, 'id' | 'created_at' | 'total_amount'>) => Promise<boolean>
  
  // 계산된 값들
  totalIncome: number
  todayIncome: number
  
  // 기타 상태들 (기존과 동일)
  totalPoints: number
  setTotalPoints: (points: number) => void
  userLevel: number
  setUserLevel: (level: number) => void
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
  
  // 플랫폼 관리
  platforms: Platform[]
  setPlatforms: (platforms: Platform[]) => void
  togglePlatform: (platformId: string) => void
  addCustomPlatform: (name: string) => void
  removeCustomPlatform: (platformId: string) => void
  
  // 친구/소셜 관련 (기존과 동일)
  friends: { id: number; name: string; level: number; totalIncome: number; isOnline: boolean; avatar: string }[]
  setFriends: (friends: { id: number; name: string; level: number; totalIncome: number; isOnline: boolean; avatar: string }[]) => void
  friendRequests: { id: number; name: string; level: number; message: string }[]
  setFriendRequests: (requests: { id: number; name: string; level: number; message: string }[]) => void
  socialFeed: { id: number; userId: number; userName: string; action: string; points: number; timestamp: string }[]
  setSocialFeed: (feed: { id: number; userId: number; userName: string; action: string; points: number; timestamp: string }[]) => void
  
  // 목표 설정
  dailyGoal: number
  weeklyGoal: number
  monthlyGoal: number
  updateGoals: (daily: number, weekly: number, monthly: number) => void
  
  // 유틸리티 함수들
  getWeatherIcon: (condition: string) => string
  addPoints: (amount: number, reason?: string) => void
  usePoints: (amount: number, item?: string) => boolean
  canAfford: (price: number) => boolean
}

export function useAppState(): AppState {
  // 🔥 핵심 변경: 사용자 정보 Supabase 중심
  const [user, setUser] = useState<User | null>(null)
  
  // 기본 UI 상태들 (기존과 동일)
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
  
  // 수입 입력 상태
  const [incomeCount, setIncomeCount] = useState('')
  const [incomeAmount, setIncomeAmount] = useState('')
  const [missionAmount, setMissionAmount] = useState('')
  const [selectedPlatform, setSelectedPlatform] = useState('baemin')
  
  // 🔥 핵심 변경: 수입 기록 Supabase 중심
  const [incomeRecords, setIncomeRecords] = useState<IncomeRecord[]>([])
  
  // 기타 상태들
  const [totalPoints, setTotalPoints] = useState(0)
  const [userLevel, setUserLevel] = useState(1)
  const [currentWeather, setCurrentWeather] = useState({ temp: 22, condition: 'sunny' })
  const [todayVisitors, setTodayVisitors] = useState(12)
  const [totalVisitors, setTotalVisitors] = useState(247)
  const [isClient, setIsClient] = useState(false)
  const [garageIntro, setGarageIntro] = useState('열심히 달리는 배달킹입니다! 🛵💨')
  
  // 플랫폼 상태 (사용자별로 관리)
  const [platforms, setPlatforms] = useState<Platform[]>([
    { id: 'baemin', name: '배민', icon: '/baemin-logo.svg', color: '#00C851', bgColor: '#00C851/20', isActive: true, type: 'default' },
    { id: 'coupang', name: '쿠팡', icon: '/coupang-logo.svg', color: '#E4002B', bgColor: '#E4002B/20', isActive: true, type: 'default' }
  ])
  
  // 목표 설정
  const [dailyGoal, setDailyGoal] = useState(50000)
  const [weeklyGoal, setWeeklyGoal] = useState(350000)
  const [monthlyGoal, setMonthlyGoal] = useState(1500000)
  
  // 친구/소셜 상태 - 실제 데이터는 DB에서 로드
  const [friends, setFriends] = useState<{ id: number; name: string; level: number; totalIncome: number; isOnline: boolean; avatar: string }[]>([])
  const [friendRequests, setFriendRequests] = useState<{ id: number; name: string; level: number; message: string }[]>([])
  const [socialFeed, setSocialFeed] = useState<{ id: number; userId: number; userName: string; action: string; points: number; timestamp: string }[]>([])

  // 🔥 핵심 변경: Supabase에서 수입 기록 로드
  const loadIncomeRecords = async () => {
    if (!user?.id) return
    
    try {
      const { data, error } = await supabase
        .from('earnings')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      
      if (error) {
        console.error('수입 기록 로드 오류:', error)
        return
      }
      
      const formattedRecords: IncomeRecord[] = data.map(record => ({
        id: record.id,
        platform: record.platform,
        delivery_count: record.delivery_count,
        delivery_amount: record.delivery_amount,
        mission_amount: record.mission_amount,
        total_amount: record.total_amount,
        date: record.date,
        created_at: record.created_at
      }))
      
      setIncomeRecords(formattedRecords)
      console.log('✅ 수입 기록 로드 완료:', formattedRecords.length, '건')
      
      // 로컬 스토리지에 캐싱
      localStorage.setItem('cached_income_records', JSON.stringify(formattedRecords))
      
    } catch (error) {
      console.error('수입 기록 로드 실패:', error)
      
      // 실패시 로컬 캐시에서 로드
      try {
        const cached = localStorage.getItem('cached_income_records')
        if (cached) {
          const cachedRecords = JSON.parse(cached)
          setIncomeRecords(cachedRecords)
          console.log('📱 캐시된 수입 기록 로드:', cachedRecords.length, '건')
        }
      } catch (cacheError) {
        console.error('캐시 로드 실패:', cacheError)
      }
    }
  }

  // 🔥 핵심 변경: Supabase에 수입 기록 저장
  const saveIncomeRecord = async (record: Omit<IncomeRecord, 'id' | 'created_at' | 'total_amount'>): Promise<boolean> => {
    if (!user?.id) {
      console.error('사용자 정보가 없습니다.')
      return false
    }
    
    try {
      const { data, error } = await supabase
        .from('earnings')
        .insert({
          user_id: user.id,
          platform: record.platform,
          delivery_count: record.delivery_count,
          delivery_amount: record.delivery_amount,
          mission_amount: record.mission_amount,
          date: record.date
        })
        .select()
        .single()
      
      if (error) {
        console.error('수입 기록 저장 오류:', error)
        return false
      }
      
      console.log('✅ 수입 기록 저장 완료:', data)
      
      // 수입 기록 다시 로드
      await loadIncomeRecords()
      
      // 포인트 추가
      const earnedPoints = (record.delivery_count * 5) + Math.floor((record.delivery_amount + record.mission_amount) * 0.01)
      addPoints(earnedPoints, '수입 기록 등록')
      
      return true
      
    } catch (error) {
      console.error('수입 기록 저장 실패:', error)
      return false
    }
  }

  // 계산된 값들
  const today = new Date().toISOString().split('T')[0]
  const todayRecords = incomeRecords.filter(record => record.date === today)
  const todayIncome = todayRecords.reduce((sum, record) => sum + record.total_amount, 0)
  const totalIncome = incomeRecords.reduce((sum, record) => sum + record.total_amount, 0)

  // 클라이언트 사이드 확인
  useEffect(() => {
    setIsClient(true)
  }, [])

  // 🔥 핵심 변경: 사용자 정보 변경시 데이터 로드
  useEffect(() => {
    if (user?.id) {
      loadIncomeRecords()
      
      // 사용자별 설정 로드
      if (user.platforms) {
        setPlatforms(user.platforms)
      }
      if (user.goals) {
        setDailyGoal(user.goals.daily)
        setWeeklyGoal(user.goals.weekly)
        setMonthlyGoal(user.goals.monthly)
      }
    }
  }, [user?.id])

  // 플랫폼 관리 함수들
  const togglePlatform = (platformId: string) => {
    setPlatforms(prev => prev.map(p => 
      p.id === platformId ? { ...p, isActive: !p.isActive } : p
    ))
  }

  const addCustomPlatform = (name: string) => {
    if (platforms.length >= 5) return
    
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

  const removeCustomPlatform = (platformId: string) => {
    setPlatforms(prev => prev.filter(p => p.id !== platformId))
  }

  // 목표 설정
  const updateGoals = (daily: number, weekly: number, monthly: number) => {
    setDailyGoal(daily)
    setWeeklyGoal(weekly)
    setMonthlyGoal(monthly)
  }

  // 유틸리티 함수들 (기존과 동일)
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

  return {
    // 사용자 정보
    user, setUser,
    
    // UI 상태들
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
    
    // 수입 입력
    incomeCount, setIncomeCount,
    incomeAmount, setIncomeAmount,
    missionAmount, setMissionAmount,
    selectedPlatform, setSelectedPlatform,
    
    // 수입 기록 (Supabase 중심)
    incomeRecords, setIncomeRecords,
    loadIncomeRecords, saveIncomeRecord,
    
    // 계산된 값들
    totalIncome, todayIncome,
    
    // 기타
    totalPoints, setTotalPoints,
    userLevel, setUserLevel,
    currentWeather, setCurrentWeather,
    todayVisitors, setTodayVisitors,
    totalVisitors, setTotalVisitors,
    isClient, setIsClient,
    garageIntro, setGarageIntro,
    
    // 플랫폼
    platforms, setPlatforms,
    togglePlatform, addCustomPlatform, removeCustomPlatform,
    
    // 친구/소셜
    friends, setFriends,
    friendRequests, setFriendRequests,
    socialFeed, setSocialFeed,
    
    // 목표
    dailyGoal, weeklyGoal, monthlyGoal, updateGoals,
    
    // 유틸리티
    getWeatherIcon, addPoints, usePoints, canAfford
  }
}

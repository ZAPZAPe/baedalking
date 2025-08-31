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
  platforms: {
    baemin: boolean
    coupang: boolean
  }
  goals: {
    daily: number
    weekly: number
    monthly: number
  }
  total_visitors: number
  daily_visitors: number
  created_at?: string
  updated_at?: string
}

// 모달 타입 정의
export type ModalType = 
  | 'none'
  | 'customize'
  | 'income'
  | 'incomeInput'
  | 'headerCharacter'
  | 'characterItem'
  | 'vehicleItem'
  | 'backgroundItem'
  | 'goalSettings'
  | 'platformSettings'
  | 'incomeDetail'
  | 'incomeEdit'
  | 'friendDetail'
  | 'topRankerProfile'
  | 'gradeDetail'
  | 'rankingDetail'
  | 'privacyPolicy'
  | 'termsOfService'
  | 'friends'
  | 'userProfile'
  | 'guestbook'
  | 'deleteAccount'

export interface AppState {
  // 사용자 정보
  user: User | null
  setUser: (user: User | null) => void
  
  // 중앙화된 모달 관리
  activeModal: ModalType
  setActiveModal: (modal: ModalType) => void
  openModal: (modal: ModalType) => void
  closeModal: () => void
  
  // UI 상태들 (기존과 동일 - 하위 호환성 유지)
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
  deleteIncomeRecord: (recordId: string) => Promise<boolean>
  
  // 계산된 값들
  totalIncome: number
  todayIncome: number
  
  // 기타 상태들 (기존과 동일)
  totalBoxes: number
  setTotalBoxes: (boxes: number) => void
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
  friendRequests: { id: number | string; name: string; level: number; message: string; friendId?: string }[]
  setFriendRequests: (requests: { id: number | string; name: string; level: number; message: string; friendId?: string }[]) => void
  socialFeed: { id: number; userId: number; userName: string; action: string; boxes: number; timestamp: string }[]
  setSocialFeed: (feed: { id: number; userId: number; userName: string; action: string; boxes: number; timestamp: string }[]) => void
  
  // 목표 설정
  dailyGoal: number
  weeklyGoal: number
  monthlyGoal: number
  updateGoals: (daily: number, weekly: number, monthly: number) => Promise<boolean>
  
  // 유틸리티 함수들
  getWeatherIcon: (condition: string) => string
  addBoxes: (amount: number, reason?: string) => void
  useBoxes: (amount: number, item?: string) => boolean
  canAfford: (price: number) => boolean
}

export function useAppState(): AppState {
  // 🔥 핵심 변경: 사용자 정보 Supabase 중심
  const [user, setUser] = useState<User | null>(null)
  
  // 🆕 중앙화된 모달 관리
  const [activeModal, setActiveModal] = useState<ModalType>('none')
  
  // 기본 UI 상태들 (기존과 동일 - 하위 호환성 유지)
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
  const [totalBoxes, setTotalBoxes] = useState(0)
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
  const [friendRequests, setFriendRequests] = useState<{ id: number | string; name: string; level: number; message: string; friendId?: string }[]>([])
  const [socialFeed, setSocialFeed] = useState<{ id: number; userId: number; userName: string; action: string; boxes: number; timestamp: string }[]>([])

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
        count: record.delivery_count, // DailyView에서 사용하는 필드명으로 매핑
        amount: record.delivery_amount, // DailyView에서 사용하는 필드명으로 매핑
        missionAmount: record.mission_amount, // DailyView에서 사용하는 필드명으로 매핑
        delivery_count: record.delivery_count, // 기존 호환성 유지
        delivery_amount: record.delivery_amount, // 기존 호환성 유지
        mission_amount: record.mission_amount, // 기존 호환성 유지
        total_amount: record.total_amount,
        date: record.date,
        created_at: record.created_at
      }))
      
      setIncomeRecords(formattedRecords)
      console.log('✅ 수입 기록 로드 완료:', formattedRecords.length, '건')
      console.log('📊 로드된 수입 기록:', formattedRecords)
      console.log('💰 총 수입:', formattedRecords.reduce((sum, r) => sum + r.total_amount, 0))
      
    } catch (error) {
      console.error('❌ 수입 기록 로드 실패:', error)
      // localStorage 캐싱 제거 - Supabase만 사용
    }
  }

  // 🔥 핵심 변경: Supabase에 수입 기록 저장 (중복 방지)
  const saveIncomeRecord = async (record: Omit<IncomeRecord, 'id' | 'created_at' | 'total_amount'>): Promise<boolean> => {
    if (!user?.id) {
      console.error('사용자 정보가 없습니다.')
      return false
    }
    
    try {
      // 1. 먼저 같은 날짜 + 같은 플랫폼 데이터가 있는지 확인
      const { data: existingData, error: checkError } = await supabase
        .from('earnings')
        .select('*')
        .eq('user_id', user.id)
        .eq('platform', record.platform)
        .eq('date', record.date)
        .maybeSingle()
      
      if (checkError) {
        console.error('기존 데이터 확인 오류:', checkError)
        return false
      }
      
      let data, error
      
      if (existingData) {
        // 2. 기존 데이터가 있으면 업데이트
        console.log('🔄 기존 수입 기록 업데이트:', existingData.id)
        const updateResult = await supabase
          .from('earnings')
          .update({
            delivery_count: record.delivery_count,
            delivery_amount: record.delivery_amount,
            mission_amount: record.mission_amount,
          })
          .eq('id', existingData.id)
          .select()
          .single()
        
        data = updateResult.data
        error = updateResult.error
      } else {
        // 3. 기존 데이터가 없으면 새로 생성
        console.log('✨ 새 수입 기록 생성')
        const insertResult = await supabase
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
        
        data = insertResult.data
        error = insertResult.error
      }
      
      if (error) {
        console.error('수입 기록 저장 오류:', error)
        return false
      }
      
      console.log('✅ 수입 기록 저장 완료:', data)
      
      // 수입 기록 다시 로드 (강제로 여러 번 실행)
      await loadIncomeRecords()
      
      // 0.5초 후 한 번 더 로드 (네트워크 지연 대비)
      setTimeout(async () => {
        await loadIncomeRecords()
        console.log('🔄 추가 데이터 로드 완료')
      }, 500)
      
      // 박스 추가
      const earnedBoxes = (record.delivery_count * 5) + Math.floor((record.delivery_amount + record.mission_amount) * 0.01)
      addBoxes(earnedBoxes, '수입 기록 등록')
      
      return true
      
    } catch (error) {
      console.error('수입 기록 저장 실패:', error)
      return false
    }
  }

  // 🗑️ 수입 기록 삭제
  const deleteIncomeRecord = async (recordId: string): Promise<boolean> => {
    if (!user?.id) {
      console.error('사용자 정보가 없습니다.')
      return false
    }
    
    try {
      const { error } = await supabase
        .from('earnings')
        .delete()
        .eq('id', recordId)
        .eq('user_id', user.id) // 보안: 본인 데이터만 삭제 가능
      
      if (error) {
        console.error('수입 기록 삭제 오류:', error)
        return false
      }
      
      console.log('✅ 수입 기록 삭제 완료:', recordId)
      
      // 수입 기록 다시 로드
      await loadIncomeRecords()
      
      return true
      
    } catch (error) {
      console.error('수입 기록 삭제 실패:', error)
      return false
    }
  }

  // 계산된 값들
  const today = new Date().toISOString().split('T')[0]

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
        // user.platforms를 Platform[] 타입으로 변환
        const convertedPlatforms: Platform[] = [
          {
            id: 'baemin',
            name: '배민',
            icon: '🍽️',
            color: '#00C851',
            bgColor: '#00C851',
            isActive: user.platforms.baemin,
            type: 'default'
          },
          {
            id: 'coupang',
            name: '쿠팡',
            icon: '📦',
            color: '#E4002B',
            bgColor: '#E4002B',
            isActive: user.platforms.coupang,
            type: 'default'
          }
        ]
        setPlatforms(convertedPlatforms)
      }
      if (user.goals) {
        setDailyGoal(user.goals.daily)
        setWeeklyGoal(user.goals.weekly)
        setMonthlyGoal(user.goals.monthly)
      }
    }
  }, [user?.id])

  // 플랫폼 관리 함수들
  const togglePlatform = async (platformId: string) => {
    if (!user?.id) return

    const updatedPlatforms = platforms.map(p => 
      p.id === platformId ? { ...p, isActive: !p.isActive } : p
    )
    
    setPlatforms(updatedPlatforms)
    
    // 서버에 저장
    try {
      const { error } = await supabase
        .from('users')
        .update({ platforms: updatedPlatforms })
        .eq('id', user.id)

      if (error) {
        console.error('플랫폼 설정 저장 실패:', error)
      } else {
        console.log('✅ 플랫폼 설정이 서버에 저장되었습니다!')
      }
    } catch (error) {
      console.error('플랫폼 설정 저장 중 오류:', error)
    }
  }

  const addCustomPlatform = async (name: string) => {
    if (platforms.length >= 5) return
    if (!user?.id) return

    // 커스텀 플랫폼용 색상 팔레트
    const customColors = [
      { color: '#FF6B6B', bgColor: '#FF6B6B' },
      { color: '#4ECDC4', bgColor: '#4ECDC4' },
      { color: '#45B7D1', bgColor: '#45B7D1' },
      { color: '#96CEB4', bgColor: '#96CEB4' },
      { color: '#FFEAA7', bgColor: '#FFEAA7' },
      { color: '#DDA0DD', bgColor: '#DDA0DD' },
      { color: '#98D8C8', bgColor: '#98D8C8' },
      { color: '#F7DC6F', bgColor: '#F7DC6F' }
    ]

    // 기존 커스텀 플랫폼 수에 따라 색상 선택
    const customPlatformCount = platforms.filter(p => p.type === 'custom').length
    const selectedColor = customColors[customPlatformCount % customColors.length]

    const newPlatform: Platform = {
      id: `custom_${Date.now()}`,
      name,
      icon: '',
      color: selectedColor.color,
      bgColor: selectedColor.bgColor,
      isActive: true,
      type: 'custom'
    }
    
    const updatedPlatforms = [...platforms, newPlatform]
    setPlatforms(updatedPlatforms)
    
    // 서버에 저장
    try {
      const { error } = await supabase
        .from('users')
        .update({ platforms: updatedPlatforms })
        .eq('id', user.id)

      if (error) {
        console.error('플랫폼 추가 저장 실패:', error)
      } else {
        console.log('✅ 플랫폼이 서버에 저장되었습니다!')
      }
    } catch (error) {
      console.error('플랫폼 추가 저장 중 오류:', error)
    }
  }

  const removeCustomPlatform = async (platformId: string) => {
    if (!user?.id) return

    const updatedPlatforms = platforms.filter(p => p.id !== platformId)
    setPlatforms(updatedPlatforms)
    
    // 서버에 저장
    try {
      const { error } = await supabase
        .from('users')
        .update({ platforms: updatedPlatforms })
        .eq('id', user.id)

      if (error) {
        console.error('플랫폼 삭제 저장 실패:', error)
      } else {
        console.log('✅ 플랫폼 삭제가 서버에 저장되었습니다!')
      }
    } catch (error) {
      console.error('플랫폼 삭제 저장 중 오류:', error)
    }
  }

  // 목표 설정
  const updateGoals = async (daily: number, weekly: number, monthly: number) => {
    if (!user?.id) {
      console.error('사용자 ID가 없어서 목표를 저장할 수 없습니다.')
      return false
    }

    try {
      // Supabase에 목표 업데이트
      const { error } = await supabase
        .from('users')
        .update({
          goals: {
            daily,
            weekly,
            monthly
          }
        })
        .eq('id', user.id)

      if (error) {
        console.error('목표 저장 실패:', error)
        return false
      }

      // 로컬 상태 업데이트
      setDailyGoal(daily)
      setWeeklyGoal(weekly)
      setMonthlyGoal(monthly)

      // 사용자 정보도 업데이트
      setUser(prev => prev ? {
        ...prev,
        goals: { daily, weekly, monthly }
      } : null)

      console.log('✅ 목표 설정이 서버에 저장되었습니다!')
      return true
    } catch (error) {
      console.error('목표 저장 중 오류:', error)
      return false
    }
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

  const addBoxes = (amount: number, reason = '') => {
    setTotalBoxes(prev => prev + amount)
    console.log(`📦 +${amount} 박스 획득! ${reason}`)
  }

  const useBoxes = (amount: number, item = '') => {
    if (totalBoxes >= amount) {
      setTotalBoxes(prev => prev - amount)
      console.log(`📦 -${amount} 박스 사용! ${item}`)
      return true
    } else {
      console.log(`📦 박스가 부족합니다! (필요: ${amount}, 보유: ${totalBoxes})`)
      return false
    }
  }

  const canAfford = (price: number) => totalBoxes >= price

  // 🆕 중앙화된 모달 관리 함수들
  const openModal = (modal: ModalType) => {
    // 기존 모달이 열려있으면 자동으로 닫고 새 모달 열기
    setActiveModal(modal)
    
    // 하위 호환성을 위해 기존 상태들도 업데이트
    setShowCustomizePanel(modal === 'customize')
    setShowIncomePanel(modal === 'income')
    setShowIncomeInputPanel(modal === 'incomeInput')
    setShowHeaderCharacterPanel(modal === 'headerCharacter')
    setShowCharacterItemPanel(modal === 'characterItem')
    setShowVehicleItemPanel(modal === 'vehicleItem')
    setShowBackgroundItemPanel(modal === 'backgroundItem')
    
    console.log(`🔄 모달 전환: ${activeModal} → ${modal}`)
  }

  const closeModal = () => {
    setActiveModal('none')
    
    // 모든 모달 상태를 false로 설정
    setShowCustomizePanel(false)
    setShowIncomePanel(false)
    setShowIncomeInputPanel(false)
    setShowHeaderCharacterPanel(false)
    setShowCharacterItemPanel(false)
    setShowVehicleItemPanel(false)
    setShowBackgroundItemPanel(false)
    
    console.log('❌ 모든 모달 닫음')
  }

  // 기존 setter들을 openModal과 연동 (하위 호환성)
  const enhancedSetShowCustomizePanel = (show: boolean) => {
    if (show) {
      openModal('customize')
    } else if (activeModal === 'customize') {
      closeModal()
    }
  }

  const enhancedSetShowIncomePanel = (show: boolean) => {
    if (show) {
      openModal('income')
    } else if (activeModal === 'income') {
      closeModal()
    }
  }

  const enhancedSetShowIncomeInputPanel = (show: boolean) => {
    if (show) {
      openModal('incomeInput')
    } else if (activeModal === 'incomeInput') {
      closeModal()
    }
  }

  const enhancedSetShowHeaderCharacterPanel = (show: boolean) => {
    if (show) {
      openModal('headerCharacter')
    } else if (activeModal === 'headerCharacter') {
      closeModal()
    }
  }

  const enhancedSetShowCharacterItemPanel = (show: boolean) => {
    if (show) {
      openModal('characterItem')
    } else if (activeModal === 'characterItem') {
      closeModal()
    }
  }

  const enhancedSetShowVehicleItemPanel = (show: boolean) => {
    if (show) {
      openModal('vehicleItem')
    } else if (activeModal === 'vehicleItem') {
      closeModal()
    }
  }

  const enhancedSetShowBackgroundItemPanel = (show: boolean) => {
    if (show) {
      openModal('backgroundItem')
    } else if (activeModal === 'backgroundItem') {
      closeModal()
    }
  }

  return {
    // 사용자 정보
    user, setUser,
    
    // 🆕 중앙화된 모달 관리
    activeModal, setActiveModal,
    openModal, closeModal,
    
    // UI 상태들 (enhanced 함수들로 대체)
    currentEmotion, setCurrentEmotion,
    speechText, setSpeechText,
    showCustomizePanel, setShowCustomizePanel: enhancedSetShowCustomizePanel,
    showIncomePanel, setShowIncomePanel: enhancedSetShowIncomePanel,
    showIncomeInputPanel, setShowIncomeInputPanel: enhancedSetShowIncomeInputPanel,
    showHeaderCharacterPanel, setShowHeaderCharacterPanel: enhancedSetShowHeaderCharacterPanel,
    showCharacterItemPanel, setShowCharacterItemPanel: enhancedSetShowCharacterItemPanel,
    showVehicleItemPanel, setShowVehicleItemPanel: enhancedSetShowVehicleItemPanel,
    showBackgroundItemPanel, setShowBackgroundItemPanel: enhancedSetShowBackgroundItemPanel,
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
    loadIncomeRecords, saveIncomeRecord, deleteIncomeRecord,
    
    // 계산된 값들 (홈에서 직접 계산)
    totalIncome: incomeRecords.reduce((sum, record) => sum + record.total_amount, 0),
    todayIncome: incomeRecords
      .filter(record => record.date === new Date().toISOString().split('T')[0])
      .reduce((sum, record) => sum + record.total_amount, 0),
    
    // 기타
    totalBoxes, setTotalBoxes,
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
    getWeatherIcon, addBoxes, useBoxes, canAfford
  }
}

'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { IncomeRecord, User, Platform } from '@/types'

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
  | 'error'
  | 'interiorShop'
  | 'characterShop'
  | 'gameShop'
  | 'inventory'

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
  showInventoryUI: boolean
  setShowInventoryUI: (show: boolean) => void
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
  
  // 에러 상태
  errorMessage: string
  setErrorMessage: (message: string) => void
  showErrorModal: (message: string) => void
  
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
  updateGoals: (goals: { daily: number; weekly: number; monthly: number }) => void
  
  // 유틸리티 함수들
  getWeatherIcon: (condition: string) => string
  addBoxes: (amount: number, reason?: string) => void
  useBoxes: (amount: number, item?: string) => Promise<boolean>
  canAfford: (price: number) => boolean
}

export function useAppState(): AppState {
  // 🔥 핵심 변경: 사용자 정보 Supabase 중심
  const [user, setUser] = useState<User | null>(null)
  
  // 🆕 중앙화된 모달 관리
  const [activeModal, setActiveModal] = useState<ModalType>('none')
  
  // 기본 UI 상태들 (기존과 동일 - 하위 호환성 유지)
  const [showCustomizePanel, setShowCustomizePanel] = useState(false)
  const [showIncomePanel, setShowIncomePanel] = useState(false)
  const [showIncomeInputPanel, setShowIncomeInputPanel] = useState(false)
  const [showHeaderCharacterPanel, setShowHeaderCharacterPanel] = useState(false)
  const [showCharacterItemPanel, setShowCharacterItemPanel] = useState(false)
  const [showVehicleItemPanel, setShowVehicleItemPanel] = useState(false)
  const [showBackgroundItemPanel, setShowBackgroundItemPanel] = useState(false)
  const [showInventoryUI, setShowInventoryUI] = useState(false)
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
  
  // 에러 상태
  const [errorMessage, setErrorMessage] = useState('')
  
  // 플랫폼 상태 (사용자별로 관리) - 기본값으로 초기화하되 사용자 데이터로 덮어씌움
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
      
    } catch (error) {
      // localStorage 캐싱 제거 - Supabase만 사용
    }
  }

  // 🔥 핵심 변경: Supabase 함수를 사용한 수입 기록 저장
  const saveIncomeRecord = async (record: Omit<IncomeRecord, 'id' | 'created_at' | 'total_amount'>): Promise<boolean> => {
    if (!user?.id) {
      return false
    }
    
    try {
      // Supabase 함수를 사용하여 수입 기록 저장 및 박스 지급
      const { data, error } = await supabase.rpc('save_earning_with_boxes', {
        p_user_id: user.id,
        p_platform: record.platform,
        p_delivery_count: record.delivery_count,
        p_delivery_amount: record.delivery_amount,
        p_mission_amount: record.mission_amount,
        p_date: record.date
      })
      
      if (error) {
        return false
      }
      
      if (data?.success) {
        
        // 수입 기록 다시 로드
        await loadIncomeRecords()
        
        // 박스 잔액 업데이트
        const newBoxes = data.boxes_earned || 0
        if (newBoxes > 0) {
          setTotalBoxes(prev => prev + newBoxes)
        }
        
        return true
      } else {
        return false
      }
      
    } catch (error) {
      return false
    }
  }

  // 🗑️ 수입 기록 삭제
  const deleteIncomeRecord = async (recordId: string): Promise<boolean> => {
    if (!user?.id) {
      return false
    }
    
    try {
      const { error } = await supabase
        .from('earnings')
        .delete()
        .eq('id', recordId)
        .eq('user_id', user.id) // 보안: 본인 데이터만 삭제 가능
      
      if (error) {
        return false
      }
      
      
      // 수입 기록 다시 로드
      await loadIncomeRecords()
      
      return true
      
    } catch (error) {
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
      loadUserBoxes()
      
      // 사용자별 설정 로드
      if (user.platforms && Array.isArray(user.platforms)) {
        setPlatforms(user.platforms)
      }
      if (user.goals) {
        setDailyGoal(user.goals.daily)
        setWeeklyGoal(user.goals.weekly)
        setMonthlyGoal(user.goals.monthly)
      }
      
      // Garage intro 로드
      if (user.garage_config?.intro) {
        setGarageIntro(user.garage_config.intro)
      }
    }
  }, [user?.id])

  // 🔥 사용자 박스 잔액 로드 함수
  const loadUserBoxes = async () => {
    if (!user?.id) return
    
    try {
      // 직접 SQL 쿼리로 박스 잔액 계산
      const { data, error } = await supabase
        .from('box_transactions')
        .select('amount, type')
        .eq('user_id', user.id)
      
      if (error) {
        return
      }
      
      // 박스 잔액 계산 (earn은 +, spend는 -)
      const totalBoxes = data?.reduce((sum, transaction) => {
        return sum + (transaction.type === 'earn' ? transaction.amount : -transaction.amount)
      }, 0) || 0
      
      setTotalBoxes(Math.max(0, totalBoxes)) // 음수 방지
      
    } catch (error) {
    }
  }

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
        .update({ 
          platforms: updatedPlatforms,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)

      if (error) {
      } else {
        // 사용자 데이터도 즉시 업데이트
        setUser(prev => prev ? {
          ...prev,
          platforms: updatedPlatforms,
          updated_at: new Date().toISOString()
        } : null)
      }
    } catch (error) {
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
        .update({ 
          platforms: updatedPlatforms,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)

      if (error) {
      } else {
        // 사용자 데이터도 즉시 업데이트
        setUser(prev => prev ? {
          ...prev,
          platforms: updatedPlatforms,
          updated_at: new Date().toISOString()
        } : null)
      }
    } catch (error) {
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
        .update({ 
          platforms: updatedPlatforms,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)

      if (error) {
      } else {
        // 사용자 데이터도 즉시 업데이트
        setUser(prev => prev ? {
          ...prev,
          platforms: updatedPlatforms,
          updated_at: new Date().toISOString()
        } : null)
      }
    } catch (error) {
    }
  }

  // 목표 설정
  const updateGoals = async (goals: { daily: number; weekly: number; monthly: number }) => {
    if (!user?.id) {
      return false
    }

    try {
      // Supabase에 목표 업데이트
      const { error } = await supabase
        .from('users')
        .update({
          goals: goals,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)

      if (error) {
        return false
      }

      // 로컬 상태 업데이트
      setDailyGoal(goals.daily)
      setWeeklyGoal(goals.weekly)
      setMonthlyGoal(goals.monthly)

      // 사용자 정보도 업데이트
      setUser(prev => prev ? {
        ...prev,
        goals: goals
      } : null)

      return true
    } catch (error) {
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

  // 🔥 박스 시스템을 Supabase 함수로 통일
  const addBoxes = async (amount: number, reason = '') => {
    if (!user?.id) return
    
    try {
      const { error } = await supabase
        .from('box_transactions')
        .insert({
          user_id: user.id,
          amount: amount,
          type: 'earn',
          reason: reason
        })
      
      if (error) {
        return
      }
      
      setTotalBoxes(prev => prev + amount)
      
    } catch (error) {
    }
  }

  const useBoxes = async (amount: number, item = '') => {
    if (!user?.id) return false
    
    try {
      // 현재 박스 잔액 확인
      const { data: currentBoxes, error: boxesError } = await supabase.rpc('get_user_boxes', {
        p_user_id: user.id
      })
      
      if (boxesError) {
        return false
      }
      
      if (currentBoxes < amount) {
        return false
      }
      
      // 박스 사용 기록
      const { error } = await supabase
        .from('box_transactions')
        .insert({
          user_id: user.id,
          amount: amount,
          type: 'spend',
          reason: `아이템 구매: ${item}`
        })
      
      if (error) {
        return false
      }
      
      setTotalBoxes(prev => prev - amount)
      return true
      
    } catch (error) {
      return false
    }
  }

  const canAfford = (price: number) => totalBoxes >= price

  // 🆕 중앙화된 모달 관리 함수들
  const openModal = (modal: ModalType) => {
    // 같은 모달을 다시 열려고 할 때도 강제로 업데이트
    setActiveModal(modal)
    
    // 하위 호환성을 위해 기존 상태들도 업데이트
    setShowCustomizePanel(modal === 'customize')
    setShowIncomePanel(modal === 'income')
    setShowIncomeInputPanel(modal === 'incomeInput')
    setShowHeaderCharacterPanel(modal === 'headerCharacter')
    setShowCharacterItemPanel(modal === 'characterItem')
    setShowVehicleItemPanel(modal === 'vehicleItem')
    setShowBackgroundItemPanel(modal === 'backgroundItem')
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

  // 에러 모달 표시 함수
  const showErrorModal = (message: string) => {
    setErrorMessage(message)
    openModal('error')
  }

  return {
    // 사용자 정보
    user, setUser,
    
    // 🆕 중앙화된 모달 관리
    activeModal, setActiveModal,
    openModal, closeModal,
    
    // UI 상태들 (enhanced 함수들로 대체)
    showCustomizePanel, setShowCustomizePanel: enhancedSetShowCustomizePanel,
    showIncomePanel, setShowIncomePanel: enhancedSetShowIncomePanel,
    showIncomeInputPanel, setShowIncomeInputPanel: enhancedSetShowIncomeInputPanel,
    showHeaderCharacterPanel, setShowHeaderCharacterPanel: enhancedSetShowHeaderCharacterPanel,
    showCharacterItemPanel, setShowCharacterItemPanel: enhancedSetShowCharacterItemPanel,
    showVehicleItemPanel, setShowVehicleItemPanel: enhancedSetShowVehicleItemPanel,
    showBackgroundItemPanel, setShowBackgroundItemPanel: enhancedSetShowBackgroundItemPanel,
    showInventoryUI, setShowInventoryUI,
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
    
    // 에러 상태
    errorMessage, setErrorMessage, showErrorModal,
    
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

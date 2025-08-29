'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

// 시/도 목록
const REGIONS = [
  '서울특별시', '부산광역시', '대구광역시', '인천광역시', '광주광역시', '대전광역시', '울산광역시', 
  '세종특별자치시', '경기도', '강원도', '충청북도', '충청남도', '전라북도', '전라남도', '경상북도', 
  '경상남도', '제주특별자치도'
]

// 단계별 컴포넌트
function BasicInfoStep({ 
  nickname, 
  setNickname, 
  region, 
  setRegion, 
  statusMessage, 
  setStatusMessage,
  isNicknameAvailable,
  checkNickname
}: {
  nickname: string
  setNickname: (value: string) => void
  region: string
  setRegion: (value: string) => void
  statusMessage: string
  setStatusMessage: (value: string) => void
  isNicknameAvailable: boolean | null
  checkNickname: (nickname: string) => Promise<void>
}) {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-[#00ff88] mb-6">기본 정보 설정</h2>
      
      {/* 닉네임 입력 */}
      <div>
        <label className="block text-sm font-medium text-gray-200 mb-2">닉네임</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            onBlur={() => checkNickname(nickname)}
            className="flex-1 bg-[#1a1a2e] border border-[#00ff88]/30 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#00ff88]"
            placeholder="닉네임을 입력하세요"
          />
        </div>
        {isNicknameAvailable === false && (
          <p className="text-[#ff6b6b] text-sm mt-1">이미 사용 중인 닉네임입니다.</p>
        )}
        {isNicknameAvailable === true && (
          <p className="text-[#00ff88] text-sm mt-1">사용 가능한 닉네임입니다.</p>
        )}
      </div>

      {/* 지역 선택 */}
      <div>
        <label className="block text-sm font-medium text-gray-200 mb-2">활동 지역</label>
        <select
          value={region}
          onChange={(e) => setRegion(e.target.value)}
          className="w-full bg-[#1a1a2e] border border-[#00ff88]/30 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#00ff88]"
        >
          <option value="">지역을 선택하세요</option>
          {REGIONS.map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
      </div>

      {/* 상태 메시지 */}
      <div>
        <label className="block text-sm font-medium text-gray-200 mb-2">상태 메시지</label>
        <input
          type="text"
          value={statusMessage}
          onChange={(e) => setStatusMessage(e.target.value)}
          className="w-full bg-[#1a1a2e] border border-[#00ff88]/30 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#00ff88]"
          placeholder="상태 메시지를 입력하세요"
        />
      </div>
    </div>
  )
}

function PlatformStep({
  platforms,
  setPlatforms,
  customPlatforms,
  setCustomPlatforms,
  isIncomePrivate,
  setIsIncomePrivate
}: {
  platforms: { [key: string]: boolean }
  setPlatforms: (value: { [key: string]: boolean }) => void
  customPlatforms: string[]
  setCustomPlatforms: (value: string[]) => void
  isIncomePrivate: boolean
  setIsIncomePrivate: (value: boolean) => void
}) {
  const [newPlatform, setNewPlatform] = useState('')

  const addCustomPlatform = () => {
    if (newPlatform && customPlatforms.length < 3) {
      setCustomPlatforms([...customPlatforms, newPlatform])
      setNewPlatform('')
    }
  }

  const removeCustomPlatform = (platform: string) => {
    setCustomPlatforms(customPlatforms.filter(p => p !== platform))
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-[#00ff88] mb-6">활동 설정</h2>
      
      {/* 기본 플랫폼 */}
      <div>
        <label className="block text-sm font-medium text-gray-200 mb-2">기본 플랫폼</label>
        <div className="space-y-2">
          {Object.entries(platforms).map(([platform, isActive]) => (
            <div key={platform} className="flex items-center">
              <input
                type="checkbox"
                checked={isActive}
                onChange={() => setPlatforms({ ...platforms, [platform]: !isActive })}
                className="mr-2"
              />
              <span className="text-white">{platform === 'baemin' ? '배민' : '쿠팡'}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 추가 플랫폼 */}
      <div>
        <label className="block text-sm font-medium text-gray-200 mb-2">추가 플랫폼 (최대 3개)</label>
        <div className="space-y-2">
          {customPlatforms.map((platform) => (
            <div key={platform} className="flex items-center justify-between bg-[#1a1a2e] border border-[#00ff88]/30 rounded-lg px-4 py-2">
              <span className="text-white">{platform}</span>
              <button
                onClick={() => removeCustomPlatform(platform)}
                className="text-[#ff6b6b] hover:text-[#ff4757]"
              >
                ✕
              </button>
            </div>
          ))}
          {customPlatforms.length < 3 && (
            <div className="flex gap-2">
              <input
                type="text"
                value={newPlatform}
                onChange={(e) => setNewPlatform(e.target.value)}
                className="flex-1 bg-[#1a1a2e] border border-[#00ff88]/30 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#00ff88]"
                placeholder="플랫폼 이름 입력"
              />
              <button
                onClick={addCustomPlatform}
                className="px-4 py-2 bg-[#00ff88]/20 text-[#00ff88] rounded-lg border border-[#00ff88]/30 hover:bg-[#00ff88]/30"
              >
                추가
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 수익 공개 설정 */}
      <div>
        <label className="block text-sm font-medium text-gray-200 mb-2">수익 공개 설정</label>
        <select
          value={isIncomePrivate ? 'private' : 'public'}
          onChange={(e) => setIsIncomePrivate(e.target.value === 'private')}
          className="w-full bg-[#1a1a2e] border border-[#00ff88]/30 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#00ff88]"
        >
          <option value="public">전체 공개</option>
          <option value="private">비공개</option>
        </select>
      </div>
    </div>
  )
}

function GoalStep({
  dailyGoal,
  setDailyGoal,
  weeklyGoal,
  setWeeklyGoal,
  monthlyGoal,
  setMonthlyGoal
}: {
  dailyGoal: number
  setDailyGoal: (value: number) => void
  weeklyGoal: number
  setWeeklyGoal: (value: number) => void
  monthlyGoal: number
  setMonthlyGoal: (value: number) => void
}) {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-[#00ff88] mb-6">목표 설정</h2>
      
      {/* 일일 목표 */}
      <div>
        <label className="block text-sm font-medium text-gray-200 mb-2">일일 목표 수입</label>
        <div className="flex items-center">
          <input
            type="number"
            value={dailyGoal}
            onChange={(e) => setDailyGoal(Number(e.target.value))}
            className="flex-1 bg-[#1a1a2e] border border-[#00ff88]/30 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#00ff88]"
            placeholder="0"
          />
          <span className="ml-2 text-gray-300">원</span>
        </div>
      </div>

      {/* 주간 목표 */}
      <div>
        <label className="block text-sm font-medium text-gray-200 mb-2">주간 목표 수입</label>
        <div className="flex items-center">
          <input
            type="number"
            value={weeklyGoal}
            onChange={(e) => setWeeklyGoal(Number(e.target.value))}
            className="flex-1 bg-[#1a1a2e] border border-[#00ff88]/30 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#00ff88]"
            placeholder="0"
          />
          <span className="ml-2 text-gray-300">원</span>
        </div>
      </div>

      {/* 월간 목표 */}
      <div>
        <label className="block text-sm font-medium text-gray-200 mb-2">월간 목표 수입</label>
        <div className="flex items-center">
          <input
            type="number"
            value={monthlyGoal}
            onChange={(e) => setMonthlyGoal(Number(e.target.value))}
            className="flex-1 bg-[#1a1a2e] border border-[#00ff88]/30 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#00ff88]"
            placeholder="0"
          />
          <span className="ml-2 text-gray-300">원</span>
        </div>
      </div>
    </div>
  )
}

export default function SetupPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)

  // 기본 정보
  const [nickname, setNickname] = useState('')
  const [region, setRegion] = useState('')
  const [statusMessage, setStatusMessage] = useState('')
  const [isNicknameAvailable, setIsNicknameAvailable] = useState<boolean | null>(null)

  // 활동 설정
  const [platforms, setPlatforms] = useState({
    baemin: true,
    coupang: true
  })
  const [customPlatforms, setCustomPlatforms] = useState<string[]>([])
  const [isIncomePrivate, setIsIncomePrivate] = useState(false)

  // 목표 설정
  const [dailyGoal, setDailyGoal] = useState(0)
  const [weeklyGoal, setWeeklyGoal] = useState(0)
  const [monthlyGoal, setMonthlyGoal] = useState(0)

  // 닉네임 중복 체크
  const checkNickname = async (nickname: string) => {
    if (!nickname) {
      setIsNicknameAvailable(null)
      return
    }

    try {
      const { data, error } = await supabase
        .from('users')
        .select('id')
        .eq('nickname', nickname)
        .single()

      setIsNicknameAvailable(!data)
    } catch (error) {
      console.error('닉네임 중복 체크 오류:', error)
    }
  }

  // 설정 저장
  const saveSettings = async () => {
    try {
      setIsLoading(true)

      // 로컬 스토리지에서 사용자 정보 가져오기
      const userJson = localStorage.getItem('kakaoUser')
      if (!userJson) {
        throw new Error('사용자 정보를 찾을 수 없습니다.')
      }

      const user = JSON.parse(userJson)

      // 사용자 정보 업데이트
      const { error: updateError } = await supabase
        .from('users')
        .update({
          nickname,
          region,
          status_message: statusMessage,
          is_income_private: isIncomePrivate,
          platforms: {
            baemin: platforms.baemin,
            coupang: platforms.coupang,
            custom: customPlatforms
          },
          goals: {
            daily: dailyGoal,
            weekly: weeklyGoal,
            monthly: monthlyGoal
          },
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)

      if (updateError) {
        throw updateError
      }

      // 로컬 스토리지 업데이트
      const updatedUser = {
        ...user,
        nickname,
        region,
        status_message: statusMessage,
        is_income_private: isIncomePrivate,
        platforms: {
          baemin: platforms.baemin,
          coupang: platforms.coupang,
          custom: customPlatforms
        },
        goals: {
          daily: dailyGoal,
          weekly: weeklyGoal,
          monthly: monthlyGoal
        }
      }
      localStorage.setItem('kakaoUser', JSON.stringify(updatedUser))

      // 메인 페이지로 이동
      router.push('/')
    } catch (error) {
      console.error('설정 저장 오류:', error)
      alert('설정 저장 중 오류가 발생했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  // 단계별 유효성 검사
  const validateStep = (step: number) => {
    switch (step) {
      case 1:
        return nickname && isNicknameAvailable && region
      case 2:
        return true // 플랫폼 설정은 선택사항
      case 3:
        return dailyGoal > 0 && weeklyGoal > 0 && monthlyGoal > 0
      default:
        return false
    }
  }

  // 다음 단계로 이동
  const handleNext = () => {
    if (validateStep(currentStep)) {
      if (currentStep < 3) {
        setCurrentStep(currentStep + 1)
      } else {
        saveSettings()
      }
    } else {
      alert('필수 항목을 모두 입력해주세요.')
    }
  }

  // 이전 단계로 이동
  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f0f23] via-[#1a1a2e] to-[#16213e] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-gradient-to-br from-[#1a1a2e]/90 to-[#16213e]/90 backdrop-blur-lg rounded-2xl p-8 border border-[#00ff88]/20 shadow-2xl">
          {/* 진행 상태 표시 */}
          <div className="flex items-center justify-between mb-8">
            {[1, 2, 3].map((step) => (
              <div
                key={step}
                className={`w-1/3 h-2 rounded-full ${
                  step <= currentStep ? 'bg-[#00ff88]' : 'bg-[#1a1a2e]'
                }`}
              />
            ))}
          </div>

          {/* 단계별 컴포넌트 */}
          {currentStep === 1 && (
            <BasicInfoStep
              nickname={nickname}
              setNickname={setNickname}
              region={region}
              setRegion={setRegion}
              statusMessage={statusMessage}
              setStatusMessage={setStatusMessage}
              isNicknameAvailable={isNicknameAvailable}
              checkNickname={checkNickname}
            />
          )}

          {currentStep === 2 && (
            <PlatformStep
              platforms={platforms}
              setPlatforms={setPlatforms}
              customPlatforms={customPlatforms}
              setCustomPlatforms={setCustomPlatforms}
              isIncomePrivate={isIncomePrivate}
              setIsIncomePrivate={setIsIncomePrivate}
            />
          )}

          {currentStep === 3 && (
            <GoalStep
              dailyGoal={dailyGoal}
              setDailyGoal={setDailyGoal}
              weeklyGoal={weeklyGoal}
              setWeeklyGoal={setWeeklyGoal}
              monthlyGoal={monthlyGoal}
              setMonthlyGoal={setMonthlyGoal}
            />
          )}

          {/* 이전/다음 버튼 */}
          <div className="flex justify-between mt-8">
            <button
              onClick={handlePrev}
              className={`px-6 py-2 rounded-lg transition-all duration-200 ${
                currentStep === 1
                  ? 'opacity-0 cursor-default'
                  : 'bg-[#1a1a2e] text-white border border-white/20 hover:bg-[#2d3748]'
              }`}
              disabled={currentStep === 1 || isLoading}
            >
              이전
            </button>
            <button
              onClick={handleNext}
              disabled={!validateStep(currentStep) || isLoading}
              className={`px-6 py-2 rounded-lg transition-all duration-200 ${
                validateStep(currentStep) && !isLoading
                  ? 'bg-[#00ff88] text-[#1a1a2e] hover:bg-[#00ff88]/90'
                  : 'bg-[#00ff88]/50 text-[#1a1a2e] cursor-not-allowed'
              }`}
            >
              {isLoading ? (
                <div className="w-6 h-6 border-2 border-[#1a1a2e] border-t-transparent rounded-full animate-spin" />
              ) : currentStep === 3 ? (
                '완료'
              ) : (
                '다음'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

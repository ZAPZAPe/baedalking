'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'

// 시/도 목록
const REGIONS = [
  '서울특별시', '부산광역시', '대구광역시', '인천광역시', '광주광역시', '대전광역시', '울산광역시', 
  '세종특별자치시', '경기도', '강원도', '충청북도', '충청남도', '전라북도', '전라남도', '경상북도', 
  '경상남도', '제주특별자치도'
]

// 세부 지역 데이터
const DETAILED_REGIONS = {
  '서울특별시': ['강남구', '강동구', '강북구', '강서구', '관악구', '광진구', '구로구', '금천구', '노원구', '도봉구', '동대문구', '동작구', '마포구', '서대문구', '서초구', '성동구', '성북구', '송파구', '양천구', '영등포구', '용산구', '은평구', '종로구', '중구', '중랑구'],
  '부산광역시': ['강서구', '금정구', '남구', '동구', '동래구', '부산진구', '북구', '사상구', '사하구', '서구', '수영구', '연제구', '영도구', '중구', '해운대구', '기장군'],
  '대구광역시': ['남구', '달서구', '달성군', '동구', '북구', '서구', '수성구', '중구'],
  '인천광역시': ['계양구', '남구', '남동구', '동구', '부평구', '서구', '연수구', '중구', '강화군', '옹진군'],
  '광주광역시': ['광산구', '남구', '동구', '북구', '서구'],
  '대전광역시': ['대덕구', '동구', '서구', '유성구', '중구'],
  '울산광역시': ['남구', '동구', '북구', '울주군', '중구'],
  '세종특별자치시': ['세종특별자치시'],
  '경기도': ['수원시', '성남시', '의정부시', '안양시', '부천시', '광명시', '평택시', '동두천시', '안산시', '고양시', '과천시', '구리시', '남양주시', '오산시', '시흥시', '군포시', '의왕시', '하남시', '용인시', '파주시', '이천시', '안성시', '김포시', '화성시', '광주시', '여주시', '양평군', '고양군', '연천군', '가평군', '포천군'],
  '강원도': ['춘천시', '원주시', '강릉시', '동해시', '태백시', '속초시', '삼척시', '홍천군', '횡성군', '영월군', '평창군', '정선군', '철원군', '화천군', '양구군', '인제군', '고성군', '양양군', '태백군'],
  '충청북도': ['청주시', '충주시', '제천시', '보은군', '옥천군', '영동군', '증평군', '진천군', '괴산군', '음성군', '단양군'],
  '충청남도': ['천안시', '공주시', '보령시', '아산시', '서산시', '논산시', '계룡시', '당진시', '금산군', '부여군', '서천군', '청양군', '홍성군', '예산군', '태안군'],
  '전라북도': ['전주시', '군산시', '익산시', '정읍시', '남원시', '김제시', '완주군', '진안군', '무주군', '장수군', '임실군', '순창군', '고창군', '부안군'],
  '전라남도': ['목포시', '여수시', '순천시', '나주시', '광양시', '담양군', '곡성군', '구례군', '고흥군', '보성군', '화순군', '장흥군', '강진군', '해남군', '영암군', '무안군', '함평군', '영광군', '장성군', '완도군', '진도군', '신안군'],
  '경상북도': ['포항시', '경주시', '김천시', '안동시', '구미시', '영주시', '영천시', '상주시', '문경시', '경산시', '군위군', '의성군', '청송군', '영양군', '영덕군', '청도군', '고령군', '성주군', '칠곡군', '예천군', '봉화군', '울진군', '울릉군'],
  '경상남도': ['창원시', '진주시', '통영시', '사천시', '김해시', '밀양시', '거제시', '양산시', '의령군', '함안군', '창녕군', '고성군', '남해군', '하동군', '산청군', '함양군', '거창군', '합천군'],
  '제주특별자치도': ['제주시', '서귀포시']
}

// 단계별 컴포넌트
function BasicInfoStep({ 
  nickname, 
  setNickname, 
  region, 
  setRegion, 
  detailedRegion,
  setDetailedRegion,
  isNicknameAvailable,
  checkNickname
}: {
  nickname: string
  setNickname: (value: string) => void
  region: string
  setRegion: (value: string) => void
  detailedRegion: string
  setDetailedRegion: (value: string) => void
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
        <div className="space-y-2">
          {/* 시/도 선택 */}
          <select
            value={region}
            onChange={(e) => {
              setRegion(e.target.value)
              setDetailedRegion('') // 시/도 변경 시 세부 지역 초기화
            }}
            className="w-full bg-[#1a1a2e] border border-[#00ff88]/30 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#00ff88]"
          >
            <option value="">시/도를 선택하세요</option>
            {REGIONS.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>

          {/* 세부 지역 선택 */}
          {region && DETAILED_REGIONS[region as keyof typeof DETAILED_REGIONS] && (
            <select
              value={detailedRegion}
              onChange={(e) => setDetailedRegion(e.target.value)}
              className="w-full bg-[#1a1a2e] border border-[#00ff88]/30 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#00ff88]"
            >
              <option value="">세부 지역을 선택하세요</option>
              {DETAILED_REGIONS[region as keyof typeof DETAILED_REGIONS].map((dr) => (
                <option key={dr} value={dr}>{dr}</option>
              ))}
            </select>
          )}
        </div>
      </div>
    </div>
  )
}

function PlatformStep({
  platforms,
  setPlatforms,
  isIncomePrivate,
  setIsIncomePrivate
}: {
  platforms: { baemin: boolean; coupang: boolean }
  setPlatforms: (value: { baemin: boolean; coupang: boolean }) => void
  isIncomePrivate: boolean
  setIsIncomePrivate: (value: boolean) => Promise<void>
}) {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-[#00ff88] mb-6">활동 설정</h2>
      
      {/* 기본 플랫폼 */}
      <div>
        <label className="block text-sm font-medium text-gray-200 mb-2">활동 플랫폼</label>
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

      {/* 수익 공개 설정 */}
      <div>
        <label className="block text-sm font-medium text-gray-200 mb-2">수익 공개 설정</label>
        <select
          value={isIncomePrivate ? 'private' : 'public'}
          onChange={async (e) => await setIsIncomePrivate(e.target.value === 'private')}
          className="w-full bg-[#1a1a2e] border border-[#00ff88]/30 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#00ff88]"
        >
          <option value="public">전체 공개</option>
          <option value="private">비공개</option>
        </select>
      </div>
    </div>
  )
}



export default function SetupPage() {
  const router = useRouter()
  const { user, setUser } = useAuth()
  const [currentStep, setCurrentStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)

  // 기본 정보
  const [nickname, setNickname] = useState(user?.nickname || '')
  const [region, setRegion] = useState('')
  const [detailedRegion, setDetailedRegion] = useState('')
  const [isNicknameAvailable, setIsNicknameAvailable] = useState<boolean | null>(null)

  // 활동 설정
  const [platforms, setPlatforms] = useState({
    baemin: true,
    coupang: true
  })
  const [isIncomePrivate, setIsIncomePrivate] = useState(false)

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

      // useAuth에서 사용자 정보 가져오기
      if (!user) {
        throw new Error('사용자 정보를 찾을 수 없습니다.')
      }

      // 사용자 정보 업데이트
      const { error: updateError } = await supabase
        .from('users')
        .update({
          nickname,
          region: detailedRegion ? `${region} ${detailedRegion}` : region,
          is_income_private: isIncomePrivate,
          platforms: {
            baemin: platforms.baemin,
            coupang: platforms.coupang
          },
          goals: {
            daily: 0,
            weekly: 0,
            monthly: 0
          },
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)

      if (updateError) {
        throw updateError
      }

      // useAuth의 user 상태 즉시 업데이트
      const updatedUser = {
        ...user,
        nickname,
        region: detailedRegion ? `${region} ${detailedRegion}` : region,
        is_income_private: isIncomePrivate,
        platforms: {
          baemin: platforms.baemin,
          coupang: platforms.coupang
        },
        goals: {
          daily: 0,
          weekly: 0,
          monthly: 0
        }
      }
      
      // useAuth 상태 즉시 업데이트 (새로고침 없이 반영)
      setUser(updatedUser)
      
      console.log('✅ 사용자 설정이 즉시 반영되었습니다:', updatedUser.nickname)

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
        return nickname && isNicknameAvailable && region && detailedRegion
      case 2:
        return true // 플랫폼 설정은 선택사항
      default:
        return false
    }
  }

  // 다음 단계로 이동
  const handleNext = () => {
    if (validateStep(currentStep)) {
      if (currentStep < 2) {
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
            {[1, 2].map((step) => (
              <div
                key={step}
                className={`w-1/2 h-2 rounded-full ${
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
              detailedRegion={detailedRegion}
              setDetailedRegion={setDetailedRegion}
              isNicknameAvailable={isNicknameAvailable}
              checkNickname={checkNickname}
            />
          )}

          {currentStep === 2 && (
            <PlatformStep
              platforms={platforms}
              setPlatforms={setPlatforms}
              isIncomePrivate={isIncomePrivate}
              setIsIncomePrivate={setIsIncomePrivate}
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
              ) : currentStep === 2 ? (
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

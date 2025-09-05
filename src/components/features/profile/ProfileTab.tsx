'use client'

import { useState, useEffect } from 'react'
import { CharacterData } from '@/types'
import DeleteAccountModal from './modals/DeleteAccountModal'

interface ProfileTabProps {
  userNickname: string
  userLocation: string
  emotions: Array<{
    id: string
    label: string
    icon: string
    color: string
  }>
  isIncomePrivate: boolean
  setIsIncomePrivate: (isPrivate: boolean) => void
  setShowPrivacyPolicy: (show: boolean) => void
  setShowTermsOfService: (show: boolean) => void
  showDeleteAccount: boolean
  setShowDeleteAccount: (show: boolean) => void
  onLogout: () => void
  onUpdateProfile: (field: string, value: string) => Promise<boolean>
  userId: string
}

export default function ProfileTab({
  userNickname,
  userLocation,
  emotions,
  isIncomePrivate,
  setIsIncomePrivate,
  setShowPrivacyPolicy,
  setShowTermsOfService,
  showDeleteAccount,
  setShowDeleteAccount,
  onLogout,
  onUpdateProfile,
  userId
}: ProfileTabProps) {
  
  // 편집 상태 관리
  const [isEditingNickname, setIsEditingNickname] = useState(false)
  const [isEditingLocation, setIsEditingLocation] = useState(false)
  const [tempNickname, setTempNickname] = useState(userNickname)
  const [tempLocation, setTempLocation] = useState(userLocation)
  
  // 수익 비공개 상태를 로컬에서 관리 (즉시 반영)
  const [localIsIncomePrivate, setLocalIsIncomePrivate] = useState(isIncomePrivate)
  
  // props 변경 시 로컬 상태 동기화
  useEffect(() => {
    setLocalIsIncomePrivate(isIncomePrivate)
  }, [isIncomePrivate])
  
  // 캐릭터 데이터 상태
  const [characterData, setCharacterData] = useState<CharacterData | null>(null)
  
  // 캐릭터 데이터 로드
  useEffect(() => {
    const loadCharacterData = async () => {
      try {
        console.log('프로필에서 캐릭터 데이터 로드 시작:', userId)
        const response = await fetch(`/api/character?userId=${userId}`)
        if (response.ok) {
          const data = await response.json()
          console.log('프로필에서 받은 캐릭터 데이터:', data)
          setCharacterData(data)
        } else {
          console.error('캐릭터 데이터 응답 실패:', response.status)
        }
      } catch (error) {
        console.error('캐릭터 데이터 로딩 실패:', error)
      }
    }
    
    if (userId) {
      loadCharacterData()
    }
  }, [userId])
  
  // 🔍 닉네임 검증 상태
  const [nicknameValidation, setNicknameValidation] = useState<{
    isValid: boolean
    message: string
    isChecking: boolean
  }>({ isValid: true, message: '', isChecking: false })

  // 지역 데이터
  const regionData = {
    '서울특별시': [
      '강남구', '강동구', '강북구', '강서구', '관악구', '광진구', '구로구', '금천구', 
      '노원구', '도봉구', '동대문구', '동작구', '마포구', '서대문구', '서초구', '성동구', 
      '성북구', '송파구', '양천구', '영등포구', '용산구', '은평구', '종로구', '중구', '중랑구'
    ],
    '부산광역시': [
      '강서구', '금정구', '남구', '동구', '동래구', '부산진구', '북구', '사상구', 
      '사하구', '서구', '수영구', '연제구', '영도구', '중구', '해운대구', '기장군'
    ],
    '대구광역시': [
      '남구', '달서구', '달성군', '동구', '북구', '서구', '수성구', '중구'
    ],
    '인천광역시': [
      '계양구', '남구', '남동구', '동구', '부평구', '서구', '연수구', '중구', '강화군', '옹진군'
    ],
    '광주광역시': [
      '광산구', '남구', '동구', '북구', '서구'
    ],
    '대전광역시': [
      '대덕구', '동구', '서구', '유성구', '중구'
    ],
    '울산광역시': [
      '남구', '동구', '북구', '중구', '울주군'
    ],
    '세종특별자치시': [
      '세종특별자치시'
    ],
    '경기도': [
      '수원시', '성남시', '의정부시', '안양시', '부천시', '광명시', '평택시', '과천시', 
      '오산시', '시흥시', '군포시', '의왕시', '하남시', '용인시', '파주시', '이천시', 
      '안성시', '김포시', '화성시', '광주시', '여주시', '양평군', '고양시', '구리시', 
      '남양주시', '동두천시', '안산시', '가평군', '연천군'
    ],
    '강원도': [
      '춘천시', '원주시', '강릉시', '태백시', '속초시', '삼척시', '홍천군', '횡성군', 
      '영월군', '평창군', '정선군', '철원군', '화천군', '양구군', '인제군', '고성군', '양양군'
    ],
    '충청북도': [
      '청주시', '충주시', '제천시', '보은군', '옥천군', '영동군', '증평군', '진천군', '괴산군', '음성군', '단양군'
    ],
    '충청남도': [
      '천안시', '공주시', '보령시', '아산시', '서산시', '논산시', '계룡시', '당진시', 
      '금산군', '부여군', '서천군', '청양군', '홍성군', '예산군', '태안군'
    ],
    '전라북도': [
      '전주시', '군산시', '익산시', '정읍시', '남원시', '김제시', '완주군', '진안군', 
      '무주군', '장수군', '임실군', '순창군', '고창군', '부안군'
    ],
    '전라남도': [
      '목포시', '여수시', '순천시', '나주시', '광양시', '담양군', '곡성군', '구례군', 
      '고흥군', '보성군', '화순군', '장흥군', '강진군', '해남군', '영암군', '무안군', 
      '함평군', '영광군', '장성군', '완도군', '진도군', '신안군'
    ],
    '경상북도': [
      '포항시', '경주시', '김천시', '안동시', '구미시', '영주시', '영천시', '상주시', 
      '문경시', '경산시', '군위군', '의성군', '청송군', '영양군', '영덕군', '청도군', 
      '고령군', '성주군', '칠곡군', '예천군', '봉화군', '울진군', '울릉군'
    ],
    '경상남도': [
      '창원시', '진주시', '통영시', '사천시', '김해시', '밀양시', '거제시', '양산시', 
      '의령군', '함안군', '창녕군', '고성군', '남해군', '하동군', '산청군', '함양군', 
      '거창군', '합천군'
    ],
    '제주특별자치도': [
      '제주시', '서귀포시'
    ]
  }

  // 🔍 실시간 닉네임 검증
  const checkNickname = async (nickname: string) => {
    if (!nickname.trim()) {
      setNicknameValidation({ isValid: false, message: '', isChecking: false })
      return
    }

    // 최소 길이 체크 (즉시)
    if (nickname.length < 2) {
      setNicknameValidation({ 
        isValid: false, 
        message: '닉네임은 최소 2글자 이상이어야 합니다.', 
        isChecking: false 
      })
      return
    }

    setNicknameValidation({ isValid: false, message: '', isChecking: true })

    try {
      const response = await fetch(`/api/users/check-nickname?nickname=${encodeURIComponent(nickname)}&userId=${userId}`)
      const data = await response.json()

      if (data.available) {
        setNicknameValidation({ 
          isValid: true, 
          message: '✅ 사용 가능한 닉네임입니다!', 
          isChecking: false 
        })
      } else {
        setNicknameValidation({ 
          isValid: false, 
          message: data.error || '사용할 수 없는 닉네임입니다.', 
          isChecking: false 
        })
      }
    } catch (error) {
      console.error('닉네임 체크 오류:', error)
      setNicknameValidation({ 
        isValid: false, 
        message: '닉네임 확인 중 오류가 발생했습니다.', 
        isChecking: false 
      })
    }
  }



  // 닉네임 입력 변경 시 검증 (디바운싱)
  const handleNicknameChange = (value: string) => {
    setTempNickname(value)
    
    // 디바운싱: 500ms 후에 검증 실행
    const timeoutId = setTimeout(() => {
      checkNickname(value)
    }, 500)

    return () => clearTimeout(timeoutId)
  }

  // 닉네임 저장
  const handleSaveNickname = async () => {
    if (!tempNickname.trim()) {
      alert('닉네임을 입력해주세요.')
      return
    }

    // 검증 상태 확인
    if (!nicknameValidation.isValid) {
      alert(nicknameValidation.message || '사용할 수 없는 닉네임입니다.')
      return
    }

    if (nicknameValidation.isChecking) {
      alert('닉네임 확인 중입니다. 잠시 후 다시 시도해주세요.')
      return
    }
    
    try {
      const success = await onUpdateProfile('nickname', tempNickname.trim())
      if (success) {
        setIsEditingNickname(false)
        setNicknameValidation({ isValid: true, message: '', isChecking: false })
        alert('닉네임이 성공적으로 변경되었습니다.')
      } else {
        alert('닉네임 변경에 실패했습니다. 다시 시도해주세요.')
      }
    } catch (error) {
      console.error('닉네임 저장 오류:', error)
      alert('오류가 발생했습니다. 다시 시도해주세요.')
    }
  }

  // 지역 저장
  const handleSaveLocation = async () => {
    if (!tempLocation.trim()) {
      alert('지역을 선택해주세요.')
      return
    }
    
    try {
      const success = await onUpdateProfile('region', tempLocation)
      if (success) {
        setIsEditingLocation(false)
        alert('지역이 성공적으로 변경되었습니다.')
      } else {
        alert('지역 변경에 실패했습니다. 다시 시도해주세요.')
      }
    } catch (error) {
      console.error('지역 저장 오류:', error)
      alert('오류가 발생했습니다. 다시 시도해주세요.')
    }
  }

  // 닉네임 편집 취소
  const handleCancelNickname = () => {
    setTempNickname(userNickname)
    setIsEditingNickname(false)
  }

  // 지역 편집 취소
  const handleCancelLocation = () => {
    setTempLocation(userLocation)
    setIsEditingLocation(false)
  }

  const handleLogout = () => {
    onLogout()
  }



  return (
    <div className="space-y-2 sm:space-y-3">
      {/* 프로필 헤더 */}
      <div className="bg-gradient-to-br from-[#2d3748] to-[#1a202c] rounded-xl p-4 border border-[#9c88ff]/30 shadow-inner mb-1 sm:mb-2 flex-shrink-0 relative">
        {/* 픽셀 도트들 */}
        <div className="absolute top-1 left-1 w-1 h-1 bg-[#9c88ff]/60" style={{borderRadius: '1px'}}></div>
        <div className="absolute top-1 right-1 w-1 h-1 bg-[#9c88ff]/60" style={{borderRadius: '1px'}}></div>
        <div className="absolute bottom-1 left-1 w-1 h-1 bg-[#9c88ff]/60" style={{borderRadius: '1px'}}></div>
        <div className="absolute bottom-1 right-1 w-1 h-1 bg-[#9c88ff]/60" style={{borderRadius: '1px'}}></div>
        
        {/* 픽셀 헤더 */}
        <div
          className="w-full bg-gradient-to-r from-[#1a202c] to-[#2d3748] border-2 border-[#9c88ff]/50 hover:border-[#9c88ff] text-white font-mono py-3 px-4 transition-all duration-200 relative mb-2"
          style={{
            borderRadius: '4px',
            fontFamily: 'monospace',
            imageRendering: 'pixelated'
          }}
        >
          <div className="flex items-center justify-center">
            <h3 className="text-white font-bold text-base font-mono" style={{
              imageRendering: 'pixelated'
            }}>
              PROFILE
            </h3>
          </div>
          
          {/* 픽셀 도트들 */}
          <div className="absolute top-1 left-1 w-1 h-1 bg-[#9c88ff]/60" style={{borderRadius: '1px'}}></div>
          <div className="absolute top-1 right-1 w-1 h-1 bg-[#9c88ff]/60" style={{borderRadius: '1px'}}></div>
          <div className="absolute bottom-1 left-1 w-1 h-1 bg-[#9c88ff]/60" style={{borderRadius: '1px'}}></div>
          <div className="absolute bottom-1 right-1 w-1 h-1 bg-[#9c88ff]/60" style={{borderRadius: '1px'}}></div>
        </div>

        {/* 프로필 카드 */}
        <div className="bg-[#1a202c]/60 border-2 border-[#9c88ff]/30 p-4 relative" style={{borderRadius: '4px'}}>
          <div className="text-center mb-2">
            {/* 캐릭터 아바타 */}
            <div className="w-20 h-20 mx-auto mb-2 relative">
              <div className="w-full h-full flex items-center justify-center rounded-lg border-2 border-[#9c88ff]/50 bg-gradient-to-br from-[#00d4ff]/20 to-[#9c88ff]/20">
                {characterData ? (
                  <div className="relative w-16 h-16">
                    {/* 기본 캐릭터 베이스 (가장 아래 레이어) */}
                    <img 
                      src="/assets/character/default-character.png"
                      alt="기본 캐릭터" 
                      className="absolute w-full h-full object-contain"
                      style={{ imageRendering: 'pixelated' }}
                      onError={(e) => console.error('기본 캐릭터 이미지 로드 실패:', e)}
                      onLoad={() => console.log('기본 캐릭터 이미지 로드 성공')}
                    />
                    {/* 하의 레이어 - "없음"이 아닐 때만 표시 */}
                    {characterData.parts.bottom !== 'none.png' && (
                      <img 
                        src={characterData.equippedItems?.find(item => item.item.id === characterData.parts.bottom)?.item.image_url || `/assets/character/${characterData.parts.bottom}`}
                        alt="하의" 
                        className="absolute w-full h-full object-contain"
                        style={{ imageRendering: 'pixelated' }}
                        onError={(e) => console.error('하의 이미지 로드 실패:', e)}
                      />
                    )}
                    {/* 상의 레이어 - "없음"이 아닐 때만 표시 */}
                    {characterData.parts.top !== 'none.png' && (
                      <img 
                        src={characterData.equippedItems?.find(item => item.item.id === characterData.parts.top)?.item.image_url || `/assets/character/${characterData.parts.top}`}
                        alt="상의" 
                        className="absolute w-full h-full object-contain"
                        style={{ imageRendering: 'pixelated' }}
                        onError={(e) => console.error('상의 이미지 로드 실패:', e)}
                      />
                    )}
                    {/* 헤어 레이어 (가장 위) - "없음"이 아닐 때만 표시 */}
                    {characterData.parts.hair !== 'none.png' && (
                      <img 
                        src={characterData.equippedItems?.find(item => item.item.id === characterData.parts.hair)?.item.image_url || `/assets/character/${characterData.parts.hair}`}
                        alt="헤어" 
                        className="absolute w-full h-full object-contain"
                        style={{ imageRendering: 'pixelated' }}
                        onError={(e) => console.error('헤어 이미지 로드 실패:', e)}
                      />
                    )}
                    
                    {/* 감정 이모티콘 - 캐릭터 상단에 표시 */}
                    <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 z-10">
                      <div className="bg-white border border-gray-300 px-1 py-0.5 rounded relative shadow-sm">
                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-2 border-r-2 border-t-2 border-l-transparent border-r-transparent border-t-white"></div>
                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 translate-y-px w-0 h-0 border-l-2 border-r-2 border-t-2 border-l-transparent border-r-transparent border-t-gray-300"></div>
                        <div className="text-xs">
                          {characterData.parts.emotion === 'happy.png' ? '😊' :
                           characterData.parts.emotion === 'angry.png' ? '😠' :
                           characterData.parts.emotion === 'tired.png' ? '😴' :
                           characterData.parts.emotion === 'heart.png' ? '❤️' : '😊'}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-3xl">😊</div>
                )}
              </div>
            </div>
            
            {/* 기본 정보 */}
            <h3 className="text-white font-bold text-xl mb-0 font-mono">{userNickname}</h3>
            <p className="text-gray-300 text-sm font-mono">
              {userLocation ? `${userLocation.split(' ').slice(0, 2).join(' ')}` : '지역 미설정'}
            </p>
          </div>
          
          {/* 픽셀 도트들 */}
          <div className="absolute top-1 left-1 w-1 h-1 bg-[#9c88ff]" style={{borderRadius: '1px'}}></div>
          <div className="absolute top-1 right-1 w-1 h-1 bg-[#9c88ff]" style={{borderRadius: '1px'}}></div>
          <div className="absolute bottom-1 left-1 w-1 h-1 bg-[#9c88ff]" style={{borderRadius: '1px'}}></div>
          <div className="absolute bottom-1 right-1 w-1 h-1 bg-[#9c88ff]" style={{borderRadius: '1px'}}></div>
        </div>
      </div>

      {/* 프로필 변경 */}
      <div className="bg-gradient-to-br from-[#2d3748] to-[#1a202c] rounded-xl p-4 border border-[#00ff88]/30 shadow-inner mb-1 sm:mb-2 flex-shrink-0 relative">
        {/* 픽셀 도트들 */}
        <div className="absolute top-1 left-1 w-1 h-1 bg-[#00ff88]/60" style={{borderRadius: '1px'}}></div>
        <div className="absolute top-1 right-1 w-1 h-1 bg-[#00ff88]/60" style={{borderRadius: '1px'}}></div>
        <div className="absolute bottom-1 left-1 w-1 h-1 bg-[#00ff88]/60" style={{borderRadius: '1px'}}></div>
        <div className="absolute bottom-1 right-1 w-1 h-1 bg-[#00ff88]/60" style={{borderRadius: '1px'}}></div>
        
        {/* 픽셀 헤더 */}
        <div
          className="w-full bg-gradient-to-r from-[#1a202c] to-[#2d3748] border-2 border-[#00ff88]/50 hover:border-[#00ff88] text-white font-mono py-3 px-4 transition-all duration-200 relative mb-4"
          style={{
            borderRadius: '4px',
            fontFamily: 'monospace',
            imageRendering: 'pixelated'
          }}
        >
          <div className="flex items-center justify-center">
            <h3 className="text-white font-bold text-base font-mono" style={{
              imageRendering: 'pixelated'
            }}>
              PROFILE EDIT
            </h3>
          </div>
          
          {/* 픽셀 도트들 */}
          <div className="absolute top-1 left-1 w-1 h-1 bg-[#00ff88]/60" style={{borderRadius: '1px'}}></div>
          <div className="absolute top-1 right-1 w-1 h-1 bg-[#00ff88]/60" style={{borderRadius: '1px'}}></div>
          <div className="absolute bottom-1 left-1 w-1 h-1 bg-[#00ff88]/60" style={{borderRadius: '1px'}}></div>
          <div className="absolute bottom-1 right-1 w-1 h-1 bg-[#00ff88]/60" style={{borderRadius: '1px'}}></div>
        </div>
        
        <div className="space-y-2">
          {/* 닉네임 변경 */}
          {isEditingNickname ? (
            <div className="bg-[#1a202c]/60 border border-[#00ff88]/30 p-3 rounded" style={{borderRadius: '4px'}}>
              <div className="text-white text-sm font-bold font-mono mb-2">닉네임 변경</div>
              <input
                type="text"
                value={tempNickname}
                onChange={(e) => handleNicknameChange(e.target.value)}
                className={`w-full bg-[#1a202c] border text-white text-sm p-2 rounded mb-1 ${
                  nicknameValidation.isValid ? 'border-[#00ff88]/50' : 'border-red-500/50'
                }`}
                style={{borderRadius: '4px'}}
                placeholder="새 닉네임을 입력하세요 (2-10글자)"
                maxLength={10}
              />
              
              {/* 🔍 실시간 검증 메시지 */}
              {nicknameValidation.isChecking && (
                <div className="text-yellow-400 text-xs mb-2 flex items-center">
                  <span className="animate-spin mr-1">⏳</span>
                  닉네임 확인 중...
                </div>
              )}
              
              {!nicknameValidation.isChecking && nicknameValidation.message && (
                <div className={`text-xs mb-2 ${
                  nicknameValidation.isValid ? 'text-green-400' : 'text-red-400'
                }`}>
                  {nicknameValidation.message}
                </div>
              )}
              
              <div className="flex gap-2">
                <button
                  onClick={handleSaveNickname}
                  disabled={!nicknameValidation.isValid || nicknameValidation.isChecking}
                  className={`flex-1 border py-2 rounded text-sm font-bold transition-all ${
                    nicknameValidation.isValid && !nicknameValidation.isChecking
                      ? 'bg-[#00ff88]/20 border-[#00ff88]/50 text-[#00ff88] hover:bg-[#00ff88]/30'
                      : 'bg-gray-500/20 border-gray-500/50 text-gray-400 cursor-not-allowed'
                  }`}
                  style={{borderRadius: '4px'}}
                >
                  저장
                </button>
                <button
                  onClick={handleCancelNickname}
                  className="flex-1 bg-[#ff6b6b]/20 border border-[#ff6b6b]/50 text-[#ff6b6b] hover:bg-[#ff6b6b]/30 py-2 rounded text-sm font-bold transition-all"
                  style={{borderRadius: '4px'}}
                >
                  취소
                </button>
              </div>
            </div>
          ) : (
            <button 
              onClick={() => setIsEditingNickname(true)}
              className="w-full bg-[#1a202c]/60 border border-[#00ff88]/30 p-3 rounded text-left hover:bg-[#1a202c]/80 transition-all" 
              style={{borderRadius: '4px'}}
            >
              <div className="text-white text-sm font-bold font-mono">닉네임 변경</div>
              <div className="text-gray-400 text-xs font-mono">현재: {userNickname || '닉네임 없음'}</div>
            </button>
          )}
          
          {/* 지역 변경 */}
          {isEditingLocation ? (
            <div className="w-full bg-[#1a202c]/60 border border-[#00ff88]/30 p-3 rounded text-left transition-all" 
                 style={{borderRadius: '4px'}}>
              <div className="mb-2">
                <div>
                  <div className="text-white text-sm font-bold font-mono">지역 설정</div>
                  <div className="text-gray-400 text-xs font-mono">현재: {userLocation || '지역 없음'}</div>
                </div>
              </div>
              
              {/* 시/도 및 구 선택 */}
              <div className="grid grid-cols-2 gap-2 mb-2">
                {/* 시/도 선택 */}
                <div>
                  <select
                    value={tempLocation.split(' ')[0] || ''}
                    onChange={(e) => {
                      const province = e.target.value
                      const district = regionData[province as keyof typeof regionData]?.[0] || ''
                      const newLocation = district ? `${province} ${district}` : province
                      setTempLocation(newLocation)
                    }}
                    className="w-full bg-[#1a202c] border border-[#00ff88]/50 rounded px-2 py-1 text-white text-sm focus:border-[#00ff88] focus:outline-none"
                  >
                    <option value="">시/도 선택</option>
                    {Object.keys(regionData).map((province) => (
                      <option key={province} value={province}>
                        {province}
                      </option>
                    ))}
                  </select>
                </div>
                
                {/* 구 선택 */}
                <div>
                  <select
                    value={tempLocation.split(' ').slice(1).join(' ') || ''}
                    onChange={(e) => {
                      const province = tempLocation.split(' ')[0]
                      const district = e.target.value
                      const newLocation = district ? `${province} ${district}` : province
                      setTempLocation(newLocation)
                    }}
                    className="w-full bg-[#1a202c] border border-[#00ff88]/50 rounded px-2 py-1 text-white text-sm focus:border-[#00ff88] focus:outline-none"
                    disabled={!tempLocation.split(' ')[0]}
                  >
                    <option value="">구 선택</option>
                    {tempLocation.split(' ')[0] && regionData[tempLocation.split(' ')[0] as keyof typeof regionData]?.map((district) => (
                      <option key={district} value={district}>
                        {district}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              {/* 저장/취소 버튼 */}
              <div className="flex gap-2">
                <button
                  onClick={async () => {
                    if (!tempLocation.trim()) {
                      alert('지역을 선택해주세요.')
                      return
                    }
                    
                    try {
                      const success = await onUpdateProfile('region', tempLocation)
                      if (success) {
                        setIsEditingLocation(false)
                        alert('지역이 성공적으로 변경되었습니다.')
                      } else {
                        alert('지역 변경에 실패했습니다. 다시 시도해주세요.')
                      }
                    } catch (error) {
                      console.error('지역 저장 오류:', error)
                      alert('지역 저장 중 오류가 발생했습니다.')
                    }
                  }}
                  className="flex-1 bg-[#00ff88]/20 border border-[#00ff88]/50 text-[#00ff88] hover:bg-[#00ff88]/30 py-2 rounded text-sm font-bold transition-all"
                  style={{borderRadius: '4px'}}
                >
                  저장
                </button>
                <button
                  onClick={() => {
                    setTempLocation(userLocation)
                    setIsEditingLocation(false)
                  }}
                  className="flex-1 bg-[#ff6b6b]/20 border border-[#ff6b6b]/50 text-[#ff6b6b] hover:bg-[#ff6b6b]/30 py-2 rounded text-sm font-bold transition-all"
                  style={{borderRadius: '4px'}}
                >
                  취소
                </button>
              </div>
            </div>
          ) : (
            <button 
              onClick={() => setIsEditingLocation(true)}
              className="w-full bg-[#1a202c]/60 border border-[#00ff88]/30 p-3 rounded text-left hover:bg-[#1a202c]/80 transition-all" 
              style={{borderRadius: '4px'}}
            >
              <div>
                <div className="text-white text-sm font-bold font-mono">지역 설정</div>
                <div className="text-gray-400 text-xs font-mono">현재: {userLocation || '지역 없음'}</div>
              </div>
            </button>
          )}

          <div className="w-full bg-[#1a202c]/60 border border-[#00ff88]/30 p-3 rounded text-left transition-all" 
               style={{borderRadius: '4px'}}>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-white text-sm font-bold font-mono">수익 비공개</div>
                <div className="text-gray-400 text-xs font-mono">
                  {localIsIncomePrivate ? '다른 사람이 내 수익을 볼 수 없습니다' : '다른 사람이 내 수익을 볼 수 있습니다'}
                </div>
              </div>
              
              {/* 토글 스위치 */}
              <div className="relative">
                <div 
                  onClick={() => {
                    const newValue = !localIsIncomePrivate
                    console.log('토글 클릭! 현재값:', localIsIncomePrivate, '새값:', newValue)
                    
                    // 즉시 로컬 상태 업데이트 (즉시 반응)
                    setLocalIsIncomePrivate(newValue)
                    
                    // 부모 컴포넌트에 변경사항 전달
                    setIsIncomePrivate(newValue)
                  }}
                  className={`w-12 h-6 rounded-full transition-all duration-300 ease-in-out cursor-pointer ${
                    localIsIncomePrivate 
                      ? 'bg-[#00ff88] shadow-lg shadow-[#00ff88]/30' 
                      : 'bg-gray-600'
                  }`}
                  style={{borderRadius: '12px'}}
                >
                  {/* 스위치 핸들 */}
                  <div 
                    className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-all duration-300 ease-in-out shadow-md ${
                      localIsIncomePrivate 
                        ? 'translate-x-6' 
                        : 'translate-x-0.5'
                    }`}
                    style={{borderRadius: '10px'}}
                  />
                  
                  {/* 픽셀 도트들 */}
                  <div className="absolute top-1 left-1 w-0.5 h-0.5 bg-[#00ff88]/60" style={{borderRadius: '1px'}}></div>
                  <div className="absolute top-1 right-1 w-0.5 h-0.5 bg-[#00ff88]/60" style={{borderRadius: '1px'}}></div>
                  <div className="absolute bottom-1 left-1 w-0.5 h-0.5 bg-[#00ff88]/60" style={{borderRadius: '1px'}}></div>
                  <div className="absolute bottom-1 right-1 w-0.5 h-0.5 bg-[#00ff88]/60" style={{borderRadius: '1px'}}></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 정보 및 지원 */}
      <div className="bg-gradient-to-br from-[#2d3748] to-[#1a202c] rounded-xl p-4 border border-[#ffd93d]/30 shadow-inner mb-1 sm:mb-2 flex-shrink-0 relative">
        {/* 픽셀 도트들 */}
        <div className="absolute top-1 left-1 w-1 h-1 bg-[#ffd93d]/60" style={{borderRadius: '1px'}}></div>
        <div className="absolute top-1 right-1 w-1 h-1 bg-[#ffd93d]/60" style={{borderRadius: '1px'}}></div>
        <div className="absolute bottom-1 left-1 w-1 h-1 bg-[#ffd93d]/60" style={{borderRadius: '1px'}}></div>
        <div className="absolute bottom-1 right-1 w-1 h-1 bg-[#ffd93d]/60" style={{borderRadius: '1px'}}></div>
        
        {/* 픽셀 헤더 */}
        <div
          className="w-full bg-gradient-to-r from-[#1a202c] to-[#2d3748] border-2 border-[#ffd93d]/50 hover:border-[#ffd93d] text-white font-mono py-3 px-4 transition-all duration-200 relative mb-2"
          style={{
            borderRadius: '4px',
            fontFamily: 'monospace',
            imageRendering: 'pixelated'
          }}
        >
          <div className="flex items-center justify-center">
            <h3 className="text-white font-bold text-base font-mono" style={{
              imageRendering: 'pixelated'
            }}>
              INFO & SUPPORT
            </h3>
          </div>
          
          {/* 픽셀 도트들 */}
          <div className="absolute top-1 left-1 w-1 h-1 bg-[#ffd93d]/60" style={{borderRadius: '1px'}}></div>
          <div className="absolute top-1 right-1 w-1 h-1 bg-[#ffd93d]/60" style={{borderRadius: '1px'}}></div>
          <div className="absolute bottom-1 left-1 w-1 h-1 bg-[#ffd93d]/60" style={{borderRadius: '1px'}}></div>
          <div className="absolute bottom-1 right-1 w-1 h-1 bg-[#ffd93d]/60" style={{borderRadius: '1px'}}></div>
        </div>
        
        <div className="space-y-2">




          <button 
            onClick={() => setShowPrivacyPolicy(true)}
            className="w-full bg-[#1a202c]/60 border border-[#ffd93d]/30 p-3 rounded text-left hover:bg-[#1a202c]/80 transition-all" 
            style={{borderRadius: '4px'}}
          >
            <div className="text-white text-sm font-bold font-mono">개인정보처리방침</div>
            <div className="text-gray-400 text-xs font-mono">개인정보 수집 및 이용</div>
          </button>
          
          <button 
            onClick={() => setShowTermsOfService(true)}
            className="w-full bg-[#1a202c]/60 border border-[#ffd93d]/30 p-3 rounded text-left hover:bg-[#1a202c]/80 transition-all" 
            style={{borderRadius: '4px'}}
          >
            <div className="text-white text-sm font-bold font-mono">이용약관</div>
            <div className="text-gray-400 text-xs font-mono">서비스 이용 규정</div>
          </button>
          
          <button 
            onClick={() => {
              window.open('http://pf.kakao.com/_xhxoxmrn/chat', '_blank')
            }}
            className="w-full bg-[#1a202c]/60 border border-[#ffd93d]/30 p-3 rounded text-left hover:bg-[#1a202c]/80 transition-all" 
            style={{borderRadius: '4px'}}
          >
            <div className="text-white text-sm font-bold font-mono">문의하기</div>
            <div className="text-gray-400 text-xs font-mono">카카오톡 채널로 문의</div>
          </button>
        </div>
      </div>

      {/* 계정 관리 */}
      <div className="bg-gradient-to-br from-[#2d3748] to-[#1a202c] rounded-xl p-4 border border-[#ff6b6b]/30 shadow-inner mb-1 sm:mb-2 flex-shrink-0 relative">
        {/* 픽셀 도트들 */}
        <div className="absolute top-1 left-1 w-1 h-1 bg-[#ff6b6b]/60" style={{borderRadius: '1px'}}></div>
        <div className="absolute top-1 right-1 w-1 h-1 bg-[#ff6b6b]/60" style={{borderRadius: '1px'}}></div>
        <div className="absolute bottom-1 left-1 w-1 h-1 bg-[#ff6b6b]/60" style={{borderRadius: '1px'}}></div>
        <div className="absolute bottom-1 right-1 w-1 h-1 bg-[#ff6b6b]/60" style={{borderRadius: '1px'}}></div>
        
        {/* 픽셀 헤더 */}
        <div
          className="w-full bg-gradient-to-r from-[#1a202c] to-[#2d3748] border-2 border-[#ff6b6b]/50 hover:border-[#ff6b6b] text-white font-mono py-3 px-4 transition-all duration-200 relative mb-2"
          style={{
            borderRadius: '4px',
            fontFamily: 'monospace',
            imageRendering: 'pixelated'
          }}
        >
          <div className="flex items-center justify-center">
            <h3 className="text-white font-bold text-base font-mono" style={{
              imageRendering: 'pixelated'
            }}>
              ACCOUNT
            </h3>
          </div>
          
          {/* 픽셀 도트들 */}
          <div className="absolute top-1 left-1 w-1 h-1 bg-[#ff6b6b]/60" style={{borderRadius: '1px'}}></div>
          <div className="absolute top-1 right-1 w-1 h-1 bg-[#ff6b6b]/60" style={{borderRadius: '1px'}}></div>
          <div className="absolute bottom-1 left-1 w-1 h-1 bg-[#ff6b6b]/60" style={{borderRadius: '1px'}}></div>
          <div className="absolute bottom-1 right-1 w-1 h-1 bg-[#ff6b6b]/60" style={{borderRadius: '1px'}}></div>
        </div>
        
        <div className="space-y-2">
          <button 
            onClick={handleLogout}
            className="w-full bg-[#1a202c]/60 border border-[#ff6b6b]/30 p-3 rounded text-left hover:bg-[#1a202c]/80 transition-all" 
            style={{borderRadius: '4px'}}
          >
            <div className="text-white text-sm font-bold font-mono">로그아웃</div>
            <div className="text-gray-400 text-xs font-mono">현재 계정에서 로그아웃</div>
          </button>
          
          <button 
            onClick={() => setShowDeleteAccount(true)}
            className="w-full bg-[#1a202c]/60 border border-[#ff6b6b]/30 p-3 rounded text-left hover:bg-[#1a202c]/80 transition-all" 
            style={{borderRadius: '4px'}}
          >
            <div className="text-red-400 text-sm font-bold font-mono">계정삭제</div>
            <div className="text-gray-400 text-xs font-mono">영구적으로 계정 삭제</div>
          </button>
        </div>
      </div>

      {/* 계정 삭제 모달 */}
      <DeleteAccountModal
        isOpen={showDeleteAccount}
        onClose={() => setShowDeleteAccount(false)}
        onConfirmDelete={async () => {
          try {
            const response = await fetch('/api/users/delete-account', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                userId: userId
              }),
            })

            const data = await response.json()

            if (data.success) {
              alert('계정이 성공적으로 삭제되었습니다.')
              // 로그아웃 처리
              await onLogout()
            } else {
              alert(`계정 삭제 실패: ${data.error}`)
            }
          } catch (error) {
            console.error('계정 삭제 오류:', error)
            alert('계정 삭제 중 오류가 발생했습니다.')
          } finally {
            setShowDeleteAccount(false)
          }
        }}
        isLoading={false}
      />

    </div>
  )
}
'use client'

import { useState } from 'react'

interface ProfileTabProps {
  userNickname: string
  currentEmotion: string
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
  setShowDeleteAccount: (show: boolean) => void
  setShowFriendsModal: (show: boolean) => void
  onLogout: () => void
}

export default function ProfileTab({
  userNickname,
  currentEmotion,
  userLocation,
  emotions,
  isIncomePrivate,
  setIsIncomePrivate,
  setShowPrivacyPolicy,
  setShowTermsOfService,
  setShowDeleteAccount,
  setShowFriendsModal,
  onLogout
}: ProfileTabProps) {
  
  // 편집 상태 관리
  const [isEditingNickname, setIsEditingNickname] = useState(false)
  const [isEditingLocation, setIsEditingLocation] = useState(false)
  const [tempNickname, setTempNickname] = useState(userNickname)
  const [tempLocation, setTempLocation] = useState(userLocation)

  // 닉네임 저장
  const handleSaveNickname = () => {
    // TODO: API 호출로 서버에 저장
    console.log('닉네임 저장:', tempNickname)
    setIsEditingNickname(false)
  }

  // 지역 저장
  const handleSaveLocation = () => {
    // TODO: API 호출로 서버에 저장
    console.log('지역 저장:', tempLocation)
    setIsEditingLocation(false)
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

  const handleDeleteAccount = () => {
    // TODO: 계정 삭제 로직 구현
    console.log('계정 삭제')
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
              <img 
                src={`/assets/character/character-${currentEmotion}.png`}
                alt="캐릭터"
                className="w-full h-full object-contain rounded-lg border-2 border-[#9c88ff]/50"
                style={{ imageRendering: 'pixelated' }}
              />
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
                onChange={(e) => setTempNickname(e.target.value)}
                className="w-full bg-[#1a202c] border border-[#00ff88]/50 text-white text-sm p-2 rounded mb-2"
                style={{borderRadius: '4px'}}
                placeholder="새 닉네임을 입력하세요"
                maxLength={20}
              />
              <div className="flex gap-2">
                <button
                  onClick={handleSaveNickname}
                  className="flex-1 bg-[#00ff88]/20 border border-[#00ff88]/50 text-[#00ff88] hover:bg-[#00ff88]/30 py-2 rounded text-sm font-bold transition-all"
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
            <div className="bg-[#1a202c]/60 border border-[#00ff88]/30 p-3 rounded" style={{borderRadius: '4px'}}>
              <div className="text-white text-sm font-bold font-mono mb-2">지역 변경</div>
              <select
                value={tempLocation}
                onChange={(e) => setTempLocation(e.target.value)}
                className="w-full bg-[#1a202c] border border-[#00ff88]/50 text-white text-sm p-2 rounded mb-2"
                style={{borderRadius: '4px'}}
              >
                <option value="서울특별시">서울특별시</option>
                <option value="부산광역시">부산광역시</option>
                <option value="대구광역시">대구광역시</option>
                <option value="인천광역시">인천광역시</option>
                <option value="광주광역시">광주광역시</option>
                <option value="대전광역시">대전광역시</option>
                <option value="울산광역시">울산광역시</option>
                <option value="세종특별자치시">세종특별자치시</option>
                <option value="경기도">경기도</option>
                <option value="강원도">강원도</option>
                <option value="충청북도">충청북도</option>
                <option value="충청남도">충청남도</option>
                <option value="전라북도">전라북도</option>
                <option value="전라남도">전라남도</option>
                <option value="경상북도">경상북도</option>
                <option value="경상남도">경상남도</option>
                <option value="제주특별자치도">제주특별자치도</option>
              </select>
              <div className="flex gap-2">
                <button
                  onClick={handleSaveLocation}
                  className="flex-1 bg-[#00ff88]/20 border border-[#00ff88]/50 text-[#00ff88] hover:bg-[#00ff88]/30 py-2 rounded text-sm font-bold transition-all"
                  style={{borderRadius: '4px'}}
                >
                  저장
                </button>
                <button
                  onClick={handleCancelLocation}
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
              <div className="text-white text-sm font-bold font-mono">지역 변경</div>
              <div className="text-gray-400 text-xs font-mono">현재: {userLocation || '지역 없음'}</div>
            </button>
          )}

          <button 
            onClick={() => setIsIncomePrivate(!isIncomePrivate)}
            className="w-full bg-[#1a202c]/60 border border-[#00ff88]/30 p-3 rounded text-left hover:bg-[#1a202c]/80 transition-all" 
            style={{borderRadius: '4px'}}
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-white text-sm font-bold font-mono">수익 비공개</div>
                <div className="text-gray-400 text-xs font-mono">
                  {isIncomePrivate ? '다른 사람이 내 수익을 볼 수 없습니다' : '다른 사람이 내 수익을 볼 수 있습니다'}
                </div>
              </div>
              
              {/* 토글 스위치 */}
              <div className="relative">
                <div 
                  className={`w-12 h-6 rounded-full transition-all duration-300 ease-in-out cursor-pointer ${
                    isIncomePrivate 
                      ? 'bg-[#00ff88] shadow-lg shadow-[#00ff88]/30' 
                      : 'bg-gray-600'
                  }`}
                  style={{borderRadius: '12px'}}
                >
                  {/* 스위치 핸들 */}
                  <div 
                    className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-all duration-300 ease-in-out shadow-md ${
                      isIncomePrivate 
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
          </button>
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
            onClick={() => window.location.href = `/minihompy/${userNickname || 'temp'}`}
            className="w-full bg-[#1a202c]/60 border border-[#9c88ff]/30 p-3 rounded text-left hover:bg-[#1a202c]/80 transition-all" 
            style={{borderRadius: '4px'}}
          >
            <div className="text-[#9c88ff] text-sm font-bold font-mono">내 미니홈피</div>
            <div className="text-gray-400 text-xs font-mono">프로필 보기 및 방명록 관리</div>
          </button>

          <button 
            onClick={() => setShowFriendsModal(true)}
            className="w-full bg-[#1a202c]/60 border border-[#00ff88]/30 p-3 rounded text-left hover:bg-[#1a202c]/80 transition-all" 
            style={{borderRadius: '4px'}}
          >
            <div className="text-[#00ff88] text-sm font-bold font-mono">친구 관리</div>
            <div className="text-gray-400 text-xs font-mono">친구 추가, 요청 관리, 친구 찾기</div>
          </button>

          <button 
            onClick={() => window.location.href = '/shop'}
            className="w-full bg-[#1a202c]/60 border border-[#ffd93d]/30 p-3 rounded text-left hover:bg-[#1a202c]/80 transition-all" 
            style={{borderRadius: '4px'}}
          >
            <div className="text-[#ffd93d] text-sm font-bold font-mono">🏪 상점</div>
            <div className="text-gray-400 text-xs font-mono">아이템 구매, 포인트 사용, 꾸미기</div>
          </button>

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
            onClick={() => console.log('문의하기')}
            className="w-full bg-[#1a202c]/60 border border-[#ffd93d]/30 p-3 rounded text-left hover:bg-[#1a202c]/80 transition-all" 
            style={{borderRadius: '4px'}}
          >
            <div className="text-white text-sm font-bold font-mono">문의하기</div>
            <div className="text-gray-400 text-xs font-mono">고객센터 문의</div>
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








    </div>
  )
}
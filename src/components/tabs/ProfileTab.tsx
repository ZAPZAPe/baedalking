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
  setShowDeleteAccount
}: ProfileTabProps) {
  const handleLogout = () => {
    // TODO: 로그아웃 로직 구현
    console.log('로그아웃')
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
          <button 
            onClick={() => console.log('닉네임 변경')}
            className="w-full bg-[#1a202c]/60 border border-[#00ff88]/30 p-3 rounded text-left hover:bg-[#1a202c]/80 transition-all" 
            style={{borderRadius: '4px'}}
          >
            <div className="text-white text-sm font-bold font-mono">닉네임 변경</div>
            <div className="text-gray-400 text-xs font-mono">현재: {userNickname}</div>
          </button>
          
          <button 
            onClick={() => console.log('지역 변경')}
            className="w-full bg-[#1a202c]/60 border border-[#00ff88]/30 p-3 rounded text-left hover:bg-[#1a202c]/80 transition-all" 
            style={{borderRadius: '4px'}}
          >
            <div className="text-white text-sm font-bold font-mono">지역 변경</div>
            <div className="text-gray-400 text-xs font-mono">활동 지역 설정</div>
          </button>
          
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
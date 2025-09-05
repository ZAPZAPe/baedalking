import React from 'react'

interface TermsOfServiceModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function TermsOfServiceModal({
  isOpen,
  onClose
}: TermsOfServiceModalProps) {
  if (!isOpen) return null

  return (
    <>
      {/* 전체 화면을 덮는 블랙 배경 */}
      <div 
        className="fixed inset-0 z-[999999] bg-black"
        onClick={onClose}
      />
      
      {/* 모달 컨테이너 */}
      <div className="fixed inset-0 z-[999999] flex items-center justify-center p-2 sm:p-4 overflow-y-auto pointer-events-none">
        <div 
          className="w-full max-w-sm sm:max-w-2xl bg-gradient-to-b from-[#0a0a23] via-[#16213e] to-[#1a1a2e] border-2 sm:border-4 border-[#ffd93d]/50 shadow-2xl relative max-h-[calc(100vh-32px)] overflow-y-auto pointer-events-auto"
          style={{
            borderRadius: '6px',
            fontFamily: 'monospace',
            imageRendering: 'pixelated',
            boxShadow: '0 0 20px rgba(255, 217, 61, 0.2), inset 0 0 15px rgba(255, 217, 61, 0.05)'
          }}
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
          }}
          onTouchStart={(e) => e.stopPropagation()}
          onTouchEnd={(e) => e.stopPropagation()}
        >
          {/* 네온 글로우 테두리 */}
          <div className="absolute -inset-1 bg-gradient-to-r from-[#ffd93d]/20 via-[#ffc107]/20 to-[#ffd93d]/20 blur-sm -z-10" 
               style={{borderRadius: '12px'}}></div>
          
          {/* 헤더 - 게임 스타일 */}
          <div className="bg-gradient-to-r from-[#0a0a23] to-[#16213e] p-3 sm:p-4 border-b-2 border-[#ffd93d]/30 relative">
            {/* 상단 장식 라인 */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#ffd93d]/60 to-transparent"></div>
            
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2 sm:gap-3">
                {/* 픽셀 아이콘 */}
                <div className="w-5 h-5 sm:w-6 sm:h-6 bg-gradient-to-br from-[#ffd93d] to-[#ffc107] border border-[#ffd93d]" 
                     style={{borderRadius: '3px'}}>
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="w-2 h-2 sm:w-3 sm:h-3 bg-white" style={{borderRadius: '1px'}}></div>
                  </div>
                </div>
                <h3 className="text-[#ffd93d] font-bold text-sm sm:text-lg font-mono tracking-wider" 
                    style={{textShadow: '0 0 8px rgba(255, 217, 61, 0.5)'}}>
                  TERMS OF SERVICE
                </h3>
              </div>
              <button
                onClick={onClose}
                className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-br from-[#ff6b6b]/20 to-[#ff4757]/20 border border-[#ff6b6b]/50 hover:border-[#ff6b6b] text-[#ff6b6b] hover:text-[#ff4757] font-bold transition-all duration-200 hover:scale-110 text-sm sm:text-base"
                style={{borderRadius: '4px'}}
              >
                ✕
              </button>
            </div>
          </div>

          {/* 내용 */}
          <div className="p-4 sm:p-6">
            <div className="space-y-4 text-gray-300 text-sm leading-relaxed">
              <h4 className="text-white font-bold text-sm mb-3 font-mono">1. 서비스 이용</h4>
              <p className="font-mono text-sm">배달킹은 배달 수입 관리 및 친구들과의 소통을 위한 서비스를 제공합니다.</p>
              
              <h4 className="text-white font-bold text-sm mb-3 mt-6 font-mono">2. 이용자의 의무</h4>
              <ul className="list-disc list-inside ml-4 space-y-1 font-mono text-sm">
                <li>허위 정보 입력 금지</li>
                <li>타인의 권리 침해 금지</li>
                <li>서비스 이용 규정 준수</li>
                <li>불법적인 활동 금지</li>
              </ul>
              
              <h4 className="text-white font-bold text-sm mb-3 mt-6 font-mono">3. 서비스 제한</h4>
              <p className="font-mono text-sm">약관 위반 시 서비스 이용이 제한되거나 계정이 삭제될 수 있습니다.</p>
              
              <h4 className="text-white font-bold text-sm mb-3 mt-6 font-mono">4. 책임 제한</h4>
              <p className="font-mono text-sm">서비스 이용으로 인한 손해에 대해 배달킹은 책임을 지지 않습니다.</p>
              
              <h4 className="text-white font-bold text-sm mb-3 mt-6 font-mono">5. 약관 변경</h4>
              <p className="font-mono text-sm">약관 변경 시 사전 공지하며, 변경된 약관에 동의하지 않으면 서비스 이용을 중단할 수 있습니다.</p>
            </div>

            {/* 닫기 버튼 */}
            <div className="mt-6 text-center">
              <button
                onClick={onClose}
                className="bg-gradient-to-r from-[#ffd93d] to-[#ffc107] hover:from-[#ffc107] hover:to-[#e6c534] text-black font-bold py-3 px-8 rounded-lg transition-all duration-200 font-mono shadow-lg hover:shadow-xl transform hover:scale-105"
                style={{borderRadius: '4px'}}
              >
                확인
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

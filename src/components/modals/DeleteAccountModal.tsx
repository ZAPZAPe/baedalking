'use client'

interface DeleteAccountModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirmDelete: () => void
  isLoading?: boolean
}

export default function DeleteAccountModal({
  isOpen,
  onClose,
  onConfirmDelete,
  isLoading = false
}: DeleteAccountModalProps) {
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
          className="w-full max-w-sm sm:max-w-md bg-gradient-to-b from-[#0a0a23] via-[#16213e] to-[#1a1a2e] border-2 sm:border-4 border-[#ff6b6b]/50 shadow-2xl relative max-h-[calc(100vh-32px)] overflow-y-auto pointer-events-auto"
          style={{
            borderRadius: '6px',
            fontFamily: 'monospace',
            imageRendering: 'pixelated',
            boxShadow: '0 0 20px rgba(255, 107, 107, 0.2), inset 0 0 15px rgba(255, 107, 107, 0.05)'
          }}
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
          }}
          onTouchStart={(e) => e.stopPropagation()}
          onTouchEnd={(e) => e.stopPropagation()}
        >
          {/* 네온 글로우 테두리 */}
          <div className="absolute -inset-1 bg-gradient-to-r from-[#ff6b6b]/20 via-[#ff4757]/20 to-[#ff6b6b]/20 blur-sm -z-10" 
               style={{borderRadius: '12px'}}></div>
          
          {/* 헤더 - 게임 스타일 */}
          <div className="bg-gradient-to-r from-[#0a0a23] to-[#16213e] p-3 sm:p-4 border-b-2 border-[#ff6b6b]/30 relative">
            {/* 상단 장식 라인 */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#ff6b6b]/60 to-transparent"></div>
            
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2 sm:gap-3">
                {/* 픽셀 아이콘 */}
                <div className="w-5 h-5 sm:w-6 sm:h-6 bg-gradient-to-br from-[#ff6b6b] to-[#ff4757] border border-[#ff6b6b]" 
                     style={{borderRadius: '3px'}}>
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="w-2 h-2 sm:w-3 sm:h-3 bg-white" style={{borderRadius: '1px'}}></div>
                  </div>
                </div>
                <h3 className="text-[#ff6b6b] font-bold text-sm sm:text-lg font-mono tracking-wider" 
                    style={{textShadow: '0 0 8px rgba(255, 107, 107, 0.5)'}}>
                  DELETE ACCOUNT
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
            <div className="text-center space-y-4">
              {/* 경고 아이콘 */}
              <div className="text-6xl mb-4">⚠️</div>
              
              {/* 경고 메시지 */}
              <div className="space-y-3">
                <h4 className="text-white font-bold text-sm sm:text-base font-mono">계정 삭제 확인</h4>
                <p className="text-gray-300 text-sm font-mono leading-relaxed">
                  정말로 계정을 삭제하시겠습니까?
                </p>
                <p className="text-red-400 text-xs font-mono">
                  삭제 시 다음 데이터가 영구적으로 삭제됩니다:
                </p>
                <ul className="text-gray-400 text-xs font-mono space-y-1 text-left bg-[#1a202c]/30 p-3 rounded-lg border border-[#ff6b6b]/20">
                  <li>• 모든 수입 기록</li>
                  <li>• 친구 목록 및 관계</li>
                  <li>• 방명록 및 댓글</li>
                  <li>• 프로필 정보</li>
                  <li>• 설정 및 개인화 데이터</li>
                </ul>
                <p className="text-red-400 text-xs font-mono font-bold">
                  이 작업은 되돌릴 수 없습니다!
                </p>
              </div>
            </div>

            {/* 버튼 영역 */}
            <div className="mt-6 space-y-3">
              <button
                onClick={onConfirmDelete}
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-[#ff6b6b] to-[#ff4757] hover:from-[#ff4757] hover:to-[#ff3742] text-white font-bold py-3 px-8 rounded-lg transition-all duration-200 font-mono shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{borderRadius: '4px'}}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>삭제 중...</span>
                  </div>
                ) : (
                  <span>계정 삭제 확인</span>
                )}
              </button>
              
              <button
                onClick={onClose}
                disabled={isLoading}
                className="w-full bg-[#1a202c]/60 border border-[#ff6b6b]/30 text-[#ff6b6b] font-bold py-3 px-8 rounded-lg transition-all duration-200 font-mono hover:bg-[#1a202c]/80 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{borderRadius: '4px'}}
              >
                취소
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

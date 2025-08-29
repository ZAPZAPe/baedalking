import React from 'react'
import { PixelModalProps } from '@/types'

export default function PixelModal({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  className = '',
  maxWidth = 'lg'
}: PixelModalProps) {
  if (!isOpen) return null

  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md', 
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl'
  }

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
          className={`w-full ${maxWidthClasses[maxWidth]} bg-gradient-to-b from-[#0a0a23] via-[#16213e] to-[#1a1a2e] border-2 sm:border-4 border-[#ffd93d]/50 shadow-2xl relative max-h-[calc(100vh-32px)] overflow-y-auto pointer-events-auto ${className}`}
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
        >
          {/* 네온 글로우 테두리 */}
          <div className="absolute -inset-1 bg-gradient-to-r from-[#ffd93d]/20 via-[#ff6b6b]/20 to-[#ffd93d]/20 blur-sm -z-10" 
               style={{borderRadius: '12px'}}></div>
          
          {/* 헤더 */}
          <div className="bg-gradient-to-r from-[#0a0a23] to-[#16213e] p-3 sm:p-4 border-b-2 border-[#ffd93d]/30 relative">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-5 h-5 sm:w-6 sm:h-6 bg-gradient-to-br from-[#ffd93d] to-[#ff6b6b] border border-[#ffd93d]" 
                     style={{borderRadius: '3px'}}>
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="w-2 h-2 sm:w-3 sm:h-3 bg-white" style={{borderRadius: '1px'}}></div>
                  </div>
                </div>
                <h3 className="text-[#ffd93d] font-bold text-sm sm:text-lg font-mono tracking-wide" 
                    style={{textShadow: '0 0 8px rgba(255, 217, 61, 0.5)'}}>
                  {title}
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

          {/* 컨텐츠 */}
          <div className="p-3 sm:p-4">
            {children}
          </div>

          {/* 모서리 픽셀 도트들 */}
          <div className="absolute top-1 left-1 w-1 h-1 bg-[#ffd93d]" style={{borderRadius: '1px'}}></div>
          <div className="absolute top-1 right-1 w-1 h-1 bg-[#ffd93d]" style={{borderRadius: '1px'}}></div>
          <div className="absolute bottom-1 left-1 w-1 h-1 bg-[#ffd93d]" style={{borderRadius: '1px'}}></div>
          <div className="absolute bottom-1 right-1 w-1 h-1 bg-[#ffd93d]" style={{borderRadius: '1px'}}></div>
        </div>
      </div>
    </>
  )
}

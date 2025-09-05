'use client'

import React from 'react'

interface ErrorModalProps {
  isOpen: boolean
  onClose: () => void
  message: string
}

export function ErrorModal({ isOpen, onClose, message }: ErrorModalProps) {
  if (!isOpen) return null

  return (
    <>
      {/* 전체 화면을 덮는 블랙 배경 */}
      <div 
        className="fixed inset-0 z-[999999] bg-black/50"
        onClick={onClose}
      />
      
      {/* 모달 컨테이너 */}
      <div className="fixed inset-0 z-[999999] flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
          <div className="text-center">
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <h3 className="text-lg font-bold text-gray-800 mb-2">문제가 발생했습니다</h3>
            <p className="text-gray-600 text-sm leading-relaxed mb-6">
              {message}
            </p>
            
            <button
              onClick={onClose}
              className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-md transition-colors"
            >
              확인
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

'use client'

import React from 'react'

interface PixelButtonProps {
  children: React.ReactNode
  onClick?: () => void
  disabled?: boolean
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'info'
  size?: 'sm' | 'md' | 'lg'
  fullWidth?: boolean
  className?: string
  type?: 'button' | 'submit' | 'reset'
}

export default function PixelButton({
  children,
  onClick,
  disabled = false,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className = '',
  type = 'button'
}: PixelButtonProps) {
  
  // 변형별 색상 정의 (USER PROFILE Visit 버튼 기반)
  const variantStyles = {
    primary: {
      gradient: 'from-[#ffd93d]/20 to-[#ff6b6b]/20',
      border: 'border-[#ffd93d]/50 hover:border-[#ffd93d]',
      text: 'text-[#ffd93d] hover:text-white',
      shadow: 'rgba(255, 217, 61, 0.2)',
      textShadow: '0 0 6px rgba(255, 217, 61, 0.5)',
      dotColor: 'bg-[#ffd93d]'
    },
    secondary: {
      gradient: 'from-[#00d4ff]/20 to-[#9c88ff]/20',
      border: 'border-[#00d4ff]/50 hover:border-[#00d4ff]',
      text: 'text-[#00d4ff] hover:text-white',
      shadow: 'rgba(0, 212, 255, 0.2)',
      textShadow: '0 0 6px rgba(0, 212, 255, 0.5)',
      dotColor: 'bg-[#00d4ff]'
    },
    success: {
      gradient: 'from-[#00ff88]/20 to-[#00d4aa]/20',
      border: 'border-[#00ff88]/50 hover:border-[#00ff88]',
      text: 'text-[#00ff88] hover:text-white',
      shadow: 'rgba(0, 255, 136, 0.2)',
      textShadow: '0 0 6px rgba(0, 255, 136, 0.5)',
      dotColor: 'bg-[#00ff88]'
    },
    danger: {
      gradient: 'from-[#ff6b6b]/20 to-[#ff4757]/20',
      border: 'border-[#ff6b6b]/50 hover:border-[#ff6b6b]',
      text: 'text-[#ff6b6b] hover:text-white',
      shadow: 'rgba(255, 107, 107, 0.2)',
      textShadow: '0 0 6px rgba(255, 107, 107, 0.5)',
      dotColor: 'bg-[#ff6b6b]'
    },
    info: {
      gradient: 'from-[#9c88ff]/20 to-[#7b68ee]/20',
      border: 'border-[#9c88ff]/50 hover:border-[#9c88ff]',
      text: 'text-[#9c88ff] hover:text-white',
      shadow: 'rgba(156, 136, 255, 0.2)',
      textShadow: '0 0 6px rgba(156, 136, 255, 0.5)',
      dotColor: 'bg-[#9c88ff]'
    }
  }

  // 크기별 스타일 정의
  const sizeStyles = {
    sm: {
      padding: 'py-2 px-3',
      text: 'text-xs'
    },
    md: {
      padding: 'py-3 px-4',
      text: 'text-sm sm:text-base'
    },
    lg: {
      padding: 'py-4 px-6',
      text: 'text-base sm:text-lg'
    }
  }

  const style = variantStyles[variant]
  const sizeStyle = sizeStyles[size]

  // Disabled 스타일
  const disabledStyles = disabled ? {
    gradient: 'from-gray-500/20 to-gray-600/20',
    border: 'border-gray-500/50',
    text: 'text-gray-400',
    shadow: 'rgba(156, 163, 175, 0.1)',
    textShadow: 'none',
    dotColor: 'bg-gray-500'
  } : style

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`
        ${fullWidth ? 'w-full' : ''}
        bg-gradient-to-r ${disabledStyles.gradient}
        border-2 ${disabledStyles.border}
        ${disabledStyles.text}
        font-bold ${sizeStyle.padding}
        transition-all duration-300
        ${disabled ? 'cursor-not-allowed' : 'hover:scale-105 hover:shadow-lg'}
        relative font-mono tracking-wide
        ${className}
      `}
      style={{
        borderRadius: '6px',
        textShadow: disabledStyles.textShadow,
        boxShadow: `0 0 15px ${disabledStyles.shadow}`
      }}
    >
      <div className="flex items-center justify-center">
        <span className={sizeStyle.text}>{children}</span>
      </div>
    </button>
  )
}
'use client'

import React from 'react'

interface PixelCardProps {
  children: React.ReactNode
  title?: string
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'info'
  className?: string
}

export default function PixelCard({
  children,
  title,
  variant = 'primary',
  className = ''
}: PixelCardProps) {
  
  // 변형별 색상 정의 (USER PROFILE 모달 기반)
  const variantStyles = {
    primary: {
      gradient: 'from-[#ffd93d]/20 to-[#ff6b6b]/20',
      border: 'border-[#ffd93d]/50',
      titleColor: 'text-[#ffd93d]',
      dotColor: 'bg-[#ffd93d]',
      textShadow: '0 0 6px rgba(255, 217, 61, 0.5)'
    },
    secondary: {
      gradient: 'from-[#00d4ff]/20 to-[#9c88ff]/20',
      border: 'border-[#00d4ff]/50',
      titleColor: 'text-[#00d4ff]',
      dotColor: 'bg-[#00d4ff]',
      textShadow: '0 0 6px rgba(0, 212, 255, 0.5)'
    },
    success: {
      gradient: 'from-[#00ff88]/20 to-[#00d4aa]/20',
      border: 'border-[#00ff88]/50',
      titleColor: 'text-[#00ff88]',
      dotColor: 'bg-[#00ff88]',
      textShadow: '0 0 6px rgba(0, 255, 136, 0.5)'
    },
    danger: {
      gradient: 'from-[#ff6b6b]/20 to-[#ff4757]/20',
      border: 'border-[#ff6b6b]/50',
      titleColor: 'text-[#ff6b6b]',
      dotColor: 'bg-[#ff6b6b]',
      textShadow: '0 0 6px rgba(255, 107, 107, 0.5)'
    },
    info: {
      gradient: 'from-[#9c88ff]/20 to-[#7b68ee]/20',
      border: 'border-[#9c88ff]/50',
      titleColor: 'text-[#9c88ff]',
      dotColor: 'bg-[#9c88ff]',
      textShadow: '0 0 6px rgba(156, 136, 255, 0.5)'
    }
  }

  const style = variantStyles[variant]

  return (
    <div className={`
      bg-gradient-to-r ${style.gradient}
      border ${style.border}
      p-2 sm:p-3 relative
      ${className}
    `} style={{borderRadius: '4px'}}>
      
      {title && (
        <h4 className={`${style.titleColor} text-center font-bold text-xs sm:text-sm font-mono tracking-wide mb-2 sm:mb-3`} 
            style={{textShadow: style.textShadow}}>
          {title}
        </h4>
      )}
      
      {children}
      
      {/* 모서리 픽셀 도트 */}
      <div className={`absolute top-1 left-1 w-1 h-1 ${style.dotColor}`} style={{borderRadius: '1px'}}></div>
      <div className={`absolute top-1 right-1 w-1 h-1 ${style.dotColor}`} style={{borderRadius: '1px'}}></div>
      <div className={`absolute bottom-1 left-1 w-1 h-1 ${style.dotColor}`} style={{borderRadius: '1px'}}></div>
      <div className={`absolute bottom-1 right-1 w-1 h-1 ${style.dotColor}`} style={{borderRadius: '1px'}}></div>
    </div>
  )
}
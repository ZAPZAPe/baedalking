import React from 'react'

interface PixelCardProps {
  children: React.ReactNode
  className?: string
  variant?: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger'
  withDots?: boolean
  onClick?: () => void
  hoverable?: boolean
}

export default function PixelCard({
  children,
  className = '',
  variant = 'default',
  withDots = true,
  onClick,
  hoverable = false
}: PixelCardProps) {
  const variantClasses = {
    default: 'border-[#9c88ff]/30 bg-[#1a202c]/60',
    primary: 'border-[#ffd93d]/30 bg-gradient-to-r from-[#ffd93d]/20 to-[#ff6b6b]/20',
    secondary: 'border-[#9c88ff]/30 bg-gradient-to-r from-[#9c88ff]/20 to-[#ff6b6b]/20',
    success: 'border-[#00ff88]/30 bg-gradient-to-r from-[#00ff88]/20 to-[#9c88ff]/20',
    warning: 'border-[#ffd93d]/30 bg-gradient-to-r from-[#ffd93d]/20 to-[#ff9500]/20',
    danger: 'border-[#ff6b6b]/30 bg-gradient-to-r from-[#ff6b6b]/20 to-[#ff4757]/20'
  }

  const Component = onClick ? 'button' : 'div'
  
  const baseClasses = `
    border rounded p-3 relative transition-all duration-200
    ${variantClasses[variant]}
    ${hoverable || onClick ? 'hover:scale-105 cursor-pointer' : ''}
    ${className}
  `

  return (
    <Component
      className={baseClasses}
      onClick={onClick}
      style={{ borderRadius: '4px' }}
    >
      {children}
      
      {/* 모서리 픽셀 도트들 */}
      {withDots && (
        <>
          <div className="absolute top-1 left-1 w-1 h-1 bg-current opacity-60" style={{borderRadius: '1px'}}></div>
          <div className="absolute top-1 right-1 w-1 h-1 bg-current opacity-60" style={{borderRadius: '1px'}}></div>
          <div className="absolute bottom-1 left-1 w-1 h-1 bg-current opacity-60" style={{borderRadius: '1px'}}></div>
          <div className="absolute bottom-1 right-1 w-1 h-1 bg-current opacity-60" style={{borderRadius: '1px'}}></div>
        </>
      )}
    </Component>
  )
}

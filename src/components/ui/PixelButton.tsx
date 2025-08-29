import React from 'react'

interface PixelButtonProps {
  onClick?: () => void
  children: React.ReactNode
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger'
  size?: 'xs' | 'sm' | 'md' | 'lg'
  disabled?: boolean
  className?: string
  type?: 'button' | 'submit' | 'reset'
}

export default function PixelButton({
  onClick,
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  className = '',
  type = 'button'
}: PixelButtonProps) {
  const variantClasses = {
    primary: 'bg-gradient-to-r from-[#ffd93d]/20 to-[#ff6b6b]/20 border-[#ffd93d]/50 text-[#ffd93d] hover:border-[#ffd93d]',
    secondary: 'bg-gradient-to-r from-[#9c88ff]/20 to-[#ff6b6b]/20 border-[#9c88ff]/50 text-[#9c88ff] hover:border-[#9c88ff]',
    success: 'bg-gradient-to-r from-[#00ff88]/20 to-[#9c88ff]/20 border-[#00ff88]/50 text-[#00ff88] hover:border-[#00ff88]',
    warning: 'bg-gradient-to-r from-[#ffd93d]/20 to-[#ff9500]/20 border-[#ffd93d]/50 text-[#ffd93d] hover:border-[#ffd93d]',
    danger: 'bg-gradient-to-r from-[#ff6b6b]/20 to-[#ff4757]/20 border-[#ff6b6b]/50 text-[#ff6b6b] hover:border-[#ff6b6b]'
  }

  const sizeClasses = {
    xs: 'px-2 py-1 text-xs',
    sm: 'px-3 py-1 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base'
  }

  const disabledClasses = disabled 
    ? 'bg-gray-600 text-gray-400 border-gray-600 cursor-not-allowed hover:scale-100' 
    : 'hover:scale-105'

  return (
    <button
      type={type}
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      className={`
        border rounded font-mono font-bold transition-all duration-200
        ${disabled ? disabledClasses : `${variantClasses[variant]} ${disabledClasses}`}
        ${sizeClasses[size]}
        ${className}
      `}
      style={{ borderRadius: '4px' }}
    >
      {children}
    </button>
  )
}

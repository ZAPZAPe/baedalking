import React from 'react'
import { PixelInputProps } from '@/types'

export default function PixelInput({
  value,
  onChange,
  placeholder = '',
  type = 'text',
  multiline = false,
  rows = 3,
  maxLength,
  disabled = false,
  className = '',
  variant = 'default'
}: PixelInputProps) {
  const variantClasses = {
    default: 'border-[#9c88ff]/30 focus:border-[#9c88ff]/60',
    success: 'border-[#00ff88]/30 focus:border-[#00ff88]/60',
    warning: 'border-[#ffd93d]/30 focus:border-[#ffd93d]/60',
    danger: 'border-[#ff6b6b]/30 focus:border-[#ff6b6b]/60'
  }

  const baseClasses = `
    w-full bg-[#1a202c]/50 border rounded p-3 text-white text-sm font-mono 
    focus:outline-none transition-all duration-200
    ${disabled ? 'bg-gray-800 text-gray-500 cursor-not-allowed' : ''}
    ${variantClasses[variant]}
    ${className}
  `

  if (multiline) {
    return (
      <textarea
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        rows={rows}
        maxLength={maxLength}
        disabled={disabled}
        className={`${baseClasses} resize-none`}
        style={{ borderRadius: '4px' }}
      />
    )
  }

  return (
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      maxLength={maxLength}
      disabled={disabled}
      className={baseClasses}
      style={{ borderRadius: '4px' }}
    />
  )
}

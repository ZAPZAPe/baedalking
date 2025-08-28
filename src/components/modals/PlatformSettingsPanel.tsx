'use client'

import { useState } from 'react'
import { Platform } from '@/hooks/useAppState'

interface PlatformSettingsPanelProps {
  isOpen: boolean
  onClose: () => void
  platforms: Platform[]
  onTogglePlatform: (id: string) => void
  onAddCustomPlatform: (name: string) => void
  onRemoveCustomPlatform: (id: string) => void
}

export default function PlatformSettingsPanel({
  isOpen,
  onClose,
  platforms,
  onTogglePlatform,
  onAddCustomPlatform,
  onRemoveCustomPlatform
}: PlatformSettingsPanelProps) {
  const [newPlatformName, setNewPlatformName] = useState('')

  const handleAddPlatform = () => {
    if (newPlatformName.trim() && platforms.length < 5) {
      onAddCustomPlatform(newPlatformName.trim())
      setNewPlatformName('')
    }
  }

  if (!isOpen) return null

  return (
    <div 
              className="fixed inset-0 z-[999999] bg-black flex items-center justify-center p-2 sm:p-4 overflow-y-auto"
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
      }}
      onTouchStart={(e) => e.stopPropagation()}
      onTouchEnd={(e) => e.stopPropagation()}
    >
      <div 
        className="w-full max-w-sm sm:max-w-md bg-gradient-to-b from-[#0a0a23] via-[#16213e] to-[#1a1a2e] border-2 sm:border-4 border-[#00ff88]/50 shadow-2xl relative max-h-[calc(100vh-32px)] overflow-y-auto"
        style={{
          borderRadius: '6px',
          fontFamily: 'monospace',
          imageRendering: 'pixelated',
          boxShadow: '0 0 20px rgba(0, 255, 136, 0.2), inset 0 0 15px rgba(0, 255, 136, 0.05)'
        }}
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
        }}
        onTouchStart={(e) => e.stopPropagation()}
        onTouchEnd={(e) => e.stopPropagation()}
      >
        
        {/* 네온 글로우 테두리 */}
        <div className="absolute -inset-1 bg-gradient-to-r from-[#00ff88]/20 via-[#00d4ff]/20 to-[#00ff88]/20 blur-sm -z-10" 
             style={{borderRadius: '12px'}}></div>
        
        {/* 헤더 - 게임 스타일 반응형 */}
        <div className="bg-gradient-to-r from-[#0a0a23] to-[#16213e] p-3 sm:p-4 border-b-2 border-[#00ff88]/30 relative">
          {/* 상단 장식 라인 */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#00ff88]/60 to-transparent"></div>
          
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2 sm:gap-3">
              {/* 픽셀 아이콘 */}
              <div className="w-5 h-5 sm:w-6 sm:h-6 bg-gradient-to-br from-[#00d4ff] to-[#9c88ff] border border-[#00ff88]" 
                   style={{borderRadius: '3px'}}>
                <div className="w-full h-full flex items-center justify-center">
                  <div className="w-2 h-2 sm:w-3 sm:h-3 bg-white" style={{borderRadius: '1px'}}></div>
                </div>
              </div>
                          <h3 className="text-[#00ff88] font-bold text-sm sm:text-lg font-mono tracking-wider" 
                style={{textShadow: '0 0 8px rgba(0, 255, 136, 0.5)'}}>
              PLATFORM SETTINGS
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
          
          {/* 하단 장식 라인 */}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#00ff88]/40 to-transparent"></div>
        </div>

        <div className="p-3 sm:p-4 space-y-3 sm:space-y-4 relative">
          {/* 배경 패턴 */}
          <div className="absolute inset-0 opacity-5">
            <div className="w-full h-full" 
                 style={{
                   backgroundImage: `radial-gradient(circle, #00ff88 1px, transparent 1px)`,
                   backgroundSize: '12px 12px'
                 }}></div>
          </div>
          
          {/* 활성 플랫폼 - 게임 스타일 반응형 */}
          <div className="space-y-2 sm:space-y-3 relative">
            <div className="bg-gradient-to-r from-[#00d4ff]/20 to-[#9c88ff]/20 border border-[#00d4ff]/50 p-2 sm:p-3 relative"
                 style={{borderRadius: '4px'}}>
              <h4 className="text-[#00d4ff] text-center font-bold text-xs sm:text-sm font-mono tracking-wider mb-2 sm:mb-3" 
                  style={{textShadow: '0 0 6px rgba(0, 212, 255, 0.5)'}}>
                ACTIVE PLATFORMS
              </h4>
              <div className="space-y-2">
                {platforms.filter(p => p.isActive).map((platform) => (
                  <div key={platform.id} className="bg-[#0a0a23]/80 border-2 border-[#00d4ff]/30 p-2 sm:p-3 relative"
                       style={{borderRadius: '4px'}}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-[#00d4ff] border border-white" style={{borderRadius: '2px'}}></div>
                        <span className="text-white text-xs sm:text-sm font-mono">{platform.name}</span>
                        <span className="text-[#00d4ff] text-xs bg-[#0a0a23]/90 px-1 sm:px-2 py-0.5 border border-[#00d4ff]/30" 
                              style={{borderRadius: '2px'}}>
                          {platform.type === 'default' ? '기본' : '커스텀'}
                        </span>
                      </div>
                      <button
                        onClick={() => onTogglePlatform(platform.id)}
                        className="bg-[#ff6b6b]/20 border border-[#ff6b6b]/50 text-[#ff6b6b] px-2 sm:px-3 py-1 text-xs font-mono hover:border-[#ff6b6b] transition-all duration-200"
                        style={{borderRadius: '2px'}}
                      >
                        비활성
                      </button>
                    </div>
                    {/* 모서리 픽셀 도트 */}
                    <div className="absolute top-1 left-1 w-1 h-1 bg-[#00d4ff]" style={{borderRadius: '1px'}}></div>
                    <div className="absolute top-1 right-1 w-1 h-1 bg-[#00d4ff]" style={{borderRadius: '1px'}}></div>
                    <div className="absolute bottom-1 left-1 w-1 h-1 bg-[#00d4ff]" style={{borderRadius: '1px'}}></div>
                    <div className="absolute bottom-1 right-1 w-1 h-1 bg-[#00d4ff]" style={{borderRadius: '1px'}}></div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 비활성 플랫폼 - 게임 스타일 반응형 */}
          <div className="space-y-2 sm:space-y-3 relative">
            <div className="bg-gradient-to-r from-[#9c88ff]/20 to-[#ffd93d]/20 border border-[#9c88ff]/50 p-2 sm:p-3 relative"
                 style={{borderRadius: '4px'}}>
              <h4 className="text-[#00ff88] text-center font-bold text-xs sm:text-sm font-mono tracking-wider mb-2 sm:mb-3" 
                  style={{textShadow: '0 0 6px rgba(0, 255, 136, 0.5)'}}>
                INACTIVE PLATFORMS
              </h4>
              <div className="space-y-2">
                {platforms.filter(p => !p.isActive).map((platform) => (
                  <div key={platform.id} className="bg-[#0a0a23]/80 border-2 border-[#9c88ff]/30 p-2 sm:p-3 relative"
                       style={{borderRadius: '4px'}}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-[#9c88ff] border border-white" style={{borderRadius: '2px'}}></div>
                        <span className="text-white text-xs sm:text-sm font-mono">{platform.name}</span>
                        <span className="text-[#9c88ff] text-xs bg-[#0a0a23]/90 px-1 sm:px-2 py-0.5 border border-[#9c88ff]/30" 
                              style={{borderRadius: '2px'}}>
                          {platform.type === 'default' ? '기본' : '커스텀'}
                        </span>
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={() => onTogglePlatform(platform.id)}
                          className="bg-[#00ff88]/20 border border-[#00ff88]/50 text-[#00ff88] px-2 sm:px-3 py-1 text-xs font-mono hover:border-[#00ff88] transition-all duration-200"
                          style={{borderRadius: '2px'}}
                        >
                          활성
                        </button>
                        {platform.type === 'custom' && (
                          <button
                            onClick={() => onRemoveCustomPlatform(platform.id)}
                            className="bg-[#ff6b6b]/20 border border-[#ff6b6b]/50 text-[#ff6b6b] px-2 sm:px-3 py-1 text-xs font-mono hover:border-[#ff6b6b] transition-all duration-200"
                            style={{borderRadius: '2px'}}
                          >
                            삭제
                          </button>
                        )}
                      </div>
                    </div>
                    {/* 모서리 픽셀 도트 */}
                    <div className="absolute top-1 left-1 w-1 h-1 bg-[#9c88ff]" style={{borderRadius: '1px'}}></div>
                    <div className="absolute top-1 right-1 w-1 h-1 bg-[#9c88ff]" style={{borderRadius: '1px'}}></div>
                    <div className="absolute bottom-1 left-1 w-1 h-1 bg-[#9c88ff]" style={{borderRadius: '1px'}}></div>
                    <div className="absolute bottom-1 right-1 w-1 h-1 bg-[#9c88ff]" style={{borderRadius: '1px'}}></div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 새 플랫폼 추가 - 게임 스타일 반응형 */}
          {platforms.length < 5 && (
            <div className="space-y-2 sm:space-y-3 relative">
              <div className="bg-gradient-to-r from-[#ffd93d]/20 to-[#ff6b6b]/20 border border-[#ffd93d]/50 p-2 sm:p-3 relative"
                   style={{borderRadius: '4px'}}>
                <h4 className="text-[#ffd93d] text-center font-bold text-xs sm:text-sm font-mono tracking-wider mb-2 sm:mb-3" 
                    style={{textShadow: '0 0 6px rgba(255, 217, 61, 0.5)'}}>
                  ADD NEW PLATFORM
                </h4>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newPlatformName}
                    onChange={(e) => setNewPlatformName(e.target.value)}
                    placeholder="플랫폼 이름 입력..."
                    className="flex-1 bg-[#0a0a23]/80 border-2 border-[#ffd93d]/30 px-2 sm:px-3 py-1.5 sm:py-2 text-white placeholder:text-gray-400 focus:border-[#ffd93d] transition-all duration-200 text-xs sm:text-sm font-mono"
                    style={{borderRadius: '4px'}}
                    maxLength={10}
                  />
                  <button
                    onClick={handleAddPlatform}
                    disabled={!newPlatformName.trim()}
                    className="bg-[#ffd93d]/20 border border-[#ffd93d]/50 text-[#ffd93d] px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-mono hover:border-[#ffd93d] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{borderRadius: '4px'}}
                  >
                    추가
                  </button>
                </div>
                {/* 모서리 픽셀 도트 */}
                <div className="absolute top-1 left-1 w-1 h-1 bg-[#ffd93d]" style={{borderRadius: '1px'}}></div>
                <div className="absolute top-1 right-1 w-1 h-1 bg-[#ffd93d]" style={{borderRadius: '1px'}}></div>
                <div className="absolute bottom-1 left-1 w-1 h-1 bg-[#ffd93d]" style={{borderRadius: '1px'}}></div>
                <div className="absolute bottom-1 right-1 w-1 h-1 bg-[#ffd93d]" style={{borderRadius: '1px'}}></div>
              </div>
            </div>
          )}

          {/* 버튼들 */}
          <div className="flex gap-2">
            {/* 완료 버튼 */}
            <button
              onClick={onClose}
              className="flex-1 bg-gradient-to-r from-[#00ff88]/20 to-[#00d4ff]/20 border-2 border-[#00ff88]/50 hover:border-[#00ff88] text-[#00ff88] hover:text-white font-bold py-3 sm:py-4 transition-all duration-300 hover:scale-105 hover:shadow-lg relative font-mono tracking-wide"
              style={{
                borderRadius: '6px',
                textShadow: '0 0 6px rgba(0, 255, 136, 0.5)',
                boxShadow: '0 0 15px rgba(0, 255, 136, 0.2)'
              }}
            >
              <div className="flex items-center justify-center gap-1.5 sm:gap-2">
                <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-[#00ff88] border border-white" style={{borderRadius: '1px'}}></div>
                <span className="text-sm sm:text-base font-mono tracking-wider">COMPLETE</span>
                <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-[#00ff88] border border-white" style={{borderRadius: '1px'}}></div>
              </div>
              
              {/* 버튼 모서리 픽셀 도트 */}
              <div className="absolute top-1 left-1 w-1 h-1 bg-[#00ff88]" style={{borderRadius: '1px'}}></div>
              <div className="absolute top-1 right-1 w-1 h-1 bg-[#00ff88]" style={{borderRadius: '1px'}}></div>
              <div className="absolute bottom-1 left-1 w-1 h-1 bg-[#00ff88]" style={{borderRadius: '1px'}}></div>
              <div className="absolute bottom-1 right-1 w-1 h-1 bg-[#00ff88]" style={{borderRadius: '1px'}}></div>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

'use client'

import { characterItems, vehicles, backgrounds } from '@/data/constants'

interface ItemSelectionPanelsProps {
  // Character Item Panel
  showCharacterItemPanel: boolean
  setShowCharacterItemPanel: (show: boolean) => void
  currentCharacterItem: string
  setCurrentCharacterItem: (item: string) => void
  
  // Vehicle Item Panel
  showVehicleItemPanel: boolean
  setShowVehicleItemPanel: (show: boolean) => void
  currentVehicle: string
  setCurrentVehicle: (vehicle: string) => void
  
  // Background Item Panel
  showBackgroundItemPanel: boolean
  setShowBackgroundItemPanel: (show: boolean) => void
  currentBackground: string
  setCurrentBackground: (background: string) => void
  
  // Box system
  totalBoxes: number
  useBoxes: (amount: number, item: string) => boolean
}

export default function ItemSelectionPanels({
  showCharacterItemPanel,
  setShowCharacterItemPanel,
  currentCharacterItem,
  setCurrentCharacterItem,
  showVehicleItemPanel,
  setShowVehicleItemPanel,
  currentVehicle,
  setCurrentVehicle,
  showBackgroundItemPanel,
  setShowBackgroundItemPanel,
  currentBackground,
  setCurrentBackground,
  totalBoxes,
  useBoxes
}: ItemSelectionPanelsProps) {
  return (
    <>
      {/* 캐릭터 아이템 선택 패널 */}
      {showCharacterItemPanel && (
        <div 
          className="fixed inset-0 z-[999999] bg-black flex items-center justify-center p-2 sm:p-4 overflow-y-auto"
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            setShowCharacterItemPanel(false)
          }}
          onTouchStart={(e) => e.stopPropagation()}
          onTouchEnd={(e) => e.stopPropagation()}
        >
          <div 
            className="w-full max-w-sm sm:max-w-md bg-gradient-to-b from-[#0a0a23] via-[#16213e] to-[#1a1a2e] border-2 sm:border-4 border-[#00d4ff]/50 shadow-2xl relative max-h-[calc(100vh-32px)] overflow-y-auto"
            style={{
              borderRadius: '6px',
              fontFamily: 'monospace',
              imageRendering: 'pixelated',
              boxShadow: '0 0 30px rgba(0, 212, 255, 0.3), inset 0 0 20px rgba(0, 212, 255, 0.1)'
            }}
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
            }}
            onTouchStart={(e) => e.stopPropagation()}
            onTouchEnd={(e) => e.stopPropagation()}
          >
            {/* 네온 글로우 테두리 */}
            <div className="absolute -inset-1 bg-gradient-to-r from-[#00d4ff]/20 via-[#00ff88]/20 to-[#00d4ff]/20 blur-sm -z-10" 
                 style={{borderRadius: '12px'}}></div>
            
            {/* 헤더 - 게임 스타일 */}
            <div className="bg-gradient-to-r from-[#0a0a23] to-[#16213e] p-3 sm:p-4 border-b-2 border-[#00d4ff]/30 relative">
              {/* 상단 장식 라인 */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#00d4ff]/60 to-transparent"></div>
              
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2 sm:gap-3">
                  {/* 픽셀 아이콘 */}
                  <div className="w-5 h-5 sm:w-6 sm:h-6 bg-gradient-to-br from-[#00ff88] to-[#00d4ff] border border-[#00ff88]" 
                       style={{borderRadius: '3px'}}>
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="w-2 h-2 sm:w-3 sm:h-3 bg-white" style={{borderRadius: '1px'}}></div>
                    </div>
                  </div>
                  <h3 className="text-[#00ff88] font-bold text-sm sm:text-lg font-mono tracking-wider" 
                      style={{textShadow: '0 0 8px rgba(0, 255, 136, 0.5)'}}>
                    CHARACTER ITEMS
                  </h3>
                </div>
                <button
                  onClick={() => setShowCharacterItemPanel(false)}
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
              
              {/* 아이템 그리드 */}
              <div className="grid grid-cols-3 gap-2 sm:gap-3 max-h-[400px] overflow-y-auto">
                {characterItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      if (item.price === 0 || useBoxes(item.price, item.name)) {
                        setCurrentCharacterItem(item.id)
                        setShowCharacterItemPanel(false)
                      }
                    }}
                    className={`aspect-square p-2 sm:p-3 border-2 transition-all duration-200 relative ${
                      currentCharacterItem === item.id
                        ? 'bg-[#00d4ff]/20 border-[#00d4ff] scale-105 shadow-lg'
                        : 'bg-[#0a0a23]/40 border-[#00d4ff]/30 hover:border-[#00d4ff]/60 hover:scale-102'
                    }`}
                    style={{borderRadius: '4px'}}
                  >
                    <div className="text-center h-full flex flex-col justify-center">
                      <div className="text-lg sm:text-xl mb-1">{item.icon}</div>
                      <div className="text-white text-xs font-mono font-bold">{item.name}</div>
                      <div className="text-[#ffd93d] text-xs mt-1 font-mono">
                        {item.price === 0 ? '무료' : `${item.price}📦`}
                      </div>
                    </div>
                    {/* 선택된 버튼 픽셀 도트 */}
                    {currentCharacterItem === item.id && (
                      <>
                        <div className="absolute top-0.5 left-0.5 w-1 h-1 bg-[#00d4ff]" style={{borderRadius: '1px'}}></div>
                        <div className="absolute top-0.5 right-0.5 w-1 h-1 bg-[#00d4ff]" style={{borderRadius: '1px'}}></div>
                        <div className="absolute bottom-0.5 left-0.5 w-1 h-1 bg-[#00d4ff]" style={{borderRadius: '1px'}}></div>
                        <div className="absolute bottom-0.5 right-0.5 w-1 h-1 bg-[#00d4ff]" style={{borderRadius: '1px'}}></div>
                      </>
                    )}
                  </button>
                ))}
              </div>
              
              {/* 모서리 픽셀 도트 */}
              <div className="absolute top-1 left-1 w-1 h-1 bg-[#00d4ff]" style={{borderRadius: '1px'}}></div>
              <div className="absolute top-1 right-1 w-1 h-1 bg-[#00d4ff]" style={{borderRadius: '1px'}}></div>
              <div className="absolute bottom-1 left-1 w-1 h-1 bg-[#00d4ff]" style={{borderRadius: '1px'}}></div>
              <div className="absolute bottom-1 right-1 w-1 h-1 bg-[#00d4ff]" style={{borderRadius: '1px'}}></div>
            </div>
          </div>
        </div>
      )}

      {/* 운송수단 선택 패널 */}
              {showVehicleItemPanel && (
          <div 
            className="fixed inset-0 z-[999999] bg-black flex items-center justify-center p-2 sm:p-4 overflow-y-auto"
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            setShowVehicleItemPanel(false)
          }}
          onTouchStart={(e) => e.stopPropagation()}
          onTouchEnd={(e) => e.stopPropagation()}
        >
          <div 
            className="w-full max-w-sm sm:max-w-md bg-gradient-to-b from-[#0a0a23] via-[#16213e] to-[#1a1a2e] border-2 sm:border-4 border-[#00d4ff]/50 shadow-2xl relative max-h-[calc(100vh-32px)] overflow-y-auto"
            style={{
              borderRadius: '6px',
              fontFamily: 'monospace',
              imageRendering: 'pixelated',
              boxShadow: '0 0 30px rgba(0, 212, 255, 0.3), inset 0 0 20px rgba(0, 212, 255, 0.1)'
            }}
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
            }}
            onTouchStart={(e) => e.stopPropagation()}
            onTouchEnd={(e) => e.stopPropagation()}
          >
            {/* 네온 글로우 테두리 */}
            <div className="absolute -inset-1 bg-gradient-to-r from-[#00d4ff]/20 via-[#00ff88]/20 to-[#00d4ff]/20 blur-sm -z-10" 
                 style={{borderRadius: '12px'}}></div>
            
            {/* 헤더 - 게임 스타일 */}
            <div className="bg-gradient-to-r from-[#0a0a23] to-[#16213e] p-3 sm:p-4 border-b-2 border-[#00d4ff]/30 relative">
              {/* 상단 장식 라인 */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#00d4ff]/60 to-transparent"></div>
              
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2 sm:gap-3">
                  {/* 픽셀 아이콘 */}
                  <div className="w-5 h-5 sm:w-6 sm:h-6 bg-gradient-to-br from-[#00ff88] to-[#00d4ff] border border-[#00ff88]" 
                       style={{borderRadius: '3px'}}>
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="w-2 h-2 sm:w-3 sm:h-3 bg-white" style={{borderRadius: '1px'}}></div>
                    </div>
                  </div>
                  <h3 className="text-[#00ff88] font-bold text-sm sm:text-lg font-mono tracking-wider" 
                      style={{textShadow: '0 0 8px rgba(0, 255, 136, 0.5)'}}>
                    VEHICLES
                  </h3>
                </div>
                <button
                  onClick={() => setShowVehicleItemPanel(false)}
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
              
              {/* 아이템 그리드 */}
              <div className="grid grid-cols-3 gap-2 sm:gap-3 max-h-[400px] overflow-y-auto">
                {vehicles.map((vehicle) => (
                  <button
                    key={vehicle.id}
                    onClick={() => {
                      if (vehicle.price === 0 || useBoxes(vehicle.price, vehicle.name)) {
                        setCurrentVehicle(vehicle.id)
                        setShowVehicleItemPanel(false)
                      }
                    }}
                    className={`aspect-square p-2 sm:p-3 border-2 transition-all duration-200 relative ${
                      currentVehicle === vehicle.id
                        ? 'bg-[#00d4ff]/20 border-[#00d4ff] scale-105 shadow-lg'
                        : 'bg-[#0a0a23]/40 border-[#00d4ff]/30 hover:border-[#00d4ff]/60 hover:scale-102'
                    }`}
                    style={{borderRadius: '4px'}}
                  >
                    <div className="text-center h-full flex flex-col justify-center">
                      <div className="text-lg sm:text-xl mb-1">{vehicle.icon}</div>
                      <div className="text-white text-xs font-mono font-bold">{vehicle.name}</div>
                      <div className="text-[#ffd93d] text-xs mt-1 font-mono">
                        {vehicle.price === 0 ? '무료' : `${vehicle.price}📦`}
                      </div>
                    </div>
                    {/* 선택된 버튼 픽셀 도트 */}
                    {currentVehicle === vehicle.id && (
                      <>
                        <div className="absolute top-0.5 left-0.5 w-1 h-1 bg-[#00d4ff]" style={{borderRadius: '1px'}}></div>
                        <div className="absolute top-0.5 right-0.5 w-1 h-1 bg-[#00d4ff]" style={{borderRadius: '1px'}}></div>
                        <div className="absolute bottom-0.5 left-0.5 w-1 h-1 bg-[#00d4ff]" style={{borderRadius: '1px'}}></div>
                        <div className="absolute bottom-0.5 right-0.5 w-1 h-1 bg-[#00d4ff]" style={{borderRadius: '1px'}}></div>
                      </>
                    )}
                  </button>
                ))}
              </div>
              
              {/* 모서리 픽셀 도트 */}
              <div className="absolute top-1 left-1 w-1 h-1 bg-[#00d4ff]" style={{borderRadius: '1px'}}></div>
              <div className="absolute top-1 right-1 w-1 h-1 bg-[#00d4ff]" style={{borderRadius: '1px'}}></div>
              <div className="absolute bottom-1 left-1 w-1 h-1 bg-[#00d4ff]" style={{borderRadius: '1px'}}></div>
              <div className="absolute bottom-1 right-1 w-1 h-1 bg-[#00d4ff]" style={{borderRadius: '1px'}}></div>
            </div>
          </div>
        </div>
      )}

      {/* 배경 아이템 패널 */}
              {showBackgroundItemPanel && (
          <div 
            className="fixed inset-0 z-[999999] bg-black flex items-center justify-center p-2 sm:p-4 overflow-y-auto"
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            setShowBackgroundItemPanel(false)
          }}
          onTouchStart={(e) => e.stopPropagation()}
          onTouchEnd={(e) => e.stopPropagation()}
        >
          <div 
            className="w-full max-w-sm sm:max-w-md bg-gradient-to-b from-[#0a0a23] via-[#16213e] to-[#1a1a2e] border-2 sm:border-4 border-[#00d4ff]/50 shadow-2xl relative max-h-[calc(100vh-32px)] overflow-y-auto"
            style={{
              borderRadius: '6px',
              fontFamily: 'monospace',
              imageRendering: 'pixelated',
              boxShadow: '0 0 30px rgba(0, 212, 255, 0.3), inset 0 0 20px rgba(0, 212, 255, 0.1)'
            }}
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
            }}
            onTouchStart={(e) => e.stopPropagation()}
            onTouchEnd={(e) => e.stopPropagation()}
          >
            {/* 네온 글로우 테두리 */}
            <div className="absolute -inset-1 bg-gradient-to-r from-[#00d4ff]/20 via-[#00ff88]/20 to-[#00d4ff]/20 blur-sm -z-10" 
                 style={{borderRadius: '12px'}}></div>
            
            {/* 헤더 - 게임 스타일 */}
            <div className="bg-gradient-to-r from-[#0a0a23] to-[#16213e] p-3 sm:p-4 border-b-2 border-[#00d4ff]/30 relative">
              {/* 상단 장식 라인 */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#00d4ff]/60 to-transparent"></div>
              
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2 sm:gap-3">
                  {/* 픽셀 아이콘 */}
                  <div className="w-5 h-5 sm:w-6 sm:h-6 bg-gradient-to-br from-[#00ff88] to-[#00d4ff] border border-[#00ff88]" 
                       style={{borderRadius: '3px'}}>
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="w-2 h-2 sm:w-3 sm:h-3 bg-white" style={{borderRadius: '1px'}}></div>
                    </div>
                  </div>
                  <h3 className="text-[#00ff88] font-bold text-sm sm:text-lg font-mono tracking-wider" 
                      style={{textShadow: '0 0 8px rgba(0, 255, 136, 0.5)'}}>
                    BACKGROUNDS
                  </h3>
                </div>
                <button
                  onClick={() => setShowBackgroundItemPanel(false)}
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
              
              {/* 아이템 그리드 */}
              <div className="grid grid-cols-2 gap-2 sm:gap-3 max-h-[400px] overflow-y-auto">
                {backgrounds.map((background) => (
                  <button
                    key={background.id}
                    onClick={() => {
                      if (background.price === 0 || useBoxes(background.price, background.name)) {
                        setCurrentBackground(background.id)
                        setShowBackgroundItemPanel(false)
                      }
                    }}
                    className={`aspect-video p-2 sm:p-3 border-2 transition-all duration-200 relative ${
                      currentBackground === background.id
                        ? 'bg-[#00d4ff]/20 border-[#00d4ff] scale-105 shadow-lg'
                        : 'bg-[#0a0a23]/40 border-[#00d4ff]/30 hover:border-[#00d4ff]/60 hover:scale-102'
                    }`}
                    style={{borderRadius: '4px'}}
                  >
                    <div className="text-center h-full flex flex-col justify-center">
                      {/* 배경 미리보기 이미지 */}
                      <div className="w-full h-12 sm:h-16 mb-2 rounded-lg overflow-hidden border border-gray-600">
                        <img 
                          src={`/assets/background/${background.id}.png`}
                          alt={background.name}
                          className="w-full h-full object-cover"
                          style={{ imageRendering: 'pixelated' }}
                        />
                      </div>
                      <div className="text-white text-xs font-mono font-bold">{background.name}</div>
                      <div className="text-[#ffd93d] text-xs mt-1 font-mono">
                        {background.price === 0 ? '무료' : `${background.price}📦`}
                      </div>
                    </div>
                    {/* 선택된 버튼 픽셀 도트 */}
                    {currentBackground === background.id && (
                      <>
                        <div className="absolute top-0.5 left-0.5 w-1 h-1 bg-[#00d4ff]" style={{borderRadius: '1px'}}></div>
                        <div className="absolute top-0.5 right-0.5 w-1 h-1 bg-[#00d4ff]" style={{borderRadius: '1px'}}></div>
                        <div className="absolute bottom-0.5 left-0.5 w-1 h-1 bg-[#00d4ff]" style={{borderRadius: '1px'}}></div>
                        <div className="absolute bottom-0.5 right-0.5 w-1 h-1 bg-[#00d4ff]" style={{borderRadius: '1px'}}></div>
                      </>
                    )}
                  </button>
                ))}
              </div>
              
              {/* 모서리 픽셀 도트 */}
              <div className="absolute top-1 left-1 w-1 h-1 bg-[#00d4ff]" style={{borderRadius: '1px'}}></div>
              <div className="absolute top-1 right-1 w-1 h-1 bg-[#00d4ff]" style={{borderRadius: '1px'}}></div>
              <div className="absolute bottom-1 left-1 w-1 h-1 bg-[#00d4ff]" style={{borderRadius: '1px'}}></div>
              <div className="absolute bottom-1 right-1 w-1 h-1 bg-[#00d4ff]" style={{borderRadius: '1px'}}></div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

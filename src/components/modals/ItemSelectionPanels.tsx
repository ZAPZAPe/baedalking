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
  
  // Point system
  usePoints: (amount: number, item: string) => boolean
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
  usePoints
}: ItemSelectionPanelsProps) {
  return (
    <>
      {/* 캐릭터 아이템 선택 패널 */}
      {showCharacterItemPanel && (
        <div 
          className="fixed inset-0 z-[9999] bg-black/50 flex items-center justify-center p-4"
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            setShowCharacterItemPanel(false)
          }}
          onTouchStart={(e) => e.stopPropagation()}
          onTouchEnd={(e) => e.stopPropagation()}
        >
          <div 
            className="w-full max-w-md bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460] rounded-2xl border-2 border-[#00d4ff]/30 shadow-2xl"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
            }}
            onTouchStart={(e) => e.stopPropagation()}
            onTouchEnd={(e) => e.stopPropagation()}
          >
            {/* 헤더 */}
            <div className="bg-gradient-to-r from-[#0f3460] to-[#1a1a2e] p-4 rounded-t-2xl border-b border-[#00d4ff]/20">
              <div className="flex justify-between items-center">
                <h3 className="text-white font-bold text-lg flex items-center gap-2">
                  <span className="text-2xl">👕</span>
                  캐릭터 의상
                </h3>
                <button
                  onClick={() => setShowCharacterItemPanel(false)}
                  className="text-gray-400 hover:text-white text-2xl transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-6">
              {/* 아이템 그리드 */}
              <div className="grid grid-cols-3 gap-3 max-h-[400px] overflow-y-auto">
                {characterItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      if (item.price === 0 || usePoints(item.price, item.name)) {
                        setCurrentCharacterItem(item.id)
                        setShowCharacterItemPanel(false)
                      }
                    }}
                    className={`aspect-square p-3 rounded-xl border-2 transition-all ${
                      currentCharacterItem === item.id
                        ? 'bg-[#00d4ff]/20 border-[#00d4ff] scale-105 shadow-lg'
                        : 'bg-[#1a1a2e] border-[#333] hover:border-[#555] hover:scale-102'
                    }`}
                  >
                    <div className="text-center h-full flex flex-col justify-center">
                      <div className="text-2xl mb-1">{item.icon}</div>
                      <div className="text-white text-xs font-medium">{item.name}</div>
                      <div className="text-[#ffd93d] text-xs mt-1">
                        {item.price === 0 ? '무료' : `${item.price}💎`}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 운송수단 선택 패널 */}
      {showVehicleItemPanel && (
        <div 
          className="fixed inset-0 z-[9999] bg-black/50 flex items-center justify-center p-4"
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            setShowVehicleItemPanel(false)
          }}
          onTouchStart={(e) => e.stopPropagation()}
          onTouchEnd={(e) => e.stopPropagation()}
        >
          <div 
            className="w-full max-w-md bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460] rounded-2xl border-2 border-[#00d4ff]/30 shadow-2xl"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
            }}
            onTouchStart={(e) => e.stopPropagation()}
            onTouchEnd={(e) => e.stopPropagation()}
          >
            {/* 헤더 */}
            <div className="bg-gradient-to-r from-[#0f3460] to-[#1a1a2e] p-4 rounded-t-2xl border-b border-[#00d4ff]/20">
              <div className="flex justify-between items-center">
                <h3 className="text-white font-bold text-lg flex items-center gap-2">
                  <span className="text-2xl">🛵</span>
                  운송수단
                </h3>
                <button
                  onClick={() => setShowVehicleItemPanel(false)}
                  className="text-gray-400 hover:text-white text-2xl transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-6">
              {/* 아이템 그리드 */}
              <div className="grid grid-cols-3 gap-3 max-h-[400px] overflow-y-auto">
                {vehicles.map((vehicle) => (
                  <button
                    key={vehicle.id}
                    onClick={() => {
                      if (vehicle.price === 0 || usePoints(vehicle.price, vehicle.name)) {
                        setCurrentVehicle(vehicle.id)
                        setShowVehicleItemPanel(false)
                      }
                    }}
                    className={`aspect-square p-3 rounded-xl border-2 transition-all ${
                      currentVehicle === vehicle.id
                        ? 'bg-[#00d4ff]/20 border-[#00d4ff] scale-105 shadow-lg'
                        : 'bg-[#1a1a2e] border-[#333] hover:border-[#555] hover:scale-102'
                    }`}
                  >
                    <div className="text-center h-full flex flex-col justify-center">
                      <div className="text-2xl mb-1">{vehicle.icon}</div>
                      <div className="text-white text-xs font-medium">{vehicle.name}</div>
                      <div className="text-[#ffd93d] text-xs mt-1">
                        {vehicle.price === 0 ? '무료' : `${vehicle.price}💎`}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 배경 아이템 패널 */}
      {showBackgroundItemPanel && (
        <div 
          className="fixed inset-0 z-[9999] bg-black/50 flex items-center justify-center p-4"
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            setShowBackgroundItemPanel(false)
          }}
          onTouchStart={(e) => e.stopPropagation()}
          onTouchEnd={(e) => e.stopPropagation()}
        >
          <div 
            className="w-full max-w-md bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460] rounded-2xl border-2 border-[#00d4ff]/30 shadow-2xl"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
            }}
            onTouchStart={(e) => e.stopPropagation()}
            onTouchEnd={(e) => e.stopPropagation()}
          >
            {/* 헤더 */}
            <div className="bg-gradient-to-r from-[#0f3460] to-[#1a1a2e] p-4 rounded-t-2xl border-b border-[#00d4ff]/20">
              <div className="flex justify-between items-center">
                <h3 className="text-white font-bold text-lg flex items-center gap-2">
                  <span className="text-2xl">🖼️</span>
                  배경 선택
                </h3>
                <button
                  onClick={() => setShowBackgroundItemPanel(false)}
                  className="text-gray-400 hover:text-white text-2xl transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-6">
              {/* 아이템 그리드 */}
              <div className="grid grid-cols-2 gap-3 max-h-[400px] overflow-y-auto">
                {backgrounds.map((background) => (
                  <button
                    key={background.id}
                    onClick={() => {
                      if (background.price === 0 || usePoints(background.price, background.name)) {
                        setCurrentBackground(background.id)
                        setShowBackgroundItemPanel(false)
                      }
                    }}
                    className={`aspect-video p-3 rounded-xl border-2 transition-all ${
                      currentBackground === background.id
                        ? 'bg-[#00d4ff]/20 border-[#00d4ff] scale-105 shadow-lg'
                        : 'bg-[#1a1a2e] border-[#333] hover:border-[#555] hover:scale-102'
                    }`}
                  >
                    <div className="text-center h-full flex flex-col justify-center">
                      {/* 배경 미리보기 이미지 */}
                      <div className="w-full h-16 mb-2 rounded-lg overflow-hidden border border-gray-600">
                        <img 
                          src={`/assets/background/${background.id}.png`}
                          alt={background.name}
                          className="w-full h-full object-cover"
                          style={{ imageRendering: 'pixelated' }}
                        />
                      </div>
                      <div className="text-white text-xs font-medium">{background.name}</div>
                      <div className="text-[#ffd93d] text-xs mt-1">
                        {background.price === 0 ? '무료' : `${background.price}💎`}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

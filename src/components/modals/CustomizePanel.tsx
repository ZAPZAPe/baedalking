'use client'

interface CustomizePanelProps {
  showCustomizePanel: boolean
  setShowCustomizePanel: (show: boolean) => void
  totalBoxes: number
  useBoxes: (amount: number, item: string) => boolean
}

export default function CustomizePanel({
  showCustomizePanel,
  setShowCustomizePanel,
      totalBoxes,
  useBoxes
}: CustomizePanelProps) {
  if (!showCustomizePanel) return null

  return (
    <div 
              className="fixed inset-0 z-[999999] bg-black flex items-center justify-center p-2 sm:p-4 overflow-y-auto" 
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        setShowCustomizePanel(false)
      }}
      onTouchStart={(e) => e.stopPropagation()}
      onTouchEnd={(e) => e.stopPropagation()}
    >
      <div 
        className="bg-[#16213e] rounded-2xl p-6 border-4 border-[#0f3460] shadow-2xl max-w-md w-full mx-4" 
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
        }}
        onTouchStart={(e) => e.stopPropagation()}
        onTouchEnd={(e) => e.stopPropagation()}
      >
        <h3 className="text-white text-center mb-4 font-bold text-lg">🏗️ 차고지 꾸미기</h3>
        
        {/* 탭 메뉴 */}
        <div className="flex gap-2 mb-4">
          {['차고지', '캐릭터', '운송수단'].map((tab) => (
            <button
              key={tab}
              className="flex-1 bg-[#0f3460] hover:bg-[#1a4a7a] text-white py-2 rounded-lg font-bold transition-all"
            >
              {tab}
            </button>
          ))}
        </div>

        {/* 상점 아이템들 */}
        <div className="space-y-3 max-h-64 overflow-y-auto">
          {[
            { id: 1, name: '고급 차고지', price: 500, icon: '🏗️', category: '차고지' },
            { id: 2, name: '럭셔리 차고지', price: 1000, icon: '🏰', category: '차고지' },
            { id: 3, name: '스포츠 헬멧', price: 300, icon: '⛑️', category: '캐릭터' },
            { id: 4, name: '가죽 자켓', price: 400, icon: '🧥', category: '캐릭터' },
            { id: 5, name: '스포츠 바이크', price: 800, icon: '🏍️', category: '운송수단' },
            { id: 6, name: '전기 스쿠터', price: 600, icon: '🛵', category: '운송수단' },
          ].map((item) => (
            <div key={item.id} className="flex items-center justify-between bg-[#0f3460] p-3 rounded-lg">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{item.icon}</span>
                <div>
                  <p className="text-white font-bold">{item.name}</p>
                  <p className="text-gray-300 text-sm">{item.category}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[#ffd93d] font-bold">💎{item.price}</span>
                <button 
                  onClick={() => useBoxes(item.price, item.name)}
                  className={`px-3 py-1 rounded-lg font-bold transition-all ${
                                          totalBoxes >= item.price 
                      ? 'bg-[#e94560] hover:bg-[#ff6b6b] text-white' 
                      : 'bg-gray-500 text-gray-300 cursor-not-allowed'
                  }`}
                  disabled={totalPoints < item.price}
                >
                  {totalPoints >= item.price ? '구매' : '포인트 부족'}
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 text-center">
          <p className="text-gray-300 text-sm">현재 포인트: <span className="text-[#ffd93d] font-bold">💎{totalPoints.toLocaleString()}</span></p>
        </div>
      </div>
    </div>
  )
}

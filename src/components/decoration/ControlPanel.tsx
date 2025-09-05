'use client'

import React from 'react'
import { RenderState } from '@/types'
import PixelButton from '@/components/ui/PixelButton'

interface ControlPanelProps {
  renderState: RenderState
  onStateChange: (newState: Partial<RenderState>) => void
  onDataRefresh: () => void
  isVisible: boolean
  isOwner?: boolean
}

export default function ControlPanel({
  renderState,
  onStateChange,
  onDataRefresh,
  isVisible,
  isOwner = false
}: ControlPanelProps) {
  if (!isVisible) return null

  const toggleGrid = () => {
    onStateChange({ showGrid: !renderState.showGrid })
  }

  const changeMode = (mode: 'view' | 'edit') => {
    onStateChange({ 
      currentMode: mode,
      selectedItem: mode === 'view' ? null : renderState.selectedItem
    })
  }

  return (
    <div className="space-y-4">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <h3 className="text-white font-bold text-lg">⚙️ 배치 설정</h3>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${
            renderState.currentMode === 'view' ? 'bg-blue-400' : 
            renderState.currentMode === 'edit' ? 'bg-green-400' : 'bg-gray-400'
          }`}></div>
          <span className="text-white/60 text-sm">
            {renderState.currentMode === 'view' ? '' : 
             renderState.currentMode === 'edit' ? '편집 모드' : '기타 모드'}
          </span>
        </div>
      </div>

      {/* 모드 전환 (소유자만) */}
      {isOwner && (
        <div className="space-y-2">
          <div className="text-white/80 text-sm font-medium">모드 선택</div>
          <div className="grid grid-cols-2 gap-2">
            <PixelButton
              onClick={() => changeMode('view')}
              variant={renderState.currentMode === 'view' ? 'primary' : 'secondary'}
              size="sm"
              className="p-3"
            >
              <div className="text-lg mb-1">👁️</div>
              <div className="text-xs">보기</div>
            </PixelButton>
            
            <PixelButton
              onClick={() => changeMode('edit')}
              variant={renderState.currentMode === 'edit' ? 'success' : 'secondary'}
              size="sm"
              className="p-3"
            >
              <div className="text-lg mb-1">✏️</div>
              <div className="text-xs">편집 모드</div>
            </PixelButton>
          </div>
        </div>
      )}

      {/* 표시 옵션 */}
      <div className="space-y-2">
        <div className="text-white/80 text-sm font-medium">표시 옵션</div>
        <div className="space-y-2">
          {/* 그리드 표시 토글 */}
          <div className="flex items-center justify-between p-3 bg-black/30 rounded-lg border border-white/10">
            <div className="flex items-center gap-3">
              <span className="text-lg">🏁</span>
              <div>
                <div className="text-white text-sm">그리드 표시</div>
                <div className="text-white/60 text-xs">배치 격자 라인 표시</div>
              </div>
            </div>
            <button
              onClick={toggleGrid}
              className={`relative w-12 h-6 rounded-full transition-colors duration-200 ${
                renderState.showGrid ? 'bg-green-500' : 'bg-gray-600'
              }`}
            >
              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform duration-200 ${
                renderState.showGrid ? 'translate-x-7' : 'translate-x-1'
              }`}></div>
            </button>
          </div>
        </div>
      </div>

      {/* 현재 선택된 아이템 정보 */}
      {renderState.selectedItem && (
        <div className="space-y-2">
          <div className="text-white/80 text-sm font-medium">선택된 아이템</div>
          <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/10 rounded border border-green-500/30 flex items-center justify-center overflow-hidden">
                {renderState.selectedItem.imageUrl ? (
                  <img 
                    src={renderState.selectedItem.imageUrl} 
                    alt={renderState.selectedItem.name}
                    className="w-full h-full object-contain"
                    style={{ imageRendering: 'pixelated' }}
                  />
                ) : (
                  <span className="text-white/40 text-xs">🖼️</span>
                )}
              </div>
              <div className="flex-1">
                <div className="text-green-300 font-medium text-sm">{renderState.selectedItem.name}</div>
                <div className="text-green-400/80 text-xs">
                  {renderState.selectedItem.category || '기타'}
                </div>
                {renderState.selectedItem.gridData && (
                  <div className="text-green-400/60 text-xs">
                    크기: {renderState.selectedItem.gridData.width}×{renderState.selectedItem.gridData.height}×{renderState.selectedItem.gridData.depth}
                  </div>
                )}
              </div>
            </div>
            <div className="mt-2 text-green-400 text-xs">
              차고에서 원하는 위치를 클릭하여 배치하세요
            </div>
          </div>
        </div>
      )}

      {/* 호버된 그리드 위치 */}
      {renderState.hoveredGrid && (
        <div className="space-y-2">
          <div className="text-white/80 text-sm font-medium">마우스 위치</div>
          <div className="bg-black/30 border border-white/10 rounded-lg p-3">
            <div className="text-blue-400 font-mono text-sm">
              X: {renderState.hoveredGrid.x}, Y: {renderState.hoveredGrid.y}, Z: {renderState.hoveredGrid.z}
            </div>
            <div className="text-white/60 text-xs mt-1">
              현재 마우스가 가리키는 그리드 좌표
            </div>
          </div>
        </div>
      )}

      {/* 조작 안내 */}
      <div className="space-y-2">
        <div className="text-white/80 text-sm font-medium">조작 방법</div>
        <div className="bg-black/30 border border-white/10 rounded-lg p-3 space-y-2">
          <div className="flex items-start gap-2">
            <span className="text-blue-400 text-xs">🖱️</span>
            <div className="text-white/60 text-xs">
              <div>클릭: 아이템 배치 (편집 모드)</div>
              <div>Ctrl+클릭: 아이템 제거 (보기 모드)</div>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-green-400 text-xs">📦</span>
            <div className="text-white/60 text-xs">
              인벤토리에서 아이템을 선택한 후 배치 가능
            </div>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-yellow-400 text-xs">⚠️</span>
            <div className="text-white/60 text-xs">
              충돌 시 기존 물품 상단에 배치됩니다
            </div>
          </div>
        </div>
      </div>

      {/* 새로고침 버튼 */}
      <PixelButton
        onClick={onDataRefresh}
        variant="info"
        size="md"
        fullWidth
      >
        <div className="flex items-center justify-center gap-2">
          <span className="text-lg">🔄</span>
          <span className="text-sm font-medium">데이터 새로고침</span>
        </div>
      </PixelButton>
    </div>
  )
}

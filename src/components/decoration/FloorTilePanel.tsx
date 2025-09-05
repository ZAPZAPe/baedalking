'use client'

import React, { useState, useRef, useEffect } from 'react'
import { FloorTileConfig } from '@/types'
import PixelButton from '@/components/ui/PixelButton'
import PixelInput from '@/components/ui/PixelInput'

interface FloorTilePanelProps {
  currentConfig: FloorTileConfig
  onConfigChange: (config: FloorTileConfig) => void
  isVisible: boolean
}

interface PixelData {
  x: number
  y: number
  color: string
}

export default function FloorTilePanel({
  currentConfig,
  onConfigChange,
  isVisible
}: FloorTilePanelProps) {
  const [config, setConfig] = useState<FloorTileConfig>(currentConfig)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [showEditor, setShowEditor] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  
  // 픽셀 에디터 상태
  const [pixels, setPixels] = useState<PixelData[][]>([])
  const [selectedColor, setSelectedColor] = useState('#D2B48C')
  const [isDrawing, setIsDrawing] = useState(false)
  const [brushSize, setBrushSize] = useState(1)
  const [tool] = useState<'brush'>('brush')
  
  // 타일 크기 설정
  const TILE_SIZE = 20
  const GRID_SIZE = 31

  // 색상 팔레트
  const colorPalette = [
    '#D2B48C', '#A0522D', '#8B4513', '#CD853F', // 나무색 계열
    '#F5DEB3', '#DEB887', '#D2691E', '#B8860B', // 밝은 나무색
    '#556B2F', '#6B8E23', '#808000', '#BDB76B', // 올리브 계열
    '#2F4F4F', '#708090', '#778899', '#B0C4DE', // 회색 계열
    '#FF0000', '#00FF00', '#0000FF', '#FFFF00', // 기본색
    '#FF00FF', '#00FFFF', '#FFA500', '#800080'  // 추가색
  ]

  // 초기 픽셀 데이터 생성
  useEffect(() => {
    if (!showEditor) return

    // 기존 커스텀 이미지가 있으면 로드
    if (config.type === 'custom' && config.imageUrl) {
      loadImageToPixels(config.imageUrl)
    } else {
      // 기본 체스판 패턴으로 초기화
      const initialPixels: PixelData[][] = []
      for (let y = 0; y < GRID_SIZE; y++) {
        initialPixels[y] = []
        for (let x = 0; x < GRID_SIZE; x++) {
          const isLight = (x + y) % 2 === 0
          const color = isLight ? '#D2B48C' : '#A0522D'
          initialPixels[y][x] = { x, y, color }
        }
      }
      setPixels(initialPixels)
    }
  }, [showEditor, config.imageUrl])

  // 이미지를 픽셀 데이터로 로드
  const loadImageToPixels = (imageUrl: string) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d', { willReadFrequently: true })
      if (!ctx) return

      canvas.width = GRID_SIZE * TILE_SIZE
      canvas.height = GRID_SIZE * TILE_SIZE
      
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      
      const newPixels: PixelData[][] = []
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const data = imageData.data
      
      for (let y = 0; y < GRID_SIZE; y++) {
        newPixels[y] = []
        for (let x = 0; x < GRID_SIZE; x++) {
          const pixelIndex = ((y * TILE_SIZE + TILE_SIZE / 2) * canvas.width + (x * TILE_SIZE + TILE_SIZE / 2)) * 4
          const r = data[pixelIndex]
          const g = data[pixelIndex + 1]
          const b = data[pixelIndex + 2]
          const color = `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`
          newPixels[y][x] = { x, y, color }
        }
      }
      setPixels(newPixels)
    }
    img.src = imageUrl
  }

  // 캔버스 렌더링
  useEffect(() => {
    if (!canvasRef.current || !showEditor) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const displaySize = Math.min(300, window.innerWidth - 100)
    const pixelSize = Math.floor(displaySize / GRID_SIZE)
    canvas.width = GRID_SIZE * pixelSize
    canvas.height = GRID_SIZE * pixelSize

    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.save()
    ctx.strokeStyle = '#666'
    ctx.lineWidth = 1
    
    pixels.forEach(row => {
      row.forEach(pixel => {
        const x = pixel.x * pixelSize
        const y = pixel.y * pixelSize
        ctx.fillStyle = pixel.color
        ctx.fillRect(x, y, pixelSize, pixelSize)
        ctx.strokeRect(x, y, pixelSize, pixelSize)
      })
    })
    
    ctx.restore()
  }, [pixels, showEditor])

  // 마우스 이벤트 처리
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true)
    drawPixel(e)
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return
    drawPixel(e)
  }

  const handleMouseUp = () => {
    setIsDrawing(false)
  }

  const drawPixel = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return

    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    const displaySize = Math.min(300, window.innerWidth - 100)
    const pixelSize = Math.floor(displaySize / GRID_SIZE)
    const x = Math.floor((e.clientX - rect.left) / pixelSize)
    const y = Math.floor((e.clientY - rect.top) / pixelSize)

    if (x >= 0 && x < GRID_SIZE && y >= 0 && y < GRID_SIZE) {
      setPixels(prev => {
        let hasChanges = false
        const newPixels = prev.map(row => [...row])
        
        // 브러시로 픽셀 색칠
        for (let dy = 0; dy < brushSize; dy++) {
          for (let dx = 0; dx < brushSize; dx++) {
            const px = x + dx
            const py = y + dy
            if (px >= 0 && px < GRID_SIZE && py >= 0 && py < GRID_SIZE) {
              if (newPixels[py][px].color !== selectedColor) {
                newPixels[py][px] = { x: px, y: py, color: selectedColor }
                hasChanges = true
              }
            }
          }
        }
        
        return hasChanges ? newPixels : prev
      })
    }
  }

  // 픽셀 에디터 적용
  const applyPixelEditor = async () => {
    setIsSaving(true)
    
    const canvas = document.createElement('canvas')
    canvas.width = GRID_SIZE
    canvas.height = GRID_SIZE
    const ctx = canvas.getContext('2d')
    
    if (ctx) {
      pixels.forEach(row => {
        row.forEach(pixel => {
          ctx.fillStyle = pixel.color
          ctx.fillRect(pixel.x, pixel.y, 1, 1)
        })
      })
      
      const imageUrl = canvas.toDataURL('image/png')
      const newConfig = {
        type: 'custom' as const,
        imageUrl,
        pattern: 'custom' as const,
        opacity: config.opacity || 0.8,
        scale: config.scale || 1.0
      }
      
      try {
        await handleConfigChange(newConfig)
        setShowEditor(false)
      } catch (error) {
        console.error('픽셀 에디터 적용 실패:', error)
      } finally {
        setIsSaving(false)
      }
    }
  }

  // 전체 지우기
  const clearCanvas = () => {
    const newPixels: PixelData[][] = []
    for (let y = 0; y < GRID_SIZE; y++) {
      newPixels[y] = []
      for (let x = 0; x < GRID_SIZE; x++) {
        newPixels[y][x] = { x, y, color: '#FFFFFF' }
      }
    }
    setPixels(newPixels)
  }

  // 체스판 패턴으로 리셋
  const resetToCheckerboard = () => {
    const newPixels: PixelData[][] = []
    for (let y = 0; y < GRID_SIZE; y++) {
      newPixels[y] = []
      for (let x = 0; x < GRID_SIZE; x++) {
        const isLight = (x + y) % 2 === 0
        const color = isLight ? '#D2B48C' : '#A0522D'
        newPixels[y][x] = { x, y, color }
      }
    }
    setPixels(newPixels)
  }

  if (!isVisible) return null

  const handleConfigChange = async (updates: Partial<FloorTileConfig>) => {
    console.log('🔄 FloorTilePanel handleConfigChange 호출:', updates)
    const newConfig = { ...config, ...updates }
    console.log('📋 새로운 전체 설정:', newConfig)
    setConfig(newConfig)
    
    // 저장 상태 표시
    setIsSaving(true)
    
    try {
      await onConfigChange(newConfig)
      console.log('✅ FloorTilePanel 설정 변경 완료')
    } catch (error) {
      console.error('❌ FloorTilePanel 설정 변경 실패:', error)
    } finally {
      // 저장 완료 표시
      setTimeout(() => {
        setIsSaving(false)
      }, 1000)
    }
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const imageUrl = e.target?.result as string
        handleConfigChange({
          type: 'custom',
          imageUrl,
          pattern: 'custom'
        })
      }
      reader.readAsDataURL(file)
    }
  }


  return (
    <div className="space-y-4 pb-4 mx-4 mb-4 bg-black/20 backdrop-blur-sm rounded-lg p-4 border border-white/10">
      {/* 헤더 */}
      <div className="flex items-center justify-center">
        <div className="flex items-center gap-2">
          <h3 className="text-white font-bold text-lg">🏗️ 바닥 타일 설정</h3>
          {isSaving && (
            <span className="text-[#00ff88] text-sm animate-pulse">💾 저장 중...</span>
          )}
        </div>
      </div>

      {/* 타일 타입 선택 */}
      <div className="space-y-3">
        <div>
          <div className="flex gap-2 justify-center">
            <PixelButton
              onClick={() => fileInputRef.current?.click()}
              variant={config.type === 'custom' ? 'primary' : 'secondary'}
              size="sm"
            >
              이미지 적용
            </PixelButton>
            <PixelButton
              onClick={() => setShowEditor(true)}
              variant="success"
              size="sm"
            >
              🎨 커스텀 타일 적용
            </PixelButton>
          </div>
        </div>

        {/* 파일 업로드 (숨겨진 input) */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileUpload}
          className="hidden"
        />

        {/* 사용자 이미지 미리보기 */}
        {config.type === 'custom' && config.imageUrl && (
          <div className="bg-black/30 rounded-lg p-3 border border-white/20">
            <div className="text-white text-sm font-medium mb-2">미리보기</div>
            <div className="w-16 h-16 mx-auto border border-white/30 rounded overflow-hidden">
              <img
                src={config.imageUrl}
                alt="바닥 타일"
                className="w-full h-full object-cover"
                style={{ imageRendering: 'pixelated' }}
              />
            </div>
            <PixelButton
              onClick={() => setShowEditor(true)}
              variant="secondary"
              size="sm"
              className="mt-2 w-full"
            >
              픽셀 에디터로 변경
            </PixelButton>
          </div>
        )}

      </div>

      {/* 안내 메시지 */}
      <div className="text-center">
        <div className="text-white/40 text-xs">
          바닥 타일 설정이 즉시 적용됩니다
        </div>
      </div>

      {/* 픽셀 에디터 인라인 */}
      {showEditor && (
        <div className="space-y-4 mt-4 p-4 bg-black/30 rounded-lg border border-white/20">
          <div className="flex items-center justify-between">
            <h3 className="text-white text-lg font-bold">🎨 픽셀 에디터</h3>
            <PixelButton onClick={() => setShowEditor(false)} variant="secondary" size="sm">
              ✕ 닫기
            </PixelButton>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* 캔버스 영역 */}
            <div className="space-y-3">
              <div className="text-center">
                <p className="text-white/60 text-sm mb-2">
                  마우스로 드래그하여 픽셀을 색칠하세요
                </p>
              </div>
              
              <div className="flex justify-center">
                <canvas
                  ref={canvasRef}
                  className="border border-white/30 bg-white cursor-crosshair"
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                />
              </div>

              {/* 브러시 크기 */}
              <div className="space-y-2">
                <div>
                  <label className="text-white text-sm font-medium mb-1 block">
                    브러시 크기: {brushSize}x{brushSize}
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    value={brushSize}
                    onChange={(e) => setBrushSize(parseInt(e.target.value))}
                    className="w-full"
                  />
                </div>

                <div className="flex gap-2 justify-center">
                  <PixelButton onClick={clearCanvas} variant="secondary" size="sm" className="text-xs">
                    🗑️ 전체 지우기
                  </PixelButton>
                  <PixelButton onClick={resetToCheckerboard} variant="secondary" size="sm" className="text-xs">
                    🔄 기본 배경으로 변경
                  </PixelButton>
                </div>
              </div>
            </div>

            {/* 컨트롤 패널 */}
            <div className="space-y-3">
              {/* 색상 선택 */}
              <div>
                <h4 className="text-white text-sm font-medium mb-2">색상 팔레트</h4>
                <div className="grid grid-cols-8 gap-1">
                  {colorPalette.map((color, index) => (
                    <button
                      key={index}
                      className={`w-6 h-6 rounded border transition-all ${
                        selectedColor === color ? 'border-white scale-110' : 'border-white/30'
                      }`}
                      style={{ backgroundColor: color }}
                      onClick={() => setSelectedColor(color)}
                      title={color}
                    />
                  ))}
                </div>
                
                {/* 커스텀 색상 */}
                <div className="mt-2">
                  <label className="text-white text-xs font-medium mb-1 block">커스텀 색상</label>
                  <input
                    type="color"
                    value={selectedColor}
                    onChange={(e) => setSelectedColor(e.target.value)}
                    className="w-full h-8 rounded border border-white/20 bg-transparent"
                  />
                </div>
              </div>

              {/* 적용 버튼 */}
              <div className="pt-2">
                <PixelButton
                  onClick={applyPixelEditor}
                  variant="success"
                  size="sm"
                  fullWidth
                  disabled={isSaving}
                >
                  {isSaving ? '💾 적용 중...' : '✅ 타일에 적용'}
                </PixelButton>
              </div>

              {/* 안내 */}
              <div className="text-center">
                <div className="text-white/40 text-xs">
                  픽셀 에디터에서 만든 디자인이 3D 바닥에 즉시 적용됩니다
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

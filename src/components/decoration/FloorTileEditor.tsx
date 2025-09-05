'use client'

import React, { useState, useRef, useEffect } from 'react'
import { FloorTileConfig } from '@/types'
import PixelButton from '@/components/ui/PixelButton'

interface FloorTileEditorProps {
  currentConfig: FloorTileConfig
  onConfigChange: (config: FloorTileConfig) => void
  isVisible: boolean
  onClose: () => void
}

interface PixelData {
  x: number
  y: number
  color: string
}

export default function FloorTileEditor({
  currentConfig,
  onConfigChange,
  isVisible,
  onClose
}: FloorTileEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [pixels, setPixels] = useState<PixelData[][]>([])
  const [selectedColor, setSelectedColor] = useState('#D2B48C')
  const [isDrawing, setIsDrawing] = useState(false)
  const [brushSize, setBrushSize] = useState(1)
  const [tool, setTool] = useState<'brush' | 'fill' | 'eyedropper'>('brush')
  const [isSaving, setIsSaving] = useState(false)
  
  // 타일 크기 설정 (이소메트릭 타일을 정면으로 보는 크기)
  const TILE_SIZE = 20 // 픽셀 크기
  const GRID_SIZE = 31 // 31x31 픽셀 그리드 (3D 바닥과 맞춤)

  // 초기 픽셀 데이터 생성
  useEffect(() => {
    if (!isVisible) return

    // 기존 커스텀 이미지가 있으면 로드
    if (currentConfig.type === 'custom' && currentConfig.imageUrl) {
      loadImageToPixels(currentConfig.imageUrl)
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
  }, [isVisible, currentConfig.imageUrl])

  // 이미지를 픽셀 데이터로 로드
  const loadImageToPixels = (imageUrl: string) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d', { willReadFrequently: true })
      if (!ctx) return

      canvas.width = GRID_SIZE * TILE_SIZE
      canvas.height = GRID_SIZE * TILE_SIZE
      
      // 이미지를 캔버스에 그리기
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      
      // 픽셀 데이터 추출 (성능 최적화)
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
    if (!canvasRef.current || !isVisible) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // 캔버스 크기 설정 (31x31 픽셀을 표시하기 위해 크기 조정)
    const displaySize = Math.min(400, window.innerWidth - 100) // 최대 400px
    const pixelSize = Math.floor(displaySize / GRID_SIZE)
    canvas.width = GRID_SIZE * pixelSize
    canvas.height = GRID_SIZE * pixelSize

    // 배경 지우기
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // 픽셀 그리기 (성능 최적화)
    ctx.save()
    
    // 경계선 스타일 설정
    ctx.strokeStyle = '#666'
    ctx.lineWidth = 1
    
    pixels.forEach(row => {
      row.forEach(pixel => {
        const x = pixel.x * pixelSize
        const y = pixel.y * pixelSize
        
        // 채우기
        ctx.fillStyle = pixel.color
        ctx.fillRect(x, y, pixelSize, pixelSize)
        
        // 경계선
        ctx.strokeRect(x, y, pixelSize, pixelSize)
      })
    })
    
    ctx.restore()
  }, [pixels, isVisible])

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
    const displaySize = Math.min(400, window.innerWidth - 100)
    const pixelSize = Math.floor(displaySize / GRID_SIZE)
    const x = Math.floor((e.clientX - rect.left) / pixelSize)
    const y = Math.floor((e.clientY - rect.top) / pixelSize)

    if (x >= 0 && x < GRID_SIZE && y >= 0 && y < GRID_SIZE) {
      if (tool === 'eyedropper') {
        // 색상 추출
        const color = pixels[y][x].color
        setSelectedColor(color)
        return
      }

      setPixels(prev => {
        // 변경된 픽셀이 있는지 확인
        let hasChanges = false
        const newPixels = prev.map(row => [...row])
        
        if (tool === 'brush') {
          // 브러시 크기에 따라 여러 픽셀 색칠
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
        } else if (tool === 'fill') {
          // 채우기 도구 (Flood Fill)
          const targetColor = newPixels[y][x].color
          if (targetColor !== selectedColor) {
            const stack: [number, number][] = [[x, y]]
            while (stack.length > 0) {
              const [cx, cy] = stack.pop()!
              if (cx < 0 || cx >= GRID_SIZE || cy < 0 || cy >= GRID_SIZE) continue
              if (newPixels[cy][cx].color !== targetColor) continue
              
              newPixels[cy][cx] = { x: cx, y: cy, color: selectedColor }
              hasChanges = true
              
              stack.push([cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1])
            }
          }
        }
        
        // 변경사항이 없으면 이전 상태 반환
        return hasChanges ? newPixels : prev
      })
    }
  }

  // 색상 팔레트
  const colorPalette = [
    '#D2B48C', '#A0522D', '#8B4513', '#CD853F', // 나무색 계열
    '#F5DEB3', '#DEB887', '#D2691E', '#B8860B', // 밝은 나무색
    '#556B2F', '#6B8E23', '#808000', '#BDB76B', // 올리브 계열
    '#2F4F4F', '#708090', '#778899', '#B0C4DE', // 회색 계열
    '#FF0000', '#00FF00', '#0000FF', '#FFFF00', // 기본색
    '#FF00FF', '#00FFFF', '#FFA500', '#800080'  // 추가색
  ]

  // 적용 버튼
  const applyChanges = async () => {
    console.log('🎨 픽셀 에디터 적용 시작')
    setIsSaving(true)
    
    // 픽셀 데이터를 이미지로 변환 (15x15 픽셀 크기로 생성)
    const canvas = document.createElement('canvas')
    canvas.width = GRID_SIZE  // 15
    canvas.height = GRID_SIZE // 15
    const ctx = canvas.getContext('2d')
    
    if (ctx) {
      // 각 픽셀을 1x1 크기로 그리기
      pixels.forEach(row => {
        row.forEach(pixel => {
          ctx.fillStyle = pixel.color
          ctx.fillRect(
            pixel.x,  // 0-14 범위
            pixel.y,  // 0-14 범위
            1,        // 1x1 픽셀
            1         // 1x1 픽셀
          )
        })
      })
      
      // 캔버스를 이미지 URL로 변환
      const imageUrl = canvas.toDataURL('image/png')
      console.log('📸 생성된 이미지 크기:', canvas.width, 'x', canvas.height)
      console.log('📸 생성된 이미지 URL:', imageUrl.substring(0, 100) + '...')
      
      // 설정 업데이트
      const newConfig = {
        type: 'custom' as const,
        imageUrl,
        pattern: 'custom' as const,
        opacity: currentConfig.opacity || 0.8,
        scale: currentConfig.scale || 1.0
      }
      
      console.log('⚙️ 새로운 설정:', newConfig)
      try {
        await onConfigChange(newConfig)
        console.log('✅ 설정 변경 완료')
      } catch (error) {
        console.error('❌ 설정 변경 실패:', error)
      } finally {
        setIsSaving(false)
      }
      
      // 저장 완료 표시
      setTimeout(() => {
        setIsSaving(false)
        onClose()
      }, 1000)
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

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-black/90 border border-white/20 rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-white text-xl font-bold">🎨 바닥 타일 픽셀 에디터</h2>
          <PixelButton onClick={onClose} variant="secondary" size="sm">
            ✕ 닫기
          </PixelButton>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 캔버스 영역 */}
          <div className="space-y-4">
            <div className="text-center">
              <h3 className="text-white text-lg font-medium mb-2">픽셀 캔버스</h3>
              <p className="text-white/60 text-sm mb-4">
                {tool === 'brush' && '마우스로 드래그하여 픽셀을 색칠하세요'}
                {tool === 'fill' && '클릭하여 같은 색상 영역을 채우세요'}
                {tool === 'eyedropper' && '클릭하여 색상을 추출하세요'}
              </p>
            </div>
            
            <div className="flex justify-center">
              <canvas
                ref={canvasRef}
                className={`border border-white/30 bg-white ${
                  tool === 'brush' ? 'cursor-crosshair' :
                  tool === 'fill' ? 'cursor-pointer' :
                  'cursor-copy'
                }`}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
              />
            </div>

            {/* 도구 */}
            <div className="space-y-3">
              {/* 도구 선택 */}
              <div>
                <label className="text-white text-sm font-medium mb-2 block">도구</label>
                <div className="flex gap-2">
                  <button
                    className={`px-3 py-2 rounded border-2 transition-all ${
                      tool === 'brush' ? 'border-white bg-white/20' : 'border-white/30'
                    }`}
                    onClick={() => setTool('brush')}
                    title="브러시"
                  >
                    🖌️
                  </button>
                  <button
                    className={`px-3 py-2 rounded border-2 transition-all ${
                      tool === 'fill' ? 'border-white bg-white/20' : 'border-white/30'
                    }`}
                    onClick={() => setTool('fill')}
                    title="채우기"
                  >
                    🎨
                  </button>
                  <button
                    className={`px-3 py-2 rounded border-2 transition-all ${
                      tool === 'eyedropper' ? 'border-white bg-white/20' : 'border-white/30'
                    }`}
                    onClick={() => setTool('eyedropper')}
                    title="색상 추출"
                  >
                    🕵️
                  </button>
                </div>
              </div>

              {/* 브러시 크기 (브러시 도구일 때만 표시) */}
              {tool === 'brush' && (
                <div>
                  <label className="text-white text-sm font-medium mb-2 block">
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
              )}

              <div className="flex gap-2">
                <PixelButton onClick={clearCanvas} variant="secondary" size="sm">
                  🗑️ 전체 지우기
                </PixelButton>
                <PixelButton onClick={resetToCheckerboard} variant="secondary" size="sm">
                  🔄 체스판 리셋
                </PixelButton>
              </div>
            </div>
          </div>

          {/* 컨트롤 패널 */}
          <div className="space-y-4">
            {/* 색상 선택 */}
            <div>
              <h3 className="text-white text-lg font-medium mb-3">색상 팔레트</h3>
              <div className="grid grid-cols-8 gap-2">
                {colorPalette.map((color, index) => (
                  <button
                    key={index}
                    className={`w-8 h-8 rounded border-2 transition-all ${
                      selectedColor === color ? 'border-white scale-110' : 'border-white/30'
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => setSelectedColor(color)}
                    title={color}
                  />
                ))}
              </div>
              
              {/* 커스텀 색상 */}
              <div className="mt-3">
                <label className="text-white text-sm font-medium mb-2 block">커스텀 색상</label>
                <input
                  type="color"
                  value={selectedColor}
                  onChange={(e) => setSelectedColor(e.target.value)}
                  className="w-full h-10 rounded border border-white/20 bg-transparent"
                />
              </div>
            </div>

            {/* 설정 */}
            <div className="space-y-3">
              <h3 className="text-white text-lg font-medium">타일 설정</h3>
              
              <div>
                <label className="text-white text-sm font-medium mb-2 block">
                  투명도: {Math.round((currentConfig.opacity || 0.8) * 100)}%
                </label>
                <input
                  type="range"
                  min="0.1"
                  max="1.0"
                  step="0.1"
                  value={currentConfig.opacity || 0.8}
                  onChange={(e) => onConfigChange({ ...currentConfig, opacity: parseFloat(e.target.value) })}
                  className="w-full"
                />
              </div>

              <div>
                <label className="text-white text-sm font-medium mb-2 block">
                  크기: {Math.round((currentConfig.scale || 1.0) * 100)}%
                </label>
                <input
                  type="range"
                  min="0.5"
                  max="2.0"
                  step="0.1"
                  value={currentConfig.scale || 1.0}
                  onChange={(e) => onConfigChange({ ...currentConfig, scale: parseFloat(e.target.value) })}
                  className="w-full"
                />
              </div>
            </div>

            {/* 적용 버튼 */}
            <div className="pt-4">
              <PixelButton
                onClick={applyChanges}
                variant="success"
                size="lg"
                fullWidth
              >
                ✅ 타일에 적용
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
    </div>
  )
}

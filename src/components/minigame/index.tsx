'use client'

import { useEffect, useRef, useState } from 'react'
import { MiniGameCanvasProps, GameObject } from '@/lib/minigame/types'
import { MiniGameEngine } from '@/lib/minigame/MiniGameEngine'
// PIXI.js 인벤토리 UI 제거됨 - HTML/CSS 기반으로 변경

export default function MiniGarageCanvas({
  width,
  height,
  mode = 'minigarage',
  onTileClick,
  onObjectClick,
  userId, // 사용자별 타일맵 로드를 위한 userId 추가
  // PIXI.js 인벤토리 토글 제거됨 - HTML/CSS 기반으로 변경
}: MiniGameCanvasProps & { 
  userId?: string
  // PIXI.js 인벤토리 토글 제거됨 - HTML/CSS 기반으로 변경
}) {
  const canvasRef = useRef<HTMLDivElement>(null)
  const engineRef = useRef<MiniGameEngine | null>(null)
  const isInitializingRef = useRef(false)
  const isMountedRef = useRef(true)
  const isLoadedRef = useRef(false) // 최신 로딩 상태를 추적하는 ref
  const timeoutsRef = useRef<{ loading?: NodeJS.Timeout, fail?: NodeJS.Timeout }>({})
  const [isLoaded, setIsLoaded] = useState(false)
  const [hasError, setHasError] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [loadingStep, setLoadingStep] = useState('준비 중...')
  // 타임아웃 정리 함수
  const clearAllTimeouts = () => {
    if (timeoutsRef.current.loading) {
      clearTimeout(timeoutsRef.current.loading)
      timeoutsRef.current.loading = undefined
    }
    if (timeoutsRef.current.fail) {
      clearTimeout(timeoutsRef.current.fail)
      timeoutsRef.current.fail = undefined
    }
  }

  // HTML 이벤트 리스너 제거됨 - 미니게임 내부 HUD 버튼만 사용

  useEffect(() => {
    if (!canvasRef.current || isInitializingRef.current || !isMountedRef.current) {
      return
    }

    // 게임 엔진 초기화
    const initializeEngine = async () => {
      // 중복 초기화 방지 (더 강화)
      if (isInitializingRef.current || engineRef.current) {
        // 기존 엔진이 있다면 즉시 로딩 완료 처리
        if (engineRef.current && isMountedRef.current) {
          clearAllTimeouts() // 기존 타임아웃 정리
          isLoadedRef.current = true
          setIsLoaded(true)
          setHasError(false)
        }
        return
      }

      isInitializingRef.current = true
      setHasError(false)
      setErrorMessage('')
      setLoadingStep('준비 중...')

      try {
        // 지연 없이 바로 시작 (최대 성능)
        
        // 마운트 상태 체크
        if (!isMountedRef.current || !canvasRef.current) {
          return
        }
        
        setLoadingStep('게임 준비 중...')
        
        // 컴포넌트가 언마운트되었는지 다시 체크
        if (!isMountedRef.current || !canvasRef.current) {
          return
        }

        setLoadingStep('설정 중...')
        
        // ✅ 올바른 MiniGameEngine 초기화 방식
        const engine = new MiniGameEngine()
        
        // 초기화 진행
        setLoadingStep('엔진 초기화 중...')
        await engine.initialize(canvasRef.current, width || 800, height || 600, userId)
        
        // 🎯 사용자 ID 설정 및 캐릭터 초기화
        if (userId) {
          setLoadingStep('캐릭터 로딩 중...')
          await engine.setUserId(userId)
        }
        
        // 콜백 설정 (초기화 완료 후)
        if (onTileClick) {
          engine.onTileClick = (x, y, z) => {
            if (!isMountedRef.current) return
            onTileClick(x, y, z)
          }
        }
        
        if (onObjectClick) {
          engine.onObjectClick = (object) => {
            if (!isMountedRef.current) return
            onObjectClick(object)
          }
        }

        
        // 다시 마운트 상태 체크
        if (!isMountedRef.current) {
          engine.destroy()
          return
        }

        engineRef.current = engine
        
        // MiniGameEngine을 전역에 저장 (SceneManager에서 접근 가능하도록)
        ;(engine.app.stage as any).miniGameEngine = engine
        ;(window as any).currentMiniGameEngine = engine
        ;(window as any).engineRef = engineRef
        
        // 인벤토리 UI 콜백 설정
        // PIXI.js 인벤토리 토글 제거됨 - HTML/CSS 기반으로 변경
        
        setLoadingStep('거의 완료...')
        
        // 🎯 사용자 타일맵 로드 또는 기본 그리드 생성
        setLoadingStep('타일맵 로딩 중...')
        
        try {
          // 사용자 타일맵을 로드하거나 기본 그리드 생성
          engine.createGrid()
        } catch (error) {
          console.warn('타일맵/그리드 생성 중 오류:', error)
        }
        
        // 로딩 완료 처리
        if (isMountedRef.current) {
          setLoadingStep('완료!')
          clearAllTimeouts()
          
          // 상태를 강제로 업데이트
          isLoadedRef.current = true
          setIsLoaded(true)
          setHasError(false)
        }
        
        // PIXI 앱 안정화 대기 (백업 타임아웃) - 조건부 설정
        if (!isLoadedRef.current) {
          timeoutsRef.current.loading = setTimeout(() => {
            if (isMountedRef.current && !isLoadedRef.current) {
              isLoadedRef.current = true
              setIsLoaded(true)
              clearAllTimeouts() // 추가 타임아웃 정리
            }
          }, 100) // 0.1초로 대폭 단축!
          
          // 로딩 실패 타임아웃 (최종 안전장치)
          timeoutsRef.current.fail = setTimeout(() => {
            if (isMountedRef.current && !isLoadedRef.current) {
              setHasError(true)
              setErrorMessage('로딩 시간 초과 - 페이지를 새로고침해주세요')
              clearAllTimeouts()
            }
          }, 2000) // 2초로 단축 (빠른 피드백)
        } else {
        }

      } catch (error) {
        if (isMountedRef.current) {
          // "초기화 중 엔진이 파괴됨" 에러는 정상적인 경우이므로 에러 상태로 표시하지 않음
          const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다'
          if (errorMessage.includes('초기화 중 엔진이 파괴됨')) {
          } else {
            setHasError(true)
            setErrorMessage(errorMessage)
          }
        }
      } finally {
        isInitializingRef.current = false
      }
    }

    initializeEngine()

    // 클린업 (React Strict Mode 대응)
    return () => {
      isMountedRef.current = false
      
      // 타임아웃들 정리
      clearAllTimeouts()
      
      // React Strict Mode에서는 엔진을 파괴하지 않고 보존 (개발 모드 최적화)
      if (engineRef.current && process.env.NODE_ENV === 'production') {
        try {
          engineRef.current.destroy()
          engineRef.current = null
        } catch (error) {
        }
      } else if (engineRef.current) {
      }
      
      // 상태만 리셋 (엔진은 보존)
      isLoadedRef.current = false
      setIsLoaded(false)
      isInitializingRef.current = false
    }
  }, []) // dependency array 최소화로 React Strict Mode 영향 최소화

  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
    }
  }, [])

  // 강제 로딩 완료 핸들러 (디버깅용)
  const forceCompleteLoading = () => {
    clearAllTimeouts()
    isLoadedRef.current = true
    setIsLoaded(true)
    setHasError(false)
    setLoadingStep('완료!')
  }

  // 오브젝트 추가 핸들러
  const handleAddObject = () => {
    if (!engineRef.current) return

    const newObject: GameObject = {
      id: `object-${Date.now()}`,
      type: 'furniture',
      position: { x: 2, y: 2, z: 0 },
      size: { width: 64, height: 64 },
      isInteractable: true,
      data: { name: '새로운 가구' }
    }

    engineRef.current.addObject(newObject)
  }

  return (
      <div className="relative w-full h-full" style={{ 
        width: '100%', 
        height: '100%',
        margin: 0,
        padding: 0,
        overflow: 'hidden', // 반응형 캔버스를 위해 hidden으로 설정
        position: 'relative', // 반응형 캔버스를 위한 위치 설정
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center' // 정사각형 캔버스 중앙 정렬
      }}>
        {/* 캔버스 - 정사각형 반응형 */}
        <div
          ref={canvasRef}
          className="w-full h-full"
          style={{ 
            width: '100%', 
            height: '100%',
            display: 'block',
            margin: 0,
            padding: 0,
            border: 0,
            position: 'relative' // 반응형 캔버스를 위한 위치 설정
          }}
        />

      {/* 로딩 상태 */}
      {(() => {
        const shouldShowLoading = !isLoaded && !hasError
        return shouldShowLoading ? (
          <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center rounded-lg">
            <div className="text-white text-xl mb-4">🎮</div>
            <div className="text-white text-lg mb-2">로딩중...</div>
            <div className="text-gray-300 text-sm mb-4">{loadingStep}</div>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          </div>
        ) : null
      })()}

      {/* 에러 상태 */}
      {hasError && (
        <div className="absolute inset-0 bg-red-900/80 flex flex-col items-center justify-center rounded-lg">
          <div className="text-white text-xl mb-2">😅</div>
          <div className="text-white text-lg mb-2">앗, 문제가 발생했어요!</div>
          <div className="text-red-200 text-sm text-center px-4 mb-4">
            잠시 후 다시 시도해주세요
          </div>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm transition-colors"
          >
            다시 시도
          </button>
        </div>
      )}

    </div>
  )
}

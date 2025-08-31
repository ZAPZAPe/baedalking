'use client'

import { useEffect, useRef } from 'react'

interface KakaoAdProps {
  adUnit: string
  width?: number
  height?: number
  className?: string
}

export default function KakaoAd({ 
  adUnit, 
  width = 320, 
  height = 100, 
  className = '' 
}: KakaoAdProps) {
  const adRef = useRef<HTMLDivElement>(null)
  const scriptRef = useRef<HTMLScriptElement | null>(null)
  const isInitialized = useRef(false)

  useEffect(() => {
    // React 개발 모드에서 중복 실행 방지
    if (isInitialized.current) {
      return
    }
    
    // 기존 광고 스크립트 안전하게 제거
    if (scriptRef.current && document.head.contains(scriptRef.current)) {
      try {
        document.head.removeChild(scriptRef.current)
        scriptRef.current = null
      } catch (error) {
        console.log('📝 기존 스크립트가 이미 제거됨')
      }
    }

    // 광고 컨테이너 초기화
    if (adRef.current) {
      adRef.current.innerHTML = ''
      
      // 광고 요소 생성
      const adElement = document.createElement('ins')
      adElement.className = 'kakao_ad_area'
      adElement.setAttribute('data-ad-unit', adUnit)
      adElement.setAttribute('data-ad-width', width.toString())
      adElement.setAttribute('data-ad-height', height.toString())
      
      adRef.current.appendChild(adElement)
    }

    // 광고 스크립트 동적 로드
    const script = document.createElement('script')
    script.type = 'text/javascript'
    script.src = '//t1.daumcdn.net/kas/static/ba.min.js'
    script.async = true
    
    // 스크립트 로드 완료 후 광고 초기화
    script.onload = () => {
      console.log('✅ 카카오 광고 스크립트 로드 완료')
      // 광고 초기화를 위한 약간의 지연
      setTimeout(() => {
        if (window.kakao && window.kakao.ad) {
          window.kakao.ad.init()
          console.log('✅ 카카오 광고 초기화 완료')
        }
      }, 100)
    }
    
    script.onerror = () => {
      console.error('❌ 카카오 광고 스크립트 로드 실패')
    }
    
    document.head.appendChild(script)
    scriptRef.current = script
    isInitialized.current = true

    // 컴포넌트 언마운트 시 정리
    return () => {
      if (scriptRef.current && document.head.contains(scriptRef.current)) {
        try {
          document.head.removeChild(scriptRef.current)
          scriptRef.current = null
        } catch (error) {
          console.log('📝 정리 시 스크립트가 이미 제거됨')
        }
      }
      isInitialized.current = false
    }
  }, [adUnit, width, height])

  return (
    <div 
      ref={adRef}
      className={`bg-gradient-to-br from-[#2d2d2d]/90 to-[#1a1a1a]/90 backdrop-blur-lg rounded-xl sm:rounded-2xl p-3 border border-gray-600/20 shadow-2xl text-center flex-shrink-0 min-h-[100px] flex items-center justify-center ${className}`}
    >
      <div className="flex items-center justify-center text-gray-500 text-sm">
        광고 로딩 중...
      </div>
    </div>
  )
}

// TypeScript 전역 타입 선언
declare global {
  interface Window {
    kakao?: {
      ad?: {
        init: () => void
      }
    }
  }
}

'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

// 마을 에디터 제거됨 - 더 이상 사용하지 않음

export default function AdminPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-spin">⚙️</div>
          <div className="text-white text-xl">관리자 페이지 로딩 중...</div>
        </div>
      </div>
    )
  }

  if (!user) {
    router.push('/login')
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-white">
      {/* 헤더 */}
      <header className="bg-white/10 backdrop-blur-sm border-b border-white/20 p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/')}
              className="text-white/80 hover:text-white transition-colors"
            >
              ← 홈으로
            </button>
            <h1 className="text-2xl font-bold">⚙️ 관리자 페이지</h1>
          </div>
          <div className="text-sm text-white/60">
            배달킹 관리자 전용 도구
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* 차고 타일맵 에디터 */}
          <Link href="/admin/tilemap-editor">
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-8 border border-white/20 hover:border-white/30 transition-all cursor-pointer group">
              <div className="text-center">
                <div className="text-8xl mb-6 group-hover:scale-110 transition-transform">🚗</div>
                <h3 className="text-2xl font-bold mb-4">차고 타일맵 에디터</h3>
                <div className="text-sm text-orange-300 bg-orange-500/20 px-4 py-2 rounded-lg">
                  128개 Landscape 타일, JSON 내보내기/불러오기
                </div>
              </div>
            </div>
          </Link>

          {/* 아이템 복셀 에디터 */}
          <Link href="/admin/item-voxel-editor">
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-8 border border-white/20 hover:border-white/30 transition-all cursor-pointer group">
              <div className="text-center">
                <div className="text-8xl mb-6 group-hover:scale-110 transition-transform">🏠</div>
                <h3 className="text-2xl font-bold mb-4">아이템 복셀 에디터</h3>
                <div className="text-sm text-purple-300 bg-purple-500/20 px-4 py-2 rounded-lg">
                  3D 복셀 매핑, 레이어 편집, 충돌 감지
                </div>
              </div>
            </div>
          </Link>

          {/* 캐릭터 상점 관리 */}
          <Link href="/admin/character-shop">
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-8 border border-white/20 hover:border-white/30 transition-all cursor-pointer group">
              <div className="text-center">
                <div className="text-8xl mb-6 group-hover:scale-110 transition-transform">🎭</div>
                <h3 className="text-2xl font-bold mb-4">캐릭터 상점 관리</h3>
                <div className="text-sm text-pink-300 bg-pink-500/20 px-4 py-2 rounded-lg">
                  캐릭터 등록, 감정표현 관리, 가격 설정
                </div>
              </div>
            </div>
          </Link>
        </div>

      </div>
    </div>
  )
}

'use client'

import React from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* 캐릭터 아이템 에디터 */}
          <Link href="/admin/character-item-editor">
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/20 hover:border-white/30 transition-all cursor-pointer group">
              <div className="text-center">
                <div className="text-6xl mb-4 group-hover:scale-110 transition-transform">👤</div>
                <h3 className="text-xl font-bold mb-2">캐릭터 아이템 에디터</h3>
                <p className="text-white/60 text-sm mb-4">
                  캐릭터용 아이템을 등록하고 관리합니다
                </p>
                <div className="text-xs text-blue-300">
                  감정, 액세서리 (기본 캐릭터 이미지 사용)
                </div>
              </div>
            </div>
          </Link>

          {/* 미니차고 아이템 에디터 */}
          <Link href="/admin/garage-item-editor">
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/20 hover:border-white/30 transition-all cursor-pointer group">
              <div className="text-center">
                <div className="text-6xl mb-4 group-hover:scale-110 transition-transform">🏠</div>
                <h3 className="text-xl font-bold mb-2">미니차고 아이템 에디터</h3>
                <p className="text-white/60 text-sm mb-4">
                  3D 미니차고용 아이템을 등록하고 관리합니다
                </p>
                <div className="text-xs text-green-300">
                  운송수단, 인테리어, 소품
                </div>
              </div>
            </div>
          </Link>

          {/* 캐릭터 픽셀 에디터 */}
          <Link href="/admin/character-pixel-editor">
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/20 hover:border-white/30 transition-all cursor-pointer group">
              <div className="text-center">
                <div className="text-6xl mb-4 group-hover:scale-110 transition-transform">🎨</div>
                <h3 className="text-xl font-bold mb-2">캐릭터 픽셀 에디터</h3>
                <p className="text-white/60 text-sm mb-4">
                  캐릭터 아이템의 픽셀 레이아웃을 설정합니다
                </p>
                <div className="text-xs text-purple-300">
                  픽셀 배치, 레이아웃 관리
                </div>
              </div>
            </div>
          </Link>

          {/* 기본 캐릭터 설정 */}
          <Link href="/admin/default-character-setup">
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/20 hover:border-white/30 transition-all cursor-pointer group">
              <div className="text-center">
                <div className="text-6xl mb-4 group-hover:scale-110 transition-transform">👤</div>
                <h3 className="text-xl font-bold mb-2">기본 캐릭터 설정</h3>
                <p className="text-white/60 text-sm mb-4">
                  새 사용자의 기본 캐릭터 픽셀을 설정합니다
                </p>
                <div className="text-xs text-pink-300">
                  기본 픽셀, 아바타 설정
                </div>
              </div>
            </div>
          </Link>

          {/* 아이템 에디터 (기존) */}
          <Link href="/admin/item-editor">
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/20 hover:border-white/30 transition-all cursor-pointer group">
              <div className="text-center">
                <div className="text-6xl mb-4 group-hover:scale-110 transition-transform">📦</div>
                <h3 className="text-xl font-bold mb-2">아이템 에디터</h3>
                <p className="text-white/60 text-sm mb-4">
                  일반 아이템을 등록하고 관리합니다
                </p>
                <div className="text-xs text-yellow-300">
                  범용 아이템 관리
                </div>
              </div>
            </div>
          </Link>

          {/* 장식 에디터 */}
          <Link href="/admin/decoration-editor">
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/20 hover:border-white/30 transition-all cursor-pointer group">
              <div className="text-center">
                <div className="text-6xl mb-4 group-hover:scale-110 transition-transform">🎨</div>
                <h3 className="text-xl font-bold mb-2">장식 에디터</h3>
                <p className="text-white/60 text-sm mb-4">
                  장식 아이템을 등록하고 관리합니다
                </p>
                <div className="text-xs text-cyan-300">
                  장식품, 소품 관리
                </div>
              </div>
            </div>
          </Link>
        </div>

        {/* 사용법 안내 */}
        <div className="mt-8 bg-blue-500/10 backdrop-blur-sm rounded-xl p-6 border border-blue-500/30">
          <h4 className="text-lg font-bold mb-4 text-blue-300">💡 관리자 도구 사용법</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-white/70">
            <div>
              <h5 className="font-bold text-blue-200 mb-2">👤 캐릭터 관련</h5>
              <ul className="space-y-1">
                <li>• <strong>캐릭터 아이템 에디터:</strong> 감정, 액세서리 등 캐릭터 아이템 등록</li>
                <li>• <strong>캐릭터 픽셀 에디터:</strong> 캐릭터 아이템의 픽셀 레이아웃 설정</li>
                <li>• <strong>기본 캐릭터 설정:</strong> 새 사용자의 기본 캐릭터 이미지 및 픽셀 지정</li>
              </ul>
            </div>
            <div>
              <h5 className="font-bold text-green-200 mb-2">🏠 미니차고 관련</h5>
              <ul className="space-y-1">
                <li>• <strong>미니차고 아이템 에디터:</strong> 3D 차고용 아이템 등록 및 관리</li>
                <li>• <strong>아이템 에디터:</strong> 범용 아이템 등록 및 관리</li>
                <li>• <strong>장식 에디터:</strong> 장식품 및 소품 관리</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

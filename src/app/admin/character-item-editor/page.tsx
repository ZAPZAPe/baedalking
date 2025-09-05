// 👤 캐릭터 아이템 에디터 - 관리자 전용 캐릭터 아이템 등록 시스템
// 캐릭터 전용 에디터 (헤어, 상의, 하의, 감정, 액세서리)

'use client'

import React, { useState, useRef, useCallback, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

// 캐릭터 아이템 타입 정의
interface CharacterItem {
  id: string
  name: string
  imageUrl: string
  price?: number
  description?: string
  subCategory?: 'hair' | 'top' | 'bottom'
}

// 캐릭터 카테고리 정의
const CHARACTER_CATEGORIES = {
  hair: { label: '헤어' },
  top: { label: '상의' },
  bottom: { label: '하의' }
}

// 데이터베이스 기반 DataStore 클래스
class CharacterDataStore {
  private storeItems: CharacterItem[] = []

  constructor() {
    this.loadFromDatabase()
  }

  private async loadFromDatabase(): Promise<void> {
    try {
      const { data, error } = await supabase
        .from('shop_items')
        .select('*')
        .eq('is_active', true)
        .eq('main_category', 'character')
        .order('sub_category', { ascending: true })
        .order('name', { ascending: true })

      if (error) {
        console.error('데이터베이스 로드 실패:', error)
        return
      }

      this.storeItems = (data || []).map(item => {
        // 안전한 카테고리 매핑
        const validCategories = ['hair', 'top', 'bottom'] as const
        const subCategory = validCategories.includes(item.sub_category as any) 
          ? item.sub_category as 'hair' | 'top' | 'bottom'
          : 'hair' // 기본값

        return {
          id: item.id,
          name: item.name,
          description: item.description || '',
          imageUrl: item.image_url,
          subCategory,
          price: item.price || 0
        }
      })
    } catch (error) {
      console.error('데이터베이스 로드 실패:', error)
    }
  }

  async getStoreItems(): Promise<CharacterItem[]> {
    await this.loadFromDatabase()
    return [...this.storeItems]
  }

  async addStoreItem(item: CharacterItem): Promise<void> {
    try {
      // 현재 사용자 ID 가져오기
      const { data: { user } } = await supabase.auth.getUser()
      
      const dbItem = {
        name: item.name,
        description: item.description || '',
        image_url: item.imageUrl,
        main_category: 'character', // 캐릭터 전용
        sub_category: item.subCategory || 'hair',
        price: item.price || 0,
        is_active: true,
        created_by: user?.id || null
      }

      console.log('캐릭터 아이템 추가 시도:', dbItem)

      const { error } = await supabase
        .from('shop_items')
        .insert([dbItem])

      if (error) {
        console.error('캐릭터 아이템 추가 실패:', error)
        throw error
      }

      console.log('캐릭터 아이템 추가 성공!')
      await this.loadFromDatabase()
    } catch (error) {
      console.error('캐릭터 아이템 추가 실패:', error)
      throw error
    }
  }

  async updateStoreItem(item: CharacterItem): Promise<void> {
    try {
      // 현재 사용자 ID 가져오기
      const { data: { user } } = await supabase.auth.getUser()
      
      const dbItem = {
        name: item.name,
        description: item.description || '',
        image_url: item.imageUrl,
        main_category: 'character', // 캐릭터 전용
        sub_category: item.subCategory || 'hair',
        price: item.price || 0,
        updated_at: new Date().toISOString(),
        created_by: user?.id || null
      }

      console.log('캐릭터 아이템 수정 시도:', dbItem)

      const { error } = await supabase
        .from('shop_items')
        .update(dbItem)
        .eq('id', item.id)

      if (error) {
        console.error('캐릭터 아이템 수정 실패:', error)
        throw error
      }

      console.log('캐릭터 아이템 수정 성공!')
      await this.loadFromDatabase()
    } catch (error) {
      console.error('캐릭터 아이템 수정 실패:', error)
      throw error
    }
  }

  async removeStoreItem(itemId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('shop_items')
        .update({ is_active: false })
        .eq('id', itemId)

      if (error) {
        console.error('캐릭터 아이템 삭제 실패:', error)
        return false
      }

      await this.loadFromDatabase()
      return true
    } catch (error) {
      console.error('캐릭터 아이템 삭제 실패:', error)
      return false
    }
  }
}

// 전역 DataStore 인스턴스
const characterDataStore = new CharacterDataStore()

export default function CharacterItemEditorPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  // 파일 입력 참조
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 편집 중인 아이템 상태
  const [editingItem, setEditingItem] = useState<CharacterItem>({
    id: '',
    name: '',
    imageUrl: '',
    price: 0,
    description: '',
    subCategory: 'hair'
  })

  // UI 상태
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // 아이템 관리
  const [existingItems, setExistingItems] = useState<CharacterItem[]>([])
  const [selectedExistingItem, setSelectedExistingItem] = useState<CharacterItem | null>(null)

  // 📷 이미지 업로드 처리
  const handleImageUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      alert('이미지 파일만 업로드 가능합니다.')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('파일 크기는 5MB 이하여야 합니다.')
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      const base64 = e.target?.result as string
      setEditingItem(prev => ({
        ...prev,
        imageUrl: base64
      }))
    }
    reader.readAsDataURL(file)
  }, [])

  // 🔄 데이터 로드 함수
  const loadExistingItems = useCallback(async () => {
    const items = await characterDataStore.getStoreItems()
    setExistingItems(items)
  }, [])

  // 새 아이템 생성 모드로 전환
  const startNewItem = useCallback(() => {
    setEditingItem({
      id: '',
      name: '',
      imageUrl: '',
      price: 0,
      description: '',
      subCategory: 'hair'
    })
    setSelectedExistingItem(null)
  }, [])

  // 💾 아이템 저장
  const handleSave = useCallback(async () => {
    if (!editingItem.name || !editingItem.imageUrl || !editingItem.subCategory) {
      alert('이름, 이미지, 카테고리는 필수입니다.')
      return
    }

    setIsSubmitting(true)

    try {
      const savedItem: CharacterItem = {
        ...editingItem,
        id: editingItem.id || `CHARACTER_${Date.now()}`
      }

      console.log('저장할 캐릭터 아이템:', savedItem)

      // 기존 아이템 수정인지 새 아이템 추가인지 확인
      if (selectedExistingItem) {
        // 기존 아이템 수정
        await characterDataStore.updateStoreItem(savedItem)
        console.log('✅ 캐릭터 아이템 수정 성공!')
        alert(`✅ "${savedItem.name}" 캐릭터 아이템이 성공적으로 수정되었습니다!`)
      } else {
        // 새 아이템 추가
        await characterDataStore.addStoreItem(savedItem)
        console.log('✅ 캐릭터 아이템 추가 성공!')
        alert(`✅ "${savedItem.name}" 캐릭터 아이템이 성공적으로 상점에 등록되었습니다!`)
      }
      
      // 로컬 상태 업데이트
      await loadExistingItems() // 아이템 목록 새로고침

      // 폼 초기화
      startNewItem()

    } catch (error) {
      console.error('캐릭터 아이템 저장 실패:', error)
      alert(`캐릭터 아이템 저장 중 오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`)
    } finally {
      setIsSubmitting(false)
    }
  }, [editingItem, selectedExistingItem, startNewItem, loadExistingItems])

  // 기존 아이템 선택 시 데이터 로드
  const loadExistingItem = useCallback((item: CharacterItem) => {
    setEditingItem({
      ...item,
      // 기존 아이템 정보 그대로 복사
    })
    setSelectedExistingItem(item)
  }, [])

  // 기존 아이템 복사 (새 아이템으로 만들기)
  const copyExistingItem = useCallback((item: CharacterItem) => {
    setEditingItem({
      ...item,
      id: '', // 새 ID로 초기화
      name: `${item.name} (복사본)`, // 이름에 복사본 표시
    })
    setSelectedExistingItem(null) // 새 아이템이므로 선택 해제
  }, [])

  // 기존 아이템 삭제
  const deleteExistingItem = useCallback(async (item: CharacterItem) => {
    if (!window.confirm(`정말로 "${item.name}" 캐릭터 아이템을 삭제하시겠습니까?`)) {
      return
    }

    try {
      const success = await characterDataStore.removeStoreItem(item.id)
      
      if (success) {
        alert('캐릭터 아이템이 삭제되었습니다.')
        
        // 삭제된 아이템이 현재 선택된 아이템이면 초기화
        if (selectedExistingItem?.id === item.id) {
          startNewItem()
        }
        
        // 목록 새로고침
        loadExistingItems()
      } else {
        throw new Error('삭제 실패')
      }
    } catch (error) {
      console.error('❌ 캐릭터 아이템 삭제 실패:', error)
      alert('캐릭터 아이템 삭제에 실패했습니다.')
    }
  }, [selectedExistingItem, startNewItem, loadExistingItems])

  // 🎮 초기화 및 이벤트 설정
  useEffect(() => {
    const initializeEditor = async () => {
      if (!loading && user) {
        try {
          console.log('캐릭터 에디터 초기화 시작...')
          await loadExistingItems()
          console.log('캐릭터 에디터 초기화 완료!')
        } catch (error) {
          console.error('캐릭터 에디터 초기화 실패:', error)
          alert('캐릭터 에디터 초기화 중 오류가 발생했습니다.')
        }
      } else if (!loading && !user) {
        router.push('/login')
      }
    }

    initializeEditor()
  }, [user, loading, router, loadExistingItems])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-spin">👤</div>
          <div className="text-white text-xl">캐릭터 에디터 로딩 중...</div>
          <div className="text-white/60 text-sm mt-2">잠시만 기다려주세요</div>
        </div>
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-white">
      {/* 👤 헤더 */}
      <header className="bg-white/10 backdrop-blur-sm border-b border-white/20 p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/')}
              className="text-white/80 hover:text-white transition-colors"
            >
              ← 홈으로
            </button>
            <h1 className="text-2xl font-bold">👤 캐릭터 아이템 에디터</h1>
          </div>
          <div className="text-sm text-white/60">
            캐릭터 전용 아이템 관리 시스템
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-4">
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          
          {/* 👤 캐릭터 아이템 관리 패널 */}
          <div className="space-y-4">
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/20">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold">👤 캐릭터 아이템 관리</h3>
                <button
                  onClick={startNewItem}
                  className="px-3 py-1 bg-blue-500/80 hover:bg-blue-500 text-white rounded text-sm transition-all"
                >
                  🆕 새 아이템
                </button>
              </div>
              
              {existingItems.length > 0 ? (
                <div className="space-y-3">
                  <div className="text-sm text-white/60 mb-2">
                    총 {existingItems.length}개 캐릭터 아이템
                  </div>
                  
                  <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto">
                    {existingItems.map((item) => (
                      <div
                        key={item.id}
                        className={`relative p-3 rounded-lg border transition-all ${
                          selectedExistingItem?.id === item.id
                            ? 'border-blue-400 bg-blue-400/20'
                            : 'border-white/20 bg-white/5 hover:border-white/30 hover:bg-white/10'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          {/* 아이템 이미지 */}
                          <div className="w-12 h-12 bg-white/10 rounded flex items-center justify-center overflow-hidden flex-shrink-0">
                            {item.imageUrl ? (
                              <img 
                                src={item.imageUrl} 
                                alt={item.name}
                                className="max-w-full max-h-full object-contain"
                                style={{ imageRendering: 'pixelated' }}
                              />
                            ) : (
                              <div className="text-white/40 text-lg">👤</div>
                            )}
                          </div>
                          
                          {/* 아이템 정보 */}
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm truncate">{item.name}</div>
                            <div className="flex items-center space-x-3 text-xs text-white/60">
                              <span>💎 {item.price?.toLocaleString() || 0}원</span>
                            </div>
                            <div className="text-xs text-blue-300 mt-1">
                              👤 캐릭터 → 🏷️ {CHARACTER_CATEGORIES[item.subCategory as keyof typeof CHARACTER_CATEGORIES]?.label || '알 수 없음'}
                            </div>
                          </div>
                          
                          {/* 액션 버튼들 */}
                          <div className="flex items-center space-x-1">
                            <button
                              onClick={() => loadExistingItem(item)}
                              className="px-2 py-1 bg-blue-500/80 hover:bg-blue-500 text-white rounded text-xs transition-all"
                              title="편집"
                            >
                              ✏️
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                copyExistingItem(item)
                              }}
                              className="px-2 py-1 bg-green-500/80 hover:bg-green-500 text-white rounded text-xs transition-all"
                              title="복사"
                            >
                              📋
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                deleteExistingItem(item)
                              }}
                              className="px-2 py-1 bg-red-500/80 hover:bg-red-500 text-white rounded text-xs transition-all"
                              title="삭제"
                            >
                              🗑️
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {selectedExistingItem && (
                    <div className="bg-green-400/10 border border-green-400/30 rounded p-3">
                      <div className="text-sm text-green-400">
                        ✅ <strong>{selectedExistingItem.name}</strong> 선택됨 - 아래에서 수정 후 저장하세요
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-4xl mb-2">👤</div>
                  <div className="text-white/60 mb-4">등록된 캐릭터 아이템이 없습니다</div>
                  <button
                    onClick={startNewItem}
                    className="px-4 py-2 bg-blue-500/80 hover:bg-blue-500 text-white rounded transition-all"
                  >
                    🆕 첫 번째 캐릭터 아이템 만들기
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* 📝 아이템 정보 입력 */}
          <div className="space-y-4">
            {/* 📷 이미지 업로드 */}
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/20">
              <h3 className="text-lg font-bold mb-3">📷 이미지 업로드</h3>
              
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
              
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full h-48 border-2 border-dashed border-white/30 rounded-lg flex flex-col items-center justify-center hover:border-white/50 transition-colors relative overflow-hidden"
              >
                {editingItem.imageUrl ? (
                  <div className="relative w-full h-full">
                    <img 
                      src={editingItem.imageUrl} 
                      alt="업로드된 이미지"
                      className="max-w-full max-h-full object-contain"
                      style={{ imageRendering: 'pixelated' }}
                    />
                  </div>
                ) : (
                  <>
                    <div className="text-3xl mb-2">📁</div>
                    <div className="text-sm text-white/60">이미지 선택</div>
                  </>
                )}
              </button>
            </div>

            {/* 📝 아이템 정보 */}
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/20">
              <h3 className="text-lg font-bold mb-3">
                📝 {selectedExistingItem ? `${selectedExistingItem.name} 수정` : '새 캐릭터 아이템 정보'}
              </h3>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium mb-1">이름 *</label>
                  <input
                    type="text"
                    value={editingItem.name}
                    onChange={(e) => setEditingItem(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
                    placeholder="캐릭터 아이템 이름"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">가격</label>
                  <input
                    type="number"
                    value={editingItem.price || 0}
                    onChange={(e) => setEditingItem(prev => ({ 
                      ...prev, 
                      price: Math.max(0, parseInt(e.target.value) || 0)
                    }))}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
                    min="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">설명</label>
                  <textarea
                    value={editingItem.description || ''}
                    onChange={(e) => setEditingItem(prev => ({ ...prev, description: e.target.value }))}
                    rows={2}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
                    placeholder="캐릭터 아이템 설명"
                  />
                </div>

                {/* 캐릭터 카테고리 선택 */}
                <div>
                  <label className="block text-sm font-medium mb-2">캐릭터 카테고리 *</label>
                  
                  {/* 서브 카테고리 */}
                  <div>
                    <label className="block text-xs text-white/60 mb-1">카테고리 선택</label>
                    <div className="grid grid-cols-2 gap-2">
                      {Object.entries(CHARACTER_CATEGORIES).map(([key, category]) => (
                        <button
                          key={key}
                          onClick={() => setEditingItem(prev => ({ ...prev, subCategory: key as 'hair' | 'top' | 'bottom' }))}
                          className={`px-3 py-2 rounded-lg text-sm transition-all ${
                            editingItem.subCategory === key
                              ? 'bg-pink-500 text-white shadow-lg'
                              : 'bg-white/10 text-white/60 hover:bg-white/20'
                          }`}
                        >
                          {category.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 현재 선택된 카테고리 표시 */}
                  <div className="mt-2 p-2 bg-pink-500/10 border border-pink-500/30 rounded text-xs text-pink-200">
                    <div>👤 캐릭터</div>
                    <div>🏷️ {CHARACTER_CATEGORIES[editingItem.subCategory as keyof typeof CHARACTER_CATEGORIES]?.label || '알 수 없음'}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* 💾 저장 버튼 */}
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/20">
              <button
                onClick={handleSave}
                disabled={isSubmitting || !editingItem.name || (!selectedExistingItem && !editingItem.imageUrl) || !editingItem.subCategory}
                className={`w-full py-3 rounded-lg font-bold transition-all duration-200 ${
                  isSubmitting || !editingItem.name || (!selectedExistingItem && !editingItem.imageUrl) || !editingItem.subCategory
                    ? 'bg-gray-600 cursor-not-allowed text-gray-400'
                    : selectedExistingItem 
                      ? 'bg-blue-500 hover:bg-blue-600 text-white shadow-lg hover:shadow-blue-500/25'
                      : 'bg-green-500 hover:bg-green-600 text-white shadow-lg hover:shadow-green-500/25'
                }`}
              >
                {isSubmitting ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    {selectedExistingItem ? '수정 중...' : '등록 중...'}
                  </div>
                ) : (
                  selectedExistingItem ? '✏️ 캐릭터 아이템 수정' : '💾 상점에 등록'
                )}
              </button>
              
              {/* 저장 조건 안내 */}
              {(!editingItem.name || (!selectedExistingItem && !editingItem.imageUrl) || !editingItem.subCategory) && (
                <div className="mt-2 text-xs text-red-400">
                  {!editingItem.name ? '• 아이템 이름을 입력하세요' : ''}
                  {!selectedExistingItem && !editingItem.imageUrl ? '• 이미지를 업로드하세요' : ''}
                  {!editingItem.subCategory ? '• 캐릭터 카테고리를 선택하세요' : ''}
                </div>
              )}
            </div>

            {/* 💡 사용법 안내 */}
            <div className="bg-pink-500/10 backdrop-blur-sm rounded-xl p-4 border border-pink-500/30">
              <h4 className="text-sm font-bold mb-2">💡 사용법</h4>
              <div className="text-xs text-white/70 space-y-1">
                <div><strong>🆕 새 아이템:</strong> 이미지 업로드 → 캐릭터 카테고리 선택 → 정보 입력 → 저장</div>
                <div><strong>✏️ 기존 편집:</strong> 아이템 선택 → 수정 → 저장</div>
                <div><strong>📋 복사:</strong> 아이템 복사 → 이름 변경 → 저장</div>
                <div><strong>🗑️ 삭제:</strong> 아이템 삭제 버튼 클릭</div>
                <div className="mt-2 pt-2 border-t border-white/20">
                  <div>👤 캐릭터 카테고리: 헤어 / 상의 / 하의</div>
                  <div className="text-pink-200 mt-1">💡 캐릭터 커스터마이징 아이템을 등록하세요</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
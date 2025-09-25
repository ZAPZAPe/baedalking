'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface Character {
  id: string
  name: string
  description: string
  image_url: string
  pixel_data: any
  price: number
  is_active: boolean
  sub_category: string
  created_at: string
  updated_at: string
  // 8방향 애니메이션을 위한 24개 이미지 (각 방향당 3프레임)
  animation_images: {
    N_1: string
    N_2: string
    N_3: string
    NE_1: string
    NE_2: string
    NE_3: string
    E_1: string
    E_2: string
    E_3: string
    SE_1: string
    SE_2: string
    SE_3: string
    S_1: string
    S_2: string
    S_3: string
    SW_1: string
    SW_2: string
    SW_3: string
    W_1: string
    W_2: string
    W_3: string
    NW_1: string
    NW_2: string
    NW_3: string
  }
}

interface Emotion {
  id: string
  name: string
  description: string
  image_url: string
  pixel_data: any
  price: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export default function CharacterShopAdminPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'characters' | 'emotions'>('characters')
  const [characters, setCharacters] = useState<Character[]>([])
  const [emotions, setEmotions] = useState<Emotion[]>([])
  const [loading, setLoading] = useState(false)
  const [editingItem, setEditingItem] = useState<Character | Emotion | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string>('')
  const [selectedAnimationFiles, setSelectedAnimationFiles] = useState<{[key: string]: File | null}>({})
  const [previewAnimationUrls, setPreviewAnimationUrls] = useState<{[key: string]: string}>({})

  // 캐릭터 목록 로드
  const loadCharacters = async () => {
    try {
      const response = await fetch('/api/character-shop/characters')
      if (response.ok) {
        const data = await response.json()
        // 캐릭터 데이터에 애니메이션 이미지 정보 추가
        const charactersWithAnimation = (data.characters || []).map((char: any) => ({
          ...char,
          animation_images: char.pixel_data?.animation_images || {
            N_1: '', N_2: '', N_3: '',
            NE_1: '', NE_2: '', NE_3: '',
            E_1: '', E_2: '', E_3: '',
            SE_1: '', SE_2: '', SE_3: '',
            S_1: '', S_2: '', S_3: '',
            SW_1: '', SW_2: '', SW_3: '',
            W_1: '', W_2: '', W_3: '',
            NW_1: '', NW_2: '', NW_3: ''
          }
        }))
        setCharacters(charactersWithAnimation)
      }
    } catch (error) {
    }
  }

  // 감정표현 목록 로드
  const loadEmotions = async () => {
    try {
      const response = await fetch('/api/character-shop/emotions')
      if (response.ok) {
        const data = await response.json()
        setEmotions(data.emotions || [])
      }
    } catch (error) {
    }
  }

  // 초기 데이터 로드
  useEffect(() => {
    loadCharacters()
    loadEmotions()
  }, [])

  // 새 아이템 생성
  const handleCreate = () => {
    if (activeTab === 'characters') {
      setEditingItem({
        id: '',
        name: '',
        description: '',
        image_url: '',
        pixel_data: {},
        price: 1000,
        is_active: true,
        sub_category: 'premium',
        created_at: '',
        updated_at: '',
        animation_images: {
          N_1: '', N_2: '', N_3: '',
          NE_1: '', NE_2: '', NE_3: '',
          E_1: '', E_2: '', E_3: '',
          SE_1: '', SE_2: '', SE_3: '',
          S_1: '', S_2: '', S_3: '',
          SW_1: '', SW_2: '', SW_3: '',
          W_1: '', W_2: '', W_3: '',
          NW_1: '', NW_2: '', NW_3: ''
        }
      } as Character)
    } else {
      setEditingItem({
        id: '',
        name: '',
        description: '',
        image_url: '',
        pixel_data: { duration: 3000, bounce: true },
        price: 100,
        is_active: true,
        created_at: '',
        updated_at: ''
      } as Emotion)
    }
    setIsCreating(true)
    setSelectedFile(null)
    setPreviewUrl('')
    setSelectedAnimationFiles({})
    setPreviewAnimationUrls({})
  }

  // 파일 선택 핸들러
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file && (file.type === 'image/png' || file.type === 'image/jpeg' || file.type === 'image/jpg')) {
      setSelectedFile(file)
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
      
      // 파일명을 기반으로 이미지 경로 자동 생성
      const fileName = file.name
      const imagePath = `/Garage/Character/Emotion/${fileName}`
      if (editingItem) {
        setEditingItem({...editingItem, image_url: imagePath})
      }
    } else {
      alert('PNG, JPG, JPEG 파일만 업로드 가능합니다.')
    }
  }

  // 애니메이션 이미지 파일 선택 핸들러
  const handleAnimationFileSelect = (direction: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file && (file.type === 'image/png' || file.type === 'image/jpeg' || file.type === 'image/jpg')) {
      setSelectedAnimationFiles(prev => ({...prev, [direction]: file}))
      const url = URL.createObjectURL(file)
      setPreviewAnimationUrls(prev => ({...prev, [direction]: url}))
      
      // 파일명을 기반으로 이미지 경로 자동 생성
      const fileName = file.name
      const imagePath = `/Garage/Character/${fileName}`
      if (editingItem && 'animation_images' in editingItem) {
        setEditingItem({
          ...editingItem, 
          animation_images: {
            ...editingItem.animation_images,
            [direction]: imagePath
          }
        })
      }
    } else {
      alert('PNG, JPG, JPEG 파일만 업로드 가능합니다.')
    }
  }

  // 이미지 업로드
  const uploadImage = async (file: File, category: string = 'emotion'): Promise<string> => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('category', category)
    
    const response = await fetch('/api/upload-image', {
      method: 'POST',
      body: formData
    })
    
    if (!response.ok) {
      throw new Error('이미지 업로드 실패')
    }
    
    const data = await response.json()
    return data.imagePath
  }

  // 애니메이션 이미지들 업로드
  const uploadAnimationImages = async (files: {[key: string]: File | null}): Promise<{[key: string]: string}> => {
    const uploadPromises = Object.entries(files).map(async ([key, file]) => {
      if (file) {
        const imagePath = await uploadImage(file, 'character')
        return [key, imagePath]
      }
      return [key, '']
    })
    
    const results = await Promise.all(uploadPromises)
    return Object.fromEntries(results)
  }

  // 아이템 저장
  const handleSave = async () => {
    if (!editingItem) return

    setLoading(true)
    try {
      let finalImagePath = editingItem.image_url
      let finalAnimationImages = (editingItem as any).animation_images || {}

      // 새 파일이 선택된 경우 업로드
      if (selectedFile) {
        try {
          finalImagePath = await uploadImage(selectedFile)
        } catch (uploadError) {
          alert('이미지 업로드에 실패했습니다. 다시 시도해주세요.')
          setLoading(false)
          return
        }
      }

      // 캐릭터의 경우 애니메이션 이미지들 업로드
      if (activeTab === 'characters' && Object.keys(selectedAnimationFiles).length > 0) {
        try {
          const uploadedAnimationImages = await uploadAnimationImages(selectedAnimationFiles)
          finalAnimationImages = {
            ...finalAnimationImages,
            ...uploadedAnimationImages
          }
        } catch (uploadError) {
          alert('애니메이션 이미지 업로드에 실패했습니다. 다시 시도해주세요.')
          setLoading(false)
          return
        }
      }

      const endpoint = activeTab === 'characters' 
        ? '/api/character-shop/characters'
        : '/api/character-shop/emotions'
      
      const method = isCreating ? 'POST' : 'PUT'
      const url = isCreating ? endpoint : `${endpoint}/${editingItem.id}`

      const itemToSave = {
        ...editingItem,
        image_url: finalImagePath,
        ...(activeTab === 'characters' && { animation_images: finalAnimationImages })
      }


      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(itemToSave)
      })

      if (response.ok) {
        alert(`${activeTab === 'characters' ? '캐릭터' : '감정표현'}이 저장되었습니다!`)
        setEditingItem(null)
        setIsCreating(false)
        setSelectedFile(null)
        setPreviewUrl('')
        setSelectedAnimationFiles({})
        setPreviewAnimationUrls({})
        
        // 목록 새로고침
        if (activeTab === 'characters') {
          loadCharacters()
        } else {
          loadEmotions()
        }
      } else {
        const error = await response.json()
        alert(`저장 실패: ${error.error || '알 수 없는 오류'}`)
      }
    } catch (error) {
      alert('저장 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  // 아이템 삭제
  const handleDelete = async (item: Character | Emotion) => {
    if (!confirm(`"${item.name}"을(를) 정말 삭제하시겠습니까?`)) return

    setLoading(true)
    try {
      const endpoint = activeTab === 'characters' 
        ? `/api/character-shop/characters/${item.id}`
        : `/api/character-shop/emotions/${item.id}`

      const response = await fetch(endpoint, { method: 'DELETE' })

      if (response.ok) {
        alert(`${activeTab === 'characters' ? '캐릭터' : '감정표현'}이 삭제되었습니다!`)
        
        // 목록 새로고침
        if (activeTab === 'characters') {
          loadCharacters()
        } else {
          loadEmotions()
        }
      } else {
        const error = await response.json()
        alert(`삭제 실패: ${error.error || '알 수 없는 오류'}`)
      }
    } catch (error) {
      alert('삭제 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* 헤더 */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/admin')}
            className="mb-4 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
          >
            ← 관리자 메인으로
          </button>
          
          <h1 className="text-4xl font-bold text-white mb-2">🎭 캐릭터 상점 관리</h1>
          <p className="text-white/70">캐릭터와 감정표현을 등록하고 관리하세요</p>
        </div>

        {/* 탭 */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('characters')}
            className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
              activeTab === 'characters'
                ? 'bg-blue-500 text-white shadow-lg'
                : 'bg-white/10 text-white/70 hover:bg-white/20'
            }`}
          >
            👤 캐릭터 관리
          </button>
          <button
            onClick={() => setActiveTab('emotions')}
            className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
              activeTab === 'emotions'
                ? 'bg-pink-500 text-white shadow-lg'
                : 'bg-white/10 text-white/70 hover:bg-white/20'
            }`}
          >
🎭 감정표현 관리
          </button>
        </div>

        {/* 편집 모달 */}
        {editingItem && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <h3 className="text-xl font-bold text-white mb-4">
                {isCreating ? '새로 만들기' : '편집하기'} - {activeTab === 'characters' ? '캐릭터' : '감정표현'}
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-white/80 mb-1">이름</label>
                  <input
                    type="text"
                    value={editingItem.name}
                    onChange={(e) => setEditingItem({...editingItem, name: e.target.value})}
                    className="w-full p-2 bg-white/10 border border-white/20 rounded text-white"
                    placeholder="이름을 입력하세요"
                  />
                </div>
                
{activeTab === 'characters' && (
                  <div>
                    <label className="block text-sm text-white/80 mb-1">설명</label>
                    <textarea
                      value={editingItem.description}
                      onChange={(e) => setEditingItem({...editingItem, description: e.target.value})}
                      className="w-full p-2 bg-white/10 border border-white/20 rounded text-white h-20 resize-none"
                      placeholder="설명을 입력하세요"
                    />
                  </div>
                )}
                
                {activeTab === 'characters' ? (
                  <div>
                    <label className="block text-sm text-white/80 mb-1">썸네일 이미지 경로</label>
                    <input
                      type="text"
                      value={editingItem.image_url}
                      onChange={(e) => setEditingItem({...editingItem, image_url: e.target.value})}
                      className="w-full p-2 bg-white/10 border border-white/20 rounded text-white"
                      placeholder="/Garage/Character/..."
                    />
                    
                    {/* 8방향 애니메이션 이미지 업로드 */}
                    <div className="mt-4">
                      <label className="block text-sm text-white/80 mb-2">8방향 애니메이션 이미지 (각 방향당 3프레임)</label>
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        {['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'].map(direction => (
                          <div key={direction} className="space-y-1">
                            <div className="text-white/60 text-center">{direction}</div>
                            {[1, 2, 3].map(frame => {
                              const key = `${direction}_${frame}`
                              return (
                                <div key={key} className="space-y-1">
                                  <input
                                    type="file"
                                    accept="image/png,image/jpeg,image/jpg"
                                    onChange={(e) => handleAnimationFileSelect(key, e)}
                                    className="w-full p-1 bg-white/10 border border-white/20 rounded text-white file:mr-2 file:py-0.5 file:px-1 file:rounded file:border-0 file:text-xs file:bg-blue-500 file:text-white hover:file:bg-blue-600"
                                  />
                                  {previewAnimationUrls[key] && (
                                    <img
                                      src={previewAnimationUrls[key]}
                                      alt={`${direction} ${frame}`}
                                      className="w-8 h-8 object-contain bg-white/5 rounded border border-white/20 mx-auto"
                                    />
                                  )}
                                  {editingItem && 'animation_images' in editingItem && editingItem.animation_images[key] && !previewAnimationUrls[key] && (
                                    <img
                                      src={editingItem.animation_images[key]}
                                      alt={`${direction} ${frame}`}
                                      className="w-8 h-8 object-contain bg-white/5 rounded border border-white/20 mx-auto"
                                    />
                                  )}
                                </div>
                              )
                            })}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm text-white/80 mb-1">이미지 업로드</label>
                    <div className="space-y-3">
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/jpg"
                        onChange={handleFileSelect}
                        className="w-full p-2 bg-white/10 border border-white/20 rounded text-white file:mr-4 file:py-1 file:px-3 file:rounded file:border-0 file:text-sm file:bg-blue-500 file:text-white hover:file:bg-blue-600"
                      />
                      {previewUrl && (
                        <div className="flex justify-center">
                          <img
                            src={previewUrl}
                            alt="미리보기"
                            className="w-16 h-16 object-contain bg-white/5 rounded border border-white/20"
                          />
                        </div>
                      )}
                      {editingItem.image_url && !previewUrl && (
                        <div className="flex justify-center">
                          <img
                            src={editingItem.image_url}
                            alt="기존 이미지"
                            className="w-16 h-16 object-contain bg-white/5 rounded border border-white/20"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                <div>
                  <label className="block text-sm text-white/80 mb-1">가격 (박스)</label>
                  <input
                    type="number"
                    value={editingItem.price}
                    onChange={(e) => setEditingItem({...editingItem, price: parseInt(e.target.value) || 0})}
                    className="w-full p-2 bg-white/10 border border-white/20 rounded text-white"
                    min="0"
                  />
                </div>

{activeTab === 'characters' && 'sub_category' in editingItem && (
                  <div>
                    <label className="flex items-center gap-2 text-white/80">
                      <input
                        type="checkbox"
                        checked={editingItem.sub_category === 'default'}
                        onChange={(e) => setEditingItem({...editingItem, sub_category: e.target.checked ? 'default' : 'premium'})}
                        className="rounded"
                      />
                      기본 캐릭터
                    </label>
                  </div>
                )}
                
                <div>
                  <label className="flex items-center gap-2 text-white/80">
                    <input
                      type="checkbox"
                      checked={editingItem.is_active}
                      onChange={(e) => setEditingItem({...editingItem, is_active: e.target.checked})}
                      className="rounded"
                    />
                    활성화
                  </label>
                </div>
              </div>
              
              <div className="flex gap-2 mt-6">
                <button
                  onClick={() => {
                    setEditingItem(null)
                    setIsCreating(false)
                    setSelectedFile(null)
                    setPreviewUrl('')
                    setSelectedAnimationFiles({})
                    setPreviewAnimationUrls({})
                  }}
                  className="flex-1 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
                  disabled={loading}
                >
                  취소
                </button>
                <button
                  onClick={handleSave}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                  disabled={loading}
                >
                  {loading ? '저장 중...' : '저장'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 메인 컨텐츠 */}
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-white">
              {activeTab === 'characters' ? '👤 캐릭터 목록' : '🎭 감정표현 목록'}
            </h2>
            <button
              onClick={handleCreate}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              + 새로 만들기
            </button>
          </div>

          {/* 아이템 그리드 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {(activeTab === 'characters' ? characters : emotions).map((item) => (
              <div
                key={item.id}
                className="bg-white/10 backdrop-blur-sm rounded-lg p-4 hover:bg-white/20 transition-colors border border-white/10"
              >
                {/* 아이템 이미지 */}
                <div className="w-full h-32 bg-white/5 rounded mb-3 flex items-center justify-center overflow-hidden">
                  {item.image_url ? (
                    <img
                      src={item.image_url}
                      alt={item.name}
                      className="max-w-full max-h-full object-contain"
                    />
                  ) : (
                    <div className="text-white/40 text-2xl">
                      {activeTab === 'characters' ? '👤' : '🎭'}
                    </div>
                  )}
                </div>
                
                {/* 아이템 정보 */}
                <div className="text-center mb-3">
                  <h3 className="text-white font-medium mb-1">{item.name}</h3>
                  <p className="text-white/60 text-sm mb-2 line-clamp-2">{item.description}</p>
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-yellow-400 font-mono">{item.price} 박스</span>
                    {activeTab === 'characters' && 'sub_category' in item && item.sub_category === 'default' && (
                      <span className="text-xs bg-blue-500 text-white px-2 py-1 rounded">기본</span>
                    )}
                    {!item.is_active && (
                      <span className="text-xs bg-red-500 text-white px-2 py-1 rounded">비활성</span>
                    )}
                  </div>
                </div>
                
                {/* 버튼 */}
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setEditingItem(item)
                      setIsCreating(false)
                      setSelectedAnimationFiles({})
                      setPreviewAnimationUrls({})
                    }}
                    className="flex-1 px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 transition-colors"
                  >
                    편집
                  </button>
                  <button
                    onClick={() => handleDelete(item)}
                    className="flex-1 px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600 transition-colors"
                  >
                    삭제
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* 빈 상태 */}
          {(activeTab === 'characters' ? characters : emotions).length === 0 && (
            <div className="text-center py-12">
              <div className="text-4xl mb-4">
                {activeTab === 'characters' ? '👤' : '🎭'}
              </div>
              <p className="text-white/60 mb-4">
                등록된 {activeTab === 'characters' ? '캐릭터' : '감정표현'}가 없습니다
              </p>
              <button
                onClick={handleCreate}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                첫 번째 아이템 만들기
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

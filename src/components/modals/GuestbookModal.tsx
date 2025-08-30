import React, { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import UserProfileModal from '@/components/modals/UserProfileModal'

interface GuestbookMessage {
  id: string
  message: string
  is_private: boolean
  created_at: string
  visitor: {
    id: string
    nickname: string
    avatar_config: any
  }
}

interface GuestbookModalProps {
  targetUserId: string
  targetUserNickname: string
  onClose: () => void
}

export default function GuestbookModal({
  targetUserId,
  targetUserNickname,
  onClose
}: GuestbookModalProps) {
  const { user } = useAuth()
  const [messages, setMessages] = useState<GuestbookMessage[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [isPrivate, setIsPrivate] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedUserProfile, setSelectedUserProfile] = useState<any>(null)
  const [showUserProfile, setShowUserProfile] = useState(false)
  
  // 페이지네이션 상태
  const [currentPage, setCurrentPage] = useState(1)
  const messagesPerPage = 5

  // 페이지네이션 계산
  const totalPages = Math.ceil(messages.length / messagesPerPage)
  const startIndex = (currentPage - 1) * messagesPerPage
  const endIndex = startIndex + messagesPerPage
  const currentMessages = messages.slice(startIndex, endIndex)

  // 방명록 메시지 불러오기
  const fetchMessages = async () => {
    if (!targetUserId) return

    setIsLoading(true)
    try {
      console.log('🔍 방명록 모달 데이터 로딩 시작:', targetUserId)
      
      const response = await fetch(`/api/guestbook?userId=${targetUserId}`)
      const data = await response.json()

      if (response.ok) {
        console.log('✅ 방명록 모달 데이터 로드 성공:', data.messages?.length || 0, '개')
        setMessages(data.messages || [])
      } else {
        console.error('❌ 방명록 모달 불러오기 실패:', data.error)
        setMessages([])
      }
    } catch (error) {
      console.error('❌ 방명록 모달 API 오류:', error)
      setMessages([])
    } finally {
      setIsLoading(false)
    }
  }

  // 방명록 메시지 작성
  const submitMessage = async () => {
    if (!newMessage.trim() || !user) return

    setIsSubmitting(true)
    try {
      const response = await fetch('/api/guestbook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: targetUserId,
          message: newMessage.trim(),
          isPrivate,
          visitorId: user.id
        })
      })

      const data = await response.json()

      if (response.ok) {
              setNewMessage('')
      setIsPrivate(false)
      setCurrentPage(1) // 첫 번째 페이지로 이동
      fetchMessages() // 새로고침
      } else {
        console.error('방명록 작성 실패:', data.error)
        alert(data.error || '방명록 작성에 실패했습니다.')
      }
    } catch (error) {
      console.error('방명록 작성 오류:', error)
      alert('방명록 작성 중 오류가 발생했습니다.')
    } finally {
      setIsSubmitting(false)
    }
  }

  useEffect(() => {
    fetchMessages()
  }, [targetUserId])

  // 사용자 프로필 클릭 핸들러
  const handleUserProfileClick = async (visitorId: string, nickname: string) => {
    try {
      const response = await fetch(`/api/users/${visitorId}`)
      const data = await response.json()
      
      if (response.ok && data.user) {
        setSelectedUserProfile(data.user)
        setShowUserProfile(true)
      } else {
        console.error('사용자 프로필 로딩 실패:', data.error)
      }
    } catch (error) {
      console.error('사용자 프로필 로딩 오류:', error)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffDays === 0) {
      return date.toLocaleTimeString('ko-KR', {
        hour: '2-digit',
        minute: '2-digit'
      })
    } else if (diffDays === 1) {
      return '어제'
    } else if (diffDays < 7) {
      return `${diffDays}일 전`
    } else {
      return date.toLocaleDateString('ko-KR', {
        month: 'short',
        day: 'numeric'
      })
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-[#1a4a2e]/95 to-[#1a1a2e]/95 backdrop-blur-lg rounded-2xl border-2 border-[#00ff88]/30 shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden">
        
        {/* 헤더 */}
        <div className="bg-gradient-to-r from-[#00ff88]/20 to-[#00cc6a]/20 border-b border-[#00ff88]/30 p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-[#00ff88]">
              {targetUserNickname}의 방명록
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors text-2xl"
            >
              ×
            </button>
          </div>
        </div>

        {/* 방명록 작성 (로그인된 사용자만) */}
        {user && user.id !== targetUserId && (
          <div className="border-b border-[#00ff88]/20 p-4">
            <div className="space-y-4">
              <div className="relative">
                <textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="따뜻한 메시지를 남겨주세요..."
                  className="w-full h-24 bg-gradient-to-br from-[#1a202c]/80 to-[#2d3748]/80 border-2 border-[#00ff88]/30 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-[#00ff88] resize-none font-mono relative"
                  style={{borderRadius: '8px'}}
                  maxLength={200}
                />
                {/* 픽셀 도트들 */}
                <div className="absolute top-1 left-1 w-1 h-1 bg-[#00ff88]/30" style={{borderRadius: '1px'}}></div>
                <div className="absolute top-1 right-1 w-1 h-1 bg-[#00ff88]/30" style={{borderRadius: '1px'}}></div>
                <div className="absolute bottom-1 left-1 w-1 h-1 bg-[#00ff88]/30" style={{borderRadius: '1px'}}></div>
                <div className="absolute bottom-1 right-1 w-1 h-1 bg-[#00ff88]/30" style={{borderRadius: '1px'}}></div>
              </div>
              
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm text-gray-300 bg-black/20 px-3 py-2 rounded-lg border border-[#ff6b6b]/30">
                  <input
                    type="checkbox"
                    checked={isPrivate}
                    onChange={(e) => setIsPrivate(e.target.checked)}
                    className="accent-[#ff6b6b] rounded"
                  />
                  🔒
                </label>
                
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-400 font-mono bg-black/20 px-2 py-1 rounded">
                    {newMessage.length}/200
                  </span>
                  <button
                    onClick={submitMessage}
                    disabled={!newMessage.trim() || isSubmitting}
                    className="bg-gradient-to-r from-[#00ff88]/20 to-[#00cc6a]/20 border-2 border-[#00ff88]/50 hover:border-[#00ff88] disabled:border-gray-600/50 text-[#00ff88] hover:text-white disabled:text-gray-400 px-6 py-2 rounded-lg font-mono font-bold transition-all duration-300 text-sm relative"
                    style={{borderRadius: '6px'}}
                  >
                    {isSubmitting ? '작성 중...' : '📝 작성'}
                    {/* 버튼 픽셀 도트 */}
                    {!isSubmitting && (
                      <>
                        <div className="absolute top-0.5 left-0.5 w-0.5 h-0.5 bg-[#00ff88]/50" style={{borderRadius: '1px'}}></div>
                        <div className="absolute top-0.5 right-0.5 w-0.5 h-0.5 bg-[#00ff88]/50" style={{borderRadius: '1px'}}></div>
                        <div className="absolute bottom-0.5 left-0.5 w-0.5 h-0.5 bg-[#00ff88]/50" style={{borderRadius: '1px'}}></div>
                        <div className="absolute bottom-0.5 right-0.5 w-0.5 h-0.5 bg-[#00ff88]/50" style={{borderRadius: '1px'}}></div>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 방명록 목록 */}
        <div className="flex-1 overflow-y-auto p-4">
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-gradient-to-br from-[#1a202c]/80 to-[#2d3748]/80 border-2 border-[#00ff88]/20 rounded-lg p-4 animate-pulse relative" style={{borderRadius: '8px'}}>
                  <div className="h-4 bg-[#00ff88]/20 rounded mb-3 w-1/3"></div>
                  <div className="h-3 bg-[#00ff88]/10 rounded mb-2"></div>
                  <div className="h-3 bg-[#00ff88]/10 rounded w-2/3"></div>
                  {/* 픽셀 도트들 */}
                  <div className="absolute top-1 left-1 w-1 h-1 bg-[#00ff88]/30" style={{borderRadius: '1px'}}></div>
                  <div className="absolute top-1 right-1 w-1 h-1 bg-[#00ff88]/30" style={{borderRadius: '1px'}}></div>
                  <div className="absolute bottom-1 left-1 w-1 h-1 bg-[#00ff88]/30" style={{borderRadius: '1px'}}></div>
                  <div className="absolute bottom-1 right-1 w-1 h-1 bg-[#00ff88]/30" style={{borderRadius: '1px'}}></div>
                </div>
              ))}
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-12">
              <div className="bg-gradient-to-br from-[#1a202c]/60 to-[#2d3748]/60 border border-[#00ff88]/20 rounded-lg p-8 relative" style={{borderRadius: '12px'}}>
                <p className="text-gray-300 mb-4 font-mono">아직 방명록이 없습니다.</p>
                {user && user.id !== targetUserId && (
                  <p className="text-sm text-gray-400 font-mono">첫 번째 방명록을 남겨보세요!</p>
                )}
                {/* 픽셀 도트들 */}
                <div className="absolute top-1 left-1 w-1 h-1 bg-[#00ff88]/30" style={{borderRadius: '1px'}}></div>
                <div className="absolute top-1 right-1 w-1 h-1 bg-[#00ff88]/30" style={{borderRadius: '1px'}}></div>
                <div className="absolute bottom-1 left-1 w-1 h-1 bg-[#00ff88]/30" style={{borderRadius: '1px'}}></div>
                <div className="absolute bottom-1 right-1 w-1 h-1 bg-[#00ff88]/30" style={{borderRadius: '1px'}}></div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {currentMessages.map((message) => (
                <div
                  key={message.id}
                  className="bg-gradient-to-br from-[#1a202c]/80 to-[#2d3748]/80 border-2 border-[#00ff88]/20 rounded-lg p-4 hover:border-[#00ff88]/40 transition-all duration-300 relative"
                  style={{borderRadius: '8px'}}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleUserProfileClick(message.visitor.id, message.visitor.nickname)}
                        className="font-bold text-white hover:text-gray-200 transition-colors cursor-pointer font-mono"
                      >
                        {message.visitor.nickname}
                      </button>
                      {message.is_private && (
                        <span className="text-[#ff6b6b] text-sm">🔒</span>
                      )}
                    </div>
                    <span className="text-xs text-gray-400 font-mono bg-black/20 px-2 py-1 rounded">
                      {formatDate(message.created_at)}
                    </span>
                  </div>
                            <p className="text-gray-300 leading-relaxed whitespace-pre-wrap text-xs">
            {message.is_private && user?.id !== targetUserId && user?.id !== message.visitor.id
              ? "🔒 비공개 메시지입니다."
              : message.message
            }
          </p>
          
          {/* 수정/삭제 버튼들 */}
          {user && (
            (() => {
              const isOwner = user.id === targetUserId // 방명록 주인인지
              const isAuthor = user.id === message.visitor.id // 메시지 작성자인지
              const canEdit = isAuthor // 작성자만 수정 가능
              const canDelete = isOwner || isAuthor // 주인이거나 작성자면 삭제 가능
              
              if (canEdit || canDelete) {
                return (
                  <div className="flex justify-end gap-2 mt-2 pt-2 border-t border-[#00ff88]/20">
                    {canEdit && (
                      <button
                        onClick={() => {
                          // TODO: 모달에서 수정 기능 구현
                          console.log('방명록 수정:', message.id)
                        }}
                        className="bg-[#ffd93d]/20 hover:bg-[#ffd93d]/30 border border-[#ffd93d]/50 hover:border-[#ffd93d] text-[#ffd93d] px-2 py-1 rounded text-xs font-mono transition-all duration-200"
                        style={{borderRadius: '4px'}}
                      >
                        수정
                      </button>
                    )}
                    {canDelete && (
                      <button
                        onClick={async () => {
                          const confirmMessage = isOwner && !isAuthor 
                            ? `${message.visitor.nickname}님이 작성한 방명록을 삭제하시겠습니까?`
                            : '정말 이 방명록을 삭제하시겠습니까?'
                            
                          if (!confirm(confirmMessage)) return
                          
                          try {
                            const response = await fetch('/api/guestbook', {
                              method: 'DELETE',
                              headers: {
                                'Content-Type': 'application/json',
                              },
                              body: JSON.stringify({
                                messageId: message.id,
                                userId: user.id
                              })
                            })
                            
                            const data = await response.json()
                            
                            if (response.ok) {
                              fetchMessages() // 목록 새로고침
                            } else {
                              alert(data.error || '방명록 삭제에 실패했습니다.')
                            }
                          } catch (error) {
                            console.error('방명록 삭제 오류:', error)
                            alert('방명록 삭제 중 오류가 발생했습니다.')
                          }
                        }}
                        className="bg-[#ff6b6b]/20 hover:bg-[#ff6b6b]/30 border border-[#ff6b6b]/50 hover:border-[#ff6b6b] text-[#ff6b6b] px-2 py-1 rounded text-xs font-mono transition-all duration-200"
                        style={{borderRadius: '4px'}}
                      >
                        삭제
                      </button>
                    )}
                  </div>
                )
              }
              return null
            })()
          )}
                  {/* 픽셀 도트들 */}
                  <div className="absolute top-1 left-1 w-1 h-1 bg-[#00ff88]/40" style={{borderRadius: '1px'}}></div>
                  <div className="absolute top-1 right-1 w-1 h-1 bg-[#00ff88]/40" style={{borderRadius: '1px'}}></div>
                  <div className="absolute bottom-1 left-1 w-1 h-1 bg-[#00ff88]/40" style={{borderRadius: '1px'}}></div>
                  <div className="absolute bottom-1 right-1 w-1 h-1 bg-[#00ff88]/40" style={{borderRadius: '1px'}}></div>
                </div>
              ))}
              
              {/* 페이지네이션 */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-3 pt-6">
                  {/* 이전 페이지 버튼 */}
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="bg-gradient-to-r from-[#00ff88]/20 to-[#00cc6a]/20 border-2 border-[#00ff88]/50 hover:border-[#00ff88] disabled:border-gray-600/50 text-[#00ff88] hover:text-white disabled:text-gray-400 px-4 py-2 rounded-lg font-mono text-sm transition-all duration-300 relative"
                    style={{borderRadius: '6px'}}
                  >
                    ← 이전
                    {/* 버튼 픽셀 도트 */}
                    {currentPage !== 1 && (
                      <>
                        <div className="absolute top-0.5 left-0.5 w-0.5 h-0.5 bg-[#00ff88]/50" style={{borderRadius: '1px'}}></div>
                        <div className="absolute top-0.5 right-0.5 w-0.5 h-0.5 bg-[#00ff88]/50" style={{borderRadius: '1px'}}></div>
                        <div className="absolute bottom-0.5 left-0.5 w-0.5 h-0.5 bg-[#00ff88]/50" style={{borderRadius: '1px'}}></div>
                        <div className="absolute bottom-0.5 right-0.5 w-0.5 h-0.5 bg-[#00ff88]/50" style={{borderRadius: '1px'}}></div>
                      </>
                    )}
                  </button>

                  {/* 페이지 번호들 */}
                  <div className="flex gap-2">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`w-10 h-10 rounded-lg font-mono text-sm transition-all duration-300 relative ${
                          pageNum === currentPage
                            ? 'bg-gradient-to-r from-[#00ff88]/40 to-[#00cc6a]/40 border-2 border-[#00ff88] text-white'
                            : 'bg-gradient-to-r from-black/20 to-black/10 border border-[#00ff88]/30 hover:border-[#00ff88]/50 text-[#00ff88] hover:text-[#00cc6a]'
                        }`}
                        style={{borderRadius: '6px'}}
                      >
                        {pageNum}
                        {/* 현재 페이지 픽셀 도트 */}
                        {pageNum === currentPage && (
                          <>
                            <div className="absolute top-0.5 left-0.5 w-0.5 h-0.5 bg-[#00ff88]" style={{borderRadius: '1px'}}></div>
                            <div className="absolute top-0.5 right-0.5 w-0.5 h-0.5 bg-[#00ff88]" style={{borderRadius: '1px'}}></div>
                            <div className="absolute bottom-0.5 left-0.5 w-0.5 h-0.5 bg-[#00ff88]" style={{borderRadius: '1px'}}></div>
                            <div className="absolute bottom-0.5 right-0.5 w-0.5 h-0.5 bg-[#00ff88]" style={{borderRadius: '1px'}}></div>
                          </>
                        )}
                      </button>
                    ))}
                  </div>

                  {/* 다음 페이지 버튼 */}
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="bg-gradient-to-r from-[#00ff88]/20 to-[#00cc6a]/20 border-2 border-[#00ff88]/50 hover:border-[#00ff88] disabled:border-gray-600/50 text-[#00ff88] hover:text-white disabled:text-gray-400 px-4 py-2 rounded-lg font-mono text-sm transition-all duration-300 relative"
                    style={{borderRadius: '6px'}}
                  >
                    다음 →
                    {/* 버튼 픽셀 도트 */}
                    {currentPage !== totalPages && (
                      <>
                        <div className="absolute top-0.5 left-0.5 w-0.5 h-0.5 bg-[#00ff88]/50" style={{borderRadius: '1px'}}></div>
                        <div className="absolute top-0.5 right-0.5 w-0.5 h-0.5 bg-[#00ff88]/50" style={{borderRadius: '1px'}}></div>
                        <div className="absolute bottom-0.5 left-0.5 w-0.5 h-0.5 bg-[#00ff88]/50" style={{borderRadius: '1px'}}></div>
                        <div className="absolute bottom-0.5 right-0.5 w-0.5 h-0.5 bg-[#00ff88]/50" style={{borderRadius: '1px'}}></div>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 사용자 프로필 모달 */}
      {showUserProfile && selectedUserProfile && (
        <UserProfileModal
          user={selectedUserProfile}
          onClose={() => {
            setShowUserProfile(false)
            setSelectedUserProfile(null)
          }}
        />
      )}
    </div>
  )
}
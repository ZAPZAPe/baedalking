import React, { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'

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

interface GuestbookPreviewProps {
  userId: string
  isOwnPage?: boolean
  onOpenGuestbook?: () => void
  onShowUserProfile?: (visitorId: string, nickname: string) => void
}

export default function GuestbookPreview({ 
  userId, 
  isOwnPage = false,
  onOpenGuestbook,
  onShowUserProfile
}: GuestbookPreviewProps) {
  const { user } = useAuth()
  const [recentMessages, setRecentMessages] = useState<GuestbookMessage[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalMessages, setTotalMessages] = useState(0)
  const messagesPerPage = 5

  const [showWriteForm, setShowWriteForm] = useState(false)
  const [newMessage, setNewMessage] = useState('')
  const [isPrivate, setIsPrivate] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [editingMessage, setEditingMessage] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')
  const [editPrivate, setEditPrivate] = useState(false)

  // 방명록 메시지 불러오기 (페이지네이션 지원)
  const fetchRecentMessages = async (page: number = 1) => {
    if (!userId) return

    setIsLoading(true)
    try {
  
      
      const response = await fetch(`/api/guestbook?userId=${userId}&page=${page}&limit=${messagesPerPage}`)
      const data = await response.json()

      if (response.ok) {

        setRecentMessages(data.messages || [])
        setTotalMessages(data.total || 0)
        setTotalPages(Math.ceil((data.total || 0) / messagesPerPage))
      } else {
        console.error('❌ 방명록 미리보기 불러오기 실패:', data.error)
        setRecentMessages([])
        setTotalMessages(0)
        setTotalPages(1)
      }
    } catch (error) {
      console.error('❌ 방명록 미리보기 API 오류:', error)
      setRecentMessages([])
      setTotalMessages(0)
      setTotalPages(1)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchRecentMessages(currentPage)
  }, [userId, currentPage])

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
          userId,
          message: newMessage.trim(),
          isPrivate,
          visitorId: user.id
        })
      })

      const data = await response.json()

      if (response.ok) {

        setNewMessage('')
        setIsPrivate(false)
        setShowWriteForm(false)
        // 첫 페이지로 돌아가서 새로고침
        setCurrentPage(1)
        fetchRecentMessages(1)
      } else {
        console.error('❌ 방명록 작성 실패:', data.error)
        alert(data.error || '방명록 작성에 실패했습니다.')
      }
    } catch (error) {
      console.error('❌ 방명록 작성 API 오류:', error)
      alert('방명록 작성 중 오류가 발생했습니다.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // 방명록 메시지 삭제
  const handleDeleteMessage = async (messageId: string, messageAuthor: string, messageAuthorId: string) => {
    if (!user) return
    
    const isOwner = user.id === userId // 방명록 주인인지
    const isAuthor = user.id === messageAuthorId // 메시지 작성자인지
    
    let confirmMessage = '정말 이 방명록을 삭제하시겠습니까?'
    if (isOwner && !isAuthor) {
      confirmMessage = `${messageAuthor}님이 작성한 방명록을 삭제하시겠습니까?`
    }
    
    if (!confirm(confirmMessage)) return
    
    try {
  
      
      const response = await fetch('/api/guestbook', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messageId: messageId,
          userId: user.id
        })
      })
      
      const data = await response.json()
      
      if (response.ok) {

        fetchRecentMessages() // 목록 새로고침
      } else {
        console.error('❌ 방명록 삭제 실패:', data.error)
        alert(data.error || '방명록 삭제에 실패했습니다.')
      }
    } catch (error) {
      console.error('❌ 방명록 삭제 API 오류:', error)
      alert('방명록 삭제 중 오류가 발생했습니다.')
    }
  }

  // 방명록 메시지 수정 시작
  const handleStartEdit = (message: GuestbookMessage) => {
    setEditingMessage(message.id)
    setEditContent(message.message)
    setEditPrivate(message.is_private)
  }

  // 방명록 메시지 수정 취소
  const handleCancelEdit = () => {
    setEditingMessage(null)
    setEditContent('')
    setEditPrivate(false)
  }

  // 방명록 메시지 수정 저장
  const handleSaveEdit = async (messageId: string) => {
    if (!editContent.trim() || !user) return
    
    try {
      const requestData = {
        messageId: messageId,
        message: editContent.trim(),
        isPrivate: editPrivate,
        userId: user.id
      }
      
      
      const response = await fetch('/api/guestbook', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData)
      })
      
      const data = await response.json()
      
      if (response.ok) {

        handleCancelEdit()
        fetchRecentMessages() // 목록 새로고침
      } else {
        console.error('❌ 방명록 수정 실패:', response.status, response.statusText)
        console.error('❌ 응답 데이터:', data)
        alert(data.error || '방명록 수정에 실패했습니다.')
      }
    } catch (error) {
      console.error('❌ 방명록 수정 API 오류:', error)
      alert('방명록 수정 중 오류가 발생했습니다.')
    }
  }

  // 사용자 프로필 클릭 핸들러
  const handleUserProfileClick = (visitorId: string, nickname: string) => {
    if (onShowUserProfile) {
      onShowUserProfile(visitorId, nickname)
    } else {
      console.error('❌ onShowUserProfile 함수가 없습니다!')
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('ko-KR', {
      month: 'short',
      day: 'numeric'
    })
  }

  if (isLoading) {
    return (
      <div className="space-y-3">
        <div className="bg-gradient-to-br from-[#1a202c]/80 to-[#2d3748]/80 border-2 border-[#00ff88]/30 rounded-lg p-4 animate-pulse relative" style={{borderRadius: '8px'}}>
          <div className="h-4 bg-[#00ff88]/20 rounded mb-3"></div>
          <div className="h-3 bg-[#00ff88]/10 rounded mb-2"></div>
          <div className="h-3 bg-[#00ff88]/10 rounded w-2/3"></div>
          {/* 픽셀 도트들 */}
          <div className="absolute top-1 left-1 w-1 h-1 bg-[#00ff88]/50" style={{borderRadius: '1px'}}></div>
          <div className="absolute top-1 right-1 w-1 h-1 bg-[#00ff88]/50" style={{borderRadius: '1px'}}></div>
          <div className="absolute bottom-1 left-1 w-1 h-1 bg-[#00ff88]/50" style={{borderRadius: '1px'}}></div>
          <div className="absolute bottom-1 right-1 w-1 h-1 bg-[#00ff88]/50" style={{borderRadius: '1px'}}></div>
        </div>
      </div>
    )
  }

  if (recentMessages.length === 0) {
    return (
      <div className="space-y-3">
        <div className="bg-gradient-to-br from-[#1a202c]/80 to-[#2d3748]/80 border-2 border-[#00ff88]/30 rounded-lg p-4 text-center relative" style={{borderRadius: '8px'}}>
          <p className="text-gray-300 text-sm font-mono mb-3">
            아직 방명록이 없습니다.
          </p>
          {!isOwnPage && (
            <button
              onClick={() => setShowWriteForm(true)}
              className="bg-gradient-to-r from-[#00ff88]/20 to-[#00cc6a]/20 border-2 border-[#00ff88]/50 hover:border-[#00ff88] text-[#00ff88] hover:text-white px-4 py-2 rounded-lg font-mono text-xs transition-all duration-300 relative"
              style={{borderRadius: '6px'}}
            >
              첫 번째 방명록 남기기
              {/* 버튼 픽셀 도트 */}
              <div className="absolute top-0.5 left-0.5 w-0.5 h-0.5 bg-[#00ff88]" style={{borderRadius: '1px'}}></div>
              <div className="absolute top-0.5 right-0.5 w-0.5 h-0.5 bg-[#00ff88]" style={{borderRadius: '1px'}}></div>
              <div className="absolute bottom-0.5 left-0.5 w-0.5 h-0.5 bg-[#00ff88]" style={{borderRadius: '1px'}}></div>
              <div className="absolute bottom-0.5 right-0.5 w-0.5 h-0.5 bg-[#00ff88]" style={{borderRadius: '1px'}}></div>
            </button>
          )}
          {/* 카드 픽셀 도트들 */}
          <div className="absolute top-1 left-1 w-1 h-1 bg-[#00ff88]/50" style={{borderRadius: '1px'}}></div>
          <div className="absolute top-1 right-1 w-1 h-1 bg-[#00ff88]/50" style={{borderRadius: '1px'}}></div>
          <div className="absolute bottom-1 left-1 w-1 h-1 bg-[#00ff88]/50" style={{borderRadius: '1px'}}></div>
          <div className="absolute bottom-1 right-1 w-1 h-1 bg-[#00ff88]/50" style={{borderRadius: '1px'}}></div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {recentMessages.map((message) => {
        const isOwner = user?.id === userId // 방명록 주인인지
        const isAuthor = user?.id === message.visitor.id // 메시지 작성자인지
        const canEdit = isAuthor // 작성자만 수정 가능
        const canDelete = isOwner || isAuthor // 주인이거나 작성자면 삭제 가능
        const isEditing = editingMessage === message.id
        
        return (
          <div key={message.id} className="bg-gradient-to-br from-[#1a202c]/80 to-[#2d3748]/80 border-2 border-[#00ff88]/30 rounded-lg p-4 hover:border-[#00ff88]/50 transition-all duration-300 relative" style={{borderRadius: '8px'}}>
            {/* 헤더 */}
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleUserProfileClick(message.visitor.id, message.visitor.nickname)}
                  className="text-white hover:text-gray-200 font-bold text-sm font-mono transition-colors cursor-pointer"
                >
                  {message.visitor.nickname}
                </button>
                {(isEditing ? editPrivate : message.is_private) && (
                  <span className="text-[#ff6b6b] text-sm">🔒</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-400 text-xs font-mono bg-black/20 px-2 py-1 rounded">
                  {formatDate(message.created_at)}
                </span>
                {/* 수정/삭제 버튼들 */}
                {user && !isEditing && (canEdit || canDelete) && (
                  <div className="flex gap-1">
                    {canEdit && (
                      <button
                        onClick={() => handleStartEdit(message)}
                        className="bg-[#ffd93d]/20 hover:bg-[#ffd93d]/30 border border-[#ffd93d]/50 hover:border-[#ffd93d] text-[#ffd93d] px-2 py-1 rounded text-xs font-mono transition-all duration-200"
                        style={{borderRadius: '4px'}}
                      >
                        수정
                      </button>
                    )}
                    {canDelete && (
                      <button
                        onClick={() => handleDeleteMessage(message.id, message.visitor.nickname, message.visitor.id)}
                        className="bg-[#ff6b6b]/20 hover:bg-[#ff6b6b]/30 border border-[#ff6b6b]/50 hover:border-[#ff6b6b] text-[#ff6b6b] px-2 py-1 rounded text-xs font-mono transition-all duration-200"
                        style={{borderRadius: '4px'}}
                      >
                        삭제
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
            
            {/* 메시지 내용 또는 수정 폼 */}
            {isEditing ? (
              <div className="space-y-3">
                <div className="relative">
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="w-full h-20 bg-gradient-to-br from-[#0a0a23]/80 to-[#16213e]/80 border-2 border-[#ffd93d]/30 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#ffd93d] resize-none font-mono text-xs relative"
                    style={{borderRadius: '6px'}}
                    maxLength={200}
                  />
                  {/* textarea 픽셀 도트들 */}
                  <div className="absolute top-1 left-1 w-1 h-1 bg-[#ffd93d]/30" style={{borderRadius: '1px'}}></div>
                  <div className="absolute top-1 right-1 w-1 h-1 bg-[#ffd93d]/30" style={{borderRadius: '1px'}}></div>
                  <div className="absolute bottom-1 left-1 w-1 h-1 bg-[#ffd93d]/30" style={{borderRadius: '1px'}}></div>
                  <div className="absolute bottom-1 right-1 w-1 h-1 bg-[#ffd93d]/30" style={{borderRadius: '1px'}}></div>
                </div>
                
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-sm text-gray-300 bg-black/20 px-2 py-1 rounded border border-[#ff6b6b]/30">
                    <input
                      type="checkbox"
                      checked={editPrivate}
                      onChange={(e) => setEditPrivate(e.target.checked)}
                      className="accent-[#ff6b6b] rounded"
                    />
                    🔒 비공개
                  </label>
                  
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400 font-mono bg-black/20 px-2 py-1 rounded">
                      {editContent.length}/200
                    </span>
                    <button
                      onClick={handleCancelEdit}
                      className="bg-gray-600/20 hover:bg-gray-600/30 border border-gray-500/50 hover:border-gray-500 text-gray-400 hover:text-gray-300 px-3 py-1 rounded font-mono text-xs transition-all duration-200"
                      style={{borderRadius: '4px'}}
                    >
                      취소
                    </button>
                    <button
                      onClick={() => handleSaveEdit(message.id)}
                      disabled={!editContent.trim()}
                      className="bg-[#00ff88]/20 hover:bg-[#00ff88]/30 border border-[#00ff88]/50 hover:border-[#00ff88] disabled:border-gray-600/50 text-[#00ff88] hover:text-white disabled:text-gray-400 px-3 py-1 rounded font-mono text-xs transition-all duration-200"
                      style={{borderRadius: '4px'}}
                    >
                      저장
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-gray-300 text-xs leading-relaxed whitespace-pre-wrap">
                {message.is_private && user?.id !== userId && user?.id !== message.visitor.id
                  ? "🔒 비공개 메시지입니다."
                  : message.message
                }
              </p>
            )}
            
            {/* 픽셀 도트들 */}
            <div className="absolute top-1 left-1 w-1 h-1 bg-[#00ff88]/50" style={{borderRadius: '1px'}}></div>
            <div className="absolute top-1 right-1 w-1 h-1 bg-[#00ff88]/50" style={{borderRadius: '1px'}}></div>
            <div className="absolute bottom-1 left-1 w-1 h-1 bg-[#00ff88]/50" style={{borderRadius: '1px'}}></div>
            <div className="absolute bottom-1 right-1 w-1 h-1 bg-[#00ff88]/50" style={{borderRadius: '1px'}}></div>
          </div>
        )
      })}

      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <div className="pt-3 pb-2">
          <div className="flex items-center justify-center gap-2">
            {/* 이전 페이지 버튼 */}
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="bg-[#1a202c]/60 border border-[#00ff88]/30 px-3 py-2 rounded-lg text-[#00ff88] hover:bg-[#1a202c]/80 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-mono text-sm"
              style={{borderRadius: '4px'}}
            >
              ◀
            </button>
            
            {/* 페이지 번호들 */}
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum
                if (totalPages <= 5) {
                  pageNum = i + 1
                } else if (currentPage <= 3) {
                  pageNum = i + 1
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i
                } else {
                  pageNum = currentPage - 2 + i
                }
                
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`px-3 py-2 rounded-lg font-mono text-sm transition-all duration-200 ${
                      currentPage === pageNum
                        ? 'bg-[#00ff88] text-black font-bold'
                        : 'bg-[#1a202c]/60 border border-[#00ff88]/30 text-[#00ff88] hover:bg-[#1a202c]/80'
                    }`}
                    style={{borderRadius: '4px'}}
                  >
                    {pageNum}
                  </button>
                )
              })}
            </div>
            
            {/* 다음 페이지 버튼 */}
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="bg-[#1a202c]/60 border border-[#00ff88]/30 px-3 py-2 rounded-lg text-[#00ff88] hover:bg-[#1a202c]/80 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-mono text-sm"
              style={{borderRadius: '4px'}}
            >
              ▶
            </button>
          </div>
          
          {/* 총 메시지 수 표시 */}
          <div className="text-center mt-2">
            <span className="text-gray-400 text-xs font-mono">
              총 {totalMessages}개의 방명록
            </span>
          </div>
        </div>
      )}

      {/* 방명록 작성 버튼 (다른 사용자의 페이지에서만) */}
      {!isOwnPage && (
        <div className="pt-3">
          <button
            onClick={() => setShowWriteForm(!showWriteForm)}
            className="w-full bg-gradient-to-r from-[#00ff88]/20 to-[#00cc6a]/20 border-2 border-[#00ff88]/50 hover:border-[#00ff88] text-[#00ff88] hover:text-white py-3 rounded-lg font-mono text-sm transition-all duration-300 relative"
            style={{borderRadius: '8px'}}
          >
            📝 {showWriteForm ? '작성 취소' : '방명록 남기기'}
            {/* 버튼 픽셀 도트 */}
            <div className="absolute top-1 left-1 w-1 h-1 bg-[#00ff88]/50" style={{borderRadius: '1px'}}></div>
            <div className="absolute top-1 right-1 w-1 h-1 bg-[#00ff88]/50" style={{borderRadius: '1px'}}></div>
            <div className="absolute bottom-1 left-1 w-1 h-1 bg-[#00ff88]/50" style={{borderRadius: '1px'}}></div>
            <div className="absolute bottom-1 right-1 w-1 h-1 bg-[#00ff88]/50" style={{borderRadius: '1px'}}></div>
          </button>
        </div>
      )}

      {/* 인라인 방명록 작성 폼 */}
      {showWriteForm && !isOwnPage && (
        <div className="mt-4 bg-gradient-to-br from-[#1a202c]/80 to-[#2d3748]/80 border-2 border-[#00ff88]/50 rounded-lg p-4 relative" style={{borderRadius: '8px'}}>
          <h4 className="text-[#00ff88] font-mono font-bold text-sm mb-3 text-center">
            방명록 작성하기
          </h4>
          
          <div className="space-y-3">
            <div className="relative">
              <textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="따뜻한 메시지를 남겨주세요..."
                className="w-full h-24 bg-gradient-to-br from-[#0a0a23]/80 to-[#16213e]/80 border-2 border-[#00ff88]/30 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-[#00ff88] resize-none font-mono text-sm relative"
                style={{borderRadius: '6px'}}
                maxLength={200}
              />
              {/* textarea 픽셀 도트들 */}
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
                🔒 비공개
              </label>
              
              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-400 font-mono bg-black/20 px-2 py-1 rounded">
                  {newMessage.length}/200
                </span>
                <button
                  onClick={submitMessage}
                  disabled={!newMessage.trim() || isSubmitting}
                  className="bg-gradient-to-r from-[#00ff88]/20 to-[#00cc6a]/20 border-2 border-[#00ff88]/50 hover:border-[#00ff88] disabled:border-gray-600/50 text-[#00ff88] hover:text-white disabled:text-gray-400 px-4 py-2 rounded-lg font-mono font-bold transition-all duration-300 text-xs relative"
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
          
          {/* 폼 픽셀 도트들 */}
          <div className="absolute top-1 left-1 w-1 h-1 bg-[#00ff88]/50" style={{borderRadius: '1px'}}></div>
          <div className="absolute top-1 right-1 w-1 h-1 bg-[#00ff88]/50" style={{borderRadius: '1px'}}></div>
          <div className="absolute bottom-1 left-1 w-1 h-1 bg-[#00ff88]/50" style={{borderRadius: '1px'}}></div>
          <div className="absolute bottom-1 right-1 w-1 h-1 bg-[#00ff88]/50" style={{borderRadius: '1px'}}></div>
        </div>
      )}


    </div>
  )
}

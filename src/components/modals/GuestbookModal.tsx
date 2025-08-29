import React, { useState, useEffect } from 'react'
import { UserProfile } from '@/types'

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
  isOpen: boolean
  onClose: () => void
  targetUser: UserProfile | null
  currentUserId: string
}

export default function GuestbookModal({
  isOpen,
  onClose,
  targetUser,
  currentUserId
}: GuestbookModalProps) {
  const [messages, setMessages] = useState<GuestbookMessage[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [isPrivate, setIsPrivate] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // 방명록 메시지 불러오기
  const fetchMessages = async () => {
    if (!targetUser?.id) return

    setIsLoading(true)
    try {
      const response = await fetch(`/api/guestbook?userId=${targetUser.id}`)
      const data = await response.json()

      if (response.ok) {
        setMessages(data.messages || [])
      } else {
        console.error('방명록 불러오기 실패:', data.error)
      }
    } catch (error) {
      console.error('방명록 불러오기 오류:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // 방명록 메시지 작성
  const handleSubmitMessage = async () => {
    if (!newMessage.trim() || !targetUser?.id || isSubmitting) return

    setIsSubmitting(true)
    try {
      const response = await fetch('/api/guestbook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: targetUser.id,
          visitorId: currentUserId,
          message: newMessage.trim(),
          isPrivate
        })
      })

      const data = await response.json()

      if (response.ok) {
        setNewMessage('')
        setIsPrivate(false)
        await fetchMessages() // 메시지 목록 새로고침
      } else {
        alert(data.error || '방명록 작성에 실패했습니다.')
      }
    } catch (error) {
      console.error('방명록 작성 오류:', error)
      alert('방명록 작성 중 오류가 발생했습니다.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // 방명록 메시지 삭제
  const handleDeleteMessage = async (messageId: string) => {
    if (!confirm('이 메시지를 삭제하시겠습니까?')) return

    try {
      const response = await fetch(`/api/guestbook/${messageId}?userId=${currentUserId}`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (response.ok) {
        await fetchMessages() // 메시지 목록 새로고침
      } else {
        alert(data.error || '메시지 삭제에 실패했습니다.')
      }
    } catch (error) {
      console.error('메시지 삭제 오류:', error)
      alert('메시지 삭제 중 오류가 발생했습니다.')
    }
  }

  // 모달이 열릴 때 메시지 불러오기
  useEffect(() => {
    if (isOpen && targetUser) {
      fetchMessages()
    }
  }, [isOpen, targetUser])

  if (!isOpen || !targetUser) return null

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const canDeleteMessage = (message: GuestbookMessage) => {
    return message.visitor.id === currentUserId || targetUser.id === currentUserId
  }

  return (
    <>
      {/* 전체 화면을 덮는 블랙 배경 */}
      <div 
        className="fixed inset-0 z-[999999] bg-black"
        onClick={onClose}
      />
      
      {/* 모달 컨테이너 */}
      <div className="fixed inset-0 z-[999999] flex items-center justify-center p-2 sm:p-4 overflow-y-auto pointer-events-none">
        <div 
          className="w-full max-w-lg bg-gradient-to-b from-[#0a0a23] via-[#16213e] to-[#1a1a2e] border-2 sm:border-4 border-[#ffd93d]/50 shadow-2xl relative max-h-[calc(100vh-32px)] overflow-y-auto pointer-events-auto"
          style={{
            borderRadius: '6px',
            fontFamily: 'monospace',
            imageRendering: 'pixelated',
            boxShadow: '0 0 20px rgba(255, 217, 61, 0.2), inset 0 0 15px rgba(255, 217, 61, 0.05)'
          }}
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
          }}
        >
          {/* 네온 글로우 테두리 */}
          <div className="absolute -inset-1 bg-gradient-to-r from-[#ffd93d]/20 via-[#ff6b6b]/20 to-[#ffd93d]/20 blur-sm -z-10" 
               style={{borderRadius: '12px'}}></div>
          
          {/* 헤더 */}
          <div className="bg-gradient-to-r from-[#0a0a23] to-[#16213e] p-3 sm:p-4 border-b-2 border-[#ffd93d]/30 relative">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-5 h-5 sm:w-6 sm:h-6 bg-gradient-to-br from-[#ffd93d] to-[#ff6b6b] border border-[#ffd93d]" 
                     style={{borderRadius: '3px'}}>
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="w-2 h-2 sm:w-3 sm:h-3 bg-white" style={{borderRadius: '1px'}}></div>
                  </div>
                </div>
                <h3 className="text-[#ffd93d] font-bold text-sm sm:text-lg font-mono tracking-wide" 
                    style={{textShadow: '0 0 8px rgba(255, 217, 61, 0.5)'}}>
                  {targetUser.nickname}님의 방명록
                </h3>
              </div>
              <button
                onClick={onClose}
                className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-br from-[#ff6b6b]/20 to-[#ff4757]/20 border border-[#ff6b6b]/50 hover:border-[#ff6b6b] text-[#ff6b6b] hover:text-[#ff4757] font-bold transition-all duration-200 hover:scale-110 text-sm sm:text-base"
                style={{borderRadius: '4px'}}
              >
                ✕
              </button>
            </div>
          </div>

          <div className="p-3 sm:p-4 space-y-4">
            {/* 메시지 작성 폼 */}
            <div className="bg-gradient-to-r from-[#00d4ff]/20 to-[#9c88ff]/20 border border-[#00d4ff]/50 p-3 relative"
                 style={{borderRadius: '4px'}}>
              <h4 className="text-[#00d4ff] text-center font-bold text-xs sm:text-sm font-mono tracking-wide mb-3" 
                  style={{textShadow: '0 0 6px rgba(0, 212, 255, 0.5)'}}>
                방명록 남기기
              </h4>
              
              <textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="따뜻한 메시지를 남겨보세요..."
                maxLength={500}
                className="w-full h-20 bg-[#1a202c]/50 border border-[#00d4ff]/30 rounded p-2 text-white text-sm font-mono resize-none focus:outline-none focus:border-[#00d4ff]/60"
                style={{borderRadius: '4px'}}
              />
              
              <div className="flex items-center justify-between mt-2">
                <label className="flex items-center gap-2 text-white text-xs font-mono">
                  <input
                    type="checkbox"
                    checked={isPrivate}
                    onChange={(e) => setIsPrivate(e.target.checked)}
                    className="w-3 h-3"
                  />
                  비밀 메시지
                </label>
                
                <span className="text-gray-400 text-xs font-mono">
                  {newMessage.length}/500
                </span>
              </div>
              
              <button
                onClick={handleSubmitMessage}
                disabled={!newMessage.trim() || isSubmitting}
                className={`w-full mt-3 py-2 px-3 rounded font-mono text-sm font-bold transition-all duration-200 ${
                  !newMessage.trim() || isSubmitting
                    ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-[#00d4ff] to-[#9c88ff] text-white hover:scale-105'
                }`}
                style={{borderRadius: '4px'}}
              >
                {isSubmitting ? '작성 중...' : '방명록 남기기'}
              </button>

              {/* 모서리 픽셀 도트 */}
              <div className="absolute top-1 left-1 w-1 h-1 bg-[#00d4ff]" style={{borderRadius: '1px'}}></div>
              <div className="absolute top-1 right-1 w-1 h-1 bg-[#00d4ff]" style={{borderRadius: '1px'}}></div>
              <div className="absolute bottom-1 left-1 w-1 h-1 bg-[#00d4ff]" style={{borderRadius: '1px'}}></div>
              <div className="absolute bottom-1 right-1 w-1 h-1 bg-[#00d4ff]" style={{borderRadius: '1px'}}></div>
            </div>

            {/* 메시지 목록 */}
            <div className="bg-gradient-to-r from-[#9c88ff]/20 to-[#ff6b6b]/20 border border-[#9c88ff]/50 p-3 relative max-h-96 overflow-y-auto"
                 style={{borderRadius: '4px'}}>
              <h4 className="text-[#9c88ff] text-center font-bold text-xs sm:text-sm font-mono tracking-wide mb-3" 
                  style={{textShadow: '0 0 6px rgba(156, 136, 255, 0.5)'}}>
                방명록 ({messages.length})
              </h4>

              {isLoading ? (
                <div className="text-center text-gray-400 text-sm font-mono py-4">
                  방명록을 불러오는 중...
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center text-gray-400 text-sm font-mono py-4">
                  아직 방명록이 없습니다.
                </div>
              ) : (
                <div className="space-y-3">
                  {messages.map((message) => (
                    <div 
                      key={message.id}
                      className="bg-[#1a202c]/60 border border-[#9c88ff]/30 p-3 relative"
                      style={{borderRadius: '4px'}}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-[#9c88ff] font-bold text-sm font-mono">
                            {message.visitor.nickname}
                          </span>
                          {message.is_private && (
                            <span className="text-[#ff6b6b] text-xs font-mono">🔒</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-gray-400 text-xs font-mono">
                            {formatDate(message.created_at)}
                          </span>
                          {canDeleteMessage(message) && (
                            <button
                              onClick={() => handleDeleteMessage(message.id)}
                              className="text-[#ff6b6b] hover:text-[#ff4757] text-xs font-mono transition-colors"
                            >
                              삭제
                            </button>
                          )}
                        </div>
                      </div>
                      
                      <p className="text-white text-sm font-mono leading-relaxed">
                        {message.message}
                      </p>

                      {/* 모서리 픽셀 도트 */}
                      <div className="absolute top-1 left-1 w-1 h-1 bg-[#9c88ff]" style={{borderRadius: '1px'}}></div>
                      <div className="absolute top-1 right-1 w-1 h-1 bg-[#9c88ff]" style={{borderRadius: '1px'}}></div>
                      <div className="absolute bottom-1 left-1 w-1 h-1 bg-[#9c88ff]" style={{borderRadius: '1px'}}></div>
                      <div className="absolute bottom-1 right-1 w-1 h-1 bg-[#9c88ff]" style={{borderRadius: '1px'}}></div>
                    </div>
                  ))}
                </div>
              )}

              {/* 모서리 픽셀 도트 */}
              <div className="absolute top-1 left-1 w-1 h-1 bg-[#9c88ff]" style={{borderRadius: '1px'}}></div>
              <div className="absolute top-1 right-1 w-1 h-1 bg-[#9c88ff]" style={{borderRadius: '1px'}}></div>
              <div className="absolute bottom-1 left-1 w-1 h-1 bg-[#9c88ff]" style={{borderRadius: '1px'}}></div>
              <div className="absolute bottom-1 right-1 w-1 h-1 bg-[#9c88ff]" style={{borderRadius: '1px'}}></div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

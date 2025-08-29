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

  // 방명록 메시지 불러오기
  const fetchMessages = async () => {
    if (!targetUserId) return

    setIsLoading(true)
    try {
      const response = await fetch(`/api/guestbook?userId=${targetUserId}`)
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
            <div className="space-y-3">
              <textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="따뜻한 메시지를 남겨주세요..."
                className="w-full h-20 bg-black/20 border border-[#00ff88]/30 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-[#00ff88] resize-none"
                maxLength={200}
              />
              
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm text-gray-300">
                  <input
                    type="checkbox"
                    checked={isPrivate}
                    onChange={(e) => setIsPrivate(e.target.checked)}
                    className="rounded"
                  />
                  비밀글
                </label>
                
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400">
                    {newMessage.length}/200
                  </span>
                  <button
                    onClick={submitMessage}
                    disabled={!newMessage.trim() || isSubmitting}
                    className="bg-gradient-to-r from-[#00ff88] to-[#00cc6a] hover:from-[#00cc6a] hover:to-[#00ff88] disabled:from-gray-600 disabled:to-gray-700 text-black disabled:text-gray-400 px-4 py-2 rounded-lg font-bold transition-all duration-300 text-sm"
                  >
                    {isSubmitting ? '작성 중...' : '작성'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 방명록 목록 */}
        <div className="flex-1 overflow-y-auto p-4">
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-black/20 rounded-lg p-4 animate-pulse">
                  <div className="h-4 bg-gray-600 rounded mb-2 w-1/3"></div>
                  <div className="h-3 bg-gray-700 rounded mb-2"></div>
                  <div className="h-3 bg-gray-700 rounded w-2/3"></div>
                </div>
              ))}
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-400 mb-4">아직 방명록이 없습니다.</p>
              {user && user.id !== targetUserId && (
                <p className="text-sm text-gray-500">첫 번째 방명록을 남겨보세요!</p>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className="bg-gradient-to-br from-black/20 to-black/10 border border-[#00ff88]/20 rounded-lg p-4 hover:border-[#00ff88]/40 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[#00ff88]">
                        {message.visitor.nickname}
                      </span>
                      {message.is_private && (
                        <span className="text-red-400 text-sm">🔒</span>
                      )}
                    </div>
                    <span className="text-xs text-gray-400">
                      {formatDate(message.created_at)}
                    </span>
                  </div>
                  <p className="text-gray-200 leading-relaxed whitespace-pre-wrap">
                    {message.message}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
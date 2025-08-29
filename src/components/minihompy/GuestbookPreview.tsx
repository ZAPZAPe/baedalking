import React, { useState, useEffect } from 'react'

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
}

export default function GuestbookPreview({ 
  userId, 
  isOwnPage = false, 
  onOpenGuestbook 
}: GuestbookPreviewProps) {
  const [recentMessages, setRecentMessages] = useState<GuestbookMessage[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // 최근 방명록 메시지 불러오기 (최대 3개)
  const fetchRecentMessages = async () => {
    if (!userId) return

    setIsLoading(true)
    try {
      const response = await fetch(`/api/guestbook?userId=${userId}`)
      const data = await response.json()

      if (response.ok) {
        // 최근 3개만 표시
        setRecentMessages((data.messages || []).slice(0, 3))
      } else {
        console.error('방명록 미리보기 불러오기 실패:', data.error)
      }
    } catch (error) {
      console.error('방명록 미리보기 오류:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchRecentMessages()
  }, [userId])

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
        <div className="bg-[#1a202c]/60 border border-[#ffd93d]/30 rounded p-3 animate-pulse">
          <div className="h-4 bg-gray-600 rounded mb-2"></div>
          <div className="h-3 bg-gray-700 rounded"></div>
        </div>
      </div>
    )
  }

  if (recentMessages.length === 0) {
    return (
      <div className="space-y-3">
        <div className="bg-[#1a202c]/60 border border-[#ffd93d]/30 rounded p-3 text-center">
          <p className="text-gray-400 text-sm font-mono">
            아직 방명록이 없습니다.
          </p>
          {!isOwnPage && (
            <button
              onClick={onOpenGuestbook}
              className="mt-3 bg-gradient-to-r from-[#ffd93d]/20 to-[#ff6b6b]/20 border border-[#ffd93d]/50 text-[#ffd93d] px-4 py-2 rounded font-mono text-xs hover:scale-105 transition-all"
            >
              첫 번째 방명록 남기기
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {recentMessages.map((message) => (
        <div key={message.id} className="bg-[#1a202c]/60 border border-[#ffd93d]/30 rounded p-3">
          <div className="flex justify-between items-start mb-2">
            <div className="flex items-center gap-1">
              <span className="text-[#ffd93d] font-bold text-sm font-mono">
                {message.visitor.nickname}
              </span>
              {message.is_private && (
                <span className="text-[#ff6b6b] text-xs font-mono">🔒</span>
              )}
            </div>
            <span className="text-gray-400 text-xs font-mono">
              {formatDate(message.created_at)}
            </span>
          </div>
          <p className="text-white text-sm font-mono leading-relaxed">
            {message.message.length > 50 
              ? `${message.message.substring(0, 50)}...` 
              : message.message
            }
          </p>
        </div>
      ))}

      {!isOwnPage && (
        <div className="text-center pt-3">
          <button
            onClick={onOpenGuestbook}
            className="bg-gradient-to-r from-[#ffd93d]/20 to-[#ff6b6b]/20 border border-[#ffd93d]/50 text-[#ffd93d] px-6 py-2 rounded font-mono text-sm hover:scale-105 transition-all"
          >
            방명록 남기기
          </button>
        </div>
      )}

      <div className="text-center">
        <button
          onClick={onOpenGuestbook}
          className="text-[#ffd93d] text-xs font-mono hover:underline"
        >
          전체 방명록 보기 ({recentMessages.length > 0 ? '+' : ''}more)
        </button>
      </div>
    </div>
  )
}

import React, { useState, useEffect } from 'react'
import { 
  Friend, 
  SearchUser, 
  FriendRequestAction,
  FriendsApiResponse,
  UsersSearchApiResponse
} from '@/types'

interface FriendsModalProps {
  isOpen: boolean
  onClose: () => void
  currentUserId: string
}

export default function FriendsModal({
  isOpen,
  onClose,
  currentUserId
}: FriendsModalProps) {
  const [activeTab, setActiveTab] = useState<'friends' | 'requests' | 'search'>('friends')
  const [friends, setFriends] = useState<Friend[]>([])
  const [pendingRequests, setPendingRequests] = useState<Friend[]>([])
  const [searchResults, setSearchResults] = useState<SearchUser[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSearching, setIsSearching] = useState(false)

  // 친구 목록 불러오기
  const fetchFriends = async () => {
    if (!currentUserId) return

    setIsLoading(true)
    try {
      const response = await fetch(`/api/friends?userId=${currentUserId}&status=accepted`)
      const data = await response.json()

      if (response.ok) {
        setFriends(data.friends || [])
      } else {
        console.error('친구 목록 불러오기 실패:', data.error)
      }
    } catch (error) {
      console.error('친구 목록 오류:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // 친구 요청 목록 불러오기
  const fetchPendingRequests = async () => {
    if (!currentUserId) return

    try {
      const response = await fetch(`/api/friends?userId=${currentUserId}&status=pending`)
      const data = await response.json()

      if (response.ok) {
        // 받은 요청만 필터링 (내가 friend_id인 경우)
        const receivedRequests = data.friends?.filter((f: Friend) => !f.isRequester) || []
        setPendingRequests(receivedRequests)
      } else {
        console.error('친구 요청 목록 불러오기 실패:', data.error)
      }
    } catch (error) {
      console.error('친구 요청 목록 오류:', error)
    }
  }

  // 사용자 검색
  const searchUsers = async () => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setSearchResults([])
      return
    }

    setIsSearching(true)
    try {
      const response = await fetch(`/api/users/search?q=${encodeURIComponent(searchQuery)}&currentUserId=${currentUserId}`)
      const data = await response.json()

      if (response.ok) {
        setSearchResults(data.users || [])
      } else {
        console.error('사용자 검색 실패:', data.error)
        setSearchResults([])
      }
    } catch (error) {
      console.error('사용자 검색 오류:', error)
      setSearchResults([])
    } finally {
      setIsSearching(false)
    }
  }

  // 친구 요청 보내기
  const sendFriendRequest = async (friendId: string) => {
    try {
      const response = await fetch('/api/friends', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: currentUserId,
          friendId
        })
      })

      const data = await response.json()

      if (response.ok) {
        alert(data.message)
        await searchUsers() // 검색 결과 새로고침
      } else {
        alert(data.error || '친구 요청 보내기에 실패했습니다.')
      }
    } catch (error) {
      console.error('친구 요청 오류:', error)
      alert('친구 요청 중 오류가 발생했습니다.')
    }
  }

  // 친구 요청 수락/거절
  const handleFriendRequest = async (friendshipId: string, action: 'accept' | 'reject') => {
    try {
      const response = await fetch(`/api/friends/${friendshipId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action,
          userId: currentUserId
        })
      })

      const data = await response.json()

      if (response.ok) {
        alert(data.message)
        await fetchPendingRequests() // 요청 목록 새로고침
        await fetchFriends() // 친구 목록 새로고침
      } else {
        alert(data.error || '친구 요청 처리에 실패했습니다.')
      }
    } catch (error) {
      console.error('친구 요청 처리 오류:', error)
      alert('친구 요청 처리 중 오류가 발생했습니다.')
    }
  }

  // 친구 삭제
  const deleteFriend = async (friendshipId: string, friendName: string) => {
    if (!confirm(`${friendName}님과의 친구 관계를 해제하시겠습니까?`)) return

    try {
      const response = await fetch(`/api/friends/${friendshipId}?userId=${currentUserId}`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (response.ok) {
        alert(data.message)
        await fetchFriends() // 친구 목록 새로고침
      } else {
        alert(data.error || '친구 삭제에 실패했습니다.')
      }
    } catch (error) {
      console.error('친구 삭제 오류:', error)
      alert('친구 삭제 중 오류가 발생했습니다.')
    }
  }

  // 모달이 열릴 때 데이터 로드
  useEffect(() => {
    if (isOpen && currentUserId) {
      fetchFriends()
      fetchPendingRequests()
    }
  }, [isOpen, currentUserId])

  // 검색어 변경 시 검색 실행 (디바운싱)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (activeTab === 'search') {
        searchUsers()
      }
    }, 500)

    return () => clearTimeout(timer)
  }, [searchQuery, activeTab])

  if (!isOpen) return null

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getFriendStatusButton = (user: SearchUser) => {
    switch (user.friendStatus) {
      case 'accepted':
        return (
          <span className="text-[#00ff88] text-xs font-mono">친구</span>
        )
      case 'pending_sent':
        return (
          <span className="text-[#ffd93d] text-xs font-mono">요청됨</span>
        )
      case 'pending_received':
        return (
          <span className="text-[#9c88ff] text-xs font-mono">요청받음</span>
        )
      default:
        return (
          <button
            onClick={() => sendFriendRequest(user.id)}
            className="bg-gradient-to-r from-[#9c88ff]/20 to-[#ff6b6b]/20 border border-[#9c88ff]/50 text-[#9c88ff] px-3 py-1 rounded font-mono text-xs hover:scale-105 transition-all"
          >
            친구추가
          </button>
        )
    }
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
          className="w-full max-w-2xl bg-gradient-to-b from-[#0a0a23] via-[#16213e] to-[#1a1a2e] border-2 sm:border-4 border-[#ffd93d]/50 shadow-2xl relative max-h-[calc(100vh-32px)] overflow-y-auto pointer-events-auto"
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
              <h3 className="text-[#ffd93d] font-bold text-sm sm:text-lg font-mono tracking-wide" 
                  style={{textShadow: '0 0 8px rgba(255, 217, 61, 0.5)'}}>
                친구 관리
              </h3>
              <button
                onClick={onClose}
                className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-br from-[#ff6b6b]/20 to-[#ff4757]/20 border border-[#ff6b6b]/50 hover:border-[#ff6b6b] text-[#ff6b6b] hover:text-[#ff4757] font-bold transition-all duration-200 hover:scale-110 text-sm sm:text-base"
                style={{borderRadius: '4px'}}
              >
                ✕
              </button>
            </div>
          </div>

          {/* 탭 메뉴 */}
          <div className="flex border-b border-[#ffd93d]/30">
            {[
              { id: 'friends', label: '친구 목록', count: friends.length },
              { id: 'requests', label: '친구 요청', count: pendingRequests.length },
              { id: 'search', label: '친구 찾기', count: null }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 p-3 font-mono text-sm transition-all ${
                  activeTab === tab.id
                    ? 'bg-[#ffd93d]/20 text-[#ffd93d] border-b-2 border-[#ffd93d]'
                    : 'text-gray-400 hover:text-white hover:bg-[#ffd93d]/10'
                }`}
              >
                {tab.label}
                {tab.count !== null && tab.count > 0 && (
                  <span className="ml-1 bg-[#ff6b6b] text-white text-xs px-1 rounded">
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="p-4">
            {/* 친구 목록 탭 */}
            {activeTab === 'friends' && (
              <div>
                {isLoading ? (
                  <div className="text-center text-gray-400 text-sm font-mono py-4">
                    친구 목록을 불러오는 중...
                  </div>
                ) : friends.length === 0 ? (
                  <div className="text-center text-gray-400 text-sm font-mono py-4">
                    아직 친구가 없습니다.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {friends.map((friend) => (
                      <div key={friend.id} className="bg-[#1a202c]/60 border border-[#00ff88]/30 rounded p-3">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-[#00ff88]/20 to-[#9c88ff]/20 border border-[#00ff88]/50 rounded-lg flex items-center justify-center">
                              <span className="text-[#00ff88] font-bold text-sm">
                                {friend.nickname.charAt(0)}
                              </span>
                            </div>
                            <div>
                              <div className="text-white font-bold text-sm font-mono">
                                {friend.nickname}
                              </div>
                              <div className="text-gray-400 text-xs font-mono">
                                {friend.region}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => window.location.href = `/minihompy/${friend.friendId}`}
                              className="bg-gradient-to-r from-[#9c88ff]/20 to-[#ff6b6b]/20 border border-[#9c88ff]/50 text-[#9c88ff] px-3 py-1 rounded font-mono text-xs hover:scale-105 transition-all"
                            >
                              방문
                            </button>
                            <button
                              onClick={() => deleteFriend(friend.id, friend.nickname)}
                              className="bg-gradient-to-r from-[#ff6b6b]/20 to-[#ff4757]/20 border border-[#ff6b6b]/50 text-[#ff6b6b] px-3 py-1 rounded font-mono text-xs hover:scale-105 transition-all"
                            >
                              삭제
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 친구 요청 탭 */}
            {activeTab === 'requests' && (
              <div>
                {pendingRequests.length === 0 ? (
                  <div className="text-center text-gray-400 text-sm font-mono py-4">
                    받은 친구 요청이 없습니다.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {pendingRequests.map((request) => (
                      <div key={request.id} className="bg-[#1a202c]/60 border border-[#ffd93d]/30 rounded p-3">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-[#ffd93d]/20 to-[#ff6b6b]/20 border border-[#ffd93d]/50 rounded-lg flex items-center justify-center">
                              <span className="text-[#ffd93d] font-bold text-sm">
                                {request.nickname.charAt(0)}
                              </span>
                            </div>
                            <div>
                              <div className="text-white font-bold text-sm font-mono">
                                {request.nickname}
                              </div>
                              <div className="text-gray-400 text-xs font-mono">
                                {request.region} • {formatDate(request.created_at)}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleFriendRequest(request.id, 'accept')}
                              className="bg-gradient-to-r from-[#00ff88]/20 to-[#9c88ff]/20 border border-[#00ff88]/50 text-[#00ff88] px-3 py-1 rounded font-mono text-xs hover:scale-105 transition-all"
                            >
                              수락
                            </button>
                            <button
                              onClick={() => handleFriendRequest(request.id, 'reject')}
                              className="bg-gradient-to-r from-[#ff6b6b]/20 to-[#ff4757]/20 border border-[#ff6b6b]/50 text-[#ff6b6b] px-3 py-1 rounded font-mono text-xs hover:scale-105 transition-all"
                            >
                              거절
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 친구 찾기 탭 */}
            {activeTab === 'search' && (
              <div>
                <div className="mb-4">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="닉네임 또는 지역으로 검색..."
                    className="w-full bg-[#1a202c]/50 border border-[#9c88ff]/30 rounded p-3 text-white text-sm font-mono focus:outline-none focus:border-[#9c88ff]/60"
                    style={{borderRadius: '4px'}}
                  />
                </div>

                {isSearching ? (
                  <div className="text-center text-gray-400 text-sm font-mono py-4">
                    검색 중...
                  </div>
                ) : searchQuery.length < 2 ? (
                  <div className="text-center text-gray-400 text-sm font-mono py-4">
                    검색어를 2글자 이상 입력해주세요.
                  </div>
                ) : searchResults.length === 0 ? (
                  <div className="text-center text-gray-400 text-sm font-mono py-4">
                    검색 결과가 없습니다.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {searchResults.map((user) => (
                      <div key={user.id} className="bg-[#1a202c]/60 border border-[#9c88ff]/30 rounded p-3">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-[#9c88ff]/20 to-[#ff6b6b]/20 border border-[#9c88ff]/50 rounded-lg flex items-center justify-center">
                              <span className="text-[#9c88ff] font-bold text-sm">
                                {user.nickname.charAt(0)}
                              </span>
                            </div>
                            <div>
                              <div className="text-white font-bold text-sm font-mono">
                                {user.nickname}
                              </div>
                              <div className="text-gray-400 text-xs font-mono">
                                {user.region}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => window.location.href = `/minihompy/${user.id}`}
                              className="bg-gradient-to-r from-[#00d4ff]/20 to-[#9c88ff]/20 border border-[#00d4ff]/50 text-[#00d4ff] px-3 py-1 rounded font-mono text-xs hover:scale-105 transition-all"
                            >
                              방문
                            </button>
                            {getFriendStatusButton(user)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

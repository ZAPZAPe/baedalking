'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { UserProfile, Friendship } from '@/types/social'

interface FriendsTabProps {
  currentUserId: string
  setShowFriendDetail: (show: boolean) => void
  setSelectedFriend: (friend: any) => void
  onShowUserProfile: (userProfile: any) => void
  friendRequests: { id: number; name: string; level: number; message: string }[]
  setFriendRequests: (requests: { id: number; name: string; level: number; message: string }[]) => void
}

export default function FriendsTab({ currentUserId, setShowFriendDetail, setSelectedFriend, onShowUserProfile, friendRequests, setFriendRequests }: FriendsTabProps) {
  const router = useRouter()
  const [friends, setFriends] = useState<Friendship[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [activeView, setActiveView] = useState<'friends' | 'requests' | 'search'>('friends')
  
  // 친구 목록 검색 및 페이지네이션
  const [friendSearchQuery, setFriendSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const friendsPerPage = 10

  // 친구 목록 가져오기
  useEffect(() => {
    loadFriends()
  }, [])

  const loadFriends = async () => {
    try {
      const response = await fetch(`/api/friends?userId=${currentUserId}`)
      const data = await response.json()
      
      if (response.ok && data.friends) {
        setFriends(data.friends)
      } else {
        setFriends([])
      }
    } catch (error) {
      console.error('친구 목록 로딩 오류:', error)
      setFriends([])
    }
  }



  // 친구 검색
  const handleSearchFriend = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([])
      return
    }
    
    try {
      const response = await fetch(`/api/users/search?q=${encodeURIComponent(searchQuery)}&currentUserId=${currentUserId}`)
      const data = await response.json()
      
      if (response.ok && data.users) {
        setSearchResults(data.users)
      } else {
        setSearchResults([])
      }
    } catch (error) {
      console.error('친구 검색 오류:', error)
      setSearchResults([])
    }
  }

  // 친구 상세보기 열기
  const handleOpenFriendDetail = (friendship: any) => {
    // UserProfileModal을 위한 사용자 프로필 데이터 생성
    const userProfile = {
      id: friendship.friendId || friendship.id,
      nickname: friendship.nickname || '배달킹',
      region: friendship.region || '서울특별시',
      income: 0, // 기본값, 실제로는 API에서 가져와야 함
      count: 0, // 기본값, 실제로는 API에서 가져와야 함
      platforms: [], // 기본값, 실제로는 API에서 가져와야 함
      minihomeId: friendship.friendId || friendship.id
    }
    
    onShowUserProfile(userProfile)
  }



  // 친구 요청 수락
  const handleAcceptFriend = async (requestId: number) => {
    try {
      const response = await fetch(`/api/friends/${requestId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'accept' }),
      })

      if (response.ok) {
        // 친구 요청 목록에서 제거
        setFriendRequests(friendRequests.filter(req => req.id !== requestId))
        // 친구 목록 새로고침
        loadFriends()
      } else {
        console.error('친구 요청 수락 실패')
      }
    } catch (error) {
      console.error('친구 요청 수락 오류:', error)
    }
  }

  // 친구 요청 거절
  const handleRejectFriend = async (requestId: number) => {
    try {
      const response = await fetch(`/api/friends/${requestId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'reject' }),
      })

      if (response.ok) {
        // 친구 요청 목록에서 제거
        setFriendRequests(friendRequests.filter(req => req.id !== requestId))
      } else {
        console.error('친구 요청 거절 실패')
      }
    } catch (error) {
      console.error('친구 요청 거절 오류:', error)
    }
  }

  // 친구 요청 보내기
  const handleSendFriendRequest = async (userId: string) => {
    try {
      const response = await fetch('/api/friends', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: currentUserId,
          friendId: userId
        }),
      })

      const data = await response.json()
      
      if (response.ok) {
        alert(data.message || '친구 요청을 보냈습니다!')
        // 검색 결과 업데이트 (friendStatus 변경)
        setSearchResults(prev => prev.map(user => 
          user.id === userId ? { ...user, friendStatus: 'pending_sent' } : user
        ))
      } else {
        alert(data.error || '친구 요청에 실패했습니다.')
      }
    } catch (error) {
      console.error('친구 요청 보내기 오류:', error)
      alert('친구 요청에 실패했습니다.')
    }
  }

        // 미니홈피 방문
      const handleVisitMinihome = (minihomeId: string) => {
        console.log('미니홈피 방문 시도:', minihomeId)
        try {
          // 미니홈피 페이지로 이동
          router.push(`/minihompy/${minihomeId}`)
          console.log('라우터 푸시 완료')
        } catch (error) {
          console.error('라우터 푸시 에러:', error)
          // 폴백: window.location.href 사용
          console.log('폴백 방법 사용: window.location.href')
          window.location.href = `/minihompy/${minihomeId}`
        }
      }

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* 상단 네비게이션 탭 */}
      <div className="bg-gradient-to-br from-[#2d3748] to-[#1a202c] rounded-xl p-4 border border-[#00d4ff]/30 shadow-inner mb-2 sm:mb-3 lg:mb-4 flex-shrink-0 relative">
        
        {/* 픽셀 헤더 */}
        <div
          className="w-full bg-gradient-to-r from-[#1a202c] to-[#2d3748] border-2 border-[#00d4ff]/50 hover:border-[#00d4ff] text-white font-mono py-3 px-4 transition-all duration-200 relative mb-4"
          style={{
            borderRadius: '4px',
            fontFamily: 'monospace',
            imageRendering: 'pixelated'
          }}
        >
          <div className="flex items-center justify-center">
            <h3 className="text-white font-bold text-base font-mono" style={{
              imageRendering: 'pixelated'
            }}>
              친구 관리
            </h3>
          </div>

          {/* 픽셀 도트들 */}
          <div className="absolute top-1 left-1 w-1 h-1 bg-[#00d4ff]/60" style={{borderRadius: '1px'}}></div>
          <div className="absolute top-1 right-1 w-1 h-1 bg-[#00d4ff]/60" style={{borderRadius: '1px'}}></div>
          <div className="absolute bottom-1 left-1 w-1 h-1 bg-[#00d4ff]/60" style={{borderRadius: '1px'}}></div>
          <div className="absolute bottom-1 right-1 w-1 h-1 bg-[#00d4ff]/60" style={{borderRadius: '1px'}}></div>
        </div>
        
        {/* 탭 버튼들 */}
        <div className="flex gap-2">
          {[
            { id: 'friends', label: '친구목록', color: '#00ff88' },
            { id: 'requests', label: '친구요청', color: '#ff6b6b' },
            { id: 'search', label: '친구찾기', color: '#ffd93d' }
          ].map((view) => (
            <button
              key={view.id}
              onClick={() => setActiveView(view.id as any)}
              className={`flex-1 py-2.5 px-3 font-mono transition-all duration-200 border-2 relative ${
                activeView === view.id
                  ? 'bg-gradient-to-r from-[#1a202c] to-[#2d3748] shadow-lg'
                  : 'bg-[#1a202c]/60 hover:bg-[#1a202c]/80'
              } ${
                activeView === view.id
                  ? `border-[${view.color}]/60`
                  : 'border-gray-600/30'
              }`}
              style={{
                borderRadius: '4px',
                borderColor: activeView === view.id ? `${view.color}60` : undefined
              }}
            >
              <div className="flex items-center justify-center">
                <span className={`text-xs sm:text-sm font-bold tracking-wide ${
                  activeView === view.id
                    ? `text-[${view.color}]`
                    : 'text-gray-400'
                }`} style={{
                  color: activeView === view.id ? view.color : undefined,
                  textShadow: activeView === view.id ? `0 0 6px ${view.color}80` : 'none'
                }}>
                  {view.label}
                  {view.id === 'requests' && friendRequests.length > 0 && (
                    <span className="ml-1 inline-flex items-center justify-center w-4 h-4 bg-[#ff6b6b] text-white text-xs rounded-full">
                      {friendRequests.length}
                    </span>
                  )}
                </span>
              </div>
              
              {/* 픽셀 도트들 */}
              <div className={`absolute top-0.5 left-0.5 w-1 h-1 ${
                activeView === view.id
                  ? `bg-[${view.color}]`
                  : 'bg-gray-500'
              }`} style={{
                borderRadius: '1px',
                backgroundColor: activeView === view.id ? view.color : undefined
              }}></div>
              <div className={`absolute top-0.5 right-0.5 w-1 h-1 ${
                activeView === view.id
                  ? `bg-[${view.color}]`
                  : 'bg-gray-500'
              }`} style={{
                borderRadius: '1px',
                backgroundColor: activeView === view.id ? view.color : undefined
              }}></div>
              <div className={`absolute bottom-0.5 left-0.5 w-1 h-1 ${
                activeView === view.id
                  ? `bg-[${view.color}]`
                  : 'bg-gray-500'
              }`} style={{
                borderRadius: '1px',
                backgroundColor: activeView === view.id ? view.color : undefined
              }}></div>
              <div className={`absolute bottom-0.5 right-0.5 w-1 h-1 ${
                activeView === view.id
                  ? `bg-[${view.color}]`
                  : 'bg-gray-500'
              }`} style={{
                borderRadius: '1px',
                backgroundColor: activeView === view.id ? view.color : undefined
              }}></div>
            </button>
          ))}
        </div>
      </div>

      {/* 친구 목록 뷰 */}
      {activeView === 'friends' && (
        <div className="space-y-3 sm:space-y-4">
          {/* 친구 목록 컨테이너 */}
          <div className="bg-gradient-to-br from-[#2d3748] to-[#1a202c] rounded-xl p-4 border border-[#00ff88]/30 shadow-inner mb-2 sm:mb-3 lg:mb-4 flex-shrink-0 relative">
            
            {/* 픽셀 헤더 */}
            <div
              className="w-full bg-gradient-to-r from-[#1a202c] to-[#2d3748] border-2 border-[#00ff88]/50 hover:border-[#00ff88] text-white font-mono py-3 px-4 transition-all duration-200 relative mb-4"
              style={{
                borderRadius: '4px',
                fontFamily: 'monospace',
                imageRendering: 'pixelated'
              }}
            >
              <div className="flex items-center justify-center">
                <h3 className="text-white font-bold text-base font-mono" style={{
                  imageRendering: 'pixelated'
                }}>
                  친구 목록 ({friends.length})
                </h3>
              </div>
              
              {/* 픽셀 도트들 */}
              <div className="absolute top-1 left-1 w-1 h-1 bg-[#00ff88]/60" style={{borderRadius: '1px'}}></div>
              <div className="absolute top-1 right-1 w-1 h-1 bg-[#00ff88]/60" style={{borderRadius: '1px'}}></div>
              <div className="absolute bottom-1 left-1 w-1 h-1 bg-[#00ff88]/60" style={{borderRadius: '1px'}}></div>
              <div className="absolute bottom-1 right-1 w-1 h-1 bg-[#00ff88]/60" style={{borderRadius: '1px'}}></div>
            </div>
            
            {/* 친구 검색 */}
            <div className="mb-4">
              <input
                type="text"
                placeholder="친구 검색..."
                value={friendSearchQuery}
                onChange={(e) => setFriendSearchQuery(e.target.value)}
                className="w-full bg-[#1a202c] border border-[#00ff88]/50 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:border-[#00ff88] focus:outline-none font-mono"
                style={{borderRadius: '4px'}}
              />
            </div>
            
            {friends.length === 0 ? (
              <div className="text-center py-8 text-gray-400 font-mono bg-[#1a202c]/30 rounded-lg border border-[#00ff88]/20">
                <p>아직 친구가 없습니다.</p>
                <p className="text-sm mt-2">친구 찾기로 새로운 친구를 만들어보세요!</p>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  {friends
                    .filter(friendship => 
                      friendship.friend?.nickname?.toLowerCase().includes(friendSearchQuery.toLowerCase())
                    )
                    .slice((currentPage - 1) * friendsPerPage, currentPage * friendsPerPage)
                    .map((friendship) => (
                      <div key={friendship.id} className="bg-[#1a202c]/60 border-2 border-[#00ff88]/30 p-3 relative cursor-pointer hover:border-[#00ff88]/50 transition-all duration-200" 
                           style={{borderRadius: '4px'}}
                           onClick={() => handleOpenFriendDetail(friendship)}>
                        <div className="flex items-center justify-between">
                          <p className="text-white font-bold font-mono text-sm">{friendship.friend?.nickname}</p>
                          <div className="text-[#00ff88] text-sm">▶</div>
                        </div>
                        
                        {/* 픽셀 도트들 */}
                        <div className="absolute top-1 left-1 w-1 h-1 bg-[#00ff88]" style={{borderRadius: '1px'}}></div>
                        <div className="absolute top-1 right-1 w-1 h-1 bg-[#00ff88]" style={{borderRadius: '1px'}}></div>
                        <div className="absolute bottom-1 left-1 w-1 h-1 bg-[#00ff88]" style={{borderRadius: '1px'}}></div>
                        <div className="absolute bottom-1 right-1 w-1 h-1 bg-[#00ff88]" style={{borderRadius: '1px'}}></div>
                      </div>
                    ))}
                </div>
                
                {/* 페이지네이션 */}
                {Math.ceil(friends.filter(friendship => 
                  friendship.friend?.nickname?.toLowerCase().includes(friendSearchQuery.toLowerCase())
                ).length / friendsPerPage) > 1 && (
                  <div className="flex justify-center items-center gap-2 mt-4">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="bg-[#1a202c] border border-[#00ff88]/30 text-[#00ff88] px-3 py-1 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed font-mono"
                      style={{borderRadius: '4px'}}
                    >
                      이전
                    </button>
                    <span className="text-gray-400 font-mono text-sm">
                      {currentPage} / {Math.ceil(friends.filter(friendship => 
                        friendship.friend?.nickname?.toLowerCase().includes(friendSearchQuery.toLowerCase())
                      ).length / friendsPerPage)}
                    </span>
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(friends.filter(friendship => 
                        friendship.friend?.nickname?.toLowerCase().includes(friendSearchQuery.toLowerCase())
                      ).length / friendsPerPage)))}
                      disabled={currentPage >= Math.ceil(friends.filter(friendship => 
                        friendship.friend?.nickname?.toLowerCase().includes(friendSearchQuery.toLowerCase())
                      ).length / friendsPerPage)}
                      className="bg-[#1a202c] border border-[#00ff88]/30 text-[#00ff88] px-3 py-1 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed font-mono"
                      style={{borderRadius: '4px'}}
                    >
                      다음
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* 친구 요청 뷰 */}
      {activeView === 'requests' && (
        <div className="space-y-3 sm:space-y-4">
          {/* 친구 요청 컨테이너 */}
          <div className="bg-gradient-to-br from-[#2d3748] to-[#1a202c] rounded-xl p-4 border border-[#ff6b6b]/30 shadow-inner mb-2 sm:mb-3 lg:mb-4 flex-shrink-0 relative">
            {/* 픽셀 도트들 */}
            <div className="absolute top-1 left-1 w-1 h-1 bg-[#ff6b6b]/60" style={{borderRadius: '1px'}}></div>
            <div className="absolute top-1 right-1 w-1 h-1 bg-[#ff6b6b]/60" style={{borderRadius: '1px'}}></div>
            <div className="absolute bottom-1 left-1 w-1 h-1 bg-[#ff6b6b]/60" style={{borderRadius: '1px'}}></div>
            <div className="absolute bottom-1 right-1 w-1 h-1 bg-[#ff6b6b]/60" style={{borderRadius: '1px'}}></div>
            
            {/* 픽셀 헤더 */}
            <div
              className="w-full bg-gradient-to-r from-[#1a202c] to-[#2d3748] border-2 border-[#ff6b6b]/50 hover:border-[#ff6b6b] text-white font-mono py-3 px-4 transition-all duration-200 relative mb-4"
              style={{
                borderRadius: '4px',
                fontFamily: 'monospace',
                imageRendering: 'pixelated'
              }}
            >
              <div className="flex items-center justify-center">
                <h3 className="text-white font-bold text-base font-mono" style={{
                  imageRendering: 'pixelated'
                }}>
                  친구 요청 ({friendRequests.length})
                </h3>
              </div>
              
              {/* 픽셀 도트들 */}
              <div className="absolute top-1 left-1 w-1 h-1 bg-[#ff6b6b]/60" style={{borderRadius: '1px'}}></div>
              <div className="absolute top-1 right-1 w-1 h-1 bg-[#ff6b6b]/60" style={{borderRadius: '1px'}}></div>
              <div className="absolute bottom-1 left-1 w-1 h-1 bg-[#ff6b6b]/60" style={{borderRadius: '1px'}}></div>
              <div className="absolute bottom-1 right-1 w-1 h-1 bg-[#ff6b6b]/60" style={{borderRadius: '1px'}}></div>
            </div>
            
            {friendRequests.length === 0 ? (
              <div className="text-center py-8 text-gray-400 font-mono bg-[#1a202c]/30 rounded-lg border border-[#ff6b6b]/20">
                <p>새로운 친구 요청이 없습니다.</p>
                <p className="text-sm mt-2">친구 찾기로 새로운 친구를 찾아보세요!</p>
              </div>
            ) : (
              <div className="space-y-2">
                {friendRequests.map((request) => (
                  <div key={request.id} className="bg-[#1a202c]/60 border-2 border-[#ff6b6b]/30 p-3 relative" style={{borderRadius: '4px'}}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex-1">
                        <h4 className="text-white font-bold text-sm font-mono mb-1">
                          {request.name || '배달킹'}
                        </h4>
                        <p className="text-gray-300 text-xs font-mono">
                          {request.message || '친구가 되고 싶어요!'}
                        </p>
                      </div>
                      <div className="text-[#ff6b6b] text-sm">▶</div>
                    </div>
                    
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleAcceptFriend(request.id)}
                        className="flex-1 bg-[#00ff88] hover:bg-[#00cc6a] text-black font-bold py-2 px-3 rounded-lg transition-all duration-200 font-mono text-xs"
                        style={{borderRadius: '4px'}}
                      >
                        수락
                      </button>
                      <button
                        onClick={() => handleRejectFriend(request.id)}
                        className="flex-1 bg-[#ff6b6b] hover:bg-[#ff5252] text-white font-bold py-2 px-3 rounded-lg transition-all duration-200 font-mono text-xs"
                        style={{borderRadius: '4px'}}
                      >
                        거절
                      </button>
                    </div>
                    
                    {/* 픽셀 도트들 */}
                    <div className="absolute top-1 left-1 w-1 h-1 bg-[#ff6b6b]" style={{borderRadius: '1px'}}></div>
                    <div className="absolute top-1 right-1 w-1 h-1 bg-[#ff6b6b]" style={{borderRadius: '1px'}}></div>
                    <div className="absolute bottom-1 left-1 w-1 h-1 bg-[#ff6b6b]" style={{borderRadius: '1px'}}></div>
                    <div className="absolute bottom-1 right-1 w-1 h-1 bg-[#ff6b6b]" style={{borderRadius: '1px'}}></div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 친구 찾기 뷰 */}
      {activeView === 'search' && (
        <div className="space-y-3 sm:space-y-4">
          {/* 친구 찾기 컨테이너 */}
          <div className="bg-gradient-to-br from-[#2d3748] to-[#1a202c] rounded-xl p-4 border border-[#ffd93d]/30 shadow-inner mb-2 sm:mb-3 lg:mb-4 flex-shrink-0 relative">
            {/* 픽셀 도트들 */}
            <div className="absolute top-1 left-1 w-1 h-1 bg-[#ffd93d]/60" style={{borderRadius: '1px'}}></div>
            <div className="absolute top-1 right-1 w-1 h-1 bg-[#ffd93d]/60" style={{borderRadius: '1px'}}></div>
            <div className="absolute bottom-1 left-1 w-1 h-1 bg-[#ffd93d]/60" style={{borderRadius: '1px'}}></div>
            <div className="absolute bottom-1 right-1 w-1 h-1 bg-[#ffd93d]/60" style={{borderRadius: '1px'}}></div>
            
            {/* 픽셀 헤더 */}
            <div
              className="w-full bg-gradient-to-r from-[#1a202c] to-[#2d3748] border-2 border-[#ffd93d]/50 hover:border-[#ffd93d] text-white font-mono py-3 px-4 transition-all duration-200 relative mb-4"
              style={{
                borderRadius: '4px',
                fontFamily: 'monospace',
                imageRendering: 'pixelated'
              }}
            >
              <div className="flex items-center justify-center">
                <h3 className="text-white font-bold text-base font-mono" style={{
                  imageRendering: 'pixelated'
                }}>
                  친구 찾기
                </h3>
              </div>
              
              {/* 픽셀 도트들 */}
              <div className="absolute top-1 left-1 w-1 h-1 bg-[#ffd93d]/60" style={{borderRadius: '1px'}}></div>
              <div className="absolute top-1 right-1 w-1 h-1 bg-[#ffd93d]/60" style={{borderRadius: '1px'}}></div>
              <div className="absolute bottom-1 left-1 w-1 h-1 bg-[#ffd93d]/60" style={{borderRadius: '1px'}}></div>
              <div className="absolute bottom-1 right-1 w-1 h-1 bg-[#ffd93d]/60" style={{borderRadius: '1px'}}></div>
            </div>
            
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                placeholder="닉네임으로 친구 찾기..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 bg-[#1a202c] border border-[#ffd93d]/50 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:border-[#ffd93d] focus:outline-none font-mono text-sm"
                style={{borderRadius: '4px'}}
              />
              <button
                onClick={handleSearchFriend}
                className="bg-[#ffd93d] hover:bg-[#e6c534] text-black font-bold py-2 px-4 rounded-lg transition-all duration-200 font-mono text-sm"
                style={{borderRadius: '4px'}}
              >
                검색
              </button>
            </div>
            
            {/* 검색 결과 또는 안내 메시지 */}
            {searchResults.length === 0 ? (
              <div className="text-center py-6 text-gray-400 font-mono bg-[#1a202c]/30 rounded-lg border border-[#ffd93d]/20">
                <p className="text-sm">검색어를 입력하고 검색 버튼을 눌러보세요.</p>
                <p className="text-xs mt-2">닉네임으로 새로운 친구를 찾을 수 있습니다!</p>
              </div>
            ) : (
              <div className="space-y-2">
                {searchResults.map((user) => (
                  <div key={user.id} className="bg-[#1a202c]/60 border-2 border-[#ffd93d]/30 p-3 relative" style={{borderRadius: '4px'}}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex-1">
                        <h4 className="text-white font-bold text-sm font-mono mb-1">
                          {user.nickname}
                        </h4>
                        <p className="text-gray-300 text-xs font-mono">
                          {user.statusMessage}
                        </p>
                      </div>
                      <div className="text-[#ffd93d] text-sm">▶</div>
                    </div>
                    
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleSendFriendRequest(user.id)}
                        className="flex-1 bg-[#ffd93d] hover:bg-[#e6c534] text-black font-bold py-2 px-3 rounded-lg transition-all duration-200 font-mono text-xs"
                        style={{borderRadius: '4px'}}
                      >
                        친구 요청
                      </button>
                      <button
                        onClick={() => handleVisitMinihome(user.minihomeId || user.id)}
                        className="flex-1 bg-[#4a90e2] hover:bg-[#357abd] text-white font-bold py-2 px-3 rounded-lg transition-all duration-200 font-mono text-xs"
                        style={{borderRadius: '4px'}}
                      >
                        미니홈피
                      </button>
                    </div>
                    
                    {/* 픽셀 도트들 */}
                    <div className="absolute top-1 left-1 w-1 h-1 bg-[#ffd93d]" style={{borderRadius: '1px'}}></div>
                    <div className="absolute top-1 right-1 w-1 h-1 bg-[#ffd93d]" style={{borderRadius: '1px'}}></div>
                    <div className="absolute bottom-1 left-1 w-1 h-1 bg-[#ffd93d]" style={{borderRadius: '1px'}}></div>
                    <div className="absolute bottom-1 right-1 w-1 h-1 bg-[#ffd93d]" style={{borderRadius: '1px'}}></div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 하단 여백 */}
      <div className="h-20"></div>
    </div>
  )
}

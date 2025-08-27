'use client'

import { useState, useEffect } from 'react'
import { UserProfile, Friendship } from '@/types/social'

interface FriendsTabProps {
  currentUserId: string
}

export default function FriendsTab({ currentUserId }: FriendsTabProps) {
  const [friends, setFriends] = useState<Friendship[]>([])
  const [friendRequests, setFriendRequests] = useState<Friendship[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [activeView, setActiveView] = useState<'friends' | 'requests' | 'search'>('friends')
  const [showAddFriend, setShowAddFriend] = useState(false)
  const [showFriendDetail, setShowFriendDetail] = useState(false)
  const [selectedFriend, setSelectedFriend] = useState<Friendship | null>(null)
  
  // 친구 목록 검색 및 페이지네이션
  const [friendSearchQuery, setFriendSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const friendsPerPage = 10

  // 친구 목록 가져오기
  useEffect(() => {
    loadFriends()
  }, [])

  const loadFriends = async () => {
    // TODO: 실제 API 호출로 대체
    const mockFriends: Friendship[] = [
      {
        id: '1',
        userId: currentUserId,
        friendId: 'friend1',
        status: 'accepted',
        requestedAt: new Date(),
        acceptedAt: new Date(),
        friend: {
          id: 'friend1',
          email: 'friend1@example.com',
          nickname: '배달왕김철수',
          statusMessage: '오늘도 열심히 배달하자!',
          totalVisitors: 42,
          dailyVisitors: 5,
          lastVisitorReset: new Date(),
          createdAt: new Date()
        }
      },
      {
        id: '2',
        userId: currentUserId,
        friendId: 'friend2',
        status: 'accepted',
        requestedAt: new Date(),
        acceptedAt: new Date(),
        friend: {
          id: 'friend2',
          email: 'friend2@example.com',
          nickname: '쿠팡마스터',
          statusMessage: '쿠팡으로 월 100만원 달성!',
          totalVisitors: 28,
          dailyVisitors: 3,
          lastVisitorReset: new Date(),
          createdAt: new Date()
        }
      },
      {
        id: '3',
        userId: currentUserId,
        friendId: 'friend3',
        status: 'accepted',
        requestedAt: new Date(),
        acceptedAt: new Date(),
        friend: {
          id: 'friend3',
          email: 'friend3@example.com',
          nickname: '배민러버',
          statusMessage: '배민만의 맛집을 찾아서 배달해요',
          totalVisitors: 35,
          dailyVisitors: 4,
          lastVisitorReset: new Date(),
          createdAt: new Date()
        }
      }
    ]
    setFriends(mockFriends)
  }

  // 친구 요청 가져오기
  useEffect(() => {
    loadFriendRequests()
  }, [])

  const loadFriendRequests = async () => {
    // TODO: 실제 API 호출로 대체
    const mockRequests: Friendship[] = [
      {
        id: 'req1',
        userId: 'requester1',
        friendId: currentUserId,
        status: 'pending',
        requestedAt: new Date(),
        friend: {
          id: 'requester1',
          email: 'requester1@example.com',
          nickname: '배달신동박영희',
          statusMessage: '친구가 되어요!',
          totalVisitors: 15,
          dailyVisitors: 2,
          lastVisitorReset: new Date(),
          createdAt: new Date()
        }
      },
      {
        id: 'req2',
        userId: 'requester2',
        friendId: currentUserId,
        status: 'pending',
        requestedAt: new Date(),
        friend: {
          id: 'requester2',
          email: 'requester2@example.com',
          nickname: '자전거배달왕',
          statusMessage: '자전거로 빠른 배달!',
          totalVisitors: 22,
          dailyVisitors: 3,
          lastVisitorReset: new Date(),
          createdAt: new Date()
        }
      }
    ]
    setFriendRequests(mockRequests)
  }

  // 친구 요청 수락
  const handleAcceptFriend = async (requestId: string) => {
    // TODO: Supabase에서 친구 요청 수락
    setFriendRequests(prev => prev.filter(r => r.id !== requestId))
    // 수락된 친구를 친구 목록에 추가
    const acceptedRequest = friendRequests.find(r => r.id === requestId)
    if (acceptedRequest) {
      const newFriendship: Friendship = {
        ...acceptedRequest,
        status: 'accepted',
        acceptedAt: new Date()
      }
      setFriends(prev => [...prev, newFriendship])
    }
  }

  // 친구 요청 거절
  const handleRejectFriend = async (requestId: string) => {
    // TODO: Supabase에서 친구 요청 거절
    setFriendRequests(prev => prev.filter(r => r.id !== requestId))
  }

  // 친구 삭제
  const handleRemoveFriend = async (friendshipId: string) => {
    // TODO: Supabase에서 친구 삭제
    setFriends(prev => prev.filter(f => f.id !== friendshipId))
  }

  // 친구 검색
  const handleSearchFriend = async () => {
    if (!searchQuery.trim()) return
    // TODO: Supabase에서 사용자 검색
    console.log('검색:', searchQuery)
  }

  // 친구 요청 보내기
  const handleSendFriendRequest = async (userId: string) => {
    // TODO: Supabase에서 친구 요청 보내기
    console.log('친구 요청 보내기:', userId)
  }

  // 미니홈피 방문
  const handleVisitMinihome = async (friendId: string) => {
    // 미니홈피 페이지로 이동
    window.location.href = `/minihome/${friendId}`
  }

  // 친구 상세보기 열기
  const handleOpenFriendDetail = (friendship: Friendship) => {
    setSelectedFriend(friendship)
    setShowFriendDetail(true)
  }

  // 친구 상세보기 닫기
  const handleCloseFriendDetail = () => {
    setShowFriendDetail(false)
    setSelectedFriend(null)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f0f23] via-[#1a1a2e] to-[#16213e]">
      {/* 네비게이션 탭 - 하나의 프레임 안에 */}
      <div className="px-4 mb-6">
        <div className="bg-gradient-to-br from-[#1a4a2e]/90 to-[#1a1a2e]/90 backdrop-blur-lg rounded-2xl p-2 sm:p-3 border border-[#00ff88]/20 shadow-2xl">
          <div className="flex gap-2">
            {[
              { id: 'friends', label: '친구목록' },
              { id: 'requests', label: '친구요청' },
              { id: 'search', label: '친구찾기' }
            ].map((view) => (
              <button
                key={view.id}
                onClick={() => setActiveView(view.id as any)}
                className={`flex-1 py-2.5 px-3 font-mono transition-all duration-200 border-2 relative ${
                  activeView === view.id
                    ? 'bg-gradient-to-r from-[#2d3748] to-[#1a202c] shadow-lg'
                    : 'bg-[#1a202c]/60 hover:bg-[#1a202c]/80'
                } ${
                  activeView === view.id
                    ? view.id === 'friends' ? 'border-[#00ff88]/60' :
                      view.id === 'requests' ? 'border-[#ff6b6b]/60' :
                      'border-[#ffd93d]/60'
                    : 'border-gray-600/30'
                }`}
                style={{borderRadius: '4px'}}
              >
                <div className="flex items-center justify-center">
                  <span className={`text-xs sm:text-sm font-bold tracking-wide ${
                    activeView === view.id
                      ? view.id === 'friends' ? 'text-[#00ff88]' :
                        view.id === 'requests' ? 'text-[#ff6b6b]' :
                        'text-[#ffd93d]'
                      : 'text-gray-400'
                  }`} style={{textShadow: activeView === view.id ? 
                    view.id === 'friends' ? '0 0 6px rgba(0, 255, 136, 0.5)' :
                    view.id === 'requests' ? '0 0 6px rgba(255, 107, 107, 0.5)' :
                    '0 0 6px rgba(255, 217, 61, 0.5)' : 'none'
                  }}>
                    {view.label}
                    {view.id === 'requests' && friendRequests.length > 0 && (
                      <span className="ml-1 inline-flex items-center justify-center w-4 h-4 bg-[#ff6b6b] text-white text-xs rounded-full">
                        {friendRequests.length}
                      </span>
                    )}
                  </span>
                </div>
                
                {/* 픽셀 도트들 - 항상 표시 (일간/주간/월간과 동일) */}
                <div className={`absolute top-0.5 left-0.5 w-1 h-1 ${
                  activeView === view.id
                    ? view.id === 'friends' ? 'bg-[#00ff88]' :
                      view.id === 'requests' ? 'bg-[#ff6b6b]' :
                      'bg-[#ffd93d]'
                    : 'bg-gray-500'
                }`} style={{borderRadius: '1px'}}></div>
                <div className={`absolute top-0.5 right-0.5 w-1 h-1 ${
                  activeView === view.id
                    ? view.id === 'friends' ? 'bg-[#00ff88]' :
                      view.id === 'requests' ? 'bg-[#ff6b6b]' :
                      'bg-[#ffd93d]'
                    : 'bg-gray-500'
                }`} style={{borderRadius: '1px'}}></div>
                <div className={`absolute bottom-0.5 left-0.5 w-1 h-1 ${
                  activeView === view.id
                    ? view.id === 'friends' ? 'bg-[#00ff88]' :
                      view.id === 'requests' ? 'bg-[#ff6b6b]' :
                      'bg-[#ffd93d]'
                    : 'bg-gray-500'
                }`} style={{borderRadius: '1px'}}></div>
                <div className={`absolute bottom-0.5 right-0.5 w-1 h-1 ${
                  activeView === view.id
                    ? view.id === 'friends' ? 'bg-[#00ff88]' :
                      view.id === 'requests' ? 'bg-[#ff6b6b]' :
                      'bg-[#ffd93d]'
                    : 'bg-gray-500'
                }`} style={{borderRadius: '1px'}}></div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 친구 목록 뷰 */}
      {activeView === 'friends' && (
        <div className="space-y-3 sm:space-y-4">
          {/* 친구 목록 컨테이너 */}
          <div className="bg-gradient-to-br from-[#1a4a2e]/90 to-[#1a1a2e]/90 backdrop-blur-lg rounded-2xl p-4 border border-[#00ff88]/20 shadow-2xl">
            {/* 제목 - TOP 5 랭킹과 동일한 스타일 */}
            <div className="w-full bg-gradient-to-r from-[#1a202c] to-[#2d3748] border-2 border-[#00ff88]/50 hover:border-[#00ff88] text-white font-mono py-3 px-4 transition-all duration-200 relative mb-4"
                 style={{
                   borderRadius: '4px',
                   fontFamily: 'monospace',
                   imageRendering: 'pixelated'
                 }}>
              <div className="flex items-center justify-center">
                <h3 className="text-white font-bold text-base font-mono" style={{
                  imageRendering: 'pixelated'
                }}>
                  👥 친구 목록 ({friends.length})
                </h3>
              </div>
              
              {/* 픽셀 도트들 - TOP 5 랭킹과 동일 */}
              <div className="absolute top-1 left-1 w-1 h-1 bg-[#00ff88]" style={{borderRadius: '1px'}}></div>
              <div className="absolute top-1 right-1 w-1 h-1 bg-[#00ff88]" style={{borderRadius: '1px'}}></div>
              <div className="absolute bottom-1 left-1 w-1 h-1 bg-[#00ff88]" style={{borderRadius: '1px'}}></div>
              <div className="absolute bottom-1 right-1 w-1 h-1 bg-[#00ff88]" style={{borderRadius: '1px'}}></div>
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
              <div className="text-center py-8 text-gray-400 font-mono">
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
                          <p className="text-white font-bold font-mono text-lg">{friendship.friend?.nickname}</p>
                          <div className="text-[#00ff88] text-lg">▶</div>
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
          <div className="bg-gradient-to-br from-[#1a4a2e]/90 to-[#1a1a2e]/90 backdrop-blur-lg rounded-2xl p-4 border border-[#ff6b6b]/20 shadow-2xl">
            {/* 제목 */}
            <h3 className="text-[#ff6b6b] font-bold text-xl font-mono tracking-wide text-center mb-4" 
                style={{textShadow: '0 0 6px rgba(255, 107, 107, 0.5)'}}>
              📨 친구 요청 ({friendRequests.length})
            </h3>
            
            {friendRequests.length === 0 ? (
              <div className="text-center py-8 text-gray-400 font-mono">
                <p>새로운 친구 요청이 없습니다.</p>
                <p className="text-sm mt-2">친구 찾기로 새로운 친구를 찾아보세요!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {friendRequests.map((request) => (
                  <div key={request.id} className="bg-[#1a202c]/60 border-2 border-[#ff6b6b]/30 p-3 sm:p-4 relative" style={{borderRadius: '4px'}}>
                    <div className="mb-3">
                      <p className="text-white font-bold font-mono text-lg mb-1">{request.friend?.nickname}</p>
                      <p className="text-gray-300 text-sm font-mono mb-1">{request.friend?.statusMessage}</p>
                      <p className="text-gray-400 text-xs font-mono">
                        방문자: {request.friend?.totalVisitors}명
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleAcceptFriend(request.id)}
                        className="flex-1 bg-[#00ff88] hover:bg-[#00cc6a] text-black font-bold py-2 px-3 rounded-lg transition-all duration-200 font-mono"
                        style={{borderRadius: '4px'}}
                      >
                        수락
                      </button>
                      <button
                        onClick={() => handleRejectFriend(request.id)}
                        className="flex-1 bg-[#ff6b6b] hover:bg-[#ff5252] text-white font-bold py-2 px-3 rounded-lg transition-all duration-200 font-mono"
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
          {/* 친구 찾기 컨테이너 - RANKING 탭과 동일한 스타일 */}
          <div className="bg-gradient-to-br from-[#1a4a2e]/90 to-[#1a1a2e]/90 backdrop-blur-lg rounded-2xl p-2 sm:p-3 border border-[#ffd93d]/20 shadow-2xl">
            <div className="relative bg-gradient-to-b from-[#2d3748] to-[#1a202c] rounded-xl p-3 sm:p-4 lg:p-5 border border-[#ffd93d]/30 shadow-inner">
              <h3 className="text-[#ffd93d] font-bold text-lg mb-3 sm:mb-4 flex items-center gap-2 font-mono tracking-wide" 
                  style={{textShadow: '0 0 6px rgba(255, 217, 61, 0.5)'}}>
                🔍 친구 찾기
              </h3>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="닉네임으로 친구 찾기..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 bg-[#1a202c] border border-[#ffd93d]/50 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:border-[#ffd93d] focus:outline-none font-mono"
                  style={{borderRadius: '4px'}}
                />
                <button
                  onClick={handleSearchFriend}
                  className="bg-[#ffd93d] hover:bg-[#e6c534] text-black font-bold py-2 px-4 rounded-lg transition-all duration-200 font-mono"
                  style={{borderRadius: '4px'}}
                >
                  검색
                </button>
              </div>
              
              {/* 검색 결과 또는 안내 메시지 */}
              <div className="text-center py-8 text-gray-400 font-mono mt-4">
                <p>검색어를 입력하고 검색 버튼을 눌러보세요.</p>
                <p className="text-sm mt-2">닉네임으로 새로운 친구를 찾을 수 있습니다!</p>
              </div>
              
              {/* 픽셀 도트들 */}
              <div className="absolute top-1 left-1 w-2 h-2 bg-[#ffd93d]" style={{borderRadius: '1px'}}></div>
              <div className="absolute top-1 right-1 w-2 h-2 bg-[#ffd93d]" style={{borderRadius: '1px'}}></div>
              <div className="absolute bottom-1 left-1 w-2 h-2 bg-[#ffd93d]" style={{borderRadius: '1px'}}></div>
              <div className="absolute bottom-1 right-1 w-2 h-2 bg-[#ffd93d]" style={{borderRadius: '1px'}}></div>
            </div>
          </div>
        </div>
      )}

      {/* 하단 여백 */}
      <div className="h-20"></div>

      {/* 친구 상세보기 모달 */}
      {showFriendDetail && selectedFriend && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-gradient-to-br from-[#1a1a2e] to-[#16213e] rounded-2xl p-6 border border-[#00ff88]/30 shadow-2xl max-w-md w-full mx-4 relative">
            {/* 헤더 */}
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-[#00ff88] font-bold text-xl font-mono">친구 상세보기</h3>
              <button
                onClick={handleCloseFriendDetail}
                className="text-gray-400 hover:text-white transition-colors duration-200"
              >
                <span className="text-2xl">×</span>
              </button>
            </div>

            {/* 친구 정보 */}
            <div className="space-y-4 mb-6">
              <div className="text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-[#00ff88] to-[#00cc6a] rounded-full flex items-center justify-center text-black text-3xl font-bold font-mono mx-auto mb-3">
                  {selectedFriend.friend?.nickname?.charAt(0)}
                </div>
                <h4 className="text-white font-bold text-xl font-mono mb-2">
                  {selectedFriend.friend?.nickname}
                </h4>
                <p className="text-gray-300 text-sm font-mono mb-3">
                  {selectedFriend.friend?.statusMessage}
                </p>
                <div className="flex justify-center gap-6 text-sm text-gray-400 font-mono">
                  <span>방문자: {selectedFriend.friend?.totalVisitors}명</span>
                  <span>오늘: {selectedFriend.friend?.dailyVisitors}명</span>
                </div>
              </div>
            </div>

            {/* 액션 버튼들 */}
            <div className="space-y-3">
              <button
                onClick={() => {
                  handleVisitMinihome(selectedFriend.friendId)
                  handleCloseFriendDetail()
                }}
                className="w-full bg-[#00d4ff] hover:bg-[#00b8e6] text-black font-bold py-3 px-4 rounded-lg transition-all duration-200 font-mono"
                style={{borderRadius: '4px'}}
              >
                🏠 미니홈피 방문
              </button>
              <button
                onClick={() => {
                  handleRemoveFriend(selectedFriend.id)
                  handleCloseFriendDetail()
                }}
                className="w-full bg-[#ff6b6b] hover:bg-[#ff5252] text-white font-bold py-3 px-4 rounded-lg transition-all duration-200 font-mono"
                style={{borderRadius: '4px'}}
              >
                ✕ 친구 삭제
              </button>
            </div>

            {/* 픽셀 도트들 */}
            <div className="absolute top-2 left-2 w-2 h-2 bg-[#00ff88]" style={{borderRadius: '1px'}}></div>
            <div className="absolute top-2 right-2 w-2 h-2 bg-[#00ff88]" style={{borderRadius: '1px'}}></div>
            <div className="absolute bottom-2 left-2 w-2 h-2 bg-[#00ff88]" style={{borderRadius: '1px'}}></div>
            <div className="absolute bottom-2 right-2 w-2 h-2 bg-[#00ff88]" style={{borderRadius: '1px'}}></div>
          </div>
        </div>
      )}
    </div>
  )
}

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { UserProfile, Friendship } from '@/types/social'

interface FriendsTabProps {
  currentUserId: string
  setShowFriendDetail: (show: boolean) => void
  setSelectedFriend: (friend: any) => void
}

export default function FriendsTab({ currentUserId, setShowFriendDetail, setSelectedFriend }: FriendsTabProps) {
  const router = useRouter()
  const [friends, setFriends] = useState<Friendship[]>([])
  const [friendRequests, setFriendRequests] = useState<Friendship[]>([])
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
          minihomeId: 'user_friend1',
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
          minihomeId: 'user_friend2',
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
          minihomeId: 'user_friend3',
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
          minihomeId: 'user_requester1',
          email: 'requester1@example.com',
          nickname: '새로운친구',
          statusMessage: '안녕하세요! 친구가 되고 싶어요',
          totalVisitors: 15,
          dailyVisitors: 2,
          lastVisitorReset: new Date(),
          createdAt: new Date()
        }
      }
    ]
    setFriendRequests(mockRequests)
  }

  // 친구 검색
  const handleSearchFriend = () => {
    // TODO: 실제 친구 검색 API 호출
    console.log('친구 검색:', searchQuery)
    
    if (searchQuery.trim()) {
      // 목업 검색 결과
      const mockResults = [
        {
          id: 'search1',
          nickname: '배달맨김영희',
          statusMessage: '오늘도 열심히 일하자!',
          totalVisitors: 25,
          dailyVisitors: 3
        },
        {
          id: 'search2',
          nickname: '쿠팡러버',
          statusMessage: '쿠팡으로 월 80만원 달성!',
          totalVisitors: 18,
          dailyVisitors: 2
        }
      ]
      setSearchResults(mockResults)
    } else {
      setSearchResults([])
    }
  }

  // 친구 상세보기 열기
  const handleOpenFriendDetail = (friendship: Friendship) => {
    setSelectedFriend(friendship)
    setShowFriendDetail(true)
  }



  // 친구 요청 수락
  const handleAcceptFriend = (requestId: string) => {
    // TODO: 실제 친구 요청 수락 API 호출
    setFriendRequests(prev => prev.filter(req => req.id !== requestId))
    // 친구 목록에 추가
    const acceptedRequest = friendRequests.find(req => req.id === requestId)
    if (acceptedRequest) {
      setFriends(prev => [...prev, { ...acceptedRequest, status: 'accepted', acceptedAt: new Date() }])
    }
  }

  // 친구 요청 거절
  const handleRejectFriend = (requestId: string) => {
    // TODO: 실제 친구 요청 거절 API 호출
    setFriendRequests(prev => prev.filter(req => req.id !== requestId))
  }

  // 친구 요청 보내기
  const handleSendFriendRequest = (userId: string) => {
    // TODO: 실제 친구 요청 API 호출
    console.log('친구 요청 보내기:', userId)
    // 검색 결과에서 제거
    setSearchResults(prev => prev.filter(user => user.id !== userId))
  }

  // 미니홈피 방문
  const handleVisitMinihome = (minihomeId: string) => {
    console.log('미니홈피 방문 시도:', minihomeId)
    try {
      // 미니홈피 페이지로 이동
      router.push(`/minihome/${minihomeId}`)
      console.log('라우터 푸시 완료')
    } catch (error) {
      console.error('라우터 푸시 에러:', error)
      // 폴백: window.location.href 사용
      console.log('폴백 방법 사용: window.location.href')
      window.location.href = `/minihome/${minihomeId}`
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
                          {request.friend?.nickname}
                        </h4>
                        <p className="text-gray-300 text-xs font-mono">
                          {request.friend?.statusMessage}
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

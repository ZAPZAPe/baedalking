import React, { useState } from 'react'
import PixelModal from '@/components/ui/PixelModal'
import PixelButton from '@/components/ui/PixelButton'
import PixelCard from '@/components/ui/PixelCard'

interface Friend {
  id: string
  nickname: string
  region: string
  income: number
  count: number
  platforms: string[]
  status: 'online' | 'offline'
  lastSeen?: string
}

interface FriendsModalProps {
  isOpen: boolean
  onClose: () => void
  currentUserId?: string
}

export default function FriendsModal({
  isOpen,
  onClose,
  currentUserId = ''
}: FriendsModalProps) {
  const [activeTab, setActiveTab] = useState<'friends' | 'search'>('friends')
  const [friends, setFriends] = useState<Friend[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // API에서 친구 목록 가져오기
  React.useEffect(() => {
    if (isOpen && currentUserId) {
      loadFriends()
    }
  }, [isOpen, currentUserId])

  const loadFriends = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/friends?userId=${currentUserId}`)
      const data = await response.json()
      
      if (response.ok && data.friends) {
        // API 응답을 Friend 형식으로 변환
        const formattedFriends = data.friends.map((friend: any) => ({
          id: friend.id,
          nickname: friend.nickname || '배달킹',
          region: friend.region || '서울',
          income: friend.income || 0,
          count: friend.count || 0,
          platforms: friend.platforms || [],
          status: 'offline' as const,
          lastSeen: '알 수 없음'
        }))
        setFriends(formattedFriends)
      } else {
        setFriends([])
      }
    } catch (error) {
      console.error('친구 목록 로딩 오류:', error)
      setFriends([])
    } finally {
      setIsLoading(false)
    }
  }

  const onlineFriends = friends.filter(f => f.status === 'online')
  const offlineFriends = friends.filter(f => f.status === 'offline')

  const handleShowUserDetail = (friend: Friend) => {
    console.log('Show user detail:', friend)
  }

  const handleAddFriend = () => {
    console.log('Add friend clicked')
  }

  const handleRemoveFriend = (friendId: string) => {
    console.log('Remove friend:', friendId)
  }

  if (!isOpen) return null

  return (
    <PixelModal
      isOpen={isOpen}
      onClose={onClose}
      title="FRIENDS"
      maxWidth="lg"
    >
      {/* 탭 메뉴 */}
      <div className="flex gap-2 mb-4">
        <PixelButton
          variant={activeTab === 'friends' ? 'primary' : 'secondary'}
          onClick={() => setActiveTab('friends')}
          className="flex-1"
        >
          친구 목록
        </PixelButton>
        <PixelButton
          variant={activeTab === 'search' ? 'primary' : 'secondary'}
          onClick={() => setActiveTab('search')}
          className="flex-1"
        >
          친구 추가
        </PixelButton>
      </div>

      {activeTab === 'friends' ? (
        <>
          {/* 친구 통계 */}
          <PixelCard title="FRIEND STATS" variant="primary">
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-[#1a202c]/50 p-3 rounded-lg text-center border"
                   style={{borderColor: '#ffd93d30', borderRadius: '4px'}}>
                <div className="text-white text-xs font-mono font-bold mb-1">총 친구</div>
                <div className="text-lg font-bold font-mono text-[#ffd93d]">
                  {friends.length}명
                </div>
              </div>
              
              <div className="bg-[#1a202c]/50 p-3 rounded-lg text-center border"
                   style={{borderColor: '#00ff8830', borderRadius: '4px'}}>
                <div className="text-white text-xs font-mono font-bold mb-1">온라인</div>
                <div className="text-lg font-bold font-mono text-[#00ff88]">
                  {onlineFriends.length}명
                </div>
              </div>
              
              <div className="bg-[#1a202c]/50 p-3 rounded-lg text-center border"
                   style={{borderColor: '#9c88ff30', borderRadius: '4px'}}>
                <div className="text-white text-xs font-mono font-bold mb-1">오프라인</div>
                <div className="text-lg font-bold font-mono text-[#9c88ff]">
                  {offlineFriends.length}명
                </div>
              </div>
            </div>
          </PixelCard>

          {/* 온라인 친구들 */}
          {onlineFriends.length > 0 && (
            <PixelCard title="ONLINE FRIENDS" variant="success">
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {onlineFriends.map((friend) => (
                  <div 
                    key={friend.id}
                    className="bg-[#1a202c]/50 p-3 rounded-lg border cursor-pointer hover:bg-[#1a202c]/70 transition-all"
                    style={{borderColor: '#00ff8830', borderRadius: '4px'}}
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        {/* 온라인 상태 */}
                        <div className="w-3 h-3 bg-[#00ff88] rounded-full animate-pulse"></div>
                        
                        {/* 친구 정보 */}
                        <div>
                          <div className="text-white font-bold text-sm font-mono">
                            {friend.nickname}
                          </div>
                          <div className="text-gray-400 text-xs font-mono">
                            {friend.region}
                          </div>
                        </div>
                      </div>
                      
                      {/* 버튼들 */}
                      <div className="flex gap-2">
                        <PixelButton
                          size="sm"
                          variant="secondary"
                          onClick={() => handleShowUserDetail(friend)}
                        >
                          보기
                        </PixelButton>
                        <PixelButton
                          size="sm"
                          variant="danger"
                          onClick={() => handleRemoveFriend(friend.id)}
                        >
                          삭제
                        </PixelButton>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </PixelCard>
          )}

          {/* 오프라인 친구들 */}
          {offlineFriends.length > 0 && (
            <PixelCard title="OFFLINE FRIENDS" variant="info">
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {offlineFriends.map((friend) => (
                  <div 
                    key={friend.id}
                    className="bg-[#1a202c]/50 p-3 rounded-lg border cursor-pointer hover:bg-[#1a202c]/70 transition-all"
                    style={{borderColor: '#9c88ff30', borderRadius: '4px'}}
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        {/* 오프라인 상태 */}
                        <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
                        
                        {/* 친구 정보 */}
                        <div>
                          <div className="text-white font-bold text-sm font-mono">
                            {friend.nickname}
                          </div>
                          <div className="text-gray-400 text-xs font-mono">
                            {friend.region} • {friend.lastSeen ? `마지막 접속: ${friend.lastSeen}` : '오프라인'}
                          </div>
                        </div>
                      </div>
                      
                      {/* 버튼들 */}
                      <div className="flex gap-2">
                        <PixelButton
                          size="sm"
                          variant="secondary"
                          onClick={() => handleShowUserDetail(friend)}
                        >
                          보기
                        </PixelButton>
                        <PixelButton
                          size="sm"
                          variant="danger"
                          onClick={() => handleRemoveFriend(friend.id)}
                        >
                          삭제
                        </PixelButton>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </PixelCard>
          )}

          {/* 친구가 없을 때 */}
          {friends.length === 0 && !isLoading && (
            <PixelCard variant="secondary">
              <div className="text-center py-8">
                <div className="text-5xl mb-4">😢</div>
                <p className="text-white font-bold text-base font-mono mb-2">
                  아직 친구가 없습니다
                </p>
                <p className="text-gray-400 text-sm font-mono mb-4">
                  친구 찾기 탭에서 새로운 친구를 찾아보세요!
                </p>
                <PixelButton
                  variant="primary"
                  size="md"
                  onClick={() => setActiveTab('search')}
                >
                  친구 찾기
                </PixelButton>
              </div>
            </PixelCard>
          )}

          {/* 로딩 중 */}
          {isLoading && (
            <PixelCard variant="secondary">
              <div className="text-center py-8">
                <div className="text-4xl mb-4 animate-spin">⚙️</div>
                <p className="text-gray-400 text-sm font-mono">
                  친구 목록을 불러오는 중...
                </p>
              </div>
            </PixelCard>
          )}
        </>
      ) : (
        /* 친구 검색/추가 탭 */
        <PixelCard title="ADD FRIEND" variant="primary">
          <div className="text-center py-8">
            <div className="text-gray-400 text-lg mb-4">🔍</div>
            <div className="text-gray-300 text-sm font-mono mb-4">
              닉네임 또는 ID로 친구를 검색하고<br/>
              친구 요청을 보낼 수 있습니다.
            </div>
            <PixelButton
              variant="primary"
              onClick={handleAddFriend}
            >
              친구 검색하기
            </PixelButton>
          </div>
        </PixelCard>
      )}

      {/* 닫기 버튼 */}
      <PixelButton
        variant="primary"
        fullWidth
        onClick={onClose}
      >
        CLOSE
      </PixelButton>
    </PixelModal>
  )
}
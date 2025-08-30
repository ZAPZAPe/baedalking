'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { MinihomeData } from '@/types/social'
import UserProfileModal from '@/components/modals/UserProfileModal'
import { useAppState } from '@/hooks/useAppState'

export default function MinihomePage() {
  const params = useParams()
  const router = useRouter()
  const minihomeId = params.userId as string // URL 파라미터는 minihomeId
  
  // useAppState에서 garageIntro 가져오기
  const { garageIntro } = useAppState()
  
  const [minihomeData, setMinihomeData] = useState<MinihomeData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [newGuestbookEntry, setNewGuestbookEntry] = useState('')
  const [isPrivateEntry, setIsPrivateEntry] = useState(false)
  const [selectedUser, setSelectedUser] = useState<any>(null)
  
  // 페이지네이션 상태
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(5)

  const [currentVisitor, setCurrentVisitor] = useState({
    id: 'current-user',
    nickname: '방문자',
    email: 'visitor@example.com',
    statusMessage: '',
    totalVisitors: 0,
    dailyVisitors: 0,
    lastVisitorReset: new Date(),
    createdAt: new Date()
  })

  useEffect(() => {
    loadMinihomeData()
  }, [minihomeId])

  const loadMinihomeData = async () => {
    setIsLoading(true)
    try {
      // TODO: Supabase에서 미니홈피 데이터 가져오기
      const mockData: MinihomeData = {
        profile: {
          id: minihomeId,
          minihomeId: minihomeId,
          email: `${minihomeId}@example.com`,
          nickname: `사용자_${minihomeId}`,
          statusMessage: '안녕하세요! 제 미니홈피에 오신 것을 환영합니다!',
          totalVisitors: 42,
          dailyVisitors: 5,
          lastVisitorReset: new Date(),
          createdAt: new Date()
        },
        settings: {
          id: `settings-${minihomeId}`,
          userId: minihomeId,
          background: 'background.png',
          characterEmotion: 'happy',
          vehicle: 'scooter',
          garageIntro: '열심히 달리는 배달킹입니다! 🛵💨',
          isPublic: true,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        recentVisitors: [
          {
            id: 'visitor1',
            minihomeUserId: minihomeId,
            visitorId: 'visitor1',
            visitedAt: new Date()
          }
        ],
        guestbookEntries: [
          {
            id: 'gb1',
            minihomeUserId: minihomeId,
            writerId: 'visitor1',
            content: '미니홈피 너무 예뻐요!',
            isPrivate: false,
            createdAt: new Date(),
            updatedAt: new Date(),
            writer: {
              id: 'visitor1',
              minihomeId: 'visitor1',
              email: 'visitor1@example.com',
              nickname: '방문자1',
              statusMessage: '',
              totalVisitors: 0,
              dailyVisitors: 0,
              lastVisitorReset: new Date(),
              createdAt: new Date()
            }
          },
          {
            id: 'gb2',
            minihomeUserId: minihomeId,
            writerId: 'visitor2',
            content: '정말 멋진 미니홈피네요! 다음에 또 방문할게요~',
            isPrivate: false,
            createdAt: new Date(Date.now() - 86400000), // 1일 전
            updatedAt: new Date(Date.now() - 86400000),
            writer: {
              id: 'visitor2',
              minihomeId: 'visitor2',
              email: 'visitor2@example.com',
              nickname: '친구2',
              statusMessage: '',
              totalVisitors: 0,
              dailyVisitors: 0,
              lastVisitorReset: new Date(),
              createdAt: new Date()
            }
          },
          {
            id: 'gb3',
            minihomeUserId: minihomeId,
            writerId: 'visitor3',
            content: '와! 정말 예쁘게 꾸며져 있네요. 캐릭터도 귀엽고요!',
            isPrivate: false,
            createdAt: new Date(Date.now() - 172800000), // 2일 전
            updatedAt: new Date(Date.now() - 172800000),
            writer: {
              id: 'visitor3',
              minihomeId: 'visitor3',
              email: 'visitor3@example.com',
              nickname: '친구3',
              statusMessage: '',
              totalVisitors: 0,
              dailyVisitors: 0,
              lastVisitorReset: new Date(),
              createdAt: new Date()
            }
          },
          {
            id: 'gb4',
            minihomeUserId: minihomeId,
            writerId: 'visitor4',
            content: '스쿠터 타고 다니는 모습이 너무 멋져요! 안전운전하세요~',
            isPrivate: false,
            createdAt: new Date(Date.now() - 259200000), // 3일 전
            updatedAt: new Date(Date.now() - 259200000),
            writer: {
              id: 'visitor4',
              minihomeId: 'visitor4',
              email: 'visitor4@example.com',
              nickname: '친구4',
              statusMessage: '',
              totalVisitors: 0,
              dailyVisitors: 0,
              lastVisitorReset: new Date(),
              createdAt: new Date()
            }
          },
          {
            id: 'gb5',
            minihomeUserId: minihomeId,
            writerId: 'visitor5',
            content: '방명록 남기고 갑니다! 정말 예쁜 미니홈피네요 💕',
            isPrivate: false,
            createdAt: new Date(Date.now() - 345600000), // 4일 전
            updatedAt: new Date(Date.now() - 345600000),
            writer: {
              id: 'visitor5',
              minihomeId: 'visitor5',
              email: 'visitor5@example.com',
              nickname: '친구5',
              statusMessage: '',
              totalVisitors: 0,
              dailyVisitors: 0,
              lastVisitorReset: new Date(),
              createdAt: new Date()
            }
          },
          {
            id: 'gb6',
            minihomeUserId: minihomeId,
            writerId: 'visitor6',
            content: '오늘도 방문했어요! 항상 새로운 모습으로 업데이트되는 미니홈피가 좋네요.',
            isPrivate: false,
            createdAt: new Date(Date.now() - 432000000), // 5일 전
            updatedAt: new Date(Date.now() - 432000000),
            writer: {
              id: 'visitor6',
              minihomeId: 'visitor6',
              email: 'visitor6@example.com',
              nickname: '친구6',
              statusMessage: '',
              totalVisitors: 0,
              dailyVisitors: 0,
              lastVisitorReset: new Date(),
              createdAt: new Date()
            }
          }
        ],
        isFriend: false,
        isOwner: false
      }
      
      setMinihomeData(mockData)
    } catch (error) {
      console.error('미니홈피 데이터 로드 실패:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleWriteGuestbook = async () => {
    if (!minihomeData || !newGuestbookEntry.trim()) return
    
    try {
      // TODO: Supabase에 방명록 작성
      console.log('방명록 작성:', newGuestbookEntry)
      
      // 임시로 로컬 상태에 추가
      const newEntry = {
        id: `gb-${Date.now()}`,
        minihomeUserId: minihomeId,
        writerId: currentVisitor.id,
        content: newGuestbookEntry,
        isPrivate: isPrivateEntry,
        createdAt: new Date(),
        updatedAt: new Date(),
        writer: {
          id: currentVisitor.id,
          minihomeId: currentVisitor.id,
          email: currentVisitor.email,
          nickname: currentVisitor.nickname,
          statusMessage: '',
          totalVisitors: 0,
          dailyVisitors: 0,
          lastVisitorReset: new Date(),
          createdAt: new Date()
        }
      }
      
      setMinihomeData(prev => prev ? {
        ...prev,
        guestbookEntries: [newEntry, ...prev.guestbookEntries]
      } : null)
      
      setNewGuestbookEntry('')
      setIsPrivateEntry(false)
    } catch (error) {
      console.error('방명록 작성 실패:', error)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0f0f23] via-[#1a1a2e] to-[#16213e] flex items-center justify-center relative overflow-hidden">
        {/* 애니메이션 배경 */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-[#00d4ff]/20 rounded-full blur-xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-24 h-24 bg-[#9c88ff]/20 rounded-full blur-xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 w-16 h-16 bg-[#00ff88]/20 rounded-full blur-xl animate-pulse delay-500"></div>
        </div>
        
        <div className="text-center text-white relative z-10">
          <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-[#00d4ff] to-[#9c88ff] rounded-full flex items-center justify-center animate-bounce">
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
              <div className="w-8 h-8 bg-[#00d4ff] rounded-full"></div>
            </div>
          </div>
          <div className="text-2xl font-bold font-mono mb-2">차고 로딩 중...</div>
          <div className="text-gray-400 font-mono">잠시만 기다려주세요</div>
        </div>
      </div>
    )
  }

  if (!minihomeData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0f0f23] via-[#1a1a2e] to-[#16213e] flex items-center justify-center">
        <div className="text-center text-white">
          <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-[#ff6b6b] to-[#ff4757] rounded-full flex items-center justify-center">
            <div className="text-3xl">❌</div>
          </div>
          <div className="text-2xl font-bold font-mono mb-2">차고를 찾을 수 없습니다</div>
          <div className="text-gray-400 font-mono">존재하지 않는 사용자입니다</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f0f23] via-[#1a1a2e] to-[#16213e] relative overflow-hidden">
      {/* 애니메이션 배경 요소들 */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="absolute top-20 left-10 w-2 h-2 bg-[#00d4ff]/30 rounded-full animate-ping"></div>
          <div className="absolute top-40 right-20 w-1 h-1 bg-[#9c88ff]/40 rounded-full animate-pulse"></div>
          <div className="absolute top-60 left-1/4 w-1.5 h-1.5 bg-[#00ff88]/30 rounded-full animate-bounce"></div>
          <div className="absolute top-80 right-1/3 w-1 h-1 bg-[#ff6b6b]/40 rounded-full animate-ping delay-1000"></div>
        </div>
      </div>

      {/* 메인 컨텐츠 */}
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* 헤더 - 간소화된 버전 */}
        <div className="bg-gradient-to-b from-black/80 via-black/40 to-transparent p-2 sm:p-3">
          <div className="max-w-6xl mx-auto">

          </div>
        </div>



        {/* 메인 컨텐츠 */}
        <div className="flex-1 relative bg-gradient-to-b from-[#0f0f23] to-[#1a1a2e] scroll-container">
          <div className="p-2 sm:p-3 lg:p-4 pb-24">
            <div className="max-w-md mx-auto w-full space-y-2 sm:space-y-3 lg:space-y-4">
              {/* 메인 헤더 - "닉네임의 차고" */}
              <div className="bg-gradient-to-r from-[#1a202c] to-[#2d3748] p-3 sm:p-4 border-2 border-[#9c88ff] relative text-center" style={{borderRadius: '4px'}}>
                <h1 className="text-white font-bold text-lg sm:text-xl font-mono mb-3" style={{
                  textShadow: '2px 0 0 #000, -2px 0 0 #000, 0 2px 0 #000, 0 -2px 0 #000, 1px 1px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000',
                  imageRendering: 'pixelated'
                }}>
                  {minihomeData.profile.nickname}의 차고
                </h1>
                
                {/* Total & Today 방문자 수 */}
                <div className="bg-[#1a202c]/60 border border-[#9c88ff]/50 rounded-lg p-2 text-center">
                  <div className="text-white font-bold font-mono text-sm sm:text-base">
                    TOTAL {minihomeData.profile.totalVisitors} TODAY {minihomeData.profile.dailyVisitors}
                  </div>
                </div>
                
                {/* 픽셀 도트들 */}
                <div className="absolute top-1 left-1 w-1 h-1 bg-[#9c88ff]" style={{borderRadius: '1px'}}></div>
                <div className="absolute top-1 right-1 w-1 h-1 bg-[#9c88ff]" style={{borderRadius: '1px'}}></div>
                <div className="absolute bottom-1 left-1 w-1 h-1 bg-[#9c88ff]" style={{borderRadius: '1px'}}></div>
                <div className="absolute bottom-1 right-1 w-1 h-1 bg-[#9c88ff]" style={{borderRadius: '1px'}}></div>
              </div>
              
              {/* 꾸미기 공간 카드 - 홈 메인과 동일한 디자인 */}
              <div className="bg-gradient-to-br from-[#1a4a2e]/90 to-[#1a1a2e]/90 backdrop-blur-lg rounded-2xl p-2 sm:p-3 lg:p-4 border border-[#00ff88]/20 shadow-2xl">
                {/* 배경, 캐릭터, 스쿠터 꾸미기 공간 - 홈 메인과 동일한 비율 */}
                <div className="relative bg-gradient-to-b from-[#2d3748] to-[#1a202c] rounded-xl p-3 sm:p-4 lg:p-5 mb-2 sm:mb-3 lg:mb-4 min-h-[330px] sm:min-h-[370px] lg:min-h-[420px] border border-[#00ff88]/30 shadow-inner">
                  {/* 배경 이미지 */}
                  <div className="absolute inset-0 w-full h-full z-10">
                    <div className="w-full h-full bg-gradient-to-b from-[#2d3748] to-[#1a202c] rounded-lg opacity-85"></div>
                  </div>
                  
                  {/* 스쿠터 - 홈 메인과 동일한 위치와 크기 */}
                  <div className="absolute bottom-[0%] left-[-5%] sm:left-[8%] lg:left-[10%] w-[240px] sm:w-[280px] lg:w-[320px] h-[180px] sm:h-[210px] lg:h-[240px] z-20 animate-bounce">
                    <img 
                      src="/assets/vehicle/scooter.png" 
                      alt="스쿠터" 
                      className="w-full h-full object-contain drop-shadow-lg"
                      style={{ imageRendering: 'pixelated' }}
                    />
                  </div>
                  
                  {/* 캐릭터 - 홈 메인과 동일한 위치와 크기 */}
                  <div className="absolute bottom-[5%] right-[5%] sm:right-[12%] lg:right-[15%] w-[160px] sm:w-[180px] lg:w-[200px] h-[160px] sm:h-[180px] lg:h-[200px] z-30 animate-pulse">
                    <img 
                      src={`/assets/character/character-${minihomeData.settings.characterEmotion}.png`}
                      alt="캐릭터"
                      className="w-full h-full object-contain drop-shadow-lg"
                      style={{ imageRendering: 'pixelated' }}
                    />
                    
                    {/* 말풍선 - 홈화면과 동일한 도트형식 스타일 */}
                    <div className="absolute -top-8 sm:-top-9 lg:-top-10 left-1/2 -translate-x-1/2 bg-white border-2 border-gray-800 min-w-[50px] sm:min-w-[55px] lg:min-w-[60px] max-w-[100px] sm:max-w-[110px] lg:max-w-[120px] z-40 pointer-events-none" 
                         style={{
                           borderRadius: '0px',
                           imageRendering: 'pixelated',
                           boxShadow: '4px 4px 0px rgba(0,0,0,0.3)'
                         }}>
                      <div className="absolute bottom-[-6px] left-1/2 -translate-x-1/2 w-3 h-3 bg-white border-r-2 border-b-2 border-gray-800 rotate-45"></div>
                      <p className="text-[10px] text-gray-800 font-bold text-center leading-tight break-words overflow-hidden px-2 py-1.5" 
                         style={{
                           display: '-webkit-box',
                           WebkitLineClamp: 2,
                           WebkitBoxOrient: 'vertical',
                           wordBreak: 'keep-all',
                           fontFamily: 'monospace'
                         }}>
                        {minihomeData.settings.speechText || '안녕하세요!'}
                      </p>
                    </div>
                  </div>



                  {/* 꾸미기 공간 테두리 효과 */}
                  <div className="absolute inset-0 rounded-xl border-2 border-[#00ff88]/20 pointer-events-none"></div>
                  
                  {/* 코너 장식 */}
                  <div className="absolute top-2 left-2 w-4 h-4 border-l-2 border-t-2 border-[#00ff88]/60 rounded-tl-lg"></div>
                  <div className="absolute top-2 right-2 w-4 h-4 border-r-2 border-t-2 border-[#00ff88]/60 rounded-tr-lg"></div>
                  <div className="absolute bottom-2 left-2 w-4 h-4 border-l-2 border-b-2 border-[#00ff88]/60 rounded-bl-lg"></div>
                  <div className="absolute bottom-2 right-2 w-4 h-4 border-l-2 border-b-2 border-[#00ff88]/60 rounded-br-lg"></div>
                </div>

                {/* GARAGE INTRO - 홈 메인과 동일한 스타일 */}
                <div className="bg-black/30 backdrop-blur-sm rounded-lg p-3 border border-[#00ff88]/20">
                  <div className="text-center">
                    <p className="text-white text-sm font-medium leading-relaxed">
                      {garageIntro || 'GARAGE INTRO가 설정되지 않았습니다...'}
                    </p>
                  </div>
                </div>
              </div>

              {/* 카카오 광고 */}
              <div className="bg-gradient-to-br from-[#2d2d2d]/90 to-[#1a1a1a]/90 backdrop-blur-lg rounded-xl sm:rounded-2xl p-3 border border-gray-600/20 shadow-2xl text-center flex-shrink-0 min-h-[100px] flex items-center justify-center">
                <div className="w-full">
                  <ins 
                    className="kakao_ad_area" 
                    style={{display: 'none'}}
                    data-ad-unit="DAN-xsiNefKQFaudq5Uw"
                    data-ad-width="320"
                    data-ad-height="100"
                  ></ins>
                  <script 
                    type="text/javascript" 
                    src="//t1.daumcdn.net/kas/static/ba.min.js" 
                    async
                  ></script>
                </div>
              </div>

              {/* 방명록 작성 컨테이너 */}
              <div className="bg-gradient-to-br from-[#2d3748]/90 to-[#1a202c]/90 backdrop-blur-lg rounded-2xl p-4 sm:p-6 border border-[#9c88ff]/30 mb-4">
                {/* 헤더 스타일 제목 */}
                <div className="bg-gradient-to-r from-[#1a202c] to-[#2d3748] p-3 mb-4 border-2 border-[#9c88ff] relative text-center" style={{borderRadius: '4px'}}>
                  <h3 className="text-white font-bold text-base font-mono" style={{
                    imageRendering: 'pixelated'
                  }}>
                    방명록 작성
                  </h3>
                  
                  {/* 픽셀 도트들 */}
                  <div className="absolute top-1 left-1 w-1 h-1 bg-[#9c88ff]" style={{borderRadius: '1px'}}></div>
                  <div className="absolute top-1 right-1 w-1 h-1 bg-[#9c88ff]" style={{borderRadius: '1px'}}></div>
                  <div className="absolute bottom-1 left-1 w-1 h-1 bg-[#9c88ff]" style={{borderRadius: '1px'}}></div>
                  <div className="absolute bottom-1 right-1 w-1 h-1 bg-[#9c88ff]" style={{borderRadius: '1px'}}></div>
                </div>
                
                <div className="bg-[#1a202c]/60 border-2 border-[#9c88ff]/50 rounded-2xl p-3 sm:p-4 mb-3 sm:mb-4">
                  <textarea
                    placeholder="방명록을 남겨주세요..."
                    value={newGuestbookEntry}
                    onChange={(e) => setNewGuestbookEntry(e.target.value)}
                    className="w-full bg-transparent border-none text-white placeholder-gray-400 focus:outline-none resize-none font-mono text-sm sm:text-base"
                    rows={3}
                  />
                  
                  {/* 비공개 설정 */}
                  <div className="flex items-center gap-2 mt-3">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isPrivateEntry}
                        onChange={(e) => setIsPrivateEntry(e.target.checked)}
                        className="w-4 h-4 text-[#9c88ff] bg-[#1a202c] border-2 border-[#9c88ff]/50 rounded focus:ring-[#9c88ff] focus:ring-2 focus:ring-offset-0"
                      />
                      <span className="text-white text-sm font-mono">비공개</span>
                    </label>
                    <span className="text-gray-400 text-xs font-mono">(작성자와 미니홈피 주인만 볼 수 있습니다)</span>
                  </div>
                </div>
                <button
                  onClick={handleWriteGuestbook}
                  disabled={!newGuestbookEntry.trim()}
                  className="w-full bg-gradient-to-r from-[#9c88ff]/20 to-[#7c6bff]/20 border-2 border-[#9c88ff]/50 hover:border-[#9c88ff] text-[#9c88ff] hover:text-white font-bold py-3 sm:py-4 transition-all duration-300 hover:scale-105 hover:shadow-lg relative font-mono tracking-wide disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    borderRadius: '6px',
                    textShadow: '0 0 6px rgba(156, 136, 255, 0.5)',
                    boxShadow: '0 0 15px rgba(156, 136, 255, 0.2)'
                  }}
                >
                  <div className="flex items-center justify-center gap-1.5 sm:gap-2">
                    <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-[#9c88ff] border border-white" style={{borderRadius: '1px'}}></div>
                    <span className="text-sm sm:text-base font-mono tracking-wider">방명록 작성</span>
                    <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-[#9c88ff] border border-white" style={{borderRadius: '1px'}}></div>
                  </div>
                  
                  {/* 버튼 모서리 픽셀 도트 */}
                  <div className="absolute top-1 left-1 w-1 h-1 bg-[#9c88ff]" style={{borderRadius: '1px'}}></div>
                  <div className="absolute top-1 right-1 w-1 h-1 bg-[#9c88ff]" style={{borderRadius: '1px'}}></div>
                  <div className="absolute bottom-1 left-1 w-1 h-1 bg-[#9c88ff]" style={{borderRadius: '1px'}}></div>
                  <div className="absolute bottom-1 right-1 w-1 h-1 bg-[#9c88ff]" style={{borderRadius: '1px'}}></div>
                </button>
              </div>

              {/* 방명록 목록 컨테이너 */}
              <div className="bg-gradient-to-br from-[#2d3748]/90 to-[#1a202c]/90 backdrop-blur-lg rounded-2xl p-4 sm:p-6 border border-[#9c88ff]/30">
                {/* 헤더 스타일 제목 */}
                <div className="bg-gradient-to-r from-[#1a202c] to-[#2d3748] p-3 mb-4 border-2 border-[#9c88ff] relative text-center" style={{borderRadius: '4px'}}>
                  <h3 className="text-white font-bold text-base font-mono" style={{
                    imageRendering: 'pixelated'
                  }}>
                    방명록 목록
                  </h3>
                  
                  {/* 픽셀 도트들 */}
                  <div className="absolute top-1 left-1 w-1 h-1 bg-[#9c88ff]" style={{borderRadius: '1px'}}></div>
                  <div className="absolute top-1 right-1 w-1 h-1 bg-[#9c88ff]" style={{borderRadius: '1px'}}></div>
                  <div className="absolute bottom-1 left-1 w-1 h-1 bg-[#9c88ff]" style={{borderRadius: '1px'}}></div>
                  <div className="absolute bottom-1 right-1 w-1 h-1 bg-[#9c88ff]" style={{borderRadius: '1px'}}></div>
                </div>

                {/* 방명록 목록 */}
                <div className="space-y-3 sm:space-y-4 mb-6">
                  {minihomeData.guestbookEntries
                    .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                    .map((entry) => (
                    <div key={entry.id} className={`bg-[#1a202c]/60 border-2 rounded-2xl p-4 sm:p-6 hover:scale-[1.02] transition-all duration-300 ${
                      entry.isPrivate 
                        ? 'border-[#ff6b6b]/30 hover:border-[#ff6b6b]/50' 
                        : 'border-[#9c88ff]/30 hover:border-[#9c88ff]/50'
                    }`}>
                      <div className="flex items-center justify-between mb-3 sm:mb-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setSelectedUser(entry.writer)}
                            className={`font-bold text-sm sm:text-base font-mono hover:underline transition-all duration-200 ${
                              entry.isPrivate ? 'text-[#ff6b6b] hover:text-[#ff6b6b]/80' : 'text-[#9c88ff] hover:text-[#9c88ff]/80'
                            }`}
                          >
                            {entry.writer?.nickname}
                          </button>
                          {entry.isPrivate && (
                            <span className="bg-[#ff6b6b]/20 text-[#ff6b6b] text-xs px-2 py-1 rounded font-mono border border-[#ff6b6b]/30">
                              🔒 비공개
                            </span>
                          )}
                        </div>
                        <span className="text-gray-400 text-xs sm:text-sm font-mono">
                          {new Date(entry.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-white text-sm sm:text-base font-mono leading-relaxed">{entry.content}</p>
                    </div>
                  ))}
                </div>

                {/* 페이지네이션 */}
                {Math.ceil(minihomeData.guestbookEntries.length / itemsPerPage) > 1 && (
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-2 bg-[#1a202c]/60 border border-[#9c88ff]/30 rounded-lg text-[#9c88ff] hover:border-[#9c88ff]/60 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-mono text-sm"
                    >
                      이전
                    </button>
                    
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.ceil(minihomeData.guestbookEntries.length / itemsPerPage) }, (_, i) => i + 1).map((pageNum) => (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`w-8 h-8 rounded-lg border font-mono text-sm transition-all duration-200 ${
                            currentPage === pageNum
                              ? 'bg-[#9c88ff] text-white border-[#9c88ff]'
                              : 'bg-[#1a202c]/60 text-[#9c88ff] border-[#9c88ff]/30 hover:border-[#9c88ff]/60'
                          }`}
                        >
                          {pageNum}
                        </button>
                      ))}
                    </div>
                    
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(minihomeData.guestbookEntries.length / itemsPerPage)))}
                      disabled={currentPage === Math.ceil(minihomeData.guestbookEntries.length / itemsPerPage)}
                      className="px-3 py-2 bg-[#1a202c]/60 border border-[#9c88ff]/30 rounded-lg text-[#9c88ff] hover:border-[#9c88ff]/60 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-mono text-sm"
                    >
                      다음
                    </button>
                  </div>
                )}
              </div>
              
              {/* 홈으로 돌아가기 버튼 */}
              <div className="bg-gradient-to-br from-[#2d3748]/90 to-[#1a202c]/90 backdrop-blur-lg rounded-2xl p-4 sm:p-6 border border-[#00d4ff]/30 mb-4">
                <button
                  onClick={() => router.push('/')}
                  className="w-full bg-gradient-to-r from-[#00d4ff]/20 to-[#9c88ff]/20 border-2 border-[#00d4ff]/50 hover:border-[#00d4ff] text-[#00d4ff] hover:text-white font-bold py-3 sm:py-4 transition-all duration-300 hover:scale-105 hover:shadow-lg relative font-mono tracking-wide"
                  style={{
                    borderRadius: '6px',
                    textShadow: '0 0 6px rgba(0, 212, 255, 0.5)',
                    boxShadow: '0 0 15px rgba(0, 212, 255, 0.2)'
                  }}
                >
                  <div className="flex items-center justify-center gap-1.5 sm:gap-2">
                    <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-[#00d4ff] border border-white" style={{borderRadius: '1px'}}></div>
                    <span className="text-sm sm:text-base font-mono tracking-wider">홈으로 돌아가기</span>
                    <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-[#00d4ff] border border-white" style={{borderRadius: '1px'}}></div>
                  </div>
                  
                  {/* 버튼 모서리 픽셀 도트 */}
                  <div className="absolute top-1 left-1 w-1 h-1 bg-[#00d4ff]" style={{borderRadius: '1px'}}></div>
                  <div className="absolute top-1 right-1 w-1 h-1 bg-[#00d4ff]" style={{borderRadius: '1px'}}></div>
                  <div className="absolute bottom-1 left-1 w-1 h-1 bg-[#00d4ff]" style={{borderRadius: '1px'}}></div>
                  <div className="absolute bottom-1 right-1 w-1 h-1 bg-[#00d4ff]" style={{borderRadius: '1px'}}></div>
                </button>
              </div>

              {/* 하단 여백 - 홈 메인과 동일하게 */}
              <div className="mb-2 sm:mb-3 lg:mb-4"></div>
            </div>
          </div>
        </div>
      </div>

      {/* 사용자 프로필 모달 - UserProfileModal 사용 */}
      <UserProfileModal
        isOpen={!!selectedUser}
        onClose={() => setSelectedUser(null)}
        user={{
          id: selectedUser?.id || '',
          nickname: selectedUser?.nickname || '',
          region: selectedUser?.statusMessage || '상태 메시지 없음',
          income: selectedUser?.totalVisitors || 0,
          count: selectedUser?.dailyVisitors || 0,
          platforms: ['미니홈피'],
          minihomeId: selectedUser?.minihomeId
        }}
        title="방문자 프로필"
      />
    </div>
  )
}

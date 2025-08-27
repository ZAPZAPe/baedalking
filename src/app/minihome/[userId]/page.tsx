'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { MinihomeData } from '@/types/social'

export default function MinihomePage() {
  const params = useParams()
  const userId = params.userId as string
  
  const [minihomeData, setMinihomeData] = useState<MinihomeData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [newGuestbookEntry, setNewGuestbookEntry] = useState('')
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
  }, [userId])

  const loadMinihomeData = async () => {
    setIsLoading(true)
    try {
      // TODO: Supabase에서 미니홈피 데이터 가져오기
      // 실제 구현 시에는 userId로 해당 사용자의 미니홈피 데이터를 조회
      const mockData: MinihomeData = {
        profile: {
          id: userId,
          email: `${userId}@example.com`,
          nickname: `사용자_${userId}`,
          statusMessage: '안녕하세요! 제 미니홈피에 오신 것을 환영합니다!',
          totalVisitors: 42,
          dailyVisitors: 5,
          lastVisitorReset: new Date(),
          createdAt: new Date()
        },
        settings: {
          id: `settings-${userId}`,
          userId: userId,
          background: 'background.png',
          characterEmotion: 'happy',
          vehicle: 'scooter',
          speechText: '오늘도 안전운전!',
          isPublic: true,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        recentVisitors: [
          {
            id: 'visitor1',
            minihomeUserId: userId,
            visitorId: 'visitor1',
            visitedAt: new Date()
          }
        ],
        guestbookEntries: [
          {
            id: 'gb1',
            minihomeUserId: userId,
            writerId: 'visitor1',
            content: '미니홈피 너무 예뻐요!',
            isPrivate: false,
            createdAt: new Date(),
            updatedAt: new Date(),
            writer: {
              id: 'visitor1',
              email: 'visitor1@example.com',
              nickname: '방문자1',
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
        minihomeUserId: userId,
        writerId: currentVisitor.id,
        content: newGuestbookEntry,
        isPrivate: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        writer: {
          id: currentVisitor.id,
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
    } catch (error) {
      console.error('방명록 작성 실패:', error)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0f0f23] to-[#1a1a2e] flex items-center justify-center">
        <div className="text-center text-white">
          <div className="text-4xl mb-4">🏠</div>
          <div className="text-xl font-mono">미니홈피 로딩 중...</div>
        </div>
      </div>
    )
  }

  if (!minihomeData) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0f0f23] to-[#1a1a2e] flex items-center justify-center">
        <div className="text-center text-white">
          <div className="text-4xl mb-4">❌</div>
          <div className="text-xl font-mono">미니홈피를 찾을 수 없습니다</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0f0f23] to-[#1a1a2e] relative overflow-hidden">
      {/* 전체 도트 패턴 오버레이 */}
      <div 
        className="absolute inset-0 z-[1] opacity-[0.03]"
        style={{
          backgroundImage: `radial-gradient(circle, #ffffff 1px, transparent 1px)`,
          backgroundSize: '20px 20px'
        }}
      />

      {/* 배경 이미지 */}
      <div className="absolute inset-0 z-[2]">
        <img 
          src={`/assets/background/${minihomeData.settings.background}`}
          alt="배경"
          className="w-full h-full object-cover opacity-85"
          style={{ imageRendering: 'pixelated' }}
        />
      </div>

      {/* 메인 컨텐츠 */}
      <div className="relative z-[3] min-h-screen flex flex-col">
        {/* 헤더 */}
        <div className="bg-gradient-to-b from-black/60 to-transparent p-4 sm:p-6">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => window.history.back()}
                  className="bg-gradient-to-br from-[#ff6b6b] to-[#ff4757] border border-[#ff6b6b] hover:border-[#ff6b6b] hover:scale-110 transition-all duration-200 flex items-center justify-center px-3 py-2 rounded"
                  style={{borderRadius: '3px'}}
                >
                  <div className="w-3 h-3 bg-white" style={{borderRadius: '1px'}}></div>
                </button>
                <h1 className="text-white text-xl sm:text-2xl font-bold font-mono">
                  🏠 {minihomeData.profile.nickname}의 미니홈피
                </h1>
              </div>
              <div className="text-right text-white text-sm font-mono">
                <div>총 방문자: {minihomeData.profile.totalVisitors}명</div>
                <div>오늘 방문자: {minihomeData.profile.dailyVisitors}명</div>
              </div>
            </div>
            
            {/* 가라지 소개 */}
            <div className="bg-gradient-to-r from-[#00d4ff]/10 to-[#9c88ff]/10 border border-[#00d4ff]/30 px-4 py-3 max-w-2xl rounded"
                 style={{borderRadius: '4px'}}>
              <p className="text-[#00d4ff] font-mono text-center leading-tight"
                 style={{textShadow: '0 0 4px rgba(0, 212, 255, 0.3)'}}>
                {minihomeData.settings.speechText || '가라지 소개글이 없습니다...'}
              </p>
            </div>
          </div>
        </div>

        {/* 꾸미기 공간 */}
        <div className="flex-1 flex items-center justify-center p-4 sm:p-6">
          <div className="max-w-4xl w-full">
            <div className="bg-gradient-to-br from-[#1a4a2e]/90 to-[#1a1a2e]/90 backdrop-blur-lg rounded-2xl p-4 sm:p-6 border border-[#00ff88]/20 shadow-2xl relative">
              {/* 배경, 캐릭터, 스쿠터 꾸미기 공간 */}
              <div className="relative bg-gradient-to-b from-[#2d3748] to-[#1a202c] rounded-xl p-4 sm:p-6 min-h-[400px] sm:min-h-[500px] border border-[#00ff88]/30 shadow-inner">
                {/* 스쿠터 */}
                <div className="absolute bottom-[5%] left-[8%] w-[280px] sm:w-[320px] h-[210px] sm:h-[240px] z-20">
                  <img 
                    src="/assets/vehicle/scooter.png" 
                    alt="스쿠터" 
                    className="w-full h-full object-contain drop-shadow-lg"
                    style={{ imageRendering: 'pixelated' }}
                  />
                </div>
                
                {/* 캐릭터 */}
                <div className="absolute bottom-[5%] right-[12%] w-[180px] sm:w-[200px] h-[180px] sm:h-[200px] z-30">
                  <img 
                    src={`/assets/character/character-${minihomeData.settings.characterEmotion}.png`}
                    alt="캐릭터"
                    className="w-full h-full object-contain drop-shadow-lg"
                    style={{ imageRendering: 'pixelated' }}
                  />
                  
                  {/* 픽셀 말풍선 */}
                  <div className="absolute -top-8 sm:-top-10 left-1/2 -translate-x-1/2 bg-white border-2 border-gray-800 min-w-[60px] sm:min-w-[80px] max-w-[120px] sm:max-w-[160px]"
                       style={{
                         borderRadius: '0px',
                         imageRendering: 'pixelated',
                         boxShadow: '3px 3px 0px rgba(0,0,0,0.3)'
                       }}>
                    <div className="absolute bottom-[-6px] left-1/2 -translate-x-1/2 w-3 h-3 bg-white border-r-2 border-b-2 border-gray-800 rotate-45"></div>
                    <p className="text-[10px] sm:text-[12px] text-gray-800 font-bold text-center leading-tight break-words overflow-hidden px-2 py-1.5"
                       style={{
                         display: '-webkit-box',
                         WebkitLineClamp: 2,
                         WebkitBoxOrient: 'vertical',
                         wordBreak: 'keep-all',
                         fontFamily: 'monospace'
                       }}>
                      {minihomeData.settings.speechText}
                    </p>
                  </div>
                </div>
                
                {/* 꾸미기 공간 모서리 픽셀 도트 */}
                <div className="absolute top-1 left-1 w-2 h-2 bg-[#00ff88]" style={{borderRadius: '1px'}}></div>
                <div className="absolute top-1 right-1 w-2 h-2 bg-[#00ff88]" style={{borderRadius: '1px'}}></div>
                <div className="absolute bottom-1 left-1 w-2 h-2 bg-[#00ff88]" style={{borderRadius: '1px'}}></div>
                <div className="absolute bottom-1 right-1 w-2 h-2 bg-[#00ff88]" style={{borderRadius: '1px'}}></div>
              </div>
              
              {/* 꾸미기 공간 프레임 모서리 픽셀 도트 */}
              <div className="absolute top-1 left-1 w-2 h-2 bg-[#00ff88]" style={{borderRadius: '1px'}}></div>
              <div className="absolute top-1 right-1 w-2 h-2 bg-[#00ff88]" style={{borderRadius: '1px'}}></div>
              <div className="absolute bottom-1 left-1 w-2 h-2 bg-[#00ff88]" style={{borderRadius: '1px'}}></div>
              <div className="absolute bottom-1 right-1 w-2 h-2 bg-[#00ff88]" style={{borderRadius: '1px'}}></div>
            </div>
          </div>
        </div>

        {/* 방명록 섹션 */}
        <div className="p-4 sm:p-6">
          <div className="max-w-4xl mx-auto">
            <div className="bg-gradient-to-br from-[#2d3748] to-[#1a202c] rounded-xl p-4 sm:p-6 border border-[#9c88ff]/30">
              <h3 className="text-[#9c88ff] font-bold text-lg sm:text-xl mb-4 font-mono tracking-wide" 
                  style={{textShadow: '0 0 6px rgba(156, 136, 255, 0.5)'}}>
                방명록
              </h3>
              
              {/* 방명록 작성 */}
              <div className="mb-6">
                <textarea
                  placeholder="방명록을 남겨주세요..."
                  value={newGuestbookEntry}
                  onChange={(e) => setNewGuestbookEntry(e.target.value)}
                  className="w-full bg-[#1a202c] border-2 border-[#9c88ff]/50 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:border-[#9c88ff] focus:outline-none resize-none font-mono"
                  rows={3}
                  style={{borderRadius: '4px'}}
                />
                <button
                  onClick={handleWriteGuestbook}
                  disabled={!newGuestbookEntry.trim()}
                  className="mt-3 bg-gradient-to-r from-[#9c88ff]/20 to-[#7c6bff]/20 border-2 border-[#9c88ff]/50 hover:border-[#9c88ff] text-[#9c88ff] hover:text-white font-bold py-3 px-6 transition-all duration-300 hover:scale-105 hover:shadow-lg relative font-mono tracking-wide disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    borderRadius: '6px',
                    textShadow: '0 0 6px rgba(156, 136, 255, 0.5)',
                    boxShadow: '0 0 15px rgba(156, 136, 255, 0.2)'
                  }}
                >
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-3 h-3 bg-[#9c88ff] border border-white" style={{borderRadius: '1px'}}></div>
                    <span>방명록 작성</span>
                    <div className="w-3 h-3 bg-[#9c88ff] border border-white" style={{borderRadius: '1px'}}></div>
                  </div>
                  
                  {/* 버튼 모서리 픽셀 도트 */}
                  <div className="absolute top-1 left-1 w-1 h-1 bg-[#9c88ff]" style={{borderRadius: '1px'}}></div>
                  <div className="absolute top-1 right-1 w-1 h-1 bg-[#9c88ff]" style={{borderRadius: '1px'}}></div>
                  <div className="absolute bottom-1 left-1 w-1 h-1 bg-[#9c88ff]" style={{borderRadius: '1px'}}></div>
                  <div className="absolute bottom-1 right-1 w-1 h-1 bg-[#9c88ff]" style={{borderRadius: '1px'}}></div>
                </button>
              </div>

              {/* 방명록 목록 */}
              <div className="space-y-4">
                {minihomeData.guestbookEntries.map((entry) => (
                  <div key={entry.id} className="bg-[#1a202c]/60 border-2 border-[#9c88ff]/30 rounded-lg p-4 relative" style={{borderRadius: '4px'}}>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[#9c88ff] font-bold text-sm font-mono">
                        {entry.writer?.nickname}
                      </span>
                      <span className="text-gray-400 text-xs font-mono">
                        {new Date(entry.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-white text-sm font-mono leading-relaxed">{entry.content}</p>
                    
                    {/* 방명록 카드 모서리 픽셀 도트 */}
                    <div className="absolute top-1 left-1 w-1 h-1 bg-[#9c88ff]" style={{borderRadius: '1px'}}></div>
                    <div className="absolute top-1 right-1 w-1 h-1 bg-[#9c88ff]" style={{borderRadius: '1px'}}></div>
                    <div className="absolute bottom-1 left-1 w-1 h-1 bg-[#9c88ff]" style={{borderRadius: '1px'}}></div>
                    <div className="absolute bottom-1 right-1 w-1 h-1 bg-[#9c88ff]" style={{borderRadius: '1px'}}></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

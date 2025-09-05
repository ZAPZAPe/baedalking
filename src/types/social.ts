// 소셜 기능 관련 타입 정의 (기존 타입과 통합)

// API 응답용 친구 데이터 타입 (기존 Friend 타입과 통합)
export interface FriendData {
  id: string
  friendId: string
  nickname: string
  region: string
  avatar_config: any
  status: string
  created_at: string
  isRequester: boolean
  requesterId?: string
  requesterNickname?: string
  receiverId?: string
  receiverNickname?: string
}

// 미니홈피 관련 추가 타입들
export interface MinihomeSettings {
  id: string
  userId: string
  background: string
  characterEmotion: string
  vehicle: string
  speechText: string
  garageIntro: string
  isPublic: boolean
  createdAt: Date
  updatedAt: Date
}

export interface MinihomeVisit {
  id: string
  minihomeUserId: string
  visitorId: string
  visitedAt: Date
  visitor?: any // 방문자 정보 (JOIN 시 포함)
}

// 미니홈피 전체 데이터
export interface MinihomeData {
  profile: any
  settings: MinihomeSettings
  recentVisitors: MinihomeVisit[]
  guestbookEntries: any[]
  isFriend: boolean
  isOwner: boolean
}

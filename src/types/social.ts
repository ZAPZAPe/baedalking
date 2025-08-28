// 소셜 기능 관련 타입 정의

export interface UserProfile {
  id: string
  minihomeId: string // 고유한 미니홈피 주소 (변경 불가)
  email: string
  nickname: string // 변경 가능한 닉네임
  statusMessage?: string
  totalVisitors: number
  dailyVisitors: number
  lastVisitorReset: Date
  createdAt: Date
}

export interface MinihomeSettings {
  id: string
  userId: string
  background: string
  characterEmotion: string
  vehicle: string
  speechText: string
  isPublic: boolean
  createdAt: Date
  updatedAt: Date
}

export interface Friendship {
  id: string
  userId: string
  friendId: string
  status: 'pending' | 'accepted' | 'blocked'
  requestedAt: Date
  acceptedAt?: Date
  friend?: UserProfile // 친구 정보 (JOIN 시 포함)
}

export interface GuestbookEntry {
  id: string
  minihomeUserId: string
  writerId: string
  content: string
  isPrivate: boolean
  createdAt: Date
  updatedAt: Date
  writer?: UserProfile // 작성자 정보 (JOIN 시 포함)
}

export interface MinihomeVisit {
  id: string
  minihomeUserId: string
  visitorId: string
  visitedAt: Date
  visitor?: UserProfile // 방문자 정보 (JOIN 시 포함)
}

// 미니홈피 전체 데이터
export interface MinihomeData {
  profile: UserProfile
  settings: MinihomeSettings
  recentVisitors: MinihomeVisit[]
  guestbookEntries: GuestbookEntry[]
  isFriend: boolean
  isOwner: boolean
}

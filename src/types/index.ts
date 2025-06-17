export type Vehicle = 'motorcycle' | 'bicycle' | 'car' | 'walk';

export interface User {
  id: string;
  username: string;
  email: string;
  nickname?: string;
  region?: string;
  vehicle?: Vehicle;
  phone?: string;
  points?: number;
  totalDeliveries?: number;
  totalEarnings?: number;
  profileImage?: string;
  createdAt?: string;
  updatedAt?: string;
  role?: 'user' | 'admin';
}

export interface UserProfile {
  id: string;
  email: string;
  nickname: string;
  region: string;
  vehicle: Vehicle;
  phone: string;
  createdAt: string;
  points: number;
  totalDeliveries: number;
  totalEarnings: number;
  profileImage?: string;
  notificationSettings: {
    push: boolean;
    email: boolean;
    sms: boolean;
  };
  role?: 'user' | 'admin';
}

export interface DeliveryRecord {
  id: string;
  userId: string;
  date: string;
  amount: number;
  deliveryCount: number;
  platform: string;
  verified: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Ranking {
  id: string;
  userId: string;
  nickname: string;
  region: string;
  totalEarnings: number;
  totalDeliveries: number;
  rankType: 'daily' | 'weekly' | 'monthly';
  date: string;
  rank: number;
  createdAt?: string;
  updatedAt?: string;
}

export type DeliveryPlatform = 'baemin' | 'yogiyo' | 'coupang' | 'other';

export interface ShareLink {
  id: string;
  recordId: string;
  createdAt: Date;
  expiresAt: Date;
}

export type RankingType = 'count' | 'amount'; // 건수 또는 금액 기준
export type RankingPeriod = 'daily' | 'weekly' | 'monthly';
export type RankingScope = 'daily' | 'weekly' | 'monthly' | 'national';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  points: number;
  condition: {
    type: 'deliveries' | 'distance' | 'earnings' | 'streak';
    value: number;
  };
  unlockedAt?: Date;
}

export interface PointHistory {
  id: string;
  userId: string;
  amount: number;
  type: 'daily_login' | 'delivery' | 'achievement' | 'referral' | 'admin';
  description: string;
  createdAt: Date;
}

export interface UserStats {
  totalDeliveries: number;
  totalDistance: number;
  totalEarnings: number;
  averageRating: number;
  currentStreak: number;
  longestStreak: number;
  achievements: Achievement[];
  recentDeliveries: DeliveryRecord[];
  recentPoints: PointHistory[];
}

export type NotificationType =
  | 'friend_request'
  | 'friend_accept'
  | 'delivery_verified'
  | 'point_reward'
  | 'admin_notice'
  | 'notice'
  | 'point'
  | 'ranking'
  | 'yesterday'
  | 'invite';
export type RankingType = 'count' | 'amount';
export type RankingScope = 'national' | 'regional';

export interface Ranking {
  rank: number;
  userId: string;
  nickname: string;
  region: string;
  totalAmount: number;
  totalDeliveries: number;
  platform: string;
  customDay?: string;
  weekNumber?: number;
  month?: number;
}

export interface RankingData {
  rank: number;
  userId: string;
  nickname: string;
  region: string;
  totalAmount: number;
  totalDeliveries: number;
  platform: string;
}

export interface RankingResponse {
  rank: number;
  user: Ranking;
}

export interface RankingInput {
  userId: string;
  points: number;
} 
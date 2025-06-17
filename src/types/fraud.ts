export interface FraudRecord {
  id: string;
  userId: string;
  userNickname: string;
  platform: string;
  amount: number;
  reason: string;
  status: 'pending' | 'confirmed' | 'rejected';
  confidence: number;
  imageUrl?: string;
  createdAt: Date;
  updatedAt?: Date;
} 
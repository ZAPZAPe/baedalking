export type DeliveryPlatform = '배민커넥트' | '쿠팡이츠';

// 새로운 데이터 구조에 맞춘 배달 기록 인터페이스
export interface DeliveryRecord {
  id: string;
  userId: string;
  startTime: Date;
  endTime?: Date;
  distance: number;
  earnings: number;
  status: 'in_progress' | 'completed' | 'cancelled';
  route?: {
    start: {
      lat: number;
      lng: number;
      address: string;
    };
    end: {
      lat: number;
      lng: number;
      address: string;
    };
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface DeliveryHistoryData {
  date: string;
  orderCount: number;
  totalAmount: number;
}

export interface DailyDelivery {
  date: string;
  amount: number;
  count: number;
}

export interface SettlementData {
  period: string;
  finalAmount: number;
  paymentDate: string;
  totalDeliveries: number;
  totalDeliveryFee: number;
  dailyDeliveries: DailyDelivery[];
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface DeliveryStats {
  totalDeliveries: number;
  totalDistance: number;
  totalEarnings: number;
  averageEarnings: number;
  averageDistance: number;
  bestDay: {
    date: string;
    earnings: number;
    deliveries: number;
  };
  recentDeliveries: DeliveryRecord[];
}

export interface DeliverySummary {
  date: string;
  deliveries: number;
  distance: number;
  earnings: number;
} 
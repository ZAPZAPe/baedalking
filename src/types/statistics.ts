export interface Statistics {
  totalUsers: number;
  userGrowth: number;
  totalRecords: number;
  recordGrowth: number;
  totalAmount: number;
  amountGrowth: number;
  fraudCount: number;
  trendData: {
    date: string;
    count: number;
  }[];
  platformStats: {
    platform: string;
    count: number;
    amount: number;
  }[];
  regionStats: {
    region: string;
    count: number;
    amount: number;
  }[];
} 
export interface DailyIncome {
  date: string;
  day: string;
  deliveryCount: number;
  amount: number;
}

export interface CoupangEatsIncomeData {
  period: string;
  totalAmount: number;
  totalDeliveries: number;
  lastUpdate: string;
  dailyIncomes: DailyIncome[];
}

export interface DeliveryItem {
  restaurantName: string;
  completionTime: string;
  distance: string;
  amount: number;
}

export interface CoupangEatsDetailData {
  date: string;
  totalAmount: number;
  deliveryCount: number;
  deliveries: DeliveryItem[];
} 
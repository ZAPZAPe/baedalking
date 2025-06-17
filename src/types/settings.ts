export interface Settings {
  siteName: string;
  adminEmail: string;
  autoVerifyOcr: boolean;
  ocrConfidenceThreshold: number;
  autoFraudDetection: boolean;
  fraudDetectionThreshold: number;
  emailNotifications: boolean;
  fraudNotifications: boolean;
} 
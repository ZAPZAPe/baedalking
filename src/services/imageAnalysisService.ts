// Tesseract.js는 클라이언트 사이드에서만 import
let createWorker: any;
if (typeof window !== 'undefined') {
  import('tesseract.js').then(module => {
    createWorker = module.createWorker;
  });
}

export type Platform = 'baemin' | 'coupang' | 'yogiyo' | 'other';

export interface AnalysisResult {
  amount: number;
  deliveryCount: number;
  platform: Platform;
  date: string;
  confidence: number;
  rawText: string;
  analysisTime: number;
}

interface ImageAnalysisConfig {
  enableMockMode: boolean;
  mockAccuracy: number; // 0-1 사이의 정확도
  apiEndpoint?: string;
  apiKey?: string;
}

export class ImageAnalysisService {
  private config: ImageAnalysisConfig;
  private worker: any = null;

  constructor() {
    this.config = {
      enableMockMode: process.env.NODE_ENV === 'development',
      mockAccuracy: 0.85,
      apiEndpoint: process.env.NEXT_PUBLIC_OCR_API_ENDPOINT,
      apiKey: process.env.NEXT_PUBLIC_OCR_API_KEY
    };
  }

  /**
   * Tesseract 워커 초기화
   */
  private async initializeWorker() {
    if (typeof window === 'undefined') {
      throw new Error('Tesseract.js는 브라우저 환경에서만 사용할 수 있습니다.');
    }
    
    if (!this.worker && createWorker) {
      this.worker = await createWorker();
    }
    return this.worker;
  }

  /**
   * 이미지에서 배달 실적 분석
   */
  async analyzeImage(file: File, detectedPlatform: Platform): Promise<AnalysisResult> {
    const startTime = Date.now();
    
    try {
      console.log('이미지 분석 시작:', file.name);
      
      // 개발 환경에서는 mock 데이터 사용
      if (process.env.NODE_ENV === 'development' || typeof window === 'undefined') {
        console.log('개발 모드 또는 서버 환경: Mock 데이터 사용');
        
        // 파일명이나 플랫폼으로 샘플 데이터 반환
        const mockData = this.getMockData(detectedPlatform);
        
        return {
          ...mockData,
          platform: detectedPlatform,
          confidence: 0.95,
          rawText: 'Mock OCR Result',
          analysisTime: Date.now() - startTime
        };
      }
      
      // 이미지 전처리
      const processedImage = await this.preprocessImage(file);
      
      // OCR 실행
      if (!this.worker && createWorker) {
        this.worker = await createWorker();
      }
      
      if (!this.worker) {
        throw new Error('OCR 워커를 초기화할 수 없습니다.');
      }
      
      const result = await this.worker.recognize(processedImage);
      const text = result.data.text;
      console.log('OCR 결과:', text);

      // 플랫폼별 분석
      let analysisResult: Omit<AnalysisResult, 'confidence' | 'analysisTime'>;
      
      if (detectedPlatform === 'baemin') {
        analysisResult = this.analyzeBaeminText(text);
      } else if (detectedPlatform === 'coupang') {
        analysisResult = this.analyzeCoupangText(text);
      } else {
        analysisResult = this.analyzeText(text);
      }

      // 신뢰도 계산
      const confidence = this.calculateConfidence(text, detectedPlatform);

      return {
        ...analysisResult,
        confidence,
        rawText: text,
        analysisTime: Date.now() - startTime
      };
    } catch (error) {
      console.error('이미지 분석 중 오류:', error);
      
      // 오류 발생 시에도 기본값 반환
      return {
        amount: 0,
        deliveryCount: 0,
        platform: detectedPlatform || 'other',
        date: new Date().toISOString().split('T')[0],
        confidence: 0,
        rawText: '',
        analysisTime: Date.now() - startTime
      };
    }
  }

  /**
   * OCR로 추출한 텍스트 분석
   */
  private analyzeText(text: string): Omit<AnalysisResult, 'confidence' | 'analysisTime'> {
    console.log('=== 텍스트 분석 시작 ===');
    console.log('입력 텍스트:', text);
    
    // 플랫폼 감지
    const platform = this.detectPlatform(text);
    console.log('감지된 플랫폼:', platform);
    
    // 날짜 추출
    const dateInfo = this.extractDate(text);
    const date = (dateInfo && typeof dateInfo.date === 'string') ? dateInfo.date : new Date().toISOString().split('T')[0];
    console.log('추출된 날짜 정보:', date);
    
    // 주급인 경우 일별 상세 내역 추출
    let dailyBreakdown: Array<{ date: string; amount: number; deliveryCount?: number }> | undefined;
    if (dateInfo.isWeeklyReport) {
      dailyBreakdown = this.extractDailyBreakdown(text);
      console.log('일별 상세 내역:', dailyBreakdown);
    }
    
    // 금액 추출
    const amount = this.extractAmount(text);
    console.log('추출된 금액:', amount);
    
    // 건수 추출
    const deliveryCount = this.extractDeliveryCount(text);
    console.log('추출된 건수:', deliveryCount);

    const result = {
      amount,
      deliveryCount,
      platform,
      date,
      ...(dateInfo.isWeeklyReport ? { isWeeklyReport: true } : {}),
      ...(dateInfo.dateRange ? { dateRange: dateInfo.dateRange } : {}),
      ...(dailyBreakdown && { dailyBreakdown }),
      rawText: text
    };
    
    console.log('=== 분석 결과 ===', result);
    return result;
  }

  /**
   * 날짜 추출
   */
  private extractDate(text: string): { date?: string; isWeeklyReport?: boolean; dateRange?: { start: string; end: string } } {
    const today = new Date();
    const currentYear = today.getFullYear();
    
    // 플랫폼 감지
    const platform = this.detectPlatform(text);

    // 플랫폼별 날짜 패턴
    const patterns = {
      baemin: [
        // 2025.2.19 형식
        /(\d{4})\.(\d{1,2})\.(\d{1,2})/,
        // 2.19 형식 (올해)
        /(\d{1,2})\.(\d{1,2})/,
        // 2025-02-19 형식
        /(\d{4})-(\d{2})-(\d{2})/,
      ],
      coupang: [
        // 05/29 형식
        /(\d{2})\/(\d{2})/,
        // 2025-05-29 형식
        /(\d{4})-(\d{2})-(\d{2})/,
      ],
      other: [
        // 일반적인 날짜 형식
        /(\d{4})[-./](\d{1,2})[-./](\d{1,2})/,
        /(\d{1,2})[-./](\d{1,2})/,
      ]
    };
    const platformPatterns = patterns[platform as keyof typeof patterns] || patterns.other;
    
    // 주급 데이터 확인
    const weeklyPatterns = [
      /(\d{4})\.(\d{1,2})\.(\d{1,2})\s*~\s*(\d{4})\.(\d{1,2})\.(\d{1,2})/, // 2025.2.19 ~ 2025.2.25
      /(\d{1,2})\.(\d{1,2})\s*~\s*(\d{1,2})\.(\d{1,2})/, // 2.19 ~ 2.25
      /(\d{2})\/(\d{2})\s*~\s*(\d{2})\/(\d{2})/, // 05/29 ~ 06/04
    ];

    // 주급 데이터 확인
    for (const pattern of weeklyPatterns) {
      const match = text.match(pattern);
      if (match) {
        let startDate: Date;
        let endDate: Date;

        if (match.length === 7) { // 연도 포함
          startDate = new Date(parseInt(match[1]), parseInt(match[2]) - 1, parseInt(match[3]));
          endDate = new Date(parseInt(match[4]), parseInt(match[5]) - 1, parseInt(match[6]));
        } else if (match.length === 5) { // 월/일만
          startDate = new Date(currentYear, parseInt(match[1]) - 1, parseInt(match[2]));
          endDate = new Date(currentYear, parseInt(match[3]) - 1, parseInt(match[4]));
        } else {
          continue;
        }

        return {
          isWeeklyReport: true,
          dateRange: {
            start: this.formatDate(startDate),
            end: this.formatDate(endDate)
          }
        };
      }
    }

    // 일반 날짜 추출
    for (const pattern of platformPatterns) {
      const match = text.match(pattern);
      if (match) {
        let date: Date;

        if (match.length === 4) { // 연도 포함
          date = new Date(parseInt(match[1]), parseInt(match[2]) - 1, parseInt(match[3]));
        } else { // 월/일만
          date = new Date(currentYear, parseInt(match[1]) - 1, parseInt(match[2]));
        }

        // 미래 날짜는 오늘 날짜로 처리
        if (date > today) {
          date = today;
        }

        return {
          date: this.formatDate(date)
        };
      }
    }

    // 날짜를 찾지 못한 경우 오늘 날짜 반환
    return {
      date: this.formatDate(today)
    };
  }

  /**
   * 날짜 포맷팅
   */
  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  /**
   * 플랫폼 감지
   */
  private detectPlatform(text: string): Platform {
    const lowerText = text.toLowerCase();
    let baeminScore = 0;
    let coupangScore = 0;

    // 배민 패턴
    if (text.includes('오늘 배달 내역')) baeminScore += 2;
    if (text.includes('정산내역상세')) baeminScore += 2;
    if (text.includes('최종지급금액')) baeminScore += 2;
    if (text.includes('운행일')) baeminScore += 1;
    if (text.includes('배달건')) baeminScore += 1;
    if (text.includes('배달료 합계')) baeminScore += 1;
    if (text.includes('지급일')) baeminScore += 1;
    if (text.includes('총 배달건')) baeminScore += 1;
    if (/\d{4}\.\d{1,2}\.\d{1,2}/.test(text)) baeminScore += 1;
    if (/\d{1,2}월 \d{1,2}일/.test(text)) baeminScore += 1;

    // 쿠팡 패턴
    if (text.includes('총 배달 수수료')) coupangScore += 2;
    if (text.includes('일별 배달 수수료')) coupangScore += 2;
    if (text.includes('내 수입')) coupangScore += 1;
    if (text.includes('이츠플러스 협력사')) coupangScore += 1;
    if (/\d{2}\/\d{2} [월화수목금토일]/.test(text)) coupangScore += 1;
    if (/배달 ?\d+건/.test(text)) coupangScore += 1;

    if (baeminScore >= coupangScore && baeminScore >= 2) return 'baemin';
    if (coupangScore > baeminScore && coupangScore >= 2) return 'coupang';
    return 'other';
  }

  /**
   * 금액 추출
   */
  private extractAmount(text: string): number {
    const amountMatch = text.match(/(\d{1,3}(,\d{3})+|\d+)[ ]*원/);
    if (amountMatch) {
      return parseInt(amountMatch[1].replace(/,/g, ''), 10);
    }
    return 0;
  }

  /**
   * 배달 건수 추출
   */
  private extractDeliveryCount(text: string): number {
    const countMatch = text.match(/배달[\s]*([0-9]+)건|([0-9]+)건/);
    if (countMatch) {
      return parseInt(countMatch[1] || countMatch[2], 10);
    }
    return 0;
  }

  /**
   * 주급 데이터에서 일별 상세 내역 추출
   */
  private extractDailyBreakdown(text: string): Array<{ date: string; amount: number; deliveryCount?: number }> {
    const breakdown: Array<{ date: string; amount: number; deliveryCount?: number }> = [];
    const lines = text.split('\n');
    const currentYear = new Date().getFullYear();
    
    // 플랫폼별 일별 데이터 패턴
    const patterns = {
      baemin: [
        // 2025.2.19 54,800원 13건
        /(\d{4})\.(\d{1,2})\.(\d{1,2})\s+(\d{1,3}(?:,\d{3})*)\s*원\s*(\d+)\s*건/,
        // 2.19 54,800원 13건
        /(\d{1,2})\.(\d{1,2})\s+(\d{1,3}(?:,\d{3})*)\s*원\s*(\d+)\s*건/,
      ],
      coupang: [
        // 05/29 목 배달 17건 53,920원
        /(\d{2})\/(\d{2})\s*[월화수목금토일]\s*배달\s*(\d+)\s*건\s*(\d{1,3}(?:,\d{3})*)\s*원/,
        // 05/29 목 53,920원
        /(\d{2})\/(\d{2})\s*[월화수목금토일]\s*(\d{1,3}(?:,\d{3})*)\s*원/,
        // 05/29 목 배달 17건
        /(\d{2})\/(\d{2})\s*[월화수목금토일]\s*배달\s*(\d+)\s*건/,
      ],
      other: [
        // 일반 패턴: 날짜 금액
        /(\d{1,2})[-/.]\s*(\d{1,2})\s+(\d{1,3}(?:,\d{3})*)\s*원/,
      ]
    };
    
    const platformPatterns = patterns[this.detectPlatform(text) as keyof typeof patterns] || patterns.other;
    
    lines.forEach(line => {
      for (const pattern of platformPatterns) {
        const match = line.match(pattern);
        if (match) {
          let date: Date;
          let amount: number;
          let deliveryCount: number | undefined;
          
          if (this.detectPlatform(text) === 'baemin') {
            if (match.length === 6) { // 연도 포함
              date = new Date(parseInt(match[1]), parseInt(match[2]) - 1, parseInt(match[3]));
              amount = parseInt(match[4].replace(/,/g, ''));
              deliveryCount = parseInt(match[5]);
            } else if (match.length === 5) { // 월/일만
              date = new Date(currentYear, parseInt(match[1]) - 1, parseInt(match[2]));
              amount = parseInt(match[3].replace(/,/g, ''));
              deliveryCount = parseInt(match[4]);
            }
          } else if (this.detectPlatform(text) === 'coupang') {
            const month = parseInt(match[1]);
            const day = parseInt(match[2]);
            date = new Date(currentYear, month - 1, day);
            
            if (match.length === 5) { // 건수와 금액 모두 있음
              deliveryCount = parseInt(match[3]);
              amount = parseInt(match[4].replace(/,/g, ''));
            } else if (match.length === 4) {
              // 금액만 있거나 건수만 있는 경우
              const value = match[3].replace(/,/g, '');
              if (parseInt(value) > 1000) {
                amount = parseInt(value);
              } else {
                deliveryCount = parseInt(value);
                amount = 0; // 금액은 나중에 다른 패턴으로 찾아야 함
              }
            }
          } else {
            // 기타 플랫폼
            date = new Date(currentYear, parseInt(match[1]) - 1, parseInt(match[2]));
            amount = parseInt(match[3].replace(/,/g, ''));
          }
          
          if (date! && amount! > 0) {
            breakdown.push({
              date: this.formatDate(date!),
              amount: amount!,
              ...(deliveryCount && { deliveryCount })
            });
          }
          break; // 패턴이 매치되면 다음 라인으로
        }
      }
    });
    
    // 중복 제거 (같은 날짜가 여러 번 나올 수 있음)
    const uniqueBreakdown = breakdown.reduce((acc, curr) => {
      const existing = acc.find(item => item.date === curr.date);
      if (!existing) {
        acc.push(curr);
      } else if (curr.amount > existing.amount) {
        // 같은 날짜에 여러 금액이 있으면 큰 금액 선택
        existing.amount = curr.amount;
        if (curr.deliveryCount) {
          existing.deliveryCount = curr.deliveryCount;
        }
      }
      return acc;
    }, [] as typeof breakdown);
    
    return uniqueBreakdown.sort((a, b) => a.date.localeCompare(b.date));
  }

  /**
   * 워커 정리
   */
  async cleanup() {
    if (this.worker) {
      await this.worker.terminate();
      this.worker = null;
    }
  }

  /**
   * 분석 결과 검증
   */
  validateAnalysisResult(result: AnalysisResult): {
    isValid: boolean;
    warnings: string[];
  } {
    const warnings: string[] = [];
    let isValid = true;

    // 금액 검증
    if (result.amount <= 0) {
      warnings.push('금액이 감지되지 않았습니다.');
      isValid = false;
    } else if (result.amount > 1000000) { // 100만원 초과
      warnings.push('금액이 너무 높습니다. 확인해주세요.');
    } else if (result.amount < 5000) { // 5천원 미만
      warnings.push('금액이 너무 낮습니다. 확인해주세요.');
    }

    // 건수 검증
    if (result.deliveryCount <= 0) {
      warnings.push('배달 건수가 감지되지 않았습니다.');
      isValid = false;
    } else if (result.deliveryCount > 100) { // 100건 초과
      warnings.push('배달 건수가 너무 많습니다. 확인해주세요.');
    }

    // 신뢰도 검증
    if (result.confidence < 0.7) {
      warnings.push('분석 신뢰도가 낮습니다. 더 선명한 이미지를 업로드해주세요.');
    }

    // 평균 배달료 검증
    const avgAmount = result.amount / result.deliveryCount;
    if (avgAmount < 2000) {
      warnings.push('배달당 평균 금액이 너무 낮습니다.');
    } else if (avgAmount > 15000) {
      warnings.push('배달당 평균 금액이 너무 높습니다.');
    }

    return { isValid, warnings };
  }

  /**
   * 이미지 압축
   */
  private async preprocessImage(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas context를 생성할 수 없습니다.'));
          return;
        }

        // 이미지 크기 조정 (너무 크면 OCR 성능 저하)
        const maxSize = 2000;
        let width = img.width;
        let height = img.height;
        
        if (width > maxSize || height > maxSize) {
          if (width > height) {
            height = Math.round((height * maxSize) / width);
            width = maxSize;
          } else {
            width = Math.round((width * maxSize) / height);
            height = maxSize;
          }
        }

        canvas.width = width;
        canvas.height = height;

        // 이미지 그리기
        ctx.drawImage(img, 0, 0, width, height);

        // 이미지 전처리 (대비 향상)
        const imageData = ctx.getImageData(0, 0, width, height);
        const data = imageData.data;

        // 그레이스케일 변환 및 대비 향상
        for (let i = 0; i < data.length; i += 4) {
          const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
          const enhanced = Math.min(255, gray * 1.2);
          data[i] = enhanced;
          data[i + 1] = enhanced;
          data[i + 2] = enhanced;
        }

        ctx.putImageData(imageData, 0, 0);
        resolve(canvas.toDataURL());
      };

      img.onerror = () => reject(new Error('이미지 로드 실패'));
      img.src = URL.createObjectURL(file);
    });
  }

  /**
   * Mock 데이터 생성
   */
  private getMockData(platform: Platform): Omit<AnalysisResult, 'confidence' | 'rawText' | 'analysisTime'> {
    const today = new Date().toISOString().split('T')[0];
    
    if (platform === 'baemin') {
      return {
        amount: 53920,
        deliveryCount: 17,
        platform: 'baemin',
        date: today
      };
    } else if (platform === 'coupang') {
      return {
        amount: 45600,
        deliveryCount: 12,
        platform: 'coupang',
        date: today
      };
    }
    
    return {
      amount: 30000,
      deliveryCount: 10,
      platform: 'other',
      date: today
    };
  }

  /**
   * 배민커넥트 텍스트 분석
   */
  private analyzeBaeminText(text: string): Omit<AnalysisResult, 'confidence' | 'analysisTime'> {
    console.log('=== 배민커넥트 텍스트 분석 시작 ===');
    
    // 날짜 추출 (05/29 목 형식)
    const dateMatch = text.match(/(\d{2})\/(\d{2})\s*[월화수목금토일]/);
    let date = new Date().toISOString().split('T')[0];
    if (dateMatch) {
      const currentYear = new Date().getFullYear();
      const month = parseInt(dateMatch[1]);
      const day = parseInt(dateMatch[2]);
      date = `${currentYear}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    }
    
    // 금액 추출 (53,920원 형식)
    const amountMatch = text.match(/(\d{1,3}(?:,\d{3})*)\s*원/);
    const amount = amountMatch ? parseInt(amountMatch[1].replace(/,/g, '')) : 0;
    
    // 건수 추출 (배달 17건 형식)
    const countMatch = text.match(/배달\s*(\d+)\s*건/);
    const deliveryCount = countMatch ? parseInt(countMatch[1]) : 0;
    
    return {
      amount,
      deliveryCount,
      platform: 'baemin',
      date,
      rawText: text
    };
  }

  /**
   * 쿠팡이츠 텍스트 분석
   */
  private analyzeCoupangText(text: string): Omit<AnalysisResult, 'confidence' | 'analysisTime'> {
    console.log('=== 쿠팡이츠 텍스트 분석 시작 ===');
    
    // 날짜 추출 (6월 14일 형식)
    const dateMatch = text.match(/(\d{1,2})월\s*(\d{1,2})일/);
    let date = new Date().toISOString().split('T')[0];
    if (dateMatch) {
      const currentYear = new Date().getFullYear();
      const month = parseInt(dateMatch[1]);
      const day = parseInt(dateMatch[2]);
      date = `${currentYear}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    }
    
    // 금액 추출 (0원 형식 - 배달료 합계)
    const amountMatch = text.match(/배달료\s*합계[^\d]*(\d+)\s*원/);
    const amount = amountMatch ? parseInt(amountMatch[1]) : 0;
    
    // 건수 추출 (배달건 0건 형식)
    const countMatch = text.match(/배달건[^\d]*(\d+)\s*건/);
    const deliveryCount = countMatch ? parseInt(countMatch[1]) : 0;
    
    return {
      amount,
      deliveryCount,
      platform: 'coupang',
      date,
      rawText: text
    };
  }

  /**
   * 오늘 날짜 추출 (플랫폼별)
   */
  private extractTodayDate(text: string, platform: Platform): string {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    
    // 주간 리포트 패턴
    const weeklyPattern = /(\d{4})[년\s]*(\d{1,2})[월\s]*(\d{1,2})[일\s]*[-~]\s*(\d{4})[년\s]*(\d{1,2})[월\s]*(\d{1,2})[일]/;
    const weeklyMatch = text.match(weeklyPattern);
    
    if (weeklyMatch) {
      const [_, startYear, startMonth, startDay, endYear, endMonth, endDay] = weeklyMatch;
      const startDate = new Date(parseInt(startYear), parseInt(startMonth) - 1, parseInt(startDay));
      const endDate = new Date(parseInt(endYear), parseInt(endMonth) - 1, parseInt(endDay));
      
      // 오늘 날짜가 주간 리포트 기간 내에 있는지 확인
      if (today >= startDate && today <= endDate) {
        return todayStr;
      }
    }
    
    // 단일 날짜 패턴
    const singleDatePattern = /(\d{4})[년\s]*(\d{1,2})[월\s]*(\d{1,2})[일]/;
    const singleMatch = text.match(singleDatePattern);
    
    if (singleMatch) {
      const [_, year, month, day] = singleMatch;
      const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      
      // 오늘 날짜와 일치하는지 확인
      if (date.toISOString().split('T')[0] === todayStr) {
        return todayStr;
      }
    }
    
    // 날짜를 찾을 수 없거나 오늘 날짜가 아닌 경우
    return todayStr;
  }

  /**
   * 신뢰도 계산
   */
  private calculateConfidence(text: string, platform: Platform): number {
    let confidence = 0;
    const lowerText = text.toLowerCase();

    if (platform === 'baemin') {
      // 배민커넥트 필수 키워드
      if (text.includes('오늘 배달 내역')) confidence += 0.3;
      if (text.includes('총 배달 수수료')) confidence += 0.2;
      if (/\d{2}\/\d{2}\s*[월화수목금토일]/.test(text)) confidence += 0.2;
      if (/배달\s*\d+\s*건/.test(text)) confidence += 0.15;
      if (/\d{1,3}(?:,\d{3})*\s*원/.test(text)) confidence += 0.15;
      
      // 배민 특유의 어두운 UI 관련 텍스트가 있으면 추가 점수
      if (text.includes('스시기원') || text.includes('배달 완료')) confidence += 0.1;
    } else if (platform === 'coupang') {
      // 쿠팡이츠 필수 키워드
      if (text.includes('내 수입')) confidence += 0.3;
      if (text.includes('배달료 합계')) confidence += 0.2;
      if (/\d{1,2}월\s*\d{1,2}일/.test(text)) confidence += 0.2;
      if (/배달건\s*\d+\s*건/.test(text)) confidence += 0.15;
      if (/\d+\s*원/.test(text)) confidence += 0.15;
      
      // 쿠팡 특유의 흰색 UI 관련 텍스트가 있으면 추가 점수
      if (text.includes('운행일') || text.includes('배달료')) confidence += 0.1;
    } else {
      // 기타 플랫폼
      if (/\d{1,3}(?:,\d{3})*\s*원/.test(text)) confidence += 0.3;
      if (/\d+\s*건/.test(text)) confidence += 0.3;
      if (/\d{4}[-./]\d{1,2}[-./]\d{1,2}/.test(text)) confidence += 0.2;
      confidence += 0.2; // 기본 점수
    }

    // 텍스트 길이에 따른 보정
    if (text.length < 20) confidence *= 0.5;
    else if (text.length > 100) confidence = Math.min(confidence * 1.1, 1);

    return Math.min(confidence, 1);
  }
}

// 싱글톤 인스턴스 - 지연 초기화
let _imageAnalysisService: ImageAnalysisService | null = null;

const getImageAnalysisService = () => {
  if (!_imageAnalysisService) {
    _imageAnalysisService = new ImageAnalysisService();
  }
  return _imageAnalysisService;
};

// 이미지 분석 함수
export const analyzeDeliveryImage = (file: File, platform?: string) =>
  getImageAnalysisService().analyzeImage(file, platform as Platform);

// 검증 함수
export const validateAnalysis = (result: AnalysisResult) =>
  getImageAnalysisService().validateAnalysisResult(result);

// 정리 함수
export const cleanupOCR = () => getImageAnalysisService().cleanup(); 
// 카카오 알림톡 API 서비스
interface KakaoAlimtalkConfig {
  apiKey: string;
  senderKey: string;
  templateCode: string;
  apiUrl: string;
}

interface AlimtalkMessage {
  to: string;
  templateCode: string;
  templateParameter: Record<string, string>;
}

interface AlimtalkResponse {
  code: number;
  message: string;
  info: {
    type: string;
    mid: string;
    requestTime: string;
  };
}

class KakaoAlimtalkService {
  private config: KakaoAlimtalkConfig;

  constructor() {
    this.config = {
      apiKey: process.env.KAKAO_API_KEY || '',
      senderKey: process.env.KAKAO_SENDER_KEY || '',
      templateCode: process.env.KAKAO_TEMPLATE_CODE || '',
      apiUrl: process.env.KAKAO_API_URL || 'https://kapi.kakao.com/v2/api/talk/memo/default/send'
    };
  }

  /**
   * 인증번호 발송용 알림톡 전송
   * @param phoneNumber 수신자 전화번호 (01012345678 형식)
   * @param verificationCode 6자리 인증번호
   * @returns Promise<boolean> 발송 성공 여부
   */
  async sendVerificationCode(phoneNumber: string, verificationCode: string): Promise<boolean> {
    try {
      // 전화번호 형식 정리 (하이픈 제거)
      const cleanPhoneNumber = phoneNumber.replace(/-/g, '');
      
      const message: AlimtalkMessage = {
        to: cleanPhoneNumber,
        templateCode: this.config.templateCode,
        templateParameter: {
          '#{인증번호}': verificationCode,
          '#{서비스명}': '배달킹',
          '#{유효시간}': '3분'
        }
      };

      const response = await fetch(this.config.apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `KakaoAK ${this.config.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sender_key: this.config.senderKey,
          template_code: message.templateCode,
          receiver_uuids: [cleanPhoneNumber],
          template_parameter: message.templateParameter
        })
      });

      const result: AlimtalkResponse = await response.json();
      
      if (response.ok && result.code === 0) {
        console.log('알림톡 발송 성공:', result);
        return true;
      } else {
        console.error('알림톡 발송 실패:', result);
        return false;
      }
    } catch (error) {
      console.error('알림톡 API 호출 오류:', error);
      return false;
    }
  }

  /**
   * 6자리 랜덤 인증번호 생성
   * @returns string 6자리 숫자 문자열
   */
  generateVerificationCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * 환경 변수 설정 확인
   * @returns boolean 설정 완료 여부
   */
  isConfigured(): boolean {
    return !!(
      this.config.apiKey &&
      this.config.senderKey &&
      this.config.templateCode &&
      this.config.apiUrl
    );
  }
}

// 싱글톤 인스턴스 생성
export const kakaoAlimtalkService = new KakaoAlimtalkService();

// 편의 함수들
export const sendVerificationSMS = async (phoneNumber: string): Promise<{ success: boolean; code?: string }> => {
  if (!kakaoAlimtalkService.isConfigured()) {
    console.warn('카카오 알림톡 설정이 완료되지 않았습니다. 데모 모드로 실행합니다.');
    // 데모 모드: 실제 발송 없이 성공 반환
    return { success: true, code: '123456' };
  }

  const verificationCode = kakaoAlimtalkService.generateVerificationCode();
  const success = await kakaoAlimtalkService.sendVerificationCode(phoneNumber, verificationCode);
  
  return { success, code: success ? verificationCode : undefined };
};

export default KakaoAlimtalkService; 
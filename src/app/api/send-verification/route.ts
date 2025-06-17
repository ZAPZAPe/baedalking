import { NextRequest, NextResponse } from 'next/server';
import { sendVerificationSMS } from '@/services/kakaoService';

// 인증번호 저장용 임시 저장소 (실제로는 Redis나 DB 사용 권장)
const verificationCodes = new Map<string, { code: string; expiry: number }>();

export async function POST(request: NextRequest) {
  try {
    const { phoneNumber } = await request.json();

    if (!phoneNumber) {
      return NextResponse.json(
        { success: false, message: '전화번호가 필요합니다.' },
        { status: 400 }
      );
    }

    // 전화번호 형식 검증
    const phoneRegex = /^01[0-9]-?[0-9]{4}-?[0-9]{4}$/;
    const cleanPhoneNumber = phoneNumber.replace(/-/g, '');
    
    if (!phoneRegex.test(cleanPhoneNumber)) {
      return NextResponse.json(
        { success: false, message: '올바른 전화번호 형식이 아닙니다.' },
        { status: 400 }
      );
    }

    // 카카오 알림톡으로 인증번호 발송
    const result = await sendVerificationSMS(phoneNumber);

    if (result.success && result.code) {
      // 인증번호를 3분간 저장 (실제로는 암호화해서 저장)
      const expiry = Date.now() + 3 * 60 * 1000; // 3분 후 만료
      verificationCodes.set(cleanPhoneNumber, {
        code: result.code,
        expiry
      });

      return NextResponse.json({
        success: true,
        message: '인증번호가 발송되었습니다.',
        // 개발 환경에서만 코드 반환 (실제 운영에서는 제거)
        ...(process.env.NODE_ENV === 'development' && { code: result.code })
      });
    } else {
      return NextResponse.json(
        { success: false, message: '인증번호 발송에 실패했습니다.' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('인증번호 발송 API 오류:', error);
    return NextResponse.json(
      { success: false, message: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// 인증번호 확인 API
export async function PUT(request: NextRequest) {
  try {
    const { phoneNumber, verificationCode } = await request.json();

    if (!phoneNumber || !verificationCode) {
      return NextResponse.json(
        { success: false, message: '전화번호와 인증번호가 필요합니다.' },
        { status: 400 }
      );
    }

    const cleanPhoneNumber = phoneNumber.replace(/-/g, '');
    const stored = verificationCodes.get(cleanPhoneNumber);

    if (!stored) {
      return NextResponse.json(
        { success: false, message: '인증번호를 먼저 요청해주세요.' },
        { status: 400 }
      );
    }

    // 만료 시간 확인
    if (Date.now() > stored.expiry) {
      verificationCodes.delete(cleanPhoneNumber);
      return NextResponse.json(
        { success: false, message: '인증번호가 만료되었습니다.' },
        { status: 400 }
      );
    }

    // 인증번호 확인
    if (stored.code === verificationCode) {
      verificationCodes.delete(cleanPhoneNumber); // 사용된 인증번호 삭제
      return NextResponse.json({
        success: true,
        message: '인증이 완료되었습니다.'
      });
    } else {
      return NextResponse.json(
        { success: false, message: '인증번호가 올바르지 않습니다.' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('인증번호 확인 API 오류:', error);
    return NextResponse.json(
      { success: false, message: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const userData = await request.json();
    
    if (!userData.id || !userData.email) {
      return NextResponse.json(
        { error: '필수 정보가 누락되었습니다.' },
        { status: 400 }
      );
    }

    // 런타임에서만 환경 변수 검증
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('Supabase 환경 변수가 설정되지 않았습니다.');
      return NextResponse.json(
        { error: '서버 설정 오류입니다.' },
        { status: 500 }
      );
    }

    // 런타임에서만 supabaseAdmin import
    const { supabaseAdmin } = await import('@/lib/supabase-admin');

    if (!supabaseAdmin) {
      console.error('Supabase Admin 클라이언트를 생성할 수 없습니다.');
      return NextResponse.json(
        { error: '서버 설정 오류입니다.' },
        { status: 500 }
      );
    }

    // 사용자 생성 또는 업데이트
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .upsert({
        id: userData.id,
        email: userData.email,
        username: userData.username || `user_${Date.now()}`,
        nickname: userData.nickname || '',
        region: userData.region || '',
        vehicle: userData.vehicle || '',
        phone: userData.phone || '',
        points: userData.points || 0,
        total_deliveries: userData.total_deliveries || 0,
        total_earnings: userData.total_earnings || 0,
        profile_image: userData.profile_image || null,
        referral_code: userData.referral_code || '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'id',
        ignoreDuplicates: false
      })
      .select()
      .single();

    if (error) {
      console.error('사용자 생성 오류:', error);
      throw error;
    }

    return NextResponse.json(user, {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      }
    });

  } catch (error) {
    console.error('사용자 생성 실패:', error);
    return NextResponse.json(
      { error: '사용자 생성 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 
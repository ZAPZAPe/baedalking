import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  try {
    const { code, newUserId } = await request.json();

    if (!code || !newUserId) {
      return NextResponse.json(
        { error: '초대 코드와 사용자 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    // 서버 사이드에서 사용할 수 있는 service role 클라이언트 생성
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 초대 코드로 초대자 찾기 (users 테이블에서)
    const { data: inviter, error: codeError } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('referral_code', code)
      .single();

    if (codeError || !inviter) {
      return NextResponse.json(
        { error: '유효하지 않은 초대 코드입니다.' },
        { status: 400 }
      );
    }

    // 자기 자신의 코드는 사용할 수 없음
    if (inviter.id === newUserId) {
      return NextResponse.json(
        { error: '자신의 초대 코드는 사용할 수 없습니다.' },
        { status: 400 }
      );
    }

    // 이미 사용된 코드인지 확인
    const { data: existingInvite } = await supabaseAdmin
      .from('invites')
      .select('id')
      .eq('invite_code', code)
      .eq('invited_user_id', newUserId)
      .single();

    if (existingInvite) {
      return NextResponse.json(
        { error: '이미 사용된 초대 코드입니다.' },
        { status: 400 }
      );
    }

    // 초대 기록 저장
    const { error: recordError } = await supabaseAdmin
      .from('invites')
      .insert({
        inviter_id: inviter.id,
        invited_user_id: newUserId,
        invite_code: code,
        created_at: new Date().toISOString(),
      });

    if (recordError) throw recordError;

    // 초대자 포인트 지급 (500P)
    const inviterResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/points/add`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: inviter.id,
        amount: 500,
        reason: 'friend_invite',
        description: '친구 초대 보상'
      }),
    });

    if (!inviterResponse.ok) {
      throw new Error('초대자 포인트 지급 실패');
    }

    // 초대받은 사용자 포인트 지급 (300P)
    const invitedResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/points/add`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: newUserId,
        amount: 300,
        reason: 'invite_used',
        description: '초대 코드 사용 보상'
      }),
    });

    if (!invitedResponse.ok) {
      throw new Error('초대받은 사용자 포인트 지급 실패');
    }

    return NextResponse.json({
      success: true,
      inviterPoints: 500,
      invitedPoints: 300
    });
  } catch (error) {
    console.error('초대 코드 검증 실패:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '초대 코드 처리 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 
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

    // 환경 변수 검증
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl) {
      console.error('NEXT_PUBLIC_SUPABASE_URL이 설정되지 않았습니다.');
      return NextResponse.json(
        { error: 'Supabase URL이 설정되지 않았습니다.' },
        { status: 500 }
      );
    }

    if (!supabaseServiceKey) {
      console.error('SUPABASE_SERVICE_ROLE_KEY가 설정되지 않았습니다.');
      return NextResponse.json(
        { error: 'Supabase 서비스 키가 설정되지 않았습니다.' },
        { status: 500 }
      );
    }

    // 서버 사이드에서 사용할 수 있는 service role 클라이언트 생성
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

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
    // 1. point_history 테이블에 기록 추가
    const { error: inviterHistoryError } = await supabaseAdmin
      .from('point_history')
      .insert({
        user_id: inviter.id,
        points: 500,
        point_type: 'invite',
        reason: '친구 초대 보상'
      });

    if (inviterHistoryError) throw new Error('초대자 포인트 기록 실패');

    // 2. 초대자 포인트 업데이트
    const { data: inviterData, error: inviterUserError } = await supabaseAdmin
      .from('users')
      .select('points')
      .eq('id', inviter.id)
      .single();

    if (inviterUserError) throw new Error('초대자 정보 조회 실패');

    const inviterNewPoints = (inviterData.points || 0) + 500;

    const { error: inviterUpdateError } = await supabaseAdmin
      .from('users')
      .update({ points: inviterNewPoints })
      .eq('id', inviter.id);

    if (inviterUpdateError) throw new Error('초대자 포인트 업데이트 실패');

    // 초대받은 사용자 포인트 지급 (300P)
    // 1. point_history 테이블에 기록 추가
    const { error: invitedHistoryError } = await supabaseAdmin
      .from('point_history')
      .insert({
        user_id: newUserId,
        points: 300,
        point_type: 'invite',
        reason: '초대 코드 사용 보상'
      });

    if (invitedHistoryError) throw new Error('초대받은 사용자 포인트 기록 실패');

    // 2. 초대받은 사용자 포인트 업데이트
    const { data: invitedData, error: invitedUserError } = await supabaseAdmin
      .from('users')
      .select('points')
      .eq('id', newUserId)
      .single();

    if (invitedUserError) throw new Error('초대받은 사용자 정보 조회 실패');

    const invitedNewPoints = (invitedData.points || 0) + 300;

    const { error: invitedUpdateError } = await supabaseAdmin
      .from('users')
      .update({ points: invitedNewPoints })
      .eq('id', newUserId);

    if (invitedUpdateError) throw new Error('초대받은 사용자 포인트 업데이트 실패');

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
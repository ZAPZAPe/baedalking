import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { code, newUserId } = await request.json();

    console.log('🔍 초대 코드 검증 요청:', { code, newUserId });

    if (!code || !newUserId) {
      return NextResponse.json(
        { error: '초대 코드와 사용자 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    // 런타임에서만 환경 변수 검증
    console.log('🔧 환경 변수 상태:');
    console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ 설정됨' : '❌ 누락됨');
    console.log('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ 설정됨' : '❌ 누락됨');

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('❌ Supabase 환경 변수가 설정되지 않았습니다.');
      return NextResponse.json(
        { error: '서버 설정 오류입니다.' },
        { status: 500 }
      );
    }

    // 런타임에서만 supabaseAdmin import
    const { supabaseAdmin } = await import('@/lib/supabase-admin');

    if (!supabaseAdmin) {
      console.error('❌ Supabase Admin 클라이언트를 생성할 수 없습니다.');
      return NextResponse.json(
        { error: '서버 설정 오류입니다.' },
        { status: 500 }
      );
    }

    console.log('✅ Supabase Admin 클라이언트 생성 성공');

    // 초대 코드로 초대자 찾기 (users 테이블에서)
    console.log('🔍 초대 코드로 초대자 검색 중:', code);
    const { data: inviter, error: codeError } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('referral_code', code)
      .single();

    console.log('🔍 초대자 검색 결과:', { inviter, codeError });

    if (codeError || !inviter) {
      console.log('❌ 초대 코드 검증 실패:', codeError);
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
    console.log('🔍 중복 초대 확인 중...');
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

    console.log('✅ 초대 코드 검증 완료, 포인트 지급 시작...');

    // 초대 기록 저장
    const { error: recordError } = await supabaseAdmin
      .from('invites')
      .insert({
        inviter_id: inviter.id,
        invited_user_id: newUserId,
        invite_code: code,
        created_at: new Date().toISOString(),
      });

    if (recordError) {
      console.error('❌ 초대 기록 저장 실패:', recordError);
      throw recordError;
    }

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

    if (inviterHistoryError) {
      console.error('초대자 포인트 기록 실패:', inviterHistoryError);
      throw new Error('초대자 포인트 기록 실패');
    }

    // 2. 초대자 포인트 업데이트
    const { data: inviterData, error: inviterUserError } = await supabaseAdmin
      .from('users')
      .select('points')
      .eq('id', inviter.id)
      .single();

    if (inviterUserError) {
      console.error('초대자 정보 조회 실패:', inviterUserError);
      throw new Error('초대자 정보 조회 실패');
    }

    const inviterNewPoints = (inviterData.points || 0) + 500;

    const { error: inviterUpdateError } = await supabaseAdmin
      .from('users')
      .update({ points: inviterNewPoints })
      .eq('id', inviter.id);

    if (inviterUpdateError) {
      console.error('초대자 포인트 업데이트 실패:', inviterUpdateError);
      throw new Error('초대자 포인트 업데이트 실패');
    }

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

    if (invitedHistoryError) {
      console.error('초대받은 사용자 포인트 기록 실패:', invitedHistoryError);
      throw new Error('초대받은 사용자 포인트 기록 실패');
    }

    // 2. 초대받은 사용자 포인트 업데이트
    const { data: invitedData, error: invitedUserError } = await supabaseAdmin
      .from('users')
      .select('points')
      .eq('id', newUserId)
      .single();

    if (invitedUserError) {
      console.error('초대받은 사용자 정보 조회 실패:', invitedUserError);
      throw new Error('초대받은 사용자 정보 조회 실패');
    }

    const invitedNewPoints = (invitedData.points || 0) + 300;

    // 초대받은 사용자의 포인트 업데이트 + referred_by 필드 설정
    const { error: invitedUpdateError } = await supabaseAdmin
      .from('users')
      .update({ 
        points: invitedNewPoints,
        referred_by: inviter.id // 추천인 관계 저장
      })
      .eq('id', newUserId);

    if (invitedUpdateError) {
      console.error('초대받은 사용자 포인트 업데이트 실패:', invitedUpdateError);
      throw new Error('초대받은 사용자 포인트 업데이트 실패');
    }

    console.log('✅ 초대 코드 검증 및 포인트 지급 완료');
    console.log(`📊 초대자(${inviter.id}): +500P, 초대받은 사용자(${newUserId}): +300P`);

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
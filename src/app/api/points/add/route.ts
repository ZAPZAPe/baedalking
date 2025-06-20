import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  try {
    const { userId, points, reason } = await request.json();

    if (!userId || !points || !reason) {
      return NextResponse.json(
        { error: '필수 정보가 누락되었습니다.' },
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
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false },
      global: {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      }
    });

    // 1. point_history 테이블에 기록 추가
    const { error: historyError } = await supabaseAdmin
      .from('point_history')
      .insert({
        user_id: userId,
        points: points,
        reason: reason
      });

    if (historyError) throw historyError;

    // 2. users 테이블의 포인트 업데이트
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('points')
      .eq('id', userId)
      .single();

    if (userError) throw userError;

    const newPoints = (userData.points || 0) + points;

    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({ points: newPoints })
      .eq('id', userId);

    if (updateError) throw updateError;

    return NextResponse.json({ 
      success: true, 
      newPoints,
      message: `${reason} ${points > 0 ? '+' : ''}${points}P` 
    });
  } catch (error) {
    console.error('포인트 추가 오류:', error);
    return NextResponse.json(
      { error: '포인트 추가 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 
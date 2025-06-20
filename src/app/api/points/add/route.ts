import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  try {
    const { userId, amount, reason, description } = await request.json();

    if (!userId || !amount || !reason || !description) {
      return NextResponse.json(
        { error: '필수 파라미터가 누락되었습니다.' },
        { status: 400 }
      );
    }

    // 서버 사이드에서 사용할 수 있는 service role 클라이언트 생성
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 1. point_history 테이블에 기록 추가
    const { error: historyError } = await supabaseAdmin
      .from('point_history')
      .insert({
        user_id: userId,
        points: amount,
        reason: description
      });

    if (historyError) throw historyError;

    // 2. users 테이블의 포인트 업데이트
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('points')
      .eq('id', userId)
      .single();

    if (userError) throw userError;

    const newPoints = (userData.points || 0) + amount;

    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({ points: newPoints })
      .eq('id', userId);

    if (updateError) throw updateError;

    return NextResponse.json({ 
      success: true, 
      newPoints,
      message: `${description} ${amount > 0 ? '+' : ''}${amount}P` 
    });
  } catch (error) {
    console.error('포인트 추가 오류:', error);
    return NextResponse.json(
      { error: '포인트 추가 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 
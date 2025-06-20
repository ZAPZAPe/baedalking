import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  try {
    const { nickname, currentUserId } = await request.json();

    if (!nickname) {
      return NextResponse.json(
        { error: '닉네임이 필요합니다.' },
        { status: 400 }
      );
    }

    // 서버 사이드에서 사용할 수 있는 service role 클라이언트 생성
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 현재 사용자를 제외하고 닉네임 중복 검사
    let query = supabaseAdmin
      .from('users')
      .select('id')
      .eq('nickname', nickname);

    // 현재 사용자 ID가 있으면 해당 사용자는 제외
    if (currentUserId) {
      query = query.neq('id', currentUserId);
    }

    const { data, error } = await query.single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    const isAvailable = !data;

    return NextResponse.json({ isAvailable });
  } catch (error) {
    console.error('닉네임 확인 오류:', error);
    return NextResponse.json(
      { error: '닉네임 확인 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const nickname = searchParams.get('nickname');
    const currentUserId = searchParams.get('currentUserId');

    if (!nickname) {
      return NextResponse.json(
        { error: '닉네임이 필요합니다.', available: false },
        { 
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache'
          }
        }
      );
    }

    // 런타임에서만 환경 변수 검증
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('Supabase 환경 변수가 설정되지 않았습니다.');
      return NextResponse.json(
        { error: '서버 설정 오류입니다.', available: false },
        { 
          status: 500,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
    }

    // 런타임에서만 supabaseAdmin import
    const { supabaseAdmin } = await import('../../../lib/supabase-admin');

    if (!supabaseAdmin) {
      console.error('Supabase Admin 클라이언트를 생성할 수 없습니다.');
      return NextResponse.json(
        { error: '서버 설정 오류입니다.', available: false },
        { 
          status: 500,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
    }

    // 현재 사용자를 제외하고 닉네임 중복 검사
    let query = supabaseAdmin
      .from('users')
      .select('id')
      .eq('nickname', nickname);

    // 현재 사용자 ID가 있으면 해당 사용자는 제외
    if (currentUserId) {
      query = query.neq('id', currentUserId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('닉네임 확인 쿼리 오류:', error);
      throw error;
    }

    const available = !data || data.length === 0;

    return NextResponse.json({ 
      available,
      message: available ? '사용 가능한 닉네임입니다.' : '이미 사용 중인 닉네임입니다.'
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      }
    });
  } catch (error) {
    console.error('닉네임 확인 오류:', error);
    return NextResponse.json(
      { error: '닉네임 확인 중 오류가 발생했습니다.', available: false },
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  }
}

export async function POST(request: Request) {
  try {
    console.log('🔍 POST /api/check-nickname 요청 시작');
    const { nickname, currentUserId } = await request.json();
    console.log('📝 요청 데이터:', { nickname, currentUserId });

    if (!nickname) {
      return NextResponse.json(
        { error: '닉네임이 필요합니다.', available: false },
        { 
          status: 400,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
    }

    // 런타임에서만 환경 변수 검증
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('Supabase 환경 변수가 설정되지 않았습니다.');
      return NextResponse.json(
        { error: '서버 설정 오류입니다.', available: false },
        { 
          status: 500,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
    }

    // 런타임에서만 supabaseAdmin import
    const { supabaseAdmin } = await import('../../../lib/supabase-admin');

    if (!supabaseAdmin) {
      console.error('Supabase Admin 클라이언트를 생성할 수 없습니다.');
      return NextResponse.json(
        { error: '서버 설정 오류입니다.', available: false },
        { 
          status: 500,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
    }

    // 현재 사용자를 제외하고 닉네임 중복 검사
    let query = supabaseAdmin
      .from('users')
      .select('id')
      .eq('nickname', nickname);

    // 현재 사용자 ID가 있으면 해당 사용자는 제외
    if (currentUserId) {
      query = query.neq('id', currentUserId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('닉네임 확인 쿼리 오류:', error);
      throw error;
    }

    const available = !data || data.length === 0;

    return NextResponse.json({ 
      available,
      message: available ? '사용 가능한 닉네임입니다.' : '이미 사용 중인 닉네임입니다.'
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      }
    });
  } catch (error) {
    console.error('닉네임 확인 오류:', error);
    return NextResponse.json(
      { error: '닉네임 확인 중 오류가 발생했습니다.', available: false },
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  }
} 
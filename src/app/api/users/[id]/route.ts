import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    if (!id) {
      return NextResponse.json(
        { error: '사용자 ID가 필요합니다.' },
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

    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: '사용자를 찾을 수 없습니다.' },
          { status: 404 }
        );
      }
      console.error('사용자 조회 오류:', error);
      throw error;
    }

    return NextResponse.json(user, {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      }
    });

  } catch (error) {
    console.error('사용자 조회 실패:', error);
    return NextResponse.json(
      { error: '사용자 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const updateData = await request.json();
    
    if (!id) {
      return NextResponse.json(
        { error: '사용자 ID가 필요합니다.' },
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

    // updated_at 자동 설정
    const finalUpdateData = {
      ...updateData,
      updated_at: new Date().toISOString()
    };

    const { data: updatedUser, error } = await supabaseAdmin
      .from('users')
      .update(finalUpdateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('사용자 업데이트 실패:', error);
      return NextResponse.json(
        { error: '사용자 업데이트에 실패했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json(updatedUser);
  } catch (error: any) {
    console.error('사용자 업데이트 실패:', error);
    return NextResponse.json(
      { error: '사용자 업데이트에 실패했습니다.' },
      { status: 500 }
    );
  }
} 
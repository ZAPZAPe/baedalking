import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const { nickname } = await request.json();

    if (!nickname) {
      return NextResponse.json(
        { error: '닉네임이 필요합니다.' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('users')
      .select('id')
      .eq('nickname', nickname)
      .single();

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
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// 특정 감정표현 조회
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ emotionId: string }> }
) {
  const { emotionId } = await params
  try {
    const { data: emotion, error } = await supabase
      .from('shop_items')
      .select('*')
      .eq('id', emotionId)
      .eq('category', '캐릭터')
      .eq('sub_category', '감정표현')
      .single()
    
    if (error) {
      return NextResponse.json({ error: '감정표현을 찾을 수 없습니다.' }, { status: 404 })
    }
    
    return NextResponse.json({ emotion })
  } catch (error) {
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}

// 감정표현 업데이트
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ emotionId: string }> }
) {
  const { emotionId } = await params
  try {
    const body = await request.json()
    const {
      name,
      description,
      image_url,
      price,
      is_active
    } = body
    
    const { data: emotion, error } = await supabase
      .from('shop_items')
      .update({
        name,
        description: description || '',
        image_url,
        price,
        is_active: is_active !== undefined ? is_active : true,
        updated_at: new Date().toISOString()
      })
      .eq('id', emotionId)
      .select()
      .single()
    
    if (error) {
      return NextResponse.json({ error: '감정표현을 업데이트할 수 없습니다.' }, { status: 500 })
    }
    
    return NextResponse.json({ emotion })
  } catch (error) {
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}

// 감정표현 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ emotionId: string }> }
) {
  const { emotionId } = await params
  try {
    const { error } = await supabase
      .from('shop_items')
      .delete()
      .eq('id', emotionId)
      .eq('category', '캐릭터')
      .eq('sub_category', '감정표현')
    
    if (error) {
      return NextResponse.json({ error: '감정표현을 삭제할 수 없습니다.' }, { status: 500 })
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}

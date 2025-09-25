import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// 특정 캐릭터 조회
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ characterId: string }> }
) {
  const { characterId } = await params
  try {
    const { data: character, error } = await supabase
      .from('shop_items')
      .select('*')
      .eq('id', characterId)
      .eq('category', '캐릭터')
      .eq('sub_category', '캐릭터')
      .single()
    
    if (error) {
      return NextResponse.json({ error: '캐릭터를 찾을 수 없습니다.' }, { status: 404 })
    }
    
    return NextResponse.json({ character })
  } catch (error) {
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}

// 캐릭터 업데이트
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ characterId: string }> }
) {
  const { characterId } = await params
  try {
    const body = await request.json()
    const {
      name,
      description,
      image_url,
      pixel_data,
      price,
      is_active,
      animation_images
    } = body
    
    // pixel_data에 애니메이션 이미지 정보 포함
    const updatedPixelData = {
      ...pixel_data,
      ...(animation_images && { animation_images })
    }
    
    const { data: character, error } = await supabase
      .from('shop_items')
      .update({
        name,
        description: description || '',
        image_url,
        pixel_data: updatedPixelData,
        price,
        is_active: is_active !== undefined ? is_active : true,
        updated_at: new Date().toISOString()
      })
      .eq('id', characterId)
      .select()
      .single()
    
    if (error) {
      return NextResponse.json({ error: '캐릭터를 업데이트할 수 없습니다.' }, { status: 500 })
    }
    
    return NextResponse.json({ character })
  } catch (error) {
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}

// 캐릭터 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ characterId: string }> }
) {
  const { characterId } = await params
  try {
    const { error } = await supabase
      .from('shop_items')
      .delete()
      .eq('id', characterId)
      .eq('category', '캐릭터')
      .eq('sub_category', '캐릭터')
    
    if (error) {
      return NextResponse.json({ error: '캐릭터를 삭제할 수 없습니다.' }, { status: 500 })
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}

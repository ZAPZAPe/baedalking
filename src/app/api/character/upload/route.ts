import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const image = formData.get('image') as File
    const userId = formData.get('userId') as string

    if (!image || !userId) {
      return NextResponse.json(
        { error: '이미지와 사용자 ID가 필요합니다' },
        { status: 400 }
      )
    }

    // Supabase Storage에 이미지 업로드
    const fileName = `character_${userId}_${Date.now()}.png`
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('character-images')
      .upload(fileName, image, {
        contentType: 'image/png',
        upsert: false
      })

    if (uploadError) {
      console.error('이미지 업로드 오류:', uploadError)
      return NextResponse.json(
        { error: '이미지 업로드 실패' },
        { status: 500 }
      )
    }

    // 공개 URL 생성
    const { data: urlData } = supabase.storage
      .from('character-images')
      .getPublicUrl(fileName)

    const imageUrl = urlData.publicUrl

    // 데이터베이스에 캐릭터 이미지 URL 저장
    const { error: dbError } = await supabase
      .from('character_data')
      .upsert({
        user_id: userId,
        image_url: imageUrl,
        updated_at: new Date().toISOString()
      })

    if (dbError) {
      console.error('데이터베이스 저장 오류:', dbError)
      return NextResponse.json(
        { error: '캐릭터 데이터 저장 실패' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      imageUrl,
      fileName
    })

  } catch (error) {
    console.error('캐릭터 업로드 API 오류:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}

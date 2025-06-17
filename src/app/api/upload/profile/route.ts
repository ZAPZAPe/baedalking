import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('image') as File;
    
    if (!file) {
      return NextResponse.json(
        { error: '이미지 파일이 없습니다.' },
        { status: 400 }
      );
    }

    // 파일 타입 검증
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: '이미지 파일만 업로드 가능합니다.' },
        { status: 400 }
      );
    }

    // 파일 크기 검증 (5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: '이미지 크기는 5MB를 초과할 수 없습니다.' },
        { status: 400 }
      );
    }

    // 파일을 Base64로 변환
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = buffer.toString('base64');
    const mimeType = file.type;
    
    // Data URL 형식으로 반환
    const imageUrl = `data:${mimeType};base64,${base64}`;
    
    return NextResponse.json({ imageUrl });
  } catch (error) {
    console.error('이미지 업로드 에러:', error);
    return NextResponse.json(
      { error: '이미지 업로드에 실패했습니다.', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 
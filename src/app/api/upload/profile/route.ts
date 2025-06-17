import { NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';

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

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // 파일명 생성 (UUID + 원본 확장자)
    const fileExtension = file.name.split('.').pop();
    const fileName = `${uuidv4()}.${fileExtension}`;
    
    // public/profiles 디렉토리에 저장
    const uploadDir = join(process.cwd(), 'public', 'profiles');
    const filePath = join(uploadDir, fileName);
    
    await writeFile(filePath, buffer);

    // 이미지 URL 반환
    const imageUrl = `/profiles/${fileName}`;
    
    return NextResponse.json({ imageUrl });
  } catch (error) {
    console.error('이미지 업로드 에러:', error);
    return NextResponse.json(
      { error: '이미지 업로드에 실패했습니다.' },
      { status: 500 }
    );
  }
} 
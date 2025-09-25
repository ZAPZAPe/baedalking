import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const category = formData.get('category') as string

    if (!file) {
      return NextResponse.json({ error: '파일이 선택되지 않았습니다.' }, { status: 400 })
    }

    // 파일 유효성 검사
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'PNG, JPG, JPEG 파일만 업로드 가능합니다.' }, { status: 400 })
    }

    // 파일 크기 제한 (5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: '파일 크기는 5MB 이하여야 합니다.' }, { status: 400 })
    }

    // 파일명 생성 (타임스탬프 + 원본 파일명)
    const timestamp = Date.now()
    const fileName = `${timestamp}_${file.name}`
    
    // 카테고리별 저장 경로 설정
    let uploadDir = ''
    if (category === 'emotion') {
      uploadDir = path.join(process.cwd(), 'public', 'Garage', 'Character', 'Emotion')
    } else if (category === 'character') {
      uploadDir = path.join(process.cwd(), 'public', 'Garage', 'Character')
    } else if (category === 'interior') {
      uploadDir = path.join(process.cwd(), 'public', 'uploads', 'interior')
    } else {
      uploadDir = path.join(process.cwd(), 'public', 'uploads')
    }

    // 디렉토리 생성 (존재하지 않는 경우)
    try {
      await mkdir(uploadDir, { recursive: true })
    } catch (error) {
    }

    // 파일 저장
    const filePath = path.join(uploadDir, fileName)
    const bytes = await file.arrayBuffer()
    await writeFile(filePath, Buffer.from(bytes))

    // 웹에서 접근 가능한 경로 생성
    let imagePath = ''
    if (category === 'emotion') {
      imagePath = `/Garage/Character/Emotion/${fileName}`
    } else if (category === 'character') {
      imagePath = `/Garage/Character/${fileName}`
    } else if (category === 'interior') {
      imagePath = `/uploads/interior/${fileName}`
    } else {
      imagePath = `/uploads/${fileName}`
    }

    return NextResponse.json({ 
      success: true, 
      imagePath,
      fileName,
      originalName: file.name,
      size: file.size
    })

  } catch (error) {
    return NextResponse.json({ error: '이미지 업로드 중 오류가 발생했습니다.' }, { status: 500 })
  }
}

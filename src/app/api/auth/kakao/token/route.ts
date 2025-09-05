import { NextRequest, NextResponse } from 'next/server'

// prerender 방지를 위한 설정
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const { code } = await request.json()

    if (!code) {
      return NextResponse.json(
        { error: '인증 코드가 필요합니다.' },
        { status: 400 }
      )
    }

    // 환경변수 검증
    const clientId = process.env.NEXT_PUBLIC_KAKAO_CLIENT_ID
    const redirectUri = process.env.NEXT_PUBLIC_KAKAO_REDIRECT_URI
    
    if (!clientId || !redirectUri) {
      console.error('카카오 환경변수 누락:', { clientId: !!clientId, redirectUri: !!redirectUri })
      return NextResponse.json(
        { error: '카카오 설정이 올바르지 않습니다.' },
        { status: 500 }
      )
    }

    console.log('카카오 토큰 요청:', { clientId, redirectUri, code: code.substring(0, 10) + '...' })

    // 카카오 액세스 토큰 획득
    const tokenResponse = await fetch('https://kauth.kakao.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: clientId,
        redirect_uri: redirectUri,
        code,
      }),
    })

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text()
      console.error('카카오 토큰 응답 오류:', errorData)
      return NextResponse.json(
        { error: `카카오 토큰 획득에 실패했습니다. 상세: ${errorData}` },
        { status: 400 }
      )
    }

    const tokenData = await tokenResponse.json()

    return NextResponse.json({
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      expires_in: tokenData.expires_in,
    })

  } catch (error) {
    console.error('카카오 토큰 API 오류:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

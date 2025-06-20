# 환경 변수 설정 가이드

## 필수 환경 변수

이 프로젝트를 실행하기 위해서는 다음 환경 변수들이 설정되어야 합니다.

### .env.local 파일 생성

프로젝트 루트 디렉토리에 `.env.local` 파일을 생성하고 다음 내용을 추가하세요:

```bash
# Supabase 설정 (필수)
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# 카카오 API 설정 (필수)
NEXT_PUBLIC_KAKAO_APP_KEY=your-kakao-app-key

# NextAuth 설정 (선택사항)
NEXTAUTH_SECRET=your-nextauth-secret
NEXTAUTH_URL=http://localhost:3000

# 디버깅 설정 (선택사항)
NEXT_PUBLIC_SUPABASE_DEBUG=true
NODE_ENV=development
```

## 환경 변수 설명

### Supabase 설정

1. **NEXT_PUBLIC_SUPABASE_URL**: Supabase 프로젝트 URL
   - Supabase 대시보드 > Settings > API에서 확인 가능

2. **NEXT_PUBLIC_SUPABASE_ANON_KEY**: Supabase Anonymous Key
   - 클라이언트 사이드에서 사용되는 공개 키
   - Supabase 대시보드 > Settings > API에서 확인 가능

3. **SUPABASE_SERVICE_ROLE_KEY**: Supabase Service Role Key
   - 서버 사이드 API에서 사용되는 비밀 키
   - 관리자 권한이 필요한 작업에 사용
   - ⚠️ **보안 주의**: 이 키는 절대 클라이언트 사이드에 노출되어서는 안됩니다

### 카카오 API 설정

1. **NEXT_PUBLIC_KAKAO_APP_KEY**: 카카오 개발자 앱 키
   - 카카오 개발자 콘솔에서 발급받은 JavaScript 키

## 환경 변수 확인 방법

환경 변수가 올바르게 설정되었는지 확인하려면:

1. 개발 서버 시작: `npm run dev`
2. 브라우저 콘솔에서 오류 메시지 확인
3. 네트워크 탭에서 API 요청 상태 확인

## 문제 해결

### "supabaseKey is required" 오류
- `SUPABASE_SERVICE_ROLE_KEY`가 설정되지 않았거나 잘못된 경우
- `.env.local` 파일이 올바른 위치에 있는지 확인

### 406 오류 (Not Acceptable)
- API 요청의 Accept 헤더 문제
- 수정된 코드에서는 해결됨

### 400 오류 (Bad Request)
- Supabase 인증 설정 문제
- PKCE 플로우 설정으로 해결됨

## 보안 주의사항

1. `.env.local` 파일은 `.gitignore`에 포함되어 Git에 커밋되지 않도록 해야 합니다
2. `SUPABASE_SERVICE_ROLE_KEY`는 서버 사이드에서만 사용하세요
3. 프로덕션 환경에서는 환경 변수를 안전하게 관리하세요 
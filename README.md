# 배달왕 - 배달 라이더 랭킹 플랫폼

배달왕은 전국 배달 라이더들이 실적을 인증하고 경쟁할 수 있는 플랫폼입니다.

## 주요 기능

- 📸 배달 실적 캡처 업로드
- 🏆 실시간 랭킹 시스템
- 💰 포인트 리워드
- 👥 친구 초대 기능
- 📊 관리자 대시보드

## 설치 및 실행

### 1. 의존성 설치

```bash
npm install
```

### 2. 환경변수 설정

프로젝트 루트에 `.env.local` 파일을 생성하고 다음 내용을 추가하세요:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Kakao
NEXT_PUBLIC_KAKAO_APP_KEY=your_kakao_app_key
NEXT_PUBLIC_KAKAO_CLIENT_ID=your_kakao_client_id
NEXT_PUBLIC_KAKAO_CLIENT_SECRET=your_kakao_client_secret
NEXT_PUBLIC_KAKAO_REDIRECT_URI=http://localhost:3000/auth/kakao/callback

# 기타 설정
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Supabase 데이터베이스 설정

`supabase-schema.sql` 파일의 SQL을 Supabase 대시보드에서 실행하여 테이블을 생성하세요.

### 4. 개발 서버 실행

```bash
npm run dev
```

## 관리자 페이지 접속

### 1. 관리자 계정 설정

1. Supabase Auth에서 사용자를 생성합니다.
2. `users` 테이블에서 해당 사용자의 `role`을 `admin`으로 변경합니다.

### 2. 관리자 페이지 접속

1. `/admin-login` 페이지로 이동합니다.
2. 관리자 비밀번호를 입력합니다.
   - 기본 비밀번호: `admin1234`
3. 인증 성공 후 `/admin` 페이지로 자동 이동됩니다.

### 3. 관리자 비밀번호 변경

관리자 비밀번호를 변경하려면:

1. `src/app/admin-login/page.tsx` 파일을 엽니다.
2. 원하는 비밀번호를 SHA256으로 해시화합니다.
3. `ADMIN_PASSWORD_HASH` 값을 변경합니다.

예시:
```javascript
// 비밀번호를 'newpassword'로 변경하는 경우
const ADMIN_PASSWORD_HASH = crypto.SHA256('newpassword').toString();
```

## 주요 페이지

- `/` - 메인 페이지
- `/login` - 로그인
- `/profile-setup` - 회원가입
- `/upload` - 실적 업로드
- `/ranking` - 랭킹 확인
- `/store` - 포인트 상점
- `/admin-login` - 관리자 로그인
- `/admin` - 관리자 대시보드

## 기술 스택

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Image Analysis**: Tesseract.js
- **Social**: Kakao SDK

## 문제 해결

### 환경변수 오류

Supabase URL과 Anon Key가 설정되지 않았다는 오류가 발생하면:
1. `.env.local` 파일이 프로젝트 루트에 있는지 확인
2. 환경변수 이름이 정확한지 확인
3. 개발 서버를 재시작

### 관리자 페이지 접속 불가

1. 사용자의 `role`이 `admin`인지 확인
2. 관리자 비밀번호가 올바른지 확인
3. 세션 스토리지를 확인 (개발자 도구 > Application > Session Storage)

## 라이선스

This project is proprietary software. 
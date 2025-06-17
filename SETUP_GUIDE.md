# 배달왕 프로젝트 설정 가이드

## 필수 환경 설정

### 1. 환경변수 설정 (.env.local)

프로젝트 루트에 `.env.local` 파일을 생성하고 다음 내용을 입력하세요:

```env
# Supabase 설정 (필수)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Kakao API 설정 (선택)
NEXT_PUBLIC_KAKAO_APP_KEY=your_kakao_app_key
NEXT_PUBLIC_KAKAO_CLIENT_ID=your_kakao_client_id
NEXT_PUBLIC_KAKAO_CLIENT_SECRET=your_kakao_client_secret
NEXT_PUBLIC_KAKAO_REDIRECT_URI=http://localhost:3000/auth/kakao/callback

# Kakao 알림톡 설정 (선택)
KAKAO_API_KEY=your_kakao_api_key
KAKAO_SENDER_KEY=your_kakao_sender_key
KAKAO_TEMPLATE_CODE=your_template_code
KAKAO_API_URL=https://kapi.kakao.com/v2/api/talk/memo/default/send

# 앱 설정
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 2. Supabase 설정

#### 2.1 Supabase 프로젝트 생성
1. [Supabase](https://supabase.com)에서 새 프로젝트 생성
2. Project Settings > API에서 URL과 anon key 복사

#### 2.2 데이터베이스 테이블 생성
1. Supabase SQL Editor에서 `supabase-schema.sql` 파일의 내용 실행
2. 기존 프로젝트인 경우 `migration-add-role.sql` 추가 실행

#### 2.3 Authentication 설정
1. Authentication > Providers에서 Email 활성화
2. (선택) Kakao OAuth 설정 추가

### 3. 관리자 계정 설정

#### 3.1 관리자 사용자 생성
1. Supabase Authentication에서 새 사용자 생성
2. SQL Editor에서 다음 쿼리 실행:
```sql
UPDATE users 
SET role = 'admin' 
WHERE email = '관리자이메일@example.com';
```

#### 3.2 관리자 페이지 접속
1. `/admin-login` 접속
2. 비밀번호 입력: `admin1234`
3. 인증 후 `/admin` 페이지로 자동 이동

## 주요 기능 확인사항

### 1. 이미지 업로드 기능
- Tesseract.js를 사용한 OCR 기능이 자동으로 작동
- 배민커넥트, 쿠팡이츠 스크린샷 자동 분석

### 2. 포인트 시스템
- 회원가입 시 500P 자동 지급
- 매일 첫 업로드 시 100P 지급
- 랭킹 달성 시 추가 포인트

### 3. 알림 기능
- 실시간 알림 표시
- 포인트 획득, 랭킹 변동 등 자동 알림

### 4. 친구 초대
- 카카오톡 공유 기능
- 추천인 코드 시스템

## 트러블슈팅

### 1. Supabase 연결 오류
- 환경변수가 제대로 설정되었는지 확인
- `.env.local` 파일이 루트 디렉토리에 있는지 확인
- 개발 서버 재시작

### 2. 이미지 분석 오류
- 이미지가 선명한지 확인
- 올바른 화면을 캡처했는지 확인
- 네트워크 연결 상태 확인

### 3. 관리자 페이지 접속 불가
- 사용자 role이 'admin'으로 설정되었는지 확인
- 세션 스토리지 초기화 후 재시도
- 브라우저 캐시 삭제

## 개발 명령어

```bash
# 개발 서버 실행
npm run dev

# 프로덕션 빌드
npm run build

# 프로덕션 서버 실행
npm start

# 린트 검사
npm run lint
```

## 배포 가이드

### Vercel 배포 (추천)
1. GitHub 레포지토리 연결
2. 환경변수 설정 (Settings > Environment Variables)
3. 자동 배포 활성화

### 수동 배포
1. `npm run build` 실행
2. `.next` 폴더와 필요 파일 업로드
3. Node.js 서버에서 `npm start` 실행 
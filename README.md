# 배달킹 (Baedalking)

배달 기사들을 위한 수입 기록 및 소셜 앱입니다. OCR을 통한 수입 증명, 포인트 시스템, 친구 기능을 제공합니다.

## 🚀 주요 기능

- **OCR 기반 수입 검증**: 배민, 쿠팡이츠 스크린샷 자동 인식
- **포인트 시스템**: 검증된 수입에 따른 포인트 지급
- **캐릭터 커스터마이징**: 포인트로 의상 및 차고 장식 구매
- **소셜 기능**: 친구 추가, 차고 방문, 선물 교환
- **랭킹 시스템**: 전국, 지역, 친구별 수입 랭킹

## 🛠 기술 스택

- **Frontend**: Next.js 14, TypeScript, TailwindCSS
- **UI Components**: Shadcn UI
- **Backend**: Supabase (Auth, Database, Storage)
- **OCR**: Tesseract.js (클라이언트 사이드)
- **Deployment**: Vercel

## 📱 모바일 최적화

- 모바일 퍼스트 디자인
- 세로 화면에 최적화된 레이아웃
- 스크롤 없는 메인 화면 (뷰포트에 맞춤)

## 🚀 시작하기

### 1. 프로젝트 클론

```bash
git clone <repository-url>
cd baedalking
```

### 2. 의존성 설치

```bash
npm install
```

### 3. 환경 변수 설정

`.env.local` 파일을 생성하고 다음 내용을 추가하세요:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# OCR Configuration (향후 서버 사이드 OCR API용)
GOOGLE_VISION_API_KEY=your_google_vision_api_key
KAKAO_OCR_API_KEY=your_kakao_ocr_api_key
```

### 4. Supabase 설정

1. [Supabase](https://supabase.com)에서 새 프로젝트 생성
2. SQL Editor에서 `supabase/migrations/001_initial_schema.sql` 실행
3. Authentication > Settings에서 이메일 확인 비활성화 (개발용)

### 5. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)을 열어 확인하세요.

## 🗄 데이터베이스 스키마

### 주요 테이블

- **users**: 사용자 프로필 및 설정
- **earnings**: 수입 기록 및 OCR 검증 결과
- **points**: 포인트 적립/사용 내역
- **items**: 구매 가능한 아이템 (의상, 차고 장식)
- **user_items**: 사용자 소유 아이템
- **friends**: 친구 관계
- **visits**: 차고 방문 기록

### RLS (Row Level Security)

모든 테이블에 Row Level Security가 적용되어 사용자는 자신의 데이터만 접근할 수 있습니다.

## 🔍 OCR 시스템

### 현재 구현 (MVP)
- **Tesseract.js**: 클라이언트 사이드 OCR
- **이미지 전처리**: 그레이스케일 변환, 이진화
- **한국어 지원**: 한국어 + 영어 텍스트 인식
- **금액 추출**: 정규식을 통한 숫자 패턴 매칭

### 향후 확장 가능
- Google Vision API
- Kakao OCR API
- 서버 사이드 처리로 전환

## 📱 앱 구조

```
src/
├── app/                 # Next.js App Router
├── components/          # 재사용 가능한 컴포넌트
│   ├── ui/             # Shadcn UI 컴포넌트
│   ├── auth/           # 인증 관련 컴포넌트
│   └── ...             # 기능별 컴포넌트
├── hooks/               # 커스텀 훅
├── lib/                 # 유틸리티 및 설정
└── types/               # TypeScript 타입 정의
```

## 🎨 디자인 시스템

- **Retro Pixel Art**: 사이월드 미니홈피 스타일
- **모바일 퍼스트**: 세로 화면 최적화
- **TailwindCSS**: 유틸리티 퍼스트 CSS 프레임워크
- **Shadcn UI**: 재사용 가능한 컴포넌트 라이브러리

## 🚀 배포

### Vercel 배포

1. GitHub에 코드 푸시
2. [Vercel](https://vercel.com)에서 프로젝트 연결
3. 환경 변수 설정
4. 자동 배포 완료

### Supabase 설정

1. 프로덕션 환경 변수 설정
2. 데이터베이스 마이그레이션 실행
3. Storage 버킷 생성 및 권한 설정

## 🔧 개발 가이드

### 새 컴포넌트 추가

```bash
npx shadcn@latest add [component-name]
```

### 데이터베이스 마이그레이션

```sql
-- 새 마이그레이션 파일 생성
-- supabase/migrations/002_new_feature.sql
```

### 환경 변수 추가

1. `.env.local`에 변수 추가
2. `src/lib/supabase.ts`에서 타입 정의
3. 컴포넌트에서 사용

## 📋 TODO

- [ ] 이미지 업로드 (Supabase Storage)
- [ ] 친구 시스템 구현
- [ ] 랭킹 시스템 구현
- [ ] 아이템 상점 구현
- [ ] 선물 시스템 구현
- [ ] 푸시 알림
- [ ] 카카오톡 로그인 연동

## 🤝 기여하기

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다.

## 📞 문의

프로젝트에 대한 문의사항이 있으시면 이슈를 생성해 주세요.

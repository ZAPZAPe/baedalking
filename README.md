# 🛵 배달킹 (BaedalKing)

배달 기사들을 위한 수입 기록 및 소셜 커뮤니티 앱

## 📱 주요 기능

- **💰 수입 관리**: 일별/주별/월별 배달 수입 기록 및 통계
- **🎮 게이미피케이션**: 포인트 시스템, 레벨, 랭킹
- **👥 소셜 기능**: 친구 추가, 미니홈피, 방명록
- **🎨 커스터마이징**: 캐릭터, 차량, 배경 꾸미기
- **📊 통계 및 목표**: 수입 목표 설정 및 달성률 확인

## 🛠 기술 스택

- **Frontend**: Next.js 15.5, React 18, TypeScript
- **Styling**: Tailwind CSS, 픽셀아트 UI
- **Backend**: Supabase (PostgreSQL)
- **Auth**: Kakao OAuth 2.0
- **State**: React Hooks (useAppState)

## 📦 설치 및 실행

### 1. 환경 설정

```bash
# 프로젝트 클론
git clone https://github.com/yourusername/baedalking.git
cd baedalking

# 의존성 설치
npm install
```

### 2. 환경 변수 설정

`.env.local` 파일을 생성하고 다음 내용을 추가:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Kakao OAuth
NEXT_PUBLIC_KAKAO_CLIENT_ID=your_kakao_client_id
NEXT_PUBLIC_KAKAO_REDIRECT_URI=http://localhost:3001/auth/callback

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3001
```

### 3. 데이터베이스 설정

```bash
# Supabase CLI 설치 (선택사항)
npm install -g supabase

# 데이터베이스 마이그레이션 실행
npx supabase db push

# 또는 Supabase 대시보드에서 SQL 파일 직접 실행:
# - supabase/migrations/*.sql 파일들을 순서대로 실행
```

### 4. 개발 서버 실행

```bash
npm run dev
# http://localhost:3001 에서 확인
```

## 📱 주요 페이지

- `/` - 메인 대시보드
- `/login` - 카카오 로그인
- `/minihompy/[userId]` - 미니홈피
- `/shop` - 아이템 상점

## 🏗 프로젝트 구조

```
src/
├── app/                  # Next.js 앱 라우터
│   ├── api/             # API 라우트
│   ├── auth/            # 인증 관련
│   └── page.tsx         # 메인 페이지
├── components/          # React 컴포넌트
│   ├── layout/          # 레이아웃 컴포넌트
│   ├── modals/          # 모달 컴포넌트
│   ├── tabs/            # 탭 컴포넌트
│   └── ui/              # UI 컴포넌트
├── hooks/               # 커스텀 훅
│   ├── useAuth.tsx      # 인증 훅
│   └── useAppState.ts   # 전역 상태 관리
├── lib/                 # 유틸리티
│   ├── supabase.ts      # Supabase 클라이언트
│   └── database.ts      # DB 헬퍼 함수
└── types/               # TypeScript 타입 정의
```

## 🎨 디자인 시스템

### 픽셀 아트 UI 컴포넌트

- `PixelButton` - 픽셀 스타일 버튼
- `PixelCard` - 픽셀 스타일 카드
- `PixelModal` - 픽셀 스타일 모달
- `PixelInput` - 픽셀 스타일 입력 필드

### 색상 팔레트

- Primary: `#ffd93d` (황금색)
- Secondary: `#00d4ff` (하늘색)
- Success: `#00ff88` (초록색)
- Danger: `#ff6b6b` (빨간색)
- Info: `#9c88ff` (보라색)

## 🔒 보안

- Supabase RLS (Row Level Security) 적용
- 카카오 OAuth 인증
- 환경 변수를 통한 민감 정보 관리

## 📝 라이센스

MIT License

## 🤝 기여

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 💬 문의

프로젝트 관련 문의는 Issues 탭을 이용해주세요.
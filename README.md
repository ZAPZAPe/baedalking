# 🛵 배달킹 (BaedalKing)

배달 기사들을 위한 수입 기록 및 소셜 커뮤니티 앱

## 📱 주요 기능

- **💰 수입 관리**: 일별/주별/월별 배달 수입 기록 및 통계
- **🎮 게이미피케이션**: 박스 시스템, 레벨, 랭킹
- **👥 소셜 기능**: 친구 추가, 미니홈피, 방명록
- **🎨 커스터마이징**: 캐릭터, 차량, 배경 꾸미기
- **📊 통계 및 목표**: 수입 목표 설정 및 달성률 확인

## 🛠 기술 스택

- **Frontend**: Next.js 15.5, React 18, TypeScript
- **Styling**: Tailwind CSS, 픽셀아트 UI
- **Backend**: Supabase (PostgreSQL)
- **Auth**: Kakao OAuth 2.0
- **State**: React Hooks (useAppState)
- **Graphics**: PixiJS (3D 차고 꾸미기)

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

# 한국 기상청 API 키 (실시간 날씨 데이터용)
# https://www.data.go.kr/data/15084084/openapi.do 에서 발급받으세요
KMA_API_KEY=your_kma_api_key_here
```

### 3. 기상청 API 키 발급

실시간 날씨 데이터를 위해 한국 기상청 API 키가 필요합니다:

1. **기상청 공공데이터포털** 방문: https://www.data.go.kr/data/15084084/openapi.do
2. **초단기예보 API** 신청 (무료)
3. **인증키 발급** 후 `.env.local`에 추가:
   ```env
   KMA_API_KEY=발급받은_인증키
   ```

### 4. 데이터베이스 설정

```bash
# Supabase CLI 설치 (선택사항)
npm install -g supabase

# 데이터베이스 마이그레이션 실행
npx supabase db push

# 또는 Supabase 대시보드에서 SQL 파일 직접 실행:
# supabase/migrations/001_initial_database_setup.sql
```

### 5. 개발 서버 실행

```bash
npm run dev
# http://localhost:3001 에서 확인
```

## 📱 주요 페이지

- `/` - 메인 대시보드
- `/login` - 카카오 로그인
- `/garage/[userId]` - 미니홈피 (차고 꾸미기)
- `/shop` - 아이템 상점
- `/admin/*` - 관리자 페이지 (아이템 에디터)

## 🏗 프로젝트 구조

```
src/
├── app/                  # Next.js 앱 라우터
│   ├── api/             # API 라우트 (통합된 구조)
│   │   ├── shop-items/  # 통합 상점 아이템 API
│   │   ├── user-shop-inventory/ # 사용자 인벤토리 API
│   │   ├── character/   # 캐릭터 데이터 API
│   │   ├── earnings/    # 수입 기록 API
│   │   ├── boxes/       # 박스 시스템 API
│   │   ├── friends/     # 친구 관계 API
│   │   ├── guestbook/   # 방명록 API
│   │   └── users/       # 사용자 관리 API
│   ├── auth/            # 인증 관련
│   ├── garage/          # 미니홈피 페이지
│   ├── shop/            # 상점 페이지
│   └── admin/           # 관리자 페이지
├── components/          # React 컴포넌트
│   ├── layout/          # 레이아웃 컴포넌트
│   ├── features/        # 기능별 컴포넌트
│   │   ├── garage/      # 차고 관련
│   │   ├── income/      # 수입 관련
│   │   ├── ranking/     # 랭킹 관련
│   │   ├── friends/     # 친구 관련
│   │   └── profile/     # 프로필 관련
│   ├── decoration/      # 꾸미기 시스템
│   └── ui/              # UI 컴포넌트
├── hooks/               # 커스텀 훅
│   ├── useAuth.tsx      # 인증 훅
│   └── useAppState.ts   # 전역 상태 관리
├── lib/                 # 유틸리티
│   ├── supabase.ts      # Supabase 클라이언트
│   └── database.ts      # DB 헬퍼 함수
├── types/               # TypeScript 타입 정의
└── utils/               # 유틸리티 함수
```

## 🎮 박스 시스템

배달킹의 핵심 게이미피케이션 요소로, 배달원들이 수입을 기록할 때마다 박스를 획득할 수 있습니다.

### 박스 획득 방법
- **배달 수입 기록**: 1000원당 1박스 획득
- **미션 완료**: 추가 미션 수입에 따른 박스 지급
- **일일 출석**: 매일 로그인 시 박스 보너스

### 박스 사용 방법
- **아이템 구매**: 상점에서 캐릭터, 차량, 배경 등 구매
- **아이템 장착**: 구매한 아이템을 캐릭터에 장착하여 개성 표현
- **커스터마이징**: 개인만의 독특한 배달킹 캐릭터 만들기

## 🗄️ 데이터베이스 구조

### 핵심 테이블 (11개)

| 테이블명 | 설명 | 주요 용도 |
|----------|------|-----------|
| `users` | 사용자 기본 정보 | 회원가입, 프로필 관리 |
| `earnings` | 수입 기록 | 배달 수입 추적 |
| `box_transactions` | 박스 거래 내역 | 게임 화폐 시스템 |
| `shop_items` | 통합 상점 아이템 | 캐릭터 + 미니차고 아이템 |
| `user_inventory` | 사용자 인벤토리 | 구매한 아이템 보관 |
| `garage_placements` | 차고 배치 | 3D 아이템 배치 |
| `floor_tile_settings` | 바닥 타일 설정 | 차고 바닥 커스터마이징 |
| `character_data` | 캐릭터 데이터 | 아바타 커스터마이징 |
| `friendships` | 친구 관계 | 소셜 기능 |
| `guestbook_entries` | 방명록 | 미니홈피 방명록 |
| `visits` | 방문 기록 | 방문자 추적 |

### 주요 특징
- **통합 상점 시스템**: 캐릭터와 미니차고 아이템을 하나의 테이블로 관리
- **JSONB 활용**: 복잡한 설정 데이터를 효율적으로 저장
- **RLS 보안**: 사용자별 데이터 접근 권한 관리
- **성능 최적화**: 인덱스와 뷰를 통한 빠른 조회

## 🎨 꾸미기 시스템

### 캐릭터 커스터마이징
- **헤어**: 다양한 헤어 스타일
- **상의/하의**: 의상 아이템
- **감정**: 표정 변화
- **액세서리**: 추가 장식품

### 미니차고 꾸미기
- **운송수단**: 스쿠터, 자전거 등
- **인테리어**: 의자, 데스크, 냉장고 등
- **소품**: 식물, 장식품 등
- **바닥 타일**: 체크보드, 커스텀 패턴

### 3D 배치 시스템
- **PixiJS 기반**: 고성능 3D 렌더링
- **그리드 시스템**: 정확한 위치 배치
- **충돌 감지**: 아이템 간 겹침 방지
- **실시간 편집**: 드래그 앤 드롭으로 쉽게 배치

## 🔧 개발 가이드

### API 구조
- **RESTful 설계**: 일관된 API 엔드포인트
- **에러 핸들링**: 표준화된 에러 응답
- **타입 안전성**: TypeScript로 타입 보장
- **성능 최적화**: 필요한 데이터만 조회

### 상태 관리
- **useAppState**: 전역 상태 관리 훅
- **모달 시스템**: 중앙화된 모달 관리
- **로컬 상태**: 컴포넌트별 상태 분리
- **서버 상태**: Supabase 실시간 동기화

### 스타일링
- **Tailwind CSS**: 유틸리티 퍼스트 CSS
- **픽셀아트 UI**: 레트로 게임 스타일
- **반응형 디자인**: 모바일 우선 설계
- **다크 테마**: 눈에 편한 다크 모드

## 🚀 배포

### Vercel 배포
```bash
# Vercel CLI 설치
npm i -g vercel

# 배포
vercel --prod
```

### 환경 변수 설정
- Vercel 대시보드에서 환경 변수 설정
- Supabase 프로젝트 URL과 키 설정
- Kakao OAuth 설정

## 📝 라이선스

MIT License

## 🤝 기여하기

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📞 문의

- 이메일: contact@baedalking.com
- GitHub Issues: [이슈 등록](https://github.com/yourusername/baedalking/issues)

---

**배달킹**으로 더 재미있고 체계적으로 배달 수입을 관리해보세요! 🛵💨
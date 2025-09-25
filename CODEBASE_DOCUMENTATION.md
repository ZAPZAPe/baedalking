# 🚀 배달킹(Baedalking) 프로젝트 완전 분석 문서

## 📋 프로젝트 개요

**배달킹**은 배달 기사들을 위한 수입 기록 및 소셜 앱으로, Next.js 15와 TypeScript를 기반으로 구축된 풀스택 웹 애플리케이션입니다.

### 🎯 주요 기능
- 📊 수입 기록 및 분석 시스템
- 🏆 랭킹 및 등급 시스템  
- 👥 친구 및 소셜 기능
- 🎮 미니게임 (PixiJS 기반)
- 🏪 아이템 상점 및 구매 시스템
- 🏠 미니홈피 및 방명록
- 🎨 캐릭터 커스터마이징
- 🔧 관리자 도구

---

## 🏗️ 기술 스택

### Frontend
- **Next.js 15.5.0** - React 프레임워크
- **TypeScript 5** - 타입 안전성
- **Tailwind CSS 3.4.17** - 스타일링
- **PixiJS 8.0.0** - 2D 게임 엔진
- **React 18** - UI 라이브러리

### Backend
- **Supabase** - 백엔드 서비스 (PostgreSQL, Auth, Storage)
- **Next.js API Routes** - 서버 사이드 로직

### 개발 도구
- **ESLint** - 코드 품질 관리
- **PostCSS** - CSS 처리
- **Autoprefixer** - 브라우저 호환성

---

## 📁 프로젝트 구조

```
Baedalking/
├── 📁 public/                    # 정적 파일
│   ├── 🎨 assets/               # 게임 에셋
│   │   ├── character/           # 캐릭터 이미지
│   │   └── Garage/              # 게임 리소스
│   │       ├── Character/       # 캐릭터 스프라이트
│   │       ├── Item/            # 아이템 이미지
│   │       └── Tile/            # 타일맵 리소스
│   └── 🌐 로고 및 아이콘 파일들
├── 📁 src/
│   ├── 📁 app/                  # Next.js App Router
│   │   ├── 📁 admin/           # 관리자 페이지
│   │   ├── 📁 api/             # API 라우트
│   │   ├── 📁 auth/            # 인증 관련
│   │   ├── 📁 garage/          # 미니홈피 페이지
│   │   └── 📄 페이지 컴포넌트들
│   ├── 📁 components/           # React 컴포넌트
│   │   ├── 📁 auth/            # 인증 컴포넌트
│   │   ├── 📁 core/             # 핵심 컴포넌트
│   │   ├── 📁 features/        # 기능별 컴포넌트
│   │   ├── 📁 layout/          # 레이아웃 컴포넌트
│   │   ├── 📁 minigame/        # 게임 컴포넌트
│   │   ├── 📁 shared/          # 공유 컴포넌트
│   │   └── 📁 ui/              # UI 컴포넌트
│   ├── 📁 data/                 # 상수 및 데이터
│   ├── 📁 hooks/                # 커스텀 훅
│   ├── 📁 lib/                  # 라이브러리 및 유틸리티
│   │   └── 📁 minigame/        # 게임 엔진
│   ├── 📁 types/                # TypeScript 타입 정의
│   └── 📁 utils/                # 유틸리티 함수
├── 📁 supabase/                 # 데이터베이스 설정
│   ├── 📁 migrations/          # DB 마이그레이션
│   └── 📄 설정 파일들
└── 📄 프로젝트 설정 파일들
```

---

## 🗄️ 데이터베이스 스키마

### 핵심 테이블

#### 👤 users (사용자)
```sql
- id: UUID (PK)
- kakao_id: TEXT (UNIQUE)
- email: TEXT (UNIQUE)
- nickname: TEXT
- region: TEXT
- garage_intro: TEXT
- status_message: TEXT
- equipped_character_id: UUID (FK → shop_items)
- equipped_emotion_id: UUID (FK → shop_items)
- is_income_private: BOOLEAN
- goals: JSONB (목표 설정)
- total_visitors: INTEGER
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

#### 💰 earnings (수입 기록)
```sql
- id: UUID (PK)
- user_id: UUID (FK → users)
- platform: TEXT
- delivery_count: INTEGER
- delivery_amount: INTEGER
- mission_amount: INTEGER
- total_amount: INTEGER (GENERATED)
- date: DATE
- screenshot_url: TEXT
- screenshot_text: TEXT
- verified: BOOLEAN
- verified_score: FLOAT
- created_at: TIMESTAMP
```

#### 📦 box_transactions (박스 거래)
```sql
- id: UUID (PK)
- user_id: UUID (FK → users)
- amount: INTEGER
- type: 'earn' | 'spend'
- reason: TEXT
- related_earning_id: UUID (FK → earnings)
- created_at: TIMESTAMP
```

#### 🛍️ shop_items (상점 아이템)
```sql
- id: UUID (PK)
- name: TEXT
- description: TEXT
- category: TEXT ('캐릭터', '감정표현', '인테리어')
- sub_category: TEXT
- image_url: TEXT
- price: INTEGER
- is_active: BOOLEAN
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

#### 👥 friendships (친구 관계)
```sql
- id: UUID (PK)
- user_id: UUID (FK → users)
- friend_id: UUID (FK → users)
- status: 'pending' | 'accepted' | 'rejected'
- created_at: TIMESTAMP
```

#### 📝 guestbook_entries (방명록)
```sql
- id: UUID (PK)
- user_id: UUID (FK → users)
- visitor_id: UUID (FK → users)
- message: TEXT
- is_private: BOOLEAN
- created_at: TIMESTAMP
```

#### 🏠 visits (방문 기록)
```sql
- id: UUID (PK)
- visitor_id: UUID (FK → users)
- visited_user_id: UUID (FK → users)
- created_at: TIMESTAMP
```

---

## 🎮 미니게임 시스템

### 게임 엔진 아키텍처

#### MiniGameEngine.ts
- **역할**: PixiJS 기반 게임 엔진의 핵심 클래스
- **기능**:
  - 20×20 그리드 기반 월드 생성
  - 아이소메트릭 뷰 렌더링
  - 줌/패닝 컨트롤
  - 타일맵 로딩 및 렌더링
  - 게임 오브젝트 관리
  - 상호작용 이벤트 처리

#### SceneManager.ts
- **역할**: 게임 씬 전환 및 관리
- **기능**:
  - 미니차고 ↔ 마을 씬 전환
  - 상점 모달 관리
  - 캐릭터 및 아이템 시스템 연동
  - 사용자 인벤토리 관리

#### BaeminCharacter.ts
- **역할**: 플레이어 캐릭터 시스템
- **기능**:
  - 8방향 아이소메트릭 이동
  - 자연스러운 애니메이션 (1-2-3-2 패턴)
  - 감정표현 시스템
  - 그리드 기반 정확한 이동

### 게임 데이터 구조

#### 타일맵 시스템
```typescript
interface TilemapData {
  tiles: Array<{
    x: number
    y: number
    tileId: string  // 예: "basic_grass", "road_horizontal"
  }>
  size: { width: number, height: number }
}
```

#### 캐릭터 데이터
```typescript
interface Character {
  id: string
  position: Position3D
  direction: Direction  // 'N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'
  spriteId: string
  currentAnimation: AnimationState
  customization: CharacterCustomization
}
```

---

## 🛍️ 상점 시스템

### 아이템 카테고리
1. **캐릭터** - 플레이어 아바타
2. **감정표현** - 캐릭터 감정 표시
3. **인테리어** - 차고 꾸미기 아이템

### 구매 플로우
1. 상점에서 아이템 선택
2. 박스로 결제
3. 인벤토리에 추가
4. 게임에서 장착/배치

### 관리자 도구
- `/admin/character-shop` - 캐릭터/감정표현 관리
- `/admin/item-voxel-editor` - 복셀 아이템 에디터
- `/admin/tilemap-editor` - 타일맵 에디터

---

## 🔐 인증 시스템

### Supabase Auth
- **Kakao OAuth** 연동
- **이메일/비밀번호** 인증
- **JWT 토큰** 기반 세션 관리

### 사용자 플로우
1. 카카오 로그인
2. 프로필 설정 (닉네임, 지역)
3. 메인 앱 접근

---

## 📊 수입 관리 시스템

### 수입 기록 구조
```typescript
interface IncomeRecord {
  id: string
  platform: string        // 배달 플랫폼
  delivery_count: number  // 배달 건수
  delivery_amount: number // 배달 수입
  mission_amount: number  // 미션 수입
  total_amount: number    // 총 수입
  date: string           // 기록 날짜
  screenshot_url?: string // 스크린샷
  verified: boolean      // 검증 여부
}
```

### 박스 시스템
- 수입 기록 시 박스 획득
- 박스로 아이템 구매
- 거래 내역 추적

---

## 👥 소셜 기능

### 친구 시스템
- 친구 요청/수락/거절
- 친구 목록 관리
- 친구 프로필 조회

### 미니홈피
- 개인 차고 공개
- 방명록 작성/조회
- 방문자 통계

### 랭킹 시스템
- 일간/주간/월간 랭킹
- 등급 시스템 (브론즈~다이아몬드)
- 지역별 랭킹

---

## 🎨 UI/UX 시스템
### 디자인 시스템
- **픽셀 아트** 스타일
- **다크 테마** 기본
- **모바일 퍼스트** 반응형

### 컴포넌트 구조
```
components/
├── ui/              # 기본 UI 컴포넌트
│   ├── PixelButton.tsx
│   ├── PixelModal.tsx
│   ├── PixelInput.tsx
│   └── PixelCard.tsx
├── layout/          # 레이아웃 컴포넌트
│   ├── Header.tsx
│   └── BottomNavigation.tsx
└── features/        # 기능별 컴포넌트
    ├── income/      # 수입 관리
    ├── ranking/     # 랭킹
    ├── friends/     # 친구
    ├── profile/     # 프로필
    └── garage/      # 차고
```

---

## 🔧 API 구조

### 주요 API 엔드포인트

#### 인증 관련
- `POST /api/auth/kakao/token` - 카카오 토큰 검증

#### 사용자 관리
- `GET /api/users/search` - 사용자 검색
- `POST /api/users/check-nickname` - 닉네임 중복 확인
- `DELETE /api/users/delete-account` - 계정 삭제

#### 수입 관리
- `POST /api/earnings` - 수입 기록 추가
- `GET /api/earnings` - 수입 기록 조회
- `DELETE /api/earnings/[earningId]` - 수입 기록 삭제

#### 상점 시스템
- `GET /api/character-shop/characters` - 캐릭터 목록
- `GET /api/character-shop/emotions` - 감정표현 목록
- `POST /api/purchase-item` - 아이템 구매

#### 소셜 기능
- `GET /api/friends` - 친구 목록
- `POST /api/friends` - 친구 요청
- `GET /api/guestbook` - 방명록 조회
- `POST /api/guestbook` - 방명록 작성

---

## 🎯 상태 관리

### useAppState 훅
전역 상태를 관리하는 커스텀 훅:

```typescript
interface AppState {
  // 사용자 정보
  user: User | null
  
  // 모달 관리
  activeModal: string | null
  
  // 패널 상태들
  showCustomizePanel: boolean
  showIncomePanel: boolean
  showCharacterItemPanel: boolean
  
  // 게임 상태들
  totalBoxes: number
  currentCharacterItem: string
  currentVehicle: string
  
  // 수입 관련
  incomeRecords: IncomeRecord[]
  platforms: Platform[]
  
  // 친구 관련
  friendRequests: any[]
}
```

---

## 🎨 에셋 관리

### 이미지 리소스
```
public/Garage/
├── Character/배민/     # 캐릭터 스프라이트 (8방향 × 3프레임)
├── Character/Emotion/  # 감정표현 이미지
├── Item/              # 인테리어 아이템
└── Tile/              # 타일맵 리소스
    ├── 01_기본지형/
    ├── 02_물/
    ├── 03_강하천/
    ├── 04_도로/
    └── ...
```

### 스프라이트 시스템
- **등각뷰 8방향**: N, NE, E, SE, S, SW, W, NW
- **3프레임 애니메이션**: 1(걷기), 2(서기), 3(걷기)
- **픽셀 아트 스타일**: 32×32 또는 64×64 픽셀

---

## 🔄 데이터 플로우

### 수입 기록 플로우
1. 사용자가 수입 입력
2. `POST /api/earnings` 호출
3. 데이터베이스에 저장
4. 박스 지급 계산
5. UI 업데이트

### 아이템 구매 플로우
1. 상점에서 아이템 선택
2. `POST /api/purchase-item` 호출
3. 박스 차감 확인
4. `user_items` 테이블에 추가
5. 인벤토리 업데이트

### 친구 요청 플로우
1. 사용자 검색
2. 친구 요청 전송
3. `friendships` 테이블에 'pending' 상태로 저장
4. 상대방이 수락/거절
5. 상태 업데이트

---

## 🚀 배포 및 개발

### 개발 환경 설정
```bash
# 의존성 설치
npm install

# Supabase 시작
npm run db:start

# 개발 서버 시작
npm run dev
```

### 빌드 및 배포
```bash
# 프로덕션 빌드
npm run build

# 프로덕션 서버 시작
npm run start
```

### 데이터베이스 관리
```bash
# DB 리셋
npm run db:reset

# 마이그레이션 적용
npm run db:push

# 시드 데이터 로드
npm run db:seed
```

---

## 🔍 주요 기능 상세

### 1. 수입 기록 시스템
- **플랫폼별 분류**: 배민, 쿠팡, 기타
- **OCR 기능**: 스크린샷에서 자동 수입 추출
- **목표 설정**: 일간/주간/월간 목표
- **통계 분석**: 수입 트렌드 및 분석

### 2. 랭킹 시스템
- **등급 체계**: 브론즈 → 실버 → 골드 → 플래티넘 → 다이아몬드
- **랭킹 기준**: 총 수입, 배달 건수, 연속 기록
- **지역별 랭킹**: 사용자 지역 기반 순위

### 3. 미니게임
- **아이소메트릭 뷰**: 45도 각도 시점
- **타일 기반 이동**: 정확한 그리드 시스템
- **상호작용**: 아이템 배치, 캐릭터 이동
- **실시간 렌더링**: PixiJS 기반 고성능 렌더링

### 4. 소셜 기능
- **친구 시스템**: 요청/수락/거절
- **미니홈피**: 개인 차고 공개
- **방명록**: 친구 간 소통
- **방문 통계**: 일일/총 방문자 수

---

## 🛠️ 개발 가이드

### 새로운 기능 추가
1. 타입 정의 (`src/types/`)
2. API 라우트 생성 (`src/app/api/`)
3. 컴포넌트 개발 (`src/components/`)
4. 상태 관리 연동 (`src/hooks/useAppState.ts`)

### 데이터베이스 스키마 변경
1. 마이그레이션 파일 생성 (`supabase/migrations/`)
2. 타입 정의 업데이트 (`src/lib/supabase.ts`)
3. API 라우트 수정

### 게임 기능 추가
1. 게임 오브젝트 타입 정의 (`src/lib/minigame/types.ts`)
2. 엔진 로직 구현 (`src/lib/minigame/`)
3. UI 컴포넌트 연동

---

## 📈 성능 최적화

### 프론트엔드
- **코드 스플리팅**: Next.js 자동 코드 분할
- **이미지 최적화**: Next.js Image 컴포넌트
- **상태 관리**: 필요한 상태만 구독
- **메모이제이션**: React.memo, useMemo 활용

### 백엔드
- **데이터베이스 인덱싱**: 자주 조회되는 컬럼
- **쿼리 최적화**: 필요한 데이터만 조회
- **캐싱**: Supabase 캐싱 활용
- **API 최적화**: 배치 처리 및 병렬 요청

---

## 🔒 보안 고려사항

### 인증 보안
- **JWT 토큰**: 안전한 세션 관리
- **RLS (Row Level Security)**: 데이터 접근 제어
- **입력 검증**: 모든 사용자 입력 검증

### 데이터 보안
- **SQL 인젝션 방지**: Supabase ORM 사용
- **XSS 방지**: 입력 데이터 이스케이핑
- **CSRF 방지**: SameSite 쿠키 설정

---

## 🐛 디버깅 및 로깅

### 개발 도구
- **React DevTools**: 컴포넌트 상태 디버깅
- **Supabase Dashboard**: 데이터베이스 모니터링
- **Next.js DevTools**: 성능 분석

### 로깅 시스템
- **콘솔 로깅**: 개발 환경 디버깅
- **에러 추적**: try-catch 블록 활용
- **사용자 행동 추적**: 주요 액션 로깅

---

## 📚 참고 자료

### 기술 문서
- [Next.js 15 공식 문서](https://nextjs.org/docs)
- [Supabase 공식 문서](https://supabase.com/docs)
- [PixiJS 공식 문서](https://pixijs.com/guides)
- [TypeScript 공식 문서](https://www.typescriptlang.org/docs)

### 프로젝트 관련
- 데이터베이스 스키마: `supabase/migrations/001_clean_database_setup.sql`
- 타입 정의: `src/types/index.ts`
- 게임 엔진: `src/lib/minigame/`

---

## 🎯 향후 개발 계획

### 단기 계획
- [ ] 모바일 앱 개발 (React Native)
- [ ] 실시간 알림 시스템
- [ ] 더 많은 게임 콘텐츠

### 장기 계획
- [ ] AI 기반 수입 분석
- [ ] 커뮤니티 기능 확장
- [ ] 다국어 지원

---

## 📞 지원 및 문의

프로젝트 관련 문의사항이나 버그 리포트는 개발팀에 연락해주세요.

**개발팀**: 배달킹 팀  
**라이선스**: MIT  
**버전**: 0.1.0

---

*이 문서는 2024년 기준으로 작성되었으며, 프로젝트 업데이트에 따라 변경될 수 있습니다.*

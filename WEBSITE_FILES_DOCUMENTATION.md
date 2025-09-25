# 배달킹 웹사이트 파일 상세 분석 문서

## 프로젝트 개요
배달킹은 배달 기사들을 위한 수입 기록 및 소셜 앱으로, Next.js 15.5.0, React 18, TypeScript 5를 기반으로 구축되었습니다. PixiJS를 사용한 2D 게임 엔진과 Supabase 백엔드를 활용하여 차고 꾸미기, 캐릭터 커스터마이징, 수입 기록, 친구 시스템 등의 기능을 제공합니다.

## 핵심 기술 스택
- **프론트엔드**: Next.js 15.5.0, React 18, TypeScript 5
- **스타일링**: Tailwind CSS 3.4.17
- **게임 엔진**: PixiJS 8.0.0 (2D 렌더링)
- **백엔드**: Supabase (PostgreSQL, 인증, 스토리지)
- **인증**: 카카오 로그인 통합
- **상태 관리**: React Context API + 커스텀 훅

## 1. 프로젝트 설정 파일들

### package.json
**목적**: 프로젝트 메타데이터, 의존성, 스크립트 정의
**핵심 의존성**:
```json
{
  "dependencies": {
    "@supabase/ssr": "^0.1.0",        // Supabase SSR 지원
    "@supabase/supabase-js": "^2.39.0", // Supabase 클라이언트
    "next": "15.5.0",                  // Next.js 프레임워크
    "pixi.js": "^8.0.0",               // 2D 게임 렌더링 엔진
    "react": "^18",                     // React 라이브러리
    "tailwind-merge": "^2.0.0",        // Tailwind 클래스 병합
    "clsx": "^2.0.0",                   // 조건부 클래스명 유틸
    "dom-to-image-more": "^3.7.1",     // DOM을 이미지로 변환
    "html2canvas": "^1.4.1",            // HTML을 캔버스로 변환
    "lucide-react": "^0.294.0"         // 아이콘 라이브러리
  }
}
```

**스크립트**:
- `dev`: 개발 서버 실행
- `build`: 프로덕션 빌드
- `db:setup`: 데이터베이스 초기 설정
- `db:start/stop`: Supabase 로컬 서버 관리
- `db:push`: 데이터베이스 스키마 푸시
- `db:seed`: 시드 데이터 삽입

### next.config.ts
**목적**: Next.js 설정 및 PixiJS 호환성 보장
**핵심 설정**:
```typescript
const nextConfig: NextConfig = {
  // PixiJS와의 호환성을 위한 설정
  serverExternalPackages: ['pixi.js'],
  webpack: (config, { isServer, dev }) => {
    // PixiJS shader 파일 처리
    if (!isServer) {
      config.module.rules.push({
        test: /\.(frag|vert|glsl)$/,
        type: 'asset/source',
      });
    }
    return config;
  },
  // React StrictMode 비활성화 (PixiJS 충돌 방지)
  reactStrictMode: false,
  // 개발 시 TypeScript/ESLint 오류 무시
  typescript: { ignoreBuildErrors: false },
  eslint: { ignoreDuringBuilds: true }
};
```

### tailwind.config.js
**목적**: Tailwind CSS 설정 및 커스텀 테마 정의
```javascript
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic": "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
    },
  },
  plugins: [],
}
```

### tsconfig.json
**목적**: TypeScript 컴파일러 설정
```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "paths": {
      "@/*": ["./src/*"],
      "@Tile/*": ["./public/Garage/Tile/*"]
    }
  }
}
```

## 2. 데이터베이스 스키마

### 주요 테이블 구조

#### users 테이블
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    kakao_id TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    nickname TEXT NOT NULL,
    region TEXT DEFAULT '',
    garage_intro TEXT DEFAULT '열심히 달리는 배달킹입니다! 🛵💨',
    status_message TEXT DEFAULT '',
    equipped_character_id UUID,
    equipped_emotion_id UUID,
    is_income_private BOOLEAN DEFAULT false,
    goals JSONB DEFAULT '{"daily": 50000, "weekly": 300000, "monthly": 1200000}',
    total_visitors INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### earnings 테이블
```sql
CREATE TABLE earnings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    platform TEXT NOT NULL,
    delivery_count INTEGER DEFAULT 0,
    delivery_amount BIGINT DEFAULT 0,
    mission_amount BIGINT DEFAULT 0,
    total_amount BIGINT GENERATED ALWAYS AS (delivery_amount + mission_amount) STORED,
    date DATE NOT NULL,
    screenshot_url TEXT DEFAULT '',
    screenshot_text TEXT DEFAULT '',
    verified BOOLEAN DEFAULT false,
    verified_score INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, platform, date)
);
```

#### box_transactions 테이블 (게임 내 화폐)
```sql
CREATE TABLE box_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount BIGINT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('earn', 'spend')),
    reason TEXT NOT NULL,
    related_earning_id UUID REFERENCES earnings(id),
    related_item_id UUID REFERENCES shop_items(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### shop_items 테이블 (상점 아이템)
```sql
CREATE TABLE shop_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT DEFAULT '',
    category TEXT NOT NULL,
    sub_category TEXT NOT NULL,
    price INTEGER NOT NULL CHECK (price > 0),
    pixel_data JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## 3. 핵심 컴포넌트 구조

### src/app/layout.tsx
**목적**: 루트 레이아웃 및 전역 설정
```typescript
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" data-scroll-behavior="smooth">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
```

### src/app/page.tsx
**목적**: 메인 홈페이지 및 인증 체크
```typescript
export default function Home() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  useEffect(() => {
    if (!loading && user) {
      const isProfileComplete = user.nickname && user.region
      const profileSetupCompleted = localStorage.getItem('profileSetupCompleted')
      
      if (!isProfileComplete && !profileSetupCompleted) {
        router.push('/auth/setup')
      }
    }
  }, [user, loading, router])

  if (loading || !user) {
    return <LoadingScreen />
  }

  return <MainApp user={user} />
}
```

## 4. 게임 엔진 시스템

### MiniGameEngine.ts
**목적**: PixiJS 기반 2D 게임 엔진 핵심
**주요 기능**:
- 아이소메트릭 그리드 렌더링
- 캐릭터 및 오브젝트 관리
- 줌/팬 인터랙션
- 씬 전환 관리

```typescript
export class MiniGameEngine {
  public app!: PIXI.Application
  public gameObjects: Map<string, GameObject> = new Map()
  public sceneManager!: SceneManager
  
  constructor(canvas: HTMLElement, width: number, height: number, callbacks: {
    onTileClick?: (x: number, y: number, z: number) => void;
    onObjectClick?: (object: GameObject) => void;
  }, userId?: string) {
    this.onTileClick = callbacks.onTileClick
    this.onObjectClick = callbacks.onObjectClick
    this.initializeApp(canvas, width, height)
  }
}
```

### BaeminCharacter.ts
**목적**: 배민 캐릭터 애니메이션 및 이동 시스템
**핵심 기능**:
- 8방향 아이소메트릭 애니메이션
- 자연스러운 이동 패턴
- 감정표현 시스템
- 텍스처 프리로딩

```typescript
export class BaeminCharacter {
  private sprite: PIXI.Sprite
  private position: Position3D
  private currentDirection: Direction = 'S'
  private animationPattern = [1, 2, 3, 2]
  private textures: Map<string, PIXI.Texture[]> = new Map()
  
  // 자연스러운 이동 속도 설정
  private baseSpeed = 0.08
  private currentSpeed = 0.08
  private acceleration = 0.02
  private deceleration = 0.025
  private maxSpeed = 0.15
}
```

### IsometricUtils.ts
**목적**: 아이소메트릭 좌표 변환 유틸리티
```typescript
export class IsometricUtils {
  static readonly TILE_WIDTH = 100
  static readonly TILE_HEIGHT = 50
  
  // 3D 좌표를 2D 스크린 좌표로 변환
  static toScreenCoords(x: number, y: number, z: number = 0): { screenX: number, screenY: number } {
    const screenX = (x - y) * (this.TILE_WIDTH / 2)
    const screenY = (x + y) * (this.TILE_HEIGHT / 2) - (z * this.TILE_HEIGHT)
    return { screenX, screenY }
  }
}
```

## 5. 인증 시스템

### useAuth.tsx
**목적**: 카카오 로그인 기반 인증 관리
**핵심 기능**:
- 카카오 로그인 직접 처리
- 사용자 데이터 Supabase 저장
- 세션 관리
- 프로필 설정 체크

```typescript
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  // 카카오 로그인 처리 - 직접 사용자 데이터 관리
  const handleKakaoLogin = async (kakaoUser: any): Promise<boolean> => {
    const userData = {
      kakao_id: kakaoUser.kakao_id || kakaoUser.id || String(kakaoUser.id),
      email: kakaoUser.email || `${kakaoUser.kakao_id || kakaoUser.id}@kakao.com`,
      nickname: kakaoUser.nickname || '배달킹',
      region: kakaoUser.region || '서울',
      // ... 기타 필드
    }
    
    // 기존 사용자 확인 또는 새 사용자 생성
    const { data: existingUser } = await supabase
      .from('users')
      .select('*')
      .eq('kakao_id', String(userData.kakao_id))
      .maybeSingle()
    
    // 사용자 데이터 처리 로직...
  }
}
```

## 6. 데이터 타입 정의

### src/types/index.ts
**주요 인터페이스**:
```typescript
export interface User {
  id: string
  email: string
  nickname: string
  kakao_id?: string
  region?: string
  garage_intro?: string
  is_income_private?: boolean
  goals?: {
    daily: number
    weekly: number
    monthly: number
  }
  total_visitors?: number
  status_message?: string
  equipped_character_id?: string | null
  equipped_emotion_id?: string | null
}

export interface IncomeRecord {
  id: string
  platform: string
  delivery_count: number
  delivery_amount: number
  mission_amount: number
  total_amount: number
  date: string
  created_at: string
  user_id?: string
}
```

### src/types/minigame.ts
**게임 관련 타입**:
```typescript
export interface Position3D {
  x: number
  y: number
  z: number
}

export interface MiniGarage {
  id: string
  ownerId: string
  name: string
  description: string
  size: Size2D
  tiles: GarageTile[]
  furniture: FurnitureItem[]
  character: Character
  vehicle?: Vehicle
  visitors: number
  lastModified: Date
}
```

## 7. API 라우트

### 주요 API 엔드포인트
- `/api/auth`: 인증 관련
- `/api/earnings`: 수입 기록 관리
- `/api/users`: 사용자 관리
- `/api/character-shop`: 캐릭터 상점
- `/api/friends`: 친구 시스템
- `/api/guestbook`: 방명록
- `/api/visits`: 방문 기록

## 8. 스타일링 시스템

### globals.css
**목적**: 전역 CSS 및 커스텀 스타일
**주요 기능**:
- Tailwind CSS 임포트
- 다크/라이트 테마 변수
- 게임 스타일 애니메이션
- 픽셀 아트 렌더링 최적화
- 모바일 퍼스트 반응형 디자인

```css
/* Pixel Art Rendering Rules */
.pixelated {
  image-rendering: pixelated;
  image-rendering: -moz-crisp-edges;
  image-rendering: crisp-edges;
}

/* Game-style animations */
@keyframes float {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
}

@keyframes glow {
  0%, 100% { box-shadow: 0 0 5px rgba(52, 152, 219, 0.5); }
  50% { box-shadow: 0 0 20px rgba(52, 152, 219, 0.8); }
}
```

## 9. 데이터베이스 함수

### 주요 SQL 함수
```sql
-- 수입 기록 저장 및 박스 지급
CREATE OR REPLACE FUNCTION save_earning_with_boxes(
    p_user_id UUID,
    p_platform TEXT,
    p_delivery_count INTEGER,
    p_delivery_amount BIGINT,
    p_mission_amount BIGINT,
    p_date DATE
) RETURNS JSON;

-- 사용자 박스 잔액 조회
CREATE OR REPLACE FUNCTION get_user_boxes(p_user_id UUID) RETURNS BIGINT;

-- 아이템 구매 및 박스 차감
CREATE OR REPLACE FUNCTION purchase_item_with_boxes(
    p_user_id UUID,
    p_item_id UUID,
    p_quantity INTEGER DEFAULT 1
) RETURNS JSON;
```

## 10. 파일 구조 요약

```
Baedalking/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── layout.tsx          # 루트 레이아웃
│   │   ├── page.tsx            # 메인 홈페이지
│   │   ├── globals.css         # 전역 스타일
│   │   ├── api/                # API 라우트
│   │   ├── auth/               # 인증 페이지
│   │   ├── garage/             # 차고 페이지
│   │   └── admin/              # 관리자 페이지
│   ├── components/             # React 컴포넌트
│   │   ├── core/               # 핵심 컴포넌트
│   │   ├── features/           # 기능별 컴포넌트
│   │   ├── layout/             # 레이아웃 컴포넌트
│   │   ├── minigame/           # 게임 엔진
│   │   └── ui/                 # UI 컴포넌트
│   ├── lib/                    # 유틸리티 라이브러리
│   │   ├── minigame/           # 게임 엔진 모듈
│   │   ├── supabase.ts         # Supabase 클라이언트
│   │   ├── database.ts         # DB 함수들
│   │   └── utils.ts            # 공통 유틸리티
│   ├── hooks/                  # 커스텀 훅
│   ├── types/                  # TypeScript 타입 정의
│   └── data/                   # 정적 데이터
├── public/                     # 정적 파일
│   ├── Garage/                 # 게임 에셋
│   └── uploads/                # 업로드 파일
├── supabase/                   # Supabase 설정
│   ├── migrations/             # DB 마이그레이션
│   └── seed.sql                # 시드 데이터
└── 설정 파일들
```

## 11. 핵심 기능별 파일 매핑

### 인증 시스템
- `src/hooks/useAuth.tsx`: 인증 상태 관리
- `src/app/auth/`: 인증 페이지들
- `src/lib/supabase.ts`: Supabase 클라이언트

### 게임 엔진
- `src/components/minigame/MiniGameEngine.ts`: 핵심 게임 엔진
- `src/lib/minigame/BaeminCharacter.ts`: 캐릭터 시스템
- `src/lib/minigame/IsometricUtils.ts`: 좌표 변환
- `src/lib/minigame/SceneManager.ts`: 씬 관리

### 데이터 관리
- `src/lib/database.ts`: DB 함수들
- `src/types/`: 타입 정의
- `supabase/migrations/`: DB 스키마

### UI/UX
- `src/components/core/MainApp.tsx`: 메인 앱
- `src/app/globals.css`: 전역 스타일
- `tailwind.config.js`: Tailwind 설정

이 문서는 배달킹 웹사이트의 모든 파일과 그 목적, 사용 이유, 데이터 형식을 상세히 설명합니다. 각 파일은 특정 기능을 담당하며, 전체적으로는 배달 기사들을 위한 종합적인 소셜 플랫폼을 구성합니다.

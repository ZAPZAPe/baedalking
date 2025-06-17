# 🚀 AWS Amplify → Supabase 마이그레이션 가이드

## 1단계: Supabase 프로젝트 생성
```bash
# Supabase CLI 설치
npm install -g supabase
```

## 2단계: 데이터베이스 스키마 생성
```sql
-- users 테이블
CREATE TABLE users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  username TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  nickname TEXT,
  region TEXT,
  vehicle TEXT,
  phone TEXT,
  points INTEGER DEFAULT 0,
  total_deliveries INTEGER DEFAULT 0,
  total_earnings DECIMAL DEFAULT 0,
  profile_image TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- delivery_records 테이블
CREATE TABLE delivery_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  date DATE NOT NULL,
  amount DECIMAL NOT NULL,
  delivery_count INTEGER NOT NULL,
  platform TEXT NOT NULL,
  verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- friend_requests 테이블
CREATE TABLE friend_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  from_user_id UUID REFERENCES users(id),
  to_user_id UUID REFERENCES users(id),
  status TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- rankings 테이블
CREATE TABLE rankings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  nickname TEXT NOT NULL,
  region TEXT NOT NULL,
  total_earnings DECIMAL NOT NULL,
  total_deliveries INTEGER NOT NULL,
  rank_type TEXT NOT NULL,
  date DATE NOT NULL,
  rank INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- point_history 테이블
CREATE TABLE point_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  points INTEGER NOT NULL,
  reason TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## 3단계: 필요한 패키지 설치
```bash
npm install @supabase/supabase-js @supabase/auth-ui-react
npm uninstall aws-amplify @aws-amplify/ui-react
```

## 4단계: 환경 변수 설정 (.env.local)
```
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## 5단계: Supabase 클라이언트 설정
```typescript
// lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseKey)
```

## 6단계: 인증 컴포넌트 변경
```typescript
// components/Auth.tsx
import { Auth } from '@supabase/auth-ui-react'
import { supabase } from '../lib/supabase'

export default function AuthComponent() {
  return (
    <Auth
      supabaseClient={supabase}
      appearance={{ theme: 'default' }}
      providers={['google', 'github']}
    />
  )
}
```

## 🎯 장점
- ✅ **무료 플랜**: 월 50,000 활성 사용자
- ✅ **실시간 기능**: WebSocket 자동 지원
- ✅ **PostgreSQL**: 강력한 관계형 데이터베이스
- ✅ **인증**: 구글, 깃허브 등 소셜 로그인
- ✅ **API 자동 생성**: REST + GraphQL
- ✅ **스토리지**: 파일 업로드/다운로드
- ✅ **Edge Functions**: 서버리스 함수

## 💰 비용 (10,000명 기준)
- **무료**: 월 50,000 활성 사용자까지
- **Pro**: $25/월 (100,000 활성 사용자)
- **Vercel과 합치면**: 총 $20-45/월 
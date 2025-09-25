-- ============================================================================
-- 🔐 데이터베이스 권한 설정 (개발용)
-- ============================================================================

-- 1. 기본 테이블들이 존재하는지 확인하고 생성
CREATE TABLE IF NOT EXISTS users (
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
    daily_visitors INTEGER DEFAULT 0,
    platforms JSONB DEFAULT '[]'::jsonb,
    garage_config JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. RLS 비활성화 (개발용)
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- 3. anon 역할에게 users 테이블 권한 부여
GRANT SELECT, INSERT, UPDATE, DELETE ON users TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON users TO authenticated;

-- 4. UUID 생성 함수 권한 부여
GRANT EXECUTE ON FUNCTION gen_random_uuid() TO anon;
GRANT EXECUTE ON FUNCTION gen_random_uuid() TO authenticated;

-- 5. 기타 필요한 테이블들도 생성 및 권한 설정
CREATE TABLE IF NOT EXISTS earnings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    platform TEXT NOT NULL,
    delivery_count INTEGER NOT NULL DEFAULT 0,
    delivery_amount INTEGER NOT NULL DEFAULT 0,
    mission_amount INTEGER NOT NULL DEFAULT 0,
    total_amount INTEGER GENERATED ALWAYS AS (delivery_amount + mission_amount) STORED,
    date DATE NOT NULL,
    screenshot_url TEXT,
    screenshot_text TEXT,
    verified BOOLEAN DEFAULT false,
    verified_score FLOAT DEFAULT 0.0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE earnings DISABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON earnings TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON earnings TO authenticated;

CREATE TABLE IF NOT EXISTS box_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('earn', 'spend')),
    reason TEXT DEFAULT '',
    related_earning_id UUID REFERENCES earnings(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE box_transactions DISABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON box_transactions TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON box_transactions TO authenticated;

CREATE TABLE IF NOT EXISTS shop_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT DEFAULT '',
    category TEXT DEFAULT 'furniture',
    image_path TEXT DEFAULT '',
    image_scale FLOAT DEFAULT 1.0,
    image_offset JSONB DEFAULT '{"x": 0, "y": 0}',
    voxel_data JSONB DEFAULT '[]',
    dimensions JSONB DEFAULT '{"width": 1, "height": 1, "depth": 1}',
    price INTEGER NOT NULL DEFAULT 0,
    is_admin_only BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE shop_items DISABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON shop_items TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON shop_items TO authenticated;

CREATE TABLE IF NOT EXISTS user_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    item_id UUID NOT NULL REFERENCES shop_items(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 1,
    purchased_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE user_items DISABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON user_items TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON user_items TO authenticated;

CREATE TABLE IF NOT EXISTS garage_placements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    item_id UUID NOT NULL REFERENCES shop_items(id) ON DELETE CASCADE,
    position_x INTEGER NOT NULL DEFAULT 0,
    position_y INTEGER NOT NULL DEFAULT 0,
    position_z INTEGER NOT NULL DEFAULT 0,
    placed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE garage_placements DISABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON garage_placements TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON garage_placements TO authenticated;

CREATE TABLE IF NOT EXISTS friendships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    friend_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE friendships DISABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON friendships TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON friendships TO authenticated;

CREATE TABLE IF NOT EXISTS guestbook_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    visitor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    is_private BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE guestbook_entries DISABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON guestbook_entries TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON guestbook_entries TO authenticated;

CREATE TABLE IF NOT EXISTS visits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    visitor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    visited_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE visits DISABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON visits TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON visits TO authenticated;

-- ============================================================================
-- 🎯 확인 쿼리
-- ============================================================================

-- 테이블 목록 확인
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;

-- 권한 확인
SELECT grantee, privilege_type, table_name 
FROM information_schema.table_privileges 
WHERE table_schema = 'public' 
  AND grantee IN ('anon', 'authenticated')
ORDER BY table_name, grantee;

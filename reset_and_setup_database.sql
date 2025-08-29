-- =====================================================
-- 배달킹 Supabase 데이터베이스 완전 초기화 및 재설정
-- =====================================================

-- 1. 기존 테이블 및 데이터 완전 삭제
-- =====================================================

-- RLS 정책들을 먼저 삭제 (테이블이 존재할 때만)
DO $$ 
BEGIN
    -- Users 정책 삭제
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'users') THEN
        DROP POLICY IF EXISTS "Users can view own profile" ON users;
        DROP POLICY IF EXISTS "Users can update own profile" ON users;
    END IF;
    
    -- Earnings 정책 삭제
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'earnings') THEN
        DROP POLICY IF EXISTS "Users can view own earnings" ON earnings;
        DROP POLICY IF EXISTS "Users can insert own earnings" ON earnings;
    END IF;
    
    -- Points 정책 삭제
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'points') THEN
        DROP POLICY IF EXISTS "Users can view own points" ON points;
        DROP POLICY IF EXISTS "Users can insert own points" ON points;
    END IF;
    
    -- Items 정책 삭제
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'items') THEN
        DROP POLICY IF EXISTS "Anyone can view items" ON items;
        DROP POLICY IF EXISTS "Items are viewable by everyone" ON items;
    END IF;
    
    -- User_Items 정책 삭제
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'user_items') THEN
        DROP POLICY IF EXISTS "Users can view own items" ON user_items;
        DROP POLICY IF EXISTS "Users can insert own items" ON user_items;
        DROP POLICY IF EXISTS "Users can update own items" ON user_items;
    END IF;
    
    -- Friends 정책 삭제
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'friends') THEN
        DROP POLICY IF EXISTS "Users can view own friends" ON friends;
        DROP POLICY IF EXISTS "Users can insert friend requests" ON friends;
        DROP POLICY IF EXISTS "Users can update friend status" ON friends;
    END IF;
    
    -- Visits 정책 삭제
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'visits') THEN
        DROP POLICY IF EXISTS "Users can view visits to their garage" ON visits;
        DROP POLICY IF EXISTS "Users can record visits" ON visits;
    END IF;
    
    -- Guestbook 정책 삭제
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'guestbook') THEN
        DROP POLICY IF EXISTS "Users can view guestbook messages" ON guestbook;
        DROP POLICY IF EXISTS "Users can insert guestbook messages" ON guestbook;
        DROP POLICY IF EXISTS "Users can delete own messages or messages on their guestbook" ON guestbook;
        DROP POLICY IF EXISTS "Users can view guestbook messages on their page" ON guestbook;
        DROP POLICY IF EXISTS "Users can write guestbook messages" ON guestbook;
        DROP POLICY IF EXISTS "Users can delete messages on their own guestbook" ON guestbook;
        DROP POLICY IF EXISTS "Message writers can delete their own messages" ON guestbook;
    END IF;
    
    -- Rewards 정책 삭제
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'rewards') THEN
        DROP POLICY IF EXISTS "Users can view own rewards" ON rewards;
        DROP POLICY IF EXISTS "Users can insert own rewards" ON rewards;
    END IF;
    
    -- Rankings 정책 삭제
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'rankings') THEN
        DROP POLICY IF EXISTS "Rankings are viewable by everyone" ON rankings;
    END IF;
    
    -- Weather 정책 삭제
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'weather') THEN
        DROP POLICY IF EXISTS "Weather is viewable by everyone" ON weather;
    END IF;
END $$;

-- 트리거 삭제 (테이블이 존재할 때만)
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'users') THEN
        DROP TRIGGER IF EXISTS update_users_updated_at ON users;
    END IF;
END $$;

-- 함수 삭제
DROP FUNCTION IF EXISTS update_updated_at_column();

-- 테이블들 삭제 (의존성 순서대로)
DROP TABLE IF EXISTS guestbook CASCADE;
DROP TABLE IF EXISTS rewards CASCADE;
DROP TABLE IF EXISTS visits CASCADE;
DROP TABLE IF EXISTS friends CASCADE;
DROP TABLE IF EXISTS user_items CASCADE;
DROP TABLE IF EXISTS items CASCADE;
DROP TABLE IF EXISTS points CASCADE;
DROP TABLE IF EXISTS earnings CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- 2. 새로운 테이블 구조 생성
-- =====================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users 테이블 - 사용자 기본 정보
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    nickname TEXT NOT NULL,
    region TEXT NOT NULL DEFAULT '서울특별시',
    kakao_id TEXT UNIQUE,
    avatar_url TEXT,
    current_emotion TEXT DEFAULT 'base',
    current_background TEXT DEFAULT 'background',
    current_vehicle TEXT DEFAULT 'scooter',
    speech_text TEXT DEFAULT '오늘도 배달 화이팅!',
    garage_intro TEXT DEFAULT '배달왕의 차고에 오신 것을 환영합니다!',
    is_income_private BOOLEAN DEFAULT FALSE,
    minihome_id TEXT UNIQUE,
    total_points INTEGER DEFAULT 0,
    user_level INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Earnings 테이블 - 수익 기록
CREATE TABLE earnings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL,
    mission_amount INTEGER DEFAULT 0,
    delivery_count INTEGER DEFAULT 1,
    platform TEXT NOT NULL DEFAULT 'other',
    date DATE NOT NULL,
    screenshot_url TEXT,
    screenshot_text TEXT DEFAULT '',
    points_awarded INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Points 테이블 - 포인트 내역
CREATE TABLE points (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL,
    type TEXT CHECK (type IN ('earn', 'spend')) NOT NULL,
    description TEXT DEFAULT '',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Items 테이블 - 구매 가능한 아이템들
CREATE TABLE items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    type TEXT CHECK (type IN ('character', 'background', 'vehicle', 'decoration')) NOT NULL,
    asset_url TEXT NOT NULL,
    price INTEGER NOT NULL,
    description TEXT DEFAULT '',
    category TEXT DEFAULT 'basic',
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User_Items 테이블 - 사용자가 소유한 아이템들
CREATE TABLE user_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    item_id UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE,
    equipped BOOLEAN DEFAULT FALSE,
    purchased_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, item_id)
);

-- Friends 테이블 - 친구 관계
CREATE TABLE friends (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    friend_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status TEXT CHECK (status IN ('pending', 'accepted', 'rejected')) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, friend_id)
);

-- Visits 테이별 - 방문 기록
CREATE TABLE visits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    visited_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Guestbook 테이블 - 방명록
CREATE TABLE guestbook (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    visitor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    is_private BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Rankings 테이블 - 랭킹 캐시
CREATE TABLE rankings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    period TEXT CHECK (period IN ('daily', 'weekly', 'monthly')) NOT NULL,
    total_income INTEGER NOT NULL DEFAULT 0,
    delivery_count INTEGER NOT NULL DEFAULT 0,
    rank_position INTEGER NOT NULL DEFAULT 0,
    date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, period, date)
);

-- Weather 테이블 - 날씨 정보 캐시
CREATE TABLE weather (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    region TEXT NOT NULL,
    weather_data JSONB NOT NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(region, date)
);

-- 3. 인덱스 생성 (성능 최적화)
-- =====================================================

-- Users 테이블 인덱스
CREATE INDEX idx_users_kakao_id ON users(kakao_id);
CREATE INDEX idx_users_minihome_id ON users(minihome_id);
CREATE INDEX idx_users_nickname ON users(nickname);

-- Earnings 테이블 인덱스
CREATE INDEX idx_earnings_user_id ON earnings(user_id);
CREATE INDEX idx_earnings_date ON earnings(date);
CREATE INDEX idx_earnings_platform ON earnings(platform);
CREATE INDEX idx_earnings_user_date ON earnings(user_id, date);

-- Points 테이블 인덱스
CREATE INDEX idx_points_user_id ON points(user_id);
CREATE INDEX idx_points_type ON points(type);

-- User_Items 테이블 인덱스
CREATE INDEX idx_user_items_user_id ON user_items(user_id);
CREATE INDEX idx_user_items_equipped ON user_items(equipped);

-- Friends 테이블 인덱스
CREATE INDEX idx_friends_user_id ON friends(user_id);
CREATE INDEX idx_friends_friend_id ON friends(friend_id);
CREATE INDEX idx_friends_status ON friends(status);

-- Visits 테이블 인덱스
CREATE INDEX idx_visits_visited_user_id ON visits(visited_user_id);
CREATE INDEX idx_visits_user_id ON visits(user_id);

-- Guestbook 테이블 인덱스
CREATE INDEX idx_guestbook_user_id ON guestbook(user_id);
CREATE INDEX idx_guestbook_visitor_id ON guestbook(visitor_id);

-- Rankings 테이블 인덱스
CREATE INDEX idx_rankings_period_date ON rankings(period, date);
CREATE INDEX idx_rankings_user_period ON rankings(user_id, period);
CREATE INDEX idx_rankings_rank_position ON rankings(rank_position);

-- Weather 테이블 인덱스
CREATE INDEX idx_weather_region_date ON weather(region, date);

-- 4. 트리거 및 함수 생성
-- =====================================================

-- Updated_at 컬럼 자동 업데이트 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Users 테이블 트리거
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 포인트 자동 계산 함수
CREATE OR REPLACE FUNCTION update_user_total_points()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE users 
    SET total_points = (
        SELECT COALESCE(SUM(
            CASE 
                WHEN type = 'earn' THEN amount 
                WHEN type = 'spend' THEN -amount 
                ELSE 0 
            END
        ), 0)
        FROM points 
        WHERE user_id = NEW.user_id
    )
    WHERE id = NEW.user_id;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Points 테이블 트리거
CREATE TRIGGER update_points_total 
    AFTER INSERT OR UPDATE OR DELETE ON points
    FOR EACH ROW EXECUTE FUNCTION update_user_total_points();

-- 5. 기본 아이템 데이터 삽입
-- =====================================================

INSERT INTO items (name, type, asset_url, price, description, category, is_default) VALUES
-- 기본 아이템들 (무료)
('기본 배경', 'background', '/assets/background/background.png', 0, '시작할 때 제공되는 기본 배경입니다.', 'default', true),
('기본 스쿠터', 'vehicle', '/assets/vehicle/scooter.png', 0, '배달의 필수템! 기본 스쿠터입니다.', 'default', true),

-- 배경 아이템들
('도시 야경', 'background', '/assets/background/background1.png', 1000, '반짝이는 도시의 야경 배경입니다.', 'premium', false),
('자연 풍경', 'background', '/assets/background/background2.png', 1200, '평화로운 자연 풍경 배경입니다.', 'premium', false),
('미래 도시', 'background', '/assets/background/background3.png', 1500, '첨단 기술의 미래 도시 배경입니다.', 'premium', false),
('복고풍', 'background', '/assets/background/background4.png', 800, '추억의 복고풍 배경입니다.', 'premium', false),

-- 캐릭터 감정 (무료 - 기본 제공)
('기본 표정', 'character', '/assets/character/character-base.png', 0, '평범한 기본 표정입니다.', 'emotion', true),
('행복한 표정', 'character', '/assets/character/character-happy.png', 0, '기쁠 때의 표정입니다.', 'emotion', true),
('화난 표정', 'character', '/assets/character/character-angry.png', 0, '화날 때의 표정입니다.', 'emotion', true),
('피곤한 표정', 'character', '/assets/character/character-tired.png', 0, '피곤할 때의 표정입니다.', 'emotion', true),

-- 프리미엄 아이템들
('황금 스쿠터', 'vehicle', '/assets/vehicle/golden-scooter.png', 5000, '황금으로 도금된 럭셔리 스쿠터입니다.', 'premium', false),
('슈퍼카', 'vehicle', '/assets/vehicle/supercar.png', 10000, '번개같이 빠른 슈퍼카입니다.', 'premium', false),
('헬리콥터', 'vehicle', '/assets/vehicle/helicopter.png', 20000, '하늘을 나는 헬리콥터입니다.', 'legendary', false),

-- 장식 아이템들
('트로피', 'decoration', '/assets/decor/trophy.png', 2000, '배달왕의 명예를 보여주는 트로피입니다.', 'premium', false),
('식물', 'decoration', '/assets/decor/plant.png', 500, '싱그러운 식물로 공간을 꾸며보세요.', 'basic', false),
('램프', 'decoration', '/assets/decor/lamp.png', 800, '따뜻한 조명으로 분위기를 연출합니다.', 'basic', false),
('선물상자', 'decoration', '/assets/decor/gift.png', 1000, '신비로운 선물 상자입니다.', 'premium', false)
ON CONFLICT DO NOTHING;

-- 6. 샘플 사용자 데이터 생성
-- =====================================================

-- 테스트 사용자들 생성
INSERT INTO users (email, nickname, region, minihome_id, total_points, current_emotion, speech_text) VALUES
('test1@example.com', '배달왕1호', '서울특별시', 'baedalking001', 5000, 'happy', '오늘도 열심히 배달합니다!'),
('test2@example.com', '배달마스터', '부산광역시', 'baedalking002', 3200, 'base', '부산에서 가장 빠른 배달!'),
('test3@example.com', '스피드러너', '대구광역시', 'baedalking003', 4100, 'tired', '오늘은 좀 피곤하네요...'),
('test4@example.com', '배달퀸', '인천광역시', 'baedalking004', 6500, 'happy', '여성 배달러의 자부심!'),
('test5@example.com', '라이더킹', '광주광역시', 'baedalking005', 2800, 'angry', '교통이 너무 복잡해요!'),
('test6@example.com', '배달고수', '대전광역시', 'baedalking006', 3900, 'base', '대전 토박이 배달러입니다'),
('test7@example.com', '번개배달', '울산광역시', 'baedalking007', 4700, 'happy', '번개처럼 빠른 배달!'),
('test8@example.com', '배달장인', '경기도', 'baedalking008', 5200, 'base', '경험 10년의 배달 장인'),
('test9@example.com', '신속배달', '강원도', 'baedalking009', 3600, 'tired', '산길도 문제없어요!'),
('test10@example.com', '배달신', '제주특별자치도', 'baedalking010', 7200, 'happy', '제주도 배달의 신입니다!')
ON CONFLICT DO NOTHING;

-- 7. 샘플 수익 데이터 생성
-- =====================================================

-- 최근 7일간의 수익 데이터 생성
WITH user_data AS (
    SELECT id, nickname FROM users LIMIT 10
),
date_series AS (
    SELECT generate_series(
        CURRENT_DATE - INTERVAL '6 days',
        CURRENT_DATE,
        '1 day'::interval
    )::date as earning_date
),
sample_earnings AS (
    SELECT 
        u.id as user_id,
        d.earning_date,
        -- 랜덤 수익 생성 (50,000 ~ 300,000원)
        (50000 + (RANDOM() * 250000))::integer as amount,
        -- 랜덤 미션비 생성 (0 ~ 50,000원)
        (RANDOM() * 50000)::integer as mission_amount,
        -- 랜덤 배달 횟수 (10 ~ 50건)
        (10 + (RANDOM() * 40))::integer as delivery_count,
        -- 랜덤 플랫폼 선택
        CASE (RANDOM() * 3)::integer
            WHEN 0 THEN 'baemin'
            WHEN 1 THEN 'coupang'
            ELSE 'other'
        END as platform
    FROM user_data u
    CROSS JOIN date_series d
    WHERE RANDOM() > 0.3  -- 70% 확률로 데이터 생성 (모든 날에 수익이 있지는 않음)
)
INSERT INTO earnings (user_id, amount, mission_amount, delivery_count, platform, date, points_awarded)
SELECT 
    user_id, 
    amount, 
    mission_amount, 
    delivery_count, 
    platform, 
    earning_date,
    (amount / 1000)::integer  -- 수익 1000원당 1포인트
FROM sample_earnings;

-- 8. 포인트 데이터 생성
-- =====================================================

-- 수익 기반 포인트 적립
INSERT INTO points (user_id, amount, type, description)
SELECT 
    user_id,
    points_awarded,
    'earn',
    '수익 달성 보상'
FROM earnings
WHERE points_awarded > 0;

-- 랜덤 포인트 사용 내역 생성
WITH user_spending AS (
    SELECT 
        u.id as user_id,
        -- 랜덤 지출 금액 (100 ~ 2000 포인트)
        (100 + (RANDOM() * 1900))::integer as spend_amount
    FROM users u
    WHERE RANDOM() > 0.4  -- 60% 확률로 지출 기록 생성
)
INSERT INTO points (user_id, amount, type, description)
SELECT 
    user_id,
    spend_amount,
    'spend',
    '아이템 구매'
FROM user_spending;

-- 9. 사용자별 기본 아이템 지급
-- =====================================================

-- 모든 사용자에게 기본 아이템들 지급
INSERT INTO user_items (user_id, item_id, equipped)
SELECT 
    u.id,
    i.id,
    i.is_default  -- 기본 아이템은 자동으로 장착
FROM users u
CROSS JOIN items i
WHERE i.is_default = true
ON CONFLICT DO NOTHING;

-- 10. 친구 관계 샘플 데이터
-- =====================================================

-- 랜덤 친구 관계 생성
WITH user_pairs AS (
    SELECT 
        u1.id as user_id,
        u2.id as friend_id
    FROM users u1
    CROSS JOIN users u2
    WHERE u1.id != u2.id
    AND RANDOM() > 0.7  -- 30% 확률로 친구 관계 생성
    LIMIT 20
)
INSERT INTO friends (user_id, friend_id, status)
SELECT 
    user_id,
    friend_id,
    CASE (RANDOM() * 3)::integer
        WHEN 0 THEN 'pending'
        WHEN 1 THEN 'accepted'
        ELSE 'accepted'
    END
FROM user_pairs
ON CONFLICT DO NOTHING;

-- 11. 방문 기록 샘플 데이터
-- =====================================================

-- 랜덤 방문 기록 생성
WITH visit_data AS (
    SELECT 
        u1.id as visitor_id,
        u2.id as visited_user_id,
        CURRENT_DATE - (RANDOM() * 30)::integer as visit_date
    FROM users u1
    CROSS JOIN users u2
    WHERE u1.id != u2.id
    AND RANDOM() > 0.6  -- 40% 확률로 방문 기록 생성
    LIMIT 50
)
INSERT INTO visits (user_id, visited_user_id, created_at)
SELECT 
    visitor_id,
    visited_user_id,
    visit_date
FROM visit_data;

-- 12. 방명록 샘플 데이터
-- =====================================================

-- 랜덤 방명록 메시지 생성
WITH guestbook_messages AS (
    SELECT 
        u1.id as visitor_id,
        u2.id as user_id,
        CASE (RANDOM() * 10)::integer
            WHEN 0 THEN '오늘도 배달 수고하셨어요! 화이팅!'
            WHEN 1 THEN '차고가 정말 멋지네요 👍'
            WHEN 2 THEN '배달 고수의 포스가 느껴져요!'
            WHEN 3 THEN '안전운전 하세요~'
            WHEN 4 THEN '수익 대박나세요! 🚀'
            WHEN 5 THEN '배달왕의 위엄이 느껴집니다'
            WHEN 6 THEN '오늘 날씨 좋네요. 배달하기 좋은 날!'
            WHEN 7 THEN '항상 응원하고 있어요! 💪'
            WHEN 8 THEN '차고 꾸미기 센스가 최고예요'
            ELSE '배달러 파이팅! 🏍️'
        END as message,
        CURRENT_DATE - (RANDOM() * 15)::integer as message_date
    FROM users u1
    CROSS JOIN users u2
    WHERE u1.id != u2.id
    AND RANDOM() > 0.8  -- 20% 확률로 방명록 메시지 생성
    LIMIT 30
)
INSERT INTO guestbook (visitor_id, user_id, message, created_at)
SELECT 
    visitor_id,
    user_id,
    message,
    message_date
FROM guestbook_messages;

-- 13. 랭킹 데이터 생성
-- =====================================================

-- 일간 랭킹 생성 (최근 7일)
WITH daily_rankings AS (
    SELECT 
        user_id,
        date,
        SUM(amount + mission_amount) as total_income,
        SUM(delivery_count) as total_count,
        ROW_NUMBER() OVER (PARTITION BY date ORDER BY SUM(amount + mission_amount) DESC) as rank_position
    FROM earnings
    WHERE date >= CURRENT_DATE - INTERVAL '6 days'
    GROUP BY user_id, date
)
INSERT INTO rankings (user_id, period, total_income, delivery_count, rank_position, date)
SELECT 
    user_id,
    'daily',
    total_income,
    total_count,
    rank_position,
    date
FROM daily_rankings;

-- 14. RLS (Row Level Security) 정책 설정
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE earnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE points ENABLE ROW LEVEL SECURITY;
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE friends ENABLE ROW LEVEL SECURITY;
ALTER TABLE visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE guestbook ENABLE ROW LEVEL SECURITY;
ALTER TABLE rankings ENABLE ROW LEVEL SECURITY;
ALTER TABLE weather ENABLE ROW LEVEL SECURITY;

-- Users 정책
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Public profiles viewable" ON users
    FOR SELECT USING (true);  -- 프로필은 공개 (닉네임, 지역 등)

-- Earnings 정책
CREATE POLICY "Users can view own earnings" ON earnings
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own earnings" ON earnings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own earnings" ON earnings
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own earnings" ON earnings
    FOR DELETE USING (auth.uid() = user_id);

-- Points 정책
CREATE POLICY "Users can view own points" ON points
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own points" ON points
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Items 정책 (공개)
CREATE POLICY "Items are viewable by everyone" ON items
    FOR SELECT USING (true);

-- User_Items 정책
CREATE POLICY "Users can view own items" ON user_items
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own items" ON user_items
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own items" ON user_items
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own items" ON user_items
    FOR DELETE USING (auth.uid() = user_id);

-- Friends 정책
CREATE POLICY "Users can view own friends" ON friends
    FOR SELECT USING (auth.uid() = user_id OR auth.uid() = friend_id);

CREATE POLICY "Users can insert friend requests" ON friends
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update friend status" ON friends
    FOR UPDATE USING (auth.uid() = friend_id);

CREATE POLICY "Users can delete friendships" ON friends
    FOR DELETE USING (auth.uid() = user_id OR auth.uid() = friend_id);

-- Visits 정책
CREATE POLICY "Users can view visits to their garage" ON visits
    FOR SELECT USING (auth.uid() = visited_user_id OR auth.uid() = user_id);

CREATE POLICY "Users can record visits" ON visits
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Guestbook 정책
CREATE POLICY "Users can view guestbook messages on their page" ON guestbook
    FOR SELECT USING (auth.uid() = user_id OR auth.uid() = visitor_id);

CREATE POLICY "Users can write guestbook messages" ON guestbook
    FOR INSERT WITH CHECK (auth.uid() = visitor_id);

CREATE POLICY "Users can delete messages on their own guestbook" ON guestbook
    FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Message writers can delete their own messages" ON guestbook
    FOR DELETE USING (auth.uid() = visitor_id);

-- Rankings 정책 (공개)
CREATE POLICY "Rankings are viewable by everyone" ON rankings
    FOR SELECT USING (true);

-- Weather 정책 (공개)
CREATE POLICY "Weather is viewable by everyone" ON weather
    FOR SELECT USING (true);

-- 15. 유용한 뷰 생성
-- =====================================================

-- 사용자 랭킹 뷰
CREATE OR REPLACE VIEW user_rankings AS
SELECT 
    u.id,
    u.nickname,
    u.region,
    r.period,
    r.total_income,
    r.delivery_count,
    r.rank_position,
    r.date
FROM users u
JOIN rankings r ON u.id = r.user_id
ORDER BY r.date DESC, r.rank_position ASC;

-- 사용자 통계 뷰
CREATE OR REPLACE VIEW user_stats AS
SELECT 
    u.id,
    u.nickname,
    u.region,
    u.total_points,
    COALESCE(SUM(e.amount + e.mission_amount), 0) as total_earnings,
    COALESCE(SUM(e.delivery_count), 0) as total_deliveries,
    COUNT(DISTINCT DATE(e.date)) as active_days
FROM users u
LEFT JOIN earnings e ON u.id = e.user_id
GROUP BY u.id, u.nickname, u.region, u.total_points;

-- 16. 완료 메시지
-- =====================================================

-- 데이터베이스 초기화 및 설정 완료 확인
SELECT 
    'Database reset and setup completed successfully!' as status,
    COUNT(*) as total_users
FROM users;

SELECT 
    'Sample data summary:' as info,
    (SELECT COUNT(*) FROM users) as users,
    (SELECT COUNT(*) FROM earnings) as earnings,
    (SELECT COUNT(*) FROM points) as points,
    (SELECT COUNT(*) FROM items) as items,
    (SELECT COUNT(*) FROM friends) as friendships,
    (SELECT COUNT(*) FROM visits) as visits,
    (SELECT COUNT(*) FROM guestbook) as guestbook_messages;

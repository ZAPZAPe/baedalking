-- 🔄 배달킹 데이터베이스 완전 초기화 및 재설정 스크립트
-- 이 스크립트는 모든 테이블과 데이터를 삭제하고 처음부터 설정합니다.

-- 1. 기존 테이블 및 정책 삭제 (순서 중요)
DO $$ 
BEGIN
    -- 정책 삭제
    IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view public profiles') THEN
        DROP POLICY "Users can view public profiles" ON users;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can update own profile') THEN
        DROP POLICY "Users can update own profile" ON users;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view public minihome_id') THEN
        DROP POLICY "Users can view public minihome_id" ON users;
    END IF;
    
    -- 트리거 삭제
    IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_visit_count_trigger') THEN
        DROP TRIGGER update_visit_count_trigger ON minihome_visits;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'reset_daily_visitors_trigger') THEN
        DROP TRIGGER reset_daily_visitors_trigger ON users;
    END IF;
END $$;

-- 테이블 삭제 (의존성 순서대로)
DROP TABLE IF EXISTS minihome_visits CASCADE;
DROP TABLE IF EXISTS guestbook CASCADE;
DROP TABLE IF EXISTS friends CASCADE;
DROP TABLE IF EXISTS points CASCADE;
DROP TABLE IF EXISTS earnings CASCADE;
DROP TABLE IF EXISTS items CASCADE;
DROP TABLE IF EXISTS user_items CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- 함수 삭제
DROP FUNCTION IF EXISTS update_visit_count() CASCADE;
DROP FUNCTION IF EXISTS reset_daily_visitors() CASCADE;

-- 2. UUID 확장 설정
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 3. 사용자 테이블 생성
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    nickname VARCHAR(50),
    region VARCHAR(100) DEFAULT '서울특별시',
    status_message TEXT,
    avatar_config JSONB DEFAULT '{}',
    garage_config JSONB DEFAULT '{}',
    total_visitors INTEGER DEFAULT 0,
    daily_visitors INTEGER DEFAULT 0,
    last_visitor_reset TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    kakao_id VARCHAR(50) UNIQUE,
    avatar_url TEXT,
    minihome_id VARCHAR(50) UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. 수입 기록 테이블 생성
CREATE TABLE earnings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL,
    mission_amount INTEGER DEFAULT 0,
    delivery_count INTEGER DEFAULT 1,
    date DATE NOT NULL,
    screenshot_url TEXT NOT NULL,
    verified BOOLEAN DEFAULT TRUE,
    points_awarded INTEGER DEFAULT 0,
    screenshot_text TEXT DEFAULT '',
    verified_score DECIMAL(5,2) DEFAULT 95.0,
    platform TEXT CHECK (platform IN ('baemin', 'coupang', 'other')) DEFAULT 'baemin',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. 포인트 테이블 생성
CREATE TABLE points (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL,
    type VARCHAR(20) CHECK (type IN ('earn', 'spend', 'deduct')) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. 아이템 테이블 생성
CREATE TABLE items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    type VARCHAR(50) NOT NULL,
    image_url TEXT,
    price INTEGER NOT NULL DEFAULT 0,
    description TEXT,
    category VARCHAR(50) DEFAULT 'basic',
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. 사용자 소유 아이템 테이블 생성
CREATE TABLE user_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    item_id UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE,
    is_equipped BOOLEAN DEFAULT FALSE,
    acquired_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, item_id)
);

-- 8. 친구 관계 테이블 생성
CREATE TABLE friends (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    friend_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(20) CHECK (status IN ('pending', 'accepted', 'rejected')) DEFAULT 'pending',
    requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    accepted_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(user_id, friend_id),
    CHECK (user_id != friend_id)
);

-- 9. 방명록 테이블 생성
CREATE TABLE guestbook (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    visitor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    is_private BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. 미니홈피 방문 기록 테이블 생성
CREATE TABLE minihome_visits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    minihome_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    visitor_id UUID REFERENCES users(id) ON DELETE CASCADE,
    visited_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    visit_date DATE DEFAULT CURRENT_DATE,
    UNIQUE(minihome_user_id, visitor_id, visit_date)
);

-- 11. 인덱스 생성 (성능 최적화)
CREATE INDEX idx_earnings_user_date ON earnings(user_id, date);
CREATE INDEX idx_earnings_date ON earnings(date);
CREATE INDEX idx_points_user_id ON points(user_id);
CREATE INDEX idx_friends_user_id ON friends(user_id);
CREATE INDEX idx_friends_friend_id ON friends(friend_id);
CREATE INDEX idx_guestbook_user_id ON guestbook(user_id);
CREATE INDEX idx_minihome_visits_user_id ON minihome_visits(minihome_user_id);

-- 12. 방문자 수 업데이트 함수 생성
CREATE OR REPLACE FUNCTION update_visit_count()
RETURNS TRIGGER AS $$
BEGIN
    -- 총 방문자 수 증가
    UPDATE users 
    SET total_visitors = total_visitors + 1,
        daily_visitors = daily_visitors + 1
    WHERE id = NEW.minihome_user_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 13. 일일 방문자 수 초기화 함수 생성
CREATE OR REPLACE FUNCTION reset_daily_visitors()
RETURNS TRIGGER AS $$
BEGIN
    -- 하루가 지났으면 일일 방문자 수 초기화
    IF NEW.last_visitor_reset::date < CURRENT_DATE THEN
        NEW.daily_visitors = 0;
        NEW.last_visitor_reset = CURRENT_TIMESTAMP;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 14. 트리거 생성
CREATE TRIGGER update_visit_count_trigger
    AFTER INSERT ON minihome_visits
    FOR EACH ROW
    EXECUTE FUNCTION update_visit_count();

CREATE TRIGGER reset_daily_visitors_trigger
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION reset_daily_visitors();

-- 15. RLS (Row Level Security) 설정
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE earnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE points ENABLE ROW LEVEL SECURITY;
ALTER TABLE friends ENABLE ROW LEVEL SECURITY;
ALTER TABLE guestbook ENABLE ROW LEVEL SECURITY;
ALTER TABLE minihome_visits ENABLE ROW LEVEL SECURITY;

-- 16. RLS 정책 생성
-- 사용자 테이블 정책
CREATE POLICY "Users can view public profiles" ON users
    FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid() = id);

-- 수입 기록 정책
CREATE POLICY "Users can view own earnings" ON earnings
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own earnings" ON earnings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own earnings" ON earnings
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own earnings" ON earnings
    FOR DELETE USING (auth.uid() = user_id);

-- 포인트 정책
CREATE POLICY "Users can view own points" ON points
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own points" ON points
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 친구 관계 정책
CREATE POLICY "Users can view own friendships" ON friends
    FOR SELECT USING (auth.uid() = user_id OR auth.uid() = friend_id);

CREATE POLICY "Users can manage own friendships" ON friends
    FOR ALL USING (auth.uid() = user_id OR auth.uid() = friend_id);

-- 방명록 정책
CREATE POLICY "Users can view guestbook" ON guestbook
    FOR SELECT USING (true);

CREATE POLICY "Users can write guestbook" ON guestbook
    FOR INSERT WITH CHECK (auth.uid() = visitor_id);

-- 미니홈피 방문 정책
CREATE POLICY "Users can view visits" ON minihome_visits
    FOR SELECT USING (true);

CREATE POLICY "Users can record visits" ON minihome_visits
    FOR INSERT WITH CHECK (auth.uid() = visitor_id);

-- 17. 기본 아이템 데이터 삽입
INSERT INTO items (name, type, image_url, price, description, category, is_default) VALUES
-- 배경 아이템
('기본 차고지', 'background', '/assets/background/background.png', 0, '기본 차고지 배경입니다.', 'basic', true),
('도시 야경', 'background', '/assets/background/background1.png', 1000, '반짝이는 도시의 야경 배경입니다.', 'premium', false),
('자연 풍경', 'background', '/assets/background/background2.png', 800, '아름다운 자연 풍경 배경입니다.', 'premium', false),
('미래 도시', 'background', '/assets/background/background3.png', 1200, '사이버펑크 스타일의 미래 도시입니다.', 'premium', false),
('해변가', 'background', '/assets/background/background4.png', 900, '시원한 해변가 배경입니다.', 'premium', false),

-- 캐릭터 아이템
('기본 헬멧', 'character', '/assets/character/character-base.png', 0, '기본 배달원 헬멧입니다.', 'basic', true),
('프리미엄 헬멧', 'character', '/assets/character/character-happy.png', 500, '고급 안전 헬멧입니다.', 'premium', false),
('스포츠 헬멧', 'character', '/assets/character/character-angry.png', 600, '스포츠용 헬멧입니다.', 'premium', false),
('레트로 헬멧', 'character', '/assets/character/character-tired.png', 700, '빈티지 스타일 헬멧입니다.', 'premium', false),

-- 운송수단 아이템
('기본 스쿠터', 'vehicle', '/assets/vehicle/scooter.png', 0, '기본 배달용 스쿠터입니다.', 'basic', true),
('전기 스쿠터', 'vehicle', '/assets/vehicle/scooter.png', 2000, '친환경 전기 스쿠터입니다.', 'premium', false),
('스포츠 바이크', 'vehicle', '/assets/vehicle/scooter.png', 3000, '빠른 스포츠 바이크입니다.', 'premium', false);

-- 18. 샘플 사용자 데이터 생성 (현재 월 기준)
DO $$
DECLARE
    user_ids UUID[] := ARRAY[
        uuid_generate_v4(),
        uuid_generate_v4(),
        uuid_generate_v4(),
        uuid_generate_v4(),
        uuid_generate_v4()
    ];
    current_month TEXT := to_char(CURRENT_DATE, 'YYYY-MM');
    i INTEGER;
BEGIN
    -- 샘플 사용자들 생성
    INSERT INTO users (id, email, nickname, region, kakao_id, minihome_id) VALUES
    (user_ids[1], 'user1@example.com', '배달왕김철수', '서울특별시 강남구', 'kakao1', 'user_1'),
    (user_ids[2], 'user2@example.com', '배달여신이영희', '서울특별시 서초구', 'kakao2', 'user_2'),
    (user_ids[3], 'user3@example.com', '스피드맨박민수', '서울특별시 마포구', 'kakao3', 'user_3'),
    (user_ids[4], 'user4@example.com', '정확맨최지영', '서울특별시 종로구', 'kakao4', 'user_4'),
    (user_ids[5], 'user5@example.com', '친절맨정수민', '서울특별시 용산구', 'kakao5', 'user_5');

    -- 각 사용자별로 수입 데이터 생성 (현재 월)
    FOR i IN 1..5 LOOP
        -- 일별 수입 기록 생성 (최근 30일)
        FOR day_offset IN 0..29 LOOP
            IF random() > 0.3 THEN -- 70% 확률로 수입 있음
                INSERT INTO earnings (user_id, amount, mission_amount, delivery_count, platform, date) VALUES
                (
                    user_ids[i],
                    (random() * 100000 + 20000)::INTEGER, -- 20,000 ~ 120,000원
                    (random() * 30000 + 5000)::INTEGER,   -- 5,000 ~ 35,000원
                    (random() * 15 + 1)::INTEGER,         -- 1 ~ 15건
                    CASE 
                        WHEN random() < 0.6 THEN 'baemin'
                        WHEN random() < 0.9 THEN 'coupang'
                        ELSE 'other'
                    END,
                    (CURRENT_DATE - day_offset)::DATE
                );
            END IF;
        END LOOP;

        -- 포인트 기록 생성
        INSERT INTO points (user_id, amount, type, description) VALUES
        (user_ids[i], 1000 + (random() * 2000)::INTEGER, 'earn', '회원가입 보너스'),
        (user_ids[i], 500 + (random() * 1000)::INTEGER, 'earn', '배달 완료 보너스');
    END LOOP;

    -- 친구 관계 설정
    INSERT INTO friends (user_id, friend_id, status, accepted_at) VALUES
    (user_ids[1], user_ids[2], 'accepted', NOW()),
    (user_ids[1], user_ids[3], 'accepted', NOW()),
    (user_ids[2], user_ids[3], 'accepted', NOW()),
    (user_ids[2], user_ids[4], 'pending', NULL),
    (user_ids[3], user_ids[5], 'accepted', NOW());

    -- 방명록 메시지 추가
    INSERT INTO guestbook (user_id, visitor_id, message) VALUES
    (user_ids[1], user_ids[2], '오늘도 화이팅하세요! 🚀'),
    (user_ids[1], user_ids[3], '배달 수고하셨습니다! 👏'),
    (user_ids[2], user_ids[1], '항상 안전하게 배달하세요! 🛵'),
    (user_ids[3], user_ids[1], '최고의 배달킹! 💪'),
    (user_ids[3], user_ids[2], '오늘 수입 좋네요! 축하해요! 🎉');

END $$;

-- 19. 완료 메시지
SELECT 
    'Database reset and setup completed successfully!' as status,
    (SELECT COUNT(*) FROM users) as total_users,
    (SELECT COUNT(*) FROM earnings) as total_earnings,
    (SELECT COUNT(*) FROM friends) as total_friendships,
    (SELECT COUNT(*) FROM guestbook) as total_guestbook_messages;

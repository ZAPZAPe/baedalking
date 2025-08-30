-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    kakao_id TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    nickname TEXT NOT NULL,
    region TEXT NOT NULL DEFAULT '서울',
    avatar_config JSONB DEFAULT '{}',
    garage_config JSONB DEFAULT '{}',
    status_message TEXT,
    is_income_private BOOLEAN DEFAULT false,
    platforms JSONB DEFAULT '[
        {"id": "baemin", "name": "배민", "icon": "/baemin-logo.svg", "color": "#00C851", "isActive": true, "type": "default"},
        {"id": "coupang", "name": "쿠팡", "icon": "/coupang-logo.svg", "color": "#E4002B", "isActive": true, "type": "default"}
    ]',
    goals JSONB DEFAULT '{"daily": 50000, "weekly": 350000, "monthly": 1500000}',
    total_visitors INTEGER DEFAULT 0,
    daily_visitors INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create earnings table
CREATE TABLE IF NOT EXISTS earnings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    platform TEXT NOT NULL DEFAULT 'baemin',
    delivery_count INTEGER NOT NULL DEFAULT 0,
    delivery_amount INTEGER NOT NULL DEFAULT 0,
    mission_amount INTEGER NOT NULL DEFAULT 0,
    total_amount INTEGER GENERATED ALWAYS AS (delivery_amount + mission_amount) STORED,
    date DATE NOT NULL,
    screenshot_url TEXT,
    verified BOOLEAN DEFAULT true,
    points_awarded INTEGER DEFAULT 0,
    screenshot_text TEXT DEFAULT '',
    verified_score DECIMAL(5,2) DEFAULT 95.0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create points table
CREATE TABLE IF NOT EXISTS points (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL,
    type TEXT CHECK (type IN ('earn', 'spend')) NOT NULL,
    reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create items table
CREATE TABLE IF NOT EXISTS items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    type TEXT CHECK (type IN ('character', 'vehicle', 'background', 'decoration')) NOT NULL,
    asset_url TEXT NOT NULL,
    price INTEGER NOT NULL,
    description TEXT DEFAULT '',
    category TEXT DEFAULT 'basic',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_items table
CREATE TABLE IF NOT EXISTS user_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    item_id UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE,
    equipped BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, item_id)
);

-- Create friends table
CREATE TABLE IF NOT EXISTS friends (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    friend_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status TEXT CHECK (status IN ('pending', 'accepted', 'rejected')) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, friend_id)
);

-- Create visits table
CREATE TABLE IF NOT EXISTS visits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    visited_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create guestbook table
CREATE TABLE IF NOT EXISTS guestbook (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    visitor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    is_private BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_kakao_id ON users(kakao_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_earnings_user_id ON earnings(user_id);
CREATE INDEX IF NOT EXISTS idx_earnings_date ON earnings(date);
CREATE INDEX IF NOT EXISTS idx_earnings_platform ON earnings(platform);
CREATE INDEX IF NOT EXISTS idx_points_user_id ON points(user_id);
CREATE INDEX IF NOT EXISTS idx_points_type ON points(type);
CREATE INDEX IF NOT EXISTS idx_user_items_user_id ON user_items(user_id);
CREATE INDEX IF NOT EXISTS idx_friends_user_id ON friends(user_id);
CREATE INDEX IF NOT EXISTS idx_friends_status ON friends(status);
CREATE INDEX IF NOT EXISTS idx_visits_visited_user_id ON visits(visited_user_id);
CREATE INDEX IF NOT EXISTS idx_guestbook_user_id ON guestbook(user_id);
CREATE INDEX IF NOT EXISTS idx_guestbook_visitor_id ON guestbook(visitor_id);

-- Insert sample items
INSERT INTO items (name, type, asset_url, price, description, category) VALUES
-- Background items
('기본 배경', 'background', '/assets/background/background.png', 0, '시작할 때 제공되는 기본 배경입니다.', 'background'),
('레트로 배경', 'background', '/assets/background/background1.png', 1000, '80년대 감성의 레트로 스타일 배경입니다.', 'background'),
('미래지향 배경', 'background', '/assets/background/background2.png', 2000, '첨단 기술의 미래적인 배경입니다.', 'background'),
('자연 배경', 'background', '/assets/background/background3.png', 1500, '평화로운 자연의 배경입니다.', 'background'),
('도시 배경', 'background', '/assets/background/background4.png', 1800, '활기찬 도시의 야경 배경입니다.', 'background'),

-- Character items
('기본 캐릭터', 'character', '/assets/character/character-base.png', 0, '시작할 때 제공되는 기본 캐릭터입니다.', 'character'),
('행복한 표정', 'character', '/assets/character/character-happy.png', 500, '기분 좋은 날의 행복한 표정입니다.', 'character'),
('화난 표정', 'character', '/assets/character/character-angry.png', 300, '스트레스받는 날의 화난 표정입니다.', 'character'),
('피곤한 표정', 'character', '/assets/character/character-tired.png', 400, '힘든 하루 끝의 피곤한 표정입니다.', 'character'),

-- Vehicle items
('기본 스쿠터', 'vehicle', '/assets/vehicle/scooter.png', 0, '배달의 기본! 믿음직한 스쿠터입니다.', 'vehicle')
ON CONFLICT DO NOTHING;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for users table
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE earnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE points ENABLE ROW LEVEL SECURITY;
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE friends ENABLE ROW LEVEL SECURITY;
ALTER TABLE visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE guestbook ENABLE ROW LEVEL SECURITY;

-- 개발 환경용 간단한 RLS 정책 (모든 사용자가 접근 가능)
-- Users policies
CREATE POLICY "Enable read access for all users" ON users FOR SELECT USING (true);
CREATE POLICY "Enable insert for all users" ON users FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for all users" ON users FOR UPDATE USING (true);

-- Earnings policies
CREATE POLICY "Enable read access for all users" ON earnings FOR SELECT USING (true);
CREATE POLICY "Enable insert for all users" ON earnings FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for all users" ON earnings FOR UPDATE USING (true);
CREATE POLICY "Enable delete for all users" ON earnings FOR DELETE USING (true);

-- Points policies
CREATE POLICY "Enable read access for all users" ON points FOR SELECT USING (true);
CREATE POLICY "Enable insert for all users" ON points FOR INSERT WITH CHECK (true);

-- Items policies (public read access)
CREATE POLICY "Enable read access for all users" ON items FOR SELECT USING (true);

-- User items policies
CREATE POLICY "Enable read access for all users" ON user_items FOR SELECT USING (true);
CREATE POLICY "Enable insert for all users" ON user_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for all users" ON user_items FOR UPDATE USING (true);

-- Friends policies
CREATE POLICY "Enable read access for all users" ON friends FOR SELECT USING (true);
CREATE POLICY "Enable insert for all users" ON friends FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for all users" ON friends FOR UPDATE USING (true);

-- Visits policies
CREATE POLICY "Enable read access for all users" ON visits FOR SELECT USING (true);
CREATE POLICY "Enable insert for all users" ON visits FOR INSERT WITH CHECK (true);

-- Guestbook policies
CREATE POLICY "Enable read access for all users" ON guestbook FOR SELECT USING (true);
CREATE POLICY "Enable insert for all users" ON guestbook FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for all users" ON guestbook FOR UPDATE USING (true);
CREATE POLICY "Enable delete for all users" ON guestbook FOR DELETE USING (true);

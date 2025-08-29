-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    nickname TEXT NOT NULL,
    region TEXT NOT NULL,
    kakao_id TEXT UNIQUE,
    avatar_url TEXT,
    avatar_config JSONB DEFAULT '{}',
    garage_config JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create earnings table
CREATE TABLE IF NOT EXISTS earnings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL,
    date DATE NOT NULL,
    screenshot_url TEXT NOT NULL,
    verified BOOLEAN DEFAULT TRUE,
    points_awarded INTEGER DEFAULT 0,
    screenshot_text TEXT DEFAULT '',
    verified_score DECIMAL(5,2) DEFAULT 95.0,
    platform TEXT CHECK (platform IN ('baemin', 'coupang', 'other')) DEFAULT 'baemin',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create points table
CREATE TABLE IF NOT EXISTS points (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL,
    type TEXT CHECK (type IN ('earn', 'spend')) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create items table
CREATE TABLE IF NOT EXISTS items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    type TEXT CHECK (type IN ('character', 'garage')) NOT NULL,
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
    equipped BOOLEAN DEFAULT FALSE,
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

-- Create rewards table
CREATE TABLE IF NOT EXISTS rewards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reward_type TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create guestbook table
CREATE TABLE IF NOT EXISTS guestbook (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    visitor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    is_private BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_kakao_id ON users(kakao_id);
CREATE INDEX IF NOT EXISTS idx_earnings_user_id ON earnings(user_id);
CREATE INDEX IF NOT EXISTS idx_earnings_date ON earnings(date);

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
('기본 배경', 'garage', '/assets/garage/default-bg.png', 0, '시작할 때 제공되는 기본 배경입니다.', 'background'),
('레트로 배경', 'garage', '/assets/garage/retro-bg.png', 1000, '80년대 감성의 레트로 스타일 배경입니다.', 'background'),
('미래지향 배경', 'garage', '/assets/garage/futuristic-bg.png', 2000, '첨단 기술의 미래적인 배경입니다.', 'background'),
('자연 배경', 'garage', '/assets/garage/nature-bg.png', 1500, '평화로운 자연의 배경입니다.', 'background'),
('식물 장식', 'garage', '/assets/garage/plant.png', 500, '싱그러운 식물로 공간을 꾸며보세요.', 'decoration'),
('램프 장식', 'garage', '/assets/garage/lamp.png', 300, '따뜻한 조명으로 분위기를 연출합니다.', 'decoration'),
('트로피 장식', 'garage', '/assets/garage/trophy.png', 2000, '배달왕의 명예를 보여주는 트로피입니다.', 'decoration'),
('선물 상자', 'garage', '/assets/garage/gift.png', 800, '신비로운 선물 상자입니다.', 'decoration'),
('기본 의상', 'character', '/assets/character/default-outfit.png', 0, '시작할 때 입고 있는 기본 의상입니다.', 'outfit'),
('스포츠 의상', 'character', '/assets/character/sports-outfit.png', 1500, '활동적인 스포츠 의상입니다.', 'outfit'),
('정장', 'character', '/assets/character/suit.png', 3000, '격식 있는 정장 스타일입니다.', 'outfit'),
('캐주얼 의상', 'character', '/assets/character/casual-outfit.png', 1000, '편안한 캐주얼 의상입니다.', 'outfit')
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
ALTER TABLE rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE guestbook ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Users can only see their own data
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid() = id);

-- Earnings policies
CREATE POLICY "Users can view own earnings" ON earnings
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own earnings" ON earnings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Points policies
CREATE POLICY "Users can view own points" ON points
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own points" ON points
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Items policies (public read access)
CREATE POLICY "Anyone can view items" ON items
    FOR SELECT USING (true);

-- User items policies
CREATE POLICY "Users can view own items" ON user_items
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own items" ON user_items
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own items" ON user_items
    FOR UPDATE USING (auth.uid() = user_id);

-- Friends policies
CREATE POLICY "Users can view own friends" ON friends
    FOR SELECT USING (auth.uid() = user_id OR auth.uid() = friend_id);

CREATE POLICY "Users can insert friend requests" ON friends
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update friend status" ON friends
    FOR UPDATE USING (auth.uid() = friend_id);

-- Visits policies
CREATE POLICY "Users can view visits to their garage" ON visits
    FOR SELECT USING (auth.uid() = visited_user_id);

CREATE POLICY "Users can record visits" ON visits
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Guestbook policies
CREATE POLICY "Users can view guestbook messages" ON guestbook
    FOR SELECT USING (auth.uid() = user_id OR auth.uid() = visitor_id);

CREATE POLICY "Users can insert guestbook messages" ON guestbook
    FOR INSERT WITH CHECK (auth.uid() = visitor_id);

CREATE POLICY "Users can delete own messages or messages on their guestbook" ON guestbook
    FOR DELETE USING (auth.uid() = visitor_id OR auth.uid() = user_id);

-- Rewards policies
CREATE POLICY "Users can view own rewards" ON rewards
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own rewards" ON rewards
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Items are public
CREATE POLICY "Items are viewable by everyone" ON items
    FOR SELECT USING (true);

-- Guestbook policies
CREATE POLICY "Users can view guestbook messages on their page" ON guestbook
    FOR SELECT USING (auth.uid() = user_id OR auth.uid() = visitor_id);

CREATE POLICY "Users can write guestbook messages" ON guestbook
    FOR INSERT WITH CHECK (auth.uid() = visitor_id);

CREATE POLICY "Users can delete messages on their own guestbook" ON guestbook
    FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Message writers can delete their own messages" ON guestbook
    FOR DELETE USING (auth.uid() = visitor_id);

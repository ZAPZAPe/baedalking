-- 필요한 확장 활성화
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- update_updated_at_column 함수가 없으면 생성
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 사용자 설정 테이블 생성
CREATE TABLE IF NOT EXISTS user_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- 플랫폼 설정
    platforms JSONB DEFAULT '[
        {"id": "baemin", "name": "배민", "icon": "/baemin-logo.svg", "color": "#00C851", "bgColor": "#00C851/20", "isActive": true, "type": "default"},
        {"id": "coupang", "name": "쿠팡", "icon": "/coupang-logo.svg", "color": "#E4002B", "bgColor": "#E4002B/20", "isActive": true, "type": "default"}
    ]'::jsonb,
    
    -- 목표 설정
    daily_goal INTEGER DEFAULT 50000,
    weekly_goal INTEGER DEFAULT 350000,
    monthly_goal INTEGER DEFAULT 1500000,
    
    -- 프라이버시 설정
    is_income_private BOOLEAN DEFAULT false,
    is_profile_public BOOLEAN DEFAULT true,
    
    -- 커스터마이징 설정
    current_emotion TEXT DEFAULT 'happy',
    speech_text TEXT DEFAULT '안녕하세요!',
    garage_intro TEXT DEFAULT '열심히 달리는 배달킹입니다! 🛵💨',
    current_background TEXT DEFAULT 'background',
    current_vehicle TEXT DEFAULT 'scooter',
    current_character_item TEXT DEFAULT 'basic',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id)
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(user_id);

-- RLS 정책 설정
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- 개발 환경용 간단한 RLS 정책
CREATE POLICY "Users can view own settings" ON user_settings
    FOR SELECT USING (true);

CREATE POLICY "Users can update own settings" ON user_settings
    FOR UPDATE USING (true);

CREATE POLICY "Users can insert own settings" ON user_settings
    FOR INSERT WITH CHECK (true);

-- 프로덕션에서는 아래와 같이 사용:
-- CREATE POLICY "Users can view own settings" ON user_settings
--     FOR SELECT USING (auth.uid()::text = user_id::text);
-- CREATE POLICY "Users can update own settings" ON user_settings
--     FOR UPDATE USING (auth.uid()::text = user_id::text);
-- CREATE POLICY "Users can insert own settings" ON user_settings
--     FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

-- 업데이트 트리거
CREATE TRIGGER update_user_settings_updated_at BEFORE UPDATE ON user_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 새 사용자 생성 시 자동으로 설정 생성
CREATE OR REPLACE FUNCTION create_user_settings()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO user_settings (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER create_settings_for_new_user
AFTER INSERT ON users
FOR EACH ROW
EXECUTE FUNCTION create_user_settings();

-- 기존 사용자들에 대한 설정 생성
INSERT INTO user_settings (user_id)
SELECT id FROM users
WHERE id NOT IN (SELECT user_id FROM user_settings)
ON CONFLICT (user_id) DO NOTHING;

-- 사용자 프로필 테이블 확장
ALTER TABLE users ADD COLUMN IF NOT EXISTS nickname VARCHAR(50);
ALTER TABLE users ADD COLUMN IF NOT EXISTS status_message TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS total_visitors INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS daily_visitors INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_visitor_reset TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- 미니홈피 설정 테이블
CREATE TABLE IF NOT EXISTS minihome_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  background VARCHAR(50) DEFAULT 'background.png',
  character_emotion VARCHAR(50) DEFAULT 'base',
  vehicle VARCHAR(50) DEFAULT 'scooter',
  speech_text TEXT DEFAULT '안녕하세요!',
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id)
);

-- 친구 관계 테이블
CREATE TABLE IF NOT EXISTS friendships (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  friend_id UUID REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'pending', -- pending, accepted, blocked
  requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  accepted_at TIMESTAMP,
  UNIQUE(user_id, friend_id),
  CHECK (user_id != friend_id)
);

-- 친구 관계 인덱스
CREATE INDEX idx_friendships_user_id ON friendships(user_id);
CREATE INDEX idx_friendships_friend_id ON friendships(friend_id);
CREATE INDEX idx_friendships_status ON friendships(status);

-- 방명록 테이블
CREATE TABLE IF NOT EXISTS guestbook_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  minihome_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  writer_id UUID REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_private BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 방명록 인덱스
CREATE INDEX idx_guestbook_minihome_user ON guestbook_entries(minihome_user_id);
CREATE INDEX idx_guestbook_writer ON guestbook_entries(writer_id);
CREATE INDEX idx_guestbook_created_at ON guestbook_entries(created_at DESC);

-- 미니홈피 방문 기록 테이블
CREATE TABLE IF NOT EXISTS minihome_visits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  minihome_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  visitor_id UUID REFERENCES users(id) ON DELETE CASCADE,
  visited_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  visit_date DATE DEFAULT CURRENT_DATE,
  UNIQUE(minihome_user_id, visitor_id, visit_date)
);

-- 방문 기록 인덱스
CREATE INDEX idx_visits_minihome_user ON minihome_visits(minihome_user_id);
CREATE INDEX idx_visits_visited_at ON minihome_visits(visited_at);

-- 친구 요청 알림을 위한 트리거
CREATE OR REPLACE FUNCTION notify_friend_request()
RETURNS TRIGGER AS $$
BEGIN
  -- 여기에 알림 로직 추가 가능
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER friendship_request_notification
AFTER INSERT ON friendships
FOR EACH ROW
WHEN (NEW.status = 'pending')
EXECUTE FUNCTION notify_friend_request();

-- 방문자 수 업데이트 함수
CREATE OR REPLACE FUNCTION update_visitor_count()
RETURNS TRIGGER AS $$
BEGIN
  -- 총 방문자 수 증가
  UPDATE users 
  SET total_visitors = total_visitors + 1
  WHERE id = NEW.minihome_user_id;
  
  -- 일일 방문자 수 증가
  UPDATE users 
  SET daily_visitors = daily_visitors + 1
  WHERE id = NEW.minihome_user_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_visitor_count_trigger
AFTER INSERT ON minihome_visits
FOR EACH ROW
EXECUTE FUNCTION update_visitor_count();

-- 일일 방문자 수 리셋 함수
CREATE OR REPLACE FUNCTION reset_daily_visitors()
RETURNS void AS $$
BEGIN
  UPDATE users
  SET daily_visitors = 0,
      last_visitor_reset = CURRENT_TIMESTAMP
  WHERE DATE(last_visitor_reset) < CURRENT_DATE;
END;
$$ LANGUAGE plpgsql;

-- RLS (Row Level Security) 정책
ALTER TABLE minihome_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;
ALTER TABLE guestbook_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE minihome_visits ENABLE ROW LEVEL SECURITY;

-- 미니홈피 설정 정책
CREATE POLICY "Users can view their own minihome settings" 
  ON minihome_settings FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own minihome settings" 
  ON minihome_settings FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own minihome settings" 
  ON minihome_settings FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- 친구 관계 정책
CREATE POLICY "Users can view their friendships" 
  ON friendships FOR SELECT 
  USING (auth.uid() = user_id OR auth.uid() = friend_id);

CREATE POLICY "Users can create friend requests" 
  ON friendships FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update friendships they are part of" 
  ON friendships FOR UPDATE 
  USING (auth.uid() = user_id OR auth.uid() = friend_id);

CREATE POLICY "Users can delete their friendships" 
  ON friendships FOR DELETE 
  USING (auth.uid() = user_id OR auth.uid() = friend_id);

-- 방명록 정책
CREATE POLICY "Public guestbook entries are visible to all" 
  ON guestbook_entries FOR SELECT 
  USING (NOT is_private OR auth.uid() = writer_id OR auth.uid() = minihome_user_id);

CREATE POLICY "Users can write guestbook entries" 
  ON guestbook_entries FOR INSERT 
  WITH CHECK (auth.uid() = writer_id);

CREATE POLICY "Users can update their own guestbook entries" 
  ON guestbook_entries FOR UPDATE 
  USING (auth.uid() = writer_id);

CREATE POLICY "Users can delete their own guestbook entries" 
  ON guestbook_entries FOR DELETE 
  USING (auth.uid() = writer_id OR auth.uid() = minihome_user_id);

-- 방문 기록 정책
CREATE POLICY "Users can insert visit records" 
  ON minihome_visits FOR INSERT 
  WITH CHECK (auth.uid() = visitor_id);

CREATE POLICY "Minihome owners can view their visit records" 
  ON minihome_visits FOR SELECT 
  USING (auth.uid() = minihome_user_id);

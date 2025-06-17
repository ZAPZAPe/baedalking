-- 배달킹 데이터베이스 스키마 (Supabase)

-- 사용자 테이블
CREATE TABLE users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  nickname VARCHAR(50),
  region VARCHAR(100),
  vehicle VARCHAR(50),
  phone VARCHAR(20),
  points INTEGER DEFAULT 0,
  total_deliveries INTEGER DEFAULT 0,
  total_earnings DECIMAL(10,2) DEFAULT 0.00,
  profile_image TEXT,
  role VARCHAR(20) DEFAULT 'user',
  referral_code VARCHAR(50),
  notification_settings JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 배달 기록 테이블
CREATE TABLE delivery_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  delivery_count INTEGER NOT NULL,
  platform VARCHAR(50) NOT NULL,
  verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 친구 요청 테이블
CREATE TABLE friend_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  from_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  to_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 랭킹 테이블
CREATE TABLE rankings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  nickname VARCHAR(50) NOT NULL,
  region VARCHAR(100) NOT NULL,
  total_earnings DECIMAL(10,2) NOT NULL,
  total_deliveries INTEGER NOT NULL,
  rank_type VARCHAR(20) NOT NULL, -- 'daily', 'weekly', 'monthly'
  date DATE NOT NULL,
  rank INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 포인트 히스토리 테이블
CREATE TABLE point_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  points INTEGER NOT NULL,
  reason TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 자동 업데이트 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 트리거 설정
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_delivery_records_updated_at BEFORE UPDATE ON delivery_records FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_friend_requests_updated_at BEFORE UPDATE ON friend_requests FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_rankings_updated_at BEFORE UPDATE ON rankings FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_point_history_updated_at BEFORE UPDATE ON point_history FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- 인덱스 생성 (성능 최적화)
CREATE INDEX idx_delivery_records_user_id ON delivery_records(user_id);
CREATE INDEX idx_delivery_records_date ON delivery_records(date);
CREATE INDEX idx_rankings_rank_type_date ON rankings(rank_type, date);
CREATE INDEX idx_point_history_user_id ON point_history(user_id);

-- Row Level Security 설정 (보안)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE friend_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE point_history ENABLE ROW LEVEL SECURITY;

-- 사용자 정책 (본인 데이터만 접근 가능)
CREATE POLICY "Users can view own profile" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON users FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can view own delivery records" ON delivery_records FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own delivery records" ON delivery_records FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own friend requests" ON friend_requests FOR ALL USING (auth.uid() = from_user_id OR auth.uid() = to_user_id);
CREATE POLICY "Users can view own point history" ON point_history FOR SELECT USING (auth.uid() = user_id);

-- 랭킹은 모든 사용자가 볼 수 있음
CREATE POLICY "Anyone can view rankings" ON rankings FOR SELECT TO authenticated USING (true);

-- 알림 테이블
CREATE TABLE notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE, -- null이면 전체 공지
  type VARCHAR(20) NOT NULL, -- 'notice', 'point', 'ranking', 'yesterday', 'invite'
  title VARCHAR(100) NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 알림 테이블 트리거
CREATE TRIGGER update_notifications_updated_at BEFORE UPDATE ON notifications FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- 알림 인덱스
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);

-- 알림 보안 정책
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own notifications and public notices" ON notifications FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);
CREATE POLICY "Users can update own notifications" ON notifications FOR UPDATE USING (auth.uid() = user_id); 
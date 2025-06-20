-- ====================================================================
-- 배달킹 - 빠른 설정 스크립트
-- 필수 테이블이 없는 경우 빠르게 생성
-- ====================================================================

-- notifications 테이블 생성
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  notification_type VARCHAR(50) NOT NULL DEFAULT 'info',
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- point_history 테이블 생성
CREATE TABLE IF NOT EXISTS point_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  points INTEGER NOT NULL,
  point_type VARCHAR(50) NOT NULL DEFAULT 'admin',
  reason TEXT NOT NULL,
  description TEXT,
  related_record_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- invites 테이블 생성
CREATE TABLE IF NOT EXISTS invites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  inviter_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  invited_user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  points_rewarded INTEGER DEFAULT 0,
  reward_processed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(invited_user_id)
);

-- daily_ranking_rewards 테이블 생성
CREATE TABLE IF NOT EXISTS daily_ranking_rewards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  rank INTEGER NOT NULL,
  points INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, date)
);

-- system_settings 테이블 생성
CREATE TABLE IF NOT EXISTS system_settings (
  key VARCHAR(100) PRIMARY KEY,
  value TEXT NOT NULL,
  description TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 기본 설정값 삽입
INSERT INTO system_settings (key, value, description) VALUES 
  ('site_name', '배달킹', '사이트 이름'),
  ('admin_email', '', '관리자 이메일'),
  ('ocr_confidence_threshold', '80.0', 'OCR 신뢰도 임계값'),
  ('auto_verify_uploads', 'false', '업로드 자동 검증 여부'),
  ('daily_upload_limit', '50', '일일 업로드 제한'),
  ('point_per_upload', '10', '업로드당 포인트'),
  ('point_per_invite', '500', '초대당 포인트')
ON CONFLICT (key) DO NOTHING;

-- 기본 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_point_history_user_id ON point_history(user_id);
CREATE INDEX IF NOT EXISTS idx_point_history_type ON point_history(point_type);
CREATE INDEX IF NOT EXISTS idx_invites_inviter_id ON invites(inviter_id);
CREATE INDEX IF NOT EXISTS idx_invites_invited_user_id ON invites(invited_user_id);

-- 뷰 생성
CREATE OR REPLACE VIEW today_rankings_realtime AS
SELECT 
  u.id as user_id,
  u.nickname,
  u.region,
  u.vehicle,
  u.profile_image,
  COALESCE(SUM(dr.amount), 0) as today_earnings,
  COALESCE(SUM(dr.delivery_count), 0) as today_deliveries,
  ROW_NUMBER() OVER (ORDER BY COALESCE(SUM(dr.amount), 0) DESC, COALESCE(SUM(dr.delivery_count), 0) DESC) as rank
FROM users u
LEFT JOIN delivery_records dr ON u.id = dr.user_id 
  AND dr.date = CURRENT_DATE 
  AND dr.verified = true
GROUP BY u.id, u.nickname, u.region, u.vehicle, u.profile_image
ORDER BY today_earnings DESC, today_deliveries DESC;

SELECT 
  'quick_setup_completed' as status,
  CURRENT_TIMESTAMP as completed_at,
  'Essential tables created successfully' as message; 
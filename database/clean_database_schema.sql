-- ====================================================================
-- 배달킹 - 정리된 데이터베이스 스키마
-- 실제 사용되는 테이블들만 포함하여 관리 편의성 향상
-- ====================================================================

-- ====================================================================
-- 1. 핵심 사용자 테이블
-- ====================================================================

-- 사용자 프로필 테이블 (기존 users 테이블 개선)
CREATE TABLE IF NOT EXISTS users (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  username VARCHAR(100) UNIQUE NOT NULL,
  nickname VARCHAR(50) UNIQUE NOT NULL,
  region VARCHAR(100) DEFAULT '',
  vehicle VARCHAR(50) DEFAULT 'bicycle',
  phone VARCHAR(20) DEFAULT '',
  
  -- 통계 필드
  points INTEGER DEFAULT 500, -- 가입 보너스
  total_deliveries INTEGER DEFAULT 0,
  total_earnings DECIMAL(10,2) DEFAULT 0,
  
  -- 프로필 정보
  profile_image TEXT,
  referral_code VARCHAR(10) UNIQUE,
  role VARCHAR(20) DEFAULT 'user', -- 'user', 'admin'
  
  -- 알림 설정 (JSON으로 단순화)
  notification_settings JSONB DEFAULT '{"push": true, "email": false, "sms": false}',
  
  -- 메타데이터
  last_login TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ====================================================================
-- 2. 배달 기록 테이블
-- ====================================================================

-- 배달 기록 테이블 (최적화)
CREATE TABLE IF NOT EXISTS delivery_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  
  -- 배달 정보
  date DATE NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  delivery_count INTEGER NOT NULL DEFAULT 1,
  platform VARCHAR(50) NOT NULL, -- 'baemin', 'coupang', 'yogiyo' 등
  
  -- 검증 정보
  verified BOOLEAN DEFAULT false,
  image_url TEXT, -- 영수증 이미지
  
  -- 메타데이터
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ====================================================================
-- 3. 포인트 시스템
-- ====================================================================

-- 포인트 내역 테이블
CREATE TABLE IF NOT EXISTS point_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  
  -- 포인트 정보
  points INTEGER NOT NULL, -- 양수: 적립, 음수: 차감
  point_type VARCHAR(50) NOT NULL, -- 'upload', 'ranking', 'invite', 'admin', 'spend'
  reason TEXT NOT NULL,
  description TEXT,
  
  -- 관련 정보
  related_record_id UUID, -- delivery_records.id 등
  
  -- 메타데이터
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ====================================================================
-- 4. 알림 시스템
-- ====================================================================

-- 알림 테이블
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  
  -- 알림 내용
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  notification_type VARCHAR(50) NOT NULL, -- 'info', 'success', 'warning', 'error'
  
  -- 상태
  read BOOLEAN DEFAULT false,
  
  -- 메타데이터
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ====================================================================
-- 5. 초대 시스템 (단순화)
-- ====================================================================

-- 초대 기록 테이블 (단순화)
CREATE TABLE IF NOT EXISTS invites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  inviter_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  invited_user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  
  -- 보상 정보
  points_rewarded INTEGER DEFAULT 0,
  reward_processed BOOLEAN DEFAULT false,
  
  -- 메타데이터
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  -- 제약조건
  UNIQUE(invited_user_id) -- 한 사용자는 한 번만 초대받을 수 있음
);

-- ====================================================================
-- 6. 일일 랭킹 보상 (기존 유지)
-- ====================================================================

-- 일일 랭킹 보상 테이블
CREATE TABLE IF NOT EXISTS daily_ranking_rewards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  rank INTEGER NOT NULL,
  points INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, date) -- 하루에 한 번만 보상
);

-- ====================================================================
-- 7. 관리자 전용 테이블 (선택적)
-- ====================================================================

-- 시스템 설정 테이블 (단순화)
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

-- ====================================================================
-- 8. 인덱스 생성 (성능 최적화)
-- ====================================================================

-- 사용자 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_users_nickname ON users(nickname);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_referral_code ON users(referral_code);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- 배달 기록 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_delivery_records_user_id ON delivery_records(user_id);
CREATE INDEX IF NOT EXISTS idx_delivery_records_date ON delivery_records(date);
CREATE INDEX IF NOT EXISTS idx_delivery_records_platform ON delivery_records(platform);
CREATE INDEX IF NOT EXISTS idx_delivery_records_verified ON delivery_records(verified);
CREATE INDEX IF NOT EXISTS idx_delivery_records_created_at ON delivery_records(created_at);

-- 포인트 내역 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_point_history_user_id ON point_history(user_id);
CREATE INDEX IF NOT EXISTS idx_point_history_type ON point_history(point_type);
CREATE INDEX IF NOT EXISTS idx_point_history_created_at ON point_history(created_at);

-- 알림 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);

-- 초대 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_invites_inviter_id ON invites(inviter_id);
CREATE INDEX IF NOT EXISTS idx_invites_invited_user_id ON invites(invited_user_id);

-- ====================================================================
-- 9. 유용한 뷰 생성 (실시간 계산)
-- ====================================================================

-- 오늘 실시간 랭킹 뷰
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

-- 사용자 통계 뷰
CREATE OR REPLACE VIEW user_statistics AS
SELECT 
  u.id,
  u.nickname,
  u.total_deliveries,
  u.total_earnings,
  u.points,
  COALESCE(COUNT(dr.id), 0) as verified_records,
  COALESCE(COUNT(CASE WHEN dr.date >= CURRENT_DATE - INTERVAL '7 days' THEN 1 END), 0) as week_deliveries,
  COALESCE(SUM(CASE WHEN dr.date >= CURRENT_DATE - INTERVAL '7 days' THEN dr.amount ELSE 0 END), 0) as week_earnings,
  COALESCE(COUNT(i.id), 0) as total_invites
FROM users u
LEFT JOIN delivery_records dr ON u.id = dr.user_id AND dr.verified = true
LEFT JOIN invites i ON u.id = i.inviter_id
GROUP BY u.id, u.nickname, u.total_deliveries, u.total_earnings, u.points;

-- ====================================================================
-- 10. RLS (Row Level Security) 정책
-- ====================================================================

-- RLS 활성화
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE point_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE invites ENABLE ROW LEVEL SECURITY;

-- 사용자 정책
CREATE POLICY "Users can view their own profile" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

-- 배달 기록 정책
CREATE POLICY "Users can manage their own delivery records" ON delivery_records
  FOR ALL USING (auth.uid() = user_id);

-- 포인트 내역 정책
CREATE POLICY "Users can view their own point history" ON point_history
  FOR SELECT USING (auth.uid() = user_id);

-- 알림 정책
CREATE POLICY "Users can manage their own notifications" ON notifications
  FOR ALL USING (auth.uid() = user_id);

-- 초대 정책
CREATE POLICY "Users can view their invites" ON invites
  FOR SELECT USING (auth.uid() = inviter_id OR auth.uid() = invited_user_id);

-- ====================================================================
-- 11. 트리거 함수 (자동 업데이트)
-- ====================================================================

-- 사용자 통계 자동 업데이트 함수
CREATE OR REPLACE FUNCTION update_user_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- 배달 기록이 검증될 때 사용자 통계 업데이트
  IF NEW.verified = true AND (OLD.verified IS NULL OR OLD.verified = false) THEN
    UPDATE users 
    SET 
      total_deliveries = total_deliveries + NEW.delivery_count,
      total_earnings = total_earnings + NEW.amount,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = NEW.user_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 트리거 생성
DROP TRIGGER IF EXISTS trigger_update_user_stats ON delivery_records;
CREATE TRIGGER trigger_update_user_stats
  AFTER UPDATE ON delivery_records
  FOR EACH ROW
  EXECUTE FUNCTION update_user_stats();

-- updated_at 자동 업데이트 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- updated_at 트리거들
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_delivery_records_updated_at BEFORE UPDATE ON delivery_records
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ====================================================================
-- 12. 권한 설정
-- ====================================================================

-- 기본 권한 부여
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated; 
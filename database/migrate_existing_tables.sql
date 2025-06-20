-- ====================================================================
-- 배달킹 - 기존 테이블 마이그레이션 스크립트
-- 기존 데이터를 보존하면서 새로운 스키마로 업데이트
-- ====================================================================

-- ⚠️ 실행 전 반드시 데이터 백업을 하세요!

-- ====================================================================
-- 1. point_history 테이블 마이그레이션
-- ====================================================================

DO $$
BEGIN
    -- point_history 테이블이 존재하지 않으면 새로 생성
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'point_history'
    ) THEN
        CREATE TABLE point_history (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
          points INTEGER NOT NULL,
          point_type VARCHAR(50) NOT NULL DEFAULT 'admin',
          reason TEXT NOT NULL,
          description TEXT,
          related_record_id UUID,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
        RAISE NOTICE 'point_history 테이블을 새로 생성했습니다.';
    ELSE
        -- 기존 테이블이 있으면 컬럼 마이그레이션
        -- type 컬럼이 존재하면 point_type으로 이름 변경
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'point_history' 
            AND column_name = 'type'
        ) THEN
            ALTER TABLE point_history RENAME COLUMN type TO point_type;
            RAISE NOTICE 'point_history.type 컬럼을 point_type으로 변경했습니다.';
        END IF;
        
        -- point_type 컬럼이 없으면 추가
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'point_history' 
            AND column_name = 'point_type'
        ) THEN
            ALTER TABLE point_history ADD COLUMN point_type VARCHAR(50) NOT NULL DEFAULT 'admin';
            RAISE NOTICE 'point_history.point_type 컬럼을 추가했습니다.';
        END IF;
        
        -- description 컬럼이 없으면 추가
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'point_history' 
            AND column_name = 'description'
        ) THEN
            ALTER TABLE point_history ADD COLUMN description TEXT;
            RAISE NOTICE 'point_history.description 컬럼을 추가했습니다.';
        END IF;
        
        -- related_record_id 컬럼이 없으면 추가
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'point_history' 
            AND column_name = 'related_record_id'
        ) THEN
            ALTER TABLE point_history ADD COLUMN related_record_id UUID;
            RAISE NOTICE 'point_history.related_record_id 컬럼을 추가했습니다.';
        END IF;
    END IF;
END $$;

-- ====================================================================
-- 2. notifications 테이블 마이그레이션
-- ====================================================================

DO $$
BEGIN
    -- notifications 테이블이 존재하지 않으면 새로 생성
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'notifications'
    ) THEN
        CREATE TABLE notifications (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
          title VARCHAR(255) NOT NULL,
          message TEXT NOT NULL,
          notification_type VARCHAR(50) NOT NULL DEFAULT 'info',
          read BOOLEAN DEFAULT false,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
        RAISE NOTICE 'notifications 테이블을 새로 생성했습니다.';
    ELSE
        -- 기존 테이블이 있으면 컬럼 마이그레이션
        -- type 컬럼이 존재하면 notification_type으로 변경
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'notifications' 
            AND column_name = 'type'
        ) THEN
            ALTER TABLE notifications RENAME COLUMN type TO notification_type;
            RAISE NOTICE 'notifications.type 컬럼을 notification_type으로 변경했습니다.';
        END IF;
        
        -- notification_type 컬럼이 없으면 추가
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'notifications' 
            AND column_name = 'notification_type'
        ) THEN
            ALTER TABLE notifications ADD COLUMN notification_type VARCHAR(50) NOT NULL DEFAULT 'info';
            RAISE NOTICE 'notifications.notification_type 컬럼을 추가했습니다.';
        END IF;
    END IF;
END $$;

-- ====================================================================
-- 3. users 테이블 마이그레이션
-- ====================================================================

DO $$
BEGIN
    -- notification_settings 컬럼이 없으면 추가
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'notification_settings'
    ) THEN
        ALTER TABLE users ADD COLUMN notification_settings JSONB DEFAULT '{"push": true, "email": false, "sms": false}';
        RAISE NOTICE 'users.notification_settings 컬럼을 추가했습니다.';
    END IF;
    
    -- last_login 컬럼이 없으면 추가
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'last_login'
    ) THEN
        ALTER TABLE users ADD COLUMN last_login TIMESTAMP WITH TIME ZONE;
        RAISE NOTICE 'users.last_login 컬럼을 추가했습니다.';
    END IF;
    
    -- role 컬럼이 없으면 추가
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'role'
    ) THEN
        ALTER TABLE users ADD COLUMN role VARCHAR(20) DEFAULT 'user';
        RAISE NOTICE 'users.role 컬럼을 추가했습니다.';
    END IF;
END $$;

-- ====================================================================
-- 4. delivery_records 테이블 마이그레이션
-- ====================================================================

DO $$
BEGIN
    -- image_url 컬럼이 없으면 추가
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'delivery_records' 
        AND column_name = 'image_url'
    ) THEN
        ALTER TABLE delivery_records ADD COLUMN image_url TEXT;
        RAISE NOTICE 'delivery_records.image_url 컬럼을 추가했습니다.';
    END IF;
END $$;

-- ====================================================================
-- 5. invites 테이블 마이그레이션
-- ====================================================================

DO $$
BEGIN
    -- invites 테이블이 존재하지 않으면 새로 생성
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'invites'
    ) THEN
        CREATE TABLE invites (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          inviter_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
          invited_user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
          points_rewarded INTEGER DEFAULT 0,
          reward_processed BOOLEAN DEFAULT false,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(invited_user_id)
        );
        RAISE NOTICE 'invites 테이블을 새로 생성했습니다.';
    ELSE
        -- 기존 테이블이 있으면 컬럼 마이그레이션
        -- points_rewarded 컬럼이 없으면 추가
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'invites' 
            AND column_name = 'points_rewarded'
        ) THEN
            ALTER TABLE invites ADD COLUMN points_rewarded INTEGER DEFAULT 0;
            RAISE NOTICE 'invites.points_rewarded 컬럼을 추가했습니다.';
        END IF;
        
        -- reward_processed 컬럼이 없으면 추가
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'invites' 
            AND column_name = 'reward_processed'
        ) THEN
            ALTER TABLE invites ADD COLUMN reward_processed BOOLEAN DEFAULT false;
            RAISE NOTICE 'invites.reward_processed 컬럼을 추가했습니다.';
        END IF;
    END IF;
END $$;

-- ====================================================================
-- 6. 새 테이블 생성 (존재하지 않는 경우)
-- ====================================================================

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

-- ====================================================================
-- 7. 인덱스 생성
-- ====================================================================

-- 새로운 인덱스들 생성 (IF NOT EXISTS는 PostgreSQL 9.5+에서 지원)
CREATE INDEX IF NOT EXISTS idx_users_nickname ON users(nickname);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_referral_code ON users(referral_code);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

CREATE INDEX IF NOT EXISTS idx_delivery_records_user_id ON delivery_records(user_id);
CREATE INDEX IF NOT EXISTS idx_delivery_records_date ON delivery_records(date);
CREATE INDEX IF NOT EXISTS idx_delivery_records_platform ON delivery_records(platform);
CREATE INDEX IF NOT EXISTS idx_delivery_records_verified ON delivery_records(verified);
CREATE INDEX IF NOT EXISTS idx_delivery_records_created_at ON delivery_records(created_at);

CREATE INDEX IF NOT EXISTS idx_point_history_user_id ON point_history(user_id);
CREATE INDEX IF NOT EXISTS idx_point_history_type ON point_history(point_type);
CREATE INDEX IF NOT EXISTS idx_point_history_created_at ON point_history(created_at);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);

CREATE INDEX IF NOT EXISTS idx_invites_inviter_id ON invites(inviter_id);
CREATE INDEX IF NOT EXISTS idx_invites_invited_user_id ON invites(invited_user_id);

-- ====================================================================
-- 8. 뷰 생성
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
-- 9. 트리거 함수 및 트리거
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

-- updated_at 자동 업데이트 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 기존 트리거 삭제 후 재생성
DROP TRIGGER IF EXISTS trigger_update_user_stats ON delivery_records;
CREATE TRIGGER trigger_update_user_stats
  AFTER UPDATE ON delivery_records
  FOR EACH ROW
  EXECUTE FUNCTION update_user_stats();

DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_delivery_records_updated_at ON delivery_records;
CREATE TRIGGER update_delivery_records_updated_at BEFORE UPDATE ON delivery_records
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ====================================================================
-- 완료 메시지
-- ====================================================================

SELECT 
  'migration_completed' as status,
  CURRENT_TIMESTAMP as completed_at,
  'Existing tables have been successfully migrated to new schema' as message; 
-- ====================================================================
-- 배달킹 - 컬럼명 수정 스크립트
-- type 컬럼을 point_type, notification_type으로 변경
-- ====================================================================

-- 현재 테이블 구조 확인
SELECT 'point_history 테이블 컬럼:' as info;
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'point_history'
ORDER BY ordinal_position;

SELECT 'notifications 테이블 컬럼:' as info;
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'notifications'
ORDER BY ordinal_position;

-- ====================================================================
-- 1. point_history 테이블 수정
-- ====================================================================

-- type 컬럼이 있으면 point_type으로 변경
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'point_history' 
        AND column_name = 'type'
    ) THEN
        ALTER TABLE point_history RENAME COLUMN type TO point_type;
        RAISE NOTICE '✅ point_history.type → point_type 변경 완료';
    ELSE
        RAISE NOTICE 'ℹ️ point_history.type 컬럼이 존재하지 않음';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '❌ point_history 컬럼 변경 실패: %', SQLERRM;
END $$;

-- point_type 컬럼이 없으면 추가
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'point_history' 
        AND column_name = 'point_type'
    ) THEN
        ALTER TABLE point_history ADD COLUMN point_type VARCHAR(50) DEFAULT 'admin';
        RAISE NOTICE '✅ point_history.point_type 컬럼 추가 완료';
    ELSE
        RAISE NOTICE 'ℹ️ point_history.point_type 컬럼이 이미 존재함';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '❌ point_history.point_type 추가 실패: %', SQLERRM;
END $$;

-- description 컬럼 추가
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'point_history' 
        AND column_name = 'description'
    ) THEN
        ALTER TABLE point_history ADD COLUMN description TEXT;
        RAISE NOTICE '✅ point_history.description 컬럼 추가 완료';
    ELSE
        RAISE NOTICE 'ℹ️ point_history.description 컬럼이 이미 존재함';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '❌ point_history.description 추가 실패: %', SQLERRM;
END $$;

-- related_record_id 컬럼 추가
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'point_history' 
        AND column_name = 'related_record_id'
    ) THEN
        ALTER TABLE point_history ADD COLUMN related_record_id UUID;
        RAISE NOTICE '✅ point_history.related_record_id 컬럼 추가 완료';
    ELSE
        RAISE NOTICE 'ℹ️ point_history.related_record_id 컬럼이 이미 존재함';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '❌ point_history.related_record_id 추가 실패: %', SQLERRM;
END $$;

-- ====================================================================
-- 2. notifications 테이블 수정
-- ====================================================================

-- notifications 테이블이 없으면 생성
DO $$
BEGIN
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
        RAISE NOTICE '✅ notifications 테이블 생성 완료';
    ELSE
        RAISE NOTICE 'ℹ️ notifications 테이블이 이미 존재함';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '❌ notifications 테이블 생성 실패: %', SQLERRM;
END $$;

-- type 컬럼이 있으면 notification_type으로 변경
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'notifications' 
        AND column_name = 'type'
    ) THEN
        ALTER TABLE notifications RENAME COLUMN type TO notification_type;
        RAISE NOTICE '✅ notifications.type → notification_type 변경 완료';
    ELSE
        RAISE NOTICE 'ℹ️ notifications.type 컬럼이 존재하지 않음';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '❌ notifications 컬럼 변경 실패: %', SQLERRM;
END $$;

-- notification_type 컬럼이 없으면 추가
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'notifications' 
        AND column_name = 'notification_type'
    ) THEN
        ALTER TABLE notifications ADD COLUMN notification_type VARCHAR(50) DEFAULT 'info';
        RAISE NOTICE '✅ notifications.notification_type 컬럼 추가 완료';
    ELSE
        RAISE NOTICE 'ℹ️ notifications.notification_type 컬럼이 이미 존재함';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '❌ notifications.notification_type 추가 실패: %', SQLERRM;
END $$;

-- ====================================================================
-- 3. 기타 필수 테이블 생성
-- ====================================================================

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
  ('point_per_upload', '10', '업로드당 포인트'),
  ('point_per_invite', '500', '초대당 포인트')
ON CONFLICT (key) DO NOTHING;

-- ====================================================================
-- 4. 인덱스 생성
-- ====================================================================

CREATE INDEX IF NOT EXISTS idx_point_history_user_id ON point_history(user_id);
CREATE INDEX IF NOT EXISTS idx_point_history_type ON point_history(point_type);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);

-- ====================================================================
-- 5. 뷰 생성
-- ====================================================================

-- 기존 뷰들 삭제 (컬럼 구조가 다르면 오류 발생하므로)
DROP VIEW IF EXISTS today_rankings_realtime CASCADE;
DROP VIEW IF EXISTS user_statistics CASCADE;
DROP VIEW IF EXISTS dashboard_stats CASCADE;

-- 새로운 뷰 생성
CREATE VIEW today_rankings_realtime AS
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

-- 사용자 통계 뷰 생성
CREATE VIEW user_statistics AS
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

-- 뷰 생성 성공 메시지
SELECT '✅ 뷰 생성 완료' as status, 'today_rankings_realtime, user_statistics' as views_created;

-- ====================================================================
-- 완료 확인
-- ====================================================================

-- 수정 후 테이블 구조 확인
SELECT '=== 수정 완료 후 point_history 컬럼 ===' as info;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'point_history'
ORDER BY ordinal_position;

SELECT '=== 수정 완료 후 notifications 컬럼 ===' as info;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'notifications'
ORDER BY ordinal_position;

SELECT 
  '✅ 컬럼 수정 완료' as status,
  CURRENT_TIMESTAMP as completed_at,
  'point_type, notification_type 컬럼 사용 준비 완료' as message; 
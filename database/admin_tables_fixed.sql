-- 기존 객체들 정리 (필요한 경우)
DROP VIEW IF EXISTS dashboard_stats CASCADE;
DROP TABLE IF EXISTS dashboard_stats CASCADE;

-- 부정 사용 기록 테이블
CREATE TABLE IF NOT EXISTS fraud_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  delivery_record_id UUID REFERENCES delivery_records(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL, -- 'duplicate_upload', 'abnormal_pattern', 'fake_image' 등
  reason TEXT NOT NULL,
  confidence DECIMAL(5,2), -- 부정행위 확신도 (0-100)
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'confirmed', 'rejected'
  amount DECIMAL(10,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 대시보드 통계 뷰 생성
CREATE VIEW dashboard_stats AS
SELECT 
  COUNT(DISTINCT CASE WHEN DATE(dr.created_at) = CURRENT_DATE THEN dr.id END) as today_uploads,
  COUNT(DISTINCT u.id) as total_users,
  COUNT(DISTINCT dr.id) as total_deliveries,
  COUNT(DISTINCT fr.id) as fraud_detections,
  COALESCE(
    json_agg(
      json_build_object(
        'date', upload_date,
        'count', daily_count
      ) ORDER BY upload_date DESC
    ) FILTER (WHERE upload_date >= CURRENT_DATE - INTERVAL '7 days'),
    '[]'::json
  ) as upload_trend
FROM users u
LEFT JOIN delivery_records dr ON u.id = dr.user_id
LEFT JOIN fraud_records fr ON u.id = fr.user_id
LEFT JOIN LATERAL (
  SELECT 
    DATE(created_at) as upload_date,
    COUNT(*) as daily_count
  FROM delivery_records
  WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
  GROUP BY DATE(created_at)
) daily_uploads ON true
GROUP BY u.id, dr.id, fr.id;

-- 통계 테이블
CREATE TABLE IF NOT EXISTS statistics (
  id SERIAL PRIMARY KEY,
  time_range VARCHAR(20) NOT NULL, -- 'week', 'month', 'year'
  total_users INTEGER DEFAULT 0,
  user_growth DECIMAL(5,2) DEFAULT 0,
  total_records INTEGER DEFAULT 0,
  record_growth DECIMAL(5,2) DEFAULT 0,
  total_amount DECIMAL(10,2) DEFAULT 0,
  amount_growth DECIMAL(5,2) DEFAULT 0,
  fraud_count INTEGER DEFAULT 0,
  trend_data JSONB DEFAULT '[]',
  platform_stats JSONB DEFAULT '[]',
  region_stats JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(time_range)
);

-- 시스템 설정 테이블
CREATE TABLE IF NOT EXISTS settings (
  id SERIAL PRIMARY KEY,
  site_name VARCHAR(100) DEFAULT '배달킹',
  admin_email VARCHAR(255),
  auto_verify_ocr BOOLEAN DEFAULT false,
  ocr_confidence_threshold DECIMAL(5,2) DEFAULT 80.0,
  auto_fraud_detection BOOLEAN DEFAULT true,
  fraud_detection_threshold DECIMAL(5,2) DEFAULT 70.0,
  email_notifications BOOLEAN DEFAULT true,
  fraud_notifications BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 기본 설정 데이터 삽입
INSERT INTO settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

-- 권한 설정
GRANT SELECT ON fraud_records TO authenticated;
GRANT ALL ON fraud_records TO service_role;
GRANT SELECT ON dashboard_stats TO authenticated;
GRANT SELECT ON statistics TO authenticated;
GRANT ALL ON statistics TO service_role;
GRANT SELECT ON settings TO authenticated;
GRANT ALL ON settings TO service_role; 
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

-- 기존 dashboard_stats 테이블이 있으면 삭제
DROP TABLE IF EXISTS dashboard_stats;

-- 대시보드 통계 뷰
CREATE OR REPLACE VIEW dashboard_stats AS
SELECT 
  COUNT(DISTINCT CASE WHEN DATE(dr.created_at) = CURRENT_DATE THEN dr.id END) as today_uploads,
  COUNT(DISTINCT u.id) as total_users,
  COUNT(DISTINCT dr.id) as total_deliveries,
  COUNT(DISTINCT fr.id) as fraud_detections,
  json_agg(
    json_build_object(
      'date', upload_date,
      'count', daily_count
    ) ORDER BY upload_date DESC
  ) FILTER (WHERE upload_date >= CURRENT_DATE - INTERVAL '7 days') as upload_trend
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
) daily_uploads ON true;

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

-- 통계 업데이트 함수
CREATE OR REPLACE FUNCTION update_statistics()
RETURNS void AS $$
BEGIN
  -- 주간 통계
  INSERT INTO statistics (
    time_range, 
    total_users, 
    user_growth,
    total_records,
    record_growth,
    total_amount,
    amount_growth,
    fraud_count,
    trend_data,
    platform_stats,
    region_stats
  ) 
  SELECT 
    'week' as time_range,
    COUNT(DISTINCT u.id) as total_users,
    ROUND(((COUNT(DISTINCT CASE WHEN u.created_at >= CURRENT_DATE - INTERVAL '7 days' THEN u.id END)::NUMERIC / 
           NULLIF(COUNT(DISTINCT CASE WHEN u.created_at < CURRENT_DATE - INTERVAL '7 days' THEN u.id END), 0)) - 1) * 100, 2) as user_growth,
    COUNT(DISTINCT dr.id) as total_records,
    ROUND(((COUNT(DISTINCT CASE WHEN dr.created_at >= CURRENT_DATE - INTERVAL '7 days' THEN dr.id END)::NUMERIC / 
           NULLIF(COUNT(DISTINCT CASE WHEN dr.created_at < CURRENT_DATE - INTERVAL '7 days' THEN dr.id END), 0)) - 1) * 100, 2) as record_growth,
    COALESCE(SUM(dr.amount), 0) as total_amount,
    ROUND(((SUM(CASE WHEN dr.created_at >= CURRENT_DATE - INTERVAL '7 days' THEN dr.amount ELSE 0 END)::NUMERIC / 
           NULLIF(SUM(CASE WHEN dr.created_at < CURRENT_DATE - INTERVAL '7 days' THEN dr.amount ELSE 0 END), 0)) - 1) * 100, 2) as amount_growth,
    COUNT(DISTINCT fr.id) as fraud_count,
    COALESCE(
      json_agg(
        json_build_object(
          'date', to_char(dr.date, 'MM-DD'),
          'count', count(*)
        ) ORDER BY dr.date
      ) FILTER (WHERE dr.date >= CURRENT_DATE - INTERVAL '7 days'), 
      '[]'::json
    ) as trend_data,
    COALESCE(
      json_agg(DISTINCT 
        json_build_object(
          'platform', dr.platform,
          'count', platform_count,
          'amount', platform_amount
        )
      ) FILTER (WHERE dr.platform IS NOT NULL), 
      '[]'::json
    ) as platform_stats,
    COALESCE(
      json_agg(DISTINCT 
        json_build_object(
          'region', u.region,
          'count', region_count,
          'amount', region_amount
        )
      ) FILTER (WHERE u.region IS NOT NULL AND u.region != ''), 
      '[]'::json
    ) as region_stats
  FROM users u
  LEFT JOIN delivery_records dr ON u.id = dr.user_id
  LEFT JOIN fraud_records fr ON u.id = fr.user_id
  LEFT JOIN LATERAL (
    SELECT 
      platform,
      COUNT(*) as platform_count,
      SUM(amount) as platform_amount
    FROM delivery_records
    GROUP BY platform
  ) ps ON ps.platform = dr.platform
  LEFT JOIN LATERAL (
    SELECT 
      u2.region,
      COUNT(DISTINCT dr2.id) as region_count,
      SUM(dr2.amount) as region_amount
    FROM users u2
    JOIN delivery_records dr2 ON u2.id = dr2.user_id
    WHERE u2.region IS NOT NULL AND u2.region != ''
    GROUP BY u2.region
  ) rs ON rs.region = u.region
  GROUP BY dr.date
  ON CONFLICT (time_range) 
  DO UPDATE SET
    total_users = EXCLUDED.total_users,
    user_growth = EXCLUDED.user_growth,
    total_records = EXCLUDED.total_records,
    record_growth = EXCLUDED.record_growth,
    total_amount = EXCLUDED.total_amount,
    amount_growth = EXCLUDED.amount_growth,
    fraud_count = EXCLUDED.fraud_count,
    trend_data = EXCLUDED.trend_data,
    platform_stats = EXCLUDED.platform_stats,
    region_stats = EXCLUDED.region_stats,
    updated_at = CURRENT_TIMESTAMP;
END;
$$ LANGUAGE plpgsql;

-- 기본 설정 데이터 삽입
INSERT INTO settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

-- 권한 설정 (옵션)
GRANT SELECT ON fraud_records TO authenticated;
GRANT ALL ON fraud_records TO service_role;
GRANT SELECT ON dashboard_stats TO authenticated;
GRANT SELECT ON statistics TO authenticated;
GRANT ALL ON statistics TO service_role;
GRANT SELECT ON settings TO authenticated;
GRANT ALL ON settings TO service_role; 
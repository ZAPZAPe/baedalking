-- 성능 개선을 위한 인덱스 추가

-- delivery_records 테이블의 복합 인덱스
CREATE INDEX IF NOT EXISTS idx_delivery_records_date_verified 
ON delivery_records(date, verified) 
WHERE verified = true;

-- users와 delivery_records 조인 성능 개선을 위한 인덱스
CREATE INDEX IF NOT EXISTS idx_delivery_records_user_date_verified 
ON delivery_records(user_id, date, verified) 
WHERE verified = true;

-- 플랫폼별 통계를 위한 인덱스
CREATE INDEX IF NOT EXISTS idx_delivery_records_platform_verified 
ON delivery_records(platform, verified) 
WHERE verified = true; 
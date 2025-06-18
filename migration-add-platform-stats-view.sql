-- 플랫폼 통계를 위한 Materialized View 생성
CREATE MATERIALIZED VIEW IF NOT EXISTS platform_stats AS
SELECT 
    platform,
    COUNT(DISTINCT user_id) as total_users,
    SUM(amount) as total_amount,
    SUM(delivery_count) as total_orders,
    CASE 
        WHEN SUM(delivery_count) > 0 THEN ROUND(SUM(amount)::numeric / SUM(delivery_count)::numeric)
        ELSE 0
    END as average_per_order
FROM delivery_records
WHERE verified = true
GROUP BY platform;

-- 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_platform_stats_platform ON platform_stats(platform);

-- 실시간 뷰도 생성 (최신 데이터용)
CREATE OR REPLACE VIEW platform_stats_realtime AS
SELECT 
    platform,
    COUNT(DISTINCT user_id) as total_users,
    SUM(amount) as total_amount,
    SUM(delivery_count) as total_orders,
    CASE 
        WHEN SUM(delivery_count) > 0 THEN ROUND(SUM(amount)::numeric / SUM(delivery_count)::numeric)
        ELSE 0
    END as average_per_order
FROM delivery_records
WHERE verified = true
GROUP BY platform;

-- Materialized View 자동 새로고침 함수
CREATE OR REPLACE FUNCTION refresh_platform_stats()
RETURNS trigger AS $$
BEGIN
    -- 비동기로 새로고침 (CONCURRENTLY 옵션으로 락 최소화)
    REFRESH MATERIALIZED VIEW CONCURRENTLY platform_stats;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 트리거 생성 (배달 기록 변경 시 통계 업데이트)
DROP TRIGGER IF EXISTS refresh_platform_stats_trigger ON delivery_records;
CREATE TRIGGER refresh_platform_stats_trigger
AFTER INSERT OR UPDATE OR DELETE ON delivery_records
FOR EACH STATEMENT
EXECUTE FUNCTION refresh_platform_stats(); 
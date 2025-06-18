-- platform_stats를 materialized view에서 일반 view로 변경
-- 이렇게 하면 CONCURRENT REFRESH 문제가 해결됩니다

-- 1. 기존 materialized view 삭제
DROP MATERIALIZED VIEW IF EXISTS platform_stats CASCADE;

-- 2. 일반 view로 재생성
CREATE OR REPLACE VIEW platform_stats AS
SELECT 
  platform,
  COUNT(DISTINCT user_id) as total_users,
  SUM(delivery_count) as total_orders,
  SUM(amount) as total_amount,
  CASE 
    WHEN SUM(delivery_count) > 0 
    THEN ROUND(SUM(amount)::numeric / SUM(delivery_count)::numeric)
    ELSE 0
  END as avg_per_order
FROM delivery_records
WHERE verified = true
  AND date >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY platform;

-- 3. 관련 트리거 제거 (더 이상 필요 없음)
DROP TRIGGER IF EXISTS refresh_platform_stats_on_insert ON delivery_records;
DROP TRIGGER IF EXISTS refresh_platform_stats_on_update ON delivery_records;
DROP TRIGGER IF EXISTS refresh_platform_stats_on_delete ON delivery_records;
DROP TRIGGER IF EXISTS refresh_platform_stats_on_change ON delivery_records;
DROP TRIGGER IF EXISTS refresh_platform_stats_trigger ON delivery_records;
DROP FUNCTION IF EXISTS refresh_platform_stats() CASCADE;
DROP FUNCTION IF EXISTS refresh_platform_stats_non_concurrent() CASCADE; 
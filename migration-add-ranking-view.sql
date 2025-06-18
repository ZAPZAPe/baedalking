-- 오늘 랭킹을 위한 Materialized View
CREATE MATERIALIZED VIEW IF NOT EXISTS today_rankings AS
WITH today_stats AS (
    SELECT 
        dr.user_id,
        u.nickname,
        u.region,
        SUM(dr.amount) as total_amount,
        SUM(dr.delivery_count) as total_orders,
        MAX(dr.platform) as platform
    FROM delivery_records dr
    JOIN users u ON dr.user_id = u.id
    WHERE dr.date = CURRENT_DATE
        AND dr.verified = true
    GROUP BY dr.user_id, u.nickname, u.region
)
SELECT 
    user_id,
    nickname,
    region,
    total_amount,
    total_orders,
    platform,
    DENSE_RANK() OVER (ORDER BY total_amount DESC, total_orders DESC, nickname) as rank
FROM today_stats
ORDER BY rank;

-- 인덱스 추가
CREATE UNIQUE INDEX IF NOT EXISTS idx_today_rankings_user_id ON today_rankings(user_id);
CREATE INDEX IF NOT EXISTS idx_today_rankings_rank ON today_rankings(rank);

-- 실시간 뷰 (항상 최신 데이터)
CREATE OR REPLACE VIEW today_rankings_realtime AS
WITH today_stats AS (
    SELECT 
        dr.user_id,
        u.nickname,
        u.region,
        SUM(dr.amount) as total_amount,
        SUM(dr.delivery_count) as total_orders,
        MAX(dr.platform) as platform
    FROM delivery_records dr
    JOIN users u ON dr.user_id = u.id
    WHERE dr.date = CURRENT_DATE
        AND dr.verified = true
    GROUP BY dr.user_id, u.nickname, u.region
)
SELECT 
    user_id,
    nickname,
    region,
    total_amount,
    total_orders,
    platform,
    DENSE_RANK() OVER (ORDER BY total_amount DESC, total_orders DESC, nickname) as rank
FROM today_stats
ORDER BY rank;

-- 자동 새로고침 함수
CREATE OR REPLACE FUNCTION refresh_today_rankings()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY today_rankings;
END;
$$ LANGUAGE plpgsql;

-- 매 시간마다 자동 새로고침을 위한 cron job (pg_cron 확장 필요)
-- SELECT cron.schedule('refresh-today-rankings', '0 * * * *', 'SELECT refresh_today_rankings();'); 
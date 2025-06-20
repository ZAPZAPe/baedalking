-- ====================================================================
-- 배달킹 데이터베이스 유지보수 쿼리 모음
-- 정기적인 관리 및 모니터링을 위한 쿼리들
-- ====================================================================

-- ====================================================================
-- 1. 데이터베이스 상태 확인
-- ====================================================================

-- 전체 테이블 목록 및 크기
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
    pg_stat_get_tuples_inserted(c.oid) as inserts,
    pg_stat_get_tuples_updated(c.oid) as updates,
    pg_stat_get_tuples_deleted(c.oid) as deletes
FROM pg_tables pt
LEFT JOIN pg_class c ON c.relname = pt.tablename
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- 인덱스 사용 통계
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan as index_scans,
    idx_tup_read as tuples_read,
    idx_tup_fetch as tuples_fetched
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;

-- ====================================================================
-- 2. 성능 모니터링
-- ====================================================================

-- 가장 많이 사용되는 테이블
SELECT 
    schemaname,
    tablename,
    seq_scan + idx_scan as total_scans,
    seq_tup_read + idx_tup_fetch as total_reads,
    n_tup_ins as inserts,
    n_tup_upd as updates,
    n_tup_del as deletes
FROM pg_stat_user_tables
ORDER BY total_scans DESC;

-- 느린 쿼리 확인 (pg_stat_statements 확장 필요)
-- SELECT 
--     query,
--     calls,
--     total_time,
--     mean_time,
--     rows
-- FROM pg_stat_statements
-- ORDER BY mean_time DESC
-- LIMIT 10;

-- ====================================================================
-- 3. 데이터 현황 확인
-- ====================================================================

-- 전체 사용자 통계
SELECT 
    COUNT(*) as total_users,
    COUNT(CASE WHEN role = 'admin' THEN 1 END) as admin_users,
    COUNT(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '7 days' THEN 1 END) as new_users_this_week,
    COUNT(CASE WHEN last_login >= CURRENT_DATE - INTERVAL '7 days' THEN 1 END) as active_users_this_week
FROM users;

-- 배달 기록 통계
SELECT 
    COUNT(*) as total_records,
    COUNT(CASE WHEN verified = true THEN 1 END) as verified_records,
    COUNT(CASE WHEN date >= CURRENT_DATE - INTERVAL '7 days' THEN 1 END) as this_week_records,
    SUM(amount) as total_earnings,
    AVG(amount) as avg_earnings,
    COUNT(DISTINCT user_id) as active_users
FROM delivery_records;

-- 플랫폼별 통계
SELECT 
    platform,
    COUNT(*) as records,
    SUM(amount) as total_amount,
    AVG(amount) as avg_amount,
    COUNT(DISTINCT user_id) as unique_users
FROM delivery_records
GROUP BY platform
ORDER BY total_amount DESC;

-- 지역별 통계
SELECT 
    u.region,
    COUNT(DISTINCT u.id) as users,
    COUNT(dr.id) as total_records,
    SUM(dr.amount) as total_earnings
FROM users u
LEFT JOIN delivery_records dr ON u.id = dr.user_id AND dr.verified = true
WHERE u.region IS NOT NULL AND u.region != ''
GROUP BY u.region
ORDER BY total_earnings DESC;

-- ====================================================================
-- 4. 데이터 정리
-- ====================================================================

-- 오래된 알림 정리 (30일 이상 된 읽은 알림)
DELETE FROM notifications 
WHERE read = true 
AND created_at < CURRENT_DATE - INTERVAL '30 days';

-- 미사용 프로필 이미지 확인 (실제 파일 정리는 별도 작업 필요)
SELECT DISTINCT profile_image 
FROM users 
WHERE profile_image IS NOT NULL;

-- 중복 포인트 기록 확인
SELECT 
    user_id, 
    point_type, 
    reason, 
    points, 
    COUNT(*) as duplicates
FROM point_history
GROUP BY user_id, point_type, reason, points, DATE(created_at)
HAVING COUNT(*) > 1;

-- ====================================================================
-- 5. 데이터 무결성 검사
-- ====================================================================

-- 참조 무결성 검사
-- 존재하지 않는 사용자를 참조하는 배달 기록
SELECT COUNT(*) as orphaned_delivery_records
FROM delivery_records dr
LEFT JOIN users u ON dr.user_id = u.id
WHERE u.id IS NULL;

-- 존재하지 않는 사용자를 참조하는 포인트 기록
SELECT COUNT(*) as orphaned_point_records
FROM point_history ph
LEFT JOIN users u ON ph.user_id = u.id
WHERE u.id IS NULL;

-- 사용자 통계와 실제 데이터 불일치 확인
SELECT 
    u.id,
    u.nickname,
    u.total_deliveries as recorded_total,
    COUNT(dr.id) as actual_total,
    u.total_earnings as recorded_earnings,
    COALESCE(SUM(dr.amount), 0) as actual_earnings
FROM users u
LEFT JOIN delivery_records dr ON u.id = dr.user_id AND dr.verified = true
GROUP BY u.id, u.nickname, u.total_deliveries, u.total_earnings
HAVING u.total_deliveries != COUNT(dr.id) 
    OR ABS(u.total_earnings - COALESCE(SUM(dr.amount), 0)) > 0.01;

-- ====================================================================
-- 6. 백업 및 복원 준비
-- ====================================================================

-- 중요 테이블 행 수 확인 (백업 전후 검증용)
SELECT 
    'users' as table_name, COUNT(*) as row_count FROM users
UNION ALL
SELECT 
    'delivery_records' as table_name, COUNT(*) as row_count FROM delivery_records
UNION ALL
SELECT 
    'point_history' as table_name, COUNT(*) as row_count FROM point_history
UNION ALL
SELECT 
    'notifications' as table_name, COUNT(*) as row_count FROM notifications
UNION ALL
SELECT 
    'invites' as table_name, COUNT(*) as row_count FROM invites;

-- 최근 활동 확인
SELECT 
    'users' as table_name,
    MAX(created_at) as last_created,
    MAX(updated_at) as last_updated
FROM users
UNION ALL
SELECT 
    'delivery_records' as table_name,
    MAX(created_at) as last_created,
    MAX(updated_at) as last_updated
FROM delivery_records;

-- ====================================================================
-- 7. 시스템 설정 관리
-- ====================================================================

-- 현재 시스템 설정 조회
SELECT * FROM system_settings ORDER BY key;

-- 설정값 업데이트 템플릿
-- UPDATE system_settings SET value = '새값', updated_at = CURRENT_TIMESTAMP WHERE key = '키';

-- 새 설정 추가 템플릿
-- INSERT INTO system_settings (key, value, description) VALUES ('키', '값', '설명');

-- ====================================================================
-- 8. 정기 작업 쿼리
-- ====================================================================

-- 일일 통계 (크론잡 등에서 사용)
SELECT 
    CURRENT_DATE as date,
    COUNT(DISTINCT u.id) as total_users,
    COUNT(DISTINCT CASE WHEN u.created_at::date = CURRENT_DATE THEN u.id END) as new_users,
    COUNT(dr.id) as daily_records,
    SUM(dr.amount) as daily_earnings,
    COUNT(DISTINCT dr.user_id) as active_users
FROM users u
LEFT JOIN delivery_records dr ON u.id = dr.user_id AND dr.date = CURRENT_DATE;

-- 주간 TOP 사용자 (랭킹 보상용)
SELECT 
    u.id,
    u.nickname,
    u.region,
    SUM(dr.amount) as week_earnings,
    COUNT(dr.id) as week_deliveries,
    ROW_NUMBER() OVER (ORDER BY SUM(dr.amount) DESC) as rank
FROM users u
JOIN delivery_records dr ON u.id = dr.user_id
WHERE dr.date >= CURRENT_DATE - INTERVAL '7 days'
  AND dr.verified = true
GROUP BY u.id, u.nickname, u.region
ORDER BY week_earnings DESC
LIMIT 10;

-- ====================================================================
-- 9. 알림 및 모니터링
-- ====================================================================

-- 검증 대기 중인 기록 수
SELECT COUNT(*) as pending_verification
FROM delivery_records
WHERE verified = false;

-- 최근 24시간 활동
SELECT 
    COUNT(DISTINCT u.id) as active_users,
    COUNT(dr.id) as new_records,
    SUM(dr.amount) as total_earnings
FROM delivery_records dr
JOIN users u ON dr.user_id = u.id
WHERE dr.created_at >= CURRENT_TIMESTAMP - INTERVAL '24 hours';

-- 오류 가능성이 있는 데이터
SELECT 
    'High amount records' as issue_type,
    COUNT(*) as count
FROM delivery_records
WHERE amount > 100000 -- 10만원 초과
UNION ALL
SELECT 
    'Zero amount records' as issue_type,
    COUNT(*) as count
FROM delivery_records
WHERE amount <= 0
UNION ALL
SELECT 
    'Future date records' as issue_type,
    COUNT(*) as count
FROM delivery_records
WHERE date > CURRENT_DATE;

-- ====================================================================
-- 실행 완료 메시지
-- ====================================================================
SELECT 
    'maintenance_queries_ready' as status,
    CURRENT_TIMESTAMP as timestamp,
    'Database maintenance queries are available for use' as message; 
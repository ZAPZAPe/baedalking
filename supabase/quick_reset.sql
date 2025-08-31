-- 빠른 데이터 리셋 스크립트
-- 모든 사용자 데이터만 삭제하고 기본 아이템은 유지

-- 사용자 관련 데이터만 삭제
DELETE FROM guestbook;
DELETE FROM visits;
DELETE FROM friends;
DELETE FROM user_items;
DELETE FROM points;
DELETE FROM earnings;
DELETE FROM users;

-- last_login 컬럼 추가
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login TIMESTAMP WITH TIME ZONE;

-- 완료!
SELECT '사용자 데이터가 모두 삭제되었습니다!' as result;

-- 사용자 강제 완전 삭제 스크립트
-- 이 스크립트는 모든 사용자 데이터를 완전히 삭제합니다!

-- 1. 외래키 제약조건을 무시하고 모든 관련 데이터 삭제
DELETE FROM guestbook WHERE user_id IS NOT NULL OR visitor_id IS NOT NULL;
DELETE FROM visits WHERE user_id IS NOT NULL OR visited_user_id IS NOT NULL;
DELETE FROM friends WHERE user_id IS NOT NULL OR friend_id IS NOT NULL;
DELETE FROM user_items WHERE user_id IS NOT NULL;
DELETE FROM points WHERE user_id IS NOT NULL;
DELETE FROM earnings WHERE user_id IS NOT NULL;

-- 2. 사용자 테이블 완전 삭제
DELETE FROM users;

-- 3. 시퀀스 리셋 (UUID는 자동 생성이므로 불필요)
-- PostgreSQL에서는 UUID가 자동 생성되므로 별도 리셋 불필요

-- 4. 완료 확인
SELECT '모든 사용자 데이터가 강제로 삭제되었습니다!' as message;
SELECT COUNT(*) as remaining_users FROM users;

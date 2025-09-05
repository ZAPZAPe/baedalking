-- 사용자 테이블에 last_login 컬럼 추가
-- 작성일: 2025년 1월 5일
-- 설명: 로그인 시간 추적을 위한 last_login 컬럼 추가

-- users 테이블에 last_login 컬럼 추가
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS last_login TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- 인덱스 생성 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_users_last_login ON users(last_login);

-- 마이그레이션 완료 로그
SELECT 'last_login column added successfully' as status;

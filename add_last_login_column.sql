-- users 테이블에 last_login 컬럼 추가
-- 로그인 시간 추적을 위한 컬럼

ALTER TABLE users 
ADD COLUMN last_login TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- 기존 사용자들의 last_login을 created_at으로 초기화
UPDATE users 
SET last_login = created_at 
WHERE last_login IS NULL;

-- 인덱스 추가 (성능 최적화)
CREATE INDEX idx_users_last_login ON users(last_login);

-- 코멘트 추가
COMMENT ON COLUMN users.last_login IS '마지막 로그인 시간';

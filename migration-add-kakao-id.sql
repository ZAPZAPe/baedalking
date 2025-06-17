-- users 테이블에 kakao_id 컬럼 추가
ALTER TABLE users ADD COLUMN IF NOT EXISTS kakao_id VARCHAR(100) UNIQUE;

-- 인덱스 추가 (빠른 조회를 위해)
CREATE INDEX IF NOT EXISTS idx_users_kakao_id ON users(kakao_id); 
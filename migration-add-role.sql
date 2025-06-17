-- 기존 users 테이블에 role, referral_code, notification_settings 컬럼 추가
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'user',
ADD COLUMN IF NOT EXISTS referral_code VARCHAR(50),
ADD COLUMN IF NOT EXISTS notification_settings JSONB DEFAULT '{}';

-- 기존 사용자들의 role을 'user'로 설정
UPDATE users SET role = 'user' WHERE role IS NULL;

-- 관리자 계정 설정 예시 (이메일을 실제 관리자 이메일로 변경하세요)
-- UPDATE users SET role = 'admin' WHERE email = 'admin@example.com'; 
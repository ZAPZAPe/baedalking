-- 사용자 설정 필드 추가
ALTER TABLE users ADD COLUMN IF NOT EXISTS status_message TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_income_private BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS platforms JSONB DEFAULT '{"baemin": true, "coupang": true, "custom": []}'::jsonb;
ALTER TABLE users ADD COLUMN IF NOT EXISTS goals JSONB DEFAULT '{"daily": 0, "weekly": 0, "monthly": 0}'::jsonb;

-- 기존 사용자들의 기본값 설정
UPDATE users 
SET 
  status_message = COALESCE(status_message, ''),
  is_income_private = COALESCE(is_income_private, false),
  platforms = COALESCE(platforms, '{"baemin": true, "coupang": true, "custom": []}'::jsonb),
  goals = COALESCE(goals, '{"daily": 0, "weekly": 0, "monthly": 0}'::jsonb)
WHERE status_message IS NULL 
   OR is_income_private IS NULL 
   OR platforms IS NULL 
   OR goals IS NULL;

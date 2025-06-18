-- 기존 사용자들에게 추천 코드 생성
-- referral_code가 없는 사용자들에게만 추가

DO $$
DECLARE
  user_record RECORD;
  new_referral_code TEXT;
BEGIN
  -- referral_code가 NULL이거나 빈 문자열인 사용자들을 찾아서 업데이트
  FOR user_record IN 
    SELECT id, nickname 
    FROM users 
    WHERE referral_code IS NULL OR referral_code = ''
  LOOP
    -- 각 사용자마다 고유한 추천 코드 생성
    -- BK + 타임스탬프의 base36 인코딩 + 랜덤 숫자
    new_referral_code := 'BK' || UPPER(TO_HEX(EXTRACT(EPOCH FROM NOW())::BIGINT)) || FLOOR(RANDOM() * 1000)::TEXT;
    
    -- 사용자 업데이트
    UPDATE users 
    SET referral_code = new_referral_code 
    WHERE id = user_record.id;
    
    RAISE NOTICE '사용자 % (%)에게 추천 코드 % 생성됨', user_record.nickname, user_record.id, new_referral_code;
  END LOOP;
END $$;

-- 추천 코드에 unique 제약 조건 추가 (이미 없다면)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'users_referral_code_key'
  ) THEN
    ALTER TABLE users ADD CONSTRAINT users_referral_code_key UNIQUE (referral_code);
  END IF;
END $$; 
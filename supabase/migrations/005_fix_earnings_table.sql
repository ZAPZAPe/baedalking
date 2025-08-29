-- earnings 테이블 구조 수정 - 실제 사용하는 필드에 맞게 변경
ALTER TABLE earnings 
ADD COLUMN IF NOT EXISTS platform TEXT DEFAULT 'baemin',
ADD COLUMN IF NOT EXISTS delivery_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS delivery_amount INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS mission_amount INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_amount INTEGER GENERATED ALWAYS AS (delivery_amount + mission_amount) STORED;

-- 기존 source 컬럼 제거 (platform으로 대체)
ALTER TABLE earnings DROP COLUMN IF EXISTS source;

-- platform 체크 제약 조건 추가 (이미 존재하면 무시)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_platform') THEN
        ALTER TABLE earnings 
        ADD CONSTRAINT check_platform CHECK (platform IN ('baemin', 'coupang', 'custom'));
    END IF;
END $$;

-- 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_earnings_platform ON earnings(platform);
CREATE INDEX IF NOT EXISTS idx_earnings_user_date ON earnings(user_id, date);

-- 기존 데이터 마이그레이션 (amount 컬럼이 존재하는 경우에만)
DO $$ 
BEGIN
    -- amount 컬럼이 존재하는지 확인
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'earnings' AND column_name = 'amount') THEN
        -- amount를 delivery_amount로 이동
        UPDATE earnings 
        SET delivery_amount = amount,
            delivery_count = CASE 
                WHEN amount > 0 THEN GREATEST(1, amount / 5000) -- 대략적인 건수 추정
                ELSE 0 
            END
        WHERE delivery_amount IS NULL OR delivery_amount = 0;
        
        -- amount 컬럼 제거
        ALTER TABLE earnings DROP COLUMN IF EXISTS amount;
    END IF;
END $$;

-- RLS 정책 업데이트
DROP POLICY IF EXISTS "Users can view own earnings" ON earnings;
DROP POLICY IF EXISTS "Users can insert own earnings" ON earnings;
DROP POLICY IF EXISTS "Users can update own earnings" ON earnings;
DROP POLICY IF EXISTS "Users can delete own earnings" ON earnings;

-- 간단한 RLS 정책 (Supabase는 자동으로 auth.uid()를 users 테이블의 id와 매핑)
-- 실제로는 kakao_id 기반이 아닌 user_id 기반으로 작동
CREATE POLICY "Users can view own earnings" ON earnings
    FOR SELECT USING (true); -- 개발 환경에서는 모든 사용자가 볼 수 있도록

CREATE POLICY "Users can insert own earnings" ON earnings
    FOR INSERT WITH CHECK (true); -- 개발 환경에서는 모든 사용자가 추가 가능

CREATE POLICY "Users can update own earnings" ON earnings
    FOR UPDATE USING (true); -- 개발 환경에서는 모든 사용자가 수정 가능

CREATE POLICY "Users can delete own earnings" ON earnings
    FOR DELETE USING (true); -- 개발 환경에서는 모든 사용자가 삭제 가능

-- 프로덕션에서는 아래와 같이 사용:
-- CREATE POLICY "Users can view own earnings" ON earnings
--     FOR SELECT USING (auth.uid()::text = user_id::text);
-- CREATE POLICY "Users can insert own earnings" ON earnings
--     FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);
-- CREATE POLICY "Users can update own earnings" ON earnings
--     FOR UPDATE USING (auth.uid()::text = user_id::text);
-- CREATE POLICY "Users can delete own earnings" ON earnings
--     FOR DELETE USING (auth.uid()::text = user_id::text);

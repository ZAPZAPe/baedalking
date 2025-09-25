-- ============================================================================
-- 🔧 수입 테이블 및 함수 수정
-- ============================================================================
-- 작성일: 2024년
-- 목적: earnings 테이블에 누락된 컬럼 추가 및 save_earning_with_boxes 함수 생성

-- 기존 earnings 테이블에 누락된 컬럼들 추가
ALTER TABLE earnings 
ADD COLUMN IF NOT EXISTS delivery_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS delivery_amount INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS mission_amount INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_amount INTEGER GENERATED ALWAYS AS (delivery_amount + mission_amount) STORED,
ADD COLUMN IF NOT EXISTS screenshot_url TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS screenshot_text TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS verified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS verified_score INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 기존 amount 컬럼 제거 (total_amount로 대체)
ALTER TABLE earnings DROP COLUMN IF EXISTS amount;

-- ============================================================================
-- 📦 수입 기록 저장 및 박스 지급 함수
-- ============================================================================
CREATE OR REPLACE FUNCTION save_earning_with_boxes(
    p_user_id UUID,
    p_platform TEXT,
    p_delivery_count INTEGER,
    p_delivery_amount INTEGER,
    p_mission_amount INTEGER,
    p_date DATE
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_total_amount INTEGER;
    v_boxes_earned INTEGER;
    v_earning_id UUID;
    v_existing_earning_id UUID;
BEGIN
    -- 총 수입 금액 계산
    v_total_amount := p_delivery_amount + p_mission_amount;
    
    -- 박스 지급 계산 (1000원당 1박스, 최소 1박스)
    v_boxes_earned := GREATEST(1, v_total_amount / 1000);
    
    -- 같은 날짜, 같은 플랫폼으로 이미 등록된 수입이 있는지 확인
    SELECT id INTO v_existing_earning_id
    FROM earnings
    WHERE user_id = p_user_id 
      AND platform = p_platform 
      AND date = p_date;
    
    IF v_existing_earning_id IS NOT NULL THEN
        -- 기존 수입 기록 업데이트
        UPDATE earnings 
        SET 
            delivery_count = p_delivery_count,
            delivery_amount = p_delivery_amount,
            mission_amount = p_mission_amount,
            updated_at = NOW()
        WHERE id = v_existing_earning_id;
        
        v_earning_id := v_existing_earning_id;
    ELSE
        -- 새로운 수입 기록 생성
        INSERT INTO earnings (
            user_id,
            platform,
            delivery_count,
            delivery_amount,
            mission_amount,
            date
        ) VALUES (
            p_user_id,
            p_platform,
            p_delivery_count,
            p_delivery_amount,
            p_mission_amount,
            p_date
        ) RETURNING id INTO v_earning_id;
    END IF;
    
    -- 박스 거래 기록 생성
    INSERT INTO box_transactions (
        user_id,
        amount,
        type,
        reason,
        related_earning_id
    ) VALUES (
        p_user_id,
        v_boxes_earned,
        'earn',
        '수입 기록: ' || p_platform || ' (' || p_date || ')',
        v_earning_id
    );
    
    -- 성공 응답 반환
    RETURN json_build_object(
        'success', true,
        'earning_id', v_earning_id,
        'total_amount', v_total_amount,
        'boxes_earned', v_boxes_earned,
        'message', '수입 기록이 저장되고 ' || v_boxes_earned || '박스가 지급되었습니다.'
    );
    
EXCEPTION
    WHEN OTHERS THEN
        -- 오류 응답 반환
        RETURN json_build_object(
            'success', false,
            'error', SQLERRM,
            'message', '수입 기록 저장에 실패했습니다.'
        );
END;
$$;

-- ============================================================================
-- 🔧 업데이트 트리거 함수
-- ============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- earnings 테이블에 업데이트 트리거 추가
DROP TRIGGER IF EXISTS update_earnings_updated_at ON earnings;
CREATE TRIGGER update_earnings_updated_at
    BEFORE UPDATE ON earnings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 📊 인덱스 추가 (성능 최적화)
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_earnings_user_date ON earnings(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_earnings_platform ON earnings(platform);
CREATE INDEX IF NOT EXISTS idx_box_transactions_user ON box_transactions(user_id, created_at DESC);

-- 완료 메시지
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '✅ earnings 테이블 수정 완료';
    RAISE NOTICE '✅ save_earning_with_boxes 함수 생성 완료';
    RAISE NOTICE '✅ 업데이트 트리거 추가 완료';
    RAISE NOTICE '✅ 인덱스 추가 완료';
    RAISE NOTICE '';
END $$;

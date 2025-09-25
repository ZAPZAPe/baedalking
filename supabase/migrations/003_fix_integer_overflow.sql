-- ============================================================================
-- 🔧 INTEGER 오버플로우 수정
-- ============================================================================
-- 작성일: 2024년
-- 목적: earnings 테이블의 amount 필드들을 INTEGER에서 BIGINT로 변경하여 큰 값 처리 가능

-- 먼저 generated column인 total_amount를 삭제
ALTER TABLE earnings DROP COLUMN IF EXISTS total_amount;

-- earnings 테이블의 amount 필드들을 BIGINT로 변경
ALTER TABLE earnings 
ALTER COLUMN delivery_amount TYPE BIGINT,
ALTER COLUMN mission_amount TYPE BIGINT;

-- total_amount를 BIGINT 타입으로 다시 생성
ALTER TABLE earnings 
ADD COLUMN total_amount BIGINT GENERATED ALWAYS AS (delivery_amount + mission_amount) STORED;

-- box_transactions 테이블의 amount 필드도 BIGINT로 변경 (박스 수량이 많아질 수 있음)
ALTER TABLE box_transactions 
ALTER COLUMN amount TYPE BIGINT;

-- ============================================================================
-- 🗑️ 기존 함수들 삭제 (타입 변경을 위해)
-- ============================================================================
DROP FUNCTION IF EXISTS save_earning_with_boxes(UUID, TEXT, INTEGER, INTEGER, INTEGER, DATE);
DROP FUNCTION IF EXISTS get_user_boxes(UUID);
DROP FUNCTION IF EXISTS purchase_item_with_boxes(UUID, UUID, INTEGER);

-- ============================================================================
-- 📦 수입 기록 저장 및 박스 지급 함수 업데이트
-- ============================================================================
CREATE OR REPLACE FUNCTION save_earning_with_boxes(
    p_user_id UUID,
    p_platform TEXT,
    p_delivery_count INTEGER,
    p_delivery_amount BIGINT,
    p_mission_amount BIGINT,
    p_date DATE
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_total_amount BIGINT;
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
            'message', '수입 기록 저장 중 오류가 발생했습니다.'
        );
END;
$$;

-- ============================================================================
-- 📦 박스 잔액 계산 함수 업데이트
-- ============================================================================
CREATE OR REPLACE FUNCTION get_user_boxes(p_user_id UUID)
RETURNS BIGINT AS $$
DECLARE
    v_balance BIGINT;
BEGIN
    SELECT COALESCE(SUM(
        CASE WHEN type = 'earn' THEN amount 
             WHEN type = 'spend' THEN -amount 
             ELSE 0 
        END
    ), 0)
    INTO v_balance
    FROM box_transactions
    WHERE user_id = p_user_id;
    
    RETURN GREATEST(0, v_balance);
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 🛒 아이템 구매 함수 업데이트
-- ============================================================================
CREATE OR REPLACE FUNCTION purchase_item_with_boxes(
    p_user_id UUID,
    p_item_id UUID,
    p_quantity INTEGER DEFAULT 1
)
RETURNS JSON AS $$
DECLARE
    v_item_price BIGINT;
    v_item_name TEXT;
    v_total_cost BIGINT;
    v_user_boxes BIGINT;
    v_result JSON;
BEGIN
    -- 아이템 정보 조회
    SELECT price, name INTO v_item_price, v_item_name
    FROM shop_items
    WHERE id = p_item_id;
    
    IF v_item_price IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'error', '아이템을 찾을 수 없습니다.'
        );
    END IF;
    
    -- 총 비용 계산
    v_total_cost := v_item_price * p_quantity;
    
    -- 사용자 박스 잔액 조회
    v_user_boxes := get_user_boxes(p_user_id);
    
    -- 잔액 부족 확인
    IF v_user_boxes < v_total_cost THEN
        RETURN json_build_object(
            'success', false,
            'error', '박스가 부족합니다. 필요: ' || v_total_cost || ', 보유: ' || v_user_boxes
        );
    END IF;
    
    -- 박스 차감 거래 기록
    INSERT INTO box_transactions (
        user_id,
        amount,
        type,
        reason,
        related_item_id
    ) VALUES (
        p_user_id,
        v_total_cost,
        'spend',
        '아이템 구매: ' || v_item_name || ' x' || p_quantity,
        p_item_id
    );
    
    -- 사용자 아이템 보유량 업데이트 (기존 아이템이 있으면 수량 증가, 없으면 새로 생성)
    INSERT INTO user_items (user_id, item_id, quantity)
    VALUES (p_user_id, p_item_id, p_quantity)
    ON CONFLICT (user_id, item_id)
    DO UPDATE SET 
        quantity = user_items.quantity + p_quantity,
        updated_at = NOW();
    
    -- 성공 응답 반환
    RETURN json_build_object(
        'success', true,
        'item_name', v_item_name,
        'quantity', p_quantity,
        'total_cost', v_total_cost,
        'remaining_boxes', v_user_boxes - v_total_cost,
        'message', v_item_name || ' x' || p_quantity || ' 구매 완료!'
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'error', SQLERRM,
            'message', '아이템 구매 중 오류가 발생했습니다.'
        );
END;
$$ LANGUAGE plpgsql;

-- 완료 메시지
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '✅ INTEGER 오버플로우 수정 완료!';
    RAISE NOTICE '📊 earnings 테이블의 delivery_amount, mission_amount가 BIGINT로 변경되었습니다.';
    RAISE NOTICE '📊 total_amount generated column이 BIGINT로 재생성되었습니다.';
    RAISE NOTICE '📦 box_transactions 테이블의 amount 필드도 BIGINT로 변경되었습니다.';
    RAISE NOTICE '🔧 관련 함수들이 삭제 후 BIGINT 타입으로 재생성되었습니다.';
    RAISE NOTICE '💡 이제 큰 수입 금액(예: 2,892,892,989원)도 저장할 수 있습니다!';
    RAISE NOTICE '';
END $$;

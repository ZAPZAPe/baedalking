-- 🔧 place_item 함수 수정 - quantity 제약조건 위반 문제 해결
-- 아이템 배치 시 수량이 0이 되어 CHECK 제약조건 위반하는 문제 수정

CREATE OR REPLACE FUNCTION place_item(
    p_user_id UUID,
    p_item_id UUID,
    p_position_x INTEGER,
    p_position_y INTEGER,
    p_position_z INTEGER
)
RETURNS JSON AS $$
DECLARE
    v_inventory_quantity INTEGER;
    v_result JSON;
BEGIN
    -- 인벤토리에서 아이템 수량 확인
    SELECT quantity INTO v_inventory_quantity
    FROM user_inventory
    WHERE user_id = p_user_id AND item_id = p_item_id;
    
    -- 인벤토리에 아이템이 없거나 수량이 부족한 경우
    IF v_inventory_quantity IS NULL OR v_inventory_quantity < 1 THEN
        RETURN json_build_object(
            'success', false,
            'error', '인벤토리에 아이템이 없습니다.'
        );
    END IF;
    
    -- 수량이 1개인 경우 바로 삭제
    IF v_inventory_quantity = 1 THEN
        DELETE FROM user_inventory
        WHERE user_id = p_user_id AND item_id = p_item_id;
    ELSE
        -- 수량이 1개보다 많은 경우 감소
        UPDATE user_inventory
        SET quantity = quantity - 1
        WHERE user_id = p_user_id AND item_id = p_item_id;
    END IF;
    
    -- 차고에 아이템 배치
    INSERT INTO garage_placements (
        user_id, item_id, position_x, position_y, position_z
    )
    VALUES (
        p_user_id, p_item_id, p_position_x, p_position_y, p_position_z
    );
    
    -- 결과 반환
    v_result := json_build_object(
        'success', true,
        'message', '아이템이 배치되었습니다.'
    );
    
    RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- 포인트 시스템을 박스 시스템으로 변경
-- 2024년 배달킹 업데이트

-- 1. 기존 points 테이블을 boxes로 이름 변경
ALTER TABLE points RENAME TO boxes;

-- 2. 기존 인덱스 이름 변경
ALTER INDEX idx_points_user_id RENAME TO idx_boxes_user_id;
ALTER INDEX idx_points_type RENAME TO idx_boxes_type;

-- 3. 기존 컬럼명은 유지 (amount, type, reason 등)
-- type은 'earn'과 'spend'를 유지하되, 박스 획득/사용을 의미

-- 4. 박스 시스템에 맞는 설명 추가
COMMENT ON TABLE boxes IS '사용자가 획득하거나 사용한 박스 기록';
COMMENT ON COLUMN boxes.amount IS '박스 개수 (양수: 획득, 음수: 사용)';
COMMENT ON COLUMN boxes.type IS '박스 타입 (earn: 획득, spend: 사용)';
COMMENT ON COLUMN boxes.reason IS '박스 획득/사용 사유';

-- 5. earnings 테이블의 points_awarded 컬럼을 boxes_awarded로 변경
ALTER TABLE earnings RENAME COLUMN points_awarded TO boxes_awarded;

-- 6. 기존 데이터는 그대로 유지 (포인트 → 박스로 개념만 변경)

-- 캐릭터 데이터 테이블의 기본값 수정
-- 예전 파일명을 'none.png'로 변경

-- 기존 character_data 테이블의 기본값 업데이트
ALTER TABLE character_data 
ALTER COLUMN parts SET DEFAULT '{
    "hair": "none.png",
    "top": "none.png", 
    "bottom": "none.png",
    "emotion": "happy.png"
}'::jsonb;

-- 기존 데이터가 있다면 업데이트 (예전 파일명을 none.png로 변경)
UPDATE character_data 
SET parts = jsonb_set(
    jsonb_set(
        jsonb_set(
            jsonb_set(parts, '{hair}', '"none.png"'),
            '{top}', '"none.png"'
        ),
        '{bottom}', '"none.png"'
    ),
    '{emotion}', '"happy.png"'
)
WHERE parts->>'hair' IN ('hair01.png', 'jacket01.png', 'pants01.png')
   OR parts->>'top' IN ('hair01.png', 'jacket01.png', 'pants01.png')
   OR parts->>'bottom' IN ('hair01.png', 'jacket01.png', 'pants01.png');

-- 업데이트된 데이터 확인
SELECT user_id, parts FROM character_data;

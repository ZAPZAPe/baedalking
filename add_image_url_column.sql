-- ============================================================================
-- 👤 기본 캐릭터 설정 테이블에 image_url 컬럼 추가 SQL
-- 작성일: 2024년 현재
-- 설명: 기존 테이블에 image_url 컬럼 추가
-- ============================================================================

-- image_url 컬럼 추가 (이미 존재하는 경우 무시)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'default_character_setups' 
    AND column_name = 'image_url'
  ) THEN
    ALTER TABLE default_character_setups 
    ADD COLUMN image_url TEXT NOT NULL DEFAULT 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
  END IF;
END $$;

-- 기존 데이터에 기본 이미지 URL 설정 (NULL인 경우)
UPDATE default_character_setups 
SET image_url = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
WHERE image_url IS NULL OR image_url = '';

-- 완료 메시지
SELECT '🎉 image_url 컬럼 추가 완료!' as result;

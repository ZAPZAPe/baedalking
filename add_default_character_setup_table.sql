-- ============================================================================
-- 👤 기본 캐릭터 설정 테이블 추가 SQL
-- 작성일: 2024년 현재
-- 설명: 기본 캐릭터 픽셀 레이아웃을 저장하는 테이블 생성
-- ============================================================================

-- 기본 캐릭터 설정 테이블 생성
CREATE TABLE IF NOT EXISTS default_character_setups (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  pixel_data JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

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

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_default_character_setups_name ON default_character_setups(name);
CREATE INDEX IF NOT EXISTS idx_default_character_setups_created_at ON default_character_setups(created_at);

-- 업데이트 트리거 생성 (이미 존재하는 경우 무시)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_default_character_setups_updated_at'
  ) THEN
    CREATE TRIGGER update_default_character_setups_updated_at 
      BEFORE UPDATE ON default_character_setups 
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- RLS 정책 (모든 접근 허용)
ALTER TABLE default_character_setups ENABLE ROW LEVEL SECURITY;

-- 정책이 이미 존재하는 경우 무시
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'default_character_setups' 
    AND policyname = '모든 사용자 접근 허용'
  ) THEN
    CREATE POLICY "모든 사용자 접근 허용" ON default_character_setups FOR ALL USING (true);
  END IF;
END $$;

-- 기존 데이터에 기본 이미지 URL 설정 (NULL인 경우)
UPDATE default_character_setups 
SET image_url = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
WHERE image_url IS NULL OR image_url = '';

-- 기본 데이터 삽입 (중복 방지)
INSERT INTO default_character_setups (name, description, image_url, pixel_data) 
SELECT * FROM (VALUES
  ('기본 캐릭터', '새 사용자의 기본 캐릭터 픽셀 레이아웃', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', '[
    {"x": 0, "y": 0, "occupied": true},
    {"x": 1, "y": 0, "occupied": true},
    {"x": -1, "y": 0, "occupied": true},
    {"x": 0, "y": 1, "occupied": true},
    {"x": 0, "y": -1, "occupied": true}
  ]'::jsonb),
  ('기본 아바타', '기본 아바타 픽셀 레이아웃', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', '[
    {"x": 0, "y": 0, "occupied": true},
    {"x": 1, "y": 0, "occupied": true},
    {"x": -1, "y": 0, "occupied": true}
  ]'::jsonb)
) AS v(name, description, image_url, pixel_data)
WHERE NOT EXISTS (
  SELECT 1 FROM default_character_setups 
  WHERE default_character_setups.name = v.name
);

-- 완료 메시지
SELECT '🎉 기본 캐릭터 설정 테이블 생성 완료!' as result;

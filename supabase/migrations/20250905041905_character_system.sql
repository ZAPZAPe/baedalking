-- 캐릭터 시스템 테이블 생성
CREATE TABLE IF NOT EXISTS character_data (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  parts JSONB NOT NULL DEFAULT '{
    "hair": "hair01.png",
    "top": "jacket01.png", 
    "bottom": "pants01.png",
    "emotion": "happy.png"
  }',
  position JSONB NOT NULL DEFAULT '{"x": 0, "y": 0}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_character_data_user_id ON character_data(user_id);

-- 업데이트 시간 자동 갱신 트리거
CREATE OR REPLACE FUNCTION update_character_data_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_character_data_updated_at
  BEFORE UPDATE ON character_data
  FOR EACH ROW
  EXECUTE FUNCTION update_character_data_updated_at();

-- RLS 정책 설정
ALTER TABLE character_data ENABLE ROW LEVEL SECURITY;

-- 모든 사용자가 캐릭터 데이터에 접근 가능 (카카오 로그인 환경)
CREATE POLICY "Allow all operations on character_data" ON character_data 
FOR ALL USING (true) WITH CHECK (true);

-- users 테이블에 referred_by 컬럼 추가
ALTER TABLE users ADD COLUMN IF NOT EXISTS referred_by TEXT;

-- point_history 테이블 생성
CREATE TABLE IF NOT EXISTS point_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  type TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_point_history_user_id ON point_history(user_id);
CREATE INDEX IF NOT EXISTS idx_point_history_created_at ON point_history(created_at DESC);

-- RLS 정책 설정
ALTER TABLE point_history ENABLE ROW LEVEL SECURITY;

-- 사용자는 자신의 포인트 내역만 볼 수 있음
CREATE POLICY "Users can view own point history" ON point_history
  FOR SELECT USING (auth.uid() = user_id);

-- 시스템만 포인트 내역을 추가할 수 있음 (서비스 역할)
CREATE POLICY "Service role can insert point history" ON point_history
  FOR INSERT WITH CHECK (true); 
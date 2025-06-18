-- 친구 초대 시스템을 위한 테이블 생성 SQL

-- 초대 코드 테이블 생성
CREATE TABLE IF NOT EXISTS invite_codes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  code VARCHAR(10) UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 초대 기록 테이블 생성
CREATE TABLE IF NOT EXISTS invites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  inviter_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  invited_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  invite_code VARCHAR(10) REFERENCES invite_codes(code),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(invited_user_id) -- 한 사용자는 한 번만 초대받을 수 있음
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_invite_codes_user_id ON invite_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_invite_codes_code ON invite_codes(code);
CREATE INDEX IF NOT EXISTS idx_invites_inviter_id ON invites(inviter_id);
CREATE INDEX IF NOT EXISTS idx_invites_invited_user_id ON invites(invited_user_id);

-- RLS 정책
ALTER TABLE invite_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE invites ENABLE ROW LEVEL SECURITY;

-- invite_codes 정책
CREATE POLICY "Users can view their own invite code" ON invite_codes
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own invite code" ON invite_codes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- invites 정책
CREATE POLICY "Users can view invites they made" ON invites
  FOR SELECT USING (auth.uid() = inviter_id);

CREATE POLICY "System can create invites" ON invites
  FOR INSERT WITH CHECK (true); 
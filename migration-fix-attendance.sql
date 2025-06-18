-- point_history 테이블의 RLS 정책 수정
-- 기존 정책 삭제
DROP POLICY IF EXISTS "Service role can insert point history" ON point_history;
DROP POLICY IF EXISTS "Users can insert own point history" ON point_history;

-- 사용자가 자신의 포인트 기록을 추가할 수 있도록 허용
CREATE POLICY "Users can insert own point history" ON point_history
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 사용자가 자신의 포인트 기록을 조회할 수 있도록 허용 (이미 있지만 확인)
DROP POLICY IF EXISTS "Users can view own point history" ON point_history;
CREATE POLICY "Users can view own point history" ON point_history
  FOR SELECT USING (auth.uid() = user_id);

-- users 테이블의 points 컬럼 업데이트 권한 확인
DROP POLICY IF EXISTS "Users can update own points" ON users;
CREATE POLICY "Users can update own points" ON users
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id); 
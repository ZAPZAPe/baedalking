-- RLS 정책 임시 비활성화 (카카오 로그인용)
-- =====================================================

-- Users 테이블의 INSERT 정책을 임시로 완전 허용으로 변경
DROP POLICY IF EXISTS "Users can insert own earnings" ON users;
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Public profiles viewable" ON users;

-- 새로운 정책 생성 (카카오 로그인 허용)
CREATE POLICY "Anyone can create user" ON users
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view all profiles" ON users
    FOR SELECT USING (true);

CREATE POLICY "Users can update any profile" ON users
    FOR UPDATE USING (true);

-- Earnings 정책도 수정
DROP POLICY IF EXISTS "Users can view own earnings" ON earnings;
DROP POLICY IF EXISTS "Users can insert own earnings" ON earnings;
DROP POLICY IF EXISTS "Users can update own earnings" ON earnings;
DROP POLICY IF EXISTS "Users can delete own earnings" ON earnings;

CREATE POLICY "Anyone can view earnings" ON earnings
    FOR SELECT USING (true);

CREATE POLICY "Anyone can insert earnings" ON earnings
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update earnings" ON earnings
    FOR UPDATE USING (true);

CREATE POLICY "Anyone can delete earnings" ON earnings
    FOR DELETE USING (true);

-- Points 정책도 수정
DROP POLICY IF EXISTS "Users can view own points" ON points;
DROP POLICY IF EXISTS "Users can insert own points" ON points;

CREATE POLICY "Anyone can view points" ON points
    FOR SELECT USING (true);

CREATE POLICY "Anyone can insert points" ON points
    FOR INSERT WITH CHECK (true);

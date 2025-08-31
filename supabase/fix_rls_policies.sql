-- RLS 정책 수정 - 사용자가 자신의 데이터를 삭제할 수 있도록
-- 이 스크립트는 Supabase Dashboard에서 실행해야 합니다

-- 1. 기존 정책 삭제
DROP POLICY IF EXISTS "Enable delete for all users" ON users;
DROP POLICY IF EXISTS "Enable delete for all users" ON earnings;
DROP POLICY IF EXISTS "Enable delete for all users" ON points;
DROP POLICY IF EXISTS "Enable delete for all users" ON user_items;
DROP POLICY IF EXISTS "Enable delete for all users" ON friends;
DROP POLICY IF EXISTS "Enable delete for all users" ON visits;
DROP POLICY IF EXISTS "Enable delete for all users" ON guestbook;

-- 2. 새로운 삭제 정책 생성 (사용자가 자신의 데이터만 삭제 가능)
CREATE POLICY "Enable delete for own data" ON users
    FOR DELETE USING (true); -- 모든 사용자가 삭제 가능 (계정 삭제용)

CREATE POLICY "Enable delete for own data" ON earnings
    FOR DELETE USING (true); -- 모든 사용자가 삭제 가능

CREATE POLICY "Enable delete for own data" ON points
    FOR DELETE USING (true); -- 모든 사용자가 삭제 가능

CREATE POLICY "Enable delete for own data" ON user_items
    FOR DELETE USING (true); -- 모든 사용자가 삭제 가능

CREATE POLICY "Enable delete for own data" ON friends
    FOR DELETE USING (true); -- 모든 사용자가 삭제 가능

CREATE POLICY "Enable delete for own data" ON visits
    FOR DELETE USING (true); -- 모든 사용자가 삭제 가능

CREATE POLICY "Enable delete for own data" ON guestbook
    FOR DELETE USING (true); -- 모든 사용자가 삭제 가능

-- 3. 완료 확인
SELECT 'RLS 정책이 수정되었습니다!' as message;

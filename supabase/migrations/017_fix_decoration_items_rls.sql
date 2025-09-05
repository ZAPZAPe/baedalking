-- 🔧 decoration_items 테이블 RLS 정책 수정
-- INSERT, UPDATE, DELETE 정책 추가

-- 기존 정책 삭제
DROP POLICY IF EXISTS "Enable read access for all users" ON decoration_items;

-- 새로운 정책 생성
-- 모든 사용자가 읽기 가능
CREATE POLICY "Enable read access for all users" ON decoration_items FOR SELECT USING (true);

-- 인증된 사용자가 INSERT 가능 (관리자 아이템 추가용)
CREATE POLICY "Enable insert for authenticated users" ON decoration_items FOR INSERT WITH CHECK (true);

-- 인증된 사용자가 UPDATE 가능 (관리자 아이템 수정용)
CREATE POLICY "Enable update for authenticated users" ON decoration_items FOR UPDATE USING (true);

-- 인증된 사용자가 DELETE 가능 (관리자 아이템 삭제용)
CREATE POLICY "Enable delete for authenticated users" ON decoration_items FOR DELETE USING (true);

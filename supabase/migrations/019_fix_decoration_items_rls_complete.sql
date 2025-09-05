-- 🔧 decoration_items 테이블 RLS 정책 완전 수정
-- 관리자 아이템 에디터에서 발생하는 42501 오류 해결

-- 기존 모든 정책 삭제
DROP POLICY IF EXISTS "Allow read access for all users" ON decoration_items;
DROP POLICY IF EXISTS "Allow insert for authenticated users" ON decoration_items;
DROP POLICY IF EXISTS "Allow update for authenticated users" ON decoration_items;
DROP POLICY IF EXISTS "Allow delete for authenticated users" ON decoration_items;

-- RLS가 활성화되어 있는지 확인하고 필요시 활성화
ALTER TABLE decoration_items ENABLE ROW LEVEL SECURITY;

-- 새로운 정책 생성 (더 관대한 정책)
-- 1. 모든 사용자가 읽기 가능
CREATE POLICY "Enable read access for all users" ON decoration_items 
FOR SELECT USING (true);

-- 2. 인증된 사용자가 INSERT 가능 (created_by는 NULL 허용)
CREATE POLICY "Enable insert for authenticated users" ON decoration_items 
FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- 3. 인증된 사용자가 UPDATE 가능
CREATE POLICY "Enable update for authenticated users" ON decoration_items 
FOR UPDATE USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

-- 4. 인증된 사용자가 DELETE 가능 (soft delete)
CREATE POLICY "Enable delete for authenticated users" ON decoration_items 
FOR DELETE USING (auth.uid() IS NOT NULL);

-- 정책 확인을 위한 주석
-- 이 정책들은 다음을 허용합니다:
-- - 모든 사용자: SELECT (읽기)
-- - 인증된 사용자: INSERT, UPDATE, DELETE (쓰기 작업)
-- - created_by 필드는 NULL 허용 (관리자 아이템용)

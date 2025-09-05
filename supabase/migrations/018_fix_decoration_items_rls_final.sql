-- 🔧 decoration_items 테이블 RLS 정책 최종 수정
-- 모든 인증된 사용자가 아이템 추가/수정/삭제 가능하도록 설정

-- 기존 모든 정책 삭제
DROP POLICY IF EXISTS "Enable read access for all users" ON decoration_items;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON decoration_items;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON decoration_items;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON decoration_items;

-- RLS가 활성화되어 있는지 확인하고 필요시 활성화
ALTER TABLE decoration_items ENABLE ROW LEVEL SECURITY;

-- 새로운 정책 생성
-- 1. 모든 사용자가 읽기 가능
CREATE POLICY "Allow read access for all users" ON decoration_items 
FOR SELECT USING (true);

-- 2. 인증된 사용자가 INSERT 가능 (관리자 아이템 추가용)
CREATE POLICY "Allow insert for authenticated users" ON decoration_items 
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- 3. 인증된 사용자가 UPDATE 가능 (관리자 아이템 수정용)
CREATE POLICY "Allow update for authenticated users" ON decoration_items 
FOR UPDATE USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- 4. 인증된 사용자가 DELETE 가능 (관리자 아이템 삭제용)
CREATE POLICY "Allow delete for authenticated users" ON decoration_items 
FOR DELETE USING (auth.role() = 'authenticated');

-- 정책 확인을 위한 주석
-- 이 정책들은 다음을 허용합니다:
-- - 모든 사용자: SELECT (읽기)
-- - 인증된 사용자: INSERT, UPDATE, DELETE (쓰기 작업)

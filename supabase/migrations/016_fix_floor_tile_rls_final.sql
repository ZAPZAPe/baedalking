-- floor_tile_settings 테이블의 RLS 정책 완전 수정
-- 모든 사용자가 접근할 수 있도록 정책 변경

-- 기존 정책 삭제 (있다면)
DROP POLICY IF EXISTS "Users can manage own floor settings" ON floor_tile_settings;

-- RLS 활성화 상태에서 모든 작업 허용하는 정책 생성
CREATE POLICY "Allow all operations on floor_tile_settings" ON floor_tile_settings 
FOR ALL USING (true) WITH CHECK (true);

-- 또는 RLS를 완전히 비활성화하려면:
-- ALTER TABLE floor_tile_settings DISABLE ROW LEVEL SECURITY;

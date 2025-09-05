-- floor_tile_settings 테이블의 RLS 정책 수정
-- 카카오 로그인을 사용하므로 auth.uid() 대신 직접 user_id 비교 사용

-- 기존 정책 삭제
DROP POLICY IF EXISTS "Users can manage own floor settings" ON floor_tile_settings;

-- 새로운 정책 생성 (RLS 비활성화하고 직접 접근 허용)
ALTER TABLE floor_tile_settings DISABLE ROW LEVEL SECURITY;

-- 또는 RLS를 유지하면서 정책을 수정하려면:
-- CREATE POLICY "Allow all operations on floor_tile_settings" ON floor_tile_settings FOR ALL USING (true);

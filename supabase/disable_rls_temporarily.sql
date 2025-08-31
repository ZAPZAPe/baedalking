-- RLS 일시 비활성화 (계정 삭제용)
-- 이 스크립트는 Supabase Dashboard에서 실행해야 합니다

-- 1. 모든 테이블에서 RLS 비활성화
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE earnings DISABLE ROW LEVEL SECURITY;
ALTER TABLE points DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE friends DISABLE ROW LEVEL SECURITY;
ALTER TABLE visits DISABLE ROW LEVEL SECURITY;
ALTER TABLE guestbook DISABLE ROW LEVEL SECURITY;

-- 2. 완료 확인
SELECT 'RLS가 일시적으로 비활성화되었습니다!' as message;
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('users', 'earnings', 'points', 'user_items', 'friends', 'visits', 'guestbook');

-- ============================================================================
-- 🚀 간단한 RLS 정책 수정 (한 번에 실행)
-- ============================================================================

-- 모든 테이블의 RLS 비활성화
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE earnings DISABLE ROW LEVEL SECURITY;
ALTER TABLE box_transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE shop_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_inventory DISABLE ROW LEVEL SECURITY;
ALTER TABLE garage_placements DISABLE ROW LEVEL SECURITY;
ALTER TABLE floor_tile_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE character_data DISABLE ROW LEVEL SECURITY;
ALTER TABLE friendships DISABLE ROW LEVEL SECURITY;
ALTER TABLE guestbook_entries DISABLE ROW LEVEL SECURITY;
ALTER TABLE visits DISABLE ROW LEVEL SECURITY;

-- 함수 실행 권한 부여
GRANT EXECUTE ON FUNCTION save_earning_with_boxes TO PUBLIC;
GRANT EXECUTE ON FUNCTION purchase_item TO PUBLIC;
GRANT EXECUTE ON FUNCTION place_item TO PUBLIC;
GRANT EXECUTE ON FUNCTION remove_item TO PUBLIC;
GRANT EXECUTE ON FUNCTION get_user_boxes TO PUBLIC;

-- 완료 메시지
SELECT '🎉 RLS 비활성화 완료! 모든 테이블에 자유 접근 가능!' as result;

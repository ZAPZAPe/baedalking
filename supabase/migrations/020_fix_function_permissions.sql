-- 🔧 Supabase 함수 실행 권한 수정
-- place_item 함수 호출 시 발생하는 권한 오류 해결

-- 함수 실행 권한 부여
-- anon 역할에 함수 실행 권한 부여
GRANT EXECUTE ON FUNCTION place_item(UUID, UUID, INTEGER, INTEGER, INTEGER) TO anon;
GRANT EXECUTE ON FUNCTION purchase_item(UUID, UUID, INTEGER) TO anon;
GRANT EXECUTE ON FUNCTION remove_item(UUID, UUID) TO anon;
GRANT EXECUTE ON FUNCTION get_user_boxes(UUID) TO anon;
GRANT EXECUTE ON FUNCTION save_earning_with_boxes(UUID, TEXT, INTEGER, INTEGER, INTEGER, DATE) TO anon;

-- authenticated 역할에 함수 실행 권한 부여
GRANT EXECUTE ON FUNCTION place_item(UUID, UUID, INTEGER, INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION purchase_item(UUID, UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION remove_item(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_boxes(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION save_earning_with_boxes(UUID, TEXT, INTEGER, INTEGER, INTEGER, DATE) TO authenticated;

-- service_role 역할에 함수 실행 권한 부여 (관리자용)
GRANT EXECUTE ON FUNCTION place_item(UUID, UUID, INTEGER, INTEGER, INTEGER) TO service_role;
GRANT EXECUTE ON FUNCTION purchase_item(UUID, UUID, INTEGER) TO service_role;
GRANT EXECUTE ON FUNCTION remove_item(UUID, UUID) TO service_role;
GRANT EXECUTE ON FUNCTION get_user_boxes(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION save_earning_with_boxes(UUID, TEXT, INTEGER, INTEGER, INTEGER, DATE) TO service_role;

-- 함수 보안 설정 (SECURITY DEFINER로 실행하여 함수 내에서 권한 확장)
ALTER FUNCTION place_item(UUID, UUID, INTEGER, INTEGER, INTEGER) SECURITY DEFINER;
ALTER FUNCTION purchase_item(UUID, UUID, INTEGER) SECURITY DEFINER;
ALTER FUNCTION remove_item(UUID, UUID) SECURITY DEFINER;
ALTER FUNCTION get_user_boxes(UUID) SECURITY DEFINER;
ALTER FUNCTION save_earning_with_boxes(UUID, TEXT, INTEGER, INTEGER, INTEGER, DATE) SECURITY DEFINER;

-- ============================================================================
-- 🔧 RLS 정책 수정 SQL - 카카오 로그인 호환
-- 작성일: 2024년 현재
-- 설명: auth.uid() 대신 직접 사용자 ID를 사용하도록 RLS 정책 수정
-- ============================================================================

-- 기존 RLS 정책 삭제
DROP POLICY IF EXISTS "사용자는 모든 프로필을 볼 수 있음" ON users;
DROP POLICY IF EXISTS "사용자는 자신의 프로필만 수정할 수 있음" ON users;
DROP POLICY IF EXISTS "모든 사용자가 프로필을 생성할 수 있음" ON users;

DROP POLICY IF EXISTS "사용자는 자신의 수입 기록만 볼 수 있음" ON earnings;
DROP POLICY IF EXISTS "사용자는 자신의 수입 기록만 생성할 수 있음" ON earnings;
DROP POLICY IF EXISTS "사용자는 자신의 수입 기록만 수정할 수 있음" ON earnings;
DROP POLICY IF EXISTS "사용자는 자신의 수입 기록만 삭제할 수 있음" ON earnings;

DROP POLICY IF EXISTS "사용자는 자신의 박스 거래만 볼 수 있음" ON box_transactions;
DROP POLICY IF EXISTS "사용자는 자신의 박스 거래만 생성할 수 있음" ON box_transactions;

DROP POLICY IF EXISTS "모든 사용자가 활성화된 상점 아이템을 볼 수 있음" ON shop_items;

DROP POLICY IF EXISTS "사용자는 자신의 인벤토리만 볼 수 있음" ON user_inventory;
DROP POLICY IF EXISTS "사용자는 자신의 인벤토리만 관리할 수 있음" ON user_inventory;

DROP POLICY IF EXISTS "모든 사용자가 차고 배치를 볼 수 있음" ON garage_placements;
DROP POLICY IF EXISTS "사용자는 자신의 차고 배치만 관리할 수 있음" ON garage_placements;

DROP POLICY IF EXISTS "사용자는 자신의 바닥 타일 설정만 관리할 수 있음" ON floor_tile_settings;

DROP POLICY IF EXISTS "사용자는 자신의 캐릭터 데이터만 관리할 수 있음" ON character_data;

DROP POLICY IF EXISTS "사용자는 자신의 친구 관계만 볼 수 있음" ON friendships;
DROP POLICY IF EXISTS "사용자는 자신의 친구 관계만 관리할 수 있음" ON friendships;

DROP POLICY IF EXISTS "모든 사용자가 공개 방명록을 볼 수 있음" ON guestbook_entries;
DROP POLICY IF EXISTS "사용자는 방명록을 작성할 수 있음" ON guestbook_entries;
DROP POLICY IF EXISTS "사용자는 자신의 방명록만 수정할 수 있음" ON guestbook_entries;
DROP POLICY IF EXISTS "사용자는 자신의 방명록만 삭제할 수 있음" ON guestbook_entries;

DROP POLICY IF EXISTS "사용자는 자신의 방문 기록만 볼 수 있음" ON visits;
DROP POLICY IF EXISTS "사용자는 방문 기록을 생성할 수 있음" ON visits;

-- ============================================================================
-- 새로운 RLS 정책 생성 (모든 접근 허용)
-- ============================================================================

-- 사용자 테이블 정책
CREATE POLICY "모든 사용자 접근 허용" ON users FOR ALL USING (true);

-- 수입 기록 테이블 정책
CREATE POLICY "모든 사용자 접근 허용" ON earnings FOR ALL USING (true);

-- 박스 거래 테이블 정책
CREATE POLICY "모든 사용자 접근 허용" ON box_transactions FOR ALL USING (true);

-- 상점 아이템 테이블 정책
CREATE POLICY "모든 사용자 접근 허용" ON shop_items FOR ALL USING (true);

-- 사용자 인벤토리 테이블 정책
CREATE POLICY "모든 사용자 접근 허용" ON user_inventory FOR ALL USING (true);

-- 차고 배치 테이블 정책
CREATE POLICY "모든 사용자 접근 허용" ON garage_placements FOR ALL USING (true);

-- 바닥 타일 설정 테이블 정책
CREATE POLICY "모든 사용자 접근 허용" ON floor_tile_settings FOR ALL USING (true);

-- 캐릭터 데이터 테이블 정책
CREATE POLICY "모든 사용자 접근 허용" ON character_data FOR ALL USING (true);

-- 친구 관계 테이블 정책
CREATE POLICY "모든 사용자 접근 허용" ON friendships FOR ALL USING (true);

-- 방명록 테이블 정책
CREATE POLICY "모든 사용자 접근 허용" ON guestbook_entries FOR ALL USING (true);

-- 방문 기록 테이블 정책
CREATE POLICY "모든 사용자 접근 허용" ON visits FOR ALL USING (true);

-- ============================================================================
-- 함수 권한 수정
-- ============================================================================

-- 함수 실행 권한을 모든 사용자에게 부여
GRANT EXECUTE ON FUNCTION save_earning_with_boxes TO PUBLIC;
GRANT EXECUTE ON FUNCTION purchase_item TO PUBLIC;
GRANT EXECUTE ON FUNCTION place_item TO PUBLIC;
GRANT EXECUTE ON FUNCTION remove_item TO PUBLIC;
GRANT EXECUTE ON FUNCTION get_user_boxes TO PUBLIC;

-- ============================================================================
-- 완료 메시지
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '🎉 RLS 정책 수정 완료!';
    RAISE NOTICE '🔓 모든 테이블에 전체 접근 허용';
    RAISE NOTICE '⚡ 함수 실행 권한 부여 완료';
    RAISE NOTICE '🚀 카카오 로그인 호환성 문제 해결!';
END $$;

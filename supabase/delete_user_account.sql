-- 사용자 계정 삭제 함수
-- 이 함수는 사용자와 관련된 모든 데이터를 삭제합니다
CREATE OR REPLACE FUNCTION delete_user_account(user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- 트랜잭션 시작
  BEGIN
    -- 1. 수입 기록 삭제
    DELETE FROM earnings WHERE user_id = delete_user_account.user_id;
    
    -- 2. 친구 관계 삭제 (요청자와 수신자 모두)
    DELETE FROM friendships 
    WHERE requester_id = delete_user_account.user_id 
       OR addressee_id = delete_user_account.user_id;
    
    -- 3. 방명록 삭제 (작성자와 대상자 모두)
    DELETE FROM guestbook 
    WHERE author_id = delete_user_account.user_id 
       OR target_user_id = delete_user_account.user_id;
    
    -- 4. 방문 기록 삭제 (방문자와 방문 대상자 모두)
    DELETE FROM visits 
    WHERE visitor_id = delete_user_account.user_id 
       OR visited_user_id = delete_user_account.user_id;
    
    -- 5. 랭킹 데이터 삭제
    DELETE FROM rankings WHERE user_id = delete_user_account.user_id;
    
    -- 6. 사용자 아이템 삭제
    DELETE FROM user_items WHERE user_id = delete_user_account.user_id;
    
    -- 7. 포인트 기록 삭제
    DELETE FROM points WHERE user_id = delete_user_account.user_id;
    
    -- 8. 사용자 설정 삭제 (있는 경우)
    -- DELETE FROM user_settings WHERE user_id = delete_user_account.user_id;
    
    -- 9. 사용자 프로필 삭제
    DELETE FROM users WHERE id = delete_user_account.user_id;
    
    -- 트랜잭션 커밋
    COMMIT;
    
    RAISE NOTICE '사용자 %의 모든 데이터가 삭제되었습니다.', user_id;
    
  EXCEPTION
    WHEN OTHERS THEN
      -- 트랜잭션 롤백
      ROLLBACK;
      RAISE EXCEPTION '계정 삭제 중 오류가 발생했습니다: %', SQLERRM;
  END;
END;
$$;

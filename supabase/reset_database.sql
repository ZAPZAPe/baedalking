-- 기존 데이터베이스 완전 초기화
-- 주의: 이 스크립트는 모든 데이터를 삭제합니다!

-- 모든 RLS 정책 제거 (안전하게)
DO $$ 
DECLARE
    r RECORD;
BEGIN
    -- 모든 정책 제거
    FOR r IN SELECT schemaname, tablename, policyname 
             FROM pg_policies 
             WHERE schemaname = 'public'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON ' || r.schemaname || '.' || r.tablename;
    END LOOP;
END $$;

-- 기존 테이블들 안전하게 제거
DO $$ 
DECLARE
    r RECORD;
BEGIN
    -- 모든 테이블을 CASCADE로 제거
    FOR r IN SELECT tablename FROM pg_tables WHERE schemaname = 'public'
    LOOP
        EXECUTE 'DROP TABLE IF EXISTS public.' || quote_ident(r.tablename) || ' CASCADE';
    END LOOP;
END $$;

-- 기존 함수들 제거
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN SELECT proname, oidvectortypes(proargtypes) as argtypes
             FROM pg_proc 
             WHERE pronamespace = 'public'::regnamespace
    LOOP
        EXECUTE 'DROP FUNCTION IF EXISTS public.' || r.proname || '(' || r.argtypes || ') CASCADE';
    END LOOP;
END $$;

-- UUID 확장은 보존
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 완료 메시지
SELECT 'Database reset completed successfully! You can now run the new migration.' as message;

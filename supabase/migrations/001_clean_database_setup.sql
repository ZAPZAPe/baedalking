-- ============================================================================
-- 🎭 배달킹 통합 데이터베이스 스키마 (완전 새로 작성)
-- ============================================================================
-- 작성일: 2024년
-- 목적: 기존 복잡한 시스템들을 완전히 정리하고 깔끔한 구조로 재구성
-- 특징: 7개 혼재 시스템 → 1개 통합 시스템

-- RLS 모두 해제 (테스트용)
ALTER DATABASE postgres SET row_security = off;

-- 기존 테이블들 모두 삭제 (순서 중요 - 외래키 때문에)
DROP TABLE IF EXISTS visits CASCADE;
DROP TABLE IF EXISTS guestbook_entries CASCADE;
DROP TABLE IF EXISTS friendships CASCADE;
DROP TABLE IF EXISTS garage_placements CASCADE;
DROP TABLE IF EXISTS user_items CASCADE;
DROP TABLE IF EXISTS shop_items CASCADE;
DROP TABLE IF EXISTS box_transactions CASCADE;
DROP TABLE IF EXISTS earnings CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- 기존 함수들도 삭제
DROP FUNCTION IF EXISTS purchase_item_with_boxes CASCADE;
DROP FUNCTION IF EXISTS get_user_boxes CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column CASCADE;

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🗑️ 기존 테이블 및 함수 완전 삭제 완료';
    RAISE NOTICE '🚀 새로운 통합 스키마 생성 시작...';
    RAISE NOTICE '';
END $$;

-- ============================================================================
-- 👤 사용자 테이블
-- ============================================================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    kakao_id TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    nickname TEXT NOT NULL,
    region TEXT DEFAULT '',
    
    -- 프로필 설정
    garage_intro TEXT DEFAULT '열심히 달리는 배달킹입니다! 🛵💨',
    status_message TEXT DEFAULT '',
    
    -- ✨ 새로운 캐릭터 장착 시스템
    equipped_character_id UUID,  -- shop_items(id) 참조 (나중에 외래키 설정)
    equipped_emotion_id UUID,    -- shop_items(id) 참조 (NULL 가능)
    
    -- 설정
    is_income_private BOOLEAN DEFAULT false,
    
    -- 목표 설정
    goals JSONB DEFAULT '{
        "daily": 50000,
        "weekly": 300000, 
        "monthly": 1200000
    }',
    
    -- 방문자 통계
    total_visitors INTEGER DEFAULT 0,
    
    -- 메타데이터
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 💰 수입 기록 테이블
-- ============================================================================
CREATE TABLE earnings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- 수입 정보
    amount INTEGER NOT NULL CHECK (amount > 0),
    platform TEXT NOT NULL,
    date DATE NOT NULL,
    
    -- 메타데이터
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- 중복 방지: 같은 날짜, 같은 플랫폼
    UNIQUE(user_id, platform, date)
);

-- ============================================================================
-- 📦 박스 거래 내역 테이블 
-- ============================================================================
CREATE TABLE box_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- 거래 정보
    amount INTEGER NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('earn', 'spend')),
    reason TEXT DEFAULT '',
    
    -- 연관 데이터
    related_earning_id UUID REFERENCES earnings(id) ON DELETE SET NULL,
    
    -- 메타데이터
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 🛍️ 상점 아이템 테이블 (통합 - 새로운 카테고리 구조)
-- ============================================================================
CREATE TABLE shop_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- 기본 정보
    name TEXT NOT NULL,
    description TEXT DEFAULT '',
    image_url TEXT NOT NULL,
    price INTEGER DEFAULT 0,
    
    -- ✨ 새로운 2단계 카테고리 구조
    category TEXT NOT NULL CHECK (category IN ('캐릭터', '인테리어')),
    sub_category TEXT NOT NULL CHECK (
        (category = '캐릭터' AND sub_category IN ('캐릭터', '감정표현')) OR
        (category = '인테리어' AND sub_category IN ('가구', '장식품', '운송수단'))
    ),
    
    -- 픽셀 데이터 (스프라이트 경로 등)
    pixel_data JSONB DEFAULT '{}',
    
    -- 관리 설정
    is_active BOOLEAN DEFAULT true,
    
    -- 메타데이터
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 🎒 사용자 소유 아이템 테이블
-- ============================================================================
CREATE TABLE user_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    item_id UUID NOT NULL REFERENCES shop_items(id) ON DELETE CASCADE,
    
    -- 수량 및 구매 정보
    quantity INTEGER DEFAULT 1 CHECK (quantity > 0),
    purchased_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- 중복 방지: 사용자당 아이템별 하나의 레코드
    UNIQUE(user_id, item_id)
);

-- ============================================================================
-- 🏠 차고 아이템 배치 테이블
-- ============================================================================
CREATE TABLE garage_placements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    item_id UUID NOT NULL REFERENCES shop_items(id) ON DELETE CASCADE,
    
    -- 3D 좌표
    position_x INTEGER DEFAULT 0,
    position_y INTEGER DEFAULT 0,
    position_z INTEGER DEFAULT 0,
    rotation INTEGER DEFAULT 0,
    
    -- 메타데이터
    placed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 👥 친구 관계 테이블
-- ============================================================================
CREATE TABLE friendships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    friend_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- 친구 상태
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
    
    -- 메타데이터
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- 제약 조건
    UNIQUE(user_id, friend_id),
    CHECK (user_id != friend_id)
);

-- ============================================================================
-- 📝 방명록 테이블
-- ============================================================================
CREATE TABLE guestbook_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,      -- 방명록 주인
    visitor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,   -- 방문자/작성자
    
    -- 메시지 내용
    message TEXT NOT NULL CHECK (LENGTH(message) BETWEEN 1 AND 200),
    is_private BOOLEAN DEFAULT false,
    
    -- 메타데이터
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 🏠 방문 기록 테이블
-- ============================================================================
CREATE TABLE visits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,      -- 방문받은 사용자
    visitor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,   -- 방문한 사용자
    
    -- 방문 정보
    visit_date DATE DEFAULT CURRENT_DATE,
    visit_count INTEGER DEFAULT 1,
    
    -- 메타데이터
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- 중복 방지: 같은 날짜, 같은 방문자
    UNIQUE(user_id, visitor_id, visit_date)
);

-- ============================================================================
-- 외래키 제약조건 추가 (순환 참조 해결)
-- ============================================================================
ALTER TABLE users 
ADD CONSTRAINT fk_users_equipped_character 
FOREIGN KEY (equipped_character_id) REFERENCES shop_items(id);

ALTER TABLE users 
ADD CONSTRAINT fk_users_equipped_emotion 
FOREIGN KEY (equipped_emotion_id) REFERENCES shop_items(id);

-- ============================================================================
-- 인덱스 생성
-- ============================================================================

-- 사용자 조회 최적화
CREATE INDEX idx_users_kakao_id ON users(kakao_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_equipped_character ON users(equipped_character_id);
CREATE INDEX idx_users_equipped_emotion ON users(equipped_emotion_id);

-- 수입 기록 최적화
CREATE INDEX idx_earnings_user_date ON earnings(user_id, date DESC);
CREATE INDEX idx_earnings_platform ON earnings(platform);

-- 박스 거래 최적화
CREATE INDEX idx_box_transactions_user ON box_transactions(user_id, created_at DESC);
CREATE INDEX idx_box_transactions_type ON box_transactions(type);

-- 상점 아이템 최적화
CREATE INDEX idx_shop_items_category ON shop_items(category, sub_category);
CREATE INDEX idx_shop_items_active ON shop_items(is_active);
CREATE INDEX idx_shop_items_price ON shop_items(price);

-- 사용자 아이템 최적화
CREATE INDEX idx_user_items_user_id ON user_items(user_id);
CREATE INDEX idx_user_items_item_id ON user_items(item_id);

-- 차고 배치 최적화
CREATE INDEX idx_garage_placements_user_id ON garage_placements(user_id);
CREATE INDEX idx_garage_placements_position ON garage_placements(user_id, position_x, position_y);

-- 친구 관계 최적화
CREATE INDEX idx_friendships_user_id ON friendships(user_id);
CREATE INDEX idx_friendships_friend_id ON friendships(friend_id);
CREATE INDEX idx_friendships_status ON friendships(status);

-- 방명록 최적화
CREATE INDEX idx_guestbook_user_id ON guestbook_entries(user_id, created_at DESC);
CREATE INDEX idx_guestbook_visitor_id ON guestbook_entries(visitor_id);

-- 방문 기록 최적화
CREATE INDEX idx_visits_user_date ON visits(user_id, visit_date DESC);
CREATE INDEX idx_visits_visitor_id ON visits(visitor_id);

-- ============================================================================
-- 유틸리티 함수들
-- ============================================================================

-- 박스 잔액 계산 함수
CREATE OR REPLACE FUNCTION get_user_boxes(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
    v_balance INTEGER;
BEGIN
    SELECT COALESCE(SUM(
        CASE WHEN type = 'earn' THEN amount 
             WHEN type = 'spend' THEN -amount 
             ELSE 0 
        END
    ), 0)
    INTO v_balance
    FROM box_transactions
    WHERE user_id = p_user_id;
    
    RETURN GREATEST(0, v_balance);
END;
$$ LANGUAGE plpgsql;

-- 아이템 구매 함수
CREATE OR REPLACE FUNCTION purchase_item_with_boxes(
    p_user_id UUID,
    p_item_id UUID,
    p_quantity INTEGER DEFAULT 1
)
RETURNS JSON AS $$
DECLARE
    v_item_price INTEGER;
    v_item_name TEXT;
    v_total_cost INTEGER;
    v_user_boxes INTEGER;
    v_result JSON;
BEGIN
    -- 아이템 정보 조회
    SELECT price, name INTO v_item_price, v_item_name
    FROM shop_items
    WHERE id = p_item_id AND is_active = true;
    
    IF v_item_price IS NULL THEN
        RETURN json_build_object(
            'success', false, 
            'error', '아이템을 찾을 수 없습니다.'
        );
    END IF;
    
    -- 총 비용 계산
    v_total_cost := v_item_price * p_quantity;
    
    -- 무료 아이템이 아닌 경우 박스 확인
    IF v_total_cost > 0 THEN
        v_user_boxes := get_user_boxes(p_user_id);
        
        IF v_user_boxes < v_total_cost THEN
            RETURN json_build_object(
                'success', false,
                'error', '박스가 부족합니다.',
                'required', v_total_cost,
                'available', v_user_boxes
            );
        END IF;
        
        -- 박스 차감
        INSERT INTO box_transactions (user_id, amount, type, reason)
        VALUES (p_user_id, v_total_cost, 'spend', 
                '아이템 구매: ' || v_item_name);
    END IF;
    
    -- 사용자 아이템에 추가
    INSERT INTO user_items (user_id, item_id, quantity)
    VALUES (p_user_id, p_item_id, p_quantity)
    ON CONFLICT (user_id, item_id)
    DO UPDATE SET 
        quantity = user_items.quantity + p_quantity,
        purchased_at = NOW();
    
    -- 결과 반환
    v_result := json_build_object(
        'success', true,
        'message', v_item_name || ' 구매 완료!',
        'total_cost', v_total_cost,
        'remaining_boxes', GREATEST(0, v_user_boxes - v_total_cost)
    );
    
    RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- 업데이트 트리거 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 트리거 생성
-- ============================================================================

-- users 테이블 업데이트 트리거
CREATE TRIGGER trigger_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- shop_items 테이블 업데이트 트리거
CREATE TRIGGER trigger_shop_items_updated_at
    BEFORE UPDATE ON shop_items
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- visits 테이블 업데이트 트리거
CREATE TRIGGER trigger_visits_updated_at
    BEFORE UPDATE ON visits
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 🎭 기본 데이터 추가 (배민커넥터만)
-- ============================================================================

-- 배민커넥터 기본 캐릭터 추가 (모든 사용자에게 자동 지급)
INSERT INTO shop_items (
    name, 
    description, 
    category, 
    sub_category, 
    image_url, 
    price, 
    pixel_data,
    is_active
) VALUES (
    '배민커넥터', 
    '모든 사용자에게 기본으로 제공되는 캐릭터입니다',
    '캐릭터',
    '캐릭터',
    '/Garage/Character/배민/S_1.png',
    0,
    '{"sprite_path": "/Garage/Character/배민/", "preview_image": "/Garage/Character/배민/S_1.png"}',
    true
);

-- 생성된 배민커넥터의 ID를 변수로 저장
DO $$
DECLARE
    baemin_character_id UUID;
BEGIN
    -- 방금 생성된 배민커넥터 ID 가져오기
    SELECT id INTO baemin_character_id 
    FROM shop_items 
    WHERE name = '배민커넥터' AND category = '캐릭터' AND sub_category = '캐릭터';
    
    -- 향후 사용자 생성 시 자동으로 배민커넥터를 지급하고 장착하는 함수
    CREATE OR REPLACE FUNCTION setup_new_user()
    RETURNS TRIGGER AS $trigger$
    DECLARE
        baemin_id UUID;
    BEGIN
        -- 배민커넥터 ID 조회
        SELECT id INTO baemin_id 
        FROM shop_items 
        WHERE name = '배민커넥터' AND category = '캐릭터' AND sub_category = '캐릭터'
        LIMIT 1;
        
        -- 배민커넥터 자동 지급
        INSERT INTO user_items (user_id, item_id, quantity)
        VALUES (NEW.id, baemin_id, 1);
        
        -- 배민커넥터 자동 장착
        UPDATE users 
        SET equipped_character_id = baemin_id,
            equipped_emotion_id = NULL
        WHERE id = NEW.id;
        
        RETURN NEW;
    END;
    $trigger$ LANGUAGE plpgsql;
    
    -- 사용자 생성 시 자동으로 배민커넥터 지급하는 트리거
    CREATE TRIGGER trigger_setup_new_user
        AFTER INSERT ON users
        FOR EACH ROW
        EXECUTE FUNCTION setup_new_user();
    
    RAISE NOTICE '🎭 배민커넥터 기본 캐릭터 생성 및 자동 지급 시스템 설정 완료!';
END $$;

-- ============================================================================
-- RLS (Row Level Security) 해제 - 테스트용
-- ============================================================================

ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE earnings DISABLE ROW LEVEL SECURITY; 
ALTER TABLE box_transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE shop_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE garage_placements DISABLE ROW LEVEL SECURITY;
ALTER TABLE friendships DISABLE ROW LEVEL SECURITY;
ALTER TABLE guestbook_entries DISABLE ROW LEVEL SECURITY;
ALTER TABLE visits DISABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 완료 메시지
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🎉 ===== 배달킹 통합 데이터베이스 구축 완료! =====';
    RAISE NOTICE '';
    RAISE NOTICE '📊 생성된 테이블: 9개';
    RAISE NOTICE '   - users (사용자 정보 + 캐릭터 장착)';
    RAISE NOTICE '   - earnings (수입 기록)';
    RAISE NOTICE '   - box_transactions (박스 거래)';
    RAISE NOTICE '   - shop_items (상점 아이템 - 새 카테고리)';
    RAISE NOTICE '   - user_items (사용자 소유 아이템)';
    RAISE NOTICE '   - garage_placements (차고 배치)';
    RAISE NOTICE '   - friendships (친구 관계)';
    RAISE NOTICE '   - guestbook_entries (방명록)';
    RAISE NOTICE '   - visits (방문 기록)';
    RAISE NOTICE '';
    RAISE NOTICE '🎭 기본 캐릭터: 배민커넥터 추가됨';
    RAISE NOTICE '📂 카테고리 구조:';
    RAISE NOTICE '   캐릭터 → 캐릭터, 감정표현';
    RAISE NOTICE '   인테리어 → 가구, 장식품, 운송수단';
    RAISE NOTICE '';
    RAISE NOTICE '🔧 유틸리티: 3개 함수 생성';
    RAISE NOTICE '🔒 RLS: 테스트를 위해 완전히 해제됨!';
    RAISE NOTICE '🧹 구조: 복잡함 제거, 깔끔하게 단순화';
    RAISE NOTICE '';
    RAISE NOTICE '✅ 준비 완료! 이제 아이템을 등록하고 사용하세요!';
    RAISE NOTICE '';
END $$;
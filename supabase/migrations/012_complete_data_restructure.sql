-- 🎯 배달킹 완전 데이터 구조 재설계
-- 작성일: 2024년 현재
-- 설명: 모든 데이터를 Supabase로 통일하고 로컬스토리지 완전 제거

-- ============================================================================
-- 1. 기존 테이블 정리 (모든 데이터 초기화)
-- ============================================================================

-- 기존 테이블들 삭제 (데이터 초기화)
DROP TABLE IF EXISTS user_garage_decorations CASCADE;
DROP TABLE IF EXISTS user_decoration_inventory CASCADE;
DROP TABLE IF EXISTS decoration_items CASCADE;
DROP TABLE IF EXISTS user_floor_tile_settings CASCADE;
DROP TABLE IF EXISTS guestbook CASCADE;
DROP TABLE IF EXISTS visits CASCADE;
DROP TABLE IF EXISTS friends CASCADE;
DROP TABLE IF EXISTS user_items CASCADE;
DROP TABLE IF EXISTS items CASCADE;
DROP TABLE IF EXISTS boxes CASCADE;
DROP TABLE IF EXISTS earnings CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- 기존 함수들 삭제
DROP FUNCTION IF EXISTS place_decoration_item CASCADE;
DROP FUNCTION IF EXISTS purchase_decoration_item CASCADE;
DROP FUNCTION IF EXISTS remove_decoration_item CASCADE;
DROP FUNCTION IF EXISTS get_user_inventory CASCADE;
DROP FUNCTION IF EXISTS get_user_garage CASCADE;
DROP FUNCTION IF EXISTS is_admin CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column CASCADE;

-- 기존 뷰들 삭제
DROP VIEW IF EXISTS user_decoration_inventory_detailed CASCADE;
DROP VIEW IF EXISTS user_garage_decorations_detailed CASCADE;

-- ============================================================================
-- 2. 새로운 핵심 테이블 생성
-- ============================================================================

-- 사용자 테이블 (기본 정보)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    kakao_id TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    nickname TEXT NOT NULL,
    region TEXT NOT NULL DEFAULT '서울',
    
    -- 아바타 설정 (JSONB)
    avatar_config JSONB DEFAULT '{
        "emotion": "happy",
        "background": "background.png",
        "character": "character-base.png"
    }'::jsonb,
    
    -- 차고 설정 (JSONB)
    garage_config JSONB DEFAULT '{
        "vehicle": "scooter",
        "background": "background.png",
        "intro": "열심히 달리는 배달킹입니다! 🛵💨"
    }'::jsonb,
    
    -- 플랫폼 설정 (JSONB)
    platforms JSONB DEFAULT '[
        {"id": "baemin", "name": "배민", "icon": "/baemin-logo.svg", "color": "#00C851", "isActive": true, "type": "default"},
        {"id": "coupang", "name": "쿠팡", "icon": "/coupang-logo.svg", "color": "#E4002B", "isActive": true, "type": "default"}
    ]'::jsonb,
    
    -- 목표 설정 (JSONB)
    goals JSONB DEFAULT '{
        "daily": 50000,
        "weekly": 350000,
        "monthly": 1500000
    }'::jsonb,
    
    -- 상태 메시지
    status_message TEXT DEFAULT '',
    
    -- 수입 공개 설정
    is_income_private BOOLEAN DEFAULT false,
    
    -- 방문자 통계
    total_visitors INTEGER DEFAULT 0,
    daily_visitors INTEGER DEFAULT 0,
    
    -- 메타데이터
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 수입 기록 테이블
CREATE TABLE earnings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    platform TEXT NOT NULL DEFAULT 'baemin',
    delivery_count INTEGER NOT NULL DEFAULT 0,
    delivery_amount INTEGER NOT NULL DEFAULT 0,
    mission_amount INTEGER NOT NULL DEFAULT 0,
    total_amount INTEGER GENERATED ALWAYS AS (delivery_amount + mission_amount) STORED,
    date DATE NOT NULL,
    screenshot_url TEXT DEFAULT '',
    screenshot_text TEXT DEFAULT '',
    verified BOOLEAN DEFAULT true,
    verified_score DECIMAL(5,2) DEFAULT 95.0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- 같은 날짜, 같은 플랫폼 중복 방지
    UNIQUE(user_id, platform, date)
);

-- 박스 거래 테이블 (수입/사용 내역)
CREATE TABLE box_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL,
    type TEXT CHECK (type IN ('earn', 'spend')) NOT NULL,
    reason TEXT DEFAULT '',
    related_earning_id UUID REFERENCES earnings(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 꾸미기 아이템 테이블 (상점)
CREATE TABLE decoration_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    description TEXT DEFAULT '',
    image_url TEXT NOT NULL,
    category VARCHAR(50) DEFAULT '기타',
    price INTEGER DEFAULT 0,
    
    -- 3D 배치 정보
    anchor JSONB DEFAULT '{"x": 0, "y": 0}'::jsonb,
    grid_data JSONB DEFAULT '{"width": 1, "height": 1, "depth": 1}'::jsonb,
    
    -- 관리자 설정
    is_admin_only BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    
    -- 메타데이터
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES users(id)
);

-- 사용자 인벤토리 테이블
CREATE TABLE user_inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    item_id UUID NOT NULL REFERENCES decoration_items(id) ON DELETE CASCADE,
    quantity INTEGER DEFAULT 1 CHECK (quantity > 0),
    purchased_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- 사용자당 아이템별 하나의 레코드
    UNIQUE(user_id, item_id)
);

-- 차고 배치 테이블 (3D 위치 정보)
CREATE TABLE garage_placements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    item_id UUID NOT NULL REFERENCES decoration_items(id) ON DELETE CASCADE,
    
    -- 3D 그리드 위치
    position_x INTEGER NOT NULL DEFAULT 0,
    position_y INTEGER NOT NULL DEFAULT 0,
    position_z INTEGER NOT NULL DEFAULT 0,
    
    -- 메타데이터
    placed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 바닥 타일 설정 테이블
CREATE TABLE floor_tile_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tile_type VARCHAR(50) DEFAULT 'default',
    pattern VARCHAR(50) DEFAULT 'checkerboard',
    light_color INTEGER DEFAULT 13882323, -- 0xD2B48C
    dark_color INTEGER DEFAULT 10511667,  -- 0xA0522D
    opacity DECIMAL(3,2) DEFAULT 0.8,
    scale DECIMAL(3,2) DEFAULT 1.0,
    custom_image_url TEXT DEFAULT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- 사용자당 하나의 설정
    UNIQUE(user_id)
);

-- 친구 관계 테이블
CREATE TABLE friendships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    friend_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status TEXT CHECK (status IN ('pending', 'accepted', 'rejected')) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- 중복 친구 관계 방지
    UNIQUE(user_id, friend_id),
    -- 자기 자신과 친구 관계 방지
    CHECK (user_id != friend_id)
);

-- 방명록 테이블
CREATE TABLE guestbook_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    visitor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    message TEXT NOT NULL CHECK (LENGTH(message) <= 200),
    is_private BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- 자기 자신에게 방명록 작성 방지
    CHECK (user_id != visitor_id)
);

-- 방문 기록 테이블
CREATE TABLE visits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    visitor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    visited_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- 자기 자신 방문 방지
    CHECK (visitor_id != visited_user_id)
);

-- ============================================================================
-- 3. 인덱스 생성 (성능 최적화)
-- ============================================================================

-- 사용자 테이블 인덱스
CREATE INDEX idx_users_kakao_id ON users(kakao_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_nickname ON users(nickname);

-- 수입 기록 테이블 인덱스
CREATE INDEX idx_earnings_user_id ON earnings(user_id);
CREATE INDEX idx_earnings_date ON earnings(date);
CREATE INDEX idx_earnings_platform ON earnings(platform);
CREATE INDEX idx_earnings_user_date ON earnings(user_id, date);

-- 박스 거래 테이블 인덱스
CREATE INDEX idx_box_transactions_user_id ON box_transactions(user_id);
CREATE INDEX idx_box_transactions_type ON box_transactions(type);
CREATE INDEX idx_box_transactions_created_at ON box_transactions(created_at);

-- 꾸미기 아이템 테이블 인덱스
CREATE INDEX idx_decoration_items_category ON decoration_items(category);
CREATE INDEX idx_decoration_items_active ON decoration_items(is_active);
CREATE INDEX idx_decoration_items_price ON decoration_items(price);

-- 사용자 인벤토리 테이블 인덱스
CREATE INDEX idx_user_inventory_user_id ON user_inventory(user_id);
CREATE INDEX idx_user_inventory_item_id ON user_inventory(item_id);

-- 차고 배치 테이블 인덱스
CREATE INDEX idx_garage_placements_user_id ON garage_placements(user_id);
CREATE INDEX idx_garage_placements_item_id ON garage_placements(item_id);
CREATE INDEX idx_garage_placements_position ON garage_placements(position_x, position_y, position_z);

-- 친구 관계 테이블 인덱스
CREATE INDEX idx_friendships_user_id ON friendships(user_id);
CREATE INDEX idx_friendships_friend_id ON friendships(friend_id);
CREATE INDEX idx_friendships_status ON friendships(status);

-- 방명록 테이블 인덱스
CREATE INDEX idx_guestbook_user_id ON guestbook_entries(user_id);
CREATE INDEX idx_guestbook_visitor_id ON guestbook_entries(visitor_id);
CREATE INDEX idx_guestbook_created_at ON guestbook_entries(created_at);

-- 방문 기록 테이블 인덱스
CREATE INDEX idx_visits_visitor_id ON visits(visitor_id);
CREATE INDEX idx_visits_visited_user_id ON visits(visited_user_id);
CREATE INDEX idx_visits_created_at ON visits(created_at);

-- ============================================================================
-- 4. 트리거 함수 및 트리거 생성
-- ============================================================================

-- updated_at 자동 업데이트 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 트리거 적용
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_decoration_items_updated_at 
    BEFORE UPDATE ON decoration_items 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_garage_placements_updated_at 
    BEFORE UPDATE ON garage_placements 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_floor_tile_settings_updated_at 
    BEFORE UPDATE ON floor_tile_settings 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 5. 저장 프로시저 및 함수 생성
-- ============================================================================

-- 수입 기록 저장 및 박스 지급 함수
CREATE OR REPLACE FUNCTION save_earning_with_boxes(
    p_user_id UUID,
    p_platform TEXT,
    p_delivery_count INTEGER,
    p_delivery_amount INTEGER,
    p_mission_amount INTEGER,
    p_date DATE
)
RETURNS JSON AS $$
DECLARE
    v_earning_id UUID;
    v_total_amount INTEGER;
    v_boxes_earned INTEGER;
    v_result JSON;
BEGIN
    -- 총 금액 계산
    v_total_amount := p_delivery_amount + p_mission_amount;
    
    -- 박스 계산 (1000원당 1박스)
    v_boxes_earned := FLOOR(v_total_amount / 1000);
    
    -- 수입 기록 저장 또는 업데이트
    INSERT INTO earnings (
        user_id, platform, delivery_count, 
        delivery_amount, mission_amount, date
    )
    VALUES (
        p_user_id, p_platform, p_delivery_count,
        p_delivery_amount, p_mission_amount, p_date
    )
    ON CONFLICT (user_id, platform, date) 
    DO UPDATE SET
        delivery_count = EXCLUDED.delivery_count,
        delivery_amount = EXCLUDED.delivery_amount,
        mission_amount = EXCLUDED.mission_amount
    RETURNING id INTO v_earning_id;
    
    -- 박스 거래 기록
    IF v_boxes_earned > 0 THEN
        INSERT INTO box_transactions (
            user_id, amount, type, reason, related_earning_id
        )
        VALUES (
            p_user_id, v_boxes_earned, 'earn', 
            '수입 기록 등록', v_earning_id
        );
    END IF;
    
    -- 결과 반환
    v_result := json_build_object(
        'earning_id', v_earning_id,
        'total_amount', v_total_amount,
        'boxes_earned', v_boxes_earned,
        'success', true
    );
    
    RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- 아이템 구매 함수
CREATE OR REPLACE FUNCTION purchase_item(
    p_user_id UUID,
    p_item_id UUID,
    p_quantity INTEGER DEFAULT 1
)
RETURNS JSON AS $$
DECLARE
    v_item_price INTEGER;
    v_total_cost INTEGER;
    v_user_boxes INTEGER;
    v_result JSON;
BEGIN
    -- 아이템 가격 조회
    SELECT price INTO v_item_price
    FROM decoration_items
    WHERE id = p_item_id AND is_active = true;
    
    IF v_item_price IS NULL THEN
        RETURN json_build_object('success', false, 'error', '아이템을 찾을 수 없습니다.');
    END IF;
    
    -- 총 비용 계산
    v_total_cost := v_item_price * p_quantity;
    
    -- 사용자 박스 잔액 계산
    SELECT COALESCE(SUM(
        CASE WHEN type = 'earn' THEN amount ELSE -amount END
    ), 0) INTO v_user_boxes
    FROM box_transactions
    WHERE user_id = p_user_id;
    
    -- 박스 부족 확인
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
    VALUES (p_user_id, v_total_cost, 'spend', '아이템 구매');
    
    -- 인벤토리에 아이템 추가
    INSERT INTO user_inventory (user_id, item_id, quantity)
    VALUES (p_user_id, p_item_id, p_quantity)
    ON CONFLICT (user_id, item_id)
    DO UPDATE SET 
        quantity = user_inventory.quantity + p_quantity,
        purchased_at = NOW();
    
    -- 결과 반환
    v_result := json_build_object(
        'success', true,
        'item_price', v_item_price,
        'quantity', p_quantity,
        'total_cost', v_total_cost,
        'remaining_boxes', v_user_boxes - v_total_cost
    );
    
    RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- 아이템 배치 함수
CREATE OR REPLACE FUNCTION place_item(
    p_user_id UUID,
    p_item_id UUID,
    p_position_x INTEGER,
    p_position_y INTEGER,
    p_position_z INTEGER
)
RETURNS JSON AS $$
DECLARE
    v_inventory_quantity INTEGER;
    v_result JSON;
BEGIN
    -- 인벤토리에서 아이템 수량 확인
    SELECT quantity INTO v_inventory_quantity
    FROM user_inventory
    WHERE user_id = p_user_id AND item_id = p_item_id;
    
    -- 인벤토리에 아이템이 없거나 수량이 부족한 경우
    IF v_inventory_quantity IS NULL OR v_inventory_quantity < 1 THEN
        RETURN json_build_object(
            'success', false,
            'error', '인벤토리에 아이템이 없습니다.'
        );
    END IF;
    
    -- 인벤토리에서 아이템 1개 사용
    UPDATE user_inventory
    SET quantity = quantity - 1
    WHERE user_id = p_user_id AND item_id = p_item_id;
    
    -- 수량이 0이 된 경우 인벤토리에서 제거
    DELETE FROM user_inventory
    WHERE user_id = p_user_id AND item_id = p_item_id AND quantity = 0;
    
    -- 차고에 아이템 배치
    INSERT INTO garage_placements (
        user_id, item_id, position_x, position_y, position_z
    )
    VALUES (
        p_user_id, p_item_id, p_position_x, p_position_y, p_position_z
    );
    
    -- 결과 반환
    v_result := json_build_object(
        'success', true,
        'message', '아이템이 배치되었습니다.'
    );
    
    RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- 아이템 제거 함수
CREATE OR REPLACE FUNCTION remove_item(
    p_user_id UUID,
    p_placement_id UUID
)
RETURNS JSON AS $$
DECLARE
    v_item_id UUID;
    v_result JSON;
BEGIN
    -- 배치된 아이템의 item_id 가져오기
    SELECT item_id INTO v_item_id
    FROM garage_placements
    WHERE id = p_placement_id AND user_id = p_user_id;
    
    IF v_item_id IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'error', '배치된 아이템을 찾을 수 없습니다.'
        );
    END IF;
    
    -- 차고에서 아이템 제거
    DELETE FROM garage_placements
    WHERE id = p_placement_id AND user_id = p_user_id;
    
    -- 인벤토리에 아이템 반환
    INSERT INTO user_inventory (user_id, item_id, quantity)
    VALUES (p_user_id, v_item_id, 1)
    ON CONFLICT (user_id, item_id)
    DO UPDATE SET 
        quantity = user_inventory.quantity + 1,
        purchased_at = NOW();
    
    -- 결과 반환
    v_result := json_build_object(
        'success', true,
        'message', '아이템이 제거되었습니다.'
    );
    
    RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- 사용자 박스 잔액 조회 함수
CREATE OR REPLACE FUNCTION get_user_boxes(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
    v_total_boxes INTEGER;
BEGIN
    SELECT COALESCE(SUM(
        CASE WHEN type = 'earn' THEN amount ELSE -amount END
    ), 0) INTO v_total_boxes
    FROM box_transactions
    WHERE user_id = p_user_id;
    
    RETURN GREATEST(0, v_total_boxes);
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 6. 뷰 생성 (조회 편의성)
-- ============================================================================

-- 사용자 인벤토리 상세 뷰
CREATE VIEW user_inventory_detailed AS
SELECT 
    inv.id,
    inv.user_id,
    inv.item_id,
    inv.quantity,
    inv.purchased_at,
    item.name as item_name,
    item.description as item_description,
    item.image_url as item_image_url,
    item.category as item_category,
    item.price as item_price,
    item.anchor as item_anchor,
    item.grid_data as item_grid_data
FROM user_inventory inv
JOIN decoration_items item ON inv.item_id = item.id
WHERE item.is_active = true;

-- 차고 배치 상세 뷰
CREATE VIEW garage_placements_detailed AS
SELECT 
    gp.id,
    gp.user_id,
    gp.item_id,
    gp.position_x,
    gp.position_y,
    gp.position_z,
    gp.placed_at,
    gp.updated_at,
    item.name as item_name,
    item.description as item_description,
    item.image_url as item_image_url,
    item.category as item_category,
    item.anchor as item_anchor,
    item.grid_data as item_grid_data
FROM garage_placements gp
JOIN decoration_items item ON gp.item_id = item.id
WHERE item.is_active = true;

-- 사용자 수입 통계 뷰
CREATE VIEW user_earnings_summary AS
SELECT 
    user_id,
    COUNT(*) as total_earnings_count,
    SUM(total_amount) as total_earnings_amount,
    SUM(delivery_count) as total_delivery_count,
    AVG(total_amount) as avg_earnings_amount,
    MAX(date) as last_earning_date,
    MIN(date) as first_earning_date
FROM earnings
GROUP BY user_id;

-- ============================================================================
-- 7. RLS (Row Level Security) 정책 설정
-- ============================================================================

-- 모든 테이블에 RLS 활성화
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE earnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE box_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE decoration_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE garage_placements ENABLE ROW LEVEL SECURITY;
ALTER TABLE floor_tile_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;
ALTER TABLE guestbook_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE visits ENABLE ROW LEVEL SECURITY;

-- 사용자 테이블 정책
CREATE POLICY "Users can view all profiles" ON users FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON users FOR INSERT WITH CHECK (auth.uid() = id);

-- 수입 기록 정책
CREATE POLICY "Users can view own earnings" ON earnings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own earnings" ON earnings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own earnings" ON earnings FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own earnings" ON earnings FOR DELETE USING (auth.uid() = user_id);

-- 박스 거래 정책
CREATE POLICY "Users can view own box transactions" ON box_transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own box transactions" ON box_transactions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 꾸미기 아이템 정책 (공개 읽기)
CREATE POLICY "Anyone can view active decoration items" ON decoration_items FOR SELECT USING (is_active = true);

-- 사용자 인벤토리 정책
CREATE POLICY "Users can view own inventory" ON user_inventory FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own inventory" ON user_inventory FOR ALL USING (auth.uid() = user_id);

-- 차고 배치 정책
CREATE POLICY "Anyone can view garage placements" ON garage_placements FOR SELECT USING (true);
CREATE POLICY "Users can manage own garage placements" ON garage_placements FOR ALL USING (auth.uid() = user_id);

-- 바닥 타일 설정 정책
CREATE POLICY "Users can manage own floor settings" ON floor_tile_settings FOR ALL USING (auth.uid() = user_id);

-- 친구 관계 정책
CREATE POLICY "Users can view own friendships" ON friendships FOR SELECT USING (auth.uid() = user_id OR auth.uid() = friend_id);
CREATE POLICY "Users can manage own friendships" ON friendships FOR ALL USING (auth.uid() = user_id);

-- 방명록 정책
CREATE POLICY "Anyone can view public guestbook entries" ON guestbook_entries FOR SELECT USING (NOT is_private OR auth.uid() = user_id OR auth.uid() = visitor_id);
CREATE POLICY "Users can insert guestbook entries" ON guestbook_entries FOR INSERT WITH CHECK (auth.uid() = visitor_id);
CREATE POLICY "Users can update own guestbook entries" ON guestbook_entries FOR UPDATE USING (auth.uid() = visitor_id);
CREATE POLICY "Users can delete own guestbook entries" ON guestbook_entries FOR DELETE USING (auth.uid() = visitor_id);

-- 방문 기록 정책
CREATE POLICY "Users can view own visits" ON visits FOR SELECT USING (auth.uid() = visitor_id OR auth.uid() = visited_user_id);
CREATE POLICY "Users can insert visits" ON visits FOR INSERT WITH CHECK (auth.uid() = visitor_id);

-- ============================================================================
-- 8. 기본 데이터 삽입
-- ============================================================================

-- 기본 꾸미기 아이템들
INSERT INTO decoration_items (name, description, image_url, category, price, anchor, grid_data) VALUES
-- 가구류
('게이밍 의자', '편안한 게이밍 의자입니다. 오래 앉아도 편안해요!', '/assets/decoration/chair_gaming.png', '가구', 150, '{"x": 0, "y": 0}', '{"width": 2, "height": 2, "depth": 1}'),
('오피스 의자', '업무용 오피스 의자입니다. 깔끔하고 실용적이에요.', '/assets/decoration/chair_office.png', '가구', 120, '{"x": 0, "y": 0}', '{"width": 2, "height": 2, "depth": 1}'),
('게이밍 데스크', '게이밍에 최적화된 데스크입니다. 넓고 안정적이에요!', '/assets/decoration/desk_gaming.png', '가구', 200, '{"x": 0, "y": 0}', '{"width": 3, "height": 2, "depth": 1}'),
('심플 데스크', '깔끔한 심플 데스크입니다. 어떤 공간에도 잘 어울려요.', '/assets/decoration/desk_simple.png', '가구', 180, '{"x": 0, "y": 0}', '{"width": 3, "height": 2, "depth": 1}'),

-- 전자제품
('미니 냉장고', '작지만 실용적인 미니 냉장고입니다. 음료와 간식을 보관하세요!', '/assets/decoration/fridge_mini.png', '전자제품', 250, '{"x": 0, "y": 0}', '{"width": 2, "height": 3, "depth": 2}'),

-- 인테리어
('녹색 식물', '공간을 생동감 있게 만들어주는 녹색 식물입니다. 공기 정화에도 좋아요!', '/assets/decoration/plant_green.png', '인테리어', 80, '{"x": 0, "y": 0}', '{"width": 1, "height": 2, "depth": 1}');

-- ============================================================================
-- 9. 마이그레이션 완료
-- ============================================================================

-- 마이그레이션 성공 로그
SELECT 'Complete data restructure migration completed successfully' as status;

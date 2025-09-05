# 🗄️ 배달킹 Supabase 데이터 구조 완전 정리

## 📋 목차
1. [테이블 구조 개요](#테이블-구조-개요)
2. [핵심 테이블 상세](#핵심-테이블-상세)
3. [데이터 관계도](#데이터-관계도)
4. [JSONB 필드 구조](#jsonb-필드-구조)
5. [인덱스 및 성능 최적화](#인덱스-및-성능-최적화)
6. [RLS 보안 정책](#rls-보안-정책)
7. [저장 프로시저](#저장-프로시저)
8. [뷰 및 조회 최적화](#뷰-및-조회-최적화)

---

## 🏗️ 테이블 구조 개요

### 📊 전체 테이블 목록 (총 10개)

| 순번 | 테이블명 | 설명 | 주요 용도 |
|------|----------|------|-----------|
| 1 | `users` | 사용자 기본 정보 | 회원가입, 프로필 관리 |
| 2 | `earnings` | 수입 기록 | 배달 수입 추적 |
| 3 | `box_transactions` | 박스 거래 내역 | 게임 화폐 시스템 |
| 4 | `decoration_items` | 꾸미기 아이템 | 상점 아이템 관리 |
| 5 | `user_inventory` | 사용자 인벤토리 | 구매한 아이템 보관 |
| 6 | `garage_placements` | 차고 배치 | 3D 아이템 배치 |
| 7 | `floor_tile_settings` | 바닥 타일 설정 | 차고 바닥 커스터마이징 |
| 8 | `character_data` | 캐릭터 데이터 | 아바타 커스터마이징 |
| 9 | `friendships` | 친구 관계 | 소셜 기능 |
| 10 | `guestbook_entries` | 방명록 | 미니홈피 방명록 |
| 11 | `visits` | 방문 기록 | 방문자 추적 |

---

## 🔍 핵심 테이블 상세

### 1️⃣ **users** - 사용자 기본 정보
```sql
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
```

### 2️⃣ **earnings** - 수입 기록
```sql
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
```

### 3️⃣ **box_transactions** - 박스 거래 내역
```sql
CREATE TABLE box_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL,
    type TEXT CHECK (type IN ('earn', 'spend')) NOT NULL,
    reason TEXT DEFAULT '',
    related_earning_id UUID REFERENCES earnings(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 4️⃣ **decoration_items** - 꾸미기 아이템 (상점)
```sql
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
```

### 5️⃣ **user_inventory** - 사용자 인벤토리
```sql
CREATE TABLE user_inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    item_id UUID NOT NULL REFERENCES decoration_items(id) ON DELETE CASCADE,
    quantity INTEGER DEFAULT 1 CHECK (quantity > 0),
    purchased_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- 사용자당 아이템별 하나의 레코드
    UNIQUE(user_id, item_id)
);
```

### 6️⃣ **garage_placements** - 차고 배치 (3D 위치 정보)
```sql
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
```

### 7️⃣ **floor_tile_settings** - 바닥 타일 설정
```sql
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
```

### 8️⃣ **character_data** - 캐릭터 시스템
```sql
CREATE TABLE character_data (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  parts JSONB NOT NULL DEFAULT '{
    "hair": "hair01.png",
    "top": "jacket01.png", 
    "bottom": "pants01.png",
    "emotion": "happy.png"
  }',
  position JSONB NOT NULL DEFAULT '{"x": 0, "y": 0}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);
```

### 9️⃣ **friendships** - 친구 관계
```sql
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
```

### 🔟 **guestbook_entries** - 방명록
```sql
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
```

### 1️⃣1️⃣ **visits** - 방문 기록
```sql
CREATE TABLE visits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    visitor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    visited_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- 자기 자신 방문 방지
    CHECK (visitor_id != visited_user_id)
);
```

---

## 🔗 데이터 관계도

```
👤 users (사용자)
├── 💰 earnings (수입 기록) - 1:N
├── 📦 box_transactions (박스 거래) - 1:N
├── 🎨 user_inventory (인벤토리) - 1:N
├── 🏠 garage_placements (차고 배치) - 1:N
├── 🎭 character_data (캐릭터) - 1:1
├── 🏗️ floor_tile_settings (바닥 타일) - 1:1
├── 👥 friendships (친구 관계) - 1:N
├── 📝 guestbook_entries (방명록) - 1:N
└── 🚶 visits (방문 기록) - 1:N

🛍️ decoration_items (상점 아이템)
├── 🎨 user_inventory (인벤토리) - 1:N
└── 🏠 garage_placements (차고 배치) - 1:N

💰 earnings (수입 기록)
└── 📦 box_transactions (박스 거래) - 1:N
```

---

## 📋 JSONB 필드 구조

### 🎭 **avatar_config** (사용자 아바타 설정)
```json
{
  "emotion": "happy",
  "background": "background.png",
  "character": "character-base.png"
}
```

### 🏠 **garage_config** (차고 설정)
```json
{
  "vehicle": "scooter",
  "background": "background.png",
  "intro": "열심히 달리는 배달킹입니다! 🛵💨"
}
```

### 🚀 **platforms** (플랫폼 설정)
```json
[
  {
    "id": "baemin",
    "name": "배민",
    "icon": "/baemin-logo.svg",
    "color": "#00C851",
    "isActive": true,
    "type": "default"
  },
  {
    "id": "coupang",
    "name": "쿠팡",
    "icon": "/coupang-logo.svg",
    "color": "#E4002B",
    "isActive": true,
    "type": "default"
  }
]
```

### 🎯 **goals** (목표 설정)
```json
{
  "daily": 50000,
  "weekly": 350000,
  "monthly": 1500000
}
```

### 🎨 **anchor** (아이템 앵커 포인트)
```json
{
  "x": 0,
  "y": 0
}
```

### 📐 **grid_data** (3D 그리드 데이터)
```json
{
  "width": 1,
  "height": 1,
  "depth": 1
}
```

### 👤 **character_parts** (캐릭터 부위)
```json
{
  "hair": "hair01.png",
  "top": "jacket01.png",
  "bottom": "pants01.png",
  "emotion": "happy.png"
}
```

### 📍 **character_position** (캐릭터 위치)
```json
{
  "x": 0,
  "y": 0
}
```

---

## ⚡ 인덱스 및 성능 최적화

### 📊 **사용자 테이블 인덱스**
```sql
CREATE INDEX idx_users_kakao_id ON users(kakao_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_nickname ON users(nickname);
```

### 💰 **수입 기록 테이블 인덱스**
```sql
CREATE INDEX idx_earnings_user_id ON earnings(user_id);
CREATE INDEX idx_earnings_date ON earnings(date);
CREATE INDEX idx_earnings_platform ON earnings(platform);
CREATE INDEX idx_earnings_user_date ON earnings(user_id, date);
```

### 📦 **박스 거래 테이블 인덱스**
```sql
CREATE INDEX idx_box_transactions_user_id ON box_transactions(user_id);
CREATE INDEX idx_box_transactions_type ON box_transactions(type);
CREATE INDEX idx_box_transactions_created_at ON box_transactions(created_at);
```

### 🎨 **꾸미기 아이템 테이블 인덱스**
```sql
CREATE INDEX idx_decoration_items_category ON decoration_items(category);
CREATE INDEX idx_decoration_items_active ON decoration_items(is_active);
CREATE INDEX idx_decoration_items_price ON decoration_items(price);
```

### 🎒 **사용자 인벤토리 테이블 인덱스**
```sql
CREATE INDEX idx_user_inventory_user_id ON user_inventory(user_id);
CREATE INDEX idx_user_inventory_item_id ON user_inventory(item_id);
```

### 🏠 **차고 배치 테이블 인덱스**
```sql
CREATE INDEX idx_garage_placements_user_id ON garage_placements(user_id);
CREATE INDEX idx_garage_placements_item_id ON garage_placements(item_id);
CREATE INDEX idx_garage_placements_position ON garage_placements(position_x, position_y, position_z);
```

### 👥 **친구 관계 테이블 인덱스**
```sql
CREATE INDEX idx_friendships_user_id ON friendships(user_id);
CREATE INDEX idx_friendships_friend_id ON friendships(friend_id);
CREATE INDEX idx_friendships_status ON friendships(status);
```

### 📝 **방명록 테이블 인덱스**
```sql
CREATE INDEX idx_guestbook_user_id ON guestbook_entries(user_id);
CREATE INDEX idx_guestbook_visitor_id ON guestbook_entries(visitor_id);
CREATE INDEX idx_guestbook_created_at ON guestbook_entries(created_at);
```

### 🚶 **방문 기록 테이블 인덱스**
```sql
CREATE INDEX idx_visits_visitor_id ON visits(visitor_id);
CREATE INDEX idx_visits_visited_user_id ON visits(visited_user_id);
CREATE INDEX idx_visits_created_at ON visits(created_at);
```

---

## 🔒 RLS 보안 정책

### 👤 **사용자 테이블 정책**
```sql
CREATE POLICY "Users can view all profiles" ON users FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON users FOR INSERT WITH CHECK (auth.uid() = id);
```

### 💰 **수입 기록 정책**
```sql
CREATE POLICY "Users can view own earnings" ON earnings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own earnings" ON earnings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own earnings" ON earnings FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own earnings" ON earnings FOR DELETE USING (auth.uid() = user_id);
```

### 📦 **박스 거래 정책**
```sql
CREATE POLICY "Users can view own box transactions" ON box_transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own box transactions" ON box_transactions FOR INSERT WITH CHECK (auth.uid() = user_id);
```

### 🎨 **꾸미기 아이템 정책**
```sql
CREATE POLICY "Anyone can view active decoration items" ON decoration_items FOR SELECT USING (is_active = true);
```

### 🎒 **사용자 인벤토리 정책**
```sql
CREATE POLICY "Users can view own inventory" ON user_inventory FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own inventory" ON user_inventory FOR ALL USING (auth.uid() = user_id);
```

### 🏠 **차고 배치 정책**
```sql
CREATE POLICY "Anyone can view garage placements" ON garage_placements FOR SELECT USING (true);
CREATE POLICY "Users can manage own garage placements" ON garage_placements FOR ALL USING (auth.uid() = user_id);
```

### 🏗️ **바닥 타일 설정 정책**
```sql
CREATE POLICY "Users can manage own floor settings" ON floor_tile_settings FOR ALL USING (auth.uid() = user_id);
```

### 👥 **친구 관계 정책**
```sql
CREATE POLICY "Users can view own friendships" ON friendships FOR SELECT USING (auth.uid() = user_id OR auth.uid() = friend_id);
CREATE POLICY "Users can manage own friendships" ON friendships FOR ALL USING (auth.uid() = user_id);
```

### 📝 **방명록 정책**
```sql
CREATE POLICY "Anyone can view public guestbook entries" ON guestbook_entries FOR SELECT USING (NOT is_private OR auth.uid() = user_id OR auth.uid() = visitor_id);
CREATE POLICY "Users can insert guestbook entries" ON guestbook_entries FOR INSERT WITH CHECK (auth.uid() = visitor_id);
CREATE POLICY "Users can update own guestbook entries" ON guestbook_entries FOR UPDATE USING (auth.uid() = visitor_id);
CREATE POLICY "Users can delete own guestbook entries" ON guestbook_entries FOR DELETE USING (auth.uid() = visitor_id);
```

### 🚶 **방문 기록 정책**
```sql
CREATE POLICY "Users can view own visits" ON visits FOR SELECT USING (auth.uid() = visitor_id OR auth.uid() = visited_user_id);
CREATE POLICY "Users can insert visits" ON visits FOR INSERT WITH CHECK (auth.uid() = visitor_id);
```

---

## 🔧 저장 프로시저

### 💰 **수입 기록 저장 및 박스 지급 함수**
```sql
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
```

### 🛒 **아이템 구매 함수**
```sql
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
```

### 🏠 **아이템 배치 함수**
```sql
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
```

### 🗑️ **아이템 제거 함수**
```sql
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
```

### 📦 **사용자 박스 잔액 조회 함수**
```sql
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
```

---

## 📊 뷰 및 조회 최적화

### 🎒 **사용자 인벤토리 상세 뷰**
```sql
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
```

### 🏠 **차고 배치 상세 뷰**
```sql
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
```

### 💰 **사용자 수입 통계 뷰**
```sql
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
```

---

## 🎯 주요 기능별 데이터 흐름

### 💰 **수입 관리 시스템**
1. 사용자가 수입 입력 → `earnings` 테이블에 저장
2. 자동으로 박스 계산 (1000원당 1박스) → `box_transactions` 테이블에 기록
3. 플랫폼별, 날짜별 수입 추적
4. 목표 달성률 계산 및 랭킹 시스템

### 🎮 **게임 시스템**
1. 박스 획득/사용 → `box_transactions` 테이블
2. 아이템 구매 → `user_inventory` 테이블
3. 아이템 배치 → `garage_placements` 테이블 (3D 좌표)
4. 캐릭터 커스터마이징 → `character_data` 테이블

### 🏠 **미니홈피 시스템**
1. 차고 꾸미기 → `garage_placements` + `decoration_items`
2. 바닥 타일 설정 → `floor_tile_settings` 테이블
3. 방문자 추적 → `visits` 테이블
4. 방명록 → `guestbook_entries` 테이블

### 👥 **소셜 기능**
1. 친구 추가 → `friendships` 테이블
2. 친구 요청/수락/거절 상태 관리
3. 방명록 작성/조회 (공개/비공개)
4. 방문자 통계 및 프로필 공개 설정

---

## 📈 데이터 통계 및 모니터링

### 🔍 **주요 쿼리 패턴**
- 사용자별 수입 조회: `earnings` 테이블 + 날짜 필터링
- 랭킹 계산: `earnings` 테이블 + `users` 테이블 JOIN
- 인벤토리 조회: `user_inventory` + `decoration_items` JOIN
- 차고 배치 조회: `garage_placements` + `decoration_items` JOIN
- 친구 관계 조회: `friendships` + `users` JOIN

### 📊 **성능 최적화 포인트**
- JSONB 필드 활용으로 복잡한 설정 데이터 효율적 저장
- 인덱스 최적화로 자주 조회되는 데이터 빠른 접근
- RLS 정책으로 사용자별 데이터 보안 강화
- 뷰 생성으로 복잡한 JOIN 쿼리 단순화
- 트리거 함수로 자동 업데이트 시간 관리

---

## 🎉 결론

배달킹 웹사이트는 **11개의 핵심 테이블**로 구성된 체계적인 데이터 구조를 가지고 있습니다:

- **사용자 관리**: 기본 정보, 프로필, 설정
- **수입 시스템**: 배달 수입 추적, 플랫폼별 분류
- **게임 시스템**: 박스 화폐, 아이템 구매/배치
- **커스터마이징**: 캐릭터, 차고, 바닥 타일
- **소셜 기능**: 친구, 방명록, 방문자 추적

모든 데이터는 **Supabase**에서 안전하고 효율적으로 관리되며, **JSONB**, **RLS**, **인덱스** 등을 활용해 최적의 성능을 제공합니다! 🚀

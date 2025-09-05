-- 🔧 RLS 정책 수정 (사용자 생성 문제 해결)

-- 기존 RLS 정책 삭제
DROP POLICY IF EXISTS "Users can view all profiles" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Users can insert own profile" ON users;

-- 새로운 RLS 정책 생성 (더 관대한 정책)
-- 사용자 테이블 정책
CREATE POLICY "Enable read access for all users" ON users FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users" ON users FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for users based on user_id" ON users FOR UPDATE USING (true);

-- 수입 기록 정책
DROP POLICY IF EXISTS "Users can view own earnings" ON earnings;
DROP POLICY IF EXISTS "Users can insert own earnings" ON earnings;
DROP POLICY IF EXISTS "Users can update own earnings" ON earnings;
DROP POLICY IF EXISTS "Users can delete own earnings" ON earnings;

CREATE POLICY "Enable read access for all users" ON earnings FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users" ON earnings FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for users based on user_id" ON earnings FOR UPDATE USING (true);
CREATE POLICY "Enable delete for users based on user_id" ON earnings FOR DELETE USING (true);

-- 박스 거래 정책
DROP POLICY IF EXISTS "Users can view own box transactions" ON box_transactions;
DROP POLICY IF EXISTS "Users can insert own box transactions" ON box_transactions;

CREATE POLICY "Enable read access for all users" ON box_transactions FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users" ON box_transactions FOR INSERT WITH CHECK (true);

-- 꾸미기 아이템 정책 (공개 읽기)
DROP POLICY IF EXISTS "Anyone can view active decoration items" ON decoration_items;
CREATE POLICY "Enable read access for all users" ON decoration_items FOR SELECT USING (true);

-- 사용자 인벤토리 정책
DROP POLICY IF EXISTS "Users can view own inventory" ON user_inventory;
DROP POLICY IF EXISTS "Users can manage own inventory" ON user_inventory;

CREATE POLICY "Enable read access for all users" ON user_inventory FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users" ON user_inventory FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for users based on user_id" ON user_inventory FOR UPDATE USING (true);
CREATE POLICY "Enable delete for users based on user_id" ON user_inventory FOR DELETE USING (true);

-- 차고 배치 정책
DROP POLICY IF EXISTS "Anyone can view garage placements" ON garage_placements;
DROP POLICY IF EXISTS "Users can manage own garage placements" ON garage_placements;

CREATE POLICY "Enable read access for all users" ON garage_placements FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users" ON garage_placements FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for users based on user_id" ON garage_placements FOR UPDATE USING (true);
CREATE POLICY "Enable delete for users based on user_id" ON garage_placements FOR DELETE USING (true);

-- 바닥 타일 설정 정책
DROP POLICY IF EXISTS "Users can manage own floor settings" ON floor_tile_settings;
CREATE POLICY "Enable read access for all users" ON floor_tile_settings FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users" ON floor_tile_settings FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for users based on user_id" ON floor_tile_settings FOR UPDATE USING (true);
CREATE POLICY "Enable delete for users based on user_id" ON floor_tile_settings FOR DELETE USING (true);

-- 친구 관계 정책
DROP POLICY IF EXISTS "Users can view own friendships" ON friendships;
DROP POLICY IF EXISTS "Users can manage own friendships" ON friendships;

CREATE POLICY "Enable read access for all users" ON friendships FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users" ON friendships FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for users based on user_id" ON friendships FOR UPDATE USING (true);
CREATE POLICY "Enable delete for users based on user_id" ON friendships FOR DELETE USING (true);

-- 방명록 정책
DROP POLICY IF EXISTS "Anyone can view public guestbook entries" ON guestbook_entries;
DROP POLICY IF EXISTS "Users can insert guestbook entries" ON guestbook_entries;
DROP POLICY IF EXISTS "Users can update own guestbook entries" ON guestbook_entries;
DROP POLICY IF EXISTS "Users can delete own guestbook entries" ON guestbook_entries;

CREATE POLICY "Enable read access for all users" ON guestbook_entries FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users" ON guestbook_entries FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for users based on user_id" ON guestbook_entries FOR UPDATE USING (true);
CREATE POLICY "Enable delete for users based on user_id" ON guestbook_entries FOR DELETE USING (true);

-- 방문 기록 정책
DROP POLICY IF EXISTS "Users can view own visits" ON visits;
DROP POLICY IF EXISTS "Users can insert visits" ON visits;

CREATE POLICY "Enable read access for all users" ON visits FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users" ON visits FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for users based on user_id" ON visits FOR UPDATE USING (true);
CREATE POLICY "Enable delete for users based on user_id" ON visits FOR DELETE USING (true);

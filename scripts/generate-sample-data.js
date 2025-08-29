#!/usr/bin/env node

/**
 * 가상 데이터 생성 스크립트
 * 테스트용 사용자, 수입 기록, 친구 관계 등을 생성합니다.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🎭 Baedalking 가상 데이터 생성 시작...\n');

// 샘플 데이터 SQL 파일 생성
const sampleDataSQL = `
-- 가상 사용자 데이터 생성
INSERT INTO users (email, nickname, region, minihome_id, avatar_config, garage_config, created_at) VALUES
('user1@baedalking.com', '배달킹1호', '서울 강남구', 'user_king001', '{"emotion": "happy", "background": "background1.png"}', '{"vehicle": "scooter", "decor": "garage1"}', NOW() - INTERVAL '30 days'),
('user2@baedalking.com', '쿠팡마스터', '서울 서초구', 'user_coupang001', '{"emotion": "base", "background": "background2.png"}', '{"vehicle": "scooter", "decor": "garage2"}', NOW() - INTERVAL '25 days'),
('user3@baedalking.com', '배민여신', '서울 마포구', 'user_baemin001', '{"emotion": "happy", "background": "background3.png"}', '{"vehicle": "scooter", "decor": "garage3"}', NOW() - INTERVAL '20 days'),
('user4@baedalking.com', '배달전사', '서울 송파구', 'user_warrior001', '{"emotion": "tired", "background": "background4.png"}', '{"vehicle": "scooter", "decor": "garage4"}', NOW() - INTERVAL '15 days'),
('user5@baedalking.com', '수익왕', '서울 영등포구', 'user_income001', '{"emotion": "angry", "background": "background1.png"}', '{"vehicle": "scooter", "decor": "garage1"}', NOW() - INTERVAL '10 days'),
('user6@baedalking.com', '배달신동', '서울 강서구', 'user_prodigy001', '{"emotion": "base", "background": "background2.png"}', '{"vehicle": "scooter", "decor": "garage2"}', NOW() - INTERVAL '5 days'),
('user7@baedalking.com', '배달여신', '서울 성동구', 'user_goddess001', '{"emotion": "happy", "background": "background3.png"}', '{"vehicle": "scooter", "decor": "garage3"}', NOW() - INTERVAL '3 days'),
('user8@baedalking.com', '배달마스터', '서울 광진구', 'user_master001', '{"emotion": "base", "background": "background4.png"}', '{"vehicle": "scooter", "decor": "garage4"}', NOW() - INTERVAL '1 day'),
('user9@baedalking.com', '배달킹2호', '서울 중구', 'user_king002', '{"emotion": "happy", "background": "background1.png"}', '{"vehicle": "scooter", "decor": "garage1"}', NOW()),
('user10@baedalking.com', '배달여왕', '서울 용산구', 'user_queen001', '{"emotion": "base", "background": "background2.png"}', '{"vehicle": "scooter", "decor": "garage2"}', NOW());

-- 가상 수입 기록 생성 (배달킹1호)
INSERT INTO earnings (user_id, amount, date, screenshot_url, verified, points_awarded, screenshot_text, verified_score, platform, created_at) VALUES
((SELECT id FROM users WHERE nickname = '배달킹1호'), 45000, CURRENT_DATE - INTERVAL '1 day', '/fake/screenshot1.jpg', true, 450, '배민 배달 완료 45000원', 95.5, 'baemin', NOW() - INTERVAL '1 day'),
((SELECT id FROM users WHERE nickname = '배달킹1호'), 38000, CURRENT_DATE - INTERVAL '2 days', '/fake/screenshot2.jpg', true, 380, '쿠팡 배달 완료 38000원', 92.0, 'coupang', NOW() - INTERVAL '2 days'),
((SELECT id FROM users WHERE nickname = '배달킹1호'), 52000, CURRENT_DATE - INTERVAL '3 days', '/fake/screenshot3.jpg', true, 520, '배민 배달 완료 52000원', 98.0, 'baemin', NOW() - INTERVAL '3 days'),
((SELECT id FROM users WHERE nickname = '배달킹1호'), 41000, CURRENT_DATE - INTERVAL '4 days', '/fake/screenshot4.jpg', true, 410, '쿠팡 배달 완료 41000원', 89.5, 'coupang', NOW() - INTERVAL '4 days'),
((SELECT id FROM users WHERE nickname = '배달킹1호'), 48000, CURRENT_DATE - INTERVAL '5 days', '/fake/screenshot5.jpg', true, 480, '배민 배달 완료 48000원', 96.0, 'baemin', NOW() - INTERVAL '5 days');

-- 가상 수입 기록 생성 (쿠팡마스터)
INSERT INTO earnings (user_id, amount, date, screenshot_url, verified, points_awarded, screenshot_text, verified_score, platform, created_at) VALUES
((SELECT id FROM users WHERE nickname = '쿠팡마스터'), 55000, CURRENT_DATE - INTERVAL '1 day', '/fake/screenshot6.jpg', true, 550, '쿠팡 배달 완료 55000원', 97.5, 'coupang', NOW() - INTERVAL '1 day'),
((SELECT id FROM users WHERE nickname = '쿠팡마스터'), 42000, CURRENT_DATE - INTERVAL '2 days', '/fake/screenshot7.jpg', true, 420, '쿠팡 배달 완료 42000원', 91.0, 'coupang', NOW() - INTERVAL '2 days'),
((SELECT id FROM users WHERE nickname = '쿠팡마스터'), 58000, CURRENT_DATE - INTERVAL '3 days', '/fake/screenshot8.jpg', true, 580, '쿠팡 배달 완료 58000원', 99.0, 'coupang', NOW() - INTERVAL '3 days'),
((SELECT id FROM users WHERE nickname = '쿠팡마스터'), 46000, CURRENT_DATE - INTERVAL '4 days', '/fake/screenshot9.jpg', true, 460, '쿠팡 배달 완료 46000원', 93.5, 'coupang', NOW() - INTERVAL '4 days'),
((SELECT id FROM users WHERE nickname = '쿠팡마스터'), 51000, CURRENT_DATE - INTERVAL '5 days', '/fake/screenshot10.jpg', true, 510, '쿠팡 배달 완료 51000원', 95.0, 'coupang', NOW() - INTERVAL '5 days');

-- 가상 수입 기록 생성 (배민여신)
INSERT INTO earnings (user_id, amount, date, screenshot_url, verified, points_awarded, screenshot_text, verified_score, platform, created_at) VALUES
((SELECT id FROM users WHERE nickname = '배민여신'), 48000, CURRENT_DATE - INTERVAL '1 day', '/fake/screenshot11.jpg', true, 480, '배민 배달 완료 48000원', 96.5, 'baemin', NOW() - INTERVAL '1 day'),
((SELECT id FROM users WHERE nickname = '배민여신'), 52000, CURRENT_DATE - INTERVAL '2 days', '/fake/screenshot12.jpg', true, 520, '배민 배달 완료 52000원', 98.0, 'baemin', NOW() - INTERVAL '2 days'),
((SELECT id FROM users WHERE nickname = '배민여신'), 45000, CURRENT_DATE - INTERVAL '3 days', '/fake/screenshot13.jpg', true, 450, '배민 배달 완료 45000원', 94.5, 'baemin', NOW() - INTERVAL '3 days'),
((SELECT id FROM users WHERE nickname = '배민여신'), 49000, CURRENT_DATE - INTERVAL '4 days', '/fake/screenshot14.jpg', true, 490, '배민 배달 완료 49000원', 97.0, 'baemin', NOW() - INTERVAL '4 days'),
((SELECT id FROM users WHERE nickname = '배민여신'), 54000, CURRENT_DATE - INTERVAL '5 days', '/fake/screenshot15.jpg', true, 540, '배민 배달 완료 54000원', 99.5, 'baemin', NOW() - INTERVAL '5 days');

-- 가상 포인트 데이터 생성
INSERT INTO points (user_id, amount, type, created_at) VALUES
((SELECT id FROM users WHERE nickname = '배달킹1호'), 450, 'earn', NOW() - INTERVAL '1 day'),
((SELECT id FROM users WHERE nickname = '배달킹1호'), 380, 'earn', NOW() - INTERVAL '2 days'),
((SELECT id FROM users WHERE nickname = '배달킹1호'), 520, 'earn', NOW() - INTERVAL '3 days'),
((SELECT id FROM users WHERE nickname = '쿠팡마스터'), 550, 'earn', NOW() - INTERVAL '1 day'),
((SELECT id FROM users WHERE nickname = '쿠팡마스터'), 420, 'earn', NOW() - INTERVAL '2 days'),
((SELECT id FROM users WHERE nickname = '배민여신'), 480, 'earn', NOW() - INTERVAL '1 day'),
((SELECT id FROM users WHERE nickname = '배민여신'), 520, 'earn', NOW() - INTERVAL '2 days');

-- 가상 친구 관계 생성
INSERT INTO friendships (user_id, friend_id, status, requested_at, accepted_at) VALUES
((SELECT id FROM users WHERE nickname = '배달킹1호'), (SELECT id FROM users WHERE nickname = '쿠팡마스터'), 'accepted', NOW() - INTERVAL '20 days', NOW() - INTERVAL '19 days'),
((SELECT id FROM users WHERE nickname = '배달킹1호'), (SELECT id FROM users WHERE nickname = '배민여신'), 'accepted', NOW() - INTERVAL '18 days', NOW() - INTERVAL '17 days'),
((SELECT id FROM users WHERE nickname = '쿠팡마스터'), (SELECT id FROM users WHERE nickname = '배민여신'), 'accepted', NOW() - INTERVAL '16 days', NOW() - INTERVAL '15 days'),
((SELECT id FROM users WHERE nickname = '배달킹1호'), (SELECT id FROM users WHERE nickname = '배달전사'), 'pending', NOW() - INTERVAL '5 days', NULL),
((SELECT id FROM users WHERE nickname = '수익왕'), (SELECT id FROM users WHERE nickname = '배달킹1호'), 'pending', NOW() - INTERVAL '3 days', NULL);

-- 가상 방문 기록 생성
INSERT INTO minihome_visits (minihome_user_id, visitor_id, visited_at) VALUES
((SELECT id FROM users WHERE nickname = '배달킹1호'), (SELECT id FROM users WHERE nickname = '쿠팡마스터'), NOW() - INTERVAL '2 days'),
((SELECT id FROM users WHERE nickname = '배달킹1호'), (SELECT id FROM users WHERE nickname = '배민여신'), NOW() - INTERVAL '1 day'),
((SELECT id FROM users WHERE nickname = '쿠팡마스터'), (SELECT id FROM users WHERE nickname = '배달킹1호'), NOW() - INTERVAL '3 days'),
((SELECT id FROM users WHERE nickname = '배민여신'), (SELECT id FROM users WHERE nickname = '배달킹1호'), NOW() - INTERVAL '4 days'),
((SELECT id FROM users WHERE nickname = '배민여신'), (SELECT id FROM users WHERE nickname = '쿠팡마스터'), NOW() - INTERVAL '2 days');

-- 가상 방명록 데이터 생성
INSERT INTO guestbook_entries (minihome_user_id, writer_id, content, is_private, created_at) VALUES
((SELECT id FROM users WHERE nickname = '배달킹1호'), (SELECT id FROM users WHERE nickname = '쿠팡마스터'), '오늘도 수고하셨습니다! 수익이 좋으시네요 👍', false, NOW() - INTERVAL '2 days'),
((SELECT id FROM users WHERE nickname = '배달킹1호'), (SELECT id FROM users WHERE nickname = '배민여신'), '배달킹1호님 미니홈피 너무 예쁘게 꾸미셨네요!', false, NOW() - INTERVAL '1 day'),
((SELECT id FROM users WHERE nickname = '쿠팡마스터'), (SELECT id FROM users WHERE nickname = '배달킹1호'), '쿠팡마스터님도 화이팅!', false, NOW() - INTERVAL '3 days'),
((SELECT id FROM users WHERE nickname = '배민여신'), (SELECT id FROM users WHERE nickname = '배달킹1호'), '배민여신도 응원할게요! 💪', false, NOW() - INTERVAL '4 days'),
((SELECT id FROM users WHERE nickname = '배민여신'), (SELECT id FROM users WHERE nickname = '쿠팡마스터'), '오늘 날씨가 좋네요!', false, NOW() - INTERVAL '2 days');

-- 가상 상점 아이템 생성
INSERT INTO items (name, type, asset_url, price, created_at) VALUES
('레전드 배경', 'garage', '/assets/garage/legend-bg.png', 1000, NOW()),
('다이아몬드 차량', 'garage', '/assets/vehicle/diamond-scooter.png', 800, NOW()),
('골드 캐릭터', 'character', '/assets/character/gold-character.png', 600, NOW()),
('실버 장식', 'garage', '/assets/decor/silver-decor.png', 400, NOW()),
('브론즈 테마', 'garage', '/assets/theme/bronze-theme.png', 200, NOW());

-- 가상 사용자 아이템 보유 데이터 생성
INSERT INTO user_items (user_id, item_id, equipped, created_at) VALUES
((SELECT id FROM users WHERE nickname = '배달킹1호'), (SELECT id FROM items WHERE name = '레전드 배경'), true, NOW() - INTERVAL '10 days'),
((SELECT id FROM users WHERE nickname = '배달킹1호'), (SELECT id FROM items WHERE name = '다이아몬드 차량'), true, NOW() - INTERVAL '8 days'),
((SELECT id FROM users WHERE nickname = '쿠팡마스터'), (SELECT id FROM items WHERE name = '골드 캐릭터'), true, NOW() - INTERVAL '12 days'),
((SELECT id FROM users WHERE nickname = '배민여신'), (SELECT id FROM items WHERE name = '실버 장식'), true, NOW() - INTERVAL '15 days');

-- 방문자 수 업데이트
UPDATE users SET 
  total_visitors = 15,
  daily_visitors = 3,
  last_visitor_reset = CURRENT_DATE
WHERE nickname = '배달킹1호';

UPDATE users SET 
  total_visitors = 12,
  daily_visitors = 2,
  last_visitor_reset = CURRENT_DATE
WHERE nickname = '쿠팡마스터';

UPDATE users SET 
  total_visitors = 18,
  daily_visitors = 4,
  last_visitor_reset = CURRENT_DATE
WHERE nickname = '배민여신';

UPDATE users SET 
  total_visitors = 8,
  daily_visitors = 1,
  last_visitor_reset = CURRENT_DATE
WHERE nickname = '배달전사';

UPDATE users SET 
  total_visitors = 22,
  daily_visitors = 5,
  last_visitor_reset = CURRENT_DATE
WHERE nickname = '수익왕';
`;

// SQL 파일 저장
const sqlFilePath = path.join(process.cwd(), 'supabase', 'seed.sql');
fs.writeFileSync(sqlFilePath, sampleDataSQL);

console.log('✅ 샘플 데이터 SQL 파일 생성 완료:', sqlFilePath);

// Supabase에 데이터 삽입
console.log('\n🗄️ Supabase에 샘플 데이터 삽입 중...');

try {
  // 데이터베이스에 직접 삽입
  execSync('npx supabase db reset --linked', { stdio: 'inherit' });
  console.log('✅ 샘플 데이터 삽입 완료!');
} catch (error) {
  console.log('ℹ️ 수동으로 데이터 삽입이 필요합니다.');
  console.log('💡 다음 명령어를 실행하세요:');
  console.log('   npx supabase db reset --linked');
}

console.log('\n🎉 가상 데이터 생성 완료!');
console.log('\n📋 생성된 데이터:');
console.log('   👥 가상 사용자: 10명');
console.log('   💰 수입 기록: 15건');
console.log('   🏆 포인트: 7건');
console.log('   👫 친구 관계: 5건');
console.log('   🏠 방문 기록: 5건');
console.log('   📝 방명록: 5건');
console.log('   🛍️ 상점 아이템: 5개');
console.log('   🎨 사용자 아이템: 4건');
console.log('\n🚀 이제 애플리케이션에서 테스트해보세요!');


-- 🎯 새로운 데이터베이스 구조용 시드 데이터 (간단 버전)

-- 가상 사용자 데이터 생성 (새로운 구조에 맞게)
INSERT INTO users (kakao_id, email, nickname, region, avatar_config, garage_config, platforms, goals, status_message, is_income_private, total_visitors, daily_visitors, created_at) VALUES
('kakao_001', 'user1@baedalking.com', '배달킹1호', '서울 강남구', '{"emotion": "happy", "background": "background1.png", "character": "character-base.png"}', '{"vehicle": "scooter", "background": "background1.png", "intro": "열심히 달리는 배달킹입니다! 🛵💨"}', '[{"id": "baemin", "name": "배민", "icon": "/baemin-logo.svg", "color": "#00C851", "isActive": true, "type": "default"}, {"id": "coupang", "name": "쿠팡", "icon": "/coupang-logo.svg", "color": "#E4002B", "isActive": true, "type": "default"}]', '{"daily": 50000, "weekly": 350000, "monthly": 1500000}', '오늘도 화이팅!', false, 15, 3, NOW() - INTERVAL '30 days'),
('kakao_002', 'user2@baedalking.com', '쿠팡마스터', '서울 서초구', '{"emotion": "base", "background": "background2.png", "character": "character-base.png"}', '{"vehicle": "scooter", "background": "background2.png", "intro": "쿠팡 전문 배달킹입니다! 📦"}', '[{"id": "baemin", "name": "배민", "icon": "/baemin-logo.svg", "color": "#00C851", "isActive": false, "type": "default"}, {"id": "coupang", "name": "쿠팡", "icon": "/coupang-logo.svg", "color": "#E4002B", "isActive": true, "type": "default"}]', '{"daily": 60000, "weekly": 420000, "monthly": 1800000}', '쿠팡만의 달인!', false, 12, 2, NOW() - INTERVAL '25 days'),
('kakao_003', 'user3@baedalking.com', '배민여신', '서울 마포구', '{"emotion": "happy", "background": "background3.png", "character": "character-happy.png"}', '{"vehicle": "scooter", "background": "background3.png", "intro": "배민의 여신입니다! 🍽️"}', '[{"id": "baemin", "name": "배민", "icon": "/baemin-logo.svg", "color": "#00C851", "isActive": true, "type": "default"}, {"id": "coupang", "name": "쿠팡", "icon": "/coupang-logo.svg", "color": "#E4002B", "isActive": false, "type": "default"}]', '{"daily": 55000, "weekly": 385000, "monthly": 1650000}', '배민의 여신이에요!', false, 18, 4, NOW() - INTERVAL '20 days');

-- 가상 수입 기록 생성 (배달킹1호)
INSERT INTO earnings (user_id, delivery_count, delivery_amount, mission_amount, date, screenshot_url, verified, screenshot_text, verified_score, platform, created_at) VALUES
((SELECT id FROM users WHERE nickname = '배달킹1호' LIMIT 1), 3, 45000, 5000, CURRENT_DATE - INTERVAL '1 day', '/fake/screenshot1.jpg', true, '배민 배달 완료 45000원', 95.5, 'baemin', NOW() - INTERVAL '1 day'),
((SELECT id FROM users WHERE nickname = '배달킹1호' LIMIT 1), 2, 38000, 3000, CURRENT_DATE - INTERVAL '2 days', '/fake/screenshot2.jpg', true, '쿠팡 배달 완료 38000원', 92.0, 'coupang', NOW() - INTERVAL '2 days'),
((SELECT id FROM users WHERE nickname = '쿠팡마스터' LIMIT 1), 4, 55000, 4000, CURRENT_DATE - INTERVAL '1 day', '/fake/screenshot3.jpg', true, '쿠팡 배달 완료 55000원', 97.5, 'coupang', NOW() - INTERVAL '1 day'),
((SELECT id FROM users WHERE nickname = '배민여신' LIMIT 1), 4, 48000, 3000, CURRENT_DATE - INTERVAL '1 day', '/fake/screenshot4.jpg', true, '배민 배달 완료 48000원', 96.5, 'baemin', NOW() - INTERVAL '1 day');

-- 가상 박스 거래 데이터 생성
INSERT INTO box_transactions (user_id, amount, type, reason, created_at) VALUES
((SELECT id FROM users WHERE nickname = '배달킹1호' LIMIT 1), 450, 'earn', '배달 완료', NOW() - INTERVAL '1 day'),
((SELECT id FROM users WHERE nickname = '배달킹1호' LIMIT 1), 380, 'earn', '배달 완료', NOW() - INTERVAL '2 days'),
((SELECT id FROM users WHERE nickname = '쿠팡마스터' LIMIT 1), 550, 'earn', '배달 완료', NOW() - INTERVAL '1 day'),
((SELECT id FROM users WHERE nickname = '배민여신' LIMIT 1), 480, 'earn', '배달 완료', NOW() - INTERVAL '1 day');

-- 가상 친구 관계 생성 (존재하는 사용자들만)
INSERT INTO friendships (user_id, friend_id, status, created_at) VALUES
((SELECT id FROM users WHERE nickname = '배달킹1호' LIMIT 1), (SELECT id FROM users WHERE nickname = '쿠팡마스터' LIMIT 1), 'accepted', NOW() - INTERVAL '20 days'),
((SELECT id FROM users WHERE nickname = '배달킹1호' LIMIT 1), (SELECT id FROM users WHERE nickname = '배민여신' LIMIT 1), 'accepted', NOW() - INTERVAL '18 days'),
((SELECT id FROM users WHERE nickname = '쿠팡마스터' LIMIT 1), (SELECT id FROM users WHERE nickname = '배민여신' LIMIT 1), 'accepted', NOW() - INTERVAL '16 days');

-- 가상 방문 기록 생성
INSERT INTO visits (visitor_id, visited_user_id, created_at) VALUES
((SELECT id FROM users WHERE nickname = '쿠팡마스터' LIMIT 1), (SELECT id FROM users WHERE nickname = '배달킹1호' LIMIT 1), NOW() - INTERVAL '2 days'),
((SELECT id FROM users WHERE nickname = '배민여신' LIMIT 1), (SELECT id FROM users WHERE nickname = '배달킹1호' LIMIT 1), NOW() - INTERVAL '1 day'),
((SELECT id FROM users WHERE nickname = '배달킹1호' LIMIT 1), (SELECT id FROM users WHERE nickname = '쿠팡마스터' LIMIT 1), NOW() - INTERVAL '3 days');

-- 가상 방명록 데이터 생성
INSERT INTO guestbook_entries (user_id, visitor_id, message, is_private, created_at) VALUES
((SELECT id FROM users WHERE nickname = '배달킹1호' LIMIT 1), (SELECT id FROM users WHERE nickname = '쿠팡마스터' LIMIT 1), '오늘도 수고하셨습니다! 수익이 좋으시네요 👍', false, NOW() - INTERVAL '2 days'),
((SELECT id FROM users WHERE nickname = '배달킹1호' LIMIT 1), (SELECT id FROM users WHERE nickname = '배민여신' LIMIT 1), '배달킹1호님 미니홈피 너무 예쁘게 꾸미셨네요!', false, NOW() - INTERVAL '1 day'),
((SELECT id FROM users WHERE nickname = '쿠팡마스터' LIMIT 1), (SELECT id FROM users WHERE nickname = '배달킹1호' LIMIT 1), '쿠팡마스터님도 화이팅!', false, NOW() - INTERVAL '3 days');

-- 꾸미기 테스트를 위한 박스 지급 (모든 사용자에게 1000박스씩)
INSERT INTO box_transactions (user_id, amount, type, reason, created_at)
SELECT id, 1000, 'earn', '테스트용 박스 지급', NOW()
FROM users;

-- 테스트용 사용자 인벤토리 (배달킹1호에게 몇 개 아이템 지급)
INSERT INTO user_inventory (user_id, item_id, quantity) VALUES
((SELECT id FROM users WHERE nickname = '배달킹1호' LIMIT 1), (SELECT id FROM decoration_items WHERE name = '게이밍 의자' LIMIT 1), 1),
((SELECT id FROM users WHERE nickname = '배달킹1호' LIMIT 1), (SELECT id FROM decoration_items WHERE name = '미니 냉장고' LIMIT 1), 1),
((SELECT id FROM users WHERE nickname = '쿠팡마스터' LIMIT 1), (SELECT id FROM decoration_items WHERE name = '오피스 의자' LIMIT 1), 1),
((SELECT id FROM users WHERE nickname = '배민여신' LIMIT 1), (SELECT id FROM decoration_items WHERE name = '녹색 식물' LIMIT 1), 2);
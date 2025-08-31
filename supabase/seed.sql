
-- 가상 사용자 데이터 생성
INSERT INTO users (kakao_id, email, nickname, region, avatar_config, garage_config, created_at) VALUES
('kakao_001', 'user1@baedalking.com', '배달킹1호', '서울 강남구', '{"emotion": "happy", "background": "background1.png"}', '{"vehicle": "scooter", "decor": "garage1"}', NOW() - INTERVAL '30 days'),
('kakao_002', 'user2@baedalking.com', '쿠팡마스터', '서울 서초구', '{"emotion": "base", "background": "background2.png"}', '{"vehicle": "scooter", "decor": "garage2"}', NOW() - INTERVAL '25 days'),
('kakao_003', 'user3@baedalking.com', '배민여신', '서울 마포구', '{"emotion": "happy", "background": "background3.png"}', '{"vehicle": "scooter", "decor": "garage3"}', NOW() - INTERVAL '20 days'),
('kakao_004', 'user4@baedalking.com', '배달전사', '서울 송파구', '{"emotion": "tired", "background": "background4.png"}', '{"vehicle": "scooter", "decor": "garage4"}', NOW() - INTERVAL '15 days'),
('kakao_005', 'user5@baedalking.com', '수익왕', '서울 영등포구', '{"emotion": "angry", "background": "background1.png"}', '{"vehicle": "scooter", "decor": "garage1"}', NOW() - INTERVAL '10 days'),
('kakao_006', 'user6@baedalking.com', '배달신동', '서울 강서구', '{"emotion": "base", "background": "background2.png"}', '{"vehicle": "scooter", "decor": "garage2"}', NOW() - INTERVAL '5 days'),
('kakao_007', 'user7@baedalking.com', '배달여신', '서울 성동구', '{"emotion": "happy", "background": "background3.png"}', '{"vehicle": "scooter", "decor": "garage3"}', NOW() - INTERVAL '3 days'),
('kakao_008', 'user8@baedalking.com', '배달마스터', '서울 광진구', '{"emotion": "base", "background": "background4.png"}', '{"vehicle": "scooter", "decor": "garage4"}', NOW() - INTERVAL '1 day'),
('kakao_009', 'user9@baedalking.com', '배달킹2호', '서울 중구', '{"emotion": "happy", "background": "background1.png"}', '{"vehicle": "scooter", "decor": "garage1"}', NOW()),
('kakao_010', 'user10@baedalking.com', '배달여왕', '서울 용산구', '{"emotion": "base", "background": "background2.png"}', '{"vehicle": "scooter", "decor": "garage2"}', NOW());

-- 가상 수입 기록 생성 (배달킹1호)
INSERT INTO earnings (user_id, delivery_count, delivery_amount, mission_amount, date, screenshot_url, verified, boxes_awarded, screenshot_text, verified_score, platform, created_at) VALUES
((SELECT id FROM users WHERE nickname = '배달킹1호'), 3, 45000, 5000, CURRENT_DATE - INTERVAL '1 day', '/fake/screenshot1.jpg', true, 450, '배민 배달 완료 45000원', 95.5, 'baemin', NOW() - INTERVAL '1 day'),
((SELECT id FROM users WHERE nickname = '배달킹1호'), 2, 38000, 3000, CURRENT_DATE - INTERVAL '2 days', '/fake/screenshot2.jpg', true, 380, '쿠팡 배달 완료 38000원', 92.0, 'coupang', NOW() - INTERVAL '2 days'),
((SELECT id FROM users WHERE nickname = '배달킹1호'), 4, 52000, 4000, CURRENT_DATE - INTERVAL '3 days', '/fake/screenshot3.jpg', true, 520, '배민 배달 완료 52000원', 98.0, 'baemin', NOW() - INTERVAL '3 days'),
((SELECT id FROM users WHERE nickname = '배달킹1호'), 3, 41000, 2000, CURRENT_DATE - INTERVAL '4 days', '/fake/screenshot4.jpg', true, 410, '쿠팡 배달 완료 41000원', 89.5, 'coupang', NOW() - INTERVAL '4 days'),
((SELECT id FROM users WHERE nickname = '배달킹1호'), 4, 48000, 3000, CURRENT_DATE - INTERVAL '5 days', '/fake/screenshot5.jpg', true, 480, '배민 배달 완료 48000원', 96.0, 'baemin', NOW() - INTERVAL '5 days');

-- 가상 수입 기록 생성 (쿠팡마스터)
INSERT INTO earnings (user_id, delivery_count, delivery_amount, mission_amount, date, screenshot_url, verified, boxes_awarded, screenshot_text, verified_score, platform, created_at) VALUES
((SELECT id FROM users WHERE nickname = '쿠팡마스터'), 4, 55000, 4000, CURRENT_DATE - INTERVAL '1 day', '/fake/screenshot6.jpg', true, 550, '쿠팡 배달 완료 55000원', 97.5, 'coupang', NOW() - INTERVAL '1 day'),
((SELECT id FROM users WHERE nickname = '쿠팡마스터'), 3, 42000, 3000, CURRENT_DATE - INTERVAL '2 days', '/fake/screenshot7.jpg', true, 420, '쿠팡 배달 완료 42000원', 91.0, 'coupang', NOW() - INTERVAL '2 days'),
((SELECT id FROM users WHERE nickname = '쿠팡마스터'), 5, 58000, 5000, CURRENT_DATE - INTERVAL '3 days', '/fake/screenshot8.jpg', true, 580, '쿠팡 배달 완료 58000원', 99.0, 'coupang', NOW() - INTERVAL '3 days'),
((SELECT id FROM users WHERE nickname = '쿠팡마스터'), 3, 46000, 2000, CURRENT_DATE - INTERVAL '4 days', '/fake/screenshot9.jpg', true, 460, '쿠팡 배달 완료 46000원', 93.5, 'coupang', NOW() - INTERVAL '4 days'),
((SELECT id FROM users WHERE nickname = '쿠팡마스터'), 4, 51000, 3000, CURRENT_DATE - INTERVAL '5 days', '/fake/screenshot10.jpg', true, 510, '쿠팡 배달 완료 51000원', 95.0, 'coupang', NOW() - INTERVAL '5 days');

-- 가상 수입 기록 생성 (배민여신)
INSERT INTO earnings (user_id, delivery_count, delivery_amount, mission_amount, date, screenshot_url, verified, boxes_awarded, screenshot_text, verified_score, platform, created_at) VALUES
((SELECT id FROM users WHERE nickname = '배민여신'), 4, 48000, 3000, CURRENT_DATE - INTERVAL '1 day', '/fake/screenshot11.jpg', true, 480, '배민 배달 완료 48000원', 96.5, 'baemin', NOW() - INTERVAL '1 day'),
((SELECT id FROM users WHERE nickname = '배민여신'), 5, 52000, 4000, CURRENT_DATE - INTERVAL '2 days', '/fake/screenshot12.jpg', true, 520, '배민 배달 완료 52000원', 98.0, 'baemin', NOW() - INTERVAL '2 days'),
((SELECT id FROM users WHERE nickname = '배민여신'), 3, 45000, 2000, CURRENT_DATE - INTERVAL '3 days', '/fake/screenshot13.jpg', true, 450, '배민 배달 완료 45000원', 94.5, 'baemin', NOW() - INTERVAL '3 days'),
((SELECT id FROM users WHERE nickname = '배민여신'), 4, 49000, 3000, CURRENT_DATE - INTERVAL '4 days', '/fake/screenshot14.jpg', true, 490, '배민 배달 완료 49000원', 97.0, 'baemin', NOW() - INTERVAL '4 days'),
((SELECT id FROM users WHERE nickname = '배민여신'), 5, 54000, 4000, CURRENT_DATE - INTERVAL '5 days', '/fake/screenshot15.jpg', true, 540, '배민 배달 완료 54000원', 99.5, 'baemin', NOW() - INTERVAL '5 days');

-- 가상 박스 데이터 생성
INSERT INTO boxes (user_id, amount, type, reason, created_at) VALUES
((SELECT id FROM users WHERE nickname = '배달킹1호'), 450, 'earn', '배달 완료', NOW() - INTERVAL '1 day'),
((SELECT id FROM users WHERE nickname = '배달킹1호'), 380, 'earn', '배달 완료', NOW() - INTERVAL '2 days'),
((SELECT id FROM users WHERE nickname = '배달킹1호'), 520, 'earn', '배달 완료', NOW() - INTERVAL '3 days'),
((SELECT id FROM users WHERE nickname = '쿠팡마스터'), 550, 'earn', '배달 완료', NOW() - INTERVAL '1 day'),
((SELECT id FROM users WHERE nickname = '쿠팡마스터'), 420, 'earn', '배달 완료', NOW() - INTERVAL '2 days'),
((SELECT id FROM users WHERE nickname = '배민여신'), 480, 'earn', '배달 완료', NOW() - INTERVAL '1 day'),
((SELECT id FROM users WHERE nickname = '배민여신'), 520, 'earn', '배달 완료', NOW() - INTERVAL '2 days');

-- 가상 친구 관계 생성
INSERT INTO friends (user_id, friend_id, status, created_at) VALUES
((SELECT id FROM users WHERE nickname = '배달킹1호'), (SELECT id FROM users WHERE nickname = '쿠팡마스터'), 'accepted', NOW() - INTERVAL '20 days'),
((SELECT id FROM users WHERE nickname = '배달킹1호'), (SELECT id FROM users WHERE nickname = '배민여신'), 'accepted', NOW() - INTERVAL '18 days'),
((SELECT id FROM users WHERE nickname = '쿠팡마스터'), (SELECT id FROM users WHERE nickname = '배민여신'), 'accepted', NOW() - INTERVAL '16 days'),
((SELECT id FROM users WHERE nickname = '배달킹1호'), (SELECT id FROM users WHERE nickname = '배달전사'), 'pending', NOW() - INTERVAL '5 days'),
((SELECT id FROM users WHERE nickname = '수익왕'), (SELECT id FROM users WHERE nickname = '배달킹1호'), 'pending', NOW() - INTERVAL '3 days');

-- 가상 방문 기록 생성
INSERT INTO visits (user_id, visited_user_id, created_at) VALUES
((SELECT id FROM users WHERE nickname = '쿠팡마스터'), (SELECT id FROM users WHERE nickname = '배달킹1호'), NOW() - INTERVAL '2 days'),
((SELECT id FROM users WHERE nickname = '배민여신'), (SELECT id FROM users WHERE nickname = '배달킹1호'), NOW() - INTERVAL '1 day'),
((SELECT id FROM users WHERE nickname = '배달킹1호'), (SELECT id FROM users WHERE nickname = '쿠팡마스터'), NOW() - INTERVAL '3 days'),
((SELECT id FROM users WHERE nickname = '배달킹1호'), (SELECT id FROM users WHERE nickname = '배민여신'), NOW() - INTERVAL '4 days'),
((SELECT id FROM users WHERE nickname = '배민여신'), (SELECT id FROM users WHERE nickname = '쿠팡마스터'), NOW() - INTERVAL '2 days');

-- 가상 방명록 데이터 생성
INSERT INTO guestbook (user_id, visitor_id, message, is_private, created_at) VALUES
((SELECT id FROM users WHERE nickname = '배달킹1호'), (SELECT id FROM users WHERE nickname = '쿠팡마스터'), '오늘도 수고하셨습니다! 수익이 좋으시네요 👍', false, NOW() - INTERVAL '2 days'),
((SELECT id FROM users WHERE nickname = '배달킹1호'), (SELECT id FROM users WHERE nickname = '배민여신'), '배달킹1호님 미니홈피 너무 예쁘게 꾸미셨네요!', false, NOW() - INTERVAL '1 day'),
((SELECT id FROM users WHERE nickname = '쿠팡마스터'), (SELECT id FROM users WHERE nickname = '배달킹1호'), '쿠팡마스터님도 화이팅!', false, NOW() - INTERVAL '3 days'),
((SELECT id FROM users WHERE nickname = '배민여신'), (SELECT id FROM users WHERE nickname = '배달킹1호'), '배민여신도 응원할게요! 💪', false, NOW() - INTERVAL '4 days'),
((SELECT id FROM users WHERE nickname = '배민여신'), (SELECT id FROM users WHERE nickname = '쿠팡마스터'), '오늘 날씨가 좋네요!', false, NOW() - INTERVAL '2 days');

-- 방문자 수 업데이트
UPDATE users SET 
  total_visitors = 15,
  daily_visitors = 3
WHERE nickname = '배달킹1호';

UPDATE users SET 
  total_visitors = 12,
  daily_visitors = 2
WHERE nickname = '쿠팡마스터';

UPDATE users SET 
  total_visitors = 18,
  daily_visitors = 4
WHERE nickname = '배민여신';

UPDATE users SET 
  total_visitors = 8,
  daily_visitors = 1
WHERE nickname = '배달전사';

UPDATE users SET 
  total_visitors = 22,
  daily_visitors = 5
WHERE nickname = '수익왕';

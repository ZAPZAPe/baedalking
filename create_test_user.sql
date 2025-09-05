-- 테스트용 사용자 생성
INSERT INTO users (
    id,
    kakao_id, 
    email, 
    nickname, 
    region, 
    avatar_config, 
    garage_config, 
    platforms, 
    goals, 
    status_message, 
    is_income_private, 
    total_visitors, 
    daily_visitors, 
    created_at
) VALUES (
    '35c0ad9f-3539-4a4a-8b5d-feaa71c434ee',
    'kakao_test_001', 
    'test@baedalking.com', 
    '테스트유저', 
    '서울 강남구', 
    '{"emotion": "happy", "background": "background1.png", "character": "character-base.png"}', 
    '{"vehicle": "scooter", "background": "background1.png", "intro": "테스트용 배달킹입니다! 🛵💨"}', 
    '[{"id": "baemin", "name": "배민", "icon": "/baemin-logo.svg", "color": "#00C851", "isActive": true, "type": "default"}, {"id": "coupang", "name": "쿠팡", "icon": "/coupang-logo.svg", "color": "#E4002B", "isActive": true, "type": "default"}]', 
    '{"daily": 50000, "weekly": 350000, "monthly": 1500000}', 
    '테스트 중입니다!', 
    false, 
    0, 
    0, 
    NOW()
);

-- 테스트용 캐릭터 데이터 생성
INSERT INTO character_data (
    user_id, 
    parts, 
    position, 
    is_visible
) VALUES (
    '35c0ad9f-3539-4a4a-8b5d-feaa71c434ee',
    '{"hair": "none.png", "top": "none.png", "bottom": "none.png", "emotion": "happy.png"}',
    '{"x": 0, "y": 0}',
    true
);

-- 확인
SELECT '사용자 생성 완료' as status, id, nickname FROM users WHERE id = '35c0ad9f-3539-4a4a-8b5d-feaa71c434ee';
SELECT '캐릭터 데이터 생성 완료' as status, user_id, parts FROM character_data WHERE user_id = '35c0ad9f-3539-4a4a-8b5d-feaa71c434ee';

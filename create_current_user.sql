-- 현재 로그인된 사용자 생성 (브라우저에서 확인한 실제 사용자 ID 사용)
-- 브라우저 콘솔에서 확인한 실제 사용자 ID로 교체하세요

-- 예시: 실제 사용자 ID가 '35c0ad9f-3539-4a4a-8b5d-feaa71c434ee'인 경우
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
    '35c0ad9f-3539-4a4a-8b5d-feaa71c434ee',  -- 실제 사용자 ID로 교체
    'kakao_current_user', 
    'current@baedalking.com', 
    '현재사용자', 
    '서울 강남구', 
    '{"emotion": "happy", "background": "background1.png", "character": "character-base.png"}', 
    '{"vehicle": "scooter", "background": "background1.png", "intro": "현재 로그인된 사용자입니다! 🛵💨"}', 
    '[{"id": "baemin", "name": "배민", "icon": "/baemin-logo.svg", "color": "#00C851", "isActive": true, "type": "default"}, {"id": "coupang", "name": "쿠팡", "icon": "/coupang-logo.svg", "color": "#E4002B", "isActive": true, "type": "default"}]', 
    '{"daily": 50000, "weekly": 350000, "monthly": 1500000}', 
    '현재 로그인된 사용자입니다!', 
    false, 
    0, 
    0, 
    NOW()
) ON CONFLICT (id) DO NOTHING;

-- 확인
SELECT '사용자 생성 완료' as status, id, nickname FROM users WHERE id = '35c0ad9f-3539-4a4a-8b5d-feaa71c434ee';

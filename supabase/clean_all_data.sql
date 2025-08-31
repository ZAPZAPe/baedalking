-- 모든 데이터 정리 스크립트
-- 실행 전 주의: 이 스크립트는 모든 데이터를 삭제합니다!

-- 1. 모든 테이블의 데이터 삭제 (순서 중요 - 외래키 제약조건 때문)
DELETE FROM guestbook;
DELETE FROM visits;
DELETE FROM friends;
DELETE FROM user_items;
DELETE FROM points;
DELETE FROM earnings;
DELETE FROM users;

-- 2. last_login 컬럼 추가 (없는 경우)
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login TIMESTAMP WITH TIME ZONE;

-- 3. last_login 인덱스 생성 (없는 경우)
CREATE INDEX IF NOT EXISTS idx_users_last_login ON users(last_login);

-- 4. 기본 아이템들 다시 삽입
INSERT INTO items (name, type, asset_url, price, description, category) VALUES
-- Background items
('기본 배경', 'background', '/assets/background/background.png', 0, '시작할 때 제공되는 기본 배경입니다.', 'background'),
('레트로 배경', 'background', '/assets/background/background1.png', 1000, '80년대 감성의 레트로 스타일 배경입니다.', 'background'),
('미래지향 배경', 'background', '/assets/background/background2.png', 2000, '첨단 기술의 미래적인 배경입니다.', 'background'),
('자연 배경', 'background', '/assets/background/background3.png', 1500, '평화로운 자연의 배경입니다.', 'background'),
('도시 배경', 'background', '/assets/background/background4.png', 1800, '활기찬 도시의 야경 배경입니다.', 'background'),

-- Character items
('기본 캐릭터', 'character', '/assets/character/character-base.png', 0, '시작할 때 제공되는 기본 캐릭터입니다.', 'character'),
('행복한 표정', 'character', '/assets/character/character-happy.png', 500, '기분 좋은 날의 행복한 표정입니다.', 'character'),
('화난 표정', 'character', '/assets/character/character-angry.png', 300, '스트레스받는 날의 화난 표정입니다.', 'character'),
('피곤한 표정', 'character', '/assets/character/character-tired.png', 400, '힘든 하루 끝의 피곤한 표정입니다.', 'character'),

-- Vehicle items
('기본 스쿠터', 'vehicle', '/assets/vehicle/scooter.png', 0, '배달의 기본! 믿음직한 스쿠터입니다.', 'vehicle')
ON CONFLICT DO NOTHING;

-- 5. 시퀀스 리셋 (UUID는 자동 생성이므로 필요 없음)
-- PostgreSQL에서는 UUID가 자동 생성되므로 별도 리셋 불필요

-- 6. 완료 메시지
SELECT '모든 데이터가 성공적으로 정리되었습니다!' as message;

-- 플랫폼 이름 통일 마이그레이션

-- delivery_records 테이블의 플랫폼 이름 통일
UPDATE delivery_records 
SET platform = '배민커넥트' 
WHERE platform IN ('BAEMIN_CONNECT', 'Baemin', 'baemin', '배민');

UPDATE delivery_records 
SET platform = '쿠팡이츠' 
WHERE platform IN ('COUPANG_EATS', 'Cupang', 'cupang', 'coupang', '쿠팡');

-- rankings 테이블의 플랫폼 이름 통일 (혹시 플랫폼 정보가 있다면)
-- UPDATE rankings 
-- SET platform = '배민커넥트' 
-- WHERE platform IN ('BAEMIN_CONNECT', 'Baemin', 'baemin', '배민');

-- UPDATE rankings 
-- SET platform = '쿠팡이츠' 
-- WHERE platform IN ('COUPANG_EATS', 'Cupang', 'cupang', 'coupang', '쿠팡'); 
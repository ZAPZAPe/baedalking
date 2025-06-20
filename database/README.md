# 배달킹 데이터베이스 관리 가이드

## 📁 파일 구조

```
database/
├── clean_database_schema.sql      # ✅ 정리된 최신 스키마 (권장)
├── cleanup_unused_tables.sql      # 🗑️ 사용하지 않는 테이블 정리
├── admin_tables.sql               # ❌ 구버전 (사용 중단)
├── admin_tables_fixed.sql         # ❌ 구버전 (사용 중단)
├── invite_tables.sql              # ❌ 구버전 (사용 중단)
└── README.md                      # 📖 이 파일
```

## 🎯 권장 설정 순서

### 1. 새로운 데이터베이스 설정
```sql
-- Supabase SQL Editor에서 실행
-- 1. 정리된 스키마 적용
\i database/clean_database_schema.sql
```

### 2. 기존 데이터베이스 정리 (선택사항)
```sql
-- ⚠️ 실행 전 반드시 백업!
-- 2. 사용하지 않는 테이블 정리
\i database/cleanup_unused_tables.sql

-- 3. 새 스키마 적용
\i database/clean_database_schema.sql
```

## 📊 현재 사용 중인 테이블

### 핵심 테이블
- `users` - 사용자 프로필 및 통계
- `delivery_records` - 배달 기록
- `point_history` - 포인트 내역
- `notifications` - 알림

### 기능별 테이블
- `invites` - 초대 시스템 (단순화)
- `daily_ranking_rewards` - 일일 랭킹 보상
- `system_settings` - 시스템 설정 (key-value)

### 뷰 (Views)
- `today_rankings_realtime` - 실시간 오늘 랭킹
- `user_statistics` - 사용자 통계 요약

## 🔧 주요 개선사항

### ✅ 단순화된 부분
1. **설정 시스템**: 복잡한 settings → 간단한 system_settings
2. **초대 시스템**: invite_codes + invites → 단순한 invites
3. **통계**: 별도 테이블 → 실시간 뷰로 대체
4. **알림 설정**: 별도 테이블 → JSON 필드로 통합

### ✅ 성능 최적화
1. **인덱스 최적화**: 자주 사용되는 필드에 인덱스 추가
2. **자동 트리거**: 통계 자동 업데이트
3. **RLS 정책**: 보안 강화

### ✅ 관리 편의성
1. **명확한 주석**: 각 테이블과 필드 설명
2. **타입 일관성**: 일관된 데이터 타입 사용
3. **제약조건**: 데이터 무결성 보장

## 🗑️ 제거된 테이블들

### 사용하지 않는 테이블
- `friend_requests` - 친구 시스템 미사용
- `invite_codes` - 복잡한 초대 코드 시스템
- `fraud_records` - 부정행위 감지 기능 미완성
- `statistics` - 실시간 뷰로 대체
- `settings` - key-value 방식으로 단순화

## 📈 시스템 설정 관리

### 설정값 조회
```sql
SELECT * FROM system_settings;
```

### 설정값 변경
```sql
UPDATE system_settings 
SET value = '새값', updated_at = CURRENT_TIMESTAMP 
WHERE key = '설정키';
```

### 새 설정 추가
```sql
INSERT INTO system_settings (key, value, description) 
VALUES ('새설정키', '값', '설명');
```

## 📊 유용한 쿼리

### 오늘 랭킹 조회
```sql
SELECT * FROM today_rankings_realtime LIMIT 10;
```

### 사용자 통계 조회
```sql
SELECT * FROM user_statistics WHERE nickname = '닉네임';
```

### 플랫폼별 통계
```sql
SELECT 
  platform, 
  COUNT(*) as records,
  SUM(amount) as total_amount,
  AVG(amount) as avg_amount
FROM delivery_records 
WHERE verified = true
GROUP BY platform;
```

### 일일 업로드 트렌드
```sql
SELECT 
  date,
  COUNT(*) as uploads,
  SUM(amount) as total_earnings
FROM delivery_records 
WHERE date >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY date
ORDER BY date;
```

## 🚨 주의사항

### 데이터 백업
```sql
-- 중요 테이블 백업
COPY (SELECT * FROM users) TO '/tmp/users_backup.csv' CSV HEADER;
COPY (SELECT * FROM delivery_records) TO '/tmp/delivery_records_backup.csv' CSV HEADER;
```

### 정기 유지보수
1. **월 1회**: 사용하지 않는 데이터 정리
2. **주 1회**: 인덱스 성능 점검
3. **일 1회**: 백업 확인

### 모니터링 쿼리
```sql
-- 테이블 크기 확인
SELECT 
  schemaname,
  tablename,
  attname,
  n_distinct,
  correlation
FROM pg_stats 
WHERE schemaname = 'public';

-- 느린 쿼리 확인
SELECT query, mean_time, calls 
FROM pg_stat_statements 
ORDER BY mean_time DESC 
LIMIT 10;
```

## 🔄 마이그레이션 가이드

### 기존 시스템에서 마이그레이션
1. 데이터 백업
2. `cleanup_unused_tables.sql` 실행
3. `clean_database_schema.sql` 실행
4. 데이터 검증

### 새 기능 추가 시
1. 스키마 변경사항을 `clean_database_schema.sql`에 반영
2. 관련 서비스 코드 업데이트
3. 테스트 후 배포

## 📞 문제 해결

### 자주 발생하는 문제
1. **RLS 권한 오류**: 정책 확인 및 재생성
2. **외래키 제약조건**: 참조 무결성 확인
3. **성능 이슈**: 인덱스 및 쿼리 최적화

### 지원
- 데이터베이스 관련 문의사항은 개발팀에 문의하세요.
- 긴급 이슈는 즉시 백업을 확인하고 복구 절차를 시작하세요.

---

*마지막 업데이트: 2024년 현재* 
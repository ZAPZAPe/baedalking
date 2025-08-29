# 🗄️ 데이터베이스 마이그레이션 가이드

## 📋 마이그레이션 파일 목록

1. `001_initial_schema.sql` - 초기 스키마 생성
2. `002_social_features.sql` - 소셜 기능 테이블 추가
3. `003_add_minihome_id.sql` - 미니홈피 ID 추가
4. `004_add_user_settings.sql` - 사용자 설정 추가
5. `005_fix_earnings_table.sql` - earnings 테이블 구조 개선
6. `006_add_user_settings.sql` - 사용자 설정 테이블 추가

## 🚀 실행 방법

### 방법 1: Supabase CLI 사용 (권장)

```bash
# Supabase CLI가 설치되어 있어야 합니다
npm install -g supabase

# 마이그레이션 실행
npx supabase db push
```

### 방법 2: Supabase 대시보드에서 직접 실행

1. [Supabase 대시보드](https://app.supabase.com)에 로그인
2. 프로젝트 선택
3. SQL Editor 탭으로 이동
4. 마이그레이션 파일을 순서대로 복사/붙여넣기하여 실행

### 방법 3: 개별 파일 실행

```bash
# 현재 스키마 확인
psql $DATABASE_URL -f check_earnings_schema.sql

# 특정 마이그레이션 실행
psql $DATABASE_URL -f 005_fix_earnings_table.sql
```

## ⚠️ 주의사항

### `005_fix_earnings_table.sql` 관련

이 마이그레이션은 earnings 테이블 구조를 변경합니다:
- 기존: `amount` 필드 하나로 관리
- 변경: `delivery_count`, `delivery_amount`, `mission_amount` 필드로 세분화

**오류 발생 시:**
1. 먼저 현재 스키마를 확인하세요:
   ```sql
   -- check_earnings_schema.sql 실행
   SELECT column_name, data_type 
   FROM information_schema.columns 
   WHERE table_name = 'earnings';
   ```

2. 이미 새 스키마가 적용되어 있다면 이 마이그레이션을 건너뛰세요.

### RLS (Row Level Security) 정책

현재 마이그레이션은 개발 환경용으로 설정되어 있습니다:
- 모든 사용자가 모든 데이터에 접근 가능
- 프로덕션 환경에서는 주석 처리된 정책을 사용하세요

## 🔧 문제 해결

### "column does not exist" 오류
- 해당 컬럼이 이미 변경되었거나 존재하지 않습니다
- `check_earnings_schema.sql`로 현재 스키마 확인

### "constraint already exists" 오류
- 제약 조건이 이미 존재합니다
- 무시하고 다음 단계로 진행

### RLS 정책 오류
- 개발 환경: 현재 설정 그대로 사용
- 프로덕션: 주석의 정책으로 교체

## 📝 마이그레이션 후 확인사항

1. **테이블 구조 확인**
   ```sql
   \d earnings
   \d user_settings
   ```

2. **RLS 정책 확인**
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'earnings';
   ```

3. **인덱스 확인**
   ```sql
   SELECT * FROM pg_indexes WHERE tablename = 'earnings';
   ```

## 💡 팁

- 마이그레이션 전 백업을 권장합니다
- 개발 환경에서 먼저 테스트하세요
- 문제 발생 시 롤백할 수 있도록 준비하세요

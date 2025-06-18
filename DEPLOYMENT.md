# 배달킹 배포 가이드

## Vercel 배포 설정

### 환경 변수 설정

Vercel 대시보드에서 다음 환경 변수를 설정해야 합니다:

```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Kakao
NEXT_PUBLIC_KAKAO_JS_KEY=your_kakao_javascript_key
NEXT_PUBLIC_KAKAO_AD_CLIENT_ID=ca-pub-your_id
NEXT_PUBLIC_APP_URL=https://your-domain.com

# Google Analytics
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX

# Cron Job Secret (랜덤 문자열 생성)
CRON_SECRET=your_random_secret_string_here
```

### Cron Secret 생성 방법

터미널에서 다음 명령어로 안전한 랜덤 문자열을 생성할 수 있습니다:

```bash
openssl rand -base64 32
```

### Cron Job 설정

`vercel.json`에 이미 설정되어 있습니다:
- 매일 UTC 20:59 (한국시간 오전 5:59) 실행
- `/api/cron/daily-ranking-rewards` 엔드포인트 호출

### 데이터베이스 마이그레이션

다음 SQL 파일들을 Supabase SQL Editor에서 실행하세요:
1. `migration-daily-ranking-rewards.sql` - 일일 랭킹 보상 기록 테이블

### 모니터링

Vercel 대시보드의 Functions 탭에서 Cron Job 실행 로그를 확인할 수 있습니다. 
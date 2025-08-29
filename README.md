# 🚚 Baedalking (배달킹)

> 배달 기사들을 위한 수입 기록 및 소셜 앱

## ✨ 주요 기능

### 🏠 **홈 화면**
- **캐릭터 커스터마이징**: 감정별 캐릭터 표시
- **수입 기록**: 사진 업로드 및 OCR 인식
- **플랫폼 관리**: 배민, 쿠팡 등 플랫폼별 수입 관리
- **목표 설정**: 일간/주간/월간 수입 목표 설정

### 🏆 **랭킹 시스템**
- **등급 시스템**: LEGEND, DIAMOND, PLATINUM, GOLD, SILVER, BRONZE
- **TOP 5 랭킹**: 상위 배달왕 순위 표시
- **실시간 순위**: 수입 기반 실시간 순위 업데이트

### 👥 **친구 시스템**
- **친구 추가**: 사용자 검색 및 친구 요청
- **친구 목록**: 수락된 친구 관리
- **친구 요청**: 받은 친구 요청 관리

### 🏪 **상점 시스템**
- **아이템 구매**: 포인트로 캐릭터, 차량, 배경 구매
- **보유 아이템**: 구매한 아이템 관리
- **꾸미기**: 아이템 장착 및 커스터마이징
- **미리보기**: 아이템 선택 시 실시간 미리보기

### 🏠 **미니홈피**
- **개인 공간**: 고유 ID 기반 미니홈피
- **방명록**: 친구들과 소통할 수 있는 방명록
- **꾸미기 공간**: 개인화된 공간 꾸미기
- **방문자 통계**: 총 방문자 및 일일 방문자 수

## 🛠️ 기술 스택

### **Frontend**
- **Next.js 15.5.0**: React 기반 풀스택 프레임워크
- **TypeScript**: 타입 안전성
- **Tailwind CSS**: 유틸리티 기반 CSS 프레임워크
- **Framer Motion**: 애니메이션 라이브러리

### **Backend & Database**
- **Supabase**: PostgreSQL 기반 백엔드 서비스
- **Row Level Security (RLS)**: 데이터 보안
- **Real-time**: 실시간 데이터 동기화

### **AI & Image Processing**
- **Tesseract.js**: OCR 텍스트 인식
- **HTML2Canvas**: 화면 캡처
- **Dom-to-image**: DOM 요소 이미지 변환

### **UI/UX**
- **픽셀 아트**: 게임스러운 디자인
- **네온 글로우**: 현대적인 시각 효과
- **반응형 디자인**: 모바일/데스크톱 최적화

## 🚀 배포 방법

### **1. 환경 변수 설정**

`.env.local` 파일을 생성하고 다음 변수들을 설정하세요:

```bash
# Supabase 설정
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# 카카오 광고 (선택사항)
KAKAO_AD_UNIT=your_kakao_ad_unit
```

### **2. 빌드 및 배포**

```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run dev

# 프로덕션 빌드
npm run build

# 프로덕션 서버 실행
npm start

# 타입 체크
npm run type-check

# 린트 검사
npm run lint
```

### **3. Vercel 배포 (권장)**

1. **Vercel 계정 생성**: [vercel.com](https://vercel.com)
2. **GitHub 연동**: 프로젝트 저장소 연결
3. **환경 변수 설정**: Vercel 대시보드에서 환경 변수 추가
4. **자동 배포**: Git push 시 자동 배포

## 🗄️ 백엔드 설정

### **Supabase 프로젝트 생성**

1. **프로젝트 생성**: [supabase.com](https://supabase.com)에서 새 프로젝트 생성
2. **환경 변수 설정**: `.env.local` 파일에 프로젝트 정보 입력
3. **데이터베이스 설정**: 자동 스크립트 실행

### **데이터베이스 설정 명령어**

```bash
# 전체 데이터베이스 설정 (권장)
npm run db:setup

# 개별 명령어
npm run db:start      # 로컬 Supabase 시작
npm run db:stop       # 로컬 Supabase 중지
npm run db:push       # 마이그레이션 적용
npm run db:seed       # 샘플 데이터 삽입
npm run db:reset      # 데이터베이스 초기화
```

### **연결 테스트**

환경 변수 설정 후 다음 URL로 연결 상태를 확인할 수 있습니다:

```
http://localhost:3000/api/test-connection
```

### **Supabase Studio 접속**

로컬 개발 환경에서 Supabase Studio에 접속:

```
http://localhost:54323
```

### **4. 수동 배포**

```bash
# 프로덕션 빌드
npm run build

# 정적 파일 생성 (선택사항)
npm run export

# 서버에 파일 업로드
# nginx, Apache 등 웹 서버 설정
```

## 📱 주요 페이지

### **홈 (`/`)**
- 메인 대시보드
- 수입 기록 및 통계
- 캐릭터 커스터마이징

### **상점 (`/shop`)**
- 아이템 구매
- 보유 아이템 관리
- 꾸미기 설정

### **미니홈피 (`/minihome/[userId]`)**
- 개인 공간
- 방명록 시스템
- 방문자 통계

## 🔧 개발 환경 설정

### **필수 요구사항**
- Node.js 18.0.0 이상
- npm 9.0.0 이상
- Git

### **개발 서버 실행**
```bash
# 저장소 클론
git clone https://github.com/your-username/baedalking.git

# 프로젝트 폴더 이동
cd baedalking

# 의존성 설치
npm install

# 개발 서버 실행
npm run dev
```

### **데이터베이스 설정**
1. **Supabase 프로젝트 생성**
2. **마이그레이션 실행**: `supabase/migrations/` 폴더의 SQL 파일들
3. **RLS 정책 설정**: 보안 정책 구성

## 📊 프로젝트 구조

```
baedalking/
├── src/
│   ├── app/                 # Next.js App Router
│   │   ├── page.tsx        # 홈 페이지
│   │   ├── shop/           # 상점 페이지
│   │   └── minihome/       # 미니홈피 페이지
│   ├── components/          # React 컴포넌트
│   │   ├── layout/         # 레이아웃 컴포넌트
│   │   ├── modals/         # 모달 컴포넌트
│   │   └── tabs/           # 탭 컴포넌트
│   ├── hooks/              # 커스텀 훅
│   ├── lib/                # 유틸리티 함수
│   └── types/              # TypeScript 타입 정의
├── public/                 # 정적 파일
├── supabase/               # Supabase 설정 및 마이그레이션
└── package.json            # 프로젝트 설정
```

## 🎨 디자인 시스템

### **색상 팔레트**
- **Primary**: `#00d4ff` (파란색)
- **Secondary**: `#9c88ff` (보라색)
- **Success**: `#00ff88` (초록색)
- **Warning**: `#ffd93d` (노란색)
- **Danger**: `#ff6b6b` (빨간색)
- **Dark**: `#0a0a23`, `#16213e`, `#1a1a2e`

### **타이포그래피**
- **Font Family**: Monospace (게임스러운 느낌)
- **Font Weight**: Bold, Normal
- **Text Shadow**: 네온 글로우 효과

### **컴포넌트 스타일**
- **Border Radius**: 4px, 8px, 12px, 16px
- **Shadows**: 네온 글로우 및 드롭 섀도우
- **Transitions**: 200ms, 300ms 부드러운 애니메이션

## 🔒 보안 기능

### **인증 시스템**
- Supabase Auth 기반 사용자 인증
- 이메일/비밀번호 로그인
- 세션 관리 및 자동 로그아웃

### **데이터 보안**
- Row Level Security (RLS)
- 사용자별 데이터 접근 제어
- 민감한 정보 암호화

### **API 보안**
- CORS 정책 설정
- 요청 제한 및 속도 제한
- 입력 데이터 검증

## 📈 성능 최적화

### **이미지 최적화**
- Next.js Image 컴포넌트 사용
- WebP 포맷 지원
- 지연 로딩 (Lazy Loading)

### **코드 분할**
- 동적 임포트로 번들 크기 최적화
- 컴포넌트별 코드 스플리팅
- 라우트 기반 코드 분할

### **캐싱 전략**
- 정적 자산 캐싱
- API 응답 캐싱
- 브라우저 캐시 활용

## 🐛 문제 해결

### **일반적인 문제들**

1. **빌드 오류**
   ```bash
   # 캐시 정리
   rm -rf .next
   npm run build
   ```

2. **타입 오류**
   ```bash
   # 타입 체크
   npm run type-check
   ```

3. **린트 오류**
   ```bash
   # 린트 검사 및 수정
   npm run lint
   npm run lint -- --fix
   ```

### **Supabase 연결 문제**
- 환경 변수 확인
- 네트워크 연결 상태 확인
- Supabase 프로젝트 상태 확인

## 🤝 기여하기

1. **Fork** 프로젝트
2. **Feature Branch** 생성 (`git checkout -b feature/AmazingFeature`)
3. **Commit** 변경사항 (`git commit -m 'Add some AmazingFeature'`)
4. **Push** 브랜치 (`git push origin feature/AmazingFeature`)
5. **Pull Request** 생성

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다. 자세한 내용은 [LICENSE](LICENSE) 파일을 참조하세요.

## 📞 연락처

- **프로젝트 링크**: [https://github.com/your-username/baedalking](https://github.com/your-username/baedalking)
- **이슈 리포트**: [GitHub Issues](https://github.com/your-username/baedalking/issues)

## 🙏 감사의 말

- **Next.js** 팀에게 훌륭한 프레임워크를 제공해주셔서 감사합니다
- **Supabase** 팀에게 강력한 백엔드 서비스를 제공해주셔서 감사합니다
- **Tailwind CSS** 팀에게 유용한 CSS 프레임워크를 제공해주셔서 감사합니다

---

**배달킹** - 배달 기사들을 위한 최고의 수입 관리 앱 🚚✨

# Clara DS Express Backend

Express.js 기반의 백엔드 서버입니다.

## 기술 스택

- **Express.js** - 웹 프레임워크
- **TypeScript** - 타입 안전성
- **Supabase** - 데이터베이스 및 인증

## 시작하기

### 1. 의존성 설치

```bash
cd express
npm install
```

### 2. 환경 변수 설정

`env.example.txt`를 참고하여 `.env` 파일을 생성합니다:

```bash
# Server
PORT=4949
NODE_ENV=development

# Supabase
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# CORS
CORS_ORIGIN=http://localhost:3000
```

### 3. 개발 서버 실행

```bash
npm run dev
```

서버가 `http://localhost:4949`에서 실행됩니다.

### 4. 프로덕션 빌드

```bash
npm run build
npm start
```

## API 엔드포인트

### 업체 (Vendors)
- `GET /api/vendors` - 업체 목록 조회
- `GET /api/vendors/:id` - 업체 상세 조회

### 카테고리 (Categories)
- `GET /api/categories` - 카테고리 목록 조회

### 세미나 (Seminars)
- `GET /api/seminars` - 세미나 목록 조회
- `GET /api/seminars/:id` - 세미나 상세 조회
- `POST /api/seminars` - 세미나 생성 (인증 필요)

### 학회 (Societies)
- `GET /api/societies` - 학회 목록 조회
- `GET /api/societies/:id` - 학회 상세 조회

### Q&A
- `GET /api/qna` - 질문 목록 조회
- `GET /api/qna/categories` - Q&A 카테고리 조회
- `GET /api/qna/:id` - 질문 상세 조회
- `POST /api/qna` - 질문 등록 (인증 필요)
- `GET /api/qna/:id/answers` - 답변 목록 조회
- `POST /api/qna/:id/answers` - 답변 등록 (인증 필요)
- `POST /api/qna/:id/vote` - 질문 투표 (인증 필요)

### 구인/구직 (Job Posts)
- `GET /api/job-posts` - 구인글 목록 조회
- `GET /api/job-posts/:id` - 구인글 상세 조회
- `POST /api/job-posts` - 구인글 등록 (인증 필요)
- `PUT /api/job-posts/:id` - 구인글 수정 (인증 필요)
- `DELETE /api/job-posts/:id` - 구인글 삭제 (인증 필요)

### 뷰티 제품 (Beauty Products)
- `GET /api/beauty-products` - 제품 목록 조회
- `GET /api/beauty-products/categories` - 제품 카테고리 조회
- `GET /api/beauty-products/:productId` - 제품 상세 조회

### 개원자리 (Clinic Locations)
- `GET /api/clinic-locations` - 개원자리 목록 조회
- `GET /api/clinic-locations/:id` - 개원자리 상세 조회
- `POST /api/clinic-locations` - 개원자리 등록 (인증 필요)
- `PUT /api/clinic-locations/:id` - 개원자리 수정 (인증 필요)
- `POST /api/clinic-locations/:id/toggle` - 활성화 토글 (인증 필요)
- `POST /api/clinic-locations/favorites` - 즐겨찾기 추가/제거 (인증 필요)

### 지역 (Regions)
- `GET /api/regions` - 서비스 지역 목록 조회

### 웨비나 (Webinar)
- `GET /api/webinar` - 웨비나 목록 조회
- `GET /api/webinar/:id` - 웨비나 상세 조회
- `POST /api/webinar` - 웨비나 생성 (인증 필요)
- `POST /api/webinar/:id/rebroadcast-request` - 재방송 요청 (인증 필요)
- `POST /api/webinar/:id/interested` - 관심 표시 (인증 필요)
- `POST /api/webinar/:id/view` - 조회수 증가

## 인증

인증이 필요한 엔드포인트는 `Authorization` 헤더에 Bearer 토큰을 포함해야 합니다:

```
Authorization: Bearer <supabase_access_token>
```

## 폴더 구조

```
express/
├── src/
│   ├── index.ts              # 메인 엔트리 포인트
│   ├── config/
│   │   └── supabase.ts       # Supabase 클라이언트 설정
│   ├── middleware/
│   │   ├── auth.ts           # 인증 미들웨어
│   │   └── errorHandler.ts   # 에러 핸들러
│   └── routes/
│       ├── index.ts          # 라우트 인덱스
│       ├── vendors.ts        # 업체 API
│       ├── categories.ts     # 카테고리 API
│       ├── seminars.ts       # 세미나 API
│       ├── societies.ts      # 학회 API
│       ├── qna.ts            # Q&A API
│       ├── jobPosts.ts       # 구인/구직 API
│       ├── beautyProducts.ts # 뷰티 제품 API
│       ├── clinicLocations.ts # 개원자리 API
│       ├── regions.ts        # 지역 API
│       └── webinar.ts        # 웨비나 API
├── package.json
├── tsconfig.json
├── env.example.txt
└── README.md
```

## 주의사항

- Next.js 프론트엔드와 동시에 사용할 때는 포트 충돌에 주의하세요.
- 프론트엔드에서 API 호출 시 `CORS_ORIGIN` 환경 변수가 올바르게 설정되어 있는지 확인하세요.
- Supabase 환경 변수는 프론트엔드와 동일한 프로젝트를 사용해야 합니다.


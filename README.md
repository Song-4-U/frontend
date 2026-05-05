# Song-4-U Frontend

> "음색 기반 노래 추천 서비스"의 웹 프론트엔드입니다.
> 사용자가 자신의 목소리를 녹음 → S3 업로드 → 음색 임베딩 추론 → 유사 곡 추천 결과를 보여주는 흐름을 담당합니다.

전체 서비스 설계/운영 문서는 [`docs/`](./docs) 폴더를 참고하세요.

---

## 기술 스택

| 영역 | 사용 기술 |
|------|-----------|
| 프레임워크 | [Next.js 16](https://nextjs.org) (App Router) + React 19 |
| 언어 | TypeScript 5 |
| 스타일링 | Tailwind CSS v4 (`@theme` 토큰 기반) |
| UI 컴포넌트 | [shadcn/ui](https://ui.shadcn.com) (base-nova / neutral) + [Base UI](https://base-ui.com) + `lucide-react` |
| 상태관리 | [Zustand](https://zustand-demo.pmnd.rs) (추천 흐름 상태머신) |
| HTTP/업로드 | 자체 `lib/api.ts` (fetch 기반, S3 presigned PUT 직접 업로드) |
| Mock 데이터 | `NEXT_PUBLIC_USE_MOCK_API` 토글 + `lib/mock-data.ts` fixture |
| 린트 | ESLint 9 (`eslint-config-next`) |
| 배포 (예정) | Vercel |

> Next.js 16은 일부 API/관례가 이전 버전과 다릅니다. 자세한 내용은 `frontend/AGENTS.md` 와 `node_modules/next/dist/docs/` 를 참고하세요.

---

## 폴더 구조 요약

```
frontend/
├── app/                  Next.js App Router 진입점 (layout, page, globals.css)
├── components/           React 컴포넌트
│   └── ui/               shadcn/ui 디자인 시스템
├── hooks/                React 커스텀 훅 (use-*)
├── lib/
│   ├── api.ts            core-api 클라이언트 + S3 업로드
│   ├── mock-data.ts      Mock fixture 데이터
│   ├── utils.ts          cn() 등 클래스 유틸
│   └── store/            Zustand store
├── types/                공유 타입 정의 (요청/응답 인터페이스)
├── public/               정적 파일
└── docs/                 서비스 전체 설계 문서
```

레이어 책임 분리, path alias(`@/*`), 파일명 컨벤션 등 자세한 가이드는 [`docs/FRONTEND_STRUCTURE.md`](./docs/FRONTEND_STRUCTURE.md) 를 보세요.

---

## 시작하기

### 1. 의존성 설치

```bash
npm install
```

### 2. 환경변수 설정

`.env.example` 을 복사해 `.env.local` 을 만들고 필요한 값을 입력합니다.

```bash
cp .env.example .env.local
```

| 변수 | 설명 |
|------|------|
| `NEXT_PUBLIC_CORE_API_BASE_URL` | core-api 서버 주소 (로컬: `http://localhost:8080`) |
| `NEXT_PUBLIC_USE_MOCK_API` | `true` 면 백엔드 없이 fixture mock 응답 사용 |

전체 환경변수 운영 원칙은 [`docs/ENVIRONMENT.md`](./docs/ENVIRONMENT.md) 참고.

### 3. 개발 서버 실행

```bash
npm run dev
```

[http://localhost:3000](http://localhost:3000) 에서 확인할 수 있습니다.

### 4. 빌드 / 프로덕션 실행

```bash
npm run build
npm start
```

---

## 백엔드 연동 포인트

프론트엔드는 다음 두 종류의 백엔드와 통신합니다 (자세한 계약은 [`docs/API_CONTRACTS.md`](./docs/API_CONTRACTS.md) 참고).

- **core-api**
  - `POST /uploads/presigned-url` — S3 업로드용 presigned URL 발급
  - `POST /recommendations/by-timbre` — 업로드된 오디오 기준으로 유사 곡 추천 조회
- **inference-api** (프론트가 직접 호출하지 않음, core-api 내부에서 호출)
  - `POST /embed` — 512차원 음색 임베딩 생성

전체 파이프라인 흐름은 [`docs/PIPELINE.md`](./docs/PIPELINE.md), DB 측 데이터 모델은 [`docs/DB_SCHEMA.md`](./docs/DB_SCHEMA.md) 에서 확인할 수 있습니다.

### 백엔드와 합의 필요한 항목

`timbre_label` enum, 허용 오디오 포맷, presigned URL 만료 시간, 에러 코드, `top_k` 기본값 등은 [`docs/FRONTEND_TODO.md`](./docs/FRONTEND_TODO.md) 의 "백엔드와 합의 필요한 항목" 섹션에서 추적합니다.

---

## 문서 인덱스

- [`docs/README.md`](./docs/README.md) — 문서 운영 원칙
- [`docs/FRONTEND_STRUCTURE.md`](./docs/FRONTEND_STRUCTURE.md) — 프론트 폴더 구조 / 레이어 책임 / 컨벤션
- [`docs/FRONTEND_TODO.md`](./docs/FRONTEND_TODO.md) — Phase별 To-Do 및 진행 현황
- [`docs/API_CONTRACTS.md`](./docs/API_CONTRACTS.md) — core-api / inference-api 요청·응답 스펙
- [`docs/PIPELINE.md`](./docs/PIPELINE.md) — 업로드부터 추천까지 E2E 파이프라인
- [`docs/DB_SCHEMA.md`](./docs/DB_SCHEMA.md) — PostgreSQL + pgvector 스키마
- [`docs/ENVIRONMENT.md`](./docs/ENVIRONMENT.md) — 환경변수 정의 / 환경별 운영 원칙

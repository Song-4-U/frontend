# Frontend 개발 To-Do List

> 구현 완료 시 해당 항목을 `- [x]`로 변경하고, 하단 Update Log에 날짜와 요약을 추가합니다.
> 노션 페이지([Frontend 개발 To-Do List](https://www.notion.so/35022cec82bf81789570e33f683d1c63))와 동기화 관리됩니다.

---

## Phase 1 – 프로젝트 초기 세팅

- [x] Next.js 프로젝트 초기화 (App Router, TypeScript)
- [x] `frontend/.env.example` 작성 (`NEXT_PUBLIC_CORE_API_BASE_URL`)
- [x] Tailwind CSS 설치 및 기본 테마 설정
- [x] UI 라이브러리 선택 및 설치 (shadcn/ui 또는 Radix UI 권장)
- [x] 상태관리 라이브러리 설치 (Zustand 권장)
- [x] API 클라이언트 레이어 작성 (`lib/api.ts`) - base URL, 공통 헤더, 에러 파싱
- [x] Mock API 핸들러 설정 (MSW 또는 fixture JSON) - 백엔드 완성 전 병렬 개발용
- [x] 폴더 구조 확정 (`app/`, `components/`, `lib/`, `hooks/`, `types/`)
- [x] 기본 레이아웃 컴포넌트 (`Layout`, `Header`) 작성
- [x] 공통 타입 정의 (`types/api.ts`) - API 요청/응답 인터페이스

---

## Phase 2 – 핵심 기능 구현

### 녹음 및 업로드
- [ ] `RecorderPanel` 컴포넌트 - MediaRecorder API 기반 녹음/정지/재녹음
- [ ] 오디오 포맷 확정 (`audio/webm`) 및 `content_type` 필드 연동
- [ ] `useRecorder` 커스텀 훅 - 녹음 상태 관리 (idle / recording / recorded)
- [ ] Presigned URL 발급 요청 연결 (`POST /uploads/presigned-url`)
- [ ] S3 직접 업로드 구현 (PUT to presigned URL)
- [ ] `UploadProgress` 컴포넌트 - 업로드 진행률 표시
- [ ] `useUpload` 커스텀 훅 - presigned URL 발급 + S3 업로드 통합

### 음색 선택 및 추천 요청
- [ ] `timbre_label` 선택 UI - 백엔드 enum 합의 후 구현 (warm / bright / airy 등)
- [ ] 추천 요청 연결 (`POST /recommendations/by-timbre`) - `s3_key`, `timbre_label`, `top_k` 페이로드
- [ ] `useRecommendations` 커스텀 훅 - 요청/응답 상태 관리

### 결과 렌더링
- [ ] `RecommendationList` 컴포넌트 - 추천 곡 목록 (제목 / 아티스트 / 유사도)
- [ ] `SongCard` 컴포넌트 - 개별 곡 카드 (유사도 퍼센트 표시)
- [ ] 유사도 소수점 표시 규칙 확정 (예: 소수 둘째 자리 %)

---

## Phase 3 – UX / 에러 처리

- [ ] 전체 UX 상태 구분: idle → recording → uploading → analyzing → result → error
- [ ] 로딩/분석 중 상태 UI (스피너 또는 진행 단계 표시)
- [ ] `ErrorBanner` 컴포넌트 - 에러 메시지 + 재시도 버튼
- [ ] 에러 코드별 사용자 메시지 매핑 (`EMBEDDING_TIMEOUT` 등 `docs/API_CONTRACTS.md` 기준)
- [ ] 네트워크 실패 / 타임아웃 처리 (retry 1회 자동 시도)
- [ ] Presigned URL 만료 시 재발급 흐름 (만료 감지 → 재요청)
- [ ] 업로드 실패 시 재시도 UI
- [ ] 토스트 알림 (`sonner` 또는 `react-hot-toast`) 설정

---

## Phase 4 – 통합 및 배포

- [ ] Mock → real `core-api` 교체 (adapter 레이어만 교체)
- [ ] 백엔드 팀과 `timbre_label` enum, 에러 코드, 응답 shape 최종 합의
- [ ] E2E 스모크 테스트: 녹음 → 업로드 → 추천 반환 1회 검증
- [ ] Vercel 프로젝트 생성 및 연결
- [ ] Vercel 환경변수 등록 (`NEXT_PUBLIC_CORE_API_BASE_URL` 등)
- [ ] 프로덕션 배포 및 스모크 확인

---

## 백엔드와 합의 필요한 항목

| 항목 | 내용 | 상태 |
|------|------|------|
| `timbre_label` enum 값 | warm / bright / airy 등 목록 확정 | 미합의 |
| 오디오 포맷 | `audio/webm` 외 허용 포맷 | 미합의 |
| presigned URL 만료 시간 | 현재 `expires_in: 900`(15분) | 확인 필요 |
| 에러 코드 목록 | `API_CONTRACTS.md` 기준 전체 코드 확정 | 미합의 |
| `top_k` 기본값 | 기본 10개 | 확인 필요 |

---

## 참고 문서

- [API_CONTRACTS.md](./API_CONTRACTS.md) - 요청/응답 스펙
- [PIPELINE.md](./PIPELINE.md) - E2E 파이프라인 흐름
- [ENVIRONMENT.md](./ENVIRONMENT.md) - 환경변수 목록
- [FRONTEND_STRUCTURE.md](./FRONTEND_STRUCTURE.md) - 프론트 폴더 구조 가이드

---

## Update Log

- 2026-04-28: 초기 To-Do 리스트 작성 (Phase 1~4)
- 2026-04-28: Next.js 16 프로젝트 초기화 완료 (App Router + TypeScript + ESLint, Tailwind 미포함)
- 2026-04-28: `frontend/.env.example` 작성 + `.gitignore`에 `.env.example` 예외 추가
- 2026-04-28: Tailwind CSS v4 설치 및 `@theme` 기반 brand 컬러/폰트 토큰 정의
- 2026-04-28: shadcn/ui 초기화 (base-nova 스타일, neutral 컬러, Button 컴포넌트 추가)
- 2026-04-28: Zustand 설치 + `lib/store/recommendation.ts` (추천 흐름 상태머신 store) skeleton 작성
- 2026-04-28: `lib/api.ts` 작성 - core-api 엔드포인트 함수, S3 직접 업로드, ApiError/TimeoutError 정의
- 2026-04-28: `lib/mock-data.ts` + `lib/api.ts`에 `NEXT_PUBLIC_USE_MOCK_API` 토글 분기 추가 (fixture 기반 mock)
- 2026-04-28: 폴더 구조 확정 - `hooks/`, `types/` 생성 + 각 폴더 README + `docs/FRONTEND_STRUCTURE.md` 작성
- 2026-04-28: 기본 레이아웃 작성 - `app/layout.tsx` 한국어 metadata, `Header` 컴포넌트(MOCK 배지 포함), Tailwind/shadcn 검증용 hero `app/page.tsx`, 사용하지 않는 `page.module.css` 삭제
- 2026-04-28: 공통 타입 정의 - `types/api.ts` 신설 (요청/응답 단일 진실의 원천), `lib/api.ts`/`lib/mock-data.ts`/`lib/store/recommendation.ts` import 경로 정리, `tsc --noEmit` 통과

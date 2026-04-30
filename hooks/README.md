# hooks/

React 커스텀 훅을 모아두는 곳입니다.

## 분류 가이드

- `use-recorder.ts` — MediaRecorder API 래퍼 (Phase 2)
- `use-upload.ts` — presigned URL 발급 + S3 업로드 통합 (Phase 2)
- `use-recommendations.ts` — `/recommendations/by-timbre` 호출 + store 갱신 (Phase 2)

## 작성 규칙

- 파일명은 `use-*.ts` (kebab-case)
- 훅 내부에서 직접 fetch 호출 금지 → 항상 `lib/api.ts`의 함수를 통해 호출
- 상태 갱신은 `lib/store/*` 의 zustand store만 사용 (로컬 useState 최소화)
- AbortController는 훅이 직접 만들고 unmount 시 취소

# types/

전역에서 공유되는 타입을 모아두는 곳입니다.

## 분류 가이드

- `api.ts` — `docs/API_CONTRACTS.md` 기반 요청/응답 인터페이스. **단일 진실의 원천 (Single Source of Truth)**.
- `domain.ts` — 도메인 모델 (필요 시 추가)

## Import 규칙

```ts
import type { RecommendationItem, PresignedUrlResponse } from "@/types/api";
```

- `lib/api.ts` 도 호환성을 위해 동일 타입을 re-export 하지만, 신규 코드에서는 `@/types/api` 를 직접 import 하는 것을 권장합니다.

## 작성 규칙

- API 관련 타입은 백엔드 응답 필드명 그대로 (snake_case 유지). 변환은 hook 레이어에서.
- UI 전용 타입(컴포넌트 props 등)은 해당 컴포넌트 파일 내부에 둠 → 여기는 **공유**되는 타입만.
- 타입 외에는 아무것도 export 하지 않음 (런타임 코드 금지).

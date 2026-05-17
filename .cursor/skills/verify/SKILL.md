---
name: verify
description: Run lint, type-check, and tests to verify code quality. Use when the user types /verify, asks to verify code, check for errors, run tests, or confirm code is passing lint/type checks.
disable-model-invocation: true
---

# /verify — Code Verification

코드 작성 후 품질 검증을 위한 전체 체크를 순서대로 실행합니다.

## Checklist

아래 항목을 순서대로 실행하고, 각 결과를 보고합니다.

```
- [ ] 1. TypeScript 타입 검사
- [ ] 2. ESLint 검사
- [ ] 3. 테스트 실행 (설정된 경우)
```

## Step 1 — TypeScript 타입 검사

```bash
npx tsc --noEmit
```

- 오류 없으면 ✅ 통과
- 오류 있으면 오류 목록 출력 후 수정

## Step 2 — ESLint

```bash
npm run lint
```

- 오류/경고 없으면 ✅ 통과
- 오류 있으면 자동 수정 시도:

```bash
npm run lint -- --fix
```

## Step 3 — 테스트

테스트 러너가 설정된 경우 실행합니다.

**Vitest (권장)**:
```bash
npx vitest run
```

**Jest**:
```bash
npx jest --passWithNoTests
```

테스트 러너가 `package.json`의 `scripts`에 없으면 이 단계는 건너뜁니다.

## 결과 보고 형식

모든 단계 완료 후 아래 형식으로 요약합니다:

```
## Verify 결과

| 검사 항목        | 결과 |
|-----------------|------|
| TypeScript      | ✅ 통과 / ❌ N개 오류 |
| ESLint          | ✅ 통과 / ❌ N개 오류 |
| 테스트          | ✅ N개 통과 / ❌ N개 실패 / ⏭️ 미설정 |
```

오류가 있으면 수정 후 해당 검사를 재실행합니다.

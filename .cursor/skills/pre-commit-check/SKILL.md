---
name: pre-commit-check
description: Cross-review uncommitted code changes using two AI models (Claude Opus 4.7 and GPT 5.5) in parallel, then synthesize their feedback before committing. Use when the user types /pre-commit-check or asks for an AI cross-review prior to commit.
disable-model-invocation: true
---

# /pre-commit-check

`/verify` 통과 후 `/commit-and-push` 전에 실행하는 **AI 교차 리뷰** 단계입니다.
Claude Opus 4.7과 GPT 5.5가 동일한 diff를 **병렬로** 리뷰하고, 그 결과를 종합해 보고합니다.

## Workflow

```
- [ ] 1. 변경 사항 수집 (diff 스냅샷)
- [ ] 2. 리뷰 컨텍스트 파일 생성
- [ ] 3. 두 모델로 병렬 리뷰 실행
- [ ] 4. 결과 종합 및 카테고리 분류
- [ ] 5. 사용자에게 보고 + 다음 행동 결정
- [ ] 6. 임시 파일 정리
```

## Step 1 — 변경 사항 수집

```bash
git status
git diff HEAD --stat
```

- 변경 없음 → 중단
- 변경 있음 → Step 2 진행

## Step 2 — 리뷰 컨텍스트 파일 생성

diff와 변경 파일 목록을 임시 파일로 저장해 두 모델이 동일한 입력을 보도록 합니다.

```powershell
git diff HEAD > .pre-commit-check-diff.patch
git status --short > .pre-commit-check-files.txt
```

## Step 3 — 두 모델로 병렬 리뷰 실행

**반드시 Task 도구를 단일 메시지에서 2번 병렬 호출**합니다. 두 subagent는 독립적으로 동일한 diff를 리뷰합니다.

### 공통 리뷰 프롬프트 템플릿

각 subagent에게 아래 형식의 프롬프트를 전달합니다:

```
You are performing a strict pre-commit code review.

Read the following files to understand the change:
- .pre-commit-check-diff.patch  (full diff vs HEAD)
- .pre-commit-check-files.txt   (changed file list)

For full context, you may also read the original files in the repo.

Project context:
- Next.js 16 + React 19 + TypeScript (strict)
- Tailwind v4
- Test runner: Vitest
- See AGENTS.md for project conventions

Review the change and report findings in this exact format:

## Summary
<2-3 sentence overview of the change>

## Findings

### 🔴 Critical (must fix before commit)
- `path/file.ts:LINE` — <issue> → <suggested fix>

### 🟡 Suggestion (should improve)
- `path/file.ts:LINE` — <issue> → <suggested fix>

### 🟢 Nit (optional)
- ...

### ✅ Praise
- ...

## Verdict
APPROVE | REQUEST_CHANGES

Focus areas:
1. Correctness, edge cases, null/undefined handling
2. React/Next.js best practices (hook rules, Server vs Client Components, deps array)
3. TypeScript safety (no unjustified `any`, type narrowing)
4. Security (XSS, secrets, auth)
5. Test coverage for new logic
6. Consistency with project conventions (AGENTS.md, neighboring files)
```

### 병렬 호출

| Reviewer | subagent_type | model |
|----------|---------------|-------|
| Reviewer A | `generalPurpose` | `claude-opus-4-7-thinking-xhigh` |
| Reviewer B | `generalPurpose` | `gpt-5.5-medium` |

두 호출을 **같은 응답의 single message에서 두 개의 tool_use 블록**으로 동시 발사합니다.
각 subagent의 description은 다음과 같이 명확하게 구분합니다:
- "Opus 4.7 pre-commit review"
- "GPT 5.5 pre-commit review"

각 subagent에게 위 프롬프트 + "최종 응답으로 위 형식의 보고서를 정확히 반환하라"를 명시합니다.

## Step 4 — 결과 종합

두 리뷰 결과를 받아 아래 규칙으로 종합합니다.

### 합의/이견 분류

- **합의 (Both)**: 두 모델이 같은 위치/같은 종류의 이슈를 지적 → 신뢰도 높음
- **단독 (Opus only / GPT only)**: 한쪽만 지적 → 참고 의견
- **상충 (Conflict)**: 한쪽은 좋다고 하고 다른 쪽은 문제 제기 → 사용자 판단 필요

### 머지 차단 규칙

- Critical 이슈가 **하나라도 합의되면** → REQUEST_CHANGES (commit 진행 금지)
- Critical이 한쪽에만 있으면 → 사용자에게 판단 요청
- Critical 없음 → APPROVE 가능

## Step 5 — 사용자 보고

아래 형식으로 출력합니다.

```
## /pre-commit-check 결과

리뷰어: Claude Opus 4.7 / GPT 5.5
변경 파일: <N>개
종합 판정: ✅ APPROVE / ⚠️ REVIEW / ❌ REQUEST_CHANGES

### 🔴 Critical
- [Both] `path/file.ts:42` — <이슈>
- [Opus] `path/file.ts:88` — <이슈>
- [GPT]  `path/other.tsx:10` — <이슈>

### 🟡 Suggestion
- [Both] ...
- [Opus] ...
- [GPT] ...

### 🟢 Nit
- ...

### ⚖️ 이견
- `path/file.ts:55`
  - Opus: <의견>
  - GPT:  <의견>

### ✅ Praise
- [Both] ...

### 다음 액션
1. Critical 이슈 수정 후 /pre-commit-check 재실행
2. 또는 /commit-and-push 진행
3. 또는 일부 피드백을 의도적으로 무시하고 진행 (사용자 명시 승인 필요)
```

리뷰 결과 출력 후 **반드시 사용자에게 다음 행동을 묻습니다.**

## Step 6 — 임시 파일 정리

```powershell
Remove-Item .pre-commit-check-diff.patch -ErrorAction SilentlyContinue
Remove-Item .pre-commit-check-files.txt -ErrorAction SilentlyContinue
```

## 주의 사항

- 두 subagent는 **반드시 병렬 호출**합니다. 직렬 실행은 시간 낭비입니다.
- 자체적으로 코드를 수정하지 않습니다. 사용자 결정 후 별도 단계에서 수정합니다.
- 모델 이름은 정확히 `claude-opus-4-7-thinking-xhigh`, `gpt-5.5-medium` 을 사용합니다.
- 임시 파일은 항상 정리합니다 (커밋되지 않도록 `.gitignore` 추가는 사용자 요청 시).

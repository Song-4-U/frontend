---
name: commit-and-push
description: Stage all changes, generate a conventional commit message from the diff, commit, and push to the remote. Use when the user types /commit-and-push or asks to commit and push changes.
disable-model-invocation: true
---

# /commit-and-push

변경 사항을 스테이징하고, diff를 분석해 커밋 메시지를 생성한 뒤 push합니다.

## Workflow

```
- [ ] 1. 현재 상태 확인
- [ ] 2. /verify 실행 (lint + 타입 + 테스트)
- [ ] 3. /pre-commit-check 실행 (AI 교차 리뷰)
- [ ] 4. 커밋 메시지 생성
- [ ] 5. git add → commit → push
- [ ] 6. 결과 보고
```

## Step 1 — 현재 상태 확인

```bash
git status
git diff HEAD
```

변경 파일이 없으면 여기서 중단하고 사용자에게 알립니다.

## Step 2 — /verify 실행

커밋 전 반드시 검증을 먼저 실행합니다.

`/verify` 스킬을 읽고 실행하세요: `.cursor/skills/verify/SKILL.md`

검증 실패(오류) 시: 오류를 수정한 뒤 Step 2를 재실행합니다.  
검증 통과 시: Step 3으로 진행합니다.

## Step 3 — /pre-commit-check 실행

AI 교차 리뷰(Opus 4.7 + GPT 5.5)를 실행합니다.

`/pre-commit-check` 스킬을 읽고 실행하세요: `.cursor/skills/pre-commit-check/SKILL.md`

- REQUEST_CHANGES (Critical 이슈 합의) → 오류 수정 후 Step 2부터 재실행
- APPROVE → Step 4 진행
- 이견/단독 의견만 있음 → 사용자에게 진행 여부 확인 후 결정

## Step 4 — 커밋 메시지 생성

`git diff HEAD` 와 `git status` 결과를 분석해 **Conventional Commits 1.0.0** 한국어 스펙을 기준으로 메시지를 작성합니다.

> 스펙 원문: https://www.conventionalcommits.org/ko/v1.0.0/

### 전체 구조

```
<타입>[적용 범위(선택)]: <설명>

[본문(선택)]

[꼬리말(선택)]
```

### 타입 선택 기준

| 타입 | 사용 시점 | SemVer |
|------|-----------|--------|
| `feat` | 새 기능 추가 | MINOR |
| `fix` | 버그 수정 | PATCH |
| `refactor` | 기능 변경 없는 코드 개선 | — |
| `perf` | 성능 개선 | PATCH |
| `test` | 테스트 코드 추가/수정 | — |
| `docs` | 문서 변경 | — |
| `style` | 포맷·세미콜론 등 스타일만 변경 | — |
| `build` | 빌드 시스템·의존성 변경 | — |
| `ci` | CI 설정·스크립트 변경 | — |
| `chore` | 기타 잡무 (위 어디에도 속하지 않을 때) | — |
| `revert` | 이전 커밋 되돌리기 | — |

### 스펙 핵심 규칙 (반드시 준수)

1. **타입은 명사**, 접두어 뒤에 선택적 `(scope)`, 선택적 `!`, 필수인 `: ` (콜론 + 공백) 으로 시작
2. **설명(subject)** 은 코드 변경의 짧은 요약 — 영어 소문자로 시작, 명령형 현재시제, 마침표 없음, 50자 이하 권장
3. **scope** 는 영향받는 영역을 가리키는 **소문자 명사** (예: `recorder`, `api`, `ui`). 모듈/패키지/디렉터리 이름과 정렬
4. **본문** 은 설명 다음 **빈 줄 1개** 후 작성, "왜" 와 "무엇" 위주로 자유 형식
5. **꼬리말** 은 본문 다음 빈 줄 후 작성, `Token: value` 또는 `Token #value` 형태 (`Refs: #123`, `Reviewed-by: ...`)
6. **단절적 변경(Breaking Change)** 은 둘 중 하나로 표시:
   - 타입/scope 뒤 `!` (예: `feat(api)!: drop legacy auth`)
   - 또는 꼬리말 `BREAKING CHANGE: <설명>` (대문자 고정)
7. **하나의 커밋은 하나의 변경 의도** — 여러 독립 변경이 섞이면 가능한 한 커밋을 쪼개고, 어려우면 가장 중요한 타입 사용

### 메시지 작성 절차

1. `git diff --stat` 으로 영향 받은 영역을 보고 **가장 적합한 단일 타입**을 결정
2. 가장 큰 변경 영역을 기준으로 scope 결정 (없으면 생략)
3. 설명은 "무엇을 했는가" 가 아니라 **"무엇이 바뀌었는가"** 로 작성
4. 본문에는 **왜** 변경했는지, 트레이드오프, 후속 영향 위주로 기술
5. 관련 이슈/PR/리뷰가 있으면 꼬리말로 첨부

### 예시

**가장 짧은 형태**
```
docs: correct spelling of CHANGELOG
```

**scope 와 본문**
```
feat(recorder): add audio recording with MediaRecorder API

Implements useRecorder hook and RecorderPanel component.
Handles permission flow, MIME-type negotiation, and resource cleanup.
```

**Breaking change — `!` 사용**
```
feat(api)!: send an email to the customer when a product is shipped
```

**Breaking change — 꼬리말 사용**
```
feat: allow provided config object to extend other configs

BREAKING CHANGE: `extends` key in config file is now used for extending other config files
```

**본문 + 꼬리말 조합**
```
fix(upload): prevent racing of presign requests

Introduce a request id and a reference to latest request. Dismiss
incoming responses other than from latest request.

Refs: #123
Reviewed-by: @teammate
```

**Revert**
```
revert: let us never again speak of the noodle incident

Refs: 676104e, a215868
```

### 자주 하는 실수

- ❌ 마침표로 끝내기 (`feat: add login.`)
- ❌ 대문자 시작 (`feat: Add login`)
- ❌ "Added/Adds" 같은 과거형·3인칭 (`feat: added login`)
- ❌ scope에 동사 사용 (`feat(adds-login):`)
- ❌ 한 커밋에 `feat: ... and fix ... and refactor ...` 처럼 여러 의도 섞기
- ❌ Breaking change 인데 `!` 도 `BREAKING CHANGE:` 꼬리말도 없음

## Step 5 — Commit & Push

```bash
git add -A
git commit -m "<생성된 커밋 메시지>"
git push
```

remote 브랜치가 없으면:
```bash
git push -u origin HEAD
```

## Step 6 — 결과 보고

```
## Commit & Push 결과

브랜치: <branch-name>
커밋:   <commit hash> — <commit message>
Push:   ✅ 성공 / ❌ 실패 (오류 내용)
```

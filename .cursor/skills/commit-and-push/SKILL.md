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

### 언어 정책

- **타입·scope·BREAKING CHANGE 토큰**: 영어 소문자 고정 (`feat`, `fix(api)`, `BREAKING CHANGE:`)
- **설명(subject)·본문·꼬리말 값**: **한국어** 로 작성
- 코드 식별자(파일명/심볼/API 명) 는 그대로 영문으로 유지하되, **백틱**으로 감싸기 (`` `useRecorder` ``)

### 스펙 핵심 규칙 (반드시 준수)

1. **타입은 명사**, 접두어 뒤에 선택적 `(scope)`, 선택적 `!`, 필수인 `: ` (콜론 + 공백) 으로 시작
2. **설명(subject)** 은 코드 변경의 짧은 요약 — **한국어**, 50자(공백 포함) 이하 권장, 마침표 없음, 명사·동사 어간형으로 끝맺기 (`추가`, `수정`, `정리`, `반영` 등)
3. **scope** 는 영향받는 영역을 가리키는 **영문 소문자 명사** (예: `recorder`, `api`, `ui`). 모듈/패키지/디렉터리 이름과 정렬
4. **본문** 은 설명 다음 **빈 줄 1개** 후 작성, "왜" 와 "무엇" 위주로 자유 형식 (한국어)
5. **꼬리말** 은 본문 다음 빈 줄 후 작성, 토큰은 영문 (`Refs: #123`, `Reviewed-by: ...`, `Co-authored-by: ...`)
6. **단절적 변경(Breaking Change)** 은 둘 중 하나로 표시:
   - 타입/scope 뒤 `!` (예: `feat(api)!: 레거시 인증 제거`)
   - 또는 꼬리말 `BREAKING CHANGE: <한국어 설명>` (토큰은 반드시 대문자)
7. **하나의 커밋은 하나의 변경 의도** — 여러 독립 변경이 섞이면 가능한 한 커밋을 쪼개고, 어려우면 가장 중요한 타입 사용

### 메시지 작성 절차

1. `git diff --stat` 으로 영향 받은 영역을 보고 **가장 적합한 단일 타입**을 결정
2. 가장 큰 변경 영역을 기준으로 scope 결정 (없으면 생략)
3. 설명은 "무엇을 했는가" 가 아니라 **"무엇이 바뀌었는가"** 로 작성 (한국어 명사형 권장)
4. 본문에는 **왜** 변경했는지, 트레이드오프, 후속 영향 위주로 기술
5. 관련 이슈/PR/리뷰가 있으면 꼬리말로 첨부

### 예시

**가장 짧은 형태**
```
docs: CHANGELOG 오타 수정
```

**scope 와 본문**
```
feat(recorder): MediaRecorder 기반 음성 녹음 기능 추가

`useRecorder` 훅과 `RecorderPanel` 컴포넌트를 도입한다.
권한 흐름, MIME 타입 협상, 자원 해제까지 일괄 처리한다.
```

**Breaking change — `!` 사용**
```
feat(api)!: 상품 배송 시 고객에게 이메일 발송
```

**Breaking change — 꼬리말 사용**
```
feat: 설정 객체가 다른 설정을 확장하도록 허용

BREAKING CHANGE: 설정 파일의 `extends` 키 의미가 변경됨. 이제 다른 설정 파일을 확장하는 용도로 사용된다
```

**본문 + 꼬리말 조합**
```
fix(upload): presign 요청 경쟁 상태 방지

요청 id 와 최신 요청 참조를 도입해 가장 최신 요청 외의 응답은 폐기한다.
세션 토큰 가드로 언마운트 이후의 응답이 stale state 를 덮어쓰지 못하도록 막는다.

Refs: #123
Reviewed-by: @teammate
```

**Revert**
```
revert: 누들 사건은 다시는 입에 올리지 않기로 한다

Refs: 676104e, a215868
```

### 자주 하는 실수

- ❌ 한국어 설명 뒤에 마침표 (`feat: 로그인 추가.`)
- ❌ scope 에 동사형/한글 사용 (`feat(로그인추가):`, `feat(adds-login):`)
- ❌ 본문·설명을 영어와 한국어 짬뽕으로 작성 — 한 커밋 안에서 일관되게 한국어 유지
- ❌ "~했음", "~합니다" 처럼 어조가 들쭉날쭉 — **명사형 또는 평서체 한 가지로 통일**
- ❌ 한 커밋에 `feat: ... 그리고 fix ... 그리고 refactor ...` 처럼 여러 의도 섞기
- ❌ Breaking change 인데 `!` 도 `BREAKING CHANGE:` 꼬리말도 없음
- ❌ `BREAKING CHANGE` 토큰을 소문자/한글로 작성 (반드시 영문 대문자 고정)

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
